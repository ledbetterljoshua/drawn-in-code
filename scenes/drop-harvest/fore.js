/* fore.js — the near shore and what's right in front of the camera.
     · the mossy near bank, bottom left, rimmed gold, where the ferry's next passenger waits: a
       ladybird holding a clover leaf over her head for an umbrella;
     · an earthworm come up out of the soaked ground (they do, in rain), swaying;
     · a wet stone half in the water at the bottom right, glossy with the sky, beaded with rain;
     · out-of-focus blades of grass at both edges, dark and soft, framing the picture.

   Hover the ladybird: she twirls her clover and flings a ring of water off it.
   Hover the worm: it stretches up to taste the rain, then sinks back.
   Hover the stone: the beads on it gather and run off into the puddle.

   near-bank z24 (still) · ladybird z25 · worm z24.5 · stone z23 · edge-blades z34 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, ink, st, P, layer, onLayout } = Drawn;
  const { C, SUN, LINE, SHORE } = DH;
  const M = C.moss, S = C.soil;

  // the near bank: a cushion of moss sloping into the water at the right, its top a silhouette of
  // big rounded cushions against the bright water
  const bankY = (x) => {
    const e = 990 + 14 * Math.sin(x * 0.012) + 8 * noise(x * 0.03);
    return x < 400 ? e : e + ((x - 400) / 130) ** 2 * 150;
  };
  const cushions = [];
  (() => {
    const r = rng(903);
    for (let x = -900; x < 545; x += 14 + r() * 18) cushions.push([x, bankY(x) + 8 + r() * 8, 14 + r() * 20 * (x > 420 ? 0.6 : 1)]);
  })();
  // the shore curls back under toward the bottom left (the phone sees a lot of it)
  const shoreX = (y) => (y < 1060 ? 548 : 548 - (y - 1060) * 0.55);
  const bankPath = () => {
    const v = st.view, p = new Path2D(), yb = Math.max(v.y1, 1250) + 40;
    for (const [x, y, rr] of cushions) circ(x, y, rr, p);
    p.moveTo(v.x0 - 40, yb); p.lineTo(v.x0 - 40, 1010);
    for (let x = v.x0 - 40; x <= 540; x += 8) p.lineTo(x, bankY(x) + 14);
    for (let y = bankY(540) + 14; y <= yb; y += 20) p.lineTo(shoreX(y), y);
    p.lineTo(v.x0 - 40, yb); p.closePath();
    return p;
  };
  // points on the silhouette: tops of cushions not buried in a neighbour
  const edgePts = (() => {
    const out = [], r = rng(904);
    for (const [x, y, rr] of cushions) {
      for (let a = -Math.PI * 0.95; a < -Math.PI * 0.05; a += 0.13 + r() * 0.1) {
        const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr;
        if (cushions.some(([x2, y2, r2]) => (x2 !== x || y2 !== y) && Math.hypot(px - x2, py - y2) < r2 - 1.5)) continue;
        out.push([px, py, a, r()]);
      }
    }
    return out;
  })();

  function paintBank(g) {
    const v = st.view, B = bankPath(), r = rng(901);
    g.lineWidth = 5; g.strokeStyle = LINE; g.stroke(B);
    // a backlit mass: deep cool shade, only the cushions' tops catch the light
    g.fillStyle = grad(g, 0, 960, 0, Math.max(v.y1, 1300), [[0, '#1e2e1e'], [0.12, '#18241a'], [0.35, '#1a121c'], [1, '#0e0910']]);
    g.fill(B);
    g.save(); g.clip(B);
    const U = new Path2D(); for (const [x, y, rr] of cushions) circ(x, y, rr, U);
    DH.cel(g, U, { dark: '#1a2a1c', base: '#2a4026', lit: '#4a6634', dd: [6, 8], ld: [-5, 7] });
    // the soft hollows where cushions meet, and a stipple of shoots over the moss
    for (const [x, y, rr] of cushions) {
      g.fillStyle = 'rgba(8,14,8,0.35)'; g.fill(ell(x, y + rr * 0.75, rr * 0.8, rr * 0.35));
      for (let i = 0; i < rr * 1.4; i++) {
        const a = -Math.PI * (0.1 + r() * 0.8), d = rr * (0.3 + r() * 0.65);
        const px = x + Math.cos(a) * d, py = y + Math.sin(a) * d;
        g.lineWidth = 1; g.strokeStyle = r() < 0.5 ? 'rgba(120,150,70,0.45)' : 'rgba(14,24,14,0.5)';
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * 2.5, py + Math.sin(a) * 2.5); g.stroke();
      }
    }
    // soil under the moss: grit and two stones
    for (let i = 0; i < 180; i++) { const x = v.x0 + r() * (560 - v.x0), y = bankY(x) + 40 + r() * 600; g.fillStyle = r() < 0.5 ? 'rgba(110,70,80,0.3)' : 'rgba(6,4,8,0.45)'; g.fill(circ(x, y, 0.8 + r() * 1.8)); }
    for (const [x, y, sz] of [[60, 1100, 20], [300, 1120, 14], [-120, 1180, 24], [120, 1400, 30]]) {
      const p = DH.blob(x, y, sz * 1.3, sz * 0.8, 9, 0.2, x + 5);
      ink(g, p, '#332e40', 1.8); DH.crescent(g, p, '#201b2a', 0, -sz * 0.3); DH.crescent(g, p, 'rgba(200,150,140,0.3)', 0, -3);
    }
    g.restore();
    // the fuzzy silhouette: shoots standing off the cushions' tops, tipped gold on the sun side
    for (const [px, py, a, q] of edgePts) {
      const near = DH.sunNear(px, 700), h = 3 + q * 6;
      const ca = Math.cos(a), sa = Math.sin(a);
      g.lineWidth = 2; g.strokeStyle = '#1a2a1a';
      g.beginPath(); g.moveTo(px - ca, py - sa); g.lineTo(px + ca * h, py + sa * h); g.stroke();
      const lit = (DH.sunSide(px) > 0 ? ca > -0.3 : ca < 0.3) && sa < -0.2;
      if (lit) {
        g.lineWidth = 1.3; g.strokeStyle = `rgba(255,${196 + near * 44 | 0},130,${0.5 + near * 0.45})`;
        g.beginPath(); g.moveTo(px + ca * h * 0.3, py + sa * h * 0.3); g.lineTo(px + ca * h, py + sa * h); g.stroke();
        g.lineWidth = 2; g.strokeStyle = `rgba(255,${190 + near * 40 | 0},120,${0.35 + near * 0.4})`;
        g.beginPath(); g.arc(px - ca * 1.5, py - sa * 1.5, 2.5, a - 0.6, a + 0.6); g.stroke();
      }
    }
    // the waterline round its right side
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,214,160,0.35)';
    g.beginPath(); for (let y = bankY(540) + 20; y < Math.min(v.y1, 1900); y += 12) { const x = shoreX(y) + 3; y === bankY(540) + 20 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
  }
  layer({ id: 'near-bank', z: 24, still: true, draw: paintBank });

  // rain on the near bank (and the fore drops)
  const bankHit = (x, y, d) => DH.splash(x, y, d.r * 0.8, 'ground', d.band === 'fore' ? 'fore' : 'mid');
  DH.surface({ band: 'fore', x0: -2000, x1: 545, y: (x) => bankY(x) + 2, hit: bankHit });
  DH.surface({ band: 'near', x0: -2000, x1: 545, y: (x) => bankY(x) + 2, hit: bankHit });

  // ------------------------------------------------------------ the ladybird and her clover
  const LB = { x: 318, y: bankY(318) - 2 };
  const lady = { spin: 0, sv: 0, blink: Drawn.blinker(), tilt: DH.spring(60, 4) };
  layer({
    id: 'ladybird', z: 25,
    hit: (x, y) => Math.abs(x - LB.x) < 44 && y > LB.y - 80 && y < LB.y + 6,
    onEnter() {
      lady.sv = 14;
      for (let i = 0; i < 14; i++) { const a = (i / 14) * TAU; DH.spawn({ kind: 'spray', x: LB.x + Math.cos(a) * 30, y: LB.y - 64 + Math.sin(a) * 6, vx: Math.cos(a) * 160, vy: -40 + Math.sin(a) * 30, r: 1.2, life: 0.6, g: 900, z: 'fore' }); }
    },
    update(dt, t) {
      lady.spin += lady.sv * dt; lady.sv *= Math.exp(-1.6 * dt);
      lady.tilt.target = (Drawn.wind(t, LB.x) - 0.6) * 0.2; lady.tilt.step(dt);
    },
    draw(g, t) {
      const { x, y } = LB;
      g.fillStyle = 'rgba(10,8,16,0.55)'; g.fill(ell(x, y + 1, 18, 3.5));
      // legs
      g.lineWidth = 1.4; g.strokeStyle = LINE;
      for (const lx of [-8, -1, 6]) { g.beginPath(); g.moveTo(x + lx, y - 6); g.lineTo(x + lx - 2, y); g.stroke(); }
      // the shell: red dome, black spots, a wet shine; she faces right, toward the ferry
      const sh = new Path2D(); sh.moveTo(x - 15, y - 5); sh.bezierCurveTo(x - 15, y - 26, x + 13, y - 26, x + 13, y - 5); sh.closePath();
      ink(g, sh, '#d8402e', 1.8);
      g.save(); g.clip(sh);
      g.fillStyle = '#8a2420'; g.fill(DH.shift(sh, 5, 3));
      g.fillStyle = '#1a1016';
      for (const [sx, sy, sr] of [[-8, -12, 3], [0, -18, 2.6], [6, -10, 3], [-2, -8, 2.2], [9, -17, 2]]) g.fill(circ(x + sx, y + sy, sr));
      g.restore();
      g.lineWidth = 1; g.strokeStyle = LINE; g.beginPath(); g.moveTo(x - 1, y - 20); g.lineTo(x - 1, y - 5); g.stroke();
      DH.crescent(g, sh, 'rgba(255,214,150,0.9)', -2.4, 1.4);
      g.fillStyle = 'rgba(255,255,255,0.75)'; g.fill(ell(x - 6, y - 19, 4, 1.8, undefined, -0.4));
      // head, white cheek patches, eyes on the sky
      const hd = ell(x + 15, y - 8, 6, 5);
      ink(g, hd, '#1a1016', 1.4);
      g.fillStyle = '#f6efe0'; g.fill(ell(x + 17, y - 11, 2.4, 1.6)); g.fill(ell(x + 12.5, y - 11.5, 2, 1.4));
      const o = lady.blink(t), up = DH.underUmbrella(x, y - 60) > 0.2;
      g.fillStyle = '#fff'; g.fill(circ(x + 17.5, y - 8.5 - (up ? 1 : 0), 1.6 * o));
      g.fillStyle = LINE; g.fill(circ(x + 18, y - 8.6 - (up ? 1.4 : 0), 0.8 * o));
      // the arm holding the clover stalk
      g.lineWidth = 1.6; g.strokeStyle = LINE; g.beginPath(); g.moveTo(x + 9, y - 6); g.lineTo(x + 12, y - 16); g.stroke();
      // the clover: three heart-shaped leaflets on a stalk, spinning slowly when twirled
      g.save(); g.translate(x + 12, y - 16); g.rotate(lady.tilt.x - 0.1);
      g.lineWidth = 3.4; g.strokeStyle = LINE; g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-2, -30, 0, -52); g.stroke();
      g.lineWidth = 1.8; g.strokeStyle = '#8aa65a'; g.stroke();
      g.translate(0, -54);
      g.scale(1, 0.34);
      for (let i = 0; i < 3; i++) {
        const a = lady.spin + (i / 3) * TAU;
        g.save(); g.rotate(a);
        const lf = new Path2D(); lf.moveTo(0, 0); lf.bezierCurveTo(10, -6, 28, -22, 22, -32); lf.quadraticCurveTo(14, -38, 4, -30); lf.quadraticCurveTo(-6, -36, -14, -28); lf.bezierCurveTo(-18, -18, -8, -6, 0, 0); lf.closePath();
        const front = Math.sin(a + 0.6) > 0;
        ink(g, lf, front ? '#4e7a3a' : '#6e9a48', 3.4);
        g.fillStyle = 'rgba(230,240,190,0.5)'; g.fill(ell(4, -20, 6, 3));
        g.restore();
      }
      g.restore();
      // the clover's rim of sun and a drop hanging off its edge
      const cx = x + 12 + Math.sin(lady.tilt.x) * 54, cy = y - 70;
      DH.glassDrop(g, cx - 26, cy + 10, 2.6);
      DH.glassDrop(g, cx + 22, cy + 9, 2.2);
    },
  });
  // rain lands on the clover, not the ladybird
  DH.surface({ band: 'near', x0: LB.x - 18, x1: LB.x + 46, y: () => LB.y - 74, hit(x, y, d) { lady.sv += 0.6; DH.splash(x, y, d.r * 0.6, 'ground', 'mid'); } });
  DH.surface({ band: 'fore', x0: LB.x - 18, x1: LB.x + 46, y: () => LB.y - 74, hit(x, y, d) { lady.sv += 1.4; DH.splash(x, y, d.r * 0.6, 'ground', 'fore'); } });

  // ------------------------------------------------------------ the earthworm
  const WORM = { x: 128, y: bankY(128) + 4 };
  const worm = { up: 0.4, tgt: 0.4, ph: 0 };
  layer({
    id: 'worm', z: 24.5,
    hit: (x, y) => Math.abs(x - WORM.x - 14) < 30 && y > WORM.y - 90 && y < WORM.y + 6,
    update(dt, t, L) {
      worm.ph += dt;
      worm.tgt = L.hovered ? 1 : 0.42 + Math.sin(t * 0.37) * 0.12;
      worm.up = ease(worm.up, worm.tgt, L.hovered ? 2.4 : 1.2, dt);
    },
    draw(g, t) {
      const h = 22 + worm.up * 60;
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const u = i / 12;
        const sway = Math.sin(t * 1.4 - u * 3) * 10 * u + Math.sin(t * 0.6) * 4 * u;
        pts.push([WORM.x + sway + u * 8, WORM.y - u * h]);
      }
      const path = curve(pts, false);
      g.lineCap = 'round';
      g.lineWidth = 13; g.strokeStyle = LINE; g.stroke(path);
      g.lineWidth = 10; g.strokeStyle = '#c87a7a'; g.stroke(path);
      g.lineWidth = 3; g.strokeStyle = 'rgba(255,214,170,0.8)'; g.save(); g.translate(2.5, 0); g.stroke(path); g.restore();
      // rings of segments
      g.lineWidth = 0.9; g.strokeStyle = 'rgba(90,40,50,0.6)';
      for (let i = 1; i < 12; i++) { const [x, y] = pts[i]; g.beginPath(); g.moveTo(x - 4.5, y + 1); g.quadraticCurveTo(x, y + 2.5, x + 4.5, y + 1); g.stroke(); }
      // the saddle band
      const [cx, cy] = pts[4];
      g.lineWidth = 11; g.strokeStyle = '#d89a8a'; g.beginPath(); g.moveTo(cx, cy + 4); g.lineTo(pts[5][0], pts[5][1]); g.stroke();
      // tip: blunt and glistening, tasting the air
      const [tx, ty] = pts[12];
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fill(ell(tx + 1, ty + 1, 2, 1.2));
      // the hole it came out of
      ink(g, ell(WORM.x, WORM.y + 1, 9, 3), '#120a12', 1.2);
    },
  });

  // ------------------------------------------------------------ the wet stone
  const STONE = { x: 1430, y: 1176, rx: 176, ry: 64 };
  const stone = { beads: [], run: 0 };
  onLayout(() => {
    stone.beads.length = 0;
    const r = rng(55);
    for (let i = 0; i < 26; i++) { const a = Math.PI * (1.1 + r() * 0.8), k = 0.3 + r() * 0.65; stone.beads.push({ x: STONE.x + Math.cos(a) * STONE.rx * k, y: STONE.y + Math.sin(a) * STONE.ry * k * 0.9, r: 1.6 + r() * 3.4, v: 0, y0: 0 }); }
    for (const b of stone.beads) b.y0 = b.y;
  });
  const stonePath = () => {
    const { x, y, rx, ry } = STONE, p = new Path2D();
    p.moveTo(x - rx, y + 20); p.bezierCurveTo(x - rx, y - ry * 0.6, x - rx * 0.5, y - ry * 1.05, x + 10, y - ry);
    p.bezierCurveTo(x + rx * 0.7, y - ry * 0.95, x + rx, y - ry * 0.3, x + rx, y + 20); p.closePath();
    return p;
  };
  layer({
    id: 'stone', z: 23,
    hit(x, y) { return y < STONE.y + 18 && Math.hypot((x - STONE.x) / STONE.rx, (y - STONE.y) / STONE.ry) < 1.05; },
    onEnter() { stone.run = 1; },
    update(dt, t, L) {
      stone.run = L.hovered ? 1 : Math.max(0, stone.run - dt * 0.5);
      for (const b of stone.beads) {
        if (stone.run > 0.5) b.v += dt * (40 + b.r * 30);
        b.y += b.v * dt;
        if (b.y > STONE.y + 16) { DH.splash(b.x, STONE.y + 18, b.r * 0.6, 'water', 'fore'); b.y = b.y0 - 6; b.v = 0; b.r = 1.4 + Math.random() * 3; }
        if (stone.run < 0.2) b.v *= Math.exp(-3 * dt);
      }
    },
    draw(g, t) {
      const p = stonePath(), { x, y, rx, ry } = STONE;
      g.lineWidth = 3.2; g.strokeStyle = LINE; g.stroke(p);
      g.fillStyle = grad(g, 0, y - ry, 0, y + 20, ['#4c4660', '#36304a', '#1e1a2c']); g.fill(p);
      g.save(); g.clip(p);
      // the sky's reflection on its wet top: the gold rift and the storm, smeared
      g.fillStyle = grad(g, x - rx, 0, x + rx, 0, [[0, 'rgba(255,200,140,0.5)'], [0.4, 'rgba(255,220,170,0.25)'], [1, 'rgba(120,110,160,0.2)']]);
      g.fill(ell(x - 20, y - ry * 0.75, rx * 0.8, ry * 0.25));
      // speckles of mica
      const r = rng(66);
      for (let i = 0; i < 80; i++) { g.fillStyle = `rgba(200,190,230,${r() * 0.3})`; g.fill(circ(x + (r() - 0.5) * rx * 2, y - r() * ry, 0.8 + r())); }
      // the waterline wet band
      g.fillStyle = grad(g, 0, y, 0, y + 20, ['rgba(10,8,20,0)', 'rgba(10,8,20,0.6)']); g.fillRect(x - rx, y, rx * 2, 20);
      g.restore();
      DH.crescent(g, p, 'rgba(255,210,150,0.75)', 4, 4);
      for (const b of stone.beads) DH.glassDrop(g, b.x, b.y, b.r, { flat: 0.8, sy: 0.85 + Math.min(0.4, b.v * 0.004) });
      g.fillStyle = 'rgba(255,224,170,0.4)'; g.fill(ell(x, y + 19, rx * 0.95, 2.2));
    },
  });
  DH.surface({ band: 'fore', x0: STONE.x - STONE.rx * 0.9, x1: STONE.x + STONE.rx * 0.9, y: (x) => STONE.y - STONE.ry * Math.sqrt(Math.max(0, 1 - ((x - STONE.x) / STONE.rx) ** 2)) + 6, hit(x, y, d) { DH.splash(x, y, d.r * 0.8, 'ground', 'fore'); } });

  // ------------------------------------------------------------ out-of-focus blades at the edges
  const edge = [];
  onLayout(() => {
    edge.length = 0;
    const v = st.view;
    edge.push({ x: v.x0 + 10, base: v.y1 + 40, top: Math.max(v.y0, -100) + 300, w: 90, bend: 200, ph: 0.3 });
    edge.push({ x: v.x1 - 20, base: v.y1 + 40, top: Math.max(v.y0, -100) + 420, w: 80, bend: -210, ph: 2.4 });
  });
  layer({
    id: 'edge-blades', z: 34,
    draw(g, t) {
      for (const E of edge) {
        const sway = (Drawn.wind(t, E.x) - 0.6) * 18 + Math.sin(t * 0.5 + E.ph) * 5;
        const pts = [], n = 8;
        for (let i = 0; i <= n; i++) { const u = i / n; pts.push([E.x + u * u * (E.bend + sway) - E.w * (1 - u * 0.9) / 2, lerp(E.base, E.top, u)]); }
        for (let i = n; i >= 0; i--) { const u = i / n; pts.push([E.x + u * u * (E.bend + sway) + E.w * (1 - u * 0.9) / 2, lerp(E.base, E.top, u)]); }
        const p = curve(pts);
        // out of focus: widening translucent skins, no line, a smear of rim
        for (const [w, a] of [[34, 0.08], [22, 0.12], [12, 0.18], [5, 0.3]]) { g.lineWidth = w; g.strokeStyle = `rgba(22,26,30,${a})`; g.stroke(p); }
        g.fillStyle = 'rgba(22,28,30,0.72)'; g.fill(p);
        DH.crescent(g, p, 'rgba(255,200,130,0.16)', E.bend > 0 ? -10 : 10, 0);
      }
    },
  });

  DH.bankY = bankY;
})();
