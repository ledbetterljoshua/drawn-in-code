/* cottage.js — the cottage, turned a little on its plot so we see its long sunlit front and its
   shaded gable end. Stone below, a jettied timber-framed floor above, a steep tiled roof with a
   dormer and a sagging ridge, a brick chimney, and a round turret at the back with a cone hat.

   Every wall, roof and dormer face is a plane (CF.wall / CF.quadM), so stones, timbers, tiles and
   windows are drawn flat in that plane's own (s, t) and carried onto it: they foreshorten with
   the wall they sit on. Walls are shaded by their own normal against the one sun.

   z30 the body (still) · z31 its life: lamp-lit windows, smoke, the frog weathervane (spins when
   you hover the cottage), the door (hover: it opens and a frog waves; linger: she holds up a cup
   of tea), the upstairs curtain (hover the upper floor: grandma peeks out) · z32 the stargazer on
   the turret balcony (the telescope follows you; hover and she hops) · z29 the washing line
   strung to the mill (it flaps in the breeze; hover and it whips about). */
(() => {
const D = Drawn, { TAU, clamp, lerp, ease, rng, noise, hash, wind, circ, ell, rect, seg, quad, poly, curve, ink, grad, radial, tube, st, P, layer } = D;
const { pr, mix, rgba, tone, lit, M, on, wall, quadM, frog, spawn, P3, face3 } = CF;

// ------------------------------------------------------------------ the plot
const C0 = [-74, -44], YAW = -0.5, U = [Math.cos(YAW), Math.sin(YAW)], V = [-Math.sin(YAW), Math.cos(YAW)];
const at = (a, b) => [C0[0] + U[0] * a + V[0] * b, C0[1] + U[1] * a + V[1] * b];
const P3d = (a, y, b) => { const [x, z] = at(a, b); return [x, y, z]; };
const H1 = 80, H2 = 74, YT = H1 + H2;
const RIDGE = 246, RB = 4, EB = 81, YE = 131, SLOPE = (RIDGE - YE) / (EB - RB);
const roofY = (b) => RIDGE - Math.abs(b - RB) * SLOPE;
const T0 = at(-86, -64), TR = 33, TY = 300, CONE = 440;
const U3 = [U[0], 0, U[1]], V3 = [V[0], 0, V[1]];
CF.cottage = { at, P3d, U, V, T0 };

// walls
const gfL = wall(at(-95, -59), at(-95, 59), 0, H1), gfF = wall(at(-95, 59), at(95, 59), 0, H1);
const ufL = wall(at(-103, -59), at(-103, 67), H1, H2), ufF = wall(at(-103, 67), at(99, 67), H1, H2);
const gab = wall(at(-103, -59), at(-103, 67), H1, RIDGE - H1);
const roofM = quadM(P3d(-117, RIDGE, RB), P3d(113, RIDGE, RB), P3d(-117, YE, EB));
CF.cottage.walls = { gfL, gfF, ufL, ufF, roofM };

// ------------------------------------------------------------------ materials, flat
function stones(g, Mx, w, h, b, seed, o = {}) {
  const r = rng(seed), face = on(Mx, rect(0, 0, w, h));
  g.save(); g.clip(face);
  g.fillStyle = tone(M.stone, b * 0.55); g.fill(face);
  for (let y = -2, row = 0; y < h; row++) {
    const rh = 11 + r() * 6;
    for (let x = -r() * 18; x < w; ) {
      const sw = 13 + r() * 22, j = () => (r() - 0.5) * 2.4;
      const pts = [[x + 1.6 + j(), y + 1.5 + j()], [x + sw * 0.5, y + 1 + j()], [x + sw - 1.6 + j(), y + 1.6 + j()], [x + sw - 1 + j(), y + rh * 0.5], [x + sw - 1.8 + j(), y + rh - 1.4 + j()], [x + sw * 0.5, y + rh - 0.8 + j()], [x + 1.6 + j(), y + rh - 1.6 + j()], [x + 1 + j(), y + rh * 0.5]];
      const pth = on(Mx, curve(pts, true));
      let c = tone(M.stone, clamp(b + (r() - 0.5) * 0.28, 0, 1));
      const k = r(); if (k < 0.18) c = mix(c, '#c9846a', 0.3); else if (k < 0.34) c = mix(c, '#8f8db8', 0.25); else if (k < 0.42) c = mix(c, '#a7b27a', 0.25);
      g.fillStyle = c; g.fill(pth);
      g.save(); g.clip(pth);
      g.lineWidth = 2.2; g.strokeStyle = rgba(b > 0.4 ? '#fff2d8' : '#d8d0f0', 0.28 + b * 0.2);
      g.stroke(on(Mx, D.seg(x + 2, y + 2.4, x + sw - 3, y + 2.2)));
      g.strokeStyle = rgba(M.stone.line, 0.3); g.stroke(on(Mx, D.seg(x + 2, y + rh - 2, x + sw - 2, y + rh - 2.2)));
      g.restore();
      g.lineWidth = 1; g.strokeStyle = rgba(M.stone.line, 0.5); g.stroke(pth);
      x += sw;
    }
    y += rh;
  }
  // quoins: big dressed blocks at the corners, long and short in turn
  for (const side of o.quoins || []) {
    for (let y = 0, k = 0; y < h; k++) {
      const qh = 15, qw = k % 2 ? 16 : 26, x = side === 'l' ? 0 : w - qw;
      const pth = on(Mx, rect(x + 0.5, y + 0.5, qw - 1, qh - 1));
      ink(g, pth, tone(M.stone, clamp(b + 0.08, 0, 1)), 1.1, rgba(M.stone.line, 0.7));
      y += qh;
    }
  }
  // damp and grime rising from the ground, and the cool shade at the very foot
  g.fillStyle = CF.pgrad(g, Mx, 0, h - 26, 0, h, [[0, 'rgba(60,50,90,0)'], [1, 'rgba(60,50,90,0.4)']]); g.fill(face);
  g.restore();
}
function plaster(g, Mx, w, h, b, seed, shape) {
  const r = rng(seed), face = on(Mx, shape || rect(0, 0, w, h));
  g.save(); g.clip(face);
  g.fillStyle = tone(M.plaster, b); g.fill(face);
  for (let i = 0; i < 14; i++) {
    const x = r() * w, y = r() * h, s = 6 + r() * 16;
    g.fillStyle = rgba(r() < 0.6 ? M.plaster.shade : '#fff8e6', 0.12 + r() * 0.1); g.fill(on(Mx, ell(x, y, s, s * 0.7)));
  }
  // streaks under the eaves where the rain runs
  for (let i = 0; i < 6; i++) { const x = r() * w; g.fillStyle = rgba(M.plaster.shade, 0.12); g.fill(on(Mx, rect(x, 0, 2 + r() * 4, h * (0.3 + r() * 0.4)))); }
  g.restore();
}
function beam(g, Mx, x0, y0, x1, y1, w, b, seed = 1) {
  const dx = x1 - x0, dy = y1 - y0, l = Math.hypot(dx, dy), nx = (-dy / l) * w / 2, ny = (dx / l) * w / 2;
  const pth = on(Mx, poly([[x0 + nx, y0 + ny], [x1 + nx, y1 + ny], [x1 - nx, y1 - ny], [x0 - nx, y0 - ny]]));
  ink(g, pth, tone(M.timber, clamp(b + (hash(seed) - 0.5) * 0.12, 0, 1)), 1.3, M.timber.line);
  g.save(); g.clip(pth);
  g.lineWidth = 0.9; g.strokeStyle = rgba(M.timber.line, 0.45);
  for (let k = -1; k <= 1; k += 2) {
    const o = k * w * 0.18 + (hash(seed + k) - 0.5) * w * 0.2;
    g.stroke(on(Mx, D.quad(x0 + (nx / (w / 2)) * o, y0 + (ny / (w / 2)) * o, (x0 + x1) / 2 + (nx / (w / 2)) * (o + 1.5), (y0 + y1) / 2 + (ny / (w / 2)) * (o + 1.5), x1 + (nx / (w / 2)) * o, y1 + (ny / (w / 2)) * o)));
  }
  if (b > 0.45) { g.lineWidth = 1.4; g.strokeStyle = rgba(M.timber.lit, 0.5); g.stroke(on(Mx, D.seg(x0 + nx * 0.7, y0 + ny * 0.7, x1 + nx * 0.7, y1 + ny * 0.7))); }
  g.restore();
}
// a window flat on its wall. lamp: lit from inside; else it reflects the warm sky
function windowFlat(g, Mx, x, y, w, h, b, o = {}) {
  const fr = on(Mx, rect(x - 3.5, y - 3.5, w + 7, h + 7));
  ink(g, fr, tone(M.timber, b * 0.85), 1.6, M.timber.line);
  const gl = on(Mx, o.arch ? archPath(x, y, w, h) : rect(x, y, w, h));
  const [ax, ay] = CF.at(Mx, x, y), [bx, by] = CF.at(Mx, x + w * 0.3, y + h);
  if (o.lamp) g.fillStyle = grad(g, ax, ay, bx, by, ['#ffb35a', '#ffd88a', '#fff0be']);
  else g.fillStyle = grad(g, ax, ay, bx, by, ['#7f9fc6', '#c7cde0', '#ffd6a8']);
  g.fill(gl);
  g.save(); g.clip(gl);
  if (o.curtain) { g.fillStyle = rgba(o.curtain, 0.85); g.fill(on(Mx, poly([[x, y], [x + w * 0.32, y], [x + w * 0.14, y + h * 0.75], [x, y + h * 0.85]]))); g.fill(on(Mx, poly([[x + w, y], [x + w * 0.68, y], [x + w * 0.86, y + h * 0.75], [x + w, y + h * 0.85]]))); }
  if (o.pot) { const px = x + w * 0.62; ink(g, on(Mx, poly([[px - 5, y + h], [px + 5, y + h], [px + 4, y + h - 8], [px - 4, y + h - 8]])), '#c9704a', 1); D.lumps(g, [[CF.at(Mx, px - 2, y + h - 11)[0], CF.at(Mx, px, y + h - 11)[1], 4.5], [CF.at(Mx, px + 3, y + h - 12)[0], CF.at(Mx, px, y + h - 13)[1], 4]], { line: '#24392c', lw: 0.9, shade: '#4f8a4a', base: '#6fae55', lit: '#a9d46f' }); }
  // a sheen across the glass
  g.fillStyle = rgba('#ffffff', o.lamp ? 0.18 : 0.35);
  g.fill(on(Mx, poly([[x + w * 0.15, y + h], [x + w * 0.45, y + h], [x + w * 0.85, y], [x + w * 0.55, y]])));
  g.restore();
  g.lineWidth = 1.2; g.strokeStyle = M.timber.line; g.stroke(gl);
  // glazing bars: small panes
  g.lineWidth = 1.6; g.strokeStyle = tone(M.timber, b * 0.6);
  const cols = o.cols || 2, rows = o.rows || 2;
  for (let i = 1; i < cols; i++) g.stroke(on(Mx, D.seg(x + (w * i) / cols, y, x + (w * i) / cols, y + h)));
  for (let i = 1; i < rows; i++) g.stroke(on(Mx, D.seg(x, y + (h * i) / rows, x + w, y + (h * i) / rows)));
  // the sill catches the light on top
  ink(g, on(Mx, rect(x - 6, y + h + 3, w + 12, 4.5)), tone(M.stone, clamp(b + 0.15, 0, 1)), 1.2, M.stone.line);
  if (o.shutters) for (const sx of [x - 17, x + w + 4]) {
    const sp = on(Mx, rect(sx, y - 2, 13, h + 4));
    ink(g, sp, tone({ shade: '#2f4a64', base: '#4f8f93', lit: '#98d0c0' }, b), 1.3, '#22303a');
    g.lineWidth = 0.9; g.strokeStyle = 'rgba(30,40,58,0.45)';
    for (let k = 1; k < 3; k++) g.stroke(on(Mx, D.seg(sx + (13 * k) / 3, y - 1, sx + (13 * k) / 3, y + h + 1)));
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(30,40,58,0.55)'; g.stroke(on(Mx, D.seg(sx + 1, y + h * 0.75, sx + 12, y + h * 0.25)));
  }
  if (o.box) {
    const bxp = on(Mx, rect(x - 7, y + h + 7, w + 14, 10));
    ink(g, bxp, tone(M.timber, b), 1.3, M.timber.line);
    const r = rng(o.box);
    for (let i = 0; i < Math.round(w / 6); i++) {
      const [fx, fy] = CF.at(Mx, x - 4 + r() * (w + 8), y + h + 6 - r() * 3);
      ink(g, circ(fx, fy, 3.2 + r() * 1.4), ['#e0503f', '#f3a0b0', '#fff2d8', '#e0503f'][(r() * 4) | 0], 0.9, '#5a2a30');
      if (r() < 0.5) ink(g, ell(fx + 3, fy + 3, 3.4, 1.8, undefined, 0.5), '#5f9e52', 0.8, '#24392c');
    }
    for (let i = 0; i < 3; i++) { const [tx, ty] = CF.at(Mx, x + r() * w, y + h + 16); g.lineWidth = 1.6; g.strokeStyle = '#4f8a4a'; g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + 3, ty + 8, tx - 1, ty + 14 + r() * 8); g.stroke(); }
  }
}
function archPath(x, y, w, h) { const p = new Path2D(); p.moveTo(x, y + h); p.lineTo(x, y + w / 2); p.arc(x + w / 2, y + w / 2, w / 2, Math.PI, 0); p.lineTo(x + w, y + h); p.closePath(); return p; }
CF.windowFlat = windowFlat; CF.beam = beam; CF.stones = stones; CF.plaster = plaster; CF.archPath = archPath;

// ------------------------------------------------------------------ shadows it casts
CF.casters.push(() => [P3d(-95, 0, -59), P3d(95, 0, -59), P3d(-95, 0, 59), P3d(95, 0, 59), P3d(-117, RIDGE, RB), P3d(113, RIDGE, RB), P3d(-103, YT, -59), P3d(99, YT, 67), P3d(99, YT, -59), P3d(-103, YT, 67)]);
CF.casters.push(() => { const pts = []; for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU; pts.push([T0[0] + Math.cos(a) * TR, 0, T0[1] + Math.sin(a) * TR], [T0[0] + Math.cos(a) * 44, TY, T0[1] + Math.sin(a) * 44]); } pts.push([T0[0] + 6, CONE, T0[1]]); return pts; });
CF.casters.push(() => [P3d(52, 306, -8), P3d(76, 306, -8), P3d(52, 306, 12), P3d(76, 306, 12), P3d(52, 230, -8), P3d(76, 230, 12)]);

// ------------------------------------------------------------------ the body
function turret(g) {
  const [X, Z] = T0;
  const side = CF.cylinder(g, X, Z, TR, 0, TY, M.plaster, 2.4);
  g.save(); g.clip(side);
  // stone courses round the foot, following the curve
  const [cx] = pr(X, 0, Z);
  for (let y = 0, k = 0; y < 96; y += 13, k++) {
    const [, yy] = pr(X, y, Z);
    g.fillStyle = rgba(M.stone.shade, 0.0);
    for (let a = 0.1 + (k % 2) * 0.18; a < Math.PI; a += 0.36) {
      const x0 = cx + Math.cos(a) * TR, x1 = cx + Math.cos(a + 0.36) * TR, yc = yy + Math.sin(a) * TR * CF.CAM.S;
      const p = poly([[x0, yc], [x1, yc + (Math.sin(a + 0.36) - Math.sin(a)) * TR * CF.CAM.S], [x1, yc - 12], [x0, yc - 12]]);
      ink(g, p, tone(M.stone, clamp(lit([Math.cos(a + 0.18), 0, Math.sin(a + 0.18)]) + (hash(k * 9 + a) - 0.5) * 0.2, 0, 1)), 1, rgba(M.stone.line, 0.55));
    }
  }
  // a timber band where the floors meet, and the dark under the cone's brim
  const band = (y, h, col) => { const [, y0] = pr(X, y, Z); const p = new Path2D(); p.ellipse(cx, y0, TR + 1, TR * CF.CAM.S, 0, 0, Math.PI); p.lineTo(cx - TR - 1, y0 - h); p.ellipse(cx, y0 - h, TR + 1, TR * CF.CAM.S, 0, Math.PI, 0, true); p.closePath(); ink(g, p, col, 1.1, M.timber.line); };
  band(170, 7, tone(M.timber, 0.4));
  g.fillStyle = grad(g, 0, pr(X, TY, Z)[1] - 2, 0, pr(X, TY - 30, Z)[1], ['rgba(50,30,80,0.55)', 'rgba(50,30,80,0)']);
  g.fillRect(cx - TR - 2, pr(X, TY, Z)[1] - 8, TR * 2 + 4, 40);
  g.restore();
  // its window, facing us over the roof
  const wa = Math.PI / 2 + 0.25, Mw = CF.cylM(X, 292, Z, TR, wa);
  windowFlat(g, Mw, -8, 6, 16, 26, lit([Math.cos(wa), 0, Math.sin(wa)]), { arch: true, lamp: true, cols: 1, rows: 2 });
  // an arrow slit lower down, on the shaded side
  const wb = Math.PI / 2 + 0.95, Mw2 = CF.cylM(X, 210, Z, TR, wb);
  ink(g, on(Mw2, CF.archPath(-2.5, 0, 5, 18)), '#3a2232', 1, M.plaster.line);
}
function turretCone(g) {
  const [X, Z] = T0, rb = 45;
  const [cx, by] = pr(X, TY, Z), [tx, ty] = pr(X + 7, CONE, Z - 2), ry = rb * CF.CAM.S;
  const p = new Path2D(); p.moveTo(cx - rb, by); p.ellipse(cx, by, rb, ry, 0, Math.PI, 0, true); p.quadraticCurveTo(cx + rb * 0.5, by - (by - ty) * 0.45, tx, ty); p.quadraticCurveTo(cx - rb * 0.55, by - (by - ty) * 0.4, cx - rb, by); p.closePath();
  const gr = g.createLinearGradient(cx - rb, 0, cx + rb, 0);
  for (let i = 0; i <= 8; i++) { const a = Math.acos(clamp(-1 + i / 4, -1, 1)); gr.addColorStop(i / 8, tone(M.slate, lit([Math.cos(a) * 0.82, 0.57, Math.sin(a) * 0.82]))); }
  g.lineWidth = 4.4; g.strokeStyle = M.slate.line; g.stroke(p);
  g.fillStyle = gr; g.fill(p);
  g.save(); g.clip(p);
  // scalloped slates in rings that shrink toward the tip
  const r = rng(4);
  for (let k = 0; k < 13; k++) {
    const u = k / 13, yy = lerp(by, ty, u) + 4, rr = rb * (1 - u) * 1.02, ryy = rr * CF.CAM.S, xc = lerp(cx, tx, u);
    const n = Math.max(3, Math.round(rr / 6));
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI - (i / n) * Math.PI, a1 = Math.PI - ((i + 1) / n) * Math.PI;
      const x0 = xc + Math.cos(a0) * rr, x1 = xc + Math.cos(a1) * rr, y0 = yy + Math.sin(a0) * ryy, y1 = yy + Math.sin(a1) * ryy;
      g.lineWidth = 1; g.strokeStyle = rgba(M.slate.line, 0.5);
      g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + 4, x1, y1); g.stroke();
      if (r() < 0.12) { g.fillStyle = rgba(r() < 0.5 ? '#c6e2e6' : '#22305a', 0.25); g.fill(ell((x0 + x1) / 2, (y0 + y1) / 2 - 2, Math.abs(x1 - x0) * 0.4, 3)); }
    }
  }
  g.restore();
  // a rim of sun down its right side
  g.save(); g.clip(p); g.lineWidth = 6; g.strokeStyle = 'rgba(255,220,170,0.45)'; g.stroke(D.quad(cx + rb, by, cx + rb * 0.5, by - (by - ty) * 0.45, tx, ty)); g.restore();
  tube(g, seg(tx, ty + 2, tx, ty - 22), '#4a3644', 2, 1.2);
  ink(g, circ(tx, ty - 8, 3), '#f2c14e', 1.2);
}
function groundFloor(g) {
  const bL = lit(gfL.n), bF = lit(gfF.n);
  stones(g, gfL, gfL.len, H1, bL, 11, { quoins: ['r'] });
  stones(g, gfF, gfF.len, H1, bF, 12, { quoins: ['l'] });
  for (const Mx of [gfL, gfF]) { g.lineWidth = 2.6; g.strokeStyle = M.stone.line; g.stroke(on(Mx, rect(0, 0, Mx.len, H1))); }
  // the front door, with a stone arch round it
  const dx = 113, dw = 36, dt = H1 - 60;
  const arch = on(gfF, archPath(dx - 6, dt - 6, dw + 12, 66));
  ink(g, arch, tone(M.stone, clamp(bF + 0.1, 0, 1)), 1.4, M.stone.line);
  g.lineWidth = 1; g.strokeStyle = rgba(M.stone.line, 0.6);
  for (let i = 0; i <= 6; i++) { const a = Math.PI + (i / 6) * Math.PI, cx = dx + dw / 2, cy = dt + dw / 2; g.stroke(on(gfF, D.seg(cx + Math.cos(a) * (dw / 2), cy + Math.sin(a) * (dw / 2), cx + Math.cos(a) * (dw / 2 + 6), cy + Math.sin(a) * (dw / 2 + 6)))); }
  ink(g, on(gfF, archPath(dx, dt, dw, 60)), '#3d2026', 1.6);
  CF.cottage.door = { M: gfF, x: dx, y: dt, w: dw, h: 60 };
  // windows: lamp-lit downstairs
  windowFlat(g, gfF, 30, 20, 40, 32, bF, { lamp: true, curtain: '#e0644c', shutters: true, cols: 3, rows: 2, pot: true });
  windowFlat(g, gfF, 168, 22, 18, 28, bF, { lamp: true, cols: 1, rows: 2 });
  windowFlat(g, gfL, 44, 22, 30, 28, bL, { lamp: true, curtain: '#f3cf74', cols: 2, rows: 2 });
  // the door lamp's bracket
  const [lx, ly] = CF.at(gfF, 157, 14);
  tube(g, D.quad(lx - 6, ly + 2, lx + 2, ly + 1, lx + 3, ly + 7), '#3a2232', 1.4, 1);
  CF.cottage.lamp = [lx + 3, ly + 16];
  // a house number painted by hand
  const [nx, ny] = CF.at(gfF, dx + dw / 2, dt - 12);
  g.font = 'italic 700 9px Georgia, serif'; g.fillStyle = '#5a3a3e'; g.textAlign = 'center'; g.fillText('1', nx, ny + 3);
}
function upperFloor(g) {
  const bL = lit(ufL.n), bF = lit(ufF.n);
  // the jetty beam the upper floor sits on, its joist ends showing
  for (const [Mx, b] of [[ufL, bL], [ufF, bF]]) {
    plaster(g, Mx, Mx.len, H2, b, b * 100 | 0);
    g.lineWidth = 2.6; g.strokeStyle = M.plaster.line; g.stroke(on(Mx, rect(0, 0, Mx.len, H2)));
  }
  // the front: posts, a mid rail, braces, windows
  const F = ufF, bf = bF, w = F.len;
  windowFlat(g, F, 22, 24, 32, 30, bf, { cols: 2, rows: 3, box: 3 });
  windowFlat(g, F, 92, 22, 36, 34, bf, { lamp: true, curtain: '#7fb8b0', cols: 3, rows: 3 });
  windowFlat(g, F, 162, 24, 26, 30, bf, { cols: 2, rows: 3, box: 7 });
  CF.cottage.upWin = { M: F, x: 92, y: 22, w: 36, h: 34 };
  const posts = [2, 66, 146, w - 4];
  for (const x of posts) beam(g, F, x, 0, x + (x > 100 ? 1 : -1), H2, 6.5, bf, x);
  beam(g, F, 0, 3, w, 2, 6, bf, 51);
  beam(g, F, 0, H2 - 3, w, H2 - 2, 7, bf * 0.9, 52);
  for (const [a, b2] of [[2, 22], [66, 88], [134, 146], [w - 4, w - 20]]) beam(g, F, a, H2 - 6, b2, 8, 4.5, bf, a * 3);
  // the gable side
  const Lw = ufL.len;
  windowFlat(g, ufL, 50, 26, 26, 28, bL, { cols: 2, rows: 2, box: 11 });
  for (const x of [2, 40, 86, Lw - 3]) beam(g, ufL, x, 0, x, H2, 6.5, bL, x + 5);
  beam(g, ufL, 0, H2 - 3, Lw, H2 - 2, 7, bL, 61);
  // the gable triangle above, timber in herringbone
  const apex = 59 + 4, gh = RIDGE - YT;
  const tri = poly([[0, gh], [apex, 0], [Lw, gh]]);
  plaster(g, gab, Lw, gh, bL, 21, tri);
  g.lineWidth = 2.4; g.strokeStyle = M.plaster.line; g.stroke(on(gab, tri));
  g.save(); g.clip(on(gab, tri));
  beam(g, gab, apex, 0, apex, gh, 6, bL, 71);
  for (let k = 0; k < 3; k++) { const y = gh - 18 - k * 22; beam(g, gab, apex - 20 - k * 6, y + 18, apex - 4, y, 4.2, bL, 80 + k); beam(g, gab, apex + 20 + k * 6, y + 18, apex + 4, y, 4.2, bL, 90 + k); }
  g.restore();
  // a round window high in the gable, with an owl-box's worth of bird nesting on its sill
  const [rx, ry] = CF.at(gab, apex, gh - 34);
  ink(g, on(gab, circ(apex, gh - 34, 10)), tone(M.timber, bL), 1.4, M.timber.line);
  ink(g, on(gab, circ(apex, gh - 34, 7)), '#ffd286', 1.1, M.timber.line);
  g.lineWidth = 1.2; g.strokeStyle = tone(M.timber, 0.2); g.stroke(on(gab, D.seg(apex - 7, gh - 34, apex + 7, gh - 34))); g.stroke(on(gab, D.seg(apex, gh - 41, apex, gh - 27)));
  CF.cottage.roundWin = [rx, ry];
}
function tiles(g) {
  const Mx = roofM, Ls = Mx.w, Lt = Mx.h, b = lit(CF.nrm3([P3d(-117, RIDGE, RB), P3d(113, RIDGE, RB), P3d(-117, YE, EB)]));
  const sag = (s) => 5 * Math.sin((Math.PI * s) / Ls) + 1.5 * noise(s * 0.05);
  const outline = on(Mx, poly([[0, sag(0)], [Ls * 0.25, sag(Ls * 0.25)], [Ls * 0.5, sag(Ls * 0.5)], [Ls * 0.75, sag(Ls * 0.75)], [Ls, sag(Ls)], [Ls, Lt], [0, Lt]]));
  g.lineWidth = 5; g.strokeStyle = M.tile.line; g.stroke(outline);
  g.fillStyle = tone(M.tile, b * 0.55); g.fill(outline);
  g.save(); g.clip(outline);
  const r = rng(8);
  for (let t = -4, row = 0; t < Lt; t += 8.6, row++) {
    for (let s = -((row % 2) * 6) - r() * 3; s < Ls; ) {
      const tw = 10 + r() * 4, y0 = t + sag(s) * (1 - t / Lt) + (r() - 0.5) * 1.2, tl = 11;
      const pth = new Path2D(); pth.moveTo(s, y0); pth.lineTo(s + 0.3, y0 + tl - 3); pth.quadraticCurveTo(s + tw / 2, y0 + tl + 2, s + tw - 0.3, y0 + tl - 3); pth.lineTo(s + tw, y0); pth.closePath();
      const q = on(Mx, pth);
      let c = tone(M.tile, clamp(b + (r() - 0.5) * 0.3 - (t / Lt) * 0.08, 0, 1));
      if (r() < 0.1) c = mix(c, '#8a4a58', 0.35); else if (r() < 0.08) c = mix(c, '#f2b07a', 0.3);
      if (r() < 0.012) c = '#3a1a26'; // a slipped tile, a dark gap
      g.fillStyle = c; g.fill(q);
      g.lineWidth = 0.9; g.strokeStyle = rgba(M.tile.line, 0.32); g.stroke(q);
      // the lower edge of the tile above throws a thin shadow
      g.lineWidth = 1.4; g.strokeStyle = rgba('#3a1a40', 0.2); g.stroke(on(Mx, D.seg(s + 1, y0 + 1.4, s + tw - 1, y0 + 1.4)));
      s += tw;
    }
  }
  // moss creeping up from the eave, thicker on the side that stays damp
  for (const [cs, ct, n] of [[18, Lt - 10, 16], [52, Lt - 22, 9], [96, Lt - 6, 7], [150, 30, 5]]) {
    for (let i = 0; i < n; i++) {
      const s = cs + (r() - 0.5) * 34, t = ct + (r() - 0.5) * 16, [x, y] = CF.at(Mx, s, t);
      ink(g, ell(x, y, 2 + r() * 3.5, 1.4 + r() * 1.6), ['#6f7f40', '#8d9c4e', '#a9b860'][(r() * 3) | 0], 0.6, rgba('#3a4220', 0.6));
    }
  }
  g.restore();
  // ridge capping, following the sag
  for (let s = 0; s < Ls; s += 13) {
    const [x0, y0] = CF.at(Mx, s, sag(s)), [x1, y1] = CF.at(Mx, s + 13, sag(s + 13));
    const p = new Path2D(); p.moveTo(x0, y0 + 2); p.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 8, x1, y1 + 2); p.closePath();
    ink(g, p, tone(M.tile, clamp(b * 0.95 + (hash(s) - 0.5) * 0.2, 0, 1)), 1.3, M.tile.line);
  }
  // the barge board down the gable end, and the fascia + gutter along the eave
  const [a0, a1] = [CF.at(Mx, 0, sag(0)), CF.at(Mx, 0, Lt)];
  tube(g, seg(a0[0] - 1, a0[1], a1[0] - 1, a1[1] + 1), tone(M.timber, 0.25), 5, 1.4);
  const back = P3d(-117, YE + 10, -66);
  const [bx, by] = pr(...back);
  tube(g, seg(a0[0] - 1, a0[1], bx, by), tone(M.timber, 0.2), 5, 1.4);
  const [c0, c1] = [CF.at(Mx, Ls, sag(Ls)), CF.at(Mx, Ls, Lt)];
  tube(g, seg(c0[0] + 1, c0[1], c1[0] + 1, c1[1] + 1), tone(M.timber, 0.85), 5, 1.4);
  const e0 = CF.at(Mx, 0, Lt), e1 = CF.at(Mx, Ls, Lt);
  tube(g, seg(e0[0], e0[1] + 2, e1[0], e1[1] + 2), tone(M.timber, 0.75), 4.5, 1.4);
  tube(g, seg(e0[0] + 2, e0[1] + 6.5, e1[0], e1[1] + 6.5), tone(M.metal, 0.6), 4, 1.3);
  CF.cottage.gutter = [e0[0] + 18, e0[1] + 8];
}
function dormer(g) {
  const A = -32, B = 14, Bd = 47, y0 = roofY(Bd) - 2, y1 = y0 + 30, yA = y1 + 20, mid = (A + B) / 2;
  const front = wall(at(A, Bd), at(B, Bd), y0, yA - y0);
  const bF = lit(front.n), w = front.len, H = yA - y0;
  // where it sits in the roof: a lead apron and the shadow it throws down the tiles
  CF.multiply(g, CF.P3([P3d(A - 4, roofY(Bd + 2), Bd + 2), P3d(B + 6, roofY(Bd + 2), Bd + 2), P3d(B + 2, roofY(Bd + 16), Bd + 16), P3d(A - 10, roofY(Bd + 18), Bd + 18)]), '#8a80c0', 0.8);
  face3(g, [P3d(A - 2, y0 + 1, Bd + 1), P3d(B + 2, y0 + 1, Bd + 1), P3d(B + 2, roofY(Bd + 5), Bd + 5), P3d(A - 2, roofY(Bd + 5), Bd + 5)], M.metal, 1.1);
  // its left cheek, sitting on the roof
  const bRoof = roofY(Bd), cheekBack = RB + (RIDGE - y1) / SLOPE;
  face3(g, [P3d(A, y1, Bd), P3d(A, y1, cheekBack), P3d(A, roofY(Bd), Bd)], M.plaster, 1.6);
  const shape = poly([[0, H], [0, H - (y1 - y0)], [w / 2, 0], [w, H - (y1 - y0)], [w, H]]);
  plaster(g, front, w, H, bF, 33, shape);
  g.lineWidth = 2.2; g.strokeStyle = M.plaster.line; g.stroke(on(front, shape));
  windowFlat(g, front, 10, H - 26, w - 20, 20, bF, { lamp: true, curtain: '#f3a0b0', cols: 3, rows: 1 });
  CF.cottage.dormerWin = CF.at(front, w / 2, H - 16);
  // its little roof
  const backY = RB + (RIDGE - yA) / SLOPE;
  face3(g, [P3d(mid, yA + 2, Bd + 6), P3d(mid, yA + 2, backY), P3d(A - 5, y1 - 3, cheekBack - 2), P3d(A - 5, y1 - 3, Bd + 6)], M.tile, 2);
  const lp = CF.P3([P3d(mid, yA + 2, Bd + 6), P3d(mid, yA + 2, backY), P3d(A - 5, y1 - 3, cheekBack - 2), P3d(A - 5, y1 - 3, Bd + 6)]);
  g.save(); g.clip(lp); g.lineWidth = 1; g.strokeStyle = rgba(M.tile.line, 0.5);
  for (let k = 1; k < 4; k++) { const f = k / 4; const [x0, y0_] = pr(...P3d(lerp(mid, A - 5, f), lerp(yA + 2, y1 - 3, f), Bd + 6)), [x1, y1_] = pr(...P3d(lerp(mid, A - 5, f), lerp(yA + 2, y1 - 3, f), backY)); g.beginPath(); g.moveTo(x0, y0_); g.lineTo(x1, y1_); g.stroke(); }
  g.restore();
  const [ax, ay] = pr(...P3d(mid, yA + 2, Bd + 6)), [rx, ry] = pr(...P3d(B + 5, y1 - 3, Bd + 6)), [lx, ly] = pr(...P3d(A - 5, y1 - 3, Bd + 6));
  tube(g, D.poly([[lx, ly], [ax, ay], [rx, ry]], false), tone(M.timber, 0.75), 4, 1.3);
  void bRoof;
}
function chimney(g) {
  const a0 = 50, a1 = 74, b0 = -8, b1 = 12, top = 306, lean = 5;
  const L = (y) => (y - 230) / 76 * lean;
  const fF = [P3d(a0 + L(roofY(b1)), roofY(b1), b1), P3d(a1 + L(roofY(b1)), roofY(b1), b1), P3d(a1 + lean, top, b1), P3d(a0 + lean, top, b1)];
  const fL = [P3d(a0, RIDGE, b0), P3d(a0 + L(roofY(b1)), roofY(b1), b1), P3d(a0 + lean, top, b1), P3d(a0 + lean, top, b0)];
  const bL_ = face3(g, fL, M.brick, 2.2), bF_ = face3(g, fF, M.brick, 2.2);
  for (const [f, b, len, h] of [[fF, bF_, a1 - a0, top - roofY(b1)], [fL, bL_, b1 - b0, top - roofY(b1)]]) {
    const Mx = quadM(f[3], f[2], f[0]);
    g.save(); g.clip(P3(f));
    for (let y = 0, k = 0; y < Mx.h; y += 6.5, k++) {
      g.lineWidth = 1; g.strokeStyle = rgba(M.brick.line, 0.5); g.stroke(on(Mx, D.seg(0, y, Mx.w, y)));
      for (let x = (k % 2) * 6; x < Mx.w; x += 12) g.stroke(on(Mx, D.seg(x, y, x, y + 6.5)));
      for (let x = (k % 2) * 6; x < Mx.w; x += 12) if (hash(k * 13 + x) < 0.2) { g.fillStyle = rgba(hash(x + k) < 0.5 ? '#f2a070' : '#5a2a3a', 0.35); g.fill(on(Mx, rect(x + 0.6, y + 0.6, 10.8, 5.3))); }
    }
    // soot near the top
    g.fillStyle = CF.pgrad(g, Mx, 0, 0, 0, 22, [[0, 'rgba(40,24,40,0.45)'], [1, 'rgba(40,24,40,0)']]); g.fill(P3(f));
    g.restore();
    void b; void len; void h;
  }
  // lead flashing where it meets the roof, the cap, two pots
  const fl = [P3d(a0 - 3, roofY(b1 + 4), b1 + 4), P3d(a1 + 3, roofY(b1 + 4), b1 + 4), P3d(a1 + 3, roofY(b1) + 6, b1), P3d(a0 - 3, roofY(b1) + 6, b1)];
  face3(g, fl, M.metal, 1.2);
  face3(g, [P3d(a0 - 3 + lean, top, b0 - 3), P3d(a1 + 3 + lean, top, b0 - 3), P3d(a1 + 3 + lean, top, b1 + 3), P3d(a0 - 3 + lean, top, b1 + 3)], M.stone, 1.6);
  face3(g, [P3d(a0 - 3 + lean, top, b1 + 3), P3d(a1 + 3 + lean, top, b1 + 3), P3d(a1 + 3 + lean, top - 5, b1 + 3), P3d(a0 - 3 + lean, top - 5, b1 + 3)], M.stone, 1.4);
  const pots = [];
  for (const da of [6, 17]) {
    const [X, Y, Z] = P3d(a0 + da + lean, top, (b0 + b1) / 2);
    CF.cylinder(g, X, Z, 4.2, Y, Y + 14, M.brick, 1.4);
    const [px, py] = pr(X, Y + 14, Z);
    ink(g, ell(px, py, 5, 5 * CF.CAM.S + 0.6), '#2a1820', 1.2);
    pots.push([px, py]);
  }
  CF.cottage.pots = pots;
}
function props(g) {
  const bF = lit(gfF.n), bL = lit(gfL.n);
  // firewood stacked against the gable, under a little roof of its own
  const fw = wall(at(-108, -46), at(-108, 26), 0, 40);
  const r = rng(17);
  ink(g, on(fw, rect(-2, -4, fw.len + 4, 44)), tone(M.timber, 0.12), 1.4, M.timber.line);
  for (let row = 0; row < 4; row++) for (let i = 0; i < 8; i++) {
    const x = 5 + i * 9 + (row % 2) * 4.5, y = 36 - row * 9.4 - 4, rr = 4.2 + r() * 0.8;
    if (x > fw.len - 3) continue;
    const p = on(fw, circ(x, y, rr));
    ink(g, p, mix('#d9a56a', '#8c6448', 0.55 - bL * 0.4 + r() * 0.15), 1, M.timber.line);
    g.lineWidth = 0.7; g.strokeStyle = 'rgba(90,50,40,0.5)'; g.stroke(on(fw, circ(x, y, rr * 0.5)));
  }
  face3(g, [P3d(-100, 48, -50), P3d(-100, 48, 30), P3d(-122, 40, 30), P3d(-122, 40, -50)], M.tile, 1.6);
  // a rain barrel at the corner, the downpipe from the gutter feeding it
  const [bxX, bxZ] = at(-84, 76);
  CF.contact(g, ...pr(bxX, 0, bxZ), 18, 6, 0.5);
  const bar = CF.cylinder(g, bxX, bxZ, 12, 0, 30, { shade: '#5a3a44', base: '#8a5a3c', lit: '#d09058', line: M.timber.line }, 1.8);
  g.save(); g.clip(bar);
  for (const y of [6, 23]) { const [cx, yy] = pr(bxX, y, bxZ); g.lineWidth = 2.4; g.strokeStyle = '#4a4a5e'; g.beginPath(); g.ellipse(cx, yy, 12, 12 * CF.CAM.S, 0, 0, Math.PI); g.stroke(); }
  g.restore();
  const [tx, ty] = pr(bxX, 30, bxZ);
  ink(g, ell(tx, ty, 12, 12 * CF.CAM.S), '#3d5d78', 1.6, M.timber.line);
  g.fillStyle = 'rgba(255,240,210,0.6)'; g.fill(ell(tx + 3, ty, 5, 1.2));
  const gp = CF.cottage.gutter;
  tube(g, D.poly([gp, [gp[0], gp[1] + 30], [tx - 4, ty - 26], [tx - 4, ty - 4]], false), tone(M.metal, 0.55), 3.2, 1.2);
  // the bench by the door, a mug left on it
  const S0 = 72, S1 = 104, BB = 72;
  for (const a of [S0 + 3, S1 - 3]) { const [lx, ly] = pr(...P3d(a, 0, BB + 5)), [lx2, ly2] = pr(...P3d(a, 13, BB + 5)); tube(g, seg(lx, ly, lx2, ly2), tone(M.timber, bF), 2.6, 1.1); }
  CF.contact(g, ...pr(...P3d((S0 + S1) / 2, 0, BB + 4)), 22, 4, 0.45);
  face3(g, [P3d(S0, 14, BB), P3d(S1, 14, BB), P3d(S1, 14, BB + 10), P3d(S0, 14, BB + 10)], M.timber, 1.5);
  face3(g, [P3d(S0, 14, BB + 10), P3d(S1, 14, BB + 10), P3d(S1, 11, BB + 10), P3d(S0, 11, BB + 10)], M.timber, 1.2);
  const [mx, my] = pr(...P3d(S1 - 8, 14, BB + 5));
  ink(g, poly([[mx - 3.5, my], [mx - 3.5, my - 7], [mx + 3.5, my - 7], [mx + 3.5, my]]), '#5f86ad', 1.2);
  g.lineWidth = 1.2; g.strokeStyle = CF.LINE; g.beginPath(); g.arc(mx + 4.5, my - 3.5, 2.2, -1.2, 1.2); g.stroke();
  CF.cottage.mug = [mx, my - 8];
  // two pairs of little boots by the door
  for (const [a, col] of [[60, '#e0b040'], [66, '#d9644c']]) {
    const [x, y] = pr(...P3d(a, 0, 66));
    for (const dx of [0, 4.5]) ink(g, poly([[x + dx - 2, y], [x + dx - 2, y - 8], [x + dx + 2, y - 8], [x + dx + 2, y - 2], [x + dx + 4.5, y - 1.5], [x + dx + 4.5, y]]), col, 1.1);
  }
  // the doorstep
  face3(g, [P3d(108, 4, 59), P3d(156, 4, 59), P3d(156, 4, 72), P3d(108, 4, 72)], M.stone, 1.5);
  face3(g, [P3d(108, 4, 72), P3d(156, 4, 72), P3d(156, 0, 72), P3d(108, 0, 72)], M.stone, 1.3);
  // climbing roses up the front corner
  const rr = rng(4);
  const [c0x, c0y] = pr(...P3d(-95, 0, 60)), [c1x, c1y] = pr(...P3d(-96, 120, 66));
  const stem = D.curve([[c0x + 4, c0y], [c0x + 8, c0y - 40], [c0x - 2, c0y - 70], [c1x + 6, c1y + 8], [c1x + 14, c1y - 6]], false);
  g.lineWidth = 2; g.strokeStyle = '#4a5a3a'; g.stroke(stem);
  for (let i = 0; i < 22; i++) {
    const u = rr(), x = lerp(c0x + 6, c1x + 10, u) + (rr() - 0.5) * 12, y = lerp(c0y - 6, c1y, u) + (rr() - 0.5) * 6;
    ink(g, ell(x, y, 4, 2.4, undefined, rr() * 3), rr() < 0.5 ? '#4f8a4a' : '#6fae55', 0.9, '#24392c');
    if (rr() < 0.4) ink(g, circ(x + 2, y - 2, 2.6), rr() < 0.5 ? '#f08aa0' : '#ffd0d8', 0.9, '#6a2a3a');
  }
  void bL;
}
layer({
  id: 'cottage', z: 30, still: true,
  draw(g) {
    // contact shadow all along the foot of the walls
    const foot = CF.P3([P3d(-110, 0, -62), P3d(-98, 0, 74), P3d(104, 0, 74), P3d(104, 0, 60), P3d(-95, 0, 59), P3d(-95, 0, -62)]);
    CF.multiply(g, foot, '#8a80c0', 0.6);
    turret(g);
    groundFloor(g);
    // the jettied floor throws a band of shadow on the stone below
    for (const Mx of [gfL, gfF]) CF.multiply(g, on(Mx, rect(0, 0, Mx.len, 12)), '#8a80c0', 0.75);
    upperFloor(g);
    // the eave and the barge throw shadow down the walls under them
    CF.multiply(g, on(ufF, poly([[0, 0], [ufF.len, 0], [ufF.len, 20], [0, 26]])), '#8a80c0', 0.8);
    CF.multiply(g, on(ufL, rect(0, 0, ufL.len, 8)), '#8a80c0', 0.6);
    tiles(g);
    dormer(g);
    chimney(g);
    turretCone(g);
    props(g);
  },
});

// ------------------------------------------------------------------ the cottage's life
const cot = { open: 0, cup: 0, vane: 0, vv: 0, smokeT: 0, blink: D.blinker(), gran: 0, granBlink: D.blinker(3, 5) };
const smoke = [];
const glows = () => [[CF.at(gfF, 50, 36), 34], [CF.at(gfF, 177, 36), 22], [CF.at(gfL, 59, 36), 24], [CF.at(ufF, 110, 39), 30], [CF.cottage.dormerWin, 24], [CF.cottage.roundWin, 14]];
let G = null;
layer({
  id: 'cottage-life', z: 31,
  hit(x, y) {
    if (!G) return false;
    const d = CF.cottage.door, [dx, dy] = CF.at(d.M, d.x + d.w / 2, d.y + d.h / 2);
    if (Math.abs(x - dx) < 30 && Math.abs(y - dy) < 40) return (this.part = 'door'), true;
    if (G.upper(x, y)) return (this.part = 'up'), true;
    if (G.house(x, y)) return (this.part = 'house'), true;
    return false;
  },
  onEnter() { cot.vv += 9; },
  update(dt, t, L) {
    if (!G) G = { upper: (x, y) => pointIn(CF.P3([P3d(-103, H1, 67), P3d(99, H1, 67), P3d(99, YT, 67), P3d(-103, YT, 67)]), x, y), house: (x, y) => pointIn(CF.P3([P3d(-117, 0, 74), P3d(104, 0, 74), P3d(113, RIDGE, RB), P3d(-117, RIDGE, RB), P3d(-117, 0, -60)]), x, y) };
    const onDoor = L.hovered && this.part === 'door', onUp = L.hovered && this.part === 'up';
    cot.open = ease(cot.open, onDoor ? 1 : 0.28, onDoor ? 2.6 : 1.4, dt);
    cot.cup = ease(cot.cup, onDoor && L.since > 1 ? 1 : 0, 3, dt);
    cot.gran = ease(cot.gran, onUp ? 1 : 0, onUp ? 2.5 : 1.2, dt);
    const w = wind(t, 600);
    cot.vv += (-(cot.vane - (0.5 + Math.sin(t * 0.4) * 0.5 * w)) * 4 - cot.vv * 1.2) * dt;
    cot.vane += cot.vv * dt;
    cot.smokeT -= dt;
    const pots = CF.cottage.pots;
    if (pots && cot.smokeT < 0) {
      cot.smokeT = 0.55 + Math.random() * 0.35;
      const p = pots[Math.random() < 0.6 ? 0 : 1];
      smoke.push({ x: p[0] + (Math.random() - 0.5) * 3, y: p[1] - 3, r: 4 + Math.random() * 2, age: 0, s: Math.random() });
    }
    for (const p of smoke) { p.age += dt; p.x += (3 + p.age * (2 + w * 8)) * dt; p.y -= (26 - p.age * 3) * dt; p.r += (4 + p.s * 3) * dt; }
    while (smoke.length && smoke[0].age > 6) smoke.shift();
  },
  draw(g, t, L) {
    // smoke: soft puffs, lit warm on the sun side, going transparent as they spread
    for (const p of smoke) {
      const a = Math.min(1, p.age * 2) * Math.max(0, 1 - p.age / 6) * 0.65, x = p.x + Math.sin(p.age * 1.7 + p.s * 6) * 4;
      g.globalAlpha = a * 0.8;
      g.fillStyle = radial(g, x - p.r * 0.2, p.y + p.r * 0.2, 0, p.r * 1.2, [[0, 'rgba(196,180,206,0.9)'], [0.7, 'rgba(196,180,206,0.5)'], [1, 'rgba(196,180,206,0)']]); g.fill(circ(x, p.y, p.r * 1.2));
      g.fillStyle = radial(g, x + p.r * 0.3, p.y - p.r * 0.3, 0, p.r * 0.8, [[0, 'rgba(255,240,222,0.9)'], [1, 'rgba(255,240,222,0)']]); g.fill(circ(x + p.r * 0.3, p.y - p.r * 0.3, p.r * 0.8));
    }
    g.globalAlpha = 1;
    // lamplight breathing in the windows
    glows().forEach(([[x, y], r], i) => {
      const f = 0.22 + 0.05 * Math.sin(t * 2.3 + i * 1.7) + 0.04 * noise(t * 4 + i * 9) + L.hover * 0.1;
      CF.glow(g, x, y, r * 1.25, '#ffbe64', f * 0.75);
    });
    // grandma at the upstairs window: the curtain draws aside and she peeks out over her knitting
    const uw = CF.cottage.upWin;
    if (uw && cot.gran > 0.02) {
      const gl = on(uw.M, rect(uw.x, uw.y, uw.w, uw.h));
      g.save(); g.clip(gl);
      const [fx, fy] = CF.at(uw.M, uw.x + uw.w * 0.5, uw.y + uw.h + 14 - cot.gran * 12);
      frog(g, fx, fy, 0.62, { c: CF.FROG_TINTS.teal, open: cot.granBlink(t), look: CF.lookAt(fx, fy, [clamp((P.x - fx) / 200, -1, 1), clamp((P.y - fy) / 200, -1, 1)]), smile: 1.6 + cot.gran * 1.5,
        hat: (g, lw) => { g.lineWidth = lw; g.strokeStyle = '#3a2232'; g.beginPath(); g.arc(-10, -27, 6, 0, TAU); g.arc(10, -27, 6, 0, TAU); g.stroke(); } });
      g.restore();
    }
    // tea left steaming on the bench
    const mg = CF.cottage.mug;
    if (mg) { g.lineWidth = 1.2; for (const k of [-1.5, 1.5]) { g.strokeStyle = `rgba(255,250,240,${0.45 + 0.15 * Math.sin(t * 2 + k)})`; g.beginPath(); g.moveTo(mg[0] + k, mg[1]); g.bezierCurveTo(mg[0] + k + 3, mg[1] - 4, mg[0] + k - 3, mg[1] - 8, mg[0] + k + Math.sin(t * 1.5 + k) * 2, mg[1] - 13); g.stroke(); } }
    // the door lamp
    const lp = CF.cottage.lamp;
    if (lp) {
      const [lx, ly] = lp;
      CF.glow(g, lx, ly, 40, '#ffc070', 0.5 + 0.08 * Math.sin(t * 5) + 0.04 * noise(t * 9));
      ink(g, poly([[lx - 4.5, ly - 7], [lx + 4.5, ly - 7], [lx + 5.5, ly + 5], [lx - 5.5, ly + 5]]), '#ffe9a6', 1.4);
      ink(g, rect(lx - 6.5, ly + 5, 13, 3), '#3a2232', 0);
      ink(g, poly([[lx - 6, ly - 7], [lx, ly - 12], [lx + 6, ly - 7]]), '#3a2232', 0);
    }
    // the door: swings in, warm light spills out, someone waves (and, if you stay, offers tea)
    const d = CF.cottage.door;
    if (d) {
      const o = cot.open, Mx = d.M;
      const hole = on(Mx, archPath(d.x, d.y, d.w, d.h));
      if (o > 0.03) {
        const [hx, hy] = CF.at(Mx, d.x + d.w / 2, d.y + d.h * 0.7);
        g.fillStyle = radial(g, hx, hy, 3, 46, ['#ffe09a', '#e89a50', '#6a3426']); g.fill(hole);
        g.save(); g.clip(hole);
        const [fx, fy] = CF.at(Mx, d.x + d.w / 2, d.y + d.h);
        frog(g, fx, fy, 0.82, { open: cot.blink(t), look: CF.lookAt(fx, fy, [clamp((P.x - fx) / 200, -1, 1), clamp((P.y - fy + 30) / 200, -1, 1)]), smile: 3.5,
          arms: cot.cup > 0.1 ? [[8, -22 - cot.cup * 6, 12, -12]] : [[17, -28 - Math.sin(t * 10) * 7 * o, 13, -12]],
          hat: (g, lw) => { ink(g, D.ell(0, -12, 17, 9), '#f3e4c8', lw * 0.8); g.lineWidth = lw * 0.8; g.strokeStyle = '#e0644c'; g.setLineDash([3, 3]); g.stroke(D.ell(0, -12, 13, 6)); g.setLineDash([]); } });
        if (cot.cup > 0.1) {
          const cx = fx + 7 * 0.82, cy = fy - (28 + cot.cup * 6) * 0.82;
          ink(g, poly([[cx - 5, cy], [cx + 5, cy], [cx + 4, cy + 7], [cx - 4, cy + 7]]), '#fff6e6', 1.2);
          g.globalAlpha = cot.cup; g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,250,240,0.8)';
          for (const k of [-2, 2]) { g.beginPath(); g.moveTo(cx + k, cy - 2); g.bezierCurveTo(cx + k + 3, cy - 6, cx + k - 3, cy - 9, cx + k, cy - 13 - Math.sin(t * 3 + k) * 2); g.stroke(); }
          g.globalAlpha = 1;
        }
        g.restore();
        const [sx, sy] = CF.at(Mx, d.x + d.w / 2, d.y + d.h + 4);
        CF.glow(g, sx + 14, sy + 6, 60, '#ffc070', 0.4 * o);
      }
      // the door leaf, hinged on its left, swinging into the house
      const dw = Math.cos(o * 1.25);
      const H = new DOMMatrix([dw, 0, 0, 1, d.x * (1 - dw), 0]), DM = Mx.multiply(H);
      const leaf = on(DM, archPath(d.x, d.y, d.w, d.h));
      const [a0, a1] = [CF.at(DM, d.x, 0), CF.at(DM, d.x + d.w, 0)];
      ink(g, leaf, grad(g, a0[0], a0[1], a1[0], a1[1], ['#7a4530', '#a8643f', '#c98552']), 1.8);
      g.lineWidth = 1; g.strokeStyle = 'rgba(58,34,50,0.5)';
      for (const x of [9, 18, 27]) g.stroke(on(DM, seg(d.x + x, d.y + 8, d.x + x, d.y + d.h - 2)));
      g.lineWidth = 2.2; g.strokeStyle = '#3e3448';
      for (const y of [16, 46]) g.stroke(on(DM, seg(d.x + 2, d.y + y, d.x + 22, d.y + y)));
      ink(g, on(DM, circ(d.x + 29, d.y + 34, 2.2)), '#f2c14e', 1.1);
    }
    // the frog weathervane on the turret, seen edge-on as it turns
    const [vx, vy] = pr(T0[0] + 7, CONE + 16, T0[1] - 2), va = Math.cos(cot.vane);
    g.save(); g.translate(vx, vy); g.scale(va, 1);
    g.fillStyle = '#3a2232';
    tube(g, seg(-22, 0, 18, 0), '#3a2232', 1.4, 0.6);
    g.fill(poly([[18, -4], [25, 0], [18, 4]]));
    g.fill(poly([[-22, 0], [-27, -7], [-18, -7], [-15, 0]]));
    g.beginPath(); g.ellipse(-3, -8, 9, 6, 0, Math.PI, TAU); g.fill();
    g.fill(circ(-8.5, -13, 2.6)); g.fill(circ(1.5, -13, 2.6));
    g.restore();
  },
});
function pointIn(path, x, y) { return CF.hitCtx.isPointInPath(path, x, y); }
CF.hitCtx = document.createElement('canvas').getContext('2d');

// ------------------------------------------------------------------ the stargazer on the turret balcony
const gazer = { a: -0.6, hop: 0, hv: 0, blink: D.blinker(), ht: 0 };
const BAL_Y = 252, BAL_R = 50;
layer({
  id: 'gazer', z: 32,
  hit: (x, y) => { const [gx, gy] = pr(...gazerPos()); return Math.abs(x - gx) < 40 && y > gy - 50 && y < gy + 10; },
  onEnter() { gazer.hv = -150; },
  update(dt, t, L) {
    const [gx, gy] = pr(...gazerPos());
    const dx = P.x - gx, dy = P.y - gy + 20, near = P.inside && Math.hypot(dx, dy) < 560;
    let target = near ? Math.atan2(dy, dx) : -2.2 + Math.sin(t * 0.25) * 0.3;
    if (CF.attn.k > 0.5) target = Math.atan2(CF.attn.y - gy + 20, CF.attn.x - gx);
    let tg = target; if (tg > 0.6) tg = tg > 1.9 ? -Math.PI + 0.1 : 0.6;
    gazer.a = ease(gazer.a, tg, near ? 3 : 0.8, dt);
    gazer.hv += 900 * dt; gazer.hop += gazer.hv * dt;
    if (gazer.hop > 0) { gazer.hop = 0; gazer.hv = L.hovered ? -140 : 0; }
    gazer.ht -= dt;
    if (L.hovered && gazer.ht < 0) { gazer.ht = 0.7; spawn({ kind: 'heart', x: gx - 6, y: gy - 40 + gazer.hop, vy: -28, vx: (Math.random() - 0.5) * 12, life: 1.8, size: 0.85 }); }
  },
  draw(g, t, L) {
    const [X, Z] = T0;
    // the balcony: a deck round the front of the turret, railing on the outside
    const deck = [], outer = [];
    for (let i = 0; i <= 20; i++) { const a = 0.15 + (i / 20) * (Math.PI - 0.3); deck.push(pr(X + Math.cos(a) * TR, BAL_Y, Z + Math.sin(a) * TR)); outer.push(pr(X + Math.cos(a) * BAL_R, BAL_Y, Z + Math.sin(a) * BAL_R)); }
    const dp = poly(outer.concat(deck.slice().reverse()));
    ink(g, dp, tone(M.timber, 0.75), 1.8, M.timber.line);
    const edge = poly(outer.concat(outer.map(([x, y]) => [x, y + 5]).reverse()));
    ink(g, edge, tone(M.timber, 0.35), 1.4, M.timber.line);
    // brackets under it
    for (const a of [0.5, 1.2, 1.9, 2.6]) { const [x0, y0] = pr(X + Math.cos(a) * TR, BAL_Y - 22, Z + Math.sin(a) * TR), [x1, y1] = pr(X + Math.cos(a) * BAL_R, BAL_Y - 1, Z + Math.sin(a) * BAL_R); tube(g, seg(x0, y0, x1, y1 + 4), tone(M.timber, 0.4), 2.4, 1.1); }
    const [gx, gy] = pr(...gazerPos());
    // the telescope on its tripod
    const px = gx + 18, py = gy - 22;
    for (const fx_ of [px - 8, px, px + 8]) tube(g, seg(px, py, fx_, gy + 1), '#5a3a3a', 1.4, 0.9);
    g.save(); g.translate(px, py); g.rotate(gazer.a);
    ink(g, poly([[-12, -3.5], [22, -5], [22, 5], [-12, 3.5]]), grad(g, 0, -5, 0, 5, ['#f6d27a', '#c98f3e']), 1.5);
    ink(g, rect(20, -6.5, 5, 13), '#8a5a3c', 1.4); ink(g, rect(-15, -2.5, 4, 5), '#8a5a3c', 1.2);
    g.restore();
    const ex = px + Math.cos(gazer.a) * -13, ey = py + Math.sin(gazer.a) * -13;
    frog(g, gx, gy + gazer.hop, 0.6, { wide: 0.86, tall: 1.08, c: CF.FROG_TINTS.teal, open: gazer.blink(t), look: [Math.cos(gazer.a), Math.sin(gazer.a)], smile: 2 + L.hover * 2.5, squash: gazer.hop < -1 ? 1.06 : 1,
      arms: gazer.hop < -2 ? [[-20, -30], [20, -30]] : [[(ex - gx) / 0.72, (ey - gy) / 0.72]],
      hat: (g, lw) => { ink(g, poly([[-9, -32], [9, -32], [2, -52], [-1, -52]]), '#4a4a8a', lw); g.fillStyle = '#f2d35a'; g.fill(circ(-1, -40, 1.6)); g.fill(circ(3, -45, 1.2)); } });
    // the near railing, in front of her
    const rail = outer.map(([x, y]) => [x, y - 17]);
    for (let i = 0; i <= 20; i += 2) { const [x, y] = outer[i]; tube(g, seg(x, y, x, y - 17), tone(M.plaster, 0.85), 1.6, 0.9); }
    tube(g, poly(rail, false), tone(M.timber, 0.7), 2.6, 1.2);
  },
});
function gazerPos() { const a = Math.PI / 2 + 0.45; return [T0[0] + Math.cos(a) * 42, BAL_Y, T0[1] + Math.sin(a) * 42]; }

// ------------------------------------------------------------------ the ladder up to the balcony
layer({
  id: 'ladder', z: 30.5, still: true,
  draw(g) {
    const foot = at(-150, 40), topA = Math.PI / 2 + 1.25, top = [T0[0] + Math.cos(topA) * BAL_R, T0[1] + Math.sin(topA) * BAL_R];
    const A = [foot[0], 0, foot[1]], B = [top[0], BAL_Y + 12, top[1]];
    const side = CF.norm([V[0], 0, V[1]]);
    const rails = [-1, 1].map((k) => [CF.add3(A, side, k * 8), CF.add3(B, side, k * 8)]);
    CF.contact(g, ...pr(...A), 16, 4, 0.5);
    for (const [a, b] of rails) tube(g, seg(...pr(...a), ...pr(...b)), '#d9a46a', 3, 1.3);
    for (let k = 1; k < 16; k++) {
      const u = k / 16, a = rails[0][0].map((v, i) => lerp(v, rails[0][1][i], u)), b = rails[1][0].map((v, i) => lerp(v, rails[1][1][i], u));
      if (hash(k * 3.3) < 0.07) continue; // a missing rung
      tube(g, seg(...pr(...a), ...pr(...b)), '#e2b278', 2, 1);
    }
  },
});

// ------------------------------------------------------------------ the washing line, cottage to mill
const wash = { flap: 0 };
const items = [
  { u: 0.12, kind: 'shirt', c: '#f3e4c8' }, { u: 0.27, kind: 'sock', c: '#e0644c' }, { u: 0.34, kind: 'sock', c: '#e0644c' },
  { u: 0.48, kind: 'kerchief', c: '#4f8f93' }, { u: 0.64, kind: 'trousers', c: '#8a6fb0' }, { u: 0.8, kind: 'shirt', c: '#f2c14e' }, { u: 0.9, kind: 'sock', c: '#fff2d8' },
].map((it, i) => ({ ...it, a: 0, v: 0, ph: i * 1.3 }));
const LA = () => pr(...P3d(99, 128, 67)), LB = () => (CF.millHook ? pr(...CF.millHook) : pr(195, 128, -100));
layer({
  id: 'washing', z: 29,
  hit(x, y) { const [ax, ay] = LA(), [bx, by] = LB(); return x > ax && x < bx && y > Math.min(ay, by) - 6 && y < Math.max(ay, by) + 46; },
  update(dt, t, L) {
    wash.flap = ease(wash.flap, L.hovered ? 1 : 0, L.hovered ? 4 : 1, dt);
    for (const it of items) {
      const push = (wind(t, 800 + it.u * 200) - 0.65) * 0.5 + wash.flap * (0.5 + 0.3 * Math.sin(t * 9 + it.ph)) + (L.hovered ? P.vx * 0.0006 : 0);
      it.v += (-14 * (it.a - push) - 1.6 * it.v) * dt; it.a += it.v * dt;
    }
  },
  draw(g, t) {
    const [ax, ay] = LA(), [bx, by] = LB(), sag = 16 + wash.flap * 2;
    const ptAt = (u) => [lerp(ax, bx, u), lerp(ay, by, u) + sag * 4 * u * (1 - u)];
    g.lineWidth = 1.2; g.strokeStyle = '#5a4848';
    g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo((ax + bx) / 2, (ay + by) / 2 + sag * 2, bx, by); g.stroke();
    for (const it of items) {
      const [x, y] = ptAt(it.u), fl = Math.sin(t * 7 + it.ph) * (0.6 + wash.flap * 2);
      g.save(); g.translate(x, y); g.rotate(-it.a * 0.6);
      const sh = clamp(1 - Math.abs(it.a) * 0.5, 0.55, 1);
      g.scale(1, sh);
      const c = it.c, dark = mix(c, '#4a3a6a', 0.35);
      let p;
      if (it.kind === 'shirt') { p = poly([[-11, 0], [11, 0], [16, 6], [12, 9], [10, 7], [9 + fl, 24], [-9 + fl, 24], [-10, 7], [-12, 9], [-16, 6]]); }
      else if (it.kind === 'trousers') { p = poly([[-9, 0], [9, 0], [10 + fl, 26], [3 + fl, 26], [0, 9], [-3 + fl, 26], [-10 + fl, 26]]); }
      else if (it.kind === 'kerchief') { p = poly([[-9, 0], [9, 0], [1 + fl * 1.5, 16]]); }
      else { p = poly([[-3, 0], [3, 0], [3 + fl * 0.5, 11], [8 + fl, 14], [7 + fl, 17], [-2 + fl * 0.5, 15], [-3, 11]]); }
      ink(g, p, grad(g, -12, 0, 14, 0, [dark, c, mix(c, '#fff4dc', 0.3)]), 1.3);
      if (it.kind === 'kerchief') { g.fillStyle = 'rgba(255,255,255,0.7)'; for (const [dx, dy] of [[-4, 3], [3, 4], [0, 9]]) g.fill(circ(dx + fl * 0.5, dy, 1.3)); }
      if (it.kind === 'shirt') { g.lineWidth = 0.9; g.strokeStyle = 'rgba(58,34,50,0.4)'; g.beginPath(); g.moveTo(0, 2); g.lineTo(fl * 0.5, 22); g.stroke(); }
      g.restore();
      // pegs
      ink(g, rect(x - 4.5, y - 3, 2.2, 5), '#d9a46a', 0.8); ink(g, rect(x + 2.5, y - 3, 2.2, 5), '#d9a46a', 0.8);
    }
  },
});
})();
