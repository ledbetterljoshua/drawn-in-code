/* shore.js — the ground at the stack's foot: wet sand that mirrors the afterglow and the stack
   (the drawers' lamps become blue streaks in it), the pale causeway curving in from the bottom left
   with its ripple marks, snow dust and tracks, hush-lamp marker posts along its edge, the tide
   creeping back in over the flats on both sides, the boulders and weed at the foot.
   z 5 sand (still) · 6 tide (moving) · 12 boulders (still, in front of the stack's foot) ·
   14 marker posts. Hover: tide water rings out from the pointer; a marker lamp gutters and its
   reflection shivers; the weed on the boulders lifts. */
(() => {
const { TAU, clamp, lerp, ease, rng, noise, wind, st, P, layer, onLayout, sprite, blit, grad, radial, poly, curve, circ, ell, ink } = Drawn;
const C = OW.C, HZ = OW.HZ, LINE = OW.LINE, mix = OW.mix;
const SHORE = OW.SHORE, BASE = OW.BASE;

// the causeway's centre line, far end (in the arch) to near end (off the bottom left)
const CW = [[396, 1262], [366, 1288], [296, 1326], [206, 1372], [128, 1420], [86, 1476], [92, 1548], [150, 1640], [262, 1770], [410, 1950], [580, 2200]];
// perspective: width grows with distance below the horizon, nothing more
const cwWidth = (y) => (y - OW.HZ) * 0.92;
function causewayEdges() {
  const L = [], Rr = [];
  for (let i = 0; i < CW.length; i++) {
    const [x, y] = CW[i], a = CW[Math.max(0, i - 1)], b = CW[Math.min(CW.length - 1, i + 1)];
    let nx = -(b[1] - a[1]), ny = b[0] - a[0]; const m = Math.hypot(nx, ny); nx /= m; ny /= m;
    const w = cwWidth(y) / 2 * (1 + 0.12 * Math.sin(i * 2.3));
    L.push([x + nx * w, y + ny * w * 0.35]); Rr.push([x - nx * w, y - ny * w * 0.35]);
  }
  return { L, R: Rr };
}
const EDGES = causewayEdges();
OW.CW = CW; OW.cwWidth = cwWidth;
const cwPath = () => curve(EDGES.L.concat(EDGES.R.slice().reverse()));
// a point on the causeway: s 0 (far) → 1 (near), o −1..1 across
OW.cwAt = (s, o = 0) => {
  const f = s * (CW.length - 1), i = Math.min(CW.length - 2, Math.floor(f)), k = f - i;
  const x = lerp(CW[i][0], CW[i + 1][0], k), y = lerp(CW[i][1], CW[i + 1][1], k);
  return [x + o * cwWidth(y) * 0.42, y + o * cwWidth(y) * 0.05];
};

// ------------------------------------------------------------ the sand
layer({
  id: 'sand', z: 5, still: true,
  draw(g) {
    const v = st.view, X0 = v.x0 - 20, X1 = v.x1 + 20, Y1 = v.y1 + 20;
    const R = rng(616);
    // wet sand: a mirror, so it carries the sky upside down — bright at the shore, darker near us
    g.fillStyle = grad(g, 0, SHORE, 0, Math.max(Y1, 1600), [[0, '#d4949a'], [0.04, '#a87590'], [0.14, '#6e5680'], [0.35, '#4a4068'], [0.7, '#342e52'], [1, '#26223e']]);
    g.fillRect(X0, SHORE, X1 - X0, Y1 - SHORE);
    g.save(); g.translate(OW.SUNX, SHORE); g.scale(1, 0.16);
    g.fillStyle = radial(g, 0, 0, 0, 1300, [[0, 'rgba(255,214,180,0.75)'], [0.2, 'rgba(250,170,150,0.4)'], [0.6, 'rgba(200,120,150,0.12)'], [1, 'rgba(200,120,150,0)']]);
    g.fillRect(-3000, 0, 6000, 3000);
    g.restore();
    // the stack's reflection: flipped about its foot, darker, broken by the sand's ripples
    const S = OW.stackSprite && OW.stackSprite();
    if (S) {
      g.save();
      g.beginPath(); g.rect(X0, BASE - 6, X1 - X0, Y1); g.clip();
      g.translate(0, BASE * 2 - 4); g.scale(1, -1);
      for (let i = 0; i < 46; i++) {
        // draw in horizontal slivers, each nudged sideways: a mirror on rippled wet sand
        const y0 = BASE - i * 26, h = 26;
        g.save(); g.beginPath(); g.rect(X0, y0 - h, X1 - X0, h + 1); g.clip();
        g.globalAlpha = clamp(0.42 - i * 0.022, 0, 0.42);
        if (g.globalAlpha > 0) { blit(g, S, Math.sin(i * 1.7) * (2 + i * 0.5), 0); g.globalAlpha *= 0.5; blit(g, S, -Math.sin(i * 2.3) * (3 + i * 0.6), 2); }
        g.restore();
      }
      g.restore();
      // tint the reflection toward the wet-sand violet so it sits in the sand, not on it
      g.fillStyle = 'rgba(52,40,80,0.4)'; g.fillRect(X0, BASE - 6, X1 - X0, Y1 - BASE);
      // a bright skim of afterglow laid across the wet just below the stack's foot
      g.fillStyle = grad(g, 0, BASE - 4, 0, BASE + 30, [[0, 'rgba(255,190,170,0.28)'], [1, 'rgba(255,190,170,0)']]); g.fillRect(X0, BASE - 4, X1 - X0, 34);
    }
    // ripple marks: long gentle crests, short and close in the distance, broad and spaced near us
    for (let i = 0; i < 380; i++) {
      const k = R() ** 1.3, y = SHORE + 8 + k * (Y1 - SHORE);
      const x = X0 + R() * (X1 - X0), len = 10 + k * 160 * (0.4 + R());
      const s = (y - SHORE) / 300;
      g.globalAlpha = 0.18 + R() * 0.16;
      g.strokeStyle = R() < 0.5 ? '#1e1a34' : '#9a86ac';
      g.lineWidth = 0.6 + s * 1.2;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y - 2 - s * 4, x + len, y + (R() - 0.5) * 3); g.stroke();
    }
    g.globalAlpha = 1;
    // standing water left by the ebb: brighter, cleaner mirrors of the sky
    for (let i = 0; i < 34; i++) {
      const y = SHORE + 14 + R() ** 1.6 * (Y1 - SHORE - 20);
      const x = X0 + R() * (X1 - X0);
      const s = 0.4 + (y - SHORE) / 250;
      const w = (30 + R() * 140) * s, h = (2 + R() * 5) * s;
      const near = clamp(1 - Math.abs(x - OW.SUNX) / 900, 0, 1);
      g.fillStyle = grad(g, 0, y - h, 0, y + h, [[0, mix('#5a4c7c', '#f0a89a', near * clamp(1 - (y - SHORE) / 500, 0, 1))], [1, '#3a3260']]);
      g.globalAlpha = 0.75;
      g.fill(ell(x, y, w, h));
      g.globalAlpha = 0.5; g.lineWidth = 1; g.strokeStyle = '#1e1a34'; g.stroke(ell(x, y + 0.5, w, h));
      g.globalAlpha = 1;
    }

    // ---------------------------------------------- the causeway
    const CP = cwPath();
    // a soft wet margin first, so the dry crown sits in the flats rather than on them
    g.lineWidth = 18; g.strokeStyle = 'rgba(70,58,96,0.5)'; g.stroke(CP);
    g.lineWidth = 8; g.strokeStyle = 'rgba(110,92,130,0.55)'; g.stroke(CP);
    g.save(); g.clip(CP);
    // dry sand catches the sky: pale lilac on top, warmer where it faces the glow
    g.fillStyle = grad(g, 0, 1262, 0, 2000, [[0, '#d8b4b0'], [0.08, '#b9a0b0'], [0.3, '#9a88a4'], [0.6, '#7e7092'], [1, '#5c5276']]);
    g.fill(CP);
    // ripple crests across the causeway
    for (let i = 0; i < 160; i++) {
      const s = R() ** 1.2, [x, y] = OW.cwAt(s, (R() - 0.5) * 2.2), w = cwWidth(y);
      const len = w * (0.08 + R() * 0.25), k = (y - 1262) / 400;
      g.globalAlpha = 0.25; g.strokeStyle = '#4e4266'; g.lineWidth = 0.7 + k;
      g.beginPath(); g.moveTo(x - len / 2, y); g.quadraticCurveTo(x, y - 1.5 - k * 2, x + len / 2, y + 1); g.stroke();
      g.globalAlpha = 0.35; g.strokeStyle = '#efdcd8'; g.lineWidth = 0.6 + k * 0.6;
      g.beginPath(); g.moveTo(x - len / 2, y - 1 - k); g.quadraticCurveTo(x, y - 2.5 - k * 3, x + len / 2, y); g.stroke();
    }
    // snow dust: fine, drifted into the ripple troughs
    for (let i = 0; i < 700; i++) {
      const s = R() ** 1.1, [x, y] = OW.cwAt(s, (R() - 0.5) * 2.3), k = 0.5 + (y - 1262) / 300;
      g.globalAlpha = 0.3 + R() * 0.4; g.fillStyle = '#f4f0fa';
      g.fillRect(x, y, 1 + R() * 2 * k, 0.6 + R() * k * 0.6);
    }
    g.globalAlpha = 1;
    g.restore();
    // the wet edges of the causeway, where it slips into the flats
    g.lineWidth = 2; g.strokeStyle = 'rgba(30,24,50,0.55)';
    g.stroke(curve(EDGES.L, false)); g.stroke(curve(EDGES.R, false));
    g.lineWidth = 1; g.strokeStyle = 'rgba(240,210,210,0.35)';
    g.stroke(curve(EDGES.R.map(([x, y]) => [x, y - 2]), false));

    // tracks up the causeway: a porter's long bounding stoat prints, and three sets of little
    // hedgehog feet with a suitcase's drag line beside them
    for (let i = 0; i < 60; i++) {
      const s = 0.05 + i / 64, [x, y] = OW.cwAt(s, 0.35 + Math.sin(i * 0.7) * 0.05), k = 0.5 + (y - 1262) / 260;
      g.fillStyle = 'rgba(60,46,80,0.55)';
      g.fill(ell(x + (i % 2 ? 3 : -3) * k, y, 2.2 * k, 1.1 * k));
      g.fill(ell(x + (i % 2 ? 3 : -3) * k + 3 * k, y + 1, 1.4 * k, 0.8 * k));
    }
    for (let i = 0; i < 90; i++) {
      const s = 0.22 + i / 120, [x, y] = OW.cwAt(s, -0.2 + Math.sin(i * 0.4) * 0.04), k = 0.5 + (y - 1262) / 260;
      g.fillStyle = 'rgba(60,46,80,0.45)';
      g.fill(circ(x + (i % 2 ? 2 : -2) * k, y, 0.9 * k));
      if (i % 3 === 0) { g.fillStyle = 'rgba(60,46,80,0.25)'; g.fillRect(x + 6 * k, y, 6 * k, 0.8 * k); }
    }
  },
});

// ------------------------------------------------------------ the tide, creeping in over the flats
// two sheets of water, one each side of the causeway, whose edges advance and fall back on a long
// swell; a foam line rides each edge. Hovering the water sets rings going.
const rings = [];
const tide = OW.tide = { k: 0 };
layer({
  id: 'tide', z: 6,
  hit(x, y) { return y > SHORE + 6 && y < SHORE + 70 && (x < 260 || x > 560); },
  onEnter() { rings.push({ x: P.x, y: P.y, age: 0 }); },
  update(dt, t, L) {
    tide.k = 0.5 + 0.5 * Math.sin(t * 0.21) * Math.sin(t * 0.07 + 1);
    if (L.hovered && P.sp > 40 && Math.random() < dt * 6) rings.push({ x: P.x, y: P.y, age: 0 });
    for (let i = rings.length - 1; i >= 0; i--) if ((rings[i].age += dt) > 2.2) rings.splice(i, 1);
  },
  draw(g, t) {
    const v = st.view;
    const k = tide.k;
    // right flat: the sea's edge, coming in toward the stack's foot
    for (const side of [-1, 1]) {
      const pts = [];
      const xa = side < 0 ? v.x0 - 20 : 470, xb = side < 0 ? 340 : v.x1 + 20;
      for (let x = xa; x <= xb; x += 24) {
        const y = SHORE + 10 + 18 * k + 6 * Math.sin(x * 0.013 + t * 0.6) + 5 * noise(x * 0.01 + t * 0.2) + (side < 0 ? (340 - x) * 0.02 : (x - 470) * 0.008);
        pts.push([x, y]);
      }
      const sheet = poly([[xa, SHORE - 2], ...pts, [xb, SHORE - 2]]);
      g.fillStyle = grad(g, 0, SHORE, 0, SHORE + 50, [[0, 'rgba(70,58,110,0.9)'], [1, 'rgba(80,66,120,0.55)']]);
      g.fill(sheet);
      // the afterglow on the incoming water
      g.save(); g.clip(sheet);
      g.save(); g.translate(OW.SUNX, SHORE); g.scale(1, 0.08); g.fillStyle = radial(g, 0, 0, 0, 900, [[0, 'rgba(255,200,170,0.32)'], [1, 'rgba(255,190,170,0)']]); g.fillRect(-900, -100, 1800, 1000); g.restore();
      g.restore();
      // foam: a bright broken line on the edge, a fainter one a beat behind it
      for (let i = 0; i < pts.length - 1; i++) {
        const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
        const n = noise(i * 0.7 + t * 0.3 + side * 9);
        if (n < -0.35) continue;
        g.lineWidth = 0.8 + (n + 0.35) * 1.6; g.strokeStyle = `rgba(240,230,246,${0.4 + (n + 0.35) * 0.4})`;
        g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 1.5, x1, y1); g.stroke();
        if (n > 0.2) { g.lineWidth = 0.7; g.strokeStyle = 'rgba(240,230,246,0.3)'; g.beginPath(); g.moveTo(x0 + 4, y0 - 4); g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 7, x1 - 4, y1 - 4); g.stroke(); }
      }
    }
    for (const r of rings) {
      const a = 1 - r.age / 2.2;
      g.globalAlpha = a * 0.6; g.lineWidth = 1; g.strokeStyle = '#efe6ff';
      g.stroke(ell(r.x, r.y, 4 + r.age * 26, 1.2 + r.age * 6));
      g.globalAlpha = a * 0.3; g.stroke(ell(r.x, r.y, 2 + r.age * 14, 0.8 + r.age * 3));
    }
    g.globalAlpha = 1;
  },
});

// ------------------------------------------------------------ boulders at the foot
layer({
  id: 'boulders', z: 12, still: true,
  draw(g) {
    const R = rng(2727);
    const stones = [
      [340, 1262, 34, 20], [304, 1268, 22, 12], [470, 1262, 18, 9], [520, 1266, 26, 12], [610, 1262, 14, 7],
      [760, 1264, 22, 10], [880, 1262, 16, 8], [1030, 1266, 30, 14], [1092, 1268, 44, 20], [1150, 1272, 30, 13], [1190, 1276, 18, 8],
      [280, 1278, 14, 7], [1124, 1282, 12, 6],
    ];
    for (const [x, y, w, h] of stones) {
      const pts = [];
      for (let i = 0; i < 9; i++) {
        const a = Math.PI + (i / 8) * Math.PI;
        pts.push([x + Math.cos(a) * w * (0.85 + R() * 0.25), y + Math.sin(a) * h * (0.8 + R() * 0.3)]);
      }
      pts.push([x + w, y + 3], [x - w, y + 3]);
      const p = poly(pts);
      g.fillStyle = 'rgba(14,10,24,0.5)'; g.fill(ell(x + 3, y + 3, w * 1.1, h * 0.25));
      ink(g, p, mix('#3a3046', '#5a3e50', 0.5), 1.8);
      g.save(); g.clip(p);
      g.fillStyle = 'rgba(240,170,160,0.35)'; g.fill(ell(x - w * 0.1, y - h * 0.9, w * 0.8, h * 0.25));
      g.fillStyle = 'rgba(14,10,24,0.4)'; g.fillRect(x - w, y - h * 0.25, w * 2, h);
      for (let i = 0; i < w * 0.8; i++) { g.fillStyle = R() < 0.7 ? '#b4a8bc' : '#2a2236'; g.fill(circ(x - w + R() * 2 * w, y - R() * h * 0.7, 0.8 + R() * 1.4)); }
      g.restore();
      // a snow cap on the bigger ones
      if (w > 20) ink(g, curve([[x - w * 0.6, y - h * 0.78], [x - w * 0.1, y - h * 1.08], [x + w * 0.5, y - h * 0.86], [x + w * 0.1, y - h * 0.72]]), C.snow, 1, C.snowShade);
    }
    // kelp strands draped over the stones and the foot
    g.lineCap = 'round';
    for (let i = 0; i < 26; i++) {
      const x = 300 + R() * 900, y = 1250 + R() * 18;
      const l = 14 + R() * 30;
      g.lineWidth = 2 + R() * 2.5; g.strokeStyle = R() < 0.5 ? '#3c3a2a' : '#4c4630';
      g.beginPath(); g.moveTo(x, y - l * 0.4); g.bezierCurveTo(x + 6, y - l * 0.2, x - 4, y, x + (R() - 0.5) * l, y + 6); g.stroke();
    }
  },
});

// ------------------------------------------------------------ the foreground
// big wet rocks at the bottom left with snow on their shoulders and wrack over them: they're
// near, so drawn large and dark, a frame for the causeway coming in past them
layer({
  id: 'foreground', z: 36, still: true,
  draw(g) {
    const R = rng(909);
    const rocks = [[-150, 1530, 150, 70], [40, 1555, 90, 46], [-430, 1500, 120, 60], [-20, 1480, 40, 20], [1040, 1600, 120, 50], [1240, 1540, 90, 40]];
    for (const [x, y, w, h] of rocks) {
      // angular slabs of the same bedded stone as the stack, tilted, with flat tops
      const tilt = (R() - 0.5) * 0.3;
      const pts = [[x - w, y + h], [x - w * 0.95, y - h * 0.3], [x - w * 0.7, y - h * 0.85], [x - w * 0.2, y - h - tilt * w], [x + w * 0.35, y - h * 0.95 + tilt * w * 0.5], [x + w * 0.8, y - h * 0.6 + tilt * w], [x + w, y - h * 0.1], [x + w, y + h]];
      const p = poly(pts.map(([px, py]) => [px + (R() - 0.5) * 6, py + (R() - 0.5) * 4]));
      ink(g, p, '#1c1626', 3);
      g.save(); g.clip(p);
      // the top plane catches the glow; bedding lines run across the face
      g.fillStyle = 'rgba(255,170,160,0.22)'; g.fill(poly([pts[1], pts[2], pts[3], pts[4], pts[5], [pts[5][0], pts[5][1] + h * 0.25], [pts[1][0], pts[1][1] + h * 0.2]]));
      g.strokeStyle = 'rgba(8,4,14,0.6)'; g.lineWidth = 1.6;
      for (let k = 1; k < 4; k++) { const yy = y - h * 0.5 + k * h * 0.35; g.beginPath(); g.moveTo(x - w, yy + tilt * 20); g.lineTo(x + w, yy - tilt * 20 + (R() - 0.5) * 6); g.stroke(); }
      for (let i = 0; i < w * 0.5; i++) { g.fillStyle = R() < 0.6 ? '#5a5068' : '#0e0a16'; g.fill(circ(x - w + R() * 2 * w, y - R() * h * 0.9, 0.8 + R() * 1.8)); }
      g.restore();
      // a thin, broken skin of snow on the top plane
      for (let k = 0; k < 3; k++) {
        const t0 = 0.15 + R() * 0.5, a0 = [lerp(pts[2][0], pts[5][0], t0), lerp(pts[2][1], pts[5][1], t0)], len = w * (0.2 + R() * 0.35);
        ink(g, curve([[a0[0], a0[1] + 2], [a0[0] + len * 0.3, a0[1] - 2 - R() * 3], [a0[0] + len, a0[1] + 1], [a0[0] + len * 0.5, a0[1] + 3]]), C.snow, 1, C.snowShade);
      }
      g.lineCap = 'round';
      for (let i = 0; i < w / 22; i++) {
        const sx = x - w * 0.8 + R() * w * 1.6, sy = y - h * (0.3 + R() * 0.5);
        g.lineWidth = 4 + R() * 4; g.strokeStyle = R() < 0.5 ? '#2c2a1e' : '#3a3424';
        g.beginPath(); g.moveTo(sx, sy); g.bezierCurveTo(sx + 10, sy + 10, sx - 8, sy + 20, sx + (R() - 0.5) * 20, sy + 30 + R() * 20); g.stroke();
      }
    }
  },
});

// ------------------------------------------------------------ marker posts along the causeway
// driftwood stakes each with a hush lamp on a hook, so the porters can find the way at the turn of
// the tide. Their blue light lies on the sand and doubles in the water.
const POSTS = [[0.05, 1.25], [0.15, -1.3], [0.3, 1.2], [0.44, -1.25], [0.6, 1.2], [0.75, -1.25]].map(([s, o], i) => ({ i, s, o, at: OW.cwAt(s, o), sw: 0, sv: 0, gut: 0 }));
OW.posts = POSTS;
function lampGlow(g, x, y, r, a) {
  g.fillStyle = radial(g, x, y, 0, r, [[0, `rgba(120,160,255,${a * 0.8})`], [0.35, `rgba(90,130,250,${a * 0.32})`], [1, 'rgba(80,120,250,0)']]);
  g.fillRect(x - r, y - r, r * 2, r * 2);
}
OW.lampGlow = lampGlow;
// a hush lamp: a candle behind blue paper on a wire frame; s scales it
function hushLamp(g, x, y, s, flick = 1, lit = 1) {
  g.save(); g.translate(x, y); g.scale(s, s);
  g.lineWidth = 1.2 / s; g.strokeStyle = '#2a2236';
  g.beginPath(); g.moveTo(0, -12); g.lineTo(0, -8); g.stroke();
  const body = new Path2D(); body.moveTo(-6, -8); body.lineTo(6, -8); body.quadraticCurveTo(8.5, 0, 6, 8); body.lineTo(-6, 8); body.quadraticCurveTo(-8.5, 0, -6, -8); body.closePath();
  g.fillStyle = grad(g, -7, 0, 7, 0, [[0, '#5e7ed8'], [0.5, mix('#8fb4ff', '#dde8ff', 0.4 * flick * lit)], [1, '#5e7ed8']]);
  g.fill(body);
  g.globalAlpha = 0.5; g.strokeStyle = '#3e4ea0'; g.lineWidth = 0.6;
  for (const yy of [-4, 0, 4]) { g.beginPath(); g.moveTo(-6.8, yy); g.lineTo(6.8, yy); g.stroke(); }
  g.globalAlpha = 1;
  g.lineWidth = 1.4; g.strokeStyle = LINE; g.stroke(body);
  ink(g, Drawn.rect(-6.5, -9.5, 13, 2.4), '#3a3048', 1);
  ink(g, Drawn.rect(-6.5, 7.5, 13, 2.4), '#3a3048', 1);
  g.fillStyle = `rgba(255,250,235,${0.6 * flick * lit})`; g.fill(ell(0, 1, 1.6, 3 * flick));
  g.restore();
}
OW.hushLamp = hushLamp;
layer({
  id: 'posts', z: 14,
  hit(x, y) { for (const p of POSTS) { const [px, py] = p.at, s = 0.6 + (py - 1262) / 200; if (Math.abs(x - px) < 16 * s && y < py + 4 && y > py - 70 * s) { this.cur = p; return true; } } return false; },
  onEnter(L) { if (L.cur) L.cur.sv += P.vx * 0.004; },
  update(dt, t, L) {
    for (const p of POSTS) {
      const w = wind(t, p.at[0]);
      p.sv += (-(p.sw - w * 0.08) * 26 - p.sv * 1.8) * dt; p.sw += p.sv * dt;
      p.gut = ease(p.gut, L.hovered && L.cur === p ? 1 : 0, 4, dt);
    }
  },
  draw(g, t) {
    for (const p of POSTS) {
      const [x, y] = p.at, s = 0.55 + (y - 1262) / 210;
      const top = y - 64 * s;
      const fl = (0.85 + 0.15 * Math.sin(t * 11 + p.i * 3) * Math.sin(t * 7.3 + p.i)) * (1 - p.gut * 0.55 * (0.5 + 0.5 * Math.sin(t * 23)));
      // light on the sand and its broken reflection
      g.save(); g.translate(x, y + 2); g.scale(1, 0.3); lampGlow(g, 0, 0, 70 * s, 0.35 * fl); g.restore();
      g.globalAlpha = 0.45 * fl; g.fillStyle = '#9ab8ff';
      for (let k = 0; k < 5; k++) g.fillRect(x - (6 - k) * s * 1.4 + Math.sin(t * 2 + k + p.i) * s * (1 + p.gut * 3), y + 4 + k * 5 * s, (12 - k * 2) * s * 1.4, 1.4 * s);
      g.globalAlpha = 1;
      // the stake: grey driftwood, split and leaning
      const lean = (p.i % 2 ? 0.06 : -0.05);
      const pp = poly([[x - 3 * s, y + 2], [x + 3 * s, y + 2], [x + 2.4 * s + lean * 64 * s, top], [x - 2.2 * s + lean * 64 * s, top]]);
      ink(g, pp, '#6e6278', 1.4);
      g.strokeStyle = '#4a4058'; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + lean * 60 * s, top + 4); g.stroke();
      g.fillStyle = 'rgba(255,190,170,0.5)'; g.fillRect(x - 2.6 * s + lean * 30 * s, y - 44 * s, 1.2, 40 * s);
      // snow cap
      ink(g, ell(x + lean * 64 * s, top, 3.6 * s, 1.8 * s), C.snow, 0.8, C.snowShade);
      // the arm and the lamp swinging on its hook
      const ax = x + lean * 64 * s + (p.o > 0 ? -1 : 1) * 2 * s, ay = top + 6 * s, dir = p.o > 0 ? 1 : -1;
      g.lineWidth = 1.6 * s; g.strokeStyle = '#3a3048';
      g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + dir * 12 * s, ay - 2 * s); g.stroke();
      const hx = ax + dir * 12 * s, hy = ay - 2 * s;
      g.save(); g.translate(hx, hy); g.rotate(p.sw);
      g.translate(-hx, -hy);
      lampGlow(g, hx, hy + 18 * s, 34 * s, 0.4 * fl);
      hushLamp(g, hx, hy + 18 * s, s * 0.9, fl);
      g.restore();
    }
  },
});
})();
