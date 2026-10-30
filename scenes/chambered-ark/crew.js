/* crew.js — the rigs for everyone aboard: hermit crabs, crabs, an octopus, shrimp, seahorses, a snail,
   a nudibranch, a squid, a pufferfish and gobies. Each is drawn in its own local space around its
   feet (0, 0), facing right, about 50 units tall at s = 1, so a room can place it on its floor,
   flip it and scale it. Options shared by all: blink (1 open → 0 shut), look [-1..1, -1..1], and a
   few poses of their own. Line weight scales down with size but never below a hairline. */
(() => {
const { TAU, clamp, lerp, circ, ell, curve, poly, seg } = Drawn;
const A = window.ARK, LINE = A.LINE;
const crew = (A.crew = {});

function ink(g, path, fill, lw) {
  if (fill) { g.fillStyle = fill; g.fill(path); }
  if (lw) { g.lineWidth = lw; g.strokeStyle = LINE; g.stroke(path); }
}
crew.ink = ink;
// a tapering limb along a polyline: width w0 at the root, w1 at the tip, inked
function limb(g, pts, w0, w1, fill, lw, shade) {
  const L = [], R = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
    const dx = b[0] - a[0], dy = b[1] - a[1], d = Math.hypot(dx, dy) || 1;
    const w = lerp(w0, w1, i / (pts.length - 1)) / 2;
    L.push([pts[i][0] - (dy / d) * w, pts[i][1] + (dx / d) * w]);
    R.push([pts[i][0] + (dy / d) * w, pts[i][1] - (dx / d) * w]);
  }
  const p = curve([...L, ...R.reverse()], true);
  ink(g, p, fill, lw);
  if (shade) {
    g.save(); g.clip(p);
    g.globalAlpha = 0.45; g.lineWidth = w0 * 0.4; g.strokeStyle = shade;
    const q = curve(L.map(([x, y], i) => [lerp(x, pts[i][0], 0.35), lerp(y, pts[i][1], 0.35)]), false);
    g.stroke(q); g.restore();
  }
  return p;
}
crew.limb = limb;
// a curl of points: from (x, y) heading a, length len, curling by `curl` radians along it
function curl(x, y, a, len, curlBy, n = 8, wob = 0) {
  const pts = [[x, y]];
  const step = len / n;
  for (let i = 1; i <= n; i++) {
    a += (curlBy / n) * (0.6 + 0.8 * (i / n)) + wob * Math.sin(i * 1.3);
    x += Math.cos(a) * step; y += Math.sin(a) * step;
    pts.push([x, y]);
  }
  return pts;
}
crew.curl = curl;

// an eye: white, iris, pupil, glint and a lid that comes down from above
function eye(g, x, y, r, o = {}) {
  const open = o.blink == null ? 1 : o.blink, lk = o.look || [0, 0], lw = o.lw || 1;
  if (open < 0.2) {
    g.beginPath(); g.moveTo(x - r, y); g.quadraticCurveTo(x, y + r * 0.6, x + r, y);
    g.lineWidth = lw; g.strokeStyle = LINE; g.stroke();
    return;
  }
  const W = ell(x, y, r, r * (o.tall || 1.05));
  ink(g, W, o.white || '#fffaf0', lw);
  g.save(); g.clip(W);
  const px = x + lk[0] * r * 0.42, py = y + lk[1] * r * 0.4;
  g.fillStyle = o.iris || LINE; g.fill(ell(px, py, r * (o.pupil || 0.6), r * (o.pupil || 0.6) * 1.05));
  if (o.iris) { g.fillStyle = LINE; g.fill(circ(px, py, r * 0.32)); }
  g.fillStyle = '#fff'; g.fill(circ(px + r * 0.22, py - r * 0.26, r * 0.22));
  if (open < 1) { g.fillStyle = o.lid || '#c66'; g.fillRect(x - r * 1.2, y - r * 1.3, r * 2.4, r * 2.3 * (1 - open)); }
  if (o.sleepy) { g.fillStyle = o.lid || '#c66'; g.fillRect(x - r * 1.2, y - r * 1.3, r * 2.4, r * 1.1 * o.sleepy); }
  g.restore();
}
crew.eye = eye;
const lwFor = (s, base = 1.6) => Math.max(0.7, base) / s;

// ------------------------------------------------------------------ hermit crab
// in a borrowed shell; o.shell: shell palette, o.claw: 0..1 raise the big claw, o.wave, o.hat
const HERMIT = { body: '#e8643f', shade: '#b8432f', lit: '#ff9a68', leg: '#d9573a', shell: '#f2e2c4', shellSh: '#c4ac93', stripe: '#a75437' };
crew.hermit = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, HERMIT, o.c || {}), lw = lwFor(s);
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
  const bob = o.bob || 0;
  // walking legs
  for (const [lx, ph] of [[-2, 0], [6, 1.4], [12, 2.6]]) {
    const k = Math.sin((o.walk || 0) + ph) * 2;
    limb(g, [[lx, -12 + bob], [lx + 6 + k, -16 + bob], [lx + 10 + k, -3], [lx + 12 + k, 0]], 4, 2.2, c.leg, lw);
  }
  // the shell: a little spiral, stripes on its whorl
  g.save(); g.translate(-12, -22 + bob); g.rotate(-0.3 + (o.shellRot || 0));
  const S = ell(0, 0, 19, 17);
  ink(g, S, c.shell, lw * 1.2);
  g.save(); g.clip(S);
  g.fillStyle = c.shellSh; g.fill(ell(4, 7, 19, 12));
  g.strokeStyle = c.stripe; g.lineWidth = 2.6;
  for (let i = 0; i < 6; i++) { const a = -2.4 + i * 0.62; g.beginPath(); g.moveTo(Math.cos(a) * 6, Math.sin(a) * 6); g.lineTo(Math.cos(a + 0.25) * 19, Math.sin(a + 0.25) * 19); g.stroke(); }
  g.restore();
  g.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.28, r = 1 + i * 0.32; i ? g.lineTo(Math.cos(a) * r - 2, Math.sin(a) * r - 1) : g.moveTo(-2, -1); }
  g.lineWidth = lw; g.strokeStyle = LINE; g.stroke();
  g.restore();
  // head and front body
  const B = ell(8, -18 + bob, 11, 9);
  ink(g, B, c.body, lw);
  g.save(); g.clip(B); g.fillStyle = c.shade; g.fill(ell(6, -12 + bob, 12, 6)); g.fillStyle = c.lit; g.fill(ell(11, -23 + bob, 6, 3)); g.restore();
  // eye stalks
  const bl = o.blink == null ? 1 : o.blink, lk = o.look || [0.3, 0];
  for (const [ex, ey] of [[10, -34], [16, -32]]) {
    const sx = ex + (o.stalk || 0) * 2;
    A.line(g, ex - 2, -24 + bob, sx, ey + bob, 2.8 + lw * 2, LINE); A.line(g, ex - 2, -24 + bob, sx, ey + bob, 2.6, c.body);
    eye(g, sx, ey + bob, 3.6, { blink: bl, look: lk, lw: lw * 0.8, lid: c.body, pupil: 0.62 });
  }
  // antennae
  A.stroke(g, [[17, -26 + bob], [26, -40 + bob + Math.sin(o.ant || 0) * 2], [33, -44 + bob]], lw * 0.8);
  // claws: small one low, big one raised by o.claw
  const cl = o.claw || 0;
  limb(g, [[14, -15 + bob], [20, -12 + bob], [24, -9 + bob]], 4, 3, c.leg, lw);
  ink(g, ell(26, -9 + bob, 4.5, 3.5, undefined, 0.3), c.body, lw);
  const ca = -0.2 - cl * 1.1;
  const hx = 18 + Math.cos(ca) * 12, hy = -20 + bob + Math.sin(ca) * 12;
  limb(g, [[12, -20 + bob], [16, -22 + bob], [hx, hy]], 5, 4, c.leg, lw);
  g.save(); g.translate(hx, hy); g.rotate(ca);
  const pinch = 0.25 + 0.25 * (o.snip || 0);
  ink(g, ell(5, -2, 7.5, 5.5), c.body, lw);
  ink(g, poly([[9, -4], [16, -6 - pinch * 8], [12, -1]]), c.body, lw);
  ink(g, poly([[9, 1], [16, 2 + pinch * 6], [11, 3]]), c.lit, lw);
  g.restore();
  if (o.hat) {
    // a captain's cap, the peak over the eyes
    g.save(); g.translate(13, -38 + bob); g.rotate(-0.12 + (o.hatTip || 0));
    ink(g, A.rr(-8, -7, 16, 7, 3), '#2d4a6a', lw);
    ink(g, ell(3, 0, 11, 2.4), '#1d2f47', lw);
    ink(g, circ(0, -4, 1.8), '#f3c95a', lw * 0.6);
    g.restore();
  }
  g.restore();
};

// ------------------------------------------------------------------ crab
const CRAB = { body: '#e9744a', shade: '#bd4d36', lit: '#ffab7c', leg: '#d9603f' };
crew.crab = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, CRAB, o.c || {}), lw = lwFor(s), b = o.bob || 0;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
  for (const sd of [-1, 1]) for (let i = 0; i < 3; i++) {
    const k = Math.sin((o.walk || 0) + i * 1.7 + (sd > 0 ? 1 : 0)) * 1.6;
    const x0 = sd * (6 + i * 3.5);
    limb(g, [[x0, -9 + b], [sd * (14 + i * 4) + k, -15 + b + i], [sd * (16 + i * 4.5) + k, 0]], 3.4, 1.8, c.leg, lw);
  }
  const B = curve([[-16, -10], [-12, -20], [0, -23], [12, -20], [16, -10], [8, -5], [-8, -5]].map(([px, py]) => [px, py + b]));
  ink(g, B, c.body, lw);
  g.save(); g.clip(B); g.fillStyle = c.shade; g.fill(ell(0, -4 + b, 18, 6)); g.fillStyle = c.lit; g.fill(ell(4, -19 + b, 8, 3)); g.restore();
  const bl = o.blink == null ? 1 : o.blink, lk = o.look || [0, 0];
  for (const ex of [-5, 5]) {
    A.line(g, ex, -20 + b, ex * 1.2, -27 + b, 2.4 + lw * 2); A.line(g, ex, -20 + b, ex * 1.2, -27 + b, 2.2, c.body);
    eye(g, ex * 1.2, -28 + b, 3.4, { blink: bl, look: lk, lw: lw * 0.8, lid: c.body });
  }
  if (o.smile !== false) { g.beginPath(); g.moveTo(-3, -14 + b); g.quadraticCurveTo(0, -12 + b + (o.smile || 1), 3, -14 + b); g.lineWidth = lw * 0.8; g.strokeStyle = LINE; g.stroke(); }
  // claws: [angleL, angleR] raise, o.snip opens them
  const ca = o.claws || [0, 0];
  for (const sd of [-1, 1]) {
    const a = (sd < 0 ? Math.PI + 0.5 : -0.5) - sd * (ca[sd < 0 ? 0 : 1] || 0);
    const hx = sd * 15 + Math.cos(a) * 8, hy = -13 + b + Math.sin(a) * 8;
    limb(g, [[sd * 12, -12 + b], [hx, hy]], 3.6, 3, c.leg, lw);
    g.save(); g.translate(hx, hy); g.rotate(a);
    ink(g, ell(3, 0, 5, 3.8), c.body, lw);
    const op = 0.2 + (o.snip || 0) * 0.5;
    ink(g, poly([[6, -1], [11, -3 - op * 6], [8, 1]]), c.body, lw * 0.9);
    g.restore();
  }
  g.restore();
};

// ------------------------------------------------------------------ octopus
// o.arms: function (i, t) → [angle, curl] per arm; o.hold: callback(g, i, tip) to draw things in hands
const OCTO = { body: '#d9748c', shade: '#a8506d', lit: '#f6a8b2', spot: '#b65676', sucker: '#f7d6cf' };
crew.octopus = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, OCTO, o.c || {}), lw = lwFor(s), t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
  const tips = [];
  const order = [0, 7, 1, 6, 2, 5, 3, 4];
  for (const i of order) {
    const base = -0.2 + (i / 7) * (Math.PI + 0.4);
    let [a, cb, len] = o.arms ? o.arms(i, t) : [base, 1.2 * (i < 4 ? -1 : 1), 30];
    const sx = Math.cos(Math.PI - (i / 7) * Math.PI) * 10, sy = -14;
    const pts = curl(sx, sy, a, len || 30, cb + Math.sin(t * 1.6 + i) * 0.35, 8);
    limb(g, pts, 6.5, 1.4, i % 2 ? c.body : c.shade, lw, c.shade);
    tips.push([i, pts[pts.length - 1], pts[pts.length - 3]]);
  }
  // mantle: a soft bulb leaning back, breathing
  const br = 1 + 0.04 * Math.sin(t * 2.1);
  const M = curve([[-13, -14], [-17, -30], [-12, -46 * br], [2, -52 * br], [14, -44 * br], [16, -28], [12, -14]]);
  ink(g, M, c.body, lw);
  g.save(); g.clip(M);
  g.fillStyle = c.shade; g.fill(ell(-6, -24, 14, 22));
  g.fillStyle = c.body; g.fill(ell(2, -30, 13, 20));
  g.fillStyle = c.lit; g.fill(ell(6, -42, 6, 7));
  g.fillStyle = c.spot;
  for (const [sx, sy, r] of [[-8, -38, 2], [-3, -46, 1.6], [8, -34, 1.4], [-10, -28, 1.6], [4, -48, 1.2]]) g.fill(circ(sx, sy, r));
  g.restore();
  const bl = o.blink == null ? 1 : o.blink;
  eye(g, -3, -22, 4.6, { blink: bl, look: o.look, lw: lw * 0.8, lid: c.body, iris: '#4b2a3d' });
  eye(g, 8, -22, 4.6, { blink: bl, look: o.look, lw: lw * 0.8, lid: c.body, iris: '#4b2a3d' });
  if (o.hat) {
    // a cook's toque
    ink(g, poly([[-6, -50], [-7, -58], [9, -58], [8, -50]]), '#fffaf0', lw);
    ink(g, curve([[-9, -58], [-11, -66], [-4, -71], [2, -68], [8, -72], [13, -64], [11, -57]]), '#fffaf0', lw);
  }
  if (o.hold) for (const tp of tips) o.hold(g, tp[0], tp[1], tp[2]);
  g.restore();
  return tips;
};

// ------------------------------------------------------------------ shrimp
// a comma: tail fan at the back, head forward; o.pump bends it, o.legs paddles
const SHRIMP = { body: '#f08a6c', shade: '#c4604f', lit: '#ffc5a6', band: '#fff1de' };
crew.shrimp = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, SHRIMP, o.c || {}), lw = lwFor(s), bend = o.bend || 0, t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s); if (o.rot) g.rotate(o.rot);
  // spine: from the head (front, right) curling back and down to the tail
  const spine = [];
  for (let i = 0; i <= 7; i++) {
    const u = i / 7, a = -0.2 + u * (1.9 + bend);
    spine.push([10 - Math.sin(a) * 18 - u * 4, -26 + (1 - Math.cos(a)) * 14 + u * 8]);
  }
  // legs (pleopods) under the body
  for (let i = 1; i < 6; i++) {
    const [px, py] = spine[i];
    const k = Math.sin(t * 9 + i) * (o.legs || 0.3) * 3;
    A.line(g, px, py + 4, px - 1 + k, py + 10, lw * 1.4, LINE);
  }
  // body segments, head first, each a little smaller
  for (let i = 6; i >= 0; i--) {
    const [px, py] = spine[i], r = lerp(9, 5, i / 6);
    const S = ell(px, py, r, r * 0.9);
    ink(g, S, i % 2 ? c.body : c.lit, lw);
    g.save(); g.clip(S); g.fillStyle = c.shade; g.fill(ell(px - 1, py + r * 0.5, r, r * 0.5)); g.restore();
  }
  // tail fan
  const [tx, ty] = spine[7];
  ink(g, poly([[tx, ty], [tx + 6, ty + 9], [tx - 2, ty + 11], [tx - 8, ty + 7]]), c.body, lw);
  // head with rostrum, eye and long antennae
  const [hx, hy] = spine[0];
  ink(g, poly([[hx + 4, hy - 5], [hx + 16, hy - 9], [hx + 6, hy - 1]]), c.body, lw);
  eye(g, hx + 3, hy - 4, 3.2, { blink: o.blink, look: o.look, lw: lw * 0.8, lid: c.body });
  const aw = Math.sin(t * 2.3) * 3 + (o.ant || 0);
  A.stroke(g, [[hx + 6, hy - 6], [hx + 18, hy - 18 + aw], [hx + 34, hy - 20 + aw * 1.6]], lw * 0.7);
  A.stroke(g, [[hx + 7, hy - 5], [hx + 22, hy - 10 - aw * 0.5], [hx + 36, hy - 6 - aw]], lw * 0.7);
  // walking legs / arms (o.reach: point the front arms at [x, y] in local space)
  const rc = o.reach || [hx + 10, hy + 12];
  A.stroke(g, [[hx, hy + 4], [lerp(hx, rc[0], 0.5) + 1, lerp(hy, rc[1], 0.5) + 3], rc], lw * 1.5);
  A.stroke(g, [[hx - 3, hy + 6], [lerp(hx, rc[0], 0.5) - 2, lerp(hy, rc[1], 0.5) + 4], [rc[0] - 3, rc[1] + 1]], lw * 1.5);
  g.restore();
};

// ------------------------------------------------------------------ seahorse
// o.curl coils the tail; o.sleep: eyes shut and a lower chin
const HORSE = { body: '#f2b84b', shade: '#c78434', lit: '#ffe08e', fin: '#ffe7b3', ring: '#d39540' };
crew.seahorse = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, HORSE, o.c || {}), lw = lwFor(s), t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s); if (o.rot) g.rotate(o.rot);
  const br = Math.sin(t * 1.4 + (o.ph || 0)) * 0.8;
  // tail: from the belly down and curling round (anchored at 0,0, where it hooks the rail)
  const tail = curl(0, -18, Math.PI / 2 + 0.2, 26, 3.6 + (o.curl || 0), 10);
  limb(g, tail, 8, 2, c.body, lw, c.shade);
  // body: belly forward, back curved
  const B = curve([[-2, -18], [6, -26], [8, -38 - br], [4, -48], [-4, -54], [-8, -46], [-9, -32], [-6, -22]]);
  ink(g, B, c.body, lw);
  g.save(); g.clip(B);
  g.fillStyle = c.shade; g.fill(ell(-8, -34, 6, 20));
  g.fillStyle = c.lit; g.fill(ell(6, -34, 4, 9));
  g.strokeStyle = c.ring; g.lineWidth = 1;
  for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(-10, -24 - i * 6); g.quadraticCurveTo(0, -21 - i * 6, 10, -26 - i * 6); g.stroke(); }
  g.restore();
  // dorsal fin flutters
  const fl = Math.sin(t * 8 + (o.ph || 0)) * 1.5;
  ink(g, curve([[-8, -30], [-14 - fl, -34], [-14 + fl, -40], [-8, -42]], false), c.fin, lw * 0.8);
  // head, tipped forward, a long snout
  g.save(); g.translate(-2, -52); g.rotate((o.nod || 0) + (o.sleep ? 0.35 : 0));
  const Hd = curve([[-6, 2], [-6, -6], [0, -9], [6, -6], [16, -4], [19, -1], [16, 1], [6, 3]]);
  ink(g, Hd, c.body, lw);
  g.save(); g.clip(Hd); g.fillStyle = c.lit; g.fill(ell(2, -6, 5, 2.5)); g.restore();
  // coronet
  ink(g, poly([[-3, -8], [-4, -14], [0, -10], [2, -15], [3, -8]]), c.body, lw * 0.8);
  if (o.sleep) { g.beginPath(); g.moveTo(-1, -3); g.quadraticCurveTo(2, -1, 5, -3); g.lineWidth = lw; g.strokeStyle = LINE; g.stroke(); }
  else eye(g, 2, -3, 3.3, { blink: o.blink, look: o.look, lw: lw * 0.8, lid: c.body });
  g.restore();
  g.restore();
};

// ------------------------------------------------------------------ snail
// o.reach stretches the head out, o.specs puts spectacles on
const SNAIL = { shell: '#b6a3d8', shellSh: '#8170a8', shellLt: '#ddd0f2', band: '#f0d6a8', foot: '#e8dccd', footSh: '#b8a89c' };
crew.snail = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, SNAIL, o.c || {}), lw = lwFor(s), rch = o.reach || 0;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
  // foot along the ground, head rising at the front
  const F = curve([[-22, 0], [-20, -6], [4, -8], [12 + rch * 6, -16 - rch * 4], [18 + rch * 8, -24 - rch * 6], [24 + rch * 8, -22 - rch * 6], [24 + rch * 7, -14 - rch * 4], [16 + rch * 4, -4], [6, 0]]);
  ink(g, F, c.foot, lw);
  g.save(); g.clip(F); g.fillStyle = c.footSh; g.fill(ell(-4, 1, 26, 4)); g.restore();
  // eye stalks
  const hx = 20 + rch * 8, hy = -24 - rch * 6, sw = Math.sin((o.t || 0) * 1.7) * 1.5;
  const eyes = [[hx - 3 + sw, hy - 14], [hx + 5 - sw, hy - 12]];
  for (const [ex, ey] of eyes) {
    A.line(g, hx, hy + 2, ex, ey, 2.4 + lw * 2); A.line(g, hx, hy + 2, ex, ey, 2.2, c.foot);
    eye(g, ex, ey, 2.8, { blink: o.blink, look: o.look, lw: lw * 0.7, lid: c.foot });
  }
  if (o.specs) {
    g.lineWidth = lw * 0.9; g.strokeStyle = '#c89b45';
    for (const [ex, ey] of eyes) { g.beginPath(); g.arc(ex, ey, 4.2, 0, TAU); g.stroke(); }
    g.beginPath(); g.moveTo(eyes[0][0] + 4.2, eyes[0][1]); g.lineTo(eyes[1][0] - 4.2, eyes[1][1]); g.stroke();
  }
  g.beginPath(); g.moveTo(hx + 1, hy + 4); g.quadraticCurveTo(hx + 4, hy + 6, hx + 6, hy + 4); g.lineWidth = lw * 0.8; g.strokeStyle = LINE; g.stroke();
  // shell: a coiled cone sitting on the back
  g.save(); g.translate(-6, -16); g.rotate(-0.15 + (o.rock || 0));
  const S = circ(0, 0, 15);
  ink(g, S, c.shell, lw * 1.1);
  g.save(); g.clip(S);
  g.fillStyle = c.shellSh; g.fill(circ(-4, 5, 15));
  g.fillStyle = c.shell; g.fill(circ(1, -1, 12));
  g.fillStyle = c.shellLt; g.fill(ell(4, -7, 6, 3, undefined, -0.4));
  g.restore();
  g.beginPath(); for (let i = 0; i < 36; i++) { const a = -i * 0.3, r = 14 - i * 0.37; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(14, 0); }
  g.lineWidth = lw * 0.9; g.strokeStyle = LINE; g.stroke();
  g.beginPath(); for (let i = 0; i < 30; i++) { const a = -i * 0.3, r = 11 - i * 0.33; i ? g.lineTo(Math.cos(a) * r, Math.sin(a) * r) : g.moveTo(11, 0); }
  g.lineWidth = 1.6; g.strokeStyle = c.band; g.stroke();
  g.restore();
  g.restore();
};

// ------------------------------------------------------------------ nudibranch
// a soft slug with a frill of cerata along its back; o.ripple waves the frill
const NUDI = { body: '#7d77d8', shade: '#5550a8', lit: '#a9a4f0', tip: '#ffa24a', tipLt: '#ffd48a', rim: '#f1ecff' };
crew.nudi = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, NUDI, o.c || {}), lw = lwFor(s), t = o.t || 0, rp = o.ripple || 0;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
  const hr = o.rear || 0; // rearing up the head
  const B = curve([[-24, 0], [-26, -4], [-14, -9], [6, -10], [14, -12 - hr * 8], [20, -18 - hr * 12], [24, -14 - hr * 10], [22, -6 - hr * 4], [12, 0]]);
  // cerata behind
  for (let i = 0; i < 9; i++) {
    const u = i / 8, bx = lerp(-20, 12, u), by = -8 - Math.sin(u * Math.PI) * 2;
    const a = -Math.PI / 2 - 0.6 + u * 1.1 + Math.sin(t * 3 + i * 0.8) * (0.1 + rp * 0.3);
    const L = 10 + Math.sin(u * Math.PI) * 5;
    const tipx = bx + Math.cos(a) * L, tipy = by + Math.sin(a) * L;
    limb(g, [[bx, by], [lerp(bx, tipx, 0.5), lerp(by, tipy, 0.5)], [tipx, tipy]], 4.6, 3, i % 2 ? c.body : c.lit, lw * 0.8);
    ink(g, circ(tipx, tipy, 1.9), c.tip, lw * 0.6);
  }
  ink(g, B, c.body, lw);
  g.save(); g.clip(B); g.fillStyle = c.shade; g.fill(ell(-4, 2, 30, 5)); g.strokeStyle = c.rim; g.lineWidth = 1.2; g.stroke(curve([[-24, -1], [0, -3], [12, -2]], false)); g.restore();
  // rhinophores
  const hx = 20, hy = -18 - hr * 12;
  for (const [dx, k] of [[-2, 0], [3, 1]]) {
    const sw = Math.sin(t * 2 + k) * 1.5;
    limb(g, [[hx + dx, hy + 2], [hx + dx + 1 + sw, hy - 6], [hx + dx + 2 + sw, hy - 11]], 2.6, 1.6, c.tip, lw * 0.7);
  }
  eye(g, hx + 3, hy + 5, 2.2, { blink: o.blink, look: o.look, lw: lw * 0.6, lid: c.body });
  g.restore();
};

// ------------------------------------------------------------------ squid
// upright mantle with fins at the top, arms below; o.arm: [x, y] where the painting arm reaches
const SQUID = { body: '#f2c3c0', shade: '#c98f98', lit: '#fff0e8', spot: '#d27a82', fin: '#f7d6d2' };
crew.squid = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, SQUID, o.c || {}), lw = lwFor(s), t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s); if (o.rot) g.rotate(o.rot);
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 2 + (i - 2.5) * 0.28;
    limb(g, curl((i - 2.5) * 2.5, -12, a, 14, Math.sin(t * 2 + i) * 0.8, 5), 2.8, 1, c.body, lw * 0.8);
  }
  if (o.arm) {
    const [ax, ay] = o.arm;
    limb(g, [[4, -13], [lerp(4, ax, 0.5) + 3, lerp(-13, ay, 0.5) + 4], [ax, ay]], 2.6, 1.2, c.body, lw * 0.8);
  }
  const fl = Math.sin(t * 4) * 2;
  ink(g, poly([[-6, -46], [-15, -50 + fl], [-1, -58]]), c.fin, lw * 0.8);
  ink(g, poly([[6, -46], [15, -50 - fl], [1, -58]]), c.fin, lw * 0.8);
  const M = curve([[-7, -14], [-9, -34], [0, -58], [9, -34], [7, -14]]);
  ink(g, M, c.body, lw);
  g.save(); g.clip(M); g.fillStyle = c.shade; g.fill(ell(-6, -30, 5, 22)); g.fillStyle = c.lit; g.fill(ell(4, -38, 2.5, 10));
  g.fillStyle = c.spot; for (const [sx, sy] of [[-3, -40], [2, -30], [-2, -24], [3, -46]]) g.fill(circ(sx, sy, 1.1)); g.restore();
  eye(g, -3, -18, 3.4, { blink: o.blink, look: o.look, lw: lw * 0.7, lid: c.body });
  eye(g, 4, -18, 3.4, { blink: o.blink, look: o.look, lw: lw * 0.7, lid: c.body });
  if (o.beret) ink(g, ell(1, -57, 9, 3.5, undefined, -0.2), '#c0394f', lw);
  g.restore();
};

// ------------------------------------------------------------------ pufferfish
// o.puff: 0 → 1 swells it round and puts the spines out
const PUFF = { body: '#e9cf7a', shade: '#b99a52', lit: '#fff0b8', belly: '#fff8e0', spot: '#8b7040', fin: '#f2e2a8' };
crew.puffer = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, PUFF, o.c || {}), lw = lwFor(s), pf = o.puff || 0, t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s);
  const rx = 15 + pf * 6, ry = 11 + pf * 10, cy = -ry - 2;
  // tail
  const tw = Math.sin(t * 5) * 2;
  ink(g, poly([[-rx + 2, cy], [-rx - 9, cy - 6 + tw], [-rx - 9, cy + 6 + tw]]), c.fin, lw * 0.9);
  // spines
  if (pf > 0.1) {
    g.lineWidth = lw; g.strokeStyle = LINE;
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU, r0x = Math.cos(a) * rx, r0y = Math.sin(a) * ry;
      g.beginPath(); g.moveTo(r0x * 0.95, cy + r0y * 0.95); g.lineTo(r0x * (1 + 0.25 * pf), cy + r0y * (1 + 0.25 * pf)); g.stroke();
    }
  }
  const B = ell(0, cy, rx, ry);
  ink(g, B, c.body, lw);
  g.save(); g.clip(B);
  g.fillStyle = c.belly; g.fill(ell(2, cy + ry * 0.55, rx * 0.9, ry * 0.55));
  g.fillStyle = c.shade; g.globalAlpha = 0.6; g.fill(ell(-4, cy + ry * 0.9, rx, ry * 0.3)); g.globalAlpha = 1;
  g.fillStyle = c.lit; g.fill(ell(4, cy - ry * 0.55, rx * 0.4, ry * 0.2));
  g.fillStyle = c.spot; for (const [sx, sy] of [[-6, -0.5], [-1, -0.7], [-9, -0.1], [3, -0.35]]) g.fill(circ(sx * (1 + pf * 0.3), cy + sy * ry, 1.3 + pf * 0.5));
  g.restore();
  // fin and face
  const ff = Math.sin(t * 10) * 2;
  ink(g, ell(1, cy + 3, 4, 2.5 + ff * 0.3, undefined, 0.6), c.fin, lw * 0.8);
  eye(g, rx * 0.5, cy - ry * 0.25, 3.6, { blink: o.blink, look: o.look, lw: lw * 0.8, lid: c.body });
  if (o.blow) ink(g, circ(rx + 1, cy + 2, 2 + o.blow * 1.5), c.shade, lw * 0.8);
  else { g.beginPath(); g.moveTo(rx - 3, cy + 3); g.quadraticCurveTo(rx, cy + 5, rx + 1, cy + 2); g.lineWidth = lw * 0.8; g.strokeStyle = LINE; g.stroke(); }
  g.restore();
};

// ------------------------------------------------------------------ goby
// a little fish that sits up on its fins with eyes on top of its head
const GOBY = { body: '#efe3cc', shade: '#bfae98', lit: '#fff8ec', spot: '#e48a4a', fin: '#f6d1a5' };
crew.goby = (g, x, y, s = 1, o = {}) => {
  const c = Object.assign({}, GOBY, o.c || {}), lw = lwFor(s), t = o.t || 0;
  g.save(); g.translate(x, y); g.scale(s * (o.flip ? -1 : 1), s); if (o.rot) g.rotate(o.rot);
  const tw = Math.sin(t * 3.4) * 2 + (o.wag || 0);
  ink(g, poly([[-20, -7], [-30, -13 + tw], [-30, -1 + tw]]), c.fin, lw * 0.8);
  ink(g, curve([[-8, -13], [-4, -20], [2, -14]], false), c.fin, lw * 0.8);
  const B = curve([[-22, -6], [-10, -13], [6, -14], [14, -10], [16, -5], [10, -1], [-8, -1]]);
  ink(g, B, c.body, lw);
  g.save(); g.clip(B); g.fillStyle = c.shade; g.fill(ell(-4, 0, 22, 4)); g.fillStyle = c.spot;
  for (const [sx, sy] of [[-14, -6], [-8, -8], [-2, -6], [4, -9], [-11, -3]]) g.fill(circ(sx, sy, 1.4)); g.restore();
  ink(g, ell(2, -1, 6, 2.2, undefined, 0.3), c.fin, lw * 0.7);
  eye(g, 8, -13, 3.6, { blink: o.blink, look: o.look, lw: lw * 0.8, lid: c.body });
  g.beginPath(); g.moveTo(13, -5); g.quadraticCurveTo(15, -4, 16, -6); g.lineWidth = lw * 0.8; g.strokeStyle = LINE; g.stroke();
  g.restore();
};
})();
