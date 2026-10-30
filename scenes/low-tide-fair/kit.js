/* kit.js — what every part of the fair shares: the ground plane and its perspective, the light,
   the palette, colour mixing for distance haze, cast and contact shadows, the idle-action clock,
   pendulums, a particle pool, and the rigs for the small folk (otters, voles, moles, hares),
   puffins, crabs and gulls. Parts draw with these so they all stand on the same sand in the same
   sun. Plain script: it fills window.Fair. */
(() => {
const D = Drawn;
const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, ink, grad, radial, st, P } = D;
const F = (window.Fair = {});

// ------------------------------------------------------------ the world
// A 2200 × 1100 artboard. The eye stands about eleven folk tall above the sand (a dune behind us),
// so the horizon sits at y = 380 and we look down across the flats. Anything standing on the sand
// at screen y is drawn at pxu(y) pixels per world unit; a folk is 30 units tall.
F.W = 2200; F.H = 1100; F.HZ = 380; F.EYE = 333;
F.pxu = (y) => Math.max(0.02, (y - F.HZ) / F.EYE);
// how squashed a circle lying on the sand looks at depth y (ry / rx)
F.flat = (y) => clamp((y - F.HZ) / 1350, 0.03, 0.6);
// 0 near, 1 at the horizon: how much haze lies between us and something at depth y
F.far = (y) => clamp(1 - (y - F.HZ) / 330, 0, 1) ** 1.6;

// the sun is low on the left and a little in front of us; shadows run right and slightly away
F.SUN = { x: -900, y: 120 };
F.SHX = 1.45; F.SHY = 0.16;

const LINE = (D.style.line = '#3b2433');
F.LINE = LINE;
F.HAZE = '#e6d5c9';

// ------------------------------------------------------------ colour
const hexRgb = (h) => { h = h.replace('#', ''); if (h.length === 3) h = [...h].map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mixCache = new Map();
// mix two hex colours (t = 0 → a, 1 → b); results are cached by 1/40 steps of t
F.mix = (a, b, t) => {
  t = Math.round(clamp(t, 0, 1) * 40) / 40;
  if (t === 0) return a;
  const k = a + b + t;
  let v = mixCache.get(k);
  if (!v) { const A = hexRgb(a), B = hexRgb(b); v = '#' + [0, 1, 2].map((i) => Math.round(lerp(A[i], B[i], t)).toString(16).padStart(2, '0')).join(''); mixCache.set(k, v); }
  return v;
};
F.rgba = (h, a) => { const [r, g, b] = hexRgb(h); return `rgba(${r},${g},${b},${a})`; };
// a palette pushed back into the haze by f (0..1)
F.hazed = (pal, f) => { if (f <= 0.001) return pal; const o = {}; for (const k in pal) o[k] = typeof pal[k] === 'string' && pal[k][0] === '#' ? F.mix(pal[k], F.HAZE, f) : pal[k]; return o; };
F.inkAt = (f) => F.mix(LINE, '#8f7f8f', f * 0.9);

// materials: each has a shade (cool, toward the sky's violet), a base and a lit (warm, toward the sun)
F.PAL = {
  sand: { shade: '#b49a92', base: '#dcbc96', lit: '#f0d4ab', ripple: '#c6a283', dry: '#e8cca2' },
  wet: { shade: '#a8939b', base: '#c4aeab', lit: '#e3d2c4', sheen: '#f3e8dc' },
  water: { deep: '#9fb8c2', base: '#c6d9d6', lit: '#f6ecd5', line: '#7f9fae' },
  drift: { shade: '#8e8592', base: '#bbaea3', lit: '#e3d6c2', grain: '#7b6e78' },
  rope: { base: '#c49a6a', dark: '#8a6446' },
  stone: { shade: '#5e5a77', base: '#86809a', lit: '#b4a6aa', deep: '#3f3a55' },
  weed: { dark: '#4e5a3a', base: '#7b7f45', lit: '#a9a05a', red: '#9a4b44' },
};
F.CLOTH = ['#d65a4a', '#e7a43c', '#4f8fa3', '#6f9d58', '#efe2c8', '#a8689b', '#3f6aa1', '#e07f62', '#f2c95c', '#5a7b8c'];

// ------------------------------------------------------------ shadows
// draw fn's shapes as a cast shadow of something standing with its feet at (x, y)
F.castShadow = (g, x, y, fn, alpha = 0.5) => {
  g.save();
  g.translate(x, y);
  g.transform(1, 0, -F.SHX, F.SHY, 0, 0);
  g.globalCompositeOperation = 'multiply';
  g.globalAlpha = alpha;
  g.fillStyle = '#7d6ca8';
  fn(g);
  g.restore();
};
// the dark pool right where a thing meets the sand
F.contact = (g, x, y, rx, a = 0.55) => {
  const ry = Math.max(1, rx * F.flat(y) * 1.3);
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = radial(g, 0, 0, 0, 1, [[0, `rgba(72,52,88,${a})`], [0.55, `rgba(80,60,100,${a * 0.6})`], [1, 'rgba(90,70,110,0)']]);
  g.translate(x + rx * 0.12, y); g.scale(rx, ry);
  g.fill(circ(0, 0, 1));
  g.restore();
};
// a canvas of a sprite's silhouette in one colour (for cast shadows and reflections)
F.silhouette = (sp, color) => {
  const c = document.createElement('canvas');
  c.width = sp.c.width; c.height = sp.c.height;
  const g = c.getContext('2d');
  g.drawImage(sp.c, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return { c, x0: sp.x0, y0: sp.y0, w: sp.w, h: sp.h };
};

// ------------------------------------------------------------ clocks
const bump = (F.bump = (u) => (u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI)));
F.smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
// random idle actions: every few seconds one of names ([name, seconds]) plays; is(name) is its
// progress 0..1, or -1 when it isn't playing
F.actor = (seed, names, gap = [2.5, 7]) => {
  const r = rng(seed * 7919 + 13);
  let wait = gap[0] * 0.3 + r() * gap[1];
  return {
    name: null, u: 0, dur: 1, side: 1, r,
    step(dt) {
      if (this.name) {
        this.u += dt / this.dur;
        if (this.u >= 1) { this.name = null; this.u = 0; wait = gap[0] + r() * (gap[1] - gap[0]); }
      } else if ((wait -= dt) <= 0) {
        const pick = names[Math.floor(r() * names.length)];
        this.name = pick[0]; this.dur = pick[1]; this.u = 0; this.side = r() < 0.5 ? -1 : 1;
      }
    },
    play(name, dur) { this.name = name; this.dur = dur; this.u = 0; },
    is(n) { return this.name === n ? this.u : -1; },
    b(n) { return this.name === n ? bump(this.u) : 0; },
  };
};
// eyes: a blink value 0 (shut) .. 1 (open) on a random clock; force() blinks now
F.blinker = (seed) => {
  const r = rng(seed * 31 + 7);
  let wait = 0.5 + r() * 4, ph = -1, v = 1;
  return {
    step(dt) {
      if (ph < 0) { if ((wait -= dt) <= 0) ph = 0; }
      else { ph += dt / 0.16; v = Math.abs(1 - 2 * Math.min(ph, 1)); if (ph >= 1) { ph = -1; v = 1; wait = r() < 0.2 ? 0.15 : 1.8 + r() * 4.5; } }
      return v;
    },
    get v() { return v; },
    force() { if (ph < 0) ph = 0; },
  };
};
// a damped pendulum leaning into the shared wind; kick() pushes it
F.pendulum = (o) => Object.assign({ a: 0, v: 0, k: 18, damp: 1.6, lean: 0.05, rest: 0, x: 0 }, o);
F.swing = (p, dt, t) => {
  const target = p.rest + D.wind(t, p.x) * p.lean + Math.sin(t * 1.3 + p.x * 0.01) * p.lean * 0.3;
  p.v += (-(p.a - target) * p.k - p.v * p.damp) * dt;
  p.a += p.v * dt;
  return p.a;
};
// a spring value toward a target
F.spring = (o) => Object.assign({ v: 0, x: 0, k: 60, d: 9 }, o);
F.springStep = (s, target, dt) => { s.v += ((target - s.x) * s.k - s.v * s.d) * dt; s.x += s.v * dt; return s.x; };

// the pointer, and how startling it is right now (fast moves startle)
F.pointerNear = (x, y, r) => P.inside && Math.hypot(P.x - x, P.y - y) < r;
F.startle = 0;
let pointerQuiet = 0;
F.tick = (dt) => {
  const fast = P.inside ? clamp((P.sp - 900) / 1800, 0, 1) : 0;
  F.startle = Math.max(F.startle * Math.exp(-1.6 * dt), fast);
  pointerQuiet = P.inside ? 0 : pointerQuiet + dt;
};

// ------------------------------------------------------------ particles
const fx = (F.fx = []);
F.spawn = (p) => { if (fx.length < 260) fx.push(Object.assign({ age: 0, life: 1.6, vx: 0, vy: 0, g: 0, rot: 0, vr: 0, size: 1, drag: 0 }, p)); };

// ------------------------------------------------------------ the small folk
// One upright rig, varied by species and clothes: otters, voles, moles and hares. Feet at (0, 0),
// head top at about -31 units; drawn at o.sc pixels per unit, facing o.dir (1 = right).
// pose: lean (rad), bob (units), armL/armR (rad from hanging down, positive swings forward),
// head (turn -1..1), look [x, y] for the eyes, blink 0..1, mouth 0 (closed) .. 1 (open),
// step (0..1 walking phase), crouch 0..1. o.hold(g, hand) draws a prop in the front hand.
const SPECIES = {
  otter: { fur: '#8b5a3b', shade: '#5e3b33', lit: '#b47e55', belly: '#e2c39c', nose: '#3b2433', ear: 'round', snout: 1.0, tail: 'otter' },
  vole: { fur: '#b07848', shade: '#7c5040', lit: '#d79c66', belly: '#ecd2ad', nose: '#d77d78', ear: 'big', snout: 0.8, tail: 'thin' },
  mole: { fur: '#4d4458', shade: '#332c40', lit: '#776b85', belly: '#6a5f78', nose: '#f0a0a8', ear: 'none', snout: 1.25, tail: 'stub' },
  hare: { fur: '#cfb18c', shade: '#9a7f72', lit: '#ead3ad', belly: '#f4e8d4', nose: '#d98a8c', ear: 'long', snout: 0.9, tail: 'puff' },
  shrew: { fur: '#7d6a62', shade: '#564650', lit: '#a39083', belly: '#d7c4b2', nose: '#e7a0a0', ear: 'small', snout: 1.5, tail: 'thin' },
};
F.SPECIES = SPECIES;

function limb(g, x0, y0, x1, y1, w, col, lw, line) {
  g.lineCap = 'round';
  g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1);
  if (lw) { g.lineWidth = w + lw * 2; g.strokeStyle = line; g.stroke(); }
  g.lineWidth = w; g.strokeStyle = col; g.stroke();
}
F.limb = limb;

F.folk = (g, x, y, o) => {
  const sp = SPECIES[o.sp || 'otter'];
  const hz = o.haze || 0;
  const c = hz ? F.hazed(sp, hz) : sp;
  const sc = o.sc, dir = o.dir || 1, px = 30 * sc; // px: height on screen
  const tiny = px < 16, small = px < 26;
  const line = o.line || F.inkAt(hz);
  const lw = clamp(1.6 / sc * (small ? 0.75 : 1), 0.4 / sc, 2.4 / sc) * (o.lwk || 1);
  const coat = hz ? F.mix(o.coat || '#d65a4a', F.HAZE, hz) : (o.coat || '#d65a4a');
  const coatSh = F.mix(coat, '#4a3a6a', 0.38);
  const acc = o.acc ? (hz ? F.mix(o.acc, F.HAZE, hz) : o.acc) : null;
  const lean = o.lean || 0, bob = o.bob || 0, crouch = o.crouch || 0;
  const step = o.step;

  g.save();
  g.translate(x, y);
  g.scale(sc * dir, sc);
  // legs (walking or standing) under the body
  const hipY = -7 + crouch * 2.5;
  const legs = step == null ? [[-3, 0], [3, 0]] : [[-3 + Math.sin(step * TAU) * 3.5, -Math.max(0, Math.cos(step * TAU)) * 2], [3 - Math.sin(step * TAU) * 3.5, -Math.max(0, -Math.cos(step * TAU)) * 2]];
  for (const [fx_, fy] of legs) limb(g, fx_ * 0.6, hipY, fx_, fy - 1, 3.6, c.shade, lw, line);
  for (const [fx_, fy] of legs) { const p = ell(fx_ + 1, fy - 0.8, 2.6, 1.4); ink(g, p, c.fur, lw * 0.8, line); }
  g.translate(0, bob + crouch * 3);
  g.rotate(lean);
  // tail behind
  if (sp.tail === 'otter') { const p = curve([[-4, -6], [-10, -4], [-15, 0], [-12, 0.6], [-6, -2]], true); ink(g, p, c.shade, lw, line); }
  else if (sp.tail === 'thin') { g.beginPath(); g.moveTo(-4, -6); g.quadraticCurveTo(-12, -6, -13, 0); g.lineWidth = 1.4; g.strokeStyle = c.nose; g.stroke(); }
  else if (sp.tail === 'puff') ink(g, circ(-6.5, -8, 2.8), c.belly, lw, line);
  // back arm (behind the body)
  const aB = o.armL == null ? 0.15 : o.armL, aF = o.armR == null ? -0.1 : o.armR;
  const sh = [-1.5, -19];
  const handB = [sh[0] - 1 + Math.sin(aB) * 9, sh[1] + Math.cos(aB) * 9];
  limb(g, sh[0], sh[1], handB[0], handB[1], 3.4, c.shade, lw, line);
  // body: a soft pear, lit from the left (which is the back when facing right; flip the light)
  const body = curve([[0, -22], [5.6, -19], [7, -11], [5.6, -4.5], [0, -3], [-5.6, -4.5], [-7, -11], [-5.6, -19]]);
  ink(g, body, c.fur, lw, line);
  g.save(); g.clip(body);
  const ls = -dir; // the sun's side in local x
  g.fillStyle = c.shade; g.fill(ell(-ls * 6, -11, 6, 13));
  g.fillStyle = c.belly; g.fill(ell(dir > 0 ? 3.2 : 3.2, -10.5, 3.6, 6.5));
  // clothes: a tunic, smock or apron over the lower body
  const cl = o.cloth || 'tunic';
  if (cl === 'tunic' || cl === 'smock') {
    const top = cl === 'smock' ? -18 : -15;
    g.fillStyle = coat; g.fillRect(-8, top, 16, 14);
    g.fillStyle = coatSh; g.fill(ell(-ls * 6.5, -9, 5, 10));
    if (!tiny) { g.strokeStyle = F.mix(coat, '#3b2433', 0.45); g.lineWidth = 0.7; g.beginPath(); g.moveTo(-8, top + 0.6); g.lineTo(8, top + 0.6); g.stroke(); }
  } else if (cl === 'apron') {
    g.fillStyle = coat; g.fill(poly([[1, -17], [7.5, -16], [7.5, -3], [0.5, -3]]));
    g.fillStyle = coatSh; g.fillRect(-8, -12.2, 16, 1.4);
  }
  if (!tiny) { g.fillStyle = F.rgba(c.lit, 0.9); g.fill(ell(ls * 6.2, -12, 1.4, 6)); } // rim light on the sun side
  g.restore();
  if (acc && o.scarf !== false) { // a scarf at the neck, ends blowing in the wind
    const wv = o.wind || 0.6;
    ink(g, ell(0.5, -19.8, 6.2, 2.1), acc, lw * 0.8, line);
    const tail = poly([[-3, -19.5], [-3 - 5 * wv - 1, -19 + Math.sin(o.t * 6 + x) * 1.2], [-3 - 4.5 * wv, -16.5], [-1.5, -18]]);
    ink(g, tail, acc, lw * 0.7, line);
  }
  // head
  g.save();
  g.translate(0.8 + (o.head || 0) * 0.8, -24.5);
  if (o.nod) g.rotate(o.nod);
  const hr = 6.4;
  // ears behind
  const earC = c.shade;
  if (sp.ear === 'round') { ink(g, circ(-3.6, -4.8, 1.9), earC, lw, line); ink(g, circ(2.6, -5.4, 1.9), earC, lw, line); }
  else if (sp.ear === 'big') { ink(g, circ(-3.4, -5, 3.0), c.fur, lw, line); ink(g, circ(2.8, -5.5, 3.0), c.fur, lw, line); g.fillStyle = c.nose; g.fill(circ(2.9, -5.4, 1.5)); }
  else if (sp.ear === 'small') { ink(g, circ(-2.6, -5.4, 1.5), c.fur, lw, line); }
  else if (sp.ear === 'long') {
    const ew = (o.earWiggle || 0);
    for (const [ex, ea] of [[-2.2, -0.25 + ew * 0.2], [1.6, 0.12 - ew * 0.25]]) {
      g.save(); g.translate(ex, -4.5); g.rotate(ea);
      const e = curve([[0, 0], [-2.2, -6], [-1.2, -12], [0.8, -12.5], [1.8, -6], [1.4, 0]]);
      ink(g, e, c.fur, lw, line);
      g.fillStyle = c.nose; g.globalAlpha = 0.6; g.fill(ell(0, -6.5, 0.7, 4)); g.globalAlpha = 1;
      g.restore();
    }
  }
  const head = curve([[-hr, 0.5], [-hr * 0.8, -hr * 0.75], [0, -hr * 1.02], [hr * 0.8, -hr * 0.8], [hr * 1.05, -1], [hr * 0.7, hr * 0.75], [-hr * 0.5, hr * 0.85]]);
  ink(g, head, c.fur, lw, line);
  g.save(); g.clip(head);
  g.fillStyle = c.shade; g.fill(circ(-ls * hr * 0.95, 1.5, hr * 0.85));
  if (!tiny) { g.fillStyle = c.lit; g.fill(ell(ls * hr * 0.75, -1.5, 1.2, 3.6)); }
  g.restore();
  // muzzle pointing the way it faces
  const sn = sp.snout;
  const muz = ell(hr * 0.55 + sn * 1.6, 1.2, 2.9 + sn * 1.1, 2.4);
  ink(g, muz, c.belly, lw * 0.85, line);
  g.fillStyle = c.nose; g.fill(ell(hr * 0.55 + sn * 1.6 + 2.6 + sn * 1.1, 0.4, 1.3 + (sp.ear === 'none' ? 0.6 : 0), 1.1));
  // eye (one, three-quarter view) + blink
  const bl = o.blink == null ? 1 : o.blink;
  const ex = 1.6 + (o.look ? o.look[0] * 0.6 : 0), ey = -1.8 + (o.look ? o.look[1] * 0.5 : 0);
  if (sp.ear === 'none') { g.fillStyle = line; g.fill(ell(ex + 0.6, ey + 0.6, 0.9, 0.4)); }
  else if (bl < 0.3 || o.happy) {
    g.beginPath(); g.moveTo(ex - 1.3, ey + (o.happy ? 0.5 : 0)); g.quadraticCurveTo(ex, ey + (o.happy ? -1 : 0.9), ex + 1.3, ey + (o.happy ? 0.5 : 0));
    g.lineWidth = Math.max(0.7, lw * 0.8); g.strokeStyle = line; g.stroke();
  } else {
    g.fillStyle = line; g.fill(ell(ex, ey, 1.25, 1.45 * bl));
    if (!small) { g.fillStyle = '#fff'; g.fill(circ(ex - 0.4, ey - 0.6, 0.45)); }
  }
  if (!tiny) {
    // mouth
    const m = o.mouth || 0;
    if (m > 0.1) { ink(g, ell(hr * 0.55 + sn * 1.6 + 0.8, 3.1, 1.3, 0.9 * m), '#7a3040', 0.6, line); }
    else { g.beginPath(); g.moveTo(hr * 0.55 + sn, 2.6); g.quadraticCurveTo(hr * 0.55 + sn * 1.8, 3.6, hr * 0.55 + sn * 2.6 + 0.6, 2.8); g.lineWidth = 0.6; g.strokeStyle = line; g.stroke(); }
    // cheek blush
    g.fillStyle = 'rgba(236,128,128,0.35)'; g.fill(ell(0.5, 2.2, 1.8, 1.1));
    if (!small && sp.ear !== 'long') { // whiskers
      g.strokeStyle = F.rgba(c.belly, 0.8); g.lineWidth = 0.35;
      const wx = hr * 0.55 + sn * 1.6 + 2;
      for (const k of [-1, 0, 1]) { g.beginPath(); g.moveTo(wx, 1.6); g.lineTo(wx + 4.5, 1.2 + k * 1.4); g.stroke(); }
    }
  }
  if (o.hat) o.hat(g, hr, line, lw);
  g.restore();
  // front arm and whatever it holds
  const shF = [2, -18.5];
  const handF = [shF[0] + Math.sin(aF) * 9, shF[1] + Math.cos(aF) * 9];
  limb(g, shF[0], shF[1], handF[0], handF[1], 3.4, c.fur, lw, line);
  ink(g, circ(handF[0], handF[1], 1.9), c.fur, lw * 0.8, line);
  if (o.hold) o.hold(g, handF, handB, line, lw);
  g.restore();
};

// hats: small and characterful; each draws in head space (head radius hr)
F.HATS = {
  straw: (col) => (g, hr, line, lw) => { ink(g, ell(0, -hr * 0.8, hr * 1.5, hr * 0.32), col || '#e8c97a', lw * 0.8, line); ink(g, curve([[-hr * 0.7, -hr * 0.8], [-hr * 0.5, -hr * 1.5], [hr * 0.5, -hr * 1.55], [hr * 0.75, -hr * 0.8]]), col || '#e8c97a', lw * 0.8, line); g.fillStyle = '#c95a4a'; g.fillRect(-hr * 0.7, -hr * 1.0, hr * 1.45, hr * 0.18); },
  knit: (col) => (g, hr, line, lw) => { ink(g, curve([[-hr * 0.95, -hr * 0.45], [-hr * 0.6, -hr * 1.25], [hr * 0.2, -hr * 1.45], [hr * 0.95, -hr * 0.6]], false), null, 0); const p = curve([[-hr * 0.95, -hr * 0.35], [-hr * 0.7, -hr * 1.2], [hr * 0.1, -hr * 1.45], [hr * 0.95, -hr * 0.55], [hr * 0.1, -hr * 0.62]]); ink(g, p, col, lw * 0.8, line); ink(g, circ(-hr * 0.1, -hr * 1.6, hr * 0.28), F.mix(col, '#ffffff', 0.4), lw * 0.7, line); },
  cap: (col) => (g, hr, line, lw) => { const p = curve([[-hr * 0.9, -hr * 0.4], [-hr * 0.6, -hr * 1.1], [hr * 0.5, -hr * 1.1], [hr * 0.9, -hr * 0.45]]); ink(g, p, col, lw * 0.8, line); ink(g, ell(hr * 0.95, -hr * 0.45, hr * 0.6, hr * 0.16), F.mix(col, '#3b2433', 0.3), lw * 0.7, line); },
  kerchief: (col) => (g, hr, line, lw) => { const p = curve([[-hr * 1.0, -hr * 0.1], [-hr * 0.7, -hr * 1.0], [hr * 0.3, -hr * 1.08], [hr * 0.85, -hr * 0.5], [-hr * 0.2, -hr * 0.55]]); ink(g, p, col, lw * 0.8, line); ink(g, poly([[-hr * 0.95, -hr * 0.2], [-hr * 1.6, hr * 0.2], [-hr * 1.1, hr * 0.35]]), col, lw * 0.6, line); },
};

// ------------------------------------------------------------ puffins
// stout and upright, feet at (0, 0), about 26 units tall. o: sc, dir, blink, look, flap 0..1,
// beakOpen 0..1, hop (units up), lean
F.puffin = (g, x, y, o) => {
  const sc = o.sc, dir = o.dir || 1, hz = o.haze || 0;
  const line = F.inkAt(hz);
  const lw = clamp(1.5 / sc, 0.4 / sc, 2.2 / sc);
  const blk = F.mix('#2f2b3d', F.HAZE, hz), wht = F.mix('#f6f0e6', F.HAZE, hz), whtSh = F.mix('#c9bfcc', F.HAZE, hz), org = F.mix('#ea7a3a', F.HAZE, hz);
  g.save(); g.translate(x, y - (o.hop || 0) * sc); g.scale(sc * dir, sc); g.rotate(o.lean || 0);
  for (const fx_ of [-2.5, 2.5]) ink(g, poly([[fx_ - 1, -3], [fx_ + 3.5, 0], [fx_ - 2, 0.3]]), org, lw * 0.8, line);
  const body = curve([[0, -24], [6.5, -19], [8, -9], [5, -2.5], [-2, -2], [-7.5, -7], [-7.5, -17]]);
  ink(g, body, blk, lw, line);
  g.save(); g.clip(body);
  g.fillStyle = wht; g.fill(ell(3.5, -9, 4.8, 7.5));
  g.fillStyle = whtSh; g.fill(ell(dir > 0 ? 5.5 : 1.5, -7, 2.5, 6));
  g.restore();
  // wing
  const fl = o.flap || 0;
  g.save(); g.translate(-2, -15); g.rotate(-fl * 1.6);
  ink(g, curve([[0, 0], [-2.5, 4], [-1.5, 10], [1.5, 6.5], [1.5, 1]]), blk, lw * 0.85, line);
  g.restore();
  // head: black cap, white face, the big striped beak
  ink(g, circ(1.5, -23.5, 5.6), blk, lw, line);
  g.save(); g.clip(circ(1.5, -23.5, 5.6)); g.fillStyle = wht; g.fill(ell(3.2, -22.8, 3.7, 3.6)); g.restore();
  const bo = o.beakOpen || 0;
  ink(g, poly([[5.6, -26], [10.6, -24 + bo * -0.8], [6.2, -22.2]]), org, lw * 0.8, line);
  ink(g, poly([[6.2, -22.2], [10.4, -23.2 + bo * 2], [5.6, -20.2]]), F.mix(org, '#c94a2c', 0.4), lw * 0.8, line);
  g.fillStyle = F.mix('#e9d96a', F.HAZE, hz); g.fillRect(6.4, -25.6, 0.9, 4.6);
  const bl = o.blink == null ? 1 : o.blink;
  g.fillStyle = line;
  if (bl > 0.3) g.fill(ell(3.6 + (o.look ? o.look[0] * 0.5 : 0), -23.6, 0.9, 1.0 * bl));
  else g.fillRect(2.8, -23.6, 1.8, 0.5);
  g.fillStyle = F.rgba(F.mix('#e8a090', F.HAZE, hz), 0.8); g.fill(ell(4.4, -21.6, 1.1, 0.6));
  if (o.hold) o.hold(g, line, lw);
  g.restore();
};

// ------------------------------------------------------------ crabs
// a little crab, front view: o: sc, col, claw (0..1 raised), walk (phase), wave (0..1)
F.crab = (g, x, y, o) => {
  const sc = o.sc, hz = o.haze || 0, line = F.inkAt(hz);
  const lw = clamp(1.4 / sc, 0.4 / sc, 2 / sc);
  const col = F.mix(o.col || '#d9644a', F.HAZE, hz), sh = F.mix(col, '#5a3050', 0.4), lit = F.mix(col, '#ffd9a8', 0.35);
  const w = o.walk || 0;
  g.save(); g.translate(x, y); g.scale(sc, sc);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) {
    const a = 0.4 + i * 0.35, lift = Math.max(0, Math.sin(w * TAU + i * 2 + (s > 0 ? Math.PI : 0))) * 1.5;
    g.beginPath(); g.moveTo(s * 4, -3); g.lineTo(s * (8 + i * 1.6), -5 - lift + i * 0.8); g.lineTo(s * (10 + i * 2), -lift * 0.5);
    g.lineWidth = 1.6; g.strokeStyle = line; g.stroke(); g.lineWidth = 0.8; g.strokeStyle = sh; g.stroke();
  }
  const cl = o.claw || 0, wv = o.wave || 0;
  for (const s of [-1, 1]) {
    const up = s > 0 ? Math.max(cl, wv) : cl;
    const ang = -0.4 - up * 1.1 + (s > 0 ? Math.sin(wv * TAU * 2) * wv * 0.4 : 0);
    g.save(); g.translate(s * 5.5, -6); g.scale(s, 1); g.rotate(ang);
    limb(g, 0, 0, 4, -2, 1.8, col, lw * 0.7, line);
    const claw = curve([[3.5, -1], [6, -4.5], [8.6, -3.5], [8, -1.5], [6.6, -2.2], [7.4, 0.2], [5, 0.8]]);
    ink(g, claw, col, lw * 0.8, line);
    g.restore();
  }
  const shell = curve([[-6.5, -3], [-5.5, -7.5], [0, -9], [5.5, -7.5], [6.5, -3], [0, -1.5]]);
  ink(g, shell, col, lw, line);
  g.save(); g.clip(shell); g.fillStyle = sh; g.fill(ell(4, -3.5, 5, 4)); g.fillStyle = lit; g.fill(ell(-3, -7, 2.5, 1.4)); g.restore();
  for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 1.6, -8.5); g.lineTo(s * 2.1, -11); g.lineWidth = 0.8; g.strokeStyle = line; g.stroke(); g.fillStyle = line; g.fill(circ(s * 2.1, -11.3, 0.95)); }
  g.restore();
};

// ------------------------------------------------------------ gulls (in flight, seen from the side)
F.gull = (g, x, y, s, flap, dir = 1, hz = 0) => {
  const line = F.inkAt(hz * 0.7);
  const wht = F.mix('#f7f2ea', F.HAZE, hz), grey = F.mix('#a9a6b8', F.HAZE, hz);
  g.save(); g.translate(x, y); g.scale(s * dir, s);
  const up = Math.sin(flap) * 7;
  const wing = (k) => curve([[-2, 0], [-6, -2 - up * k], [-14, -1 - up * 1.3 * k], [-7, 1.5], [0, 1.5]]);
  ink(g, wing(1), grey, 1.2 / s, line);
  ink(g, ell(0, 0, 7, 2.6), wht, 1.2 / s, line);
  ink(g, circ(6.5, -1.2, 2.2), wht, 1.1 / s, line);
  g.fillStyle = '#e9b44c'; g.fill(poly([[8.4, -1.4], [11.5, -0.8], [8.4, -0.3]]));
  g.save(); g.scale(-1, 1); g.translate(2, 0);
  ink(g, curve([[-2, 0], [-6, -2 - up * 0.7], [-13, -1.5 - up], [-6, 1], [0, 1]]), wht, 1.1 / s, line);
  g.restore();
  g.restore();
};

// ------------------------------------------------------------ bunting
// a sagging line of little flags between two points, flapping in the shared wind.
// pluck: 0..1 sends a wave along it. Returns nothing; draw it live.
F.bunting = (g, a, b, o, t) => {
  const n = o.n || 12, sag = o.sag || 30, sc = o.sc || 1, hz = o.haze || 0;
  const line = F.inkAt(hz);
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const u = i / 24, w = D.wind(t, lerp(a[0], b[0], u));
    const pl = (o.pluck || 0) * Math.sin(u * Math.PI * 3 - t * 9) * 8 * Math.sin(u * Math.PI);
    pts.push([lerp(a[0], b[0], u) + w * 3 * Math.sin(u * Math.PI), lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * (sag + Math.sin(t * 1.4 + a[0]) * 2 + pl)]);
  }
  g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.lineWidth = Math.max(0.6, 1.1 * sc); g.strokeStyle = line; g.stroke();
  const cols = o.cols || F.CLOTH;
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, k = u * 24, j = Math.floor(k), f = k - j;
    const [x0, y0] = pts[j], [x1, y1] = pts[Math.min(24, j + 1)];
    const x = lerp(x0, x1, f), y = lerp(y0, y1, f);
    const ang = Math.atan2(y1 - y0, x1 - x0);
    const flutter = Math.sin(t * 5 + i * 1.7 + a[0]) * 0.25 * D.wind(t, x) + (o.pluck || 0) * Math.sin(t * 14 + i) * 0.4;
    const fw = 8 * sc, fh = 11 * sc;
    g.save(); g.translate(x, y); g.rotate(ang + flutter * 0.6);
    const col = F.mix(cols[(i + (o.off || 0)) % cols.length], F.HAZE, hz);
    const p = poly([[-fw / 2, 0], [fw / 2, 0], [flutter * fw * 0.8, fh]]);
    ink(g, p, col, Math.max(0.4, 0.8 * sc), line);
    g.fillStyle = 'rgba(60,40,90,0.22)'; g.fill(poly([[fw * 0.1, 0], [fw / 2, 0], [flutter * fw * 0.8, fh]]));
    g.restore();
  }
};

// ------------------------------------------------------------ helpers for drawing a little rope
F.rope = (g, a, b, sag, w, col, line) => {
  const p = new Path2D();
  p.moveTo(a[0], a[1]); p.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag * 2, b[0], b[1]);
  g.lineWidth = w + 1.2; g.strokeStyle = line || LINE; g.stroke(p);
  g.lineWidth = w; g.strokeStyle = col; g.stroke(p);
};
})();
