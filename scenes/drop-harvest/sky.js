/* sky.js — the storm. A slate-violet deck of cloud with a rift of clear sky low under it where the
   sun is breaking through; its belly lit gold from below. Cloud masses drift left → right with the
   wind, ragged scud races across the rift, rain shafts hang under the far deck.

   Hover the clouds: thunder. Light flickers through the deck from inside, the rain comes down
   harder for a while and everyone flinches. Hover the rift: the sun pushes through, the rain turns
   gold and the glitter on the puddle widens. Lightning also comes on its own every half minute.

   sky z0 (still) · deck z1 · scud + shafts z2 · lightning z3 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, st, P, layer, onLayout, sprite, blit } = Drawn;
  const { C, SUN, HZ } = DH;

  // the bottom of the cloud deck: the top of the rift. It dips to meet the far shore at the sides.
  const deckBase = (x) => {
    const d = (x - SUN.x) / 760;
    return 548 - 34 * Math.exp(-d * d * 3) + 130 * Math.max(0, Math.abs(d) - 0.55) ** 1.4 + 9 * noise(x * 0.013) + 5 * noise(x * 0.05 + 3);
  };
  DH.deckBase = deckBase;

  function paintSky(g, v) {
    const x0 = v.x0 - 20, x1 = v.x1 + 20, y0 = v.y0 - 20;
    // the storm, darkest high up
    g.fillStyle = grad(g, 0, y0, 0, HZ, [[0, '#17152a'], [Math.max(0.01, (200 - y0) / (HZ - y0)), C.storm0], [Math.max(0.02, (470 - y0) / (HZ - y0)), C.storm1], [1, C.storm2]]);
    g.fillRect(x0, y0, x1 - x0, HZ - y0 + 40);
    // the rift: clear sky low under the deck, hottest round the sun
    const R = new Path2D();
    R.moveTo(x0, HZ + 30);
    for (let x = x0; x <= x1; x += 12) R.lineTo(x, Math.min(HZ + 30, deckBase(x)));
    R.lineTo(x1, HZ + 30); R.closePath();
    g.save(); g.clip(R);
    g.fillStyle = grad(g, 0, 500, 0, HZ, [[0, C.rift4], [0.3, C.rift3], [0.62, C.rift2], [0.9, C.rift1], [1, '#ffe7ae']]);
    g.fillRect(x0, 440, x1 - x0, HZ - 410);
    g.save(); g.translate(SUN.x, SUN.y); g.scale(1.9, 1);
    g.fillStyle = radial(g, 0, 0, 0, 420, [[0, 'rgba(255,246,214,1)'], [0.1, 'rgba(255,232,170,0.9)'], [0.35, 'rgba(255,200,120,0.45)'], [1, 'rgba(255,170,110,0)']]);
    g.fillRect(-420, -420, 840, 840);
    g.restore();
    // thin bars of far cloud lying across the rift
    const r = rng(31);
    for (let i = 0; i < 9; i++) {
      const y = 570 + r() * 110, x = SUN.x + (r() - 0.5) * 1300, w = 120 + r() * 340, h = 2 + r() * 4;
      const near = clamp(1 - Math.abs(x - SUN.x) / 700, 0, 1);
      g.fillStyle = `rgba(${lerp(150, 255, near) | 0},${lerp(90, 196, near) | 0},${lerp(110, 140, near) | 0},${0.35 + 0.3 * (1 - near)})`;
      g.fill(curve([[x - w / 2, y], [x - w * 0.2, y - h], [x + w * 0.3, y - h * 0.6], [x + w / 2, y], [x, y + h * 0.5]]));
    }
    // the sun itself, veiled
    g.fillStyle = radial(g, SUN.x, SUN.y, SUN.r * 0.6, SUN.r * 1.6, [[0, '#fffbea'], [1, 'rgba(255,246,214,0)']]);
    g.fill(circ(SUN.x, SUN.y, SUN.r * 1.6));
    g.fillStyle = '#fffcf0'; g.fill(circ(SUN.x, SUN.y, SUN.r));
    // a veil bar over the sun
    g.fillStyle = 'rgba(255,214,160,0.55)';
    g.fill(curve([[SUN.x - 90, SUN.y + 8], [SUN.x - 20, SUN.y + 2], [SUN.x + 80, SUN.y + 6], [SUN.x + 30, SUN.y + 12]]));
    g.restore();

    // the deck's belly, lit gold where it hangs over the rift: strokes along its edge, coloured by
    // how near the sun they are (a horizontal gradient), widest by the sun
    const nearGrad = (alpha) => grad(g, SUN.x - 900, 0, SUN.x + 900, 0, [[0, `rgba(120,84,120,${alpha * 0.4})`], [0.3, `rgba(210,120,110,${alpha * 0.8})`], [0.5, `rgba(255,190,120,${alpha})`], [0.7, `rgba(210,120,110,${alpha * 0.8})`], [1, `rgba(120,84,120,${alpha * 0.4})`]]);
    const B = new Path2D();
    B.moveTo(x0, 380);
    for (let x = x0; x <= x1; x += 10) B.lineTo(x, deckBase(x) + 2);
    B.lineTo(x1, 380); B.closePath();
    const edge = new Path2D();
    for (let x = x0; x <= x1; x += 6) x === x0 ? edge.moveTo(x, deckBase(x)) : edge.lineTo(x, deckBase(x));
    g.save(); g.clip(B);
    for (const [w, a] of [[46, 0.18], [26, 0.32], [12, 0.6], [4, 0.95]]) { g.lineWidth = w; g.strokeStyle = nearGrad(a); g.stroke(edge); }
    g.restore();
    // the ragged hem of the deck: shreds of cloud hanging into the rift
    const r2 = rng(44);
    for (let i = 0; i < 26; i++) {
      const x = lerp(x0, x1, r2()), y = deckBase(x) + 2, w = 30 + r2() * 90, h = 4 + r2() * 9;
      const near = clamp(1 - Math.abs(x - SUN.x) / 800, 0, 1);
      const p = curve([[x - w / 2, y - 2], [x, y + h], [x + w / 2, y - 2], [x, y - 4]]);
      g.fillStyle = `rgba(${lerp(60, 120, near) | 0},${lerp(52, 70, near) | 0},${lerp(86, 100, near) | 0},0.9)`; g.fill(p);
      g.fillStyle = `rgba(255,${lerp(150, 200, near) | 0},${lerp(130, 120, near) | 0},${0.2 + near * 0.6})`; g.fill(DH.shift(curve([[x - w * 0.4, y + h * 0.4], [x, y + h], [x + w * 0.4, y + h * 0.4], [x, y + h * 0.6]]), 0, 0));
    }
  }

  // ------------------------------------------------------------ cloud masses (sprites)
  // a mass of cloud lit from *below*: dark crown, a gold underside where it faces the rift
  function cloudSprite(seed, w, h, warm) {
    // a long roll of cloud: a bulging crown over a flatter underside, both built of wide ellipses
    const r = rng(seed), crown = [], belly = [], tall = r() < 0.35;
    const n = Math.max(3, Math.round(w / (h * 1.1)));
    for (let i = 0; i < n; i++) {
      const u = n === 1 ? 0.5 : i / (n - 1), x = lerp(-w / 2 + h * 0.8, w / 2 - h * 0.8, u);
      const hump = Math.sin(u * Math.PI) * (tall ? 1.8 : 1);
      crown.push([x + (r() - 0.5) * h * 0.4, -h * (0.12 + hump * 0.22 + r() * 0.12), h * (0.75 + r() * 0.5), h * (0.32 + hump * 0.12 + r() * 0.1)]);
      if (r() < 0.75) belly.push([x + (r() - 0.5) * h * 1.6, h * (0.08 + r() * 0.12), h * (0.7 + r() * 1.1), h * (0.14 + r() * 0.12)]);
    }
    const pad = h * 1.2;
    return sprite(-w / 2 - pad, -h - pad, w + pad * 2, h * 2 + pad * 2, (g) => {
      const U = new Path2D();
      for (const [x, y, rx, ry] of crown) ell(x, y, rx, ry, U);
      for (const [x, y, rx, ry] of belly) ell(x, y, rx, ry, U);
      // a soft skin so the crown dissolves rather than ending in a hard line
      g.globalAlpha = 0.25; g.fillStyle = C.storm1;
      g.fill(DH.shift(U, 0, -4)); g.fill(DH.shift(U, -5, 0)); g.fill(DH.shift(U, 5, 0));
      g.globalAlpha = 1;
      DH.cel(g, U, {
        dark: warm > 0.5 ? '#2a2444' : C.storm0,
        base: warm > 0.5 ? '#3c3456' : C.storm1,
        lit: warm > 0.7 ? '#b07078' : warm > 0.4 ? '#5e4e6c' : '#3a3554',
        dd: [0, h * 0.2], ld: [0, -h * (warm > 0.4 ? 0.09 : 0.05)],
      });
      if (warm > 0.7) {
        // a hot hem on the clouds right over the sun
        g.save(); g.clip(U);
        g.fillStyle = grad(g, 0, h * 0.1, 0, h * 0.42, [[0, 'rgba(255,200,140,0)'], [1, 'rgba(255,200,140,0.75)']]);
        g.fillRect(-w, h * 0.1, w * 2, h * 0.4);
        g.restore();
      }
    });
  }

  const masses = (DH.masses = []);
  const scud = [];
  onLayout(() => {
    masses.length = 0; scud.length = 0;
    const v = st.view, r = rng(7);
    // high masses fill the phone's tall sky; the low row hangs right over the rift
    const rows = [
      { y: 440, n: 4, w: [500, 900], h: [60, 90], warm: 0.65, sp: 5.5 },
      { y: 300, n: 3, w: [800, 1300], h: [100, 140], warm: 0.3, sp: 4 },
      { y: 120, n: 3, w: [1000, 1500], h: [130, 180], warm: 0.12, sp: 3 },
    ];
    for (let y = -90; y > v.y0 - 200; y -= 190) rows.push({ y, n: 2, w: [1000, 1400], h: [110, 150], warm: 0.05, sp: 2.5 });
    let seed = 11;
    for (const R of rows) {
      const span = v.x1 - v.x0 + 1400;
      for (let i = 0; i < R.n; i++) {
        const w = lerp(R.w[0], R.w[1], r()), h = lerp(R.h[0], R.h[1], r());
        masses.push({ sp: cloudSprite(seed++, w, h, R.warm), x: v.x0 - 700 + (i + r() * 0.9) * (span / R.n), y: R.y + (r() - 0.5) * h * 1.2, v: R.sp * (0.8 + r() * 0.4), span, w });
      }
    }
    for (let i = 0; i < 6; i++) {
      const w = 90 + r() * 160;
      scud.push({ x: v.x0 + r() * (v.x1 - v.x0), y: 560 + r() * 90, w, h: 10 + r() * 10, v: 22 + r() * 26, seed: i * 13 + 3 });
    }
  });

  layer({
    id: 'sky', z: 0, still: true,
    draw(g) { paintSky(g, st.view); },
  });
  DH.paintSky = paintSky;

  // which part of the deck the lightning is lighting right now
  const bolt = { x: 1200, y: 300, a: 0, t: -99, path: null, far: false };
  function strike(t, x, y) {
    bolt.x = x; bolt.y = y; bolt.t = t; DH.storm.lastFlash = t;
    // a thin far bolt half the time, down to the far shore
    bolt.far = Math.random() < 0.6;
    if (bolt.far) {
      const pts = [[x, deckBase(x) - 10]];
      let cx = x, cy = deckBase(x);
      while (cy < DH.FAR - 6) { cy += 14 + Math.random() * 18; cx += (Math.random() - 0.5) * 26; pts.push([cx, Math.min(cy, DH.FAR - 4)]); }
      bolt.path = pts;
    }
    setTimeout(() => { DH.storm.thunder = 1; }, 700 + Math.random() * 600);
  }
  DH.strike = strike;

  layer({
    id: 'deck', z: 1,
    update(dt, t) {
      for (const m of masses) { m.x += m.v * (0.6 + Drawn.wind(t, m.x) * 0.6) * dt; if (m.x - m.w > st.view.x1 + 200) m.x -= m.span; }
      for (const s of scud) { s.x += s.v * (0.5 + Drawn.wind(t, s.x)) * dt; if (s.x - s.w > st.view.x1 + 60) s.x = st.view.x0 - s.w - 40; }
      if (t - DH.storm.lastFlash > 26 + 20 * Math.abs(noise(t * 0.01))) strike(t, SUN.x + 300 + Math.random() * 700, 260 + Math.random() * 200);
      DH.storm.flash = Math.max(0, 1 - (t - bolt.t) / 0.9);
      DH.storm.thunder = Math.max(0, DH.storm.thunder - dt * 0.25);
    },
    draw(g, t) {
      for (const m of masses) {
        // the low rows thin out over the sun, leaving it a break to shine through
        const near = m.y > 360 ? clamp(1 - Math.abs(m.x - SUN.x) / 420, 0, 1) : 0;
        if (near > 0) g.globalAlpha = 1 - near * 0.75;
        blit(g, m.sp, m.x, m.y);
        g.globalAlpha = 1;
      }
    },
  });

  layer({
    id: 'scud', z: 2,
    draw(g, t) {
      // rain shafts under the far deck: veils that drift with the wind
      g.save();
      for (let i = 0; i < 4; i++) {
        const x = ((i * 520 + t * 9) % 2200) - 300, w = 120 + 60 * Math.sin(i * 2.1);
        const top = deckBase(x), near = clamp(1 - Math.abs(x - SUN.x) / 700, 0, 1);
        const lean = DH.slant(t, x) * (DH.FAR - top);
        const p = poly([[x - w / 2, top], [x + w / 2, top], [x + w / 2 + lean, DH.FAR], [x - w / 2 + lean, DH.FAR]]);
        g.fillStyle = grad(g, 0, top, 0, DH.FAR, [[0, `rgba(${lerp(60, 255, near) | 0},${lerp(56, 200, near) | 0},${lerp(90, 150, near) | 0},${0.1 + near * 0.14})`], [1, 'rgba(80,70,110,0)']]);
        g.fill(p);
      }
      // the squall: a heavy curtain of rain marching in from the left, hung from the deck and fading
      // out before the far bank — built of wide soft slanted strokes, so it has no edges
      {
        const qx = 170 + Math.sin(t * 0.03) * 90, sl = DH.slant(t, qx);
        const y0 = 300, y1 = DH.FAR - 10;
        g.save(); g.lineCap = 'round';
        for (let i = 0; i < 14; i++) {
          const u = Drawn.hash(i * 5.3), x = qx + (u - 0.5) * 380, w = 30 + Drawn.hash(i * 2.9) * 70;
          const gr = g.createLinearGradient(0, y0, 0, y1);
          gr.addColorStop(0, 'rgba(24,20,42,0)'); gr.addColorStop(0.25, 'rgba(24,20,42,0.1)'); gr.addColorStop(0.7, 'rgba(36,30,58,0.09)'); gr.addColorStop(1, 'rgba(60,50,80,0)');
          g.strokeStyle = gr; g.lineWidth = w;
          g.beginPath(); g.moveTo(x, y0); g.lineTo(x + sl * (y1 - y0), y1); g.stroke();
        }
        const hiQ = new Path2D(), loQ = new Path2D();
        for (let i = 0; i < 60; i++) {
          const u = Drawn.hash(i * 3.1), yy = y0 + ((Drawn.hash(i * 7.7) * 400 + t * 520) % 420) - 20;
          const x = qx + (u - 0.5) * 360 + (yy - y0) * sl;
          (yy > 500 ? loQ : hiQ).moveTo(x, yy); (yy > 500 ? loQ : hiQ).lineTo(x + sl * 80, yy + 80);
        }
        g.lineWidth = 1.1;
        g.strokeStyle = 'rgba(200,196,230,0.22)'; g.stroke(hiQ);
        g.strokeStyle = 'rgba(255,200,150,0.26)'; g.stroke(loQ);
        g.restore();
      }
      g.restore();
      // scud: ragged low cloud racing across the rift, dark against the gold
      for (const s of scud) {
        const near = clamp(1 - Math.abs(s.x - SUN.x) / 700, 0, 1);
        const r = rng(s.seed), pts = [];
        const n = 9;
        for (let i = 0; i <= n; i++) { const u = i / n; pts.push([s.x - s.w / 2 + u * s.w, s.y - Math.sin(u * Math.PI) * s.h * (0.6 + r() * 0.8) + noise(t * 0.4 + i + s.seed) * 2]); }
        for (let i = n; i >= 0; i--) { const u = i / n; pts.push([s.x - s.w / 2 + u * s.w, s.y + Math.sin(u * Math.PI) * s.h * 0.3 * (0.5 + r())]); }
        const p = curve(pts);
        g.fillStyle = `rgba(${lerp(70, 150, near) | 0},${lerp(56, 92, near) | 0},${lerp(92, 110, near) | 0},0.85)`; g.fill(p);
        DH.crescent(g, p, near > 0.3 ? '#ffd08a' : '#b18aa0', 0, -3, 0.8);
      }
    },
  });

  layer({
    id: 'lightning', z: 3,
    hit: (x, y) => y < deckBase(x) - 4 && y > st.view.y0,
    onEnter() { const t = st.t; if (t - DH.storm.lastFlash > 2.5) strike(t, clamp(P.x, st.view.x0 + 100, st.view.x1 - 100), clamp(P.y, 150, 480)); DH.storm.extra = Math.min(1.1, DH.storm.extra + 0.6); },
    update(dt, t, L) { DH.storm.extra = Math.max(0, DH.storm.extra - dt * 0.05); },
    draw(g, t) {
      const f = DH.storm.flash;
      if (f <= 0) return;
      // a flicker: two or three pulses inside the deck
      const k = f * (0.55 + 0.45 * Math.sin((1 - f) * 38)) * (f > 0.5 ? 1 : 0.6);
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = radial(g, bolt.x, bolt.y, 0, 520, [[0, `rgba(210,200,255,${0.32 * k})`], [0.5, `rgba(150,140,220,${0.12 * k})`], [1, 'rgba(120,110,200,0)']]);
      g.fillRect(bolt.x - 520, bolt.y - 520, 1040, 1040);
      if (bolt.far && bolt.path && f > 0.35) {
        g.strokeStyle = `rgba(240,236,255,${0.85 * k})`; g.lineWidth = 2.2;
        g.beginPath(); bolt.path.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        g.strokeStyle = `rgba(200,190,255,${0.25 * k})`; g.lineWidth = 8; g.stroke();
      }
      g.restore();
    },
  });

  // the rift: hover it and the sun pushes through
  layer({
    id: 'rift', z: 3.5,
    hit: (x, y) => y >= deckBase(x) - 4 && y < DH.FAR - 6 && Math.abs(x - SUN.x) < 620,
    update(dt, t, L) { DH.storm.sun = ease(DH.storm.sun, L.hovered ? 1 : 0, L.hovered ? 1.2 : 0.5, dt); },
    draw(g, t, L) {
      const s = DH.storm.sun;
      if (s < 0.01) return;
      g.save(); g.globalCompositeOperation = 'lighter';
      g.translate(SUN.x, SUN.y); g.scale(2.2, 1);
      g.fillStyle = radial(g, 0, 0, 0, 380, [[0, `rgba(255,236,190,${0.5 * s})`], [0.3, `rgba(255,200,120,${0.22 * s})`], [1, 'rgba(255,170,100,0)']]);
      g.fillRect(-380, -380, 760, 760);
      g.restore();
    },
  });
})();
