// Runs a zoom page's scripts in Node against a recording fake canvas, so the
// layout, camera, motion and level-of-detail maths can be checked without a
// browser.
//
//   node dev/harness.js <t> [--page towers.html] [--click C] [--size WxH]
//                           [--levels] [--iter N] [--trace a:b:step]
//
//   <t>          time in seconds (as in page.html?t=)
//   --page P     which page (default towers.html)
//   --click C    the viewer clicked at time C (as in page.html?click=)
//   --levels     print every level's aspect ratio (it must repeat with period 2)
//   --iter N     render N times, like ?bench (checks the caches are reused)
//   --trace a:b:s  print the camera and HUD at times a, a+s, ... b
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(k) ? argv[argv.indexOf(k) + 1] : d);
const t = parseFloat(argv[0] || '0');
const page = opt('--page', 'towers.html');
const click = opt('--click', null);
const [W, H] = opt('--size', '1600x900').split('x').map(Number);
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
    set lineWidth(v) {}, set lineCap(v) {}, set globalAlpha(v) {},
  };
}
const screen = { width: W, height: H, addEventListener() {} };
const hudEl = { textContent: '' };
const sandbox = {
  console, Math, Map, Path2D: function () {}, performance: { now: () => 0 },
  location: { search: `?t=${t}` + (click !== null ? `&click=${click}` : '') }, URLSearchParams,
  innerWidth: W, innerHeight: H, devicePixelRatio: 1,
  addEventListener() {}, requestAnimationFrame() {}, setTimeout() {},
  document: {
    title: '',
    getElementById: id => (id === 'hud' ? hudEl : screen),
    createElement: () => { surfaces++; const cv = { width: 0, height: 0 }; cv.getContext = () => makeCtx(cv, false); return cv; },
  },
};
sandbox.window = sandbox;
vm.createContext(sandbox);

// The page's scripts, in order: files first as they appear, then inline code.
const html = read(page);
for (const m of html.matchAll(/<script(?: src="([^"]+)")?>([\s\S]*?)<\/script>/g))
  vm.runInContext(m[1] ? read(m[1]) : m[2], sandbox, { filename: m[1] || page });

const D = sandbox.ZOOM;
D.setup(makeCtx(screen, true));
const C = click === null ? null : parseFloat(click);
console.log(`${page} ${W}x${H}  period zoom ${Math.exp(D.PERIOD_LOG).toFixed(4)}, row font scale ${D.HS.toFixed(5)}, ` +
            `row padding ${D.PAD.toFixed(4)}, ` +
            `base aspect ${D.LEVELS[0].a.toFixed(4)}, start at level ${D.lamStart().toFixed(3)}, ` +
            `finished-number aspect ${D.OUTER.a.toFixed(4)}`);

if (argv.includes('--trace')) {
  const [a, b, s] = opt('--trace', '0:10:1').split(':').map(Number);
  for (let x = a; x <= b + 1e-9; x += s) {
    D.at(x, C);
    const e = D.E, cam = D.cam;
    console.log(`t=${x.toFixed(2).padStart(8)}  ${D.mode.padEnd(6)} K=${String(cam.K).padStart(4)} h=${cam.h.toFixed(0).padStart(6)} ` +
                `top=${String(cam.top).padStart(8)} pivot=(${cam.px.toFixed(0)},${cam.py.toFixed(0)})  ` +
                (e ? `N=${e.N} D=${e.D.toFixed(3)} R=${e.R.toFixed(4)} outer.a=${cam.outer ? cam.outer.a.toFixed(4) : '-'}  ` : '') +
                `| ${hudEl.textContent}`);
  }
  process.exit(0);
}

D.at(t, C);
let nodes = 0;
for (let i = 0; i < ITER; i++) nodes = D.frame();
const cam = D.cam;
console.log(`t=${t}${C !== null ? ` click=${C}` : ''}: mode ${D.mode}, camera level K=${cam.K}, h=${cam.h.toFixed(1)} px, ` +
            `top=${cam.top}, root drawn ${cam.root}, pivot (${cam.px.toFixed(1)}, ${cam.py.toFixed(1)})`);
console.log(`HUD: ${hudEl.textContent}`);
console.log(`last render: ${nodes} nodes; over ${ITER} render(s): ${fills} vector fills, ${images.length} bitmaps, ` +
            `${surfaces} cache bitmaps built (${cacheFills} fills), largest transform scale ${maxScale.toFixed(1)}`);
if (argv.includes('--levels')) {
  const A = D.LEVELS.map(L => L.a);
  A.forEach((a, n) => {
    if (n > 12 && n < A.length - 2) return;
    const ref = n >= 2 ? A[n - 2] : NaN;
    console.log(`  L${n} a=${a.toFixed(12)}` + (n >= 2 ? `  vs L${n - 2}: ${(Math.abs(a - ref) / ref).toExponential(1)}` : ''));
  });
}
