/* fore.js — the near shore and what's right in front of the camera.
     · the mossy near bank, bottom left, a backlit mass of cushions with a fuzzy gold silhouette,
       fairy-bonnet mushrooms and washed pebbles; the ferry's next passenger waits on it, a ladybird
       holding a clover leaf over her head for an umbrella;
     · an earthworm come up out of the soaked ground (they do, in rain), swaying;
     · a fallen oak leaf afloat at the bottom right, rim curled, beaded, rocking on the rings;
     · on tall (phone) screens, a bramble cane hanging into the top of the frame, dripping.

   Hover the ladybird: she twirls her clover and flings a ring of water off it.
   Hover the worm: it stretches up to taste the rain, then sinks back.
   Hover the oak leaf: it rocks and its beads roll to the low side and off into the puddle.

   near-bank z24 (still) · oak z23 · worm z24.5 · ladybird z25 · canopy z33 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, ink, st, P, layer, onLayout } = Drawn;
  const { C, SUN, LINE, SHORE } = DH;
  const M = C.moss, S = C.soil;

  // the near bank: a cushion of moss sloping into the water at the right, its top a silhouette of
  // big rounded cushions against the bright water
  const bankY = (x) => {
    const e = 990 + 14 * Math.sin(x * 0.012) + 8 * noise(x * 0.03);
    return x < 400 ? e : e + ((x - 400) / 130) ** 2 * 70;
  };
  const cushions = [];
  (() => {
    const r = rng(903);
    for (let x = -900; x < 545; x += 14 + r() * 18) cushions.push([x, bankY(x) + 8 + r() * 8, (14 + r() * 20) * (x > 400 ? 0.7 : 1)]);
  })();
  // the shore curls back under toward the bottom left (the phone sees a lot of it)
  // the bank's foot comes toward us (widening) down to below the desktop frame, then curls away
  const shoreX = (y) => (y < 1060 ? 548 : y < 1250 ? 548 + (y - 1060) * 0.22 : 590 - (y - 1250) ** 1.2 * 0.9);
  const bankPath = () => {
    const v = st.view, p = new Path2D(), yb = Math.max(v.y1, 1250) + 40;
    for (const [x, y, rr] of cushions) circ(x, y, rr, p);
    p.moveTo(v.x0 - 40, yb); p.lineTo(v.x0 - 40, 1010);
    for (let x = v.x0 - 40; x <= 540; x += 8) p.lineTo(x, bankY(x) + 14);
    for (let y = bankY(540) + 14; y <= yb; y += 20) p.lineTo(shoreX(y), y);
    p.lineTo(Math.min(v.x0 - 40, shoreX(yb)), yb); p.closePath();
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
    // moss creeping well down the face, so the bank reads as a mossy slope, not a cut
    for (let i = 0; i < 40; i++) {
      const x = v.x0 + r() * (540 - v.x0), top = bankY(x) + 14, y = top + r() ** 1.6 * 160;
      for (let k = 0; k < 6; k++) { const px = x + (r() - 0.5) * 30, py = y + (r() - 0.5) * 10; g.lineWidth = 1.2; g.strokeStyle = r() < 0.5 ? 'rgba(70,100,56,0.35)' : 'rgba(8,14,8,0.5)'; g.beginPath(); g.moveTo(px, py); g.lineTo(px + 1.5, py - 4); g.stroke(); }
    }
    g.restore();
    // fairy-bonnet mushrooms in a huddle on the bank, caps beaded
    for (const [mx, n] of [[48, 4], [470, 3]]) {
      const r3 = rng(mx);
      for (let i = 0; i < n; i++) {
        const x = mx + i * 9 + (r3() - 0.5) * 6, base = bankY(x) + 6, h = 22 + r3() * 26, cw = 7 + r3() * 5;
        const lean = (r3() - 0.5) * 8, tx = x + lean, ty = base - h;
        g.lineWidth = 3.6; g.strokeStyle = LINE; g.beginPath(); g.moveTo(x, base); g.quadraticCurveTo(x + lean * 0.2, base - h * 0.5, tx, ty); g.stroke();
        g.lineWidth = 2; g.strokeStyle = '#c8b090'; g.stroke();
        const cap = new Path2D(); cap.moveTo(tx - cw, ty + 2); cap.bezierCurveTo(tx - cw, ty - cw * 1.3, tx + cw, ty - cw * 1.3, tx + cw, ty + 2); cap.quadraticCurveTo(tx, ty - 1, tx - cw, ty + 2); cap.closePath();
        ink(g, cap, '#b08060', 1.4);
        DH.shadeFace(g, cap, tx - cw, tx + cw, 0.55);
        DH.rim(g, cap, tx, 1.8);
        g.lineWidth = 0.6; g.strokeStyle = 'rgba(60,40,40,0.6)';
        for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(tx + k * cw * 0.3, ty - cw * 0.9); g.lineTo(tx + k * cw * 0.45, ty + 1); g.stroke(); }
        DH.glassDrop(g, tx + cw * 0.9, ty + 4, 1.8, { sy: 1.2 });
      }
    }
    // the fuzzy silhouette: shoots standing off the cushions' tops, tipped gold on the sun side
    for (const [px, py, a, q] of edgePts) {
      if (px > 430 && Math.cos(a) > -0.2) continue;
      const near = DH.sunNear(px, 700), h = 2.5 + q * 4.5;
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
    // pebbles washed together at its waterline, wet on top
    for (let y = 1250, i = 0; y < Math.min(v.y1, 1900); y += 60 + (i * 17) % 40, i++) {
      const x = shoreX(y) - 4 - (i % 3) * 6, sz = 5 + (i * 13) % 7;
      const p = DH.blob(x, y, sz * 1.3, sz * 0.75, 8, 0.2, i + 7);
      ink(g, p, '#3a3448', 1.4); DH.crescent(g, p, '#221d2c', 0, -sz * 0.4); DH.crescent(g, p, 'rgba(255,200,150,0.5)', 0, 1.6);
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
    hit: (x, y) => Math.abs(x - LB.x - 8) < 56 && y > LB.y - 104 && y < LB.y + 8,
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
      g.save(); g.translate(x, y); g.scale(1.3, 1.3); g.translate(-x, -y);
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
      g.restore();
    },
  });
  // rain lands on the clover, not the ladybird
  DH.surface({ band: 'near', x0: LB.x - 22, x1: LB.x + 58, y: () => LB.y - 96, hit(x, y, d) { lady.sv += 0.6; DH.splash(x, y, d.r * 0.6, 'ground', 'mid'); } });
  DH.surface({ band: 'fore', x0: LB.x - 22, x1: LB.x + 58, y: () => LB.y - 96, hit(x, y, d) { lady.sv += 1.4; DH.splash(x, y, d.r * 0.6, 'ground', 'fore'); } });

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

  // ------------------------------------------------------------ the floating oak leaf
  // A fallen oak leaf afloat, seen almost edge-on from the water: lobed, its rim curled up so a
  // sliver of its paler underside shows, beaded with rain; it rocks on the rings, and so do they.
  const OAK = { x: 1430, y: 1100, s: 1.25 };
  const oak = { beads: [], tip: DH.spring(40, 3), roll: 0, run: 0 };
  // the lobed outline in leaf space (x along the midrib, -90..90), flattened by perspective when drawn
  const lobes = (() => {
    const pts = [];
    for (let i = 0; i <= 40; i++) {
      const u = i / 40, x = -92 + u * 184;
      const env = Math.sin(u * Math.PI) ** 0.7 * 46 * (1 - u * 0.25);
      pts.push([x, -env * (0.78 + 0.22 * Math.cos(u * TAU * 3.5))]);
    }
    for (let i = 40; i >= 0; i--) {
      const u = i / 40, x = -92 + u * 184;
      const env = Math.sin(u * Math.PI) ** 0.7 * 46 * (1 - u * 0.25);
      pts.push([x, env * (0.78 + 0.22 * Math.cos(u * TAU * 3.5 + 1.2))]);
    }
    return pts;
  })();
  onLayout(() => {
    oak.beads.length = 0;
    const r = rng(55);
    for (let i = 0; i < 16; i++) oak.beads.push({ x: -70 + r() * 130, y: (r() - 0.5) * 50, r: 2 + r() * 4, vx: 0, home: 0 });
    for (const b of oak.beads) b.home = b.x;
  });
  const K2 = () => DH.persp(OAK.y) * 1.7;
  layer({
    id: 'oak', z: 23,
    hit(x, y) { const k = K2(); return Math.hypot((x - OAK.x) / (100 * OAK.s), (y - OAK.y) / (52 * OAK.s * k + 14)) < 1; },
    onEnter() { oak.tip.v += (P.vx > 0 ? 1 : -1) * 3; oak.run = 1; },
    update(dt, t, L) {
      oak.tip.target = Math.sin(t * 1.1) * 0.15 + (Drawn.wind(t, OAK.x) - 0.6) * 0.2;
      oak.tip.step(dt);
      oak.run = L.hovered ? 1 : Math.max(0, oak.run - dt * 0.6);
      for (const b of oak.beads) {
        // they roll toward the low side as it rocks, and off the edge into the water when it tips
        b.vx += (oak.tip.x * 160 + (b.home - b.x) * (oak.run > 0.5 ? 0 : 2)) * dt;
        b.vx *= Math.exp(-2 * dt);
        b.x += b.vx * dt;
        if (Math.abs(b.x) > 86) {
          const k = K2();
          DH.splash(OAK.x + b.x * OAK.s, OAK.y + b.y * OAK.s * k + 4, b.r * 0.7, 'water', 'fore');
          b.x = (Math.random() - 0.5) * 60; b.vx = 0; b.r = 2 + Math.random() * 3.5; b.home = b.x;
        }
      }
    },
    draw(g, t) {
      const k = K2(), bob = Math.sin(t * 1.6) * 1.2;
      const toW = ([x, y], lift = 0) => [OAK.x + x * OAK.s, OAK.y + bob + y * OAK.s * k - lift + oak.tip.x * x * 0.25];
      // its reflection: a dark smear under it
      g.fillStyle = 'rgba(20,14,26,0.4)'; g.fill(ell(OAK.x, OAK.y + bob + 10, 100 * OAK.s, 18));
      // curled rim: the underside showing, a little above the waterline
      const under = curve(lobes.map((p) => toW(p, Math.abs(p[1]) * 0.12 + 3)));
      ink(g, under, '#9a6a48', 2.6);
      const top = curve(lobes.map((p) => toW([p[0] * 0.94, p[1] * 0.9], Math.abs(p[1]) * 0.06 + 5)));
      g.lineWidth = 1.6; g.strokeStyle = LINE; g.stroke(top);
      g.fillStyle = grad(g, OAK.x - 100, 0, OAK.x + 100, 0, ['#a8703e', '#7a4a32', '#4a2e2a']); g.fill(top);
      g.save(); g.clip(top);
      // veins: midrib and side veins into the lobes
      g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,214,150,0.6)';
      const mr0 = toW([-90, 0], 5), mr1 = toW([90, 0], 5);
      g.beginPath(); g.moveTo(...mr0); g.lineTo(...mr1); g.stroke();
      g.lineWidth = 0.9;
      for (let i = -3; i <= 3; i++) for (const sd of [-1, 1]) { const a = toW([i * 24, 0], 5), b2 = toW([i * 24 + 14, sd * 34], 5); g.beginPath(); g.moveTo(...a); g.lineTo(...b2); g.stroke(); }
      // the wet sheen of the sky on it
      g.fillStyle = 'rgba(255,220,170,0.28)'; g.fill(ell(OAK.x - 30, OAK.y + bob - 8, 60, 6));
      DH.shadeFace(g, top, OAK.x - 110, OAK.x + 110, 0.55);
      g.restore();
      DH.crescent(g, top, 'rgba(255,214,150,0.9)', 3, 2);
      // the stalk, curling up out of the water at the back
      const [sx, sy] = toW([92, 0], 6);
      g.lineWidth = 4; g.strokeStyle = LINE; g.beginPath(); g.moveTo(sx, sy); g.quadraticCurveTo(sx + 14, sy - 2, sx + 18, sy - 16); g.stroke();
      g.lineWidth = 2; g.strokeStyle = '#a86a3a'; g.stroke();
      for (const b of oak.beads) { const [bx, by] = toW([b.x, b.y], 6); DH.glassDrop(g, bx, by - b.r * 0.6, b.r, { flat: 0.6, sy: 0.85 }); }
      g.fillStyle = 'rgba(255,224,170,0.35)'; g.fill(ell(OAK.x, OAK.y + bob + 3, 96 * OAK.s, 1.8));
    },
  });
  DH.surface({ band: 'fore', x0: OAK.x - 100 * OAK.s, x1: OAK.x + 100 * OAK.s, y: () => OAK.y - 6, hit(x, y, d) { oak.tip.v += (x - OAK.x) * 0.002; DH.splash(x, y, d.r * 0.7, 'ground', 'fore'); } });

  // ------------------------------------------------------------ the canopy (tall screens only)
  // A portrait screen sees far above the artboard; there, the underside of a bramble's leaves hangs
  // down into the top of the picture, dark and soft, dripping from its tips.
  const canopy = [];
  onLayout(() => {
    canopy.length = 0;
    const v = st.view;
    if (v.y0 > -160) return;
    const r = rng(611);
    for (let i = 0; i < 7; i++) {
      const x = lerp(v.x0 - 40, v.x1 + 40, i / 6 + (r() - 0.5) * 0.08);
      canopy.push({ x, y: v.y0 + 20, len: 200 + r() * 220, w: 80 + r() * 60, lean: (r() - 0.5) * 0.7, ph: r() * TAU, drip: r() });
    }
  });
  layer({
    id: 'canopy', z: 33,
    update(dt, t) {
      for (const c of canopy) {
        c.drip += dt * 0.25;
        if (c.drip > 1) {
          c.drip = 0;
          const a = c.lean + Math.sin(t * 0.6 + c.ph) * 0.05;
          DH.spawn({ kind: 'drip', x: c.x + Math.sin(a) * c.len, y: c.y + Math.cos(a) * c.len, vx: 0, vy: 40, r: 3, life: 4, g: 1300, z: 'fore', land: 1100 + Math.random() * (st.view.y1 - 1150) });
        }
      }
    },
    draw(g, t) {
      if (canopy.length) {
        // the arching cane they hang from, with a few thorns
        const v = st.view, y = canopy[0].y;
        const cane = new Path2D(); cane.moveTo(v.x0 - 60, y + 70); cane.bezierCurveTo(v.x0 + 300, y - 10, v.x1 - 400, y + 10, v.x1 + 60, y + 60);
        g.lineCap = 'round';
        g.lineWidth = 22; g.strokeStyle = 'rgba(14,16,22,0.3)'; g.stroke(cane);
        g.lineWidth = 12; g.strokeStyle = '#141820'; g.stroke(cane);
        g.lineWidth = 2; g.strokeStyle = 'rgba(255,190,130,0.3)'; g.save(); g.translate(0, 5); g.stroke(cane); g.restore();
      }
      for (const c of canopy) {
        const a = c.lean + Math.sin(t * 0.6 + c.ph) * 0.05 + (Drawn.wind(t, c.x) - 0.6) * 0.06;
        g.save(); g.translate(c.x, c.y); g.rotate(-a);
        const p = new Path2D(); p.moveTo(0, 0); p.bezierCurveTo(c.w, c.len * 0.2, c.w * 0.6, c.len * 0.8, 0, c.len); p.bezierCurveTo(-c.w * 0.6, c.len * 0.8, -c.w, c.len * 0.2, 0, 0); p.closePath();
        for (const [w, al] of [[18, 0.1], [8, 0.2]]) { g.lineWidth = w; g.strokeStyle = `rgba(16,20,24,${al})`; g.stroke(p); }
        g.fillStyle = 'rgba(18,24,26,0.95)'; g.fill(p);
        g.save(); g.clip(p);
        g.lineWidth = 2; g.strokeStyle = 'rgba(80,100,70,0.35)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, c.len); g.stroke();
        for (let k = 1; k < 6; k++) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(0, c.len * k / 7); g.quadraticCurveTo(s * c.w * 0.3, c.len * k / 7 + 10, s * c.w * 0.55, c.len * k / 7 + 26); g.stroke(); }
        g.restore();
        DH.crescent(g, p, 'rgba(255,200,140,0.35)', 0, -4);
        g.restore();
        const tx = c.x + Math.sin(a) * c.len, ty = c.y + Math.cos(a) * c.len;
        DH.glassDrop(g, tx, ty + 2 + c.drip * 4, 2 + c.drip * 2.5, { sy: 1 + c.drip * 0.3 });
      }
    },
  });

  DH.bankY = bankY;
})();
