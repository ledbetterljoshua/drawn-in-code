/* folk.js — the fair itself: small folk in the middle of their afternoon, each group its own layer
   stacked by depth (z from the y it stands at) and its own hover.

   band      crabs on an upturned crate (fiddle, bucket drum, conch) and two dancers. Hover: the tempo
             picks up and the dancers spin; linger: the conch player lets rip.
   teatable  three on cushions round a driftwood table. Hover: cups up, clink, steam.
   bakery    a kelp-bread stall. Hover: the baker holds out a loaf and the customer takes it.
   chimes    the shell-trinket stall. Hover: its hanging shell chimes clack and swing.
   kite      a hare kid flying a fish-kite. Hover the kid or the kite: it climbs and its tail streams;
             linger: the kid is pulled up onto tiptoe.
   laundry   two otters washing in a tide pool. Hover: splash; the washing on the line flaps.
   castle    two voles building a sandcastle. Hover: a flag goes on the top tower; linger: claps.
   porters   two puffins carrying a basket of fish on a pole. Hover: they stumble and a fish flops out.
   wander    an old mole couple strolling. Hover: they stop and he lifts his hat.
   climber   a vole on gran's rope ladder. Hover: hangs on with one hand and waves.
   netters   two otters hauling a net in the creek. Hover: up it comes, with a crab who pinches.
   Every folk blinks on its own clock, breathes, looks about now and then, and when the bell-puffin
   rings, they all turn to look at the sea. */
(() => {
const D = Drawn, F = Fair;
const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, ink, grad, radial, st, P, layer } = D;
const { HZ, pxu, flat } = F;
const LINE = F.LINE;
F.zOf = (y) => 8 + (y - HZ) / 40;

let seaLook = 0;
// resting arm angles [front, back]: hanging, hands on hips, hands behind, arms folded
const REST = { hang: [-0.08, 0.12], hips: [0.45, -0.4], behind: [-0.45, 0.5], swing: [0.18, -0.15] };
D.on('tide-bell', () => { seaLook = 3.2; });

// a folk: position, species, clothes, and its own clocks
let nSeed = 1;
function folk(o) {
  const f = Object.assign({ dir: 1, coat: F.CLOTH[nSeed % F.CLOTH.length], cloth: 'tunic', ph: nSeed * 1.7 }, o);
  f.blinkC = F.blinker(nSeed * 3 + 1);
  // each has its own way of standing about, and its own build
  const rr = rng(nSeed * 97 + 5);
  f.rest = o.rest || ['hang', 'hips', 'behind', 'hang', 'swing', 'behind'][Math.floor(rr() * 6)];
  f.wide = o.wide || 0.88 + rr() * 0.3; f.tall = o.tall || 0.92 + rr() * 0.16;
  f.act = F.actor(nSeed * 5 + 2, o.acts || [['look', 1.8], ['shift', 1.4], ['look', 2.4], ['scratch', 1.2]], [2, 7]);
  nSeed++;
  return f;
}
function stepFolk(f, dt) { f.blinkC.step(dt); f.act.step(dt); }
// draw f at its spot, with its shadow, its haze and its idle life; pose overrides any of it
function drawFolk(g, f, t, pose = {}) {
  const x = pose.x ?? f.x, y = pose.y ?? f.y;
  const s = pxu(y) * (f.k || 1), hz = F.far(y) * 0.8;
  const breath = Math.sin(t * 2.1 + f.ph) * 0.35;
  const lk = f.act.b('look') * f.act.side, sh = f.act.b('shift'), sc_ = f.act.b('scratch');
  const sea = clamp(seaLook, 0, 1);
  const dir = pose.dir ?? f.dir;
  // shadow on the sand first, then the contact pool
  if (!pose.noShadow) {
    F.castShadow(g, x, y, (g) => { g.fill(ell(0, -15 * s, 6.5 * s, 15 * s)); g.fill(circ(0, -25 * s, 6 * s)); }, 0.55);
    F.contact(g, x, y, 8.5 * s, 0.7);
  }
  F.folk(g, x, y, Object.assign({
    sp: f.sp, sc: s, dir, coat: f.coat, acc: f.acc, cloth: f.cloth, hat: f.hat, t, haze: hz,
    blink: f.blinkC.v, bob: breath + sh * 0.6, lean: sh * 0.06 * f.act.side,
    head: lk * 0.8 + sea * (dir > 0 ? 0.8 : -0.8), look: [lk + sea * dir, 0],
    armR: f.armR ?? (sc_ > 0 ? -2.2 + Math.sin(t * 14) * 0.2 * sc_ : REST[f.rest][0]), armL: f.armL ?? REST[f.rest][1],
    wide: f.wide, tall: f.tall,
  }, pose));
}

// a little helper for things standing on the sand: shadow + contact + draw
function grounded(g, x, y, h, w, fn) {
  F.castShadow(g, x, y, (g) => g.fill(poly([[-w / 2, 0], [w / 2, 0], [w / 2, -h], [-w / 2, -h]])), 0.32);
  F.contact(g, x, y, w * 0.6, 0.45);
  fn(g);
}

// ============================================================ the band
const band = {
  x: 1120, y: 990, tempo: 1, toot: 0, beat: 0,
  crabs: [{ dx: -26, col: '#d9644a', inst: 'fiddle' }, { dx: 0, col: '#e88a4a', inst: 'drum' }, { dx: 26, col: '#c45a5a', inst: 'conch' }],
  dancers: [folk({ sp: 'hare', x: 1015, y: 1022, coat: '#a8689b', acc: '#f2c95c', cloth: 'smock', dir: 1 }), folk({ sp: 'vole', x: 1240, y: 1032, coat: '#4f8fa3', acc: '#e07f62', dir: -1 }), folk({ sp: 'otter', x: 1150, y: 1060, coat: '#e7a43c', dir: -1, k: 0.95 })],
  spin: [0, 0, 0],
  crowd: [
    folk({ sp: 'mole', x: 960, y: 998, coat: '#d65a4a', dir: 1, hat: F.HATS.straw() }), folk({ sp: 'otter', x: 1300, y: 996, coat: '#6f9d58', acc: '#f4efe6', dir: -1 }),
    folk({ sp: 'shrew', x: 1335, y: 1046, coat: '#f2c95c', dir: -1, k: 0.8 }), folk({ sp: 'hare', x: 1060, y: 1074, coat: '#5a7b8c', acc: '#e07f62', dir: 1, k: 1.05 }),
    folk({ sp: 'vole', x: 915, y: 1050, coat: '#efe2c8', cloth: 'smock', acc: '#a8689b', dir: 1, k: 0.75 }),
  ],
};
layer({
  id: 'band', z: F.zOf(band.y),
  hit: (x, y) => Math.abs(x - band.x) < 170 && y > band.y - 80 && y < band.y + 80,
  onEnter() { band.spin = band.spin.map(() => 1); },
  update(dt, t, L) {
    band.tempo = ease(band.tempo, L.hovered ? 2.1 : 1, 2, dt);
    band.beat += dt * band.tempo * 2.2;
    band.toot = ease(band.toot, L.hovered && L.since > 0.8 ? 1 : 0, 3, dt);
    band.spin = band.spin.map((s) => Math.max(0, s - dt * 0.9));
    for (const d of band.dancers) stepFolk(d, dt);
    for (const d of band.crowd) stepFolk(d, dt);
    if (Math.random() < dt * band.tempo * 1.3) F.spawn({ kind: 'note', alt: Math.random() < 0.4, x: band.x + (Math.random() - 0.5) * 60, y: band.y - 60, vx: (Math.random() - 0.5) * 20, vy: -30, life: 1.8, size: 0.8 + band.toot * 0.4 });
  },
  draw(g, t) {
    const s = pxu(band.y), b = band.beat;
    // the crate
    grounded(g, band.x, band.y, 22 * s, 90 * s, (g) => {
      const cw = 45 * s, ch = 22 * s;
      ink(g, poly([[band.x - cw, band.y], [band.x - cw, band.y - ch], [band.x + cw, band.y - ch], [band.x + cw, band.y]]), F.WOOD.base, 1.4);
      const top = ch * 0.9 * flat(band.y) * 2;
      ink(g, poly([[band.x - cw, band.y - ch], [band.x + cw, band.y - ch], [band.x + cw - 3 * s, band.y - ch - top], [band.x - cw + 3 * s, band.y - ch - top]]), F.WOOD.lit, 1.2);
      g.fillStyle = F.WOOD.shade; g.fillRect(band.x + cw * 0.55, band.y - ch, cw * 0.45, ch);
      g.strokeStyle = F.WOOD.deep; g.lineWidth = 0.8;
      for (let k = 1; k < 3; k++) { g.beginPath(); g.moveTo(band.x - cw, band.y - ch + (k * ch) / 3); g.lineTo(band.x + cw, band.y - ch + (k * ch) / 3); g.stroke(); }
      g.fillStyle = '#5a3a3a'; g.font = `italic 700 ${Math.round(7 * s)}px Georgia, serif`; g.textAlign = 'center'; g.fillText('KELP CO.', band.x - cw * 0.2, band.y - ch * 0.3);
    });
    for (const [i, c] of band.crabs.entries()) {
      const bx = band.x + c.dx * s, by = band.y - 22 * s - 6 * s * flat(band.y), hop = Math.max(0, Math.sin(b * Math.PI + i * 1.3)) * 2 * s * band.tempo * 0.6;
      F.crab(g, bx, by - hop, { sc: s * 1.1, col: c.col, claw: c.inst === 'drum' ? 0.5 + Math.sin(b * TAU) * 0.5 : 0.6, walk: b * 0.25 });
      g.save(); g.translate(bx, by - hop); g.scale(s * 1.1, s * 1.1);
      if (c.inst === 'fiddle') { ink(g, ell(-8, -9, 3.2, 5, undefined, -0.5), '#b26a3a', 0.8); g.strokeStyle = LINE; g.lineWidth = 0.7; g.beginPath(); g.moveTo(6, -14 + Math.sin(b * TAU * 2) * 2); g.lineTo(-12, -4 + Math.sin(b * TAU * 2) * 2); g.stroke(); }
      if (c.inst === 'drum') { ink(g, poly([[-6, -1], [6, -1], [5, 6], [-5, 6]]), '#7a9cae', 0.8); ink(g, ell(0, -1, 6, 1.5), '#e8dccb', 0.7); }
      if (c.inst === 'conch') { g.save(); g.translate(7, -12); g.rotate(-0.6 - band.toot * 0.5); ink(g, curve([[0, 0], [9, -3], [13, 1], [9, 4], [2, 3]]), '#f3d3c0', 0.9); g.fillStyle = '#e8a08a'; g.fill(ell(10, 0.5, 2.4, 2.6)); g.restore(); }
      g.restore();
    }
    // the audience, clapping along once it gets going (behind the dancers or in front, by depth)
    const clap = clamp((band.tempo - 1.2) / 0.8, 0, 1);
    const audience = (front) => band.crowd.forEach((d, i) => {
      if ((d.y > band.y + 30) !== front) return;
      const c = Math.sin(b * Math.PI * 2 + i) * clap;
      d.dir = d.x < band.x ? 1 : -1;
      drawFolk(g, d, t, clap > 0.05 ? { armR: lerp(REST[d.rest][0], -1.3 + c * 0.5, clap), armL: lerp(REST[d.rest][1], -1.1 - c * 0.5, clap), happy: clap > 0.5, bob: -Math.max(0, Math.sin(b * Math.PI + i)) * clap * 1.5, look: [d.dir * 0.5, 0] } : { look: [d.dir * 0.5, 0] });
    });
    audience(false);
    // dancers: a hop on the beat, swinging arms, spinning when you arrive
    band.dancers.forEach((d, i) => {
      const ph = b * Math.PI + i * 2, hop = Math.max(0, Math.sin(ph)) * 3 * band.tempo;
      const spin = band.spin[i], dir = spin > 0.05 ? (Math.sin(spin * 18) > 0 ? 1 : -1) : d.dir;
      drawFolk(g, d, t, { bob: -hop, armR: -1.4 + Math.sin(ph) * 1.1, armL: -1.2 - Math.sin(ph) * 1.1, happy: band.tempo > 1.4, dir, step: i === 2 ? (b * 0.5) % 1 : undefined, mouth: band.tempo > 1.4 ? 0.5 : 0 });
    });
    audience(true);
  },
});

// ============================================================ the tea tables in front of the tea-house
const tables = [
  { x: 1385, y: 748, sitters: [folk({ sp: 'otter', dx: -22, coat: '#3f6aa1', acc: '#f4efe6', dir: 1 }), folk({ sp: 'hare', dx: 22, coat: '#efe2c8', dir: -1, hat: F.HATS.straw('#f2c95c') }), folk({ sp: 'mole', dx: 2, dy: -6, coat: '#a8689b', dir: 1, k: 0.95 })] },
  { x: 1505, y: 768, sitters: [folk({ sp: 'vole', dx: -20, coat: '#6f9d58', acc: '#d65a4a', dir: 1 }), folk({ sp: 'shrew', dx: 20, coat: '#e7a43c', dir: -1 })] },
];
const teaT = { lift: 0, clink: 0 };
const waiter = folk({ sp: 'otter', x: 1440, y: 758, coat: '#f4efe6', cloth: 'apron', acc: '#3b2433', dir: 1 });
layer({
  id: 'teatable', z: F.zOf(768),
  hit: (x, y) => x > 1330 && x < 1560 && y > 700 && y < 790,
  onEnter() { teaT.clink = 1; },
  update(dt, t, L) {
    teaT.lift = ease(teaT.lift, L.hovered ? 1 : 0, L.hovered ? 4 : 1.6, dt);
    if (teaT.clink > 0 && teaT.lift > 0.8) { teaT.clink = 0; F.spawn({ kind: 'word', text: 'clink!', x: 1390, y: 690, vy: -14, life: 1.2, size: 0.8 }); F.spawn({ kind: 'spark', x: 1386, y: 712, life: 0.5, size: 0.8 }); }
    for (const tb of tables) for (const f of tb.sitters) stepFolk(f, dt);
    stepFolk(waiter, dt);
    if (Math.random() < dt * (0.8 + teaT.lift * 3)) { const tb = tables[Math.floor(Math.random() * 2)], s = pxu(tb.y); F.spawn({ kind: 'steam', x: tb.x + 6 * s, y: tb.y - 18 * s, vx: 3, vy: -10, life: 1.8, size: 0.35, grow: 0.6 }); }
  },
  draw(g, t) {
    // the waiter walks a slow loop between the tables with a tray
    const u = (t * 0.05) % 1, wx = 1445 + Math.sin(u * TAU) * 110, wy = 760 + Math.cos(u * TAU) * 6;
    const wdir = Math.cos(u * TAU) > 0 ? 1 : -1;
    const tray = (g, hand, back, line, lw) => { ink(g, ell(hand[0] + 2, hand[1] - 2, 7, 1.6), '#c9a46a', lw * 0.7, line); ink(g, poly([[hand[0], hand[1] - 3], [hand[0] + 3, hand[1] - 3], [hand[0] + 2.6, hand[1] - 6], [hand[0] + 0.4, hand[1] - 6]]), '#f4efe6', lw * 0.6, line); };
    const drawWaiter = () => drawFolk(g, waiter, t, { x: wx, y: wy, dir: wdir, step: (t * 0.9) % 1, armR: -1.5, hold: tray });
    if (wy < 758) drawWaiter();
    for (const tb of tables) {
      const s = pxu(tb.y);
      // sitters behind the table
      for (const f of tb.sitters) {
        const lift = teaT.lift * (0.8 + 0.2 * Math.sin(t * 3 + f.ph));
        const cup = (g, hand, back, line, lw) => { ink(g, poly([[hand[0] - 1.8, hand[1] - 4], [hand[0] + 1.8, hand[1] - 4], [hand[0] + 1.4, hand[1] - 0.5], [hand[0] - 1.4, hand[1] - 0.5]]), '#f4efe6', lw * 0.6, line); g.fillStyle = '#c96a4a'; g.fillRect(hand[0] - 1.6, hand[1] - 3, 3.2, 0.8); };
        drawFolk(g, f, t, { x: tb.x + f.dx * s, y: tb.y + (f.dy || 0) * s * 0.3 - 2 * s, crouch: 1, armR: -0.9 - lift * 1.2, hold: cup, mouth: lift > 0.5 ? 0.3 : 0, happy: lift > 0.7, noShadow: false });
      }
      // the table: a driftwood slab on two stones, with a teapot and a plate of something
      grounded(g, tb.x, tb.y + 4 * s, 10 * s, 50 * s, (g) => {
        for (const k of [-1, 1]) F.post(g, tb.x + k * 18 * s, tb.y - 4 * s, tb.y + 1 * s, 2.6 * s, F.PAL.drift, 1);
        F.plank(g, [tb.x - 27 * s, tb.y - 4 * s], [tb.x + 27 * s, tb.y - 3 * s], 4 * s, F.PAL.drift, Math.round(tb.x), 1.2);
        const px = tb.x + 4 * s, py = tb.y - 6 * s, pr = 5 * s;
        g.save(); g.translate(px, py); g.rotate(teaT.lift * -0.4);
        ink(g, curve([[-pr, 0], [-pr * 1.05, -pr * 0.9], [0, -pr * 1.35], [pr * 1.05, -pr * 0.9], [pr, 0]]), '#4f8fa3', 1);
        ink(g, poly([[pr * 0.8, -pr * 0.6], [pr * 1.9, -pr * 1.3], [pr * 1.8, -pr * 1.0], [pr * 0.9, -pr * 0.2]]), '#4f8fa3', 0.8);
        g.fillStyle = '#f2c95c'; g.fill(circ(0, -pr * 1.4, pr * 0.22));
        g.restore();
        ink(g, ell(tb.x - 14 * s, tb.y - 6.5 * s, 6 * s, 1.6 * s), '#f4efe6', 0.8);
        g.fillStyle = '#c98a4a'; for (let k = 0; k < 3; k++) g.fill(circ(tb.x - 16 * s + k * 2.4 * s, tb.y - 7.5 * s, 1.3 * s));
      });
    }
    if (wy >= 758) drawWaiter();
  },
});

// ============================================================ stalls
// a stall: two posts, a striped awning that flaps, a counter with goods; draw it standing at (x, y)
function stall(g, x, y, t, o) {
  const s = pxu(y), w = o.w * s, h = 44 * s;
  grounded(g, x, y, h, w, () => {});
  for (const k of [-1, 1]) F.post(g, x + k * w / 2, y - h, y, 2.4 * s, F.PAL.drift, 1);
  // counter
  const cy = y - 16 * s;
  ink(g, poly([[x - w / 2 - 2 * s, cy], [x + w / 2 + 2 * s, cy], [x + w / 2, y], [x - w / 2, y]]), F.mix(o.col, '#3b2433', 0.15), 1.2);
  g.fillStyle = 'rgba(70,40,80,0.3)'; g.fillRect(x + w * 0.1, cy, w * 0.4, 16 * s);
  // the counter's top, seen from a little above
  ink(g, poly([[x - w / 2 - 3 * s, cy], [x + w / 2 + 3 * s, cy], [x + w / 2 + 1 * s, cy - 5 * s * flat(y) * 4], [x - w / 2 - 1 * s, cy - 5 * s * flat(y) * 4]]), F.PAL.drift.lit, 1);
  F.plank(g, [x - w / 2 - 3 * s, cy + 1 * s], [x + w / 2 + 3 * s, cy + 1 * s], 3 * s, F.PAL.drift, Math.round(x), 1.1);
  if (o.goods) o.goods(g, x, cy, s);
  // the awning: stripes, a scalloped hem that ripples in the wind, and its shade on the counter
  const wv = D.wind(t, x), fl = o.flap || 0;
  const ay = y - h, hem = 8 * s;
  const awn = new Path2D();
  awn.moveTo(x - w / 2 - 6 * s, ay + hem); awn.lineTo(x - w / 2, ay - 4 * s); awn.lineTo(x + w / 2, ay - 4 * s); awn.lineTo(x + w / 2 + 6 * s, ay + hem);
  const n = 6;
  for (let k = n; k > 0; k--) { const x0 = lerp(x - w / 2 - 6 * s, x + w / 2 + 6 * s, k / n), x1 = lerp(x - w / 2 - 6 * s, x + w / 2 + 6 * s, (k - 1) / n); awn.quadraticCurveTo((x0 + x1) / 2, ay + hem + (4 + Math.sin(t * 6 + k + x) * 1.5 * (wv + fl * 2)) * s, x1, ay + hem); }
  awn.closePath();
  ink(g, awn, o.col2 || '#f4efe6', 1.2);
  g.save(); g.clip(awn);
  for (let k = 0; k < 8; k += 2) { const x0 = lerp(x - w / 2 - 6 * s, x + w / 2 + 6 * s, k / 8), x1 = lerp(x - w / 2 - 6 * s, x + w / 2 + 6 * s, (k + 1) / 8); g.fillStyle = o.col; g.fillRect(x0, ay - 10 * s, x1 - x0, 30 * s); }
  g.fillStyle = 'rgba(70,40,90,0.25)'; g.fillRect(x - w, ay + 2 * s, w * 2, 20 * s);
  g.restore();
  g.fillStyle = 'rgba(70,40,90,0.18)'; g.fillRect(x - w / 2, ay + hem, w, 10 * s);
}
// the bakery
const bakery = { x: 905, y: 948, offer: 0, vendor: folk({ sp: 'vole', coat: '#efe2c8', cloth: 'apron', acc: '#d65a4a', dir: 1, hat: F.HATS.kerchief('#f4efe6') }), cust: folk({ sp: 'mole', coat: '#6f9d58', dir: -1 }) };
layer({
  id: 'bakery', z: F.zOf(bakery.y),
  hit: (x, y) => Math.abs(x - bakery.x - 20) < 70 && y > bakery.y - 70 && y < bakery.y + 10,
  update(dt, t, L) { bakery.offer = ease(bakery.offer, L.hovered ? 1 : 0, L.hovered ? 3 : 1.2, dt); stepFolk(bakery.vendor, dt); stepFolk(bakery.cust, dt); },
  draw(g, t) {
    const s = pxu(bakery.y), o = bakery.offer;
    drawFolk(g, bakery.vendor, t, { x: bakery.x - 8 * s, y: bakery.y - 8 * s, armR: -o * 1.6, hold: o > 0.4 && o < 0.95 ? (g, hand, b, line, lw) => ink(g, ell(hand[0] + 2, hand[1] - 1, 4, 2.2), '#c98a4a', lw * 0.7, line) : null, noShadow: true });
    stall(g, bakery.x, bakery.y, t, { w: 56, col: '#d65a4a', goods: (g, x, cy, s) => {
      for (let k = 0; k < 4; k++) { ink(g, ell(x - 18 * s + k * 9 * s, cy - 2.5 * s, 4 * s, 2.4 * s), ['#c98a4a', '#b87440', '#d9a05a', '#6f7f45'][k], 0.8); g.fillStyle = 'rgba(255,240,210,0.6)'; g.fill(ell(x - 19 * s + k * 9 * s, cy - 3.6 * s, 2 * s, 0.7 * s)); }
      for (let k = 0; k < 2; k++) ink(g, poly([[x + 16 * s + k * 6 * s, cy], [x + 16 * s + k * 6 * s, cy - 7 * s], [x + 20 * s + k * 6 * s, cy - 7 * s], [x + 20 * s + k * 6 * s, cy]]), '#9fc0c8', 0.7);
    } });
    drawFolk(g, bakery.cust, t, { x: bakery.x + 40 * s, y: bakery.y + 6 * s, armR: -0.6 - o * 0.9, happy: o > 0.9, hold: (g, hand, b, line, lw) => {
      ink(g, poly([[b[0] - 4, b[1]], [b[0] + 4, b[1]], [b[0] + 3, b[1] + 5], [b[0] - 3, b[1] + 5]]), '#c99a5a', lw * 0.7, line);
      if (o > 0.95) ink(g, ell(hand[0] + 1, hand[1] - 1, 4, 2.2), '#c98a4a', lw * 0.7, line);
    } });
  },
});
// the shell-chime stall, next to gran
const chimes = { x: 655, y: 880, swing: [0, 1, 2, 3, 4].map((i) => F.pendulum({ k: 26, damp: 1.4, lean: 0.12, x: 585 + i * 10 })), vendor: folk({ sp: 'mole', coat: '#a8689b', acc: '#f2c95c', dir: 1, hat: F.HATS.cap('#5a7b8c') }) };
layer({
  id: 'chimes', z: F.zOf(chimes.y),
  hit: (x, y) => Math.abs(x - chimes.x) < 60 && y > chimes.y - 80 && y < chimes.y + 10,
  onEnter() { chimes.swing.forEach((p, i) => (p.v += (P.vx >= 0 ? 1 : -1) * (5 + i))); for (let i = 0; i < 4; i++) F.spawn({ kind: 'spark', x: chimes.x - 20 + i * 14, y: chimes.y - 50, vy: -10, life: 0.6, size: 0.7 }); F.spawn({ kind: 'word', text: 'tink tink', x: chimes.x, y: chimes.y - 80, vy: -12, life: 1.4, size: 0.8 }); },
  update(dt, t) { for (const p of chimes.swing) F.swing(p, dt, t); stepFolk(chimes.vendor, dt); },
  draw(g, t) {
    const s = pxu(chimes.y);
    drawFolk(g, chimes.vendor, t, { x: chimes.x - 6 * s, y: chimes.y - 8 * s, noShadow: true });
    stall(g, chimes.x, chimes.y, t, { w: 52, col: '#4f8fa3', goods: (g, x, cy, s) => {
      const r = rng(4);
      for (let k = 0; k < 6; k++) { const px = x - 20 * s + k * 7.5 * s; ink(g, curve([[px - 3 * s, cy], [px - 2.5 * s, cy - 3 * s], [px, cy - 4 * s], [px + 2.5 * s, cy - 3 * s], [px + 3 * s, cy]]), ['#f3d3c0', '#e9c3ad', '#f5e6d0', '#dcc4c8'][k % 4], 0.7); }
    } });
    // chimes hang from the awning's front edge
    const ay = chimes.y - 44 * s + 8 * s;
    chimes.swing.forEach((p, i) => {
      const hx = chimes.x - 20 * s + i * 10 * s, len = (10 + (i % 3) * 4) * s;
      const ex = hx + Math.sin(p.a) * len, ey = ay + Math.cos(p.a) * len;
      g.strokeStyle = LINE; g.lineWidth = 0.6; g.beginPath(); g.moveTo(hx, ay); g.lineTo(ex, ey); g.stroke();
      g.save(); g.translate(ex, ey); g.rotate(p.a);
      ink(g, curve([[-2 * s, 0], [-1.6 * s, 3 * s], [0, 5 * s], [1.6 * s, 3 * s], [2 * s, 0]]), ['#f5e6d0', '#f3d3c0', '#e9c3ad', '#dce6e8', '#f2e0e8'][i], 0.6);
      g.restore();
    });
  },
});

// ============================================================ the kite
const kite = { kid: folk({ sp: 'hare', x: 1455, y: 960, coat: '#f2c95c', acc: '#4f8fa3', dir: 1, acts: [['look', 2]] }), x: 1700, y: 160, climb: 0, sx: 1700, sy: 160, vx: 0, vy: 0 };
layer({
  id: 'kite', z: F.zOf(kite.kid.y),
  hit(x, y) { return Math.hypot(x - kite.x, y - kite.y) < 60 || (Math.abs(x - kite.kid.x) < 26 && y > kite.kid.y - 50 && y < kite.kid.y + 6); },
  update(dt, t, L) {
    stepFolk(kite.kid, dt);
    kite.climb = ease(kite.climb, L.hovered ? 1 : 0, L.hovered ? 1.2 : 0.4, dt);
    const w = D.wind(t, 1700);
    const tx = 1690 + Math.sin(t * 0.4) * 40 + w * 30 + kite.climb * 40, ty = 190 - w * 30 - kite.climb * 70 + Math.sin(t * 0.9) * 12;
    kite.vx += ((tx - kite.x) * 3 - kite.vx * 1.8) * dt; kite.vy += ((ty - kite.y) * 3 - kite.vy * 1.8) * dt;
    kite.x += kite.vx * dt; kite.y += kite.vy * dt;
  },
  draw(g, t) {
    const k = kite.kid, s = pxu(k.y), tip = kite.climb;
    const hand = [k.x + 6 * s, k.y - 24 * s - tip * 4 * s];
    // the line, bowing in the wind
    g.strokeStyle = 'rgba(70,50,70,0.4)'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(hand[0], hand[1]); g.bezierCurveTo(hand[0] + 40, hand[1] - 200, hand[0] + 260 + D.wind(t, 1600) * 40, (hand[1] + kite.y) / 2 + 60, kite.x - 6, kite.y + 12); g.stroke();
    // the kite: a fish, with a ribbon tail that streams
    const ang = Math.atan2(kite.vy, 40) * 0.5 + Math.sin(t * 1.7) * 0.15;
    g.save(); g.translate(kite.x, kite.y); g.rotate(ang);
    const tail = [];
    for (let i = 0; i < 12; i++) tail.push([-16 - i * 7, 12 + i * 3 + Math.sin(t * 5 - i * 0.7) * (3 + i * 0.6) * (1 + tip)]);
    g.lineWidth = 2.4; g.strokeStyle = LINE; g.beginPath(); tail.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(-10, 8))); g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = '#d65a4a'; g.stroke();
    tail.forEach(([x, y], i) => { if (i % 3 === 2) ink(g, poly([[x - 3, y - 3], [x + 3, y], [x - 3, y + 3]]), ['#f2c95c', '#4f8fa3', '#f4efe6', '#d65a4a'][(i / 3) | 0], 0.7); });
    const body = curve([[-18, 0], [-6, -10], [14, -7], [22, 0], [14, 7], [-6, 10]]);
    ink(g, body, '#e7a43c', 1.4);
    g.save(); g.clip(body); g.fillStyle = '#d65a4a'; for (let i = 0; i < 4; i++) g.fill(ell(-8 + i * 7, 0, 2.6, 9)); g.fillStyle = 'rgba(80,50,90,0.25)'; g.fillRect(-20, 2, 44, 10); g.restore();
    ink(g, poly([[-18, 0], [-28, -8], [-25, 0], [-28, 8]]), '#d65a4a', 1.1);
    ink(g, circ(14, -2, 2.6), '#fff', 0.8); g.fillStyle = LINE; g.fill(circ(14.6, -2, 1.2));
    g.restore();
    drawFolk(g, k, t, { armR: -2.3 - tip * 0.3, armL: -1.6, lean: -0.08 - tip * 0.1, bob: -tip * 3, look: [0.6, -1], head: 0.3, happy: tip > 0.6, mouth: tip * 0.6 });
  },
});

// ============================================================ the laundry pool
const wash = { x: 440, y: 942, splash: 0, flap: 0, otters: [folk({ sp: 'otter', dx: -50, coat: '#5a7b8c', cloth: 'tunic', dir: 1 }), folk({ sp: 'otter', dx: 46, coat: '#e07f62', acc: '#f2c95c', dir: -1 })],
  line: [[340, 900], [565, 912]], items: [{ c: '#f4efe6', w: 18, h: 22 }, { c: '#d65a4a', w: 13, h: 15 }, { c: '#f2c95c', w: 20, h: 14 }, { c: '#4f8fa3', w: 14, h: 24 }, { c: '#efe2c8', w: 10, h: 12 }, { c: '#a8689b', w: 16, h: 18 }] };
layer({
  id: 'laundry', z: F.zOf(wash.y),
  hit: (x, y) => x > 320 && x < 600 && y > 850 && y < 975,
  onEnter() { wash.splash = 1; const s = pxu(wash.y); for (let i = 0; i < 14; i++) F.spawn({ kind: 'drop', x: wash.x + (Math.random() - 0.5) * 80 * s, y: wash.y - 4 * s, vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 60, g: 260, life: 0.8, size: s }); },
  update(dt, t, L) { wash.flap = ease(wash.flap, L.hovered ? 1 : 0, 2, dt); wash.splash = Math.max(0, wash.splash - dt); for (const o of wash.otters) stepFolk(o, dt); },
  draw(g, t) {
    const s = pxu(wash.y);
    // poles and the line
    const [a, b] = wash.line;
    for (const [x, y] of [a, b]) { const sy = pxu(y + 40); grounded(g, x, y + 40 * sy, 50 * sy, 3 * sy, () => F.post(g, x, y - 4, y + 40 * sy, 3.2 * sy, F.PAL.drift, 1)); }
    const sag = 16 + Math.sin(t * 1.3) * 2;
    g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo((a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + sag * 2, b[0], b[1]); g.stroke();
    wash.items.forEach((c, i) => {
      const u = (i + 0.6) / (wash.items.length + 0.2), x = lerp(a[0], b[0], u), y = lerp(a[1], b[1], u) + 4 * u * (1 - u) * sag * 2 * 0.5 * 2 * 0.5;
      const w = D.wind(t, x) + wash.flap * 1.2, fl = Math.sin(t * (4 + wash.flap * 6) + i * 1.9) * 0.2 * w;
      g.save(); g.translate(x, y); g.rotate(-w * 0.2 + fl); g.scale(s * 0.9, s * 0.9);
      const p = poly([[-c.w / 2, 0], [c.w / 2, 0], [c.w / 2 + w * 4, c.h], [-c.w / 2 + w * 4, c.h * (0.9 + fl)]]);
      ink(g, p, c.c, 1.2);
      g.fillStyle = 'rgba(80,60,100,0.22)'; g.fill(poly([[c.w * 0.1, 0], [c.w / 2, 0], [c.w / 2 + w * 4, c.h], [c.w * 0.1 + w * 4, c.h]]));
      g.fillStyle = '#c99a5a'; g.fillRect(-c.w / 2 + 1, -2, 2, 4); g.fillRect(c.w / 2 - 3, -2, 2, 4);
      g.restore();
    });
    // the two otters, waist-deep in the pool, scrubbing and wringing
    wash.otters.forEach((o, i) => {
      const scrub = Math.sin(t * (3 + wash.splash * 8) + i * 2);
      const ox = wash.x + o.dx * s, oy = wash.y + 4 * s;
      g.save();
      g.beginPath(); g.rect(ox - 30 * s, oy - 60 * s, 60 * s, 58 * s); g.clip();
      drawFolk(g, o, t, { x: ox, y: oy + 6 * s, armR: -0.9 + scrub * 0.4, armL: -0.8 - scrub * 0.3, noShadow: true, mouth: wash.splash > 0.2 ? 0.6 : 0, happy: wash.splash > 0.2,
        hold: (g, hand) => { if (i === 1) ink(g, ell(hand[0] + 1, hand[1] + 1, 2, 5, undefined, 0.6 + scrub * 0.3), '#f4efe6', 0.5); } });
      g.restore();
      // the water line round them, with ripples
      g.strokeStyle = 'rgba(255,255,250,0.75)'; g.lineWidth = 1;
      g.beginPath(); g.ellipse(ox, oy - 2 * s, 9 * s, 2 * s, 0, 0, TAU); g.stroke();
      g.strokeStyle = 'rgba(255,255,250,0.35)'; const rr = (t * 0.6 + i * 0.5) % 1;
      g.beginPath(); g.ellipse(ox, oy - 2 * s, (9 + rr * 16) * s, (2 + rr * 3) * s, 0, 0, TAU); g.stroke();
    });
    // a basket of washing on the bank
    grounded(g, wash.x + 110 * s, wash.y + 10 * s, 10 * s, 18 * s, (g) => {
      const bx = wash.x + 110 * s, by = wash.y + 10 * s;
      ink(g, poly([[bx - 9 * s, by - 9 * s], [bx + 9 * s, by - 9 * s], [bx + 7 * s, by], [bx - 7 * s, by]]), '#c99a5a', 1);
      for (const [dx, c] of [[-4, '#f4efe6'], [2, '#4f8fa3'], [5, '#f2c95c']]) g.fillStyle = c, g.fill(circ(bx + dx * s, by - 9.5 * s, 3 * s));
    });
  },
});

// ============================================================ the sandcastle
const castle = { x: 545, y: 1062, flag: 0, clap: 0, kids: [folk({ sp: 'vole', dx: -40, coat: '#d65a4a', dir: 1, k: 0.75 }), folk({ sp: 'shrew', dx: 44, coat: '#4f8fa3', acc: '#f2c95c', dir: -1, k: 0.72 })] };
layer({
  id: 'castle', z: F.zOf(castle.y),
  hit: (x, y) => Math.abs(x - castle.x) < 90 && y > castle.y - 70 && y < castle.y + 20,
  update(dt, t, L) { castle.flag = ease(castle.flag, L.hovered ? 1 : 0, L.hovered ? 2.5 : 0.5, dt); castle.clap = L.hovered && L.since > 1 ? 1 : ease(castle.clap, 0, 2, dt); for (const k of castle.kids) stepFolk(k, dt); },
  draw(g, t) {
    const s = pxu(castle.y), x = castle.x, y = castle.y;
    // the moat, a ring of wet sand with water in it
    ink(g, ell(x, y + 2 * s, 46 * s, 11 * s), '#b8a2a2', 0);
    g.fillStyle = F.rgba('#c9d9da', 0.85); g.fill(ell(x, y + 2 * s, 40 * s, 8 * s));
    g.fillStyle = F.rgba('#fff8ea', 0.6); g.fillRect(x - 30 * s, y + 4 * s, 26 * s, 0.8 * s);
    // the castle: three sand towers with crenellations and a shell door
    const sand = { lit: '#f1d7ad', base: '#d9b688', shade: '#a98a86' };
    const tower = (tx, tw, th) => {
      const p = poly([[tx - tw / 2, y], [tx - tw / 2 * 0.9, y - th], [tx + tw / 2 * 0.9, y - th], [tx + tw / 2, y]]);
      ink(g, p, sand.base, 1.2);
      g.save(); g.clip(p); g.fillStyle = sand.lit; g.fillRect(tx - tw / 2, y - th, tw * 0.35, th); g.fillStyle = sand.shade; g.fillRect(tx + tw * 0.15, y - th, tw * 0.4, th);
      g.strokeStyle = 'rgba(140,110,100,0.5)'; g.lineWidth = 0.7; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(tx - tw / 2, y - (th * k) / 4 + Math.sin(k + tx) * s); g.lineTo(tx + tw / 2, y - (th * k) / 4 + Math.cos(k + tx) * s); g.stroke(); }
      g.restore();
      for (let k = 0; k < 3; k++) ink(g, poly([[tx - tw * 0.45 + k * tw * 0.33, y - th], [tx - tw * 0.45 + k * tw * 0.33, y - th - 3 * s], [tx - tw * 0.25 + k * tw * 0.33, y - th - 3 * s], [tx - tw * 0.25 + k * tw * 0.33, y - th]]), sand.base, 0.8);
    };
    F.castShadow(g, x, y, (g) => g.fill(poly([[-30 * s, 0], [30 * s, 0], [20 * s, -26 * s], [-20 * s, -26 * s]])), 0.35);
    tower(x - 18 * s, 14 * s, 16 * s); tower(x + 17 * s, 13 * s, 14 * s); tower(x, 17 * s, 26 * s);
    ink(g, curve([[x - 3 * s, y], [x - 3 * s, y - 6 * s], [x, y - 8 * s], [x + 3 * s, y - 6 * s], [x + 3 * s, y]]), '#4a3346', 0.8);
    ink(g, curve([[x - 2 * s, y - 14 * s], [x, y - 17 * s], [x + 2 * s, y - 14 * s], [x, y - 13 * s]]), '#f3d3c0', 0.6);
    // the flag goes in
    const fh = castle.flag;
    if (fh > 0.02) {
      const fy = y - 29 * s - (1 - fh) * -10 * s;
      g.strokeStyle = LINE; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x, y - 26 * s); g.lineTo(x, fy - 14 * s * fh); g.stroke();
      ink(g, poly([[x, fy - 14 * s * fh], [x + 11 * s * fh, fy - 11 * s * fh + Math.sin(t * 7) * s], [x, fy - 8 * s * fh]]), '#d65a4a', 0.7);
    }
    // a bucket and a spade
    ink(g, poly([[x + 62 * s, y], [x + 70 * s, y], [x + 71 * s, y - 9 * s], [x + 61 * s, y - 9 * s]]), '#e7a43c', 0.9);
    ink(g, ell(x + 66 * s, y - 9 * s, 5 * s, 1.4 * s), '#c9863a', 0.7);
    castle.kids.forEach((k, i) => {
      const dig = Math.sin(t * 3 + i * 2), c = castle.clap;
      drawFolk(g, k, t, { x: x + k.dx * s, y: y + 6 * s, crouch: 0.7 - c * 0.5, armR: c > 0.5 ? -1.6 + Math.sin(t * 16) * 0.5 : -0.4 + dig * 0.5, armL: c > 0.5 ? -1.6 - Math.sin(t * 16) * 0.5 : 0.3, happy: c > 0.5 || castle.flag > 0.8, mouth: c * 0.5, look: [0.5 * k.dir, 0.6],
        hold: i === 0 && c < 0.5 ? (g, hand, b, line, lw) => { g.strokeStyle = line; g.lineWidth = lw * 0.6; g.beginPath(); g.moveTo(hand[0], hand[1] - 2); g.lineTo(hand[0] + 4, hand[1] + 7); g.stroke(); ink(g, ell(hand[0] + 4.5, hand[1] + 8, 1.6, 2.2), '#9fb0bf', lw * 0.5, line); } : null });
    });
  },
});

// ============================================================ the porters
const porters = { a: folk({ sp: 'otter', k: 1 }), b: folk({ sp: 'otter', k: 1 }), stumble: 0, fish: 0, t0: 0 };
layer({
  id: 'porters', z: F.zOf(1030),
  hit(x, y) { return Math.abs(x - porters.cx) < 50 && Math.abs(y - porters.cy + 10) < 30; },
  onEnter() { porters.stumble = 1; porters.fish = 1; },
  update(dt, t) { porters.stumble = Math.max(0, porters.stumble - dt * 0.7); porters.fish = Math.max(0, porters.fish - dt * 0.6); },
  draw(g, t) {
    // they carry their basket back and forth between the boats and the fishmonger's stall
    const sp = 0.03 * (1 - porters.stumble * 0.8);
    porters.t0 += sp * (1 / 60);
    const u = (t * 0.035) % 2, fwd = u < 1, k = fwd ? u : 2 - u;
    const x = lerp(700, 1010, F.smooth(k)), y = 1030 + Math.sin(k * Math.PI) * 8;
    porters.cx = x; porters.cy = y;
    const s = pxu(y) * 0.82, dir = fwd ? 1 : -1, step = (t * 1.3) % 1, wob = porters.stumble * Math.sin(t * 14) * 0.25;
    const lead = [x + dir * 18 * s, y], back = [x - dir * 18 * s, y];
    const ln = (hand) => hand;
    // pole and basket between them
    const ph = y - 22 * s + Math.sin(step * TAU * 2) * 0.8 * s;
    const basket = [x, ph + 8 * s + wob * 8 * s];
    for (const [px, py] of [back]) F.puffin(g, px, py, { sc: s, dir, lean: wob, flap: porters.stumble * Math.abs(Math.sin(t * 20)), hop: Math.max(0, Math.sin(step * TAU)) * 1.5 });
    g.strokeStyle = LINE; g.lineWidth = 2.6; g.beginPath(); g.moveTo(back[0], ph); g.lineTo(lead[0], ph); g.stroke();
    g.strokeStyle = '#c49a6a'; g.lineWidth = 1.4; g.stroke();
    g.strokeStyle = LINE; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - 4 * s, ph); g.lineTo(basket[0] - 6 * s, basket[1] - 4 * s); g.moveTo(x + 4 * s, ph); g.lineTo(basket[0] + 6 * s, basket[1] - 4 * s); g.stroke();
    F.castShadow(g, x, y, (g) => g.fill(ell(0, -10 * s, 7 * s, 5 * s)), 0.3);
    ink(g, poly([[basket[0] - 8 * s, basket[1] - 4 * s], [basket[0] + 8 * s, basket[1] - 4 * s], [basket[0] + 6 * s, basket[1] + 4 * s], [basket[0] - 6 * s, basket[1] + 4 * s]]), '#c99a5a', 1);
    for (let k = 0; k < 3; k++) ink(g, ell(basket[0] - 4 * s + k * 4 * s, basket[1] - 5 * s, 3.2 * s, 1.3 * s, undefined, 0.4 - k * 0.4), '#b9c3c8', 0.6);
    // the escaping fish
    if (porters.fish > 0) {
      const fk = 1 - porters.fish, fx = basket[0] + dir * fk * 26 * s, fy = basket[1] - 6 * s - Math.sin(fk * Math.PI) * 24 * s;
      g.save(); g.translate(fx, fy); g.rotate(fk * 9);
      ink(g, ell(0, 0, 5 * s, 2 * s), '#b9c3c8', 0.8); ink(g, poly([[-4 * s, 0], [-7 * s, -2.4 * s], [-7 * s, 2.4 * s]]), '#9aa6ae', 0.6);
      g.restore();
    }
    F.puffin(g, lead[0], lead[1], { sc: s, dir, lean: -wob, flap: porters.stumble * Math.abs(Math.sin(t * 18 + 1)), hop: Math.max(0, Math.sin(step * TAU + Math.PI)) * 1.5, beakOpen: porters.stumble });
    F.contact(g, lead[0], lead[1], 7 * s, 0.4); F.contact(g, back[0], back[1], 7 * s, 0.4);
  },
});

// ============================================================ the strolling couple
const couple = { a: folk({ sp: 'mole', coat: '#5a7b8c', acc: '#efe2c8', dir: 1, hat: null }), b: folk({ sp: 'mole', coat: '#a8689b', cloth: 'smock', acc: '#f2c95c', dir: 1, hat: F.HATS.kerchief('#e07f62') }), stop: 0, u: 0 };
layer({
  id: 'wander', z: F.zOf(988),
  hit(x, y) { return Math.abs(x - couple.x) < 50 && y > couple.y - 60 && y < couple.y + 8; },
  update(dt, t, L) { couple.stop = ease(couple.stop, L.hovered ? 1 : 0, 3, dt); couple.u += dt * 0.012 * (1 - couple.stop); stepFolk(couple.a, dt); stepFolk(couple.b, dt); },
  draw(g, t) {
    const u = couple.u % 2, k = u < 1 ? u : 2 - u, dir = u < 1 ? 1 : -1;
    const x = lerp(620, 830, k), y = 988 + Math.sin(k * 7) * 4;
    couple.x = x; couple.y = y;
    const s = pxu(y), step = (t * 0.7) % 1;
    const hatUp = couple.stop;
    drawFolk(g, couple.b, t, { x: x - dir * 15 * s, y: y - 3 * s, dir, step: hatUp > 0.5 ? undefined : (step + 0.5) % 1, armR: -0.2 });
    drawFolk(g, couple.a, t, { x, y, dir, step: hatUp > 0.5 ? undefined : step, head: hatUp * 0.4, happy: hatUp > 0.7,
      armR: -hatUp * 2.6, hat: hatUp > 0.4 ? null : F.HATS.cap('#3b2433'), armL: 0.5,
      hold: (g, hand, back, line, lw) => {
        // a walking stick in the back hand, the hat lifted in the front one
        g.strokeStyle = line; g.lineWidth = lw * 1.2; g.beginPath(); g.moveTo(back[0], back[1]); g.lineTo(back[0] + 3, back[1] + 10); g.stroke();
        g.strokeStyle = '#8a5a3a'; g.lineWidth = lw * 0.6; g.stroke();
        if (hatUp > 0.4) { g.save(); g.translate(hand[0], hand[1] - 4); g.rotate(-0.3); F.HATS.cap('#3b2433')(g, 6.4, line, lw); g.restore(); }
      } });
  },
});

// ============================================================ the ladder climber on gran
const climber = { f: folk({ sp: 'vole', coat: '#f2c95c', acc: '#5a7b8c', dir: 1 }), wave: 0 };
layer({
  id: 'climber', z: F.zOf(F.gran.y) + 0.1,
  hit(px, py) { const [x, y] = climber.at || [0, 0]; return Math.abs(px - x) < 20 && py > y - 34 && py < y + 8; },
  update(dt, t, L) { climber.wave = ease(climber.wave, L.hovered ? 1 : 0, 4, dt); stepFolk(climber.f, dt); },
  draw(g, t) {
    const gr = F.gran, S = gr.S, w0 = gr.sp.ws[0], w1 = gr.sp.ws[1];
    // the rope ladder hangs from the first ledge down past the foot to the sand
    const lx = gr.x + (w0.cx - w0.rt * 0.72) * S, top = gr.y + (F.bandBottom(w1, w0.cx - w0.rt * 0.72) - 2) * S, bot = gr.y + 2;
    const sway = Math.sin(t * 0.8) * 2 + D.wind(t, lx) * 2;
    for (const dx of [-5, 5]) { g.strokeStyle = LINE; g.lineWidth = 1.8; g.beginPath(); g.moveTo(lx + dx, top); g.quadraticCurveTo(lx + dx + sway, (top + bot) / 2, lx + dx + sway * 1.6, bot); g.stroke(); g.strokeStyle = '#c49a6a'; g.lineWidth = 1; g.stroke(); }
    const n = Math.round((bot - top) / 11);
    for (let k = 1; k < n; k++) { const u = k / n, y = lerp(top, bot, u), ox = sway * 1.6 * u * u * 0.8 + sway * u * 0.3; F.plank(g, [lx - 6 + ox, y], [lx + 6 + ox, y], 2.2, F.WOOD, k, 0.7); }
    // the climber goes up and down, pausing at the top
    const c = (t * 0.06) % 1, up = c < 0.45 ? c / 0.45 : c < 0.55 ? 1 : 1 - (c - 0.55) / 0.45;
    const pause = climber.wave > 0.1;
    climber.pos = pause ? climber.pos : lerp(bot - 6, top + 32, F.smooth(up));
    const y = climber.pos ?? bot, u = (y - top) / (bot - top), x = lx + sway * 1.6 * u * u * 0.8 + sway * u * 0.3;
    climber.at = [x, y];
    const s = pxu(gr.y) * 0.8, cl = Math.sin(y * 0.35);
    drawFolk(g, climber.f, t, { x, y, dir: -1, noShadow: true, armR: climber.wave > 0.3 ? -2.6 + Math.sin(t * 9) * 0.4 : -2.4 + cl * 0.4, armL: -2.4 - cl * 0.4, k: 0.8, happy: climber.wave > 0.5, head: climber.wave * -0.6 });
  },
});

// ============================================================ the netters in the creek
const netters = { a: folk({ sp: 'otter', coat: '#6f9d58', dir: 1 }), b: folk({ sp: 'otter', coat: '#e7a43c', acc: '#d65a4a', dir: -1 }), haul: 0, pinch: 0, x: 1245, y: 772 };
layer({
  id: 'netters', z: F.zOf(netters.y),
  hit: (x, y) => Math.abs(x - netters.x) < 70 && y > netters.y - 50 && y < netters.y + 14,
  update(dt, t, L) { netters.haul = ease(netters.haul, L.hovered ? 1 : 0, L.hovered ? 2 : 1, dt); netters.pinch = L.hovered && L.since > 1 ? 1 : 0; stepFolk(netters.a, dt); stepFolk(netters.b, dt); },
  draw(g, t) {
    const s = pxu(netters.y), h = netters.haul, x = netters.x, y = netters.y;
    const ax = x - 36 * s, bx = x + 36 * s;
    // they stand in the shallows; the net is strung between their poles and dips into the water
    const yank = netters.pinch * Math.max(0, Math.sin(t * 12));
    drawFolk(g, netters.a, t, { x: ax, y: y + 2 * s, armR: -1.2 - h * 0.6, armL: -1.0 - h * 0.5, lean: -h * 0.1, noShadow: true, mouth: yank * 0.8, bob: -yank * 2 });
    drawFolk(g, netters.b, t, { x: bx, y: y + 3 * s, armR: -1.2 - h * 0.6, armL: -1.0 - h * 0.5, lean: h * 0.1, noShadow: true });
    const ty = y - 18 * s - h * 10 * s, dip = (1 - h) * 12 * s;
    const pA = [ax + 8 * s, ty], pB = [bx - 8 * s, ty];
    const net = new Path2D(); net.moveTo(pA[0], pA[1]); net.quadraticCurveTo(x, ty + 30 * s - h * 16 * s + dip, pB[0], pB[1]); net.quadraticCurveTo(x, ty + 8 * s, pA[0], pA[1]);
    g.fillStyle = 'rgba(200,180,150,0.25)'; g.fill(net);
    g.save(); g.clip(net); g.strokeStyle = 'rgba(90,70,60,0.6)'; g.lineWidth = 0.5;
    for (let k = -10; k < 10; k++) { g.beginPath(); g.moveTo(x + k * 5 * s, ty - 10 * s); g.lineTo(x + k * 5 * s + 30 * s, ty + 40 * s); g.moveTo(x + k * 5 * s, ty - 10 * s); g.lineTo(x + k * 5 * s - 30 * s, ty + 40 * s); g.stroke(); }
    g.restore();
    g.strokeStyle = LINE; g.lineWidth = 1; g.stroke(net);
    if (h > 0.6) F.crab(g, x + 2 * s, ty + 16 * s - h * 6 * s, { sc: s * 0.8, col: '#c45a5a', claw: netters.pinch, wave: h > 0.9 ? 1 : 0 });
    // ripples round their legs
    for (const px of [ax, bx]) { g.strokeStyle = 'rgba(255,255,250,0.7)'; g.lineWidth = 1; g.beginPath(); g.ellipse(px, y + 2 * s, 8 * s, 2 * s, 0, 0, TAU); g.stroke(); }
  },
});

// ============================================================ the wanderers far off: tiny folk going about in the haze
const far = [];
{
  const r = rng(303);
  const spots = [[460, 470], [520, 480], [980, 470], [1040, 462], [1130, 520], [1180, 500], [1700, 470], [1760, 480], [1580, 520], [700, 520], [250, 470], [1990, 560], [2080, 540], [860, 530]];
  for (const [x, y] of spots) far.push(folk({ sp: ['otter', 'vole', 'mole', 'hare', 'shrew'][Math.floor(r() * 5)], x, y, dir: r() < 0.5 ? 1 : -1, walk: r() < 0.5 ? (r() < 0.5 ? 1 : -1) * (4 + r() * 6) : 0 }));
}
layer({
  id: 'far-folk', z: F.zOf(480),
  update(dt) { for (const f of far) { stepFolk(f, dt); if (f.walk) { f.x += f.walk * dt; f.dir = f.walk > 0 ? 1 : -1; if (Math.abs(f.x - (f.x0 ??= f.x)) > 90) f.walk *= -1; } } },
  draw(g, t) { for (const f of far) drawFolk(g, f, t, { step: f.walk ? (t * 0.8 + f.ph) % 1 : undefined }); },
});

// ============================================================ kids chasing a runaway crab
const chase = { kids: [folk({ sp: 'vole', coat: '#e07f62', dir: 1, k: 0.72 }), folk({ sp: 'hare', coat: '#a8689b', acc: '#f2c95c', dir: 1, k: 0.75 }), folk({ sp: 'otter', coat: '#f2c95c', dir: 1, k: 0.7 })], fast: 0 };
layer({
  id: 'chase', z: F.zOf(905),
  hit(x, y) { return Math.abs(x - (chase.cx || 0)) < 80 && Math.abs(y - (chase.cy || 0) + 10) < 30; },
  update(dt, t, L) { chase.fast = ease(chase.fast, L.hovered ? 1 : 0, 3, dt); chase.ph = (chase.ph || 0) + dt * (0.05 + chase.fast * 0.06); for (const k of chase.kids) stepFolk(k, dt); },
  draw(g, t) {
    // a loop round the stalls between gran and the band: the crab leads, the kids follow
    const at = (u) => { const a = u * TAU; return [760 + Math.cos(a) * 150, 905 + Math.sin(a) * 26]; };
    const u0 = chase.ph % 1;
    const items = [];
    const [cx, cy] = at(u0); chase.cx = cx; chase.cy = cy;
    items.push({ y: cy, d: () => { const s = pxu(cy); F.contact(g, cx, cy, 6 * s, 0.4); F.crab(g, cx, cy - Math.abs(Math.sin(t * 14)) * 2 * s, { sc: s * 0.9, col: '#d9644a', walk: t * 6, wave: 1 }); } });
    chase.kids.forEach((k, i) => {
      const u = u0 - 0.035 * (i + 1), [x, y] = at(u), [x2] = at(u + 0.01), dir = x2 > x ? 1 : -1;
      items.push({ y, d: () => drawFolk(g, k, t, { x, y, dir, step: (t * (1.8 + chase.fast) + i * 0.3) % 1, armR: -1.6 - Math.sin(t * 10 + i) * 0.4, armL: 0.6, lean: dir * 0.12, happy: true, mouth: 0.6 }) });
    });
    items.sort((a, b) => a.y - b.y).forEach((it) => it.d());
  },
});

F.drawFolk = drawFolk; F.makeFolk = folk; F.stepFolk = stepFolk; F.grounded = grounded;
F.tickSea = (dt) => { seaLook = Math.max(0, seaLook - dt); };
})();
