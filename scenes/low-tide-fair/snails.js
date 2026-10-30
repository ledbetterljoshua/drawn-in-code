/* snails.js — the house-snails, and the towns on their backs.

   Every snail is a soft foot and head drawn live (breathing, its skirt rippling, its eyestalks
   waving on their own clock) under a shell sprite with its town baked in, plus a cast shadow and,
   where it stands near water, a reflection. All of them watch the pointer with their eyestalks;
   move fast and every stalk on the flats flinches in, then creeps back out.

   gran  z18  the grandmother: a spire town nine whorls high. Hover: her bell rings and the
              window lights climb the tower; linger: she lowers her stalks to look at you, and the
              old mole at the top waves his hat.
   tea   z16  the tea-house: a globe shell with a veranda, lanterns and a kettle chimney. Hover: the
              chimney puffs steam rings; linger: the lanterns swing on.
   book  z12  the bookbinder: a cone shell with a hoist. Hover: loose pages blow out of the top
              window and away on the wind.
   fish  z11  the fishmonger: a ribbed ram's-horn with drying racks. Hover: the shutter pops up and
              an otter holds up the catch of the day; two gulls come in to look.
   young z30  a youngster with three kids in its saddle basket. Hover: it wriggles and the kids
              throw up their arms.
   sleep z10  an old snail sealed up asleep. Hover: the door in its shell opens a crack and two
              eyes peer out; the z's stop.  */
(() => {
const D = Drawn, F = Fair;
const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, ink, grad, radial, st, P, layer, onLayout, sprite, blit } = D;
const { HZ, pxu, flat } = F;
const LINE = F.LINE;
F.zOf = (y) => 8 + (y - HZ) / 40;

const SKIN = {
  gran: { base: '#a49298', shade: '#77657c', lit: '#cdb8b2', foot: '#bfaaa4', spot: '#6f5a6e', sheen: '#f4ece6' },
  tea: { base: '#b9967a', shade: '#856a6c', lit: '#dcbb98', foot: '#cdb093', spot: '#7c5d58', sheen: '#f8efe2' },
  book: { base: '#9aa08c', shade: '#6d7480', lit: '#c3c3a4', foot: '#b5b69d', spot: '#5f6670', sheen: '#f1efe4' },
  fish: { base: '#a89aa6', shade: '#776c86', lit: '#cbbcbc', foot: '#bdb0b4', spot: '#6a5d78', sheen: '#f2ecea' },
  young: { base: '#c7a7a0', shade: '#937a88', lit: '#ead0be', foot: '#dcc0b2', spot: '#a07f88', sheen: '#fbf3ea' },
};

// ------------------------------------------------------------ the snail rig
// sn: { x, y (front of the foot on the sand), dir, k (size), L (foot length, local units), skin }
function snailBodyPath(L, br = 1) {
  const h = L * 0.13 * br;
  return curve([
    [-L * 0.5, -1], [-L * 0.46, -h * 0.35], [-L * 0.3, -h * 0.85], [-L * 0.05, -h], [L * 0.2, -h * 0.95],
    [L * 0.32, -h * 1.05], [L * 0.36, -h * 0.7], [L * 0.47, -h * 0.35], [L * 0.53, -2], [L * 0.2, 1.5], [-L * 0.2, 1.5],
  ]);
}
function drawFoot(g, sn, t) {
  const L = sn.L, sk = sn.skin;
  const br = 1 + Math.sin(t * 0.9 + sn.ph) * 0.02;
  const body = snailBodyPath(L, br);
  ink(g, body, sk.base, sn.lw * 1.1);
  g.save(); g.clip(body);
  // lit from the low sun: in snail space the sun is on -x when facing right
  const sx = -sn.dir;
  g.fillStyle = grad(g, sx * L * 0.55, 0, -sx * L * 0.55, 0, [sk.lit, sk.base, sk.shade]);
  g.fillRect(-L * 0.6, -L * 0.25, L * 1.2, L * 0.3);
  // the skirt: a paler, wavy rim along the sand where the muscle waves travel forward
  g.fillStyle = sk.foot;
  g.beginPath(); g.moveTo(-L * 0.55, 2);
  for (let i = 0; i <= 30; i++) { const u = i / 30, x = lerp(-L * 0.52, L * 0.54, u); g.lineTo(x, -L * 0.022 - Math.sin(u * 22 - t * 2.2 + sn.ph) * L * 0.006); }
  g.lineTo(L * 0.6, 2); g.closePath(); g.fill();
  // mottled, reticulated skin: grooves and dark tubercles (seeded so they stay put)
  const r = rng(sn.seed);
  g.strokeStyle = F.rgba(sk.spot, 0.45); g.lineWidth = Math.max(0.5, L * 0.004);
  for (let i = 0; i < 26; i++) {
    const x = -L * 0.5 + r() * L, y = -L * 0.02 - r() * L * 0.11;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L * 0.02, y - L * 0.012, x + L * 0.04, y + (r() - 0.5) * L * 0.01); g.stroke();
  }
  g.fillStyle = F.rgba(sk.spot, 0.5);
  for (let i = 0; i < 36; i++) g.fill(ell(-L * 0.5 + r() * L, -L * 0.02 - r() * L * 0.1, L * 0.006 + r() * L * 0.006, L * 0.004 + r() * L * 0.004));
  // a wet sheen along the top, and a cool shadow under the shell
  g.strokeStyle = F.rgba(sk.sheen, 0.7); g.lineWidth = Math.max(0.8, L * 0.008);
  g.beginPath(); g.moveTo(-L * 0.42, -L * 0.04); g.quadraticCurveTo(-L * 0.2, -L * 0.12, L * 0.0, -L * 0.115); g.stroke();
  g.fillStyle = 'rgba(70,50,90,0.35)'; g.fill(ell(sn.shellX * sn.dir, -L * 0.13, L * 0.3, L * 0.045));
  g.restore();
}
// head, neck and tentacles; eyestalks track the pointer and flinch at fast movement
function drawHead(g, sn, t) {
  const L = sn.L, sk = sn.skin, lw = sn.lw;
  const sway = Math.sin(t * 0.6 + sn.ph) * L * 0.01 + sn.nod * L * 0.03;
  const hx = L * 0.44 + sway, hy = -L * 0.2 + Math.sin(t * 0.9 + sn.ph) * L * 0.004 + sn.nod * L * 0.04;
  const neck = curve([[L * 0.22, -L * 0.1], [L * 0.33, -L * 0.17], [hx - L * 0.02, hy - L * 0.07], [hx + L * 0.08, hy - L * 0.02], [hx + L * 0.09, hy + L * 0.06], [L * 0.53, -L * 0.01], [L * 0.38, -L * 0.04]]);
  // far tentacle first (behind the head)
  drawStalk(g, sn, sn.stalks[1], hx - L * 0.01, hy - L * 0.06, t, true);
  ink(g, neck, sk.base, lw * 1.1);
  g.save(); g.clip(neck);
  const sx = -sn.dir;
  g.fillStyle = grad(g, hx + sx * L * 0.1, 0, hx - sx * L * 0.12, 0, [sk.lit, sk.base, sk.shade]);
  g.fillRect(L * 0.15, -L * 0.35, L * 0.5, L * 0.36);
  g.fillStyle = F.rgba(sk.sheen, 0.6); g.fill(ell(hx - L * 0.01, hy - L * 0.06, L * 0.04, L * 0.012, undefined, -0.4));
  g.fillStyle = F.rgba(sk.spot, 0.45);
  const r = rng(sn.seed + 3);
  for (let i = 0; i < 10; i++) g.fill(circ(L * 0.3 + r() * L * 0.2, -L * 0.04 - r() * L * 0.14, L * 0.005 + r() * L * 0.004));
  g.restore();
  // lower tentacles, short and feeling the sand
  for (const [k, ph] of [[1, 0], [0.75, 1.7]]) {
    const bx = hx + L * 0.07, by = hy + L * 0.04, a = 0.5 + Math.sin(t * 1.3 + ph + sn.ph) * 0.15;
    const ex = bx + Math.cos(a) * L * 0.05 * k, ey = by + Math.sin(a) * L * 0.05 * k;
    g.lineCap = 'round';
    g.beginPath(); g.moveTo(bx, by); g.lineTo(ex, ey); g.lineWidth = L * 0.016 + lw * 2; g.strokeStyle = LINE; g.stroke();
    g.lineWidth = L * 0.016; g.strokeStyle = k < 1 ? sk.shade : sk.base; g.stroke();
  }
  // a mouth, smiling when content
  g.beginPath(); g.moveTo(hx + L * 0.065, hy + L * 0.035); g.quadraticCurveTo(hx + L * 0.08, hy + L * 0.04 + sn.smile * L * 0.012, hx + L * 0.095, hy + L * 0.03);
  g.lineWidth = lw * 0.7; g.strokeStyle = LINE; g.stroke();
  drawStalk(g, sn, sn.stalks[0], hx + L * 0.015, hy - L * 0.07, t, false);
  sn.headAt = [hx, hy];
}
function drawStalk(g, sn, s, bx, by, t, far) {
  const L = sn.L, sk = sn.skin;
  const len = L * 0.2 * s.len;
  const a = s.a;
  const bend = Math.sin(t * 1.1 + s.ph) * 0.12;
  const mx = bx + Math.cos(a - bend) * len * 0.5, my = by + Math.sin(a - bend) * len * 0.5;
  const ex = bx + Math.cos(a) * len, ey = by + Math.sin(a) * len;
  g.lineCap = 'round';
  const w0 = L * 0.024, w1 = L * 0.013;
  const path = new Path2D(); path.moveTo(bx, by); path.quadraticCurveTo(mx, my, ex, ey);
  g.lineWidth = w0 + sn.lw * 2; g.strokeStyle = LINE; g.stroke(path);
  g.lineWidth = w0; g.strokeStyle = far ? sk.shade : sk.base; g.stroke(path);
  g.lineWidth = w1 * 0.5; g.strokeStyle = far ? sk.base : F.rgba(sk.lit, 0.9);
  g.save(); g.translate(sn.dir > 0 ? -w0 * 0.2 : w0 * 0.2, 0); g.stroke(path); g.restore();
  // the eye: a dark bulb at the tip, with a glint, the pupil drifting toward the pointer
  const er = L * 0.018 * (0.8 + s.len * 0.2);
  ink(g, circ(ex, ey, er), far ? '#3d2c43' : '#4b3650', sn.lw * 0.8);
  g.fillStyle = '#20141f'; g.fill(circ(ex + s.lx * er * 0.35, ey + s.ly * er * 0.35, er * 0.6));
  g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill(circ(ex - er * 0.3 * sn.dir, ey - er * 0.35, er * 0.3));
  s.tip = [ex, ey];
}
// eyestalk attention: aim at the pointer (in snail space), flinch on fast movement
function stepStalks(sn, dt, t) {
  const S = sn.S;
  const lx = (P.x - sn.x) / (S * sn.dir), ly = (P.y - sn.y) / S;
  const head = sn.headAt || [sn.L * 0.44, -sn.L * 0.2];
  const dist = Math.hypot(P.x - (sn.x + head[0] * S * sn.dir), P.y - (sn.y + head[1] * S));
  const attend = P.inside ? clamp(1.25 - dist / 900, 0, 1) : 0;
  const near = P.inside ? clamp(1.3 - dist / 700, 0, 1) : 0;
  sn.flinch = Math.max(sn.flinch * Math.exp(-0.9 * dt), F.startle * near);
  sn.act.step(dt);
  for (const [i, s] of sn.stalks.entries()) {
    const base = -1.25 + i * -0.22 + Math.sin(t * 0.35 + s.ph) * 0.18 + sn.act.b('look') * sn.act.side * 0.5;
    const toP = Math.atan2(ly - (head[1] - sn.L * 0.07), lx - head[0]);
    let d = toP - base; d = Math.atan2(Math.sin(d), Math.cos(d));
    const lower = sn.lower || 0;
    const target = base + clamp(d, -0.9, 0.9) * attend * 0.75 + lower * 0.7;
    s.a = ease(s.a, target, 2.2, dt);
    const tuck = Math.max(sn.flinch, sn.act.b('tuck') * (i === (sn.act.side > 0 ? 0 : 1) ? 1 : 0.6));
    s.len = ease(s.len, 1 - tuck * 0.72, tuck > s.lenT ? 12 : 1.4, dt);
    s.lenT = tuck;
    s.lx = ease(s.lx, clamp(Math.cos(toP), -1, 1) * attend, 4, dt);
    s.ly = ease(s.ly, clamp(Math.sin(toP), -1, 1) * attend, 4, dt);
  }
}
function makeSnail(o) {
  const sn = Object.assign({ dir: 1, k: 1, ph: Math.random() * 10, seed: 1, nod: 0, smile: 0.4, flinch: 0, lower: 0, shellX: -0.1 }, o);
  sn.S = pxu(sn.y) * sn.k;
  sn.lw = clamp(1.6 / sn.S, 0.6 / sn.S, 2.6);
  sn.skin = SKIN[o.skin];
  sn.stalks = [0, 1].map((i) => ({ a: -1.3 - i * 0.2, len: 1, lenT: 0, ph: i * 1.7 + sn.ph, lx: 0, ly: 0 }));
  sn.act = F.actor(sn.seed + 40, [['look', 3], ['tuck', 1.6], ['look', 2.4]], [3, 9]);
  return sn;
}
// local snail space → artboard
const toArt = (sn, lx, ly) => [sn.x + lx * sn.S * sn.dir, sn.y + ly * sn.S];

// a shell sprite and its shadow: fn draws the shell in "shell space" — snail units, unflipped
// (screen-right is +x, so the sun stays on the left), origin at the snail's foot centre
function bakeShell(sn, box, fn) {
  const [bx0, by0, bx1, by1] = box, S = sn.S;
  sn.shell = sprite(sn.x + bx0 * S - 4, sn.y + by0 * S - 4, (bx1 - bx0) * S + 8, (by1 - by0) * S + 8, (g) => {
    g.translate(sn.x, sn.y); g.scale(S, S);
    fn(g);
  });
  sn.shadow = F.silhouette(sn.shell, '#8c7fae');
}
function drawShadow(g, sn, a = 0.4) {
  // the shell's own silhouette, sheared along the sand, plus the foot's long thin streak
  g.save();
  g.translate(sn.x, sn.y);
  g.transform(1, 0, -F.SHX, F.SHY, 0, 0);
  g.translate(-sn.x, -sn.y);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = a;
  g.drawImage(sn.shadow.c, sn.shadow.x0, sn.shadow.y0, sn.shadow.w, sn.shadow.h);
  g.restore();
  F.contact(g, sn.x - sn.dir * sn.L * 0.02 * sn.S, sn.y + 1, sn.L * 0.55 * sn.S, 0.6);
}

// ============================================================ the grandmother
const gran = makeSnail({ id: 'gran', x: 820, y: 790, dir: 1, k: 1, L: 380, skin: 'gran', seed: 11, shellX: -0.12 });
gran.sp = F.spire({ x: -40, y: -34, w: 290, h: 112, n: 9, rw: 0.8, rh: 0.84, lean: -5, body: 1.4, slope: 0.1, lw: 2.6 });
gran.trail = [[700, 430], [640, 520], [600, 610], [640, 700], [700, 770], [760, 793]];
gran.trailW = 110;
const SHELL_GRAN = { lit: '#fff3dd', base: '#f0d9bd', shade: '#c49ea6', bounce: '#e4b395', band: '#c0623f', band2: '#8a4752', growth: '#a98272', line: '#3b2433' };
gran.bell = F.pendulum({ k: 30, damp: 1.2, lean: 0.04, x: 800 });
gran.lights = 0; gran.wave = 0;
// the town on her back, in shell space
function granTown(g) {
  const ws = gran.sp.ws, r = rng(5);
  gran.chimneys = [];
  // the rope ladder and the ground-floor door on the body whorl
  const w0 = ws[0];
  const [dx, dy, dk] = F.bandAt(w0, -0.25, 0.08);
  F.door(g, dx, dy + 2, 30, 46, dk, '#7d4f54');
  ink(g, poly([[dx - 22, dy + 2], [dx + 22, dy + 2], [dx + 26, dy + 8], [dx - 26, dy + 8]]), F.WOOD.base, 1.2);
  // a hanging lantern by the door
  g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.moveTo(dx + 22, dy - 44); g.lineTo(dx + 26, dy - 40); g.lineTo(dx + 26, dy - 32); g.stroke();
  ink(g, ell(dx + 26, dy - 27, 4, 5.5), '#ffd98a', 1);
  // windows: fewer and smaller up the tower
  const wins = [[0, -0.95, 0.55], [0, 0.55, 0.5], [0, 1.05, 0.55], [1, -0.6, 0.45], [1, 0.25, 0.5], [1, 0.95, 0.4], [2, -0.2, 0.45], [2, 0.8, 0.45], [3, -0.85, 0.45], [3, 0.35, 0.45], [4, 0.0, 0.45], [4, 0.95, 0.4], [5, -0.5, 0.45], [6, 0.4, 0.45]];
  gran.winSpots = [];
  for (const [i, a, v] of wins) {
    const w = ws[i];
    const [x, y, k] = F.bandAt(w, a, v);
    const sz = clamp(w.h * 0.26, 9, 30);
    F.window(g, x, y, sz, sz * 1.35, k, { shutters: r() < 0.6 ? ['#5d8aa0', '#7a9c6a', '#c46a5a', '#e2b45a'][i % 4] : null, box: r() < 0.5 ? ['#e07f62', '#f2c95c', '#f4efe6'][i % 3] : null });
    gran.winSpots.push([x, y, sz * Math.max(0.25, k), sz * 1.35, i]);
  }
  // ledges along the sutures: a boardwalk with posts and a rope rail, and stairs between them
  for (let i = 0; i < ws.length - 2; i++) {
    const w = ws[i], up = ws[i + 1];
    const x0 = w.cx - w.rt * 0.98, x1 = w.cx + w.rt * 0.98;
    const pts = [];
    for (let k = 0; k <= 10; k++) { const x = lerp(x0, x1, k / 10); pts.push([x, F.bandBottom(up, x) - 1]); }
    const th = clamp(w.h * 0.08, 3, 8);
    // the shadow the ledge throws onto the whorl below it
    g.fillStyle = 'rgba(80,50,90,0.3)';
    g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y + th * 0.5) : g.moveTo(x, y + th * 0.5))); for (let k = pts.length - 1; k >= 0; k--) g.lineTo(pts[k][0] + th, pts[k][1] + th * 2.6); g.fill();
    for (let k = 0; k < pts.length - 1; k++) F.plank(g, pts[k], pts[k + 1], th, F.WOOD, i * 20 + k, 1);
    // the top surface of the boardwalk, lit
    g.strokeStyle = '#e6c08e'; g.lineWidth = Math.max(0.8, th * 0.35);
    g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y - th * 0.45) : g.moveTo(x, y - th * 0.45))); g.stroke();
    const ph = th * 2.6;
    for (let k = 0; k <= 10; k += 2) { const [x, y] = pts[k]; F.post(g, x, y - ph, y - th * 0.3, Math.max(1.4, th * 0.35), F.WOOD, 0.8); }
    g.beginPath(); pts.forEach(([x, y], k) => (k ? g.lineTo(x, y - ph + Math.sin(k * 0.9) * 0.5 + (k % 2) * 1.2) : g.moveTo(x, y - ph)));
    g.lineWidth = Math.max(0.8, th * 0.22); g.strokeStyle = '#c79e6a'; g.stroke();
    // stairs up to the next ledge, alternating sides
    if (i < ws.length - 3) {
      const side = i % 2 ? 1 : -1;
      const nxt = ws[i + 2];
      const [sxA, syA] = [w.cx + side * w.rt * 0.55, F.bandBottom(up, w.cx + side * w.rt * 0.55) - 2];
      const xB = up.cx + side * up.rt * 0.88, yB = F.bandBottom(nxt, xB) - 2;
      const n = 6;
      for (let k = 0; k < n; k++) {
        const u = k / n, u1 = (k + 1) / n;
        const x = lerp(sxA, xB, u), y = lerp(syA, yB, u), y1 = lerp(syA, yB, u1);
        F.plank(g, [x - th * 0.9, y], [x + th * 0.9, y], th * 0.5, F.WOOD, 300 + i * 9 + k, 0.8);
        g.strokeStyle = 'rgba(70,40,60,0.5)'; g.lineWidth = 0.7; g.beginPath(); g.moveTo(x - th, y); g.lineTo(lerp(sxA, xB, u1) - th, y1); g.stroke();
      }
      g.strokeStyle = '#c79e6a'; g.lineWidth = Math.max(0.8, th * 0.2);
      g.beginPath(); g.moveTo(sxA + th, syA - ph); g.lineTo(xB + th, yB - ph); g.stroke();
    }
    // gardens and pots on the ledges
    if (i % 2 === 0) F.garden(g, lerp(x0, x1, 0.28), F.bandBottom(up, lerp(x0, x1, 0.28)) - th * 0.5, clamp(w.rt * 0.4, 12, 46), 40 + i);
    if (i % 3 === 1) {
      const px = lerp(x0, x1, 0.75), py = F.bandBottom(up, px) - th * 0.5, ps = clamp(w.h * 0.09, 3.5, 8);
      ink(g, poly([[px - ps, py - ps * 1.6], [px + ps, py - ps * 1.6], [px + ps * 0.7, py], [px - ps * 0.7, py]]), '#c4705a', 0.9);
      D.lumps(g, [[px, py - ps * 2.4, ps * 0.9], [px - ps * 0.7, py - ps * 1.9, ps * 0.7], [px + ps * 0.7, py - ps * 2, ps * 0.6]], { line: LINE, lw: 0.6, shade: '#4f6e48', base: '#6f9452', lit: '#9cbb62' });
    }
  }
  // chimneys: hollow spines pulled out of the shell, capped with a tin hood
  for (const [i, a] of [[2, 1.2], [4, -1.15]]) {
    const w = ws[i];
    const [x, y] = F.bandAt(w, a, 0.6);
    const s = clamp(w.h * 0.2, 6, 16), dirx = a > 0 ? 1 : -1;
    const horn = curve([[x - s * 0.5, y + s * 0.4], [x + dirx * s * 0.6, y - s * 0.8], [x + dirx * s * 0.9, y - s * 2.2], [x + dirx * s * 1.3, y - s * 2.1], [x + dirx * s * 1.2, y - s * 0.8], [x + s * 0.5, y + s * 0.4]]);
    ink(g, horn, SHELL_GRAN.base, 1.4);
    g.save(); g.clip(horn); g.fillStyle = SHELL_GRAN.shade; g.fill(ell(x + s, y - s, s * 0.7, s * 2)); g.fillStyle = SHELL_GRAN.band; g.globalAlpha = 0.6; g.fillRect(x - s, y - s * 1.2, s * 3, s * 0.3); g.restore();
    ink(g, poly([[x + dirx * s * 0.6, y - s * 2.3], [x + dirx * s * 1.6, y - s * 2.3], [x + dirx * s * 1.1, y - s * 2.8]]), '#7c7890', 1);
    (gran.chimneys = gran.chimneys || []).push([x + dirx * s * 1.1, y - s * 2.8]);
  }
  // laundry poles on the third whorl (the line itself flutters live)
  const wl = ws[3];
  const la = [wl.cx - wl.rt * 1.15, F.bandBottom(ws[4], wl.cx - wl.rt * 0.9) - 14], lb = [wl.cx + wl.rt * 0.1, F.bandBottom(ws[4], wl.cx + wl.rt * 0.1) - 18];
  F.post(g, la[0], la[1], la[1] + 16, 2.4); F.post(g, lb[0], lb[1], lb[1] + 18, 2.4);
  gran.laundry = [la, lb];
  // the cupola on the apex: four posts and a little roof over the bell
  const [ax, ay] = gran.sp.apex;
  const cw = 26, ch = 26, cy = ay + 6;
  for (const k of [-1, 1]) F.post(g, ax + k * cw * 0.42, cy - ch, cy, 3, F.WOOD, 0.9);
  ink(g, poly([[ax - cw * 0.8, cy - ch], [ax, cy - ch - 20], [ax + cw * 0.8, cy - ch], [ax + cw * 0.7, cy - ch + 4], [ax - cw * 0.7, cy - ch + 4]]), '#a8564c', 1.4);
  g.fillStyle = '#d27a62'; g.fill(poly([[ax - cw * 0.8, cy - ch], [ax, cy - ch - 20], [ax - 2, cy - ch + 4], [ax - cw * 0.7, cy - ch + 4]]));
  g.strokeStyle = 'rgba(60,30,40,0.4)'; g.lineWidth = 0.7;
  for (let k = 1; k < 5; k++) { g.beginPath(); g.moveTo(ax - cw * 0.8 + k * cw * 0.16, cy - ch + 2 - k * 3.5); g.lineTo(ax + cw * 0.8 - k * cw * 0.16, cy - ch + 2 - k * 3.5); g.stroke(); }
  F.plank(g, [ax - cw * 0.6, cy], [ax + cw * 0.6, cy], 4, F.WOOD, 77, 1);
  gran.bellAt = [ax, cy - ch + 4];
  gran.flagAt = [ax, cy - ch - 20];
}
gran.box = [-260, -560, 200, 20];

// ============================================================ the tea-house
const tea = makeSnail({ id: 'tea', x: 1440, y: 672, dir: -1, k: 0.95, L: 300, skin: 'tea', seed: 23, shellX: -0.05 });
tea.gl = F.globe({ x: 20, y: -30, R: 118, turns: 3.3, apex: [-6, -20], spin: 0.6, lw: 2.6 });
tea.trail = [[1640, 404], [1580, 470], [1500, 540], [1470, 610], [1460, 672]];
tea.trailW = 100;
const SHELL_TEA = { lit: '#fbe7c6', base: '#e9be8c', shade: '#ad7f84', bounce: '#e8a582', band: '#8a4a3d', band2: '#c76d48', growth: '#9b6a55', line: '#3b2433' };
function teaTown(g) {
  const gl = tea.gl, { cx, cy, R } = gl;
  // round windows following the coil
  const wins = [[0.6, 1.2], [1.25, 0.8], [2.0, 0.6], [0.2, 1.0]];
  for (const [th, k] of wins) {
    const [x0, y0] = gl.spiral(th * TAU * 0.5 + 2), [x1, y1] = gl.spiral(th * TAU * 0.5 + 2 + TAU);
    const x = (x0 + x1) / 2, y = (y0 + y1) / 2, rr = Math.max(5, Math.hypot(x1 - x0, y1 - y0) * 0.22);
    g.save(); g.translate(-rr * 0.12, rr * 0.08); g.fillStyle = 'rgba(80,50,80,0.45)'; g.fill(circ(x, y, rr)); g.restore();
    ink(g, circ(x, y, rr), grad(g, x, y - rr, x, y + rr, ['#ffe4a0', '#f2a861']), 1.6);
    g.strokeStyle = LINE; g.lineWidth = 0.9; g.beginPath(); g.moveTo(x - rr, y); g.lineTo(x + rr, y); g.moveTo(x, y - rr); g.lineTo(x, y + rr); g.stroke();
    ink(g, ell(x, y + rr * 1.05, rr * 1.2, rr * 0.22), F.WOOD.base, 0.9);
  }
  // the veranda: a deck on posts wrapped round the front of the shell, with a striped awning
  const dy = -36, dx0 = cx - R * 1.15, dx1 = cx + R * 0.95;
  for (const x of [dx0 + 6, dx0 + 60, cx + 10, dx1 - 6]) F.post(g, x, dy, -6, 5, F.WOOD, 1.1);
  for (let k = 0; k < 8; k++) F.plank(g, [lerp(dx0, dx1, k / 8), dy], [lerp(dx0, dx1, (k + 1) / 8), dy], 7, F.WOOD, 500 + k, 1.1);
  // railing
  for (let k = 0; k <= 16; k++) { const x = lerp(dx0, dx1, k / 16); g.fillStyle = k % 4 ? '#c39a72' : '#a77a58'; g.fillRect(x - 1, dy - 16, 2, 13); }
  g.strokeStyle = LINE; g.lineWidth = 1; g.strokeRect(dx0, dy - 17, dx1 - dx0, 2.5); g.fillStyle = '#d8b088'; g.fillRect(dx0, dy - 17, dx1 - dx0, 2.5);
  // awning on two poles, scalloped
  const ay = dy - 64, ax0 = dx0 - 6, ax1 = cx + R * 0.15;
  F.post(g, ax0 + 4, ay, dy - 4, 3.4); F.post(g, ax1 - 4, ay, dy - 4, 3.4);
  const aw = new Path2D(); aw.moveTo(ax0 - 4, ay + 8); aw.lineTo(ax0 + 14, ay - 18); aw.lineTo(ax1 + 10, ay - 22); aw.lineTo(ax1 + 6, ay + 6);
  const n = 7;
  for (let k = n; k >= 0; k--) { const x = lerp(ax0 - 4, ax1 + 6, k / n), x2 = lerp(ax0 - 4, ax1 + 6, (k - 0.5) / n); if (k < n) aw.quadraticCurveTo(x2 + (ax1 - ax0) / n / 2, ay + 16, x, ay + 7); }
  aw.closePath();
  ink(g, aw, '#f2e6cf', 1.6);
  g.save(); g.clip(aw);
  for (let k = 0; k < 14; k += 2) { const x = lerp(ax0 - 4, ax1 + 14, k / 14); g.fillStyle = '#c8574a'; g.fill(poly([[x, ay + 20], [x + 14, ay - 24], [x + 14 + (ax1 - ax0) / 14, ay - 24], [x + (ax1 - ax0) / 14, ay + 20]])); }
  g.fillStyle = 'rgba(80,50,90,0.25)'; g.fillRect(ax0 - 10, ay + 2, ax1 - ax0 + 30, 20);
  g.restore();
  // the shade under the awning, falling on the shell
  g.save(); g.clip(gl.outline); g.fillStyle = 'rgba(80,50,90,0.28)'; g.fillRect(ax0, ay + 10, ax1 - ax0 + 30, 26); g.restore();
  // the sign: a little board hung under the awning
  const sx = (ax0 + ax1) / 2 - 20, sy = ay + 30;
  g.strokeStyle = LINE; g.lineWidth = 0.8; g.beginPath(); g.moveTo(sx - 14, ay + 14); g.lineTo(sx - 12, sy - 6); g.moveTo(sx + 14, ay + 14); g.lineTo(sx + 12, sy - 6); g.stroke();
  ink(g, poly([[sx - 18, sy - 7], [sx + 18, sy - 7], [sx + 16, sy + 7], [sx - 16, sy + 7]]), '#3f6a6a', 1.2);
  g.fillStyle = '#f6e7c4'; g.font = 'italic 700 10px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('tea', sx, sy + 0.5);
  // the kettle chimney on top: a copper spout poking out of the shell
  const kx = cx - R * 0.2, ky = cy - R * 0.92;
  ink(g, poly([[kx - 7, ky + 8], [kx - 5, ky - 12], [kx + 5, ky - 12], [kx + 7, ky + 8]]), '#c07a4c', 1.4);
  g.fillStyle = '#e8a46a'; g.fillRect(kx - 4.5, ky - 11, 3, 18);
  ink(g, ell(kx, ky - 12, 6, 2), '#8a5236', 1.1);
  tea.chimney = [kx, ky - 13];
  // a roof garden behind it
  F.garden(g, cx + R * 0.35, cy - R * 0.85, 40, 61, ['#f2c95c', '#f4efe6', '#e07f62']);
  F.garden(g, cx + R * 0.7, cy - R * 0.55, 26, 62);
  tea.lantern = [[cx + R * 0.55, cy - R * 0.75], [ax0 - 30, dy - 70]];
}
tea.box = [-170, -270, 160, 10];

// ============================================================ the bookbinder
const book = makeSnail({ id: 'book', x: 345, y: 585, dir: 1, k: 0.95, L: 270, skin: 'book', seed: 37, shellX: -0.1 });
book.sp = F.spire({ x: -30, y: -26, w: 230, h: 86, n: 5, rw: 0.7, rh: 0.8, lean: -4, body: 1.25, slope: 0.12, lw: 2.8 });
book.trail = [[180, 404], [230, 470], [300, 540], [330, 585]];
book.trailW = 90;
const SHELL_BOOK = { lit: '#f4ead2', base: '#d9cba7', shade: '#9e92a2', bounce: '#d8b292', band: '#6b7a5c', band2: '#a3603f', growth: '#8a7d70', line: '#3b2433' };
function bookTown(g) {
  const ws = book.sp.ws;
  for (const [i, a, v] of [[0, -0.7, 0.5], [0, 0.6, 0.55], [1, -0.1, 0.5], [2, 0.5, 0.45]]) {
    const w = ws[i], [x, y, k] = F.bandAt(w, a, v), sz = clamp(w.h * 0.3, 10, 26);
    F.window(g, x, y, sz, sz * 1.3, k, { glow: i === 0 && a > 0, shutters: i === 1 ? '#6b7a5c' : null });
  }
  // stacks of books along the first ledge, and a hoist arm with a basket
  const w1 = ws[1];
  let bx = w1.cx - w1.rb * 0.85;
  const r = rng(9);
  while (bx < w1.cx + w1.rb * 0.2) {
    const by = F.bandBottom(w1, bx) - 1, hgt = 6 + r() * 7;
    ink(g, poly([[bx, by], [bx, by - hgt], [bx + 3.2, by - hgt], [bx + 3.2, by]]), ['#a34a3e', '#3f6a8a', '#d6a44a', '#5d7b4a', '#7a4a6a'][Math.floor(r() * 5)], 0.6);
    bx += 3.4;
  }
  const w2 = ws[2], [hx, hy] = F.bandAt(w2, 1.25, 0.6);
  F.plank(g, [hx - 6, hy], [hx + 54, hy - 10], 4, F.WOOD, 91, 1);
  book.hoist = [hx + 50, hy - 9];
  // a sign: an open book
  const [sx, sy] = F.bandAt(ws[0], -1.15, 0.75);
  g.strokeStyle = LINE; g.lineWidth = 0.9; g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx - 14, sy); g.stroke();
  ink(g, poly([[sx - 28, sy], [sx - 20, sy - 3], [sx - 14, sy], [sx - 14, sy + 12], [sx - 20, sy + 9], [sx - 28, sy + 12]]), '#f2e8d2', 1);
  g.strokeStyle = 'rgba(60,40,60,0.6)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(sx - 20, sy - 3); g.lineTo(sx - 20, sy + 9); g.stroke();
  const [ax, ay] = book.sp.apex;
  book.topWin = [ax + 4, ay + 28];
}
book.box = [-200, -380, 160, 10];

// ============================================================ the fishmonger
const fish = makeSnail({ id: 'fish', x: 1905, y: 512, dir: -1, k: 1, L: 280, skin: 'fish', seed: 51, shellX: -0.05 });
fish.gl = F.globe({ x: 10, y: -28, R: 100, turns: 3.6, apex: [0, -6], spin: 1.0, lw: 2.8 });
fish.trail = [[2120, 400], [2060, 440], [1980, 480], [1920, 512]];
fish.trailW = 90;
const SHELL_FISH = { lit: '#f3e6d6', base: '#d8c0b6', shade: '#9c8aa6', bounce: '#d9ab98', rib: '#a07c88', growth: '#8a7080', line: '#3b2433' };
function fishTown(g) {
  const { cx, cy, R } = fish.gl;
  // drying racks: poles and a line of fish across the top
  const ra = [cx - R * 0.95, cy - R * 0.75], rb = [cx + R * 0.7, cy - R * 0.95];
  F.post(g, ra[0], ra[1] - 30, ra[1] + 8, 4); F.post(g, rb[0], rb[1] - 30, rb[1] + 8, 4);
  g.strokeStyle = LINE; g.lineWidth = 1.2; g.beginPath(); g.moveTo(ra[0], ra[1] - 28); g.quadraticCurveTo((ra[0] + rb[0]) / 2, ra[1] - 14, rb[0], rb[1] - 28); g.stroke();
  for (let k = 1; k < 8; k++) {
    const u = k / 8, x = lerp(ra[0], rb[0], u), y = lerp(ra[1] - 28, rb[1] - 28, u) + Math.sin(u * Math.PI) * 7;
    g.save(); g.translate(x, y + 9); g.rotate(Math.PI / 2 + (k % 2 ? 0.08 : -0.06));
    ink(g, ell(0, 0, 9, 3.2), k % 3 ? '#b9c3c8' : '#d9a782', 1); g.fillStyle = 'rgba(90,80,110,0.5)'; g.fill(ell(0, 1.2, 8, 1.4));
    ink(g, poly([[8, 0], [12, -3], [12, 3]]), '#9aa6ae', 0.9);
    g.restore();
  }
  // the shop front: a striped awning over a counter at the bottom front, shutter above (live)
  const sx = cx - R * 0.7, sy = cy + R * 0.25;
  ink(g, poly([[sx - 34, sy - 22], [sx + 34, sy - 22], [sx + 34, sy + 18], [sx - 34, sy + 18]]), '#4a3346', 1.4);
  g.fillStyle = 'rgba(255,200,130,0.35)'; g.fillRect(sx - 32, sy - 20, 64, 36);
  F.plank(g, [sx - 40, sy + 18], [sx + 40, sy + 18], 7, F.WOOD, 801, 1.2);
  // ice crate with fish on the counter
  ink(g, poly([[sx - 24, sy + 14], [sx + 4, sy + 14], [sx + 4, sy + 4], [sx - 24, sy + 4]]), '#dfe7ea', 0.9);
  for (let k = 0; k < 4; k++) { g.save(); g.translate(sx - 20 + k * 6.5, sy + 6); g.rotate(-0.3); ink(g, ell(0, 0, 4, 1.6), '#a9b6bf', 0.6); g.restore(); }
  fish.shop = [sx, sy];
}
fish.box = [-140, -260, 140, 10];

// ============================================================ the youngster
const young = makeSnail({ id: 'young', x: 1650, y: 932, dir: -1, k: 1, L: 120, skin: 'young', seed: 67, shellX: -0.05 });
young.gl = F.globe({ x: 6, y: -12, R: 44, turns: 2.6, apex: [-3, -6], spin: 0.3, lw: 1.6 });
young.trail = [[1500, 470], [1540, 560], [1600, 700], [1640, 820], [1650, 932]];
young.trailW = 40;
const SHELL_YOUNG = { lit: '#fff0dc', base: '#f2c9a2', shade: '#c08f96', bounce: '#f0b18f', band: '#d9785a', band2: '#a75c6a', growth: '#b27e70', line: '#3b2433' };
function youngTown(g) {
  const { cx, cy, R } = young.gl;
  // a wicker saddle-basket strapped on top
  const by = cy - R * 0.78;
  const bsk = poly([[cx - 30, by - 14], [cx + 30, by - 14], [cx + 25, by + 6], [cx - 25, by + 6]]);
  ink(g, bsk, '#c99a5a', 1.4);
  g.save(); g.clip(bsk);
  for (let k = 0; k < 14; k++) { g.strokeStyle = k % 2 ? 'rgba(120,80,50,0.6)' : 'rgba(250,220,160,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(cx - 32 + k * 5, by - 14); g.lineTo(cx - 30 + k * 5, by + 6); g.stroke(); }
  g.fillStyle = 'rgba(80,50,60,0.3)'; g.fillRect(cx - 40, by, 80, 8);
  g.restore();
  g.strokeStyle = '#8a5a3a'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - 25, by + 4); g.quadraticCurveTo(cx - 44, cy, cx - 30, cy + R * 0.7); g.moveTo(cx + 25, by + 4); g.quadraticCurveTo(cx + 44, cy, cx + 32, cy + R * 0.6); g.stroke();
  young.basket = [cx, by - 12];
  // a pennant on a whip pole
  young.pole = [cx + 26, by - 12];
}
young.box = [-70, -130, 80, 10];

// ============================================================ the sleeper
const sleep = makeSnail({ id: 'sleep', x: 120, y: 520, dir: 1, k: 0.9, L: 200, skin: 'gran', seed: 71 });
sleep.gl = F.globe({ x: 0, y: -4, R: 82, turns: 3.4, apex: [-4, -8], spin: 0.2, lw: 2.8 });
sleep.trail = [[60, 404], [90, 470], [118, 520]];
sleep.trailW = 70;
const SHELL_SLEEP = { lit: '#efe2cf', base: '#d3c0ad', shade: '#988aa0', bounce: '#d2a892', band: '#7b6a8a', band2: '#a3705a', growth: '#8a7a7a', line: '#3b2433' };
function sleepTown(g) {
  const { cx, cy, R } = sleep.gl;
  // the shell lies tipped on its side; its opening is sealed with a round wooden door
  const ox = cx + R * 0.72, oy = cy + R * 0.42;
  ink(g, ell(ox, oy, R * 0.34, R * 0.42), '#4a3346', 1.8);
  sleep.door = [ox, oy, R * 0.3, R * 0.38];
  // a sign hung on a nail
  g.strokeStyle = LINE; g.lineWidth = 0.9; g.beginPath(); g.moveTo(cx - R * 0.15, cy - R * 0.2); g.lineTo(cx - R * 0.25, cy - R * 0.05); g.lineTo(cx - R * 0.05, cy - R * 0.05); g.closePath(); g.stroke();
  ink(g, poly([[cx - R * 0.5, cy - R * 0.06], [cx + R * 0.2, cy - R * 0.06], [cx + R * 0.18, cy + R * 0.2], [cx - R * 0.48, cy + R * 0.2]]), '#efe0c0', 1.1);
  g.fillStyle = '#6a3a48'; g.font = `italic 700 ${Math.round(R * 0.13)}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('shh', cx - R * 0.15, cy + R * 0.07);
  // moss and a little fern growing on the old shell
  F.garden(g, cx - R * 0.2, cy - R * 0.92, 50, 81, ['#f4efe6', '#c9d97a']);
}
sleep.box = [-100, -180, 100, 10];
sleep.peek = 0; sleep.zT = 0;

const SNAILS = [gran, tea, book, fish, young];
F.SNAILS = [gran, tea, book, fish, young, sleep];
F.gran = gran; F.tea = tea; F.young = young; F.fishSnail = fish; F.book = book;

onLayout(() => {
  bakeShell(gran, gran.box, (g) => { F.paintSpire(g, gran.sp, SHELL_GRAN, 11); granTown(g); });
  bakeShell(tea, tea.box, (g) => { F.paintGlobe(g, tea.gl, SHELL_TEA, 23); teaTown(g); });
  bakeShell(book, book.box, (g) => { F.paintSpire(g, book.sp, SHELL_BOOK, 37); bookTown(g); });
  bakeShell(fish, fish.box, (g) => { F.paintRam(g, fish.gl, SHELL_FISH, 51); fishTown(g); });
  bakeShell(young, young.box, (g) => { F.paintGlobe(g, young.gl, SHELL_YOUNG, 67); youngTown(g); });
  bakeShell(sleep, sleep.box, (g) => { F.paintGlobe(g, sleep.gl, SHELL_SLEEP, 71); sleepTown(g); });
});

// ------------------------------------------------------------ shadows and reflections (one layer each, under everything that stands)
layer({
  id: 'snail-shadows', z: 7, still: true,
  draw(g) {
    for (const sn of F.SNAILS) drawShadow(g, sn, sn === gran ? 0.42 : 0.38);
  },
});
layer({
  id: 'reflections', z: 6.5, still: true,
  draw(g) {
    g.save(); g.clip(F.water);
    for (const sn of [gran, tea, young, book]) {
      // mirrored about the line where it stands, faint, and a touch bluer than the real thing
      g.save(); g.translate(0, sn.y * 2 + 2); g.scale(1, -1);
      g.globalAlpha = 0.32; blit(g, sn.shell);
      g.restore();
    }
    g.restore();
  },
});

// ------------------------------------------------------------ one layer per snail: body, shell, life
function snailLayer(sn, z, extra) {
  return layer(Object.assign({
    id: sn.id, z,
    hit(x, y) { const [x0, y0, x1, y1] = sn.box, S = sn.S; const lx = (x - sn.x) / S, ly = (y - sn.y) / S; const sx = sn.dir > 0 ? lx : -lx; return (lx > x0 && lx < x1 && ly > y0 && ly < y1 + 5) || (sx > -sn.L * 0.5 && sx < sn.L * 0.55 && ly > -sn.L * 0.3 && ly < 4); },
    update(dt, t, L) { stepStalks(sn, dt, t); if (extra.tick) extra.tick(dt, t, L); },
    draw(g, t, L) {
      const S = sn.S, bob = Math.sin(t * 0.9 + sn.ph) * 0.8;
      g.save(); g.translate(sn.x, sn.y); g.scale(S * sn.dir, S);
      drawFoot(g, sn, t);
      g.restore();
      if (extra.behind) extra.behind(g, t, L);
      blit(g, sn.shell, 0, bob * S * 0.6);
      g.save(); g.translate(sn.x, sn.y); g.scale(S * sn.dir, S);
      drawHead(g, sn, t);
      g.restore();
      if (extra.front) { g.save(); g.translate(sn.x, sn.y + bob * S * 0.6); g.scale(S, S); extra.front(g, t, L); g.restore(); }
    },
  }, extra.layer || {}));
}

// gran: the bell, window lights climbing, laundry, chimney smoke, and the old mole at the top
let granRing = 0;
const granLaundry = [{ c: '#f4efe6', w: 12, h: 16 }, { c: '#e07f62', w: 9, h: 14 }, { c: '#5a7b8c', w: 13, h: 18 }, { c: '#f2c95c', w: 8, h: 10 }, { c: '#f4efe6', w: 11, h: 9 }];
const granMole = { blink: F.blinker(3), act: F.actor(5, [['look', 2], ['fiddle', 4]], [2, 6]) };
snailLayer(gran, F.zOf(gran.y), {
  layer: { onEnter() { gran.bell.v += 7 * (P.vx >= 0 ? 1 : -1); granRing = 1.6; D.emit('bell', { from: 'gran' }); } },
  tick(dt, t, L) {
    F.swing(gran.bell, dt, t);
    granRing = Math.max(0, granRing - dt);
    if (granRing > 0 && Math.random() < dt * 3) F.spawn({ kind: 'note', x: gran.x - 40 * gran.S + (Math.random() - 0.5) * 20, y: gran.y - 520 * gran.S, vx: 10 + Math.random() * 10, vy: -26, life: 1.8, size: 1.1 });
    gran.lights = ease(gran.lights, L.hovered ? Math.min(1, L.since / 1.6) : 0, L.hovered ? 6 : 0.8, dt);
    gran.lower = ease(gran.lower, L.hovered && L.since > 0.6 ? 1 : 0, 1.2, dt);
    gran.smile = ease(gran.smile, L.hovered && L.since > 0.6 ? 1.4 : 0.4, 2, dt);
    gran.nod = ease(gran.nod, L.hovered && L.since > 0.6 ? 0.5 : 0, 1.4, dt);
    gran.wave = ease(gran.wave, L.hovered && L.since > 0.8 ? 1 : 0, 3, dt);
    granMole.blink.step(dt); granMole.act.step(dt);
    if (Math.random() < dt * 1.4) for (const [cx, cy] of gran.chimneys || []) F.spawn({ kind: 'smoke', x: gran.x + cx * gran.S, y: gran.y + cy * gran.S, vx: 6, vy: -12, life: 4, size: 0.9, grow: 1 });
  },
  front(g, t, L) {
    const S = gran.S;
    // window lights climb the tower as you linger
    if (gran.lights > 0.01) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const [x, y, w, h, i] of gran.winSpots || []) {
        const on = clamp(gran.lights * 9 - i, 0, 1);
        if (on <= 0) continue;
        g.fillStyle = `rgba(255,190,100,${0.55 * on})`;
        g.fill(ell(x, y + h * 0.1, w * 0.45, h * 0.45));
        g.fillStyle = radial(g, x, y, 0, w * 1.6, [[0, `rgba(255,200,120,${0.25 * on})`], [1, 'rgba(255,200,120,0)']]); g.fill(circ(x, y, w * 1.6));
      }
      g.restore();
    }
    // laundry on its line, flapping in the wind
    const [la, lb] = gran.laundry;
    const sag = 7 + Math.sin(t * 1.2) * 1;
    g.strokeStyle = LINE; g.lineWidth = 0.9 / 1;
    g.beginPath(); g.moveTo(la[0], la[1]); g.quadraticCurveTo((la[0] + lb[0]) / 2, (la[1] + lb[1]) / 2 + sag * 2, lb[0], lb[1]); g.stroke();
    granLaundry.forEach((c, i) => {
      const u = (i + 0.7) / (granLaundry.length + 0.6), x = lerp(la[0], lb[0], u), y = lerp(la[1], lb[1], u) + Math.sin(u * Math.PI) * sag * 1.0 * 2 * 0.5;
      const w = D.wind(t, gran.x + x * S), fl = Math.sin(t * 4 + i * 1.9) * 0.18 * w;
      g.save(); g.translate(x, y + 1); g.rotate(-w * 0.18 + fl);
      const p = poly([[-c.w / 2, 0], [c.w / 2, 0], [c.w / 2 + w * 3, c.h], [-c.w / 2 + w * 3, c.h * (0.9 + fl)]]);
      ink(g, p, c.c, 0.9);
      g.fillStyle = 'rgba(80,60,100,0.22)'; g.fill(poly([[c.w * 0.1, 0], [c.w / 2, 0], [c.w / 2 + w * 3, c.h], [c.w * 0.1 + w * 3, c.h]]));
      g.fillStyle = '#c99a5a'; g.fillRect(-c.w / 2 + 1, -1.5, 1.4, 3); g.fillRect(c.w / 2 - 2.4, -1.5, 1.4, 3);
      g.restore();
    });
    // the bell swings in the cupola
    const [bx, by] = gran.bellAt, a = gran.bell.a;
    g.save(); g.translate(bx, by); g.rotate(a);
    g.strokeStyle = LINE; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 4); g.stroke();
    const bell = curve([[-7, 16], [-6, 8], [-4, 4], [0, 3], [4, 4], [6, 8], [7, 16], [0, 17]]);
    ink(g, bell, grad(g, -7, 0, 7, 0, ['#f8d77e', '#d9a443', '#9a6a35']), 1.3);
    ink(g, circ(Math.sin(a * 3) * 2, 17.5, 1.8), '#6a4a3a', 1);
    g.restore();
    // a pennant on the cupola roof, snapping in the wind
    const [fx, fy] = gran.flagAt, w = D.wind(t, gran.x);
    g.strokeStyle = LINE; g.lineWidth = 1.4; g.beginPath(); g.moveTo(fx, fy); g.lineTo(fx, fy - 34); g.stroke();
    const pts = [];
    for (let k = 0; k <= 8; k++) { const u = k / 8; pts.push([fx + u * 36 * (0.8 + w * 0.25), fy - 33 + u * 6 + Math.sin(u * 5 - t * 7) * u * 4 * (0.5 + w)]); }
    const flag = new Path2D(); flag.moveTo(fx, fy - 34); pts.forEach(([x, y]) => flag.lineTo(x, y)); for (let k = 8; k >= 0; k--) { const [x, y] = pts[k]; flag.lineTo(x, y + 10 * (1 - k / 8) + 1); } flag.closePath();
    ink(g, flag, '#d65a4a', 1.1);
    // the old mole on the top ledge, fiddling, who waves his hat when she's looked at
    const ws = gran.sp.ws, w6 = ws[6], mx = w6.cx - w6.rt * 0.35, my = F.bandBottom(ws[7], mx) - 3;
    const fid = granMole.act.is('fiddle');
    const bow = fid >= 0 ? Math.sin(t * 9) * 0.4 : 0;
    const sc = 0.55;
    F.folk(g, mx, my, {
      sp: 'mole', sc, dir: 1, coat: '#5a7b8c', acc: '#f2c95c', cloth: 'smock', t, blink: granMole.blink.v,
      armR: gran.wave > 0.1 ? -2.6 + Math.sin(t * 8) * 0.35 * gran.wave : fid >= 0 ? -1.3 + bow : -0.2, armL: fid >= 0 ? -1.9 : 0.2,
      head: gran.wave > 0.1 ? -0.5 : 0, happy: gran.wave > 0.5,
      hat: gran.wave > 0.1 ? null : F.HATS.straw('#e8c97a'),
      hold: (g, hand, back, line) => {
        if (gran.wave > 0.1) { g.save(); g.translate(hand[0], hand[1] - 3); g.rotate(-0.3 + Math.sin(t * 8) * 0.3); F.HATS.straw('#e8c97a')(g, 6.4, line, 1.2); g.restore(); }
        else if (fid >= 0) { ink(g, ell(back[0] + 2, back[1] - 2, 3, 5, undefined, -0.6), '#9a5a34', 0.8); g.strokeStyle = line; g.lineWidth = 0.6; g.beginPath(); g.moveTo(hand[0] - 2, hand[1] - 6); g.lineTo(hand[0] + 6, hand[1] + 4); g.stroke(); }
      },
    });
    if (fid >= 0 && Math.random() < 0.03) F.spawn({ kind: 'note', x: gran.x + mx * S + 10, y: gran.y + my * S - 30 * S * sc, vx: 8, vy: -18, life: 1.6, size: 0.7 });
  },
});

// tea: steam from the kettle chimney, lanterns that come on when you linger
const tea_ = { puff: 0, lamps: 0, swing: F.pendulum({ k: 8, damp: 0.8, lean: 0.08, x: 1400 }) };
snailLayer(tea, F.zOf(tea.y), {
  layer: { onEnter() { tea_.puff = 1; tea_.swing.v += 1.4; } },
  tick(dt, t, L) {
    tea_.puff = Math.max(0, tea_.puff - dt * 0.7);
    tea_.lamps = ease(tea_.lamps, L.hovered && L.since > 0.5 ? 1 : 0, 2, dt);
    F.swing(tea_.swing, dt, t);
    const [cx, cy] = tea.chimney, x = tea.x + cx * tea.S, y = tea.y + cy * tea.S;
    if (Math.random() < dt * (1.6 + tea_.puff * 10)) F.spawn({ kind: tea_.puff > 0.3 && Math.random() < 0.5 ? 'ring' : 'steam', x, y, vx: 4 + Math.random() * 6, vy: -22 - tea_.puff * 20, life: 2.6, size: 0.8 + tea_.puff * 0.5, grow: 1 });
  },
  front(g, t) {
    // a string of paper lanterns from the roof to the awning pole
    const [a, b] = tea.lantern;
    const ax = a[0], ay = a[1], bx = b[0], by = b[1];
    const sag = 18 + tea_.swing.a * 20;
    g.strokeStyle = LINE; g.lineWidth = 0.9; g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag * 2, bx, by); g.stroke();
    for (let k = 1; k < 7; k++) {
      const u = k / 7, x = lerp(lerp(ax, (ax + bx) / 2, u), lerp((ax + bx) / 2, bx, u), u), y = lerp(lerp(ay, (ay + by) / 2 + sag * 2, u), lerp((ay + by) / 2 + sag * 2, by, u), u);
      const sw = Math.sin(t * 1.6 + k) * 0.12 + tea_.swing.a * 0.4;
      g.save(); g.translate(x, y); g.rotate(sw);
      const on = clamp(tea_.lamps * 7 - k + 1, 0, 1);
      const col = ['#e86a4a', '#f2c95c', '#f4efe6', '#e86a4a', '#a8689b', '#f2c95c'][k - 1];
      if (on > 0) { g.fillStyle = radial(g, 0, 7, 0, 18, [[0, `rgba(255,210,130,${0.45 * on})`], [1, 'rgba(255,210,130,0)']]); g.fill(circ(0, 7, 18)); }
      ink(g, ell(0, 7, 4.6, 6), on > 0.5 ? F.mix(col, '#fff2c0', 0.5) : col, 0.9);
      g.strokeStyle = 'rgba(60,30,40,0.4)'; g.lineWidth = 0.5; g.beginPath(); g.moveTo(-4, 5); g.lineTo(4, 5); g.moveTo(-4, 9); g.lineTo(4, 9); g.stroke();
      g.fillStyle = LINE; g.fillRect(-2, 0.5, 4, 1.5); g.fillRect(-1.5, 12.5, 3, 1.4);
      g.restore();
    }
  },
});

// book: pages escape from the top window
snailLayer(book, F.zOf(book.y), {
  layer: { onEnter() { for (let i = 0; i < 6; i++) setTimeout(() => F.spawn({ kind: 'page', x: book.x + book.topWin[0] * book.S, y: book.y + book.topWin[1] * book.S, vx: 20 + Math.random() * 30, vy: -20 - Math.random() * 20, life: 5, size: 1, rot: Math.random() * 3, vr: 2 }), i * 140); } },
  tick(dt, t) { book.basketA = Math.sin(t * 0.9) * 0.1 + D.wind(t, book.x) * 0.05; },
  front(g, t) {
    // the hoist's basket of books swinging on its rope
    const [hx, hy] = book.hoist, a = book.basketA || 0;
    g.save(); g.translate(hx, hy); g.rotate(a);
    g.strokeStyle = LINE; g.lineWidth = 0.9; g.beginPath(); g.moveTo(0, 0); g.lineTo(-6, 22); g.moveTo(0, 0); g.lineTo(6, 22); g.stroke();
    ink(g, poly([[-9, 22], [9, 22], [7, 34], [-7, 34]]), '#c99a5a', 1.1);
    for (let k = 0; k < 4; k++) ink(g, poly([[-7 + k * 3.6, 22], [-7 + k * 3.6, 16 + (k % 2) * 2], [-4 + k * 3.6, 16 + (k % 2) * 2], [-4 + k * 3.6, 22]]), ['#a34a3e', '#3f6a8a', '#d6a44a', '#5d7b4a'][k], 0.5);
    g.restore();
  },
});

// fish: the shutter pops up and the catch of the day is held up; two gulls come in
const fish_ = { up: 0, gullPull: 0 };
snailLayer(fish, F.zOf(fish.y), {
  layer: { onEnter() { const gs = F.gulls.slice(0, 2); for (const q of gs) { q.dvx += (fish.x - q.x) * 0.8; q.dvy += (fish.y - 200 - q.y) * 0.8; } } },
  tick(dt, t, L) { fish_.up = ease(fish_.up, L.hovered ? 1 : 0, L.hovered ? 5 : 1.5, dt); },
  front(g, t) {
    const [sx, sy] = fish.shop;
    // shutter flips up; the fishmonger leans out with a fish held high
    if (fish_.up > 0.02) {
      F.folk(g, sx + 6, sy + 18, { sp: 'otter', sc: 0.9, dir: 1, coat: '#f4efe6', cloth: 'apron', acc: '#3f6aa1', t, armR: lerp(0, -2.8, fish_.up), armL: 0.6, mouth: fish_.up * 0.7,
        hold: (g, hand, back, line) => { if (fish_.up > 0.3) { g.save(); g.translate(hand[0], hand[1]); g.rotate(-1.4 + Math.sin(t * 6) * 0.2); ink(g, ell(0, -8, 3.4, 9), '#b9c3c8', 0.9); ink(g, poly([[0, -17], [-3, -21], [3, -21]]), '#9aa6ae', 0.8); g.fillStyle = line; g.fill(circ(1, -1, 0.8)); g.restore(); } } });
    }
    const sh = poly([[sx - 34, sy - 22], [sx + 34, sy - 22], [sx + 34, sy - 22 + 40 * (1 - fish_.up)], [sx - 34, sy - 22 + 40 * (1 - fish_.up)]]);
    ink(g, sh, '#7a9cae', 1.2);
    g.fillStyle = '#5f8296'; for (let k = 0; k < 4; k++) g.fillRect(sx - 34, sy - 20 + k * 10 * (1 - fish_.up), 68, 1.5 * (1 - fish_.up) + 0.2);
  },
});

// young: wriggles, kids cheer
const kids = [{ sp: 'vole', coat: '#f2c95c', acc: '#d65a4a', dx: -16 }, { sp: 'hare', coat: '#4f8fa3', acc: null, dx: 0 }, { sp: 'mole', coat: '#e07f62', acc: '#6f9d58', dx: 15 }].map((k, i) => Object.assign(k, { blink: F.blinker(90 + i), act: F.actor(95 + i, [['look', 2], ['wave', 1.5]], [2, 5]) }));
const young_ = { cheer: 0, wig: 0 };
snailLayer(young, F.zOf(young.y), {
  layer: { onEnter() { young_.wig = 1; } },
  tick(dt, t, L) {
    young_.cheer = ease(young_.cheer, L.hovered ? 1 : 0, L.hovered ? 6 : 2, dt);
    young_.wig = Math.max(0, young_.wig - dt * 0.8);
    young.nod = Math.sin(t * 9) * young_.wig * 0.5;
    for (const k of kids) { k.blink.step(dt); k.act.step(dt); }
  },
  front(g, t) {
    const [bx, by] = young.basket, bob = Math.sin(t * 9) * young_.wig * 2;
    kids.forEach((k, i) => {
      const ch = young_.cheer * (0.7 + 0.3 * Math.sin(t * 7 + i * 2)), wave = k.act.b('wave');
      F.folk(g, bx + k.dx, by + 12 + bob, { sp: k.sp, sc: 0.62, dir: i === 2 ? -1 : 1, coat: k.coat, acc: k.acc, cloth: 'tunic', t, blink: k.blink.v, happy: ch > 0.5,
        armR: -0.3 - ch * 2.6 - wave * 2.2 + Math.sin(t * 10 + i) * wave * 0.4, armL: 0.2 - ch * 2.4, mouth: ch, bob: -ch * 3, look: [k.act.b('look') * k.act.side, 0],
        hat: i === 1 ? F.HATS.knit('#d65a4a') : null });
    });
    // the pennant
    const [px, py] = young.pole, w = D.wind(t, young.x);
    g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.moveTo(px, py + 6); g.quadraticCurveTo(px + 2, py - 20, px + 4 + w * 3, py - 40); g.stroke();
    const tip = [px + 4 + w * 3, py - 40];
    ink(g, poly([tip, [tip[0] + 18 + w * 4, tip[1] + 3 + Math.sin(t * 8) * 2], [tip[0], tip[1] + 8]]), '#f2c95c', 0.9);
  },
});

// sleep: no head out; a door that cracks open when you look, and z's rising when you don't
layer({
  id: 'sleep', z: F.zOf(sleep.y),
  hit(x, y) { const S = sleep.S; return Math.hypot((x - sleep.x) / S - sleep.gl.cx, (y - sleep.y) / S - sleep.gl.cy) < sleep.gl.R * 1.05; },
  update(dt, t, L) {
    sleep.peek = ease(sleep.peek, L.hovered && L.since > 0.25 ? 1 : 0, L.hovered ? 3 : 1.2, dt);
    sleep.zT += dt;
    if (sleep.peek < 0.1 && sleep.zT > 1.4) { sleep.zT = 0; const S = sleep.S; F.spawn({ kind: 'z', x: sleep.x + sleep.door[0] * S, y: sleep.y + (sleep.door[1] - sleep.door[3]) * S, vx: 6, vy: -14, life: 2.6, size: 0.9 }); }
  },
  draw(g, t) {
    const S = sleep.S;
    blit(g, sleep.shell, 0, Math.sin(t * 0.5) * 0.6);
    g.save(); g.translate(sleep.x, sleep.y); g.scale(S, S);
    const [ox, oy, rx, ry] = sleep.door, p = sleep.peek;
    g.fillStyle = '#20141f'; g.fill(ell(ox, oy, rx, ry));
    if (p > 0.05) {
      for (const k of [-1, 1]) { g.fillStyle = '#fff6e0'; g.fill(ell(ox - rx * 0.35 + k * rx * 0.22, oy - ry * 0.2, rx * 0.12, rx * 0.14 * p)); g.fillStyle = '#20141f'; g.fill(circ(ox - rx * 0.32 + k * rx * 0.22, oy - ry * 0.18, rx * 0.06 * p)); }
    }
    // the door swings open on its hinge at the right
    g.save(); g.translate(ox + rx, oy); g.scale(1 - p * 0.55, 1); g.translate(-(ox + rx), -oy);
    ink(g, ell(ox, oy, rx, ry), '#8a5d4a', 1.4);
    g.strokeStyle = 'rgba(60,30,40,0.4)'; g.lineWidth = 1; for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(ox + k * rx * 0.45, oy - ry * 0.85); g.lineTo(ox + k * rx * 0.45, oy + ry * 0.85); g.stroke(); }
    g.fillStyle = '#e8c56a'; g.fill(circ(ox - rx * 0.6, oy, 2));
    g.restore();
    g.restore();
  },
});
})();
