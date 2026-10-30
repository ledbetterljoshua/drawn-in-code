/* shells.js — how a shell is built and painted. Three growth forms: the spire (a stack of whorls
   leaning back, the grandmother's tower and the bookbinder's cone), the globe (a garden-snail coil
   seen from the side: the tea-house, the young snail, the sleeper) and the ram (a flat ribbed coil:
   the fishmonger). Each is shaded as the curved solid it is — lit from the low sun on the left,
   cool in its turning-away side, warm bounce from the sand underneath — with growth lines that
   follow the curvature, broken colour bands that follow the spiral, and a heavy silhouette over light
   sutures. Geometry is pure maths (F.spire / F.globe) so the towns built on top can find the
   ledges, sutures and faces. Everything here draws in a snail's local units (y up is negative,
   the snail faces +x). */
(() => {
const D = Drawn, F = Fair;
const { TAU, clamp, lerp, rng, noise, circ, ell, poly, curve, ink, grad, radial } = D;
const LINE = F.LINE;

// ------------------------------------------------------------ spire geometry
// o: { x, y (bottom of the body whorl), w (its width), h (height of the second whorl), n, rw, rh,
//      lean (x shift per whorl, negative leans back), body (body whorl height ×), slope }
F.spire = (o) => {
  const ws = [];
  let yb = o.y, cx = o.x, rb = o.w / 2, h = o.h * (o.body || 1.35);
  for (let i = 0; i < o.n; i++) {
    const rt = rb * (o.rw || 0.82) * (i === 0 ? 0.96 : 1);
    const yt = yb - h;
    ws.push({ i, cx, yb, yt, rb, rt, h, s: rb * (o.slope || 0.11) });
    yb = yt + h * 0.16;
    cx += o.lean || -6;
    rb = rt;
    h = (i === 0 ? o.h : h * (o.rh || 0.82));
  }
  const top = ws[ws.length - 1];
  return { ws, apex: [top.cx, top.yt - top.h * 0.25], o };
};
// a whorl band's outline
F.bandPath = (w) => {
  const { cx, yb, yt, rb, rt, h, s } = w;
  // a barrel: the top tucks in under the whorl above (so the silhouette notches at each suture),
  // the sides swell, the bottom rolls under
  const p = new Path2D();
  p.moveTo(cx - rt * 0.88, yt + s * 0.5);
  p.bezierCurveTo(cx - rt * 1.02 - (rb - rt) * 0.3, yt + h * 0.08, cx - rb * 1.17, yb - h * 0.48, cx - rb, yb + s);
  p.quadraticCurveTo(cx, yb + h * 0.32, cx + rb, yb - s);
  p.bezierCurveTo(cx + rb * 1.17, yb - h * 0.48 - s, cx + rt * 1.02 + (rb - rt) * 0.3, yt + h * 0.08 - s, cx + rt * 0.88, yt - s * 0.5);
  p.quadraticCurveTo(cx, yt - h * 0.06, cx - rt * 0.88, yt + s * 0.5);
  return p;
};
// the y of a band's bottom edge (a quadratic bulge) at x, and its top (suture) at x
F.bandBottom = (w, x) => { const u = clamp((x - (w.cx - w.rb)) / (2 * w.rb), 0, 1); return lerp(lerp(w.yb + w.s, w.yb + w.h * 0.3, u), lerp(w.yb + w.h * 0.3, w.yb - w.s, u), u); };
F.bandTop = (w, x) => { const u = clamp((x - (w.cx - w.rt)) / (2 * w.rt), 0, 1); return lerp(lerp(w.yt + w.s * 0.5, w.yt - w.h * 0.06, u), lerp(w.yt - w.h * 0.06, w.yt - w.s * 0.5, u), u); };
// a point on the face of a band at angle a (0 = facing us, -π/2 = the left edge) and height v
// (0 = bottom, 1 = top); returns [x, y, foreshortening]
F.bandAt = (w, a, v) => {
  const r = lerp(w.rb, w.rt, v);
  const x = w.cx + Math.sin(a) * r;
  const yb = F.bandBottom(w, x), yt = F.bandTop(w, x);
  return [x, lerp(yb, yt, v), Math.cos(a)];
};

// ------------------------------------------------------------ painting a spire
// pal: { lit, base, shade, bounce, band, band2, line, growth }
F.paintSpire = (g, sp, pal, seed = 1) => {
  const r = rng(seed);
  const lw = sp.o.lw || 2.4;
  // silhouette first, heavy, around the whole stack
  const all = new Path2D();
  for (const w of sp.ws) all.addPath(F.bandPath(w));
  g.lineWidth = lw * 2.1; g.strokeStyle = pal.line || LINE; g.stroke(all);
  for (const w of sp.ws) {
    const p = F.bandPath(w), { cx, yb, yt, rb, rt, h, s } = w;
    g.save(); g.clip(p);
    // the curved face: lit on the sun's side, cool where it turns away, warm bounce at the far rim
    g.fillStyle = grad(g, cx - rb * 1.1, 0, cx + rb * 1.1, 0, [[0, pal.base], [0.12, pal.lit], [0.3, pal.lit], [0.55, pal.base], [0.82, pal.shade], [1, pal.bounce]]);
    g.fillRect(cx - rb * 1.2, yt - h, rb * 2.4, h * 2.6);
    // pattern: a fine dark spiral line, a soft broad band, and axial flame marks between them
    const line = (v, wdt, col, a, dash) => {
      g.beginPath();
      for (let k = 0; k <= 24; k++) { const aa = -1.6 + (3.2 * k) / 24; const [x, y] = F.bandAt(w, aa, v + Math.sin(aa * 7 + seed) * 0.012); k ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.setLineDash(dash || []); g.lineWidth = Math.max(0.6, h * wdt); g.strokeStyle = col; g.globalAlpha = a; g.lineCap = 'round'; g.stroke(); g.setLineDash([]); g.globalAlpha = 1;
    };
    line(0.5, 0.2, pal.band2 || pal.band, 0.14);
    line(0.2, 0.028, pal.band, 0.6);
    line(0.82, 0.02, pal.band2 || pal.band, 0.45, [h * 0.06, h * 0.05]);
    let a = -1.5 + r() * 0.2;
    while (a < 1.5) {
      const k = Math.cos(a);
      if (r() < 0.8) {
        g.beginPath();
        for (let j = 0; j <= 6; j++) { const v = 0.28 + (j / 6) * 0.46, zig = (j % 2 ? 1 : -1) * (0.02 + r() * 0.05) * k; const [x, y] = F.bandAt(w, a + zig + v * 0.08, v); j ? g.lineTo(x, y) : g.moveTo(x, y); }
        g.lineWidth = Math.max(0.5, h * (0.012 + r() * 0.02) * k); g.strokeStyle = pal.band; g.globalAlpha = 0.14 + r() * 0.18; g.lineJoin = 'round'; g.stroke(); g.globalAlpha = 1;
      }
      a += 0.16 + r() * 0.34;
    }
    // growth lines: fine, slightly bowed, bunched toward the edges as the surface turns away
    const ng = Math.round(10 + rb / 6);
    for (let k = 0; k < ng; k++) {
      const a = -1.45 + (2.9 * (k + r() * 0.6)) / ng;
      const [x0, y0] = F.bandAt(w, a, 0.02), [x1, y1] = F.bandAt(w, a + 0.06, 0.98);
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + rb * 0.05, (y0 + y1) / 2, x1, y1);
      g.lineWidth = 0.5 + r() * 0.8; g.strokeStyle = r() < 0.6 ? pal.growth : F.rgba(pal.lit, 0.6); g.globalAlpha = 0.35 + r() * 0.4; g.stroke(); g.globalAlpha = 1;
    }
    // nacre glint on the sun's side and a rim of sky light right at the edge
    g.fillStyle = grad(g, cx - rb * 0.75, 0, cx - rb * 0.35, 0, ['rgba(255,252,240,0)', 'rgba(255,250,236,0.55)', 'rgba(255,252,240,0)']);
    g.fillRect(cx - rb, yt, rb, h * 1.3);
    // the whorl above overhangs this one: a soft shadow just under the suture
    g.fillStyle = grad(g, 0, yt - h * 0.05, 0, yt + h * 0.32, ['rgba(90,60,96,0.5)', 'rgba(90,60,96,0)']);
    g.fillRect(cx - rb * 1.2, yt - h * 0.1, rb * 2.4, h * 0.45);
    // and its own underside turns down toward the sand: a little cooler, with warm bounce at the very bottom
    g.fillStyle = grad(g, 0, yb - h * 0.25, 0, yb + h * 0.3, ['rgba(120,90,130,0)', 'rgba(120,90,130,0.22)', 'rgba(230,170,130,0.35)']);
    g.fillRect(cx - rb * 1.2, yb - h * 0.3, rb * 2.4, h * 0.7);
    g.restore();
    g.lineWidth = lw * 0.55; g.strokeStyle = pal.line || LINE; g.stroke(p);
  }
};

// ------------------------------------------------------------ globe geometry and painting
// a coiled shell seen from its side: outline is a lopsided disc, the suture a log spiral winding
// in to the apex (up and back). o: { x, y (bottom), R, turns, apex: [ax, ay] relative to centre }
F.globe = (o) => {
  const cx = o.x, cy = o.y - o.R * 0.95, R = o.R;
  const ax = cx + (o.apex ? o.apex[0] : -R * 0.12), ay = cy + (o.apex ? o.apex[1] : -R * 0.1);
  const outline = [];
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * TAU;
    const k = 1 + 0.05 * Math.sin(a * 2 + 0.6) - (Math.sin(a) > 0 ? 0.1 * Math.sin(a) ** 2 : 0);
    outline.push([cx + Math.cos(a) * R * 1.04 * k, cy + Math.sin(a) * R * 0.94 * k]);
  }
  // spiral suture: r = R · e^(-b θ), measured from the apex
  const turns = o.turns || 3.2, b = Math.log(R * 1.0 / (R * 0.06)) / (turns * TAU);
  const spiral = (th) => { const rr = R * 0.98 * Math.exp(-b * th); const a = -th + (o.spin || 0.4); return [ax + Math.cos(a) * rr * 1.02, ay + Math.sin(a) * rr * 0.92]; };
  return { cx, cy, R, ax, ay, outline: curve(outline), spiral, turns, o };
};
F.paintGlobe = (g, gl, pal, seed = 1) => {
  const r = rng(seed), { cx, cy, R, ax, ay } = gl;
  const lw = gl.o.lw || 2.4;
  g.lineWidth = lw * 2.1; g.strokeStyle = pal.line || LINE; g.stroke(gl.outline);
  g.save(); g.clip(gl.outline);
  // a sphere lit from the low left
  g.fillStyle = radial(g, cx - R * 0.45, cy - R * 0.25, R * 0.05, R * 1.5, [[0, pal.lit], [0.35, pal.base], [0.75, pal.shade], [1, pal.shade]]);
  g.fillRect(cx - R * 1.3, cy - R * 1.3, R * 2.6, R * 2.6);
  // bounce from the sand along the bottom
  g.fillStyle = grad(g, 0, cy + R * 0.5, 0, cy + R, ['rgba(232,176,136,0)', 'rgba(232,176,136,0.42)']);
  g.fillRect(cx - R * 1.3, cy + R * 0.4, R * 2.6, R);
  // colour bands following the coil: a fine line near each suture and a soft band mid-coil
  const N = Math.round(gl.turns * 64);
  for (const [off, wd, col, al, dash] of [[0.5, 0.22, pal.band2 || pal.band, 0.16], [0.2, 0.035, pal.band, 0.6], [0.78, 0.025, pal.band2 || pal.band, 0.45, true]]) {
    for (let i = 0; i < N - 2; i += 2) {
      if (dash && (i >> 2) % 2) continue;
      const th = (i / 64) * TAU, th2 = ((i + 2) / 64) * TAU;
      if (th + TAU > gl.turns * TAU) break;
      const p0 = gl.spiral(th), p1 = gl.spiral(th + TAU), q0 = gl.spiral(th2), q1 = gl.spiral(th2 + TAU);
      const ww = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]);
      g.beginPath(); g.moveTo(lerp(p0[0], p1[0], off), lerp(p0[1], p1[1], off)); g.lineTo(lerp(q0[0], q1[0], off), lerp(q0[1], q1[1], off));
      g.lineWidth = Math.max(0.5, ww * wd); g.strokeStyle = col; g.globalAlpha = al; g.lineCap = 'round'; g.stroke(); g.globalAlpha = 1;
    }
  }
  // growth lines: short strokes across each coil, from one suture to the next
  for (let i = 4; i < N - 64; i += 1 + Math.floor(r() * 2)) {
    const th = (i / 64) * TAU;
    const [x0, y0] = gl.spiral(th), [x1, y1] = gl.spiral(th + TAU);
    g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 + (r() - 0.5) * 3, (y0 + y1) / 2 + (r() - 0.5) * 3, x1, y1);
    g.lineWidth = 0.4 + r() * 0.7; g.strokeStyle = r() < 0.6 ? pal.growth : F.rgba(pal.lit, 0.5); g.globalAlpha = 0.3 + r() * 0.35; g.stroke(); g.globalAlpha = 1;
  }
  // the suture itself, light line, with a shadow just inside each coil
  g.beginPath();
  for (let i = 0; i <= N; i++) { const [x, y] = gl.spiral((i / 64) * TAU); i ? g.lineTo(x, y) : g.moveTo(x, y); }
  g.lineWidth = 3.2; g.strokeStyle = 'rgba(90,60,100,0.25)'; g.stroke();
  g.lineWidth = lw * 0.5; g.strokeStyle = pal.line || LINE; g.stroke();
  // a glint on the shoulder facing the sun
  g.fillStyle = radial(g, cx - R * 0.55, cy - R * 0.42, 0, R * 0.32, [[0, 'rgba(255,252,240,0.7)'], [1, 'rgba(255,252,240,0)']]);
  g.fill(circ(cx - R * 0.55, cy - R * 0.42, R * 0.32));
  g.restore();
  // rim light along the sunward edge
  g.save(); g.clip(gl.outline);
  g.lineWidth = 3; g.strokeStyle = F.rgba(pal.lit, 0.9);
  g.translate(1.6, 0.6); g.beginPath(); g.ellipse(cx, cy, R * 1.03, R * 0.93, 0, Math.PI * 0.75, Math.PI * 1.35); g.stroke();
  g.restore();
  g.lineWidth = lw * 0.5; g.strokeStyle = pal.line || LINE; g.stroke(gl.outline);
};

// the ram: a flat ribbed coil (the fishmonger's) — a globe with radial ribs instead of bands
F.paintRam = (g, gl, pal, seed = 1) => {
  F.paintGlobe(g, gl, Object.assign({}, pal, { band: pal.rib, band2: pal.rib }), seed);
  const r = rng(seed + 5), N = Math.round(gl.turns * 64);
  g.save(); g.clip(gl.outline);
  for (let i = 6; i < N - 40; i += 3) {
    const th = (i / 64) * TAU, [x0, y0] = gl.spiral(th), [x1, y1] = gl.spiral(th + TAU);
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(lerp(x0, x1, 0.85), lerp(y0, y1, 0.85));
    g.lineWidth = 1.6; g.strokeStyle = F.rgba(pal.lit, 0.55); g.stroke();
    g.translate(1.2, 0.6); g.lineWidth = 1; g.strokeStyle = 'rgba(90,60,100,0.35)'; g.stroke(); g.translate(-1.2, -0.6);
  }
  g.restore();
};

// ------------------------------------------------------------ small architecture for the towns
const WOOD = { lit: '#d2a878', base: '#a77a58', shade: '#6f4e4f', deep: '#4a3040', grain: '#7d5648' };
F.WOOD = WOOD;
// an arched window, centred at (x, y) on a face foreshortened by k (0..1); o: glow, shutters, box, frame
F.window = (g, x, y, w, h, k, o = {}) => {
  const ww = w * Math.max(0.25, k);
  const p = new Path2D();
  p.moveTo(x - ww / 2, y + h / 2); p.lineTo(x - ww / 2, y - h / 2 + ww / 2);
  p.arc(x, y - h / 2 + ww / 2, ww / 2, Math.PI, 0); p.lineTo(x + ww / 2, y + h / 2); p.closePath();
  // a deep reveal: the shell is thick
  g.save(); g.translate(-ww * 0.16, h * 0.06); g.fillStyle = 'rgba(80,50,80,0.5)'; g.fill(p); g.restore();
  const glass = o.glow ? grad(g, x, y - h / 2, x, y + h / 2, ['#ffe7a8', '#f4b469']) : grad(g, x, y - h / 2, x, y + h / 2, ['#8fa6bf', '#4f5a7e']);
  ink(g, p, glass, Math.max(0.8, w * 0.09), o.frame || LINE);
  if (!o.glow) { g.save(); g.clip(p); g.fillStyle = 'rgba(255,240,220,0.5)'; g.fill(poly([[x - ww / 2, y + h * 0.1], [x - ww * 0.1, y - h / 2], [x + ww * 0.15, y - h / 2], [x - ww / 2, y + h * 0.4]])); g.restore(); }
  g.lineWidth = Math.max(0.6, w * 0.07); g.strokeStyle = o.frame || LINE;
  g.beginPath(); g.moveTo(x, y - h / 2 + 1); g.lineTo(x, y + h / 2); g.moveTo(x - ww / 2, y + h * 0.05); g.lineTo(x + ww / 2, y + h * 0.05); g.stroke();
  if (o.shutters) {
    for (const s of [-1, 1]) {
      const sx = x + s * (ww / 2 + ww * 0.28 * k);
      const sp = poly([[sx - ww * 0.26 * k, y - h * 0.38], [sx + ww * 0.26 * k, y - h * 0.38], [sx + ww * 0.26 * k, y + h / 2], [sx - ww * 0.26 * k, y + h / 2]]);
      ink(g, sp, o.shutters, Math.max(0.6, w * 0.07));
      g.strokeStyle = F.rgba('#3b2433', 0.4); g.lineWidth = 0.5;
      for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(sx - ww * 0.22 * k, y - h * 0.38 + i * h * 0.22); g.lineTo(sx + ww * 0.22 * k, y - h * 0.38 + i * h * 0.22); g.stroke(); }
    }
  }
  if (o.box) { // a window box of flowers
    ink(g, poly([[x - ww * 0.65, y + h / 2], [x + ww * 0.65, y + h / 2], [x + ww * 0.55, y + h / 2 + h * 0.22], [x - ww * 0.55, y + h / 2 + h * 0.22]]), WOOD.base, Math.max(0.6, w * 0.07));
    const r = rng(Math.round(x * 3 + y));
    for (let i = 0; i < 6; i++) {
      const fx = x - ww * 0.55 + (i / 5) * ww * 1.1, fy = y + h / 2 - r() * h * 0.12;
      g.fillStyle = '#5f8a4a'; g.fill(circ(fx, fy, w * 0.13));
      g.fillStyle = o.box; g.fill(circ(fx + w * 0.05, fy - w * 0.08, w * 0.09));
    }
  }
};
// a little arched door
F.door = (g, x, y, w, h, k, col, open = 0) => {
  const ww = w * Math.max(0.3, k);
  const p = new Path2D();
  p.moveTo(x - ww / 2, y); p.lineTo(x - ww / 2, y - h + ww / 2); p.arc(x, y - h + ww / 2, ww / 2, Math.PI, 0); p.lineTo(x + ww / 2, y); p.closePath();
  ink(g, p, '#3d2a3e', Math.max(0.8, w * 0.1));
  g.save(); g.clip(p);
  g.fillStyle = 'rgba(255,190,110,0.5)'; g.fillRect(x - ww / 2, y - h, ww, h);
  g.translate(x - ww / 2, 0); g.scale(1 - open * 0.85, 1); g.translate(-(x - ww / 2), 0);
  g.fillStyle = col; g.fill(p);
  g.strokeStyle = 'rgba(60,30,40,0.35)'; g.lineWidth = Math.max(0.5, w * 0.05);
  for (let i = 1; i < 3; i++) { g.beginPath(); g.moveTo(x - ww / 2 + (i * ww) / 3, y - h + 2); g.lineTo(x - ww / 2 + (i * ww) / 3, y); g.stroke(); }
  g.fillStyle = '#e8c56a'; g.fill(circ(x + ww * 0.28, y - h * 0.45, Math.max(0.6, w * 0.07)));
  g.restore();
  g.lineWidth = Math.max(0.8, w * 0.1); g.strokeStyle = LINE; g.stroke(p);
};
// a weathered plank (for ledges, decks, stalls): from a to b, thickness th, with grain
F.plank = (g, a, b, th, pal = WOOD, seed = 1, lw = 1.2) => {
  const r = rng(seed);
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const p = poly([[a[0], a[1] - th / 2], [b[0], b[1] - th / 2], [b[0], b[1] + th / 2], [a[0], a[1] + th / 2]]);
  ink(g, p, pal.base, lw);
  g.save(); g.clip(p);
  g.fillStyle = pal.lit; g.fill(poly([[a[0], a[1] - th / 2], [b[0], b[1] - th / 2], [b[0], b[1] - th * 0.1], [a[0], a[1] - th * 0.1]]));
  g.fillStyle = pal.shade; g.fill(poly([[a[0], a[1] + th * 0.25], [b[0], b[1] + th * 0.25], [b[0], b[1] + th / 2], [a[0], a[1] + th / 2]]));
  g.strokeStyle = pal.grain; g.lineWidth = Math.max(0.4, th * 0.08);
  for (let i = 0; i < 3; i++) { const u0 = r() * 0.6, u1 = u0 + 0.15 + r() * 0.3, o = (r() - 0.5) * th * 0.5; g.beginPath(); g.moveTo(a[0] + dx * u0, a[1] + dy * u0 + o); g.lineTo(a[0] + dx * u1, a[1] + dy * u1 + o + (r() - 0.5)); g.stroke(); }
  g.restore();
};
F.post = (g, x, y0, y1, w, pal = WOOD, lw = 1.1) => {
  const p = poly([[x - w / 2, y0], [x + w / 2, y0], [x + w / 2, y1], [x - w / 2, y1]]);
  ink(g, p, pal.base, lw);
  g.fillStyle = pal.lit; g.fillRect(x - w / 2, y0, w * 0.35, y1 - y0);
  g.fillStyle = pal.shade; g.fillRect(x + w * 0.15, y0, w * 0.35, y1 - y0);
};
// a little green garden lump with flowers
F.garden = (g, x, y, w, seed, flowers = ['#f2c95c', '#e07f62', '#f4efe6']) => {
  const r = rng(seed), cs = [];
  const n = Math.max(3, Math.round(w / 6));
  for (let i = 0; i < n; i++) { const u = i / (n - 1); cs.push([x - w / 2 + u * w + (r() - 0.5) * 3, y - Math.sin(u * Math.PI) * w * 0.18 - r() * w * 0.08, w * (0.12 + r() * 0.1)]); }
  D.lumps(g, cs, { line: LINE, lw: Math.max(0.6, w * 0.025), shade: '#4f6e48', base: '#6f9452', lit: '#9cbb62' });
  for (let i = 0; i < n; i++) { if (r() < 0.6) { const [cx, cy, cr] = cs[i]; g.fillStyle = flowers[i % flowers.length]; g.fill(circ(cx - cr * 0.3, cy - cr * 0.4, Math.max(0.8, cr * 0.28))); } }
};
})();
