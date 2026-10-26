/** The computer lab, upstairs off the library. Two desk activities, both on-device: typing practice and a "what does it print?" code-reading quiz. */
const css = () => {
  if (document.getElementById("labcss")) return;
  const s = document.createElement("style"); s.id = "labcss";
  s.textContent = `#labHost{position:absolute;inset:0;z-index:80;display:none;background:rgba(32,36,44,.5);touch-action:auto;user-select:text}
#labHost.show{display:flex;align-items:center;justify-content:center;padding:12px}
.labroom{width:min(760px,100%);max-height:min(92vh,700px);background:#F4F7FB;border-radius:18px;box-shadow:0 18px 40px rgba(16,24,40,.4);display:flex;flex-direction:column;overflow:hidden;color:#24303E;font-family:"Fredoka","Trebuchet MS",sans-serif}
.labtop{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:10px 14px;background:#4F91C7;color:#F4F9FF}
.labtop button,.labtabs button,.labbody button{font:inherit;background:#fff;color:#24303E;border:1px solid #B9C9DB;border-radius:10px;padding:8px 12px;min-height:36px;cursor:pointer}
.labtabs{display:flex;gap:6px;padding:10px 14px 0}
.labtabs button.on{background:#4F91C7;color:#fff;border-color:#4F91C7}
.labbody{padding:12px 14px 16px;overflow:auto;display:flex;flex-direction:column;gap:10px}
.labnote{margin:0;font-size:13px;color:#5A6B7E}
.labtype{font-family:Georgia,serif;font-size:19px;line-height:1.6;background:#fff;border:1px solid #B9C9DB;border-radius:12px;padding:12px 14px;min-height:84px}
.labtype b{font-weight:400}.labtype .ok{background:#C9E7C9;border-radius:3px}.labtype .bad{background:#F3C0B8;border-radius:3px}.labtype .cur{border-bottom:2px solid #4F91C7}
.labin{width:100%;font:inherit;font-size:16px;border:1px solid #B9C9DB;border-radius:12px;padding:10px 12px;min-height:44px;background:#fff;color:#24303E}
.labcode{font-family:"Courier New",monospace;font-size:16px;line-height:1.55;background:#1B2430;color:#A5D6FF;border-radius:12px;padding:12px 14px;white-space:pre-wrap}
.labopts{display:grid;grid-template-columns:1fr;gap:8px}
.labopts button{text-align:left;font-family:"Courier New",monospace;font-size:15px}
.labopts button.right{background:#C9E7C9;border-color:#5a8}.labopts button.wrong{background:#F3C0B8;border-color:#c65}
.labscore{font-size:14px;color:#33455A}`;
  document.head.appendChild(s);
};

const SENTENCES = [
  "The library upstairs has a story circle.",
  "A good password is long and easy for you to remember.",
  "Computers follow the steps you give them, in order.",
  "Save your drawing before you close the page.",
  "The newsroom checks a fact before it prints it.",
  "Every email you send should be kind and true.",
  "Backspace fixes a mistake; trying again fixes the rest.",
  "The art studio is next to the east staircase hall.",
];

interface Quiz { code: string; options: string[]; right: number; why: string }
const QUIZZES: Quiz[] = [
  { code: "x = 3\nx = x + 2\nprint(x)", options: ["3", "5", "2"], right: 1, why: "x starts at 3, then 2 is added, so x is 5." },
  { code: "for i in [1, 2, 3]:\n  print(i)", options: ["1 2 3", "3 2 1", "1"], right: 0, why: "A for loop visits each item in order: 1, then 2, then 3." },
  { code: "name = 'Ada'\nprint('hi ' + name)", options: ["hi name", "hi Ada", "Ada"], right: 1, why: "The + joins the two pieces of text into 'hi Ada'." },
  { code: "if 4 > 9:\n  print('big')\nelse:\n  print('small')", options: ["big", "small", "nothing"], right: 1, why: "4 is not bigger than 9, so the else part runs." },
  { code: "pets = ['cat', 'dog']\nprint(pets[0])", options: ["dog", "cat", "0"], right: 1, why: "Lists start counting at 0, so pets[0] is the first one." },
  { code: "total = 0\nfor n in [2, 4, 6]:\n  total = total + n\nprint(total)", options: ["6", "246", "12"], right: 2, why: "The loop adds 2, 4 and 6 into total: 2+4+6 is 12." },
  { code: "word = 'sun'\nprint(word * 2)", options: ["sunsun", "sun2", "sun sun"], right: 0, why: "Multiplying text repeats it: 'sun' twice is 'sunsun'." },
];

export function openLab(onClose: () => void) {
  css();
  let host = document.getElementById("labHost") as HTMLElement | null;
  if (!host) { host = document.createElement("div"); host.id = "labHost"; document.body.appendChild(host); }
  host.classList.add("show"); host.innerHTML = "";
  const room = document.createElement("div"); room.className = "labroom"; host.appendChild(room);
  const top = document.createElement("div"); top.className = "labtop"; room.appendChild(top);
  const title = document.createElement("b"); title.textContent = "Computer Lab"; top.appendChild(title);
  const close = document.createElement("button"); close.textContent = "Back to the hall"; top.appendChild(close);
  const shut = () => { host!.classList.remove("show"); host!.innerHTML = ""; onClose(); };
  close.onclick = shut;
  const tabs = document.createElement("div"); tabs.className = "labtabs"; room.appendChild(tabs);
  const body = document.createElement("div"); body.className = "labbody"; room.appendChild(body);
  const tType = document.createElement("button"); tType.textContent = "⌨ Typing practice";
  const tQuiz = document.createElement("button"); tQuiz.textContent = "🐞 What does it print?";
  tabs.append(tType, tQuiz);
  let tab = "type";
  const paintTabs = () => { tType.classList.toggle("on", tab === "type"); tQuiz.classList.toggle("on", tab === "quiz"); };

  /* ---- typing practice: type the sentence; right letters turn green, wrong ones red; finish for words-a-minute ---- */
  let si = Math.floor(Math.random() * SENTENCES.length), t0 = 0;
  const paintType = () => {
    body.innerHTML = "";
    const note = document.createElement("p"); note.className = "labnote";
    note.textContent = "Type the sentence exactly as it appears. Capitals and punctuation count. Press Enter or tap Done to score it.";
    body.appendChild(note);
    const view = document.createElement("div"); view.className = "labtype"; body.appendChild(view);
    const input = document.createElement("input"); input.className = "labin"; input.setAttribute("aria-label", "Type the sentence here");
    input.autocapitalize = "off"; input.autocomplete = "off"; (input as HTMLInputElement).spellcheck = false; body.appendChild(input);
    const row = document.createElement("div"); row.style.display = "flex"; row.style.gap = "8px"; row.style.alignItems = "center";
    const done = document.createElement("button"); done.textContent = "Done"; const next = document.createElement("button"); next.textContent = "New sentence";
    const score = document.createElement("span"); score.className = "labscore"; row.append(done, next, score); body.appendChild(row);
    const target = SENTENCES[si];
    const paint = () => {
      const got = input.value; view.innerHTML = "";
      for (let i = 0; i < target.length; i++) {
        const b = document.createElement("b"); b.textContent = target[i];
        if (i < got.length) b.className = got[i] === target[i] ? "ok" : "bad";
        else if (i === got.length) b.className = "cur";
        view.appendChild(b);
      }
    };
    paint();
    input.oninput = () => { if (!t0 && input.value) t0 = Date.now(); paint(); };
    const grade = () => {
      const got = input.value; let ok = 0; for (let i = 0; i < target.length; i++) if (got[i] === target[i]) ok++;
      const acc = Math.round((ok / target.length) * 100), mins = t0 ? (Date.now() - t0) / 60000 : 0;
      const wpm = mins > 0.005 ? Math.round(got.length / 5 / mins) : 0;
      score.textContent = got === target ? `Perfect! ${wpm} words a minute.` : `${acc}% right${wpm ? ` · about ${wpm} words a minute` : ""}. Green letters match; fix the red ones.`;
    };
    done.onclick = grade;
    input.addEventListener("keydown", (e) => { if (e.key === "Enter") grade(); });
    next.onclick = () => { si = (si + 1) % SENTENCES.length; t0 = 0; paintType(); };
    setTimeout(() => input.focus(), 60);
  };

  /* ---- code-reading quiz: read three or four lines and pick what prints ---- */
  let qi = 0, qRight = 0, qDone = 0;
  const paintQuiz = () => {
    body.innerHTML = "";
    const note = document.createElement("p"); note.className = "labnote";
    note.textContent = "Read the little program, then tap what it prints. The computer follows the lines top to bottom — so can you.";
    body.appendChild(note);
    const q = QUIZZES[qi % QUIZZES.length];
    const code = document.createElement("div"); code.className = "labcode"; code.textContent = q.code; body.appendChild(code);
    const opts = document.createElement("div"); opts.className = "labopts"; body.appendChild(opts);
    const score = document.createElement("div"); score.className = "labscore"; score.textContent = qDone ? `Score so far: ${qRight} of ${qDone}` : "";
    const next = document.createElement("button"); next.textContent = "Next program"; next.style.display = "none";
    q.options.forEach((op, i) => {
      const b = document.createElement("button"); b.textContent = op;
      b.onclick = () => {
        Array.from(opts.children).forEach((el, j) => { (el as HTMLButtonElement).disabled = true; el.classList.toggle(j === q.right ? "right" : j === i ? "wrong" : ""); });
        qDone++; if (i === q.right) qRight++;
        note.textContent = (i === q.right ? "Right. " : "Not quite. ") + q.why;
        score.textContent = `Score so far: ${qRight} of ${qDone}`; next.style.display = "";
      };
      opts.appendChild(b);
    });
    body.appendChild(score);
    next.onclick = () => { qi++; paintQuiz(); }; body.appendChild(next);
  };

  const paint = () => { paintTabs(); if (tab === "type") paintType(); else paintQuiz(); };
  tType.onclick = () => { tab = "type"; paint(); };
  tQuiz.onclick = () => { tab = "quiz"; paint(); };
  paint();
}
