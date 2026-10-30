/* rooms-inner.js — the small rooms of the inner whorls, each a story you have to lean in for, and the
   first chamber of all at the centre, where the ark keeps its oldest pearl.

     9 bath         a crab in a teacup bath; hover: scrubs with a sponge, bubbles; linger: ducks under
    10 laundry      eight socks on a line; hover: the line bounces and a sock blows off
    11 post room    the snail postmaster stamps letters; hover: stamps faster; mail goes out the tube
    12 studio       a squid painting the nautilus with her own ink; hover: paints; linger: an inky sneeze
    13 nursery      baby shrimp in a scallop cradle under a mobile; hover: the cradle rocks
    14 tea room     two old periwinkles over tea; hover: they clink cups
    15 storeroom    an isopod raiding the jam; hover: freezes, then sneaks another lick
    16 net loft     a crab mending a net; hover: the shuttle flies
    17 cupboard     a tiny octopus asleep in a jar; hover: an eye opens
    18 parlour      the oldest crewmate rocks and knits; hover: rocks faster, the yarn rolls
    19 study        a goby writing up the log by candle; hover: the candle gutters, it shields it
    20 pearl room   a stand of found pearls; hover: they shine in turn
    21 hammock      a crab kit asleep in a hammock; hover: it swings
     ·  the first chamber: one pearl; hover: it chimes, and a ring of light runs out along the
        spiral, every lamp in the ark flaring in turn from the centre outward

   rooms z40–49 (rooms.js has the kit). */
(() => {
const { TAU, lerp, clamp, rng, circ, ell, curve, poly, grad, radial, P, layer } = Drawn;
const A = window.ARK, LINE = A.LINE, C = A.crew, ink = C.ink, K = A.rk, look = A.look;
const ch = (k) => A.chambers[k];

// the flare that runs out along the spiral from the centre (the pearl's chime): each room's lamp
// brightens as the wave passes its chamber number
A.wave = -1;
A.flare = (k) => (A.wave < 0 ? 0 : Math.max(0, 1 - Math.abs(A.wave - (40 - k)) / 2.2));

// ------------------------------------------------------------------ 9 · bath
A.room({
  k: 9, id: 'bath', floor: 606, near: 950,
  glow: [[948, 560, 60, 0.5]],
  state: () => ({ blink: Drawn.blinker(), scrub: 0, dunk: A.beat(1.6) }),
  furnish(g) {
    ink(g, A.rr(968, 556, 3, 16, 1), K.WOOD.dark, 0.8);
    ink(g, poly([[961, 560], [976, 560], [975, 578], [962, 578]]), '#9ad4c8', 0.9);
    g.lineWidth = 0.8; g.strokeStyle = '#5fa38a'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(962, 565 + i * 4); g.lineTo(975, 565 + i * 4); g.stroke(); }
  },
  update(dt, t, L, R) {
    R.dunk.step(dt);
    R.scrub = Drawn.ease(R.scrub, L.hovered ? 1 : 0, 4, dt);
    if (L.hovered && L.since > 1.5 && !R.d) { R.d = true; R.dunk.start(); }
    if (!L.hovered) R.d = false;
    if (Math.random() < dt * (1 + R.scrub * 10)) A.spawn({ kind: 'bubble', x: 935 + Math.random() * 24, y: 582, vx: (Math.random() - 0.5) * 10, vy: -12, size: 1 + Math.random() * 1.8, life: 1.4 });
  },
  draw(g, t, L, R) {
    K.lampJar(g, 950, 540, 0.5, t, 9, L.hover + A.flare(9));
    const dk = R.dunk.live ? A.env(R.dunk.u, 0.25, 0.6) : 0;
    C.crab(g, 947, 592 + dk * 9, 0.5, { t, blink: R.blink(t), look: look(947, 580), claws: [0.6 + Math.sin(t * 9) * 0.4 * R.scrub, 0.2], snip: 0 });
    // the teacup: drawn over the crab so it sits in it
    const cup = curve([[928, 586], [966, 586], [962, 602], [952, 606], [942, 606], [932, 602]]);
    ink(g, cup, '#f6f0e6', 1.2);
    g.save(); g.clip(cup); g.fillStyle = '#d9cfe0'; g.fill(ell(947, 606, 22, 6)); g.fillStyle = '#6aa3c8'; g.fillRect(930, 597, 34, 2); g.restore();
    ink(g, ell(947, 586, 19, 2.6), '#cfeaf0', 1);
    g.lineWidth = 2.4; g.strokeStyle = LINE; g.beginPath(); g.arc(968, 593, 4.5, -1.2, 1.3); g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = '#f6f0e6'; g.stroke();
    for (let i = 0; i < 5; i++) ink(g, circ(932 + i * 7 + Math.sin(t * 2 + i) * 1.5, 584 - (i % 2) * 2, 2.6 + (i % 3)), 'rgba(255,255,255,0.9)', 0.6);
  },
});

// ------------------------------------------------------------------ 10 · laundry
A.room({
  k: 10, id: 'laundry', floor: 567, near: 995,
  glow: [[990, 520, 60, 0.45]],
  state: () => ({ blink: Drawn.blinker(), bounce: 0, bv: 0, gone: -1, gu: 0 }),
  furnish(g) {
    ink(g, curve([[1015, 567], [1013, 555], [1035, 555], [1033, 567]]), '#c9a070', 1);
    g.lineWidth = 0.6; g.strokeStyle = '#8a6040'; for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(1015, 558 + i * 3); g.lineTo(1034, 558 + i * 3); g.stroke(); }
  },
  enter(L, R) { R.bv -= 6; },
  update(dt, t, L, R) {
    R.bv += (-R.bounce * 30 - R.bv * 3) * dt; R.bounce += R.bv * dt;
    if (L.hovered && L.since > 1.2 && R.gone < 0) { R.gone = 5; R.gu = 0; }
    if (R.gone >= 0) { R.gu += dt / 2.6; if (R.gu > 1) R.gone = -1; }
  },
  draw(g, t, L, R) {
    const a = [952, 500], b = [1030, 520];
    const sag = (u) => Math.sin(u * Math.PI) * (8 + R.bounce * 4);
    const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([lerp(a[0], b[0], u), lerp(a[1], b[1], u) + sag(u)]); }
    A.stroke(g, pts, 0.9);
    const cols = ['#e86a5a', '#f2c94b', '#6aa3c8', '#9ac76a', '#e86a5a', '#f2c94b', '#b58ad6', '#6aa3c8'];
    for (let i = 0; i < 8; i++) {
      const u = 0.1 + i * 0.11;
      let x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) + sag(u);
      let rot = Math.sin(t * 2 + i) * 0.12 + R.bounce * 0.2;
      if (R.gone === i) { const k = A.smooth(R.gu); x += k * 40; y -= k * 30 - Math.sin(k * 6) * 4; rot += k * 4; g.globalAlpha = 1 - Math.max(0, R.gu - 0.8) * 5; }
      g.save(); g.translate(x, y); g.rotate(rot);
      ink(g, poly([[-2.4, 0], [2.4, 0], [2.4, 9], [6, 12], [5, 14], [-1, 13], [-2.4, 10]]), cols[i], 0.8);
      g.fillStyle = '#fff'; g.fillRect(-2.4, 0, 4.8, 1.6);
      g.restore(); g.globalAlpha = 1;
      ink(g, A.rr(x - 0.8, y - 2, 1.6, 3, 0.5), '#c9a070', 0.5);
    }
    K.lampJar(g, 990, 490, 0.45, t, 10, L.hover + A.flare(10));
    C.crab(g, 975, 567, 0.48, { t, blink: R.blink(t), look: look(975, 555), claws: [0.9 + Math.sin(t * 1.3) * 0.2, 0.3], c: { body: '#d97ab0', shade: '#a8508a', lit: '#f5b0d8', leg: '#c86aa0' } });
  },
});

// ------------------------------------------------------------------ 11 · post room
A.room({
  k: 11, id: 'post', floor: 492, near: 1005,
  glow: [[1010, 460, 55, 0.45]],
  state: () => ({ blink: Drawn.blinker(), stamp: 0, sv: 2, sent: 0 }),
  furnish(g) {
    // pigeonholes
    ink(g, A.rr(1018, 434, 26, 30, 1), K.WOOD.front, 1.1);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
      ink(g, A.rr(1020 + i * 8, 436 + j * 9.5, 7, 8.5, 0.5), '#5a3a2a', 0.5);
      if ((i + j) % 2 === 0) { g.fillStyle = '#efe0bd'; g.fillRect(1021 + i * 8, 440 + j * 9.5, 5, 3); }
    }
    // the desk
    ink(g, A.rr(990, 478, 26, 3.5, 1), K.WOOD.front, 1); A.line(g, 993, 481, 993, 492, 1.4, K.WOOD.dark); A.line(g, 1013, 481, 1013, 492, 1.4, K.WOOD.dark);
  },
  update(dt, t, L, R) {
    R.sv = Drawn.ease(R.sv, L.hovered ? 9 : 2, 3, dt);
    R.stamp += R.sv * dt;
    if (L.hovered && (R.sent -= dt) < 0) { R.sent = 1.2; A.mail(0.62, Math.random() < 0.5 ? 0.98 : 0.15); }
  },
  draw(g, t, L, R) {
    K.lampJar(g, 1003, 448, 0.42, t, 11, L.hover + A.flare(11));
    const s = Math.max(0, Math.sin(R.stamp));
    ink(g, A.rr(996, 474, 12, 4, 0.5), '#fbf3e2', 0.6);
    C.snail(g, 980, 492, 0.5, { t, blink: R.blink(t), look: [0.8, 0.6], reach: 0.25, c: { shell: '#e9b27a', shellSh: '#b9824a', shellLt: '#f6d8b0', band: '#7a4a2a' } });
    // the stamp
    ink(g, A.rr(1001, 462 - s * 7, 4, 7, 1), K.WOOD.front, 0.7); ink(g, A.rr(999, 469 - s * 7, 8, 2.4, 0.5), '#c0394f', 0.6);
    // a postman's cap
    ink(g, A.rr(988, 456, 9, 4, 1.5), '#2d4a6a', 0.8);
  },
});

// ------------------------------------------------------------------ 12 · studio
A.room({
  k: 12, id: 'studio', floor: 425, near: 995,
  glow: [[1000, 395, 55, 0.5]],
  state: () => ({ blink: Drawn.blinker(), paint: 0, sneeze: A.beat(1.4) }),
  furnish(g) {
    // the easel
    A.line(g, 1012, 425, 1020, 385, 1.4, K.WOOD.dark); A.line(g, 1032, 425, 1024, 385, 1.4, K.WOOD.dark); A.line(g, 1022, 425, 1022, 395, 1.2, K.WOOD.dark);
    ink(g, poly([[1008, 384], [1036, 384], [1036, 408], [1008, 408]]), '#fbf3e2', 1);
    // the canvas: a portrait of the nautilus, in ink
    g.lineWidth = 1; g.strokeStyle = '#3a3050';
    g.beginPath(); for (let i = 0; i < 50; i++) { const a = i * 0.25, r = 0.3 + Math.exp(a * 0.12) * 1.3; g.lineTo(1024 + Math.cos(a) * r, 395 + Math.sin(a) * r); } g.stroke();
    g.fillStyle = '#3a3050'; g.fill(circ(1015, 401, 1.2));
    A.line(g, 1012, 404, 1006, 404, 0.6, '#3a3050'); A.line(g, 1012, 405, 1007, 407, 0.6, '#3a3050');
    // ink pots
    ink(g, A.rr(986, 419, 5, 6, 1), '#3a3050', 0.6); ink(g, A.rr(993, 420, 5, 5, 1), '#7a3a8a', 0.6);
  },
  update(dt, t, L, R) {
    R.sneeze.step(dt);
    R.paint = Drawn.ease(R.paint, L.hovered ? 1 : 0, 4, dt);
    if (L.hovered && L.since > 1.6 && !R.s) { R.s = true; R.sneeze.start(); }
    if (!L.hovered) R.s = false;
    if (R.sneeze.live && R.sneeze.u > 0.4 && R.sneeze.u < 0.5) for (let i = 0; i < 4; i++) A.spawn({ kind: 'ink', x: 992, y: 408, vx: -20 - Math.random() * 20, vy: (Math.random() - 0.5) * 20, size: 2.5, life: 1.6, color: 'rgba(40,30,70,0.6)' });
  },
  draw(g, t, L, R) {
    K.lampJar(g, 990, 380, 0.4, t, 12, L.hover + A.flare(12));
    const p = R.paint, sn = R.sneeze.live ? A.bump(R.sneeze.u) : 0;
    const ax = 1012 + Math.sin(t * 7) * 3 * p, ay = 398 + Math.cos(t * 5) * 3 * p;
    C.squid(g, 996, 425, 0.5, { t, beret: true, blink: sn > 0.3 ? 0 : R.blink(t), look: p > 0.3 ? [1, -0.2] : look(996, 410), arm: [(ax - 996) / 0.5, (ay - 425) / 0.5], rot: -sn * 0.2 });
    ink(g, circ(ax, ay, 1.3), '#3a3050', 0.5);
  },
});

// ------------------------------------------------------------------ 13 · nursery
A.room({
  k: 13, id: 'nursery', floor: 398, near: 960,
  glow: [[960, 370, 50, 0.45]],
  state: () => ({ rock: 0, rv: 0, blink: Drawn.blinker() }),
  enter(L, R) { R.rv += 2.5; },
  update(dt, t, L, R) {
    R.rv += (-R.rock * 16 - R.rv * (L.hovered ? 0.3 : 1.5) + Math.sin(t * 0.9) * 0.4 + (L.hovered ? Math.sin(t * 4) * 3 : 0)) * dt; R.rock += R.rv * dt;
  },
  draw(g, t, L, R) {
    K.lampJar(g, 942, 358, 0.38, t, 13, L.hover + A.flare(13));
    // the mobile of tiny shells
    A.line(g, 968, 342, 968, 352, 0.6);
    const mr = Math.sin(t * 0.8) * 0.4;
    for (let i = 0; i < 3; i++) { const a = mr + (i / 3) * TAU; const x = 968 + Math.cos(a) * 8, y = 354 + Math.sin(a) * 1.5; A.line(g, x, 352, x, y + 3, 0.5); ink(g, circ(x, y + 5, 2), ['#f2a3b0', '#9ad4c8', '#f2c94b'][i], 0.5); }
    // the scallop cradle, rocking on its curve
    g.save(); g.translate(962, 396); g.rotate(R.rock * 0.25);
    ink(g, curve([[-16, -6], [-12, 2], [0, 4], [12, 2], [16, -6]], false), '#f2c3a8', 1);
    const cr = curve([[-16, -6], [-12, 2], [0, 4], [12, 2], [16, -6], [0, -2]]);
    ink(g, cr, '#f6d4bc', 1);
    g.save(); g.clip(cr); g.lineWidth = 0.6; g.strokeStyle = '#d79a80'; for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(i * 2.5, 3); g.lineTo(i * 5, -6); g.stroke(); } g.restore();
    for (let i = 0; i < 3; i++) C.shrimp(g, -8 + i * 7, -3, 0.2, { t: t + i, bend: 0.5, blink: i === 1 ? R.blink(t) : 0.1, look: [0, -0.5] });
    ink(g, curve([[-14, -6], [-6, -9], [6, -9], [14, -6], [0, -4]]), '#9ad4c8', 0.7);
    g.restore();
    C.shrimp(g, 935, 398, 0.42, { t, blink: R.blink(t), look: [1, 0.3], c: { body: '#f2a3b0', shade: '#c4708a', lit: '#ffd0dc' }, reach: [24, -6] });
  },
});

// ------------------------------------------------------------------ 14 · tea room
A.room({
  k: 14, id: 'tea', floor: 392, near: 905,
  glow: [[905, 365, 45, 0.45]],
  state: () => ({ clink: A.beat(1), b1: Drawn.blinker(), b2: Drawn.blinker() }),
  enter(L, R) { R.clink.start(); },
  furnish(g) { ink(g, A.rr(896, 381, 20, 3, 1), K.WOOD.front, 0.9); A.line(g, 906, 384, 906, 392, 1.6, K.WOOD.dark); ink(g, curve([[902, 381], [903, 375], [910, 375], [911, 381]]), '#f6f0e6', 0.8); },
  update(dt, t, L, R) { R.clink.step(dt); if (Math.random() < dt * 1.5) A.spawn({ kind: 'steam', x: 906, y: 372, vy: -10, size: 1.5, life: 1.4 }); },
  draw(g, t, L, R) {
    K.lampJar(g, 905, 352, 0.32, t, 14, L.hover + A.flare(14));
    const c = R.clink.live ? A.bump(R.clink.u) : 0;
    C.snail(g, 885, 392, 0.36, { t, blink: R.b1(t), look: [1, 0], reach: 0.3 + c * 0.4, c: { shell: '#8fb3d8', shellSh: '#5f83a8', shellLt: '#c0d6ee', band: '#f0d6a8' } });
    C.snail(g, 926, 392, 0.34, { t: t + 2, flip: true, blink: R.b2(t), look: [1, 0], reach: 0.3 + c * 0.4, c: { shell: '#d8a8b8', shellSh: '#a87888', shellLt: '#f0d0dc', band: '#f6e6c0' } });
    for (const [x, d] of [[898 + c * 3, 1], [914 - c * 3, -1]]) ink(g, A.rr(x - 1.6, 376 - c * 3, 3.2, 3, 0.6), '#f6f0e6', 0.6);
    if (c > 0.9) A.spawn({ kind: 'spark', x: 906, y: 372, size: 0.35, life: 0.4 });
  },
});

// ------------------------------------------------------------------ 15 · storeroom
A.room({
  k: 15, id: 'store', floor: 404, near: 860,
  glow: [[860, 380, 45, 0.4]],
  state: () => ({ blink: Drawn.blinker(), freeze: 0, lick: 0 }),
  furnish(g) {
    K.shelf(g, 840, 880, 372);
    for (const [x, c] of [[846, '#e86a5a'], [856, '#f2c94b'], [866, '#9ac76a']]) { ink(g, A.rr(x - 3.5, 362, 7, 10, 2), c, 0.7); ink(g, A.rr(x - 3, 360.5, 6, 2.4, 1), '#efe0bd', 0.5); }
    ink(g, A.rr(842, 388, 13, 16, 3), '#9c6440', 0.9); A.line(g, 842, 393, 855, 393, 0.6, K.WOOD.dark); A.line(g, 842, 399, 855, 399, 0.6, K.WOOD.dark);
    ink(g, A.rr(872, 392, 10, 12, 2), '#e86a5a', 0.8); g.fillStyle = '#f6f0e6'; g.fillRect(873, 392, 8, 2);
  },
  update(dt, t, L, R) {
    R.freeze = Drawn.ease(R.freeze, L.hovered && L.since < 1.2 ? 1 : 0, 6, dt);
    R.lick = L.hovered && L.since > 1.2 ? Math.max(0, Math.sin((L.since - 1.2) * 6)) : Math.max(0, Math.sin(t * 2.2)) * 0.6;
  },
  draw(g, t, L, R) {
    K.lampJar(g, 862, 352, 0.3, t, 15, L.hover + A.flare(15));
    // the isopod: a little armoured oval of plates, on the jam jar's rim
    const x = 872, y = 391 - R.lick * 1.5, f = R.freeze;
    g.save(); g.translate(x, y); g.rotate(-0.5 + R.lick * 0.2);
    for (let i = 0; i < 4; i++) A.line(g, -5 + i * 3, 2, -6 + i * 3 + Math.sin(t * 12 + i) * (1 - f), 5, 0.6);
    const B = ell(0, 0, 7, 3.6);
    ink(g, B, '#9a94a8', 0.8);
    g.save(); g.clip(B); g.lineWidth = 0.5; g.strokeStyle = '#6a6478'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 2.5, -4); g.lineTo(i * 2.5, 4); g.stroke(); } g.restore();
    g.fillStyle = LINE; g.fill(circ(5.5, -0.5, 0.8 + f * 0.5));
    if (f > 0.4) { g.fillStyle = '#fff'; g.fill(circ(5.5, -0.5, 0.9)); g.fillStyle = LINE; g.fill(circ(5.8, -0.5, 0.45)); }
    A.line(g, 7, -1, 10, -3, 0.5); A.line(g, 7, 0, 10, 1, 0.5);
    g.restore();
  },
});

// ------------------------------------------------------------------ 16 · net loft
A.room({
  k: 16, id: 'nets', floor: 432, near: 845,
  glow: [[845, 405, 45, 0.4]],
  state: () => ({ blink: Drawn.blinker(), sh: 0, sv: 1 }),
  update(dt, t, L, R) { R.sv = Drawn.ease(R.sv, L.hovered ? 7 : 1.2, 3, dt); R.sh += R.sv * dt; },
  draw(g, t, L, R) {
    K.lampJar(g, 838, 392, 0.3, t, 16, L.hover + A.flare(16));
    // the net on its frame
    ink(g, poly([[848, 400], [868, 400], [868, 430], [848, 430]]), null, 1);
    g.lineWidth = 0.4; g.strokeStyle = '#d9c09a';
    for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(848 + i * 4, 400); g.lineTo(848 + i * 4 + Math.sin(t + i) * 0.4, 430); g.stroke(); g.beginPath(); g.moveTo(848, 400 + i * 6); g.lineTo(868, 400 + i * 6); g.stroke(); }
    A.line(g, 848, 400, 848, 432, 1.2, K.WOOD.dark); A.line(g, 868, 400, 868, 432, 1.2, K.WOOD.dark);
    const sx = 852 + (Math.sin(R.sh) + 1) * 7, sy = 414 + Math.cos(R.sh * 2) * 3;
    ink(g, ell(sx, sy, 2.4, 1, undefined, 0.4), '#c9a070', 0.5);
    C.crab(g, 834, 432, 0.36, { t, blink: R.blink(t), look: [1, -0.2], claws: [0.4, 0.4 + Math.sin(R.sh) * 0.3], c: { body: '#7ab0d9', shade: '#4a80a8', lit: '#b0d8f5', leg: '#6aa0c8' } });
  },
});

// ------------------------------------------------------------------ 17 · cupboard
A.room({
  k: 17, id: 'cupboard', floor: 472, near: 845,
  glow: [[845, 455, 35, 0.35]],
  state: () => ({ peek: 0 }),
  update(dt, t, L, R) { R.peek = Drawn.ease(R.peek, L.hovered ? 1 : 0, 3, dt); if (Math.random() < dt * 0.6) A.spawn({ kind: 'z', x: 850, y: 452, vy: -8, life: 1.6, size: 0.35 }); },
  draw(g, t, L, R) {
    K.lampJar(g, 860, 446, 0.26, t, 17, L.hover + A.flare(17));
    const J = A.rr(834, 452, 18, 20, 4);
    g.fillStyle = 'rgba(220,240,235,0.35)'; g.fill(J);
    const br = 1 + Math.sin(t * 1.2) * 0.04;
    g.save(); g.clip(J);
    C.octopus(g, 843, 474, 0.3 * br, { t: t * 0.4, blink: R.peek > 0.5 ? 1 : 0.05, look: look(843, 462), c: { body: '#e6a05a', shade: '#b5703a', lit: '#f6c890', spot: '#c07a3a' }, arms(i, tt) { return [-0.2 + (i / 7) * (Math.PI + 0.4), 2.4 * (i < 4 ? -1 : 1), 22]; } });
    g.restore();
    g.lineWidth = 1; g.strokeStyle = LINE; g.stroke(J);
    ink(g, A.rr(833, 449, 20, 4, 1.5), '#b98a4a', 0.8);
    g.fillStyle = 'rgba(255,255,255,0.5)'; g.fillRect(837, 456, 1.4, 12);
  },
});

// ------------------------------------------------------------------ 18 · parlour
A.room({
  k: 18, id: 'parlour', floor: 497, near: 858,
  glow: [[855, 478, 40, 0.45]],
  state: () => ({ rock: 0, rs: 1, blink: Drawn.blinker(), yarn: 0 }),
  update(dt, t, L, R) { R.rs = Drawn.ease(R.rs, L.hovered ? 3.2 : 1, 2, dt); R.rock += R.rs * dt; R.yarn = Drawn.ease(R.yarn, L.hovered && L.since > 1 ? 1 : 0, 1.2, dt); },
  draw(g, t, L, R) {
    K.lampJar(g, 870, 470, 0.26, t, 18, L.hover + A.flare(18));
    const a = Math.sin(R.rock) * 0.15;
    g.save(); g.translate(852, 496); g.rotate(a);
    // the rocking chair
    g.lineWidth = 1.8; g.strokeStyle = LINE; g.beginPath(); g.arc(0, -20, 20, Math.PI * 0.32, Math.PI * 0.68); g.stroke();
    g.lineWidth = 1; g.strokeStyle = K.WOOD.front; g.stroke();
    A.line(g, -6, -4, -9, -22, 1.4, K.WOOD.dark); A.line(g, 6, -4, 5, -10, 1.2, K.WOOD.dark); A.line(g, -9, -10, 6, -10, 1.6, K.WOOD.front);
    C.snail(g, 0, -10, 0.3, { t, blink: Math.min(R.blink(t), 0.6), look: [1, 0.5], reach: -0.1, c: { shell: '#c8c0a8', shellSh: '#988f78', shellLt: '#e8e2d0', band: '#f6f0e0' } });
    // a shawl
    ink(g, curve([[-8, -16], [0, -18], [4, -14], [-2, -12]]), '#b5552f', 0.6);
    g.restore();
    // knitting needles and a ball of yarn that rolls off when you stay
    const yx = 866 + R.yarn * 10, yr = R.yarn * 6;
    A.stroke(g, [[858, 488], [863, 492], [yx, 494]], 0.6, '#c24a5a');
    g.save(); g.translate(yx, 494); g.rotate(yr); ink(g, circ(0, 0, 3), '#e86a7a', 0.7); A.line(g, -2, -1, 2, 1, 0.5, '#a83a4a'); g.restore();
  },
});

// ------------------------------------------------------------------ 19 · study
A.room({
  k: 19, id: 'study', floor: 506, near: 885,
  glow: [[892, 492, 30, 0.55]],
  state: () => ({ blink: Drawn.blinker(), gut: 0 }),
  furnish(g) { ink(g, A.rr(884, 495, 16, 2.5, 0.8), K.WOOD.front, 0.8); A.line(g, 886, 497, 886, 506, 1, K.WOOD.dark); A.line(g, 898, 497, 898, 506, 1, K.WOOD.dark); ink(g, A.rr(886, 493, 7, 2, 0.5), '#fbf3e2', 0.5); },
  update(dt, t, L, R) { R.gut = Drawn.ease(R.gut, L.hovered ? 1 : 0, 4, dt); },
  draw(g, t, L, R) {
    const fl = 1 + Math.sin(t * 11) * 0.1 + Math.sin(t * 23) * 0.06 - R.gut * (0.3 + 0.3 * Math.sin(t * 17));
    ink(g, A.rr(896, 489, 2.4, 6, 0.6), '#f6f0e6', 0.5);
    g.fillStyle = radial(g, 897, 487, 0, 8 * fl, [[0, 'rgba(255,240,180,0.9)'], [1, 'rgba(255,200,120,0)']]); g.fill(circ(897, 487, 8 * fl));
    g.fillStyle = '#ffd88a'; g.fill(ell(897 + R.gut * Math.sin(t * 9), 486.5, 1.1, 2 * fl));
    C.goby(g, 878, 506, 0.36, { t, blink: R.blink(t), look: R.gut > 0.5 ? [1, 0] : [1, 0.6], rot: -0.25 });
    if (R.gut > 0.3) ink(g, ell(893, 489, 1.6, 3), '#efe3cc', 0.4); // a fin raised round the flame
  },
});

// ------------------------------------------------------------------ 20 · pearl room
A.room({
  k: 20, id: 'pearls', floor: 506, near: 918,
  state: () => ({ s: 0 }),
  furnish(g) { ink(g, A.rr(910, 496, 18, 3, 1), K.WOOD.front, 0.7); A.line(g, 919, 499, 919, 506, 1.2, K.WOOD.dark); },
  update(dt, t, L, R) { R.s += dt * (L.hovered ? 4 : 0.6); },
  draw(g, t, L, R) {
    for (let i = 0; i < 4; i++) {
      const x = 912 + i * 4.5, y = 494 - (i % 2) * 2, sh = Math.max(0, Math.sin(R.s - i * 0.8)) * (0.3 + L.hover * 0.7) + A.flare(20);
      g.fillStyle = radial(g, x, y, 0, 5, [[0, `rgba(255,250,235,${0.4 + sh * 0.6})`], [1, 'rgba(255,250,235,0)']]); g.fill(circ(x, y, 5));
      ink(g, circ(x, y, 1.8), ['#fbf6ee', '#f2d6e0', '#e0e8f6', '#f6ecd0'][i], 0.5);
      if (sh > 0.8 && Math.random() < 0.05) A.spawn({ kind: 'spark', x, y, size: 0.25, life: 0.4 });
    }
  },
});

// ------------------------------------------------------------------ 21 · hammock
A.room({
  k: 21, id: 'hammock', state: () => ({ sw: 0, sv: 0 }),
  enter(L, R) { R.sv += 3; },
  update(dt, t, L, R) { R.sv += (-R.sw * 12 - R.sv * 0.8 + Math.sin(t * 1.1) * 0.3) * dt; R.sw += R.sv * dt; },
  draw(g, t, L, R) {
    const a = [924, 470], b = [950, 476], s = R.sw * 2;
    const pts = []; for (let i = 0; i <= 8; i++) { const u = i / 8; pts.push([lerp(a[0], b[0], u) + s * Math.sin(u * Math.PI), lerp(a[1], b[1], u) + Math.sin(u * Math.PI) * 9]); }
    C.crab(g, 937 + s, 481, 0.2, { t, blink: 0.05, claws: [0.2, 0.2] });
    C.limb(g, pts, 3.6, 3.6, '#e8c86a', 0.6);
    ink(g, circ(a[0], a[1], 1), K.WOOD.dark, 0.4); ink(g, circ(b[0], b[1], 1), K.WOOD.dark, 0.4);
  },
});

// ------------------------------------------------------------------ the tiny chambers: a lamp in each, so the coil twinkles
for (let k = 22; k < A.chambers.length; k++) {
  const c = ch(k);
  if (c.size < 6) break;
  A.furnish((g) => { g.save(); g.clip(c.path); K.glow(g, c, c.c[0], c.c[1], c.size * 0.8, 0.5); g.restore(); }, k);
}
layer({
  id: 'tiny-lamps', z: 44,
  draw(g, t) {
    A.inShell(g, () => {
      for (let k = 22; k < A.chambers.length; k++) {
        const c = ch(k); if (c.size < 6) break;
        const f = A.flare(k), tw = 0.6 + 0.4 * Math.sin(t * 1.7 + k * 1.9);
        const r = Math.max(1, c.size * 0.1);
        g.fillStyle = `rgba(255, 236, 170, ${0.5 * tw + f})`; g.fill(circ(c.c[0], c.c[1], r * (1 + f)));
      }
    });
  },
});

// ------------------------------------------------------------------ the first chamber
const core = A.pt(A.septa[A.septa.length - 1].th, A.R(A.septa[A.septa.length - 1].th) * 0.4);
const PEARL = { x: A.C[0] + 2, y: A.C[1] + 1 };
layer({
  id: 'pearl', z: 57,
  hit: (x, y) => { const [sx, sy] = A.toShell(x, y); return Math.hypot(sx - PEARL.x, sy - PEARL.y) < 18; },
  onEnter() { A.wave = 0; },
  onTap() { A.wave = 0; },
  update(dt, t, L) {
    if (A.wave >= 0) { A.wave += dt * 16; if (A.wave > 48) A.wave = -1; }
  },
  draw(g, t, L) {
    A.inShell(g, () => {
      const sh = 0.6 + 0.4 * Math.sin(t * 1.3) + L.hover;
      g.fillStyle = radial(g, PEARL.x, PEARL.y, 0, 16, [[0, `rgba(255,250,230,${0.5 * sh})`], [1, 'rgba(255,240,210,0)']]); g.fill(circ(PEARL.x, PEARL.y, 16));
      ink(g, circ(PEARL.x, PEARL.y, 3.2), radial(g, PEARL.x - 1, PEARL.y - 1, 0, 4, ['#ffffff', '#f2e6ee', '#cfc0d8']), 0.8);
      if (A.wave >= 0 && A.wave < 4) { g.lineWidth = 1.2; g.strokeStyle = `rgba(255,250,220,${1 - A.wave / 4})`; g.stroke(circ(PEARL.x, PEARL.y, 4 + A.wave * 8)); }
    });
  },
});
})();
