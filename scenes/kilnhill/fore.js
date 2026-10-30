/* fore.js — the near ground: what you'd trip over walking up the path to the kiln.
   z 52 / 53  drying rack (still / live): three planks of greenware drying before the next firing,
     seen from above so you look into the pots. Hover: they wobble one after another like
     dominoes with a clink, and the last one teeters
   z 54 / 55  cooling bench (still / live): pots out of the last firing, still glowing dull red,
     their glaze crazing as it cools. Idle: heat shimmer. Hover: the glaze tinks, crackle lines
     spark across it
   z 56  sleeper (live): a mole asleep against the warm bench end, breathing. Hover: it rolls over,
     smiles, and a bubble of Zs rises; linger and it scratches its nose
   z 57  post (live): a pierced lantern hanging from a post by the path, throwing a ring of dots.
     Hover: it swings on its hook and the dots sway over the ground
   z 58  chime (live): sherds hung on strings from the post arm. Hover: they clack and spin
   z 59  carrier (live): a mole climbing the terrace ladder with a stack of greenware on its head.
     Hover: it freezes, the stack wobbles, and it steadies it with one hand */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, rect, poly, curve, grad, radial, st, P, layer } = Drawn;
  const K = window.Kiln, M = K.M;

  // ------------------------------------------------------------------ drying rack
  const RX0 = -270, RX1 = 236, shelves = [1176, 1086, 996];
  const greenware = [];
  {
    const r = rng(71);
    shelves.forEach((sy, si) => {
      let x = RX0 + 24 + r() * 10;
      while (x < RX1 - 30) {
        const kind = r(), w = 14 + r() * 12, h = kind < 0.25 ? 12 + r() * 8 : 22 + r() * 26;
        greenware.push({ x, y: sy, w, h, kind: kind < 0.25 ? 'bowl' : kind < 0.4 ? 'upturned' : kind < 0.75 ? 'jar' : 'vase', shelf: si, seed: r() * 1000, col: K.mix(M.slip, M.clayPale, r()), wob: K.spring({ k: 90, d: 5 }) });
        x += w * 2 + 14 + r() * 22;
      }
    });
  }
  function greenPot(g, p, ox = 0, rot = 0) {
    const { x, y, w, h, kind } = p;
    g.save(); g.translate(x + ox, y); g.rotate(rot);
    const ry = K.rimRy(y - h, w * 0.8);
    const col = K.lit(p.col, x, y - h / 2, [0.2, -0.2, 1]);
    const dark = K.css(K.mul(col, 0.55)), base = K.css(col);
    const line = K.inkAt(x, y, 0.5);
    let body;
    if (kind === 'bowl') body = curve([[-w, -h], [-w * 0.9, -h * 0.4], [-w * 0.5, 0], [w * 0.5, 0], [w * 0.9, -h * 0.4], [w, -h]], false);
    else if (kind === 'upturned') body = curve([[-w, 0], [-w * 0.9, -h * 0.6], [-w * 0.5, -h], [w * 0.5, -h], [w * 0.9, -h * 0.6], [w, 0]], false);
    else if (kind === 'jar') body = curve([[-w * 0.6, -h], [-w * 0.8, -h * 0.85], [-w, -h * 0.45], [-w * 0.7, 0], [w * 0.7, 0], [w, -h * 0.45], [w * 0.8, -h * 0.85], [w * 0.6, -h]], false);
    else body = curve([[-w * 0.45, -h], [-w * 0.35, -h * 0.75], [-w, -h * 0.3], [-w * 0.55, 0], [w * 0.55, 0], [w, -h * 0.3], [w * 0.35, -h * 0.75], [w * 0.45, -h]], false);
    body.closePath();
    g.fillStyle = 'rgba(8,4,10,0.4)'; g.fill(ell(2, 0, w * 0.9, 3));
    const rimc = K.css(K.mix(col, [1, 0.72, 0.45], 0.5));
    g.fillStyle = grad(g, -w, 0, w, 0, [[0, dark], [0.5, base], [0.82, base], [1, rimc]]); g.fill(body);
    g.lineWidth = 1.5; g.strokeStyle = line; g.stroke(body);
    if (kind !== 'upturned') {
      const rw = kind === 'bowl' ? w : kind === 'jar' ? w * 0.6 : w * 0.45;
      const rim = ell(0, -h, rw, Math.abs(ry) + 1.2);
      g.fillStyle = K.css(K.mul(col, 0.35)); g.fill(rim);
      g.fillStyle = K.css(K.mul(col, 0.7)); g.fill(ell(0, -h - Math.abs(ry) * 0.3, rw * 0.92, (Math.abs(ry) + 1.2) * 0.55));
      g.fillStyle = K.css(K.mul(col, 0.3)); g.fill(ell(0, -h + Math.abs(ry) * 0.15, rw * 0.85, (Math.abs(ry) + 1.2) * 0.7));
      g.lineWidth = 1.2; g.stroke(rim);
    } else { g.fillStyle = K.css(K.mul(col, 0.8)); g.fill(ell(0, -h, w * 0.3, 2)); g.lineWidth = 1; g.strokeStyle = line; g.stroke(ell(0, -h, w * 0.3, 2)); }
    // finger marks from throwing
    g.lineWidth = 0.7; g.strokeStyle = 'rgba(60,40,30,0.25)';
    for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(-w * 0.8, -h * k / 4); g.quadraticCurveTo(0, -h * k / 4 + 2, w * 0.8, -h * k / 4); g.stroke(); }
    g.restore();
  }
  function plank(g, x0, x1, y, d) {
    // a shelf plank seen from above: top face, then the front edge
    const top = poly([[x0 - 4, y - d], [x1 + 4, y - d], [x1, y], [x0, y]]);
    g.fillStyle = K.litc(M.woodPale, (x0 + x1) / 2, y - d / 2, [0, -1, 0.5]); g.fill(top);
    g.save(); g.clip(top);
    const r = rng(y);
    g.lineWidth = 0.8; g.strokeStyle = 'rgba(60,36,24,0.4)';
    for (let k = 0; k < 4; k++) { const yy = y - d + (k + 0.5) * d / 4; g.beginPath(); g.moveTo(x0, yy); for (let x = x0; x < x1; x += 20) g.lineTo(x, yy + (r() - 0.5) * 1.2); g.stroke(); }
    g.fillStyle = 'rgba(40,24,20,0.5)'; g.fill(ell(x0 + (x1 - x0) * r(), y - d / 2, 4, 1.6));
    g.restore();
    g.fillStyle = K.litc(M.wood, (x0 + x1) / 2, y + 4, [0, 0, 1]); g.fillRect(x0, y, x1 - x0, 7);
    g.lineWidth = 1.6; g.strokeStyle = K.inkAt((x0 + x1) / 2, y, 0.5); g.stroke(top); g.strokeRect(x0, y, x1 - x0, 7);
  }
  layer({
    id: 'rack', z: 52, still: true,
    draw(g) {
      // posts, back pair a little higher and thinner (seen from above, they stand behind)
      for (const x of [RX0 + 10, RX1 - 12]) {
        Drawn.tube(g, Drawn.seg(x + 14, 950, x + 14, 1160), K.litc(M.woodDark, x, 1000), 7, 1.6);
      }
      g.fillStyle = 'rgba(8,4,10,0.5)'; g.fill(ell((RX0 + RX1) / 2, 1196, (RX1 - RX0) / 2 + 20, 12));
      for (const sy of shelves) plank(g, RX0, RX1, sy, 24 - (1176 - sy) * 0.06);
      for (const x of [RX0 + 2, RX1 - 4]) Drawn.tube(g, Drawn.seg(x, 966, x, 1196), K.litc(M.wood, x, 1050, [0.6, 0, 0.8]), 11, 2);
      // a cloth thrown over one end to slow the drying
      const cl = curve([[RX1 - 80, 1086 - 22], [RX1 - 10, 1086 - 24], [RX1 + 8, 1086 - 6], [RX1 + 12, 1118], [RX1 - 4, 1136], [RX1 - 18, 1104], [RX1 - 44, 1098], [RX1 - 72, 1094]]);
      g.fillStyle = K.litc(M.cloth, RX1 - 30, 1050); g.fill(cl); g.lineWidth = 1.5; g.strokeStyle = K.inkAt(RX1, 1050, 0.5); g.stroke(cl);
      g.lineWidth = 0.9; g.beginPath(); g.moveTo(RX1 - 34, 1066); g.quadraticCurveTo(RX1 - 10, 1086, RX1 + 4, 1124); g.stroke();
    },
  });
  layer({
    id: 'rackLive', z: 54.7, wave: -1,
    hit: (x, y) => x > RX0 && x < RX1 + 10 && y > 930 && y < 1196,
    onEnter() { this.wave = 0; this.dir = P.vx >= 0 ? 1 : -1; },
    update(dt, t, L) {
      if (this.wave >= 0) {
        this.wave += dt;
        for (const p of greenware) {
          const order = this.dir > 0 ? (p.x - RX0) / (RX1 - RX0) : 1 - (p.x - RX0) / (RX1 - RX0);
          if (!p.hit && this.wave > order * 0.9 + p.shelf * 0.08) { p.hit = true; p.wob.v += this.dir * (6 + Math.random() * 4); }
        }
        if (this.wave > 2) { this.wave = -1; for (const p of greenware) p.hit = false; }
      }
      for (const p of greenware) K.springTo(p.wob, 0, dt);
    },
    draw(g) {
      for (const p of greenware) greenPot(g, p, 0, p.wob.x * 0.04);
    },
  });

  // ------------------------------------------------------------------ cooling bench
  const BX0 = 1150, BX1 = 1470, BY = 1086;
  const cooling = [
    { x: 1182, w: 18, h: 34, glaze: M.glazeTeal, shape: 'vase' }, { x: 1232, w: 26, h: 22, glaze: M.glazeHoney, shape: 'bowl' },
    { x: 1290, w: 22, h: 40, glaze: M.glazeOx, shape: 'jar' }, { x: 1346, w: 16, h: 30, glaze: M.glazeBlue, shape: 'vase' },
    { x: 1400, w: 24, h: 26, glaze: M.glazeCream, shape: 'jar' }, { x: 1444, w: 14, h: 18, glaze: M.glazeTeal, shape: 'cup' },
  ];
  function coolPath(p) {
    const { x, w, h } = p, y = BY;
    if (p.shape === 'bowl') return curve([[x - w, y - h], [x - w * 0.9, y - h * 0.4], [x - w * 0.5, y], [x + w * 0.5, y], [x + w * 0.9, y - h * 0.4], [x + w, y - h]]);
    if (p.shape === 'cup') return poly([[x - w * 0.8, y - h], [x + w * 0.8, y - h], [x + w * 0.65, y], [x - w * 0.65, y]]);
    if (p.shape === 'jar') return curve([[x - w * 0.55, y - h], [x - w, y - h * 0.6], [x - w * 0.8, y], [x + w * 0.8, y], [x + w, y - h * 0.6], [x + w * 0.55, y - h]]);
    return curve([[x - w * 0.4, y - h], [x - w * 0.3, y - h * 0.7], [x - w, y - h * 0.3], [x - w * 0.6, y], [x + w * 0.6, y], [x + w, y - h * 0.3], [x + w * 0.3, y - h * 0.7], [x + w * 0.4, y - h]]);
  }
  layer({
    id: 'bench', z: 54, still: true,
    draw(g) {
      // brick legs, a thick plank
      for (const x of [BX0 + 20, BX1 - 40]) {
        for (let k = 0; k < 4; k++) {
          const y = BY + 8 + k * 12, p = rect(x + (k % 2) * 3, y, 26, 11);
          g.fillStyle = K.litc(k % 2 ? M.brick : M.brick2, x, y, [0, 0, 1]); g.fill(p); g.lineWidth = 1.2; g.strokeStyle = K.inkAt(x, y, 0.5); g.stroke(p);
        }
      }
      g.fillStyle = 'rgba(8,4,10,0.5)'; g.fill(ell((BX0 + BX1) / 2, BY + 58, (BX1 - BX0) / 2 + 30, 9));
      plank(g, BX0, BX1, BY, 16);
      // scorch rings where hot pots have stood before
      g.lineWidth = 2; g.strokeStyle = 'rgba(30,14,10,0.5)';
      for (const x of [1210, 1320, 1376]) g.stroke(ell(x, BY - 8, 14, 3));
      // tongs leaning on the bench
      g.lineWidth = 2.2; g.strokeStyle = K.litc(M.iron, BX0, BY); g.beginPath(); g.moveTo(BX0 - 18, BY + 52); g.lineTo(BX0 + 4, BY - 30); g.moveTo(BX0 - 10, BY + 52); g.lineTo(BX0 + 6, BY - 30); g.stroke();
      // the pots: glaze lit by their own dull heat and the bench light
      for (const p of cooling) {
        const path = coolPath(p);
        const c = K.lit(p.glaze, p.x, BY - p.h / 2, [0, 0, 1]);
        g.fillStyle = 'rgba(8,4,10,0.5)'; g.fill(ell(p.x + 2, BY, p.w, 3));
        g.fillStyle = grad(g, p.x - p.w, 0, p.x + p.w, 0, [[0, K.css(K.mix(c, [0.9, 0.5, 0.3], 0.3))], [0.5, K.css(c)], [1, K.css(K.mul(c, 0.45))]]); g.fill(path);
        g.lineWidth = 1.8; g.strokeStyle = K.inkAt(p.x, BY, 0.6); g.stroke(path);
        // the rim, seen from above, its inside dark-red with residual heat
        const rw = p.shape === 'bowl' ? p.w : p.shape === 'cup' ? p.w * 0.8 : p.w * 0.5;
        const ry = K.rimRy(BY - p.h, rw) + 1;
        g.fillStyle = '#3a0e08'; g.fill(ell(p.x, BY - p.h, rw, ry)); g.lineWidth = 1.3; g.stroke(ell(p.x, BY - p.h, rw, ry));
        // a glossy highlight
        g.fillStyle = 'rgba(255,230,200,0.35)'; g.fill(ell(p.x - p.w * 0.45, BY - p.h * 0.55, p.w * 0.12, p.h * 0.18));
      }
    },
  });
  const crackles = cooling.map((p, i) => ({ p, lines: [], t: 0, seed: i }));
  layer({
    id: 'benchLive', z: 55,
    hit: (x, y) => x > BX0 && x < BX1 && y > BY - 50 && y < BY + 10,
    onEnter() { for (const c of crackles) { c.t = 0.01 + Math.random() * 0.6; c.lines = []; } },
    update(dt, t, L) {
      for (const c of crackles) {
        if (c.t > 0) {
          c.t += dt;
          if (c.t > 0.6 && c.lines.length < 6 && Math.random() < dt * 14) {
            const { x, w, h } = c.p, y0 = BY - h * (0.2 + Math.random() * 0.6), x0 = x + (Math.random() - 0.5) * w;
            const pts = [[x0, y0]]; for (let k = 0; k < 3; k++) pts.push([pts[k][0] + (Math.random() - 0.5) * 8, pts[k][1] + (Math.random() - 0.5) * 6]);
            c.lines.push({ pts, age: 0 });
          }
          if (c.t > 3.2) c.t = 0;
        }
        for (const l of c.lines) l.age += dt;
        c.lines = c.lines.filter((l) => l.age < 2.6);
      }
    },
    draw(g, t) {
      g.globalCompositeOperation = 'lighter';
      for (const p of cooling) {
        // residual heat: the pot walls glow faintly from within, breathing
        const hot = 0.3 + 0.08 * Math.sin(t * 0.8 + p.x);
        K.glow(g, p.x, BY - p.h * 0.5, p.w * 1.4, '#ff3a10', hot * 0.22, 1.1);
      }
      for (const c of crackles) for (const l of c.lines) {
        const a = clamp(1 - l.age / 2.6, 0, 1);
        g.lineWidth = 0.8; g.strokeStyle = `rgba(255,220,170,${0.8 * a})`;
        g.beginPath(); l.pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
        if (l.age < 0.25) K.glow(g, l.pts[0][0], l.pts[0][1], 8, '#fff0c0', (1 - l.age / 0.25) * 0.8);
      }
      g.globalCompositeOperation = 'source-over';
      // heat shimmer: faint wavering wisps above the pots
      for (const p of cooling) {
        for (let k = 0; k < 2; k++) {
          const ph = t * 1.4 + p.x * 0.07 + k * 2;
          const u = (ph % 2) / 2, y = BY - p.h - 6 - u * 40;
          g.lineWidth = 1.2; g.strokeStyle = `rgba(255,170,120,${0.12 * Math.sin(u * Math.PI)})`;
          g.beginPath(); g.moveTo(p.x - 4, y); g.bezierCurveTo(p.x + 4 * Math.sin(ph * 3), y - 6, p.x - 4 * Math.sin(ph * 3), y - 10, p.x + 2, y - 16); g.stroke();
        }
      }
    },
  });

  // ------------------------------------------------------------------ the sleeper
  const zs = [];
  layer({
    id: 'sleeper', z: 56, roll: 0,
    hit: (x, y) => x > 1468 && x < 1548 && y > 1080 && y < 1150,
    update(dt, t, L) {
      this.roll = ease(this.roll, L.hovered ? 1 : 0, 2, dt);
      if (Math.random() < dt * (L.hovered ? 1.6 : 0.35)) zs.push({ x: 1516, y: 1092, age: 0, s: 0.6 + Math.random() * 0.4 });
      for (const z of zs) { z.age += dt; z.y -= dt * 14; z.x += Math.sin(z.age * 2) * dt * 8; }
      while (zs.length && zs[0].age > 3) zs.shift();
    },
    draw(g, t, L) {
      // slumped back against the warm brick leg of the bench, hands folded, a cloth over its knees
      const br = Math.sin(t * 1.3) * 0.5 + 0.5, roll = K.smooth(this.roll);
      const scratch = L.hovered && L.since > 1.8 ? K.bell(Math.min(1, (L.since - 1.8) / 1.4)) : 0;
      K.mole(g, 1500, 1146, 1.15, {
        lean: -0.32 - roll * 0.12, sleep: true, smile: 1 + roll * 1.4, breathe: br,
        hands: scratch > 0.1 ? { f: [20, -32 + Math.sin(t * 16) * 1.5], b: [-2, -12] } : { f: [8, -13], b: [-2, -12] },
        snout: scratch * Math.sin(t * 16) * 0.8, scarf: '#6a4a6a', lx: 1480, ly: 1110,
      });
      const cl = curve([[1484, 1146], [1490, 1126], [1508, 1120], [1524, 1128], [1530, 1146]]);
      g.fillStyle = K.litc(M.clothRed, 1500, 1134, [-0.4, -0.3, 0.9]); g.fill(cl); g.lineWidth = 1.5; g.strokeStyle = K.inkAt(1500, 1140, 0.6); g.stroke(cl);
      g.lineWidth = 0.8; g.beginPath(); g.moveTo(1500, 1124); g.lineTo(1496, 1144); g.moveTo(1514, 1124); g.lineTo(1516, 1144); g.stroke();
      for (const z of zs) {
        const a = Math.min(1, z.age * 2) * (1 - z.age / 3);
        g.font = `italic ${10 * z.s + z.age * 3}px Georgia, serif`;
        g.fillStyle = `rgba(255,220,180,${0.7 * a})`; g.fillText('z', z.x, z.y);
      }
    },
  });

  // ------------------------------------------------------------------ the watchers
  // a mole and its pup up late at the foot of the path, watching the firing: the nearest figures
  // in the picture, dark against the glow with the kiln's light on their rims.
  // Hover: the pup hops and points, the parent lifts its mug; linger and it puts an arm round the pup
  const blinkA = Drawn.blinker(2.5, 4), blinkB = Drawn.blinker(1.6, 3);
  const mugSteam = [];
  layer({
    id: 'watchers', z: 64, hop: 0,
    hit: (x, y) => x > 770 && x < 950 && y > 1060 && y < 1176,
    onEnter() { this.hop = 1; },
    update(dt, t, L) {
      this.hop = Math.max(0, this.hop - dt * 1.4);
      if (Math.random() < dt * 3) mugSteam.push({ x: 0, y: 0, age: 0, sd: Math.random() * 9 });
      for (const m of mugSteam) m.age += dt;
      while (mugSteam.length && mugSteam[0].age > 2) mugSteam.shift();
    },
    draw(g, t, L) {
      g.fillStyle = 'rgba(8,4,10,0.45)'; g.fill(ell(860, 1174, 90, 8));
      const hug = L.hovered && L.since > 1.4 ? K.smooth((L.since - 1.4) / 0.6) : 0;
      const hopY = -Math.abs(Math.sin(this.hop * Math.PI * 3)) * 10 * this.hop;
      const sip = L.hovered ? K.smooth(Math.min(1, L.since / 0.5)) * (1 - hug) : 0;
      const br = Math.sin(t * 1.6) * 0.5 + 0.5;
      // the parent, mug in hand
      const ph = K.mole(g, 910, 1172, 2.1, {
        flip: true, apron: '#5a4a3a', scarf: '#5a6a8a', open: blinkA(t), look: [0.6, -0.6], breathe: br, smile: 1,
        hands: hug > 0 ? { f: [26 - hug * 4, -30 + hug * 4], b: [6, -18] } : { f: [14, -22 - sip * 10], b: [-8, -16] },
        lean: -0.04 * hug, lx: 890, ly: 1120,
      });
      if (!hug) {
        const [mx, my] = ph.f;
        const mug = K.rrect(mx - 9, my - 16, 14, 16, 3);
        g.fillStyle = K.litc(M.glazeTeal, mx - 4, my - 8, [-0.6, -0.3, 0.7]); g.fill(mug); g.lineWidth = 1.8; g.strokeStyle = K.inkAt(mx, my, 0.6); g.stroke(mug);
        g.beginPath(); g.arc(mx + 6, my - 8, 4, -Math.PI / 2, Math.PI / 2); g.stroke();
        for (const m of mugSteam) {
          const u = m.age / 2;
          g.strokeStyle = `rgba(200,190,190,${0.3 * (1 - u)})`; g.lineWidth = 1.2;
          g.beginPath(); g.moveTo(mx - 2, my - 18 - u * 26); g.quadraticCurveTo(mx + 4 * Math.sin(m.sd + u * 6), my - 24 - u * 30, mx - 2, my - 30 - u * 34); g.stroke();
        }
      }
      // the pup, pointing at the fire
      const point = 0.5 + 0.5 * Math.max(this.hop, Math.sin(t * 0.4) > 0.7 ? 1 : 0);
      K.mole(g, 806, 1172 + hopY, 1.35, {
        flip: true, scarf: '#a84438', open: blinkB(t), look: [0.6, -1], breathe: br, smile: 1.8, mouth: this.hop > 0.2 ? 0.5 : 0,
        hands: { f: [22, -42 - point * 10], b: [-10, -16] }, lx: 806, ly: 1130,
      });
    },
  });

  // ------------------------------------------------------------------ lantern post + chime
  const PX = 846, PB = 1078, PT = 960;
  const lamp = K.pendulum({ len: 26, seed: 3, x: PX + 30, lean: 0.06, sway: 0.04, damp: 0.9 });
  const lanternHoles = [];
  for (let k = 0; k < 3; k++) for (let i = 0; i < 6; i++) lanternHoles.push([(i / 5 - 0.5) * 12 * (1 - Math.abs(k - 1) * 0.25), 8 + k * 7, k === 1 ? 'star' : 'dot']);
  layer({
    id: 'post', z: 57,
    hit: (x, y) => Math.hypot(x - (PX + 34), y - (PT + 40)) < 26,
    onEnter() { K.kick(lamp, (P.vx >= 0 ? -1 : 1) * 2.4); },
    update(dt, t, L) { K.swing(lamp, dt, t, L); },
    draw(g, t, L) {
      // post and arm
      g.fillStyle = 'rgba(8,4,10,0.5)'; g.fill(ell(PX, PB + 2, 14, 3));
      Drawn.tube(g, Drawn.seg(PX, PB, PX - 2, PT), K.litc(M.wood, PX, 1000, [0.4, 0, 0.9]), 6, 1.6);
      Drawn.tube(g, Drawn.seg(PX - 4, PT + 6, PX + 40, PT + 4), K.litc(M.wood, PX + 20, PT), 4.5, 1.4);
      Drawn.tube(g, Drawn.seg(PX, PT + 24, PX + 18, PT + 6), K.litc(M.wood, PX + 10, PT + 14), 3, 1.2);
      // the lantern on its hook
      const hx = PX + 34, hy = PT + 6;
      const a = lamp.a, bx = hx + Math.sin(a) * 26, by = hy + Math.cos(a) * 26;
      g.lineWidth = 1; g.strokeStyle = '#2a2024'; g.beginPath(); g.moveTo(hx, hy); g.lineTo(bx, by); g.stroke();
      g.save(); g.translate(bx, by); g.rotate(-a);
      const body = curve([[-4, 0], [-11, 8], [-13, 18], [-10, 28], [10, 28], [13, 18], [11, 8], [4, 0]]);
      g.fillStyle = K.litc(M.clayDark, PX, PT + 40, [0, 0, 1], 0.3); g.fill(body);
      const f = 0.85 + 0.15 * noise(t * 6) + L.hover * 0.1;
      for (const [hx2, hy2, sh] of lanternHoles) {
        g.fillStyle = K.css(K.fireAt(0.78 * f));
        if (sh === 'star') { g.save(); g.translate(hx2, hy2); g.rotate(0.3); g.fillRect(-1.6, -1.6, 3.2, 3.2); g.restore(); }
        else g.fill(circ(hx2, hy2, 1.3));
      }
      g.lineWidth = 1.6; g.strokeStyle = K.LINE; g.stroke(body);
      g.fillStyle = K.litc(M.clay, PX, PT + 30); g.fill(ell(0, 0, 5, 2)); g.stroke(ell(0, 0, 5, 2));
      g.restore();
      // its ring of dots on the ground, swaying with the lantern
      g.globalCompositeOperation = 'lighter';
      K.glow(g, bx, by + 16, 40, '#ffb060', 0.45 * f);
      for (let i = 0; i < 16; i++) {
        const ang = (i / 16) * TAU + a * 3, s = Math.sin(ang);
        const R = 54 + (i % 2) * 18, x = bx + Math.cos(ang) * R * 1.3 + Math.sin(a) * 40, y = PB + 6 + s * 10 + (i % 2) * 4;
        K.glow(g, x, y, 9, '#ffb868', 0.32 * f * (0.5 + 0.5 * s + 0.2), 0.4);
      }
      g.globalCompositeOperation = 'source-over';
    },
  });
  const sherds = [0, 1, 2, 3].map((i) => ({ p: K.pendulum({ len: 14 + i * 5, seed: i + 7, x: PX, lean: 0.05, sway: 0.06, damp: 1.4 }), spin: 0, vs: 0, col: [M.glazeTeal, M.glazeHoney, M.glazeCream, M.glazeBlue][i] }));
  layer({
    id: 'chime', z: 58,
    hit: (x, y) => x > PX - 6 && x < PX + 22 && y > PT + 4 && y < PT + 52,
    onEnter() { for (const s of sherds) { K.kick(s.p, (P.vx >= 0 ? 1 : -1) * (3 + Math.random() * 2)); s.vs += 6 + Math.random() * 6; } this.clack = 0.6; },
    update(dt, t, L) { for (const s of sherds) { K.swing(s.p, dt, t, L); s.spin += s.vs * dt; s.vs *= Math.exp(-dt * 2); } this.clack = Math.max(0, (this.clack || 0) - dt); },
    draw(g, t) {
      sherds.forEach((s, i) => {
        const hx = PX + 2 + i * 5, hy = PT + 9 - i * 0.2;
        const x = hx + Math.sin(s.p.a) * s.p.len, y = hy + Math.cos(s.p.a) * s.p.len;
        g.lineWidth = 0.6; g.strokeStyle = '#6a5a4a'; g.beginPath(); g.moveTo(hx, hy); g.lineTo(x, y); g.stroke();
        const sq = Math.cos(s.spin);
        g.save(); g.translate(x, y + 4); g.scale(Math.abs(sq) * 0.8 + 0.2, 1);
        const p = poly([[-4, -4], [3, -5], [5, 1], [1, 6], [-5, 3]]);
        g.fillStyle = K.litc(s.col, PX, PT + 20, [0, 0, 1], 0.3); g.fill(p);
        g.lineWidth = 1; g.strokeStyle = K.LINE; g.stroke(p);
        if (sq > 0.6) { g.fillStyle = 'rgba(255,230,190,0.5)'; g.fillRect(-2, -3, 2, 2); }
        g.restore();
      });
      if (this.clack > 0) {
        g.globalCompositeOperation = 'lighter';
        K.glow(g, PX + 10, PT + 28, 14, '#fff0d0', this.clack);
        g.globalCompositeOperation = 'source-over';
      }
    },
  });

  // ------------------------------------------------------------------ the carrier on the ladder
  const blinkC = Drawn.blinker(2, 4);
  const stack = K.spring({ k: 60, d: 4 });
  layer({
    id: 'carrier', z: 19, u: 0.35,
    hit(x, y) { const [mx, my] = this.pos || [0, 0]; return Math.abs(x - mx) < 22 && y > my - 70 && y < my + 4; },
    onEnter() { stack.v += 3; },
    update(dt, t, L) {
      // climbs slowly, pausing on each rung; at the top it vanishes, then starts again from the yard
      if (!L.hovered) this.u += dt * 0.018 * (0.4 + 0.6 * Math.max(0, Math.sin(t * 2.2)));
      if (this.u > 1.08) this.u = 0;
      K.springTo(stack, 0, dt);
      const u = clamp(this.u, 0, 1);
      this.pos = [lerp(352, 330, u) + 2, lerp(866, 606, u)];
    },
    draw(g, t, L) {
      const u = this.u; if (u > 1) return;
      const [x, y] = this.pos;
      const step = Math.sin(t * 4.4) * (L.hovered ? 0 : 1);
      const steady = L.hovered ? K.smooth(L.since / 0.3) : 0;
      K.mole(g, x, y, 0.8, { flip: true, hands: { f: [6, -28 + step * 3 - steady * 26], b: [-8, -26 - step * 3] }, open: blinkC(t), look: [0.4, -1], apron: M.clothGreen, lean: -0.05, lx: x, ly: y - 20 });
      // the stack of greenware on its head: three bowls, nested
      g.save(); g.translate(x - 4, y - 34); g.rotate(stack.x * 0.1);
      for (let i = 0; i < 3; i++) {
        g.save(); g.translate(0, -i * 6); g.rotate(stack.x * 0.06 * i);
        const p = curve([[-11, -6], [-10, -2], [-6, 0], [6, 0], [10, -2], [11, -6]]);
        g.fillStyle = K.litc(M.clayPale, x, y - 40); g.fill(p); g.lineWidth = 1.1; g.strokeStyle = K.LINE; g.stroke(p);
        g.restore();
      }
      g.restore();
    },
  });

  // ------------------------------------------------------------------ moths
  // each moth circles a lamp; a still pointer nearby draws them, a fast one scatters them
  const homes = [[PX + 34, PT + 50, 30], [1120, 828, 34], [128, 400, 30], [884, 812, 26], [1352, 880, 26], [298, 540, 34], [560, 790, 50]];
  const moths = [];
  { const r = rng(91); for (const [x, y, R] of homes) for (let i = 0; i < 3; i++) moths.push({ hx: x, hy: y, R: R * (0.6 + r() * 0.8), ph: r() * TAU, sp: 1.4 + r() * 1.6, x, y, flap: r() * TAU, pull: 0, s: 0.7 + r() * 0.5 }); }
  layer({
    id: 'moths', z: 62,
    update(dt, t) {
      for (const m of moths) {
        m.ph += dt * m.sp; m.flap += dt * 38;
        let tx = m.hx + Math.cos(m.ph) * m.R + noise(m.ph * 2 + m.hx) * 8, ty = m.hy + Math.sin(m.ph * 1.3) * m.R * 0.5 + noise(m.ph * 1.7 + m.hy) * 8;
        const d = Math.hypot(P.x - m.x, P.y - m.y);
        // drawn to a lingering pointer, scared by a quick one
        if (P.inside && d < 160) {
          if (P.sp < 120) m.pull = ease(m.pull, 1, 0.6, dt); else m.pull = ease(m.pull, -1.2, 6, dt);
        } else m.pull = ease(m.pull, 0, 1, dt);
        if (m.pull > 0) { tx = lerp(tx, P.x + Math.cos(m.ph * 2) * 14, m.pull * 0.8); ty = lerp(ty, P.y + Math.sin(m.ph * 2.6) * 10, m.pull * 0.8); }
        else if (m.pull < 0 && d > 1) { tx += ((m.x - P.x) / d) * 60 * -m.pull; ty += ((m.y - P.y) / d) * 60 * -m.pull; }
        m.x = ease(m.x, tx, 4, dt); m.y = ease(m.y, ty, 4, dt);
      }
    },
    draw(g) {
      for (const m of moths) {
        const f = Math.abs(Math.sin(m.flap)), I = clamp(K.glowAt(m.x, m.y) * 1.4, 0.15, 1);
        g.fillStyle = K.css(K.mix([0.25, 0.2, 0.22], [1, 0.9, 0.72], I), 0.95);
        const s = m.s;
        g.fill(ell(m.x - 2.6 * s * f, m.y, 2.8 * s * f + 0.4, 1.9 * s, undefined, -0.4));
        g.fill(ell(m.x + 2.6 * s * f, m.y, 2.8 * s * f + 0.4, 1.9 * s, undefined, 0.4));
        g.fillStyle = 'rgba(30,20,20,0.8)'; g.fillRect(m.x - 0.5, m.y - 1.2, 1, 2.6);
      }
    },
  });
})();
