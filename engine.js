// mathzoom engine: an ever-accelerating zoom out of a self-similar formula for a
// huge number. It starts on the end of the formula and speeds up geometrically for
// ever — until a click. Then the number gets its outermost level, the next one up
// that can be shown whole, and the zoom stops there on the finished number.
//
// Each page calls mathzoom(notation) with:
//   base      the level-0 glyph (a tower, an arrow run, a chain, an empty bracket)
//   grammar   'braces'   — columns joined by underbraces, rows by right braces,
//                          each showing first, second, an ellipsis, last, and a seed;
//             'brackets' — each level a bracket around three copies of the level
//                          below (a row in [ ], a column between ⎴ and ⎵)
//   span      optional [x0, x1] (pt, in the base glyph) that a level-1 underbrace
//             spans — the arrow run, as in Graham's diagram. Default: all of it.
//   top       'H' (the finished number is a row) or 'V' (a column)
//   label     the seed's size relative to the level's type (default 0.7)
//   sub       optional, brackets only: every bracket also carries a subscript,
//             a copy of the level below at this scale, hung off its closing
//             bracket; it says what kind of fold the bracket is (Veblen's
//             hierarchy: see design.md)
//   key       optional glyph shown at the start: what the notation means
//   keySize   the key's height as a fraction of the screen's (default 0.2)
//   cx, cy    optional default screen position of the zoom centre
//   settle    let the proportions settle over the first levels instead of
//             forcing level 2 into the base's exact shape (see "Exact
//             self-similarity" below)
// See design.md for the whole design.
function mathzoom(NOTE) {
"use strict";

// ============================================================================
// Settings. All overridable from the URL, e.g. ?v0=0.3&grow=1.2
// ============================================================================
const Q = new URLSearchParams(location.search);
// In the test modes (?t= / ?bench) surface any error in the title, where a
// headless browser's --dump-dom can see it.
if (Q.has('t') || Q.has('bench'))
  window.onerror = (msg, src, line, col) => { document.title = `ERROR ${msg} @${line}:${col}`; };
const num = (k, d) => (Q.has(k) ? parseFloat(Q.get(k)) : d);

// Glyphs, braces and bracket proportions: TeX outlines and measurements from
// tex/glyphs.py, tex/braces.py and tex/metrics.py.
const G = window.GLYPHS, B = window.BRACES, M = window.METRICS;
const BASE = NOTE.base, SEED = G.seed, CDOTS = G.cdots, VDOTS = G.vdots;
const BRACKETS = NOTE.grammar === 'brackets';
const SUB = BRACKETS && NOTE.sub ? NOTE.sub : 0;  // a subscript's scale, or none
const TOP_ODD = NOTE.top === 'V';
const SETTLE = !!NOTE.settle;

const CFG = {
  // Each level is typeset at one "font size" f, proportional to its children's
  // short side. The default makes level 1 exactly TeX's own 10pt setting around
  // a natural-size base.
  font: num('font', 1 / BASE.h),
  label: num('label', NOTE.label !== undefined ? NOTE.label : 0.7),  // seed vs f
  // Speed in levels per second: v0 * grow^t, for ever — after the click too,
  // until it reaches the level where it stops.
  v0: num('v0', 0.12),
  grow: num('grow', 1.10),
  cx: num('cx', NOTE.cx !== undefined ? NOTE.cx : 0.62),   // screen position of
  cy: num('cy', NOTE.cy !== undefined ? NOTE.cy : 0.60),   // the zoom centre
  t: Q.has('t') ? parseFloat(Q.get('t')) : null,              // test: freeze at time t
  click: Q.has('click') ? parseFloat(Q.get('click')) : null,  // test: clicked at this time
};

// ============================================================================
// Drawing glyphs, braces and brackets
// ============================================================================
const pcache = new Map();
const path = d => { let p = pcache.get(d); if (!p) pcache.set(d, p = new Path2D(d)); return p; };
let ctx, DPR = 1;

// Draw glyph g with its ink box's top-left at screen (x,y), uniformly scaled by s.
function glyph(g, x, y, s) {
  for (const pt of g.parts) {
    const m = pt.m;
    ctx.setTransform(DPR * s, 0, 0, DPR * s, DPR * x, DPR * y);
    ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
    if (pt.sw) { ctx.lineWidth = pt.sw; ctx.stroke(path(pt.d)); }
    else ctx.fill(path(pt.d));
  }
}

// ---- Extensible braces, built the way TeX builds them ----------------------
// Fixed-size curved pieces (TeX's own) at font scale f, joined by a straight
// spine that stretches to any length. The spine is TeX's rule thickness (1.196pt
// at 10pt), so stroke weight follows the level's text size. A level Z^2 larger
// has pieces Z^2 larger AND a spine Z^2 longer — an exact scaled copy.
function piece(p, x, y, f, dx, dy) {
  const m = p.m;
  ctx.setTransform(DPR * f, 0, 0, DPR * f, DPR * x, DPR * y);
  ctx.translate(dx, dy);
  ctx.transform(m[0], m[1], m[2], m[3], m[4], m[5]);
  ctx.fill(path(p.d));
}
function spine(x, y, f, x0, y0, x1, y1) {
  if (x1 <= x0 || y1 <= y0) return;             // pieces already touch: no run needed
  ctx.setTransform(DPR * f, 0, 0, DPR * f, DPR * x, DPR * y);
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
}
const OV = 0.6;                                  // pt the spine tucks under each piece
// Right brace: ink top-left at (x,y), height len, font scale f (all screen px).
function rbrace(x, y, len, f) {
  const R = B.rbrace, D = len / f - R.L;         // extra length vs the reference brace
  const [s0, s1] = R.spine;
  spine(x, y, f, s0, R.topY[1] - OV, s1, R.midY[0] + D / 2 + OV);
  spine(x, y, f, s0, R.midY[1] + D / 2 - OV, s1, R.botY[0] + D + OV);
  piece(R.top, x, y, f, 0, 0);
  piece(R.mid, x, y, f, 0, D / 2);
  piece(R.bot, x, y, f, 0, D);
}
// Underbrace: ink top-left at (x,y), width len, font scale f.
function ubrace(x, y, len, f) {
  const U = B.ubrace, D = len / f - U.L;
  const [s0, s1] = U.spine;
  spine(x, y, f, U.leftX[1] - OV, s0, U.midX[0] + D / 2 + OV, s1);
  spine(x, y, f, U.midX[1] + D / 2 - OV, s0, U.rightX[0] + D + OV, s1);
  piece(U.left, x, y, f, 0, 0);
  piece(U.midL, x, y, f, D / 2, 0);
  piece(U.midR, x, y, f, D / 2, 0);
  piece(U.right, x, y, f, D, 0);
}
// ---- Square brackets, in TeX's proportions ---------------------------------
// A stem and two serifs, measured from TeX's large bracket (tex/metrics.py), at
// font scale f and any length. 'L' is [, 'R' is ]; 'T' and 'B' are the same
// bracket turned, opening downward and upward — the top and bottom brackets that
// close a column. The box: (x,y) top-left, length len along the stem, depth
// (serif length) across it.
function sqbracket(side, x, y, len, f) {
  const t = M.bracket.stem * f, d = M.bracket.serif * f, ts = M.bracket.serifT * f;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (side === 'L' || side === 'R') {
    const sx = side === 'L' ? x : x + d - t;
    ctx.fillRect(sx, y, t, len);
    ctx.fillRect(x, y, d, ts);
    ctx.fillRect(x, y + len - ts, d, ts);
  } else {
    const sy = side === 'T' ? y : y + d - t;
    ctx.fillRect(x, sy, len, t);
    ctx.fillRect(x, y, ts, d);
    ctx.fillRect(x + len - ts, y, ts, d);
  }
}

// ============================================================================
// Layout. Each level is stored NORMALISED: its height is 1 and it has aspect a
// (width = a). Children are {x,y,s}: top-left (x,y), height s. Decorations have
// an id and are glyphs {t:'g',g,x,y,s}, braces {t:'r'|'u',x,y,len,f} or brackets
// {t:'b',side,x,y,len,f}. Normalising every level keeps every number O(1) however
// deep the zoom goes.
// ============================================================================

// Build a level from its child's size (aspect ca, height 1), in child units,
// then normalise. opts.outer builds the finished number's outermost level, which
// differs from an ordinary one (see the grammars); a decoration the other version
// lacks is kept with `gone: true` (zero size, where it vanishes to or appears
// from), so the two can be blended while the zoom arrives. opts.span is the
// level-1 underbrace span, in child units.
function buildLevel(kind, ca, opts = {}) {
  return BRACKETS ? bracketLevel(kind, ca, opts) : braceLevel(kind, ca, opts);
}

// The font scale of a level: proportional to its child's short side, so level 1
// is TeX's natural setting and each level's type suits what it encloses. A row's
// brace spans its child's height; below BRACE_MIN pt at its own font, TeX's brace
// pieces would overlap into a squat bar, so a row's font is capped there (wide
// bases — an arrow run, a chain — make short, wide columns). Likewise a column's
// underbraces must span at least UBRACE_MIN pt (see braceLevel). HS then scales
// rows' type down where equal growth needs it (see below).
const BRACE_MIN = 44, UBRACE_MIN = 24;
function fontOf(kind, cw, ch) {
  const f = CFG.font * Math.min(cw, ch);
  if (kind === 'V') return f;
  return (BRACKETS ? f : Math.min(f, ch / BRACE_MIN)) * HS;
}

// ---- 'braces': columns with underbraces, rows with right braces -------------
// Column: each child sits on an underbrace that gives its count (a tower's
// height, an arrow count, a chain's length, a row's length), the one below it
// being its value; `⋮` stands for the rest; the last one's count is the seed.
// Row: `c } c } ⋯ } c } 10` — each child's count is what its brace points at.
// The outermost level has no ellipsis: every other ellipsis stands for a count
// that the bracket around it sets, and the outermost level has none around it.
function braceLevel(kind, ca, { outer = false, span = null } = {}) {
  const cw = ca, ch = 1;
  const kids = [], decos = [];
  const bx = span ? span[0] : 0, bl = span ? span[1] - span[0] : cw;   // a column's underbraces
  const f = kind === 'V' ? Math.min(fontOf('V', cw, ch), bl / UBRACE_MIN) : fontOf('H', cw, ch);
  const lf = f * CFG.label;                      // seed label scale
  if (kind === 'V') {
    const k3 = 3 * f;                            // TeX's \underbrace kern (3pt)
    const ubH = B.ubrace.h * f;
    const mid = bx + bl / 2;                     // braces, dots and seed centre here
    let y = 0;
    const child = () => { kids.push({ x: 0, y, s: ch }); y += ch; };
    const brace = id => { y += k3; decos.push({ id, t: 'u', x: bx, y, len: bl, f }); y += ubH; };
    child(); brace('u0'); y += k3;
    child(); brace('u1'); y += k3;
    if (!outer) {
      decos.push({ id: 'dots', t: 'g', g: VDOTS, x: mid - VDOTS.w * f / 2, y, s: f });
      y += VDOTS.h * f + k3;
    } else decos.push({ id: 'dots', t: 'g', g: VDOTS, x: mid, y, s: 0, gone: true });
    const last = kids.length; child(); brace('u2');
    y += k3;
    decos.push({ id: 'seed', t: 'g', g: SEED, x: mid - SEED.w * lf / 2, y, s: lf });
    y += SEED.h * lf;
    return finish(cw, y, kids, decos, last);
  }
  const gA = 1.5 * f, gB = 3 * f;
  const rbW = B.rbrace.w * f;
  const mid = h => (ch - h) / 2;                 // centre on the brace tip
  let x = 0;
  const child = () => { kids.push({ x, y: 0, s: ch }); x += cw; };
  const brace = id => { x += gA; decos.push({ id, t: 'r', x, y: 0, len: ch, f }); x += rbW; };
  child(); brace('r0'); x += gB;
  child(); brace('r1'); x += gB;
  if (!outer) {
    x += PAD / 2;                                // equal growth's spare width, if any,
    decos.push({ id: 'dots', t: 'g', g: CDOTS, x, y: mid(CDOTS.h * f), s: f });
    x += CDOTS.w * f + gB + PAD / 2;             // goes around the `⋯`: more columns here
    brace('r2'); x += gB;
  } else {
    decos.push({ id: 'dots', t: 'g', g: CDOTS, x, y: ch / 2, s: 0, gone: true });
    decos.push({ id: 'r2', t: 'r', x, y: 0, len: ch, f: 0, gone: true });
  }
  const last = kids.length; child(); brace('r3');
  x += gA;
  decos.push({ id: 'seed', t: 'g', g: SEED, x, y: mid(SEED.h * lf), s: lf });
  x += SEED.w * lf;
  return finish(x, ch, kids, decos, last);
}

// ---- 'brackets': a bracket around three copies of the level below -----------
// A row sits in [ ]; a column between a top and a bottom bracket (the same
// bracket turned). Every copy is drawn — no ellipsis — so the finished picture
// is exact. The outermost level is followed by the seed: the picture applied
// to 10.
//
// With NOTE.sub every bracket also has a subscript: a fourth copy of the level
// below, SUB times the size of the other three. A row's hangs at its lower right,
// bottom-aligned with the brackets (as in `]_x`); a column's is centred under its
// bottom bracket. Either way it adds to the level only along the direction the
// level grows in — a row stays exactly as tall as its children, a column exactly
// as wide — so equal growth still works as below, the subscript counting as SUB
// of a copy on both sides. The zoom centre stays in the last full-size copy.
function bracketLevel(kind, ca, { outer = false } = {}) {
  const cw = ca, ch = 1;
  const kids = [], decos = [];
  const f = fontOf(kind, cw, ch);
  const bd = M.bracket.serif * f;                // a bracket's depth
  const g1 = 1.5 * f, g2 = 3 * f;                // bracket to content; between copies
  if (kind === 'V') {
    let y = 0;
    decos.push({ id: 'open', t: 'b', side: 'T', x: 0, y, len: cw, f }); y += bd + g1;
    const child = () => { kids.push({ x: 0, y, s: ch }); y += ch; };
    child(); y += g2; child(); y += g2;
    const last = kids.length; child(); y += g1;
    decos.push({ id: 'close', t: 'b', side: 'B', x: 0, y, len: cw, f }); y += bd;
    if (SUB) { y += g1; kids.push({ x: cw * (1 - SUB) / 2, y, s: SUB * ch }); y += SUB * ch; }
    return finish(cw, y, kids, decos, last);
  }
  let x = 0;
  decos.push({ id: 'open', t: 'b', side: 'L', x, y: 0, len: ch, f }); x += bd + g1;
  const child = () => { kids.push({ x, y: 0, s: ch }); x += cw; };
  child(); x += g2 + PAD / 2; child(); x += g2 + PAD / 2;
  const last = kids.length; child(); x += g1;
  decos.push({ id: 'close', t: 'b', side: 'R', x, y: 0, len: ch, f }); x += bd;
  if (SUB) { x += g1; kids.push({ x, y: ch * (1 - SUB), s: SUB * ch }); x += SUB * cw; }
  const sf = f * CFG.label;
  if (outer) {
    x += g2;
    decos.push({ id: 'seed', t: 'g', g: SEED, x, y: (ch - SEED.h * sf) / 2, s: sf });
    x += SEED.w * sf;
  } else decos.push({ id: 'seed', t: 'g', g: SEED, x, y: ch / 2, s: 0, gone: true });
  return finish(x, ch, kids, decos, last);
}

function finish(W, H, kids, decos, last) {
  const k = 1 / H;
  return {
    a: W / H,
    kids: kids.map(c => ({ x: c.x * k, y: c.y * k, s: c.s * k })),
    decos: decos.map(d => {
      const e = { ...d, x: d.x * k, y: d.y * k };
      if (d.s !== undefined) e.s = d.s * k;
      if (d.f !== undefined) e.f = d.f * k;
      if (d.len !== undefined) e.len = d.len * k;
      return e;
    }),
    last,
  };
}

// ---- Exact self-similarity --------------------------------------------------
// A column is (3 + Dv) child-heights tall; a row is (3 + Dh) child-widths wide,
// Dv and Dh being its decorations in the same units. Over two levels the aspect
// ratio is multiplied by (3 + Dh) / (3 + Dv), so unless Dv == Dh it drifts for
// ever and the picture never repeats. So rows are made exactly as much wider
// than their children as columns are taller: if a row's decorations come out too
// wide, its type is scaled down (HS < 1, as on the towers page); if too narrow
// (a capped brace font), the spare width PAD goes around the row's ellipsis.
// Then level 2 has exactly the base's aspect ratio, level 3 is laid out exactly
// like level 1, and the whole structure is periodic with period 2 from the very
// start. Measured with trial levels built from the base's actual proportions, so
// it tracks the notation and ?font / ?label.
//
// A settling notation (NOTE.settle) does neither. With the type caps above, a
// row's decorations are sized by its children's height rather than their width,
// so a row that is too narrow for its column gets relatively wider decorations
// next time round, and vice versa: the aspect ratio converges geometrically to a
// fixed shape, whatever the base (about 2.2 : 1 rows). The first few levels have
// their own proportions; from about level 12 the structure is periodic to many
// digits, and exactly (in doubles) well before the table ends at NMAX.
let HS = 1, PAD = 0;
const K_V = (() => { const v = buildLevel('V', BASE.w / BASE.h); return 1 / v.kids[v.last].s; })();
if (!SETTLE) {
  const a1 = BASE.w / BASE.h / K_V;              // a column's aspect ratio
  const n = 3 + SUB;                             // copies per level (a subscript is SUB
                                                 // of one — a copy, not type: HS can't shrink it)
  const d1 = buildLevel('H', a1).a - n * a1;     // a row's decorations, as is
  const dt = (K_V - n) * a1;                     // what equal growth needs
  if (d1 > dt) HS = dt / d1; else PAD = dt - d1;
}

// Level 0 is the base glyph itself. Levels then alternate V, H, V, H, ...
// Level 1's underbraces may span only part of the base (the arrow run).
const A0 = BASE.w / BASE.h;
const SPAN = NOTE.span ? [NOTE.span[0] / BASE.h, NOTE.span[1] / BASE.h] : null;
const LEVELS = [{ a: A0, kids: [], last: -1,
                  decos: [{ id: 'base', t: 'g', g: BASE, x: 0, y: 0, s: 1 / BASE.h }] }];
const NMAX = 64;                                 // zoom centre long converged (design.md)
for (let n = 1; n <= NMAX; n++)
  LEVELS.push(buildLevel(n % 2 ? 'V' : 'H', LEVELS[n - 1].a, n === 1 ? { span: SPAN } : {}));
// Beyond NMAX the layout is periodic with period 2: reuse the level of matching
// parity. (Not `NMAX - ((NMAX - n) % 2)`: JS `%` of a negative number is
// negative, which yields NMAX+1 and runs off the end of the table.)
const par = n => (n <= NMAX ? n : ((n - NMAX) % 2 === 0 ? NMAX : NMAX - 1));
const lvl = n => LEVELS[par(n)];

// Zoom centre. It lives in the LAST child at every level (next to the seed —
// the end of the formula). C[n] is its position in level n's normalised box.
// Level 1 fixes it: the middle of the last base and everything below it, centred
// on the base (or on its braced span).
const C = [];
{
  const L1 = LEVELS[1], lk = L1.kids[L1.last];
  const bx = SPAN ? (SPAN[0] + SPAN[1]) / 2 : A0 / 2;
  C[1] = { x: lk.x + lk.s * bx, y: (lk.y + 1) / 2 };
  for (let n = 2; n <= NMAX; n++) {
    const L = LEVELS[n], k = L.kids[L.last];
    C[n] = { x: k.x + k.s * C[n - 1].x, y: k.y + k.s * C[n - 1].y };
  }
}
const cen = n => C[par(n)];
// Height ratio level n / level n-1. A row is no taller than its children (they
// sit side by side), so it is 1 there.
const grow = n => 1 / lvl(n).kids[lvl(n).last].s;
// Log-heights of the even levels, relative to level 2: exact through the table,
// periodic after it. In an exact notation every period grows by the same factor
// and this is a straight line; in a settling one the first periods differ.
// lhe(x) continues it linearly between even levels; lheInv inverts it.
const LHE = [];
LHE[2] = 0;
for (let n = 4; n <= NMAX; n += 2) LHE[n] = LHE[n - 2] + Math.log(grow(n - 1) * grow(n));
const PERIOD_LOG = Math.log(grow(NMAX - 1) * grow(NMAX));   // ln(zoom per period), for good
const FIRST_LOG = LHE[4];                                   // the first period's
function lhe(x) {
  if (x >= NMAX) return LHE[NMAX] + (x - NMAX) / 2 * PERIOD_LOG;
  if (x < 2) return (x - 2) / 2 * FIRST_LOG;
  const k = 2 * Math.floor(x / 2);
  return LHE[k] + (x - k) / 2 * (LHE[k + 2] - LHE[k]);
}
function lheInv(v) {
  if (v >= LHE[NMAX]) return NMAX + 2 * (v - LHE[NMAX]) / PERIOD_LOG;
  if (v < 0) return 2 + 2 * v / FIRST_LOG;
  let k = 2;
  while (LHE[k + 2] <= v) k += 2;
  return k + 2 * (v - LHE[k]) / (LHE[k + 2] - LHE[k]);
}

// ---- The finished number's outermost level -----------------------------------
// Until the click the level that becomes the outermost one was an ordinary
// level, so rather than jump it changes while the zoom arrives: at w = 0 it is
// the ordinary level, at w = 1 the outermost one. Children and decorations are
// matched by position and id and blended; one that only one version has shrinks
// and fades out of (or grows and fades into) the place its `gone` twin marks.
// The pair of layouts is cached per top level: in an exact notation it is the
// same for every top of a kind, in a settling one once the shape has settled.
const outers = new Map();
function outerFor(N) {
  const p = par(N);
  let o = outers.get(p);
  if (!o) {
    const out = buildLevel(p % 2 ? 'V' : 'H', LEVELS[par(N - 1)].a, { outer: true });
    o = { ref: LEVELS[p], out, byId: new Map(out.decos.map(d => [d.id, d])) };
    outers.set(p, o);
  }
  return o;
}
const N_INF = TOP_ODD ? NMAX - 1 : NMAX;         // a top whose shape has long settled
const OUTER = outerFor(N_INF).out;
const lerp = (a, b, w) => a + (b - a) * w;
function outerLevel(w, N) {
  const { ref, out, byId } = outerFor(N);
  const kids = ref.kids.map((k, i) => {
    const o = out.kids[i];
    return { x: lerp(k.x, o.x, w), y: lerp(k.y, o.y, w), s: lerp(k.s, o.s, w) };
  });
  const decos = ref.decos.map(d => {
    const o = byId.get(d.id), e = { ...d };
    for (const p of ['x', 'y', 's', 'f', 'len']) if (d[p] !== undefined) e[p] = lerp(d[p], o[p], w);
    const alpha = lerp(d.gone ? 0 : 1, o.gone ? 0 : 1, w);
    delete e.gone;
    if (alpha < 1) e.alpha = alpha;
    return e;
  });
  const k = kids[ref.last], c = cen(N - 1);
  return { a: lerp(ref.a, out.a, w), kids, decos, last: ref.last,
           C: { x: k.x + k.s * c.x, y: k.y + k.s * c.y } };     // the zoom centre in it
}

// ============================================================================
// Drawing levels
// ============================================================================
let VW = 0, VH = 0, drawn = 0;
const MIN_PX = 0.8;                              // stop recursing below this size
const MIN_DECO = 0.35;                           // skip decorations smaller than this

// ---- Level-of-detail cache --------------------------------------------------
// A node smaller than CACHE_PX on screen holds thousands of descendants that are
// all near or below pixel size; redrawing them as vectors every frame is what
// makes the deep zoom slow. Instead such a node is drawn as ONE bitmap. The bitmap
// is rendered once, by this same vector code, at the next half-octave size at or
// above the node's size — so it is what the vectors would have drawn, downscaled by
// at most 1/sqrt(2). The layout is periodic, and the bases — the only thing that
// tells level n from level n+2 — are sub-pixel inside any bitmap of a level
// >= LOD_LEVEL, so two bitmap families serve the whole infinite tail; each
// earlier level gets its own.
const CACHE_PX = 96;                             // CSS px; nodes this big stay vectors
// Bases are ~6^-5 of a node at level 10; a settling notation's shape has also
// settled (to ~10^-5) by level 16.
const LOD_LEVEL = SETTLE ? 16 : 10;
const lodKey = n => (n < LOD_LEVEL ? n : LOD_LEVEL + ((n - LOD_LEVEL) % 2));
const caches = new Map();
let building = false;
// Bitmap of level n whose longest side is 2^(k/2) device px. Rendered on an
// OffscreenCanvas and frozen into an immutable ImageBitmap (a plain <canvas>
// where OffscreenCanvas is missing).
function cached(n, k) {
  const key = lodKey(n), id = key * 64 + k;
  let c = caches.get(id);
  if (c) return c;
  const L = LEVELS[key];
  const h = Math.pow(2, k / 2) / Math.max(L.a, 1), w = L.a * h;
  const cw = Math.max(1, Math.ceil(w)), chh = Math.max(1, Math.ceil(h));
  let cv;
  if (typeof OffscreenCanvas !== 'undefined') cv = new OffscreenCanvas(cw, chh);
  else { cv = document.createElement('canvas'); cv.width = cw; cv.height = chh; }
  const saved = [ctx, VW, VH, DPR];
  ctx = cv.getContext('2d'); VW = cw; VH = chh; DPR = 1;
  ctx.fillStyle = ctx.strokeStyle = '#000'; ctx.lineCap = 'butt';
  building = true;
  try { drawLevel(key, 0, 0, h); }
  finally { building = false; [ctx, VW, VH, DPR] = saved; }
  const img = cv.transferToImageBitmap ? cv.transferToImageBitmap() : cv;
  caches.set(id, c = { img, w, h });
  return c;
}

function drawLevel(n, X, Y, H) {
  const isTop = !building && n === cam.top;
  const L = isTop ? cam.outer : lvl(n), W = L.a * H;
  if (X > VW || Y > VH || X + W < 0 || Y + H < 0) return;   // off-screen
  if (W < MIN_PX && H < MIN_PX) return;                    // sub-pixel
  drawn++;
  const S = Math.max(W, H);
  if (!building && !isTop && S < CACHE_PX) {
    const c = cached(n, Math.max(2, Math.ceil(2 * Math.log2(S * DPR))));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(c.img, 0, 0, c.w, c.h, X * DPR, Y * DPR, W * DPR, H * DPR);
    return;
  }
  for (const d of L.decos) {
    if (d.gone) continue;                        // exists only for the outermost level
    if (d.alpha !== undefined) {                 // the outermost level changing
      if (d.alpha < 0.004) continue;
      ctx.globalAlpha = d.alpha;
    }
    const x = X + d.x * H, y = Y + d.y * H;
    if (d.t === 'g') { if (d.s * H * 6 > MIN_DECO) glyph(d.g, x, y, d.s * H); }
    else if (d.f * H * 6 > MIN_DECO) {
      if (d.t === 'b') sqbracket(d.side, x, y, d.len * H, d.f * H);
      else (d.t === 'r' ? rbrace : ubrace)(x, y, d.len * H, d.f * H);
    }
    ctx.globalAlpha = 1;
  }
  if (n > 0) for (const k of L.kids) drawLevel(n - 1, X + k.x * H, Y + k.y * H, k.s * H);
}

// ============================================================================
// Camera
// ============================================================================
// A position along the zoom is a "framed level" λ: at λ = N, level N — finished
// as the outermost level — exactly fills the framing box, centred. Even level n's
// screen height at λ is
//   hRef · e^(lhe(n) − lhe(λ))
// so one unit of λ is "one level" (a zoom of e^(PERIOD_LOG/2) once the shape has
// settled). hRef frames a settled top; hFit(N) is top N's own framing height,
// which lamEnd(N) turns into the exact position where the zoom stops. (When the
// finished number is a column, an odd level, hRef is set so that λ = N still
// frames a settled one.)
const FIT_W = 0.92, FIT_H = 0.84;                // framing box, fraction of the viewport
const hFit = (N = N_INF) => Math.min(VH * FIT_H, VW * FIT_W / outerFor(N).out.a);
// For an odd top N: at λ = N, even level N−1 is hRef·e^(−P/2) tall and N is
// grow(N) times that, which must be hFit.
const hRef = () => hFit() * (TOP_ODD ? Math.exp(PERIOD_LOG / 2) / grow(N_INF) : 1);
function lamEnd(N) {
  const target = N % 2 ? hFit(N) / grow(N) : hFit(N);   // of level N, or N−1 below an odd N
  return lheInv(lhe(N % 2 ? N - 1 : N) - Math.log(target / hRef()));
}
// The start: level 1's last base and everything below it (its underbrace and
// the seed) fill 70% of the screen height — or 90% of its width, if the base is
// that wide. That fixes level 1's height, and so level 2's.
function lamStart() {
  const L1 = LEVELS[1], lk = L1.kids[L1.last];
  const h1 = Math.min(VH * 0.7 / (1 - lk.y), VW * 0.9 / L1.a);
  return lheInv(-Math.log(h1 * grow(2) / hRef()));
}
// The layout repeats every 2 levels, and from level LAM_W up nothing below level
// ~LAM_W−30 is ever visible, so there only λ mod 2 matters: positions are shifted
// down by an even amount to keep every index small. Returns [λ', shift].
const LAM_W = 100;
function wrap(lam) {
  if (lam < LAM_W) return [lam, 0];
  const s = 2 * Math.floor((lam - LAM_W) / 2);
  return [lam - s, s];
}

// The camera: position λ (wrapped); reference level K (even) and its screen
// height h; the zoom centre's screen position (px, py); the top level, above
// which there is nothing (Infinity until the click), and its layout `outer`.
// All level numbers here are wrapped.
const cam = { lam: 0, K: 2, h: 1, px: 0, py: 0, top: Infinity, outer: null, root: 2 };
function setCamera(lam, top, px, py, outer = null) {
  cam.lam = lam;
  cam.K = Math.max(2, 2 * Math.ceil(lam / 2));
  cam.h = hRef() * Math.exp(lhe(cam.K) - lhe(lam));
  // Above the top (an odd top; or a top framed a little further out, while the
  // shape settles): step down to it — there is nothing above it.
  while (cam.K > top) { cam.h /= grow(cam.K); cam.K -= 1; }
  cam.px = px; cam.py = py; cam.top = top; cam.outer = outer;
}
const layoutOf = n => (n === cam.top ? cam.outer : lvl(n));
const centreOf = n => (n === cam.top ? cam.outer.C : cen(n));
// The smallest level (at most the top) whose box covers the viewport; everything
// visible lies inside it.
function coverLevel() {
  let n = cam.K, h = cam.h;
  for (let i = 0; i < 400 && n < cam.top; i++) {
    const c = centreOf(n), a = layoutOf(n).a;
    const X = cam.px - c.x * h, Y = cam.py - c.y * h;
    if (X <= 0 && Y <= 0 && X + a * h >= VW && Y + h >= VH) break;
    n++; h *= grow(n);
  }
  return [n, h];
}
function render() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = ctx.strokeStyle = '#000';
  ctx.lineCap = 'butt';                          // TeX rules have square ends
  const [n, h] = coverLevel();
  cam.root = n;
  const c = centreOf(n);
  drawn = 0;
  drawLevel(n, cam.px - c.x * h, cam.py - c.y * h, h);
  drawKey();
}

// ---- The key -----------------------------------------------------------------
// A notation that isn't standard shows what it means at the start, in standard
// notation rather than words, then fades out as the zoom gets going.
function keyAlpha() {
  if (!NOTE.key || mode !== 'zoom') return 0;
  return Math.min(1, Math.max(0, (11 - clock) / 3));
}
function drawKey() {
  const a = keyAlpha();
  if (a <= 0) return;
  const K = NOTE.key, pad = 14;
  const s = Math.min(VH * (NOTE.keySize || 0.2) / K.h, VW * 0.42 / K.w);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  ctx.globalAlpha = a;
  ctx.fillStyle = '#fff';
  ctx.fillRect(18, 18, K.w * s + 2 * pad, K.h * s + 2 * pad);
  ctx.strokeStyle = '#ccc';
  ctx.lineWidth = 1;
  ctx.strokeRect(18.5, 18.5, K.w * s + 2 * pad - 1, K.h * s + 2 * pad - 1);
  ctx.fillStyle = '#000';
  glyph(K, 18 + pad, 18 + pad, s);
  ctx.globalAlpha = 1;
}

// ============================================================================
// Motion
// ============================================================================
const LG = Math.log(Math.max(1.0001, CFG.grow));
const lnExpm1 = x => (x > 30 ? x + Math.log1p(-Math.exp(-x)) : Math.log(Math.expm1(x)));
// Beyond this many levels a double no longer pins the phase within a period. The
// picture is pure flicker long before that, so from there each frame just shows a
// random phase — which is what any exact phase would look like anyway.
const EXACT = 1e12, LN_EXACT = Math.log(EXACT);

// ---- Before the click --------------------------------------------------------
// Speed v0·grow^t levels/s; distance P(t) = v0·(grow^t − 1)/ln grow. Both in log
// form, so however long it runs nothing overflows.
const lnSpeed = t => Math.log(CFG.v0) + t * LG;
const lnDist = t => Math.log(CFG.v0 / LG) + lnExpm1(Math.max(t, 1e-12) * LG);

// ---- The ending --------------------------------------------------------------
// At the click the number gets its outermost level N: the next level up of the
// finishing kind (a row, or a column) that can be shown whole — the first at or
// above both where we are (plus D_MIN, so the last moves have a little room) and
// everything now on screen. The zoom carries on exactly as before, same
// accelerating speed, and stops dead when level N fills the framing box. On the
// way the zoom centre drifts from (cx, cy) to where centring N puts it, and N
// turns into the outermost level. Going fast, all of that is over by the next
// frame; at the very start it takes a few seconds. The chosen position is the one
// on screen at the click, so in the flicker (where each frame is a random phase)
// it is the frame you clicked on.
const D_MIN = 0.35;
let mode = 'zoom';                // 'zoom' → click → 'ending' → 'done'
let clock = 0;                    // virtual seconds of zooming
let E = null;                     // the ending's state
// The first level of the finishing kind at or above x.
const topAtOrAbove = x => (TOP_ODD ? 2 * Math.ceil((x - 1) / 2) + 1 : 2 * Math.ceil(x / 2));

function startEnding() {
  const lp = lnDist(clock);
  const exact = lp < LN_EXACT;
  // Where we are. In the flicker, keep the frame on screen rather than re-roll —
  // unless none has been shown yet (flicker frames always have λ >= LAM_W).
  if (exact || cam.lam < LAM_W) updateView();
  const [root] = coverLevel();
  let N = topAtOrAbove(Math.max(cam.lam + D_MIN, root));     // wrapped, like cam.lam
  while (lamEnd(N) < cam.lam + D_MIN) N += 2;               // (a top framed nearer in)
  const end = lamEnd(N);                                    // = N once shapes have settled
  E = {
    N, end, D: end - cam.lam, R: end - cam.lam, tau: 0, lnv: lnSpeed(clock),
    // For the HUD: the true level numbers are the wrapped ones plus `shift`;
    // when astronomical, only their logarithm (the distance come) is kept.
    shift: exact ? wrap(lamStart() + Math.exp(lp))[1] : null, lnN: lp,
  };
  mode = 'ending';
  paused = false;                 // a click while paused means "show me the end"
  dirty = true;
}

function stepEnding(dt) {
  E.tau += dt;
  // Distance covered since the click at the unchanged law: v·(grow^τ − 1)/ln grow,
  // v being the speed at the click (in logs: v may be astronomical).
  const lnCovered = E.lnv + lnExpm1(E.tau * LG) - Math.log(LG);
  if (lnCovered >= Math.log(E.D)) finishEnding();
  else E.R = E.D - Math.exp(lnCovered);
}
function finishEnding() { E.R = 0; mode = 'done'; dirty = true; }

// ---- The view for the current state --------------------------------------------
// Sets the camera and returns the level on show for the HUD, as { v } when it is
// an ordinary number or { ln } (its natural log) when it is astronomical.
const smootherstep = x => x * x * x * (x * (6 * x - 15) + 10);
function updateView() {
  const px0 = VW * CFG.cx, py0 = VH * CFG.cy;
  if (mode === 'zoom') {
    const lp = lnDist(clock);
    if (lp >= LN_EXACT) {
      setCamera(LAM_W + 2 * Math.random(), Infinity, px0, py0);
      return { ln: lp };
    }
    const lam = lamStart() + Math.exp(lp);
    setCamera(wrap(lam)[0], Infinity, px0, py0);
    return { v: lam };
  }
  // Ending / done: λ = end − R, in the wrapped numbering fixed at the click.
  const lam = E.end - E.R;
  const w = smootherstep(Math.min(1, Math.max(0, 1 - E.R / E.D)));
  const outer = outerLevel(w, E.N), hf = hFit(E.N);
  // Drift the zoom centre to where centring the top level puts it.
  const px = px0 + w * (VW / 2 + (outer.C.x - outer.a / 2) * hf - px0);
  const py = py0 + w * (VH / 2 + (outer.C.y - 0.5) * hf - py0);
  setCamera(lam, E.N, px, py, outer);
  if (E.shift === null) return { ln: E.lnN };
  return { v: (mode === 'done' ? E.N : lam) + E.shift };   // finished: its number of levels
}

// ============================================================================
// Head-up display
// ============================================================================
const SUP = '⁰¹²³⁴⁵⁶⁷⁸⁹';
function fmt(shown, whole) {
  if (shown.v !== undefined && Math.abs(shown.v) < 1e6)
    return whole ? Math.round(shown.v).toLocaleString('en-US') : shown.v.toFixed(2);
  const ln = shown.ln !== undefined ? shown.ln : Math.log(shown.v);
  const e10 = ln / Math.LN10, ex = Math.floor(e10);
  let m = Math.pow(10, e10 - ex);
  let mant = m.toFixed(2);
  if (mant === '10.00') { mant = '1.00'; return `${mant}×10${String(ex + 1).replace(/\d/g, d => SUP[d])}`; }
  return `${mant}×10${String(ex).replace(/\d/g, d => SUP[d])}`;
}
function hud(shown) {
  let s;
  if (mode === 'done') s = `level ${fmt(shown, true)} — the whole number · click to start again`;
  else s = `level ${fmt(shown, false)}` + (paused ? ' · paused (space)' : '') +
           (mode === 'zoom' && clock < 8 ? ' · click to end it' : '');
  document.getElementById('hud').textContent = s;
}

// ============================================================================
// Main loop
// ============================================================================
// Setting a canvas's size clears it, so this is only ever called right before a
// redraw (never from a bare 'resize' event, which would blank the picture until
// the next frame).
function resize() {
  DPR = window.devicePixelRatio || 1;
  VW = innerWidth; VH = innerHeight;
  ctx.canvas.width = Math.round(VW * DPR);
  ctx.canvas.height = Math.round(VH * DPR);
}
// Window resized, or moved to a screen with a different pixel density.
const sizeChanged = () =>
  innerWidth !== VW || innerHeight !== VH || (window.devicePixelRatio || 1) !== DPR;

function advance(dt) {
  if (mode === 'zoom') clock += dt;
  else if (mode === 'ending') stepEnding(dt);
}
function restart() { mode = 'zoom'; clock = 0; E = null; paused = false; dirty = true; }

// Time runs on a virtual clock that advances by whole display frames of a steady
// length (the median frame interval), not by the jittery wall clock. At speeds of
// thousands of levels per second the picture is a stroboscope, and only exactly
// even steps make it settle into the clean still / backward / forward beats.
// A frame that took several intervals advances several; a hidden tab, whose
// frames stop, simply pauses.
let paused = false, lastNow = null, Tref = 1 / 60;
let dirty = true;                 // redraw even though nothing is moving
const deltas = [];
function frame(now) {
  requestAnimationFrame(frame);
  // The viewport can still be 0x0 when the page first loads, and a 0-height view
  // makes log(VH) = -Infinity. Track the live size every frame and skip frames
  // until there is something to draw into.
  if (sizeChanged()) { resize(); dirty = true; }
  if (VW < 2 || VH < 2) return;
  const moving = !paused && mode !== 'done';
  if (lastNow !== null) {
    const d = (now - lastNow) / 1000;
    if (d > 0 && d < 0.25) {
      deltas.push(d);
      if (deltas.length > 61) deltas.shift();
      if (deltas.length >= 5) Tref = [...deltas].sort((a, b) => a - b)[deltas.length >> 1];
    }
    if (moving) advance(Math.min(4, Math.max(1, Math.round(d / Tref))) * Tref);
  }
  lastNow = now;
  // A still picture (paused, or the finished number) is drawn once, not 60 times
  // a second — and a paused flicker frame stays put instead of re-rolling.
  if (!moving && !dirty) return;
  dirty = false;
  const shown = updateView();
  render();
  hud(shown);
}

// ?t=N (&click=C): draw the state at virtual time N — clicked at time C if given —
// and redraw it whenever the window is resized (testing). Polls with setTimeout,
// not requestAnimationFrame: a headless browser running under a virtual-time
// budget does not reliably deliver animation frames, but it does run timers.
function simulate(t, click) {
  restart();
  if (click === null || t <= click) { clock = Math.max(0, t); return; }
  clock = Math.max(0, click);
  startEnding();
  let left = t - clock;
  while (left > 1e-12 && mode === 'ending') {
    const s = Math.min(1 / 60, left);
    advance(s); left -= s;
  }
}
let benched = false;
function still() {
  if (innerWidth < 2 || innerHeight < 2) { setTimeout(still, 20); return; }
  if (sizeChanged()) resize();
  simulate(CFG.t, CFG.click);
  const shown = updateView();
  render();
  hud(shown);
  if (Q.has('bench') && !benched) { benched = true; bench(); }
}
// ?t=N&bench: time repeated renders of that frame; the result goes in the title.
function bench() {
  const N = 60, t0 = performance.now();
  for (let i = 0; i < N; i++) { updateView(); render(); }
  const ms = (performance.now() - t0) / N;
  document.title = `BENCH ${ms.toFixed(2)} ms/frame, ${drawn} nodes, ${VW}x${VH}`;
}

window.addEventListener('load', () => {
  ctx = document.getElementById('c').getContext('2d');
  // ?embed: a picture inside another page (the hub) — no HUD, no links.
  if (Q.has('embed'))
    for (const id of ['hud', 'hub']) { const el = document.getElementById(id); if (el) el.style.display = 'none'; }
  document.getElementById('c').addEventListener('click', () => {
    if (VW < 2 || VH < 2) return;
    if (mode === 'zoom') startEnding();
    else if (mode === 'done') restart();
  });
  addEventListener('keydown', e => {
    if (e.key === 'r' || e.key === 'R') restart();
    else if (e.key === ' ' || e.key === 'p' || e.key === 'P') { paused = !paused; dirty = true; e.preventDefault(); }
  });
  if (CFG.t !== null) { still(); addEventListener('resize', still); }
  else requestAnimationFrame(frame);
});

// For dev/harness.js: the internals, to check layout, camera and motion in Node.
window.ZOOM = {
  NOTE, LEVELS, OUTER, C, PERIOD_LOG, HS, PAD, K_V, cam, lamStart, hFit, grow,
  get mode() { return mode; }, get E() { return E; }, get clock() { return clock; },
  get drawn() { return drawn; },
  setup(c) { ctx = c; resize(); },
  at(t, click) { simulate(t, click); const s = updateView(); hud(s); return s; },
  frame() { updateView(); render(); return drawn; },
};
}
