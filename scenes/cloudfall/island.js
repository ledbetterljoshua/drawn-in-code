/* island.js — the island itself and the little rock beside it.

   The rock under the island is built, not painted: an inverted cone of rough bands, each band a
   ring of flat facets. Every facet is shaded by its own normal against the one sun, so the right
   side catches the light, the front turns away into cool shade, and the downward-facing facets
   take a warm bounce off the cloud floor. Each band is set back under the lip of the one above
   (a dark line of shadow at every overhang) except where a ledge juts out and grows moss.

   z15 rock (still) · z15.5 roots and trailing vines (sway in the breeze; hover and they swing
   with the pointer) · z15.6 crystals (twinkle; hover and they chime with sparks) · z15.7 the round
   door (linger and a hedgehog peeks out) · z16 the turf and grass top (still) · z13 stones
   floating under the island (wave through them and they drift apart) · z10–12 the little rock,
   its rope bridge (it bounces, its lanterns swing) and the fisher (linger and the catch comes up). */
(() => {
const D = Drawn, { TAU, clamp, lerp, ease, rng, noise, hash, wind, circ, ell, poly, curve, ink, grad, radial, tube, st, P, layer } = D;
const { pr, mix, rgba, tone, lit, M, frog, spawn, plane, on } = CF;

// ------------------------------------------------------------------ a rock, as data
// rim(a) → plan [X, Z] of the top edge at angle a (0 = right, π/2 = toward us). bands: depth and
// how much of the rim's radius is left at that depth.
function makeRock({ rim, bands, tip, seed, ox = 0, oy = 0, oz = 0, ledges = [], scale = 1 }) {
  const R = rng(seed), cells = [], th0 = 0, th1 = Math.PI;
  const inset = (b, a) => {
    if (b === 0) return 1;
    let f = 0.95;
    for (const L of ledges) if (L.b === b) f = Math.max(f, lerp(0.95, 1.045, clamp(1 - Math.abs(a - L.a) / L.w, 0, 1) ** 0.6));
    return f;
  };
  const vtx = (a, Y, k, j) => {
    const [rx, rz] = rim(a);
    return [ox + rx * k + tip[0] * (1 - k) + j[0], oy + Y + j[1], oz + rz * k + tip[1] * (1 - k) + j[2]];
  };
  for (let b = 0; b < bands.length - 1; b++) {
    const n = Math.max(5, Math.round((9 + (b < 3 ? 3 : 0) - b * 0.6) * (scale > 0.5 ? 1 : 0.7)));
    const ths = [];
    const shift = (hash(seed + b * 3.1) - 0.5) * 0.6;
    for (let j = 0; j <= n; j++) {
      const u = j === 0 ? 0 : j === n ? 1 : (j + shift + (hash(seed + b * 17 + j * 3.3) - 0.5) * 0.7) / n;
      ths.push(lerp(th0, th1, clamp(u, 0, 1)));
    }
    const top = [], bot = [], mid = [];
    for (let j = 0; j <= n; j++) {
      const a = ths[j], jt = b === 0 ? [0, 0, 0] : [(R() - 0.5) * 10 * scale * bands[b].k, (R() - 0.5) * 8 * scale, (R() - 0.5) * 8 * scale * bands[b].k];
      const jb = [(R() - 0.5) * 12 * scale * bands[b + 1].k, (R() - 0.5) * 10 * scale, (R() - 0.5) * 9 * scale * bands[b + 1].k];
      top.push(vtx(a, bands[b].y * scale, bands[b].k * inset(b, a), jt));
      bot.push(vtx(a, bands[b + 1].y * scale, bands[b + 1].k, jb));
      mid.push([(R() - 0.5) * 9 * scale, (R() - 0.5) * 6 * scale]);
    }
    for (let j = 0; j < n; j++) {
      const p = [top[j], top[j + 1], bot[j + 1], bot[j]];
      const e1 = [p[1][0] - p[0][0], p[1][1] - p[0][1], p[1][2] - p[0][2]];
      const e2 = [p[3][0] - p[0][0], p[3][1] - p[0][1], p[3][2] - p[0][2]];
      const e3 = [p[2][0] - p[1][0], p[2][1] - p[1][1], p[2][2] - p[1][2]];
      let nrm = CF.cross(e1, e2);
      if (Math.hypot(...nrm) < 1e-3) nrm = CF.cross(e1, e3);
      const cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4 - ox, cz = (p[0][2] + p[1][2] + p[2][2] + p[3][2]) / 4 - oz;
      if (nrm[0] * cx + nrm[2] * cz < 0) nrm = nrm.map((x) => -x);
      nrm = CF.norm(nrm);
      const facing = nrm[1] * CF.CAM.S + nrm[2] * CF.CAM.C;
      cells.push({ b, j, p, nrm, facing, cz, m0: mid[j], m1: mid[j + 1], seed: seed + b * 100 + j });
    }
  }
  cells.sort((A, B) => B.b - A.b || A.cz - B.cz);
  return { cells, rim, bands, ox, oy, oz, ledges, scale, inset };
}
// the facet as a path on the artboard, its vertical edges kinked at the middle
function cellPath(c) {
  const s = c.p.map((q) => pr(...q));
  const m1 = [(s[1][0] + s[2][0]) / 2 + c.m1[0], (s[1][1] + s[2][1]) / 2 + c.m1[1]];
  const m0 = [(s[0][0] + s[3][0]) / 2 + c.m0[0], (s[0][1] + s[3][1]) / 2 + c.m0[1]];
  c.s = s;
  return poly([s[0], s[1], m1, s[2], s[3], m0]);
}
function drawRock(g, rock, o = {}) {
  const mat = o.mat || M.rock, vis = rock.cells.filter((c) => c.facing > -0.05);
  const paths = vis.map((c) => (c.path = cellPath(c)));
  // the silhouette: every facet stroked wide in ink first, then filled over
  g.lineJoin = 'round';
  g.lineWidth = (o.lw || 2.6) * 2; g.strokeStyle = mat.line;
  for (const p of paths) g.stroke(p);
  for (const c of vis) {
    // the rock's own light curve: the sun side really catches, the shade side really turns away
    const n = c.nrm, b0 = lit(n), b = clamp((b0 - 0.1) * 1.45 + 0.04, 0, 1), down = Math.max(0, -n[1]);
    let col = tone(mat, b);
    col = mix(col, mat.bounce || mat.base, clamp(down * 0.9 - b * 0.4, 0, 0.45));
    // deeper bands sit further from the sky: a touch cooler and darker
    col = mix(col, mat.shade, clamp(c.b * 0.035, 0, 0.2));
    // no two slabs quite alike: some ochre, some plum, some paler
    const hv = hash(c.seed * 1.7); col = mix(col, hv < 0.33 ? '#c9875a' : hv < 0.66 ? '#6a3a62' : '#d8b0a8', 0.08 + hash(c.seed * 3.1) * 0.12);
    g.fillStyle = col; g.fill(c.path);
    g.save(); g.clip(c.path);
    const [p0, p1, p2, p3] = c.s, r = rng(c.seed);
    // the overhang above throws a band of shadow across the top of the facet
    const topY = Math.min(p0[1], p1[1]), sh = (c.b === 0 ? 26 : 9) * rock.scale;
    g.save(); g.globalCompositeOperation = 'multiply';
    g.fillStyle = grad(g, 0, topY - 4, 0, topY + sh, [[0, 'rgba(60,40,110,0.75)'], [0.5, 'rgba(90,70,140,0.3)'], [1, 'rgba(120,100,160,0)']]);
    g.fillRect(Math.min(p0[0], p3[0]) - 40, topY - 10, Math.abs(p1[0] - p0[0]) + 80, sh + 14);
    g.restore();
    // a crack running down from the top edge on some facets
    if (r() < 0.4) {
      const u = 0.25 + r() * 0.5;
      let x = lerp(p0[0], p1[0], u), y = lerp(p0[1], p1[1], u);
      const pth = new Path2D(); pth.moveTo(x, y);
      const len = 3 + ((r() * 4) | 0);
      for (let k = 0; k < len; k++) { x += (r() - 0.5) * 9 * rock.scale; y += (6 + r() * 8) * rock.scale; pth.lineTo(x, y); }
      g.lineWidth = 1.4 * Math.max(0.6, rock.scale); g.strokeStyle = rgba(mat.line, 0.5); g.stroke(pth);
    }
    // chips and pits
    for (let k = 0; k < 5; k++) {
      const u = r(), v = r(), x = lerp(lerp(p0[0], p1[0], u), lerp(p3[0], p2[0], u), v), y = lerp(lerp(p0[1], p1[1], u), lerp(p3[1], p2[1], u), v);
      g.fillStyle = rgba(r() < 0.5 ? mat.line : mat.lit, 0.25); g.fill(ell(x, y, (1.5 + r() * 2.5) * rock.scale, (1 + r() * 1.5) * rock.scale));
    }
    g.restore();
    // a lit chamfer where the facet's top edge turns toward the sun
    if (b > 0.5) {
      g.lineWidth = 2 * Math.max(0.6, rock.scale); g.strokeStyle = rgba(mat.lit, clamp((b - 0.5) * 1.6, 0, 0.8));
      g.beginPath(); g.moveTo(lerp(p0[0], p1[0], 0.06), lerp(p0[1], p1[1], 0.06) + 1.5); g.lineTo(lerp(p0[0], p1[0], 0.94), lerp(p0[1], p1[1], 0.94) + 1.5); g.stroke();
    }
    // the facet's edges, thin
    g.lineWidth = 1.2 * Math.max(0.7, rock.scale); g.strokeStyle = rgba(mat.line, 0.55); g.stroke(c.path);
  }
  // each band's lower lip, a little heavier: it reads as the overhang's edge
  for (const c of vis) {
    if (c.b === 0) continue;
    const [p0, p1] = c.s;
    g.lineWidth = 1.8 * Math.max(0.7, rock.scale); g.strokeStyle = rgba(mat.line, 0.7);
    g.beginPath(); g.moveTo(...p0); g.lineTo(...p1); g.stroke();
  }
  // mossy ledges where a band juts out
  for (const L of rock.ledges) drawLedge(g, rock, L);
}
function drawLedge(g, rock, L) {
  const b = L.b, outer = [], inner = [];
  for (let i = 0; i <= 24; i++) {
    const a = L.a - L.w + (i / 24) * L.w * 2;
    const f = rock.inset(b, a);
    if (f <= 1.0) continue;
    const [rx, rz] = rock.rim(a), k = rock.bands[b].k, y = rock.oy + rock.bands[b].y * rock.scale;
    outer.push(pr(rock.ox + rx * k * f, y, rock.oz + rz * k * f));
    inner.push(pr(rock.ox + rx * k * 0.985, y + 2, rock.oz + rz * k * 0.985));
  }
  if (outer.length < 3) return;
  const p = curve(outer.concat(inner.reverse()), true);
  ink(g, p, tone(M.grass, 0.55), 1.6, M.grass.line);
  // moss tufts and a few drips over the edge
  const r = rng(b * 31);
  for (let i = 1; i < outer.length - 1; i += 1) {
    const [x, y] = outer[i];
    ink(g, ell(x, y - 1, 5 + r() * 4, 3, undefined, (r() - 0.5) * 0.4), r() < 0.5 ? tone(M.grass, 0.7) : tone(M.grass, 0.4), 1.1, M.grass.line);
    if (r() < 0.35) { g.lineWidth = 2; g.strokeStyle = tone(M.grass, 0.35); g.beginPath(); g.moveTo(x, y + 2); g.quadraticCurveTo(x + 2, y + 8, x, y + 10 + r() * 10); g.stroke(); }
  }
}
CF.makeRock = makeRock; CF.drawRock = drawRock;

// ------------------------------------------------------------------ the island
const RX = 420, RZ = 292;
const rimK = (a) => {
  let k = 1 + 0.05 * noise(a * 2.3 + 3) + 0.028 * noise(a * 6.1 + 11);
  k -= 0.055 * Math.exp(-(((a - 0.42) / 0.07) ** 2)); // where the brook cuts the edge
  return k;
};
const rim = (CF.rim = (a) => { const k = rimK(a); return [RX * Math.cos(a) * k, RZ * Math.sin(a) * k]; });
CF.RX = RX; CF.RZ = RZ;
// is a plan point on the island's top?
CF.onTop = (X, Z) => { const a = Math.atan2(Z / RZ, X / RX), [rx, rz] = rim(a); return (X / rx) ** 2 + (Z / rz) ** 2 < 1 && Math.hypot(X / RX, Z / RZ) < rimK(a); };
const BANDS = [
  { y: -16, k: 0.985 }, { y: -88, k: 0.92 }, { y: -140, k: 0.82 }, { y: -238, k: 0.62 },
  { y: -290, k: 0.5 }, { y: -372, k: 0.27 }, { y: -418, k: 0.13 }, { y: -450, k: 0 },
];
const ISLE = (CF.ISLE = makeRock({ rim, bands: BANDS, tip: [40, 30], seed: 71, ledges: [{ b: 2, a: 0.95, w: 0.55 }, { b: 4, a: 2.3, w: 0.45 }, { b: 1, a: 2.75, w: 0.3 }] }));
for (const c of ISLE.cells) cellPath(c);
layer({
  id: 'rock', z: 15, still: true,
  draw(g) {
    drawRock(g, ISLE, { lw: 2.8 });
    // strata: courses of rock at (nearly) level heights, carried round the cone so they bow with
    // its curve; they dip a little to the left, and break off where the stone is weathered
    g.save();
    const silS = new Path2D(); for (const c of ISLE.cells) if (c.facing > -0.05) silS.addPath(c.path);
    g.clip(silS);
    const kAt = (Y) => { for (let b = 0; b < BANDS.length - 1; b++) if (Y <= BANDS[b].y && Y >= BANDS[b + 1].y) { const f = (BANDS[b].y - Y) / (BANDS[b].y - BANDS[b + 1].y); return lerp(BANDS[b].k * (b ? 0.95 : 1), BANDS[b + 1].k, f); } return 0; };
    const rs = rng(23);
    for (let Y0 = -34; Y0 > -420; Y0 -= 14 + rs() * 20) {
      const pts = [];
      for (let a = 0.02; a < Math.PI - 0.02; a += 0.035) {
        const Y = Y0 + 12 * Math.cos(a) + noise(a * 4 + Y0) * 4, k = kAt(Y) * 1.004, [rx, rz] = rim(a);
        pts.push([pr(rx * k + 40 * (1 - k), Y, rz * k + 30 * (1 - k)), Math.cos(a), noise(a * 5 + Y0 * 0.3)]);
      }
      for (let i = 0; i < pts.length - 1; i++) {
        if (pts[i][2] < -0.4) continue;
        const [[x0, y0], lt] = pts[i], [[x1, y1]] = pts[i + 1];
        g.lineWidth = 1.8; g.strokeStyle = rgba(M.rock.line, 0.5); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        if (lt > 0.1) { g.lineWidth = 1.4; g.strokeStyle = rgba(M.rock.lit, 0.6 * lt); g.beginPath(); g.moveTo(x0, y0 + 2); g.lineTo(x1, y1 + 2); g.stroke(); }
      }
    }
    // ferns rooted in the cracks where the seep keeps them wet
    const fern = (x, y, s, dir) => {
      for (let k = 0; k < 4; k++) {
        const a = -1.9 + k * 0.45 * dir + (dir < 0 ? 0.5 : -0.5), len = (14 + k * 3) * s, ex = x + Math.cos(a) * len, ey = y + Math.sin(a) * len * 0.6 + len * 0.35;
        const p = D.quad(x, y, x + Math.cos(a) * len * 0.5, y + Math.sin(a) * len * 0.6 - 4, ex, ey);
        g.lineWidth = 1.2; g.strokeStyle = '#3f6a40'; g.stroke(p);
        for (let q = 1; q < 6; q++) { const u = q / 6, px = lerp(lerp(x, x + Math.cos(a) * len * 0.5, u), lerp(x + Math.cos(a) * len * 0.5, ex, u), u), py = lerp(lerp(y, y + Math.sin(a) * len * 0.6 - 4, u), lerp(y + Math.sin(a) * len * 0.6 - 4, ey, u), u); ink(g, ell(px, py + 1.5, 2.6 * s * (1 - u * 0.5), 1.2 * s, undefined, a + 1.2), q % 2 ? '#6fae55' : '#5a9a4e', 0.6, '#24392c'); }
      }
    };
    for (const c of ISLE.cells.filter((c) => c.b >= 1 && c.b <= 3 && c.facing > 0.4).filter((c, i) => i % 4 === 1)) {
      const [x, y] = c.s[0], [x1, y1] = c.s[1];
      fern((x + x1) / 2, (y + y1) / 2 + 3, 0.8 + hash(c.seed) * 0.4, hash(c.seed * 2) < 0.5 ? 1 : -1);
    }
    // the cloud floor bounces a pink light up into the underside, strongest at the shaded left
    g.save(); g.globalCompositeOperation = 'screen';
    const [tipx, tipy] = pr(40, -450, 30);
    g.fillStyle = radial(g, tipx - 160, tipy + 40, 0, 330, [[0, 'rgba(214,130,150,0.38)'], [1, 'rgba(214,130,150,0)']]);
    g.fillRect(tipx - 520, tipy - 420, 900, 520);
    g.restore();
    g.restore();
    // the warm rim of sun down the right edge of the whole rock, and the big form over the facets
    g.save();
    const sil = new Path2D(); for (const c of ISLE.cells) if (c.facing > -0.05) sil.addPath(c.path);
    g.clip(sil);
    g.save(); g.globalCompositeOperation = 'multiply';
    g.fillStyle = grad(g, CF.CAM.cx - 420, 0, CF.CAM.cx + 420, 0, ['rgba(90,80,160,0.55)', 'rgba(160,140,200,0.2)', 'rgba(255,255,255,0)']); g.fillRect(CF.CAM.cx - 430, 630, 870, 460);
    g.fillStyle = grad(g, 0, 660, 0, 1090, ['rgba(255,255,255,0)', 'rgba(120,90,150,0.3)']); g.fillRect(CF.CAM.cx - 430, 630, 870, 460);
    g.restore();
    g.lineWidth = 10; g.strokeStyle = grad(g, CF.CAM.cx + 140, 0, CF.CAM.cx + 440, 0, ['rgba(255,214,150,0)', 'rgba(255,214,150,0.6)']);
    for (const c of ISLE.cells) if (c.facing > -0.05 && c.nrm[0] > 0.6) g.stroke(c.path);
    g.restore();
    // the turf lip: a band of dark soil and roots under the grass, all along the front edge
    const T = [], B = [];
    for (let i = 0; i <= 120; i++) {
      const a = (i / 120) * Math.PI, [x, z] = rim(a);
      T.push(pr(x, 0, z)); B.push(pr(x * 0.985, -16, z * 0.985));
    }
    const lip = poly(T.concat(B.slice().reverse()));
    g.lineWidth = 5; g.strokeStyle = M.soil.line; g.stroke(lip);
    g.fillStyle = grad(g, CF.CAM.cx - 420, 0, CF.CAM.cx + 420, 0, [M.soil.shade, M.soil.base, M.soil.lit]); g.fill(lip);
    g.save(); g.clip(lip);
    const r = rng(12);
    for (let i = 0; i < 90; i++) {
      const k = r() * 120 | 0, [x, y] = B[k];
      g.lineWidth = 1; g.strokeStyle = rgba('#d2a27a', 0.35);
      g.beginPath(); g.moveTo(x, y - 14 + r() * 6); g.quadraticCurveTo(x + (r() - 0.5) * 10, y - 6, x + (r() - 0.5) * 8, y + 2); g.stroke();
      if (r() < 0.4) { g.fillStyle = rgba(r() < 0.5 ? '#c9a48c' : '#2c1a28', 0.6); g.fill(ell(x + (r() - 0.5) * 6, y - 6 + r() * 6, 2 + r() * 2, 1.5)); }
    }
    g.restore();
  },
});
// the grass top. drawn above the lip, with its grass hanging over the soil
layer({
  id: 'top', z: 16, still: true,
  draw(g) {
    const pts = [];
    for (let i = 0; i < 160; i++) { const a = (i / 160) * TAU, [x, z] = rim(a); pts.push(pr(x, 0, z)); }
    const top = poly(pts);
    CF.topPath = top;
    g.lineWidth = 4.4; g.strokeStyle = M.grass.line; g.stroke(top);
    // the sun reaches the right side first and pools there; the far left is cooler
    g.fillStyle = grad(g, CF.CAM.cx - 420, 0, CF.CAM.cx + 420, 0, [tone(M.grass, 0.36), tone(M.grass, 0.52), tone(M.grass, 0.7)]); g.fill(top);
    g.save(); g.clip(top);
    const r = rng(5);
    // meadow patches: some lusher, some sun-bleached
    for (let i = 0; i < 70; i++) {
      const X = (r() - 0.5) * 2 * RX, Z = (r() - 0.5) * 2 * RZ, [x, y] = pr(X, 0, Z), w = 30 + r() * 80;
      g.fillStyle = rgba(r() < 0.5 ? '#3f7a52' : '#d8e48a', 0.12 + r() * 0.1);
      g.fill(ell(x, y, w, w * 0.28, undefined, (r() - 0.5) * 0.3));
    }
    // a lighter edge where the grass turns down toward us and catches the sky
    g.lineWidth = 16; g.strokeStyle = rgba('#e9f0a0', 0.18); g.stroke(top);
    g.restore();
    // the edge isn't combed: bites where the turf has crumbled to bare soil, clumps that slump over
    const bites = [0.6, 1.05, 1.9, 2.3, 2.8], clumps = [0.25, 0.9, 1.4, 2.05, 2.65, 3.0];
    for (const ab of bites) {
      const pts = [];
      for (let k = 0; k <= 10; k++) { const a = ab - 0.05 + (k / 10) * 0.1, [X, Z] = rim(a), d = Math.sin((k / 10) * Math.PI); pts.push(pr(X * (1 - d * 0.035), 0, Z * (1 - d * 0.035))); }
      const p = curve(pts.concat(pts.slice().reverse().map(([x, y]) => [x, y + 3])), true);
      ink(g, p, tone(M.soil, 0.55), 1.2, M.soil.line);
      g.fillStyle = rgba('#2c1a28', 0.3); for (let k = 0; k < 4; k++) { const [x, y] = pts[2 + k * 2]; g.fill(ell(x, y - 1, 2, 1.2)); }
    }
    // grass hanging over the lip
    for (let i = 0; i < 260; i++) {
      const a = 0.04 + (i / 260) * (Math.PI - 0.08), [X, Z] = rim(a), [x, y] = pr(X, 0, Z);
      const edge = Math.sin(a); if (edge < 0.25 && r() > edge * 3) continue;
      if (bites.some((ab) => Math.abs(a - ab) < 0.04)) continue;
      const clump = clumps.some((ac) => Math.abs(a - ac) < 0.03) ? 14 + r() * 16 : 0;
      const len = (4 + Math.abs(noise(i * 0.37)) * 9 + clump) * (0.35 + 0.65 * edge), b = clamp(0.3 + Math.cos(a) * 0.35, 0.1, 0.8);
      const p = new Path2D(); p.moveTo(x - 4, y - 2); p.quadraticCurveTo(x - 3, y + len * 0.6, x + (r() - 0.3) * 3, y + len); p.quadraticCurveTo(x + 3, y + len * 0.5, x + 4, y - 2); p.closePath();
      ink(g, p, tone(M.grass, b + (r() - 0.5) * 0.12), 1.1, M.grass.line);
    }
    // tufts all over, thinning toward the far edge, thicker near where people walk
    for (let i = 0; i < 900; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.96, X = Math.cos(a) * RX * d * rimK(a), Z = Math.sin(a) * RZ * d * rimK(a);
      const [x, y] = pr(X, 0, Z), near = (Z + RZ) / (2 * RZ), s = 0.5 + near * 0.7;
      const b = clamp(0.35 + X / RX * 0.25 + (r() - 0.5) * 0.3, 0, 1);
      g.lineWidth = 1.1; g.strokeStyle = rgba(r() < 0.6 ? M.grass.line : tone(M.grass, 0.95), r() < 0.6 ? 0.35 : 0.55);
      g.beginPath(); g.moveTo(x - 3 * s, y - 4 * s); g.lineTo(x, y); g.lineTo(x + 3 * s, y - 5 * s); g.moveTo(x, y); g.lineTo(x + 0.5, y - 6.5 * s); g.stroke();
      if (r() < 0.06) { g.fillStyle = ['#fff6e0', '#f7d55a', '#f3a0b0', '#c9b6ef', '#ffffff'][(r() * 5) | 0]; g.fill(circ(x + 3 * s, y - 6 * s, 1.6 * s + 0.5)); }
      if (r() < 0.02) ink(g, ell(x, y, 4 * s, 1.8 * s), mix(tone(M.grass, b), '#2f5a3e', 0.4), 0);
    }
    // the far edge: blades against the cloud floor behind
    for (let i = 0; i < 200; i++) {
      const a = Math.PI + 0.1 + (i / 200) * (Math.PI - 0.2), [X, Z] = rim(a), [x, y] = pr(X, 0, Z);
      g.lineWidth = 1.4; g.strokeStyle = tone(M.grass, 0.3 + 0.3 * Math.max(0, Math.cos(a)));
      g.beginPath(); g.moveTo(x - 2, y + 1); g.lineTo(x + (r() - 0.5) * 3, y - 3 - r() * 5); g.stroke();
    }
  },
});

// ------------------------------------------------------------------ roots and trailing vines
// anchored along the band lips, swinging with the shared breeze; hover and they swing with you
const roots = [], vines = [];
D.onLayout(() => {
  if (roots.length) return;
  const r = rng(44);
  for (const c of ISLE.cells) {
    if (c.facing < 0.15 || c.b < 1 || c.b > 4 || r() > 0.32) continue;
    const u = 0.2 + r() * 0.6, q = c.p, X = lerp(q[3][0], q[2][0], u), Y = lerp(q[3][1], q[2][1], u), Z = lerp(q[3][2], q[2][2], u);
    roots.push({ X, Y: Y + 4, Z, len: 14 + r() ** 2 * 70, ph: r() * 6, curl: r() < 0.5 ? 1 : -1, leaf: r() < 0.35, kids: r() < 0.6 ? 1 + ((r() * 2) | 0) : 0, bend: (r() - 0.5) * 30 });
  }
  roots.sort((a, b) => a.Z - b.Z);
  // vines gather in a few heavy curtains (and one or two strays), as they do where water seeps
  for (const [ac, n, L0] of [[0.78, 6, 110], [1.62, 4, 70], [2.55, 7, 130], [2.95, 3, 60], [1.15, 1, 50], [2.15, 1, 40]]) {
    for (let i = 0; i < n; i++) {
      const a = ac + (i - n / 2) * 0.022 + (r() - 0.5) * 0.01, [X, Z] = rim(a);
      vines.push({ X: X * 0.99, Z: Z * 0.99, len: L0 * (0.4 + r() * 0.7) * (1 - Math.abs(i - n / 2) / n * 0.6), ph: r() * 6 + i * 0.3, n: 0 });
    }
  }
  // the lantern hangs from a root on the sunny side, low down; the tip itself trails a short tangle
  const lc = ISLE.cells.filter((c) => c.b === 4 && c.facing > 0.3 && c.nrm[0] > 0.2)[0];
  if (lc) { const q = lc.p; roots.push({ X: (q[2][0] + q[3][0]) / 2, Y: (q[2][1] + q[3][1]) / 2 + 3, Z: (q[2][2] + q[3][2]) / 2, len: 44, ph: 1, curl: 1, lantern: true, kids: 0 }); }
  for (const dx of [-8, 4, 12]) roots.push({ X: 40 + dx, Y: -444, Z: 30, len: 16 + Math.abs(dx) * 1.5, ph: dx, curl: dx > 0 ? 1 : -1, kids: 1 });
});
layer({
  id: 'roots', z: 15.5,
  hit: (x, y) => y > 640 && y < 1120 && Math.abs(x - CF.CAM.cx - 30) < 380 - (y - 640) * 0.6,
  update(dt, t, L) { this.stir = ease(this.stir || 0, L.hovered ? clamp(P.sp / 300, 0.3, 1) : 0, 3, dt); },
  draw(g, t) {
    const stir = this.stir || 0;
    for (const R of roots) {
      const [x, y] = pr(R.X, R.Y, R.Z), len = R.len;
      const sw = (wind(t, x) - 0.7) * len * 0.22 + Math.sin(t * 1.3 + R.ph) * (2 + stir * 12) + (P.inside && stir ? clamp((P.x - x) / 200, -1, 1) * stir * 10 : 0);
      const ex = x + sw + (R.bend || 0) * 0.4, ey = y + len;
      const pts = [];
      for (let k = 0; k <= 12; k++) {
        const u = k / 12, m = 1 - u;
        pts.push([m ** 3 * x + 3 * m * m * u * (x - 4 + (R.bend || 0) * 0.3) + 3 * m * u * u * (ex - sw * 0.4 - (R.bend || 0) * 0.5) + u ** 3 * ex, y + len * (3 * m * m * u * 0.3 + 3 * m * u * u * 0.7 + u ** 3)]);
      }
      pts.push([ex + R.curl * 4, ey + 3], [ex + R.curl * 6, ey - 1]);
      const W0 = Math.min(4.2, 1.6 + len * 0.04);
      for (const pass of [0, 1]) for (let k = 0; k < pts.length - 1; k++) {
        const w = lerp(W0, 0.5, (k / (pts.length - 1)) ** 0.8);
        g.lineWidth = pass ? w : w + 2.2; g.strokeStyle = pass ? (k < 4 ? '#6f4d4a' : '#8e6a58') : '#2c1a28';
        g.beginPath(); g.moveTo(...pts[k]); g.lineTo(...pts[k + 1]); g.stroke();
      }
      // rootlets splitting off and curling
      for (let q = 0; q < (R.kids || 0); q++) {
        const k0 = 3 + q * 3, [sx, sy] = pts[Math.min(k0, pts.length - 1)], dir = (q % 2 ? 1 : -1) * R.curl, l2 = len * 0.35;
        const rp = D.quad(sx, sy, sx + dir * l2 * 0.5 + sw * 0.2, sy + l2 * 0.4, sx + dir * l2 * 0.3 + sw * 0.4, sy + l2);
        g.lineWidth = 2.6; g.strokeStyle = '#2c1a28'; g.stroke(rp);
        g.lineWidth = 1; g.strokeStyle = '#8e6a58'; g.stroke(rp);
      }
      // a lit edge on the sun side
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,196,140,0.5)';
      g.beginPath(); g.moveTo(pts[1][0] + 1.5, pts[1][1]); for (let k = 2; k < 9; k++) g.lineTo(pts[k][0] + 1.2, pts[k][1]); g.stroke();
      if (R.leaf) { ink(g, ell(ex + 4, ey - 6, 5.5, 2.6, undefined, -0.6), '#6fa64f', 1.1, '#24392c'); ink(g, ell(ex - 4, ey - 14, 4.5, 2.2, undefined, 0.6), '#88c25a', 1.1, '#24392c'); }
      if (R.lantern) {
        const f = 0.55 + 0.08 * Math.sin(t * 5.3) + 0.05 * noise(t * 7);
        CF.glow(g, ex, ey + 14, 46, '#ffc070', f);
        ink(g, D.rect(ex - 5, ey + 1, 10, 3), '#4a3030', 1.2);
        ink(g, poly([[ex - 6, ey + 4], [ex + 6, ey + 4], [ex + 5, ey + 21], [ex - 5, ey + 21]]), grad(g, 0, ey, 0, ey + 21, ['#fff0b0', '#f6a95a']), 1.6);
        g.lineWidth = 1; g.strokeStyle = 'rgba(80,40,30,0.6)'; g.beginPath(); g.moveTo(ex, ey + 4); g.lineTo(ex, ey + 21); g.stroke();
        ink(g, D.rect(ex - 6, ey + 21, 12, 3), '#4a3030', 1.2);
      }
    }
    // vines trailing over the turf lip, leaves along them
    for (const V of vines) {
      const [x, y] = pr(V.X, -8, V.Z);
      const sw = (wind(t, x) - 0.7) * V.len * 0.18 + Math.sin(t * 1.1 + V.ph) * (1.5 + stir * 9);
      const p = D.quad(x, y, x + sw * 0.3, y + V.len * 0.5, x + sw, y + V.len);
      g.lineWidth = 3.2; g.strokeStyle = '#1f362e'; g.stroke(p);
      g.lineWidth = 1.6; g.strokeStyle = '#4a7a48'; g.stroke(p);
      for (let k = 1; k < 8; k++) {
        const u = k / 8, lx = lerp(lerp(x, x + sw * 0.3, u), lerp(x + sw * 0.3, x + sw, u), u), ly = lerp(lerp(y, y + V.len * 0.5, u), lerp(y + V.len * 0.5, y + V.len, u), u);
        const side = k % 2 ? 1 : -1, rot = side * 0.7 + Math.sin(t * 2 + V.ph + k) * 0.15;
        ink(g, ell(lx + side * 4, ly, 4.4 - u * 1.2, 2.4 - u * 0.5, undefined, rot), k % 3 ? '#5f9e52' : '#8cc35e', 1, '#1f362e');
      }
    }
  },
});

// ------------------------------------------------------------------ crystals in the rock
const crystals = [];
D.onLayout(() => {
  if (crystals.length) return;
  const pick = [[2, 0.66, 1.25, 5], [2, 0.58, 0.6, 2], [4, 0.45, 0.8, 3]];
  for (const [b, u, sz, n] of pick) {
    const cs = ISLE.cells.filter((c) => c.b === b && c.facing > 0.3);
    if (!cs.length) continue;
    const c = cs[Math.floor(u * cs.length) % cs.length], q = c.p;
    const X = (q[0][0] + q[1][0] + q[2][0] + q[3][0]) / 4, Y = (q[0][1] + q[1][1] + q[2][1] + q[3][1]) / 4, Z = (q[0][2] + q[1][2] + q[2][2] + q[3][2]) / 4;
    crystals.push({ X, Y, Z, s: sz, n, ph: u * 20, tw: 0 });
  }
});
layer({
  id: 'crystals', z: 15.6,
  hit(x, y) { for (const c of crystals) { const [cx, cy] = pr(c.X, c.Y, c.Z); if (Math.hypot(x - cx, y - cy + 8) < 24) return (this.which = c), true; } return false; },
  onEnter(L) { const c = this.which; if (!c) return; c.tw = 1; const [x, y] = pr(c.X, c.Y, c.Z); for (let i = 0; i < 5; i++) spawn({ kind: 'spark', x: x + (Math.random() - 0.5) * 20, y: y - 10 - Math.random() * 16, vy: -14 - Math.random() * 10, life: 0.9 }); spawn({ kind: 'note', x: x + 10, y: y - 20, vy: -22, vx: 6, life: 1.4, size: 0.8, c: '#6a8fc0' }); },
  update(dt) { for (const c of crystals) c.tw = ease(c.tw, 0, 1.5, dt); },
  draw(g, t) {
    for (const c of crystals) {
      const [x, y] = pr(c.X, c.Y, c.Z), s = c.s;
      const glint = Math.max(0, Math.sin(t * 0.7 + c.ph)) ** 12 + c.tw;
      CF.glow(g, x, y - 10 * s, 28 * s, '#a8e8ff', 0.16 + glint * 0.4);
      const prisms = [[-6, 16, 5, -0.35], [3, 24, 6, 0.08], [10, 13, 4.5, 0.45], [-13, 10, 4, -0.7], [15, 8, 3.5, 0.8]].slice(0, c.n);
      for (const [dx, h, w, a] of prisms) {
        g.save(); g.translate(x + dx * s, y); g.rotate(a);
        const L = poly([[-w * s, 0], [-w * s, -h * s], [0, -(h + 6) * s], [0, 0]]), R = poly([[0, 0], [0, -(h + 6) * s], [w * s, -h * s], [w * s, 0]]);
        ink(g, L, '#5d86c4', 1.4, '#22305a'); ink(g, R, '#aee6f0', 1.4, '#22305a');
        g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,0.75)'; g.beginPath(); g.moveTo(w * 0.4 * s, -2 * s); g.lineTo(w * 0.4 * s, -(h - 3) * s); g.stroke();
        g.restore();
      }
      if (glint > 0.3) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = clamp(glint, 0, 1); g.fillStyle = '#fffbe6'; const gx = x + 4 * s, gy = y - 24 * s; g.fill(poly([[gx, gy - 7], [gx + 1.5, gy - 1.5], [gx + 7, gy], [gx + 1.5, gy + 1.5], [gx, gy + 7], [gx - 1.5, gy + 1.5], [gx - 7, gy], [gx - 1.5, gy - 1.5]])); g.restore(); }
    }
  },
});

// ------------------------------------------------------------------ swallows nesting under the lip
// mud nests stuck under the turf overhang; the swallows loop out and back, and when you come
// near they swoop round the pointer
const NESTS = [1.95, 2.03, 2.1, 2.62].map((a) => { const [X, Z] = rim(a); return [X * 0.97, -22, Z * 0.97]; });
const swallows = [0, 1, 2].map((i) => ({ ph: i * 2.2, x: 0, y: 0, out: 0, vx: 1 }));
const swal = { stir: 0 };
layer({
  id: 'swallows', z: 15.65,
  hit: (x, y) => NESTS.some((n) => { const [nx, ny] = pr(...n); return Math.hypot(x - nx, y - ny - 6) < 34; }),
  update(dt, t, L) {
    swal.stir = ease(swal.stir, L.hovered ? 1 : 0, L.hovered ? 3 : 0.8, dt);
    swallows.forEach((s, i) => {
      const [nx, ny] = pr(...NESTS[i]), cyc = (t * 0.22 + s.ph / 6) % 1, out = Math.sin(cyc * Math.PI) ** 0.6;
      const a = cyc * D.TAU * 1.5 + s.ph;
      let tx = nx - 40 - out * 170 + Math.cos(a) * 60 * out, ty = ny + 30 + Math.sin(a) * 50 * out + out * 40;
      if (swal.stir > 0.05) { tx = lerp(tx, P.x + Math.cos(t * 4 + s.ph) * 40, swal.stir); ty = lerp(ty, P.y + Math.sin(t * 4.6 + s.ph) * 26, swal.stir); }
      const px = s.x; s.x = ease(s.x || nx, tx, 4, dt); s.y = ease(s.y || ny, ty, 4, dt); s.vx = s.x - px; s.out = out;
    });
  },
  draw(g, t) {
    for (const n of NESTS) {
      const [x, y] = pr(...n);
      const cup = new Path2D(); cup.moveTo(x - 9, y); cup.bezierCurveTo(x - 9, y + 11, x + 9, y + 11, x + 9, y); cup.closePath();
      ink(g, cup, '#9a7a5e', 1.3, '#3a2a28');
      g.fillStyle = 'rgba(60,40,40,0.35)'; for (let k = 0; k < 6; k++) g.fill(circ(x - 6 + k * 2.4, y + 3 + (k % 2) * 2.5, 1.4));
      g.fillStyle = '#2a1c26'; g.fill(ell(x, y + 0.5, 5, 1.6));
    }
    for (const s of swallows) {
      if (s.out < 0.04 && swal.stir < 0.05) continue;
      const f = Math.sin(t * 16 + s.ph), dir = s.vx >= 0 ? 1 : -1;
      g.save(); g.translate(s.x, s.y); g.scale(dir, 1);
      const p = new Path2D(); p.moveTo(-9, -3 - f * 5); p.quadraticCurveTo(-3, -2, 0, 0); p.quadraticCurveTo(3, -2, 9, -3 - f * 5);
      g.lineWidth = 2.4; g.strokeStyle = '#2a3058'; g.stroke(p);
      ink(g, ell(1, 0, 4.5, 2.2), '#2f3a6a', 0.9, '#1a1a30'); g.fillStyle = '#f3e4d0'; g.fill(ell(1, 1, 3, 1)); g.fillStyle = '#d9584a'; g.fill(circ(4.5, -0.3, 1));
      g.lineWidth = 1.2; g.strokeStyle = '#2a3058'; g.beginPath(); g.moveTo(-3, 0); g.lineTo(-8, 2.5); g.moveTo(-3, 0); g.lineTo(-8, -0.5); g.stroke();
      g.restore();
    }
  },
});

// ------------------------------------------------------------------ the round door in the rock
// it sits flat on one facet, so it is drawn in that facet's plane and foreshortens with it
const hedge = { open: 0, blink: D.blinker(), peek: 0 };
let doorM = null;
D.onLayout(() => {
  const cs = ISLE.cells.filter((c) => c.b === 1 && c.facing > 0.5 && c.nrm[0] > -0.1 && c.nrm[0] < 0.55);
  const c = cs[Math.floor(cs.length / 2)] || ISLE.cells[0], q = c.p;
  // a door stands upright: carve it into the facet along its top edge, straight down
  const u = [q[0][0] - q[1][0], 0, q[0][2] - q[1][2]], ul = Math.hypot(...u);
  const top = [lerp(q[1][0], q[2][0], 0.15), lerp(q[1][1], q[2][1], 0.15), lerp(q[1][2], q[2][2], 0.15)];
  doorM = plane(top, u.map((x) => x / ul), [0, -1, 0]);
  doorM.w = ul; doorM.h = (q[1][1] - q[2][1]) * 0.85; doorM.cell = c; doorM.a3 = Math.atan2(((q[1][2] + q[0][2]) / 2) / RZ, ((q[1][0] + q[0][0]) / 2) / RX);
});
layer({
  id: 'rock-door', z: 15.7,
  hit(x, y) { if (!doorM) return false; const [cx, cy] = CF.at(doorM, doorM.w / 2, doorM.h * 0.55); return Math.hypot(x - cx, y - cy) < 36; },
  update(dt, t, L) { hedge.open = ease(hedge.open, L.hovered ? 1 : 0, L.hovered ? 3 : 1.5, dt); hedge.peek = ease(hedge.peek, L.hovered && L.since > 0.5 ? 1 : 0, 3, dt); },
  draw(g, t) {
    if (!doorM) return;
    const Mx = doorM, cx = Mx.w / 2, cy = Mx.h * 0.55, r = 19;
    const P_ = (p) => on(Mx, p);
    const frame = P_(circ(cx, cy, r + 6));
    ink(g, frame, tone(M.stone, 0.45), 2, M.stone.line);
    g.lineWidth = 1.1; g.strokeStyle = rgba(M.stone.line, 0.6);
    for (let i = 0; i < 9; i++) { const a = (i / 9) * TAU + 0.2; g.stroke(P_(D.seg(cx + Math.cos(a) * r, cy + Math.sin(a) * r, cx + Math.cos(a) * (r + 6), cy + Math.sin(a) * (r + 6)))); }
    const hole = P_(circ(cx, cy, r));
    const [hx0, hy0] = CF.at(Mx, cx, cy);
    ink(g, hole, radial(g, hx0, hy0 + 5, 2, r, ['#ffcf7a', '#c9703f', '#4a2224']), 1.6);
    const o = hedge.open;
    if (o > 0.05) {
      g.save(); g.clip(hole);
      const [hx, hy] = CF.at(Mx, cx + 4 - (1 - o) * 22 + hedge.peek * 5, cy + 5 - hedge.peek * 3);
      const sp = new Path2D();
      for (let i = 0; i <= 12; i++) { const a = Math.PI * 0.75 + (i / 12) * Math.PI * 1.1, rr = i % 2 ? 12 : 17; i ? sp.lineTo(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr) : sp.moveTo(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr); }
      sp.closePath();
      ink(g, sp, '#6e4a40', 1.5);
      ink(g, ell(hx + 3, hy + 2, 10, 8.5), '#f0d2b0', 1.5);
      ink(g, circ(hx + 12, hy + 3, 2.4), '#2a1c26', 0);
      const op = hedge.blink(t);
      g.fillStyle = '#2a1c26'; g.fill(ell(hx + 5, hy - 1.5, 1.6, 1.8 * op + 0.2));
      g.fillStyle = 'rgba(243,120,130,0.6)'; g.fill(ell(hx + 7.5, hy + 3.5, 2.2, 1.3));
      if (hedge.peek > 0.4) { g.lineWidth = 1; g.strokeStyle = '#2a1c26'; g.beginPath(); g.arc(hx + 9, hy + 6, 2.2, 0.2, Math.PI - 0.4); g.stroke(); }
      g.restore();
    }
    // the door, hinged on the left, swings toward us
    const dw = Math.cos(o * 1.35);
    if (dw > 0.02) {
      const H = new DOMMatrix([dw, 0, 0, 1, (cx - r) * (1 - dw), 0]);
      const DM = Mx.multiply(H);
      const leaf = on(DM, circ(cx, cy, r - 1));
      const [a0, a1] = [CF.at(DM, cx - r, cy), CF.at(DM, cx + r, cy)];
      ink(g, leaf, grad(g, a0[0], a0[1], a1[0], a1[1], ['#7a4430', '#a8643f', '#c98552']), 1.6);
      g.lineWidth = 1; g.strokeStyle = 'rgba(58,34,50,0.5)';
      for (const dx of [-8, 0, 8]) g.stroke(on(DM, D.seg(cx + dx, cy - r + 4, cx + dx, cy + r - 4)));
      ink(g, on(DM, circ(cx + 11, cy + 2, 2)), '#f2c14e', 1);
    }
    // a rope ladder down to it from the turf above, swaying a little
    const [rX, rZ] = rim(doorM.a3), [sx0, sy0] = CF.at(Mx, cx - 10, cy + r + 8), [tx0, ty0] = pr(rX * 0.99, 0, rZ * 0.99);
    const swy = Math.sin(t * 1.3) * 3 + (wind(t, sx0) - 0.7) * 6;
    for (const k of [-7, 7]) { g.lineWidth = 1.6; g.strokeStyle = '#7a5a46'; g.beginPath(); g.moveTo(tx0 + k, ty0); g.quadraticCurveTo((tx0 + sx0) / 2 + k + swy, (ty0 + sy0) / 2, sx0 + k + swy, sy0); g.stroke(); }
    for (let k = 1; k < 7; k++) { const u = k / 7, x = lerp(tx0, sx0, u) + swy * u * u, y = lerp(ty0, sy0, u); tube(g, D.seg(x - 7, y, x + 7, y), '#c99a62', 1.6, 0.8); }
    // a step below and a little lamp beside it
    const [sx, sy] = CF.at(Mx, cx, cy + r + 9);
    ink(g, ell(sx, sy, 22, 5), tone(M.stone, 0.6), 1.5, M.stone.line);
    const [lx, ly] = CF.at(Mx, cx + r + 16, cy - 8);
    CF.glow(g, lx, ly, 32, '#ffc070', 0.5 + 0.06 * Math.sin(t * 4.7));
    tube(g, D.quad(lx - 12, ly + 8, lx, ly + 6, lx, ly - 6), '#4a3030', 1.5, 1.1);
    ink(g, ell(lx, ly, 4.5, 6.5), '#ffe8a8', 1.3);
  },
});

// ------------------------------------------------------------------ stones floating under the island
// three chunks that broke off the tip and never fell, the biggest still trailing a root
const stones = [[170, -392, 70, 22, 1], [-96, -428, 72, 13, 2], [236, -330, 100, 8, 3]]
  .map(([X, Y, Z, r, s]) => ({ X, Y, Z, r, s, ox: 0, oy: 0, vx: 0, vy: 0 }));
layer({
  id: 'stones', z: 15.8,
  hit: (x, y) => stones.some((s) => Math.hypot(x - s.x, y - s.y) < s.r + 24),
  update(dt, t) {
    for (const s of stones) {
      const [bx, by] = pr(s.X, s.Y, s.Z);
      s.x = bx + s.ox; s.y = by + s.oy + Math.sin(t * 0.8 + s.s * 1.7) * 6;
      const dx = s.x - P.x, dy = s.y - P.y, d = Math.hypot(dx, dy);
      if (P.inside && d < 80 && d > 0.1) { s.vx += (dx / d) * 300 * dt + P.vx * 0.3 * dt; s.vy += (dy / d) * 300 * dt + P.vy * 0.3 * dt; }
      s.vx += -4 * s.ox * dt - 1.4 * s.vx * dt; s.vy += -4 * s.oy * dt - 1.4 * s.vy * dt;
      s.ox += s.vx * dt; s.oy += s.vy * dt;
    }
  },
  draw(g, t) {
    for (const s of stones) {
      const { x, y, r } = s, rot = s.ox * 0.004;
      g.save(); g.translate(x, y); g.rotate(rot);
      const body = poly([[-r, -r * 0.15], [-r * 0.5, -r * 0.45], [r * 0.55, -r * 0.42], [r, -r * 0.05], [r * 0.45, r * 0.6], [r * 0.05, r * 0.95], [-r * 0.45, r * 0.55]]);
      ink(g, body, tone(M.rock, 0.3), 1.8, M.rock.line);
      ink(g, poly([[r * 0.05, -r * 0.2], [r * 0.55, -r * 0.42], [r, -r * 0.05], [r * 0.45, r * 0.6], [r * 0.05, r * 0.95]]), tone(M.rock, 0.8), 1.2, M.rock.line);
      ink(g, poly([[-r * 0.45, r * 0.55], [r * 0.05, r * 0.95], [r * 0.05, -r * 0.2], [-r, -r * 0.15]]), mix(tone(M.rock, 0.15), M.rock.bounce, 0.3), 1.2, M.rock.line);
      ink(g, ell(0, -r * 0.34, r * 0.86, r * 0.2), tone(M.grass, 0.6), 1.3, M.grass.line);
      if (s.s === 1) { const sw = Math.sin(t * 1.2) * 3; tube(g, D.quad(r * 0.1, r * 0.9, r * 0.3 + sw, r * 1.6, -r * 0.1 + sw * 1.5, r * 2.3), '#7d5a4e', 1.6, 1); }
      g.restore();
    }
  },
});

// ------------------------------------------------------------------ the little rock, its bridge, its fisher
const SAT = { X: -610, Y: -30, Z: 40, rx: 66, rz: 48 };
const satRim = (a) => { const k = 1 + 0.08 * noise(a * 3 + 40); return [SAT.rx * Math.cos(a) * k, SAT.rz * Math.sin(a) * k]; };
const SATR = makeRock({ rim: satRim, bands: [{ y: -8, k: 0.985 }, { y: -34, k: 0.86 }, { y: -66, k: 0.6 }, { y: -96, k: 0.3 }, { y: -118, k: 0 }], tip: [-6, 10], seed: 9, ox: SAT.X, oy: SAT.Y, oz: SAT.Z, scale: 1 });
layer({
  id: 'sat-rock', z: 10, still: true,
  draw(g) {
    drawRock(g, SATR, { lw: 2.2 });
    const T = [], B = [];
    for (let i = 0; i <= 40; i++) { const a = (i / 40) * Math.PI, [x, z] = satRim(a); T.push(pr(SAT.X + x, SAT.Y, SAT.Z + z)); B.push(pr(SAT.X + x * 0.985, SAT.Y - 8, SAT.Z + z * 0.985)); }
    ink(g, poly(T.concat(B.reverse())), M.soil.base, 1.8, M.soil.line);
    const pts = []; for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU, [x, z] = satRim(a); pts.push(pr(SAT.X + x, SAT.Y, SAT.Z + z)); }
    const top = poly(pts);
    ink(g, top, grad(g, SAT.X + CF.CAM.cx - 70, 0, SAT.X + CF.CAM.cx + 70, 0, [tone(M.grass, 0.38), tone(M.grass, 0.68)]), 2.6, M.grass.line);
    const r = rng(3);
    for (let i = 0; i < 46; i++) {
      const a = 0.04 + (i / 46) * (Math.PI - 0.08), [X, Z] = satRim(a), [x, y] = pr(SAT.X + X, SAT.Y, SAT.Z + Z), len = 4 + r() * 8;
      const p = new Path2D(); p.moveTo(x - 3, y - 1); p.quadraticCurveTo(x - 2, y + len * 0.6, x, y + len); p.quadraticCurveTo(x + 2, y + len * 0.5, x + 3, y - 1); p.closePath();
      ink(g, p, tone(M.grass, clamp(0.35 + Math.cos(a) * 0.3, 0.1, 0.8)), 1, M.grass.line);
    }
    for (let i = 0; i < 40; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.9, [x, y] = pr(SAT.X + Math.cos(a) * SAT.rx * d, SAT.Y, SAT.Z + Math.sin(a) * SAT.rz * d);
      g.lineWidth = 1; g.strokeStyle = rgba(M.grass.line, 0.4); g.beginPath(); g.moveTo(x - 2.5, y - 3.5); g.lineTo(x, y); g.lineTo(x + 2.5, y - 4); g.stroke();
    }
    // the signpost: CLOUDFALL one way, the cottage the other
    const [px, py] = pr(SAT.X - 8, SAT.Y, SAT.Z - 26);
    CF.contact(g, px, py, 9, 3, 0.45);
    tube(g, D.seg(px, py, px, py - 58), tone(M.timber, 0.55), 3.4, 1.4);
    for (const [dy, dir, txt, w] of [[-52, 1, 'HOME', 40], [-38, -1, 'NOWHERE', 58]]) {
      const x0 = px, x1 = px + dir * w, yy = py + dy;
      ink(g, poly([[x0, yy - 6], [x1 - dir * 8, yy - 6], [x1, yy], [x1 - dir * 8, yy + 6], [x0, yy + 6]]), dir > 0 ? '#f1dcb4' : '#d9c39c', 1.4, M.timber.line);
      g.font = 'italic 700 8px Georgia, serif'; g.fillStyle = '#5a3a3e'; g.textAlign = 'center'; g.fillText(txt, (x0 + x1 - dir * 6) / 2, yy + 3);
    }
    // a pebble and a shell someone brought back
    ink(g, ell(...pr(SAT.X - 30, SAT.Y, SAT.Z + 18), 6, 2.6), tone(M.stone, 0.6), 1.2, M.stone.line);
  },
});
// the mailbox: hover and its flag pops up, linger and a letter pokes out
const mail = { flag: 0, fv: 0, letter: 0 };
layer({
  id: 'mailbox', z: 10.5,
  hit: (x, y) => { const [mx, my] = pr(SAT.X + 40, SAT.Y, SAT.Z - 4); return Math.abs(x - mx) < 20 && y > my - 60 && y < my + 4; },
  onEnter() { mail.fv -= 9; },
  update(dt, t, L) {
    mail.fv += (-40 * (mail.flag - (L.hovered ? -1.4 : 0)) - 4 * mail.fv) * dt; mail.flag += mail.fv * dt;
    mail.letter = ease(mail.letter, L.hovered && L.since > 0.6 ? 1 : 0, 3, dt);
  },
  draw(g) {
    const [x, y] = pr(SAT.X + 40, SAT.Y, SAT.Z - 4);
    CF.contact(g, x, y, 10, 3, 0.45);
    tube(g, D.seg(x, y, x, y - 34), tone(M.timber, 0.55), 3.4, 1.4);
    const bx = x - 13, by = y - 34;
    const side = poly([[bx + 26, by - 13], [bx + 32, by - 16], [bx + 32, by - 2], [bx + 26, by + 1]]);
    ink(g, side, '#8f3a36', 1.6);
    const box = new Path2D(); box.moveTo(bx, by + 1); box.lineTo(bx, by - 10); box.arc(bx + 13, by - 10, 13, Math.PI, 0); box.lineTo(bx + 26, by + 1); box.closePath();
    ink(g, box, grad(g, bx, 0, bx + 26, 0, ['#b8443a', '#e0644c', '#f49068']), 1.8);
    if (mail.letter > 0.02) ink(g, poly([[bx + 2, by - 4], [bx - 4 - mail.letter * 10, by - 6 - mail.letter * 2], [bx - 4 - mail.letter * 10, by + 2], [bx + 2, by]]), '#fff6e6', 1.1);
    ink(g, D.rect(bx + 2, by - 10, 2.5, 10), '#3a2232', 0);
    g.save(); g.translate(bx + 30, by - 6); g.rotate(mail.flag);
    tube(g, D.seg(0, 0, 0, -14), '#f2c14e', 1.8, 1.1);
    ink(g, poly([[0, -14], [9, -11], [0, -8]]), '#f2c14e', 1.2);
    g.restore();
  },
});

const bridge = { b: 0, bv: 0, lan: [0, 0], lanv: [0, 0] };
const BA = [-404, 0, 22], BB = [-548, -30, 46], W2 = 11;
const bridgeAt = (u, side, h = 0) => {
  const sag = 16 + bridge.b, X = lerp(BA[0], BB[0], u), Y = lerp(BA[1], BB[1], u) - sag * 4 * u * (1 - u) + h, Z = lerp(BA[2], BB[2], u) + side * W2;
  return pr(X, Y, Z);
};
layer({
  id: 'bridge', z: 11,
  hit: (x, y) => { const [ax, ay] = pr(...BA), [bx, by] = pr(...BB); return x > bx - 6 && x < ax + 6 && y > Math.min(ay, by) - 40 && y < Math.max(ay, by) + 30; },
  onEnter() { bridge.bv += 60; },
  update(dt, t, L) {
    if (L.hovered) bridge.bv += clamp(P.vy, -400, 400) * dt * 0.9;
    bridge.bv += (-70 * bridge.b - 3.2 * bridge.bv) * dt; bridge.b += bridge.bv * dt;
    for (let i = 0; i < 2; i++) {
      const push = (wind(t, 300 + i * 40) - 0.7) * 0.35 + bridge.bv * 0.004;
      bridge.lanv[i] += (-30 * (bridge.lan[i] - push) - 1.5 * bridge.lanv[i]) * dt; bridge.lan[i] += bridge.lanv[i] * dt;
    }
  },
  draw(g, t) {
    const N = 16;
    // far side rope and posts first, then the deck, then the near side
    const rope = (side) => { const p = new Path2D(); for (let i = 0; i <= N; i++) { const q = bridgeAt(i / N, side, 26 - (bridge.b * 0.3) * Math.sin(Math.PI * i / N)); i ? p.lineTo(...q) : p.moveTo(...q); } return p; };
    const post = (u, side) => { const [x, y] = bridgeAt(u, side), [x2, y2] = bridgeAt(u, side, 30); tube(g, D.seg(x, y + 3, x2, y2), tone(M.timber, side < 0 ? 0.35 : 0.6), 3.2, 1.3); };
    post(0, -1); post(1, -1);
    g.lineWidth = 1.5; g.strokeStyle = '#5a3c3c'; g.stroke(rope(-1));
    g.lineWidth = 1; g.strokeStyle = 'rgba(90,60,60,0.7)';
    for (let i = 1; i < N; i++) { const a = bridgeAt(i / N, -1), b = bridgeAt(i / N, -1, 26 - bridge.b * 0.3 * Math.sin(Math.PI * i / N)); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
    // planks, each a little different
    for (let i = 0; i < 22; i++) {
      const u0 = i / 22 + 0.004, u1 = (i + 1) / 22 - 0.006;
      const p = poly([bridgeAt(u0, -1), bridgeAt(u1, -1), bridgeAt(u1, 1), bridgeAt(u0, 1)]);
      ink(g, p, mix(tone(M.timber, 0.75), '#e8c08a', D.hash(i) * 0.4), 1.1, M.timber.line);
    }
    const edge = (side) => { const p = new Path2D(); for (let i = 0; i <= N; i++) { const q = bridgeAt(i / N, side); i ? p.lineTo(...q) : p.moveTo(...q); } return p; };
    g.lineWidth = 1.6; g.strokeStyle = M.timber.line; g.stroke(edge(1));
    post(0, 1); post(1, 1);
    g.lineWidth = 1; g.strokeStyle = 'rgba(90,60,60,0.8)';
    for (let i = 1; i < N; i++) { const a = bridgeAt(i / N, 1), b = bridgeAt(i / N, 1, 26 - bridge.b * 0.3 * Math.sin(Math.PI * i / N)); g.beginPath(); g.moveTo(...a); g.lineTo(...b); g.stroke(); }
    g.lineWidth = 1.8; g.strokeStyle = '#5a3c3c'; g.stroke(rope(1));
    [0.3, 0.68].forEach((u, i) => {
      const [x, y] = bridgeAt(u, 1, 26 - bridge.b * 0.3 * Math.sin(Math.PI * u));
      g.save(); g.translate(x, y); g.rotate(bridge.lan[i]);
      g.lineWidth = 1; g.strokeStyle = '#4a3030'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 8); g.stroke();
      CF.glow(g, 0, 15, 20, '#ffbe6e', 0.25 + 0.04 * Math.sin(t * 4 + i * 2));
      ink(g, ell(0, 15, 6.5, 8), grad(g, -6, 0, 6, 0, ['#e88a4f', '#f8c47a', '#ffe8b0']), 1.5);
      g.lineWidth = 0.8; g.strokeStyle = 'rgba(120,50,30,0.5)'; g.beginPath(); g.ellipse(0, 15, 3, 8, 0, 0, TAU); g.stroke();
      ink(g, D.rect(-3.5, 6, 7, 2.5), '#6e3c32', 1);
      g.restore();
    });
  },
});

// the fisher: on the little rock's front edge, legs over, fishing the open sky
const fisher = { catch: 0, blink: D.blinker(), fish: [0, 1, 2].map((i) => ({ ph: i * 2.1, r: 16 + i * 7 })) };
const FP = () => pr(SAT.X + 4, SAT.Y, SAT.Z + SAT.rz * 0.92);
layer({
  id: 'fisher', z: 12,
  hit: (x, y) => { const [fx_, fy] = FP(); return Math.hypot(x - fx_, y - fy + 14) < 30 || (x > fx_ - 70 && x < fx_ - 20 && y > fy - 60 && y < (fisher.by || fy) + 20); },
  update(dt, t, L) {
    fisher.catch = ease(fisher.catch, L.hovered && L.since > 0.3 ? 1 : 0, L.hovered ? 1.5 : 0.9, dt);
    // a catch coming up is news: everyone on the island turns to see
    const [fx_, fy] = FP(); CF.attn.x = fx_ - 50; CF.attn.y = fy + 20; CF.attn.k = ease(CF.attn.k, fisher.catch > 0.55 ? 1 : 0, 2.5, dt);
  },
  draw(g, t, L) {
    const [fx_, fy] = FP(), c = fisher.catch;
    const tip = [fx_ - 52 - c * 4, fy - 46 - c * 20];
    const fall = fy + 150 - c * 120, bob = Math.sin(t * 1.7) * 3.5;
    const bx = tip[0] - 6 + Math.sin(t * 0.7) * 3 + (wind(t, 80) - 0.7) * 10;
    fisher.by = fall;
    // legs dangling over the lip, kicking slowly
    for (const s of [-1, 1]) { const k = Math.sin(t * 1.6 + s) * 3; tube(g, D.quad(fx_ + s * 7, fy - 4, fx_ + s * 8, fy + 6, fx_ + s * 6 + k, fy + 14), CF.FROG.base, 4.6, 1.5); ink(g, ell(fx_ + s * 6 + k, fy + 16, 5, 3), CF.FROG.base, 1.4); }
    g.lineWidth = 1; g.strokeStyle = 'rgba(58,34,50,0.7)';
    g.beginPath(); g.moveTo(...tip); g.quadraticCurveTo(bx - 6, (tip[1] + fall) / 2, bx, fall + bob); g.stroke();
    ink(g, circ(bx, fall + bob, 4.5), '#fff6e8', 1.3);
    g.save(); g.beginPath(); g.rect(bx - 6, fall + bob, 12, 6); g.clip(); g.fillStyle = '#e0644c'; g.fill(circ(bx, fall + bob, 4.5)); g.restore();
    g.lineWidth = 1.3; g.strokeStyle = CF.LINE; g.stroke(circ(bx, fall + bob, 4.5));
    fisher.fish.forEach((f, i) => {
      const caught = i === 0 ? c : 0, a = t * (0.9 + i * 0.2) + f.ph;
      let x = bx + Math.cos(a) * (f.r * 0.9 + 4), y = fall + bob + 12 + Math.sin(a) * f.r * 0.45 + i * 6;
      let dir = -Math.sin(a) > 0 ? 1 : -1;
      if (caught > 0.02) { x = lerp(x, bx, caught); y = lerp(y, fall + bob + 13, caught); dir = 1; }
      g.save(); g.translate(x, y); g.scale(dir, 1);
      if (caught > 0.5) g.rotate(-1.2 + Math.sin(t * 14) * 0.3);
      const wag = Math.sin(t * 9 + i) * 3;
      ink(g, poly([[-7, 0], [-14, -5 + wag], [-14, 5 + wag]]), '#f2a65e', 1.2);
      ink(g, ell(0, 0, 8.5, 6), grad(g, 0, -6, 0, 6, ['#ffd48a', '#f29a5e']), 1.3);
      ink(g, poly([[-1, -5], [3, -9], [5, -5]]), '#f2a65e', 1);
      g.fillStyle = '#2a1c26'; g.fill(circ(4, -1.2, 1.4));
      g.fillStyle = 'rgba(243,120,130,0.7)'; g.fill(ell(2, 2.2, 2, 1.2));
      g.restore();
    });
    if (c > 0.85 && Math.random() < 0.04) spawn({ kind: 'spark', x: bx + (Math.random() - 0.5) * 20, y: fall + 10, vy: -20, life: 0.8 });
    const rod = D.quad(fx_ - 12, fy - 14, fx_ - 30, fy - 30 - c * 10, tip[0], tip[1]);
    tube(g, rod, '#b07a4c', 2.2, 1.2);
    frog(g, fx_, fy - 2, 0.85, { open: fisher.blink(t), look: [-0.8, 0.6 - c], smile: 2 + c * 3, c: CF.FROG_TINTS.olive,
      arms: [[-17, -12 - c * 6, -12, -11]],
      hat: (g, lw) => { ink(g, D.ell(0, -32, 17, 4.5), '#e8c56a', lw); ink(g, D.ell(0, -36, 9, 6), '#e8c56a', lw); g.lineWidth = 2.4; g.strokeStyle = '#c9503f'; g.beginPath(); g.ellipse(0, -33.5, 8.6, 2.2, 0, 0, Math.PI); g.stroke(); } });
    // a bucket beside the fisher, with one already in it
    const [kx, ky] = pr(SAT.X - 34, SAT.Y, SAT.Z + 22);
    CF.contact(g, kx, ky, 11, 3.5);
    ink(g, poly([[kx - 9, ky - 16], [kx + 9, ky - 16], [kx + 7, ky], [kx - 7, ky]]), grad(g, kx - 9, 0, kx + 9, 0, ['#5a6a8a', '#8aa0b8', '#c7d6e0']), 1.5);
    ink(g, ell(kx, ky - 16, 9, 2.6), '#4a6fa0', 1.3);
    g.lineWidth = 1.2; g.strokeStyle = '#3a2232'; g.beginPath(); g.ellipse(kx, ky - 18, 9, 7, 0, Math.PI, TAU); g.stroke();
    const tf = Math.sin(t * 6) * 2;
    ink(g, poly([[kx + 3, ky - 18], [kx + 8, ky - 23 + tf], [kx + 9, ky - 16 + tf]]), '#f2a65e', 1.1);
  },
});
})();
