/* foot.js — life at the stack's foot: reception in the arch (a counter, a hush lamp, the bell, the
   card index that cross-references the snorers, a hanging board, and the desk porter behind it),
   the three late hedgehogs still crossing the causeway with their suitcases, and the gull.

   Hover the bell: ding — and every porter on the cliff glares down. Hover the card index: a drawer
   slides out and the cards riffle. Hover the desk porter: it looks up over its spectacles. Hover a
   hedgehog: the last one breaks into a waddling run, suitcase bumping. Idle: a gull glides in, lands
   on the bell, dings it, gets glared at and leaves; hover it and it goes at once.
   z 13 reception · 15 hedgehogs · 35 gull. */
(() => {
const { TAU, clamp, lerp, ease, rng, noise, wind, st, P, layer, grad, radial, poly, curve, circ, ell, ink, seg, tube } = Drawn;
const C = OW.C, LINE = OW.LINE, mix = OW.mix;
const bump = (u) => (u <= 0 || u >= 1 ? 0 : Math.sin(u * Math.PI));
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// ------------------------------------------------------------ reception, in the arch
const DESK = { x0: 322, x1: 428, y: 1226, h: 34 };
const BELL = [410, 1224];
const INDEX = [334, 1226];
const state = { ding: 0, idx: 0, look: 0, blink: Drawn.blinker(2, 5) };
OW.bell = BELL;
OW.ringBell = () => { state.ding = 1; OW.emit('ding'); };
const parts = {
  bell: (x, y) => Math.hypot(x - BELL[0], y - BELL[1] + 4) < 12,
  index: (x, y) => x > INDEX[0] - 4 && x < INDEX[0] + 30 && y > INDEX[1] - 26 && y < INDEX[1] + 2,
  porter: (x, y) => x > 362 && x < 398 && y > 1166 && y < 1224,
};
layer({
  id: 'reception', z: 13,
  hit(x, y) { for (const k in parts) if (parts[k](x, y)) { this.part = k; return true; } return false; },
  onEnter(L) { if (L.part === 'bell') OW.ringBell(); },
  onTap(L) { if (L.part === 'bell') OW.ringBell(); },
  update(dt, t, L) {
    state.ding = Math.max(0, state.ding - dt * 0.9);
    state.idx = ease(state.idx, L.hovered && L.part === 'index' ? 1 : 0, 4, dt);
    state.look = ease(state.look, L.hovered && L.part === 'porter' ? 1 : 0, 4, dt);
  },
  draw(g, t) {
    // the lamp's pool on the arch floor and the inner walls
    OW.lampGlow(g, 352, 1206, 70, 0.55);
    // the desk porter, reading the index cards through spectacles
    const px = 380, py = 1226;
    const pl = state.look;
    OW.stoat(g, px, py + 6, 0.85, { face: -1, t, grip: [px + 12, py - 16], hand: [px - 14, py - 14 - pl * 4], blink: state.blink(t), look: pl * 0.5, capLift: 0, freeze: 0, shh: false, glare: 0, yawn: 0, lampSide: -1 });
    // spectacles
    g.lineWidth = 0.7; g.strokeStyle = '#e8d8a0';
    g.beginPath(); g.arc(px - 4, py - 28.8 + pl * 0.6, 1.6, 0, TAU); g.stroke();
    // the counter: dark oak, its front lit blue by the lamp, rose behind
    const top = poly([[DESK.x0 - 4, DESK.y], [DESK.x1 + 4, DESK.y], [DESK.x1 + 2, DESK.y + 5], [DESK.x0 - 2, DESK.y + 5]]);
    const front = poly([[DESK.x0, DESK.y + 5], [DESK.x1, DESK.y + 5], [DESK.x1 - 1, DESK.y + DESK.h], [DESK.x0 + 1, DESK.y + DESK.h]]);
    ink(g, front, '#3a2630', 1.6);
    g.save(); g.clip(front);
    g.fillStyle = radial(g, 352, DESK.y + 10, 0, 70, [[0, 'rgba(130,160,255,0.55)'], [1, 'rgba(130,160,255,0)']]); g.fillRect(DESK.x0, DESK.y, 120, 40);
    g.strokeStyle = 'rgba(20,10,20,0.5)'; g.lineWidth = 1;
    for (let x = DESK.x0 + 12; x < DESK.x1; x += 18) { g.beginPath(); g.moveTo(x, DESK.y + 8); g.lineTo(x, DESK.y + DESK.h - 3); g.stroke(); }
    g.restore();
    ink(g, top, '#6a4a40', 1.4);
    g.fillStyle = 'rgba(255,190,170,0.6)'; g.fillRect(DESK.x0 - 3, DESK.y, DESK.x1 - DESK.x0 + 6, 1.2);
    // a little brass plate on the front: RECEPTION
    ink(g, Drawn.rect(362, DESK.y + 12, 30, 7), C.brass.base, 0.8);
    g.fillStyle = '#3a2630'; g.font = '600 4.4px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('RECEPTION', 377, DESK.y + 15.7); g.textAlign = 'start';
    // the desk lamp
    const fl = 0.85 + 0.15 * Math.sin(t * 8.3) * Math.sin(t * 5.1);
    OW.lampGlow(g, 350, DESK.y - 12, 26, 0.6 * fl);
    OW.hushLamp(g, 350, DESK.y - 10, 0.75, fl);
    // the card index: a little two-drawer cabinet, its top drawer sliding out on a hover, cards riffling
    const [ix, iy] = INDEX;
    ink(g, Drawn.rect(ix, iy - 22, 24, 22), '#4a3228', 1.2);
    const o = state.idx * 8;
    ink(g, Drawn.rect(ix + 2 - o * 0.2, iy - 20 - o * 0.25, 20, 9), '#7a5a44', 1);
    ink(g, Drawn.rect(ix + 2, iy - 9.5, 20, 8), '#6a4a3a', 1);
    if (o > 0.5) {
      for (let i = 0; i < 6; i++) {
        const lean = Math.sin(t * 12 + i) * 0.25 * state.idx;
        g.save(); g.translate(ix + 5 + i * 2.6, iy - 20 - o * 0.25); g.rotate(lean);
        ink(g, Drawn.rect(-1.5, -6 - (i % 2) * 1.5, 3, 7), i === 3 ? '#f0d0c0' : '#efe6d6', 0.5);
        g.restore();
      }
    }
    ink(g, circ(ix + 12, iy - 15, 1), C.brass.lit, 0.4); ink(g, circ(ix + 12, iy - 5.5, 1), C.brass.lit, 0.4);
    // the bell, ringing
    const [bx, by] = BELL, sh = Math.sin(t * 60) * state.ding * 1.2;
    ink(g, ell(bx, by - 0.5, 7, 1.6), '#5a4a3a', 1);
    const bp = new Path2D(); bp.moveTo(bx - 6 + sh, by - 1); bp.quadraticCurveTo(bx - 6 + sh, by - 9, bx + sh, by - 9); bp.quadraticCurveTo(bx + 6 + sh, by - 9, bx + 6 + sh, by - 1); bp.closePath();
    ink(g, bp, C.brass.base, 1);
    g.fillStyle = C.brass.glint; g.fill(ell(bx - 2 + sh, by - 6, 1.6, 1));
    ink(g, circ(bx + sh, by - 10, 1.3), C.brass.lit, 0.6);
    if (state.ding > 0.05) {
      g.globalAlpha = state.ding; g.lineWidth = 0.9; g.strokeStyle = '#fff4d8';
      for (const k of [1, 2]) { g.beginPath(); g.arc(bx, by - 6, 8 + k * 5 + (1 - state.ding) * 8, -2.4, -0.7); g.stroke(); }
      g.globalAlpha = 1;
    }
    // the board hanging from the arch top on two chains
    const sw = Math.sin(t * 0.8) * 0.03 + wind(t, 380) * 0.02;
    g.save(); g.translate(384, 1120); g.rotate(sw);
    g.lineWidth = 0.8; g.strokeStyle = '#4a4058'; g.beginPath(); g.moveTo(-16, 0); g.lineTo(-14, 14); g.moveTo(16, 0); g.lineTo(14, 14); g.stroke();
    ink(g, Drawn.rect(-22, 14, 44, 15), '#2e2230', 1.2);
    g.fillStyle = '#e8dcc4'; g.font = 'italic 6px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('The Overwinter', 0, 19.5); g.font = '3.8px Georgia, serif'; g.fillText('please ring for the night porter', 0, 25.4); g.textAlign = 'start';
    ink(g, ell(0, 14, 20, 1.6), C.snow, 0.5, C.snowShade);
    g.restore();
  },
});

// ------------------------------------------------------------ the late hedgehogs
// walking up the causeway toward the arch, one behind another, very slowly (they're tired)
const HOGS = [0, 1, 2].map((i) => ({ i, s: 0.24 + i * 0.07, o: -0.15 + i * 0.12, run: 0, ph: i * 1.7, blink: Drawn.blinker(2, 4) }));
OW.hogs = HOGS;
function hog(g, x, y, s, h, t) {
  // walking upright, in profile, toward the arch (to the right), suitcase in the near paw
  const step = t * (2.6 + h.run * 5) + h.ph, sw = Math.sin(step), bob = Math.abs(sw) * (1.2 + h.run * 2) * s;
  g.save(); g.translate(x, y); g.scale(s, s);
  const lw = 1.5 / s;
  g.fillStyle = 'rgba(20,14,36,0.4)'; g.fill(ell(1, 0.5, 13, 2.4));
  g.translate(0, -bob / s); g.rotate(h.run * 0.18 + sw * 0.03);
  // legs: short, stumping
  for (const [ph, far] of [[Math.PI, 1], [0, 0]]) {
    const k = Math.sin(step + ph);
    ink(g, poly([[-1 + k * 3, -9], [2 + k * 3, -9], [3 + k * 5, 0], [-2 + k * 5, 0]]), far ? '#8a6a52' : '#a88262', lw * 0.7);
  }
  // body: an upright egg, cream belly in front, spines all down the back
  const body = curve([[2, -30], [8, -26], [10, -16], [8, -7], [0, -5], [-8, -8], [-10, -18], [-7, -28]]);
  ink(g, body, '#d8c0a0', lw);
  const back = curve([[-1, -33], [-9, -29], [-13, -19], [-11, -9], [-4, -5], [-2, -14], [0, -26]]);
  ink(g, back, '#5a4a40', lw);
  g.save(); g.clip(back); g.strokeStyle = '#c8b498'; g.lineWidth = 0.9;
  for (let i = 0; i < 18; i++) { const yy = -31 + i * 1.5, xx = -11 + Math.abs(i - 9) * 0.35; g.beginPath(); g.moveTo(xx + 6, yy); g.lineTo(xx, yy + 1.4); g.stroke(); }
  g.fillStyle = 'rgba(255,190,170,0.35)'; g.fill(ell(-9, -22, 3, 8));
  g.restore();
  g.lineWidth = 1.1; g.strokeStyle = LINE;
  for (let i = 0; i < 9; i++) { const a = 2.0 + i * 0.22, r = 12 + (i % 2) * 1.2; g.beginPath(); g.moveTo(-4 + Math.cos(a) * r * 0.75, -19 + Math.sin(a) * r * 1.15); g.lineTo(-4 + Math.cos(a) * (r + 3) * 0.75, -19 + Math.sin(a) * (r + 3) * 1.15); g.stroke(); }
  // head: the pointed snout forward, a little black nose, a scarf
  const head = curve([[-1, -36], [6, -35], [13, -31.5], [15.5, -30], [13, -28.5], [5, -27], [-1, -29]]);
  ink(g, head, '#c49a76', lw);
  ink(g, poly([[-3, -36], [1, -38], [-1, -33]]), '#5a4a40', lw * 0.7);
  g.fillStyle = '#1a1218'; g.fill(circ(15.4, -30.2, 1.1));
  const bl = h.blink(t);
  g.fillStyle = '#120c18'; g.fill(ell(7.6, -32.6, 0.95, 0.95 * bl));
  const scarf = h.i === 0 ? '#c3343c' : h.i === 1 ? '#6e86b8' : '#e0c070';
  ink(g, poly([[-3, -29], [7, -27], [7, -24.5], [-3, -26.5]]), scarf, lw * 0.6);
  ink(g, poly([[-3, -27.5], [-8 - h.run * 3, -22 + Math.sin(step * 2) * 1.5], [-6.5 - h.run * 3, -20.5 + Math.sin(step * 2) * 1.5], [-1.5, -26]]), scarf, lw * 0.6);
  // the suitcase in the near paw, swinging (and bumping, when running)
  const cb = h.run * Math.max(0, Math.sin(step * 2)) * 2.5, cs = sw * 2 * (1 - h.run * 0.5);
  const cx = 6 + cs, cy = -10 + cb;
  tube(g, seg(5, -19, cx, cy - 9), '#c49a76', 2, lw * 0.4);
  const caseCol = h.i === 1 ? '#7a3a34' : h.i === 2 ? '#4a5a6a' : '#8a6040';
  ink(g, Drawn.rect(cx - 7, cy - 7, 14, 10), caseCol, lw);
  g.fillStyle = 'rgba(255,190,170,0.3)'; g.fillRect(cx - 7, cy - 7, 14, 1.6);
  g.fillStyle = '#c8a060'; g.fillRect(cx - 4, cy - 7, 1.4, 10); g.fillRect(cx + 2.6, cy - 7, 1.4, 10);
  ink(g, Drawn.rect(cx - 2.5, cy - 9.5, 5, 2.6), null, lw * 0.6);
  ink(g, poly([[cx + 6.6, cy - 4], [cx + 10, cy - 3], [cx + 10, cy], [cx + 6.6, cy - 1]]), C.tag.base, 0.4);
  g.restore();
}
layer({
  id: 'hogs', z: 15,
  hit(x, y) { for (const h of HOGS) if (h.at && Math.abs(x - h.at[0]) < 20 * h.sc && y > h.at[1] - 40 * h.sc && y < h.at[1] + 4) { this.cur = h; return true; } return false; },
  update(dt, t, L) {
    const last = HOGS[2];
    // the tide coming in, or a hover, makes the last one hurry
    const hurry = (L.hovered ? 1 : 0) || (OW.tide && OW.tide.k > 0.86 ? 1 : 0);
    for (const h of HOGS) {
      h.run = ease(h.run, h === last && hurry ? 1 : h === HOGS[1] && L.hovered && L.cur === h ? 0.6 : 0, 3, dt);
      h.s -= dt * (0.0016 + h.run * 0.012);
      if (h.s < 0.04) { h.s = 0.58 + Math.random() * 0.04; }
      // keep their order and spacing: nobody overtakes the one in front by much
    }
  },
  draw(g, t) {
    for (const h of HOGS.slice().sort((a, b) => a.s - b.s)) {
      const [x, y] = OW.cwAt(h.s, h.o);
      const sc = (0.55 + (y - 1262) / 170) * 1.45;
      h.at = [x, y]; h.sc = sc;
      // fade into the arch's shadow at the far end
      g.globalAlpha = clamp((h.s - 0.04) / 0.05, 0, 1);
      hog(g, x, y, sc, h, t);
      g.globalAlpha = 1;
    }
  },
});

// ------------------------------------------------------------ the gull
const GULL = { mode: 'away', t: 0, next: 9 + Math.random() * 8, x: 0, y: 0, flap: 0, face: -1, blink: Drawn.blinker(2, 4) };
function gull(g, x, y, s, face, flap, sit, t) {
  g.save(); g.translate(x, y); g.scale(s * face, s);
  const lw = 1.4 / s;
  if (!sit) {
    // wings: a long M, flapping
    const a = Math.sin(flap) * 9;
    for (const side of [-1, 1]) {
      const w = curve([[side * 2, -2], [side * 10, -6 - a], [side * 22, -3 - a * 1.4]], false);
      tube(g, w, '#e8e6f0', 2.6, lw);
      g.lineWidth = 2.4; g.strokeStyle = '#2a2430'; g.beginPath(); g.moveTo(side * 19, -3.4 - a * 1.3); g.lineTo(side * 22, -3 - a * 1.4); g.stroke();
    }
  }
  const body = curve([[-10, -1], [-4, -6], [5, -6], [10, -3], [8, 1], [-2, 2], [-9, 1]]);
  ink(g, body, '#f2f0f6', lw);
  if (sit) { ink(g, curve([[-12, -2], [-4, -6], [6, -5], [4, -1], [-6, 1]]), '#a8a4bc', lw); g.fillStyle = '#2a2430'; g.fill(poly([[-12, -2], [-16, -3], [-11, 0]])); }
  // head and beak, with the red spot
  ink(g, circ(9, -8, 3.6), '#f6f4fa', lw);
  ink(g, poly([[12, -8.6], [17.5, -7.6], [12, -6.6]]), '#e8c050', lw * 0.6);
  g.fillStyle = '#c3343c'; g.fill(circ(15.4, -7.2, 0.6));
  g.fillStyle = '#120c18'; g.fill(circ(10, -9, 0.8));
  if (sit) { g.lineWidth = 1; g.strokeStyle = '#d8a070'; g.beginPath(); g.moveTo(-1, 1); g.lineTo(-1, 5); g.moveTo(2, 1); g.lineTo(2, 5); g.stroke(); }
  g.restore();
}
layer({
  id: 'gull', z: 35,
  hit(x, y) { return GULL.mode === 'sit' && Math.hypot(x - GULL.x, y - GULL.y + 6) < 18; },
  onEnter() { if (GULL.mode === 'sit') { GULL.mode = 'leave'; GULL.t = 0; } },
  update(dt, t) {
    const G = GULL;
    G.t += dt; G.flap += dt * (G.mode === 'sit' ? 0 : 9);
    const [bx, by] = BELL;
    if (G.mode === 'away' && (G.next -= dt) < 0) { G.mode = 'in'; G.t = 0; }
    if (G.mode === 'in') {
      // glide in from the open sea on the right, low over the flats
      const u = clamp(G.t / 6, 0, 1), e = 1 - (1 - u) ** 2;
      G.x = lerp(st.view.x1 + 60, bx, e); G.y = lerp(1040, by - 9, e) - bump(u) * 60; G.face = -1;
      if (u >= 1) { G.mode = 'sit'; G.t = 0; OW.ringBell(); }
    } else if (G.mode === 'sit') {
      G.x = bx; G.y = by - 9;
      if (G.t > 4 + Math.random() * 0.02) { G.mode = 'leave'; G.t = 0; }
    } else if (G.mode === 'leave') {
      const u = clamp(G.t / 5, 0, 1);
      G.x = lerp(bx, st.view.x0 - 80, u * u); G.y = by - 9 - u * 260; G.face = -1;
      if (u >= 1) { G.mode = 'away'; G.next = 22 + Math.random() * 20; }
    }
  },
  draw(g, t) {
    const G = GULL;
    if (G.mode === 'away') return;
    const sit = G.mode === 'sit';
    gull(g, G.x, G.y, sit ? 0.8 : 0.95, G.face, G.flap, sit, t);
  },
});
})();
