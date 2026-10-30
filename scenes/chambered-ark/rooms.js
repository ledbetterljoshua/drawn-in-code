/* rooms.js — the crew's rooms in the big outer chambers, and the kit every room is built with.

   A room is a chamber of the spiral with a level floor laid across it (the crew can't live on a
   curve), its fixed furniture painted into the shell's back sprite, and a layer of its own for
   everyone who moves. Floors below eye level show their tops, floors above it their undersides.
   Each room is lit from inside by a jar of glowing jellies; the shell's cut face is drawn over all
   of it, so the crew are always seen through the cut.

     0 wheelhouse   the hermit-crab captain at the wheel; hover: spins it and the ark leans;
                    linger: calls down the speaking tube, a bubble runs to the nautilus, she blinks
     1 galley       the octopus cook stirs; hover: juggles pans; linger: flips a sand-dollar pancake
     2 pump room    a shrimp in a treadwheel works the buoyancy pump; hover: runs, the gauge climbs
                    and the whole ark rises; linger: the engineer pulls the whistle
     3 observatory  a goby at a telescope through the roof; hover: swings it to follow the pointer;
                    linger: sees something and jumps
     4 library      the snail librarian reads; hover: turns a page and looks up; linger: a bookworm
     5 garden       a nudibranch tends anemones; hover: they open and wave, she waters with bubbles;
                    linger: a tiny shrimp peeks out of one
     6 bunk room    three seahorses asleep on a perch; hover: one wakes, yawns and looks at you
     7 band room    a pufferfish and a crab drummer; hover: they play; linger: the long note puffs him up
     8 lamp room    jars of glowing jellies; hover: they pulse and swim; a shrimp keeper feeds them

   rooms z40–49, between the shell's back (z30) and its cut face (z55). */
(() => {
const { TAU, lerp, clamp, rng, noise, circ, ell, curve, poly, grad, radial, P, layer, wind } = Drawn;
const A = window.ARK, LINE = A.LINE, C = A.crew, ink = C.ink;
const EYE = A.C[1]; // eye level: the horizon of the whole drawing

// ------------------------------------------------------------------ the room kit
const K = (A.rk = {});
K.WOOD = { top: '#c99263', front: '#9c6440', dark: '#6a3f2e', grain: '#7b4a33', lit: '#e7b583' };
// a plank floor laid level across the chamber at y; returns the span it covers
K.deck = (g, ch, y, o = {}) => {
  const [x0, x1] = A.span(ch.poly, y, o.near);
  const W = K.WOOD, th = o.th || 7, d = clamp((y - EYE) * 0.045, -7, 7);
  const r = rng(Math.round(y * 13 + x0));
  g.save(); g.clip(ch.path);
  // the dark below the floor
  g.fillStyle = 'rgba(40, 30, 58, 0.35)'; g.fillRect(x0 - 10, y + th, x1 - x0 + 20, 400);
  if (d > 0) {
    // seen from above: the top surface, planks running back
    g.fillStyle = W.top; g.fillRect(x0 - 10, y - d, x1 - x0 + 20, d);
    g.lineWidth = 0.8; g.strokeStyle = W.grain;
    for (let x = x0 - 10; x < x1 + 10; x += 9 + r() * 5) { g.beginPath(); g.moveTo(x, y - d); g.lineTo(x + (x - A.C[0]) * 0.03, y); g.stroke(); }
  }
  // the front edge: plank ends, each a little different
  for (let x = x0 - 10; x < x1 + 10;) {
    const w = 14 + r() * 16;
    g.fillStyle = [W.front, '#a86d45', '#8f5a3b'][Math.floor(r() * 3)];
    g.fillRect(x, y, w, th);
    g.fillStyle = W.lit; g.fillRect(x, y, w, 1.2);
    g.lineWidth = 0.9; g.strokeStyle = W.dark; g.strokeRect(x, y, w, th);
    if (r() < 0.4) { g.fillStyle = W.dark; g.fill(circ(x + 3, y + th / 2, 0.9)); g.fill(circ(x + w - 3, y + th / 2, 0.9)); }
    x += w;
  }
  if (d < 0) { g.fillStyle = W.dark; g.fillRect(x0 - 10, y + th, x1 - x0 + 20, -d); }
  g.lineWidth = 1.6; g.strokeStyle = LINE; g.beginPath(); g.moveTo(x0 - 10, y + th); g.lineTo(x1 + 10, y + th); g.stroke();
  g.beginPath(); g.moveTo(x0 - 10, y - Math.max(0, d)); g.lineTo(x1 + 10, y - Math.max(0, d)); g.lineWidth = 1.2; g.stroke();
  g.restore();
  return [x0, x1];
};
// warm jelly-light pooled in a room
K.glow = (g, ch, x, y, rad, a = 0.55) => {
  g.save(); g.clip(ch.path); g.globalCompositeOperation = 'screen';
  g.fillStyle = radial(g, x, y, 0, rad, [[0, `rgba(255, 214, 140, ${a})`], [0.45, `rgba(255, 180, 110, ${a * 0.45})`], [1, 'rgba(255, 170, 100, 0)']]);
  g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  g.restore();
};
// a porthole drilled through the far wall: the sea outside, a brass rim
K.porthole = (g, x, y, rad) => {
  const O = circ(x, y, rad);
  g.save(); g.clip(O);
  g.fillStyle = grad(g, x - rad, y - rad, x + rad, y + rad, ['#bdeee0', '#5fb7b8', '#2f8496']); g.fill(O);
  g.fillStyle = 'rgba(255,255,240,0.35)'; g.fill(poly([[x - rad, y - rad * 0.2], [x - rad * 0.2, y - rad], [x + rad * 0.1, y - rad], [x - rad, y + rad * 0.15]]));
  g.fillStyle = 'rgba(30,80,100,0.45)'; g.fill(ell(x + rad * 0.3, y + rad * 0.5, rad * 0.25, rad * 0.1));
  g.restore();
  g.lineWidth = rad * 0.28 + 2.4; g.strokeStyle = LINE; g.stroke(O);
  g.lineWidth = rad * 0.28; g.strokeStyle = '#d2a456'; g.stroke(O);
  g.lineWidth = 1; g.strokeStyle = '#f5dc98'; g.beginPath(); g.arc(x, y, rad, Math.PI * 1.05, Math.PI * 1.6); g.stroke();
  for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU + 0.3; g.fillStyle = '#7d5a2c'; g.fill(circ(x + Math.cos(a) * rad, y + Math.sin(a) * rad, 1.2)); }
};
// a shelf bracketed to the back wall
K.shelf = (g, x0, x1, y) => {
  ink(g, A.rr(x0, y, x1 - x0, 4.5, 1), K.WOOD.front, 1.2);
  g.fillStyle = K.WOOD.lit; g.fillRect(x0 + 1, y + 0.6, x1 - x0 - 2, 1);
  for (const x of [x0 + 6, x1 - 6]) ink(g, poly([[x - 2, y + 4], [x + 2, y + 4], [x, y + 11]]), K.WOOD.dark, 1);
};
// a jar of jellies hung on a cord: the room's light. Drawn live so the jellies can swim.
K.lampJar = (g, x, y, s, t, k = 0, bright = 0) => {
  const jw = 11 * s, jh = 15 * s;
  A.line(g, x, y - jh - 30 * s, x, y - jh, 1);
  g.fillStyle = radial(g, x, y - jh * 0.4, 0, 40 * s, [[0, `rgba(255,236,170,${0.38 + bright * 0.3})`], [1, 'rgba(255,220,150,0)']]);
  g.fillRect(x - 40 * s, y - jh * 0.4 - 40 * s, 80 * s, 80 * s);
  const J = A.rr(x - jw, y - jh, jw * 2, jh * 1.9, 4 * s);
  g.fillStyle = 'rgba(255, 244, 205, 0.55)'; g.fill(J);
  for (let i = 0; i < 2; i++) {
    const jx = x + Math.sin(t * (0.9 + i * 0.4) + k + i * 2) * jw * 0.45, jy = y - jh * 0.1 + Math.cos(t * (0.7 + i * 0.3) + k * 2 + i) * jh * 0.4;
    const pul = 1 + 0.15 * Math.sin(t * 4 + i * 3 + k) + bright * 0.2;
    g.fillStyle = `rgba(255, 252, 230, ${0.8 + bright * 0.2})`; g.fill(ell(jx, jy, 3.6 * s * pul, 2.6 * s / pul));
    g.lineWidth = 0.7; g.strokeStyle = 'rgba(255,200,120,0.9)';
    for (let j = -1; j <= 1; j++) { g.beginPath(); g.moveTo(jx + j * 2 * s, jy + 1.5 * s); g.quadraticCurveTo(jx + j * 2.5 * s + Math.sin(t * 3 + j) * 1.5, jy + 5 * s, jx + j * 2 * s, jy + 7 * s); g.stroke(); }
  }
  g.lineWidth = 1.3; g.strokeStyle = LINE; g.stroke(J);
  ink(g, A.rr(x - jw * 0.8, y - jh - 3 * s, jw * 1.6, 4 * s, 1.5), '#b98a4a', 1.1);
  g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(x - jw * 0.7, y - jh * 0.7, 1.6 * s, jh * 1.1);
};

// ------------------------------------------------------------------ rooms
A.rooms = [];
A.room = (def) => {
  const ch = A.chambers[def.k];
  const R = Object.assign({ ch, k: def.k }, def.state ? def.state() : {});
  A.furnish((g) => {
    g.save(); g.clip(ch.path);
    if (def.glow) for (const [x, y, rad, a] of def.glow) K.glow(g, ch, x, y, rad, a);
    if (def.floor != null) { const [x0, x1] = K.deck(g, ch, def.floor, { near: def.near }); R.fx0 = x0; R.fx1 = x1; }
    if (def.furnish) def.furnish(g, R);
    g.restore();
  }, def.k);
  if (def.floor != null) { const [x0, x1] = A.span(ch.poly, def.floor, def.near); R.fx0 = x0; R.fx1 = x1; R.fy = def.floor; }
  const L = layer({
    id: 'room-' + (def.id || def.k), z: 40 + def.k * 0.01,
    hit: A.hitIn(ch.path),
    onEnter(L) { if (def.enter) def.enter(L, R); },
    onTap(L) { if (def.tap) def.tap(L, R); },
    update(dt, t, L) { if (def.update) def.update(dt, t, L, R); },
    draw(g, t, L) {
      if (!def.draw) return;
      A.inShell(g, () => {
        g.save(); g.clip(ch.path);
        def.draw(g, t, L, R);
        g.restore();
        if (def.over) def.over(g, t, L, R);
      });
    },
  });
  A.rooms.push(L);
  return R;
};
// a point in shell space for the pointer
const ptr = () => A.toShell(P.x, P.y);
A.ptr = ptr;
const look = (x, y, k = 1) => { const [px, py] = ptr(); const dx = px - x, dy = py - y, d = Math.hypot(dx, dy) || 1; const f = P.inside ? clamp(d / 120, 0, 1) * k : 0; return [(dx / d) * f, (dy / d) * f]; };
A.look = look;

// ================================================================== 0 · the wheelhouse
A.room({
  k: 0, id: 'wheelhouse', floor: 512,
  glow: [[1170, 420, 170, 0.6]],
  state: () => ({ act: A.actor(11, [['look', 2.4], ['hat', 1.6], ['peer', 3]], [3, 7]), wheel: 0, wv: 0, blink: Drawn.blinker(), tube: A.beat(2.6), lean: 0 }),
  furnish(g, R) {
    // a chart of the reef pinned to the wall
    g.save(); g.translate(1090, 436); g.rotate(-0.06);
    ink(g, poly([[-26, -20], [24, -22], [26, 18], [-24, 20]]), '#efe0bd', 1.3);
    g.lineWidth = 1; g.strokeStyle = '#8a6a54';
    g.beginPath(); g.moveTo(-18, 8); g.bezierCurveTo(-8, -12, 6, 12, 18, -10); g.stroke();
    g.setLineDash([2, 2]); g.beginPath(); g.moveTo(-16, -12); g.lineTo(14, 10); g.stroke(); g.setLineDash([]);
    g.fillStyle = '#c0573a'; g.fill(poly([[10, 6], [16, 8], [12, 12]]));
    for (const [x, y] of [[-24, -20], [24, -22]]) { g.fillStyle = '#c0573a'; g.fill(circ(x + 2, y + 3, 1.6)); }
    g.restore();
    K.porthole(g, 1245, 445, 23);
    // a barometer: a shell dial
    ink(g, circ(1200, 410, 10), '#f6ead6', 1.3); ink(g, circ(1200, 410, 2), '#b8862e', 0.8);
    A.line(g, 1200, 410, 1206, 404, 1.2, '#7a3022');
    // the speaking tube, brass, down through the floor toward the nautilus
    const tube = [[1083, 520], [1083, 486], [1088, 470], [1100, 462]];
    A.stroke(g, tube, 8.4, LINE); A.stroke(g, tube, 6, '#d2a456'); A.stroke(g, tube.map(([x, y]) => [x - 1.5, y]), 1.5, '#f5dc98');
    ink(g, poly([[1098, 455], [1112, 452], [1112, 472], [1098, 469]]), '#d2a456', 1.3);
    ink(g, ell(1112, 462, 3, 10), '#5a3a2a', 1.2);
    // the wheel's pedestal and a little crate for the captain to stand on
    ink(g, poly([[1160, 512], [1165, 470], [1173, 470], [1178, 512]]), K.WOOD.front, 1.4);
    ink(g, A.rr(1112, 497, 30, 15, 2), K.WOOD.front, 1.3);
    A.line(g, 1112, 504, 1142, 504, 0.8, K.WOOD.dark);
    // under the floor, in the low pocket: a coil of rope and a keg
    g.lineWidth = 3; g.strokeStyle = '#b98a54';
    for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(1240, 535 + i * 2, 18 - i * 3, 6 - i, 0, 0, TAU); g.stroke(); }
    ink(g, A.rr(1262, 528, 16, 22, 4), '#9a6b45', 1.2);
  },
  update(dt, t, L, R) {
    R.act.step(dt); R.tube.step(dt);
    // hovering, the captain spins the wheel hard over and the ark leans into the turn
    R.wv += ((L.hovered ? 5 : 0) - R.wv) * dt * 2.2;
    R.wheel += (R.wv + Math.sin(t * 0.4) * 0.15) * dt;
    R.lean = Drawn.ease(R.lean, L.hovered ? 1 : 0, 1.5, dt);
    A.tiltExtra = R.lean * 0.02;
    if (L.hovered && L.since > 1.1 && !R.tube.live && R.tube.u >= 1 && !R.called) { R.called = true; R.tube.start(); A.mail(0.98, 0.0, () => { A.signal = 1; }); }
    if (!L.hovered) R.called = false;
  },
  draw(g, t, L, R) {
    const lw = R.act.is('look'), hat = R.act.is('hat'), peer = R.act.is('peer'), tb = R.tube.live ? R.tube.u : -1;
    K.lampJar(g, 1172, 405, 1, t, 0, L.hover + A.flare(R.k));
    // the wheel: driftwood spokes round a hub
    g.save(); g.translate(1169, 462); g.rotate(R.wheel);
    for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; ink(g, poly([[Math.cos(a - 0.08) * 6, Math.sin(a - 0.08) * 6], [Math.cos(a) * 33, Math.sin(a) * 33], [Math.cos(a + 0.08) * 6, Math.sin(a + 0.08) * 6]]), K.WOOD.front, 1.2); ink(g, circ(Math.cos(a) * 34, Math.sin(a) * 34, 2.8), K.WOOD.top, 1); }
    g.lineWidth = 7.4; g.strokeStyle = LINE; g.beginPath(); g.arc(0, 0, 24, 0, TAU); g.stroke();
    g.lineWidth = 5; g.strokeStyle = K.WOOD.front; g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = K.WOOD.lit; g.beginPath(); g.arc(0, 0, 25, Math.PI, Math.PI * 1.6); g.stroke();
    ink(g, circ(0, 0, 6), '#d2a456', 1.3);
    g.restore();
    // the captain: at the wheel, or leaning to the tube when he calls down it
    const toTube = tb >= 0 ? A.env(tb, 0.15, 0.8) : 0;
    const x = lerp(1132, 1112, toTube), y = 497;
    const lk = peer >= 0 ? [1, -0.2] : lw >= 0 ? [-1 + 2 * A.smooth(lw), -0.4] : look(x, y - 40);
    C.hermit(g, x, y, 1.15, {
      hat: true, hatTip: hat >= 0 ? -0.3 * A.bump(hat) : 0, blink: R.blink(t), look: toTube > 0.5 ? [-1, 0.3] : lk, flip: toTube > 0.5,
      claw: L.hovered ? 0.5 + 0.4 * Math.sin(t * 6) : 0.25 + 0.1 * Math.sin(t * 1.3), snip: L.hovered ? 0.5 + 0.5 * Math.sin(t * 9) : 0, ant: t * 2,
      bob: Math.sin(t * 2) * 0.6,
    });
    if (tb >= 0 && tb < 0.6 && Math.random() < 0.3) A.spawn({ kind: 'bubble', x: 1112, y: 462, vx: 10, vy: -10, size: 1.5, life: 0.8 });
  },
});

// ================================================================== 1 · the galley
A.room({
  k: 1, id: 'galley', floor: 371, near: 1150,
  glow: [[1190, 330, 140, 0.55], [1205, 355, 60, 0.4]],
  state: () => ({ act: A.actor(21, [['taste', 2], ['look', 2.2], ['shake', 1.6]], [2.5, 6]), blink: Drawn.blinker(), jug: 0, flip: A.beat(1.6) }),
  furnish(g, R) {
    // the vent stove: a squat stone chimney with a hot mouth
    const sx = 1205;
    ink(g, curve([[sx - 24, 371], [sx - 22, 340], [sx - 14, 330], [sx + 14, 330], [sx + 22, 340], [sx + 24, 371]], false), '#8c8494', 1.6);
    const st = curve([[sx - 24, 371], [sx - 22, 340], [sx - 14, 330], [sx + 14, 330], [sx + 22, 340], [sx + 24, 371]]);
    g.save(); g.clip(st);
    for (let i = 0; i < 10; i++) { g.fillStyle = i % 2 ? '#a39aa8' : '#6f6880'; g.fill(ell(sx - 20 + (i % 5) * 10, 338 + Math.floor(i / 5) * 16, 6, 4)); }
    g.restore();
    ink(g, ell(sx, 345, 9, 7), '#2a1a22', 1.2);
    g.fillStyle = radial(g, sx, 346, 0, 9, [[0, '#ffe9a0'], [0.5, '#ff9a4a'], [1, '#c2402a']]); g.fill(ell(sx, 346, 7, 5.5));
    // shelves of jars, spice shells and a string of dried kelp
    K.shelf(g, 1168, 1250, 292);
    const jars = [[1176, '#c9e0b0'], [1189, '#f1c27a'], [1201, '#e59a9a'], [1214, '#bfd7e8'], [1228, '#d9c4f0']];
    for (const [x, c] of jars) { ink(g, A.rr(x - 4.5, 278, 9, 14, 2.5), c, 1); ink(g, A.rr(x - 4, 276, 8, 3, 1), '#a6774c', 0.8); }
    ink(g, ell(1242, 286, 6, 5), '#f2c9b0', 1); A.stroke(g, [[1236, 286], [1248, 286]], 0.8, '#b07a66');
    // utensils hanging under the sloping ceiling
    A.line(g, 1110, 300, 1160, 270, 2, K.WOOD.dark);
    for (const [x, kind] of [[1120, 0], [1134, 1], [1148, 2]]) {
      const y = 300 - (x - 1110) * 0.6;
      A.line(g, x, y, x, y + 16, 1);
      if (kind === 0) ink(g, ell(x, y + 21, 4, 5), '#b8b8c4', 1);
      else if (kind === 1) { ink(g, A.rr(x - 1.2, y + 14, 2.4, 14, 1), '#9c6440', 0.8); ink(g, poly([[x - 4, y + 28], [x + 4, y + 28], [x + 3, y + 34], [x - 3, y + 34]]), '#c9c9d4', 0.9); }
      else ink(g, circ(x, y + 22, 6), '#4a4a5a', 1);
    }
    // a little table with a bowl at the low end
    ink(g, A.rr(1036, 352, 34, 4, 1), K.WOOD.front, 1.1);
    A.line(g, 1041, 356, 1041, 371, 2, K.WOOD.dark); A.line(g, 1065, 356, 1065, 371, 2, K.WOOD.dark);
    ink(g, curve([[1044, 352], [1046, 345], [1060, 345], [1062, 352]], false), '#f2e6d0', 1);
  },
  enter(L, R) { R.flipDone = false; },
  update(dt, t, L, R) {
    R.act.step(dt); R.flip.step(dt);
    R.jug = Drawn.ease(R.jug, L.hovered ? 1 : 0, 3, dt);
    if (L.hovered && L.since > 1.4 && !R.flipDone) { R.flipDone = true; R.flip.start(); }
    // the pot simmers
    if (Math.random() < dt * 3) A.spawn({ kind: 'steam', x: 1205 + (Math.random() - 0.5) * 10, y: 318, vy: -18, vx: 3, size: 3 + Math.random() * 3, life: 1.6 });
  },
  draw(g, t, L, R) {
    K.lampJar(g, 1150, 300, 0.9, t, 1, L.hover + A.flare(R.k));
    // the pot on the stove
    ink(g, curve([[1191, 330], [1189, 316], [1221, 316], [1219, 330]]), '#4f5266', 1.4);
    g.fillStyle = '#7a7d92'; g.fillRect(1192, 317, 26, 3);
    const taste = R.act.is('taste'), shake = R.act.is('shake');
    const jug = R.jug, fl = R.flip.live ? R.flip.u : -1;
    const ox = 1150, oy = 371;
    const items = [];
    C.octopus(g, ox, oy, 0.95, {
      hat: true, t, blink: R.blink(t), look: taste >= 0 ? [0.6, 0.5] : look(ox, oy - 40),
      arms(i, tt) {
        // two arms stir and hold the ladle, the rest steady the cook; hovered, three of them juggle
        if (i === 7) return [-0.5 + Math.sin(tt * 2.2) * 0.3 * (1 - jug), -0.6, 38];
        if (i === 6 && jug > 0.05) return [-1.2 - jug * 0.4 + Math.sin(tt * 5) * 0.4 * jug, -0.5, 34];
        if (i === 5 && jug > 0.05) return [-1.9 + Math.sin(tt * 5 + 2) * 0.4 * jug, 0.5, 30];
        if (i === 0 && fl >= 0) return [-2.4, 0.6, 32];
        const base = -0.2 + (i / 7) * (Math.PI + 0.4);
        return [base + Math.sin(tt * 1.5 + i) * 0.1, 1.2 * (i < 4 ? -1 : 1), 26];
      },
      hold(g2, i, tip, prev) {
        if (i === 7) { // the ladle, in the pot
          g2.save(); g2.translate(tip[0], tip[1]); g2.rotate(0.6);
          ink(g2, A.rr(-1.2, -2, 2.4, 22, 1), K.WOOD.front, 0.9); ink(g2, ell(0, 22, 4, 3), '#c9c9d4', 0.9);
          g2.restore();
        }
      },
    });
    // juggled pans, and the pancake flipped high
    if (jug > 0.05) {
      for (let j = 0; j < 3; j++) {
        const ph = t * 3.2 + j * (TAU / 3), u = (Math.sin(ph) + 1) / 2;
        const jx = lerp(1105, 1190, (Math.cos(ph) + 1) / 2), jy = 300 - Math.abs(Math.sin(ph)) * 34 * jug;
        g.save(); g.globalAlpha = jug; g.translate(jx, jy); g.rotate(ph * 1.5);
        if (j === 0) { ink(g, circ(0, 0, 6), '#4a4a5a', 1); A.line(g, 6, 0, 14, 0, 2.4); }
        else if (j === 1) ink(g, ell(0, 0, 5, 3.5), '#f2c27a', 1);
        else ink(g, A.rr(-5, -4, 10, 8, 2), '#c9e0b0', 1);
        g.restore();
      }
    }
    if (fl >= 0) {
      const h = Math.sin(fl * Math.PI) * 70, px = 1120 + fl * 10, py = 335 - h;
      g.save(); g.translate(px, py); g.scale(1, Math.cos(fl * TAU * 1.5));
      ink(g, ell(0, 0, 9, 9), '#f0d49a', 1.2); g.fillStyle = '#c99a5a'; for (let i = 0; i < 5; i++) { const a = (i / 5) * TAU; g.fill(ell(Math.cos(a) * 4, Math.sin(a) * 4, 1, 2.2, undefined, a)); }
      g.restore();
      if (fl > 0.9 && !R.hearted) { R.hearted = true; for (let i = 0; i < 3; i++) A.spawn({ kind: 'heart', x: 1150 + i * 8, y: 300, vy: -25, life: 1.6, size: 0.9 }); }
    } else R.hearted = false;
    if (shake >= 0) { // a shake of salt over the pot
      if (Math.random() < 0.5) A.spawn({ kind: 'spark', x: 1205 + (Math.random() - 0.5) * 8, y: 312, vy: 14, size: 0.25, life: 0.5 });
    }
  },
});

// ================================================================== 2 · the pump room
A.room({
  k: 2, id: 'pump', floor: 304, near: 990,
  glow: [[1050, 240, 150, 0.5]],
  state: () => ({ blink: Drawn.blinker(), blink2: Drawn.blinker(), wheel: 0, ws: 0.6, gauge: 0, whistle: A.beat(1.6), act: A.actor(31, [['note', 2.2], ['look', 2]], [3, 7]) }),
  furnish(g, R) {
    // the engineer's platform, bracketed to the wall
    ink(g, A.rr(1052, 248, 70, 6, 1), K.WOOD.front, 1.3);
    g.fillStyle = K.WOOD.lit; g.fillRect(1053, 248.5, 68, 1.2);
    ink(g, poly([[1060, 254], [1064, 254], [1070, 268], [1066, 270]]), K.WOOD.dark, 1);
    // the gauge: a brass dial with a red zone
    ink(g, circ(1108, 205, 15), '#f6ead6', 1.6);
    g.lineWidth = 2.2; g.strokeStyle = '#d24a3a'; g.beginPath(); g.arc(1108, 205, 11, -0.6, 0.2); g.stroke();
    g.lineWidth = 0.9; g.strokeStyle = LINE; for (let i = 0; i <= 6; i++) { const a = Math.PI * 0.85 + i * 0.42; g.beginPath(); g.moveTo(1108 + Math.cos(a) * 9, 205 + Math.sin(a) * 9); g.lineTo(1108 + Math.cos(a) * 12, 205 + Math.sin(a) * 12); g.stroke(); }
    g.lineWidth = 3.4; g.strokeStyle = '#c9a258'; g.stroke(circ(1108, 205, 15));
    // pipes: from the wheel's bellows down into the siphuncle, and up to the whistle
    const p1 = [[985, 292], [975, 300], [968, 326]];
    A.stroke(g, p1, 7, LINE); A.stroke(g, p1, 4.8, '#c9a258');
    const p2 = [[1090, 205], [1080, 190], [1080, 172]];
    A.stroke(g, p2, 6, LINE); A.stroke(g, p2, 4, '#c9a258');
    ink(g, A.rr(1075, 160, 10, 13, 2), '#d2a456', 1.2);
    A.line(g, 1086, 164, 1096, 170, 0.8); // the whistle cord
    // the treadwheel's axle post
    ink(g, poly([[993, 304], [997, 262], [1003, 262], [1007, 304]]), K.WOOD.front, 1.3);
    // the bellows, pumped by the wheel's crank
    ink(g, poly([[962, 304], [960, 284], [988, 280], [990, 304]]), '#8f5a3b', 1.2);
  },
  update(dt, t, L, R) {
    R.act.step(dt); R.whistle.step(dt);
    R.ws = Drawn.ease(R.ws, L.hovered ? 4.2 : 0.6, 2, dt);
    R.wheel += R.ws * dt;
    R.gauge = Drawn.ease(R.gauge, L.hovered ? 1 : 0.15 + 0.05 * Math.sin(t * 0.8), 0.8, dt);
    // the pump fills the float chambers: the whole ark rises in the water
    A.lift = R.gauge * 34;
    if (L.hovered && L.since > 2 && !R.blew) { R.blew = true; R.whistle.start(); }
    if (!L.hovered) R.blew = false;
    if (R.whistle.live && Math.random() < dt * 30) A.spawn({ kind: 'bubble', x: 1080, y: 158, vx: (Math.random() - 0.5) * 20, vy: -40, size: 2 + Math.random() * 2.5, life: 1.6 });
    if (R.ws > 2 && Math.random() < dt * R.ws * 0.8) A.spawn({ kind: 'bubble', x: 968 + Math.random() * 4, y: 326, vx: 0, vy: -6, size: 1.2, life: 0.8 });
  },
  draw(g, t, L, R) {
    K.lampJar(g, 1040, 196, 0.85, t, 2, L.hover + A.flare(R.k));
    // the treadwheel
    const wx = 1000, wy = 262, wr = 38;
    g.save(); g.translate(wx, wy);
    g.lineWidth = 6.2; g.strokeStyle = LINE; g.beginPath(); g.arc(0, 0, wr, 0, TAU); g.stroke();
    g.lineWidth = 4; g.strokeStyle = K.WOOD.front; g.stroke();
    g.save(); g.rotate(R.wheel);
    for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU; A.line(g, Math.cos(a) * (wr - 2), Math.sin(a) * (wr - 2), Math.cos(a) * (wr - 6), Math.sin(a) * (wr - 6), 1.6, K.WOOD.dark); }
    for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; A.line(g, 0, 0, Math.cos(a) * (wr - 2), Math.sin(a) * (wr - 2), 1.4, K.WOOD.dark); }
    g.restore();
    ink(g, circ(0, 0, 4), '#c9a258', 1.2);
    g.restore();
    // the crank and its rod to the bellows
    const cx = wx + Math.cos(R.wheel) * 10, cy = wy + Math.sin(R.wheel) * 10;
    A.line(g, cx, cy, 975, 282 + Math.sin(R.wheel) * 3, 2.2, K.WOOD.dark);
    // the runner, inside the wheel at the bottom
    const run = R.ws;
    C.shrimp(g, wx - 8, wy + wr - 4, 0.72, { t: t * (0.6 + run * 0.4), legs: 0.4 + run * 0.4, bend: 0.1 + Math.sin(t * run * 3) * 0.08, blink: R.blink(t), look: run > 2 ? [1, -0.2] : look(wx, wy), rot: -0.15 - run * 0.03, reach: [18, -10 + Math.sin(t * run * 4) * 3] });
    if (run > 2.5 && Math.random() < 0.2) A.spawn({ kind: 'bubble', x: wx - 18, y: wy + 20, vx: -10, vy: -10, size: 1, life: 0.6 });
    // the gauge needle
    const ga = Math.PI * 0.85 + R.gauge * 2.4 + Math.sin(t * 13) * 0.03 * R.gauge;
    A.line(g, 1108, 205, 1108 + Math.cos(ga) * 11, 205 + Math.sin(ga) * 11, 1.6, '#7a3022');
    // the engineer, on her platform with a clipboard; she pulls the whistle when it peaks
    const wh = R.whistle.live ? A.bump(R.whistle.u) : 0, note = R.act.is('note');
    C.shrimp(g, 1096, 248, 0.68, { t, flip: true, blink: R.blink2(t), look: wh > 0 ? [0.3, -1] : note >= 0 ? [-0.2, 0.8] : look(1096, 228), reach: wh > 0 ? [-12, -36 + wh * 6] : [-4, -8], bend: 0.05, legs: 0.2 });
    if (note < 0 || wh > 0) {} else { ink(g, A.rr(1083, 236, 10, 13, 1), '#f6ead6', 0.9); }
    if (wh > 0) A.line(g, 1096 - 0 + 8, 223 + wh * 6, 1096, 170, 0.8);
  },
});

// ================================================================== 3 · the observatory
const SCOPE = { pivot: [958, 150], len: 128 };
A.room({
  k: 3, id: 'observatory', floor: 318, near: 905,
  glow: [[880, 250, 120, 0.45]],
  state: () => ({ blink: Drawn.blinker(), aim: -2.1, aimV: 0, jump: A.beat(1.2), act: A.actor(41, [['wipe', 1.6], ['look', 2]], [3, 8]) }),
  furnish(g, R) {
    // a star chart and a shelf of brass bits up the wall
    K.shelf(g, 826, 880, 232);
    ink(g, circ(838, 225, 5), '#d2a456', 1); ink(g, A.rr(848, 219, 8, 13, 2), '#bfd7e8', 0.9); ink(g, A.rr(862, 222, 12, 10, 1), '#efe0bd', 0.9);
    g.save(); g.translate(860, 270); g.rotate(0.05);
    ink(g, poly([[-20, -18], [20, -18], [20, 18], [-20, 18]]), '#2b3a5c', 1.2);
    g.fillStyle = '#f6e7a8'; for (const [x, y] of [[-12, -8], [-4, -12], [6, -6], [12, 4], [-8, 8], [2, 10], [10, -12]]) g.fill(circ(x, y, 1.3));
    g.lineWidth = 0.6; g.strokeStyle = '#f6e7a8'; g.beginPath(); g.moveTo(-12, -8); g.lineTo(-4, -12); g.lineTo(6, -6); g.lineTo(12, 4); g.stroke();
    g.restore();
    // the stool
    ink(g, A.rr(892, 300, 22, 4, 1.5), K.WOOD.front, 1.1);
    A.line(g, 896, 304, 893, 318, 1.8, K.WOOD.dark); A.line(g, 910, 304, 913, 318, 1.8, K.WOOD.dark);
  },
  update(dt, t, L, R) {
    R.act.step(dt); R.jump.step(dt);
    // the telescope swings to follow the pointer while hovered, otherwise sweeps the sky slowly
    let want = -2.05 + Math.sin(t * 0.17) * 0.25;
    if (L.hovered || (P.inside && Math.hypot(...ptr().map((v, i) => v - SCOPE.pivot[i])) < 260 && ptr()[1] < SCOPE.pivot[1])) {
      const [px, py] = ptr(); want = clamp(Math.atan2(py - SCOPE.pivot[1], px - SCOPE.pivot[0]), -2.7, -0.6);
    }
    R.aimV += ((want - R.aim) * 14 - R.aimV * 6) * dt; R.aim += R.aimV * dt;
    if (L.hovered && L.since > 1.3 && !R.jumped) { R.jumped = true; R.jump.start(); A.spawn({ kind: 'spark', x: SCOPE.pivot[0] + Math.cos(R.aim) * -60, y: SCOPE.pivot[1] + Math.sin(R.aim) * -60, size: 1.2, life: 0.9 }); }
    if (!L.hovered) R.jumped = false;
  },
  draw(g, t, L, R) {
    K.lampJar(g, 870, 196, 0.8, t, 3, L.hover + A.flare(R.k));
    // inside: the eyepiece end of the telescope, angled up to the hole in the roof
    const a = R.aim, [px, py] = SCOPE.pivot;
    const ex = px - Math.cos(a) * 70, ey = py - Math.sin(a) * 70;
    const tube = [[ex, ey], [px, py]];
    A.stroke(g, tube, 13, LINE); A.stroke(g, tube, 10.5, '#c9a258'); A.stroke(g, tube.map(([x, y]) => [x - 2, y - 1]), 2, '#f5dc98');
    ink(g, circ(ex, ey, 4), '#5a3a2a', 1);
    // the goby on the stool at the eyepiece
    const j = R.jump.live ? A.bump(R.jump.u) : 0, wipe = R.act.is('wipe');
    C.goby(g, 900, 300 - j * 16, 0.9, { t, blink: R.blink(t), look: j > 0 ? [1, -1] : wipe >= 0 ? [-0.5, 0.5] : [Math.cos(a + Math.PI) * -0.6, -0.8], rot: -0.35 - j * 0.2, wag: j * 6 });
    if (j > 0.5) { g.fillStyle = LINE; g.font = 'bold 14px Georgia'; g.fillText('!', 908, 268 - j * 16); }
  },
  over(g, t, L, R) {
    // outside: the objective end pokes out through the shell's roof and moves with the aim
    const a = R.aim, [px, py] = SCOPE.pivot;
    const ox = px + Math.cos(a) * 58, oy = py + Math.sin(a) * 58;
    const tube = [[px, py], [ox, oy]];
    A.stroke(g, tube, 13, LINE); A.stroke(g, tube, 10.5, '#c9a258'); A.stroke(g, tube.map(([x, y]) => [x - 2, y - 1]), 2, '#f5dc98');
    g.save(); g.translate(ox, oy); g.rotate(a);
    ink(g, A.rr(-4, -8, 10, 16, 2), '#d2a456', 1.3);
    g.fillStyle = 'rgba(200,240,255,0.8)'; g.fill(ell(6, 0, 1.8, 6));
    g.restore();
    // a brass collar where it passes through the wall
    ink(g, ell(px, py, 9, 6, undefined, -0.1), '#b8862e', 1.3);
  },
});

// ================================================================== 4 · the library
A.room({
  k: 4, id: 'library', floor: 345, near: 800,
  glow: [[790, 300, 110, 0.5]],
  state: () => ({ blink: Drawn.blinker(), page: A.beat(0.9), worm: A.beat(2.4), act: A.actor(51, [['nod', 2.5], ['adjust', 1.4], ['read', 3]], [2, 5]) }),
  furnish(g, R) {
    const r = rng(54);
    // shelves of shell-scrolls and kelp-paper books, the top shelf shorter where the wall curves in
    for (const [y, x0, x1] of [[300, 762, 860], [262, 752, 845], [224, 744, 822]]) {
      K.shelf(g, x0, x1, y);
      for (let x = x0 + 3; x < x1 - 4;) {
        const w = 4 + r() * 5, h = 14 + r() * 12, lean = r() < 0.15 ? 0.2 : 0;
        const col = ['#b5552f', '#5a7fa8', '#d9b45a', '#6f9b6a', '#9b6fa8', '#e8d6b8'][Math.floor(r() * 6)];
        g.save(); g.translate(x, y); g.rotate(lean);
        if (r() < 0.25) { ink(g, ell(w / 2 + 1, -5, w / 2 + 2, 5), '#efe0bd', 0.9); A.line(g, 1, -5, w + 1, -5, 0.6, '#b07a66'); x += w + 4; }
        else { ink(g, A.rr(0, -h, w, h, 1), col, 0.9); g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(1, -h + 3, w - 2, 1.2); x += w + 0.6; }
        g.restore();
      }
    }
    // a ladder leaning on the shelves
    A.line(g, 846, 345, 832, 230, 2.2, K.WOOD.dark); A.line(g, 858, 345, 846, 230, 2.2, K.WOOD.dark);
    for (let i = 1; i < 7; i++) { const u = i / 7; A.line(g, lerp(846, 832, u), lerp(345, 230, u), lerp(858, 846, u), lerp(345, 230, u), 1.6, K.WOOD.front); }
    // the lectern
    ink(g, poly([[780, 345], [784, 318], [790, 318], [794, 345]]), K.WOOD.front, 1.2);
    ink(g, poly([[770, 318], [804, 312], [806, 318], [772, 324]]), K.WOOD.front, 1.2);
  },
  update(dt, t, L, R) {
    R.act.step(dt); R.page.step(dt); R.worm.step(dt);
    if (L.hovered && !R.turned) { R.turned = true; R.page.start(); }
    if (L.hovered && L.since > 1.5 && !R.wormed) { R.wormed = true; R.worm.start(); }
    if (!L.hovered) { R.turned = false; R.wormed = false; }
    if (R.act.is('read') > 0.95 && !R.page.live) R.page.start();
  },
  draw(g, t, L, R) {
    K.lampJar(g, 806, 205, 0.75, t, 4, L.hover + A.flare(R.k));
    // the open book on the lectern; a page turning over
    g.save(); g.translate(788, 312); g.rotate(-0.17);
    ink(g, curve([[-16, 0], [-8, -4], [0, -1], [8, -4], [16, 0], [16, 3], [0, 4], [-16, 3]]), '#fbf3e2', 1);
    A.line(g, 0, -1, 0, 4, 0.7);
    for (let i = 0; i < 3; i++) { A.line(g, -13, -1 + i * 1.3, -3, -2 + i * 1.3, 0.5, '#9a8a80'); A.line(g, 3, -2 + i * 1.3, 13, -1 + i * 1.3, 0.5, '#9a8a80'); }
    if (R.page.live) {
      const u = R.page.u, x = 14 * Math.cos(u * Math.PI);
      ink(g, curve([[0, -1], [x * 0.5, -4 - Math.sin(u * Math.PI) * 9], [x, -2 - Math.sin(u * Math.PI) * 4], [x, 1], [0, 3]]), '#fffaf0', 0.8);
    }
    g.restore();
    // the librarian
    const nod = R.act.is('nod'), adj = R.act.is('adjust');
    const looking = L.hovered && R.page.u >= 1;
    C.snail(g, 768, 345, 0.85, { t, specs: true, blink: nod >= 0 ? 1 - A.bump(nod) * 0.9 : R.blink(t), look: looking ? look(790, 300) : [0.7, 0.6], reach: nod >= 0 ? -0.2 * A.bump(nod) : adj >= 0 ? 0.3 * A.bump(adj) : 0.15, rock: Math.sin(t * 0.8) * 0.03 });
    // the bookworm on the top shelf
    if (R.worm.live) {
      const u = R.worm.u, up = A.env(u, 0.2, 0.75);
      const wx = 790, wy = 224;
      const pts = []; for (let i = 0; i < 6; i++) pts.push([wx + Math.sin(i * 0.9 + t * 5) * 1.5 * up, wy - i * 2.6 * up]);
      C.limb(g, pts, 3.8, 3, '#f2a3b0', 0.8);
      if (up > 0.6) { g.fillStyle = LINE; g.fill(circ(pts[5][0] + 1, pts[5][1], 0.7)); }
    }
  },
});

// ================================================================== 5 · the garden
A.room({
  k: 5, id: 'garden', floor: 424, near: 750,
  glow: [[730, 340, 110, 0.4]],
  state: () => ({ blink: Drawn.blinker(), open: 0, water: 0, peek: A.beat(2.4), act: A.actor(61, [['water', 2.6], ['look', 2]], [2.5, 6]) }),
  furnish(g, R) {
    K.porthole(g, 708, 330, 16);
    // a planter of sand along the floor
    ink(g, A.rr(700, 408, 110, 16, 3), '#9c6440', 1.4);
    g.fillStyle = '#e8cf9e'; g.fillRect(702, 409, 106, 4);
    // sea grapes climbing a stake
    A.line(g, 793, 408, 790, 352, 1.5, K.WOOD.dark);
    const r = rng(5);
    for (let i = 0; i < 14; i++) { const y = 360 + i * 3.4, x = 790 + Math.sin(i * 1.7) * 7; ink(g, circ(x, y, 2.4 + r()), ['#7fbf6a', '#9ad47a', '#5fa35a'][i % 3], 0.7); }
    // a hanging basket of red algae
    A.line(g, 760, 290, 760, 318, 0.8);
    ink(g, curve([[748, 318], [772, 318], [766, 330], [754, 330]]), '#9c6440', 1);
    for (let i = 0; i < 6; i++) { const a = -0.5 + i * 0.4; A.stroke(g, [[760 + (i - 2.5) * 3, 320], [760 + (i - 2.5) * 5 + Math.cos(a) * 4, 336 + i % 2 * 4]], 2, '#c24a5a'); }
  },
  update(dt, t, L, R) {
    R.act.step(dt); R.peek.step(dt);
    R.open = Drawn.ease(R.open, L.hovered ? 1 : 0, 2.5, dt);
    R.water = Drawn.ease(R.water, L.hovered || R.act.is('water') >= 0 ? 1 : 0, 3, dt);
    if (L.hovered && L.since > 1.6 && !R.peeked) { R.peeked = true; R.peek.start(); }
    if (!L.hovered) R.peeked = false;
    if (R.water > 0.6 && Math.random() < dt * 14) A.spawn({ kind: 'bubble', x: 744 + Math.random() * 4, y: 378, vx: (Math.random() - 0.5) * 8, vy: -30, size: 1 + Math.random() * 1.6, life: 1.1 });
  },
  draw(g, t, L, R) {
    K.lampJar(g, 734, 305, 0.7, t, 5, L.hover + A.flare(R.k));
    // anemones: soft columns with a crown of tentacles that open and wave
    for (const [x, s, col, k] of [[712, 1, ['#f29ab2', '#c86a8a', '#ffd0dc'], 0], [732, 0.8, ['#9ad4b8', '#5fa38a', '#d4f2e2'], 1], [772, 0.9, ['#f6b46a', '#c9803a', '#ffe0b0'], 2]]) {
      const op = 0.35 + R.open * 0.65 + Math.sin(t * 0.7 + k) * 0.08;
      ink(g, curve([[x - 6 * s, 410], [x - 5 * s, 396], [x + 5 * s, 396], [x + 6 * s, 410]]), col[1], 1);
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.34 * op + Math.sin(t * 2.2 + i + k) * 0.12 * (0.4 + R.open);
        const L2 = (12 + (i % 2) * 3) * s * (0.5 + op * 0.5);
        const pts = [[x + (i - 4) * 1.2 * s, 397], [x + Math.cos(a) * L2 * 0.6, 397 + Math.sin(a) * L2 * 0.6], [x + Math.cos(a + 0.2) * L2, 397 + Math.sin(a + 0.2) * L2]];
        C.limb(g, pts, 3.2 * s, 1.6 * s, i % 2 ? col[0] : col[2], 0.8);
      }
      if (k === 0 && R.peek.live) {
        const up = A.env(R.peek.u, 0.25, 0.7);
        C.shrimp(g, x + 2, 398 - up * 6, 0.28, { t, look: [0.5, -0.5], rot: -0.6 });
      }
    }
    // the gardener with her watering can
    const w = R.water;
    C.nudi(g, 752, 424, 0.85, { t, blink: R.blink(t), look: w > 0.5 ? [-0.5, 0.4] : look(760, 400), rear: w * 0.8, ripple: R.open, flip: true });
    g.save(); g.translate(744, 388 - w * 6); g.rotate(-0.3 - w * 0.5);
    ink(g, A.rr(-7, -6, 14, 12, 3), '#6aa3c8', 1.1);
    ink(g, poly([[-7, -2], [-18, -9], [-19, -7], [-7, 2]]), '#6aa3c8', 1);
    g.lineWidth = 1.2; g.strokeStyle = LINE; g.beginPath(); g.arc(2, -6, 5, Math.PI, 0); g.stroke();
    g.restore();
  },
});

// ================================================================== 6 · the bunk room
A.room({
  k: 6, id: 'bunks', floor: 510, near: 750,
  glow: [[760, 470, 90, 0.35]],
  state: () => ({ wake: A.beat(3.2), act: A.actor(71, [['shift', 2.5], ['snore', 2]], [2, 5]), sway: 0, sv: 0 }),
  furnish(g, R) {
    // the perch: a driftwood rail on two posts, a blanket slung over one end
    ink(g, A.rr(694, 494, 110, 5, 2), K.WOOD.front, 1.3);
    for (const x of [702, 796]) ink(g, A.rr(x - 2, 498, 4, 12, 1), K.WOOD.dark, 1);
    ink(g, curve([[792, 492], [806, 492], [806, 508], [800, 506], [794, 509]]), '#d96a6a', 1);
    g.lineWidth = 1; g.strokeStyle = '#f3c0a8'; g.beginPath(); g.moveTo(794, 498); g.lineTo(806, 498); g.stroke();
    // a little nightlight jar on the floor
    ink(g, A.rr(708, 500, 8, 10, 2), 'rgba(255,240,200,0.7)', 1);
    K.glow(g, R.ch, 712, 504, 22, 0.5);
  },
  enter(L, R) { R.wake.start(); R.sv += 1.2; },
  update(dt, t, L, R) {
    R.act.step(dt); R.wake.step(dt);
    R.sv += (-R.sway * 9 - R.sv * 1.2) * dt + Math.sin(t * 0.6) * 0.02 * dt;
    R.sway += R.sv * dt;
    const sn = R.act.is('snore');
    if (Math.random() < dt * (sn >= 0 ? 2.2 : 0.8)) A.spawn({ kind: 'z', x: 745 + Math.random() * 30, y: 458, vy: -14, life: 2, size: 0.6 + Math.random() * 0.3 });
  },
  draw(g, t, L, R) {
    // three sleepers, tails curled round the perch
    const wk = R.wake.live ? A.env(R.wake.u, 0.15, 0.7) : 0, sh = R.act.is('shift');
    const sleepers = [[722, 0.62, 0, { body: '#f2b84b' }], [752, 0.68, 1, { body: '#e8836a', shade: '#b55a4a', lit: '#ffb59a', fin: '#ffd2c0', ring: '#c06a55' }], [782, 0.6, 2, { body: '#9ac76a', shade: '#6a9a48', lit: '#c8e89a', fin: '#e2f2c0', ring: '#7aa050' }]];
    for (const [x, s, i, c] of sleepers) {
      const awake = i === 1 ? wk : 0;
      C.seahorse(g, x + R.sway * 3, 496, s, { t, ph: i * 2, c, sleep: awake < 0.3, look: look(x, 470), nod: Math.sin(t * 0.9 + i) * 0.06 + (sh >= 0 && i === 2 ? A.bump(sh) * 0.2 : 0) - awake * 0.5, rot: R.sway * 0.08 + (i - 1) * 0.06 });
      if (awake > 0.3 && awake < 0.85) { // a yawn
        g.fillStyle = LINE; g.fill(circ(x + 12 + R.sway * 3, 459 - awake * 4, 1.8 * awake));
      }
    }
  },
});

// ================================================================== 7 · the band room
A.room({
  k: 7, id: 'band', floor: 572, near: 790,
  glow: [[790, 545, 90, 0.45]],
  state: () => ({ blink: Drawn.blinker(), blink2: Drawn.blinker(), play: 0, puff: 0, act: A.actor(81, [['tap', 2], ['tune', 2.2]], [2.5, 6]) }),
  furnish(g, R) {
    // barnacle drums: three cones on a crate
    ink(g, A.rr(810, 556, 28, 16, 2), K.WOOD.front, 1.2);
    for (const [x, h] of [[815, 12], [825, 15], [834, 10]]) { ink(g, poly([[x - 4, 556], [x - 3, 556 - h], [x + 3, 556 - h], [x + 4, 556]]), '#e6dcc8', 1); ink(g, ell(x, 556 - h, 3, 1.4), '#8a7a6a', 0.8); }
    // a sheet of music pinned up
    ink(g, poly([[752, 520], [772, 518], [773, 536], [753, 538]]), '#fbf3e2', 1);
    for (let i = 0; i < 4; i++) A.line(g, 755, 524 + i * 3.5, 770, 523 + i * 3.5, 0.5, '#8a7a70');
  },
  update(dt, t, L, R) {
    R.act.step(dt);
    R.play = Drawn.ease(R.play, L.hovered ? 1 : 0, 3, dt);
    R.puff = Drawn.ease(R.puff, L.hovered && L.since > 1.4 ? 1 : 0, 2.5, dt);
    if (R.play > 0.4 && Math.random() < dt * 5) A.spawn({ kind: 'note', x: 760 + Math.random() * 10, y: 535, vy: -22, life: 1.8, size: 0.7 + Math.random() * 0.3 });
  },
  draw(g, t, L, R) {
    K.lampJar(g, 798, 505, 0.6, t, 7, L.hover + A.flare(R.k));
    const p = R.play, tap = R.act.is('tap');
    // the pufferfish with a conch horn
    const pf = R.puff * (0.7 + 0.3 * Math.sin(t * 2));
    C.puffer(g, 750, 572, 0.85, { t, puff: pf, blink: R.blink(t), look: p > 0.3 ? [1, 0] : look(750, 555), blow: p * (0.5 + 0.5 * Math.sin(t * 7)) });
    const hx = 750 + (15 + pf * 6) * 0.85, hy = 572 - (11 + pf * 10) * 0.85 - 2;
    g.save(); g.translate(hx + 2, hy + 1); g.rotate(-0.2 + Math.sin(t * 3) * 0.05 * p);
    ink(g, curve([[0, -3], [14, -8], [24, -12], [26, 0], [20, 6], [10, 4], [0, 3]]), '#f4d8c2', 1.2);
    g.save(); g.clip(curve([[0, -3], [14, -8], [24, -12], [26, 0], [20, 6], [10, 4], [0, 3]])); g.fillStyle = '#e69a8a'; g.fill(ell(24, -3, 6, 8)); g.restore();
    g.beginPath(); for (let i = 0; i < 20; i++) { const a = i * 0.5, rr = 5 - i * 0.22; g.lineTo(16 + Math.cos(a) * rr, -2 + Math.sin(a) * rr); } g.lineWidth = 0.8; g.strokeStyle = LINE; g.stroke();
    g.restore();
    // the crab drummer, two sticks
    const beat = p > 0.2 ? Math.sin(t * 12) : tap >= 0 ? Math.sin(t * 7) * 0.5 : 0;
    C.crab(g, 824, 556, 0.6, { t, blink: R.blink2(t), look: p > 0.3 ? [-0.6, 0.3] : look(824, 540), claws: [0.4 + beat * 0.35, 0.4 - beat * 0.35], walk: 0, bob: Math.abs(beat) * 0.8 });
  },
});

// ================================================================== 8 · the lamp room
A.room({
  k: 8, id: 'lamps', floor: 612, near: 860,
  glow: [[860, 560, 90, 0.6]],
  state: () => ({ blink: Drawn.blinker(), bright: 0, act: A.actor(91, [['feed', 2.6], ['look', 2]], [2, 5]) }),
  furnish(g, R) {
    // a rope ladder to the jars
    A.line(g, 885, 612, 893, 540, 1.3, '#b98a54'); A.line(g, 897, 612, 903, 540, 1.3, '#b98a54');
    for (let i = 1; i < 6; i++) { const u = i / 6; A.line(g, lerp(885, 893, u), lerp(612, 540, u), lerp(897, 903, u), lerp(612, 540, u), 1.6, K.WOOD.front); }
    // a tin of plankton
    ink(g, A.rr(826, 600, 12, 12, 2), '#7a9ab0', 1); g.fillStyle = '#f2e6b0'; g.fillRect(828, 603, 8, 3);
  },
  update(dt, t, L, R) { R.act.step(dt); R.bright = Drawn.ease(R.bright, L.hovered ? 1 : 0, 3, dt); },
  draw(g, t, L, R) {
    const b = R.bright;
    for (const [x, y, s, k] of [[842, 548, 0.8, 10], [866, 566, 0.9, 11], [858, 530, 0.7, 12], [878, 548, 0.65, 13]]) K.lampJar(g, x, y + Math.sin(t * 1.2 + k) * 1.5, s, t * (1 + b * 1.5), k, b + A.flare(8));
    const fd = R.act.is('feed');
    C.shrimp(g, 892, 588 - (fd >= 0 ? A.bump(fd) * 18 : 0), 0.55, { t, flip: true, blink: R.blink(t), look: fd >= 0 ? [-0.6, -0.8] : look(892, 570), reach: fd >= 0 ? [-14, -18 - A.bump(fd) * 6] : [-6, -4], legs: 0.3 });
    if (fd > 0.4 && fd < 0.7 && Math.random() < 0.3) A.spawn({ kind: 'spark', x: 872, y: 556, vy: 6, size: 0.25, life: 0.6 });
  },
});
})();
