/* sky.js — everything behind the island, far to near: the sky and its daytime moon (z0), the
   far world sitting on the sea of cloud (z2, still: mountains, the neighbours' islands, the
   cloud floor running out to a high horizon), the cumulus drifting across the sky (z4, hover
   to make one billow), the flock (z6, scatters when you get close) and the balloon tied to the
   tree (z8, hover and the burner roars and it strains up on its tether).

   We look down on the island, so the horizon sits high, above the island's top: the cloud floor
   recedes up to it in rows that shrink and pale with distance. Anything floating above the
   horizon is seen from below, anything under it from above. */
(() => {
const D = Drawn, { TAU, clamp, lerp, ease, rng, noise, wind, circ, ell, poly, curve, ink, grad, radial, tube, lumps, st, P, layer, onLayout, sprite, blit } = D;
const { CAM, mix, rgba, frog, spawn } = CF;
const HZ = CAM.HZ;

// ------------------------------------------------------------------ the sky
layer({
  id: 'sky', z: 0, still: true,
  draw(g) {
    const v = st.view, x0 = v.x0 - 10, w = v.x1 - v.x0 + 20;
    g.fillStyle = grad(g, 0, Math.min(v.y0, -900), 0, HZ + 4, [[0, '#24407e'], [0.45, '#4a74b2'], [0.7, '#86a9cf'], [0.84, '#c9cdd2'], [0.93, '#f4d2ad'], [1, '#ffd9a6']]);
    g.fillRect(x0, v.y0 - 10, w, HZ - v.y0 + 20);
    // the sun is low and off to the right: its warmth pools along that end of the horizon
    g.fillStyle = radial(g, 1900, HZ + 10, 0, 1300, [[0, 'rgba(255,232,168,0.95)'], [0.25, 'rgba(255,205,150,0.55)'], [0.6, 'rgba(250,180,160,0.18)'], [1, 'rgba(250,180,160,0)']]);
    g.fillRect(x0, v.y0 - 10, w, HZ - v.y0 + 20);
    // and the cool side of the sky, opposite, goes faintly violet at the horizon
    g.fillStyle = radial(g, -500, HZ, 0, 1100, [[0, 'rgba(190,160,210,0.45)'], [1, 'rgba(190,160,210,0)']]);
    g.fillRect(x0, v.y0 - 10, w, HZ - v.y0 + 20);
    // a pale daytime moon, lit from the sun's side
    const mx = 150, my = 20, mr = 19;
    g.fillStyle = 'rgba(236,240,255,0.18)'; g.fill(circ(mx, my, mr));
    g.save(); g.clip(circ(mx, my, mr));
    g.fillStyle = 'rgba(255,250,240,0.72)'; g.fill(ell(mx + 9, my, mr * 0.78, mr * 1.02));
    g.fillStyle = 'rgba(190,200,230,0.35)'; g.fill(circ(mx + 6, my - 5, 3)); g.fill(circ(mx + 12, my + 6, 2.2));
    g.restore();
    // on a tall screen the sky goes on up into the first faint stars
    if (v.y0 < -250) {
      const rs = rng(77);
      for (let i = 0; i < 70; i++) {
        const y = lerp(v.y0, -260, rs() ** 1.4), x = v.x0 + rs() * (v.x1 - v.x0), a = clamp((-260 - y) / 500, 0, 1) * (0.3 + rs() * 0.6);
        g.fillStyle = `rgba(255,250,235,${a})`; g.fill(circ(x, y, 0.7 + rs() * 1.1));
        if (rs() < 0.08) { g.strokeStyle = `rgba(255,250,235,${a * 0.6})`; g.lineWidth = 0.8; g.beginPath(); g.moveTo(x - 4, y); g.lineTo(x + 4, y); g.moveTo(x, y - 4); g.lineTo(x, y + 4); g.stroke(); }
      }
      // and an island floating far above, seen from underneath, its waterfall a thread
      farIsle(g, 330, -250, 150, 0.45, 9);
      farIsle(g, 1270, -540, 80, 0.6, 13);
    }
  },
});

// ------------------------------------------------------------------ the far world on the cloud floor
// depth d: 1 is about the island's distance; the floor's rows sit at y = HZ + 300 / d
const rowY = (d) => HZ + 300 / d;
function cloudRow(g, d, seed, v) {
  const y = rowY(d), r = 46 / d ** 0.95, far = clamp((d - 0.6) / 9, 0, 1);
  const warmAt = (x) => clamp((x - 300) / 1500, 0, 1);
  const x0 = v.x0 - r * 6, x1 = v.x1 + r * 6, R = rng(seed);
  // the shadowed valley floor between this row's heads and the row in front
  const valley = mix(mix('#b79ac0', '#c9a0b4', 0.5), '#e6c8cf', far);
  if (r < 5) {
    // too far for heads: a soft band with a scalloped top
    const p = new Path2D(); p.moveTo(x0, y + r * 8);
    for (let x = x0; x <= x1; x += r * 2) p.lineTo(x, y - Math.abs(noise(x * 0.02 / r + seed)) * r * 1.8);
    p.lineTo(x1, y + r * 8); p.closePath();
    g.fillStyle = grad(g, x0, 0, x1, 0, [mix('#e2c0cc', '#f1d3cf', far), mix('#f6d2c2', '#f9dcc6', far), mix('#ffe0b6', '#ffe6c4', far)]);
    g.fill(p);
    return;
  }
  g.fillStyle = valley; g.fillRect(x0, y - r * 0.2, x1 - x0, r * 2.6);
  // the row breaks into separate masses, each a mound of heads, biggest in its middle
  for (let x = x0; x < x1; ) {
    const len = r * (5 + R() * 14), gap = r * (R() < 0.35 ? 1.5 + R() * 3 : 0.2);
    const cs = [], n = Math.max(3, Math.round(len / (r * 0.9)));
    const tall = 0.4 + R() ** 1.5 * 1.6;
    for (let i = 0; i < n; i++) {
      const u = i / (n - 1), env = Math.sin(Math.PI * (0.08 + u * 0.84)) ** 0.7;
      const rr = r * (0.45 + 0.75 * env * tall) * (0.6 + R() * 0.8);
      cs.push([x + u * len, y - rr * 0.55 * env * tall + noise(x * 0.01 + i) * r * 0.15, rr]);
    }
    for (let i = 0; i < n * 0.5; i++) { const u = 0.2 + R() * 0.6, env = Math.sin(Math.PI * u); cs.push([x + u * len, y - r * tall * env * (0.9 + R() * 0.4), r * (0.35 + 0.4 * env * tall)]); }
    // a skirt of lumps under the mass so it never shows a flat seam
    for (let xx = x; xx < x + len; xx += r * 0.9) cs.push([xx, y + r * 0.7, r * 0.95]);
    // with distance the heads lose their lit crescents and their shade: they flatten into haze
    const w = warmAt(x + len / 2), k = clamp(far * 1.8, 0, 1);
    const base = mix(mix('#f1d8da', '#fbd8c4', w), '#f3d8d0', far * 0.6);
    lumps(g, cs, {
      union: true, lw: 1.2, line: null,
      shade: mix(mix('#b9a0cc', '#d2a6bc', w), base, k * 0.75),
      base,
      lit: mix(mix('#fff2e8', '#fff0cc', w), base, k),
    });
    x += len + gap;
  }
}
// a big bank of cumulus heaped up out of the floor: the large shapes the floor is built around
function bank(g, x, y, w, h, seed, warm) {
  const cs = cumulusCircles(seed, w, h).map(([cx, cy, r]) => [x + cx, y + cy, r]);
  for (let xx = x - w / 2; xx < x + w / 2; xx += h * 0.3) cs.push([xx, y + h * 0.12, h * 0.3]);
  lumps(g, cs, { union: true, lw: 1.4, line: rgba('#9a6a8c', 0.28),
    shade: mix('#ad92c6', '#d29cb0', warm), base: mix('#f0d6dc', '#fcd6bc', warm), lit: mix('#fff4ec', '#fff0c8', warm) }, y + h * 0.3);
  // its shaded flank away from the sun, and the dark where it sinks into the floor
  g.save(); g.globalCompositeOperation = 'multiply';
  const U = new Path2D(); for (const [cx, cy, r] of cs) D.circ(cx, cy, r, U);
  g.clip(U);
  g.fillStyle = grad(g, x - w / 2, 0, x + w / 2, 0, ['rgba(140,120,190,0.45)', 'rgba(200,180,220,0.1)', 'rgba(255,255,255,0)']); g.fillRect(x - w, y - h * 1.6, w * 2, h * 2);
  g.fillStyle = grad(g, 0, y - h * 0.2, 0, y + h * 0.3, ['rgba(255,255,255,0)', 'rgba(150,120,180,0.5)']); g.fillRect(x - w, y - h * 0.2, w * 2, h * 0.5);
  g.restore();
}
function mountain(g, pts, haze) {
  const p = poly(pts);
  g.fillStyle = mix('#8d86b4', '#d4bcc8', haze); g.fill(p);
  g.save(); g.clip(p);
  // the sunward faces (right of each ridge) lit warm
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1];
    if (by <= ay) continue;
    g.fillStyle = mix('#e7b5a0', '#f3d3c4', haze);
    g.fill(poly([[ax, ay], [bx, by], [bx - 30, by + 400], [ax - 8, ay + 400]]));
  }
  g.restore();
  // snow on the peaks
  const top = pts.reduce((a, b) => (b[1] < a[1] ? b : a));
  g.fillStyle = mix('#fff6ee', '#fbe9e4', haze);
  const [tx, ty] = top;
  g.fill(poly([[tx, ty], [tx + 22, ty + 20], [tx + 12, ty + 17], [tx + 4, ty + 26], [tx - 7, ty + 18], [tx - 16, ty + 22]]));
}
// a neighbour's island far off. above the horizon we see its underside; below it, its top
function farIsle(g, x, y, w, haze, seed) {
  const r = rng(seed), above = y < HZ;
  const rock = new Path2D();
  const tip = [x + w * 0.06, y + w * 0.75];
  rock.moveTo(x - w / 2, y);
  rock.bezierCurveTo(x - w * 0.42, y + w * 0.3, tip[0] - w * 0.12, tip[1] - w * 0.2, tip[0], tip[1]);
  rock.bezierCurveTo(tip[0] + w * 0.12, tip[1] - w * 0.25, x + w * 0.42, y + w * 0.32, x + w / 2, y);
  rock.closePath();
  const sh = mix('#8a7fae', '#cdb8c8', haze), lt = mix('#e3a98e', '#efcdbf', haze);
  g.fillStyle = grad(g, x - w / 2, 0, x + w / 2, 0, [sh, mix(sh, lt, 0.45), lt]); g.fill(rock);
  g.fillStyle = mix('#5d5a8a', '#bba9c0', haze);
  g.save(); g.clip(rock); g.globalAlpha = 0.4;
  g.globalAlpha = 0.18; for (let i = 0; i < 2; i++) { g.fill(ell(x - w * 0.05, y + w * (0.2 + i * 0.2), w * (0.38 - i * 0.12), w * 0.02)); }
  g.restore(); g.globalAlpha = 1;
  // its waterfall, a thread of light
  g.strokeStyle = grad(g, 0, y, 0, y + w * 1.1, [rgba('#fff6ea', 0.7 - haze * 0.3), rgba('#fff6ea', 0)]); g.lineWidth = Math.max(1, w * 0.02);
  g.beginPath(); g.moveTo(x + w * 0.33, y + w * 0.04); g.quadraticCurveTo(x + w * 0.4, y + w * 0.5, x + w * 0.38, y + w * 1.1); g.stroke();
  const grassC = mix('#6f9a6a', '#bccab0', haze), treeC = mix('#4f7a62', '#a9bba8', haze);
  if (above) {
    g.fillStyle = grassC; g.fill(ell(x, y, w / 2, w * 0.035));
    for (let i = 0; i < 3; i++) { const tx = x - w * 0.3 + r() * w * 0.5; g.fillStyle = treeC; g.fill(circ(tx, y - w * 0.06, w * (0.06 + r() * 0.04))); }
    g.fillStyle = mix('#a35a52', '#d2aaa4', haze); g.fill(poly([[x + w * 0.12, y - w * 0.02], [x + w * 0.18, y - w * 0.15], [x + w * 0.24, y - w * 0.02]]));
  } else {
    g.fillStyle = grassC; g.fill(ell(x, y, w / 2, w * 0.12));
    g.fillStyle = mix('#e0cdb4', '#efe0d2', haze); g.fillRect(x + w * 0.05, y - w * 0.14, w * 0.12, w * 0.12);
    g.fillStyle = mix('#a35a52', '#d2aaa4', haze); g.fill(poly([[x + w * 0.03, y - w * 0.14], [x + w * 0.11, y - w * 0.24], [x + w * 0.19, y - w * 0.14]]));
    g.fillStyle = treeC; g.fill(circ(x - w * 0.2, y - w * 0.08, w * 0.09)); g.fill(circ(x - w * 0.1, y - w * 0.1, w * 0.07));
    // a mill of their own, sails turning far away (well, not turning: it's far)
    g.strokeStyle = mix('#6a5070', '#c2aab8', haze); g.lineWidth = Math.max(0.8, w * 0.012);
    const mx = x + w * 0.32, my = y - w * 0.2;
    g.beginPath(); g.moveTo(mx, y - w * 0.02); g.lineTo(mx, my);
    for (let k = 0; k < 4; k++) { const a = k * TAU / 4 + 0.4; g.moveTo(mx, my); g.lineTo(mx + Math.cos(a) * w * 0.09, my + Math.sin(a) * w * 0.09); }
    g.stroke();
  }
}
layer({
  id: 'far', z: 2, still: true,
  draw(g) {
    const v = st.view;
    // the floor of cloud, farthest rows first, with the far world set in among them
    const ds = [];
    for (let d = 40; rowY(d) - 60 / d < v.y1 + 40; d *= 0.86) ds.push(d);
    let seed = 1;
    const at = (dd, fn) => ({ d: dd, fn });
    const things = [
      at(14, () => mountain(g, [[-420, 360], [-300, 300], [-250, 312], [-150, 262], [-60, 308], [20, 292], [140, 364]], 0.7)),
      at(9, () => mountain(g, [[1260, 380], [1380, 310], [1430, 324], [1530, 270], [1640, 332], [1760, 306], [1900, 382]], 0.55)),
      at(20, () => mountain(g, [[300, 335], [370, 304], [420, 312], [480, 292], [560, 338]], 0.85)),
      at(7, () => farIsle(g, 1450, 410, 120, 0.45, 3)),
      at(5, () => farIsle(g, -60, 190, 130, 0.35, 7)),
      at(3.2, () => bank(g, 100, rowY(3.2) + 10, 760, 210, 31, 0.1)),
      at(2.4, () => bank(g, 1640, rowY(2.4) + 10, 820, 260, 33, 1)),
      at(1.3, () => bank(g, -200, rowY(1.3) + 30, 900, 300, 35, 0.2)),
      at(0.26, () => bank(g, 1100, rowY(0.26) + 60, 1300, 420, 37, 0.7)),
    ];
    for (const d of ds) {
      for (const th of things) if (!th.done && th.d >= d) { th.fn(); th.done = true; }
      cloudRow(g, d, seed++, v);
    }
    // the island's own shadow, far below on the cloud floor, thrown back and to the left
    g.save(); g.globalCompositeOperation = 'multiply';
    const [shx, shy] = [CF.CAM.cx - 330, HZ + 300 / 0.9];
    g.fillStyle = radial(g, shx, shy, 0, 330, [[0, 'rgba(150,130,190,0.45)'], [0.7, 'rgba(170,150,200,0.25)'], [1, 'rgba(200,180,220,0)']]);
    g.save(); g.translate(shx, shy); g.scale(1, 0.18); g.fill(circ(0, 0, 330)); g.restore();
    g.restore();
    // and the plain dimming of the cloud right under it, where the island hides the sky
    g.save(); g.globalCompositeOperation = 'multiply';
    const [ux, uy] = [CF.CAM.cx + 40, CF.CAM.cy + 520];
    g.fillStyle = radial(g, ux, uy, 0, 360, [[0, 'rgba(170,150,200,0.4)'], [1, 'rgba(200,180,220,0)']]);
    g.save(); g.translate(ux, uy); g.scale(1, 0.22); g.fill(circ(0, 0, 360)); g.restore();
    g.restore();
    // the sun's warmth laid across the cloud tops on its side
    g.save(); g.globalCompositeOperation = 'soft-light';
    g.fillStyle = radial(g, 1900, HZ + 40, 0, 1300, [[0, 'rgba(255,190,110,0.55)'], [1, 'rgba(255,190,110,0)']]);
    g.fillRect(v.x0, HZ, v.x1 - v.x0, v.y1 - HZ);
    g.restore();
    // the cloud floor falls into shadow further from the sun, and toward us
    g.save(); g.globalCompositeOperation = 'multiply';
    g.fillStyle = grad(g, v.x0, 0, v.x1, 0, ['rgba(150,130,190,0.15)', 'rgba(200,180,210,0.05)', 'rgba(255,255,255,0)']);
    g.fillRect(v.x0, HZ + 30, v.x1 - v.x0, v.y1 - HZ);
    g.restore();
    // and a haze along the horizon line itself, so the far rows melt into the sky
    g.fillStyle = grad(g, 0, HZ - 30, 0, HZ + 60, [[0, 'rgba(255,228,196,0)'], [0.45, 'rgba(255,228,196,0.75)'], [1, 'rgba(255,228,196,0)']]);
    g.fillRect(v.x0, HZ - 30, v.x1 - v.x0, 90);
  },
});

// ------------------------------------------------------------------ cumulus drifting across the sky
const CLOUD = { union: true, line: 'rgba(150,120,170,0.22)', lw: 1.2, shade: '#c8bcdc', base: '#f3e6ea', lit: '#fff7ea' };
function cumulusCircles(seed, w, h) {
  const r = rng(seed), cs = [], n = Math.max(4, Math.round(w / 42));
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), env = Math.sin(Math.PI * (0.06 + u * 0.88));
    const rr = h * (0.28 + 0.42 * env) * (0.85 + r() * 0.3);
    cs.push([(u - 0.5) * w + (r() - 0.5) * 14, -rr * 0.5, rr]);
  }
  for (let i = 0; i < n * 0.7; i++) {
    const u = 0.18 + r() * 0.64, env = Math.sin(Math.PI * u);
    cs.push([(u - 0.5) * w, -h * (0.45 + 0.45 * env * (0.6 + r() * 0.4)), h * (0.2 + 0.3 * env)]);
  }
  return cs;
}
CF.cumulusCircles = cumulusCircles;
const clouds = [
  { x: 1320, y: 110, w: 380, h: 160, seed: 3, sp: 3.2 },
  { x: 1520, y: 150, w: 200, h: 60, seed: 4, sp: 3.2 },
  { x: 640, y: 40, w: 170, h: 50, seed: 9, sp: 4.5 },
  { x: -40, y: 130, w: 300, h: 85, seed: 21, sp: 5 },
  { x: 940, y: -250, w: 340, h: 190, seed: 14, sp: 2.6 },
  { x: 260, y: -480, w: 260, h: 74, seed: 17, sp: 2.2 },
  { x: 1180, y: -700, w: 140, h: 40, seed: 19, sp: 2.2 },
];
onLayout(() => {
  for (const c of clouds) {
    c.cs = cumulusCircles(c.seed, c.w, c.h);
    // the underside of a cloud above us is in its own shade; its top catches the sun
    c.sp_ = sprite(-c.w * 0.6 - c.h, -c.h * 1.9, c.w * 1.2 + c.h * 2, c.h * 2.1, (g) => {
      // a base of small lumps, so the underside is nearly flat but never ruled
      const r = rng(c.seed * 5), cs = c.cs.slice();
      for (let x = -c.w * 0.46; x < c.w * 0.46; x += c.h * 0.2) cs.push([x, -c.h * 0.1 + (r() - 0.5) * c.h * 0.05, c.h * (0.13 + r() * 0.06)]);
      const warm = clamp((c.x + 200) / 1600, 0, 1), dusk = clamp(-c.y / 500, 0, 1);
      lumps(g, cs, { union: true, line: rgba('#8f7cae', 0.22), lw: 1.1, shade: mix(mix('#aaa2d2', '#cfa6c0', warm), '#6a6aa8', dusk * 0.6), base: mix(mix('#ece4f2', '#fbe2d8', warm), '#b8b0d8', dusk * 0.5), lit: mix(mix('#fffaf4', '#fff0d2', warm), '#ffd6b0', dusk * 0.5) }, c.h * 0.02);
      g.save(); g.globalCompositeOperation = 'source-atop';
      // the underside, in its own shade; the sun-side tops catching warm
      g.fillStyle = grad(g, 0, -c.h * 0.7, 0, 0, [[0, 'rgba(150,130,190,0)'], [1, 'rgba(150,130,190,0.5)']]);
      g.fillRect(-c.w, -c.h * 0.7, c.w * 2, c.h * 0.8);
      g.fillStyle = radial(g, c.w * 0.3, -c.h, 0, c.w * 0.6, [[0, `rgba(255,214,160,${0.25 + warm * 0.3})`], [1, 'rgba(255,214,160,0)']]);
      g.fillRect(-c.w, -c.h * 1.3, c.w * 2, c.h * 1.4);
      g.restore();
    });
    c.billow = c.billow || 0;
  }
});
layer({
  id: 'clouds', z: 4,
  hit(x, y) { for (const c of clouds) if (((x - c.cx) / (c.w * 0.5)) ** 2 + ((y - c.cy + c.h * 0.45) / (c.h * 0.6)) ** 2 < 1) return (this.which = c), true; return false; },
  update(dt, t, L) {
    const v = st.view;
    for (const c of clouds) {
      const span = v.x1 - v.x0 + c.w * 1.4;
      c.cx = v.x0 - c.w * 0.7 + ((((c.x - v.x0 + c.w * 0.7) + t * c.sp * (0.6 + wind(t) * 0.5)) % span) + span) % span;
      c.cy = c.y + Math.sin(t * 0.2 + c.seed) * 4;
      const on = L.hovered && L.which === c;
      c.billow = ease(c.billow, on ? 1 : 0, on ? 3 : 1.2, dt);
    }
  },
  draw(g, t) {
    for (const c of clouds) {
      const k = 1 + 0.012 * Math.sin(t * 0.6 + c.seed) + c.billow * (0.045 + 0.012 * Math.sin(t * 3));
      g.save(); g.translate(c.cx, c.cy); g.scale(k, k * (1 + c.billow * 0.03)); blit(g, c.sp_); g.restore();
    }
  },
});

// ------------------------------------------------------------------ a flock crossing the high sky
const flock = { x: 200, y: 20, birds: [] };
for (let i = 0; i < 7; i++) flock.birds.push({ dx: -i * 26 + (i % 2) * 12, dy: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * 11, ph: i * 1.7, ox: 0, oy: 0, vx: 0, vy: 0 });
layer({
  id: 'birds', z: 6,
  hit: (x, y) => Math.hypot(x - flock.x + 70, y - flock.y) < 120,
  onEnter() { for (const b of flock.birds) { b.vx += (Math.random() - 0.5) * 160 + P.vx * 0.15; b.vy -= 60 + Math.random() * 90; } },
  update(dt, t, L) {
    const v = st.view;
    flock.x += dt * (30 + L.hover * 30);
    if (flock.x > v.x1 + 260) flock.x = v.x0 - 80;
    flock.y = 20 + Math.sin(t * 0.21) * 26;
    for (const b of flock.birds) {
      b.vx += (-3 * b.ox - 1.6 * b.vx) * dt; b.vy += (-3 * b.oy - 1.6 * b.vy) * dt;
      b.ox += b.vx * dt; b.oy += b.vy * dt;
    }
  },
  draw(g, t, L) {
    for (const b of flock.birds) {
      const x = flock.x + b.dx + b.ox, y = flock.y + b.dy + b.oy + Math.sin(t * 1.3 + b.ph) * 4;
      const flap = Math.hypot(b.vx, b.vy) > 20 ? 14 : 6.5 + L.hover * 6;
      const f = Math.sin(t * flap + b.ph);
      const p = new Path2D();
      p.moveTo(x - 10, y - 2 - f * 6); p.quadraticCurveTo(x - 4, y - 4 - f * 3, x, y);
      p.quadraticCurveTo(x + 4, y - 4 - f * 3, x + 10, y - 2 - f * 6);
      g.lineWidth = 2.6; g.strokeStyle = '#43375a'; g.stroke(p);
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,200,160,0.6)'; g.beginPath(); g.moveTo(x + 1, y - 1); g.quadraticCurveTo(x + 4, y - 3 - f * 3, x + 9, y - 2 - f * 6); g.stroke();
    }
  },
});

// ------------------------------------------------------------------ the balloon, tied to the tree
const balloon = (CF.balloon = { x: 400, y: 120, rise: 0, flame: 0, tie: CF.pr(-392, 190, -70), blink: D.blinker(), sway: 0, sv: 0 });
layer({
  id: 'balloon', z: 8,
  hit: (x, y) => Math.hypot(x - balloon.cx, y - balloon.cy) < 84 || (Math.abs(x - balloon.cx) < 30 && y > balloon.cy + 72 && y < balloon.cy + 140),
  onEnter() { balloon.sv += (P.vx > 0 ? 1 : -1) * 0.6; },
  update(dt, t, L) {
    balloon.rise = ease(balloon.rise, L.hover, 1.2, dt);
    balloon.flame = ease(balloon.flame, L.hovered ? 1 : 0, L.hovered ? 9 : 4, dt);
    const push = (D.wind(t, 300) - 0.75) * 0.08;
    balloon.sv += (-6 * (balloon.sway - push) - 0.9 * balloon.sv) * dt;
    balloon.sway += balloon.sv * dt;
    balloon.cx = balloon.x + balloon.sway * 140 + Math.sin(t * 0.5) * 4;
    balloon.cy = balloon.y + Math.sin(t * 0.8) * 6 - balloon.rise * 24;
  },
  draw(g, t, L) {
    const cx = balloon.cx, cy = balloon.cy, r = 88, tilt = balloon.sway * 0.8;
    const bx = cx + Math.sin(tilt) * 160, by = cy + 160, [tx, ty] = balloon.tie;
    const sag = 50 - balloon.rise * 36;
    g.lineWidth = 1.5; g.strokeStyle = '#6e4c46';
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo((bx + tx) / 2 - 10, (by + ty) / 2 + sag, tx, ty); g.stroke();
    g.save(); g.translate(cx, cy); g.rotate(tilt);
    const env = new Path2D();
    env.moveTo(-20, r + 12);
    env.bezierCurveTo(-52, r - 6, -r, r * 0.35, -r, -6);
    env.bezierCurveTo(-r, -r * 0.62, -r * 0.55, -r * 1.02, 0, -r * 1.02);
    env.bezierCurveTo(r * 0.55, -r * 1.02, r, -r * 0.62, r, -6);
    env.bezierCurveTo(r, r * 0.35, 52, r - 6, 20, r + 12);
    env.closePath();
    g.lineWidth = 3.4; g.strokeStyle = LINEB; g.stroke(env);
    g.save(); g.clip(env);
    // gores: they curve round the envelope, so draw them as narrowing ellipses
    const gores = ['#f3e4c4', '#d9654f', '#f3e4c4', '#3f8d93', '#f3e4c4', '#d9654f', '#f3e4c4'];
    g.fillStyle = gores[0]; g.fillRect(-r - 5, -r - 20, r * 2 + 10, r * 2 + 50);
    for (let i = 1; i < gores.length; i++) {
      const k = Math.cos((i / gores.length) * Math.PI * 0.5);
      g.fillStyle = gores[i]; g.fill(ell(0, 0, r * k, r * 1.25));
    }
    // round form: shade away from the sun, a warm rim on its side, a sheen near the top
    g.fillStyle = grad(g, -r, 0, r, 0, [[0, 'rgba(60,40,100,0.5)'], [0.5, 'rgba(60,40,100,0.08)'], [0.8, 'rgba(255,230,180,0)'], [1, 'rgba(255,214,160,0.5)']]);
    g.fillRect(-r - 5, -r - 20, r * 2 + 10, r * 2 + 50);
    g.fillStyle = grad(g, 0, -r, 0, r + 12, [[0, 'rgba(255,250,230,0.2)'], [0.6, 'rgba(60,40,100,0)'], [1, 'rgba(60,40,100,0.35)']]);
    g.fillRect(-r - 5, -r - 20, r * 2 + 10, r * 2 + 50);
    g.fillStyle = 'rgba(255,250,235,0.5)'; g.fill(ell(r * 0.38, -r * 0.55, 8, 15, undefined, 0.5));
    g.lineWidth = 1.1; g.strokeStyle = 'rgba(58,34,50,0.35)';
    for (const yy of [-r * 0.45, 0, r * 0.45]) { g.beginPath(); g.ellipse(0, yy, r, 9, 0, 0, Math.PI); g.stroke(); }
    // a patch sewn on, someone's mended it
    ink(g, poly([[-34, 8], [-18, 6], [-17, 22], [-33, 23]]), '#e9c35c', 1.1);
    g.lineWidth = 0.8; g.strokeStyle = 'rgba(58,34,50,0.5)'; g.setLineDash([2, 2]); g.stroke(poly([[-32, 9], [-19, 8], [-18.5, 21], [-31.5, 21.5]])); g.setLineDash([]);
    if (balloon.flame > 0.02) { g.fillStyle = radial(g, 0, r, 0, r * 1.2, [[0, `rgba(255,200,110,${0.55 * balloon.flame})`], [1, 'rgba(255,190,110,0)']]); g.fillRect(-r - 5, -r - 20, r * 2 + 10, r * 2 + 50); }
    g.restore();
    g.lineWidth = 1.3; g.strokeStyle = '#5a3c3c';
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 19, r + 12); g.lineTo(sx * 23, r + 38); g.stroke(); }
    if (balloon.flame > 0.02) {
      const f = balloon.flame, fl = 14 + 3 * Math.sin(t * 40);
      g.fillStyle = `rgba(255,170,60,${0.9 * f})`;
      g.beginPath(); g.moveTo(-6, r + 28); g.quadraticCurveTo(-7, r + 12 - fl * f * 0.6, 0, r + 10 - fl * f); g.quadraticCurveTo(7, r + 12 - fl * f * 0.6, 6, r + 28); g.fill();
      g.fillStyle = `rgba(255,240,170,${f})`; g.fill(ell(0, r + 24 - fl * 0.3 * f, 3, 6 * f + 1));
    }
    const [lookX, lookY] = CF.lookAt(cx, cy + 110, [clamp((P.x - cx) / 300, -1, 1), clamp((P.y - cy - 110) / 300, -1, 1)], 300);
    frog(g, 2, r + 62, 0.78, { c: CF.FROG_TINTS.gold, open: balloon.blink(t), look: [lookX, lookY], smile: 2 + L.hover * 2.5,
      arms: L.hover > 0.3 ? [[18, -22 - Math.sin(t * 12) * 6 * L.hover]] : null,
      hat: (g, lw) => { ink(g, poly([[-14, -33], [14, -33], [10, -38], [-10, -38]]), '#7a4a3a', lw); ink(g, D.ell(0, -38, 10, 5), '#8f5a44', lw); } });
    const bk = poly([[-25, r + 40], [25, r + 40], [21, r + 72], [-21, r + 72]]);
    ink(g, bk, grad(g, -25, 0, 25, 0, ['#7d5234', '#b9874e', '#e8be7c']), 2);
    g.lineWidth = 1; g.strokeStyle = 'rgba(58,34,50,0.45)';
    for (let yy = r + 46; yy < r + 72; yy += 5) { g.beginPath(); g.moveTo(-24, yy); g.lineTo(24, yy); g.stroke(); }
    for (let xx = -18; xx < 20; xx += 7) { g.beginPath(); g.moveTo(xx, r + 41); g.lineTo(xx * 0.86, r + 71); g.stroke(); }
    ink(g, D.rect(-27, r + 37, 54, 5), '#6c4430', 1.6);
    // a sandbag over the side
    ink(g, ell(-26, r + 52, 5, 7), '#cdb48a', 1.2);
    g.restore();
  },
});
const LINEB = '#3a2232';

// ------------------------------------------------------------------ a school of sky-fish in the cloud tops
// far below the island, only on a tall screen: they porpoise in and out of the cloud, and scatter
const school = { x: 700, fish: Array.from({ length: 14 }, (_, i) => ({ dx: i * 22 + (i % 2) * 8, dy: (i % 3) * 10, ph: i * 0.8, ox: 0, oy: 0, vx: 0, vy: 0 })) };
layer({
  id: 'school', z: 3,
  hit: (x, y) => st.view.y1 > 1500 && Math.abs(y - 1560) < 120 && Math.abs(x - school.cx) < 120,
  onEnter() { for (const f of school.fish) { f.vx += (Math.random() - 0.5) * 200; f.vy += (Math.random() - 0.5) * 160; } },
  update(dt, t) {
    const v = st.view;
    school.x += dt * 26;
    school.cx = v.x0 - 150 + (school.x % (v.x1 - v.x0 + 300));
    for (const f of school.fish) { f.vx += (-3 * f.ox - 1.5 * f.vx) * dt; f.vy += (-3 * f.oy - 1.5 * f.vy) * dt; f.ox += f.vx * dt; f.oy += f.vy * dt; }
  },
  draw(g, t) {
    if (st.view.y1 < 1500) return;
    for (const f of school.fish) {
      const x = school.cx + f.dx + f.ox, arc = Math.sin(t * 1.4 + f.ph + f.dx * 0.02), y = 1540 + f.dy - Math.max(0, arc) * 34 + f.oy;
      const dive = clamp(arc * 2, -1, 1);
      g.save(); g.translate(x, y); g.rotate(-Math.cos(t * 1.4 + f.ph + f.dx * 0.02) * 0.5);
      g.globalAlpha = clamp(0.35 + arc, 0, 1);
      const wag = Math.sin(t * 9 + f.ph) * 2.5;
      ink(g, poly([[-7, 0], [-13, -4 + wag], [-13, 4 + wag]]), '#f2a65e', 1.1);
      ink(g, ell(0, 0, 8, 5.2), grad(g, 0, -5, 0, 5, ['#ffd48a', '#f29a5e']), 1.2);
      g.fillStyle = '#2a1c26'; g.fill(circ(3.5, -1, 1.2));
      g.restore();
      // the cloud closes over them as they dive
      if (dive < 0.2) { g.fillStyle = `rgba(250,226,220,${clamp(0.4 - dive, 0, 0.7)})`; g.fill(ell(x, y + 6, 14, 5)); }
      if (Math.abs(arc) < 0.12) { g.strokeStyle = 'rgba(255,255,255,0.7)'; g.lineWidth = 1.2; g.beginPath(); g.ellipse(x, y + 8, 12, 3, 0, Math.PI, TAU); g.stroke(); }
    }
  },
});
})();
