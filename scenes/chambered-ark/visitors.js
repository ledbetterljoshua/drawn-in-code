/* visitors.js — the reef's own life drifting past the ark: an old green turtle cruising across the
   open water on the left, a school of silver fusiliers that wheels about and scatters from the
   pointer, and two moon jellies pulsing slowly up toward the light.

   Turtle hover: it stops rowing and turns its head to look at you; linger: a slow blink.
   Fish: they flee the pointer without a hover. Jelly hover: it pulses hard and darts upward.

   turtle z18 (behind the kelp) · school z22 · jellies z24 — all behind the ark, fogged by distance. */
(() => {
const { TAU, lerp, clamp, rng, noise, circ, ell, curve, poly, grad, radial, P, st, layer, wind } = Drawn;
const A = window.ARK, LINE = A.LINE, C = A.crew, ink = C.ink, mix = A.mix;
const FOG = '#4c9fa9';
const fog = (c, f) => mix(c, FOG, f);

// ------------------------------------------------------------------ the turtle
const T = { x: 520, y: 360, vx: -9, head: 0, row: 0, rowSp: 1, look: [0, 0], blink: Drawn.blinker(3, 5), slow: 0 };
const TC = (f) => ({ shell: fog('#7d6a3a', f), scute: fog('#a8904e', f), scuteDk: fog('#5a4a2a', f), skin: fog('#b8a47a', f), skinSh: fog('#8a7a5a', f), spot: fog('#6a5a3a', f), belly: fog('#e6d8a8', f), line: fog('#3a2a30', f * 0.8) });
const tc = TC(0.38);
function flipper(g, x, y, len, a, w, c) {
  g.save(); g.translate(x, y); g.rotate(a);
  const F = curve([[0, -w * 0.4], [len * 0.4, -w * 0.6], [len, -w * 0.15], [len * 0.95, w * 0.2], [len * 0.4, w * 0.5], [0, w * 0.4]]);
  g.fillStyle = c.skin; g.fill(F); g.lineWidth = 1.3; g.strokeStyle = c.line; g.stroke(F);
  g.fillStyle = c.spot; for (let i = 1; i < 5; i++) g.fill(ell(len * i * 0.2, 0, 2.2, 1.6));
  g.restore();
}
layer({
  id: 'turtle', z: 18,
  hit(x, y) { return Math.hypot((x - T.x) / 1.6, y - T.y) < 55; },
  update(dt, t, L) {
    T.slow = Drawn.ease(T.slow, L.hovered ? 1 : 0, 2, dt);
    T.x += T.vx * (1 - T.slow * 0.85) * dt;
    T.y = 360 + Math.sin(t * 0.21) * 30;
    if (T.x < st.view.x0 - 200) T.x = st.view.x1 + 200;
    T.rowSp = lerp(1, 0.15, T.slow);
    T.row += dt * 1.3 * T.rowSp;
    const dx = P.x - (T.x - 70), dy = P.y - T.y, d = Math.hypot(dx, dy) || 1;
    const k = L.hovered ? 1 : 0;
    T.look[0] = Drawn.ease(T.look[0], (dx / d) * k, 4, dt); T.look[1] = Drawn.ease(T.look[1], (dy / d) * k, 4, dt);
    T.head = Drawn.ease(T.head, L.hovered ? clamp(Math.atan2(dy, -dx), -0.5, 0.5) : 0, 3, dt);
    T.lingerBlink = L.hovered && L.since > 1.4 && L.since < 2.1;
  },
  draw(g, t) {
    const c = tc, s = 1;
    g.save(); g.translate(T.x, T.y); g.rotate(-0.06 + Math.sin(t * 0.3) * 0.03);
    const row = Math.sin(T.row * TAU * 0.25);
    // far flippers first
    flipper(g, -18, 6, 60, 2.5 + row * 0.5, 18, TC(0.5));
    flipper(g, 46, 10, 24, 0.7 + row * 0.2, 12, TC(0.5));
    // the carapace: a low dome of plates
    const shell = curve([[-56, 4], [-46, -20], [-10, -32], [30, -28], [58, -10], [62, 6], [30, 14], [-30, 14]]);
    g.fillStyle = c.shell; g.fill(shell);
    g.save(); g.clip(shell);
    g.fillStyle = c.belly; g.fillRect(-70, 8, 140, 10);
    const sc = [[-30, -14], [-4, -20], [22, -16], [44, -6], [-42, -2], [-16, -6], [10, -6], [34, 2]];
    for (const [x, y] of sc) { g.fillStyle = c.scute; g.fill(poly([[x - 11, y], [x - 6, y - 8], [x + 6, y - 8], [x + 11, y], [x + 6, y + 8], [x - 6, y + 8]])); g.lineWidth = 0.9; g.strokeStyle = c.scuteDk; g.stroke(poly([[x - 11, y], [x - 6, y - 8], [x + 6, y - 8], [x + 11, y], [x + 6, y + 8], [x - 6, y + 8]])); }
    g.fillStyle = 'rgba(255,250,220,0.25)'; g.fill(ell(-14, -24, 34, 7));
    g.restore();
    g.lineWidth = 1.6; g.strokeStyle = c.line; g.stroke(shell);
    // the head, turning toward you when hovered
    g.save(); g.translate(-56, -2); g.rotate(T.head);
    const H = curve([[4, -8], [-14, -10], [-26, -5], [-28, 2], [-18, 7], [4, 8]]);
    g.fillStyle = c.skin; g.fill(H); g.lineWidth = 1.4; g.strokeStyle = c.line; g.stroke(H);
    g.fillStyle = c.spot; for (const [x, y] of [[-10, -6], [-4, 2], [-16, 0]]) g.fill(ell(x, y, 2, 1.4));
    const bl = T.lingerBlink ? 0 : T.blink(t);
    if (bl < 0.2) { A.line(g, -22, -3, -16, -3, 1.2, c.line); }
    else { g.fillStyle = '#f6efe0'; g.fill(ell(-19, -3, 3, 2.6)); g.fillStyle = c.line; g.fill(circ(-19 + T.look[0] * 1.2 - 0.6, -3 + T.look[1], 1.6)); }
    A.line(g, -28, 2, -22, 3, 1, c.line);
    g.restore();
    // near flippers
    flipper(g, -26, 8, 70, 2.3 - row * 0.6, 20, c);
    flipper(g, 50, 10, 26, 0.5 - row * 0.25, 13, c);
    g.restore();
  },
});

// ------------------------------------------------------------------ the school
const school = [];
{ const r = rng(1234); for (let i = 0; i < 34; i++) school.push({ x: 300 + r() * 200, y: 520 + r() * 120, vx: 0, vy: 0, ph: r() * TAU, k: r(), s: 0.7 + r() * 0.5 }); }
const SC = { body: fog('#cfdde6', 0.25), back: fog('#5a7fa8', 0.25), tail: fog('#f2cf4b', 0.25) };
layer({
  id: 'school', z: 22,
  update(dt, t) {
    // the school's centre wheels round a slow loop in the open water on the left
    const cx = 320 + Math.sin(t * 0.11) * 160, cy = 560 + Math.sin(t * 0.17 + 1) * 120;
    for (const f of school) {
      const a = t * 0.6 + f.k * TAU;
      const tx = cx + Math.cos(a) * (60 + f.k * 70), ty = cy + Math.sin(a) * (24 + f.k * 30);
      f.vx += ((tx - f.x) * 0.9 - f.vx * 0.9) * dt; f.vy += ((ty - f.y) * 0.9 - f.vy * 0.9) * dt;
      // scatter from the pointer
      const dx = f.x - P.x, dy = f.y - P.y, d = Math.hypot(dx, dy);
      if (P.inside && d < 130) { const push = (1 - d / 130) * 900; f.vx += (dx / (d || 1)) * push * dt; f.vy += (dy / (d || 1)) * push * dt; }
      const sp = Math.hypot(f.vx, f.vy); if (sp > 260) { f.vx *= 260 / sp; f.vy *= 260 / sp; }
      f.x += f.vx * dt; f.y += f.vy * dt;
    }
  },
  draw(g, t) {
    for (const f of school) {
      const a = Math.atan2(f.vy, f.vx), wag = Math.sin(t * 9 + f.ph) * 0.3;
      g.save(); g.translate(f.x, f.y); g.rotate(a); g.scale(f.s, f.s * (Math.cos(a) < 0 ? -1 : 1));
      g.fillStyle = SC.tail; g.fill(poly([[-8, 0], [-14, -4 + wag * 3], [-13, 0], [-14, 4 + wag * 3]]));
      const B = ell(0, 0, 9, 3.2);
      g.fillStyle = SC.body; g.fill(B);
      g.fillStyle = SC.back; g.fill(ell(0, -1.4, 8, 1.4));
      g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill(ell(1, 1, 6, 0.8));
      g.lineWidth = 0.8; g.strokeStyle = fog('#2a3a50', 0.3); g.stroke(B);
      g.fillStyle = '#1a2a3a'; g.fill(circ(5.5, -0.6, 0.9));
      g.restore();
    }
  },
});

// ------------------------------------------------------------------ moon jellies
const jellies = [{ x: 1340, y: 640, ph: 0, s: 1, v: 0 }, { x: 160, y: 180, ph: 2, s: 0.8, v: 0 }];
for (const [i, J] of jellies.entries()) {
  layer({
    id: 'jelly-' + i, z: 24,
    hit: (x, y) => Math.hypot(x - J.x, y - J.y) < 34 * J.s,
    onEnter() { J.v = -60; },
    update(dt, t, L) {
      J.ph += dt * (L.hovered ? 5 : 1.4);
      J.v += (-8 - J.v) * dt * 0.8 + (L.hovered ? -40 * dt : 0);
      J.y += J.v * dt * 0.4 + Math.sin(J.ph) * 4 * dt;
      J.x += (wind(t, J.x) * 6) * dt;
      if (J.y < A.SURF - 60) { J.y = 1000; J.x = J === jellies[0] ? 1300 + Math.random() * 120 : 100 + Math.random() * 160; }
      if (J.x > st.view.x1 + 60) J.x = st.view.x0 - 40;
    },
    draw(g, t) {
      const p = Math.sin(J.ph), s = J.s;
      g.save(); g.translate(J.x, J.y); g.scale(s, s);
      const w = 30 + p * 4, h = 18 - p * 3;
      // trailing arms and fringe
      g.lineWidth = 1; g.strokeStyle = 'rgba(240,220,255,0.55)';
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * w * 0.28, 2); g.bezierCurveTo(i * w * 0.3 + Math.sin(t * 2 + i) * 4, 18, i * w * 0.2 - Math.sin(t * 1.6 + i) * 5, 34, i * w * 0.24, 48 + p * 4); g.stroke(); }
      for (let i = -1; i <= 1; i += 2) { const pts = []; for (let k = 0; k < 6; k++) pts.push([i * 5 + Math.sin(t * 1.4 + k + i) * 4, 4 + k * 8]); A.stroke(g, pts, 3, 'rgba(250,220,240,0.5)'); }
      const B = new Path2D(); B.ellipse(0, 0, w, h, 0, Math.PI, 0); B.quadraticCurveTo(0, 5 - p * 2, -w, 0); B.closePath();
      g.fillStyle = 'rgba(235,225,255,0.42)'; g.fill(B);
      g.lineWidth = 1.3; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke(B);
      // the four pale rings
      g.strokeStyle = 'rgba(250,190,220,0.75)'; g.lineWidth = 1.6;
      for (let i = 0; i < 4; i++) { const a = Math.PI + (i + 0.5) * (Math.PI / 4); g.beginPath(); g.arc(Math.cos(a) * w * 0.45, Math.sin(a) * h * 0.4, 4, 0, TAU); g.stroke(); }
      g.restore();
    },
  });
}
})();
