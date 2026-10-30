/* animal.js — the nautilus herself, alive at the aperture: the leathery hood, the big pinhole eye
   that follows the pointer wherever it goes, a fringe of cirri streaming forward in the current,
   and the funnel underneath that breathes water.

   Hover: the cirri reach toward the pointer and curl round it; linger and she blinks slowly and
   puffs a jet from her funnel, which nudges the whole ark. Tap: a bigger puff.

   Drawn in the aperture's own frame: u runs forward out of the shell, v down the aperture from
   the inner lip. animal z62 (in front of the shell, behind the near kelp). */
(() => {
const { TAU, lerp, clamp, rng, noise, circ, ell, curve, poly, grad, radial, P, layer, wind } = Drawn;
const A = window.ARK, LINE = A.LINE, C = A.crew, ink = C.ink;

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
for (let i = 0; i < 48; i++) {
  const f = r();
  const layer = i % 3; // 0 back, 1 middle, 2 front
  cirri.push({
    root: layer === 0 ? [lerp(120, 156, r()), lerp(200, 280, f)] : [lerp(70, 158, r()), lerp(196, 288, f)],
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
    const ex = 112, ey = 168;
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
      // the dark inside of the aperture, behind everything
      const mouth = curve([[-4, 100], [20, 160], [24, 260], [12, ap - 16], [-4, ap - 4]]);
      ink(g, mouth, '#5a3a48', 1.6);
      drawCirri(g, t, L, true);
      // the funnel under the head, a soft curled tube that breathes
      const fp = 1 + S.puff * 0.35 + br * 0.03;
      const fun = curve([[10, 286], [60, 292], [104 * fp, 304 + 4 * fp], [110 * fp, 322], [66, 330], [12, 326]]);
      ink(g, fun, '#d79f8c', 1.8);
      g.save(); g.clip(fun); g.fillStyle = '#b07670'; g.fill(ell(56, 332, 70, 11)); g.fillStyle = '#f0c4ae'; g.fill(ell(70, 296, 40, 4)); g.restore();
      ink(g, ell(106 * fp, 314 + 2 * fp, 4 + S.puff * 3, 8, undefined, 0.2), '#6d3f4a', 1.4);
      // the head: one soft mass from the hood down to the root of the cirri
      const hb = br * 1.6;
      const headPts = [[-56, 44], [-44, -4 - hb], [6, -32 - hb], [80, -40 - hb], [146, -24 - hb], [184, 16], [192, 70], [176, 118], [164, 160], [160, 214], [148, 262], [112, 292], [50, 296], [6, 280], [-4, 200], [-30, 110]];
      const head = curve(headPts);
      ink(g, head, '#e0b29c', 2.8);
      g.save(); g.clip(head);
      g.fillStyle = '#c18a80'; g.fill(ell(30, 240, 90, 90));
      g.fillStyle = '#f2cdb8'; g.fill(ell(150, 190, 26, 60));
      // the sheaths along the front of the face, each a little ringed cup a cirrus leaves from
      const sr = rng(23);
      for (let i = 0; i < 26; i++) {
        const u = 70 + sr() * 92, v = 196 + sr() * 92;
        g.fillStyle = sr() < 0.5 ? '#d39c8a' : '#ebc3ae'; g.fill(ell(u, v, 7, 5, undefined, 0.4));
        g.lineWidth = 0.9; g.strokeStyle = 'rgba(120,60,60,0.6)'; g.stroke(ell(u, v, 7, 5, undefined, 0.4));
      }
      // the hood: the upper half of the head, leathery tan, mottled and rough
      const hoodEdge = [[-60, 96], [10, 118], [80, 132], [140, 128], [200, 108]];
      const hood = curve([[-80, -80], [220, -80], ...hoodEdge.slice().reverse()]);
      g.save(); g.clip(hood);
      g.fillStyle = '#c47d52'; g.fill(hood);
      const hm = rng(4);
      // darker patches
      for (let i = 0; i < 26; i++) { const x = -50 + hm() * 240, y = -40 + hm() * 160, s = 8 + hm() * 16; g.fillStyle = hm() < 0.5 ? 'rgba(120, 56, 40, 0.45)' : 'rgba(150, 76, 48, 0.5)'; g.fill(ell(x, y, s, s * 0.6, undefined, hm() * 3)); }
      // form: sunlit along the top, falling into shade toward the brim
      g.fillStyle = grad(g, 0, -40, 0, 130, [[0, 'rgba(255, 236, 200, 0.5)'], [0.45, 'rgba(255, 236, 200, 0)'], [0.8, 'rgba(70, 30, 40, 0.15)'], [1, 'rgba(70, 30, 40, 0.45)']]);
      g.fillRect(-80, -80, 300, 220);
      // tubercles: small raised bumps, cream on top
      for (let i = 0; i < 80; i++) {
        const x = -46 + hm() * 230, y = -34 + hm() * 150, s = 1.4 + hm() * 2.6;
        g.fillStyle = 'rgba(90, 40, 40, 0.4)'; g.fill(circ(x + s * 0.3, y + s * 0.4, s));
        g.fillStyle = '#f3dcc0'; g.fill(circ(x - s * 0.15, y - s * 0.2, s * 0.75));
      }
      g.restore();
      // the brim: the hood's edge overhangs, casting a shadow on the face
      A.stroke(g, hoodEdge.map(([x, y]) => [x, y + 7]), 12, 'rgba(90, 40, 50, 0.3)');
      g.lineWidth = 2.2; g.strokeStyle = LINE; g.stroke(curve(hoodEdge, false));
      g.restore();
      // the eye: big, silver, set in a fleshy socket under the hood's brim
      const ex = 112, ey = 168, er = 29;
      ink(g, ell(ex, ey, er + 9, er + 7), '#d6ac98', 2);
      g.save(); g.clip(ell(ex, ey, er + 9, er + 7)); g.fillStyle = '#b8877a'; g.fill(ell(ex - 4, ey + 9, er + 9, er)); g.restore();
      const bl = Math.min(S.blink(t), 1 - S.slow);
      if (bl < 0.15) {
        g.beginPath(); g.moveTo(ex - er, ey); g.quadraticCurveTo(ex, ey + er * 0.7, ex + er, ey); g.lineWidth = 2.4; g.strokeStyle = LINE; g.stroke();
      } else {
        const E = ell(ex, ey, er, er * 0.96);
        ink(g, E, EYE.ring, 2.2);
        g.save(); g.clip(E);
        g.fillStyle = grad(g, ex, ey - er, ex, ey + er, ['#f2e8e0', '#a8958f']); g.fill(E);
        const px = ex + S.look[0] * er * 0.42, py = ey + S.look[1] * er * 0.4;
        g.fillStyle = EYE.dark; g.fill(circ(px, py, er * 0.62));
        g.fillStyle = 'rgba(110, 150, 170, 0.5)'; g.fill(circ(px - 4, py + 5, er * 0.4));
        g.fillStyle = '#fff'; g.fill(circ(px + er * 0.26, py - er * 0.3, er * 0.18)); g.fill(circ(px - er * 0.2, py + er * 0.2, er * 0.07));
        // the brim's shadow across the top of the eye
        g.fillStyle = 'rgba(60, 30, 40, 0.3)'; g.fill(ell(ex, ey - er * 0.95, er * 1.2, er * 0.4));
        if (bl < 1) { g.fillStyle = '#c99a86'; g.fillRect(ex - er - 4, ey - er - 6, er * 2 + 8, (er * 2 + 8) * (1 - bl)); }
        g.restore();
      }
      drawCirri(g, t, L, false);
      g.restore();
    });
  },
});
})();
