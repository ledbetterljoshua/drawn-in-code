/* sky.js — the dark above Kilnhill: no moon, no stars, only the kiln's smoke, lit from underneath.
   z 0   sky: near-black, warming faintly toward the horizon haze where far kiln towns burn
   z 2   canopy (still): the smoke the kiln has been making for three nights, a ceiling lit by the town
   z 4   far hills: the other kiln towns on the horizon. Hover: they flash back, like answering a signal
   z 6   bats: flit through the lit smoke. Hover: the nearest swerves away and the others follow
   z 60  plume (live, drawn over the kiln top): new smoke rolling off the chimney, sparks rising. */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, wind, circ, ell, poly, curve, grad, radial, st, P, layer } = Drawn;
  const K = window.Kiln;
  const view = () => st.view;

  // ------------------------------------------------------------------ sky
  layer({
    id: 'sky', z: 0, still: true,
    draw(g) {
      const v = view();
      g.fillStyle = grad(g, 0, Math.min(v.y0, -200), 0, 900, [[0, '#04050c'], [0.5, '#080a18'], [0.85, '#0f1226'], [1, '#161830']]);
      g.fillRect(v.x0 - 10, v.y0 - 10, v.x1 - v.x0 + 20, v.y1 - v.y0 + 20);
      // haze at the horizon, warm where the far kiln towns are
      for (const [x, r, a] of [[1240, 360, 0.08], [1660, 280, 0.06]]) {
        g.fillStyle = radial(g, x, 812, 0, r, [[0, `rgba(130,60,50,${a})`], [0.5, `rgba(70,36,50,${a * 0.4})`], [1, 'rgba(40,24,50,0)']]);
        g.fillRect(x - r, 812 - r, r * 2, r * 2);
      }
      // the whole town lights the air above it a little
      g.fillStyle = radial(g, 600, 820, 0, 620, [[0, 'rgba(110,44,24,0.2)'], [0.45, 'rgba(60,26,30,0.08)'], [1, 'rgba(30,20,40,0)']]);
      g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    },
  });

  // ------------------------------------------------------------------ smoke canopy
  // Smoke is shaded as one mass (never circle by circle, which reads as scales): a dark top, a
  // middle band, and an underside that catches the fire. Colours come from radial gradients
  // centred on the chimney, so the plume warms smoothly toward its source.
  const CH = [560, 214];
  function smokeMass(g, circles, o = {}) {
    const warm = o.warm == null ? 1 : o.warm, reach = o.reach || 760;
    const U = new Path2D(), Mid = new Path2D(), Low = new Path2D();
    for (const [x, y, r] of circles) { circ(x, y, r, U); circ(x + r * 0.04, y + r * 0.26, r * 0.9, Mid); circ(x + r * 0.06, y + r * 0.52, r * 0.62, Low); }
    const rg = (list) => radial(g, CH[0], CH[1], 0, reach, list);
    g.fillStyle = rg([[0, K.mixc('#141218', '#3a1a16', 0.7 * warm)], [0.45, '#0e0e1c'], [1, '#0a0b18']]); g.fill(U);
    g.save(); g.clip(U);
    g.fillStyle = rg([[0, K.mixc('#1a1418', '#6a2c18', 0.8 * warm)], [0.3, K.mixc('#14131e', '#3a1c1a', 0.5 * warm)], [0.7, '#10101e'], [1, '#0d0e1a']]); g.fill(Mid);
    g.fillStyle = rg([[0, K.mixc('#2a1a1a', '#b04c1e', 0.85 * warm, 0.95)], [0.22, K.mixc('#1a1418', '#5a2618', 0.7 * warm, 0.7)], [0.55, 'rgba(26,24,40,0.35)'], [1, 'rgba(26,24,40,0.15)']]); g.fill(Low);
    // rolling volume: a few curling lit edges inside the mass
    if (o.curls) for (const [x, y, r] of o.curls) {
      const d = Math.hypot(x - CH[0], y - CH[1]), k = clamp(1 - d / reach, 0, 1);
      g.lineWidth = 1.6 + r * 0.02; g.strokeStyle = K.mixc('#1a1a2a', '#c0582a', k * k * warm, 0.18 + 0.4 * k);
      g.beginPath(); g.arc(x, y, r, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    }
    g.restore();
  }
  // the plume: up off the lip, leaning right with the breeze, flattening into a long drift
  const spine = [[560, 196], [550, 150], [566, 96], [612, 50], [690, 18], [800, 0], [940, -6], [1100, 4], [1280, 22], [1480, 40], [1720, 52], [2000, 60], [2300, 64]];
  const plumeBanks = [];
  {
    const r = rng(77);
    for (let i = 0; i < spine.length - 1; i++) {
      const [x0, y0] = spine[i], [x1, y1] = spine[i + 1], bank = [];
      const s = 26 + Math.pow(i, 1.25) * 12;
      for (let k = 0; k < 7; k++) {
        const u = k / 7, x = lerp(x0, x1, u), y = lerp(y0, y1, u);
        bank.push([x + (r() - 0.5) * s * 0.8, y + (r() - 0.6) * s * 0.7, s * (0.75 + r() * 0.5)]);
        if (i > 3 && r() < 0.6) bank.push([x + (r() - 0.5) * s, y - s * (0.5 + r() * 0.4), s * (0.5 + r() * 0.4)]);
      }
      plumeBanks.push(bank);
    }
  }
  // the old smoke ceiling above, from three nights of firing: seen mostly on a tall phone screen
  const ceiling = [];
  { const r = rng(78); for (let i = 0; i < 46; i++) ceiling.push([-600 + r() * 2900, -760 + r() * 560, 110 + r() * 150]); }
  layer({
    id: 'canopy', z: 2, still: true,
    draw(g) {
      smokeMass(g, ceiling, { warm: 0.3, reach: 1200 });
      // far end first, so nearer banks overlap it
      for (let i = plumeBanks.length - 1; i >= 0; i--) smokeMass(g, plumeBanks[i], { warm: 1, reach: 620, curls: plumeBanks[i].filter((c, k) => k % 3 === 1).map(([x, y, r]) => [x, y - r * 0.2, r * 0.55]) });
    },
  });

  // ------------------------------------------------------------------ far hills
  // other kiln towns on the horizon, too far for detail: a bottle silhouette, a few lit windows
  const towns = [
    { x: 1010, y: 800, s: 0.5, seed: 1 }, { x: 1235, y: 790, s: 0.7, seed: 2 }, { x: 1520, y: 788, s: 0.55, seed: 3 },
    { x: 1760, y: 800, s: 0.45, seed: 4 }, { x: 1890, y: 806, s: 0.35, seed: 5 },
  ];
  const farPath = curve([[760, 900], [760, 826], [880, 812], [1000, 800], [1120, 806], [1240, 786], [1380, 800], [1520, 784], [1660, 804], [1780, 796], [1900, 810], [2200, 820], [2200, 900]]);
  const far = layer({
    id: 'far', z: 4, flash: 0, flashT: 0,
    hit: (x, y) => x > 900 && y > 740 && y < 830 && x < 2000,
    onEnter() { this.flashT = 0; this.flash = 1; },
    update(dt, t, L) {
      if (L.hovered && L.since > 2.5) { L.flashT = 0; L.since = 0; L.flash = 1; }
      L.flashT += dt;
    },
    draw(g, t, L) {
      // the warm haze the far towns raise behind their hills, then the hills dark against it
      g.fillStyle = grad(g, 0, 750, 0, 820, [[0, 'rgba(50,30,50,0)'], [0.75, 'rgba(70,40,60,0.3)'], [1, 'rgba(90,50,60,0.4)']]);
      g.fillRect(760, 730, 1500, 90);
      g.fillStyle = '#0a080e'; g.fill(farPath);
      g.lineWidth = 1.2; g.strokeStyle = 'rgba(120,70,90,0.35)'; g.stroke(curve([[880, 812], [1000, 800], [1120, 806], [1240, 786], [1380, 800], [1520, 784], [1660, 804], [1780, 796], [1900, 810], [2200, 820]], false));
      g.globalCompositeOperation = 'lighter';
      for (const T of towns) {
        const r = rng(T.seed * 31);
        // each town answers a beat after the last, nearest first
        const lag = (T.x - 900) / 900;
        const f = K.bell((L.flashT - lag * 0.8) / 0.7) * L.flash + K.bell((K.fire.saltT - lag * 0.9 - 0.4) / 0.8) * 0.9;
        const fl = 0.8 + 0.2 * noise(t * 2 + T.seed * 7);
        K.glow(g, T.x, T.y - 22 * T.s, 60 * T.s, '#ff7a30', 0.32 * fl + f * 0.7);
        if (f > 0.02) K.glow(g, T.x, T.y - 30 * T.s, 110 * T.s, '#7affc8', f * 0.35);
        for (let i = 0; i < 11; i++) {
          const wx = T.x + (r() - 0.5) * 150 * T.s, wy = T.y + 2 + r() * 14 * T.s;
          const blink = noise(t * 0.3 + i * 3.1 + T.seed) > 0.75 ? 0.3 : 1;
          g.fillStyle = `rgba(255,${170 + r() * 50 | 0},90,${(0.55 + f * 0.4) * blink})`;
          g.fillRect(wx, wy, 1.8, 1.8);
        }
      }
      g.globalCompositeOperation = 'source-over';
      // the bottle silhouettes sit on top of their own glow
      for (const T of towns) {
        const s = T.s, x = T.x, y = T.y;
        g.fillStyle = '#0c0910';
        g.fill(poly([[x - 16 * s, y + 2], [x - 15 * s, y - 20 * s], [x - 6 * s, y - 40 * s], [x - 5 * s, y - 50 * s], [x + 5 * s, y - 50 * s], [x + 6 * s, y - 40 * s], [x + 15 * s, y - 20 * s], [x + 16 * s, y + 2]]));
      }
      g.globalCompositeOperation = 'lighter';
      for (const T of towns) {
        const fl = 0.7 + 0.3 * noise(t * 3 + T.seed * 3);
        K.glow(g, T.x, T.y - 52 * T.s, 14 * T.s, '#ffb050', 0.8 * fl);
      }
      g.globalCompositeOperation = 'source-over';
    },
  });

  // ------------------------------------------------------------------ plume: live smoke + sparks
  const puffs = [], sparks = [];
  let puffClock = 0, sparkClock = 0;
  const plume = layer({
    id: 'plume', z: 60,
    hit: (x, y) => Math.abs(x - (560 + Math.max(0, 200 - y) * 0.25)) < 70 + Math.max(0, 200 - y) * 0.3 && y < 210 && y > -260,
    onEnter() { for (let i = 0; i < 26; i++) spark(1.6); },
    update(dt, t, L) {
      const w = wind(t, 560);
      const salt = K.fire.salt;
      puffClock -= dt;
      if (puffClock <= 0) {
        puffClock = 0.22 - salt * 0.12;
        puffs.push({ x: 560 + (Math.random() - 0.5) * 30, y: 222, r: 16 + Math.random() * 8, age: 0, life: 9 + Math.random() * 4, sd: Math.random() * 100, white: salt });
      }
      sparkClock -= dt;
      if (sparkClock <= 0) { sparkClock = 0.08 + Math.random() * 0.25; spark(1); }
      if (L.hovered && Math.random() < dt * 14) spark(1.3);
      for (const p of puffs) {
        p.age += dt;
        const u = p.age / p.life;
        p.vy = -46 * (1 - u * 0.6) - p.white * 30;
        p.vx = 10 + w * 26 * Math.min(1, p.age / 2.5) + noise(p.sd + t * 0.4) * 8;
        // the pointer parts the smoke
        const dx = p.x - P.x, dy = p.y - P.y, d = Math.hypot(dx, dy);
        if (d < p.r + 60 && P.inside) { p.x += (dx / d) * 40 * dt; p.y += (dy / d) * 30 * dt; }
        p.x += p.vx * dt; p.y += p.vy * dt;
        p.r += dt * (8 + u * 6);
      }
      while (puffs.length && puffs[0].age > puffs[0].life) puffs.shift();
      for (const s of sparks) {
        s.age += dt;
        s.vx += (w * 30 - s.vx * 0.3 + noise(s.sd + t * 2) * 60) * dt;
        s.vy += (-20 - s.vy * 0.2) * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
      }
      for (let i = sparks.length - 1; i >= 0; i--) if (sparks[i].age > sparks[i].life) sparks.splice(i, 1);
    },
    draw(g, t) {
      for (const p of puffs) {
        const u = p.age / p.life;
        const a = Math.min(1, p.age / 0.6) * (1 - u) * (1 - u);
        const i = clamp(K.glowAt(p.x, p.y + p.r * 0.6) * 1.1, 0, 1.2);
        const base = K.mix('#120e15', '#2e1816', clamp(i * 0.6, 0, 1));
        const wb = K.mix(base, '#c8d0cc', p.white * (1 - u) * 0.75);
        g.fillStyle = K.css(wb, a * 0.42);
        g.fill(circ(p.x, p.y, p.r));
        // the underside catches the flame for the first few seconds
        const hot = clamp(i * 0.4, 0, 0.4) * Math.max(0, 1 - p.age / 3);
        if (hot > 0.02) { g.fillStyle = K.css(K.mix(wb, '#a84a26', hot), a * 0.3); g.fill(circ(p.x + p.r * 0.05, p.y + p.r * 0.38, p.r * 0.62)); }
      }
      g.globalCompositeOperation = 'lighter';
      for (const s of sparks) {
        const u = s.age / s.life;
        const tw = 0.6 + 0.4 * Math.sin(t * 30 + s.sd * 9);
        const c = K.fireAt(0.95 - u * 0.5);
        g.fillStyle = K.css(c, (1 - u) * tw);
        g.fillRect(s.x - s.size / 2, s.y - s.size / 2, s.size, s.size);
        K.glow(g, s.x, s.y, 7 * s.size, '#ff8030', (1 - u) * 0.3 * tw);
      }
      g.globalCompositeOperation = 'source-over';
    },
  });
  function spark(power = 1) {
    sparks.push({ x: 560 + (Math.random() - 0.5) * 70, y: 224, vx: (Math.random() - 0.5) * 50, vy: -(60 + Math.random() * 120) * power, age: 0, life: 1.6 + Math.random() * 2.4 * power, size: 1.6 + Math.random() * 1.8, sd: Math.random() * 100 });
  }
  K.spark = spark;
  K.on('salt', () => { for (let i = 0; i < 30; i++) spark(1.8); });

  // ------------------------------------------------------------------ bats
  const bats = [];
  { const r = rng(5); for (let i = 0; i < 5; i++) bats.push({ cx: 760 + r() * 700, cy: 120 + r() * 260, rx: 120 + r() * 160, ry: 40 + r() * 60, sp: 0.18 + r() * 0.16, ph: r() * TAU, x: 0, y: 0, vx: 0, vy: 0, flap: r() * TAU, fear: 0, fx: 0, fy: 0, s: 0.8 + r() * 0.5 }); }
  const batLayer = layer({
    id: 'bats', z: 6,
    hit(x, y) { return bats.some((b) => Math.hypot(b.x - x, b.y - y) < 34); },
    onEnter() {
      for (const b of bats) { const d = Math.hypot(b.x - P.x, b.y - P.y); b.fear = clamp(1.4 - d / 400, 0.3, 1); b.fx = Math.sign(b.x - P.x || 1); b.fy = -1; }
    },
    update(dt, t) {
      for (const b of bats) {
        b.ph += dt * b.sp * (1 + b.fear * 1.5);
        const tx = b.cx + Math.cos(b.ph) * b.rx + noise(b.ph * 3 + b.cx) * 40 + b.fx * b.fear * 260;
        const ty = b.cy + Math.sin(b.ph * 2) * b.ry + noise(b.ph * 2.3 + b.cy) * 30 + b.fy * b.fear * 120;
        const nx = ease(b.x || tx, tx, 3, dt), ny = ease(b.y || ty, ty, 3, dt);
        b.vx = (nx - b.x) / dt; b.vy = (ny - b.y) / dt; b.x = nx; b.y = ny;
        b.fear = ease(b.fear, 0, 0.5, dt);
        b.flap += dt * (11 + b.fear * 10);
      }
    },
    draw(g, t) {
      for (const b of bats) drawBat(g, b, t);
    },
  });
  function drawBat(g, b, t) {
    const f = Math.sin(b.flap), s = b.s;
    const dir = b.vx >= 0 ? 1 : -1;
    const i = clamp(K.glowAt(b.x, b.y + 60) * 1.6, 0, 1);
    g.save(); g.translate(b.x, b.y); g.scale(s * dir, s);
    g.rotate(clamp(b.vy * 0.002, -0.4, 0.4));
    const wy = -f * 9, tip = 4 - f * 12;
    const wing = (k) => {
      const p = new Path2D();
      p.moveTo(0, -1);
      p.quadraticCurveTo(k * 7, wy - 6, k * 16, tip - 2);
      p.lineTo(k * 13, tip + 3); p.quadraticCurveTo(k * 11, wy + 2, k * 8, wy + 4);
      p.quadraticCurveTo(k * 6, 2, k * 3, 1.5); p.closePath();
      return p;
    };
    g.fillStyle = '#0a070c';
    g.fill(wing(1)); g.fill(wing(-1));
    g.fill(ell(0, 0.5, 3.2, 4));
    g.fill(poly([[-2.4, -2.4], [-1.6, -6], [-0.6, -2.8]])); g.fill(poly([[2.4, -2.4], [1.6, -6], [0.6, -2.8]]));
    // the fire catches the undersides
    if (i > 0.05) {
      g.strokeStyle = K.css(K.mix('#3a1a12', '#ff8a3a', i), 0.8); g.lineWidth = 0.9;
      g.beginPath(); g.moveTo(-14, tip + 3); g.quadraticCurveTo(-6, wy + 4, 0, 4); g.quadraticCurveTo(6, wy + 4, 14, tip + 3); g.stroke();
    }
    g.restore();
  }
})();
