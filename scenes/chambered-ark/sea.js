/* sea.js — everything outside the ark: the water (lit from the surface, upper left), the surface seen
   from below and a strip of sky (phone only), the seabed fading back into the haze in three ridges,
   the near sand with its ripples and caustics, the shadow the ark throws on the sand, slow light
   shafts, and the kelp forest at both edges, every frond leaning into one shared current.

   water z0 · far seabed z4 · shafts z6 · near sand z8 · caustics z9 · ark shadow z12 · kelp behind
   z20 · kelp in front z76 */
(() => {
const { TAU, lerp, clamp, rng, noise, circ, ell, curve, poly, grad, radial, lumps, st, P, layer, onLayout, sprite, blit, wind, setWind, breeze } = Drawn;
const A = window.ARK, LINE = A.LINE;

// the current: slow, gusting, left → right
setWind((t, x) => 0.5 + 0.3 * Math.sin(t * 0.31 + x * 0.0012) + 0.35 * noise(t * 0.17 + x * 0.0007) + breeze.extra);
A.SURF = -430;   // the surface (only a phone shows it)
A.BED = 1062;    // where the near sand begins
const FOG = '#4c9fa9';
// atmospheric perspective: blend a colour toward the water at this depth
const mix = (a, b, f) => {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const c = (s) => Math.round(lerp((pa >> s) & 255, (pb >> s) & 255, f));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
};
A.mix = mix;

// ------------------------------------------------------------------ water and sky
layer({
  id: 'water', z: 0, still: true,
  draw(g) {
    const v = st.view, S = A.SURF;
    g.fillStyle = grad(g, 0, S, 0, 1300, [[0, '#d4f1e2'], [0.12, '#a7dccf'], [0.33, '#6fbfbb'], [0.6, '#46a1a9'], [0.85, '#33879a'], [1, '#2a7790']]);
    g.fillRect(v.x0, S, v.x1 - v.x0, v.y1 - S);
    // sky above the surface (phone): a pale late-afternoon sky
    if (v.y0 < S) {
      g.fillStyle = grad(g, 0, v.y0, 0, S, ['#9cc7e0', '#f2e6cc', '#ffe8c0']);
      g.fillRect(v.x0, v.y0, v.x1 - v.x0, S - v.y0 + 1);
    }
    // the sun's glow through the water, high on the left
    g.fillStyle = radial(g, 120, S - 80, 0, 1500, [[0, 'rgba(255,248,214,0.85)'], [0.25, 'rgba(240,250,220,0.35)'], [1, 'rgba(220,255,240,0)']]);
    g.fillRect(v.x0, S, v.x1 - v.x0, v.y1 - S);
    // the surface from below: a bright rumpled ceiling, Snell's window over the sun
    const r = rng(5);
    g.save();
    g.beginPath(); g.rect(v.x0, S - 2, v.x1 - v.x0, 90); g.clip();
    g.fillStyle = 'rgba(255,255,240,0.5)'; g.fillRect(v.x0, S - 2, v.x1 - v.x0, 8);
    for (let x = v.x0 - 40; x < v.x1 + 40; x += 30 + r() * 40) {
      const w = 40 + r() * 70, y = S + 4 + r() * 26;
      g.fillStyle = `rgba(255,255,236,${0.16 + r() * 0.3})`;
      g.fill(ell(x, y, w, 4 + r() * 5));
    }
    g.restore();
    // a hint of the sun itself above the waterline (phone)
    if (v.y0 < S - 100) {
      g.fillStyle = radial(g, 160, S - 160, 0, 220, [[0, 'rgba(255,250,225,1)'], [0.18, 'rgba(255,240,190,0.9)'], [1, 'rgba(255,230,180,0)']]);
      g.fillRect(v.x0, v.y0, v.x1 - v.x0, S - v.y0);
      g.lineWidth = 2.5; g.strokeStyle = 'rgba(255,255,255,0.8)';
      g.beginPath(); for (let x = v.x0; x < v.x1; x += 6) g.lineTo(x, S + Math.sin(x * 0.03) * 2.5); g.stroke();
    }
  },
});

// ------------------------------------------------------------------ the seabed in the haze
function ridge(g, y, amp, seed, fill, line, decor) {
  const v = st.view, r = rng(seed);
  const pts = [];
  for (let x = v.x0 - 60; x <= v.x1 + 60; x += 40) pts.push([x, y - amp * (0.4 + 0.6 * Math.abs(noise(x * 0.004 + seed))) - r() * amp * 0.15]);
  const p = curve([...pts, [v.x1 + 60, v.y1 + 10], [v.x0 - 60, v.y1 + 10]], true);
  g.fillStyle = fill; g.fill(p);
  if (line) { g.lineWidth = 1.2; g.strokeStyle = line; g.stroke(p); }
  if (decor) decor(pts, r);
}
// reef forms, each in a palette { line?, shade, base, lit }: brain domes, branching staghorn, table
// coral, tube sponges, sea fans. Far away they're flat shapes in the haze; near, inked and lit.
function brain(g, x, y, s, c, r) {
  const D = new Path2D(); D.ellipse(x, y, s, s * 0.62, 0, Math.PI, 0); D.closePath();
  g.fillStyle = c.base; g.fill(D);
  g.save(); g.clip(D);
  g.fillStyle = c.shade; g.fill(ell(x + s * 0.25, y + s * 0.1, s * 0.9, s * 0.5));
  g.fillStyle = c.lit; g.fill(ell(x - s * 0.3, y - s * 0.45, s * 0.5, s * 0.2));
  if (c.line) {
    g.lineWidth = Math.max(0.8, s * 0.04); g.strokeStyle = c.shade;
    for (let i = 0; i < 6; i++) { g.beginPath(); let px = x - s + r() * s * 2, py = y - r() * s * 0.6; g.moveTo(px, py); for (let j = 0; j < 6; j++) { px += (r() - 0.5) * s * 0.35; py += (r() - 0.5) * s * 0.2; g.lineTo(px, py); } g.stroke(); }
  }
  g.restore();
  if (c.line) { g.lineWidth = 1.3; g.strokeStyle = c.line; g.stroke(D); }
}
function staghorn(g, x, y, s, c, r) {
  const seg = (x0, y0, a, len, w, d) => {
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    const p = new Path2D(); p.moveTo(x0, y0); p.lineTo(x1, y1);
    if (c.line) { g.lineWidth = w + 2.2; g.strokeStyle = c.line; g.stroke(p); }
    g.lineWidth = w; g.strokeStyle = c.base; g.stroke(p);
    g.lineWidth = w * 0.35; g.strokeStyle = c.lit; const q = new Path2D(); q.moveTo(x0 - w * 0.2, y0); q.lineTo(x1 - w * 0.2, y1); g.stroke(q);
    if (d > 0) for (const da of [-0.45, 0.4]) seg(x1, y1, a + da + (r() - 0.5) * 0.3, len * (0.72 + r() * 0.1), w * 0.8, d - 1);
    else { g.fillStyle = c.lit; g.fill(circ(x1, y1, w * 0.45)); }
  };
  for (const a of [-2.2, -1.6, -1.0]) seg(x, y, a + (r() - 0.5) * 0.2, s * 0.38, s * 0.12, 3);
}
function table(g, x, y, s, c) {
  const stalk = poly([[x - s * 0.08, y], [x - s * 0.05, y - s * 0.4], [x + s * 0.05, y - s * 0.4], [x + s * 0.08, y]]);
  g.fillStyle = c.shade; g.fill(stalk); if (c.line) { g.lineWidth = 1; g.strokeStyle = c.line; g.stroke(stalk); }
  const T = ell(x, y - s * 0.45, s, s * 0.16);
  g.fillStyle = c.base; g.fill(T);
  g.save(); g.clip(T); g.fillStyle = c.shade; g.fill(ell(x, y - s * 0.38, s, s * 0.12)); g.fillStyle = c.lit; g.fill(ell(x - s * 0.2, y - s * 0.52, s * 0.6, s * 0.06)); g.restore();
  if (c.line) { g.lineWidth = 1.2; g.strokeStyle = c.line; g.stroke(T); }
}
function sponge(g, x, y, s, c, r) {
  for (let i = 0; i < 3; i++) {
    const tx = x + (i - 1) * s * 0.32, h = s * (0.6 + r() * 0.6), w = s * (0.14 + r() * 0.06);
    const T = A.rr(tx - w, y - h, w * 2, h, w * 0.8);
    g.fillStyle = c.base; g.fill(T);
    g.save(); g.clip(T); g.fillStyle = c.shade; g.fillRect(tx + w * 0.2, y - h, w * 0.8, h); g.fillStyle = c.lit; g.fillRect(tx - w * 0.65, y - h, w * 0.35, h); g.restore();
    g.fillStyle = c.line || c.shade; g.fill(ell(tx, y - h + w * 0.4, w * 0.75, w * 0.32));
    if (c.line) { g.lineWidth = 1.2; g.strokeStyle = c.line; g.stroke(T); }
  }
}
const FORMS = [brain, staghorn, table, sponge];
A.reef = { brain, staghorn, table, sponge };
function fan(g, x, y, h, color, lw, r) {
  // a sea fan: a lattice of branching twigs
  const branch = (x0, y0, a, len, d) => {
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = lw * (1 + d * 0.4); g.strokeStyle = color; g.stroke();
    if (d > 0) for (const da of [-0.38, 0.32]) branch(x1, y1, a + da + (r() - 0.5) * 0.3, len * (0.68 + r() * 0.12), d - 1);
  };
  branch(x, y, -Math.PI / 2 + (r() - 0.5) * 0.3, h * 0.32, 4);
}
const fogPal = (c, f) => ({ shade: mix(c[0], FOG, f), base: mix(c[1], FOG, f), lit: mix(c[2], FOG, f) });
const CORALS = [['#7a5a8a', '#a083b0', '#c9b0d6'], ['#b06a4a', '#d9946a', '#f2c28e'], ['#4f8a7a', '#78b09a', '#a8d6bc'], ['#a84a5a', '#d6707a', '#f2a0a0'], ['#9a8a4a', '#c8b46a', '#e8d894']];
layer({
  id: 'far-bed', z: 4, still: true,
  draw(g) {
    const v = st.view;
    // farthest: barely a shape in the haze
    ridge(g, 905, 60, 11, mix('#3f8f9c', FOG, 0.55), null, (pts, r) => {
      for (let i = 0; i < 22; i++) { const [x, y] = pts[Math.floor(r() * pts.length)]; [brain, staghorn, sponge][i % 3](g, x, y + 6, 14 + r() * 22, fogPal(CORALS[i % 5], 0.8), r); }
    });
    ridge(g, 975, 70, 23, mix('#3b8192', FOG, 0.38), null, (pts, r) => {
      for (let i = 0; i < 10; i++) { const [x, y] = pts[Math.floor(r() * pts.length)]; fan(g, x, y + 8, 60 + r() * 70, mix('#7a6a9c', FOG, 0.5), 1.4, r); }
      for (let i = 0; i < 24; i++) { const [x, y] = pts[Math.floor(r() * pts.length)]; [brain, staghorn, sponge][(i + 1) % 3](g, x, y + 8, 18 + r() * 26, fogPal(CORALS[(i + 2) % 5], 0.6), r); }
    });
    ridge(g, 1040, 55, 37, mix('#6a8f92', FOG, 0.14), mix('#2f5e70', FOG, 0.2), (pts, r) => {
      for (let i = 0; i < 9; i++) { const [x, y] = pts[Math.floor(r() * pts.length)]; fan(g, x, y + 10, 70 + r() * 90, mix(['#b56a83', '#c98a5e', '#8f6fa8'][i % 3], FOG, 0.15), 1.8, r); }
      for (let i = 0; i < 26; i++) {
        const [x, y] = pts[Math.floor(r() * pts.length)];
        const c = fogPal(CORALS[i % 5], 0.32); c.line = mix('#2f4058', FOG, 0.35);
        FORMS[(i * 3) % 4](g, x, y + 12, 18 + r() * 28, c, r);
      }
    });
    // a wash of water over all of it, thicker with height (it's further away)
    g.fillStyle = grad(g, 0, 820, 0, 1060, [[0, 'rgba(76,159,169,0.6)'], [1, 'rgba(76,159,169,0)']]);
    g.fillRect(v.x0, 820, v.x1 - v.x0, 240);
  },
});

// ------------------------------------------------------------------ slow light shafts
const shafts = [];
{ const r = rng(9); for (let i = 0; i < 7; i++) shafts.push({ x: -200 + i * 230 + r() * 120, w: 40 + r() * 90, ph: r() * 10, sp: 0.1 + r() * 0.12, a: 0.05 + r() * 0.05 }); }
layer({
  id: 'shafts', z: 6,
  draw(g, t) {
    const S = A.SURF, len = 1700, ang = 0.32; // leaning down to the right, away from the sun
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const s of shafts) {
      const k = 0.5 + 0.5 * Math.sin(t * s.sp + s.ph), w = s.w * (0.6 + 0.6 * k);
      const x0 = s.x + Math.sin(t * s.sp * 0.7 + s.ph) * 30;
      const dx = Math.sin(ang) * len, dy = Math.cos(ang) * len;
      const gr = g.createLinearGradient(x0, S, x0 + dx, S + dy);
      gr.addColorStop(0, `rgba(255,250,220,${s.a * (0.5 + k)})`); gr.addColorStop(0.55, `rgba(220,255,240,${s.a * 0.5})`); gr.addColorStop(1, 'rgba(200,255,240,0)');
      g.fillStyle = gr;
      g.fill(poly([[x0, S], [x0 + w, S], [x0 + w * 2.2 + dx, S + dy], [x0 + dx, S + dy]]));
    }
    g.restore();
  },
});

// ------------------------------------------------------------------ the near sand
const sandTop = (x) => A.BED + 10 * Math.sin(x * 0.006 + 1) + 6 * noise(x * 0.01);
A.sandTop = sandTop;
layer({
  id: 'near-bed', z: 8, still: true,
  draw(g) {
    const v = st.view, r = rng(41), Y = A.BED;
    const top = []; for (let x = v.x0 - 20; x <= v.x1 + 20; x += 20) top.push([x, sandTop(x)]);
    const sand = curve([...top, [v.x1 + 20, v.y1 + 20], [v.x0 - 20, v.y1 + 20]]);
    g.fillStyle = grad(g, 0, Y - 20, 0, Math.max(Y + 400, v.y1), [[0, '#c7b38f'], [0.08, '#dcc59a'], [0.4, '#e8cf9e'], [1, '#d4b083']]);
    g.fill(sand);
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(80,90,100,0.5)'; g.stroke(sand);
    g.save(); g.clip(sand);
    // ripples: long sinuous crests, light on the sun side, shade on the far side
    for (let y = Y + 18; y < v.y1; y += 14 + (y - Y) * 0.06) {
      const sp = 8 + (y - Y) * 0.02;
      for (let x = v.x0 - 50; x < v.x1; x += 90 + r() * 200) {
        const len = 60 + r() * 160 + (y - Y) * 0.2;
        const pts = []; for (let i = 0; i <= 8; i++) { const px = x + (len * i) / 8; pts.push([px, y + Math.sin(px * 0.02 + y) * sp * 0.25]); }
        A.stroke(g, pts, 1.4 + (y - Y) * 0.004, 'rgba(160,126,96,0.35)');
        A.stroke(g, pts.map(([a, b]) => [a - 1, b - 2]), 1.2 + (y - Y) * 0.003, 'rgba(255,240,206,0.5)');
      }
    }
    // pebbles and broken shells
    for (let i = 0; i < 90; i++) {
      const x = lerp(v.x0, v.x1, r()), y = lerp(Y + 14, Math.min(v.y1, Y + 900), r() * r());
      const s = 1.5 + r() * 3 + (y - Y) * 0.01;
      g.fillStyle = 'rgba(120,100,90,0.35)'; g.fill(ell(x + s * 0.4, y + s * 0.4, s * 1.3, s * 0.6));
      g.fillStyle = ['#efe2c8', '#c9a886', '#e8c6b0', '#b8a89a'][i % 4]; g.fill(ell(x, y, s * 1.2, s * 0.7, undefined, r()));
    }
    g.restore();
  },
});

// caustics: a wobbling net of light on the sand, two layers sliding past each other
// caustics: a Voronoi net of light (warped so the cell walls wobble), finer and flatter far off,
// built once per layout as pixels; two copies slide past each other so the net seems to move
let cau = null;
onLayout(() => {
  const r = rng(3), w = 700, h = 300, n = 90, R = Math.min(st.R, 1.5);
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([r() * w, h * Math.pow(r(), 1.5)]);
  const cw = Math.ceil(w * R), chh = Math.ceil(h * R);
  const c = document.createElement('canvas'); c.width = cw; c.height = chh;
  const g = c.getContext('2d'), img = g.createImageData(cw, chh), d = img.data;
  for (let py = 0; py < chh; py++) {
    const y0 = py / R, depth = 0.35 + 0.65 * (y0 / h), sy = 1.9 - depth;
    for (let px = 0; px < cw; px++) {
      let x = px / R + Math.sin(y0 * 0.09 + px * 0.004) * 5, y = y0 + Math.sin(px / R * 0.05) * 3;
      let f1 = 1e9, f2 = 1e9;
      for (let i = 0; i < n; i++) {
        let dx = Math.abs(x - pts[i][0]); if (dx > w / 2) dx = w - dx;
        const dy = (y - pts[i][1]) * sy, dd = dx * dx + dy * dy;
        if (dd < f1) { f2 = f1; f1 = dd; } else if (dd < f2) f2 = dd;
      }
      const e = Math.sqrt(f2) - Math.sqrt(f1), k = 3.2 * depth;
      const v = e < k ? 1 - e / k : 0;
      const o = (py * cw + px) * 4;
      d[o] = 255; d[o + 1] = 255; d[o + 2] = 230; d[o + 3] = Math.round(v * v * 230 * (0.5 + depth * 0.5));
    }
  }
  g.putImageData(img, 0, 0);
  cau = { c };
});
layer({
  id: 'caustics', z: 9,
  draw(g, t) {
    if (!cau) return;
    const v = st.view;
    g.save();
    g.beginPath(); g.rect(v.x0, A.BED - 10, v.x1 - v.x0, Math.min(380, v.y1 - A.BED + 10)); g.clip();
    g.globalCompositeOperation = 'lighter';
    for (const [k, sp, al] of [[0, 7, 0.42], [1, -5, 0.26]]) {
      g.globalAlpha = al * (0.8 + 0.2 * Math.sin(t * 0.9 + k));
      const sc = 1 + k * 0.25, off = ((t * sp) % (700 * sc) + 700 * sc) % (700 * sc);
      for (let x = v.x0 - 700 * sc + off; x < v.x1; x += 700 * sc) g.drawImage(cau.c, x, A.BED - 4 + Math.sin(t * 0.5 + k) * 3, 700 * sc, 300 * sc);
    }
    g.restore();
  },
});

// ------------------------------------------------------------------ the ark's shadow on the sand
layer({
  id: 'ark-shadow', z: 12,
  draw(g) {
    const up = clamp(-A.bob / 40, -0.5, 1.5);
    const cx = A.C[0] + 170 + A.dx, cy = A.BED + 26, rx = 420 * (1 + up * 0.1), ry = 26 * (1 + up * 0.1);
    g.save();
    for (let i = 0; i < 5; i++) {
      g.fillStyle = `rgba(28,60,80,${(0.13 - up * 0.02) * (1 - i * 0.1)})`;
      g.fill(ell(cx, cy, rx * (1 - i * 0.16), ry * (1 - i * 0.16)));
    }
    g.restore();
  },
});

// ------------------------------------------------------------------ the near reef: rocks in the foreground
function rock(g, x, y, w, h, seed) {
  // a mound of lumpy boulders, lit warm on top, cool and dark where it sits in the sand
  const r = rng(seed), circles = [];
  const n = 5 + Math.floor(w / 40);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, cx = x - w + u * w * 2, top = Math.sin(u * Math.PI);
    const rad = h * (0.35 + 0.5 * top) * (0.8 + r() * 0.4);
    circles.push([cx, y - rad * 0.55 - top * h * 0.3, rad]);
  }
  for (let i = 0; i < n - 2; i++) { const u = 0.2 + r() * 0.6; circles.push([x - w + u * w * 2, y - h * (0.6 + r() * 0.3), h * (0.25 + r() * 0.25)]); }
  g.fillStyle = 'rgba(40,60,70,0.35)'; g.fill(ell(x + w * 0.15, y + 4, w * 1.15, h * 0.18));
  g.save(); g.beginPath(); g.rect(x - w * 2, y - h * 3, w * 4, h * 3 + 2); g.clip();
  A.lumps(g, circles, { line: LINE, lw: 1.8, shade: '#5f5a72', base: '#8a8090', lit: '#b6a89e', union: true });
  g.restore();
  // coralline crusts and pits
  for (let i = 0; i < 26; i++) { const [cx, cy, cr] = circles[Math.floor(r() * circles.length)]; const a = -Math.PI / 2 + (r() - 0.5) * 2; g.fillStyle = r() < 0.5 ? 'rgba(60,50,70,0.3)' : 'rgba(240,160,170,0.55)'; g.fill(ell(cx + Math.cos(a) * cr * 0.6, cy + Math.sin(a) * cr * 0.6, 1.5 + r() * 3.5, 1 + r() * 2)); }
  return circles;
}
layer({
  id: 'near-reef', z: 10, still: true,
  draw(g) {
    const v = st.view, r = rng(91);
    // seagrass meadow tufts, painted (the swaying ones are in 'grass')
    // big rocks at both corners, with their coral
    const groups = [[60, 1135, 190, 90, 1], [1530, 1140, 200, 95, 2], [1280, 1330, 150, 70, 4], [420, 1720, 560, 260, 5]];
    for (const [x, y, w, h, sd] of groups) {
      if (y - h > v.y1 + 20) continue;
      const cs = rock(g, x, y, w, h, sd);
      // coral growing from the tops of the boulders, biggest on the biggest rocks
      const tops = cs.slice().sort((p, q) => p[1] - p[2] - (q[1] - q[2])).slice(0, 6);
      for (let i = 0; i < tops.length; i++) {
        const [cx, cy, cr] = tops[i];
        const c = { line: LINE, shade: CORALS[(i + sd) % 5][0], base: CORALS[(i + sd) % 5][1], lit: CORALS[(i + sd) % 5][2] };
        [brain, staghorn, sponge, staghorn][(i + sd) % 4](g, cx + (r() - 0.5) * cr, cy - cr * 0.8, Math.min(70, cr * (0.7 + r() * 0.5)), c, r);
      }
    }
    // shells and a starfish strewn on the sand
    const star = (x, y, s, rot) => { const pts = []; for (let i = 0; i < 10; i++) { const a = rot + (i / 10) * TAU, rr = i % 2 ? s * 0.42 : s; pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.55]); } const S = curve(pts); g.fillStyle = '#e8774a'; g.fill(S); g.lineWidth = 1.4; g.strokeStyle = LINE; g.stroke(S); g.fillStyle = '#ffd0a0'; for (let i = 0; i < 5; i++) { const a = rot + (i / 5) * TAU; g.fill(circ(x + Math.cos(a) * s * 0.5, y + Math.sin(a) * s * 0.27, s * 0.06)); } };
    star(560, 1110, 16, 0.3); star(1210, 1300, 22, 1.1); star(300, 1420, 26, 2);
    for (const [x, y, s] of [[700, 1095, 7], [460, 1180, 9], [1020, 1250, 10], [1390, 1460, 12], [620, 1350, 11]]) {
      const S = new Path2D(); S.ellipse(x, y, s, s * 0.6, 0, Math.PI, 0); S.closePath();
      g.fillStyle = '#f2e0d0'; g.fill(S); g.lineWidth = 1.2; g.strokeStyle = LINE; g.stroke(S);
      g.lineWidth = 0.8; g.strokeStyle = '#c99a8a'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + i * s * 0.4, y - s * 0.55); g.stroke(); }
    }
  },
});
// garden eels: a colony in the sand, swaying into the current; they duck into their burrows when the
// pointer comes near and ease back out once it's gone
const eels = [];
{ const r = rng(61); for (let i = 0; i < 8; i++) eels.push({ x: 1185 + i * 30 + r() * 22, y: 1090 + r() * 26, h: 50 + r() * 34, out: 1, ph: r() * 6, wait: 0 }); }
layer({
  id: 'eels', z: 14,
  hit: (x, y) => x > 1160 && x < 1430 && y > 1020 && y < 1125,
  update(dt, t, L) {
    for (const e of eels) {
      const near = P.inside && Math.hypot(P.x - e.x, P.y - (e.y - e.h * 0.5)) < (L.hovered ? 140 : 90);
      if (near) e.wait = 1.2 + Math.random();
      e.wait -= dt;
      e.out = Drawn.ease(e.out, e.wait > 0 ? 0 : 1, e.wait > 0 ? 9 : 0.9, dt);
    }
  },
  draw(g, t) {
    for (const e of eels) {
      g.fillStyle = '#d6bc8e'; g.fill(ell(e.x, e.y + 1, 11, 4)); g.fillStyle = 'rgba(255,240,206,0.6)'; g.fill(ell(e.x - 3, e.y - 1, 7, 1.6)); g.fillStyle = 'rgba(60,50,50,0.7)'; g.fill(ell(e.x, e.y, 4.5, 1.8));
      if (e.out < 0.04) continue;
      const h = e.h * e.out, w = wind(t, e.x);
      const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([e.x + Math.sin(t * 1.2 + e.ph + u * 3) * 6 * u - (w * 10 + 8) * u * u, e.y - h * u * (1 - 0.15 * u)]); }
      C_limb(g, pts, 6, 4.5, '#efe6d2', 1.3, '#c9bca4');
      g.fillStyle = '#4a3a3a'; for (let i = 2; i < 10; i += 2) g.fill(circ(pts[i][0] + 1, pts[i][1], 1.1));
      const [hx, hy] = pts[10], [px, py] = pts[9];
      g.save(); g.translate(hx, hy); g.rotate(Math.atan2(hy - py, hx - px) - 0.9);
      g.fillStyle = '#efe6d2'; g.fill(ell(3, 0, 6, 3.4)); g.lineWidth = 1.2; g.strokeStyle = LINE; g.stroke(ell(3, 0, 6, 3.4));
      g.fillStyle = '#fff'; g.fill(circ(4.5, -1, 1.6)); g.fillStyle = LINE; g.fill(circ(4.9, -1, 1));
      g.restore();
    }
  },
});
const C_limb = (...a) => A.crew.limb(...a);

// sea grass: tufts along the sand, every blade leaning into the current
const tufts = [];
{ const r = rng(71); for (let i = 0; i < 26; i++) tufts.push({ x: -100 + r() * 1800, y: 1080 + r() * 60 + (i % 5 === 0 ? r() * 700 : 0), n: 5 + Math.floor(r() * 5), h: 26 + r() * 30, ph: r() * 6 }); }
layer({
  id: 'grass', z: 15,
  draw(g, t) {
    const v = st.view;
    for (const tf of tufts) {
      if (tf.y > v.y1 + 10) continue;
      const w = wind(t, tf.x), s = 1 + (tf.y - 1080) * 0.0015;
      for (let i = 0; i < tf.n; i++) {
        const bx = tf.x + (i - tf.n / 2) * 3 * s, h = tf.h * s * (0.7 + ((i * 7) % 5) / 8);
        const bend = (w * 0.5 + Math.sin(t * 1.4 + tf.ph + i) * 0.18) * h;
        const p = new Path2D(); p.moveTo(bx - 1.6 * s, tf.y); p.quadraticCurveTo(bx + bend * 0.4, tf.y - h * 0.6, bx + bend, tf.y - h); p.quadraticCurveTo(bx + bend * 0.4 + 1.5 * s, tf.y - h * 0.55, bx + 1.6 * s, tf.y); p.closePath();
        g.fillStyle = i % 2 ? '#7a9a4a' : '#5e8a48'; g.fill(p); g.lineWidth = 0.9; g.strokeStyle = LINE; g.stroke(p);
      }
    }
  },
});

// ------------------------------------------------------------------ kelp
// a strand: a stem rooted at (x, y) rising h, gas floats and long blades along it, swaying with the
// current — stronger near the top. Colours fogged by depth.
const KELP = { stem: '#6b5326', blade: '#a08a34', bladeLt: '#d3bb5a', bladeSh: '#6d5a22', float: '#c1a243' };
function kelpStrand(seed, x, y, h, fog, lw) {
  const r = rng(seed), c = {};
  for (const k in KELP) c[k] = mix(KELP[k], FOG, fog);
  const blades = [];
  for (let u = 0.1 + r() * 0.05; u < 1; u += 0.03 + r() * 0.07) blades.push({ u, side: r() < 0.72 ? 1 : -1, len: (70 + r() * 90) * (0.6 + u * 0.5), w: 16 + r() * 12, ph: r() * 6 });
  c.line = mix(LINE, FOG, fog * 0.8);
  return { x, y, h, c, blades, lw, ph: r() * 10, push: 0, pv: 0 };
}
function stemPts(k, t) {
  const pts = [], n = 14;
  const w = wind(t, k.x);
  for (let i = 0; i <= n; i++) {
    const u = i / n;
    const sway = (w * 70 + Math.sin(t * 0.6 + k.ph - u * 2.5) * 30 + k.push) * Math.pow(u, 1.4);
    pts.push([k.x + sway + Math.sin(u * 4 + k.ph) * 18 * u, k.y - k.h * u]);
  }
  return pts;
}
function drawKelp(g, k, t) {
  const pts = stemPts(k, t);
  A.stroke(g, pts, 5 + k.lw * 2, k.c.line);
  A.stroke(g, pts, 5, k.c.stem);
  for (const b of k.blades) {
    const i = Math.min(pts.length - 2, Math.floor(b.u * (pts.length - 1)));
    const f = b.u * (pts.length - 1) - i;
    const x = lerp(pts[i][0], pts[i + 1][0], f), y = lerp(pts[i][1], pts[i + 1][1], f);
    // a long ruffled blade streaming downstream from a little float, bending along its length
    const w = wind(t, k.x);
    const a0 = -Math.PI / 2 + (b.side > 0 ? 0.95 : 0.35) + w * 0.4;
    const L = b.len, W = b.w, seg = 9;
    const spine = [[x, y]];
    let a = a0, px = x, py = y;
    for (let j = 1; j <= seg; j++) {
      const u = j / seg;
      a += (Math.sin(t * 1.3 + b.ph + u * 3) * 0.07 + 0.07 + w * 0.04) * (0.5 + u);
      px += Math.cos(a) * L / seg; py += Math.sin(a) * L / seg;
      spine.push([px, py]);
    }
    const Ls = [], Rs = [];
    for (let j = 0; j <= seg; j++) {
      const u = j / seg, q = spine[Math.max(0, j - 1)], n = spine[Math.min(seg, j + 1)];
      const dx = n[0] - q[0], dy = n[1] - q[1], d = Math.hypot(dx, dy) || 1;
      const hw = W * Math.sin(Math.min(1, u * 1.6 + 0.12) * Math.PI * 0.5) * (1 - u * 0.55) * 0.5;
      const ruf = 1 + 0.22 * Math.sin(u * 22 + b.ph + t * 2);
      Ls.push([spine[j][0] - (dy / d) * hw * ruf, spine[j][1] + (dx / d) * hw * ruf]);
      Rs.push([spine[j][0] + (dy / d) * hw / ruf, spine[j][1] - (dx / d) * hw / ruf]);
    }
    const p = curve([...Ls, ...Rs.reverse()]);
    g.fillStyle = k.c.blade; g.fill(p);
    g.save(); g.clip(p);
    g.globalAlpha = 0.7; A.stroke(g, Ls, W * 0.45, k.c.bladeSh); A.stroke(g, Rs, W * 0.2, k.c.bladeLt); g.globalAlpha = 1;
    A.stroke(g, spine, 1, k.c.bladeSh);
    g.restore();
    g.lineWidth = k.lw; g.strokeStyle = k.c.line; g.stroke(p);
    g.fillStyle = k.c.float; g.fill(ell(x, y, 4.5, 5.5)); g.lineWidth = k.lw * 0.8; g.stroke(ell(x, y, 4.5, 5.5));
  }
}
const kelpBack = [kelpStrand(1, 90, 990, 1450, 0.55, 1), kelpStrand(2, 250, 1060, 760, 0.3, 1.3), kelpStrand(3, 1490, 1000, 1150, 0.5, 1), kelpStrand(4, 1390, 1040, 620, 0.35, 1.2)];
const kelpFront = [kelpStrand(6, -70, 1200, 1800, 0, 1.9), kelpStrand(7, 390, 1240, 560, 0, 1.8), kelpStrand(8, 1690, 1220, 900, 0, 1.9)];
A.kelp = [...kelpBack, ...kelpFront];
function kelpUpdate(list, dt, t) {
  for (const k of list) {
    // the pointer swimming past pushes the fronds along with it
    const near = Math.abs(P.x - k.x) < 120 && P.y < k.y && P.y > k.y - k.h;
    if (near) k.pv += P.vx * 0.02 * dt * 6;
    k.pv += (-k.push * 3 - k.pv * 1.6) * dt;
    k.push += k.pv * dt;
  }
}
layer({ id: 'kelp-back', z: 20, update(dt, t) { kelpUpdate(kelpBack, dt, t); }, draw(g, t) { for (const k of kelpBack) drawKelp(g, k, t); } });
layer({ id: 'kelp-front', z: 76, update(dt, t) { kelpUpdate(kelpFront, dt, t); }, draw(g, t) { for (const k of kelpFront) drawKelp(g, k, t); } });
})();
