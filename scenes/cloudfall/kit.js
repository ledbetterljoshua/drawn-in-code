/* kit.js — what every part of Cloudfall shares: the one camera everything is built to, the one
   sun, the material palettes, plane matrices for drawing flat things onto walls and roofs, the
   leafy clump, the frog, and the particle pool.

   The camera is orthographic and looks down 18° across the island. Plan coordinates are X (right)
   and Z (toward the viewer), Y is up, all in artboard units; CF.pr(X, Y, Z) puts a point on the
   artboard. A wall, a roof or a pond surface is a plane: CF.plane(origin, u, v) is the matrix from
   flat (s, t) drawing coordinates on that plane to the artboard, and CF.on(M, path) carries a path
   across while keeping line widths even. Draw windows, stones and tiles flat, then put them on. */
(() => {
const D = Drawn;
const { clamp, lerp } = D;
const CF = (window.CF = { D });

// ------------------------------------------------------------------ camera
const CAM = (CF.CAM = { cx: 900, cy: 606, S: 0.31, C: 0.951, HZ: 312 });
CF.pr = (X, Y = 0, Z = 0) => [CAM.cx + X, CAM.cy + Z * CAM.S - Y * CAM.C];
const vec = (v) => [v[0], v[2] * CAM.S - v[1] * CAM.C];
CF.plane = (o, u, v) => {
  const [ex, ey] = CF.pr(o[0], o[1], o[2]), [a, b] = vec(u), [c, d] = vec(v);
  return new DOMMatrix([a, b, c, d, ex, ey]);
};
CF.on = (M, p) => { const q = new Path2D(); q.addPath(p, M); return q; };
CF.at = (M, x, y) => [M.a * x + M.c * y + M.e, M.b * x + M.d * y + M.f];
// a vertical wall from plan point A to plan point B (left to right as we see it), base at height
// y0, h tall: (s, t) with s along the wall from A and t measured DOWN from the top edge
CF.wall = (A, B, y0, h, lean = 0) => {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]), u = [(B[0] - A[0]) / L, 0, (B[1] - A[1]) / L];
  const M = CF.plane([A[0] + lean * h, y0 + h, A[1]], u, [-lean, -1, 0]);
  M.len = L; M.h = h; M.n = [-u[2], 0, u[0]];
  return M;
};
// a gradient along a plane: endpoints in (s, t)
CF.pgrad = (g, M, s0, t0, s1, t1, list) => D.grad(g, ...CF.at(M, s0, t0), ...CF.at(M, s1, t1), list);

// ------------------------------------------------------------------ the sun
// low on the right and a little in front of us, so the right-facing walls catch it and the
// shadows run back and to the left
const norm = (v) => { const l = Math.hypot(...v); return v.map((x) => x / l); };
const LIGHT = (CF.LIGHT = norm([0.88, 0.4, 0.22]));
CF.norm = norm;
CF.dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
CF.cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
// brightness 0..1 of a surface with normal n: direct sun plus a little sky from above
CF.lit = (n) => { n = norm(n); return clamp(0.1 + 0.9 * Math.max(0, CF.dot(n, LIGHT)) + 0.12 * Math.max(0, n[1]), 0, 1); };
// where a point at height Y casts its shadow on the ground (plan): back and to the left
CF.SH = [-1.2, -0.26];
CF.shadowOf = (X, Y, Z) => [X + CF.SH[0] * Y, Z + CF.SH[1] * Y];
CF.SHADOW = '#7d72c2'; // multiplied over whatever it falls on: a cool violet shade, never grey
CF.casters = []; // functions returning 3D points whose shadows the ground layer draws

// ------------------------------------------------------------------ colour
const hx = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const h2 = (n) => Math.round(clamp(n, 0, 255)).toString(16).padStart(2, '0');
CF.mix = (a, b, t) => { const A = hx(a), B = hx(b); return '#' + h2(lerp(A[0], B[0], t)) + h2(lerp(A[1], B[1], t)) + h2(lerp(A[2], B[2], t)); };
CF.rgba = (c, a) => { const A = hx(c); return `rgba(${A[0]},${A[1]},${A[2]},${a})`; };
// a material lit to brightness b: shade (cool) → base → lit (warm); shadows shift hue, not just value
CF.tone = (m, b) => (b < 0.5 ? CF.mix(m.shade, m.base, b * 2) : CF.mix(m.base, m.lit, (b - 0.5) * 2));
CF.jit = (c, r, amt) => CF.mix(c, r() < 0.5 ? '#2a1830' : '#fff4dc', r() * amt);

CF.M = {
  rock: { shade: '#30264f', base: '#87505e', lit: '#ffb878', line: '#24152c', bounce: '#c9808a' },
  rockFar: { shade: '#8c84ad', base: '#b39cb4', lit: '#e8c0a8', line: '#7a6a90' },
  soil: { shade: '#3b2532', base: '#61403a', lit: '#8d5e44', line: '#2c1a28' },
  grass: { shade: '#477a5a', base: '#7cad57', lit: '#c9df7a', line: '#2b4632' },
  stone: { shade: '#7b6f98', base: '#c2a993', lit: '#f8dcb4', line: '#4a3247' },
  plaster: { shade: '#a698bd', base: '#e7d3b8', lit: '#fff0d2', line: '#5b3a40' },
  timber: { shade: '#4c3044', base: '#87503a', lit: '#cf8a52', line: '#341a22' },
  tile: { shade: '#6e3048', base: '#b5503f', lit: '#f59060', line: '#431a26' },
  slate: { shade: '#36406c', base: '#4f709c', lit: '#94bfd2', line: '#222a4a' },
  boards: { shade: '#3f5a6e', base: '#5d8f86', lit: '#a9d3a2', line: '#24343f' },
  brick: { shade: '#6a3a55', base: '#a8563f', lit: '#ec8b5a', line: '#3e1a26' },
  canvas: { shade: '#8e3f3e', base: '#c8653e', lit: '#f6a562', line: '#4a1e24' },
  leaf: { shade: '#2d5a55', base: '#55904f', lit: '#a7cf67', line: '#1f362e' },
  leafWarm: { shade: '#3b6550', base: '#6d9e4c', lit: '#c6db6e', line: '#24392c' },
  bark: { shade: '#3f2c45', base: '#76503f', lit: '#c08a5c', line: '#2d1a26' },
  water: { shade: '#3e6f9a', base: '#6fb0c8', lit: '#cdeef0', line: '#28425e' },
  metal: { shade: '#3c3650', base: '#6b6480', lit: '#b8acc0', line: '#241e34' },
};
const LINE = (CF.LINE = D.style.line = '#3a2232');

// ------------------------------------------------------------------ geometry
CF.hull = (pts) => {
  const p = pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const x = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [], hi = [];
  for (const q of p) { while (lo.length > 1 && x(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
  for (const q of p.slice().reverse()) { while (hi.length > 1 && x(hi[hi.length - 2], hi[hi.length - 1], q) <= 0) hi.pop(); hi.push(q); }
  return lo.slice(0, -1).concat(hi.slice(0, -1));
};
// a wobbly closed outline through points, for organic things (seeded)
CF.wobble = (pts, r, amt) => pts.map(([x, y]) => [x + (r() - 0.5) * amt, y + (r() - 0.5) * amt]);
// a path of a cast shadow on the ground: footprint plus the shadows of its top points
CF.castPath = (pts3) => {
  const flat = [];
  for (const [X, Y, Z] of pts3) { flat.push(CF.pr(X, 0, Z)); if (Y > 0) { const [sx, sz] = CF.shadowOf(X, Y, Z); flat.push(CF.pr(sx, 0, sz)); } }
  return D.poly(CF.hull(flat));
};
CF.multiply = (g, path, color = CF.SHADOW, a = 1) => {
  g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.fillStyle = color; g.fill(path); g.restore();
};

// ------------------------------------------------------------------ solids
const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
CF.add3 = (a, b, k = 1) => [a[0] + b[0] * k, a[1] + b[1] * k, a[2] + b[2] * k];
CF.VIEW = [0, CAM.S, CAM.C]; // toward the camera
CF.P3 = (pts) => D.poly(pts.map((p) => CF.pr(...p)));
// the normal of a 3D polygon, turned to face us; .back when it was facing away
CF.nrm3 = (pts) => { let n = norm(CF.cross(sub(pts[1], pts[0]), sub(pts[pts.length - 1], pts[0]))); if (CF.dot(n, CF.VIEW) < 0) n = n.map((x) => -x); return n; };
// a flat 3D face filled with its material lit by its own normal (or n if given); returns brightness
CF.face3 = (g, pts, mat, lw = 1.8, n) => { const b = CF.lit(n || CF.nrm3(pts)); D.ink(g, CF.P3(pts), CF.tone(mat, b), lw, mat.line); return b; };
// the plane through 3D points o, a, b: s runs from o toward a, t from o toward b (both in units)
CF.quadM = (o, a, b) => {
  const u = sub(a, o), v = sub(b, o), ul = Math.hypot(...u), vl = Math.hypot(...v);
  const M = CF.plane(o, u.map((x) => x / ul), v.map((x) => x / vl)); M.w = ul; M.h = vl; return M;
};
// a vertical cylinder's side, shaded round its curve; returns the path
CF.cylinder = (g, X, Z, r, y0, y1, mat, lw = 2) => {
  const [cx, cyb] = CF.pr(X, y0, Z), [, cyt] = CF.pr(X, y1, Z), ry = r * CAM.S;
  const p = new Path2D();
  p.moveTo(cx - r, cyt); p.lineTo(cx - r, cyb); p.ellipse(cx, cyb, r, ry, 0, Math.PI, 0, true); p.lineTo(cx + r, cyt); p.ellipse(cx, cyt, r, ry, 0, 0, Math.PI, false); p.closePath();
  const gr = g.createLinearGradient(cx - r, 0, cx + r, 0);
  for (let i = 0; i <= 8; i++) { const a = Math.acos(clamp(-1 + i / 4, -1, 1)); gr.addColorStop(i / 8, CF.tone(mat, CF.lit([Math.cos(a), 0, Math.sin(a)]))); }
  D.ink(g, p, gr, lw, mat.line);
  return p;
};
// x on the artboard of the point at angle a round a cylinder (a = π/2 faces us)
CF.cylAt = (X, Y, Z, r, a) => CF.pr(X + Math.cos(a) * r, Y, Z + Math.sin(a) * r);
// the tangent plane of a cylinder at angle a: s across (to the right as we see it), t down from Y
CF.cylM = (X, Y, Z, r, a) => CF.plane([X + Math.cos(a) * r, Y, Z + Math.sin(a) * r], [Math.sin(a), 0, -Math.cos(a)], [0, -1, 0]);

// ------------------------------------------------------------------ leafy clumps
// a circle with a scalloped, leafy edge (seeded so each clump keeps its shape)
function scallop(x, y, r, seed, p = new Path2D()) {
  const n = Math.max(7, Math.round((r * D.TAU) / 11)), ph = D.hash(seed) * D.TAU;
  for (let i = 0; i <= n; i++) {
    const a0 = ph + ((i - 1) / n) * D.TAU, a1 = ph + (i / n) * D.TAU, am = (a0 + a1) / 2;
    const rr = r * (0.94 + 0.08 * D.hash(seed * 3 + i));
    const x1 = x + Math.cos(a1) * rr, y1 = y + Math.sin(a1) * rr;
    if (i === 0) p.moveTo(x1, y1);
    else p.quadraticCurveTo(x + Math.cos(am) * r * 1.16, y + Math.sin(am) * r * 1.16, x1, y1);
  }
  p.closePath();
  return p;
}
CF.scallop = scallop;
// foliage from [x, y, r] clumps, lit from the upper right; lower clumps sit in front. col is a
// material (shade, base, lit, line); k darkens the whole mass (0..1) for clumps deeper in shadow
CF.leafy = (g, clumps, col, o = {}) => {
  const U = new Path2D();
  clumps.forEach(([x, y, r], i) => scallop(x, y, r, i * 7.3 + (o.seed || 0), U));
  g.lineWidth = (o.lw || 2.2) * 2; g.strokeStyle = col.line; g.stroke(U);
  const sorted = clumps.map((c, i) => [...c, i]).sort((a, b) => a[1] + a[2] * 0.4 - (b[1] + b[2] * 0.4));
  for (const [x, y, r, i] of sorted) {
    const s = i * 7.3 + (o.seed || 0), c = scallop(x, y, r, s);
    const dark = o.dark ? o.dark(x, y) : 0;
    g.fillStyle = CF.mix(col.shade, '#20203a', dark * 0.35); g.fill(c);
    g.save(); g.clip(c);
    g.fillStyle = CF.mix(col.base, col.shade, dark * 0.6); g.fill(scallop(x + r * 0.14, y - r * 0.16, r * 0.9, s + 1));
    if (dark < 0.75) { g.fillStyle = CF.mix(col.lit, col.base, dark); g.fill(scallop(x + r * 0.36, y - r * 0.36, r * 0.6, s + 2)); }
    // leaf marks: little cupped strokes across the lit side
    g.lineWidth = 1.1; g.strokeStyle = CF.rgba(col.line, 0.28);
    for (let k = 0; k < 4; k++) {
      const a = -0.9 + D.hash(s + k * 5) * 1.6, d = r * (0.25 + 0.5 * D.hash(s + k * 9));
      const lx = x + Math.cos(a) * d, ly = y + Math.sin(a) * d * 0.8;
      g.beginPath(); g.arc(lx, ly, 3.4, 0.2, Math.PI - 0.2); g.stroke();
    }
    g.restore();
    // the seam where this clump overlaps the ones behind: a thin line on its shaded lower left
    g.lineWidth = 1.2; g.strokeStyle = CF.rgba(col.line, 0.55);
    g.beginPath(); g.arc(x, y, r * 1.02, Math.PI * 0.55, Math.PI * 1.0); g.stroke();
  }
};

// ------------------------------------------------------------------ frogs
const FROG = (CF.FROG = { base: '#86c75a', shade: '#4f8f54', light: '#c9ea86', belly: '#eef3b4', cheek: '#f39aa0', line: '#2f3a28' });
CF.FROG_TINTS = {
  moss: FROG,
  olive: { base: '#a6be55', shade: '#6d8a3f', light: '#dcea8a', belly: '#f3efb8', cheek: '#f3a08a', line: '#36381f' },
  teal: { base: '#6cc0a0', shade: '#3f8a7f', light: '#b8ecc4', belly: '#e9f6cf', cheek: '#f4a0a8', line: '#233a36' },
  gold: { base: '#d9c65a', shade: '#9e8c3c', light: '#f6ec98', belly: '#fbf3c8', cheek: '#f39a8a', line: '#3e3420' },
};
// a little sitting frog, feet at (x, y). o: c (tint), open (eyes 0..1), look [-1..1, -1..1],
// smile, sleep, flip, rot, squash, arms / armsBack: [[hx, hy, sx?, sy?]] in frog space, hat
CF.frog = function frog(g, x, y, s = 1, o = {}) {
  const c = o.c || FROG, open = o.open == null ? 1 : o.open, lk = o.look || [0, 0], ln = c.line || LINE;
  g.save();
  g.translate(x, y);
  if (o.rot) g.rotate(o.rot);
  g.scale(s * (o.flip ? -1 : 1) * (o.wide || 1), s * (o.squash || 1) * (o.tall || 1));
  const lw = 1.9 / s;
  if (o.armsBack) for (const a of o.armsBack) frogArm(g, a, c, lw);
  const parts = [D.ell(0, -13, 21, 14), D.ell(-10, -26.5, 8.5, 8), D.ell(10, -26.5, 8.5, 8)];
  g.lineWidth = lw * 2; g.strokeStyle = ln;
  for (const p of parts) g.stroke(p);
  // lit from the right: the shade side is cooler, and a warm rim catches the right edge
  const lx = o.flip ? -1 : 1;
  g.fillStyle = D.grad(g, -21 * lx, 0, 21 * lx, 0, [c.shade, c.base, c.light]);
  for (const p of parts) g.fill(p);
  g.save(); g.clip(parts[0]);
  g.fillStyle = 'rgba(40,40,90,0.18)'; g.fill(D.ell(0, -1, 24, 7));
  g.restore();
  g.fillStyle = c.belly; g.fill(D.ell(0, -7.5, 12, 6.5));
  D.ink(g, D.ell(-13, -1, 6.5, 3), c.base, lw, ln);
  D.ink(g, D.ell(13, -1, 6.5, 3), c.base, lw, ln);
  g.globalAlpha = 0.8; g.fillStyle = c.cheek;
  g.fill(D.ell(-13.5, -16, 3.8, 2.3)); g.fill(D.ell(13.5, -16, 3.8, 2.3));
  g.globalAlpha = 1;
  for (const ex of [-10, 10]) {
    if (o.sleep || open < 0.25) {
      g.beginPath(); g.moveTo(ex - 4.5, -27); g.quadraticCurveTo(ex, -23.5, ex + 4.5, -27);
      g.lineWidth = lw; g.strokeStyle = ln; g.stroke();
    } else {
      g.save(); g.translate(ex, -27.5); g.scale(1, open);
      D.ink(g, D.ell(0, 0, 5.6, 5.8), '#fffdf3', lw * 0.8, ln);
      g.fillStyle = '#2a1c26'; g.fill(D.ell(lk[0] * 2, lk[1] * 2 + 0.4, 3, 3.3));
      g.fillStyle = '#fff'; g.fill(D.circ(lk[0] * 2 + 1.1, lk[1] * 2 - 0.9, 1.05));
      g.restore();
    }
  }
  const sm = o.smile == null ? 2.2 : o.smile;
  g.beginPath(); g.moveTo(-5.5, -19.5); g.quadraticCurveTo(0, -19.5 + sm * 1.6, 5.5, -19.5);
  g.lineWidth = lw; g.strokeStyle = ln; g.stroke();
  if (o.hat) o.hat(g, lw);
  if (o.arms) for (const a of o.arms) frogArm(g, a, c, lw);
  g.restore();
};
function frogArm(g, [hx, hy, sx = hx < 0 ? -13 : 13, sy = -11], c, lw) {
  const p = D.seg(sx, sy, hx, hy);
  g.lineCap = 'round';
  g.lineWidth = 5 + lw * 2; g.strokeStyle = c.line || LINE; g.stroke(p);
  g.lineWidth = 5; g.strokeStyle = c.base; g.stroke(p);
  D.ink(g, D.circ(hx, hy, 3.4), c.base, lw, c.line || LINE);
}
// the soft dark patch under anything that rests on something
CF.contact = (g, x, y, rx, ry, a = 0.35) => {
  g.save(); g.globalCompositeOperation = 'multiply';
  g.fillStyle = D.radial(g, x, y, 0, rx, [[0, `rgba(70,50,110,${a})`], [0.6, `rgba(90,70,130,${a * 0.5})`], [1, 'rgba(120,100,150,0)']]);
  g.save(); g.translate(x, y); g.scale(1, ry / rx); g.translate(-x, -y); g.fill(D.circ(x, y, rx)); g.restore();
  g.restore();
};

// ------------------------------------------------------------------ particles
// one shared event everyone turns to look at (set by whoever's having it): { x, y, k 0..1 }
CF.attn = { x: 0, y: 0, k: 0 };
CF.lookAt = (x, y, base, s = 200) => { const a = CF.attn; if (a.k < 0.01) return base; const l = [D.clamp((a.x - x) / s, -1, 1), D.clamp((a.y - y) / s, -1, 1)]; return [D.lerp(base[0], l[0], a.k), D.lerp(base[1], l[1], a.k)]; };
CF.fx = [];
CF.spawn = (p) => CF.fx.push(Object.assign({ age: 0, life: 2, vx: 0, vy: 0, rot: 0, vr: 0, size: 1, g: 0 }, p));
CF.heartPath = (g, x, y, s) => {
  g.beginPath();
  g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.5, y - s * 1.05, x, y - s * 0.45);
  g.bezierCurveTo(x + s * 0.5, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  g.closePath();
};
// a warm additive glow (lamps, windows)
CF.glow = (g, x, y, r, color, a) => {
  if (a <= 0.001) return;
  g.save(); g.globalCompositeOperation = 'lighter';
  g.fillStyle = D.radial(g, x, y, 0, r, [[0, CF.rgba(color, a)], [0.45, CF.rgba(color, a * 0.35)], [1, CF.rgba(color, 0)]]);
  g.fill(D.circ(x, y, r));
  g.restore();
};
})();
