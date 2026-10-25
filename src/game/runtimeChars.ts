/** Draws the shared chibi rig into Phaser sprite sheets at runtime, so every seated student and the player's custom avatar get their own look
 *  (the pre-baked PNG sheets only cover 10 students). Frame sizes and baselines match the pipeline: 96x128 iso frames, 192x256 seat-view frames. */
import Phaser from "phaser";
import { drawChar, setOutline } from "../hall3d/rig";
import { AGE_SCALE, type Look } from "../hall3d/characters";
import type { Direction } from "./assets/assetManifest";

const DIRMAP: Record<string, [string, number]> = { down: ["down", 0], down_left: ["down", -1], left: ["left", 0], up_left: ["up", -1], up: ["up", 0], up_right: ["up", 1], right: ["right", 0], down_right: ["down", 1] };
const ALL8: Direction[] = ["down", "down_left", "left", "up_left", "up", "up_right", "right", "down_right"];
const HANG = { R: [8.2, -9.5], L: [-8.2, -9.5] }, LAP = { R: [5, -10], L: [-5, -10] };
function pose(action: string, i: number, n: number): any {
  const t = (2 * Math.PI * i) / n;
  switch (action) {
    case "walk": return { moving: true, walk: t };
    case "sit": case "read": case "think": case "type": return { sitting: true, arms: LAP };
    case "raisehand": { const p = i / Math.max(1, n - 1); return { sitting: true, arms: { R: [8, -10 - p * 24], L: LAP.L } }; }
    case "talk": return { mouth: Math.abs(Math.sin(t * 3)), arms: { R: [10 + Math.sin(t) * 3, -16 + Math.cos(t) * 2.5], L: HANG.L } };
    case "point": return { arms: { R: [12.5, -21 + Math.sin(t) * 0.8], L: HANG.L } };
    case "boardwrite": return { arms: { R: [6 + Math.sin(t * 2) * 3, -32 + Math.cos(t * 2) * 2], L: HANG.L } };
    case "write": return { sitting: true, arms: { R: [4 + Math.sin(t * 2) * 2.4, -10 + Math.cos(t * 2) * 0.8], L: LAP.L } };
    default: return {};
  }
}
interface Spec { action: string; frames: number; fps: number; loop: boolean; dirs: Direction[]; k?: number; prefix?: string }
export const SPECS: Record<string, Spec> = {
  idle: { action: "idle", frames: 4, fps: 3, loop: true, dirs: ALL8 }, walk: { action: "walk", frames: 8, fps: 9, loop: true, dirs: ALL8 },
  // seated characters only ever face up_left (toward the board) - baking all 8 directions froze the page for minutes
  sit: { action: "sit", frames: 4, fps: 3, loop: true, dirs: ["up_left"] },
  write: { action: "write", frames: 6, fps: 6, loop: true, dirs: ["up_left"] }, raisehand: { action: "raisehand", frames: 5, fps: 6, loop: false, dirs: ["up_left"] },
  talk: { action: "talk", frames: 6, fps: 6, loop: true, dirs: ALL8 }, point: { action: "point", frames: 6, fps: 6, loop: true, dirs: ALL8 }, boardwrite: { action: "boardwrite", frames: 8, fps: 8, loop: true, dirs: ALL8 },
  sv_sit: { action: "sit", frames: 4, fps: 3, loop: true, dirs: ["up"], k: 2, prefix: "sv_" }, sv_raisehand: { action: "raisehand", frames: 5, fps: 6, loop: false, dirs: ["up"], k: 2, prefix: "sv_" },
  // teacher seat-view versions (3x)
  svt_idle: { action: "idle", frames: 4, fps: 3, loop: true, dirs: ["down"], k: 3, prefix: "sv_" }, svt_talk: { action: "talk", frames: 6, fps: 6, loop: true, dirs: ["down"], k: 3, prefix: "sv_" },
  svt_point: { action: "point", frames: 6, fps: 6, loop: true, dirs: ["left", "right"], k: 3, prefix: "sv_" }, svt_boardwrite: { action: "boardwrite", frames: 8, fps: 8, loop: true, dirs: ["up"], k: 3, prefix: "sv_" },
};
export function bakeCanvas(look: Look, sp: Spec): HTMLCanvasElement {
  const k = sp.k ?? 1, fw = 96 * k, fh = 128 * k, S = 2.0 * (AGE_SCALE[look.age ?? "hs"] ?? 1) * k;
  const cv = document.createElement("canvas"); cv.width = fw * sp.frames; cv.height = fh * sp.dirs.length; const c = cv.getContext("2d")!;
  sp.dirs.forEach((d, r) => { const [dir, turn] = DIRMAP[d]; for (let f = 0; f < sp.frames; f++) { c.save(); c.translate(f * fw + fw / 2, r * fh + 108 * k); c.scale(S, S); c.shadowColor = "rgba(52,34,46,.28)"; c.shadowBlur = 1.6; c.shadowOffsetY = 1; drawChar(c, 0, 0, { ...look, dir, turn, ...pose(sp.action, f, sp.frames) }, 0); c.restore(); } });
  return cv;
}
/** make `${character}_${name}` (and its direction animations) exist in the scene; returns the texture key */
export function ensureSheet(scene: Phaser.Scene, character: string, look: Look, name: keyof typeof SPECS | string, force = false): string {
  const sp = SPECS[name], key = sp.prefix ? `${sp.prefix}${character}_${sp.action}` : `${character}_${name}`;
  if (scene.textures.exists(key)) { if (!force) return key; scene.textures.remove(key); sp.dirs.forEach((d) => scene.anims.remove(`${key}:${d}`)); }
  const kk = sp.k ?? 1, fw = 96 * kk, fh = 128 * kk, cv = bakeCanvas(look, sp), tex = scene.textures.addCanvas(key, cv)!;
  for (let i = 0; i < sp.frames * sp.dirs.length; i++) tex.add(i, 0, (i % sp.frames) * fw, Math.floor(i / sp.frames) * fh, fw, fh);
  sp.dirs.forEach((d, row) => scene.anims.create({ key: `${key}:${d}`, frames: scene.anims.generateFrameNumbers(key, { start: row * sp.frames, end: row * sp.frames + sp.frames - 1 }), frameRate: sp.fps, repeat: sp.loop ? -1 : 0 }));
  return key;
}

/* ---------------------------------------------------------------- async bake queue
 * The auditorium needs ~170 runtime sheets (player, teachers, 50 unique classmates). Baked synchronously that is minutes of
 * frozen main thread (every frame is drawn with soft shadows, then uploaded through software GL). The queue bakes ONE sheet
 * per frame instead: the page stays alive, the player appears first, and classmates settle in progressively. */
interface BakeJob { scene: Phaser.Scene; character: string; look: Look; name: string; resolve: (key: string) => void }
const BAKE_QUEUE: BakeJob[] = [];
const BAKE_PENDING = new Map<string, { p: Promise<string>; job: BakeJob }>();
let bakePumping = false;
function bakePump() {
  if (bakePumping) return; bakePumping = true;
  const step = () => {
    const job = BAKE_QUEUE.shift();
    if (!job) { bakePumping = false; return; }
    const sp = SPECS[job.name], k = sp.prefix ? `${sp.prefix}${job.character}_${sp.action}` : `${job.character}_${job.name}`;
    try { ensureSheet(job.scene, job.character, job.look, job.name); } finally { BAKE_PENDING.delete(k); }
    job.resolve(k);
    job.scene.time.delayedCall(0, step);           // one sheet per frame: the browser stays responsive
  };
  step();
}
/** Same result as ensureSheet, but baked on the shared one-sheet-per-frame queue; resolves with the texture key.
 *  priority=true jumps the queue - use it for anything the player is waiting on right now (lesson start, teacher, seat view). */
export function ensureSheetQueued(scene: Phaser.Scene, character: string, look: Look, name: keyof typeof SPECS | string, priority = false): Promise<string> {
  const sp = SPECS[name], key = sp.prefix ? `${sp.prefix}${character}_${sp.action}` : `${character}_${name}`;
  if (scene.textures.exists(key)) return Promise.resolve(key);
  const pend = BAKE_PENDING.get(key);
  if (pend) { if (priority) { const i = BAKE_QUEUE.indexOf(pend.job); if (i > 0) { BAKE_QUEUE.splice(i, 1); BAKE_QUEUE.unshift(pend.job); } } return pend.p; }
  let resolve!: (key: string) => void;
  const p = new Promise<string>((res) => { resolve = res; });
  const job: BakeJob = { scene, character, look, name, resolve };
  if (priority) BAKE_QUEUE.unshift(job); else BAKE_QUEUE.push(job);
  BAKE_PENDING.set(key, { p, job });
  bakePump();
  return p;
}
export const setRuntimeOutline = (c: string) => setOutline(c);
