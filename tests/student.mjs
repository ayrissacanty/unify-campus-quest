// Student click-through tests: act like a student on the BUILT site (dist), in a real headless browser.
// Run:  npm run build && python3 tools/build_netlify.py dist && npm run test:student
// Env:  SMOKE_CHROMIUM (optional browser path), STUDENT_PORT, SMOKE_DIR (default dist), SMOKE_CANVAS_MS (hallway start-up wait, default 300 s)
import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { chromium } from "playwright";

const PORT = Number(process.env.STUDENT_PORT || 8798), BASE = `http://127.0.0.1:${PORT}`;
const DIR = path.resolve(process.env.SMOKE_DIR || "dist");
const CANVAS_MS = Number(process.env.SMOKE_CANVAS_MS) || 300000;   // SwiftShader on CI compiles the hallway shaders slowly (see smoke.mjs)
const SUBJECTS = ["math", "ela", "science", "history", "careers", "life"];
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json", ".png": "image/png",
  ".svg": "image/svg+xml", ".webmanifest": "application/manifest+json", ".css": "text/css", ".webp": "image/webp" };
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x"); let p = decodeURIComponent(u.pathname); if (p === "/") p = "/index.html";
  if (p.startsWith("/api/")) { res.writeHead(503); return res.end("no api in tests"); }
  const file = path.normalize(path.join(DIR, p));
  try { if (!file.startsWith(DIR + path.sep)) throw 0; const body = await readFile(file); res.writeHead(200, { "content-type": TYPES[path.extname(file)] || "application/octet-stream" }); res.end(body); }
  catch { res.writeHead(404); res.end("not found"); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.SMOKE_CHROMIUM || undefined,
  args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--no-sandbox"],
});
const IGNORE = [/favicon/i, /net::ERR_/i, /fonts\.(googleapis|gstatic)\.com/i, /status of (404|502|503)/i, /trends\.json/i];

let failed = 0;
async function test(name, fn) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 780 } });
  await ctx.route(/^(?!http:\/\/127\.0\.0\.1)/, (r) => (/^(data|blob):/.test(r.request().url()) ? r.continue() : r.abort()));
  const page = await ctx.newPage(), errors = [];
  page.on("pageerror", (e) => errors.push("script error: " + e.message));
  page.on("console", (m) => { if (m.type() === "error" && !IGNORE.some((r) => r.test(m.text()))) errors.push("console: " + m.text().slice(0, 160)); });
  const t0 = Date.now();
  try { await fn(page); if (errors.length) throw new Error(errors.slice(0, 4).join("\n      ")); console.log(`PASS  ${name}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`); }
  catch (e) { failed++; console.log(`FAIL  ${name}\n      ${e.message.split("\n").slice(0, 6).join("\n      ")}`); }
  await ctx.close();
}
const expect = (ok, msg) => { if (!ok) throw new Error(msg); };

// 1. Curriculum home: one card per subject from layout(), each with a "Teach next" line or the all-done line.
await test("curriculum: home shows a layout card with a next lesson for every subject", async (p) => {
  await p.goto(`${BASE}/curriculum.html`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("#main article.page", { timeout: 30000 });
  const cards = await p.$$eval("#main article.page", (as) => as.map((a) => a.innerText));
  expect(cards.length === SUBJECTS.length, `expected ${SUBJECTS.length} subject cards, got ${cards.length}`);
  for (const c of cards) {
    expect(/\d+ studied of \d+ on the shelf\. \d+ ready to teach\./.test(c), "card is missing its studied/shelf/ready line: " + c.slice(0, 80));
    expect(/Teach next: \S|Nothing left unmarked/.test(c), "card has no next-lesson line: " + c.slice(0, 80));
  }
  expect(cards.some((c) => /Teach next: \S/.test(c)), "no subject offers a next lesson on a fresh account");
});

// 2. Pick a subject, open its next lesson, mark it studied, and check the home card moves on to a different lesson.
await test("curriculum: pick a subject, open the next lesson, mark it studied, next lesson advances", async (p) => {
  await p.goto(`${BASE}/curriculum.html`, { waitUntil: "domcontentloaded" });
  const card = p.locator("#main article.page").filter({ hasText: "Teach next:" }).first();
  await card.waitFor({ timeout: 30000 });
  const nextLine = (await card.locator("p", { hasText: "Teach next:" }).innerText()).replace("Teach next: ", "").trim();
  const subjName = (await card.locator("h2").innerText()).replace(/^\S+\s/, "").trim();
  await card.getByRole("button", { name: "Open the shelf" }).click();
  await p.waitForSelector("#main .list .item", { timeout: 15000 });
  expect(new URL(p.url()).hash.length > 1, "subject page did not set the #subject route");
  expect((await p.locator(".crumbs").innerText()).includes(subjName), "breadcrumb does not name the subject " + subjName);
  const item = p.locator("#main .item").filter({ has: p.locator("b", { hasText: new RegExp("^" + nextLine.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "$") }) }).first();
  expect(await item.count(), `next lesson "${nextLine}" is not on the ${subjName} shelf`);
  await item.click();
  await p.waitForSelector("#main article.page h2", { timeout: 15000 });
  expect((await p.locator("#main article.page h2").innerText()).includes(nextLine), "lesson page does not show " + nextLine);
  await p.getByRole("button", { name: "Mark as studied" }).click();
  await p.getByRole("button", { name: /Studied \(tap to undo\)/ }).waitFor({ timeout: 10000 });
  await p.locator(".crumbs button", { hasText: "Curriculum" }).click();
  const again = p.locator("#main article.page").filter({ has: p.locator("h2", { hasText: subjName }) });
  await again.waitFor({ timeout: 15000 });
  const txt = await again.innerText();
  expect(/1 studied of/.test(txt), "home card does not count the lesson as studied: " + txt.slice(0, 120));
  expect(!txt.includes("Teach next: " + nextLine + "\n") && !txt.endsWith("Teach next: " + nextLine), "next lesson did not advance past " + nextLine);
});

// 3. Search finds lessons and opens one.
await test("curriculum: search for a word and open a result", async (p) => {
  await p.goto(`${BASE}/curriculum.html`, { waitUntil: "domcontentloaded" });
  await p.waitForSelector("#main article.page", { timeout: 30000 });
  await p.waitForLoadState("networkidle").catch(() => {});   // the bundled packs load, then the page re-routes once
  await p.fill("#q", "the");
  await p.waitForSelector("#main .list .item", { timeout: 10000 });
  await p.locator("#main .list .item").first().click();
  await p.waitForSelector("#main article.page h2", { timeout: 10000 });
});

// 4. Hallway: wait for the 3D scene, walk with the on-screen pad, open the Go menu and pick a destination.
await test("hallway3d: walk with the pad and use the Go menu", async (page) => {
  // since "one app, one address" the bare hallway3d.html bounces into index.html, which hosts the hall in its #fHall iframe
  await page.goto(`${BASE}/index.html`, { waitUntil: "commit", timeout: 60000 });
  const t0 = Date.now(); let p = null;
  while (!p && Date.now() - t0 < 60000) { p = page.frames().find((f) => /\/hallway3d\.html/.test(f.url())) || null; if (!p) await page.waitForTimeout(250); }
  if (!p) throw new Error("index.html never loaded the hallway frame");
  await p.waitForSelector("canvas", { timeout: CANVAS_MS, state: "attached" });
  await p.waitForFunction(() => window.__hall && document.getElementById("clk").textContent.trim() !== "", null, { timeout: CANVAS_MS, polling: 1000 });
  // close the first-visit avatar creator like a student would skip it, then wait out any arrival cut-scene
  await p.evaluate(() => { try { window.__creator.hide(); } catch {} window.__hall.inputLocked = false; });
  await p.waitForFunction(() => !window.__hall.cine && !window.__hall.inputLocked, null, { timeout: 120000, polling: 1000 }).catch(() => {});
  const pos = () => p.evaluate(() => { const v = window.__hall.player.pos; return { x: v.x, z: v.z }; });
  const before = await pos();
  const pad = p.locator('[data-k="u"]');
  await pad.dispatchEvent("pointerdown");
  await p.waitForFunction((b) => { const v = window.__hall.player.pos; return Math.hypot(v.x - b.x, v.z - b.z) > 0.3; }, before, { timeout: 60000, polling: 500 })
    .catch(() => { throw new Error("player did not move after holding the up arrow for 60 s"); });
  await pad.dispatchEvent("pointerup");
  await p.locator("#bGo").dispatchEvent("click");
  await p.waitForSelector("#goMenu.show", { timeout: 10000 });
  expect(await p.locator("#goMenu button").count() >= 6, "Go menu is missing the class destinations");
  const dest = p.locator("#goMenu button", { hasText: "Plaza fountain" });
  expect(await dest.count(), "Go menu has no Plaza fountain destination");
  await dest.dispatchEvent("click");
  await p.waitForFunction(() => !document.getElementById("goMenu").classList.contains("show"), null, { timeout: 10000 });
  const mid = await pos();
  // the student is either walking a planned route or has already moved toward the fountain
  await p.waitForFunction((b) => { const h = window.__hall, v = h.player.pos; return !!h.nav || Math.hypot(v.x - b.x, v.z - b.z) > 0.3; }, mid, { timeout: 60000, polling: 500 })
    .catch(() => { throw new Error("player did not head off after picking a Go destination"); });
});

await browser.close(); server.close();
console.log(failed ? `\n${failed} student test(s) failed` : "\nall student tests passed");
process.exit(failed ? 1 : 0);
