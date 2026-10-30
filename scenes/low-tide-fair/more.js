/* more.js — the rest of the afternoon, in the corners of the flats.

   race     the snail race: three racing snails with vole jockeys, a rope finish line, a mole judge
            and a knot of punters. They creep. Hover: the punters roar, the snails surge (as much
            as snails surge), and the judge waves the flag; linger and one of them wins by a head.
   clams    two moles digging for clams. Hover: up comes a clam that squirts the digger in the face.
   puddle   two small hares in boots jumping in a puddle. Hover: they jump together, big splash.
   near     tufts of sea-rocket and eelgrass along the very front edge (z45), swaying. */
(() => {
const D = Drawn, F = Fair;
const { TAU, clamp, lerp, ease, rng, circ, ell, poly, curve, ink, grad, st, P, layer, onLayout, sprite, blit } = D;
const { pxu, flat } = F;
const LINE = F.LINE;

// ============================================================ the snail race
const RACE = { x0: 1840, x1: 2130, y: 790, surge: 0, cheer: 0, won: -1, wonT: 0 };
const racerShells = [
  { lit: '#fff0dc', base: '#f2c27a', shade: '#bf8a76', bounce: '#f0b18f', band: '#c0623f', band2: '#8a4752', growth: '#a98272' },
  { lit: '#f2f4ec', base: '#bcd3c6', shade: '#8696a8', bounce: '#d8b8a2', band: '#3f6a8a', band2: '#5a7b8c', growth: '#7d8a90' },
  { lit: '#ffeaea', base: '#eab0b0', shade: '#a77a92', bounce: '#f0b8a0', band: '#a8445a', band2: '#7a4a6a', growth: '#a07080' },
];
const racers = racerShells.map((pal, i) => {
  const y = RACE.y + i * 26 - 26;
  const sn = F.makeSnail({ id: 'racer' + i, x: RACE.x0 + 40 + i * 14, y, dir: 1, k: 1, L: 70, skin: ['tea', 'book', 'young'][i], seed: 600 + i * 7 });
  sn.gl = F.globe({ x: -4, y: -6, R: 17, turns: 2.6, apex: [-2, -2], spin: 0.4 + i, lw: 1.4 });
  sn.pal = Object.assign({ line: LINE }, pal);
  sn.pos = [0.32, 0.18, 0.4][i]; sn.sp = 0.0026 + i * 0.0004;
  sn.jockey = F.makeFolk({ sp: ['vole', 'shrew', 'mole'][i], coat: ['#d65a4a', '#3f6aa1', '#f2c95c'][i], dir: 1, k: 0.55, acc: '#f4efe6' });
  sn.num = i + 1;
  return sn;
});
onLayout(() => {
  for (const sn of racers) {
    const S = sn.S;
    // the shell sprite is built at the start line and slid along the track
    sn.x = RACE.x0;
    sn.spr = sprite(sn.x - 30 * S, sn.y - 50 * S, 60 * S, 52 * S, (g) => { g.translate(sn.x, sn.y); g.scale(S, S); F.paintGlobe(g, sn.gl, sn.pal, sn.seed); });
  }
});
const punters = [
  F.makeFolk({ sp: 'otter', x: 1880, y: 848, coat: '#e7a43c', dir: 1 }), F.makeFolk({ sp: 'hare', x: 1950, y: 852, coat: '#6f9d58', dir: 1, hat: F.HATS.cap('#d65a4a') }),
  F.makeFolk({ sp: 'mole', x: 2030, y: 846, coat: '#a8689b', dir: -1 }), F.makeFolk({ sp: 'vole', x: 2090, y: 856, coat: '#efe2c8', dir: -1, k: 0.8 }),
  F.makeFolk({ sp: 'shrew', x: 1930, y: 744, coat: '#4f8fa3', dir: 1, k: 0.9 }), F.makeFolk({ sp: 'otter', x: 2010, y: 740, coat: '#d65a4a', dir: -1, k: 1.05 }),
];
const judge = F.makeFolk({ sp: 'mole', x: 2165, y: 800, coat: '#3b2433', acc: '#f4efe6', dir: -1, hat: F.HATS.straw('#e8c97a') });
layer({
  id: 'race', z: F.zOf(RACE.y + 20),
  hit: (x, y) => x > RACE.x0 - 40 && x < RACE.x1 + 60 && y > RACE.y - 60 && y < RACE.y + 60,
  update(dt, t, L) {
    RACE.surge = ease(RACE.surge, L.hovered ? 1 : 0, L.hovered ? 2 : 0.8, dt);
    RACE.cheer = ease(RACE.cheer, L.hovered ? 1 : 0, 4, dt);
    for (const [i, sn] of racers.entries()) {
      sn.pos += dt * (sn.sp * (1 + Math.sin(t * 0.3 + i * 2) * 0.4) + RACE.surge * (0.012 + i * 0.002 + Math.sin(t * 1.3 + i) * 0.004));
      if (sn.pos >= 1) { if (RACE.won < 0) { RACE.won = i; RACE.wonT = 0; F.spawn({ kind: 'word', text: 'by a head!', x: RACE.x1, y: RACE.y - 90, vy: -12, life: 2, size: 1 }); } sn.pos = 1; }
      F.stepStalks(sn, dt, t);
      F.stepFolk(sn.jockey, dt);
    }
    if (RACE.won >= 0 && (RACE.wonT += dt) > 5) { RACE.won = -1; racers.forEach((sn, i) => (sn.pos = [0.12, 0.05, 0.15][i])); }
    for (const p of punters) F.stepFolk(p, dt);
    F.stepFolk(judge, dt);
    if (RACE.cheer > 0.5 && Math.random() < dt * 3) F.spawn({ kind: 'word', text: ['go on!', 'come on, Shelly!', 'go!', 'faster!'][Math.floor(Math.random() * 4)], x: 1880 + Math.random() * 220, y: 780, vy: -16, life: 1.3, size: 0.75 });
  },
  draw(g, t) {
    const s = pxu(RACE.y);
    // the lanes: three grooves smoothed in the sand, chalked start and finish
    for (let i = 0; i < 3; i++) { const y = RACE.y + i * 26 - 26; g.strokeStyle = 'rgba(150,118,120,0.35)'; g.lineWidth = 3 * s; g.beginPath(); g.moveTo(RACE.x0 - 20, y + 4 * s); g.lineTo(RACE.x1 + 30, y + 4 * s); g.stroke(); }
    g.strokeStyle = 'rgba(255,250,236,0.8)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(RACE.x0 + 10, RACE.y - 30); g.lineTo(RACE.x0 - 4, RACE.y + 18); g.stroke();
    // finish posts with a rope of little flags
    const fa = [RACE.x1 + 22, RACE.y - 32], fb = [RACE.x1 + 6, RACE.y + 28];
    for (const [x, y] of [fa, fb]) { F.castShadow(g, x, y, (g) => g.fillRect(-1, -26 * s, 2, 26 * s), 0.4); F.post(g, x, y - 26 * s, y, 2.4 * s, F.PAL.drift, 1); }
    F.bunting(g, [fa[0], fa[1] - 26 * s], [fb[0], fb[1] - 26 * s], { n: 5, sag: 6, sc: s * 0.8, cols: ['#f4efe6', '#3b2433'] }, t);
    // punters behind the far lane
    for (const p of punters.filter((p) => p.y < RACE.y)) drawPunter(g, p, t);
    for (const [i, sn] of racers.entries()) {
      const S = sn.S, x = lerp(RACE.x0, RACE.x1, sn.pos);
      const dx = x - RACE.x0;
      sn.x = x;
      F.castShadow(g, x, sn.y, (g) => g.fill(ell(-4 * S, -26 * S, 18 * S, 20 * S)), 0.45);
      F.contact(g, x, sn.y, 40 * S, 0.6);
      g.save(); g.translate(x, sn.y); g.scale(S, S); F.drawFoot(g, sn, t * (1 + RACE.surge)); g.restore();
      blit(g, sn.spr, dx, Math.sin(t * 2 + i) * 0.4);
      g.save(); g.translate(x, sn.y); g.scale(S, S); F.drawHead(g, sn, t); g.restore();
      // a number on a little pennant stuck in the shell, and the jockey in the saddle
      const jx = x - 4 * S, jy = sn.y + (sn.gl.cy - sn.gl.R * 0.92) * S;
      F.drawFolk(g, sn.jockey, t, { x: jx, y: jy, noShadow: true, crouch: 0.6, lean: 0.25 + RACE.surge * 0.2, armR: -1.3 - RACE.surge * Math.abs(Math.sin(t * 9 + i)) * 0.8, armL: -1.0, happy: RACE.won === i, mouth: RACE.surge * 0.6 });
      g.fillStyle = '#f4efe6'; g.font = `700 ${Math.round(8 * S)}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
      ink(g, circ(x - 16 * S, sn.y - 20 * S, 5 * S), ['#d65a4a', '#3f6aa1', '#c9a33a'][i], 0.9);
      g.fillStyle = '#fff8ea'; g.fillText(String(sn.num), x - 16 * S, sn.y - 19.6 * S);
    }
    for (const p of punters.filter((p) => p.y >= RACE.y)) drawPunter(g, p, t);
    // the judge, flag in hand, waving it when it's close
    const wave = Math.max(RACE.surge, RACE.won >= 0 ? 1 : 0);
    F.drawFolk(g, judge, t, { armR: -2.4 + Math.sin(t * 10) * 0.5 * wave, look: [1, 0],
      hold: (g, hand, b, line, lw) => {
        g.strokeStyle = line; g.lineWidth = lw * 0.8; g.beginPath(); g.moveTo(hand[0], hand[1] + 2); g.lineTo(hand[0], hand[1] - 13); g.stroke();
        const fl = Math.sin(t * 8) * (0.4 + wave);
        g.save(); g.translate(hand[0], hand[1] - 13); g.rotate(fl * 0.3);
        const p = poly([[0, 0], [10, 1], [10, 7], [0, 6]]); ink(g, p, '#f4efe6', lw * 0.6, line);
        g.save(); g.clip(p); g.fillStyle = '#3b2433'; for (let k = 0; k < 3; k++) for (let j = 0; j < 2; j++) if ((k + j) % 2) g.fillRect(k * 3.4, j * 3.5, 3.4, 3.5); g.restore();
        g.restore();
      } });
  },
});
function drawPunter(g, p, t) {
  const c = RACE.cheer, jump = c * Math.max(0, Math.sin(t * 8 + p.ph)) * 3;
  F.drawFolk(g, p, t, c > 0.1 ? { bob: -jump, armR: -2.5 + Math.sin(t * 9 + p.ph) * 0.4, armL: -2.0, happy: true, mouth: 0.7, look: [p.dir, 0] } : { look: [0.8 * p.dir, 0] });
}

// ============================================================ the clam diggers
const clams = { diggers: [F.makeFolk({ sp: 'mole', x: 520, y: 702, coat: '#6f9d58', dir: 1, hat: F.HATS.knit('#e07f62') }), F.makeFolk({ sp: 'mole', x: 610, y: 716, coat: '#e7a43c', dir: -1 })], squirt: 0, up: 0 };
layer({
  id: 'clamdig', z: F.zOf(716),
  hit: (x, y) => x > 470 && x < 660 && y > 650 && y < 730,
  onEnter() { clams.squirt = 1.4; },
  update(dt, t, L) { clams.squirt = Math.max(0, clams.squirt - dt); clams.up = ease(clams.up, L.hovered ? 1 : 0, 3, dt); for (const d of clams.diggers) F.stepFolk(d, dt); },
  draw(g, t) {
    // a dug-out hollow with a heap of sand beside it, a bucket half full of clams
    for (const [x, y] of [[548, 704], [632, 718]]) {
      const s = pxu(y);
      g.fillStyle = 'rgba(120,90,100,0.55)'; g.fill(ell(x, y, 12 * s, 3.5 * s));
      ink(g, curve([[x + 10 * s, y - 1], [x + 16 * s, y - 6 * s], [x + 24 * s, y - 5 * s], [x + 28 * s, y]]), '#cfa577', 0.9);
      g.fillStyle = '#ecc99a'; g.fill(ell(x + 16 * s, y - 4.5 * s, 4 * s, 1.4 * s));
    }
    const bs = pxu(712), bx = 575, by = 712;
    F.contact(g, bx, by, 7 * bs, 0.5);
    ink(g, poly([[bx - 6 * bs, by - 10 * bs], [bx + 6 * bs, by - 10 * bs], [bx + 5 * bs, by], [bx - 5 * bs, by]]), '#7a9cae', 1);
    for (let k = 0; k < 4; k++) ink(g, ell(bx - 3.6 * bs + k * 2.4 * bs, by - 10.5 * bs, 1.6 * bs, 1.1 * bs), '#e9d9c3', 0.6);
    clams.diggers.forEach((d, i) => {
      const dig = Math.sin(t * 2.6 + i * 1.7), sq = i === 0 ? clams.squirt : 0;
      const spade = (g, hand, back, line, lw) => {
        g.strokeStyle = line; g.lineWidth = lw * 0.9; g.beginPath(); g.moveTo(back[0], back[1]); g.lineTo(hand[0] + 6, hand[1] + 10); g.stroke();
        g.strokeStyle = '#a77a58'; g.lineWidth = lw * 0.5; g.stroke();
        ink(g, poly([[hand[0] + 4, hand[1] + 9], [hand[0] + 9, hand[1] + 10], [hand[0] + 8, hand[1] + 15], [hand[0] + 4, hand[1] + 13]]), '#9fb0bf', lw * 0.6, line);
        if (i === 0 && clams.up > 0.3) ink(g, ell(hand[0] - 2, hand[1] - 3, 2.4, 1.6), '#e9d9c3', lw * 0.6, line);
      };
      F.drawFolk(g, d, t, { crouch: 0.5 + dig * 0.3, lean: 0.25 + dig * 0.12, armR: 0.3 + dig * 0.4, armL: 0.1 + dig * 0.3, hold: spade, happy: sq > 0.8, mouth: sq > 0 ? 0.8 : 0, blink: sq > 0 ? 0 : undefined, head: sq > 0 ? -0.6 : 0 });
      if (sq > 1.2 && Math.random() < 0.6) { const s = pxu(d.y); F.spawn({ kind: 'drop', x: d.x + 10 * s, y: d.y - 4 * s, vx: -30 - Math.random() * 30, vy: -90 - Math.random() * 40, g: 300, life: 0.6, size: s * 0.8 }); }
    });
  },
});

// ============================================================ the puddle jumpers
const puddle = { x: 290, y: 652, kids: [F.makeFolk({ sp: 'hare', coat: '#f2c95c', dir: 1, k: 0.7 }), F.makeFolk({ sp: 'hare', coat: '#d65a4a', acc: '#4f8fa3', dir: -1, k: 0.66 })], big: 0 };
layer({
  id: 'puddle', z: F.zOf(puddle.y + 4),
  hit: (x, y) => Math.abs(x - puddle.x) < 70 && y > puddle.y - 40 && y < puddle.y + 16,
  onEnter() { puddle.big = 1; },
  update(dt, t) { puddle.big = Math.max(0, puddle.big - dt * 0.8); for (const k of puddle.kids) F.stepFolk(k, dt); },
  draw(g, t) {
    const s = pxu(puddle.y);
    puddle.kids.forEach((k, i) => {
      const together = puddle.big > 0;
      const ph = together ? t * 4.2 : t * 3.1 + i * 1.6;
      const j = Math.abs(Math.sin(ph)), land = Math.sin(ph) < 0.15 && Math.cos(ph) > 0;
      const x = puddle.x + (i ? 22 : -24) * s, y = puddle.y + (i ? 2 : -2) * s;
      if (land && Math.random() < 0.5) for (let q = 0; q < (together ? 6 : 2); q++) F.spawn({ kind: 'drop', x: x + (Math.random() - 0.5) * 10 * s, y, vx: (Math.random() - 0.5) * 60, vy: -40 - Math.random() * 50 * (together ? 1.6 : 1), g: 240, life: 0.6, size: s });
      // boots: two little red wellies, drawn as part of the legs by tinting the feet
      F.drawFolk(g, k, t, { x, y, bob: -j * 9, armR: -1.6 - j, armL: -1.2 - j, happy: true, mouth: j * 0.6, crouch: (1 - j) * 0.6 });
      g.fillStyle = '#d65a4a'; g.fill(ell(x - 2 * s * k.k, y - 1.2 * s - j * 9 * s * k.k, 2.6 * s * k.k, 1.6 * s * k.k)); g.fill(ell(x + 3 * s * k.k, y - 1.2 * s - j * 9 * s * k.k, 2.6 * s * k.k, 1.6 * s * k.k));
      g.strokeStyle = `rgba(255,255,250,${0.6 * (1 - j)})`; g.lineWidth = 1; g.beginPath(); g.ellipse(x, y, (6 + (1 - j) * 10) * s, (1.4 + (1 - j) * 2) * s, 0, 0, TAU); g.stroke();
    });
  },
});

// ============================================================ the near edge: tufts of eelgrass and sea-rocket, swaying
const tufts = [];
{
  const r = rng(909);
  for (const [x, y, k] of [[360, 1128, 2.0], [430, 1120, 1.3], [1210, 1134, 2.3], [1290, 1126, 1.4], [1800, 1130, 1.8]]) {
    const blades = [];
    for (let i = 0; i < 22; i++) blades.push({ a: -Math.PI / 2 + (r() - 0.5) * 1.1, L: (30 + r() * 46) * k, w: (2 + r() * 2.5) * k, c: ['#6f7f45', '#879055', '#5d6b3e', '#a3a05a'][Math.floor(r() * 4)], ph: r() * TAU });
    tufts.push({ x, y, k, blades, flowers: r() < 0.6 });
  }
}
layer({
  id: 'near', z: 45,
  hit(x, y) { for (const tf of tufts) if (Math.abs(x - tf.x) < 30 * tf.k && y > tf.y - 70 * tf.k && y < tf.y + 10) return (this.which = tf), true; return false; },
  onEnter(L) { if (L.which) L.which.kick = 1; },
  update(dt) { for (const tf of tufts) tf.kick = Math.max(0, (tf.kick || 0) - dt * 0.8); },
  draw(g, t) {
    for (const tf of tufts) {
      // a low hummock of drier sand the tuft has caught
      const hk = curve([[tf.x - 40 * tf.k, tf.y + 8], [tf.x - 22 * tf.k, tf.y - 4 * tf.k], [tf.x + 6 * tf.k, tf.y - 7 * tf.k], [tf.x + 34 * tf.k, tf.y - 1 * tf.k], [tf.x + 48 * tf.k, tf.y + 9]], false);
      g.fillStyle = '#bd8a5c'; g.fill(hk);
      g.fillStyle = 'rgba(255,226,186,0.55)'; g.fill(curve([[tf.x - 36 * tf.k, tf.y + 4], [tf.x - 20 * tf.k, tf.y - 3 * tf.k], [tf.x - 2 * tf.k, tf.y - 5 * tf.k], [tf.x - 6 * tf.k, tf.y + 2]], false));
      F.castShadow(g, tf.x, tf.y, (g) => g.fill(ell(0, -22 * tf.k, 10 * tf.k, 22 * tf.k)), 0.4);
      const w = D.wind(t, tf.x);
      for (const b of tf.blades) {
        const sway = Math.sin(t * 1.4 + b.ph) * 0.08 + w * 0.12 + (tf.kick || 0) * Math.sin(t * 12 + b.ph) * 0.3;
        const a = b.a + sway, ex = tf.x + Math.cos(a) * b.L, ey = tf.y + Math.sin(a) * b.L;
        const mx = tf.x + Math.cos(b.a + sway * 0.4) * b.L * 0.5, my = tf.y + Math.sin(b.a + sway * 0.4) * b.L * 0.5;
        const p = new Path2D(); p.moveTo(tf.x - b.w / 2, tf.y); p.quadraticCurveTo(mx - b.w * 0.3, my, ex, ey); p.quadraticCurveTo(mx + b.w * 0.3, my, tf.x + b.w / 2, tf.y); p.closePath();
        ink(g, p, b.c, 1.2);
      }
      if (tf.flowers) for (let i = 0; i < 4; i++) { const b = tf.blades[i], sway = Math.sin(t * 1.4 + b.ph) * 0.08 + w * 0.12, a = b.a + sway; ink(g, circ(tf.x + Math.cos(a) * b.L * 0.85, tf.y + Math.sin(a) * b.L * 0.85, 2.4 * tf.k), '#e9b6d6', 0.8); }
    }
  },
});
})();
