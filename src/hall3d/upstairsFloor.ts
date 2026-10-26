/* the second floor of the school: library, side halls, computer lab, art studio, auditorium and newsroom.
   Built as one function so HallScene stays readable; `hs` is the HallScene instance (its helpers are used like hs.box / hs.card). */
import * as THREE from "three";
import * as T from "./textures";
import { W, H, WALL_H, FLOOR_Y, LIBRARY, COMP_LAB, ART_STUDIO, WEST_HALL, EAST_HALL, AUDITORIUM, NEWSROOM, LIB_SHELVES, STAIR_BLOCK, UP_DOORS, type Rect } from "./campus";

export function buildUpstairsFloor(hs: any) {
  const y0 = FLOOR_Y, wh = WALL_H;
  const gx = (x: number) => x - W / 2, gz = (y: number) => y - H / 2;
  const wain = hs.plain("#C46B4A"), crown = hs.plain("#E8B15A"), wood = hs.plain("#8d6844"), ink = hs.plain("#5c4632"), cream = hs.plain("#f7f1e6"), plaster = hs.plain("#efe6d6");
  const slab = (r: Rect, floorCol: THREE.Material) => {
    hs.box(r.w, 0.46, r.h, plaster, gx(r.x + r.w / 2), y0 - 0.28, gz(r.y + r.h / 2), { outline: false, shadow: false });
    hs.box(r.w, 0.18, r.h, floorCol, gx(r.x + r.w / 2), y0 + 0.08, gz(r.y + r.h / 2), { outline: false, shadow: false });
    hs.box(Math.max(0.4, r.w - 1.6), 0.04, Math.max(0.4, r.h - 1.6), cream, gx(r.x + r.w / 2), y0 + 0.18, gz(r.y + r.h / 2), { outline: false, shadow: false });
    hs.box(Math.max(0.4, r.w - 1.4), 0.08, Math.max(0.4, r.h - 1.4), cream, gx(r.x + r.w / 2), y0 + wh - 0.06, gz(r.y + r.h / 2), { outline: false, shadow: false });
  };
  const oak = hs.plain("#C4894A"), hallTile = hs.std(hs.rep("upfloor", () => T.floorTex(), 4, 3)), stone = hs.plain("#F4E7CC");
  slab(LIBRARY, oak);
  slab(COMP_LAB, hs.plain("#BFD2E6")); slab(ART_STUDIO, hs.plain("#EFD3B8"));
  for (const r of [WEST_HALL, EAST_HALL, NEWSROOM]) slab(r, hallTile);
  slab(AUDITORIUM, stone);
  const cozy = hs.plain("#F6C7A8"), halfC = hs.plain("#F3D2B0");
  const wall = (x: number, y: number, w: number, d: number, half = false) => {
    if (w < 0.35 || d < 0.25) return;
    const cx = gx(x + w / 2), cz = gz(y + d / 2), h = half ? 1.28 : wh * 0.92;
    hs.box(w, h, d, half ? halfC : cozy, cx, y0 + h / 2, cz, { outline: false, occlude: !half, shadow: true });
    hs.box(w + 0.04, 0.1, d + 0.04, half ? wood : crown, cx, y0 + h - 0.02, cz, { outline: false, shadow: false });
    if (!half) hs.box(w + 0.02, 0.36, d + 0.02, wain, cx, y0 + 0.22, cz, { outline: false, shadow: false });
  };
  wall(8, 6, 92, 0.5); wall(8, 6, 0.5, 68); wall(99.5, 6, 0.5, 68); wall(8, 73.5, 92, 0.5);
  wall(8, 33.5, 3, 0.42, true); wall(23, 33.5, 62, 0.42, true); wall(97, 33.5, 2.5, 0.42, true);
  wall(25.5, 34, 0.42, 18, true); wall(8, 34, 3, 0.4, true); wall(23, 34, 2.5, 0.4, true); wall(8, 51.6, 3, 0.4, true); wall(23, 51.6, 2.5, 0.4, true);
  wall(82, 34, 0.42, 18, true); wall(82, 34, 3, 0.4, true); wall(97, 34, 2.5, 0.4, true); wall(82, 51.6, 3, 0.4, true); wall(97, 51.6, 2.5, 0.4, true);
  wall(8, 52, 12, 0.42, true); wall(32, 52, 28, 0.42, true);
  wall(18.8, 34, 0.42, 7.5, true); wall(18.8, 43.5, 0.42, 8.5, true);   // the computer lab wall, with a doorway
  wall(88.8, 34, 0.42, 7.5, true); wall(88.8, 43.5, 0.42, 8.5, true);   // the art studio wall, with a doorway
  wall(59.6, 52, 0.42, 8, true); wall(59.6, 68, 0.42, 6, true);
  wall(60, 52, 12, 0.42, true); wall(84, 52, 16, 0.42, true);
  wall(40, 8, 0.42, 9, true); wall(68, 8, 0.42, 9, true);
  const winAt = (x: number, y: number, rot: number) => hs.win(gx(x), y0 + 2.55, gz(y), rot);
  for (const x of [28, 54, 80]) winAt(x, 6.25, 0);
  winAt(28, 73.75, Math.PI); winAt(80, 73.75, Math.PI);
  winAt(8.25, 22, Math.PI / 2); winAt(8.25, 62, Math.PI / 2); winAt(99.75, 22, -Math.PI / 2); winAt(99.75, 62, -Math.PI / 2);
  hs.portrait(gx(40), y0 + 2.3, gz(6.35), 0, 0); hs.portrait(gx(68), y0 + 2.3, gz(6.35), 0, 2);
  hs.chandelier(gx(54), y0 + 3.85, gz(18)); hs.chandelier(gx(32), y0 + 3.95, gz(62));
  for (const [x, y] of [[12, 42], [96, 42], [14, 64], [94, 64]] as const) hs.potLight(gx(x), gz(y), y0);
  const sign = (text: string, col: string, x: number, y: number, rot: number) => hs.card(hs.tex("sg-" + text, () => T.signTex(text, col)), 2.4, 0.55, gx(x), y0 + 3.15, gz(y), rot, true);
  sign("LIBRARY", "#6E8B74", 54, 7.2, 0); sign("TO THE AUDITORIUM", "#6B5AA8", 17, 32.4, Math.PI); sign("TO THE NEWSROOM", "#E07A66", 91, 32.4, Math.PI);
  sign("AUDITORIUM", "#6B5AA8", 32, 71.6, Math.PI); sign("NEWSROOM", "#E07A66", 80, 71.6, Math.PI);
  sign("COMPUTER LAB", "#4F91C7", 13, 33.9, Math.PI); sign("ART STUDIO", "#C4553A", 95, 33.9, Math.PI);   // over the openings, readable from the library
  sign("COMPUTER LAB", "#4F91C7", 19.2, 40.9, Math.PI / 2); sign("ART STUDIO", "#C4553A", 88.8, 40.9, -Math.PI / 2);   // over the corridor doors
  const spines = hs.tex("spines", () => {
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 128; const c = cv.getContext("2d")!;
    c.fillStyle = "#8A6239"; c.fillRect(0, 0, 256, 128);
    const cols = ["#6E8B74", "#4F91C7", "#C46B4A", "#E0B15A", "#F4E2C4", "#8E5A3C", "#D4786A", "#7C6BB5"];
    const titles = ["COUNT", "WEATHER", "CELLS", "ALGEBRA", "STORIES", "FACTS", "SPEECH", "FRACTIONS"];
    let x = 4, i = 0; while (x < 248) { const w = 14 + (i % 3) * 6; c.fillStyle = cols[i % cols.length]; c.fillRect(x, 8, w - 3, 112); c.fillStyle = "#fffaf2"; c.font = "700 11px Georgia, serif"; c.save(); c.translate(x + 4, 108); c.rotate(-Math.PI / 2); c.fillText(titles[i % titles.length], 0, 0); c.restore(); x += w; i++; }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  const front = new THREE.MeshStandardMaterial({ map: spines, roughness: 0.8 });
  for (const r of LIB_SHELVES) {
    hs.box(r.w, 3.15, r.h, [front, front, wood, ink, ink, ink], gx(r.x + r.w / 2), y0 + 1.58, gz(r.y + r.h / 2), { outline: false, shadow: true });
    hs.box(r.w + 0.08, 0.08, r.h + 0.08, crown, gx(r.x + r.w / 2), y0 + 3.2, gz(r.y + r.h / 2), { outline: false, shadow: false });
  }
  hs.flat(hs.rep("librug", () => T.rugTex(), 1, 4), 3.2, 16, gx(54), gz(20), y0 + 0.08);
  hs.box(6.4, 0.95, 1.3, wood, gx(54), y0 + 0.5, gz(13.4), { outline: false });
  hs.box(6.6, 0.12, 1.5, crown, gx(54), y0 + 1.02, gz(13.4), { outline: false, shadow: false });
  hs.card(hs.tex("deskplate", () => T.signTex("CHECK OUT A BOOK", "#2C6B62")), 3.2, 0.46, gx(54), y0 + 1.35, gz(12.7), 0, true);
  hs.box(3.4, 0.42, 0.7, wood, gx(54), y0 + 0.28, gz(7.3), { outline: false });
  const globe = new THREE.Mesh(new THREE.SphereGeometry(0.28, 16, 12), hs.plain("#3E8FD4")); globe.position.set(gx(50.2), y0 + 1.35, gz(13.4)); hs.scene.add(globe);
  hs.box(0.9, 0.7, 0.55, ink, gx(58), y0 + 0.4, gz(12.2), { outline: false });
  for (const [x, y] of [[42, 18], [66, 18], [48, 26], [60, 26]] as const) {
    hs.box(2.2, 0.08, 1.05, wood, gx(x), y0 + 0.74, gz(y), { outline: false });
    for (const s of [-1, 1]) hs.box(0.08, 0.7, 0.08, ink, gx(x + s), y0 + 0.35, gz(y), { outline: false, shadow: false });
    hs.box(0.42, 0.42, 0.42, hs.plain("#C45A4A"), gx(x - 0.7), y0 + 0.42, gz(y + 0.85), { outline: false, shadow: false });
    hs.lamp(gx(x + 0.7), gz(y - 0.15), "#F0B429", y0);
  }
  for (const [x, y] of [[14, 30], [94, 30], [14, 58], [94, 58], [20, 70], [80, 70]] as const) hs.plant(gx(x), gz(y), y0);
  for (const [x, y] of [[12, 40], [96, 40], [30, 70], [86, 70]] as const) hs.lamp(gx(x), gz(y), "#F8D977", y0);
  hs.bench(gx(18), gz(62), Math.PI / 2, y0); hs.bench(gx(40), gz(62), Math.PI / 2, y0);
  const banner = (text: string, col: string, x: number, z: number) => hs.card(hs.tex("ban-" + text, () => T.signTex(text, col)), 1.15, 2.2, gx(x), y0 + 2.7, gz(z), 0, true);
  banner("COURAGE", "#7A2E3A", 12, 58); banner("WONDER", "#1F4E89", 48, 58); banner("TRUTH", "#2F6B45", 12, 68); banner("KINDNESS", "#C4553A", 48, 68);
  for (const z of [60, 66]) { hs.box(18, 0.16, 1.5, wood, gx(30), y0 + 0.78, gz(z), { outline: false }); for (const side of [-1, 1]) hs.box(18, 0.16, 0.45, hs.plain("#7A2E3A"), gx(30), y0 + 0.42, gz(z + side * 1.15), { outline: false, shadow: false }); }
  for (let i = 0; i < 8; i++) { const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), new THREE.MeshStandardMaterial({ color: "#FFE7A0", emissive: "#FFB703", emissiveIntensity: 0.8 })); orb.position.set(gx(16 + (i % 4) * 9), y0 + 3.3 + (i % 2) * 0.25, gz(58 + Math.floor(i / 4) * 8)); hs.scene.add(orb); }
  hs.box(16, 0.45, 5, wood, gx(32), y0 + 0.28, gz(70), { outline: false });
  for (const x of [14, 46]) { hs.box(0.55, 4.05, 0.55, hs.plain("#F7F1E6"), gx(x), y0 + 2.05, gz(60), { outline: false, shadow: false }); hs.box(0.9, 0.18, 0.9, hs.plain("#E8C56B"), gx(x), y0 + 4.15, gz(60), { outline: false, shadow: false }); }
  hs.card(hs.tex("sg-courage", () => T.signTex("COURAGE", "#C0392B")), 0.7, 1.6, gx(14), y0 + 2.6, gz(64), 0, true);
  hs.card(hs.tex("sg-wonder", () => T.signTex("WONDER", "#1F6FB2")), 0.7, 1.6, gx(46), y0 + 2.6, gz(64), 0, true);
  hs.card(hs.tex("stagesign", () => T.signTex("WALK UP TO OPEN THE SHOW", "#6B5AA8")), 3.4, 0.5, gx(32), y0 + 1.3, gz(67.6), Math.PI, true);
  hs.box(2.2, 0.9, 1.0, ink, gx(80), y0 + 0.45, gz(68), { outline: false });
  hs.card(hs.tex("newsset", () => T.bannerTex("THE NEWSROOM")), 3.2, 1.6, gx(80), y0 + 2.2, gz(72.6), Math.PI, true);
  const anchor = (x: number, shirt: string) => {
    const person = new THREE.Group();
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 10), hs.plain("#F2C7A0")); head.position.y = 1.55; person.add(head);
    const hair = new THREE.Mesh(new THREE.SphereGeometry(0.24, 10, 8), hs.plain("#4A3728")); hair.position.y = 1.68; hair.scale.y = 0.6; person.add(hair);
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.7, 0.2), hs.plain(shirt)); body.position.y = 1.05; person.add(body);
    person.position.set(gx(x), y0, gz(66)); hs.scene.add(person);
  };
  anchor(76, "#E07A66"); anchor(84, "#4F91C7");
  hs.box(1.2, 0.7, 0.15, hs.plain("#2b2b34"), gx(80), y0 + 1.35, gz(64.2), { outline: false });
  /* the computer lab: two desk rows with glowing monitors, a standing counter on the west wall, and the club screen */
  const scr = hs.plain("#20242C"), scrGlow = new THREE.MeshBasicMaterial({ color: "#9FD8FF" }), keys = hs.plain("#E8E2D2");
  const deskRow = (y: number, face: 1 | -1) => {
    hs.box(8, 0.12, 1.5, wood, gx(13.5), y0 + 0.76, gz(y), { outline: false });
    for (const s of [-1, 1]) hs.box(0.12, 0.72, 1.3, ink, gx(13.5 + s * 3.8), y0 + 0.38, gz(y), { outline: false, shadow: false });
    for (let i = 0; i < 4; i++) {
      const x = 10.6 + i * 1.95;
      hs.box(0.78, 0.52, 0.07, scr, gx(x), y0 + 1.12, gz(y - face * 0.28), { outline: false });
      const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.4), scrGlow); sc.position.set(gx(x), y0 + 1.12, gz(y - face * 0.28) + face * 0.045); if (face < 0) sc.rotation.y = Math.PI; hs.scene.add(sc);
      hs.box(0.62, 0.05, 0.24, keys, gx(x), y0 + 0.85, gz(y + face * 0.32), { outline: false, shadow: false });
      hs.box(0.52, 0.5, 0.52, hs.plain("#3A4A5A"), gx(x), y0 + 0.28, gz(y + face * 1.15), { outline: false });
    }
  };
  deskRow(35.4, 1); deskRow(50.6, -1);
  hs.box(1.5, 0.95, 7.6, wood, gx(9.3), y0 + 0.48, gz(42), { outline: false });
  for (const z of [39.2, 42, 44.8]) {
    hs.box(0.07, 0.52, 0.78, scr, gx(9.6), y0 + 1.32, gz(z), { outline: false });
    const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.66, 0.4), scrGlow); sc.position.set(gx(9.65), y0 + 1.32, gz(z)); sc.rotation.y = Math.PI / 2; hs.scene.add(sc);
  }
  const codeTex = hs.tex("codescreen", () => {
    const cv = document.createElement("canvas"); cv.width = 256; cv.height = 160; const c = cv.getContext("2d")!;
    c.fillStyle = "#1B2430"; c.fillRect(0, 0, 256, 160);
    const cols = ["#7EE787", "#79C0FF", "#FFA657", "#D2A8FF", "#A5D6FF", "#7EE787"];
    ["for page in book:", "  read(page)", "if idea:", "  draw(idea)", "run art_club()", "print('hello school')"].forEach((l, i) => { c.fillStyle = cols[i]; c.font = "700 15px 'Courier New',monospace"; c.fillText(l, 14, 28 + i * 22); });
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  hs.card(codeTex, 3.4, 2.0, gx(8.4), y0 + 2.3, gz(42), Math.PI / 2, true);
  hs.flat(hs.rep("labrug", () => T.rugTex(), 1, 3), 4.4, 10.5, gx(14.2), gz(43), y0 + 0.08);
  /* the art studio: easels with wet paintings, a paint table with pots, a supply shelf, and a paint-splattered floor cloth */
  const splat = hs.tex("artsplat", () => {
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 192; const c = cv.getContext("2d")!;
    c.fillStyle = "#F1E4CC"; c.fillRect(0, 0, 128, 192);
    const cols = ["#E07A66", "#4F91C7", "#EAB94E", "#6E8B74", "#8E7CC3", "#C46B4A"];
    for (let i = 0; i < 26; i++) { c.fillStyle = cols[i % cols.length]; c.globalAlpha = 0.55 + (i % 3) * 0.15; c.beginPath(); c.ellipse(12 + (i * 53) % 104, 14 + (i * 67) % 164, 4 + (i % 4) * 3, 3 + (i % 3) * 3, i, 0, 7); c.fill(); }
    c.globalAlpha = 1; const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  hs.flat(splat, 5.6, 9, gx(94), gz(43), y0 + 0.08);
  const easel = (x: number, z: number, hue: string) => {
    for (const s of [-1, 1]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.7, 0.07), wood); leg.position.set(gx(x + s * 0.3), y0 + 0.85, gz(z)); leg.rotation.z = s * 0.16; leg.castShadow = true; hs.scene.add(leg); }
    const back = new THREE.Mesh(new THREE.BoxGeometry(0.07, 1.7, 0.07), wood); back.position.set(gx(x), y0 + 0.85, gz(z - 0.24)); back.rotation.x = -0.2; back.castShadow = true; hs.scene.add(back);
    const cv = document.createElement("canvas"); cv.width = 64; cv.height = 80; const c = cv.getContext("2d")!;
    c.fillStyle = "#FBF4E4"; c.fillRect(0, 0, 64, 80); c.fillStyle = hue; c.beginPath(); c.arc(32, 34, 16, 0, 7); c.fill(); c.fillStyle = "#3CB371"; c.fillRect(0, 56, 64, 24); c.fillStyle = "#EAB94E"; c.beginPath(); c.arc(48, 18, 7, 0, 7); c.fill();
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
    const pic = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.9, 0.05), [wood, wood, wood, wood, new THREE.MeshBasicMaterial({ map: t }), wood]);
    pic.position.set(gx(x), y0 + 1.25, gz(z + 0.08)); pic.rotation.x = -0.08; pic.castShadow = true; hs.scene.add(pic);
  };
  easel(92, 35.4, "#E07A66"); easel(94.4, 35.4, "#4F91C7"); easel(96.8, 35.4, "#8E7CC3");
  hs.box(7.2, 0.14, 1.4, wood, gx(94.75), y0 + 0.78, gz(50.6), { outline: false });
  for (const s of [-1, 1]) hs.box(0.14, 0.74, 1.2, ink, gx(94.75 + s * 3.4), y0 + 0.38, gz(50.6), { outline: false, shadow: false });
  ["#E07A66", "#4F91C7", "#EAB94E", "#6E8B74", "#C46B4A", "#8E7CC3"].forEach((col, i) => { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.18, 10), hs.plain(col)); pot.position.set(gx(92.2 + i * 1.05), y0 + 0.95, gz(50.5 + (i % 2) * 0.3)); pot.castShadow = true; hs.scene.add(pot); });
  hs.box(0.9, 2.3, 7.4, wood, gx(99.1), y0 + 1.15, gz(42), { outline: false });
  for (let lv = 0; lv < 3; lv++) for (let i = 0; i < 5; i++) { const jar = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.24, 8), hs.plain(["#E07A66", "#4F91C7", "#EAB94E", "#6E8B74", "#C46B4A"][(lv + i) % 5])); jar.position.set(gx(98.95), y0 + 0.62 + lv * 0.62, gz(39.2 + i * 1.35)); hs.scene.add(jar); }
  for (const [x, z] of [[92, 47], [95, 45.4], [97, 47.6]] as const) { const st = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 0.5, 12), hs.plain("#C46B4A")); st.position.set(gx(x), y0 + 0.25, gz(z)); st.castShadow = true; hs.scene.add(st); }
  /* the story circle: a bright round rug, cushions, and an open book on a low stand */
  const storyRug = hs.tex("storyrug", () => {
    const cv = document.createElement("canvas"); cv.width = 128; cv.height = 128; const c = cv.getContext("2d")!;
    const rings = ["#C4553A", "#EAB94E", "#6E8B74", "#4F91C7", "#E07A66"];
    for (let i = 0; i < rings.length; i++) { c.fillStyle = rings[i]; c.beginPath(); c.arc(64, 64, 62 - i * 12, 0, 7); c.fill(); }
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  });
  const rugM = new THREE.Mesh(new THREE.CircleGeometry(2.7, 36), hs.std(storyRug)); rugM.rotation.x = -Math.PI / 2; rugM.position.set(gx(80.6), y0 + 0.09, gz(29.6)); rugM.receiveShadow = true; hs.scene.add(rugM);
  ["#E07A66", "#4F91C7", "#EAB94E", "#6E8B74", "#C46B4A"].forEach((col, i) => { const a = (i / 5) * Math.PI * 2 + 0.3; hs.box(0.66, 0.34, 0.66, hs.plain(col), gx(80.6 + Math.cos(a) * 1.95), y0 + 0.2, gz(29.6 + Math.sin(a) * 1.95), { outline: false }); });
  hs.box(0.9, 0.5, 0.7, wood, gx(80.6), y0 + 0.25, gz(29.6), { outline: false });
  for (const s of [-1, 1]) { const page = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.03, 0.66), cream); page.position.set(gx(80.6 + s * 0.26), y0 + 0.57, gz(29.6)); page.rotation.z = -s * 0.22; hs.scene.add(page); }
  const n = 8, z0 = gz(STAIR_BLOCK.y + STAIR_BLOCK.h), z1 = gz(STAIR_BLOCK.y), mid = STAIR_BLOCK.x + STAIR_BLOCK.w / 2, tread = Math.abs(z1 - z0) / n;
  const riser = hs.plain("#C56A32"), nose = hs.plain("#F6E2B8"), run = Math.abs(z1 - z0), rise = y0 - 0.18, stepH = rise / n, ang = Math.atan2(rise, run), dir = z0 > z1 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const t = (i + 1) / n, z = z0 + (z1 - z0) * ((i + 0.5) / n), top = 0.18 + t * rise;
    hs.box(6.3, stepH, tread * 1.02, riser, gx(mid), top - stepH / 2, z, { outline: false });
    hs.box(6.55, 0.06, tread * 0.28, nose, gx(mid), top + 0.02, z + dir * tread * 0.38, { outline: false, shadow: false });
  }
  hs.box(6.8, 0.18, 1.3, nose, gx(mid), y0 + 0.04, z1, { outline: false, shadow: false });
  for (const side of [-1, 1]) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, run + 0.4), hs.plain("#F7F1E6"));
    rail.position.set(gx(mid + side * 3.35), 0.95 + rise / 2, (z0 + z1) / 2); rail.rotation.x = dir * ang; rail.castShadow = true; hs.scene.add(rail);
    for (let i = 0; i < 5; i++) { const t = i / 4, z = z0 + (z1 - z0) * t, y = 0.18 + t * rise; hs.box(0.08, 0.95, 0.08, ink, gx(mid + side * 3.35), y + 0.42, z, { outline: false, shadow: false }); }
  }
  void UP_DOORS;
}
