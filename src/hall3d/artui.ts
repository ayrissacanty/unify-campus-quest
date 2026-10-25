/** The art studio, upstairs off the library. A real paint canvas; finished pictures can be saved to the dorm collage (the same on-device database the dorm reads). */
const css = () => {
  if (document.getElementById("artcss")) return;
  const s = document.createElement("style"); s.id = "artcss";
  s.textContent = `#artHost{position:absolute;inset:0;z-index:80;display:none;background:rgba(58,38,32,.5);touch-action:auto}
#artHost.show{display:flex;align-items:center;justify-content:center;padding:12px}
.artroom{width:min(860px,100%);max-height:min(94vh,760px);background:#FBF3E8;border-radius:18px;box-shadow:0 18px 40px rgba(60,30,20,.4);display:flex;flex-direction:column;overflow:hidden;color:#4A3B3F;font-family:"Fredoka","Trebuchet MS",sans-serif}
.arttop{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;background:#C4553A;color:#FFF4EA}
.arttop button,.arttools button,.arttools select{font:inherit;background:#fff;color:#4A3B3F;border:1px solid #D9BFA8;border-radius:10px;padding:8px 12px;min-height:36px;cursor:pointer}
.arttools{display:flex;flex-wrap:wrap;gap:6px;align-items:center;padding:10px 14px}
.artpal{display:flex;gap:5px;flex-wrap:wrap}
.artpal button{width:30px;height:30px;min-height:30px;padding:0;border-radius:50%;border:2px solid #fff;box-shadow:0 1px 3px rgba(60,30,20,.4)}
.artpal button.on{outline:3px solid #4A3B3F;outline-offset:1px}
.artwrap{flex:1;display:flex;justify-content:center;padding:0 14px 8px;min-height:0}
.artwrap canvas{background:#FFFDF6;border-radius:10px;box-shadow:inset 0 0 0 2px #E4D2B8;max-width:100%;max-height:52vh;touch-action:none;cursor:crosshair}
.artnote{margin:0;padding:0 14px 12px;font-size:13px;color:#8A7A70}`;
  document.head.appendChild(s);
};

const COLORS = ["#3A2C28", "#E07A66", "#C4553A", "#EAB94E", "#F6E2B8", "#6E8B74", "#3CB371", "#4F91C7", "#8E7CC3", "#F2A7C3", "#8A5A32", "#FFFDF6"];

/** the dorm collage database (also written by the 📸 button in index.html); pictures stay on this device */
function dormDb() {
  return new Promise<IDBDatabase>((res, rej) => {
    const q = indexedDB.open("unify-dorm-photos", 1);
    q.onupgradeneeded = () => { try { q.result.createObjectStore("photos", { keyPath: "id" }); } catch { /* exists */ } };
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); q.onblocked = () => rej(new Error("blocked"));
  });
}

export function openArt(onClose: () => void) {
  css();
  let host = document.getElementById("artHost") as HTMLElement | null;
  if (!host) { host = document.createElement("div"); host.id = "artHost"; document.body.appendChild(host); }
  host.classList.add("show"); host.innerHTML = "";
  const room = document.createElement("div"); room.className = "artroom"; host.appendChild(room);
  const top = document.createElement("div"); top.className = "arttop"; room.appendChild(top);
  const title = document.createElement("b"); title.textContent = "Art Studio"; top.appendChild(title);
  const close = document.createElement("button"); close.textContent = "Back to the hall"; top.appendChild(close);
  const shut = () => { host!.classList.remove("show"); host!.innerHTML = ""; onClose(); };
  close.onclick = shut;

  const tools = document.createElement("div"); tools.className = "arttools"; room.appendChild(tools);
  const pal = document.createElement("div"); pal.className = "artpal"; tools.appendChild(pal);
  let color = COLORS[1], size = 8, erase = false;
  const swatches: HTMLButtonElement[] = [];
  COLORS.forEach((c) => {
    const b = document.createElement("button"); b.style.background = c; b.setAttribute("aria-label", `paint ${c}`);
    b.onclick = () => { color = c; erase = false; swatches.forEach((x) => x.classList.toggle("on", x === b)); er.classList.remove("on"); };
    if (c === color) b.classList.add("on");
    swatches.push(b); pal.appendChild(b);
  });
  const er = document.createElement("button"); er.textContent = "◻ Eraser";
  er.onclick = () => { erase = true; er.classList.add("on"); swatches.forEach((x) => x.classList.remove("on")); };
  tools.appendChild(er);
  const sz = document.createElement("select"); sz.setAttribute("aria-label", "brush size");
  [["4", "thin"], ["8", "medium"], ["16", "fat"], ["28", "poster"]].forEach(([v, l]) => { const o = document.createElement("option"); o.value = v; o.textContent = `${l} brush`; sz.appendChild(o); });
  sz.value = "8"; sz.onchange = () => { size = +sz.value; }; tools.appendChild(sz);
  const undo = document.createElement("button"); undo.textContent = "↩ Undo"; tools.appendChild(undo);
  const clear = document.createElement("button"); clear.textContent = "New canvas"; tools.appendChild(clear);
  const save = document.createElement("button"); save.textContent = "🖼 Save to my dorm collage"; save.style.background = "#EAB94E"; tools.appendChild(save);

  const wrap = document.createElement("div"); wrap.className = "artwrap"; room.appendChild(wrap);
  const cv = document.createElement("canvas"); cv.width = 800; cv.height = 600; wrap.appendChild(cv);
  const g = cv.getContext("2d")!;
  g.fillStyle = "#FFFDF6"; g.fillRect(0, 0, cv.width, cv.height);
  g.lineCap = "round"; g.lineJoin = "round";
  const note = document.createElement("p"); note.className = "artnote";
  note.textContent = "Paint with a finger, a stylus or the mouse. Saved pictures appear in My Dorm, in the collage, and stay on this device.";
  room.appendChild(note);

  const strokes: ImageData[] = [];
  const snap = () => { strokes.push(g.getImageData(0, 0, cv.width, cv.height)); if (strokes.length > 24) strokes.shift(); };
  undo.onclick = () => { const s = strokes.pop(); if (s) g.putImageData(s, 0, 0); };
  clear.onclick = () => { snap(); g.fillStyle = "#FFFDF6"; g.fillRect(0, 0, cv.width, cv.height); };

  let drawing = false, lx = 0, ly = 0;
  const at = (e: PointerEvent) => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * (cv.width / r.width), (e.clientY - r.top) * (cv.height / r.height)]; };
  cv.addEventListener("pointerdown", (e) => { e.preventDefault(); cv.setPointerCapture(e.pointerId); snap(); drawing = true; [lx, ly] = at(e); g.fillStyle = erase ? "#FFFDF6" : color; g.beginPath(); g.arc(lx, ly, (erase ? size * 1.6 : size) / 2, 0, 7); g.fill(); });
  cv.addEventListener("pointermove", (e) => {
    if (!drawing) return; const [x, y] = at(e);
    g.strokeStyle = erase ? "#FFFDF6" : color; g.lineWidth = erase ? size * 3 : size;
    g.beginPath(); g.moveTo(lx, ly); g.lineTo(x, y); g.stroke(); lx = x; ly = y;
  });
  ["pointerup", "pointercancel"].forEach((ev) => cv.addEventListener(ev, () => { drawing = false; }));

  save.onclick = () => {
    if (!window.indexedDB) { note.textContent = "This browser can't save pictures. You can still keep painting here."; return; }
    save.disabled = true;
    cv.toBlob(async (blob) => {
      try {
        if (!blob) throw new Error("encode");
        const db = await dormDb();
        try {
          const n = await new Promise<number>((res, rej) => { const r = db.transaction("photos", "readonly").objectStore("photos").count(); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
          if (n >= 60) throw new Error("full");
          const rec = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7), at: Date.now(), kind: "drawing", blob, caption: "Made in the Art Studio" };
          await new Promise<void>((res, rej) => { const t = db.transaction("photos", "readwrite"); t.objectStore("photos").put(rec); t.oncomplete = () => res(); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error); });
        } finally { db.close(); }
        note.textContent = "🖼 Saved! Open My Dorm and look at your collage to see it on the wall.";
        try { parent.postMessage({ type: "dorm:photos-changed" }, "*"); } catch { /* standalone */ }
      } catch (err) {
        note.textContent = (err as Error)?.message === "full" ? "Your collage is full (60 pictures). Delete one in My Dorm first." : "Couldn't save the picture just now. You can keep painting.";
      } finally { save.disabled = false; }
    }, "image/jpeg", 0.85);
  };
}
