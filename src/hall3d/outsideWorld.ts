/* the world beyond the school walls: lawn, trees, houses, hills, birds and squirrels, and the road.
   `h` is the HallScene instance. */
import * as THREE from "three";
import * as T from "./textures";
import { W, H, OUTSIDE } from "./campus";
import { seasonOf } from "../game/world";

const hash = (a: number, b: number) => { const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return n - Math.floor(n); };

export function buildOutsideWorld(hs: any) {
  const S = hs.scene;
  const gt = hs.rep("grass", () => T.groundTex(), 60, 60), ground = new THREE.Mesh(new THREE.PlaneGeometry(480, 480), hs.std(gt)); ground.rotation.x = -Math.PI / 2; ground.position.y = -0.04; ground.receiveShadow = true; S.add(ground);
  const bladeN = 900, blades = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.05, 0.46), new THREE.MeshStandardMaterial({ color: "#3E9A45", roughness: 0.8, side: THREE.DoubleSide }), bladeN);
  const bm = new THREE.Matrix4(), bq = new THREE.Quaternion(), be = new THREE.Euler(), bc = new THREE.Color();
  const shades = ["#2F7A3A", "#4E9A48", "#8FCB62", "#1F6A32"];
  for (let i = 0; i < bladeN; i++) {
    let x = (hash(i, 4) - 0.5) * 96, z = H / 2 + 3.2 + hash(i, 5) * 26;
    const roadZ = OUTSIDE.roadY - H / 2;
    const onWalk = (Math.abs(x) < 5.2 && z > H / 2 - 0.4 && z < H / 2 + 26) || (Math.abs(x) < 32 && z > H / 2 + 0.5 && z < H / 2 + 5.6) || (z > roadZ - 6.4 && z < roadZ - 1.6);
    if (onWalk) { x += x < 0 ? -18 : 18; z = H / 2 - 8; }
    if (Math.abs(x) < 4.2) x += x < 0 ? -4 : 4;
    if (Math.abs(z - roadZ) < 3.6) z -= 8;
    be.set(0.15 + hash(i, 6) * 0.35, hash(i, 7) * 6.28, (hash(i, 8) - 0.5) * 0.4); bq.setFromEuler(be);
    const sc = 0.65 + hash(i, 9) * 0.9; bm.compose(new THREE.Vector3(x, sc * 0.2, z), bq, new THREE.Vector3(sc, sc, sc)); blades.setMatrixAt(i, bm); blades.setColorAt(i, bc.set(shades[i % 4]));
  }
  blades.receiveShadow = true; S.add(blades);
  hs.flat(hs.rep("stoneP", () => T.stoneTex(), 2, 8), 9, 24, 0, H / 2 + 13, -0.02);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(9, 40), hs.std(hs.rep("stoneD", () => T.stoneTex(), 5, 5))); disc.rotation.x = -Math.PI / 2; disc.position.set(0, -0.015, H / 2 + 30); disc.receiveShadow = true; S.add(disc);
  // instanced paper trees: a trunk + a faceted crown each
  const spots: { x: number; z: number; s: number }[] = [];
  for (let i = 0; i < 900 && spots.length < 190; i++) {
    const x = (hash(i, 1) - 0.5) * 150, z = (hash(i, 2) - 0.5) * 140 + 8;
    if (Math.abs(x) < W / 2 + 5 && Math.abs(z) < H / 2 + 5) continue;                   // keep clear of the building
    if (Math.abs(x) < 8 && z > H / 2 - 1 && z < H / 2 + 28) continue;
    if (z > OUTSIDE.roadY - H / 2 - 7 && z < OUTSIDE.roadY - H / 2 + 4) continue;
    if (Math.hypot(x, z - (H / 2 + 30)) < 11) continue;
    spots.push({ x, z, s: 0.8 + hash(i, 3) * 0.9 });
  }
  const trunk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.16, 0.28, 2.0, 7), hs.plain("#8A5A32"), spots.length);
  const leafN = spots.length * 14;
  const leaves = new THREE.InstancedMesh(hs.leafGeo(), new THREE.MeshStandardMaterial({ roughness: 0.62, side: THREE.DoubleSide }), leafN);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), leafCol = new THREE.Color();
  const greens = ["#1F8A45", "#2F9A4A", "#67B34A", "#E8833A", "#3CB371", "#C2452D", "#8FCB62"];
  spots.forEach((p, i) => {
    q.identity(); m4.compose(new THREE.Vector3(p.x, 0.95 * p.s, p.z), q, new THREE.Vector3(p.s, p.s * 1.15, p.s)); trunk.setMatrixAt(i, m4);
    for (let k = 0; k < 14; k++) {
      const a = hash(i, 20 + k) * 6.28, rad = (0.35 + hash(i, 40 + k) * 0.85) * p.s, y = (1.7 + hash(i, 60 + k) * 1.5) * p.s;
      e.set(0.4 + hash(i, 70 + k), a, 0.3); q.setFromEuler(e);
      m4.compose(new THREE.Vector3(p.x + Math.cos(a) * rad, y, p.z + Math.sin(a) * rad), q, new THREE.Vector3(p.s, p.s, p.s));
      const ix = i * 14 + k; leaves.setMatrixAt(ix, m4); leaves.setColorAt(ix, leafCol.set(greens[(i + k) % greens.length]));
    }
  });
  trunk.castShadow = true; hs.scene.add(trunk, leaves);
  // foundation trees sit against the walls, off the front walk and the bus path
  for (const x of [-50, -40, -30, 36, 46]) hs.tree(x, H / 2 + 1.8, 1.15);
  for (const x of [-46, -30, 30, 46]) hs.tree(x, -H / 2 - 1.8, 1.15);
  for (const z of [-30, -16, 16, 30]) { hs.tree(-W / 2 - 2.1, z, 1.15); hs.tree(W / 2 + 2.1, z, 1.15); }
  // little paper houses and hills ringing the lawn
  const wallCols = ["#FF8A78", "#FFD15C", "#5EE0A0", "#7EC8FF", "#FFB077", "#C9A6FF"], roofCols = ["#E25B45", "#C9843A", "#3D7CC9", "#D4536A"];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * Math.PI * 2 + hash(i, 8) * 0.2, rx = 78 + hash(i, 9) * 18, x = Math.cos(a) * rx * 1.1, z = Math.sin(a) * rx * 0.85 + 6;
    if (z > H / 2 - 2) continue;
    const w = 5 + hash(i, 10) * 4, h = 3.5 + hash(i, 11) * 2.5, g = new THREE.Group();
    const body = new THREE.Mesh(hs.clay(w, h, w * 0.9, 0.55), hs.plain(wallCols[i % 6])); body.position.y = h / 2; body.castShadow = true; g.add(body);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(w * 0.78, h * 0.62, 16), hs.plain(roofCols[i % 4])); roof.position.y = h + h * 0.28; roof.castShadow = true; g.add(roof);
    const door = new THREE.Mesh(hs.clay(w * 0.22, h * 0.42, 0.12, 0.08), hs.plain("#FFF6E4")); door.position.set(0, h * 0.22, w * 0.46); door.castShadow = true; g.add(door);
    const win = new THREE.Mesh(new THREE.SphereGeometry(0.38, 12, 8), new THREE.MeshStandardMaterial({ color: "#BFE9FF", roughness: 0.15, emissive: "#7EC8FF", emissiveIntensity: 0.25 })); win.position.set(w * 0.22, h * 0.62, w * 0.42); g.add(win);
    const chim = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, h * 0.35, 10), hs.plain("#E8D7C4")); chim.position.set(-w * 0.22, h + h * 0.42, 0); g.add(chim);
    g.position.set(x, 0, z); g.rotation.y = hash(i, 12) * 6; S.add(g);
  }
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2 + 0.2, r = 118 + hash(i, 13) * 30, s = 14 + hash(i, 14) * 14;
    const hill = new THREE.Mesh(new THREE.SphereGeometry(s, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: ["#7ED9A0", "#B6F2C4", "#5EBE88"][i % 3], roughness: 0.8 }));
    hill.scale.y = 0.62; hill.position.set(Math.cos(a) * r * 1.15, -0.4, Math.sin(a) * r * 0.9 + 6); S.add(hill);
  }
}

export function buildLifeWorld(hs: any) {
  if (seasonOf() === "autumn") {
    const mat = ["#E8833A", "#C2452D", "#EAB94E", "#8A5A2B"].map((c) => new THREE.MeshStandardMaterial({ color: c, side: THREE.DoubleSide, roughness: 0.6 }));
    for (let i = 0; i < 36; i++) {
      const m = new THREE.Mesh(hs.leafGeo(), mat[i % 4]); m.scale.setScalar(0.45);
      const ang = (i / 36) * Math.PI * 2, rad = 62 + (i % 5) * 6;
      m.position.set(Math.cos(ang) * rad, 2 + (i % 8) * 0.8, Math.sin(ang) * rad * 0.75 + 8);
      m.userData.fall = 0.6 + (i % 5) * 0.15; hs.leaves.push(m); hs.scene.add(m);
    }
  }
  const kinds = [
    { body: "#6b4428", breast: "#d4534a", wing: "#4a3024", scale: 1, y: 5.2, flap: 9, r: 22, speed: 0.42 },
    { body: "#c62828", breast: "#e53935", wing: "#8e1b1b", scale: 1.05, y: 6.6, flap: 8, r: 28, speed: 0.36 },
    { body: "#2f6fbe", breast: "#f4f7fb", wing: "#1d4e89", scale: 1.15, y: 7.4, flap: 7, r: 36, speed: 0.5 },
    { body: "#a8845a", breast: "#e6d3b0", wing: "#7a6244", scale: 0.7, y: 4.3, flap: 13, r: 16, speed: 0.55 },
    { body: "#a8845a", breast: "#e6d3b0", wing: "#7a6244", scale: 0.68, y: 4.6, flap: 13, r: 15, speed: 0.58 },
    { body: "#1c1c1c", breast: "#2a2a2a", wing: "#111111", scale: 1.4, y: 9.8, flap: 4.5, r: 44, speed: 0.22 },
    { body: "#8d9399", breast: "#f7f7f7", wing: "#2c2c2c", scale: 0.6, y: 5.6, flap: 15, r: 13, speed: 0.7 },
  ];
  kinds.forEach((k, i) => {
    const g = new THREE.Group(), body = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), hs.plain(k.body)); body.scale.set(1.7, 0.75, 0.85); g.add(body);
    const breast = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), hs.plain(k.breast)); breast.position.set(0.08, -0.02, 0); g.add(breast);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), hs.plain(k.body)); head.position.set(0.16, 0.04, 0); g.add(head);
    const beak = new THREE.Mesh(new THREE.ConeGeometry(0.02, 0.08, 5), hs.plain("#e2b15a")); beak.rotation.z = -Math.PI / 2; beak.position.set(0.22, 0.03, 0); g.add(beak);
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 0.08), new THREE.MeshStandardMaterial({ color: k.wing, side: THREE.DoubleSide })); tail.position.set(-0.16, 0.02, 0); g.add(tail);
    for (const side of [-1, 1]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.08), new THREE.MeshStandardMaterial({ color: k.wing, side: THREE.DoubleSide })); w.position.set(0, 0.02, side * 0.08); w.name = side < 0 ? "wingL" : "wingR"; g.add(w); }
    if (i === 1 || i === 2) { const crest = new THREE.Mesh(hs.leafGeo(), hs.plain(k.body)); crest.scale.setScalar(0.35); crest.position.set(0.12, 0.12, 0); crest.rotation.z = -0.6; g.add(crest); }
    g.scale.setScalar(k.scale); hs.birds.push({ g, y: k.y, r: k.r, flap: k.flap, speed: k.speed, phase: i * 1.3 }); hs.scene.add(g);
  });
  for (let i = 0; i < 5; i++) {
    const g = new THREE.Group(), fur = hs.plain("#8A5A32"), belly = hs.plain("#E6C39A");
    const body = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), fur); body.scale.set(1.55, 0.75, 0.9); body.position.y = 0.16; g.add(body);
    const tum = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), belly); tum.position.set(0.04, 0.1, 0); g.add(tum);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.07, 8, 6), fur); head.position.set(0.16, 0.24, 0); g.add(head);
    for (const s of [-1, 1]) { const ear = new THREE.Mesh(new THREE.ConeGeometry(0.025, 0.07, 5), fur); ear.position.set(0.16, 0.32, s * 0.04); g.add(ear); }
    const tail = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), hs.plain("#C4894A")); tail.scale.set(0.7, 1.3, 0.7); tail.position.set(-0.2, 0.28, 0); tail.rotation.z = 0.6; tail.name = "tail"; g.add(tail);
    for (const [lx, lz] of [[0.08, 0.06], [0.08, -0.06], [-0.08, 0.06], [-0.08, -0.06]] as const) { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.08, 4), fur); leg.position.set(lx, 0.04, lz); g.add(leg); }
    const x = (i - 2) * 14, z = H / 2 + 4.5; g.position.set(x, 0, z); hs.squirrels.push({ g, x, z, tx: x + 2, tz: z, wait: i }); hs.scene.add(g);
  }
  const g = new THREE.Group(), hide = hs.plain("#8C6239"), pale = hs.plain("#F3E6D2");
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), hide); body.scale.set(1.8, 0.85, 0.7); body.position.set(0, 0.85, 0); g.add(body);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.55, 6), hide); neck.position.set(0.55, 1.15, 0); neck.rotation.z = -0.5; neck.name = "neck"; g.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), hide); head.position.set(0.82, 1.35, 0); g.add(head);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), hs.plain("#3a2a22")); nose.position.set(0.96, 1.32, 0); g.add(nose);
  for (const s of [-1, 1]) { const ear = new THREE.Mesh(hs.leafGeo(), hide); ear.scale.setScalar(0.45); ear.position.set(0.74, 1.5, s * 0.08); g.add(ear);
    const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.02, 0.28, 4), hs.plain("#C4A574")); ant.position.set(0.7, 1.62, s * 0.06); ant.rotation.z = s * 0.4; g.add(ant); }
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 5), pale); tail.position.set(-0.72, 0.95, 0); g.add(tail);
  const legs: THREE.Object3D[] = [];
  [[0.28, 0.18], [0.28, -0.18], [-0.32, 0.18], [-0.32, -0.18]].forEach(([lx, lz], n) => { const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.045, 0.7, 5), hide); leg.position.set(lx, 0.38, lz); leg.name = "leg" + n; g.add(leg); legs.push(leg); });
  const x = 22, z = H / 2 + 18; g.position.set(x, 0, z); hs.deer = { g, x, z, tx: x - 6, tz: z, wait: 1.5, legs }; hs.scene.add(g);
}

export function buildRoadWorld(hs: any) {
  const road = new THREE.Mesh(new THREE.PlaneGeometry(220, 6.4), new THREE.MeshStandardMaterial({ color: "#5d5a62", roughness: 1 })); road.rotation.x = -Math.PI / 2; road.position.set(0, -0.005, OUTSIDE.roadY - H / 2); road.receiveShadow = true; hs.scene.add(road);
  for (let x = -100; x < 100; x += 4) { const d = new THREE.Mesh(new THREE.PlaneGeometry(2, 0.14), new THREE.MeshBasicMaterial({ color: "#F8D977" })); d.rotation.x = -Math.PI / 2; d.position.set(x, 0.002, OUTSIDE.roadY - H / 2 - 1.4); hs.scene.add(d); }
  for (let i = 0; i < 7; i++) { const z = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 6.2), new THREE.MeshBasicMaterial({ color: "#F4EEE0" })); z.rotation.x = -Math.PI / 2; z.position.set(-3 + i * 1.0, 0.003, OUTSIDE.roadY - H / 2); hs.scene.add(z); }
  const walk = new THREE.Mesh(new THREE.PlaneGeometry(60, 4.2), hs.std(hs.rep("stoneW", () => T.stoneTex(), 14, 1))); walk.rotation.x = -Math.PI / 2; walk.position.set(0, -0.012, H / 2 + 3.0); hs.scene.add(walk);
  const sideZ = OUTSIDE.roadY - H / 2 - 4.4;
  const side = new THREE.Mesh(new THREE.PlaneGeometry(170, 3.6), hs.std(hs.rep("stoneS", () => T.stoneTex(), 20, 1))); side.rotation.x = -Math.PI / 2; side.position.set(-16, -0.011, sideZ); side.receiveShadow = true; hs.scene.add(side);
}
