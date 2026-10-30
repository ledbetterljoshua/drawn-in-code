/* porters.js — the night shift: brass rails bracketed across the face, rolling library ladders
   hooked over them, and the white stoat porters in red pillbox caps who ride them; their hush
   lamps (a candle behind blue paper) and the cold pools those throw on the drawers; the kettle
   that comes down on a rope from the davit on the top.

   Porters: the feather porter (focal: a goose feather under a dormouse's nose), the tag porter
   re-tying a luggage tag, the bottle porter filling a stoneware hot-water bottle from the kettle,
   the music-box porter who minds the bear cub, and the lamp porter holding a lamp up to the bats.
   Each idles on its own clock (looks round, blows on its paws, rides the ladder a little way,
   climbs a rung). When a guest yawns the nearest porter races along its rail and cranks a
   punch-card music box until the yawners settle. When the stack shudders every porter freezes.
   Hover a porter: it puts a paw to its lips — shh. Linger: it tips its cap. Hover the kettle: it
   comes down a little way and steams. z 22 pools · 23 rails · 24–29 ladders and porters. */
(() => {
const { TAU, clamp, lerp, ease, rng, noise, wind, st, P, layer, grad, radial, poly, curve, circ, ell, ink, seg, tube } = Drawn;
const C = OW.C, HZ = OW.HZ, LINE = OW.LINE, mix = OW.mix;
const bump = (u) => (u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
OW.scaleAt = (y) => lerp(0.6, 1.12, clamp((y - 460) / 780, 0, 1));
const railAt = (r, u) => { const p = OW.at(u, r.v); return [p[0], p[1]]; };

// ------------------------------------------------------------ the rails
layer({
  id: 'rails', z: 23,
  draw(g) {
    g.save(); g.translate(OW.shake.x, OW.shake.y);
    for (const r of OW.rails) {
      const pts = r.pts, s = OW.scaleAt(r.y);
      // its shadow on the cabinets just below (lamps and sky light come from above and in front)
      g.lineWidth = 6 * s; g.strokeStyle = 'rgba(10,6,18,0.35)'; g.stroke(curve(pts.map(([x, y]) => [x, y + 5 * s]), false));
      // brackets: iron arms into the rock every so often
      for (let i = 1; i < pts.length - 1; i += 4) {
        const [x, y] = pts[i];
        ink(g, poly([[x - 2 * s, y], [x + 2 * s, y], [x + 1.5 * s, y + 9 * s], [x - 1.5 * s, y + 9 * s]]), '#2e2838', 1);
        g.fillStyle = '#6a6478'; g.fill(circ(x, y + 8 * s, 1.3 * s));
      }
      const path = curve(pts, false);
      tube(g, path, C.brass.base, 3.6 * s, 1.3);
      g.lineWidth = 1.1 * s; g.strokeStyle = C.brass.lit; g.stroke(curve(pts.map(([x, y]) => [x, y - 1 * s]), false));
      // end caps
      for (const [x, y] of [pts[0], pts[pts.length - 1]]) ink(g, circ(x, y, 3.6 * s), C.brass.lit, 1.2);
      // snow along the top of the tube in places
      for (let i = 2; i < pts.length - 2; i += 5 + (i % 3)) { const [x, y] = pts[i]; ink(g, ell(x, y - 2.6 * s, (3 + (i * 7) % 5) * s, 1.4 * s), C.snow, 0.6, C.snowShade); }
    }
    g.restore();
  },
});

// ------------------------------------------------------------ the porters and their ladders
const focal = OW.focalDrawer;
focal.flip = 1;
const PORTERS = [
  { name: 'feather', rail: 2, u: focal.u1 + 0.05, rung: 0.34, face: -1, item: 'feather', lamp: 'hook' },
  { name: 'tag', rail: 3, u: 0.64, rung: 0.4, face: 1, item: 'tag', lamp: 'hook' },
  { name: 'bottle', rail: 1, u: 0.8, rung: 0.38, face: -1, item: 'bottle', lamp: 'hook' },
  { name: 'music', rail: 0, u: 0.66, rung: 0.42, face: 1, item: 'music', lamp: 'hook' },
  { name: 'lamp', rail: 3, u: 0.16, rung: 0.18, face: -1, item: 'lamp', lamp: 'hand' },
];
OW.porters = PORTERS;
for (const p of PORTERS) {
  p.home = p.u; p.target = p.u; p.v = 0; p.vel = 0; p.blink = Drawn.blinker(2, 4); p.crank = 0; p.music = 0;
  p.freeze = 0; p.shh = 0; p.tip = 0; p.glare = 0; p.act = null; p.au = 0; p.wait = 2 + Math.random() * 6;
  p.lampSw = 0; p.lampSv = 0; p.rungOff = 0; p.look = 0; p.busy = null; p.side = 1;
}
const ACTS = [['look', 2.2], ['blow', 2.4], ['ride', 3.2], ['climb', 2.6], ['yawn', 2.4]];

function ladderGeom(p) {
  const r = OW.rails[p.rail];
  const [tx, ty] = railAt(r, p.u);
  const below = OW.rails[p.rail - 1];
  const by = below ? railAt(below, p.u)[1] + 6 : OW.BASE + 4;
  const s = OW.scaleAt(ty);
  // the foot stands out from the face: nearer to us, so a touch lower and wider
  const bx = tx + (p.u - 0.5) * 10;
  return { tx, ty, bx, by, s, wt: 15 * s, wb: 18 * OW.scaleAt(by) };
}
function drawLadder(g, L) {
  const { tx, ty, bx, by, s, wt, wb } = L;
  const lw = 1.4;
  const W = { base: '#6a4a3a', lit: '#9a6e52', shade: '#3e2a26' };
  for (const side of [-1, 1]) {
    const p = poly([[tx + side * wt / 2 - 1.6 * s, ty - 4 * s], [tx + side * wt / 2 + 1.6 * s, ty - 4 * s], [bx + side * wb / 2 + 2 * s, by], [bx + side * wb / 2 - 2 * s, by]]);
    ink(g, p, side < 0 ? W.lit : W.base, lw);
  }
  const n = Math.max(4, Math.round((by - ty) / (16 * s)));
  for (let i = 1; i < n; i++) {
    const k = i / n, y = lerp(ty, by, k), x = lerp(tx, bx, k), w = lerp(wt, wb, k);
    const p = poly([[x - w / 2, y - 1.3 * s], [x + w / 2, y - 1.3 * s], [x + w / 2, y + 1.3 * s], [x - w / 2, y + 1.3 * s]]);
    ink(g, p, W.base, 1);
    g.fillStyle = C.snow; g.globalAlpha = 0.6; g.fillRect(x - w / 2 + 1, y - 1.6 * s, w * 0.5, 0.9); g.globalAlpha = 1;
  }
  // hooks over the rail, wheels at the foot
  for (const side of [-1, 1]) {
    const hx = tx + side * wt / 2;
    g.lineWidth = 2 * s; g.strokeStyle = LINE;
    g.beginPath(); g.moveTo(hx, ty - 3 * s); g.quadraticCurveTo(hx, ty - 8 * s, hx + 3 * s, ty - 6 * s); g.stroke();
    g.lineWidth = 1 * s; g.strokeStyle = C.brass.lit; g.stroke();
    ink(g, circ(bx + side * wb / 2, by - 1, 2.6 * OW.scaleAt(by)), '#3a3040', 1);
  }
}

// a white stoat in its winter coat. Feet on a rung at (x, y); o.face ±1; hands are world points.
function stoat(g, x, y, s, o) {
  const f = o.face, lw = 1.9 / s;
  const toL = ([hx, hy]) => [(hx - x) / (s * f), (hy - y) / s];
  const E = C.ermine;
  const blueSide = o.lampSide || 0;
  const fill = mix(E.base, E.blue, 0.25), shade = mix(E.shade, '#9aa6e0', 0.2);
  g.save(); g.translate(x, y); g.scale(s * f, s);
  const stiff = o.freeze;
  // tail: hangs below the rung, its tip black
  const tail = curve([[-4, -10], [-10, -6], [-13, 2 + Math.sin(o.t * 1.3) * 1.5 * (1 - stiff)], [-12, 10 + Math.sin(o.t * 1.3 + 0.6) * 2 * (1 - stiff)]], false);
  tube(g, tail, fill, 3.8, lw);
  tube(g, curve([[-13, 4 + Math.sin(o.t * 1.3) * 1.5 * (1 - stiff)], [-12, 10 + Math.sin(o.t * 1.3 + 0.6) * 2 * (1 - stiff)]], false), '#1c1418', 4.2, lw * 0.6);
  // the far arm, gripping the ladder
  const far = toL(o.grip);
  tube(g, curve([[1, -30], [far[0] * 0.5 + 1, (far[1] - 30) * 0.5 - 2], far], false), shade, 3.2, lw);
  ink(g, circ(far[0], far[1], 2.2), shade, lw * 0.8);
  // haunch, body, chest
  const bob = Math.sin(o.t * 2.1) * 0.6 * (1 - stiff);
  const body = curve([[-2, -1], [-6, -8], [-5, -18], [-2, -28 + bob], [3, -35 + bob], [8, -33 + bob], [7, -24], [5, -12], [4, -2]]);
  ink(g, body, fill, lw);
  g.save(); g.clip(body);
  g.fillStyle = shade; g.fill(ell(-6, -14, 5, 16));
  g.fillStyle = 'rgba(255,200,200,0.35)'; g.fill(ell(7, -18, 2.4, 12));
  if (blueSide) { g.fillStyle = 'rgba(150,180,255,0.45)'; g.fill(ell(blueSide * f > 0 ? 7 : -5, -24, 4, 12)); }
  g.restore();
  // hind feet on the rung
  ink(g, ell(1, 0, 3.6, 1.8), fill, lw * 0.8); ink(g, ell(5.5, -0.3, 3.2, 1.6), fill, lw * 0.8);
  // head
  const hx = 6 + (o.shh ? 0 : o.look * 1.5), hy = -40 + bob - stiff * 2;
  g.save(); g.translate(hx, hy); g.rotate(-0.08 + o.look * 0.12 - o.glare * 0.1);
  ink(g, circ(-4, -4.2, 2.4), fill, lw * 0.8); g.fillStyle = '#e8b8c0'; g.fill(circ(-4, -4.2, 1.2));
  const head = curve([[-6, 0], [-4, -4.5], [2, -5], [7, -2.2], [10.5, -0.6], [9, 1.6], [2, 3.6], [-4, 3.2]]);
  ink(g, head, fill, lw);
  g.save(); g.clip(head); g.fillStyle = shade; g.fill(ell(-3, 3.5, 6, 2.6)); g.restore();
  ink(g, circ(10.6, -0.4, 1.1), '#d87080', lw * 0.5);
  // eyes: black beads; wide when frozen, narrowed when glaring
  const bl = o.blink;
  if (stiff > 0.5) { ink(g, circ(3.5, -1.8, 1.9), '#fff', lw * 0.5); g.fillStyle = '#120c18'; g.fill(circ(3.8, -1.8, 0.9)); }
  else if (bl < 0.3) { g.lineWidth = lw * 0.8; g.strokeStyle = LINE; g.beginPath(); g.moveTo(2.4, -1.8); g.quadraticCurveTo(3.6, -1, 4.8, -1.8); g.stroke(); }
  else {
    g.fillStyle = '#120c18'; g.fill(ell(3.6, -1.8, 1.25, 1.25 * bl * (1 - o.glare * 0.5)));
    g.fillStyle = '#fff'; g.fill(circ(3.2, -2.3, 0.4));
    if (o.glare > 0.2) { g.lineWidth = lw * 0.8; g.strokeStyle = LINE; g.beginPath(); g.moveTo(2, -3.6); g.lineTo(5.2, -2.6); g.stroke(); }
  }
  g.lineWidth = 0.35; g.strokeStyle = 'rgba(40,30,50,0.6)';
  g.beginPath(); g.moveTo(9, 0.6); g.lineTo(14, -0.4); g.moveTo(9, 1.2); g.lineTo(14, 2); g.stroke();
  if (o.yawn > 0.05) ink(g, ell(8, 2, 1.4, 0.4 + o.yawn * 1.8), '#4a1c2a', lw * 0.5);
  // the red pillbox cap with its gold band and chinstrap, set at a slant
  g.save(); g.translate(0.5, -5.2 - o.capLift * 4 - stiff * 3); g.rotate(-0.22 - o.capLift * 0.3);
  const cap = poly([[-3.4, 0], [-3.1, -4.4], [3.6, -4.4], [3.9, 0]]);
  ink(g, cap, C.cap.base, lw * 0.9);
  g.fillStyle = C.cap.lit; g.fillRect(0.8, -4.2, 2.2, 4);
  g.fillStyle = C.cap.band; g.fillRect(-3.3, -1.5, 7.1, 1.3);
  ink(g, ell(0.25, -4.4, 3.4, 1), C.cap.shade, lw * 0.7);
  g.restore();
  g.lineWidth = 0.4; g.strokeStyle = C.cap.band; g.beginPath(); g.moveTo(-2.5, -5); g.quadraticCurveTo(-1, 2, 3.5, 3.2); g.stroke();
  g.restore();
  // the near arm, to whatever it's holding
  const near = toL(o.hand);
  const elbow = [lerp(4, near[0], 0.5) + 2, lerp(-30, near[1], 0.5) + 3];
  tube(g, curve([[4, -30 + bob], elbow, near], false), fill, 3.2, lw);
  ink(g, circ(near[0], near[1], 2.2), fill, lw * 0.8);
  g.restore();
}

OW.stoat = stoat;
// the things they hold, drawn in world space at the hand
function feather(g, x, y, s, t, tw) {
  // a goose feather held by the quill; its tip twitches under the dormouse's nose
  g.save(); g.translate(x, y); g.rotate(Math.PI + 0.35 + Math.sin(t * 6) * 0.05 * tw); g.scale(s, s);
  const vane = curve([[0, 0], [8, -3.4], [20, -4.4], [30, -2], [33, 0.4], [24, 2.6], [10, 2.4]]);
  ink(g, vane, '#f2f0fa', 1);
  g.strokeStyle = '#b8b4d0'; g.lineWidth = 0.5;
  for (let i = 0; i < 8; i++) { g.beginPath(); g.moveTo(6 + i * 3.4, 0); g.lineTo(9 + i * 3.4, -3.2 + Math.abs(i - 4) * 0.2); g.moveTo(6 + i * 3.4, 0); g.lineTo(9 + i * 3.4, 2.2); g.stroke(); }
  g.lineWidth = 0.9; g.strokeStyle = '#c8c0a0'; g.beginPath(); g.moveTo(-4, 0); g.lineTo(31, 0); g.stroke();
  g.restore();
}
function musicBox(g, x, y, s, crank) {
  g.save(); g.translate(x, y); g.scale(s, s);
  ink(g, Drawn.rect(-7, -5, 14, 9), '#7a4e34', 1.1);
  g.fillStyle = '#9a6a46'; g.fillRect(-7, -5, 14, 2.4);
  ink(g, Drawn.rect(-5, -3.6, 10, 1.4), C.brass.base, 0.6);
  // the punch card feeding out of the side, perforated
  ink(g, poly([[7, -2], [13 + Math.sin(crank) * 0.5, -3], [13, 1], [7, 1]]), '#efe3c8', 0.6);
  g.fillStyle = '#4a3a40'; for (let i = 0; i < 3; i++) g.fillRect(8.5 + i * 1.6, -1.8 + (i % 2), 0.7, 0.7);
  const cx = -7, cy = -1;
  const ex = cx - 3.6 * Math.cos(crank), ey = cy + 3.6 * Math.sin(crank);
  g.lineWidth = 1; g.strokeStyle = C.brass.lit; g.beginPath(); g.moveTo(cx, cy); g.lineTo(ex, ey); g.stroke();
  ink(g, circ(ex, ey, 1.1), '#c8a060', 0.5);
  g.restore();
  return [x + (-7 - 3.6 * Math.cos(crank)) * s, y + (-1 + 3.6 * Math.sin(crank)) * s];
}
function bottle(g, x, y, s) {
  g.save(); g.translate(x, y); g.scale(s, s);
  const b = curve([[-4, -6], [4, -6], [6, 0], [5, 7], [-5, 7], [-6, 0]]);
  ink(g, b, '#d8c8b0', 1);
  g.fillStyle = '#8a6a4a'; g.fillRect(-6, -1, 12, 3);
  ink(g, Drawn.rect(-1.6, -9, 3.2, 3.4), '#6a4a34', 0.8);
  g.restore();
}

const lampAt = (p, L) => p.lamp === 'hook' ? [L.tx + p.face * (L.wt / 2 + 13 * L.s), L.ty + 4 * L.s] : null;
OW.lamps = [];
const FIXED = OW.FIXED_LAMPS;
// where every lamp hangs when nobody is racing anywhere: the stack's light is baked from these
OW.homeLamps = () => PORTERS.map((p) => { const L = ladderGeom(p); return [L.tx + p.face * (L.wt / 2 + 9 * L.s), L.ty + 8 * L.s, p.item === 'feather' ? 1.3 : 0.75, p.item === 'feather' ? 135 : 88]; }).concat(FIXED.map(([x, y, a]) => [x, y + 6, a, 85]));

for (const p of PORTERS) {
  layer({
    id: 'porter-' + p.name, z: 24 + PORTERS.indexOf(p) * 0.1,
    hit(x, y) { const L = p.L; if (!L) return false; const fy = lerp(L.ty, L.by, p.rung + p.rungOff); return Math.abs(x - lerp(L.tx, L.bx, p.rung)) < 26 * L.s && y > fy - 56 * L.s && y < fy + 10 * L.s; },
    onEnter() { p.lampSv += P.vx * 0.003; },
    update(dt, t, L) {
      // freeze on the shudder; glare at the gull; shh when hovered, then tip the cap
      p.freeze = Math.max(0, p.freeze - dt * 0.55);
      p.glare = Math.max(0, p.glare - dt * 0.5);
      p.shh = ease(p.shh, L.hovered && L.since < 2.2 ? 1 : 0, 6, dt);
      p.tip = ease(p.tip, L.hovered && L.since > 1.1 ? 1 : 0, 4, dt);
      const frozen = p.freeze > 0.15;
      // idle actions on a random clock, when not racing to a yawn
      if (!p.busy && !p.act && !frozen && (p.wait -= dt) < 0) { const a = ACTS[Math.floor(Math.random() * ACTS.length)]; p.act = a[0]; p.adur = a[1]; p.au = 0; p.side = Math.random() < 0.5 ? -1 : 1; }
      if (p.act) { p.au += dt / p.adur; if (p.au >= 1) { p.act = null; p.wait = 3 + Math.random() * 7; } }
      const A = (n) => (p.act === n ? bump(p.au) : 0);
      p.look = ease(p.look, A('look') * p.side + (p.glare > 0.2 ? 1 : 0), 3, dt);
      if (p.act === 'ride' && p.au < 0.05) { const rr = OW.rails[p.rail]; p.target = clamp(p.home + p.side * 0.05, rr.u0 + 0.03, rr.u1 - 0.03); }
      if (!p.act && !p.busy) p.target = p.home;
      p.rungOff = ease(p.rungOff, A('climb') * -0.12, 3, dt);
      // race along the rail: a spring that overshoots a little, so the ladder sways when it stops
      if (!frozen) {
        const k = p.busy ? 40 : 14;
        p.vel += ((p.target - p.u) * k - p.vel * (p.busy ? 9 : 6)) * dt;
        p.u += p.vel * dt;
      }
      // the music box: crank while a yawn is near; it settles every yawner in reach
      if (p.busy) {
        const d = p.busy;
        if (Math.abs(p.u - p.target) < 0.04) {
          p.music = Math.min(1, p.music + dt * 2);
          p.crank += dt * 9;
          OW.settleNear(d.cx, d.cy, 170);
          if (Math.random() < dt * 5) OW.spawn({ kind: 'note', x: p.L.tx + p.face * 14 * p.L.s, y: lerp(p.L.ty, p.L.by, p.rung) - 30 * p.L.s, vy: -24, vx: p.face * 6, life: 2, s: p.L.s * 0.9, ph: Math.random() * 6, two: Math.random() < 0.4 });
        }
        if (d.state !== 'wake' && (p.busyT -= dt) < 0) { p.busy = null; p.music = 0; }
      }
      // the hook lamp swings on the ladder's motion and the wind
      const w = wind(t, p.L ? p.L.tx : 0) * 0.08;
      p.lampSv += (-(p.lampSw - w + p.vel * 2) * 20 - p.lampSv * 1.5) * dt; p.lampSw += p.lampSv * dt;
    },
    draw(g, t, L) {
      g.save(); g.translate(OW.shake.x, OW.shake.y);
      const G = (p.L = ladderGeom(p));
      drawLadder(g, G);
      const k = clamp(p.rung + p.rungOff, 0.05, 0.9);
      const fx = lerp(G.tx, G.bx, k), fy = lerp(G.ty, G.by, k);
      const s = OW.scaleAt(fy) * 1.6;
      const grip = [lerp(G.tx, G.bx, k - 0.18) - p.face * G.wt * 0.5, lerp(G.ty, G.by, k - 0.18)];
      let hand = [fx + p.face * 16 * s, fy - 30 * s];
      const frozen = p.freeze > 0.15;
      const yawn = p.act === 'yawn' ? bump(p.au) : 0;
      if (p.item === 'feather') {
        // tip of the feather just under the dormouse's nose
        const d = focal, f = d.front, lx = (f[0][0] + f[1][0]) / 2, ly = (f[0][1] + f[1][1]) / 2, gs = clamp((f[1][0] - f[0][0]) / 66, 0.45, 1.6);
        hand = [lx + 40 * gs, ly - 14 * gs - 3];
      }
      if (p.item === 'tag') hand = [fx + p.face * 22 * s, fy - 26 * s];
      if (p.item === 'lamp') hand = [fx + p.face * 6 * s, fy - 52 * s];
      if (p.act === 'blow') hand = [fx + p.face * 12 * s, fy - 40 * s];
      if (p.shh > 0.3) hand = [lerp(hand[0], fx + p.face * 15 * s, p.shh), lerp(hand[1], fy - 39 * s, p.shh)];
      if (frozen) hand = [fx + p.face * 4 * s, fy - 34 * s];
      // the lamp: on its hook at the ladder top, or held up high on a short pole
      const la = p.lamp === 'hook' ? lampAt(p, G) : [hand[0] + p.face * 3 * s, hand[1] - 16 * s];
      const fl = 0.82 + 0.18 * Math.sin(t * 9 + p.home * 40) * Math.sin(t * 5.3 + p.home * 11);
      p.lampPos = la; p.lampFl = fl;
      if (p.lamp === 'hook') {
        g.lineWidth = 1.2 * G.s; g.strokeStyle = '#2a2236';
        g.beginPath(); g.moveTo(G.tx + p.face * G.wt / 2, G.ty - 2 * G.s); g.lineTo(la[0], la[1] - 10 * G.s); g.stroke();
        g.save(); g.translate(la[0], la[1] - 10 * G.s); g.rotate(p.lampSw); g.translate(-la[0], -la[1] + 10 * G.s);
        OW.lampGlow(g, la[0], la[1] + 6 * G.s, 44 * G.s, 0.6 * fl);
        OW.hushLamp(g, la[0], la[1] + 6 * G.s, G.s * 1.5, fl);
        g.restore();
      }
      stoat(g, fx, fy, s, { face: p.face, t, grip, hand, blink: p.blink(t), look: p.look, capLift: p.tip, freeze: sstep(0.15, 0.4, p.freeze), shh: p.shh > 0.3, glare: p.glare, yawn, lampSide: p.face });
      // what's in the hand (drawn over the paw)
      if (!frozen && p.shh < 0.3) {
        if (p.item === 'feather') feather(g, hand[0], hand[1], s * 0.85, t, 1);
        if (p.item === 'music' || p.busy) musicBox(g, hand[0] + p.face * 3 * s, hand[1] + 4 * s, s * 0.85, p.crank);
        if (p.item === 'bottle') bottle(g, hand[0], hand[1] + 4 * s, s * 0.8);
        if (p.item === 'tag') { g.lineWidth = 0.8; g.strokeStyle = C.tag.string; g.beginPath(); g.moveTo(hand[0], hand[1]); g.quadraticCurveTo(hand[0] + 4, hand[1] + 8, hand[0] + 2, hand[1] + 14); g.stroke(); ink(g, poly([[hand[0] - 3, hand[1] + 14], [hand[0] + 6, hand[1] + 13], [hand[0] + 6, hand[1] + 18], [hand[0] - 3, hand[1] + 19]]), C.tag.base, 0.7); }
      }
      if (p.item === 'lamp') {
        g.lineWidth = 1.4 * s; g.strokeStyle = '#4a3a3a'; g.beginPath(); g.moveTo(hand[0], hand[1] + 4 * s); g.lineTo(la[0], la[1] - 8 * s); g.stroke();
        OW.lampGlow(g, la[0], la[1], 40 * s, 0.6 * fl);
        OW.hushLamp(g, la[0], la[1], s * 1.2, fl);
      }
      if (p.act === 'blow' && Math.random() < 0.08) OW.spawn({ kind: 'puff', x: fx + p.face * 14 * s, y: fy - 40 * s, vx: p.face * 8, vy: -6, life: 1.2, s: s * 0.6 });
      g.restore();
    },
  });
}

// a yawn calls the nearest porter whose rail can reach it
OW.on('yawn', (d) => {
  let best = null, bd = 1e9;
  for (const p of PORTERS) {
    if (p.freeze > 0.2) continue;
    const r = OW.rails[p.rail], dy = Math.abs(r.y - d.cy);
    if (dy > 220) continue;
    const du = Math.abs((d.u0 + d.u1) / 2 - p.u) + (p.busy ? 0.3 : 0);
    if (du + dy / 600 < bd) { bd = du + dy / 600; best = p; }
  }
  if (best) { best.busy = d; best.busyT = 2.5; const rr = OW.rails[best.rail]; best.target = clamp((d.u0 + d.u1) / 2 + (best.face > 0 ? -0.07 : 0.07), rr.u0 + 0.03, rr.u1 - 0.03); best.act = null; }
});
OW.on('shudder', () => { for (const p of PORTERS) { p.freeze = 1.6; p.busy = null; p.vel = 0; } });
OW.on('ding', () => { for (const p of PORTERS) p.glare = 1.6; });

// ------------------------------------------------------------ the lamp pools on the face
// screen-blended blue light from every lamp; where it falls on the warm lower face it goes lilac
layer({
  id: 'pools', z: 22,
  draw(g, t) {
    g.save(); g.translate(OW.shake.x, OW.shake.y);
    g.globalCompositeOperation = 'screen';
    const pools = [];
    for (const p of PORTERS) if (p.lampPos) pools.push([p.lampPos[0], p.lampPos[1] + 10, (p.item === 'feather' ? 150 : 115) * OW.scaleAt(p.lampPos[1]), (p.item === 'feather' ? 0.4 : 0.26) * p.lampFl]);
    FIXED.forEach(([x, y, a], i) => pools.push([x, y + 8, 100 * OW.scaleAt(y), a * 0.22 * (0.86 + 0.14 * Math.sin(t * 7 + i * 2) * Math.sin(t * 4.1 + i))]));
    for (const [x, y, r, a] of pools) {
      g.fillStyle = radial(g, x, y, 0, r, [[0, `rgba(120,150,255,${a})`], [0.35, `rgba(90,120,230,${a * 0.5})`], [1, 'rgba(60,80,200,0)']]);
      g.fill(ell(x, y, r, r * 0.85));
    }
    g.globalCompositeOperation = 'source-over';
    // the fixed lamps themselves, hung on brackets
    FIXED.forEach(([x, y], i) => {
      const s = OW.scaleAt(y) * 1.3, fl = 0.86 + 0.14 * Math.sin(t * 7 + i * 2) * Math.sin(t * 4.1 + i);
      g.lineWidth = 1.4 * s; g.strokeStyle = '#2a2236'; g.beginPath(); g.moveTo(x - 10 * s, y - 16 * s); g.lineTo(x, y - 16 * s); g.lineTo(x, y - 12 * s); g.stroke();
      OW.hushLamp(g, x, y - 2 * s, s, fl);
    });
    g.restore();
  },
});

// ------------------------------------------------------------ the kettle on its rope
const K = { x: 0, y: 0, drop: 0, sv: 0, sw: 0 };
const DAVIT = [872, 186];
layer({
  id: 'kettle', z: 26,
  hit(x, y) { return Math.hypot(x - K.x, y - K.y) < 26; },
  update(dt, t, L) {
    K.drop = ease(K.drop, L.hovered ? 1 : 0, 2.2, dt);
    const w = wind(t, 960) * 0.04;
    K.sv += (-(K.sw - w) * 3 - K.sv * 0.8) * dt; K.sw += K.sv * dt;
    if (Math.random() < dt * (3 + K.drop * 10)) OW.spawn({ kind: 'puff', x: K.x + 12, y: K.y - 12, vx: 10, vy: -12, life: 1.6, s: 0.7 + K.drop * 0.4 });
  },
  draw(g, t) {
    g.save(); g.translate(OW.shake.x, OW.shake.y);
    // the davit: a little timber crane at the top, its pulley wheel turning when the rope moves
    const [dx, dy] = DAVIT;
    ink(g, poly([[dx - 4, dy + 10], [dx - 1, dy - 26], [dx + 3, dy - 26], [dx + 4, dy + 10]]), '#5a4034', 1.4);
    ink(g, poly([[dx - 2, dy - 26], [dx + 34, dy - 32], [dx + 34, dy - 27], [dx, dy - 21]]), '#6a4a3a', 1.4);
    const wx = dx + 32, wy = dy - 26;
    ink(g, circ(wx, wy, 5), '#8a7a6a', 1.2);
    g.save(); g.translate(wx, wy); g.rotate(K.drop * 6); g.strokeStyle = LINE; g.lineWidth = 0.8; g.beginPath(); g.moveTo(-4, 0); g.lineTo(4, 0); g.moveTo(0, -4); g.lineTo(0, 4); g.stroke(); g.restore();
    // the rope down the face (it hangs clear of the drawers, past the right-hand chimney)
    const len = 590 + K.drop * 40;
    K.x = wx + 5 + Math.sin(K.sw) * len * 0.12; K.y = wy + Math.cos(K.sw) * len;
    g.lineWidth = 1.3; g.strokeStyle = '#a89070';
    g.beginPath(); g.moveTo(wx + 5, wy); g.quadraticCurveTo(wx + 6 + Math.sin(K.sw) * len * 0.1, wy + len * 0.5, K.x, K.y - 16); g.stroke();
    // a copper kettle, blackened on the bottom, steaming
    const kx = K.x, ky = K.y;
    g.lineWidth = 1.4; g.strokeStyle = LINE; g.beginPath(); g.arc(kx, ky - 6, 8, Math.PI, 0); g.stroke();
    const body = curve([[kx - 10, ky + 8], [kx - 12, ky], [kx - 6, ky - 6], [kx + 6, ky - 6], [kx + 12, ky], [kx + 10, ky + 8]]);
    ink(g, body, '#b0643c', 1.6);
    g.save(); g.clip(body); g.fillStyle = '#e09060'; g.fill(ell(kx - 4, ky - 2, 4, 3)); g.fillStyle = '#2a1a1a'; g.fillRect(kx - 14, ky + 5, 28, 6); g.fillStyle = 'rgba(140,170,255,0.4)'; g.fill(ell(kx - 10, ky + 2, 5, 8)); g.restore();
    ink(g, poly([[kx + 9, ky - 1], [kx + 17, ky - 9], [kx + 18, ky - 7], [kx + 11, ky + 3]]), '#9a5634', 1.2);
    ink(g, ell(kx, ky - 6.5, 3.5, 1.4), '#c87a4c', 1);
    g.restore();
  },
});
})();
