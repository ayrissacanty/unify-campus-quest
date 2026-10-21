// Smoke test: serve the site, open every page in a real (headless) browser, fail on any script error.
// Run:  npm run build && python3 tools/build_netlify.py dist && npm run test:smoke
// Env:  SMOKE_CHROMIUM=/path/to/chromium  (optional; otherwise Playwright's own browser is used)
import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const PORT = process.env.SMOKE_PORT || "8799";
const BASE = `http://127.0.0.1:${PORT}`;
// page -> [must a <canvas> appear, redirect target into the app shell or null]
// One app, one address: the bare room pages hand visitors into index.html, deep-linked to the room,
// so for those the canvas is expected inside the shell's room iframe, not the top frame.
const PAGES = [
  ["index.html", false, null], ["hallway3d.html", true, "/index.html"], ["classroom3d.html", true, "/index.html"], ["auditorium3d.html", true, "/index.html?view=stage"],
  ["news.html", false, "/index.html?view=news"], ["phone.html", false, null], ["opendoor.html", false, "/index.html?view=open"], ["fieldtrip.html", true, "/index.html?view=trip"],
  ["curriculum.html", false, null], ["parent.html", false, null], ["mail.html", false, null], ["newsdesk.html", false, null], ["dorm.html", true, null],
  // earlier versions and prototypes: kept and shipped too
  ["pages.html", false, null], ["auditorium.html", true, null], ["hallway.html", true, null], ["new.html", false, null], ["prototypes/newsroom-enhanced.html", false, null],
];
// noise that is not our bug: blocked third-party hosts in sandboxed CI, favicon, ad/analytics-style failures
const IGNORE = [/favicon/i, /net::ERR_(BLOCKED|NAME_NOT_RESOLVED|INTERNET_DISCONNECTED|CONNECTION|TUNNEL|CERT)/i,
  /fonts\.(googleapis|gstatic)\.com/i, /Failed to load resource.*(502|503)/i, /Failed to load resource: net::ERR_FAILED/i, /trends\.json/i,
  /Failed to load resource: the server responded with a status of 404/i];   // 404s of our own files are reported by name by the response check below   // trends.json is an optional file the game tolerates missing
const noise = (s) => IGNORE.some((r) => r.test(s));

// Serve the BUILT site (what ships): python3 tools/build_netlify.py dist  (the CI workflow and `npm run test:smoke` do this)
const DIR = path.resolve(process.env.SMOKE_DIR || "dist");
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png",
  ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".css": "text/css" };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  if (p.startsWith("/api/")) { res.writeHead(503); return res.end("no api in smoke test"); }   // the news feed falls back when offline
  const file = path.normalize(path.join(DIR, p));
  try { if (!file.startsWith(DIR + path.sep)) throw 0; const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404); res.end("not found"); }
});
await new Promise((r) => server.listen(Number(PORT), "127.0.0.1", r));
const stop = () => { try { server.close(); } catch {} };
const browser = await chromium.launch({
  executablePath: process.env.SMOKE_CHROMIUM || undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
});
let failed = 0;
for (const [page, needsCanvas, redirect] of PAGES) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } }); // phone-sized: this is how it is used
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1)/, (route) => { const u = route.request().url(); return /^(data|blob):/.test(u) ? route.continue() : route.abort(); });  // only our own site is judged
  const p = await ctx.newPage();
  const problems = [];
  p.on("pageerror", (e) => problems.push("script error: " + e.message));
  p.on("console", (m) => { if (m.type() === "error" && !noise(m.text())) problems.push("console: " + m.text().slice(0, 160)); });
  p.on("response", (r) => { if (r.status() >= 400 && r.url().startsWith(BASE) && !r.url().includes("/api/") && !noise(r.url())) problems.push(`${r.status()} ${r.url().replace(BASE, "")}`); });
  try {
    const res = await p.goto(`${BASE}/${page}`, { waitUntil: needsCanvas ? "commit" : "domcontentloaded", timeout: 60000 });
    if (!res || !res.ok()) problems.push(`page status ${res && res.status()}`);
    if (redirect) {
      // a bare room page must hand the visitor into the shell, deep-linked to the room.
      // Poll instead of waitForURL: the guard's location.replace can fire before a waiter is attached.
      const wantQuery = redirect.includes("?") ? redirect.slice(redirect.indexOf("?")) : null;
      const at = () => { try { const u = new URL(p.url()); return u.pathname === "/index.html" && (!wantQuery || u.search === wantQuery); } catch { return false; } };
      const t0 = Date.now(); while (!at() && Date.now() - t0 < 30000) await p.waitForTimeout(100);
      if (!at()) problems.push(`no redirect into ${redirect}`);
    }
    // 3D scenes can take a minute to start in software GL (CI/sandbox); a phone GPU does it in seconds.
    // After a shell redirect the canvas belongs to the room's iframe, so wait on each live frame.
    // frame.url() is a local accessor (safe while a busy scene answers no queries); the per-frame
    // waitForSelector timeout is enforced by the driver, so a booting scene cannot stall the loop.
    if (needsCanvas) {
      let found = false;
      try {
        if (redirect) {
          const t0 = Date.now();
          while (Date.now() - t0 < 150000 && !found) {
            for (const f of p.frames()) {
              if (f === p.mainFrame() || f.url() === "about:blank") continue;
              try { await f.waitForSelector("canvas", { timeout: 800, state: "attached" }); found = true; break; } catch { /* not yet, or not this frame */ }
            }
            if (!found) await p.waitForTimeout(400);
          }
        } else {
          await p.waitForSelector("canvas", { timeout: 150000, state: "attached" });
          found = true;
        }
      } catch { /* falls through to the failure below */ }
      if (!found) problems.push("no <canvas> appeared within 150s");
    }
    await p.waitForTimeout(needsCanvas ? 5000 : (page === "index.html" || redirect ? 8000 : 3000));
    if (process.env.SMOKE_SHOTS) await p.screenshot({ path: `${process.env.SMOKE_SHOTS}/${page.replace(/\//g, "_")}.png` }).catch(() => {});
  } catch (e) { problems.push("load failed: " + e.message.split("\n")[0]); }
  console.log(`${problems.length ? "FAIL" : "PASS"}  ${page}`);
  problems.slice(0, 6).forEach((x) => console.log("      " + x));
  if (problems.length) failed++;
  await ctx.close();
}
await browser.close(); stop();
console.log(failed ? `\n${failed} page(s) failed` : "\nall pages loaded cleanly");
process.exit(failed ? 1 : 0);
