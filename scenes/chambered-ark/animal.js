/* animal.js — the nautilus herself, alive at the aperture: the leathery hood, the big pinhole eye
   that follows the pointer wherever it goes, a fringe of cirri streaming forward in the current,
   and the funnel underneath that breathes water.

   Hover: the cirri reach toward the pointer and curl round it; linger and she blinks slowly and
   puffs a jet from her funnel, which nudges the whole ark. Tap: a bigger puff.

   Drawn in the aperture's own frame: u runs forward out of the shell, v down the aperture from
   the inner lip. animal z62 (in front of the shell, behind the near kelp). */
(() => {
const { TAU, lerp, clamp, rng, noise, circ, ell, curve, poly, grad, radial, P, layer, wind } = Drawn;
const A = window.ARK, LINE = A.LINE, C = A.crew;

const Pi = A.pt(A.thE, A.ri(A.thE)), Po = A.pt(A.thE, A.R(A.thE));
const ap = Math.hypot(Po[0] - Pi[0], Po[1] - Pi[1]);
const av = [(Po[0] - Pi[0]) / ap, (Po[1] - Pi[1]) / ap];          // down the aperture
const au = [-Math.sin(A.thE), Math.cos(A.thE)];                     // out of it, forward
const M = new DOMMatrix([au[0], au[1], av[0], av[1], Pi[0], Pi[1]]);
const Minv = M.inverse();
const toLocal = (x, y) => { const [sx, sy] = A.toShell(x, y); const p = Minv.transformPoint({ x: sx, y: sy }); return [p.x, p.y]; };

const HOOD = { base: '#b4693f', lit: '#d9915c', shade: '#7a3c2e', spot: '#f6e4cc', ridge: '#8a4630' };
const CIRRI = { base: '#f0d0bc', shade: '#c69488', lit: '#fff0e2' };
const EYE = { ring: '#cbb8ae', dark: '#24182a' };

// the cirri: rooted in a fan under the eye
const r = rng(808);
const cirri = [];
for (let i = 0; i < 38; i++) {
  const f = r();
  const layer = i % 3; // 0 back, 1 middle, 2 front
  cirri.push({
    root: [lerp(50, 120, r()), lerp(214, 305, f)],
    a: lerp(0.05, 0.95, f) + (r() - 0.5) * 0.25, len: lerp(110, 230, Math.sin(f * Math.PI * 0.9 + 0.2)) * (0.7 + r() * 0.4),
    curl: (r() - 0.35) * 2.2, ph: r() * TAU, w: layer === 2 ? 5.4 + r() * 1.6 : 4.2 + r() * 1.4, layer, back: layer === 0,
  });
}
cirri.sort((p, q) => p.layer - q.layer);
const S = { look: [0, 0], blink: Drawn.blinker(3, 6), slow: 0, puff: 0, puffT: 9, breathe: 0, reach: 0, curlOn: 0 };

function cirrusPts(c, t, hov, tx, ty) {
  const w = wind(t, Pi[0]);
  const pts = [];
  let a = c.a - 0.15 * w, [x, y] = c.root;
  const n = 12, step = c.len / n;
  for (let i = 0; i <= n; i++) {
    pts.push([x, y]);
    const u = i / n;
    // stream in the current and wave; when hovered, bend toward the pointer and curl at the tip
    let da = (c.curl * 0.07 * u * u * 3 + Math.sin(t * 1.1 + c.ph + u * 3.2) * 0.08) * (0.4 + u);
    if (hov > 0.01) {
      const want = Math.atan2(ty - y, tx - x);
      let d = want - a; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU;
      da = lerp(da, d * 0.22, hov * 0.8) + hov * S.curlOn * u * u * 0.5 * (c.curl > 0 ? 1 : -1);
    }
    a += da;
    x += Math.cos(a) * step; y += Math.sin(a) * step;
  }
  return pts;
}

function drawCirri(g, t, L, back) {
  const [tx, ty] = toLocal(P.x, P.y);
  for (const c of cirri) {
    if (c.back !== back) continue;
    const pts = cirrusPts(c, t, L.hover * (c.back ? 0.6 : 1), tx, ty);
    const col = c.layer === 0 ? '#c99a8e' : c.layer === 1 ? '#e2b9a8' : CIRRI.base;
    C.limb(g, pts, c.w, 1.3, col, 1.3, CIRRI.shade);
    // each cirrus leaves its sheath with a pale collar
    if (c.layer) { const [x, y] = pts[1]; g.fillStyle = CIRRI.lit; g.globalAlpha = 0.7; g.fill(ell(x, y, c.w * 0.5, c.w * 0.35)); g.globalAlpha = 1; }
    if (!back) {
      // the ridged grip along each cirrus
      g.save(); g.globalAlpha = 0.5;
      for (let i = 2; i < pts.length - 1; i += 2) { const [x, y] = pts[i]; g.fillStyle = CIRRI.shade; g.fill(circ(x, y + 1.5, 1.2)); }
      g.restore();
    }
  }
}

layer({
  id: 'nautilus', z: 62,
  hit(x, y) {
    const [u, v] = toLocal(x, y);
    return (u > -30 && u < 185 && v > -55 && v < 340) || Math.hypot(u - 190, v - 260) < 110;
  },
  onEnter() { S.curlOn = 0; },
  onTap() { S.puffT = 0; S.puffBig = 1; },
  update(dt, t, L) {
    const [tx, ty] = toLocal(P.x, P.y);
    const ex = 112, ey = 172;
    const dx = tx - ex, dy = ty - ey, d = Math.hypot(dx, dy) || 1;
    const k = P.inside ? clamp(d / 220, 0, 1) : 0;
    S.look[0] = Drawn.ease(S.look[0], (dx / d) * k, 6, dt);
    S.look[1] = Drawn.ease(S.look[1], (dy / d) * k, 6, dt);
    S.curlOn = Drawn.ease(S.curlOn, L.hovered && L.since > 0.5 ? 1 : 0, 3, dt);
    // a slow blink, then a puff, when you stay
    if (L.hovered && L.since > 1.2 && S.puffT > 6) { S.puffT = 0; S.puffBig = 0; }
    S.puffT += dt;
    if (!L.hovered && S.puffT > 11 + Math.sin(t) * 3) { S.puffT = 0; S.puffBig = 0; }
    S.puff = S.puffT < 1.4 ? A.env(S.puffT / 1.4, 0.2, 0.5) : 0;
    if (S.puffT < 0.6 && Math.random() < dt * (S.puffBig ? 60 : 30)) {
      const p = M.transformPoint({ x: 112 + Math.random() * 10, y: 327 + Math.random() * 6 });
      A.spawn({ kind: 'bubble', x: p.x, y: p.y, vx: -40 - Math.random() * 60 * (1 + S.puffBig), vy: 20 + Math.random() * 30, life: 2.2, size: 2 + Math.random() * 4, shell: true });
    }
    A.nudge = S.puff * (S.puffBig ? 7 : 3.5);
    if (A.signal) { A.signal = 0; S.sigT = 0; }
    S.sigT = (S.sigT == null ? 9 : S.sigT) + dt;
    S.slow = Drawn.ease(S.slow, (L.hovered && L.since > 0.9 && L.since < 1.6) || S.sigT < 0.5 ? 1 : 0, 9, dt);
    S.breathe = Math.sin(t * 1.3);
  },
  draw(g, t, L) {
    A.inShell(g, () => {
      g.save(); g.transform(M.a, M.b, M.c, M.d, M.e, M.f);
      const br = S.breathe;
      // cirri behind the head
      drawCirri(g, t, L, true);
      // the soft body filling the aperture, the sheaths the cirri grow from
      const body = curve([[-6, 110], [50, 128], [120, 140], [150, 186], [140, 250], [104, 300], [44, 322], [6, ap - 6], [-8, ap - 30]]);
      C.ink(g, body, '#e2bfae', 2);
      g.save(); g.clip(body);
      g.fillStyle = '#c79d94'; g.fill(ell(10, 260, 50, 140)); g.fillStyle = '#b98a82'; g.fill(ell(90, 140, 80, 22));
      g.restore();
      // the funnel: a curled tube under the cirri that pulses
      const fp = 1 + S.puff * 0.35;
      const fun = curve([[30, 300], [70, 306], [110 * fp, 318 + 4 * fp], [114 * fp, 336], [70, 338], [28, 330]]);
      C.ink(g, fun, '#d9a896', 1.8);
      g.save(); g.clip(fun); g.fillStyle = '#b37c78'; g.fill(ell(60, 338, 70, 10)); g.restore();
      C.ink(g, ell(112 * fp, 327 + 2 * fp, 5 + S.puff * 3, 9, undefined, 0.2), '#7d4a52', 1.4);
      // the hood: a thick leathery cap over the head, lying back over the coil, mottled and ridged
      const hb = br * 2;
      const hood = curve([[-70, 6], [-30, -26 - hb], [40, -40 - hb], [112, -30 - hb], [160, 4], [176, 50], [164, 98], [132, 124], [80, 132], [30, 126], [-10, 108], [-50, 66]]);
      C.ink(g, hood, HOOD.base, 2.8);
      g.save(); g.clip(hood);
      g.fillStyle = HOOD.shade; g.fill(ell(40, 140, 170, 40));
      g.fillStyle = '#ad6340'; g.fill(ell(110, 0, 90, 70));
      g.fillStyle = HOOD.lit; g.fill(ell(128, -18, 50, 30));
      const rr = rng(4);
      // the hood is wrinkled in soft folds running front to back
      for (let i = 0; i < 6; i++) {
        const y0 = -40 + i * 30, pts = [[-40, y0 + 20], [30, y0 - 4 + Math.sin(i) * 6], [110, y0 + 2], [180, y0 + 18]];
        g.globalAlpha = 0.6; A.stroke(g, pts, 2, HOOD.ridge); g.globalAlpha = 1;
      }
      // mottling: pale blotches, bigger toward the back
      for (let i = 0; i < 70; i++) {
        const x = -40 + rr() * 220, y = -55 + rr() * 200, s = 1.5 + rr() * 5 + (180 - x) * 0.02;
        g.fillStyle = i % 4 ? HOOD.spot : '#d7a77e'; g.globalAlpha = 0.55 + rr() * 0.3;
        g.fill(ell(x, y, s, s * (0.55 + rr() * 0.45), undefined, rr() * 3));
      }
      g.globalAlpha = 1;
      g.restore();
      // the eye: a big silver pinhole eye under the front of the hood, in a fleshy socket
      const ex = 112, ey = 172, er = 29;
      C.ink(g, ell(ex, ey, er + 9, er + 7), '#d6ac98', 2);
      g.save(); g.clip(ell(ex, ey, er + 9, er + 7)); g.fillStyle = '#b8877a'; g.fill(ell(ex - 4, ey + 8, er + 9, er)); g.restore();
      const bl = Math.min(S.blink(t), 1 - S.slow);
      if (bl < 0.15) {
        g.beginPath(); g.moveTo(ex - er, ey); g.quadraticCurveTo(ex, ey + er * 0.7, ex + er, ey); g.lineWidth = 2.4; g.strokeStyle = LINE; g.stroke();
      } else {
        const E = ell(ex, ey, er, er * 0.96);
        C.ink(g, E, EYE.ring, 2.2);
        g.save(); g.clip(E);
        g.fillStyle = grad(g, ex, ey - er, ex, ey + er, ['#efe4dc', '#a8958f']); g.fill(E);
        const px = ex + S.look[0] * er * 0.42, py = ey + S.look[1] * er * 0.4;
        g.fillStyle = EYE.dark; g.fill(circ(px, py, er * 0.62));
        g.fillStyle = 'rgba(110, 150, 170, 0.5)'; g.fill(circ(px - 4, py + 5, er * 0.4));
        g.fillStyle = '#fff'; g.fill(circ(px + er * 0.26, py - er * 0.3, er * 0.18)); g.fill(circ(px - er * 0.2, py + er * 0.2, er * 0.07));
        if (bl < 1) { g.fillStyle = '#b97a5c'; g.fillRect(ex - er - 4, ey - er - 6, er * 2 + 8, (er * 2 + 8) * (1 - bl)); }
        g.restore();
      }
      // the hood's front edge droops over the eye like a brow
      
      // cirri in front
      drawCirri(g, t, L, false);
      g.restore();
    });
  },
});
})();
