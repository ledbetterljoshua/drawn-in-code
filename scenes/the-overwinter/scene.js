/* scene.js — The Overwinter: the falling snow over everything, and the start.
   The snow is fine and dry, three depths of it, all leaning on the shared wind; near the pointer it
   swirls aside. z 40. */
(() => {
const { TAU, clamp, rng, wind, st, P, layer } = Drawn;
const flakes = [];
{
  const R = rng(11);
  for (let i = 0; i < 420; i++) flakes.push({ x: R(), y: R(), d: R() ** 1.6, ph: R() * TAU, vx: 0, vy: 0 });
}
layer({
  id: 'snow', z: 40,
  update(dt, t) {
    const v = st.view, W = v.x1 - v.x0, H = v.y1 - v.y0;
    for (const f of flakes) {
      const sp = 0.25 + f.d * 0.75;
      const w = wind(t, f.x * W);
      f.y += (dt * (22 + 40 * sp)) / H;
      f.x += (dt * (w * 26 * sp + Math.sin(t * 0.9 + f.ph) * 6)) / W;
      // the pointer stirs them
      const px = v.x0 + f.x * W, py = v.y0 + f.y * H, dx = px - P.x, dy = py - P.y, r2 = dx * dx + dy * dy;
      if (P.inside && r2 < 4900) { const k = (1 - r2 / 4900) * dt * 60; f.vx += (dx / 70) * k + P.vx * 0.002 * k; f.vy += (dy / 70) * k; }
      f.vx *= 1 - dt * 2.5; f.vy *= 1 - dt * 2.5;
      f.x += (f.vx * dt) / W * 60; f.y += (f.vy * dt) / H * 60;
      if (f.y > 1.02) { f.y = -0.02; f.x = Math.random(); }
      if (f.x > 1.02) f.x -= 1.04; else if (f.x < -0.02) f.x += 1.04;
    }
  },
  draw(g) {
    const v = st.view, W = v.x1 - v.x0, H = v.y1 - v.y0;
    g.fillStyle = '#eef0fb';
    for (const f of flakes) {
      const r = 0.5 + f.d * 1.5;
      g.globalAlpha = 0.35 + f.d * 0.55;
      g.fillRect(v.x0 + f.x * W - r / 2, v.y0 + f.y * H - r / 2, r, r);
    }
    g.globalAlpha = 1;
  },
});

Drawn.start({ W: OW.W, H: OW.H, hint: 'tap a drawer to wake its guest' });
})();
