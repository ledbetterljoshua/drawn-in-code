/* scene.js — The Overwinter. At the lowest tide of the year a causeway opens to a sea stack whose
   face is a cliff of filing drawers; white stoat night porters ride library ladders tending the
   hibernating guests. This file holds the falling snow and the start; the parts are:
   world.js (camera, palette, the cabinet layout) · sky.js · stack.js · guests.js (drawers, sleepers,
   the yawn) · porters.js · shore.js · foot.js (reception, hedgehogs, gull) · top.js (cupola).

   Reactions — hover (h), tap (t), linger (l), idle (i), pointer-aware (p):
    1. h  drawer: the sleeper rolls over, snores a paper Z, the drawer lifts a crack
    2. l  drawer: its luggage tag lifts toward you so you can read the wake condition
    3. t  drawer (or l 2.6 s): the guest wakes, squints at its own tag, yawns a cold breath
    4. —  the yawn is contagious: it spreads drawer to drawer, downhill more readily
    5. —  the nearest porter races along its rail and cranks a punch-card music box; notes rise
    6. —  reach the bear cub and it sits up: the stack shudders, snow falls, every porter freezes
    7. h  feather porter: puts a paw to its lips (shh); the dormouse's nose twitches… and it sneezes
    8. h  any porter: shh; l: tips its red cap
    9. p  porters' eyes follow the pointer when it comes near
   10. h  bats: they all turn together like closed umbrellas; l: one lets go with a foot and dangles
   11. h  kettle: comes down its rope a little way, the pulley turns, it steams harder
   12. h  cupola: the cockerel vane tries to crow, its nightcap slips over its eyes; the vane spins
   13. h/t reception bell: ding — every porter on the cliff glares down
   14. h  card index: a drawer slides out and the index cards riffle
   15. h  desk porter: looks up over its spectacles
   16. h  hedgehogs: the last one breaks into a run, suitcase bumping; i: at high tide it hurries anyway
   17. i  the gull glides in, lands on the bell, dings it, gets glared at; h: it leaves at once
   18. h  the flats: rings spread on the incoming tide from the pointer
   19. h  causeway lamp: it gutters and its reflection shivers; the lamp swings from your push
   20. h  bare rock: a little snow and a chip of stone come off the seam above the pointer
   21. h  far lighthouse: the beam slows and stares
   22. h  Venus / a low star: it brightens and throws a glint
   23. p  falling snow swirls aside around the pointer
   24. i  sleepers breathe and snore; one now and then stirs on its own
   25. i  porters idle on their own clocks: glance round, blow on their paws (breath), ride the
          ladder a little way, climb a rung, yawn
   26. i  tags, lamps and the kettle swing in one shared wind; the tide creeps in and out
   27. i  the hush lamps flicker; the lighthouse sweeps; glints move on the afterglow */
(() => {
const { TAU, clamp, rng, wind, st, P, layer } = Drawn;
const flakes = [];
{
  const R = rng(11);
  for (let i = 0; i < 360; i++) flakes.push({ x: R(), y: R(), d: R() ** 1.6, ph: R() * TAU, vx: 0, vy: 0 });
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
      const r = 0.8 + f.d * 2.2;
      g.globalAlpha = 0.4 + f.d * 0.55;
      g.fillRect(v.x0 + f.x * W - r / 2, v.y0 + f.y * H - r / 2, r, r);
    }
    g.globalAlpha = 1;
    // a few near flakes, big and soft, drifting past the lens
    for (const f of near) {
      g.globalAlpha = 0.5;
      g.fill(Drawn.circ(v.x0 + f.x * W, v.y0 + f.y * H, f.r));
    }
    g.globalAlpha = 1;
  },
});
const near = [];
{ const R = rng(12); for (let i = 0; i < 26; i++) near.push({ x: R(), y: R(), r: 2 + R() * 2.4, ph: R() * TAU }); }
layer({
  id: 'snow-near', z: 39,
  update(dt, t) {
    const v = st.view, W = v.x1 - v.x0, H = v.y1 - v.y0;
    for (const f of near) { f.y += (dt * 70) / H; f.x += (dt * (wind(t, f.x * W) * 50 + Math.sin(t + f.ph) * 14)) / W; if (f.y > 1.03) { f.y = -0.03; f.x = Math.random(); } if (f.x > 1.03) f.x -= 1.06; }
  },
  draw() {},
});

Drawn.start({ W: OW.W, H: OW.H, hint: 'tap a drawer to wake its guest' });
})();
