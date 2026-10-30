/* mill.js — the smock mill behind the cottage: a tapering eight-sided tower of painted
   weatherboards on a brick base, a stage round its middle, a red cap, four lattice sails and a
   fantail at the back.

   Each of the eight faces is lit by its own normal, so the tower turns round in the light. The
   sails turn in their own plane (facing up-wind, to the front left), so they're drawn flat in
   that plane and carried onto it, which squashes the circle they sweep into the right ellipse.

   z20 the tower (still) · z21 the sails and fantail (hover: they race, and a racing mill stirs
   the breeze for the whole drawing) · z22 the miller on the stage (hover: she oils the shaft;
   linger: a drop of oil falls, she wipes her brow). */
(() => {
const D = Drawn, { TAU, clamp, lerp, ease, rng, hash, wind, breeze, circ, ell, rect, seg, poly, ink, grad, tube, P, layer } = D;
const { pr, mix, rgba, tone, lit, M, on, plane, frog, spawn, P3, face3, nrm3 } = CF;

const MX = 236, MZ = -122, R0 = 56, R1 = 33, Y0 = 34, Y1 = 338, ROT = 0.2;
const rAt = (y) => lerp(R0, R1, (y - Y0) / (Y1 - Y0));
const corner = (i, y, r = rAt(y)) => { const a = ROT + (i / 8) * TAU; return [MX + Math.cos(a) * r, y, MZ + Math.sin(a) * r]; };
CF.millHook = (() => { const d = CF.norm([45 - MX, 0, -33 - MZ]), r = rAt(128) + 1; return [MX + d[0] * r, 128, MZ + d[2] * r]; })();
const NS = CF.norm([-0.52, 0, 0.86]); // the sails face this way: up-wind and toward us
const HUB = [MX + NS[0] * 44, 354, MZ + NS[2] * 44];
const E1 = [NS[2], 0, -NS[0]];
const sailM = plane(HUB, E1, [0, -1, 0]);
CF.mill = { HUB, MX, MZ };

CF.casters.push(() => { const pts = []; for (let i = 0; i < 8; i++) pts.push(corner(i, 0, 60), corner(i, Y1)); pts.push([MX, 382, MZ]); return pts; });

// ------------------------------------------------------------------ the tower
function octFaces(y0, y1, r0, r1) {
  const fs = [];
  for (let i = 0; i < 8; i++) {
    const q = [corner(i, y1, r1), corner(i + 1, y1, r1), corner(i + 1, y0, r0), corner(i, y0, r0)];
    const mid = (i + 0.5) / 8 * TAU + ROT, out = [Math.cos(mid), 0, Math.sin(mid)];
    let n = nrm3(q);
    if (CF.dot(n, out) < 0) continue; // the face nearest us may come out flipped; skip back faces
    fs.push({ q, n, z: Math.sin(mid), i });
  }
  return fs.sort((a, b) => a.z - b.z);
}
function boards(g, f, b, step, seed) {
  const [tl, tr, br, bl] = f.q, r = rng(seed);
  g.save(); g.clip(P3(f.q));
  const h = tl[1] - bl[1];
  for (let y = 0; y < h; y += step) {
    const u = y / h, L = tl.map((v, k) => lerp(v, bl[k], u)), R = tr.map((v, k) => lerp(v, br[k], u));
    const [lx, ly] = pr(...L), [rx, ry] = pr(...R);
    // each board a hair different, the lap of the one above throwing a thin shadow
    g.fillStyle = rgba(r() < 0.5 ? '#ffffff' : '#20203a', 0.05 + r() * 0.05);
    g.fill(poly([[lx, ly], [rx, ry], [rx, ry + step * 0.95], [lx, ly + step * 0.95]]));
    g.lineWidth = 1.3; g.strokeStyle = rgba(M.boards.line, 0.5); g.beginPath(); g.moveTo(lx, ly); g.lineTo(rx, ry); g.stroke();
    if (b > 0.45) { g.lineWidth = 1; g.strokeStyle = rgba(M.boards.lit, 0.45); g.beginPath(); g.moveTo(lx, ly + 1.6); g.lineTo(rx, ry + 1.6); g.stroke(); }
    // paint flaking here and there, the grey wood under it
    if (r() < 0.25) { const u2 = r(), x = lerp(lx, rx, u2), yy = lerp(ly, ry, u2) + 2; g.fillStyle = rgba('#b9a89a', 0.55); g.fill(ell(x, yy + 1.5, 3 + r() * 5, 1.3)); }
  }
  g.restore();
}
layer({
  id: 'mill-tower', z: 20, still: true,
  draw(g) {
    CF.contact(g, ...pr(MX, 0, MZ), 78, 22, 0.55);
    stage(g, false);
    // the brick base
    const base = octFaces(0, Y0, 60, 60);
    for (const f of base) {
      const b = face3(g, f.q, M.brick, 2.2, f.n);
      const [tl, tr, br, bl] = f.q;
      g.save(); g.clip(P3(f.q));
      for (let y = 0, k = 0; y < Y0; y += 5.5, k++) {
        const u = y / Y0, L = tl.map((v, j) => lerp(v, bl[j], u)), R = tr.map((v, j) => lerp(v, br[j], u));
        const [lx, ly] = pr(...L), [rx, ry] = pr(...R);
        g.lineWidth = 0.9; g.strokeStyle = rgba(M.brick.line, 0.5); g.beginPath(); g.moveTo(lx, ly); g.lineTo(rx, ry); g.stroke();
        for (let s = (k % 2) * 0.5; s < 5; s += 1) { const x = lerp(lx, rx, s / 5), yy = lerp(ly, ry, s / 5); g.beginPath(); g.moveTo(x, yy); g.lineTo(x, yy + 5.5); g.stroke(); }
      }
      g.fillStyle = grad(g, 0, pr(...bl)[1] - 12, 0, pr(...bl)[1], ['rgba(50,30,70,0)', 'rgba(50,30,70,0.35)']); g.fill(P3(f.q));
      g.restore();
      void b;
    }
    // the boarded tower
    const tower = octFaces(Y0, Y1, R0, R1);
    for (const f of tower) {
      const b = face3(g, f.q, M.boards, 2.4, f.n);
      boards(g, f, b, 8, f.i * 13);
      // corner posts, the darker trim every smock mill has
      tube(g, seg(...pr(...f.q[0]), ...pr(...f.q[3])), tone(M.boards, b * 0.5), 2.6, 1.1);
    }
    // the door, and a window or two up the front faces
    const fr = tower.filter((f) => f.n[2] > 0.3).sort((a, b) => a.n[0] - b.n[0]);
    const doorF = base.filter((f) => f.n[2] > 0.5).sort((a, b) => Math.abs(a.n[0] + 0.2) - Math.abs(b.n[0] + 0.2))[0];
    if (doorF) {
      const [tl, tr, br, bl] = doorF.q, Mx = CF.quadM(tl, tr, bl), b = lit(doorF.n);
      const w = Mx.w, dw = 22, x = (w - dw) / 2;
      ink(g, on(Mx, CF.archPath(x, 2, dw, Y0 - 2)), '#3a2026', 1.4);
      ink(g, on(Mx, CF.archPath(x + 2, 4, dw - 4, Y0 - 4)), tone(M.timber, b), 1.2, M.timber.line);
      g.lineWidth = 0.8; g.strokeStyle = rgba(M.timber.line, 0.5);
      for (const k of [6, 11, 16]) g.stroke(on(Mx, seg(x + k, 6, x + k, Y0 - 1)));
      ink(g, on(Mx, circ(x + dw - 6, Y0 * 0.6, 1.6)), '#f2c14e', 0.8);
    }
    for (const [f, y, s] of [[fr[0], 0.55, 1], [fr[1], 0.25, 0.8], [fr[fr.length - 1], 0.72, 0.9]]) {
      if (!f) continue;
      const [tl, tr, br, bl] = f.q, Mx = CF.quadM(tl, tr, bl), w = Mx.w * 0.6;
      CF.windowFlat(g, Mx, (Mx.w - 12 * s) / 2 + Mx.w * 0.04, Mx.h * y, 12 * s, 16 * s, lit(f.n), { cols: 1, rows: 2, lamp: y > 0.5 });
      void w;
    }
    // flour sacks by the door, one slumped
    const sack = (a, r0, h, tilt) => {
      const [x, y] = pr(MX + Math.cos(a) * 72, 0, MZ + Math.sin(a) * 72);
      CF.contact(g, x, y, 14, 4, 0.5);
      const p = new Path2D(); p.moveTo(x - r0, y); p.bezierCurveTo(x - r0 - 2, y - h * 0.6, x - r0 * 0.5 + tilt, y - h, x + tilt, y - h); p.bezierCurveTo(x + r0 * 0.5 + tilt, y - h, x + r0 + 2, y - h * 0.6, x + r0, y); p.closePath();
      ink(g, p, grad(g, x - r0, 0, x + r0, 0, ['#b8a38a', '#e8d8bc', '#fff2da']), 1.5);
      g.lineWidth = 1.6; g.strokeStyle = '#a0734a'; g.beginPath(); g.moveTo(x - 5 + tilt, y - h + 4); g.lineTo(x + 5 + tilt, y - h + 4); g.stroke();
      g.font = 'italic 700 6px Georgia, serif'; g.fillStyle = 'rgba(120,70,60,0.6)'; g.textAlign = 'center'; g.fillText('FLOUR', x + tilt * 0.4, y - h * 0.4);
    };
    sack(1.95, 10, 22, -2); sack(2.2, 9, 18, 3); sack(1.72, 10, 14, 6);
  },
});

// ------------------------------------------------------------------ the stage, the cap, the sails
const mill = { a: 0.4, w: 0.5, fan: 0, oil: 0, wipe: 0, blink: D.blinker(), drip: 0 };
const STAGE = 150;
function stage(g, front) {
  // the stage platform round the tower, railing on the outside; front: the half nearer us
  const pts = [], inner = [];
  for (let i = 0; i <= 24; i++) {
    const a = front ? (i / 24) * Math.PI : Math.PI + (i / 24) * Math.PI;
    pts.push(pr(MX + Math.cos(a) * 74, STAGE, MZ + Math.sin(a) * 74)); inner.push(pr(MX + Math.cos(a) * rAt(STAGE), STAGE, MZ + Math.sin(a) * rAt(STAGE)));
  }
  if (!front) {
    for (let i = 0; i <= 24; i += 3) { const [x, y] = pts[i]; tube(g, seg(x, y, x, y - 18), tone(M.timber, 0.3), 1.6, 0.9); }
    tube(g, poly(pts.map(([x, y]) => [x, y - 18]), false), tone(M.timber, 0.35), 2.2, 1);
    return;
  }
  const deck = poly(pts.concat(inner.slice().reverse()));
  ink(g, deck, tone(M.timber, 0.78), 1.8, M.timber.line);
  g.save(); g.clip(deck); g.lineWidth = 0.8; g.strokeStyle = rgba(M.timber.line, 0.4);
  for (let i = 0; i <= 24; i += 1) { g.beginPath(); g.moveTo(...pts[i]); g.lineTo(...inner[i]); g.stroke(); }
  g.restore();
  ink(g, poly(pts.concat(pts.map(([x, y]) => [x, y + 5]).reverse())), tone(M.timber, 0.4), 1.4, M.timber.line);
  for (let i = 2; i <= 22; i += 5) { const a = (i / 24) * Math.PI; const [x0, y0] = pr(MX + Math.cos(a) * rAt(STAGE - 30), STAGE - 30, MZ + Math.sin(a) * rAt(STAGE - 30)), [x1, y1] = pr(MX + Math.cos(a) * 70, STAGE, MZ + Math.sin(a) * 70); tube(g, seg(x0, y0, x1, y1 + 4), tone(M.timber, 0.4), 2.6, 1.1); }
  CF.mill.stagePts = pts;
}
function stageRail(g) {
  const pts = CF.mill.stagePts; if (!pts) return;
  for (let i = 0; i <= 24; i += 2) { const [x, y] = pts[i]; tube(g, seg(x, y, x, y - 18), tone(M.timber, 0.72), 1.6, 0.9); }
  tube(g, poly(pts.map(([x, y]) => [x, y - 18]), false), tone(M.timber, 0.75), 2.4, 1.1);
  tube(g, poly(pts.map(([x, y]) => [x, y - 9]), false), tone(M.timber, 0.65), 1.4, 0.8);
}
function cap(g, t) {
  const [cx, cy] = pr(MX, Y1, MZ), rx = 44, ry = rx * CF.CAM.S, h = 44;
  // the windshaft out of the cap to the hub
  const [hx, hy] = pr(...HUB);
  tube(g, seg(cx + NS[0] * 10, cy - 18, hx, hy), tone(M.timber, 0.4), 7, 1.6);
  // the fantail at the back: struts up from the cap, a little wheel that turns
  const back = [MX - NS[0] * 50, Y1 + 30, MZ - NS[2] * 50], [fx, fy] = pr(...back);
  tube(g, seg(cx - NS[0] * 30, cy - 4, fx, fy + 6), tone(M.timber, 0.3), 2.4, 1); tube(g, seg(cx - NS[0] * 20, cy - 22, fx, fy), tone(M.timber, 0.3), 2.4, 1);
  const fanM = plane(back, NS, [0, -1, 0]);
  for (let i = 0; i < 6; i++) {
    const a = mill.fan + (i * TAU) / 6, ca = Math.cos(a), sa = Math.sin(a);
    const bl = poly([[ca * 4 - sa * 2, sa * 4 + ca * 2], [ca * 17 - sa * 4, sa * 17 + ca * 4], [ca * 17 + sa * 4, sa * 17 - ca * 4], [ca * 4 + sa * 2, sa * 4 - ca * 2]]);
    ink(g, on(fanM, bl), i % 2 ? '#f3e4c8' : '#d9c3a0', 1);
  }
  ink(g, circ(fx, fy, 2.6), '#5a3a3a', 1);
  // the cap itself: a dome, lit from the right
  const p = new Path2D(); p.moveTo(cx - rx, cy); p.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); p.bezierCurveTo(cx + rx, cy - h * 0.8, cx + rx * 0.4, cy - h, cx, cy - h); p.bezierCurveTo(cx - rx * 0.45, cy - h, cx - rx, cy - h * 0.8, cx - rx, cy); p.closePath();
  const gr = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
  for (let i = 0; i <= 8; i++) { const a = Math.acos(clamp(-1 + i / 4, -1, 1)); gr.addColorStop(i / 8, tone(M.tile, lit([Math.cos(a) * 0.8, 0.6, Math.sin(a) * 0.8]))); }
  g.lineWidth = 4.6; g.strokeStyle = M.tile.line; g.stroke(p); g.fillStyle = gr; g.fill(p);
  g.save(); g.clip(p);
  g.lineWidth = 1.1; g.strokeStyle = rgba(M.tile.line, 0.45);
  for (let k = -3; k <= 3; k++) { const x = cx + k * 12; g.beginPath(); g.moveTo(x, cy + ry); g.quadraticCurveTo(x + k * 2, cy - h * 0.6, cx + k * 3, cy - h); g.stroke(); }
  g.fillStyle = 'rgba(255,230,190,0.45)'; g.fill(ell(cx + rx * 0.45, cy - h * 0.55, 6, 14, undefined, 0.4));
  g.restore();
  ink(g, ell(cx, cy + 1, rx + 2, ry + 1.2), null, 0);
  tube(g, D.poly([[cx - rx, cy + 2], [cx - rx * 0.7, cy + ry * 0.8], [cx, cy + ry + 2], [cx + rx * 0.7, cy + ry * 0.8], [cx + rx, cy + 2]], false), tone(M.timber, 0.6), 4, 1.3);
  ink(g, circ(cx, cy - h - 4, 4.5), '#f2c14e', 1.4);
  // a sparrow on the cap, who doesn't mind the noise
  const sx = cx - 14, sy = cy - h + 6 + Math.abs(Math.sin(t * 0.9)) * 0.6;
  ink(g, ell(sx, sy, 5, 3.6), '#a0745a', 1.1); ink(g, circ(sx - 4, sy - 3, 2.6), '#a0745a', 1.1);
  g.fillStyle = '#2a1c26'; g.fill(circ(sx - 4.6, sy - 3.4, 0.7));
  ink(g, poly([[sx - 6.4, sy - 3], [sx - 9, sy - 2.4], [sx - 6.4, sy - 1.8]]), '#f2a65e', 0.6);
  ink(g, poly([[sx + 4, sy - 1], [sx + 9, sy - 3], [sx + 8, sy + 1]]), '#7a5444', 0.9);
}
function sails(g, t) {
  // the shaded side of the cloth faces us; the low sun behind lights it through
  const glowA = 0.35 + 0.2 * Math.max(0, Math.sin(t * 0.3));
  const blur = clamp((mill.w - 1.5) / 4, 0, 1);
  if (blur > 0.02) {
    // a racing mill: a faint disc where the sails have been
    g.save(); g.globalAlpha = blur * 0.22; g.fillStyle = '#f3d6b0'; g.fill(on(sailM, circ(0, 0, 150))); g.restore();
  }
  for (let i = 0; i < 4; i++) {
    const a = mill.a + (i * TAU) / 4, ca = Math.cos(a), sa = Math.sin(a);
    const R = (x, y) => [ca * x - sa * y, sa * x + ca * y];
    const pth = (pts) => on(sailM, poly(pts.map(([x, y]) => R(x, y))));
    // the stock: the long spar
    const st = pth([[6, -3.5], [152, -2.5], [152, 2.5], [6, 3.5]]);
    ink(g, st, tone(M.timber, 0.45), 1.6, M.timber.line);
    // the cloth, on the trailing side of the stock, a little billowed
    const cloth = pth([[32, 4], [148, 4], [148, 36], [40, 31]]);
    ink(g, cloth, tone(M.canvas, 0.5 + (i % 2) * 0.06), 1.5, M.canvas.line);
    g.save(); g.clip(cloth);
    g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = glowA; g.fillStyle = '#ffb060'; g.fill(pth([[60, 12], [140, 12], [140, 30], [66, 27]])); g.restore();
    // the seams of the cloth, and the lattice showing through it darker
    g.lineWidth = 0.9; g.strokeStyle = rgba(M.canvas.line, 0.35);
    for (let k = 1; k < 3; k++) { const y = 4 + k * 10.5; g.stroke(on(sailM, poly([R(34, y), R(148, y + 1)], false))); }
    g.lineWidth = 1.5; g.strokeStyle = rgba(M.canvas.line, 0.4);
    for (let k = 1; k < 9; k++) { const x = 32 + k * 13.5; g.stroke(on(sailM, poly([R(x, 4), R(x, 34 - (148 - x) * 0.03)], false))); }
    g.restore();
    // the lattice bars on the leading side, bare
    g.lineWidth = 1.2; g.strokeStyle = tone(M.timber, 0.55);
    for (let k = 0; k < 9; k++) { const x = 34 + k * 13.5; g.stroke(on(sailM, poly([R(x, -3), R(x, -11)], false))); }
    tube(g, on(sailM, poly([R(34, -11), R(150, -11)], false)), tone(M.timber, 0.6), 1.6, 0.8);
  }
  // the hub, the poll end of the shaft
  const [hx, hy] = pr(...HUB);
  ink(g, on(sailM, circ(0, 0, 11)), tone(M.timber, 0.4), 2, M.timber.line);
  ink(g, on(sailM, circ(0, 0, 4.5)), '#f2c14e', 1.2);
  void hx; void hy;
}
layer({
  id: 'mill-sails', z: 21,
  hit: (x, y) => { const [hx, hy] = pr(...HUB); return ((x - hx) / 150) ** 2 + ((y - hy) / 150) ** 2 < 1; },
  update(dt, t, L) {
    const idle = 0.25 + 0.45 * wind(t, 960);
    mill.w = ease(mill.w, L.hovered ? 5.2 : idle, L.hovered ? 0.9 : 0.35, dt);
    mill.a += mill.w * dt;
    mill.fan += (0.6 + mill.w * 0.8) * dt;
    breeze.extra = ease(breeze.extra, clamp((mill.w - 1) / 4, 0, 1) * 1.1, 1, dt);
  },
  draw(g, t) {
    cap(g, t);
    sails(g, t);
  },
});

// the stage's near half and the miller on it, in front of the tower
layer({
  id: 'miller', z: 22,
  hit: (x, y) => { const [mx, my] = pr(...millerPos()); return Math.abs(x - mx) < 26 && y > my - 44 && y < my + 6; },
  update(dt, t, L) {
    mill.oil = ease(mill.oil, L.hovered ? 1 : 0, L.hovered ? 4 : 1.5, dt);
    mill.wipe = ease(mill.wipe, L.hovered && L.since > 1.1 ? 1 : 0, 3, dt);
    if (L.hovered && L.since > 0.6 && mill.drip <= 0) { mill.drip = 1.4; const [mx, my] = pr(...millerPos()); spawn({ kind: 'drop', x: mx + 22, y: my - 30, vy: 10, g: 400, life: 0.8 }); }
    mill.drip -= dt;
  },
  draw(g, t, L) {
    stage(g, true);
    const [mx, my] = pr(...millerPos());
    CF.contact(g, mx, my, 14, 3.5, 0.45);
    const o = mill.oil, w = mill.wipe;
    frog(g, mx, my, 0.64, { c: CF.FROG_TINTS.olive, open: mill.blink(t), look: [clamp((P.x - mx) / 200, -1, 1) * (1 - o) + o * 0.6, -0.6 * (1 - o) - o * 0.6], smile: 2 + o,
      arms: w > 0.3 ? [[-6, -36, -12, -12], [20, -22 - o * 8]] : [[20, -22 - o * 10], [-14, -6]],
      hat: (g, lw) => { ink(g, poly([[-14, -34], [14, -34], [10, -40], [-10, -40]]), '#f3e4c8', lw); g.fillStyle = 'rgba(255,255,255,0.6)'; g.fill(circ(-4, -37, 1.5)); } });
    // the oil can, raised toward the shaft when you hover
    const cx = mx + 14 * 0.64 + 6, cy = my - (22 + o * 10) * 0.64 - 2;
    g.save(); g.translate(cx, cy); g.rotate(-0.5 - o * 0.5);
    ink(g, poly([[-4, -4], [4, -4], [5, 4], [-5, 4]]), '#a0a8b8', 1.1);
    tube(g, seg(4, -2, 13, -8), '#a0a8b8', 1.4, 0.8);
    g.restore();
    stageRail(g);
  },
});
function millerPos() { const a = Math.PI / 2 + 0.4; return [MX + Math.cos(a) * 62, STAGE, MZ + Math.sin(a) * 62]; }
})();
