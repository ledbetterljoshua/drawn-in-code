/* sky.js — everything behind the stack: the midwinter sky an hour after sunset (ink above, a
   rose-and-apricot band on the horizon behind the stack's foot), long underlit stratus, the first
   stars, the sea out to the horizon with the afterglow laid on it, two far stacks dissolving in the
   haze to the right and the dark mainland to the left, where the causeway comes from.
   z 0–4, all still except the stars (twinkle), the far lighthouse (sweeps) and the sea glints.
   Hover: a star brightens and throws a short glint; the lighthouse beam slows and stares. */
(() => {
const { TAU, clamp, lerp, rng, noise, st, layer, grad, radial, poly, curve, circ, ell, ink } = Drawn;
const C = OW.C, HZ = OW.HZ, mix = OW.mix;
const SUNX = 300; // where the sun went down: just left of the stack, so it shines through the arch

// ------------------------------------------------------------ sky
layer({
  id: 'sky', z: 0, still: true,
  draw(g) {
    const v = st.view;
    const X0 = v.x0 - 20, X1 = v.x1 + 20, Y0 = v.y0 - 20;
    g.fillStyle = grad(g, 0, Math.min(Y0, -300), 0, HZ, [
      [0, '#16163a'], [0.3, '#22245a'], [0.52, '#34356e'], [0.7, '#4c4478'], [0.8, C.sky.mid],
      [0.88, '#8c6488'], [0.94, C.sky.low], [0.975, '#dd9395'], [1, '#efab98'],
    ]);
    g.fillRect(X0, Y0, X1 - X0, HZ - Y0 + 2);
    // the afterglow: warm, wide and flat, strongest where the sun went down
    g.save();
    g.translate(SUNX, HZ); g.scale(1, 0.22);
    g.fillStyle = radial(g, 0, 0, 0, 1500, [[0, 'rgba(255,240,205,1)'], [0.1, 'rgba(255,212,160,0.9)'], [0.28, 'rgba(250,166,138,0.5)'], [0.55, 'rgba(210,120,140,0.18)'], [1, 'rgba(160,100,140,0)']]);
    g.fillRect(-3000, -6000, 6000, 6000);
    g.restore();
    g.save();
    g.translate(SUNX, HZ); g.scale(1, 0.5);
    g.fillStyle = radial(g, 0, 0, 0, 900, [[0, 'rgba(255,190,160,0.35)'], [0.5, 'rgba(220,140,160,0.12)'], [1, 'rgba(200,120,160,0)']]);
    g.fillRect(-3000, -3000, 6000, 3000);
    g.restore();

    // the snow cloud: a deck moving in over the top of the picture. Its ragged underside hangs in
    // lumps and catches the afterglow — rose and apricot near the sunset, violet away from it —
    // above a clear band of sky on the horizon. (It's what's dropping the snow.)
    const R = rng(77);
    const deckY = (x) => 380 + 120 * noise(x * 0.0022 + 4) + 70 * noise(x * 0.006 + 9) + (x - SUNX) * 0.05;
    const top = Math.min(Y0, -600);
    // the body of the deck: a soft lower edge, no hard line (columns, each with its own fade)
    for (let x = X0; x < X1; x += 6) {
      const y = deckY(x);
      g.fillStyle = grad(g, 0, y - 260, 0, y + 30, [[0, '#1a1834'], [0.7, 'rgba(36,32,64,0.96)'], [0.9, 'rgba(46,40,74,0.6)'], [1, 'rgba(46,40,74,0)']]);
      g.fillRect(x, y - 260, 7, 290);
    }
    g.fillStyle = grad(g, 0, top, 0, 200, [[0, '#12112a'], [1, '#1a1834']]);
    g.fillRect(X0, top, X1 - X0, 200 - top + 1);
    for (let x = X0; x < X1; x += 6) { const y = deckY(x); if (y - 260 > 200) { g.fillStyle = '#1a1834'; g.fillRect(x, 200, 7, y - 260 - 200 + 1); } }
    // rolls along the underside (stratocumulus): long soft lozenges, lit from below near the sunset
    for (let i = 0; i < 260; i++) {
      const lx = X0 + R() * (X1 - X0), y = deckY(lx) - R() ** 1.5 * 70;
      const near = clamp(1 - Math.abs(lx - SUNX) / 1200, 0, 1) ** 1.4;
      const rx = 24 + R() * 80, ry = 4 + R() * 10;
      g.globalAlpha = 0.18 + R() * 0.22;
      g.fillStyle = mix('#231f40', '#3a2a4c', near); g.fill(ell(lx, y, rx, ry));
      g.globalAlpha = (0.12 + R() * 0.3) * (0.3 + near);
      g.fillStyle = mix('#6c5888', '#ffb894', near); g.fill(ell(lx + 4, y + ry * 0.6, rx * 0.8, ry * 0.45));
    }
    g.globalAlpha = 1;
    // soft folds inside the deck, so it isn't a flat lid
    for (let i = 0; i < 40; i++) {
      const x = X0 + R() * (X1 - X0), y = deckY(x) - 60 - R() * 380;
      g.globalAlpha = 0.18; g.fillStyle = R() < 0.5 ? '#2e2a4e' : '#100f24';
      g.fill(ell(x, y, 80 + R() * 220, 6 + R() * 16));
    }
    g.globalAlpha = 1;
    // a few streaks low in the clear band, lit hot near the sunset
    for (let i = 0; i < 9; i++) {
      const cx = SUNX + (R() - 0.45) * 1800, yy = HZ - 30 - R() * 150, len = 120 + R() * 380;
      const near = clamp(1 - Math.abs(cx - SUNX) / 900, 0, 1);
      for (let k = 0; k < 4; k++) {
        const w = len * (0.3 + R() * 0.4), h = 1.4 + R() * 3.2, ox = (R() - 0.5) * len * 0.5;
        g.globalAlpha = 0.25 + R() * 0.3; g.fillStyle = mix('#5a4470', '#3a2c52', R()); g.fill(ell(cx + ox, yy, w, h));
        g.globalAlpha *= 1.2; g.fillStyle = mix('#c88aa0', '#ffd2a8', near); g.fill(ell(cx + ox + 4, yy + h * 0.6, w * 0.8, Math.max(0.7, h * 0.4)));
      }
    }
    g.globalAlpha = 1;

    // ---------------------------------------------------- the far side of the sea
    // far stacks to the right, pale with distance; a low headland and the mainland to the left
    const haze = (k) => OW.mix('#3a3360', '#9a7c9c', k);
    const farStack = (x, w, h, k, seed) => {
      const r = rng(seed), pts = [[x - w * 0.6, HZ + 2]];
      const n = 9;
      for (let i = 0; i <= n; i++) {
        const t = i / n, side = t < 0.5 ? -1 : 1;
        const yy = HZ - h * Math.sin(Math.min(1, (t < 0.5 ? t : 1 - t) * 2.6) * Math.PI / 2) - (r() - 0.5) * h * 0.05;
        pts.push([x + (t - 0.5) * w * (0.8 + 0.25 * Math.abs(t - 0.5)) + side * r() * 4, yy]);
      }
      pts.push([x + w * 0.6, HZ + 2]);
      const p = poly(pts);
      g.fillStyle = haze(k); g.fill(p);
      // rose rim on the left (sunward) edges
      g.save(); g.clip(p);
      g.fillStyle = 'rgba(255,190,170,' + (0.18 + k * 0.2) + ')';
      g.fill(poly(pts.map(([px, py]) => [px - 3, py])));
      g.restore();
      g.fillStyle = haze(k); g.fill(poly(pts.map(([px, py]) => [px + 2, py + 1])));
      // snow on the top
      g.fillStyle = OW.mix(haze(k), '#e8e2f2', 0.45);
      g.fill(poly([pts[4], pts[5], pts[6], pts[7], [pts[7][0], pts[7][1] + 5], [pts[5][0], pts[5][1] + 4], [pts[4][0], pts[4][1] + 5]]));
    };
    farStack(1320, 80, 190, 0.78, 3);
    farStack(1440, 46, 120, 0.86, 9);
    farStack(1620, 130, 90, 0.9, 12);
    farStack(1240, 28, 64, 0.92, 21);
    // the mainland: a long low headland with a lighthouse and one cottage window
    const land = [[X0, HZ + 4]];
    for (let x = X0; x <= 140; x += 30) land.push([x, HZ - 34 - 26 * noise(x * 0.004 + 3) - (x < -300 ? (x + 300) * -0.08 : 0)]);
    land.push([200, HZ - 6], [240, HZ + 4]);
    const lp = poly(land);
    g.fillStyle = haze(0.42); g.fill(lp);
    g.save(); g.clip(lp);
    g.fillStyle = 'rgba(30,24,52,0.35)';
    for (let i = 0; i < 40; i++) { const x = X0 + R() * (240 - X0); g.fillRect(x, HZ - 60 + R() * 60, 2 + R() * 6, 1.2); }
    g.restore();
    // snowfields along the headland's top
    g.globalAlpha = 0.5; g.lineWidth = 2; g.strokeStyle = '#cfc6dc';
    g.stroke(poly(land.slice(1, -2), false)); g.globalAlpha = 1;
  },
});

// ------------------------------------------------------------ the lighthouse on the far headland
const LH = { x: -170, y: HZ - 72 };
const lighthouse = layer({
  id: 'lighthouse', z: 5.4,
  hit(x, y) { return Math.abs(x - LH.x) < 34 && y > LH.y - 30 && y < HZ; },
  ang: 0, spd: 0.55,
  update(dt, t, L) { L.spd = Drawn.ease(L.spd, L.hovered ? 0.05 : 0.55, 3, dt); L.ang += L.spd * dt; },
  draw(g, t, L) {
    const { x, y } = LH;
    g.fillStyle = '#3d3462';
    g.fill(poly([[x - 5, y + 50], [x - 3.4, y + 6], [x + 3.4, y + 6], [x + 5, y + 50]]));
    g.fillStyle = '#5a4c80'; g.fillRect(x - 3, y + 18, 6, 4);
    g.fillStyle = '#2c2650'; g.fill(poly([[x - 4.5, y + 6], [x, y - 1], [x + 4.5, y + 6]]));
    // the beam sweeps round: we see it as a narrowing wedge when it points our way
    const a = L.ang % TAU, face = Math.cos(a);
    const glow = clamp(face, 0, 1) ** 6;
    g.fillStyle = `rgba(255,236,190,${0.55 + glow * 0.45})`; g.fill(circ(x, y + 3, 2 + glow * 2));
    const dir = Math.sin(a) > 0 ? 1 : -1, len = 160 * (1 - Math.abs(face) * 0.7);
    if (face > -0.2) {
      g.fillStyle = grad(g, x, y, x + dir * len, y, [[0, `rgba(255,232,190,${0.32 * (0.4 + glow)})`], [1, 'rgba(255,232,190,0)']]);
      g.fill(poly([[x, y + 2], [x + dir * len, y - 10], [x + dir * len, y + 14]]));
    }
    if (glow > 0.2) { g.fillStyle = `rgba(255,240,210,${glow * 0.25})`; g.fill(circ(x, y + 3, 16 * glow)); }
  },
});

// ------------------------------------------------------------ stars (and Venus)
const stars = [];
{
  const R = rng(404);
  for (let i = 0; i < 14; i++) stars.push({ x: 1000 + R() * 900, y: 560 + R() * 260, r: 0.5 + R() ** 3 * 1.1, ph: R() * TAU, sp: 0.6 + R() * 2 });
  stars.push({ x: 1150, y: 640, r: 2.4, ph: 0, sp: 0.4, venus: true });
}
layer({
  id: 'stars', z: 5.3,
  hit(x, y) { for (const s of stars) if ((x - s.x) ** 2 + (y - s.y) ** 2 < 260) { this.cur = s; return true; } return false; },
  draw(g, t, L) {
    for (const s of stars) {
      // fade toward the horizon: stars only show where the sky is dark enough
      const vis = clamp((HZ - 300 - s.y) / 200, 0, 0.7) + (s.venus ? 0.9 : 0);
      if (vis <= 0) continue;
      const tw = 0.65 + 0.35 * Math.sin(t * s.sp + s.ph) * Math.sin(t * s.sp * 1.7 + s.ph * 2);
      const boost = L.cur === s ? L.hover : 0;
      g.globalAlpha = clamp(vis * tw + boost, 0, 1);
      g.fillStyle = s.venus ? '#fff4e0' : '#eef0ff';
      g.fill(circ(s.x, s.y, s.r * (1 + boost * 0.8)));
      if (s.venus || boost > 0.05) {
        g.globalAlpha = (s.venus ? 0.25 : 0) + boost * 0.5;
        g.lineWidth = 0.8; g.strokeStyle = '#fff6ea';
        const k = s.r * (4 + boost * 6);
        g.beginPath(); g.moveTo(s.x - k, s.y); g.lineTo(s.x + k, s.y); g.moveTo(s.x, s.y - k); g.lineTo(s.x, s.y + k); g.stroke();
      }
    }
    g.globalAlpha = 1;
  },
});

// ------------------------------------------------------------ the sea, out to the horizon
const SHORE = OW.SHORE = 1214; // where the open water stops and the wet sand starts, at the stack
layer({
  id: 'sea', z: 3, still: true,
  draw(g) {
    const v = st.view, X0 = v.x0 - 20, X1 = v.x1 + 20;
    g.fillStyle = grad(g, 0, HZ, 0, SHORE + 40, [[0, '#6c5a86'], [0.15, '#4a3f6c'], [0.6, C.sea.mid], [1, C.sea.near]]);
    g.fillRect(X0, HZ, X1 - X0, SHORE + 40 - HZ);
    // the afterglow laid on the water: a broad warm path under where the sun went down
    g.save(); g.translate(SUNX, HZ); g.scale(1, 0.09);
    g.fillStyle = radial(g, 0, 0, 0, 1200, [[0, 'rgba(255,205,170,0.8)'], [0.3, 'rgba(240,150,140,0.35)'], [1, 'rgba(200,120,150,0)']]);
    g.fillRect(-3000, 0, 6000, 1000);
    g.restore();
    // swell lines: short, broken, thinner and closer toward the horizon
    const R = rng(55);
    for (let i = 0; i < 120; i++) {
      const k = R() ** 1.6, y = HZ + 2 + k * (SHORE + 30 - HZ);
      const x = X0 + R() * (X1 - X0), len = 6 + k * 60 * (0.5 + R());
      const near = clamp(1 - Math.abs(x - SUNX) / (500 + k * 600), 0, 1);
      g.globalAlpha = 0.12 + near * 0.45;
      g.fillStyle = near > 0.2 ? OW.mix('#9d7ba0', '#ffd0b0', near) : '#5c5084';
      g.fillRect(x, y, len, 0.8 + k * 1.4);
      g.globalAlpha = 0.18; g.fillStyle = '#1c1934';
      g.fillRect(x + len * 0.2, y + 1 + k * 1.6, len * 0.7, 0.8 + k);
    }
    g.globalAlpha = 1;
    // a band of sea smoke lying on the water at the horizon
    g.fillStyle = grad(g, 0, HZ - 8, 0, HZ + 26, [[0, 'rgba(230,180,190,0)'], [0.5, 'rgba(230,180,190,0.22)'], [1, 'rgba(230,180,190,0)']]);
    g.fillRect(X0, HZ - 8, X1 - X0, 34);
  },
});

// glints that move on the warm path
const glints = [];
{ const R = rng(8); for (let i = 0; i < 46; i++) glints.push({ x: SUNX + (R() - 0.5) * 900 * (0.3 + R()), y: HZ + 3 + R() ** 1.5 * 26, ph: R() * TAU, w: 3 + R() * 14 }); }
layer({
  id: 'glints', z: 5.5,
  draw(g, t) {
    for (const q of glints) {
      const a = Math.sin(t * 1.3 + q.ph); if (a < 0.4) continue;
      const near = clamp(1 - Math.abs(q.x - SUNX) / 520, 0, 1);
      g.globalAlpha = (a - 0.4) * 1.4 * (0.3 + near * 0.7);
      g.fillStyle = '#ffe0c4';
      g.fillRect(q.x + Math.sin(t * 0.3 + q.ph) * 6, q.y, q.w * (0.5 + (q.y - HZ) / 40), 1);
    }
    g.globalAlpha = 1;
  },
});
OW.SUNX = SUNX;
})();
