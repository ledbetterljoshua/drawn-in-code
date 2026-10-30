/* front.js — the edges of the fair and the foreground that frames it.

   heron    wading at the far end of the creek, where the tide comes in. Hover: it strikes and
            comes up with a fish; linger: it tips its head back and swallows.
   bellpost the tide post, a striped pole with a bell and a puffin on watch. Hover: the puffin rings
            it and every folk on the flats turns to look at the sea.
   seal     asleep on a sandbar. Hover: one eye opens and a flipper waves; linger: it rolls onto
            its back, belly to the sun.
   hermits  hermit crabs queued by size beside a big empty whelk, the way they do. Hover: the
            biggest moves into the whelk, and every crab behind it trades up one shell.
   rock     the dark barnacled rock in the near left corner with a pool in its lap. Hover the pool:
            the anemones pull in; the starfish lifts an arm.
   clams    razor clams in the near sand. Hover: a squirt of water.
   wrack    the bank of weed in the near right corner. */
(() => {
const D = Drawn, F = Fair;
const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, ink, grad, radial, lumps, st, P, layer } = D;
const { HZ, pxu, flat } = F;
const LINE = F.LINE;

// ============================================================ the heron
const heron = { x: 2010, y: 470, strike: 0, gulp: 0, blink: F.blinker(201), act: F.actor(202, [['step', 3], ['look', 2]], [3, 8]), fish: 0 };
layer({
  id: 'heron', z: F.zOf(heron.y),
  hit: (x, y) => Math.abs(x - heron.x) < 40 && y > heron.y - 110 && y < heron.y + 8,
  onEnter() { heron.strike = 1; },
  update(dt, t, L) {
    heron.blink.step(dt); heron.act.step(dt);
    heron.strike = Math.max(0, heron.strike - dt * 0.8);
    heron.fish = heron.strike > 0.2 && heron.strike < 0.7 ? 1 : L.hovered && L.since > 0.6 && L.since < 2.6 ? 1 : 0;
    heron.gulp = ease(heron.gulp, L.hovered && L.since > 1.4 ? 1 : 0, 2, dt);
  },
  draw(g, t) {
    const s = pxu(heron.y) * 1.25, x = heron.x, y = heron.y, hz = F.far(y) * 0.6;
    const grey = F.mix('#9aa0b4', F.HAZE, hz), dark = F.mix('#5b5f78', F.HAZE, hz), lit = F.mix('#d7d6dc', F.HAZE, hz), wht = F.mix('#f3eee8', F.HAZE, hz), line = F.inkAt(hz);
    const sk = heron.strike, st_ = Math.sin(clamp(sk, 0, 1) * Math.PI);
    g.save(); g.translate(x, y); g.scale(s * -1, s);
    // reflection in the water it stands in
    g.save(); g.scale(1, -0.6); g.globalAlpha = 0.25; g.fillStyle = grey; g.fill(ell(0, 40, 14, 10)); g.fillRect(-2, 0, 1.5, 34); g.fillRect(3, 0, 1.5, 34); g.restore();
    const legLift = heron.act.b('step');
    g.strokeStyle = line; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-1, -40); g.lineTo(-1, 0); g.moveTo(4, -40); g.lineTo(4 + legLift * 6, -legLift * 10); g.lineTo(4 + legLift * 8, -legLift * 6); g.stroke();
    g.strokeStyle = F.mix('#c9a460', F.HAZE, hz); g.lineWidth = 1.2; g.stroke();
    // body
    const body = curve([[-16, -50], [-4, -60], [12, -58], [18, -48], [8, -40], [-8, -40], [-20, -44]]);
    ink(g, body, grey, 1.4 / s * 1.2, line);
    g.save(); g.clip(body); g.fillStyle = dark; g.fill(ell(-6, -46, 16, 6)); g.fillStyle = lit; g.fill(ell(6, -56, 10, 3)); g.restore();
    // neck: an S that straightens into a strike
    const nx = lerp(14, 34, st_), ny = lerp(-82, -40, st_) - heron.gulp * 6;
    const neck = new Path2D(); neck.moveTo(12, -56); neck.bezierCurveTo(lerp(22, 24, st_), lerp(-62, -52, st_), lerp(4, 30, st_), lerp(-72, -48, st_), nx, ny);
    g.lineCap = 'round'; g.lineWidth = 6.4; g.strokeStyle = line; g.stroke(neck); g.lineWidth = 4.2; g.strokeStyle = wht; g.stroke(neck);
    // head and beak
    g.save(); g.translate(nx, ny); g.rotate(lerp(0.1, 1.2, st_) - heron.gulp * 1.2 + heron.act.b('look') * 0.3);
    ink(g, ell(0, 0, 4.4, 3.4), wht, 1.1, line);
    g.fillStyle = dark; g.fill(poly([[-3, -2.4], [3, -2.6], [-9, -4.5], [-10, -3]]));
    ink(g, poly([[3, -0.8], [17, 0.6], [3, 1.8]]), F.mix('#e0b04a', F.HAZE, hz), 0.9, line);
    g.fillStyle = line; if (heron.blink.v > 0.3) g.fill(circ(1.5, -0.8, 0.9));
    if (heron.fish) { g.save(); g.translate(16, 1); g.rotate(0.3 + Math.sin(t * 20) * 0.3); ink(g, ell(0, 0, 4.6, 1.8), '#c9d3d8', 0.7, line); ink(g, poly([[4, 0], [7, -2], [7, 2]]), '#aab5bd', 0.6, line); g.restore(); }
    g.restore();
    g.restore();
    if (sk > 0.4 && sk < 0.5 && Math.random() < 0.5) for (let i = 0; i < 8; i++) F.spawn({ kind: 'drop', x: x - 28 * s, y: y - 4, vx: (Math.random() - 0.5) * 50, vy: -50 - Math.random() * 40, g: 240, life: 0.7, size: 0.8 });
    // rings round its legs
    g.strokeStyle = 'rgba(255,255,250,0.6)'; g.lineWidth = 0.8; const rr = (t * 0.4) % 1;
    g.beginPath(); g.ellipse(x - 2 * s, y, (5 + rr * 12) * s, (1 + rr * 2) * s, 0, 0, TAU); g.stroke();
  },
});

// ============================================================ the tide post and its puffin
const bell = { x: 1760, y: 548, p: F.pendulum({ k: 40, damp: 1.6, lean: 0.03, x: 1760 }), ring: 0, puffin: { blink: F.blinker(301), flap: 0 } };
layer({
  id: 'bellpost', z: F.zOf(bell.y),
  hit: (x, y) => Math.abs(x - bell.x) < 26 && y > bell.y - 120 && y < bell.y + 6,
  onEnter() { bell.p.v += 9 * (P.vx >= 0 ? 1 : -1); bell.ring = 1.8; D.emit('tide-bell'); F.spawn({ kind: 'word', text: 'ding!', x: bell.x + 18, y: bell.y - 120, vy: -14, life: 1.3, size: 0.9 }); },
  update(dt, t) {
    F.tickSea(dt);
    F.swing(bell.p, dt, t);
    bell.ring = Math.max(0, bell.ring - dt);
    bell.puffin.blink.step(dt);
    bell.puffin.flap = ease(bell.puffin.flap, bell.ring > 0.6 ? 1 : 0, 6, dt);
    if (bell.ring > 0 && Math.random() < dt * 3) F.spawn({ kind: 'note', x: bell.x + 16, y: bell.y - 100, vx: 12, vy: -20, life: 1.4, size: 0.8 });
  },
  draw(g, t) {
    const s = pxu(bell.y), x = bell.x, y = bell.y, h = 86 * s;
    F.castShadow(g, x, y, (g) => g.fillRect(-2 * s, -h, 4 * s, h), 0.35);
    F.contact(g, x, y, 5 * s);
    // a striped tide pole, with depth marks
    const pole = poly([[x - 2.6 * s, y], [x - 2.2 * s, y - h], [x + 2.2 * s, y - h], [x + 2.6 * s, y]]);
    ink(g, pole, '#efe6d6', 1.2);
    g.save(); g.clip(pole);
    for (let k = 0; k < 8; k++) { g.fillStyle = '#c8574a'; g.fillRect(x - 4 * s, y - h + k * h / 8, 8 * s, h / 16); }
    g.fillStyle = 'rgba(80,60,110,0.35)'; g.fillRect(x + 0.6 * s, y - h, 3 * s, h);
    g.fillStyle = 'rgba(110,130,100,0.6)'; g.fillRect(x - 4 * s, y - 14 * s, 8 * s, 14 * s); // weed and slime up to the high-water mark
    g.restore();
    // the arm and the bell
    F.plank(g, [x - 2 * s, y - h + 10 * s], [x + 18 * s, y - h + 10 * s], 2.4 * s, F.WOOD, 7, 1);
    g.save(); g.translate(x + 15 * s, y - h + 11 * s); g.rotate(bell.p.a);
    g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 2 * s); g.stroke();
    ink(g, curve([[-4 * s, 9 * s], [-3.4 * s, 4 * s], [0, 2 * s], [3.4 * s, 4 * s], [4 * s, 9 * s], [0, 9.6 * s]]), grad(g, -4 * s, 0, 4 * s, 0, ['#f8d77e', '#d9a443', '#9a6a35']), 1);
    g.restore();
    // the puffin on top, keeping watch toward the sea
    F.puffin(g, x, y - h, { sc: s * 0.95, dir: 1, blink: bell.puffin.blink.v, flap: bell.puffin.flap * Math.abs(Math.sin(t * 16)), beakOpen: bell.ring > 0.6 ? 0.8 : 0, look: [1, 0] });
  },
});

// ============================================================ the seal
const seal = { x: 2010, y: 690, eye: 0, roll: 0, wave: 0, blink: F.blinker(401), zT: 0 };
layer({
  id: 'seal', z: F.zOf(seal.y),
  hit: (x, y) => Math.abs(x - seal.x) < 70 && y > seal.y - 40 && y < seal.y + 10,
  update(dt, t, L) {
    seal.eye = ease(seal.eye, L.hovered ? 1 : 0, L.hovered ? 4 : 1.5, dt);
    seal.wave = L.hovered && L.since > 0.3 && L.since < 2 ? 1 : ease(seal.wave, 0, 2, dt);
    seal.roll = ease(seal.roll, L.hovered && L.since > 1.4 ? 1 : 0, L.hovered ? 1.2 : 0.6, dt);
    seal.blink.step(dt);
    seal.zT += dt;
    if (seal.eye < 0.2 && seal.zT > 2) { seal.zT = 0; F.spawn({ kind: 'z', x: seal.x + 34, y: seal.y - 34, vx: 5, vy: -12, life: 2.4, size: 0.8 }); }
  },
  draw(g, t) {
    const s = pxu(seal.y) * 1.1, x = seal.x, y = seal.y, br = Math.sin(t * 1.1) * 0.03 * (1 - seal.eye);
    // the sandbar it lies on
    g.fillStyle = 'rgba(232,206,170,0.9)'; g.fill(ell(x - 4 * s, y + 1 * s, 80 * s, 9 * s));
    g.fillStyle = 'rgba(255,240,214,0.6)'; g.fill(ell(x - 14 * s, y - 1 * s, 50 * s, 4 * s));
    F.castShadow(g, x, y, (g) => g.fill(ell(0, -10 * s, 46 * s, 10 * s)), 0.3);
    F.contact(g, x, y, 46 * s, 0.5);
    g.save(); g.translate(x, y); g.scale(s, s * (1 + br));
    const roll = seal.roll;
    const col = F.mix('#8d8398', '#cbb8b0', roll * 0.6), sh = '#5f5670', lt = '#c8bec6';
    const body = curve([[-48, -2], [-40, -14], [-16, -22 + roll * 4], [12, -22], [32, -16], [42, -8], [40, 0], [0, 2]]);
    ink(g, body, col, 1.6);
    g.save(); g.clip(body);
    g.fillStyle = sh; g.fill(ell(4, 2, 46, 9 - roll * 4));
    g.fillStyle = lt; g.fill(ell(-14, -18, 22, 4));
    g.fillStyle = 'rgba(70,60,90,0.35)'; for (let k = 0; k < 9; k++) g.fill(circ(-30 + k * 7, -12 + Math.sin(k * 2) * 4, 1.2));
    if (roll > 0.2) { g.fillStyle = F.rgba('#efe4da', roll); g.fill(ell(-6, -12, 26, 6 * roll)); }
    g.restore();
    // tail flippers
    ink(g, poly([[-46, -4], [-58, -12], [-56, -4], [-60, 2], [-46, 0]]), col, 1.2);
    // head and face
    g.save(); g.translate(36, -12); g.rotate(-roll * 0.5);
    ink(g, ell(0, 0, 12, 10), col, 1.4);
    g.fillStyle = lt; g.fill(ell(-3, -5, 7, 2.4));
    ink(g, ell(9, 3, 5, 3.6), '#b8aab0', 1);
    g.fillStyle = LINE; g.fill(ell(12.6, 1.6, 1.6, 1.2));
    for (const k of [-1, 0, 1]) { g.strokeStyle = 'rgba(250,244,236,0.8)'; g.lineWidth = 0.4; g.beginPath(); g.moveTo(10, 4); g.lineTo(17, 3 + k * 2); g.stroke(); }
    if (seal.eye > 0.3 && seal.blink.v > 0.3) { g.fillStyle = LINE; g.fill(ell(4, -2, 1.8, 2 * seal.eye)); g.fillStyle = '#fff'; g.fill(circ(3.6, -2.8, 0.5)); }
    else { g.strokeStyle = LINE; g.lineWidth = 1; g.beginPath(); g.moveTo(1.6, -2); g.quadraticCurveTo(4, -0.6, 6.4, -2); g.stroke(); }
    g.restore();
    // a front flipper that waves
    g.save(); g.translate(14, -6); g.rotate(-0.5 - seal.wave * (1 + Math.sin(t * 9) * 0.5) - roll * 1.2);
    ink(g, curve([[0, 0], [4, 4], [6, 12], [2, 13], [-2, 4]]), col, 1.1);
    g.restore();
    g.restore();
  },
});

// ============================================================ the hermit-crab queue
// lined up by size, smallest at the back, beside the big empty whelk at the front of the queue
const SHELLS = ['#efd9c2', '#e9c0a8', '#d9c7c8', '#f2e3c6', '#e3b8a6', '#ccd3d6', '#efcfb6', '#e6d2b0'];
const hermits = [];
{
  const n = 8;
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1);
    hermits.push({ x: lerp(1940, 1560, u) + Math.sin(i * 1.3) * 10, y: lerp(1018, 1066, u) + Math.cos(i * 2) * 4, size: lerp(1.3, 0.55, u), shell: i, col: SHELLS[i], kind: ['moon', 'whelk', 'turban', 'cup', 'cone', 'whelk', 'thimble', 'moon'][i], blink: F.blinker(500 + i), ph: i * 1.7, hop: 0, peek: 0 });
  }
}
const whelk = { x: 2070, y: 1006, size: 1.75, empty: true };
const queue = { swap: 0, done: false, back: 0 };
// each hermit has made do with something different: whelks, a moon snail, a cone, a turban, and
// for two of them, a teacup and a thimble. Aperture toward +x, sitting on the sand at (x, y)
function hermitShell(g, x, y, sz, col, kind = 'whelk') {
  const S = sz;
  g.save(); g.translate(x, y);
  if (kind === 'cup') {
    const p = curve([[-12 * S, -14 * S], [12 * S, -14 * S], [10 * S, -4 * S], [5 * S, 0], [-6 * S, 0], [-11 * S, -5 * S]]);
    ink(g, p, '#f4efe6', 1.3);
    g.save(); g.clip(p); g.fillStyle = 'rgba(80,60,110,0.25)'; g.fillRect(2 * S, -16 * S, 14 * S, 18 * S); g.fillStyle = '#4f8fa3'; g.fillRect(-14 * S, -11 * S, 28 * S, 1.6 * S); for (let k = 0; k < 4; k++) g.fill(circ(-7 * S + k * 4.5 * S, -7 * S, 1.2 * S)); g.restore();
    g.lineWidth = 2.2 * S; g.strokeStyle = LINE; g.beginPath(); g.arc(-13 * S, -8 * S, 3.4 * S, Math.PI * 0.5, Math.PI * 1.5); g.stroke(); g.lineWidth = 1.2 * S; g.strokeStyle = '#f4efe6'; g.stroke();
    ink(g, ell(0, -14 * S, 12 * S, 2.6 * S), '#5a4058', 1);
    g.restore(); return;
  }
  if (kind === 'thimble') {
    const p = poly([[-11 * S, -12 * S], [7 * S, -12 * S], [11 * S, 0], [-13 * S, 0]]);
    ink(g, p, '#c7c3cf', 1.3);
    g.save(); g.clip(p); g.fillStyle = 'rgba(70,60,100,0.35)'; g.fillRect(2 * S, -14 * S, 12 * S, 16 * S); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fillRect(-8 * S, -12 * S, 2 * S, 12 * S);
    g.fillStyle = 'rgba(70,60,100,0.4)'; for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) g.fill(circ(-9 * S + i * 3.4 * S + j, -9 * S + j * 3.4 * S, 0.6 * S)); g.restore();
    g.restore(); return;
  }
  const shapes = {
    whelk: [[-14, 0], [-15, -8], [-8, -15], [2, -16], [10, -11], [12, -3], [6, 1]],
    moon: [[-13, 0], [-14, -9], [-6, -16], [5, -15], [12, -8], [11, -1], [4, 1]],
    cone: [[-16, -1], [-8, -8], [4, -13], [12, -9], [12, -2], [4, 1]],
    turban: [[-12, 0], [-13, -7], [-9, -13], [-2, -18], [6, -14], [11, -7], [10, 0]],
  };
  const p = curve(shapes[kind].map(([a, b]) => [a * S, b * S]));
  ink(g, p, col, 1.3);
  g.save(); g.clip(p);
  g.fillStyle = grad(g, -15 * S, -14 * S, 12 * S, 0, ['#fff6e8', col, F.mix(col, '#5a4078', 0.4)]);
  g.fillRect(-16 * S, -20 * S, 30 * S, 22 * S);
  g.strokeStyle = F.mix(col, '#5a3a50', 0.45); g.lineWidth = Math.max(0.6, 0.9 * S);
  if (kind === 'cone') { for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(-12 * S + k * 5 * S, -12 * S); g.lineTo(-14 * S + k * 5 * S, 0); g.stroke(); } }
  else if (kind === 'turban') { for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-14 * S, -3 * S - k * 4 * S); g.quadraticCurveTo(0, -1 * S - k * 4.5 * S, 12 * S, -4 * S - k * 3 * S); g.stroke(); } }
  else for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(-4 * S, -7 * S, (3.5 + k * 3.8) * S, Math.PI * 0.85, Math.PI * 2.05); g.stroke(); }
  g.fillStyle = F.rgba(F.mix(col, '#a0503a', 0.5), 0.5); for (let k = 0; k < 5; k++) g.fill(ell(-10 * S + k * 4 * S, -9 * S + Math.sin(k) * 3 * S, 1.2 * S, 2.2 * S, undefined, 0.4));
  g.fillStyle = 'rgba(80,50,90,0.32)'; g.fill(ell(4 * S, -1 * S, 10 * S, 3 * S));
  g.restore();
  ink(g, ell(9 * S, -4 * S, 3.6 * S, 4.4 * S, undefined, 0.3), '#4a3346', 0.9);
  g.restore();
}
function hermitPeek(g, x, y, ps, h, t, cheer) {
  const px = x + 9 * ps, py = y - 3 * ps, bob = Math.sin(t * 2 + h.ph) * 0.6 * ps - cheer * Math.max(0, Math.sin(t * 9 + h.ph)) * 2 * ps;
  g.save(); g.translate(px, py + bob); g.scale(ps, ps);
  for (let k = 0; k < 3; k++) { g.strokeStyle = LINE; g.lineWidth = 1.3 / ps; const a = 0.4 + k * 0.4 + Math.sin(t * 3 + k + h.ph) * 0.1; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 6, Math.sin(a) * 5); g.lineTo(Math.cos(a) * 8 + 2, 3.4); g.stroke(); g.strokeStyle = '#d9785a'; g.lineWidth = 0.7 / ps; g.stroke(); }
  g.save(); g.translate(2, -2); g.rotate(-cheer * (0.8 + Math.sin(t * 10 + h.ph) * 0.4));
  ink(g, curve([[0, -1], [5, -3], [8, -1], [6, 1], [2, 1]]), '#d9644a', 0.9 / ps);
  g.restore();
  const look = P.inside ? clamp((P.x - x) / 300, -1, 1) : 0;
  for (const dx of [1.4, 3.2]) { g.strokeStyle = LINE; g.lineWidth = 0.7 / ps; g.beginPath(); g.moveTo(dx, -3); g.lineTo(dx + look * 0.8, -8); g.stroke(); g.fillStyle = LINE; if (h.blink.v > 0.3) g.fill(circ(dx + look * 0.8, -8.4, 0.9)); else g.fillRect(dx + look * 0.8 - 1, -8.6, 2, 0.5); }
  g.restore();
}
layer({
  id: 'hermits', z: F.zOf(1040),
  hit: (x, y) => x > 1520 && x < 2140 && y > 960 && y < 1085,
  onEnter() { if (queue.swap <= 0 && !queue.done) queue.swap = 0.001; },
  update(dt, t, L) {
    for (const h of hermits) h.blink.step(dt);
    if (queue.swap > 0) { queue.swap += dt / 3.2; if (queue.swap >= 1) { queue.swap = 0; queue.done = true; } }
    // once they've all traded up, a later visit just gets a cheer
    queue.back = ease(queue.back, queue.done && L.hovered ? 1 : 0, 3, dt);
  },
  draw(g, t) {
    const n = hermits.length, sw = queue.swap, done = queue.done;
    const ph = hermits.map((h, i) => (done ? 1 : sw > 0 ? clamp(sw * 1.7 - i * 0.09, 0, 1) : 0));
    const slot = (j) => (j < 0 ? { x: whelk.x, y: whelk.y, size: whelk.size, col: '#f6e3c8', kind: 'whelk' } : hermits[j]);
    // the shells stay where they lie; the crabs move. Slot j holds crab j until it leaves, then
    // crab j+1 once it arrives
    for (let j = -1; j < n; j++) {
      const p = slot(j), s = pxu(p.y) * p.size;
      F.castShadow(g, p.x, p.y, (g) => g.fill(ell(0, -8 * s, 14 * s, 8 * s)), 0.38);
      F.contact(g, p.x, p.y, 15 * s, 0.5);
      hermitShell(g, p.x, p.y, s, p.col, p.kind);
      const occ = j + 1 < n && ph[j + 1] >= 1 ? j + 1 : j >= 0 && ph[j] === 0 ? j : -1;
      if (occ >= 0) hermitPeek(g, p.x, p.y, s, hermits[occ], t, queue.back);
    }
    // the ones caught out of their shells, scuttling to the next one up
    hermits.forEach((h, i) => {
      if (!(ph[i] > 0 && ph[i] < 1)) return;
      const a = slot(i), b = slot(i - 1), k = F.smooth(ph[i]);
      const x = lerp(a.x, b.x, k), y = lerp(a.y, b.y, k), bs = pxu(y) * lerp(a.size, b.size, k) * 0.75;
      F.contact(g, x, y, 8 * bs, 0.45);
      F.crab(g, x, y - Math.sin(k * Math.PI) * 6 * bs, { sc: bs, col: '#efb09a', walk: t * 5, claw: 0.7 });
    });
    // a little scrawled sign stuck in the sand: the queue's rule
    const sx = 2128, sy = 1050, s = pxu(sy);
    F.castShadow(g, sx, sy, (g) => g.fillRect(-1 * s, -20 * s, 2 * s, 20 * s), 0.35);
    F.post(g, sx, sy - 22 * s, sy, 1.8 * s, F.PAL.drift, 1);
    ink(g, poly([[sx - 16 * s, sy - 30 * s], [sx + 16 * s, sy - 31 * s], [sx + 15 * s, sy - 19 * s], [sx - 15 * s, sy - 18 * s]]), '#ead9bc', 1);
    g.fillStyle = '#6a3a48'; g.font = `italic 700 ${Math.round(5.8 * s)}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('biggest', sx, sy - 27 * s); g.fillText('first', sx, sy - 21.5 * s);
  },
});

// ============================================================ the rock in the near left corner, and its pool
const rockPts = [[-160, 870], [-40, 862], [60, 872], [150, 900], [230, 945], [292, 1000], [318, 1060], [330, 1120], [-160, 1120]];
const pool = { x: 120, y: 965, rx: 72, ry: 18, close: 0, star: 0 };
const anemones = [[78, 960, '#d9507a'], [100, 972, '#e8865a'], [146, 958, '#c85a8a'], [168, 970, '#e06a6a'], [130, 978, '#f2a65a']];
layer({
  id: 'rock', z: 40, still: true,
  draw(g) {
    const rock = curve(rockPts, true);
    const S = F.PAL.stone;
    g.lineWidth = 5; g.strokeStyle = LINE; g.stroke(rock);
    g.fillStyle = grad(g, -100, 870, 300, 1100, [S.lit, S.base, S.shade, S.deep]); g.fill(rock);
    g.save(); g.clip(rock);
    // facets: a few big planes, lit on their sun-facing (left, top) sides
    const r = rng(8);
    const planes = [[[-160, 880], [60, 874], [100, 920], [-60, 940]], [[60, 874], [150, 902], [200, 960], [100, 920]], [[150, 902], [230, 946], [270, 1010], [200, 960]], [[-60, 940], [100, 920], [200, 960], [140, 1040], [-40, 1050]], [[200, 960], [270, 1010], [300, 1100], [140, 1040]]];
    const cols = [S.lit, S.base, S.shade, S.base, S.deep];
    planes.forEach((p, i) => { g.fillStyle = cols[i]; g.globalAlpha = 0.65; g.fill(poly(p)); });
    g.globalAlpha = 1;
    g.strokeStyle = 'rgba(40,30,60,0.5)'; g.lineWidth = 1.4;
    for (const p of planes) { g.beginPath(); g.moveTo(...p[1]); g.lineTo(...p[2]); g.stroke(); }
    // a skirt of weed and mussels round the bottom, wet and dark
    g.fillStyle = '#3c3048'; g.fill(curve([[-160, 1040], [40, 1030], [180, 1050], [300, 1080], [340, 1120], [-160, 1120]]));
    for (let i = 0; i < 60; i++) { const x = -120 + r() * 440, y = 1030 + r() * 70; if (y < 1030 + (x > 200 ? (x - 200) * 0.5 : 0)) continue; ink(g, ell(x, y, 7 + r() * 4, 3.2, undefined, (r() - 0.5) * 1.2), r() < 0.5 ? '#2e2a48' : '#46406a', 0.9); g.fillStyle = 'rgba(160,170,220,0.6)'; g.fill(ell(x - 2, y - 1, 3, 0.8)); }
    // barnacles: little volcanoes, catching the light on the left
    for (let i = 0; i < 140; i++) {
      const x = -140 + r() * 440, y = 880 + r() * 170, rr = 1.8 + r() * 3;
      if (Math.hypot((x - pool.x) / pool.rx, (y - pool.y) / pool.ry) < 1.3) continue;
      g.fillStyle = '#e8dccb'; g.fill(circ(x, y, rr)); g.fillStyle = '#8a8098'; g.fill(circ(x + rr * 0.25, y + rr * 0.1, rr * 0.45)); g.fillStyle = '#3a3048'; g.fill(circ(x + rr * 0.25, y + rr * 0.1, rr * 0.2));
    }
    // bladderwrack drooping over the top edge
    for (let i = 0; i < 9; i++) {
      const x = -100 + i * 40 + r() * 10, y = 870 + (x > 60 ? (x - 60) * 0.35 : 0);
      g.strokeStyle = '#5e6a36'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y + 18, x + 4, y + 34 + r() * 14); g.stroke();
      g.strokeStyle = '#8a8a46'; g.lineWidth = 1.6; g.stroke();
      for (let k = 0; k < 3; k++) ink(g, ell(x + 4 + k, y + 12 + k * 9, 2.6, 3.4), '#9a9248', 0.8);
    }
    g.restore();
    // the pool in its lap: clear water with the sky in it
    const pl = ell(pool.x, pool.y, pool.rx, pool.ry);
    g.lineWidth = 3; g.strokeStyle = '#2e2840'; g.stroke(pl);
    g.fillStyle = grad(g, 0, pool.y - pool.ry, 0, pool.y + pool.ry, ['#7a98b0', '#a7c2cc', '#c9d9d8']); g.fill(pl);
    g.save(); g.clip(pl); g.fillStyle = 'rgba(60,50,80,0.4)'; g.fill(ell(pool.x, pool.y - pool.ry * 0.9, pool.rx, pool.ry * 0.5)); g.restore();
  },
});
layer({
  id: 'rockpool', z: 41,
  hit: (x, y) => Math.hypot((x - pool.x) / (pool.rx + 20), (y - pool.y) / (pool.ry + 26)) < 1,
  update(dt, t, L) { pool.close = ease(pool.close, L.hovered ? 1 : 0, L.hovered ? 6 : 0.8, dt); pool.star = ease(pool.star, L.hovered && L.since > 0.5 ? 1 : 0, 2, dt); },
  draw(g, t) {
    g.save(); g.clip(ell(pool.x, pool.y, pool.rx, pool.ry + 12));
    for (const [x, y, c] of anemones) {
      const cl = pool.close * (0.8 + 0.2 * Math.sin(x)), sw = Math.sin(t * 1.4 + x) * 0.25;
      ink(g, ell(x, y + 1, 6, 3), F.mix(c, '#3b2433', 0.25), 1);
      const n = 9;
      for (let k = 0; k < n; k++) {
        const a = -Math.PI + (k / (n - 1)) * Math.PI, L = 9 * (1 - cl * 0.8);
        const ex = x + Math.cos(a + sw * 0.4) * L, ey = y - 1 + Math.sin(a) * L * 0.9 - 2;
        g.strokeStyle = LINE; g.lineWidth = 2.6; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * L * 0.5 + sw * 3, y + Math.sin(a) * L * 0.5, ex, ey); g.stroke();
        g.strokeStyle = c; g.lineWidth = 1.5; g.stroke();
      }
      ink(g, ell(x, y - 1, 3.4 * (1 - cl * 0.4), 1.8), F.mix(c, '#ffffff', 0.3), 0.8);
    }
    g.restore();
    // a starfish on the rim, slowly lifting one arm
    const sx = 196, sy = 950, a0 = t * 0.05;
    g.save(); g.translate(sx, sy); g.scale(1, 0.6);
    const arm = (k) => { const a = a0 + (k / 5) * TAU, lift = k === 1 ? pool.star * 0.6 : 0; return [Math.cos(a) * 13 * (1 - lift * 0.3), Math.sin(a) * 13 - lift * 14]; };
    const pts = [];
    for (let k = 0; k < 5; k++) { pts.push(arm(k)); const a = a0 + ((k + 0.5) / 5) * TAU; pts.push([Math.cos(a) * 5, Math.sin(a) * 5]); }
    ink(g, curve(pts), '#e8864a', 1.6);
    g.fillStyle = '#f6b07a'; for (let k = 0; k < 5; k++) { const [x, y] = arm(k); g.fill(circ(x * 0.5, y * 0.5, 1.4)); }
    g.restore();
    // water shimmer
    g.save(); g.clip(ell(pool.x, pool.y, pool.rx, pool.ry));
    for (let i = 0; i < 6; i++) { const x = pool.x - pool.rx + ((i * 37 + t * 9) % (pool.rx * 2)); g.fillStyle = 'rgba(255,255,245,0.55)'; g.fillRect(x, pool.y - pool.ry * 0.3 + (i % 3) * 6, 10 + (i % 2) * 8, 1); }
    g.restore();
  },
});

// ============================================================ the wrack bank in the near right corner
layer({
  id: 'wrack', z: 41.5, still: true,
  draw(g) {
    const v = st.view;
    const bank = curve([[1860, 1130], [1900, 1095], [1990, 1076], [2100, 1068], [2220, 1060], [v.x1 + 40, 1058], [v.x1 + 40, 1130]], true);
    g.lineWidth = 3; g.strokeStyle = LINE; g.stroke(bank);
    g.fillStyle = grad(g, 0, 1060, 0, 1120, ['#6a6a3e', '#3e3a34']); g.fill(bank);
    g.save(); g.clip(bank);
    const r = rng(19);
    for (let i = 0; i < 90; i++) {
      const x = 1860 + r() * (v.x1 - 1820), y = 1060 + r() * 70, L = 10 + r() * 22;
      g.strokeStyle = ['#8a8a46', '#5e6a36', '#9a4b44', '#a9a05a'][Math.floor(r() * 4)]; g.lineWidth = 2 + r() * 2.4; g.lineCap = 'round';
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + L * 0.5, y - 6 - r() * 6, x + L, y + (r() - 0.5) * 6); g.stroke();
    }
    for (let i = 0; i < 30; i++) ink(g, ell(1880 + r() * (v.x1 - 1840), 1072 + r() * 40, 3, 3.6), '#a9a05a', 0.9);
    g.restore();
    // a lost float and a bit of rope caught in it
    ink(g, circ(2160, 1068, 11), '#d9644a', 1.8);
    g.fillStyle = '#f4b48a'; g.fill(ell(2156, 1063, 4, 3));
    g.strokeStyle = '#c49a6a'; g.lineWidth = 2; g.beginPath(); g.moveTo(2170, 1070); g.bezierCurveTo(2200, 1080, 2190, 1100, 2230, 1096); g.stroke();
  },
});

// ============================================================ razor clams in the near sand
const clams = [[1260, 1068], [1330, 1088], [880, 1080], [470, 1092], [1460, 1086], [1050, 1060]].map(([x, y], i) => ({ x, y, squirt: 0, ph: i * 2.1 }));
layer({
  id: 'clams', z: 39,
  hit(x, y) { for (const c of clams) if (Math.hypot(x - c.x, (y - c.y) * 2) < 26) return (this.which = c), true; return false; },
  onEnter(L) { const c = L.which; if (c) { c.squirt = 1; for (let i = 0; i < 10; i++) F.spawn({ kind: 'drop', x: c.x, y: c.y - 2, vx: (Math.random() - 0.3) * 40, vy: -120 - Math.random() * 60, g: 320, life: 0.9, size: 1.3 }); } },
  update(dt) { for (const c of clams) c.squirt = Math.max(0, c.squirt - dt); },
  draw(g, t) {
    for (const c of clams) {
      const s = pxu(c.y), up = c.squirt > 0 ? 0 : 1;
      // a keyhole in the sand with two little siphons breathing
      g.fillStyle = 'rgba(110,80,90,0.55)'; g.fill(ell(c.x, c.y, 4 * s, 1.6 * s));
      const br = Math.max(0, Math.sin(t * 0.7 + c.ph)) * up;
      ink(g, ell(c.x - 1.2 * s, c.y - br * 2 * s, 1.2 * s, (0.8 + br) * s), '#d9c0aa', 0.6);
      ink(g, ell(c.x + 1.2 * s, c.y - br * 1.6 * s, 1.1 * s, (0.7 + br) * s), '#d9c0aa', 0.6);
    }
  },
});
})();

