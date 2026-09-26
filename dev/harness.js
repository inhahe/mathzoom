// Runs index.html's script in Node against a recording fake canvas, so the
// layout, camera and level-of-detail maths can be checked without a browser.
//
//   node dev/harness.js <t> [width] [height] [--levels] [--iter N]
//
//   <t>        time in seconds (as in index.html?t=)
//   --levels   print every level's aspect ratio (it must repeat with period 2)
//   --iter N   render N times, like ?bench (checks the caches are reused)
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const script = read('index.html').match(/<script>\s*"use strict";([\s\S]*?)<\/script>/)[1];
const argv = process.argv.slice(2);
const flag = k => argv.includes(k);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const pos = argv.filter((a, i) => !a.startsWith('--') && !(i > 0 && argv[i - 1] === '--iter'));
const t = parseFloat(pos[0] || '0');
const W = parseInt(pos[1] || '1600'), H = parseInt(pos[2] || '900');
const ITER = parseInt(opt('--iter', '1'));

let fills = 0, images = [], cacheFills = 0, surfaces = 0, maxScale = 0;
function makeCtx(canvas, screen) {
  let cur = [1, 0, 0, 1, 0, 0];
  const rec = () => {
    if (!screen) { cacheFills++; return; }
    fills++;
    maxScale = Math.max(maxScale, Math.abs(cur[0]));
  };
  return {
    canvas,
    setTransform(a, b, c, d, e, f) { cur = [a, b, c, d, e, f]; },
    transform() {}, translate() {}, fillRect: rec, fill: rec, stroke: rec,
    drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh) { if (screen) images.push(Math.max(dw, dh)); },
    set fillStyle(v) {}, get fillStyle() { return '#000'; },
    set strokeStyle(v) {}, get strokeStyle() { return '#000'; },
    set lineWidth(v) {}, set lineCap(v) {},
  };
}
const screen = { width: W, height: H, addEventListener() {} };
screen.getContext = () => makeCtx(screen, true);
const sandbox = {
  console, Math, Map, Path2D: function () {}, performance: { now: () => 0 },
  location: { search: '?t=' + t }, URLSearchParams,
  innerWidth: W, innerHeight: H, devicePixelRatio: 1,
  addEventListener() {}, requestAnimationFrame() {}, setTimeout() {},
  document: {
    title: '',
    getElementById: id => (id === 'hud' ? { set textContent(v) {} } : screen),
    createElement: () => { surfaces++; const cv = { width: 0, height: 0 }; cv.getContext = () => makeCtx(cv, false); return cv; },
  },
};
sandbox.window = sandbox;
vm.createContext(sandbox);
vm.runInContext(read('glyphs.js'), sandbox);
vm.runInContext(read('braces.js'), sandbox);
vm.runInContext(script + `
  ;globalThis.__dbg = { LEVELS, C, PERIOD_LOG, H_SCALE, cam,
     go(n) { ctx = document.getElementById('c').getContext('2d'); resize();
             let d = 0; for (let i = 0; i < n; i++) { setView(${t}); render(); d = drawn; } return d; } };`, sandbox);

const D = sandbox.__dbg;
const nodes = D.go(ITER);
console.log(`t=${t}  ${W}x${H}  camera level K=${D.cam.K}, its height ${D.cam.h.toFixed(1)} px`);
console.log(`period zoom factor ${Math.exp(D.PERIOD_LOG).toFixed(4)} (ln ${D.PERIOD_LOG.toFixed(4)}),  H-level font scale ${D.H_SCALE.toFixed(5)}`);
console.log(`last render: ${nodes} nodes;  over ${ITER} render(s): ${fills} vector fills, ${images.length} bitmaps, ` +
            `${surfaces} cache bitmaps built (${cacheFills} fills), largest transform scale ${maxScale.toFixed(1)}`);
if (images.length) console.log(`bitmap sizes ${Math.min(...images).toFixed(1)}..${Math.max(...images).toFixed(1)} px`);
if (flag('--levels')) {
  const A = D.LEVELS.map(L => L.a);
  A.forEach((a, n) => {
    const ref = n >= 2 ? A[n - 2] : NaN;
    console.log(`  L${n} a=${a.toFixed(12)}` + (n >= 2 ? `  vs L${n - 2}: ${(Math.abs(a - ref) / ref).toExponential(1)}` : ''));
  });
}
