/* leaf.js — the Great Leaf: a burdock leaf as big as a sky, standing on its stalk behind the
   island and arching over the village. We see its underside, lit through from behind, so it
   glows: hottest by the tip where the sun comes through, cooler and greener toward the stalk,
   the veins standing out as pale ribs. Its wavy margin shows a sliver of the darker top surface
   where it curls. Rain drums on it (each hit jolts it on its stalk), so the village under it is
   dry, and the water it gathers runs to the tip and drips into the acorn cistern below.

   Hover the leaf: it sags under its load and pours a stream off the tip into the cistern.
   Hover the drop hanging at the tip: it swells and lets go.
   Under the leaf a moth hangs with its wings wrapped round it; hover it and it opens them.

   leaf z9.5 (behind the island, so its stalk vanishes behind the ridge) · drips z12.5 · moth z9.7 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, ink, st, P, layer, onLayout, sprite, blit } = Drawn;
  const { C, SUN, HZ, LINE } = DH;
  const LF = C.leaf;
  const PIV = [1462, 660];      // where the stalk leaves the ground, behind the ridge
  const JUNC = [1488, 306];     // stalk meets blade
  const TIP = [1006, 452];

  // the blade outline, as seen from below (unflexed, artboard coords)
  const upper = [[1488, 292], [1430, 238], [1350, 208], [1262, 206], [1180, 232], [1110, 278], [1058, 342], [1026, 402]];
  const lower = [[1036, 442], [1086, 434], [1150, 422], [1222, 416], [1300, 412], [1376, 402], [1446, 382], [1520, 368], [1600, 346], [1682, 308], [1752, 256], [1790, 206], [1764, 168], [1690, 156], [1610, 174], [1546, 216], [1500, 270]];
  function outline(r) {
    // a wavy, finely toothed margin
    const pts = [];
    const ring = [...upper, TIP, ...lower];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i], b = ring[(i + 1) % ring.length];
      for (let k = 0; k < 4; k++) {
        const u = k / 4, x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u);
        const nx = -(b[1] - a[1]), ny = b[0] - a[0], nl = Math.hypot(nx, ny) || 1;
        const tooth = Math.sin((i * 4 + k) * 0.9) * 4 + (r() - 0.5) * 1.6;
        pts.push([x + (nx / nl) * tooth, y + (ny / nl) * tooth]);
      }
    }
    return pts;
  }
  // where the blade's top silhouette is, for the rain (unflexed)
  const topAt = (x) => {
    const U = [...upper].reverse().concat([[1546, 216], [1610, 174], [1690, 156], [1764, 168], [1790, 206]]);
    U.sort((a, b) => a[0] - b[0]);
    for (let i = 0; i < U.length - 1; i++) if (x >= U[i][0] && x <= U[i + 1][0]) return lerp(U[i][1], U[i + 1][1], (x - U[i][0]) / (U[i + 1][0] - U[i][0]));
    return null;
  };

  const state = { a: 0, v: 0, pour: 0, tipDrop: 0.4, tipSwell: 0, hits: 0 };
  let spr = null;

  function paintLeaf(g, flat) {
    const r = rng(404);
    // the stalk: a ridged green column, lit along its sun side
    const stalk = new Path2D();
    stalk.moveTo(PIV[0] - 20, PIV[1]); stalk.bezierCurveTo(PIV[0] - 26, 560, JUNC[0] - 30, 420, JUNC[0] - 11, JUNC[1] + 8);
    stalk.lineTo(JUNC[0] + 11, JUNC[1] + 6); stalk.bezierCurveTo(JUNC[0] - 4, 420, PIV[0] + 14, 560, PIV[0] + 20, PIV[1]); stalk.closePath();
    g.lineWidth = 5.2; g.strokeStyle = LINE; g.stroke(stalk);
    g.fillStyle = grad(g, PIV[0] - 22, 0, PIV[0] + 22, 0, ['#8aa452', '#4c6a38', '#263c2a']); g.fill(stalk);
    g.save(); g.clip(stalk);
    // grooves, and a reddish flush at the foot, as burdock stalks have
    g.fillStyle = grad(g, 0, PIV[1] - 160, 0, PIV[1], ['rgba(140,60,70,0)', 'rgba(140,60,70,0.55)']); g.fillRect(PIV[0] - 30, PIV[1] - 160, 60, 170);
    g.strokeStyle = 'rgba(24,40,26,0.55)'; g.lineWidth = 1.4;
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(PIV[0] + i * 5.5, PIV[1]); g.bezierCurveTo(PIV[0] + i * 5.5 - 6, 560, JUNC[0] + i * 3 - 20, 420, JUNC[0] + i * 3, JUNC[1]); g.stroke(); }
    g.restore();
    DH.crescent(g, stalk, 'rgba(255,220,130,0.9)', 3, 0);

    const pts = outline(r);
    const blade = curve(pts);
    // a sliver of the top surface where the margin curls up (darker, glossy)
    g.lineWidth = 6; g.strokeStyle = LINE; g.stroke(blade);
    g.fillStyle = LF.top; g.fill(DH.shift(blade, 0, -5));
    g.fillStyle = LF.under; g.fill(blade);
    g.save(); g.clip(blade);
    // light through the leaf: hottest by the tip, where the sun is behind it
    g.fillStyle = grad(g, 1000, 0, 1800, 0, [[0, '#94a04a'], [0.35, '#6c7c44'], [1, '#3c4c3a']]);
    g.fillRect(980, 120, 840, 360);
    g.save(); g.translate(1060, 450); g.scale(1.5, 1);
    g.fillStyle = radial(g, 0, 0, 0, 340, [[0, 'rgba(250,236,150,0.9)'], [0.3, 'rgba(214,206,100,0.55)'], [0.7, 'rgba(170,170,80,0.2)'], [1, 'rgba(170,170,80,0)']]);
    g.fillRect(-360, -360, 720, 720);
    g.restore();
    // the shadowed belly near the stalk, where the blade is thick and turned from the sun
    g.fillStyle = radial(g, 1520, 300, 0, 320, [[0, 'rgba(34,52,40,0.75)'], [1, 'rgba(34,52,40,0)']]);
    g.fillRect(1200, 120, 620, 360);
    // the vein net: small cells of darker tissue between the veins
    g.lineWidth = 0.8;
    for (let i = 0; i < 520; i++) {
      const x = 1000 + r() * 800, y = 140 + r() * 330;
      const near = clamp(1 - Math.hypot(x - 1060, y - 450) / 500, 0, 1);
      g.strokeStyle = `rgba(${lerp(40, 90, near) | 0},${lerp(60, 110, near) | 0},${lerp(40, 40, near) | 0},${0.25 + near * 0.15})`;
      const a = r() * TAU, l = 7 + r() * 9;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.lineTo(x + Math.cos(a + 1.9) * l * 0.8, y + Math.sin(a + 1.9) * l * 0.8); g.stroke();
    }
    // the veins: a midrib to the tip, ribs curving out toward the margin and forward
    const vein = (x0, y0, x1, y1, cx, cy, w) => {
      const p = new Path2D(); p.moveTo(x0, y0); p.quadraticCurveTo(cx, cy, x1, y1);
      g.lineWidth = w + 2.4; g.strokeStyle = 'rgba(52,76,44,0.45)'; g.stroke(p);
      g.lineWidth = w; g.strokeStyle = LF.vein; g.stroke(p);
      g.lineWidth = Math.max(0.6, w * 0.3); g.strokeStyle = 'rgba(255,255,220,0.7)'; g.save(); g.translate(-0.6, -0.6); g.stroke(p); g.restore();
      return p;
    };
    const mid = [[JUNC[0], JUNC[1]], [1340, 346], [1180, 398], [TIP[0] + 8, TIP[1] - 4]];
    const midAt = (u) => { const i = Math.min(2, Math.floor(u * 3)), k = u * 3 - i; return [lerp(mid[i][0], mid[i + 1][0], k), lerp(mid[i][1], mid[i + 1][1], k)]; };
    // fine pale reticulation catching the light, between the ribs
    g.lineWidth = 0.6; g.strokeStyle = 'rgba(230,240,170,0.2)';
    for (let i = 0; i < 200; i++) {
      const x = 1000 + r() * 800, y = 146 + r() * 310;
      const a = r() * TAU, l = 6 + r() * 14;
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
    }
    const ribs = [0.12, 0.26, 0.4, 0.55, 0.7, 0.84];
    for (const u of ribs) {
      const [mx, my] = midAt(u);
      // up toward the upper margin, and down toward the lower one
      const w = 3.4 - u * 2;
      vein(mx, my, mx - 70 - u * 30, my - 120 + u * 50, mx - 10, my - 70, w);
      vein(mx, my, mx - 60, my + 40 - u * 6, mx - 20, my + 30, w * 0.8);
    }
    // the right lobe's ribs fan out from the junction
    for (const [x1, y1] of [[1590, 186], [1700, 176], [1760, 226], [1680, 296], [1580, 346]]) vein(JUNC[0], JUNC[1], x1, y1, (JUNC[0] + x1) / 2 + 10, (JUNC[1] + y1) / 2 + 20, 2.4);
    // the midrib, broad
    const mr = new Path2D(); mr.moveTo(...mid[0]); mr.bezierCurveTo(...mid[1], ...mid[2], ...mid[3]);
    g.lineWidth = 9; g.strokeStyle = 'rgba(52,76,44,0.5)'; g.stroke(mr);
    g.lineWidth = 6; g.strokeStyle = '#eef4b0'; g.stroke(mr);
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,230,0.8)'; g.save(); g.translate(-1, -1.5); g.stroke(mr); g.restore();
    // bead-drops clinging to the underside
    for (let i = 0; i < 14; i++) {
      const u = 0.1 + r() * 0.8, [mx, my] = midAt(u);
      const x = mx + (r() - 0.5) * 120, y = my + (r() - 0.5) * 60;
      DH.glassDrop(g, x, y, 2 + r() * 2.2, { alpha: 0.9 });
    }
    g.restore();
    // the rim of sun all round the margin, strongest by the tip
    g.save(); g.clip(blade);
    g.lineWidth = 5; g.strokeStyle = 'rgba(255,240,160,0.55)'; g.stroke(blade);
    g.restore();
    g.lineWidth = 2.6; g.strokeStyle = LINE; g.stroke(blade);
    // water beaded along the upper (top-surface) margin: the leaf is full
    for (let i = 0; i < upper.length - 1; i++) {
      const [x, y] = upper[i];
      if (r() < 0.7) DH.glassDrop(g, x + (r() - 0.5) * 12, y - 7, 2.6 + r() * 2.4, { flat: 0.6, sy: 0.8 });
    }
  }

  onLayout(() => {
    spr = sprite(960, 120, 860, PIV[1] - 120 + 20, (g) => paintLeaf(g));
  });
  DH.mirror(DH.SHORE + 2, (g) => paintLeaf(g));

  // the transform: a rotation about the stalk's foot
  const tr = (x, y) => {
    const c = Math.cos(state.a), s = Math.sin(state.a), dx = x - PIV[0], dy = y - PIV[1];
    return [PIV[0] + dx * c - dy * s, PIV[1] + dx * s + dy * c];
  };
  DH.leafTip = () => tr(TIP[0] + 2, TIP[1] + 6);
  DH.leafPour = () => state.pour;

  // rain on the leaf: a jolt, and spray off the top
  DH.surface({
    band: 'near', x0: 1030, x1: 1790,
    y: (x) => { const y = topAt(x); return y == null ? null : tr(x, y)[1] - 3; },
    hit(x, y, d) {
      state.v -= 0.0026 * d.r * (0.4 + (PIV[0] - x) / 500);
      state.hits++;
      for (let i = 0; i < 3; i++) DH.spawn({ kind: 'spray', x, y, vx: (Math.random() - 0.4) * 120, vy: -60 - Math.random() * 90, r: 0.8 + Math.random() * 0.8, life: 0.35, g: 1000, z: 'mid' });
    },
  });

  const blade = new Path2D(); blade.addPath(curve(outline(rng(404))));
  layer({
    id: 'leaf', z: 9.5,
    hit(x, y) {
      // test in the leaf's rest frame
      const c = Math.cos(-state.a), s = Math.sin(-state.a), dx = x - PIV[0], dy = y - PIV[1];
      return Drawn.st && blade && hitCtx.isPointInPath(blade, PIV[0] + dx * c - dy * s, PIV[1] + dx * s + dy * c);
    },
    update(dt, t, L) {
      const w = Drawn.wind(t, 1400);
      const target = -0.004 - 0.008 * (w - 0.6) + Math.sin(t * 0.9) * 0.002 - (L.hovered ? 0.085 : 0) - state.pour * 0.015;
      state.v += (-(state.a - target) * 60 - state.v * 5) * dt;
      state.a += state.v * dt;
      state.pour = ease(state.pour, L.hovered && L.since > 0.25 ? 1 : 0, L.hovered ? 3 : 1.5, dt);
    },
    draw(g, t) {
      if (!spr) return;
      g.save();
      g.translate(PIV[0], PIV[1]); g.rotate(state.a); g.translate(-PIV[0], -PIV[1]);
      blit(g, spr);
      g.restore();
    },
  });
  const hitCtx = document.createElement('canvas').getContext('2d');

  // ------------------------------------------------------------ the tip drop and the pour
  const tipHot = { L: null };
  layer({
    id: 'leaf-tip', z: 12.5,
    hit(x, y) { const [tx, ty] = DH.leafTip(); return Math.hypot(x - tx, y - ty - 8) < 22; },
    update(dt, t, L) {
      // the drop at the tip grows as water runs down to it, then lets go
      const rate = 0.16 + DH.storm.I * 0.12 + (L.hovered ? 1.4 : 0);
      state.tipDrop += rate * dt;
      if (state.tipDrop >= 1) {
        state.tipDrop = 0;
        const [tx, ty] = DH.leafTip();
        DH.spawn({ kind: 'drip', x: tx, y: ty + 9, vx: 0, vy: 20, r: 4.8, life: 2, g: 1400, z: 'mid', land: DH.cisternTop ? DH.cisternTop() : 590, cistern: true });
      }
      // the pour: a stream while the leaf sags
      if (state.pour > 0.3 && Math.random() < state.pour * 0.9) {
        const [tx, ty] = DH.leafTip();
        DH.spawn({ kind: 'drip', x: tx + (Math.random() - 0.5) * 3, y: ty + 6, vx: (Math.random() - 0.5) * 8, vy: 60, r: 2 + Math.random() * 2.2, life: 2, g: 1400, z: 'mid', land: DH.cisternTop ? DH.cisternTop() : 590, cistern: true });
      }
    },
    draw(g, t) {
      const [tx, ty] = DH.leafTip();
      const k = state.tipDrop;
      // the hanging drop stretches into a pendant before it falls
      const r = 2.5 + k * 3.2;
      g.lineWidth = 2 + k; g.strokeStyle = 'rgba(230,240,200,0.6)';
      g.beginPath(); g.moveTo(tx, ty - 2); g.lineTo(tx, ty + 2 + k * 6); g.stroke();
      DH.glassDrop(g, tx, ty + 4 + k * 7, r, { sy: 1 + k * 0.25, bright: 0.6 });
      if (state.pour > 0.05) {
        // a glassy rope of water from the tip
        const yb = (DH.cisternTop ? DH.cisternTop() : 590) - 4;
        g.save();
        g.globalAlpha = state.pour * 0.8;
        g.lineCap = 'round';
        g.lineWidth = 2 + state.pour * 3; g.strokeStyle = 'rgba(200,226,210,0.6)';
        g.beginPath(); g.moveTo(tx, ty + 4);
        for (let y = ty + 4; y < yb; y += 8) g.lineTo(tx + Math.sin(y * 0.2 - t * 18) * 1.2 * state.pour, y);
        g.stroke();
        g.lineWidth = 1; g.strokeStyle = 'rgba(255,240,190,0.9)'; g.stroke();
        g.restore();
      }
    },
  });

  // ------------------------------------------------------------ the moth under the leaf
  const MOTH = [1300, 352];
  const moth = { open: 0, blink: Drawn.blinker(3, 5), shiver: 0 };
  layer({
    id: 'moth', z: 9.7,
    hit(x, y) { const [mx, my] = tr(...MOTH); return Math.hypot(x - mx, (y - my - 18) * 0.9) < 26; },
    update(dt, t, L) {
      moth.open = ease(moth.open, L.hovered && L.since > 0.15 ? 1 : 0, L.hovered ? 3.5 : 2, dt);
      moth.shiver = Math.max(0, moth.shiver - dt) ;
      if (Math.random() < dt * 0.1) moth.shiver = 0.6;
    },
    draw(g, t) {
      const [mx, my] = tr(...MOTH);
      g.save(); g.translate(mx, my);
      g.rotate(state.a + Math.sin(t * 1.3) * 0.02 + (moth.shiver > 0 ? Math.sin(t * 60) * 0.03 : 0));
      // it hangs head-up from the underside: legs gripping a vein
      g.lineWidth = 1; g.strokeStyle = LINE;
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 3, 2); g.lineTo(s * 7, -3); g.stroke(); }
      const o = moth.open;
      // wings: wrapped like a cloak, opening to show the eyespots
      for (const s of [-1, 1]) {
        g.save(); g.scale(s, 1);
        const spread = o * 1.1;
        g.rotate(-spread * 0.6);
        const w = new Path2D();
        w.moveTo(0, 2); w.bezierCurveTo(10 + o * 16, 4, 13 + o * 22, 26, 6 + o * 14, 40); w.quadraticCurveTo(2, 38, 0, 34); w.closePath();
        ink(g, w, '#8a6a5a', 1.3);
        g.save(); g.clip(w);
        g.fillStyle = '#6a4c46'; g.fill(DH.shift(w, -3, 0));
        g.strokeStyle = 'rgba(40,24,30,0.5)'; g.lineWidth = 0.8;
        for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, 8 + i * 8); g.quadraticCurveTo(8 + o * 10, 10 + i * 8, 12 + o * 16, 6 + i * 9); g.stroke(); }
        if (o > 0.05) {
          g.globalAlpha = o;
          ink(g, circ(6 + o * 10, 24, 5), '#f0c070', 0.9);
          g.fillStyle = LINE; g.fill(circ(6 + o * 10, 24, 2.4));
          g.fillStyle = '#fff'; g.fill(circ(5 + o * 10, 23, 0.9));
          g.globalAlpha = 1;
        }
        g.restore();
        DH.crescent(g, w, 'rgba(255,214,140,0.8)', -1.5, 0);
        g.restore();
      }
      // fuzzy head and feathery antennae
      ink(g, ell(0, 2, 5, 5), '#b08a70', 1.2);
      g.lineWidth = 1; g.strokeStyle = '#6a4a3a';
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 2, -2); g.quadraticCurveTo(s * 8, -10, s * 11, -8); g.stroke(); }
      const e = moth.blink(t);
      g.fillStyle = LINE; g.fill(ell(-2, 2, 1.2, 1.3 * e)); g.fill(ell(2, 2, 1.2, 1.3 * e));
      g.restore();
    },
  });
})();
