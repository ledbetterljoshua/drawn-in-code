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
A.SURF = -520;   // the surface (only a phone shows it)
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
// a coral head or sponge clump on a ridge
function coralHead(g, x, y, s, col) { lumps(g, [[x, y - s * 0.4, s * 0.6], [x - s * 0.55, y - s * 0.15, s * 0.45], [x + s * 0.6, y - s * 0.1, s * 0.48], [x + s * 0.1, y - s * 0.85, s * 0.42]], col); }
function fan(g, x, y, h, color, lw, r) {
  // a sea fan: a lattice of branching twigs
  const branch = (x0, y0, a, len, d) => {
    const x1 = x0 + Math.cos(a) * len, y1 = y0 + Math.sin(a) * len;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineWidth = lw * (1 + d * 0.4); g.strokeStyle = color; g.stroke();
    if (d > 0) for (const da of [-0.38, 0.32]) branch(x1, y1, a + da + (r() - 0.5) * 0.3, len * (0.68 + r() * 0.12), d - 1);
  };
  branch(x, y, -Math.PI / 2 + (r() - 0.5) * 0.3, h * 0.32, 4);
}
layer({
  id: 'far-bed', z: 4, still: true,
  draw(g) {
    const v = st.view;
    // farthest: barely a shape in the haze
    ridge(g, 905, 60, 11, mix('#3f8f9c', FOG, 0.55), null, (pts, r) => {
      for (let i = 0; i < 16; i++) { const [x, y] = pts[Math.floor(r() * pts.length)]; coralHead(g, x, y + 6, 16 + r() * 22, { shade: mix('#3d8a99', FOG, 0.6), base: mix('#4a97a2', FOG, 0.6), lit: mix('#5aa5aa', FOG, 0.6), union: true }); }
    });
    ridge(g, 975, 70, 23, mix('#3b8192', FOG, 0.35), null, (pts, r) => {
      for (let i = 0; i < 14; i++) { const [x, y] = pts[Math.floor(r() * pts.length)]; fan(g, x, y + 8, 60 + r() * 70, mix('#5b8a9c', FOG, 0.45), 1.4, r); }
      for (let i = 0; i < 18; i++) { const [x, y] = pts[Math.floor(r() * pts.length)]; coralHead(g, x, y + 8, 18 + r() * 26, { shade: mix('#386f86', FOG, 0.4), base: mix('#4a8796', FOG, 0.4), lit: mix('#6aa4a8', FOG, 0.4), union: true }); }
    });
    ridge(g, 1040, 55, 37, mix('#5f8f95', FOG, 0.12), mix('#2f5e70', FOG, 0.2), (pts, r) => {
      for (let i = 0; i < 12; i++) { const [x, y] = pts[Math.floor(r() * pts.length)]; fan(g, x, y + 10, 70 + r() * 90, ['#b56a83', '#c98a5e', '#8f6fa8'][i % 3], 1.8, r); }
      for (let i = 0; i < 22; i++) {
        const [x, y] = pts[Math.floor(r() * pts.length)];
        const k = i % 3;
        coralHead(g, x, y + 10, 20 + r() * 30, [
          { line: '#2f5468', lw: 1.2, shade: '#4f7f8d', base: '#6a9b9c', lit: '#94bfae' },
          { line: '#3b4a6a', lw: 1.2, shade: '#7d6f9a', base: '#9a8db4', lit: '#c0b3cf' },
          { line: '#4b4a5a', lw: 1.2, shade: '#a77a6a', base: '#c39a7b', lit: '#e2c095' }][k]);
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
let cau = null;
onLayout(() => {
  const r = rng(3), w = 700, h = 260;
  cau = sprite(0, 0, w, h, (g) => {
    g.strokeStyle = 'rgba(255,255,230,0.9)';
    const cells = [];
    for (let i = 0; i < 60; i++) cells.push([r() * w, r() * h]);
    for (const [x, y] of cells) {
      const pts = []; const R = 26 + r() * 22;
      for (let k = 0; k < 7; k++) { const a = (k / 7) * TAU + r() * 0.4; pts.push([x + Math.cos(a) * R * (0.7 + r() * 0.5), y + Math.sin(a) * R * 0.45 * (0.7 + r() * 0.5)]); }
      g.lineWidth = 1 + r() * 1.6; g.stroke(curve(pts));
    }
  });
});
layer({
  id: 'caustics', z: 9,
  draw(g, t) {
    if (!cau) return;
    const v = st.view;
    g.save();
    g.beginPath(); g.rect(v.x0, A.BED - 10, v.x1 - v.x0, Math.min(500, v.y1 - A.BED + 10)); g.clip();
    g.globalCompositeOperation = 'lighter';
    for (const [k, sp, al] of [[0, 9, 0.16], [1, -6, 0.12]]) {
      g.globalAlpha = al * (0.8 + 0.2 * Math.sin(t * 0.9 + k));
      const off = ((t * sp) % 700 + 700) % 700;
      for (let x = v.x0 - 700 + off; x < v.x1; x += 700) g.drawImage(cau.c, x, A.BED - 6 + k * 40, 700, 260 * (1 + k * 0.4));
    }
    g.restore();
  },
});

// ------------------------------------------------------------------ the ark's shadow on the sand
layer({
  id: 'ark-shadow', z: 12,
  draw(g) {
    const up = clamp(-A.bob / 40, -0.5, 1.5);
    const cx = A.C[0] + 120, cy = A.BED + 22, rx = 430 * (1 + up * 0.08), ry = 30 * (1 + up * 0.08);
    g.save();
    for (let i = 0; i < 5; i++) {
      g.fillStyle = `rgba(28,70,86,${(0.09 - up * 0.015) * (1 - i * 0.12)})`;
      g.fill(ell(cx, cy, rx * (1 - i * 0.16), ry * (1 - i * 0.16)));
    }
    g.restore();
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
  for (let u = 0.06; u < 1; u += 0.045 + r() * 0.04) blades.push({ u, side: blades.length % 2 ? 1 : -1, len: 70 + r() * 60, w: 15 + r() * 9, ph: r() * 6 });
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
  A.stroke(g, pts, 5 + k.lw * 2, LINE);
  A.stroke(g, pts, 5, k.c.stem);
  for (const b of k.blades) {
    const i = Math.min(pts.length - 2, Math.floor(b.u * (pts.length - 1)));
    const f = b.u * (pts.length - 1) - i;
    const x = lerp(pts[i][0], pts[i + 1][0], f), y = lerp(pts[i][1], pts[i + 1][1], f);
    // a long ruffled blade streaming downstream from a little float, bending along its length
    const w = wind(t, k.x);
    const a0 = -Math.PI / 2 + b.side * 0.9 + w * 0.5 * (b.side > 0 ? 0.6 : 1.2);
    const L = b.len, W = b.w, seg = 9;
    const spine = [[x, y]];
    let a = a0, px = x, py = y;
    for (let j = 1; j <= seg; j++) {
      const u = j / seg;
      a += (Math.sin(t * 1.3 + b.ph + u * 3) * 0.16 + (0.18 + w * 0.12) * (b.side > 0 ? 1 : -0.4)) * (0.5 + u);
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
    g.lineWidth = k.lw; g.strokeStyle = LINE; g.stroke(p);
    g.fillStyle = k.c.float; g.fill(ell(x, y, 4.5, 5.5)); g.lineWidth = k.lw * 0.8; g.stroke(ell(x, y, 4.5, 5.5));
  }
}
const kelpBack = [kelpStrand(1, 120, 1060, 1400, 0.45, 1.1), kelpStrand(2, 230, 1070, 1150, 0.3, 1.3), kelpStrand(3, 1440, 1060, 1300, 0.42, 1.1), kelpStrand(4, 1530, 1070, 1500, 0.28, 1.3)];
const kelpFront = [kelpStrand(6, -30, 1180, 1750, 0, 1.8), kelpStrand(7, 1650, 1190, 1700, 0, 1.8)];
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
