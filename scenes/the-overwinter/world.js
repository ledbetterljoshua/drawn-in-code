/* world.js — the shared ground every part of The Overwinter stands on: the camera (horizon, the
   foreshortened drawer face), the palette by material, the cabinet-and-drawer layout of the cliff,
   and a few drawing helpers. Everything here is data and maths; nothing is drawn.

   Light: the sun is down behind the stack (we look west). The rose band sits on the horizon behind
   the base, so silhouettes take a rose rim; the face toward us is in cool shade, with warm bounce
   coming up off the wet sand and cold sky light coming down; hush lamps add blue pools. */
(() => {
const { clamp, lerp, rng } = Drawn;
const OW = (window.OW = {});
OW.W = 1200; OW.H = 1500;
OW.HZ = 1185;        // horizon: eye level, a man's height above the wet sand
OW.BASE = 1252;      // where the stack meets the sand, at its middle
OW.LINE = '#24192e'; // ink: a deep violet-plum
Drawn.style.line = OW.LINE;

// ------------------------------------------------------------ palette (by material)
OW.C = {
  ink: '#24192e',
  // card fronts: kraft, in cool shade; lit = warm bounce from below; blue = in a lamp pool
  kraft: { deep: '#3d2c3c', shade: '#5f4652', base: '#83646a', lit: '#b08a82', rose: '#d6a097', lilac: '#a99ac9', edge: '#c9a796' },
  // painted steel cabinets, municipal green gone grey
  steel: { deep: '#232a32', shade: '#353f45', base: '#4f5b5a', lit: '#78857f', rose: '#ad9a9c', lilac: '#8a90bc' },
  // oxblood lacquer, chipped
  ox: { deep: '#2a1620', shade: '#44262f', base: '#5e3a42', lit: '#875560', rose: '#b87c80', lilac: '#9480b0' },
  // dark walnut apothecary
  walnut: { deep: '#21151d', shade: '#3a2428', base: '#553634', lit: '#7a5246', rose: '#ae7a6e', lilac: '#8b7aa8' },
  // the carcass frames between drawers
  frame: { deep: '#1d1422', base: '#3a2a36', lit: '#6a4c56' },
  rock: { deep: '#1e1828', shade: '#2f2638', base: '#463a4c', lit: '#66566a', rim: '#d99a92', strata: '#3a3042', lichen: '#b48a52', wet: '#2a2434' },
  brass: { deep: '#5a3c1c', base: '#a27a3c', lit: '#e3c37a', glint: '#fff0c0' },
  ermine: { shade: '#b9b8d6', base: '#eceaf4', lit: '#ffffff', rose: '#f6dde0', blue: '#c8d8ff' },
  cap: { shade: '#8a1f2c', base: '#c3343c', lit: '#ec5a52', band: '#e8c070' },
  hush: { core: '#f4f8ff', paper: '#8fb4ff', glow: 'rgba(120,165,255,', pool: 'rgba(110,150,255,' },
  tag: { base: '#efe3c8', shade: '#c4b39a', string: '#d8cdb8', ring: '#b8433c' },
  snow: '#eef0fb', snowShade: '#b6b8dc',
  sky: { ink: '#191734', high: '#2b2a55', mid: '#5a4c7c', low: '#b77f98', rose: '#f0a49a', apricot: '#ffc99a', glow: '#ffe3bf' },
  sea: { far: '#4d4570', mid: '#2e2a4c', near: '#221f3a' },
  sand: { dry: '#a8949e', wet: '#5e5574', pale: '#cdb8b8', dark: '#3e3754', foam: '#e9e2f0' },
};

// ------------------------------------------------------------ the stack's outline
// silhouette (clockwise from the bottom left), lean a touch to the left, narrowing upward
OW.stackPts = [
  [236, 1268], [246, 1222], [262, 1164], [256, 1124], [280, 1084], [318, 1060], [370, 1044], [418, 1028],
  [432, 1004], [426, 984], [440, 944], [446, 884], [428, 866], [446, 846], [454, 790], [452, 730],
  [462, 700], [466, 648], [450, 626], [438, 600], [446, 566], [462, 548], [468, 500], [476, 440],
  [468, 404], [478, 360], [474, 342], [456, 338], [430, 340], [404, 334], [384, 322], [370, 300],
  [368, 280], [404, 250], [432, 238], [468, 226], [500, 216], [530, 220], [560, 206], [592, 200],
  [626, 190], [652, 192], [682, 180], [712, 182], [742, 174], [772, 180], [804, 176], [824, 166],
  [838, 146], [852, 130], [868, 126], [880, 140], [886, 166], [904, 188], [926, 206], [942, 228],
  [934, 250], [944, 264], [930, 302], [938, 362], [948, 420], [940, 446], [956, 472], [962, 540],
  [970, 600], [984, 660], [978, 690], [996, 722], [1004, 790], [1012, 858], [1004, 880], [1024, 902],
  [1036, 960], [1056, 996], [1048, 1030], [1058, 1090], [1072, 1140], [1090, 1186], [1114, 1226], [1138, 1268],
];
{
  const Rj = rng(271), src = OW.stackPts, out = [];
  for (let i = 0; i < src.length - 1; i++) {
    const [x0, y0] = src[i], [x1, y1] = src[i + 1];
    out.push([x0, y0]);
    const len = Math.hypot(x1 - x0, y1 - y0), n = Math.floor(len / 11);
    const nx = -(y1 - y0) / len, ny = (x1 - x0) / len;
    for (let k = 1; k < n; k++) {
      const t = k / n, j = (Rj() - 0.5) * (y0 > 1240 && y1 > 1240 ? 0 : 5.5);
      out.push([lerp(x0, x1, t) + nx * j, lerp(y0, y1, t) + ny * j]);
    }
  }
  out.push(src[src.length - 1]);
  OW.stackPtsRaw = src;
  OW.capPts = src.slice(31, 57);
  OW.stackPts = out;
}
// the natural arch through the stack's left foot; the causeway runs into it, reception is inside
OW.archPts = [[300, 1274], [302, 1222], [312, 1172], [334, 1130], [366, 1108], [402, 1108], [430, 1128], [446, 1166], [452, 1218], [452, 1274]];

// ------------------------------------------------------------ the drawer face (the camera)
// The face is a plane we look up at. v (0 bottom → 1 top) maps to y with foreshortening, so the
// lowest drawers are ~3× the height of the highest; u (0 → 1) runs between the face's edges,
// which converge upward, so a cabinet's sides lean in a little the higher it sits.
OW.FB = 1238; OW.FT = 236;
const FA = 1.25; // foreshortening strength
OW.vy = (v) => OW.FB - (OW.FB - OW.FT) * (1 - Math.exp(-FA * v)) / (1 - Math.exp(-FA));
OW.yv = (y) => -Math.log(1 - ((OW.FB - y) / (OW.FB - OW.FT)) * (1 - Math.exp(-FA))) / FA;
const XL0 = 452, XL1 = 506, XR0 = 1048, XR1 = 924;
OW.fx = (u, y) => { const k = (OW.FB - y) / (OW.FB - OW.FT); return lerp(lerp(XL0, XL1, k), lerp(XR0, XR1, k), u); };
// The face also wraps round the stack like a drum (θ across). Seen from below, the sides are
// farther away, so above eye level every horizontal arcs down toward the edges and the cabinets
// there narrow; at eye level the arc flattens out.
const TH = 1.0, RZ = 0.11; // half-angle of the face (rad), drum radius / distance
const zf = (th) => 1 / (1 + RZ * (1 - Math.cos(th)));
const ZE = zf(TH), SE = Math.sin(TH) * ZE;
OW.at = (u, v) => {
  const y0 = OW.vy(v), th = (u - 0.5) * 2 * TH, z = zf(th);
  const xl = OW.fx(0, y0), xr = OW.fx(1, y0), xc = (xl + xr) / 2, hw = (xr - xl) / 2;
  return [xc + hw * (Math.sin(th) * z) / SE, OW.HZ - (OW.HZ - y0) * z / ZE * (ZE + (1 - ZE) * 0.35)];
};
OW.facing = (u) => Math.cos((u - 0.5) * 2 * TH); // 1 square on to us, less toward the edges
// the bedding dips to the right; cabinets step down with it (applied per cabinet, so each stays level)
OW.TILT = 46;
OW.dip = (u, v) => (u - 0.5) * OW.TILT * (1 - v * 0.6);
// a (u,v) rectangle → its four screen corners (tl, tr, br, bl)
OW.quadUV = (u0, v0, u1, v1) => [OW.at(u0, v1), OW.at(u1, v1), OW.at(u1, v0), OW.at(u0, v0)];

// the hand-placed bones of the layout; the rest is grown from a seeded rng around them
const R = rng(1931);
const rr = (a, b) => a + (b - a) * R();
const pick = (arr) => arr[Math.floor(R() * arr.length)];

// cabinets, hand-placed: [u0, u1, v0, v1, make, rows, cols, depth]. depth > 0 stands proud of the
// rock (its underside shows, we're below it), < 0 is sunk into an alcove. Above v ≈ 0.74 the face
// dissolves into rock texture. Sizes vary wildly on purpose, and rock shows between them.
OW.TEXTURE_V = 0.74;
const MAKES = {
  oak: { tone: 'kraft', fr: 0.011, pull: 'cup' },
  steel: { tone: 'steel', fr: 0.007, pull: 'bar' },
  ox: { tone: 'ox', fr: 0.009, pull: 'ring' },
  walnut: { tone: 'walnut', fr: 0.01, pull: 'knob' },
  archive: { tone: 'kraft', fr: 0.004, pull: 'string' },
};
// [u0, u1, v0, v1, make, cols, depth]; rows are worked out so drawers come out wider than tall
const PLAN = [
  // the foot (eye level, the biggest). u < 0.19 at the bottom is bare rock and weed: a quiet patch
  [0.2, 0.43, 0.0, 0.15, 'oak', 1, 1], [0.448, 0.6, 0.0, 0.138, 'steel', 1, 1],
  [0.615, 0.7, 0.012, 0.118, 'walnut', 1, -1], [0.716, 0.985, 0.0, 0.082, 'bear', 1, 1],
  [0.03, 0.18, 0.14, 0.27, 'archive', 1, 1], [0.205, 0.42, 0.168, 0.288, 'oak', 1, 1],
  [0.452, 0.64, 0.152, 0.226, 'ox', 2, -1], [0.66, 0.74, 0.128, 0.262, 'steel', 1, 1],
  [0.758, 0.96, 0.1, 0.29, 'oak', 1, 1], [0.455, 0.63, 0.236, 0.29, 'archive', 1, 1],
  // the focal band: the big oak cabinet left of centre
  [0.025, 0.196, 0.3, 0.418, 'walnut', 1, -1], [0.214, 0.39, 0.306, 0.432, 'oak', 1, 1],
  [0.408, 0.49, 0.3, 0.445, 'archive', 1, 1], [0.51, 0.73, 0.302, 0.396, 'steel', 2, 1],
  [0.758, 0.9, 0.318, 0.44, 'ox', 1, -1],
  [0.06, 0.17, 0.46, 0.556, 'ox', 1, 1], [0.188, 0.37, 0.462, 0.58, 'oak', 1, 1],
  [0.4, 0.6, 0.474, 0.566, 'walnut', 2, -1], [0.628, 0.72, 0.452, 0.52, 'oak', 1, 1],
  [0.745, 0.92, 0.48, 0.598, 'steel', 1, 1],
  [0.13, 0.3, 0.612, 0.7, 'steel', 1, 1], [0.33, 0.476, 0.604, 0.68, 'ox', 1, -1],
  [0.5, 0.7, 0.622, 0.722, 'oak', 2, 1], [0.74, 0.86, 0.632, 0.69, 'archive', 1, 1],
];
OW.cabinets = [];
OW.drawers = [];
for (const [u0, u1, v0, v1, makeName, cols, depth] of PLAN) {
  const bear = makeName === 'bear';
  const make = bear ? MAKES.oak : MAKES[makeName];
  const j = () => (R() - 0.5) * 0.006;
  const cab = {
    i: OW.cabinets.length, make: bear ? 'oak' : makeName, tone: make.tone, pull: make.pull, fr: make.fr, depth,
    u0: u0 + j(), u1: u1 + j(), v0, v1, lean: (R() - 0.5) * (v0 > 0.5 ? 0.03 : 0.05), seed: Math.floor(R() * 1e6), drawers: [],
  };
  OW.cabinets.push(cab);
  // rows: as many as make each drawer ~1.4–2.1× as wide as it is tall, on screen
  const yA = OW.vy(v0), yB = OW.vy(v1), wpx = OW.fx(u1, (yA + yB) / 2) - OW.fx(u0, (yA + yB) / 2);
  const aspect = bear ? 1.2 : 1.25 + R() * 0.6;
  const rows = clamp(Math.round(((yA - yB) * aspect * cols) / wpx), 1, 5);
  cab.rows = rows;
  const fr = cab.fr, gap = fr * 0.6;
  // rows aren't equal: the bottom row of a cabinet tends to be the deepest
  const wts = Array.from({ length: rows }, (_, r) => (r === 0 && rows > 1 ? 1.25 : 1) * (0.9 + R() * 0.2));
  const tot = wts.reduce((a, b) => a + b, 0);
  let acc = 0;
  for (let r = 0; r < rows; r++) {
    const a = acc / tot, b = (acc += wts[r]) / tot;
    for (let c = 0; c < cols; c++) {
      const dv0 = lerp(cab.v0 + fr, cab.v1 - fr, a) + (r ? gap / 2 : 0);
      const dv1 = lerp(cab.v0 + fr, cab.v1 - fr, b) - (r < rows - 1 ? gap / 2 : 0);
      const du0 = lerp(cab.u0 + fr, cab.u1 - fr, c / cols) + (c ? gap / 2 : 0);
      const du1 = lerp(cab.u0 + fr, cab.u1 - fr, (c + 1) / cols) - (c < cols - 1 ? gap / 2 : 0);
      const d = { i: OW.drawers.length, cab, row: r, col: c, u0: du0, u1: du1, v0: dv0, v1: dv1, tone: cab.tone, pull: cab.pull, seed: Math.floor(R() * 1e6), bear };
      OW.drawers.push(d);
      cab.drawers.push(d);
    }
  }
}

// screen geometry for each drawer (plus the cabinet lean applied as a shear about its middle)
function place(d) {
  const lean = d.cab.lean;
  const q = OW.quadUV(d.u0, d.v0, d.u1, d.v1);
  const cy = OW.vy((d.cab.v0 + d.cab.v1) / 2), dy = d.cab.dy;
  for (const p of q) { p[0] += (p[1] - cy) * lean; p[1] += dy; }
  d.q = q;
  d.x0 = Math.min(q[0][0], q[3][0]); d.x1 = Math.max(q[1][0], q[2][0]);
  d.y0 = q[0][1]; d.y1 = q[3][1];
  d.w = d.x1 - d.x0; d.h = d.y1 - d.y0;
  d.cx = (d.x0 + d.x1) / 2; d.cy = (d.y0 + d.y1) / 2;
}
for (const c of OW.cabinets) {
  const q = OW.quadUV(c.u0, c.v0, c.u1, c.v1);
  const cy = OW.vy((c.v0 + c.v1) / 2);
  c.dy = OW.dip((c.u0 + c.u1) / 2, (c.v0 + c.v1) / 2);
  for (const p of q) { p[0] += (p[1] - cy) * c.lean; p[1] += c.dy; }
  c.q = q;
}
OW.drawers.forEach(place);

// rails: brass tubes along some tier tops, the ladders' top hooks ride them
// [v, u0, u1]: segments, not full-width lines; they ride brackets past the rock bulges
OW.rails = [[0.158, 0.4, 0.8], [0.298, 0.6, 0.93], [0.447, 0.08, 0.6], [0.6, 0.08, 0.72]].map(([v, u0, u1], i) => {
  const pts = [];
  for (let k = 0; k <= 24; k++) pts.push(OW.at(lerp(u0, u1, k / 24), v));
  return { i, v, u0, u1, pts, y: OW.at(0.5, v)[1], x0: pts[0][0], x1: pts[24][0] };
});

// ------------------------------------------------------------ small shared helpers
OW.R = rng;
OW.qpath = (q, p = new Path2D()) => { p.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length; i++) p.lineTo(q[i][0], q[i][1]); p.closePath(); return p; };
// inset a quad toward its centre (by fractions of width and height)
OW.inset = (q, ix, iy) => {
  const cx = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, cy = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4;
  return q.map(([x, y]) => [x + (cx - x) * ix, y + (cy - y) * iy]);
};
// bilinear point inside a quad: (s across, t down)
OW.qat = (q, s, t) => {
  const top = [lerp(q[0][0], q[1][0], s), lerp(q[0][1], q[1][1], s)];
  const bot = [lerp(q[3][0], q[2][0], s), lerp(q[3][1], q[2][1], s)];
  return [lerp(top[0], bot[0], t), lerp(top[1], bot[1], t)];
};
OW.mix = (a, b, t) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const r = Math.round(lerp(pa >> 16, pb >> 16, t)), g = Math.round(lerp((pa >> 8) & 255, (pb >> 8) & 255, t)), bl = Math.round(lerp(pa & 255, pb & 255, t));
  return '#' + ((1 << 24) | (r << 16) | (g << 8) | bl).toString(16).slice(1);
};
// how warm the bounce off the sand is at height y (1 at the foot, ~0 two-thirds up)
OW.warmAt = (y) => clamp((y - 700) / (OW.BASE - 700), 0, 1) ** 1.8;
OW.shake = { x: 0, y: 0, amt: 0 };
// lamps that hang on the face all night (x, y, strength); the porters carry the rest
OW.FIXED_LAMPS = [[548, 948, 0.8], [918, 880, 0.65], [804, 1082, 0.8]]; // the stack shudders when the bear cub wakes
OW.bus = {};
OW.on = (n, f) => (OW.bus[n] = OW.bus[n] || []).push(f);
OW.emit = (n, d) => (OW.bus[n] || []).forEach((f) => f(d));
OW.pick = pick; OW.rr = rr;
})();
