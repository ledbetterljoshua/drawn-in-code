/* The Chambered Ark — a giant nautilus drifting over a sunlit reef, sliced along its midplane so we
   see its spiral of chambers and the small crew who keep it afloat, inside and outside at once.

   Files, in load order: kit.js (this: geometry, palettes, the bob, helpers) · sea.js (water, reef,
   kelp, eels) · shell.js (the shell's two sprites, bubble-mail, the wrasse) · crew.js (rigs) ·
   rooms.js (outer rooms + the room kit) · rooms-inner.js (inner rooms, the pearl) · animal.js (the
   nautilus) · visitors.js (turtle, school, jellies) · life.js (particles, grade).

   Reactions (hover unless it says otherwise; "linger" is a second beat after staying):
    1  wheelhouse: the captain spins the wheel hard over and the whole ark swings with the turn
    2  wheelhouse, linger: he calls down the speaking tube, a bubble runs the siphuncle, the nautilus blinks
    3  galley: the octopus juggles a pan, a fish cake and a jar
    4  galley, linger: a sand-dollar pancake flipped high, hearts
    5  pump room: the shrimp runs the treadwheel, the gauge climbs and the whole ark rises in the water
    6  pump room, linger: the engineer pulls the whistle, a gout of bubbles
    7  observatory: the telescope through the roof swings to follow the pointer (also when it's near)
    8  observatory, linger: the goby sees something and jumps, a spark at the lens
    9  library: the snail turns a page and looks up over her spectacles
   10  library, linger: a bookworm rears out of the top shelf
   11  garden: the anemones open and wave, the nudibranch waters them with bubbles
   12  garden, linger: a tiny shrimp peeks out of the pink anemone
   13  bunk room: one seahorse wakes, yawns and looks at you; the perch sways
   14  band room: the puffer blows the conch, the crab drums, notes rise
   15  band room, linger: the long note puffs the puffer up, spines out
   16  lamp room: every jelly in every jar pulses brighter and swims faster
   17  bath: the crab scrubs, bubbles; linger: ducks under
   18  laundry: the line bounces; linger: a sock blows off
   19  post room: the stamp hammers faster and letters go out along the tube
   20  studio: the squid paints; linger: an inky sneeze
   21  nursery: the scallop cradle rocks; tea room: two cups clink
   22  storeroom: the isopod freezes, then sneaks another lick of jam
   23  net loft: the shuttle flies; cupboard: the octopus in the jar opens an eye
   24  parlour: the old snail rocks faster and the yarn rolls off; study: the candle gutters
   25  pearl room: the found pearls shine in turn; hammock: it swings
   26  the first pearl: a chime, and a ring of light runs out along the spiral, every lamp in turn
   27  the nautilus: her eye follows the pointer everywhere; hover: the cirri reach and curl round it
   28  the nautilus, linger (or tap): a slow blink and a jet from her funnel that nudges the ark back
   29  the cleaner wrasse darts off the shell and comes back to work
   30  the turtle stops rowing and turns its head to look; linger: a slow blink
   31  moon jellies pulse hard and dart upward
   32  untouched: garden eels duck into the sand when the pointer comes near
   33  untouched: the fusilier school scatters from the pointer
   34  untouched: kelp fronds are pushed along by the pointer moving past
   35  untouched: the pointer trails bubbles when it moves fast through open water
   Idle, everywhere: the ark bobs on its buoyancy, bubble-mail rides the siphuncle, every creature
   blinks and has its own idle (stirring, reading, snoring z's, steam, the jellies swimming), one
   current leans the kelp, eels, grass and bubbles, caustics wobble on the sand and the shell. */

/* kit.js — what every part of the Chambered Ark shares: the shell's spiral geometry (one logarithmic
   spiral, the septa and the chamber outlines every room is clipped to), the palettes, the ark's bob
   (the whole shell rises and sinks on its buoyancy, and everything inside it moves with it), and the
   little motion helpers (springs, idle actors, bumps).

   Screen angles: 0 is right, π/2 is down. The spiral grows clockwise on screen and ends at the
   aperture on the left, where the nautilus looks out. */
(() => {
const { TAU, clamp, lerp, rng, noise } = Drawn;
const A = (window.ARK = {});

// ------------------------------------------------------------------ palette
A.LINE = Drawn.style.line = '#33213a';
A.INK = '#33213a';         // the drawing's ink
A.INK_IN = '#4e3346';      // inside the shell: a lighter, warmer ink, so the rooms don't turn to mush
A.withInk = (ink, fn) => { const was = A.LINE; A.LINE = ink; try { fn(); } finally { A.LINE = was; } };
A.SEA = { top: '#bfe6d8', hi: '#86cfc6', mid: '#3c9ea5', low: '#246f86', deep: '#183f63', fog: '#5fb0b2' };
A.SAND = { lit: '#f1d9a4', base: '#d9b98a', shade: '#9e8f86', deep: '#6d6f7c', ripple: '#c7a77d' };
A.SHELL = { lit: '#fff7e8', base: '#f2e3c9', shade: '#c8b9a6', deep: '#8f8b8f', stripe: '#b5552f', stripeDk: '#843a26', stripeLt: '#d77a48' };
A.NACRE = { base: '#eadfe4', pink: '#f4d3d8', mint: '#cfeee2', lilac: '#d8d0f0', gold: '#f7e6bf', shade: '#a79bb3', deep: '#6f6788' };
A.WOOD = { base: '#a8693f', dark: '#6f4130', light: '#d49660', grain: '#5a3326' };
A.GLOW = { core: '#fff6cf', warm: '#ffd88a', amber: '#f4a95a' };

// ------------------------------------------------------------------ the spiral
A.C = [905, 445];           // the spiral's centre
A.Rm = 548;                 // radius at the aperture's outer lip
A.K = 2.7;                  // the whorl grows this much per turn
A.thE = Math.PI / 2 + 0.25;      // the aperture's angle
A.Wb = 1.38;                // the body chamber: left whole, it shows the outside of the shell
A.N = 11;                   // chambers per turn
A.dTh = TAU / A.N;
A.tw = 0.052;               // outer wall thickness, as a share of the radius
A.R = (th) => A.Rm * Math.pow(A.K, (th - A.thE) / TAU);
A.pt = (th, r) => [A.C[0] + r * Math.cos(th), A.C[1] + r * Math.sin(th)];
A.ri = (th) => A.R(th - TAU);
A.ro = (th) => A.R(th) * (1 - A.tw);

const qb = (p0, c, p1, u) => [(1 - u) * (1 - u) * p0[0] + 2 * (1 - u) * u * c[0] + u * u * p1[0], (1 - u) * (1 - u) * p0[1] + 2 * (1 - u) * u * c[1] + u * u * p1[1]];

// septa, newest (k = 0, at the back of the body chamber) to oldest
A.septa = [];
for (let k = 0; ; k++) {
  const th = A.thE - A.Wb - k * A.dTh;
  if (A.R(th) < 7) break;
  const a = A.pt(th, A.ri(th)), b = A.pt(th, A.ro(th));
  const c = A.pt(th - A.dTh * 0.5, (A.ri(th) + A.ro(th)) / 2);
  const pts = [];
  for (let i = 0; i <= 10; i++) pts.push(qb(a, c, b, i / 10));
  A.septa.push({ k, th, pts });
}

function arc(th0, th1, rf, n) {
  const out = [];
  for (let i = 0; i <= n; i++) { const th = lerp(th0, th1, i / n); out.push(A.pt(th, rf(th))); }
  return out;
}
const toPath = (pts) => { const p = new Path2D(); pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y))); p.closePath(); return p; };
A.toPath = toPath;

// chamber k lies between septum k+1 (older) and septum k
A.chambers = [];
for (let k = 0; k < A.septa.length - 1; k++) {
  const s0 = A.septa[k + 1], s1 = A.septa[k];
  const poly = [...s0.pts, ...arc(s0.th, s1.th, A.ro, 12).slice(1, -1), ...s1.pts.slice().reverse(), ...arc(s1.th, s0.th, A.ri, 12).slice(1, -1)];
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9, sx = 0, sy = 0;
  for (const [x, y] of poly) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); sx += x; sy += y; }
  const thm = (s0.th + s1.th) / 2;
  A.chambers.push({
    k, poly, path: toPath(poly), box: { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 },
    c: [sx / poly.length, sy / poly.length], th0: s0.th, th1: s1.th, thm,
    rIn: A.ri(thm), rOut: A.ro(thm), size: A.ro(thm) - A.ri(thm),
  });
}

// the shell's silhouette: the last whorl's outer edge, then across the aperture
A.outline = (() => {
  const pts = arc(A.thE - TAU, A.thE, A.R, 120);
  pts.push(A.pt(A.thE, A.ri(A.thE)));
  return pts;
})();
A.outlinePath = toPath(A.outline);
// the body chamber, left whole: the outer whorl from the last septum round to the aperture
A.wedge = (() => {
  const th0 = A.thE - A.Wb;
  return [...arc(th0, A.thE, A.R, 50), ...arc(A.thE, th0, A.ri, 40)];
})();
A.wedgePath = toPath(A.wedge);

// where a horizontal line at y crosses a polygon: [xmin, xmax] of the span holding x (or the widest)
A.span = (poly, y, near) => {
  const xs = [];
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length];
    if ((ay <= y && by > y) || (by <= y && ay > y)) xs.push(ax + ((y - ay) / (by - ay)) * (bx - ax));
  }
  xs.sort((a, b) => a - b);
  let best = null;
  for (let i = 0; i + 1 < xs.length; i += 2) {
    const s = [xs[i], xs[i + 1]];
    if (near != null && near >= s[0] && near <= s[1]) return s;
    if (!best || s[1] - s[0] > best[1] - best[0]) best = s;
  }
  return best || [0, 0];
};

// ------------------------------------------------------------------ the bob
// the ark rides its buoyancy: A.lift is added by the pump room, A.bob is the offset everything in
// the shell is drawn with
A.lift = 0; A.bob = 0; A.tilt = 0;
A.liftT = 0;
A.tiltExtra = 0; A.nudge = 0; A.dx = 0; A.dxV = 0; A.tiltT = 0;
A.stepBob = (dt, t) => {
  A.liftT = Drawn.ease(A.liftT, A.lift, 0.9, dt);
  A.bob = 5 * Math.sin(t * 0.55) + 2.4 * Math.sin(t * 1.13 + 1) - A.liftT;
  A.tiltT = Drawn.ease(A.tiltT, A.tiltExtra, 1.2, dt);
  A.tilt = 0.006 * Math.sin(t * 0.41 + 0.6) + A.tiltT;
  // the nautilus' jet pushes the ark back a little, and it drifts home again
  A.dxV += (A.nudge * 30 - A.dx * 2.2 - A.dxV * 2.4) * dt;
  A.dx += A.dxV * dt;
};
// draw something in shell space (bobbing with the ark)
// The ark is drawn in its own "shell space" (the geometry above) and placed on the artboard a little
// larger and higher (A.SC, A.OFF). Translate and scale only: rotating the shell's big sprites every
// frame costs more than the rest of the frame.
A.SC = 1.12; A.OFF = [-28, -12];
const shellX = () => A.C[0] + A.OFF[0] + Math.round((A.dx + A.tiltT * 400) * 4) / 4;
const shellY = () => A.C[1] + A.OFF[1] + Math.round(A.bob * 4) / 4;
A.inShell = (g, fn) => {
  g.save();
  g.translate(shellX(), shellY()); g.scale(A.SC, A.SC); g.translate(-A.C[0], -A.C[1]);
  fn();
  g.restore();
};
// a pointer position (artboard) in shell space, and back
A.toShell = (x, y) => [(x - shellX()) / A.SC + A.C[0], (y - shellY()) / A.SC + A.C[1]];
A.fromShell = (x, y) => [(x - A.C[0]) * A.SC + shellX(), (y - A.C[1]) * A.SC + shellY()];
A.hitIn = (path) => (x, y) => { const [sx, sy] = A.toShell(x, y); return A.hitCtx.isPointInPath(path, sx, sy); };
A.hitCtx = document.createElement('canvas').getContext('2d');

// ------------------------------------------------------------------ motion helpers
A.smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
A.bump = (u) => (u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI));
// a 0 → 1 → 0 envelope over [a, b] with soft ends
A.env = (u, a = 0.15, b = 0.85) => (u <= 0 || u >= 1 ? 0 : Math.min(A.smooth(u / a), A.smooth((1 - u) / (1 - b))));
A.spring = (k = 60, d = 9, x = 0) => ({
  x, v: 0, target: x,
  step(dt) { const n = 3, h = dt / n; for (let i = 0; i < n; i++) { this.v += (-k * (this.x - this.target) - d * this.v) * h; this.x += this.v * h; } return this.x; },
});
// idle actions on a random clock: one at a time, progress u ∈ [0, 1] while it plays
A.actor = (seed, acts, gap = [3, 8]) => {
  const r = rng(seed);
  let wait = gap[0] * 0.4 + r() * gap[1] * 0.6;
  return {
    name: null, u: 0, dur: 1, r,
    step(dt) {
      if (this.name) { this.u += dt / this.dur; if (this.u >= 1) { this.name = null; this.u = 0; wait = gap[0] + r() * (gap[1] - gap[0]); } }
      else if ((wait -= dt) <= 0) { const [n, d] = acts[Math.floor(r() * acts.length)]; this.name = n; this.dur = d; this.u = 0; }
    },
    is(n) { return this.name === n ? this.u : -1; },
    play(n, d) { this.name = n; this.dur = d; this.u = 0; },
  };
};
// a reaction that runs once per hover: start() on enter, u climbs 0 → 1 over dur
A.beat = (dur) => ({ u: 1, dur, on: false, start() { this.u = 0; }, step(dt) { if (this.u < 1) this.u = Math.min(1, this.u + dt / this.dur); }, get live() { return this.u < 1; } });

A.rr = (x, y, w, h, r, p = new Path2D()) => {
  r = Math.min(r, w / 2, h / 2);
  p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r); p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
  return p;
};
A.stroke = (g, pts, lw, color, closed = false) => {
  color = color || A.LINE;
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  if (closed) g.closePath();
  g.lineWidth = lw; g.strokeStyle = color; g.stroke();
};
A.line = (g, x0, y0, x1, y1, lw, color) => {
  color = color || A.LINE; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = lw; g.strokeStyle = color; g.stroke(); };

// the engine's lumps() is lit from the upper right; this sea is lit from the upper left, so mirror it
A.lumps = (g, circles, col, flatY) => {
  let cx = 0; for (const c of circles) cx += c[0]; cx /= circles.length;
  g.save(); g.translate(cx * 2, 0); g.scale(-1, 1);
  Drawn.lumps(g, circles, col, flatY);
  g.restore();
};

// particles every part can spawn (bubbles, notes, sparkles…); life.js draws them
A.fx = [];
A.spawn = (p) => A.fx.push(Object.assign({ age: 0, life: 2, vx: 0, vy: 0, size: 1, kind: 'bubble', shell: true }, p));
})();
