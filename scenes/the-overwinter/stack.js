/* stack.js — the sea stack: weathered bedded sandstone wrapped round a drum, the natural arch
   through its left foot, the cabinets wedged into it (four makes: kraft oak, municipal steel,
   oxblood lacquer, walnut apothecary, plus stacked archive boxes) and every drawer closed, with its
   brass label holder, pull and card label; the face dissolving into rock texture and snow haze up
   high; the turf cap and its snow brow.

   It's one big sprite (built in onLayout) blitted by a moving layer, so the whole stack can shudder
   when the bear cub wakes. Hover: the rock itself — a little snow slides off the nearest ledge and
   a pebble skitters down (rock-shed, z 11). Depth: z 10–11, behind every drawer and porter. */
(() => {
const { TAU, clamp, lerp, rng, noise, st, layer, onLayout, sprite, blit, grad, radial, poly, curve, circ, ell, ink, seg } = Drawn;
const C = OW.C, HZ = OW.HZ, LINE = OW.LINE;
const qpath = OW.qpath, mix = OW.mix;

// a point on the drum for any u (beyond 0..1 runs round toward the silhouette)
const TH = 1.0;
function drum(u, v) {
  const th = clamp((u - 0.5) * 2 * TH, -1.52, 1.52);
  return OW.at(0.5 + th / (2 * TH), v);
}
OW.drum = drum;
const stackPath = () => { const p = poly(OW.stackPts); return p; };
const archPath = () => curve(OW.archPts);
OW.stackPath = stackPath;

// rock colour by height: warm bounce off the sand near the foot, cooler and paler up high
function rockAt(y, k = 0) {
  const w = OW.warmAt(y);
  return mix(mix('#262036', '#3a2838', w), '#1e1828', k);
}

// ------------------------------------------------------------ the rock
function drawRock(g) {
  const SP = stackPath();
  const R = rng(5151);
  g.save();
  g.clip(SP);
  // body: cool violet above, warm plum near the sand
  g.fillStyle = grad(g, 0, 150, 0, 1270, [[0, '#221e36'], [0.3, '#1a1628'], [0.65, '#1b1628'], [0.88, '#281c30'], [1, '#3a2636']]);
  g.fillRect(250, 120, 950, 1200);
  // the drum turns away at the sides: darker toward both edges, the centre faces the sky behind us
  g.fillStyle = grad(g, 380, 0, 1110, 0, [[0, 'rgba(20,14,30,0.55)'], [0.16, 'rgba(20,14,30,0.2)'], [0.45, 'rgba(20,14,30,0)'], [0.82, 'rgba(20,14,30,0.25)'], [1, 'rgba(20,14,30,0.6)']]);
  g.fillRect(250, 120, 950, 1200);

  // facets: the stack is jointed vertically into rough pillars, each turned a little its own way.
  // A facet turned left catches a breath of the rose from behind; one turned right goes cold.
  const FAC = [[-0.55, -0.24, 0.6], [-0.24, -0.02, 0.35], [-0.02, 0.36, 0.12], [0.36, 0.7, 0.02], [0.7, 1.03, 0.18], [1.03, 1.24, 0.42], [1.24, 1.55, 0.62]];
  OW.facets = FAC;
  for (const [ua, ub, dark] of FAC) {
    const L = [], Rr = [];
    for (let vv = -0.05; vv <= 1.25; vv += 0.05) {
      const ja = noise(vv * 9 + ua * 30) * 0.035, jb = noise(vv * 9 + ub * 30) * 0.035;
      L.push(drum(ua + ja, vv)); Rr.push(drum(ub + jb, vv));
    }
    const p = poly(L.concat(Rr.reverse()));
    const turn = (ua + ub) / 2 < 0.5 ? 1 : -1;
    g.fillStyle = turn > 0 ? `rgba(200,130,150,${0.1 * (1 - dark)})` : `rgba(12,8,24,${dark * 0.5})`;
    g.fill(p);
    // the cleft between facets: a dark crack with a lit lip on its sunward side
    g.lineWidth = 3 + dark * 3; g.strokeStyle = 'rgba(14,8,22,0.75)';
    g.stroke(poly(L, false));
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(210,150,170,0.22)';
    g.stroke(poly(L.map(([x, y]) => [x + 2.5, y]), false));
  }
  // two deep chimneys (clefts that run a long way), black inside, snow lodged in their steps
  for (const [u, va, vb, w] of [[-0.12, 0.42, 1.15, 0.05], [1.1, 0.18, 0.86, 0.045], [0.5, 0.76, 1.12, 0.03]]) {
    const L = [], Rr = [];
    for (let vv = va; vv <= vb; vv += 0.03) {
      const k = Math.sin(((vv - va) / (vb - va)) * Math.PI) ** 0.6, j = noise(vv * 14 + u * 9) * 0.02;
      L.push(drum(u - w * k + j, vv)); Rr.push(drum(u + w * k * 0.7 + j, vv));
    }
    const p = poly(L.concat(Rr.slice().reverse()));
    g.fillStyle = '#120c1a'; g.fill(p);
    g.lineWidth = 1.4; g.strokeStyle = 'rgba(220,160,170,0.28)'; g.stroke(poly(Rr, false));
    for (let i = 2; i < L.length - 2; i += 3) { const [x, y] = L[i], [x2] = Rr[i]; ink(g, ell((x + x2) / 2, y, Math.abs(x2 - x) * 0.4, 2.2), '#d8daf0', 0); }
  }

  // bedding: beds of uneven thickness running round the drum; broken, not ruled
  let v = -0.03;
  const beds = [];
  while (v < 1.2) {
    const th = 0.018 + R() * 0.05 + (R() < 0.2 ? 0.04 : 0);
    beds.push([v, v + th, R()]);
    v += th;
  }
  OW.beds = beds;
  const line = (vv, ua = -0.5, ub = 1.5) => { const pts = []; for (let u = ua; u <= ub; u += 0.05) { const p = drum(u, vv + noise(u * 6 + vv * 40) * 0.011 + noise(u * 19 + vv * 90) * 0.004); p[1] += OW.dip(u, vv); pts.push(p); } return pts; };
  for (const [v0, v1, r] of beds) {
    const top = line(v1), bot = line(v0);
    const y = (top[20][1] + bot[20][1]) / 2;
    const hard = r > 0.6;
    g.fillStyle = hard ? 'rgba(160,140,180,0.1)' : r < 0.25 ? 'rgba(14,10,24,0.18)' : 'rgba(0,0,0,0)';
    g.fill(poly(top.concat(bot.slice().reverse())));
    // the seam under each bed comes and goes: weathered out in places, lost in others
    const ua = -0.5 + R() * 0.5;
    let u = ua;
    while (u < 1.5) {
      const len = 0.06 + R() * 0.3;
      if (R() < 0.6) {
        const seam = line(v0, u, u + len);
        if (seam.length > 1) {
          g.lineWidth = hard ? 2.2 : 1.1; g.strokeStyle = `rgba(16,10,24,${hard ? 0.55 : 0.35})`; g.stroke(curve(seam, false));
          if (hard) { g.lineWidth = 1.3; g.strokeStyle = `rgba(230,160,150,${0.1 + OW.warmAt(y) * 0.32})`; g.stroke(curve(seam.map(([x, yy]) => [x, yy + 2.2]), false)); }
        }
      }
      u += len + R() * 0.12;
    }
    // a joint now and then, never in a row
    if (R() < 0.6) {
      const uj = -0.3 + R() * 1.6;
      const a = drum(uj, v0), b = drum(uj + (R() - 0.5) * 0.03, v1);
      a[1] += OW.dip(uj, v0); b[1] += OW.dip(uj, v1);
      g.lineWidth = 1 + R(); g.strokeStyle = 'rgba(16,10,24,0.5)';
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo((a[0] + b[0]) / 2 + (R() - 0.5) * 4, (a[1] + b[1]) / 2); g.lineTo(b[0], b[1]); g.stroke();
    }
  }
  // tafoni: the honeycomb hollows salt wind scoops out of sandstone, in clusters
  for (let c = 0; c < 9; c++) {
    const cu = R() < 0.5 ? -0.3 + R() * 0.3 : 1 + R() * 0.3, cv = 0.08 + R() * 0.95;
    for (let i = 0; i < 7 + R() * 10; i++) {
      const [x, y] = drum(cu + (R() - 0.5) * 0.14, cv + (R() - 0.5) * 0.06);
      const r = 2 + R() * 7;
      g.fillStyle = '#140e1e'; g.fill(ell(x, y, r, r * 0.75));
      g.fillStyle = 'rgba(200,150,170,0.25)'; g.fill(ell(x + r * 0.2, y + r * 0.55, r * 0.8, r * 0.22));
    }
  }
  // weathering: blotches and streaks, larger than speckle
  for (let i = 0; i < 260; i++) {
    const x = 300 + R() * 840, y = 150 + R() * 1120;
    const s = 0.8 + R() ** 2 * 3;
    g.globalAlpha = 0.12 + R() * 0.2;
    g.fillStyle = R() < 0.6 ? '#1a1424' : '#7a6a8a';
    g.fill(ell(x, y, s * (1 + R()), s * 0.6));
  }
  for (let i = 0; i < 40; i++) {
    const x = 330 + R() * 780, y = 200 + R() * 1000;
    g.globalAlpha = 0.07 + R() * 0.07; g.fillStyle = '#120c1c';
    g.fill(poly([[x - 4, y], [x + 4, y], [x + 1, y + 40 + R() * 90], [x - 2, y + 30]]));
  }
  g.globalAlpha = 1;
  // lichen: mustard and sage crusts in a few colonies, along the seams where water runs
  for (let c = 0; c < 9; c++) {
    const cu = [-0.25, -0.15, 1.12, 1.2, -0.3, 1.05, 0.5, 0.2, 0.8][c], cv = [0.95, 0.7, 0.8, 1.02, 0.5, 0.55, 0.9, 1.0, 0.98][c];
    const [cx, cy] = drum(cu, cv);
    for (let k = 0; k < 26; k++) {
      const x = cx + (R() - 0.5) * 30 * (1 + R()), y = cy + (R() - 0.5) * 8 + R() * 22;
      g.globalAlpha = 0.3 + R() * 0.4;
      g.fillStyle = R() < 0.65 ? '#9a7e52' : '#76806a';
      g.fill(ell(x, y, 1 + R() * 2.6, 0.8 + R() * 1.4));
    }
  }
  g.globalAlpha = 1;
  for (let i = 0; i < 0; i++) {
    const side = R() < 0.5 ? -1 : 1;
    const y = 220 + R() ** 1.4 * 720;
    const xs = side < 0 ? lerp(470, 440, (y - 200) / 900) + R() * 70 : lerp(920, 1000, (y - 200) / 900) - R() * 80;
    g.globalAlpha = 0.25 + R() * 0.35;
    g.fillStyle = R() < 0.6 ? '#a88a56' : '#7f8a6a';
    for (let k = 0; k < 4; k++) g.fill(circ(xs + (R() - 0.5) * 8, y + (R() - 0.5) * 5, 0.8 + R() * 2));
  }
  g.globalAlpha = 1;

  // the high face: the oldest drawers, half swallowed by the rock — a scatter of dark slots and
  // the odd brass glint, thinning out as they go up into the haze
  const RT = rng(808);
  for (let i = 0; i < 70; i++) {
    const vv = OW.TEXTURE_V + 0.01 + RT() ** 1.4 * 0.3, u = 0.05 + RT() * 0.9, w = 0.025 + RT() * 0.05, hh = 0.008 + RT() * 0.014;
    const q = [drum(u, vv + hh), drum(u + w, vv + hh), drum(u + w, vv), drum(u, vv)];
    const dy = OW.dip(u + w / 2, vv);
    for (const p of q) p[1] += dy;
    const fade = clamp((vv - OW.TEXTURE_V) / 0.27, 0, 1);
    g.globalAlpha = 0.75 * (1 - fade * 0.7);
    g.fillStyle = '#0e0a16'; g.fill(qpath(OW.inset(q, -0.08, -0.15)));
    g.fillStyle = RT() < 0.3 ? '#2a3038' : '#3a2a34'; g.fill(qpath(q));
    // its sill catches a little sky
    g.fillStyle = 'rgba(160,150,200,0.35)'; g.fill(poly([q[3], q[2], [q[2][0], q[2][1] + 1.2], [q[3][0], q[3][1] + 1.2]]));
    if (RT() < 0.5) { const c = OW.qat(q, 0.5, 0.45); g.fillStyle = '#b89a62'; g.fillRect(c[0] - 1.5, c[1] - 0.6, 3, 1.4); }
    if (RT() < 0.55) { g.globalAlpha = 0.8 * (1 - fade * 0.4); g.fillStyle = C.snow; g.fill(poly([[q[0][0] - 1, q[0][1] + 0.5], [q[1][0] + 1, q[1][1] + 0.5], [q[1][0], q[1][1] - 1.8], [q[0][0] + 2, q[0][1] - 1.2]])); }
  }
  g.globalAlpha = 1;
  // haze: the snow in the air between us and the top of the stack
  g.fillStyle = grad(g, 0, 150, 0, 620, [[0, 'rgba(90,86,140,0.38)'], [0.5, 'rgba(80,76,130,0.14)'], [1, 'rgba(80,76,130,0)']]);
  g.fillRect(250, 120, 950, 520);
  g.restore();
}

// ------------------------------------------------------------ lamplight, baked
// blue light from every lamp's resting place, laid over whatever is drawn in the clip
let LAMPS = [];
function lampLight(g, k = 1) {
  g.globalCompositeOperation = 'screen';
  for (const [x, y, a, r] of LAMPS) {
    g.fillStyle = radial(g, x, y, 0, r, [[0, `rgba(160,200,255,${0.95 * a * k})`], [0.4, `rgba(110,150,250,${0.55 * a * k})`], [0.72, `rgba(80,100,220,${0.14 * a * k})`], [1, 'rgba(60,60,180,0)']]);
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  g.globalCompositeOperation = 'source-over';
}
const lampAt = (x, y) => LAMPS.reduce((s, [lx, ly, a, r]) => s + a * Math.max(0, 1 - Math.hypot(x - lx, y - ly) / r) ** 1.5, 0);
OW.lampAt = lampAt;

// ------------------------------------------------------------ cabinets and closed drawers
// how far a proud cabinet's underside shows: the higher above eye level, the more we see
const under = (y, depth) => clamp((HZ - y) / 900, 0, 1) * 14 * depth;

function drawCabinet(g, cab) {
  const R = rng(cab.seed);
  const T = C[cab.tone];
  const q = cab.q;
  const yb = (q[2][1] + q[3][1]) / 2;
  const P = qpath(q);
  if (cab.depth < 0) {
    // an alcove: the rock is cut back round the cabinet; its upper lip throws a shadow down
    const a = OW.inset(q, -0.06, -0.08);
    g.fillStyle = '#16101e'; g.fill(qpath(a));
    g.save(); g.clip(qpath(a));
    g.fillStyle = 'rgba(8,4,14,0.6)';
    g.fill(poly([a[0], a[1], [a[1][0], a[1][1] + 16], [a[0][0], a[0][1] + 16]]));
    g.restore();
    ink(g, qpath(a), null, 1.6);
  } else {
    // ambient occlusion where the cabinet's sides meet the rock
    g.save();
    g.shadowColor = 'rgba(8,4,16,0.7)'; g.shadowBlur = 14; g.shadowOffsetY = 6;
    g.fillStyle = T.deep; g.fill(P);
    g.restore();
    // the underside: we're below it, so a strip of the carcass bottom shows, lit warm from the sand
    const u = under(yb, cab.depth);
    if (u > 1) {
      const us = [q[3], q[2], [q[2][0] + 3, q[2][1] + u], [q[3][0] - 3, q[3][1] + u]];
      g.fillStyle = mix(T.deep, C.kraft.rose, OW.warmAt(yb) * 0.45 + 0.08);
      ink(g, qpath(us), g.fillStyle, 1.4);
    }
  }
  // carcass
  g.fillStyle = grad(g, q[0][0], 0, q[1][0], 0, [[0, T.deep], [0.5, T.shade], [1, T.deep]]);
  if (cab.tone === 'kraft' && cab.make === 'oak') g.fillStyle = grad(g, q[0][0], 0, q[1][0], 0, [[0, '#2e1e1c'], [0.5, '#4a3226'], [1, '#2e1e1c']]);
  g.fill(P);
  // grain on the oak carcass, rivets on the steel
  if (cab.make === 'oak' || cab.make === 'walnut') {
    g.save(); g.clip(P);
    g.strokeStyle = 'rgba(20,10,16,0.35)'; g.lineWidth = 0.8;
    for (let i = 0; i < 8; i++) { const s = R(); const a = OW.qat(q, s, 0), b = OW.qat(q, s + (R() - 0.5) * 0.05, 1); g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(a[0] + 3, (a[1] + b[1]) / 2, b[0], b[1]); g.stroke(); }
    g.restore();
  }
  g.save(); g.clip(P); lampLight(g, 0.8); g.restore();
  ink(g, P, null, 2.2);
  // a plinth or a moulded cornice on the furniture-made ones
  if (cab.make === 'oak' || cab.make === 'walnut' || cab.make === 'ox') {
    const top = [q[0], q[1], OW.qat(q, 1, 0.035), OW.qat(q, 0, 0.035)];
    const ext = top.map(([x, y], i) => [x + (i === 0 || i === 3 ? -3 : 3), y]);
    ink(g, qpath(ext), T.lit, 1.4);
  }
  for (const d of cab.drawers) drawDrawerClosed(g, d, R);
  // snow lodged along the cabinet's top, thicker at one end where it drifted (not every one)
  if (R() < 0.6) {
    const a = q[0], b = q[1], dir = R() < 0.5 ? 1 : -1, n = 8, pts = [], bot = [];
    for (let i = 0; i <= n; i++) { const t = i / n, th = (1.2 + (dir > 0 ? t : 1 - t) * 3.5) * (0.7 + R() * 0.6); pts.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) - th]); bot.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t) + 1.4]); }
    ink(g, curve(pts.concat(bot.reverse())), C.snow, 0.8, C.snowShade);
  }
  // the rock creeps over the cabinet's edge in places: a lip of stone over a corner
  if (false) {
    const side = R() < 0.5 ? 0 : 1, c = side ? q[1] : q[0], w = 14 + R() * 18, h = 10 + R() * 16, sx = side ? -1 : 1;
    const lump = curve([[c[0] - sx * 10, c[1] - 6], [c[0] + sx * w * 0.6, c[1] - 4], [c[0] + sx * w, c[1] + h * 0.3], [c[0] + sx * w * 0.5, c[1] + h * 0.6], [c[0] + sx * 3, c[1] + h], [c[0] - sx * 8, c[1] + h * 0.7]]);
    g.save(); g.shadowColor = 'rgba(6,4,12,0.5)'; g.shadowBlur = 5; g.shadowOffsetY = 3; ink(g, lump, mix(rockAt(c[1]), '#4a3e5c', 0.45), 1.2); g.restore();
    g.save(); g.clip(lump);
    g.fillStyle = 'rgba(170,150,200,0.35)'; g.fill(ell(c[0] + sx * w * 0.35, c[1] - 3, w * 0.55, 3.4)); ink(g, ell(c[0] + sx * w * 0.3, c[1] - 6, w * 0.4, 2.2), C.snow, 0.6, C.snowShade);
    g.strokeStyle = 'rgba(10,6,18,0.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(c[0] - sx * 8, c[1] + h * 0.35); g.lineTo(c[0] + sx * w, c[1] + h * 0.3); g.stroke();
    for (let k = 0; k < 8; k++) { g.fillStyle = R() < 0.5 ? '#0e0a16' : '#5a5070'; g.fill(circ(c[0] + sx * R() * w, c[1] + R() * h * 0.7, 0.7 + R())); }
    g.restore();
  }
  // weathering on the carcass: a drip stain from the top
  if (R() < 0.6) {
    const s = 0.2 + R() * 0.6, a = OW.qat(q, s, 0);
    g.globalAlpha = 0.25; g.fillStyle = '#140c18';
    g.fill(poly([[a[0] - 2, a[1]], [a[0] + 3, a[1]], [a[0] + 1, a[1] + 20 + R() * 40], [a[0] - 1, a[1] + 14]]));
    g.globalAlpha = 1;
  }
}

// shelves of harder stone run round the stack between the cabinet rows; the cabinets sit on them
function drawLedges(g) {
  const R = rng(611);
  g.save(); g.clip(stackPath());
  for (const [v, th, ua, ub] of [[0.296, 0.008, -0.5, 0.12], [0.449, 0.009, 0.92, 1.5], [0.6, 0.007, -0.5, 0.1], [0.162, 0.008, 0.99, 1.5], [0.745, 0.01, 0.2, 0.62]]) {
    const top = [], bot = [];
    for (let u = ua; u <= ub + 1e-6; u += 0.04) {
      const a = drum(u, v + th), b = drum(u, v - th * 0.4);
      a[1] += OW.dip(u, v) - R() * 1.5; b[1] += OW.dip(u, v) + 1 + R() * 2;
      top.push(a); bot.push(b);
    }
    if (top.length < 2) continue;
    // its shadow on the rock and cabinets below
    g.fillStyle = 'rgba(6,4,12,0.45)'; g.fill(poly(bot.concat(bot.slice().reverse().map(([x, y]) => [x, y + 9]))));
    ink(g, poly(top.concat(bot.slice().reverse())), mix('#2c2440', '#4a3446', OW.warmAt(top[0][1])), 1.6);
    // underside lit warm by the sand near the foot; a snow line along the top
    g.lineWidth = 1.2; g.strokeStyle = `rgba(230,160,150,${0.1 + OW.warmAt(bot[0][1]) * 0.4})`; g.stroke(poly(bot.map(([x, y]) => [x, y - 1.5]), false));
    const sn = top.map(([x, y]) => [x, y - 1 - R() * 2.5]);
    ink(g, curve(sn.concat(top.slice().reverse().map(([x, y]) => [x, y + 1.6]))), C.snow, 0.7, C.snowShade);
  }
  g.restore();
}

// the face of a closed drawer, in its slot
function drawerFront(g, d, q, R, lit = 0) {
  const T = C[d.tone];
  const P = qpath(q);
  const w = OW.warmAt(d.cy), f = OW.facing((d.u0 + d.u1) / 2);
  // in shade by default: dark and cool, warmed from below near the sand
  const base = mix(mix(T.deep, T.shade, 0.2 + f * 0.35), T.rose, w * 0.22);
  g.fillStyle = grad(g, 0, q[0][1], 0, q[3][1], [[0, mix(base, T.lilac, 0.12)], [0.6, base], [1, mix(base, T.rose, 0.25 + w * 0.3)]]);
  g.fill(P);
  g.save(); g.clip(P);
  // material: kraft has fibres and creases, steel has a pressed panel, lacquer is chipped,
  // walnut has figure, archive boxes have a printed band and a string pull
  const make = d.cab.make;
  const ww = d.w, hh = d.h;
  if (make === 'steel') {
    const ip = OW.inset(q, 0.12, 0.2);
    g.lineWidth = 1; g.strokeStyle = mix(base, '#0e141a', 0.45); g.stroke(qpath(ip));
    g.strokeStyle = mix(base, '#c8d0cc', 0.25); g.stroke(qpath(ip.map(([x, y]) => [x + 0.8, y + 1])));
    for (let i = 0; i < 3; i++) { g.globalAlpha = 0.4; g.fillStyle = '#7a4a34'; g.fill(ell(q[0][0] + R() * ww, q[0][1] + R() * hh, 1 + R() * 4, 0.8 + R() * 2)); }
    // a cold sheen down the pressed steel, and a dent or two catching it
    if (R() < 0.5) { const c = OW.qat(q, 0.2 + R() * 0.6, 0.3 + R() * 0.5); g.globalAlpha = 0.35; g.fillStyle = '#0c1014'; g.fill(ell(c[0], c[1], 3, 1.6, undefined, -0.4)); g.fillStyle = '#c8d4e0'; g.fill(ell(c[0] - 1, c[1] - 1.4, 2.4, 0.8, undefined, -0.4)); }
  } else if (make === 'ox') {
    for (let i = 0; i < 5; i++) { g.globalAlpha = 0.6; g.fillStyle = '#c4a088'; const x = q[0][0] + R() * ww, y = q[0][1] + R() * hh; g.fill(poly([[x, y], [x + 2 + R() * 5, y + R() * 2], [x + R() * 3, y + 2 + R() * 3]])); }
    g.globalAlpha = 0.06; g.fillStyle = '#fff'; g.fillRect(q[0][0], q[0][1] + hh * 0.12, ww, hh * 0.06);
  } else if (make === 'walnut') {
    g.globalAlpha = 0.3; g.strokeStyle = '#1a0e12'; g.lineWidth = 0.7;
    for (let i = 0; i < 5; i++) { const y = q[0][1] + hh * (0.15 + i * 0.17); g.beginPath(); g.moveTo(q[0][0], y); g.bezierCurveTo(q[0][0] + ww * 0.3, y - 3, q[0][0] + ww * 0.6, y + 4, q[1][0], y + (R() - 0.5) * 4); g.stroke(); }
  } else if (make === 'archive') {
    g.globalAlpha = 0.5; g.fillStyle = mix(base, '#2a1e24', 0.4); g.fillRect(q[0][0], q[0][1] + hh * 0.72, ww, hh * 0.1);
    g.globalAlpha = 0.35; g.strokeStyle = '#2a1e24'; g.lineWidth = 0.7;
    g.beginPath(); g.moveTo(q[0][0] + ww * R(), q[0][1]); g.lineTo(q[0][0] + ww * R(), q[3][1]); g.stroke();
  } else {
    // kraft-faced oak: fibres and a soft crease or two
    g.globalAlpha = 0.18; g.strokeStyle = '#3a2830'; g.lineWidth = 0.6;
    for (let i = 0; i < 6; i++) { const x = q[0][0] + R() * ww, y = q[0][1] + R() * hh; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4 + R() * 10, y + (R() - 0.5) * 2); g.stroke(); }
    if (R() < 0.3) { g.globalAlpha = 0.1; g.strokeStyle = '#f0d8c8'; g.lineWidth = 0.9; const x = q[0][0] + ww * (0.1 + R() * 0.8); g.beginPath(); g.moveTo(x, q[0][1]); g.lineTo(x + (R() - 0.5) * 8, q[0][1] + hh * (0.3 + R() * 0.5)); g.stroke(); }
  }
  // water stains, tide marks and snow-damp at the bottom edge
  g.globalAlpha = 0.16; g.fillStyle = '#1e1220';
  if (R() < 0.5) g.fill(ell(q[0][0] + ww * R(), q[0][1] + hh * (0.4 + R() * 0.5), ww * (0.1 + R() * 0.2), hh * (0.1 + R() * 0.2)));
  g.globalAlpha = 0.3; g.fillRect(q[3][0], q[3][1] - hh * 0.08, ww, hh * 0.08);
  // bevels: the top edge catches the sky, the bottom catches the sand's warm bounce
  g.globalAlpha = 0.4; g.fillStyle = mix(base, '#a89ccc', 0.3); g.fill(poly([q[0], q[1], OW.qat(q, 1, 0.07), OW.qat(q, 0, 0.07)]));
  g.globalAlpha = 0.25 + w * 0.5; g.fillStyle = mix(base, '#ffb8a0', 0.2 + w * 0.35); g.fill(poly([OW.qat(q, 0, 0.94), OW.qat(q, 1, 0.94), q[2], q[3]]));
  g.globalAlpha = 1;
  lampLight(g);
  g.restore();
  ink(g, P, null, clamp(d.h / 40, 1.1, 1.9));
  drawHardware(g, d, q, R);
}

// label holder + card + pull (cup, bar, ring, knob, string)
function drawHardware(g, d, q, R) {
  const s = clamp(d.h / 70, 0.5, 1.4);
  // labels vary: most in a brass holder (centred or set to the left), some chalked straight on the
  // front, a few with a paper slip tucked in the gap
  const RH = rng(d.seed + 7), style = RH(), left = RH() < 0.35;
  const L = OW.qat(q, left ? 0.24 : 0.5, d.pull === 'string' ? 0.32 : 0.28 + RH() * 0.06);
  const lw = 18 * s * (d.w > 60 ? 1 : 0.8) * (0.8 + RH() * 0.45), lh = 9 * s;
  if (d.pull !== 'string' && style < 0.18) {
    g.strokeStyle = 'rgba(230,226,240,0.55)'; g.lineWidth = 1.1 * s;
    g.beginPath(); let x = L[0] - lw / 2; g.moveTo(x, L[1]);
    while (x < L[0] + lw / 2) { x += 2.6 * s; g.lineTo(x, L[1] + Math.sin(x * 1.7) * 1.6 * s); }
    g.stroke();
  } else if (d.pull !== 'string' && style < 0.3) {
    const a = (RH() - 0.5) * 0.3;
    g.save(); g.translate(q[0][0] + d.w * (0.15 + RH() * 0.6), q[0][1] + 1); g.rotate(a);
    ink(g, poly([[-5 * s, -6 * s], [5 * s, -5 * s], [4 * s, 3 * s], [-4 * s, 3 * s]]), '#d8ccb6', 0.7);
    g.restore();
  } else if (d.pull !== 'string') {
    // brass frame, cream card, a scrawl of ink
    ink(g, Drawn.rect(L[0] - lw / 2 - 1.5 * s, L[1] - lh / 2 - 1.2 * s, lw + 3 * s, lh + 2.4 * s), C.brass.base, 0.9);
    const lit = clamp(lampAt(L[0], L[1]) + OW.warmAt(L[1]) * 0.3, 0, 1);
    g.fillStyle = mix(mix('#7a7088', '#b4a8c8', 0.3), mix(C.tag.base, '#d8e0ff', 0.3), 0.35 + lit * 0.65); g.fillRect(L[0] - lw / 2, L[1] - lh / 2, lw, lh);
    g.strokeStyle = '#3a3048'; g.lineWidth = 0.7 * s; g.globalAlpha = 0.8;
    g.beginPath();
    let x = L[0] - lw / 2 + 2 * s;
    g.moveTo(x, L[1]);
    while (x < L[0] + lw / 2 - 3 * s) { x += 1.6 * s; g.lineTo(x, L[1] + (R() - 0.5) * 2.4 * s); }
    g.stroke(); g.globalAlpha = 1;
    g.fillStyle = C.brass.lit; g.fillRect(L[0] - lw / 2 - 1.5 * s, L[1] - lh / 2 - 1.2 * s, lw + 3 * s, 1);
  } else {
    // archive box: a handwritten label pasted on, a little askew
    const a = (R() - 0.5) * 0.12;
    g.save(); g.translate(L[0], L[1]); g.rotate(a);
    ink(g, Drawn.rect(-lw * 0.6, -lh * 0.6, lw * 1.2, lh * 1.2), mix(C.tag.base, '#b4a8c8', 0.3), 0.7);
    g.strokeStyle = '#3a3048'; g.lineWidth = 0.7 * s;
    g.beginPath(); g.moveTo(-lw * 0.4, 0); g.lineTo(lw * 0.35, (R() - 0.5) * 2); g.stroke();
    g.restore();
  }
  const H = OW.qat(q, 0.5, 0.66);
  d.handle = H; d.hs = s;
  if (d.pull === 'cup') {
    const p = new Path2D(); p.moveTo(H[0] - 9 * s, H[1] - 2 * s); p.quadraticCurveTo(H[0], H[1] + 8 * s, H[0] + 9 * s, H[1] - 2 * s); p.closePath();
    ink(g, p, C.brass.base, 1);
    g.fillStyle = C.brass.deep; g.fillRect(H[0] - 8 * s, H[1] - 2.5 * s, 16 * s, 1.4 * s);
    g.fillStyle = C.brass.lit; g.fill(ell(H[0] - 2 * s, H[1] + 2.4 * s, 3 * s, 1 * s));
  } else if (d.pull === 'bar') {
    ink(g, Drawn.rect(H[0] - 11 * s, H[1] - 1.6 * s, 22 * s, 3.4 * s), '#8a9894', 1);
    g.fillStyle = '#d4dcd6'; g.fillRect(H[0] - 10 * s, H[1] - 1.2 * s, 20 * s, 1);
  } else if (d.pull === 'ring') {
    g.lineWidth = 3.4 * s; g.strokeStyle = LINE; g.beginPath(); g.arc(H[0], H[1] + 3 * s, 5 * s, 0, TAU); g.stroke();
    g.lineWidth = 1.8 * s; g.strokeStyle = C.brass.base; g.stroke();
    ink(g, circ(H[0], H[1] - 2 * s, 2.4 * s), C.brass.lit, 0.8);
  } else if (d.pull === 'knob') {
    ink(g, circ(H[0], H[1], 4 * s), '#e8e2ec', 1);
    g.fillStyle = '#b0a8c4'; g.fill(circ(H[0] + 1 * s, H[1] + 1.2 * s, 2.4 * s));
    g.fillStyle = '#fff'; g.fill(circ(H[0] - 1.3 * s, H[1] - 1.3 * s, 1.1 * s));
  } else {
    g.lineWidth = 1.2; g.strokeStyle = '#d8ccb4';
    g.beginPath(); g.moveTo(H[0] - 3 * s, H[1]); g.quadraticCurveTo(H[0], H[1] + 9 * s, H[0] + 3 * s, H[1]); g.stroke();
    ink(g, circ(H[0], H[1], 2 * s), '#a08a70', 0.7);
  }
}

function drawDrawerClosed(g, d, R) {
  // the slot: a thin dark gap round every drawer
  g.fillStyle = '#120c16'; g.fill(qpath(OW.inset(d.q, -0.02, -0.04)));
  d.front = OW.inset(d.q, 0.015, 0.03);
  drawerFront(g, d, d.front, R);
}
OW.drawerFront = drawerFront;

// ------------------------------------------------------------ the foot, the arch, the cap
function drawFoot(g) {
  const SP = stackPath();
  const R = rng(3030);
  g.save(); g.clip(SP);
  // the tide mark: everything below it is wet, darker and glossier, crusted with barnacles
  const tm = (x) => 1156 + 14 * Math.sin(x * 0.02) + 8 * noise(x * 0.05);
  const wet = [[300, 1300]];
  for (let x = 300; x <= 1140; x += 10) wet.push([x, tm(x)]);
  wet.push([1140, 1300]);
  g.fillStyle = 'rgba(14,10,26,0.5)'; g.fill(poly(wet));
  g.fillStyle = grad(g, 0, 1150, 0, 1270, [[0, 'rgba(255,170,150,0)'], [1, 'rgba(255,170,150,0.12)']]);
  g.fill(poly(wet));
  for (let c = 0; c < 70; c++) {
    const cx = 250 + R() * 900, cy = tm(cx) + 6 + R() ** 0.8 * 100;
    for (let i = 0; i < 14; i++) {
      const x = cx + (R() - 0.5) * 22, y = cy + (R() - 0.5) * 9, r = 0.9 + R() * 1.6;
      g.globalAlpha = 0.45 + R() * 0.3;
      g.fillStyle = '#8e8498'; g.fill(ell(x, y, r, r * 0.8));
      g.fillStyle = '#d8ccd6'; g.fill(ell(x - r * 0.2, y - r * 0.3, r * 0.5, r * 0.3));
      g.fillStyle = '#241c2e'; g.fill(circ(x, y + r * 0.1, r * 0.25));
    }
  }
  // weed in the wet: dark wrack hanging in mats from the tide mark down
  for (let i = 0; i < 90; i++) {
    const x = 250 + R() * 900, y = tm(x) + 20 + R() * 70, l = 6 + R() * 16;
    g.globalAlpha = 0.7; g.fillStyle = R() < 0.5 ? '#2c2a22' : '#3a3626';
    g.fill(poly([[x - 3, y], [x + 3, y], [x + 1 + (R() - 0.5) * 4, y + l], [x - 1, y + l * 0.8]]));
  }
  g.globalAlpha = 1;
  g.restore();
}

// the arch is a tunnel through the foot: its far mouth sits smaller and nearer the vanishing
// point, so we see its left jamb and the underside of its vault between the two mouths
const archBack = () => {
  const P = OW.archPts, cx = 378, cy = 1190;
  return P.map(([x, y]) => [x + (720 - x) * 0.07 + (cx - x) * 0.12, y + (OW.HZ - y) * 0.05 + (cy - y) * 0.1]);
};
function drawArch(g) {
  const A = archPath(), B = curve(archBack());
  g.save(); g.clip(A);
  // the inner rock: shaded, warming toward the far mouth where the afterglow pours in
  g.fillStyle = grad(g, 300, 0, 452, 0, [[0, '#1a1424'], [0.5, '#2a1e30'], [1, '#3a2836']]);
  g.fill(A);
  g.fillStyle = radial(g, 380, 1200, 0, 120, [[0, 'rgba(255,170,150,0.55)'], [0.5, 'rgba(230,140,150,0.2)'], [1, 'rgba(200,120,150,0)']]);
  g.fill(A);
  // bedding seams running back through the tunnel
  g.strokeStyle = 'rgba(10,6,16,0.5)'; g.lineWidth = 1.2;
  for (const t of [0.25, 0.5, 0.75]) {
    const P = OW.archPts, Q = archBack(), i = Math.round(t * (P.length - 1));
    g.beginPath(); g.moveTo(P[i][0], P[i][1]); g.lineTo(Q[i][0], Q[i][1]); g.stroke();
  }
  g.restore();
  // a lit rim on the far mouth's edge, where the glow comes round it
  g.save(); g.clip(A);
  g.lineWidth = 5; g.strokeStyle = 'rgba(255,190,160,0.7)'; g.stroke(B);
  g.restore();
}
OW.archBack = archBack;

function drawCap(g) {
  // turf and peat on top, under a brow of snow; the brow overhangs on the left, where the bats are
  const R = rng(99);
  const top = OW.capPts;
  const turf = top.map(([x, y]) => [x, y - 3]).concat(top.slice().reverse().map(([x, y], i) => [x, y + 16 + 10 * Math.sin(i * 0.9) + R() * 8]));
  ink(g, poly(turf), '#2a2232', 2);
  // dead grass tufts standing out of the snow
  g.strokeStyle = '#8a7060'; g.lineWidth = 1.1;
  for (let i = 0; i < 70; i++) {
    const k = R(), j = Math.floor(k * (top.length - 1));
    const a = top[j], b = top[j + 1], x = lerp(a[0], b[0], R()), y = lerp(a[1], b[1], 0.5) - 2;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 2, y - 6, x + 3 + R() * 6, y - 8 - R() * 8); g.stroke();
  }
  // the snow: drifted — thick in the hollows of the top, thin over the bumps — with a blue
  // shaded lip where it curls over the edge, and the faintest rose where it faces the glow
  const snow = [], lip = [];
  for (let i = 0; i < top.length; i++) {
    const [x, y] = top[i], prev = top[Math.max(0, i - 1)], next = top[Math.min(top.length - 1, i + 1)];
    const hollow = clamp(((prev[1] + next[1]) / 2 - y) * 0.25 + 0.5, 0.2, 1.4);
    snow.push([x, y - 3 - hollow * 5 - R() * 3]);
    lip.push([x + 1, y + 2 + hollow * 6 + R() * 7 + (R() < 0.15 ? 6 : 0)]);
  }
  const SP = curve(snow.concat(lip.slice().reverse()));
  ink(g, SP, C.snowShade, 1.6);
  g.save(); g.clip(SP);
  g.fillStyle = C.snow; g.fill(curve(snow.map(([x, y]) => [x, y - 2]).concat(lip.slice().reverse().map(([x, y]) => [x, y - 5]))));
  g.fillStyle = 'rgba(255,200,190,0.35)'; g.fill(curve(snow.slice(0, 9).concat(snow.slice(0, 9).reverse().map(([x, y]) => [x, y + 5]))));
  g.restore();
  // icicles off the brow
  for (let i = 0; i < 14; i++) {
    // clustered where meltwater runs off the lip, a few long, most short
    const a = top[[1, 1, 2, 4, 4, 5, 9, 14, 15, 15, 20, 21, 2, 4][i]], x = a[0] + (R() - 0.5) * 9, y = a[1] + 10;
    const l = R() < 0.25 ? 14 + R() * 14 : 3 + R() * 7;
    ink(g, poly([[x - 1.6, y], [x + 1.6, y], [x, y + l]]), '#dde4ff', 0.7);
  }
}

// rose rim round the whole silhouette (it's backlit), strongest low down near the glow
function drawRim(g) {
  const SP = stackPath();
  g.save(); g.clip(SP);
  // the afterglow wraps the edges: a soft rose light inside the silhouette, strongest low down
  // where the glow is brightest, fading out up high where the sky behind is dark
  g.lineWidth = 10;
  g.strokeStyle = grad(g, 0, 160, 0, 1260, [[0, 'rgba(200,140,180,0)'], [0.45, 'rgba(230,140,150,0.12)'], [1, 'rgba(255,180,150,0.4)']]);
  g.stroke(SP);
  g.lineWidth = 3;
  g.strokeStyle = grad(g, 0, 160, 0, 1260, [[0, 'rgba(180,170,230,0.55)'], [0.35, 'rgba(200,160,200,0.4)'], [0.6, 'rgba(240,160,150,0.45)'], [1, 'rgba(255,200,170,0.75)']]);
  g.stroke(SP);
  g.restore();
  // snow on the ledges where the outline steps in
  const pts = OW.stackPtsRaw, R = rng(4);
  for (let i = 1; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
    if (y1 < 250 || y1 > 1150) continue;
    // a ledge: the outline goes inward going up (on the left, x increases going up; right, decreases)
    const left = x1 < 700;
    const step = left ? x1 - x0 : x0 - x1;
    if (step > 9 && Math.abs(y1 - y0) < 30) {
      const xa = left ? x0 : x1, xb = left ? x1 : x0, y = Math.min(y0, y1);
      ink(g, curve([[xa - 2, y + 2], [lerp(xa, xb, 0.3), y - 3], [lerp(xa, xb, 0.7), y - 2], [xb + 3, y + 1], [lerp(xa, xb, 0.5), y + 4]]), C.snow, 1.2, C.snowShade);
    }
  }
}

// ------------------------------------------------------------ the sprite
let SPR = null;
const BOX = { x: 300, y: 120, w: 860, h: 1170 };
OW.STACK_BOX = BOX;
onLayout(() => {
  LAMPS = OW.homeLamps ? OW.homeLamps() : [];
  SPR = sprite(BOX.x, BOX.y, BOX.w, BOX.h, (g) => {
    drawRock(g);
    g.save(); g.clip(stackPath()); lampLight(g, 0.4); g.restore();
    drawFoot(g);
    for (const cab of OW.cabinets) drawCabinet(g, cab);
    drawLedges(g);
    drawRim(g);
    drawArch(g);
    drawCap(g);
    // silhouette ink, heavy; then punch the arch out so the sky shows through
    g.lineWidth = 2.6; g.strokeStyle = grad(g, 0, 160, 0, 1260, [[0, LINE], [0.6, LINE], [1, '#5a3448']]); g.stroke(stackPath());
    // punch out the far mouth (inside the near one) so the sky shows through the tunnel
    g.save(); g.clip(archPath()); g.globalCompositeOperation = 'destination-out'; g.fill(curve(archBack())); g.restore();
    g.lineWidth = 2.6; g.strokeStyle = LINE; g.stroke(archPath());
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(36,25,46,0.7)'; g.save(); g.clip(archPath()); g.stroke(curve(archBack())); g.restore();
  });
});
OW.stackSprite = () => SPR;
const SP_HIT = new Path2D(); { const p = OW.stackPts; SP_HIT.moveTo(p[0][0], p[0][1]); for (const q of p) SP_HIT.lineTo(q[0], q[1]); SP_HIT.closePath(); }
const hitCtx = document.createElement('canvas').getContext('2d');
let shedT = 0;
layer({
  id: 'rock-shed', z: 11,
  hit(x, y) { return y < 1200 && hitCtx.isPointInPath(SP_HIT, x, y); },
  onEnter() { shedT = 0; },
  update(dt, t, L) {
    if (!L.hovered) return;
    shedT -= dt;
    if (shedT > 0) return;
    shedT = 0.9 + Math.random() * 0.8;
    // the nearest bed seam above the pointer lets go of a little snow and a chip of stone
    const x = Drawn.P.x, y = Drawn.P.y - 20 - Math.random() * 30;
    for (let i = 0; i < 6; i++) OW.spawn({ kind: 'snowclump', x: x + (Math.random() - 0.5) * 16, y, vx: (Math.random() - 0.5) * 20, vy: Math.random() * 20, life: 1.2, s: 0.8 + Math.random() * 1.4 });
    OW.spawn({ kind: 'pebble', x, y: y + 4, vx: (Math.random() - 0.5) * 30, vy: -20, life: 1.6, s: 1.6 + Math.random() });
  },
  draw() {},
});
layer({
  id: 'stack', z: 10,
  draw(g) { if (SPR) blit(g, SPR, OW.shake.x, OW.shake.y); },
});
})();
