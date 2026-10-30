/* kit.js — the shared world of the Drop Harvest: geometry, light, palette, the storm's state and
   the painting helpers every part uses (rim light, glass drops, bun-shaped raindrops, splashes).

   The camera floats at the water: eye level / horizon HZ, the far shore at FAR, the island's
   front shore at SHORE. The low sun sits behind the island under the storm (SUN), so the light
   comes *toward* the viewer: sun-facing edges get a gold rim, faces turned to us are in cool
   shade with a warm bounce from the puddle underneath. */
(function () {
  const { TAU, clamp, lerp, rng, noise, circ, ell, poly, curve, st, P } = Drawn;
  const DH = (window.DH = {});

  DH.W = 1600; DH.H = 1200;
  DH.HZ = 700;          // eye level
  DH.FAR = 726;         // the far shore's waterline
  DH.SHORE = 792;       // the island's front waterline
  DH.SUN = { x: 826, y: 622, r: 28 };

  // ink: a deep plum that belongs to the storm
  const LINE = (Drawn.style.line = '#251828');
  DH.LINE = LINE;
  // the island is a plane back from the near bank: its ink is lighter and coloured by the air
  DH.LINE_MID = '#3c2d4a';

  DH.C = {
    storm0: '#1f1d36', storm1: '#2e2b4b', storm2: '#45405f', storm3: '#5d5674', scud: '#7b7190',
    rift0: '#fff4d6', rift1: '#ffd889', rift2: '#f6a564', rift3: '#d9746a', rift4: '#8e5a7a',
    gold: '#ffcf6e', goldHot: '#fff1c4', amber: '#f2a24a',
    water: '#3a3858', waterDeep: '#262440',
    moss: { deep: '#1f3326', shade: '#2f4a33', base: '#4f6d3a', lit: '#9db54a', rim: '#e9df7a' },
    soil: { deep: '#1d1320', shade: '#33222f', base: '#4a3140', lit: '#7a4f52', rim: '#d99a6a' },
    leaf: { vein: '#e6efa0', under: '#7c9a55', underShade: '#4d6a42', glow: '#c9e05a', hot: '#eef59a', top: '#2f5a34', topLit: '#5f8f3c' },
    bug: { base: '#837ca8', shade: '#4e4870', deep: '#2c2944', lit: '#b4aed6', rim: '#ffd88e', belly: '#9d94b8' },
  };

  // which side of a thing faces the sun (+1 right, -1 left), and how strongly (0..1)
  DH.sunSide = (x) => (x < DH.SUN.x ? 1 : -1);
  DH.sunNear = (x, y) => clamp(1 - Math.hypot(x - DH.SUN.x, (y - DH.SUN.y) * 1.6) / 900, 0, 1);

  // ------------------------------------------------------------ path helpers
  DH.shift = (Pth, dx, dy) => { const q = new Path2D(); q.addPath(Pth, new DOMMatrix().translate(dx, dy)); return q; };
  // the crescent of shape P that a copy shifted by (dx, dy) doesn't cover: rim light, core shadow,
  // bounce. Clipped to P, filled even-odd.
  DH.crescent = function (g, Pth, color, dx, dy, alpha = 1) {
    const X = new Path2D(); X.addPath(Pth); X.addPath(DH.shift(Pth, dx, dy));
    g.save(); g.clip(Pth); g.globalAlpha *= alpha; g.fillStyle = color; g.fill(X, 'evenodd'); g.restore();
  };
  // three-tone cel shading that works on unions (overlapping subpaths), using only clip
  // intersections: dark where the shape is uncovered by a copy shifted by `dark`, lit where it is
  // uncovered by a copy shifted by `lit`, base elsewhere. o: { dark, base, lit, dd: [dx,dy], ld: [dx,dy] }
  DH.cel = function (g, Pth, o) {
    g.save();
    g.fillStyle = o.dark; g.fill(Pth);
    g.clip(Pth); g.clip(DH.shift(Pth, o.dd[0], o.dd[1]));
    g.fillStyle = o.lit; g.fill(Pth);
    g.fillStyle = o.base; g.fill(DH.shift(Pth, o.ld[0], o.ld[1]));
    g.restore();
  };
  // rim light on the sun side + a little on top
  DH.rim = function (g, Pth, x, w = 3, color = DH.C.gold, alpha = 1) {
    const s = DH.sunSide(x);
    DH.crescent(g, Pth, color, -s * w, w * 0.7, alpha);
  };
  // a face turned from a sun that's behind it: shade across the whole shape, deepening away from
  // the sunward edge (x0..x1 is the shape's horizontal extent)
  DH.shadeFace = function (g, Pth, x0, x1, k = 0.6) {
    const s = DH.sunSide((x0 + x1) / 2);
    const a = s > 0 ? x1 : x0, b = s > 0 ? x0 : x1;
    g.save(); g.clip(Pth);
    const gr = g.createLinearGradient(a, 0, b, 0);
    gr.addColorStop(0, `rgba(30,22,50,${k * 0.15})`); gr.addColorStop(0.22, `rgba(30,22,50,${k * 0.75})`); gr.addColorStop(1, `rgba(24,18,42,${k})`);
    g.fillStyle = gr; g.fillRect(Math.min(a, b) - 2, -1e4, Math.abs(b - a) + 4, 2e4);
    g.restore();
  };
  // warm bounce from the water on the underside
  DH.bounce = (g, Pth, w = 4, color = 'rgba(246,165,100,0.35)') => DH.crescent(g, Pth, color, 0, -w);

  // a wobbly closed blob through n points around (x, y)
  DH.blob = function (x, y, rx, ry, n, wob, seed) {
    const r = rng(seed), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU, k = 1 + (r() - 0.5) * wob;
      pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]);
    }
    return curve(pts);
  };

  // ------------------------------------------------------------ drops
  // A caught or resting drop: a glass ball holding a tiny upside-down sunset. The storm above
  // refracts to its bottom, the gold rift to its upper middle, the sun focuses to a hot caustic low
  // on the side away from the sun; a sky highlight up top. Drawn around (0, 0) radius r.
  // o: { sx, sy squash, flat (0..1 flattened bottom), alpha, bright }
  DH.glassDrop = function (g, x, y, r, o = {}) {
    const sx = o.sx || 1, sy = o.sy || 1, a = o.alpha == null ? 1 : o.alpha, br = o.bright || 0;
    const side = DH.sunSide(x);
    if (r * Math.max(sx, sy) < 2.8 && !o.flat) {
      // too small for refraction to read: a tinted bead, a gold caustic, a glint
      const rr = r * Math.max(sx, sy);
      g.globalAlpha = a;
      g.fillStyle = 'rgba(40,34,70,0.45)'; g.fill(circ(x, y, rr));
      g.fillStyle = 'rgba(255,214,140,0.9)'; g.fill(circ(x - side * rr * 0.2, y + rr * 0.35, rr * 0.5));
      g.fillStyle = 'rgba(255,252,242,0.95)'; g.fill(circ(x + side * rr * 0.35, y - rr * 0.4, Math.max(0.45, rr * 0.28)));
      g.lineWidth = 0.6; g.strokeStyle = 'rgba(37,24,40,0.7)'; g.stroke(circ(x, y, rr));
      g.globalAlpha = 1;
      return;
    }
    g.save();
    g.translate(x, y); g.scale(sx, sy);
    const body = new Path2D();
    if (o.flat) {
      const f = o.flat;
      body.moveTo(-r, 0);
      body.bezierCurveTo(-r, -r * 1.33, r, -r * 1.33, r, 0);
      body.bezierCurveTo(r, r * (0.75 - f * 0.45), -r, r * (0.75 - f * 0.45), -r, 0);
    } else body.arc(0, 0, r, 0, TAU);
    g.globalAlpha = a;
    // mostly clear: a faint cool tint over whatever is behind
    g.fillStyle = 'rgba(60,54,96,0.22)'; g.fill(body);
    g.save(); g.clip(body);
    // the refracted world, upside down: the storm pooled in the bottom, a thin band of the gold
    // rift high up, the dark ring where the glass turns away
    const gr = g.createLinearGradient(0, -r, 0, r);
    gr.addColorStop(0, 'rgba(40,34,70,0.5)');
    gr.addColorStop(0.2, 'rgba(40,34,70,0.1)');
    gr.addColorStop(0.3, `rgba(255,${200 + br * 30},${130 + br * 50},${0.5 + br * 0.3})`);
    gr.addColorStop(0.4, 'rgba(240,150,110,0.25)');
    gr.addColorStop(0.55, 'rgba(50,44,80,0.05)');
    gr.addColorStop(1, 'rgba(30,26,56,0.55)');
    g.fillStyle = gr; g.fillRect(-r, -r * 1.4, r * 2, r * 2.8);
    const ring = g.createRadialGradient(0, 0, r * 0.55, 0, 0, r * 1.02);
    ring.addColorStop(0, 'rgba(26,20,46,0)'); ring.addColorStop(0.8, 'rgba(26,20,46,0.25)'); ring.addColorStop(1, 'rgba(26,20,46,0.75)');
    g.fillStyle = ring; g.fillRect(-r, -r * 1.4, r * 2, r * 2.8);
    // the caustic: sunlight focused through the drop, a hot crescent low on the far side
    g.globalCompositeOperation = 'lighter';
    const cx = -side * r * 0.18, cy = r * 0.62;
    const hot = g.createRadialGradient(cx, cy, 0, cx, cy, r * 0.55);
    hot.addColorStop(0, `rgba(255,236,170,${0.85 + br * 0.15})`); hot.addColorStop(0.35, 'rgba(255,190,90,0.4)'); hot.addColorStop(1, 'rgba(255,160,80,0)');
    g.fillStyle = hot; g.fillRect(-r, -r, r * 2, r * 2);
    g.globalCompositeOperation = 'source-over';
    // a thin rim of gold on the sun side
    g.fillStyle = 'rgba(255,214,140,0.8)';
    const X = new Path2D(); X.addPath(body); X.addPath(DH.shift(body, -side * Math.max(0.8, r * 0.1), r * 0.06));
    g.fill(X, 'evenodd');
    g.restore();
    // the sky's highlight: one sharp window and a small second
    g.fillStyle = 'rgba(255,252,242,0.95)';
    g.fill(ell(side * r * 0.34, -r * 0.46, r * 0.22, r * 0.13, undefined, side * -0.6));
    g.fillStyle = 'rgba(255,252,242,0.55)';
    g.fill(circ(-side * r * 0.3, -r * 0.55, r * 0.07));
    // ink, lighter than the structure's: a drop is mostly light
    g.lineWidth = Math.max(0.7, Math.min(1.8, r * 0.07)) / Math.max(sx, sy); g.strokeStyle = 'rgba(37,24,40,0.85)'; g.stroke(body);
    g.restore();
  };

  // a falling raindrop: big ones fall as flattened buns, not teardrops. vx/vy for the streak.
  DH.fallingDrop = function (g, x, y, r, vx, vy, glow, a = 1) {
    const sp = Math.hypot(vx, vy) || 1, ux = vx / sp, uy = vy / sp;
    const len = r * 7 + sp * 0.012;
    const sg = g.createLinearGradient(x - ux * len, y - uy * len, x, y);
    const c = glow > 0.4 ? `255,${210 + glow * 30 | 0},150` : '214,210,240';
    sg.addColorStop(0, `rgba(${c},0)`); sg.addColorStop(1, `rgba(${c},${0.55 * a})`);
    g.strokeStyle = sg; g.lineCap = 'round';
    g.lineWidth = Math.max(0.8, r * 0.38);
    g.beginPath(); g.moveTo(x - ux * len, y - uy * len); g.lineTo(x - ux * r, y - uy * r); g.stroke();
    g.globalAlpha = a;
    g.save(); g.translate(x, y); g.rotate(Math.atan2(uy, ux) - Math.PI / 2);
    const p = new Path2D();
    p.moveTo(-r, 0.15 * r);
    p.bezierCurveTo(-r, -r * 1.2, r, -r * 1.2, r, 0.15 * r);
    p.quadraticCurveTo(0, r * 0.55, -r, 0.15 * r);
    g.fillStyle = 'rgba(48,40,80,0.7)'; g.fill(p);
    g.fillStyle = glow > 0.3 ? 'rgba(255,214,130,0.95)' : 'rgba(214,208,236,0.85)';
    g.fill(ell(0, -r * 0.45, r * 0.62, r * 0.32));
    g.fillStyle = 'rgba(255,250,240,0.95)'; g.fill(circ(r * 0.3, -r * 0.55, r * 0.18));
    g.lineWidth = Math.max(0.7, r * 0.16); g.strokeStyle = 'rgba(37,24,40,0.75)'; g.stroke(p);
    g.restore();
    g.globalAlpha = 1;
  };

  // ------------------------------------------------------------ the storm
  // intensity swells and eases on a long cycle with gusts on top; hovering the clouds or the
  // sun pushes it (thunder → harder rain, sun → a brighter sunshower)
  DH.storm = { I: 1, extra: 0, sun: 0, thunder: 0, flash: 0, lastFlash: -99 };
  DH.intensity = (t) => clamp(0.78 + 0.22 * Math.sin(t * 0.11) + 0.25 * Math.max(0, noise(t * 0.17 + 9)) + DH.storm.extra, 0.35, 2.2);
  // rain slant (units of x per unit of y): the gusts lean it
  DH.slant = (t, x = 800) => 0.12 + 0.16 * Drawn.wind(t, x);
  Drawn.setWind((t, x) => 0.5 + 0.3 * Math.sin(t * 0.29 + x * 0.0012) + 0.5 * Math.max(0, noise(t * 0.21 + x * 0.0007)) + Drawn.breeze.extra);

  // ------------------------------------------------------------ surfaces the rain lands on
  // parts register { x0, x1, y(x), hit(x, y, vx, vy, r, depth) } for the near rain; the first one
  // (top-down) that the drop passes wins
  DH.surfaces = [];
  DH.surface = (s) => DH.surfaces.push(s);

  // ------------------------------------------------------------ the umbrella
  // the pointer carries an invisible umbrella: near rain splashes off a dome over it
  DH.UMB = { r: 66, lift: 18, glow: 0, x: -9999, y: -9999, on: false };
  DH.underUmbrella = function (x, y) {
    const U = DH.UMB;
    if (!U.on) return 0;
    const dx = Math.abs(x - U.x), dy = y - U.y;
    if (dy < -10 || dy > 420 || dx > U.r * 1.15) return 0;
    return clamp(1 - dx / (U.r * 1.15), 0, 1) * clamp(1 - dy / 420, 0.3, 1);
  };

  // ------------------------------------------------------------ particles (splash, spray, runners)
  DH.fx = [];
  DH.spawn = (p) => { if (DH.fx.length < 900) DH.fx.push(Object.assign({ age: 0, life: 0.6, vx: 0, vy: 0, g: 1600, r: 1.5, z: 'mid' }, p)); };
  // a splash crown + its spray at (x, y): big = drop radius
  DH.splash = function (x, y, r, kind = 'water', z = 'mid') {
    const k = DH.persp(y);
    if (kind === 'water') DH.spawn({ kind: 'crown', x, y, r, life: 0.32 + r * 0.02, g: 0, z });
    if (kind === 'water') DH.spawn({ kind: 'ring', x, y, r, k, life: 0.9 + r * 0.08, g: 0, z: z === 'fore' ? 'fore' : 'water' });
    const n = 2 + Math.round(r * 0.7);
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const sp = 60 + Math.random() * 140 * (0.5 + r * 0.12);
      DH.spawn({ kind: 'spray', x, y: y - 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 1.2, r: 0.6 + Math.random() * r * 0.18, life: 0.35 + Math.random() * 0.3, g: 900, z });
    }
  };
  // how flat a ripple looks at this depth (perspective: flatter toward the horizon)
  DH.persp = (y) => clamp((y - DH.HZ) / 900, 0.05, 0.6);

  // ------------------------------------------------------------ small shared rigs
  DH.spring = (k = 90, d = 9, x = 0) => ({ x, v: 0, target: x, step(dt) { const a = -k * (this.x - this.target) - d * this.v; this.v += a * dt; this.x += this.v * dt; return this.x; } });
  DH.blinker = Drawn.blinker;
  // random idle actions: picks one every few seconds, exposes its name and progress u (0..1)
  DH.actor = function (seed, names, gap = [3, 8], dur = 1.4) {
    const r = rng(seed);
    let wait = gap[0] * 0.5 + r() * gap[1], cur = null, u = 0;
    return {
      get name() { return cur; }, get u() { return u; },
      step(dt) {
        if (cur) { u += dt / dur; if (u >= 1) { cur = null; u = 0; wait = gap[0] + r() * gap[1]; } }
        else if ((wait -= dt) <= 0) { cur = names[Math.floor(r() * names.length)]; u = 0; }
        return cur;
      },
      play(n) { cur = n; u = 0; },
    };
  };
  // a bell curve 0→1→0 over u
  DH.bump = (u) => Math.sin(clamp(u, 0, 1) * Math.PI);
  DH.smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

  // ------------------------------------------------------------ the island's top (for rain and feet)
  // control points of the ridge silhouette, left → right
  DH.ridge = [[852, 794], [870, 766], [898, 734], [936, 706], [984, 684], [1040, 668], [1100, 656], [1170, 640], [1240, 626], [1310, 616], [1380, 614], [1450, 620], [1520, 636], [1580, 662], [1628, 704], [1662, 756], [1680, 794]];
  DH.ridgeY = function (x) {
    const R = DH.ridge;
    if (x <= R[0][0]) return DH.SHORE + 40;
    for (let i = 0; i < R.length - 1; i++) {
      const [x0, y0] = R[i], [x1, y1] = R[i + 1];
      if (x <= x1) { const u = (x - x0) / (x1 - x0), s = u * u * (3 - 2 * u); return lerp(y0, y1, lerp(u, s, 0.5)); }
    }
    return DH.SHORE + 40;
  };

  // view helpers
  DH.view = () => st.view;
})();
