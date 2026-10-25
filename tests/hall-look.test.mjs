import fs from "node:fs";
import assert from "node:assert/strict";

const read = (p) => fs.readFileSync(p, "utf8");
const look = read("look.js");
const hallHtml = read("hallway3d.html");
const scene = read("src/hall3d/HallScene.ts");
const campus = read("src/hall3d/campus.ts");
const build = read("tools/build_netlify.py");
const bundle = read("demo/dist/hall3d.js");

assert.match(look, /var LOOK = "pixar"/, "campus look is the movie build");
assert.match(hallHtml, /src="look\.js"/, "hallway loads the look before the scene");
assert.match(hallHtml, /html\[data-look="pixar"\] #paper/, "paper overlay is hidden in the movie look");
assert.match(scene, /const pix = !!this\.px/, "paper sprites stay off when the movie look is on");
assert.doesNotMatch(scene, /#D7F4FF/, "upstairs is no longer a cyan loft");
assert.match(scene, /plaster/, "the second floor has a ceiling under it");
assert.match(campus, /x: 34, y: 46/, "columns frame the main hall");
assert.match(build, /"look\.js"/, "the movie look script is published");
assert.match(hallHtml, /hall3d\.js\?v=40/, "the page asks for the new hall bundle");
assert.match(bundle, /efe6d6|f3efe6/i, "the built hall includes the stone upstairs");
assert.match(campus, /COMP_LAB/, "the computer lab has a room upstairs");
assert.match(campus, /ART_STUDIO/, "the art studio has a room upstairs");
assert.match(scene, /COMPUTER LAB/, "the computer lab gets a hanging sign");
assert.match(scene, /ART STUDIO/, "the art studio gets a hanging sign");
assert.match(scene, /onLab/, "walking into the lab opens its activity");
assert.match(scene, /onArt/, "walking into the studio opens its activity");
assert.match(bundle, /Computer Lab/, "the built hall includes the computer lab");
assert.match(bundle, /Art Studio/, "the built hall includes the art studio");

console.log("hall look tests passed");
