/* guests.js — everyone filed in the drawers, and the contagious yawn.

   One layer per drawer (z 20.x). A drawer is closed (its guest unseen, its tag hanging from the
   pull), or ajar with its guest asleep on the lip, or — the bear cub's — stuck open. Guests:
   dormice in sock-lined drawers, hedgehogs in leaf litter, red squirrels under their own tails, a
   tortoise in a hatbox, a ladybird cluster, a queen bumblebee on cotton, a snail sealed in, bats
   hanging off the pulls, and the bear cub in the bottom drawer.

   Opening geometry: a drawer above eye level that slides toward us rises a little and grows, and
   its underside shows below it; one below eye level drops and shows its inside. Its side panel
   shows on the side facing the middle of the picture.

   Hover a drawer: the sleeper stirs (rolls, snores — a paper Z floats out, a breath of vapour),
   the tag lifts so you can read it. Linger, or tap: the guest wakes, squints at its own tag and
   yawns; the yawn spreads to neighbours (downhill more readily) until porters settle them. If it
   reaches the bear cub, the stack shudders (OW.emit('shudder')). */
(() => {
const { TAU, clamp, lerp, ease, rng, noise, wind, st, P, layer, grad, radial, poly, curve, circ, ell, ink, seg } = Drawn;
const C = OW.C, HZ = OW.HZ, LINE = OW.LINE, mix = OW.mix;
const PX = 720;
const D = OW.drawers;
const bump = (u) => (u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------ who is filed where
const R = rng(4242);
const near = (x, y) => D.filter((d) => !d.bear).sort((a, b) => Math.hypot(a.cx - x, a.cy - y) - Math.hypot(b.cx - x, b.cy - y))[0];
const focal = near(600, 760);
focal.focal = true;
OW.focalDrawer = focal;
const TAGS = {
  dormouse: ['Dormouse, Mr. Wake when the hazels flower', 'Dormouse, Miss. Wake for the cuckoo, not before', 'Dormice (twins). Wake both or neither', 'Dormouse. Snores. See index card 14', 'Dormouse, Mrs. Wake at the first warm night', 'Dormouse. Late arrival, Nov 3rd. Do not wake'],
  hedgehog: ['Hedgehog, Mrs. Wake at first slug', 'Hedgehog, Old Mr. Wake at first slug, second helping', 'Hedgehog. Wake when the frost is out of the ground', 'Hedgehogs (3). Room for one more'],
  squirrel: ['Squirrel, red. Wake if nuts', 'Squirrel. Forgot where he put them. Wake gently'],
  tortoise: ['Tortoise. Do not wake. Will wake himself (April)'],
  ladybirds: ['Ladybirds (212). Wake when warm, gently'],
  bee: ['Queen bee. Wake at the first crocus'],
  snail: ['Snail. Wake after rain'],
  bat: ['Bats (all). Wake when moths'],
  bear: ['Bear, small. Wake when Mother says'],
};
// fixed casting first
D.forEach((d) => { d.guest = null; d.rest = 0; });
const free = () => D.filter((d) => !d.guest);
const bear = D.find((d) => d.bear); bear.guest = 'bear'; bear.rest = 2.4; // it won't shut: pulled right out
focal.guest = 'dormouse'; focal.rest = 0.45; focal.cap = true;
const big = free().filter((d) => d.w > 95 && d.cy > 900).sort((a, b) => b.w - a.w);
big[0].guest = 'tortoise'; big[0].rest = 0.4;
const small = free().filter((d) => d.w < 64 && d.cy > 600);
if (small[0]) { small[0].guest = 'ladybirds'; small[0].rest = 0.3; }
if (small[3]) { small[3].guest = 'bee'; small[3].rest = 0.32; }
if (small[6]) { small[6].guest = 'snail'; small[6].rest = 0.3; }
// bats hang off the pulls of the highest drawers
free().filter((d) => d.cab.v0 > 0.59).sort(() => R() - 0.5).slice(0, 6).forEach((d) => { d.guest = 'bat'; });
// the rest: mostly dormice and hedgehogs, a few squirrels; about a third left ajar
for (const d of free()) {
  const r = R();
  d.guest = r < 0.48 ? 'dormouse' : r < 0.82 ? 'hedgehog' : 'squirrel';
  if (R() < (d.cy > 700 ? 0.42 : 0.3) && d.w > 50) d.rest = 0.45 + R() * 0.3;
}
const tagUsed = {};
for (const d of D) {
  const list = TAGS[d.guest] || TAGS.dormouse;
  const k = (tagUsed[d.guest] = (tagUsed[d.guest] || 0) + 1);
  d.tagText = list[(k - 1) % list.length];
  d.hasTag = d.guest !== 'bat' && (d.rest > 0 ? R() < 0.7 : R() < 0.22) || d.focal;
  d.tagSide = R() < 0.5 ? -1 : 1;
  d.o = d.rest; d.ph = R() * TAU; d.sw = (R() - 0.5) * 0.3; d.sv = 0;
  d.state = 'sleep'; d.wt = 0; d.immune = 0; d.settled = 0; d.read = 0; d.stir = 0; d.gen = 0;
  d.breathRate = 0.22 + R() * 0.14;
  d.snoreAt = 2 + R() * 12;
  d.flip = (d.cx > PX ? -1 : 1) * (R() < 0.75 ? 1 : -1);
}

// ------------------------------------------------------------ particles: paper Zs, breath vapour
const fx = (OW.parts = []);
OW.spawn = (p) => fx.push(Object.assign({ age: 0, life: 2, vx: 0, vy: 0, rot: 0, vr: 0, s: 1 }, p));
function drawZ(g, x, y, s, rot, a) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.globalAlpha = a;
  const p = poly([[-4, -4.5], [4.2, -4.5], [4.2, -2.6], [-1, 2.6], [4.4, 2.6], [4.4, 4.5], [-4.4, 4.5], [-4.4, 2.6], [0.8, -2.6], [-4, -2.6]]);
  ink(g, p, '#f1e6cf', 0.9);
  g.restore(); g.globalAlpha = 1;
}
layer({
  id: 'fx-paper', z: 31,
  update(dt, t) {
    for (let i = fx.length - 1; i >= 0; i--) {
      const p = fx[i];
      p.age += dt;
      if (p.age > p.life) { fx.splice(i, 1); continue; }
      const w = wind(t, p.x);
      p.x += (p.vx + w * 8) * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.kind === 'puff') { p.vy *= 1 - dt * 0.8; p.vx *= 1 - dt; }
    }
  },
  draw(g, t) {
    for (const p of fx) {
      const u = p.age / p.life;
      if (p.kind === 'z') drawZ(g, p.x + Math.sin(p.age * 3 + p.ph) * 4, p.y, p.s * (0.8 + u * 0.5), p.rot, Math.min(1, (1 - u) * 2) * 0.95);
      else if (p.kind === 'puff') {
        g.globalAlpha = (1 - u) * 0.45;
        g.fillStyle = '#e8ecff';
        for (let k = 0; k < 3; k++) g.fill(circ(p.x + k * 3 * p.s * (1 + u), p.y - k * 1.5 * p.s, p.s * (2.4 + u * 6) * (1 - k * 0.22)));
        g.globalAlpha = 1;
      } else if (p.kind === 'note') {
        g.globalAlpha = Math.min(1, (1 - u) * 2);
        g.fillStyle = '#f4e8c8'; g.strokeStyle = LINE; g.lineWidth = 0.9;
        g.save(); g.translate(p.x + Math.sin(p.age * 4 + p.ph) * 5, p.y); g.rotate(Math.sin(p.age * 3) * 0.3);
        const hd = ell(0, 0, 3 * p.s, 2.2 * p.s, undefined, -0.4);
        ink(g, hd, '#f4e8c8', 0.9);
        g.fillRect(2.4 * p.s, -9 * p.s, 1 * p.s, 9 * p.s);
        if (p.two) { ink(g, ell(6 * p.s, -2 * p.s, 3 * p.s, 2.2 * p.s, undefined, -0.4), '#f4e8c8', 0.9); g.fillRect(8.4 * p.s, -11 * p.s, 1 * p.s, 9 * p.s); g.fillRect(2.4 * p.s, -10 * p.s, 7 * p.s, 1.6 * p.s); }
        g.restore(); g.globalAlpha = 1;
      } else if (p.kind === 'pebble') {
        p.vy += 500 / 60; g.globalAlpha = 1 - u * u;
        ink(g, ell(p.x, p.y, p.s * 1.3, p.s, undefined, p.age * 6), '#4a4058', 0.8); g.globalAlpha = 1;
      } else if (p.kind === 'snowclump') {
        g.globalAlpha = 1 - u; g.fillStyle = C.snow; g.fill(circ(p.x, p.y, p.s));
        p.vy += 380 * (1 / 60); g.globalAlpha = 1;
      }
    }
  },
});

// ------------------------------------------------------------ light on a guest
// the guests sit in cool shade, warmer low down, bluer near a lamp
function furTone(base, d) {
  const w = OW.warmAt(d.cy);
  return mix(mix(base, '#7c6f98', 0.32), '#e8a090', w * 0.18);
}

// ------------------------------------------------------------ the rigs. Origin: middle of the drawer's
// front lip; y up is negative; s scales; a: { br breath, rise, eye, yawn, roll, look, t }
function eyeShut(g, x, y, r, lw, squeeze = 0) {
  g.beginPath();
  if (squeeze > 0.5) { g.moveTo(x - r, y - r * 0.3); g.lineTo(x, y + r * 0.2); g.lineTo(x + r, y - r * 0.3); }
  else { g.moveTo(x - r, y); g.quadraticCurveTo(x, y + r * 0.8, x + r, y); }
  g.lineWidth = lw; g.strokeStyle = LINE; g.stroke();
}
function eyeOpen(g, x, y, r, open, lk = 0, lw = 1) {
  g.save(); g.translate(x, y); g.scale(1, Math.max(0.12, open));
  ink(g, circ(0, 0, r), '#120c18', lw * 0.6);
  g.fillStyle = '#fff'; g.fill(circ(-r * 0.3 + lk * r * 0.3, -r * 0.35, r * 0.32));
  g.restore();
  // a heavy lid when squinting
  if (open < 0.6) { g.fillStyle = 'rgba(0,0,0,0)'; g.beginPath(); g.moveTo(x - r * 1.2, y - r * open); g.lineTo(x + r * 1.2, y - r * open * 1.2); g.lineWidth = lw; g.strokeStyle = LINE; g.stroke(); }
}
function mouthYawn(g, x, y, s, k, lw) {
  if (k < 0.05) return;
  const p = ell(x, y, s * (1.4 + k * 1.6), s * (0.6 + k * 3.6));
  ink(g, p, '#4a1c2a', lw);
  g.fillStyle = '#d4707c'; g.fill(ell(x, y + s * (0.3 + k * 2), s * (0.9 + k), s * (0.3 + k * 1.2)));
}

const FUR = {
  dormouse: { base: '#cf8a42', shade: '#8a5228', lit: '#f0b868', belly: '#f6e6cc' },
  squirrel: { base: '#a65430', shade: '#6c3222', lit: '#d47e4c', belly: '#ecd6bc' },
  bear: { base: '#6e4a36', shade: '#40281e', lit: '#9a6c4c', belly: '#b08a6a' },
};

function dormouse(g, s, a, d) {
  // a hazel dormouse: golden, a white throat, huge black eyes, small ears, a tail like a bottle-brush
  const F = FUR.dormouse, base = furTone(F.base, d), shade = furTone(F.shade, d), lit = furTone(F.lit, d), lw = clamp(1.4 * s, 0.9, 1.8);
  const rise = a.rise, br = a.br, y = a.yawn;
  // the sock lining, turned over the lip
  if (!a.noSock) {
    const sw = 30 * s, sh = 5 * s;
    const sock = poly([[-sw, -1], [sw, -1], [sw - 2 * s, sh], [-sw + 3 * s, sh]]);
    ink(g, sock, d.sockA || '#c7a8c8', lw * 0.8);
    g.save(); g.clip(sock); g.fillStyle = d.sockB || '#6e86b8';
    for (let x = -sw; x < sw; x += 6 * s) g.fillRect(x, -2, 3 * s, sh + 3);
    g.restore();
  }
  // curled: a golden ball. Waking: it uncurls and sits up
  const by = -4 * s - rise * 10 * s;
  const ball = ell(-2 * s, by + 2 * s, (13 - rise * 2) * s, (9 + br * 0.7 + rise * 5) * s);
  ink(g, ball, base, lw);
  g.save(); g.clip(ball);
  g.fillStyle = shade; g.fill(ell(-6 * s, by + 10 * s, 13 * s, 7 * s));
  g.fillStyle = lit; g.fill(ell(2 * s, by - 5 * s, 8 * s, 3 * s));
  if (rise > 0.3) { g.fillStyle = mix(base, F.belly, 0.8); g.fill(ell(5 * s, by + 4 * s, 5 * s, 7 * s * rise)); }
  g.restore();
  // arms up for the yawn's stretch
  if (rise > 0.5 && y > 0.2) {
    const k = sstep(0.2, 0.7, y);
    for (const side of [-1, 1]) {
      const sx = side * 7 * s, sy = by - 3 * s;
      const hx = sx + side * 5 * s * k, hy = sy - 13 * s * k;
      Drawn.tube(g, seg(sx, sy, hx, hy), base, 2.8 * s, lw * 0.6);
      ink(g, circ(hx, hy, 1.8 * s), mix(base, '#f0c8b0', 0.5), lw * 0.6);
    }
  }
  // head: tucked into the ball asleep, lifted and turned to us awake
  g.save();
  const hx = lerp(6, 1, rise) * s + a.roll * 3 * s, hy = by + lerp(-2, -10, rise) * s;
  g.translate(hx, hy); g.rotate(lerp(0.22, 0, rise) - y * 0.3 + a.roll * 0.12);
  const head = ell(0, 0, 7.2 * s, 6.4 * s);
  ink(g, ell(-4.6 * s, -4.6 * s, 2.4 * s, 2.8 * s, undefined, -0.4), base, lw * 0.8);
  g.fillStyle = '#d8908a'; g.fill(ell(-4.6 * s, -4.4 * s, 1.2 * s, 1.6 * s, undefined, -0.4));
  ink(g, head, base, lw);
  g.save(); g.clip(head); g.fillStyle = lit; g.fill(ell(-1 * s, -3.6 * s, 5 * s, 2.2 * s)); g.fillStyle = mix(base, F.belly, 0.85); g.fill(ell(3 * s, 4.4 * s, 5 * s, 3.2 * s)); g.restore();
  ink(g, ell(4.2 * s, -4.6 * s, 2.2 * s, 2.6 * s, undefined, 0.4), base, lw * 0.8);
  g.fillStyle = '#d8908a'; g.fill(ell(4.2 * s, -4.4 * s, 1.1 * s, 1.5 * s, undefined, 0.4));
  // muzzle and nose: short, pink-tipped; long whiskers
  g.fillStyle = '#d8707c'; g.fill(circ(7.4 * s, 1.4 * s, 1.2 * s));
  g.lineWidth = 0.45; g.strokeStyle = 'rgba(40,30,40,0.7)';
  g.beginPath(); for (const k of [-1.5, 0, 1.6]) { g.moveTo(6.6 * s, 2 * s); g.lineTo(15 * s, (2 + k * 1.6) * s); } g.stroke();
  // eyes: huge and black when open
  if (a.eye > 0.15) {
    g.save(); g.translate(2.4 * s, -0.8 * s); g.scale(1, Math.max(0.15, a.eye));
    g.fillStyle = '#0e0810'; g.fill(ell(0, 0, 2.4 * s, 2.6 * s));
    g.fillStyle = '#fff'; g.fill(circ(-0.8 * s + a.look * 0.6 * s, -1 * s, 0.8 * s));
    g.restore();
    if (a.eye < 0.6) { g.lineWidth = lw * 0.8; g.strokeStyle = LINE; g.beginPath(); g.moveTo(0, -0.8 * s - 2.6 * s * a.eye); g.lineTo(5 * s, -0.8 * s - 2.8 * s * a.eye); g.stroke(); }
  } else eyeShut(g, 2.4 * s, -0.6 * s, 2.3 * s, lw, y > 0.4 ? 1 : 0);
  mouthYawn(g, 4.8 * s, 3.4 * s, s * 0.85, y, lw * 0.7);
  if (d.cap) {
    const cap = curve([[-6 * s, -3 * s], [-1 * s, -10 * s], [7 * s, -9 * s], [12 * s, -2 * s + Math.sin(a.t * 0.8) * s], [6 * s, -5 * s], [0, -4 * s]]);
    ink(g, cap, '#d8d2ec', lw * 0.8);
    g.save(); g.clip(cap); g.fillStyle = '#8a6cb4'; for (let k = -8; k < 14; k += 4.4) g.fillRect(k * s, -12 * s, 2 * s, 12 * s); g.restore();
    ink(g, circ(12 * s, -1.5 * s + Math.sin(a.t * 0.8) * s, 1.8 * s), '#f0eaff', lw * 0.6);
  }
  g.restore();
  // the tail: a thick bottle-brush wrapped round the front of the ball like a scarf
  const tail = curve([[-14 * s, by + 4 * s], [-10 * s, by + 10 * s], [0, by + 10.5 * s], [10 * s, by + 8 * s - rise * 2 * s], [14 * s, by + 2 * s - rise * 3 * s]], false);
  Drawn.tube(g, tail, lit, 5.4 * s, lw * 0.8);
  g.strokeStyle = shade; g.lineWidth = 0.7 * s;
  for (let k = 0; k < 7; k++) { const x = -11 * s + k * 3.6 * s, yy = by + 9.4 * s - Math.max(0, k - 4) * 1.6 * s; g.beginPath(); g.moveTo(x, yy - 2 * s); g.lineTo(x + 1.6 * s, yy + 1.6 * s); g.stroke(); }
  // little pink paws on the lip when sitting up
  if (rise > 0.4) { ink(g, ell(-3 * s, -0.6 * s, 2 * s, 1.4 * s), '#e0b0a8', lw * 0.6); ink(g, ell(3 * s, -0.6 * s, 2 * s, 1.4 * s), '#e0b0a8', lw * 0.6); }
}

function hedgehog(g, s, a, d) {
  const lw = clamp(1.4 * s, 0.9, 1.8), rise = a.rise, y = a.yawn;
  // leaf litter over the lip
  const LR = rng(d.seed);
  for (let i = 0; i < 6; i++) {
    const x = (LR() - 0.5) * 50 * s, yy = LR() * 4 * s, r = (3 + LR() * 3) * s, ang = (LR() - 0.5) * 1.4;
    g.save(); g.translate(x, yy); g.rotate(ang);
    const leaf = new Path2D(); leaf.moveTo(-r * 1.5, 0); leaf.quadraticCurveTo(0, -r, r * 1.5, 0); leaf.quadraticCurveTo(0, r, -r * 1.5, 0);
    ink(g, leaf, ['#9a5a30', '#b8803c', '#7a4a2c', '#a8683a'][i % 4], lw * 0.6);
    g.strokeStyle = 'rgba(40,20,20,0.5)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-r * 1.4, 0); g.lineTo(r * 1.4, 0); g.stroke();
    g.restore();
  }
  // the spiny dome
  const cx = 0, cy = 1 * s - rise * 8 * s, rx = 16 * s, ry = (9 + a.br * 0.7 + rise * 3) * s;
  const dome = new Path2D(); dome.moveTo(cx - rx, 2 * s); dome.ellipse(cx, cy + 2 * s, rx, ry, 0, Math.PI, 0); dome.closePath();
  ink(g, dome, furTone('#5a4a40', d), lw);
  g.save(); g.clip(dome);
  const SR = rng(d.seed + 1);
  for (let i = 0; i < 70; i++) {
    const ang = Math.PI + SR() * Math.PI, rr = SR() ** 0.5;
    const x = cx + Math.cos(ang) * rx * rr, yy = cy + 2 * s + Math.sin(ang) * ry * rr;
    g.lineWidth = 1 * s; g.strokeStyle = SR() < 0.5 ? '#2c2220' : furTone('#cbb498', d);
    g.beginPath(); g.moveTo(x, yy); g.lineTo(x + Math.cos(ang) * 4 * s + (SR() - 0.5) * 2 * s, yy + Math.sin(ang) * 4 * s); g.stroke();
  }
  g.restore();
  // spines bristling on the outline
  g.lineWidth = 1.1 * s; g.strokeStyle = LINE;
  for (let i = 1; i < 14; i++) {
    const ang = Math.PI + (i / 14) * Math.PI, x = cx + Math.cos(ang) * rx, yy = cy + 2 * s + Math.sin(ang) * ry;
    g.beginPath(); g.moveTo(x, yy); g.lineTo(x + Math.cos(ang - 0.3) * 3.5 * s, yy + Math.sin(ang - 0.3) * 3.5 * s); g.stroke();
  }
  // the face, tucked in at one end; on waking it comes up out of the curl
  const fx0 = -13 * s, fy = -1 * s - rise * 9 * s;
  g.save(); g.translate(fx0, fy); g.rotate(-0.2 - y * 0.4 + a.roll * 0.2);
  const face = poly([[4 * s, -5 * s], [-7 * s, -1.5 * s], [-9 * s, 0], [-7 * s, 1.5 * s], [4 * s, 4 * s]]);
  ink(g, curve([[4 * s, -5 * s], [-3 * s, -3 * s], [-9 * s, 0], [-3 * s, 3 * s], [4 * s, 4 * s]]), furTone('#c49a76', d), lw);
  ink(g, circ(-9 * s, 0, 1.6 * s), '#1a1218', 0.6);
  if (a.eye > 0.15) eyeOpen(g, -1 * s, -1.4 * s, 1.5 * s, a.eye, 0, lw); else eyeShut(g, -1 * s, -1.2 * s, 1.6 * s, lw * 0.8, y > 0.4 ? 1 : 0);
  mouthYawn(g, -5 * s, 2.5 * s, s * 0.7, y, lw * 0.6);
  g.restore();
}

function squirrel(g, s, a, d) {
  const F = FUR.squirrel, base = furTone(F.base, d), lit = furTone(F.lit, d), shade = furTone(F.shade, d), lw = clamp(1.4 * s, 0.9, 1.8);
  const rise = a.rise, y = a.yawn;
  // moss lining
  ink(g, curve([[-26 * s, 0], [-14 * s, -3 * s], [0, -2 * s], [14 * s, -3 * s], [26 * s, 0], [20 * s, 4 * s], [-20 * s, 4 * s]]), furTone('#5c6a3c', d), lw * 0.7);
  const by = -2 * s - rise * 11 * s;
  ink(g, ell(2 * s, by + 3 * s, 13 * s, (7 + a.br * 0.7 + rise * 5) * s), base, lw);
  // head
  g.save(); g.translate(-7 * s + a.roll * 4 * s, by - 4 * s); g.rotate(-y * 0.35);
  for (const ex of [-4, 4]) { ink(g, poly([[ex * s - 3 * s, -5 * s], [ex * s, -14 * s], [ex * s + 3 * s, -5 * s]]), base, lw); g.fillStyle = shade; g.fill(poly([[ex * s - 0.5 * s, -9 * s], [ex * s, -15 * s], [ex * s + 0.8 * s, -9 * s]])); }
  ink(g, ell(0, 0, 8 * s, 7 * s), base, lw);
  ink(g, ell(-4 * s, 3 * s, 4 * s, 3 * s), mix(base, F.belly, 0.6), lw * 0.7);
  g.fillStyle = '#2a1414'; g.fill(circ(-7.5 * s, 2.4 * s, 1.1 * s));
  if (a.eye > 0.15) eyeOpen(g, -2 * s, -1.5 * s, 2 * s, a.eye, a.look, lw); else eyeShut(g, -2 * s, -1.5 * s, 2.2 * s, lw, y > 0.4 ? 1 : 0);
  mouthYawn(g, -4 * s, 5 * s, s * 0.8, y, lw * 0.7);
  g.restore();
  // the tail: a huge russet plume curled over everything as a blanket
  const tl = curve([[14 * s, 2 * s], [20 * s, -10 * s - rise * 3 * s], [12 * s, -22 * s - rise * 6 * s], [0, -18 * s - rise * 8 * s], [4 * s, -10 * s], [14 * s, -6 * s], [10 * s, 2 * s]]);
  ink(g, tl, lit, lw);
  g.save(); g.clip(tl); g.strokeStyle = shade; g.lineWidth = 0.8 * s;
  for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(6 * s + i * 1.4 * s, -20 * s + i * 2 * s); g.quadraticCurveTo(16 * s, -12 * s + i * 1.5 * s, 12 * s, i * 0.6 * s); g.stroke(); }
  g.restore();
}

function tortoise(g, s, a, d) {
  const lw = clamp(1.4 * s, 0.9, 1.8);
  // a striped hatbox standing in the drawer, its lid lifting on a stir
  const w = 22 * s, h = 14 * s, lid = a.stir * 3 * s + a.rise * 6 * s;
  ink(g, curve([[-24 * s, 1], [-12 * s, -3 * s], [0, -1 * s], [14 * s, -3 * s], [24 * s, 1]], false), null, 0);
  // straw
  g.strokeStyle = '#c8a860'; g.lineWidth = 0.9;
  for (let i = 0; i < 14; i++) { const x = -26 * s + i * 4 * s; g.beginPath(); g.moveTo(x, 1); g.lineTo(x + (i % 2 ? 4 : -3) * s, -4 * s); g.stroke(); }
  const box = poly([[-w, 0], [-w, -h], [w, -h], [w, 0]]);
  ink(g, box, '#cfc2d8', lw);
  g.save(); g.clip(box); g.fillStyle = '#7c5ca0'; for (let x = -w; x < w; x += 7 * s) g.fillRect(x, -h, 3.2 * s, h); g.fillStyle = 'rgba(20,10,30,0.25)'; g.fillRect(w * 0.3, -h, w, h); g.restore();
  // the head peeking out from under the lid
  if (lid > 1) {
    g.save(); g.beginPath(); g.rect(-w, -h - lid - 10 * s, w * 2, lid + 10 * s); g.clip();
    const hy = -h - lid * 0.2;
    ink(g, ell(4 * s, hy, 6 * s, 4.4 * s), furTone('#8a8a5a', d), lw);
    if (a.eye > 0.15) eyeOpen(g, 6 * s, hy - 1 * s, 1.6 * s, a.eye * 0.7, 0, lw); else eyeShut(g, 6 * s, hy - 1 * s, 1.7 * s, lw * 0.8);
    mouthYawn(g, 9 * s, hy + 1.5 * s, s * 0.6, a.yawn, lw * 0.6);
    g.restore();
  }
  const ly = -h - lid;
  ink(g, ell(0, ly, w + 2 * s, 4 * s), '#e0d6ea', lw);
  ink(g, poly([[-w - 2 * s, ly], [-w - 2 * s, ly + 4 * s], [w + 2 * s, ly + 4 * s], [w + 2 * s, ly]]), '#a88cc4', lw * 0.8);
  // ribbon
  g.fillStyle = '#c3343c'; g.fillRect(-2 * s, ly - 4 * s, 4 * s, h + lid + 4 * s);
  ink(g, curve([[-6 * s, ly - 6 * s], [0, ly - 3 * s], [6 * s, ly - 7 * s], [2 * s, ly - 2 * s], [-2 * s, ly - 2 * s]]), '#c3343c', lw * 0.6);
}

function ladybirds(g, s, a, d) {
  const LR = rng(d.seed), lw = clamp(1.1 * s, 0.7, 1.4);
  for (let i = 0; i < 9; i++) {
    const x = (LR() - 0.5) * 34 * s + Math.sin(a.t * 3 + i) * a.stir * 2 * s, yy = -LR() * 6 * s - 1, r = (2.6 + LR()) * s;
    const p = new Path2D(); p.moveTo(x - r, yy); p.arc(x, yy, r, Math.PI, 0); p.closePath();
    ink(g, p, i === 4 && a.rise > 0.3 ? '#e04a3c' : '#c3343c', lw);
    g.fillStyle = '#1a1018'; g.fill(circ(x - r * 0.4, yy - r * 0.4, r * 0.25)); g.fill(circ(x + r * 0.45, yy - r * 0.3, r * 0.22));
    g.fillRect(x - 0.3, yy - r, 0.6, r);
    if (i === 4 && a.yawn > 0.1) { g.globalAlpha = 0.5; g.fillStyle = '#e8e4ff'; g.fill(ell(x - r, yy - r, r * 1.2, r * 0.5, undefined, -0.5)); g.fill(ell(x + r, yy - r, r * 1.2, r * 0.5, undefined, 0.5)); g.globalAlpha = 1; }
  }
}

function bee(g, s, a, d) {
  const lw = clamp(1.2 * s, 0.8, 1.5);
  ink(g, curve([[-16 * s, 1], [-8 * s, -4 * s], [4 * s, -3 * s], [16 * s, 1], [6 * s, 3 * s]]), '#f0eef8', lw * 0.6);
  const by = -4 * s - a.rise * 4 * s;
  const body = ell(0, by, 8 * s, (5.5 + a.br * 0.4) * s);
  ink(g, body, '#2a1e1a', lw);
  g.save(); g.clip(body); g.fillStyle = '#e0a83c'; g.fillRect(-3 * s, by - 6 * s, 3 * s, 12 * s); g.fillStyle = '#efe0c0'; g.fillRect(4 * s, by - 6 * s, 4 * s, 12 * s); g.restore();
  if (a.rise > 0.2) {
    g.globalAlpha = 0.45; g.fillStyle = '#e8ecff';
    const flap = Math.sin(a.t * 60) * 0.5 * a.rise;
    g.fill(ell(-1 * s, by - 6 * s, 5 * s, 2.4 * s, undefined, -0.6 + flap)); g.fill(ell(3 * s, by - 6 * s, 5 * s, 2.4 * s, undefined, 0.6 - flap));
    g.globalAlpha = 1;
  }
  ink(g, circ(-8 * s, by + 0.5 * s, 3.4 * s), '#2a1e1a', lw);
}

function snail(g, s, a, d) {
  const lw = clamp(1.2 * s, 0.8, 1.5), h = a.rise;
  if (h > 0.05) {
    ink(g, curve([[-14 * s, 0], [-10 * s, -3 * s], [4 * s, -2 * s], [10 * s, 0]], false), null, 0);
    const bp = poly([[-16 * s, 0], [-14 * s, -4 * s - h * 3 * s], [-8 * s, -3 * s], [8 * s, -1 * s], [10 * s, 0]]);
    ink(g, bp, furTone('#9a8a7a', d), lw);
    g.lineWidth = 0.9 * s; g.strokeStyle = LINE;
    g.beginPath(); g.moveTo(-14 * s, -4 * s - h * 3 * s); g.lineTo(-17 * s, -9 * s - h * 6 * s); g.moveTo(-13 * s, -4 * s - h * 3 * s); g.lineTo(-12 * s, -10 * s - h * 6 * s); g.stroke();
    g.fillStyle = LINE; g.fill(circ(-17 * s, -9 * s - h * 6 * s, 1 * s)); g.fill(circ(-12 * s, -10 * s - h * 6 * s, 1 * s));
  }
  const shell = circ(2 * s, -8 * s, 8 * s);
  ink(g, shell, furTone('#b07a4a', d), lw);
  g.strokeStyle = furTone('#6a4428', d); g.lineWidth = 1.1 * s; g.beginPath();
  for (let k = 0; k < 40; k++) { const ang = k * 0.4, rr = 7.5 * s * (1 - k / 44); g.lineTo(2 * s + Math.cos(ang) * rr, -8 * s + Math.sin(ang) * rr); }
  g.stroke();
  if (h < 0.1) ink(g, ell(-6 * s, -4 * s, 2 * s, 3.6 * s), '#f2f0f4', lw * 0.6); // the sealed door of dried mucus
}

function bearCub(g, s, a, d) {
  const F = FUR.bear, base = furTone(F.base, d), lit = furTone(F.lit, d), shade = furTone(F.shade, d), lw = clamp(1.6 * s, 1.2, 2.2);
  const rise = a.rise, y = a.yawn;
  // a patchwork quilt, tucked in
  const quilt = curve([[-46 * s, 4 * s], [-36 * s, -6 * s], [-10 * s, -8 * s], [20 * s, -5 * s], [44 * s, -9 * s], [48 * s, 4 * s]]);
  // the back: a big brown hill
  const by = -13 * s - rise * 14 * s;
  const back = ell(8 * s, by + 6 * s, 30 * s, (18 + a.br * 1.6 + rise * 8) * s);
  ink(g, back, base, lw);
  g.save(); g.clip(back); g.fillStyle = shade; g.fill(ell(0, by + 22 * s, 32 * s, 14 * s)); g.fillStyle = lit; g.fill(ell(18 * s, by - 6 * s, 14 * s, 6 * s)); g.restore();
  ink(g, quilt, '#7c5aa0', lw);
  g.save(); g.clip(quilt);
  const cols = ['#c3343c', '#e0c070', '#6e86b8', '#a8c0a0', '#d8a0b0'];
  for (let i = 0; i < 10; i++) { g.fillStyle = cols[i % 5]; g.globalAlpha = 0.75; g.fillRect(-46 * s + i * 10 * s, -10 * s + (i % 2) * 7 * s, 10 * s, 7 * s); }
  g.globalAlpha = 1; g.strokeStyle = 'rgba(30,20,40,0.5)'; g.setLineDash([2, 2]); g.lineWidth = 0.8; g.stroke(quilt); g.setLineDash([]);
  g.restore();
  // head on its paws at the left end, snout over the lip
  g.save(); g.translate(-26 * s, by + 4 * s - rise * 4 * s); g.rotate(-0.15 - y * 0.35);
  ink(g, circ(-6 * s, -12 * s, 6 * s), base, lw); g.fillStyle = shade; g.fill(circ(-6 * s, -12 * s, 3 * s));
  ink(g, circ(10 * s, -13 * s, 6 * s), base, lw); g.fillStyle = shade; g.fill(circ(10 * s, -13 * s, 3 * s));
  const head = ell(2 * s, 0, 16 * s, 14 * s);
  ink(g, head, base, lw);
  g.save(); g.clip(head); g.fillStyle = lit; g.fill(ell(6 * s, -8 * s, 11 * s, 4 * s)); g.restore();
  ink(g, ell(-8 * s, 5 * s, 8 * s, 6 * s), mix(base, F.belly, 0.6), lw * 0.8);
  ink(g, ell(-13 * s, 2 * s, 3.4 * s, 2.6 * s), '#1e1216', lw * 0.6);
  if (a.eye > 0.15) { eyeOpen(g, -2 * s, -4 * s, 2.6 * s, a.eye, a.look, lw); eyeOpen(g, 9 * s, -4 * s, 2.6 * s, a.eye, a.look, lw); }
  else { eyeShut(g, -2 * s, -4 * s, 3 * s, lw, y > 0.4 ? 1 : 0); eyeShut(g, 9 * s, -4 * s, 3 * s, lw, y > 0.4 ? 1 : 0); }
  mouthYawn(g, -7 * s, 10 * s, s * 1.6, y, lw * 0.8);
  g.restore();
  // one paw draped over the front with its claws, swinging a little in sleep
  const px = -10 * s + Math.sin(a.t * 0.4) * s, py = 2 * s;
  ink(g, curve([[px - 8 * s, -4 * s], [px + 8 * s, -4 * s], [px + 9 * s, py + 8 * s], [px, py + 12 * s], [px - 9 * s, py + 8 * s]]), base, lw);
  g.lineWidth = 1.2; g.strokeStyle = '#e8e0d8';
  for (const cx of [-5, -1.5, 2, 5.5]) { g.beginPath(); g.moveTo(px + cx * s, py + 11 * s); g.lineTo(px + cx * s - 0.5 * s, py + 14 * s); g.stroke(); }
}

function bat(g, s, a, d, H) {
  // hangs upside down from the pull: feet at the top, ears at the bottom
  const lw = clamp(1.2 * s, 0.8, 1.6);
  g.save(); g.translate(H[0], H[1]); g.rotate(d.sw * 0.8 + a.spin);
  g.lineWidth = 1; g.strokeStyle = LINE;
  g.beginPath(); g.moveTo(-1.6 * s, 0); g.lineTo(-1.2 * s, 3 * s); g.moveTo(1.6 * s, 0); g.lineTo(1.2 * s, 3 * s); g.stroke();
  const open = a.rise;
  if (open > 0.1) {
    // wings unfolding, membranes lit lilac by the lamps
    for (const side of [-1, 1]) {
      const wp = poly([[side * 2 * s, 4 * s], [side * (6 + 10 * open) * s, 6 * s], [side * (5 + 9 * open) * s, 12 * s], [side * (3 + 6 * open) * s, 11 * s], [side * (2 + 4 * open) * s, 17 * s], [side * 2 * s, 18 * s]]);
      ink(g, wp, '#4a3850', lw * 0.8);
    }
  }
  const body = curve([[0, 2.5 * s], [5 * s, 6 * s], [5.4 * s, 14 * s], [2.4 * s, 20 * s], [-2.4 * s, 20 * s], [-5.4 * s, 14 * s], [-5 * s, 6 * s]]);
  ink(g, body, '#3e2e3c', lw);
  g.fillStyle = '#5a4456'; g.fill(ell(1.6 * s, 10 * s, 2 * s, 6 * s));
  // folded wing ribs
  g.lineWidth = 0.6; g.strokeStyle = '#1e1420';
  g.beginPath(); g.moveTo(-3 * s, 5 * s); g.lineTo(-2 * s, 17 * s); g.moveTo(3 * s, 5 * s); g.lineTo(2 * s, 17 * s); g.stroke();
  // face (upside down) and ears
  ink(g, poly([[-3.4 * s, 19 * s], [-4.4 * s, 25 * s], [-1 * s, 20.5 * s]]), '#3e2e3c', lw * 0.7);
  ink(g, poly([[3.4 * s, 19 * s], [4.4 * s, 25 * s], [1 * s, 20.5 * s]]), '#3e2e3c', lw * 0.7);
  if (a.eye > 0.15) { g.fillStyle = '#f0e8ff'; g.fill(circ(-1.4 * s, 17.5 * s, 0.8 * s)); g.fill(circ(1.4 * s, 17.5 * s, 0.8 * s)); }
  if (a.yawn > 0.1) { ink(g, ell(0, 15 * s, 1.6 * s, 1 + a.yawn * 2.4 * s), '#4a1c2a', 0.6); g.fillStyle = '#fff'; g.fillRect(-1.2 * s, 14 * s - a.yawn * 1.4 * s, 0.6, 1.2); g.fillRect(0.6 * s, 14 * s - a.yawn * 1.4 * s, 0.6, 1.2); }
  g.restore();
}

const RIGS = { dormouse, hedgehog, squirrel, tortoise, ladybirds, bee, snail, bear: bearCub };

// ------------------------------------------------------------ the luggage tag
function tagPath(w, h) {
  const p = new Path2D(), c = h * 0.32;
  p.moveTo(0, 0); p.lineTo(w - c, 0); p.lineTo(w, c); p.lineTo(w, h - c); p.lineTo(w - c, h); p.lineTo(0, h); p.closePath();
  return p;
}
function drawTag(g, d, H, s, read, t) {
  // swings from the pull on its string; reading lifts it toward us, bigger and steadier
  const len = (10 + d.h * 0.12) * s, ang = d.sw * (1 - read * 0.8) + d.tagSide * 0.25 * (1 - read);
  const ex = H[0] + Math.sin(ang) * len, ey = H[1] + Math.cos(ang) * len;
  g.lineWidth = 0.8; g.strokeStyle = C.tag.string;
  g.beginPath(); g.moveTo(H[0], H[1] + 1); g.quadraticCurveTo(lerp(H[0], ex, 0.5) + 2, lerp(H[1], ey, 0.5) + 2, ex, ey); g.stroke();
  const k = lerp(1, 4.2, sstep(0, 1, read)) * s;
  const w = 15 * k, h = 7.5 * k;
  g.save(); g.translate(ex, ey); g.rotate(ang * 0.6 + Math.PI / 2 - lerp(0.25, Math.PI / 2 - 0.08, sstep(0, 1, read)));
  if (read > 0.02) { g.shadowColor = 'rgba(10,6,20,0.5)'; g.shadowBlur = 8 * read; g.shadowOffsetY = 3 * read; }
  ink(g, tagPath(w, h), mix(C.tag.shade, C.tag.base, 0.4 + read * 0.6), clamp(0.8 * k / 2, 0.7, 1.4));
  g.shadowColor = 'transparent';
  ink(g, circ(h * 0.42, h / 2, h * 0.18), '#e8d8b8', 0.6);
  g.lineWidth = h * 0.08; g.strokeStyle = C.tag.ring; g.stroke(circ(h * 0.42, h / 2, h * 0.2));
  if (read > 0.4) {
    g.globalAlpha = sstep(0.4, 1, read);
    g.fillStyle = '#2a2038';
    const words = d.tagText.split('. ');
    const fs = h * 0.24;
    g.font = `italic ${fs}px Georgia, "Iowan Old Style", serif`;
    g.textBaseline = 'middle';
    const x0 = h * 0.85;
    if (words.length > 1) {
      g.font = `600 ${fs}px Georgia, serif`; g.fillText(words[0] + '.', x0, h * 0.32);
      g.font = `italic ${fs * 0.92}px Georgia, serif`; g.fillText(words.slice(1).join('. '), x0, h * 0.66, w - x0 - h * 0.3);
    } else g.fillText(d.tagText, x0, h * 0.5, w - x0 - h * 0.3);
    g.fillStyle = '#c3343c'; g.fillRect(x0, h * 0.84, w * 0.3, h * 0.03);
    g.globalAlpha = 1;
  } else {
    g.strokeStyle = 'rgba(40,30,50,0.6)'; g.lineWidth = 0.5;
    g.beginPath(); g.moveTo(h * 0.8, h * 0.4); g.lineTo(w - h * 0.4, h * 0.4); g.moveTo(h * 0.8, h * 0.62); g.lineTo(w * 0.7, h * 0.62); g.stroke();
  }
  g.restore();
}

// ------------------------------------------------------------ opening geometry
const openQ = (q, o) => { const k = 1 / (1 - o * 0.06); return q.map(([x, y]) => [PX + (x - PX) * k, HZ + (y - HZ) * k]); };
function drawOpen(g, d, o, a) {
  const slot = d.front, f = openQ(slot, o);
  const T = C[d.tone];
  const below = d.cy > HZ;
  // the dark slot behind
  g.fillStyle = '#0e0a12'; g.fill(OW.qpath(OW.inset(slot, -0.02, -0.04)));
  // a side panel, on the side that faces the middle
  const right = d.cx < PX;
  const sp = right ? [f[1], slot[1], slot[2], f[2]] : [f[0], slot[0], slot[3], f[3]];
  ink(g, OW.qpath(sp), mix(T.deep, T.shade, 0.6), 1);
  // the underside (above eye level) or the inside (below it)
  if (!below) {
    const us = [f[3], f[2], slot[2], slot[3]];
    ink(g, OW.qpath(us), mix(T.deep, C.kraft.rose, OW.warmAt(d.cy) * 0.5 + 0.1), 1);
  } else {
    const ins = [slot[0], slot[1], f[1], f[0]];
    ink(g, OW.qpath(ins), '#1a1218', 1);
  }
  // the guest, behind the front so the front hides its lower half
  const lipL = f[0], lipR = f[1], lx = (lipL[0] + lipR[0]) / 2, ly = (lipL[1] + lipR[1]) / 2;
  const s = clamp((lipR[0] - lipL[0]) / 66, 0.45, 1.6) * (d.guest === 'bear' ? 0.95 : 1);
  if (d.guest && RIGS[d.guest] && (o > 0.08 || d.guest === 'bear')) {
    g.save();
    // only what rises above the lip (or, below eye level, what's in the open drawer) is visible
    g.beginPath(); g.moveTo(lx - 400, ly - 400); g.lineTo(lx + 400, ly - 400); g.lineTo(lx + 400, lipR[1] + (below ? 6 : 0)); g.lineTo(lipR[0], lipR[1] + (below ? 6 : 0)); g.lineTo(lipL[0], lipL[1] + (below ? 6 : 0)); g.lineTo(lx - 400, lipL[1] + (below ? 6 : 0)); g.clip();
    g.translate(lx, ly + (below ? 4 : 0)); g.rotate(Math.atan2(lipR[1] - lipL[1], lipR[0] - lipL[0]));
    if (d.flip < 0) g.scale(-1, 1);
    RIGS[d.guest](g, s, a, d);
    g.restore();
  }
  // below eye level we look down onto the drawer's side boards running back into the cabinet;
  // drawn over the guest, they make it sit in the drawer rather than on it
  if (below && o > 0.3) {
    for (const [a0, b0] of [[f[0], slot[0]], [f[1], slot[1]]]) {
      const th = 4 * s;
      ink(g, poly([a0, b0, [b0[0], b0[1] + th * 0.6], [a0[0], a0[1] + th]]), mix(T.shade, T.lit, 0.4), 1.2);
    }
  }
  OW.drawerFront(g, d, f, rng(d.seed));
  return { f, s };
}

// ------------------------------------------------------------ the yawn: waking, spreading, settling
const neighbours = (d) => {
  if (d.nb) return d.nb;
  const r = Math.max(d.w, d.h) * 1.2 + 70;
  d.nb = D.filter((n) => n !== d && n.guest && Math.hypot(n.cx - d.cx, n.cy - d.cy) < r + Math.max(n.w, n.h) * 0.5);
  return d.nb;
};
OW.yawning = 0;
function wake(d, gen = 0) {
  if (d.state !== 'sleep' || st.t < d.immune) return false;
  d.state = 'wake'; d.wt = 0; d.gen = gen; d.settled = 0; d.spread = false;
  OW.emit('wake', d);
  return true;
}
OW.wake = wake;
OW.settleNear = (x, y, r) => {
  for (const d of D) if (d.state === 'wake' && Math.hypot(d.cx - x, d.cy - y) < r) d.settled = Math.max(d.settled, 0.001);
};
const queue = [];
function spread(d) {
  OW.emit('yawn', d);
  for (const n of neighbours(d)) {
    if (n.state !== 'sleep' || st.t < n.immune) continue;
    const down = n.cy > d.cy + 8;
    let p = (down ? 0.82 : 0.42) * Math.pow(0.9, d.gen);
    if (d.settled) p *= 0.3;
    if (n.guest === 'bear') p *= 1.15;
    if (Math.random() < p) queue.push({ d: n, at: st.t + 0.35 + Math.random() * 0.7, gen: d.gen + 1 });
  }
}

// a cold puff of breath: the guests' yawns condense in the midwinter air
const puff = (x, y, s, dir) => OW.spawn({ kind: 'puff', x, y, vx: dir * 10 * s, vy: -14 * s, life: 1.8, s: s * 1.2 });

// ------------------------------------------------------------ one layer per drawer
const inQ = (q, x, y, pad, top) => {
  const x0 = Math.min(q[0][0], q[3][0]) - pad, x1 = Math.max(q[1][0], q[2][0]) + pad;
  return x > x0 && x < x1 && y > Math.min(q[0][1], q[1][1]) - top && y < Math.max(q[2][1], q[3][1]) + pad;
};
for (const d of D) {
  const anim = { br: 0, rise: 0, eye: 0, yawn: 0, roll: 0, look: 0, t: 0, stir: 0, spin: 0 };
  d.anim = anim;
  layer({
    id: 'drawer-' + d.i, z: 20 + d.i * 0.001,
    hit(x, y) {
      if (d.guest === 'bat' && d.handle) return Math.abs(x - d.handle[0]) < 14 * d.hs + 6 && y > d.handle[1] - 4 && y < d.handle[1] + 34 * d.hs + 6 || inQ(d.q, x, y, 0, 0);
      return inQ(d.q, x, y, 1, d.o > 0.1 ? 18 * d.hs + 8 : 2);
    },
    onEnter() { d.sv += clamp(P.vx * 0.003, -0.8, 0.8); d.stir = 1; },
    onTap() { if (wake(d, 0)) d.wt = 0.0001; },
    update(dt, t, L) {
      anim.t = t;
      // breathing: slow and deep in hibernation
      anim.br = Math.sin(t * d.breathRate * TAU + d.ph);
      // the tag swings in the shared wind (a damped pendulum), kicked by the pointer and the shudder
      const w = wind(t, d.cx) * 0.12 + noise(t * 0.7 + d.i) * 0.08;
      d.sv += (-(d.sw - w) * 18 - d.sv * 1.6) * dt; d.sw += d.sv * dt;
      d.read = ease(d.read, L.hovered && L.since > 0.35 && d.hasTag ? 1 : 0, L.hovered ? 4 : 3, dt);
      d.stir = Math.max(0, d.stir - dt * 0.6);
      anim.stir = ease(anim.stir, L.hovered ? 1 : 0, 3, dt);
      // lingering wakes them, as a tap does
      if (L.hovered && L.since > 2.6 && d.state === 'sleep') wake(d, 0);
      // hovering a sleeper: it rolls over, and snores a paper Z
      if (d.state === 'sleep') {
        anim.roll = ease(anim.roll, L.hovered ? Math.sin(L.since * 1.4) * 0.8 : 0, 2, dt);
        d.snoreAt -= dt * (L.hovered ? 6 : 1);
        if (d.snoreAt < 0 && (d.o > 0.1 || d.guest === 'bear' || L.hovered)) {
          d.snoreAt = 5 + Math.random() * 14;
          OW.spawn({ kind: 'z', x: d.cx + (Math.random() - 0.5) * d.w * 0.4, y: d.y0 - 4, vy: -16 - Math.random() * 10, vx: 4, vr: (Math.random() - 0.5) * 1.2, rot: (Math.random() - 0.5) * 0.6, life: 3, s: clamp(d.w / 80, 0.5, 1.3), ph: Math.random() * 6 });
          if (d.o > 0.1) d.lift = 1;
        }
        d.lift = Math.max(0, (d.lift || 0) - dt * 2.5);
        const target = d.rest + bump(1 - d.lift) * 0.06 * (d.lift > 0 ? 1 : 0) + (L.hovered ? 0.04 : 0);
        d.o = ease(d.o, target, 4, dt);
        anim.rise = ease(anim.rise, 0, 2, dt); anim.yawn = ease(anim.yawn, 0, 3, dt); anim.eye = ease(anim.eye, 0, 4, dt);
        anim.spin = ease(anim.spin, 0, 2, dt);
      } else if (d.state === 'wake') {
        // 0–0.6 out and up · 0.6–1.8 squint at the tag · 1.8–3.2 the yawn · 3.2–4.6 back down
        const sp = d.settled ? 1.8 : 1;
        d.wt += dt * sp;
        const w0 = d.wt;
        d.o = ease(d.o, d.guest === 'bat' ? 0 : Math.max(d.rest, 0.85), 6, dt);
        anim.rise = ease(anim.rise, w0 < 3.4 ? 1 : 0, w0 < 3.4 ? 4 : 2.2, dt);
        anim.eye = ease(anim.eye, w0 < 0.5 ? 0.15 : w0 < 1.8 ? 0.42 + 0.1 * Math.sin(w0 * 9) : w0 < 3.2 ? 0 : 0, 6, dt);
        anim.look = ease(anim.look, w0 < 1.8 ? 0.6 : 0, 4, dt);
        anim.yawn = ease(anim.yawn, w0 > 1.8 && w0 < 3.1 ? (d.settled ? 0.45 : 1) : 0, w0 > 1.8 && w0 < 3.1 ? 3 : 5, dt);
        if (d.hasTag && !L.hovered) d.read = Math.max(d.read, w0 > 0.5 && w0 < 1.9 ? 0.22 : 0);
        if (!d.spread && w0 > 2.4) {
          d.spread = true; spread(d);
          puff(d.cx + d.flip * d.w * 0.15, d.y0 - (d.guest === 'bear' ? 50 : 18) * d.hs, clamp(d.w / 70, 0.6, 1.8), d.flip);
          if (d.guest === 'bear') OW.emit('shudder', d);
        }
        if (w0 > 4.6) { d.state = 'sleep'; d.immune = t + 7; d.snoreAt = 3 + Math.random() * 6; }
        if (d.guest === 'bat') anim.spin = Math.sin(w0 * 3) * 0.15 * (w0 < 3 ? 1 : 0);
      }
      if (d.focal) {
        // the feather: hover its porter and the nose twitches… twitches… and it sneezes
        const k = OW.tickle || 0;
        d.tick = k > 0 ? (d.tick || 0) + dt : 0;
        anim.look = 0;
        if (d.tick > 1.4 && !d.sneezed) { d.sneezed = true; d.sneezeT = 0; OW.spawn({ kind: 'puff', x: d.cx + d.w * 0.25, y: d.y0 - 10, vx: 30, vy: -6, life: 1.2, s: 1.6 }); OW.emit('sneeze'); }
        if (d.sneezed) { d.sneezeT += dt; if (d.sneezeT > 3) d.sneezed = false; }
        const pre = clamp((d.tick || 0) / 1.4, 0, 1);
        anim.yawn = d.state === 'sleep' ? Math.max(anim.yawn, pre * 0.35 * (0.6 + 0.4 * Math.sin(t * 30))) : anim.yawn;
        anim.roll = d.state === 'sleep' ? (d.sneezed && d.sneezeT < 0.5 ? -0.8 * (1 - d.sneezeT / 0.5) : anim.roll) : anim.roll;
      }
      if (d.guest === 'bat') {
        // bats all turn together when any of them is hovered, like closed umbrellas in a draught;
        // linger and one lets go with a foot and dangles
        if (L.hovered) OW.batT = t;
        const k = clamp(1 - (t - (OW.batT ?? -9)) / 1.6, 0, 1);
        anim.spin = Math.sin(t * 2.2) * 0.35 * k + (d.state === 'wake' ? Math.sin(d.wt * 3) * 0.15 : 0);
        if (L.hovered && L.since > 1) d.dangle = 1;
        d.dangle = Math.max(0, (d.dangle || 0) - dt * 0.35);
        anim.spin += bump(d.dangle) * 0.6 * Math.sin(t * 5);
      }
    },
    draw(g, t, L) {
      g.save(); g.translate(OW.shake.x, OW.shake.y);
      let s = clamp(d.w / 66, 0.45, 1.6);
      if (d.o > 0.005 || d.guest === 'bear') {
        const r = drawOpen(g, d, d.o, anim);
        s = r.s;
        // the handle moves with the front
        const H = OW.qat(r.f, 0.5, 0.66);
        if (d.hasTag) drawTag(g, d, H, d.hs * 1.05, d.read, t);
      } else {
        if (d.guest === 'bat' && d.handle) bat(g, clamp(d.w / 70, 0.6, 1.2), anim, d, [d.handle[0], d.handle[1] + 2]);
        if (d.hasTag && d.handle) drawTag(g, d, d.handle, d.hs * 1.05, d.read, t);
      }
      g.restore();
    },
  });
}

// queued yawns go off on time
layer({
  id: 'yawn-clock', z: 19.9,
  update(dt, t) {
    for (let i = queue.length - 1; i >= 0; i--) if (t >= queue[i].at) { const q = queue.splice(i, 1)[0]; wake(q.d, q.gen); }
    OW.yawning = D.reduce((n, d) => n + (d.state === 'wake' ? 1 : 0), 0);
    // a guest now and then stirs on its own, so the face is never still
    if (Math.random() < dt * 0.18) { const d = D[Math.floor(Math.random() * D.length)]; d.stir = 1; d.lift = 1; }
  },
  draw() {},
});

// the shudder: a hard shake that decays, snow knocked off the ledges, every tag swinging
OW.on('shudder', () => {
  OW.shake.amt = 1;
  for (const d of D) d.sv += (Math.random() - 0.5) * 3;
  for (let i = 0; i < 60; i++) {
    const p = OW.stackPts[Math.floor(Math.random() * OW.stackPts.length)];
    OW.spawn({ kind: 'snowclump', x: p[0] + (Math.random() - 0.5) * 30, y: p[1], vx: (Math.random() - 0.5) * 30, vy: Math.random() * 30, life: 1.4, s: 1 + Math.random() * 2 });
  }
});
layer({
  id: 'shake', z: 9,
  update(dt, t) {
    const S = OW.shake;
    S.amt = Math.max(0, S.amt - dt * 0.8);
    const a = S.amt * S.amt;
    S.x = Math.sin(t * 61) * 5 * a + Math.sin(t * 23) * 2 * a;
    S.y = Math.cos(t * 47) * 2.2 * a;
  },
  draw() {},
});
})();
