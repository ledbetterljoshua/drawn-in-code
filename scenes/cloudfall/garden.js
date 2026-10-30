/* garden.js — everything else that lives on the island's top: the worn path and its stepping
   stones (z17), the shadows everything casts across the grass (z18), the peach tree (z24, hover:
   it shakes and drops leaves; linger: a peach falls and rolls), the hammock slung from it (z25,
   hover: it rocks; someone's asleep in it), the vegetable garden and its gardener (z26, hover:
   she waters, and the cabbages perk up), the fence (z27), sunflowers that turn to watch you
   (z28), the beehive (z28.5, hover: the bees come out and follow you about), the pond and its
   duckling (z34, ripples where the pointer goes; hover and she paddles faster, singing), the
   waterfall pouring off the edge (z35, hover: a sky-fish leaps). */
(() => {
const D = Drawn, { TAU, clamp, lerp, ease, rng, noise, hash, wind, circ, ell, rect, seg, quad, poly, curve, ink, grad, radial, tube, lumps, st, P, layer, onLayout, sprite, blit } = D;
const { pr, mix, rgba, tone, lit, M, on, plane, frog, spawn, P3, face3 } = CF;
const S = CF.CAM.S;

// ------------------------------------------------------------------ paths and stepping stones
const PATH = [[-6, 18], [8, 54], [-4, 92], [-46, 128], [-110, 132], [-180, 118], [-260, 96], [-330, 66], [-392, 30]];
const SPUR = [[8, 54], [52, 78], [96, 92]];
layer({
  id: 'paths', z: 17, still: true,
  draw(g) {
    // worn earth where feet go, then the stones laid in it
    for (const line of [PATH, SPUR]) {
      const pts = line.map(([X, Z]) => pr(X, 0, Z));
      g.lineCap = 'round'; g.lineJoin = 'round';
      g.lineWidth = 30 * S + 12; g.strokeStyle = rgba('#b8a06a', 0.4); g.stroke(curve(pts, false));
      g.lineWidth = 20 * S + 6; g.strokeStyle = rgba('#d9c08a', 0.4); g.stroke(curve(pts, false));
    }
    const r = rng(14);
    const stonesAlong = (line, step) => {
      const out = [];
      for (let i = 0; i < line.length - 1; i++) {
        const [ax, az] = line[i], [bx, bz] = line[i + 1], L = Math.hypot(bx - ax, bz - az);
        for (let d = 0; d < L; d += step + r() * 6) out.push([lerp(ax, bx, d / L) + (r() - 0.5) * 8, lerp(az, bz, d / L) + (r() - 0.5) * 8]);
      }
      return out;
    };
    for (const [X, Z] of stonesAlong(PATH, 19).concat(stonesAlong(SPUR, 21))) {
      const [x, y] = pr(X, 0, Z), w = 6.5 + r() * 4, h = (6 + r() * 3) * S + 1.3, rot = (r() - 0.5) * 0.4;
      ink(g, ell(x, y + 1.5, w + 1, h + 1, undefined, rot), rgba('#3a2a3a', 0.25), 0);
      const p = ell(x, y, w, h, undefined, rot);
      ink(g, p, grad(g, x - w, y, x + w, y, [tone(M.stone, 0.45), tone(M.stone, 0.75 + r() * 0.15)]), 1.3, M.stone.line);
      g.fillStyle = rgba('#fff6e0', 0.35); g.fill(ell(x + w * 0.2, y - h * 0.3, w * 0.5, h * 0.35, undefined, rot));
      if (r() < 0.3) { g.lineWidth = 1; g.strokeStyle = rgba(M.grass.line, 0.5); g.beginPath(); g.moveTo(x - w - 1, y); g.lineTo(x - w + 2, y - 4); g.moveTo(x + w, y + 1); g.lineTo(x + w + 2, y - 3); g.stroke(); }
    }
  },
});

// ------------------------------------------------------------------ cast shadows across the grass
layer({
  id: 'shadows', z: 18, still: true,
  draw(g) {
    g.save(); g.clip(CF.topPath);
    for (const f of CF.casters) CF.multiply(g, CF.castPath(f()), CF.SHADOW, 0.85);
    // the tree's canopy throws a soft dappled patch
    const [sx, sz] = CF.shadowOf(TREE.X, TREE.cy, TREE.Z);
    const [x, y] = pr(sx, 0, sz);
    CF.multiply(g, ell(x, y, 150, 150 * S * 1.2), CF.SHADOW, 0.7);
    const r = rng(2);
    for (let i = 0; i < 14; i++) CF.multiply(g, ell(x + (r() - 0.5) * 260, y + (r() - 0.5) * 70, 30 + r() * 30, 10 + r() * 8), CF.SHADOW, 0.35);
    // little things cast long thin shadows too: flowers, poles, the hive, the barrel, the post
    const streak = (X, Z, h, w, a = 0.75) => { const [x0, y0] = pr(X, 0, Z), [sx, sz] = CF.shadowOf(X, h, Z), [x1, y1] = pr(sx, 0, sz); g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = a; g.strokeStyle = CF.SHADOW; g.lineCap = 'round'; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.fillStyle = CF.SHADOW; g.fill(ell(x1, y1, w * 2.2, w * 0.9)); g.restore(); };
    for (const f of flowers) streak(f.X, f.Z, f.h, 2.5);
    streak(HIVE[0], HIVE[2], 40, 14); streak(-150, 168, 78, 6); streak(HB[0], HB[2], 62, 4);
    const [bX, bZ] = CF.cottage.at(-84, 76); streak(bX, bZ, 30, 18);
    streak(-104, 150, 30, 12, 0.6);
    for (let a = 1.75; a <= 2.75; a += 0.07) { const [X, Z] = CF.rim(a); streak(X * 0.93, Z * 0.93, 18, 2.2, 0.5); }
    // the trunk's shadow, a long thin streak back to the left
    const [tx, ty] = pr(TREE.X, 0, TREE.Z), [sx2, sz2] = CF.shadowOf(TREE.X, 130, TREE.Z), [ex, ey] = pr(sx2, 0, sz2);
    g.lineCap = 'round'; g.lineWidth = 20; g.save(); g.globalCompositeOperation = 'multiply'; g.strokeStyle = CF.SHADOW; g.globalAlpha = 0.85; g.beginPath(); g.moveTo(tx, ty); g.lineTo(ex, ey); g.stroke(); g.restore();
    g.restore();
  },
});

// ------------------------------------------------------------------ the peach tree
const TREE = { X: -318, Z: -64, cy: 206 };
let treeSprite = null;
const peaches = [];
function drawTree(g) {
  const [bx, by] = pr(TREE.X, 0, TREE.Z), [cx, cy] = pr(TREE.X, TREE.cy, TREE.Z);
  // roots flaring into the grass, with the dark of the hollows between them
  CF.contact(g, bx, by + 2, 46, 12, 0.55);
  for (const [dx, dy, w] of [[-34, 6, 9], [-16, 9, 8], [22, 8, 9], [36, 3, 7]]) tube(g, quad(bx + dx * 0.2, by - 18, bx + dx * 0.6, by - 2, bx + dx, by + dy), tone(M.bark, dx > 0 ? 0.6 : 0.3), w, 1.8);
  // the trunk: a bit of twist, bark ridges running up it
  const trunk = new Path2D();
  trunk.moveTo(bx - 20, by + 2); trunk.bezierCurveTo(bx - 12, by - 50, bx - 26, by - 110, bx - 12, by - 160);
  trunk.lineTo(bx + 12, by - 160); trunk.bezierCurveTo(bx + 4, by - 100, bx + 18, by - 50, bx + 22, by + 2);
  trunk.quadraticCurveTo(bx, by - 4, bx - 20, by + 2); trunk.closePath();
  // the branches, some of them showing through the gaps in the leaves
  for (const p of [quad(bx - 10, by - 120, bx - 70, by - 160, bx - 120, by - 210), quad(bx + 2, by - 140, bx + 60, by - 180, bx + 110, by - 205), quad(bx - 4, by - 150, bx - 10, by - 210, bx + 10, by - 270), quad(bx - 60, by - 165, bx - 90, by - 190, bx - 100, by - 250)]) tube(g, p, tone(M.bark, 0.45), 9, 2);
  ink(g, trunk, grad(g, bx - 20, 0, bx + 22, 0, [tone(M.bark, 0.15), tone(M.bark, 0.5), tone(M.bark, 0.85)]), 2.4, M.bark.line);
  g.save(); g.clip(trunk);
  const r = rng(6);
  for (let i = 0; i < 16; i++) {
    const x = bx - 18 + i * 2.6 + (r() - 0.5) * 2, y0 = by + 4 - r() * 20, y1 = by - 160 + r() * 30;
    g.lineWidth = 1 + r(); g.strokeStyle = rgba(i < 9 ? M.bark.line : '#f0c090', i < 9 ? 0.4 : 0.3);
    g.beginPath(); g.moveTo(x, y0); g.bezierCurveTo(x + 6, (y0 + y1) * 0.5 + 20, x - 8, (y0 + y1) * 0.5 - 20, x + (r() - 0.5) * 6, y1); g.stroke();
  }
  // a knot, and the warm rim on the sun side
  ink(g, ell(bx + 4, by - 70, 5, 7), tone(M.bark, 0.2), 1.2, M.bark.line);
  g.lineWidth = 5; g.strokeStyle = 'rgba(255,200,140,0.35)'; g.beginPath(); g.moveTo(bx + 22, by); g.bezierCurveTo(bx + 18, by - 50, bx + 4, by - 100, bx + 12, by - 160); g.stroke();
  g.restore();
  // the birdhouse nailed to the trunk
  const hx = bx - 2, hy = by - 104;
  ink(g, rect(hx - 9, hy - 6, 18, 18), tone({ shade: '#5a6a8a', base: '#8ab0c0', lit: '#d6ecdc', line: '#2a3446' }, 0.6), 1.4, '#2a3446');
  ink(g, poly([[hx - 12, hy - 5], [hx, hy - 16], [hx + 12, hy - 5]]), tone(M.tile, 0.6), 1.4, M.tile.line);
  ink(g, circ(hx, hy + 2, 3.4), '#2a1c26', 0.8);
  tube(g, seg(hx, hy + 8, hx, hy + 11), '#5a3a3a', 1, 0.6);
  // the canopy: big clumps, cooler and darker toward the lower left where the tree shades itself
  const R = rng(11), cl = [];
  for (let i = 0; i < 26; i++) {
    const a = (i / 26) * TAU + R() * 0.3, d = 0.35 + R() * 0.62;
    cl.push([cx + Math.cos(a) * 150 * d, cy + Math.sin(a) * 105 * d, 30 + R() * 22]);
  }
  cl.push([cx, cy - 10, 44], [cx + 40, cy - 50, 40], [cx - 50, cy - 30, 40], [cx + 10, cy - 80, 36], [cx - 80, cy + 30, 34]);
  const dark = (x, y) => clamp(((cx - x) / 150) * 0.55 + ((y - cy) / 110) * 0.35 + 0.12, 0, 0.92);
  // back clumps first, darker, so the canopy has depth
  CF.leafy(g, cl.map(([x, y, r_]) => [x - 8, y - 12, r_ * 0.95]), M.leaf, { seed: 3, dark: (x, y) => clamp(dark(x, y) + 0.35, 0, 0.95), lw: 2.2 });
  CF.leafy(g, cl, M.leafWarm, { seed: 7, dark, lw: 2.4 });
  // gaps of sky between the clumps aren't there; but light between: a few bright leaves

  // the low sun catching the right edge of the crown
  g.save(); const U = new Path2D(); for (const [x, y, r_] of cl) CF.scallop(x, y, r_, 1, U); g.clip(U);
  g.lineWidth = 9; g.strokeStyle = grad(g, cx + 40, 0, cx + 170, 0, ['rgba(255,214,140,0)', 'rgba(255,214,140,0.55)']); g.stroke(U); g.restore();
  // ripe peaches, mostly on the sunny side
  peaches.length = 0;
  for (let i = 0; i < 24; i++) {
    const a = R() * TAU, d = 0.3 + R() * 0.65, x = cx + Math.cos(a) * 140 * d, y = cy + Math.sin(a) * 92 * d;
    if (dark(x, y) > 0.55) continue;
    peaches.push([x, y]);
    ink(g, circ(x, y, 5.5), grad(g, x - 5, y - 5, x + 5, y + 5, ['#ffd08a', '#f59a62', '#d9604a']), 1.4, '#5a2a2a');
    g.fillStyle = 'rgba(255,255,240,0.75)'; g.fill(circ(x + 1.8, y - 2, 1.3));
    ink(g, ell(x + 3, y - 6, 3.4, 1.6, undefined, -0.5), '#5f9e52', 0.8, M.leaf.line);
  }
}
onLayout(() => { treeSprite = sprite(200, 150, 520, 560, drawTree); });
const tree = { sh: 0, drop: null, dropT: 0 };
layer({
  id: 'tree', z: 24,
  hit: (x, y) => { const [cx, cy] = pr(TREE.X, TREE.cy, TREE.Z), [bx, by] = pr(TREE.X, 0, TREE.Z); return ((x - cx) / 165) ** 2 + ((y - cy) / 125) ** 2 < 1 || (Math.abs(x - bx) < 24 && y < by + 6 && y > by - 170); },
  update(dt, t, L) {
    tree.sh = ease(tree.sh, L.hovered ? clamp(0.25 + P.sp / 500, 0, 1) : 0, 4, dt);
    const [cx, cy] = pr(TREE.X, TREE.cy, TREE.Z);
    if (L.hovered && Math.random() < dt * (2 + P.sp / 60)) spawn({ kind: 'leaf', x: cx - 130 + Math.random() * 260, y: cy - 60 + Math.random() * 120, vy: 20, vx: 10, life: 4.5, rot: Math.random() * 6, vr: 2, size: 0.8 + Math.random() * 0.5 });
    tree.dropT -= dt;
    if (L.hovered && L.since > 0.8 && tree.dropT < 0 && peaches.length) {
      tree.dropT = 2.5;
      const [x, y] = peaches[(Math.random() * peaches.length) | 0];
      const [, gy] = pr(TREE.X + 40 + Math.random() * 60, 0, TREE.Z + 40 + Math.random() * 50);
      tree.drop = { x, y, vy: 0, vx: 0, ground: gy, bounce: 0, age: 0 };
    }
    const d = tree.drop;
    if (d) {
      d.age += dt; d.vy += 700 * dt; d.y += d.vy * dt; d.x += d.vx * dt;
      if (d.y > d.ground) { d.y = d.ground; if (d.bounce < 2) { d.vy *= -0.35; d.vx = 30; d.bounce++; } else { d.vy = 0; d.vx = ease(d.vx, 0, 2, dt); } }
      if (d.age > 6) tree.drop = null;
    }
  },
  draw(g, t) {
    if (!treeSprite) return;
    const [bx, by] = pr(TREE.X, 0, TREE.Z);
    const sk = (wind(t, 460) - 0.75) * 0.022 + Math.sin(t * 23) * 0.006 * tree.sh + Math.sin(t * 1.1) * 0.004;
    g.save(); g.translate(bx, by); g.transform(1, 0, -sk, 1, 0, 0); g.translate(-bx, -by);
    blit(g, treeSprite);
    g.restore();
    const d = tree.drop;
    if (d) {
      if (d.bounce) CF.contact(g, d.x, d.ground + 1, 7, 2.5, 0.4);
      g.save(); g.translate(d.x, d.y - 5); g.rotate(d.x * 0.05);
      ink(g, circ(0, 0, 5.5), grad(g, -5, -5, 5, 5, ['#ffd08a', '#f59a62', '#d9604a']), 1.4, '#5a2a2a');
      g.restore();
    }
  },
});

// ------------------------------------------------------------------ the hammock
const ham = { a: 0, v: 0, zt: 0, ht: 0, wake: 0 };
const HA = [TREE.X + 16, 52, TREE.Z + 22], HB = [-226, 52, 34];
layer({
  id: 'hammock-post', z: 23, still: true,
  draw(g) {
    const [x, y] = pr(HB[0], 0, HB[2]), [, y2] = pr(HB[0], 62, HB[2]);
    CF.contact(g, x, y, 10, 3, 0.5);
    tube(g, seg(x, y, x - 2, y2), tone(M.timber, 0.6), 5, 1.6);
  },
});
layer({
  id: 'hammock', z: 25,
  hit: (x, y) => { const [ax, ay] = pr(...HA), [bx, by] = pr(...HB); return x > ax + 10 && x < bx && y > Math.min(ay, by) - 14 && y < Math.max(ay, by) + 34; },
  onEnter() { ham.v += (P.vx >= 0 ? 1 : -1) * 1.4; },
  update(dt, t, L) {
    const push = (wind(t, 540) - 0.75) * 0.25;
    ham.v += (-9 * (ham.a - push) - 0.5 * ham.v) * dt;
    if (L.hovered && Math.abs(ham.a) < 0.05) ham.v += Math.sign(ham.v || 1) * 22 * dt;
    ham.v = clamp(ham.v, -2.2, 2.2); ham.a += ham.v * dt;
    ham.wake = ease(ham.wake, L.hovered && L.since > 1.2 ? 1 : 0, 2, dt);
    ham.zt -= dt; ham.ht -= dt;
    const [ax, ay] = pr(...HA), [bx, by] = pr(...HB), mx = (ax + bx) / 2;
    if (ham.zt < 0 && ham.wake < 0.5) { ham.zt = 1.7; spawn({ kind: 'z', x: mx + 10 + ham.a * 20, y: (ay + by) / 2 + 2, vx: 8, vy: -16, life: 2.6, size: 0.8 }); }
    if (L.hovered && ham.ht < 0) { ham.ht = 0.9; spawn({ kind: 'heart', x: mx + ham.a * 20, y: (ay + by) / 2, vx: (Math.random() - 0.5) * 10, vy: -26, life: 2, size: 0.8 }); }
  },
  draw(g, t, L) {
    const [ax, ay] = pr(...HA), [bx, by] = pr(...HB);
    const off = ham.a * 18, lift = Math.abs(ham.a) * 5;
    const e1 = [ax + 14, ay + 8], e2 = [bx - 10, by + 8], mx = (e1[0] + e2[0]) / 2 + off, my = (e1[1] + e2[1]) / 2 + 26 - lift;
    g.lineWidth = 1.3; g.strokeStyle = '#6e4c46';
    for (const k of [-3, 0, 3]) { g.beginPath(); g.moveTo(ax, ay); g.lineTo(e1[0], e1[1] + k); g.moveTo(bx, by); g.lineTo(e2[0], e2[1] + k); g.stroke(); }
    const breathe = Math.sin(t * 1.6) * 0.6;
    frog(g, mx + 10, my - 12 + breathe, 0.72, { sleep: ham.wake < 0.5, open: ham.wake, smile: 1.4 + L.hover * 2, rot: -0.2 + ham.a * 0.3, c: CF.FROG_TINTS.moss });
    const cA = [mx * 2 - (e1[0] + e2[0]) / 2, (my - 14) * 2 - (e1[1] + e2[1]) / 2], cB = [mx * 2 - (e1[0] + e2[0]) / 2, (my + 8) * 2 - (e1[1] + e2[1]) / 2];
    const fabric = new Path2D(); fabric.moveTo(...e1); fabric.quadraticCurveTo(...cA, ...e2); fabric.quadraticCurveTo(...cB, ...e1); fabric.closePath();
    ink(g, fabric, '#f3d27e', 2, '#5a3a30');
    g.save(); g.clip(fabric);
    g.lineWidth = 3.4; g.strokeStyle = '#d9584a';
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(e1[0], e1[1] + 4 + k * 6); g.quadraticCurveTo(cA[0], (my - 4 + k * 6) * 2 - (e1[1] + e2[1]) / 2, e2[0], e2[1] + 4 + k * 6); g.stroke(); }
    g.fillStyle = 'rgba(70,50,110,0.25)'; g.fill(ell(mx, my + 12, 60, 10));
    g.restore();
    ink(g, ell(e1[0] + 18 + off * 0.5, my - 9, 5, 2.8, undefined, 0.5), CF.FROG.base, 1.3);
    // a book left open on the sleeper's tummy
    ink(g, poly([[mx - 2, my - 6], [mx + 9, my - 9], [mx + 18, my - 5], [mx + 9, my - 2]]), '#fff2dc', 1.1);
    g.lineWidth = 1; g.strokeStyle = '#9a4a3a'; g.beginPath(); g.moveTo(mx + 9, my - 9); g.lineTo(mx + 9, my - 2); g.stroke();
  },
});

// ------------------------------------------------------------------ the vegetable garden
const BEDS = [{ X: -252, Z: 170, w: 120, d: 34, crop: 'cabbage' }, { X: -150, Z: 214, w: 70, d: 28, crop: 'pumpkin' }];
const gard = { water: 0, perk: 0, blink: D.blinker(), can: 0 };
function bedBox(g, B) {
  const x0 = B.X - B.w / 2, x1 = B.X + B.w / 2, z0 = B.Z - B.d / 2, z1 = B.Z + B.d / 2, h = 8;
  CF.contact(g, ...pr(B.X, 0, z1), B.w * 0.6, 6, 0.4);
  face3(g, [[x0, h, z1], [x1, h, z1], [x1, 0, z1], [x0, 0, z1]], M.timber, 1.6);
  face3(g, [[x0, h, z0], [x0, h, z1], [x0, 0, z1], [x0, 0, z0]], M.timber, 1.4);
  const soil = P3([[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]]);
  ink(g, soil, tone(M.soil, 0.55), 1.4, M.soil.line);
  g.save(); g.clip(soil); g.lineWidth = 1; g.strokeStyle = rgba('#2c1a28', 0.4);
  for (let k = 1; k < 4; k++) { const z = lerp(z0, z1, k / 4); g.beginPath(); g.moveTo(...pr(x0, h, z)); g.lineTo(...pr(x1, h, z)); g.stroke(); }
  g.restore();
}
layer({
  id: 'garden-beds', z: 33, still: true,
  draw(g) {
    for (const B of BEDS) bedBox(g, B);
    // the bean poles: a teepee of sticks with runner beans climbing it
    const [tx, ty] = pr(-150, 0, 168), [px, py] = pr(-150, 78, 168);
    CF.contact(g, tx, ty, 18, 5, 0.4);
    for (const dx of [-14, -4, 6, 14]) tube(g, seg(tx + dx, ty + (dx % 3), px, py), tone(M.timber, 0.6), 2, 1);
    const r = rng(3);
    for (let i = 0; i < 30; i++) {
      const u = r(), dx = [-14, -4, 6, 14][(r() * 4) | 0], x = lerp(tx + dx, px, u), y = lerp(ty, py, u);
      ink(g, ell(x + (r() - 0.5) * 6, y, 4, 2.4, undefined, r() * 3), r() < 0.5 ? tone(M.leaf, 0.5) : tone(M.leaf, 0.75), 0.8, M.leaf.line);
      if (r() < 0.25) ink(g, circ(x + 3, y + 2, 2), '#e0503f', 0.7, '#5a2030');
    }
  },
});
layer({
  id: 'garden-life', z: 33.5,
  hit: (x, y) => { const [cx, cy] = pr(-170, 0, 180); return Math.abs(x - cx) < 110 && y > cy - 50 && y < cy + 30; },
  update(dt, t, L) {
    gard.water = ease(gard.water, L.hovered ? 1 : 0, L.hovered ? 3 : 1.4, dt);
    gard.perk = ease(gard.perk, L.hovered && L.since > 0.6 ? 1 : 0, 1.2, dt);
    if (gard.water > 0.6 && Math.random() < dt * 30) { const [sx, sy] = pr(...canSpout()); spawn({ kind: 'drop', x: sx + (Math.random() - 0.5) * 4, y: sy, vx: -20 - Math.random() * 20, vy: 10, g: 500, life: 0.35 }); }
  },
  draw(g, t) {
    const r = rng(9);
    for (const B of BEDS) {
      const x0 = B.X - B.w / 2, z0 = B.Z - B.d / 2;
      for (let i = 0; i < Math.round(B.w / 14); i++) for (let k = 0; k < (B.crop === 'pumpkin' ? 1 : 2); k++) {
        const X = x0 + 8 + i * 14 + (r() - 0.5) * 3, Z = z0 + 8 + k * 14, [x, y] = pr(X, 8, Z), sw = Math.sin(t * 1.5 + X * 0.1) * (wind(t, x) - 0.6) * 2, perk = gard.perk;
        if (B.crop === 'cabbage') {
          if (i % 2) continue;
          for (const [dx, dy, rot] of [[-5, -2, -0.5], [5, -2, 0.5], [0, -1, 0], [-3, -5, -0.9], [3, -5, 0.9]]) ink(g, ell(x + dx, y + dy - perk, 5, 3.2, undefined, rot), '#5f9a70', 0.9, '#24392c');
          ink(g, circ(x, y - 5 - perk * 2, 4.6), radial(g, x + 1.5, y - 7 - perk * 2, 0.5, 5, ['#e4f2b8', '#9fd08c', '#6faa76']), 1, '#24392c');
        }
        else if (B.crop === 'carrot') { for (const dx of [-3, 0, 3]) { g.lineWidth = 1.4; g.strokeStyle = '#5f9e52'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + dx, y - 6, x + dx * 1.6 + sw, y - 11 - perk * 3); g.stroke(); } ink(g, ell(x, y + 0.5, 2.4, 1.4), '#ef8a3c', 0.8, '#6a2a20'); }
        else if (i < 4) { const p = ell(x, y - 4, 6.5, 4.8); ink(g, p, grad(g, x - 9, 0, x + 9, 0, ['#c9562f', '#ef8a3c', '#f9c070']), 1.4, '#6a2a20'); g.lineWidth = 0.9; g.strokeStyle = 'rgba(106,42,32,0.5)'; for (const dx of [-4, 0, 4]) { g.beginPath(); g.ellipse(x + dx, y - 5, 3, 6.5, 0, -Math.PI / 2, Math.PI / 2, dx < 0); g.stroke(); } tube(g, quad(x, y - 11, x + 2, y - 15, x + 5, y - 15), '#5f7a3a', 1.8, 0.8); }
      }
    }
    // the gardener, in her sun hat, watering can in hand
    const [gx, gy] = pr(-104, 0, 150);
    CF.contact(g, gx, gy, 16, 4, 0.5);
    const w = gard.water;
    frog(g, gx, gy, 0.8, { wide: 1.18, tall: 0.94, c: CF.FROG_TINTS.gold, open: gard.blink(t), look: CF.lookAt(gx, gy, [-0.9 + w * 0.2, 0.5 + w * 0.3]).map((v, i) => (i ? v : -v)), smile: 2.2 + w, flip: true, rot: -w * 0.08,
      arms: [[-16 - w * 2, -16 + w * 6], [12, -10]],
      hat: (g, lw) => { ink(g, D.ell(0, -31, 22, 5), '#f0d68a', lw); ink(g, D.ell(0, -36, 11, 7), '#f0d68a', lw); g.lineWidth = 2.2; g.strokeStyle = '#7fb8b0'; g.beginPath(); g.ellipse(0, -33, 10.6, 2.6, 0, 0, Math.PI); g.stroke(); ink(g, circ(8, -35, 2.4), '#f3a0b0', 0.8); } });
    const [sx, sy] = pr(...canSpout());
    const [hx, hy] = [gx - 13, gy - (16 - w * 6) * 0.7];
    g.save(); g.translate(hx, hy); g.rotate(-w * 0.6);
    ink(g, poly([[-10, -4], [2, -4], [3, 8], [-11, 8]]), grad(g, -11, 0, 3, 0, ['#4f7a9a', '#7fb0c8', '#c0e0e8']), 1.3);
    tube(g, seg(-10, 0, -22, -6), '#6fa0b8', 1.8, 0.9);
    g.lineWidth = 1.4; g.strokeStyle = '#3a2232'; g.beginPath(); g.arc(-4, -6, 5, Math.PI, 0); g.stroke();
    g.restore();
    void sx; void sy;
  },
});
function canSpout() { const w = gard.water; return [-104 - 26 - w * 4, 18 - w * 8, 150]; }

// ------------------------------------------------------------------ the fence along the front edge
layer({
  id: 'fence', z: 36.5, still: true,
  draw(g) {
    const posts = [];
    for (let a = 1.75; a <= 2.75; a += 0.07) { const [X, Z] = CF.rim(a); posts.push([X * 0.93, Z * 0.93]); }
    const top = posts.map(([X, Z]) => pr(X, 15, Z)), mid = posts.map(([X, Z]) => pr(X, 7, Z));
    for (let i = 0; i < posts.length; i++) {
      if (hash(i * 4.1) < 0.1) continue; // a post gone missing
      const [X, Z] = posts[i], [x, y] = pr(X, 0, Z), [, y2] = pr(X, 18, Z), lean = (hash(i) - 0.5) * 3;
      CF.contact(g, x, y, 5, 1.5, 0.4);
      ink(g, poly([[x - 2.4, y], [x - 2.4 + lean, y2 + 3], [x + lean, y2], [x + 2.4 + lean, y2 + 3], [x + 2.4, y]]), tone(M.plaster, 0.75), 1.3, M.timber.line);
    }
    for (const line of [top, mid]) { tube(g, curve(line, false), tone(M.plaster, 0.8), 2, 1.1); }
  },
});

// ------------------------------------------------------------------ sunflowers that turn to watch you
const flowers = [[96, -14, 96, 1], [112, 2, 78, 2], [84, 10, 108, 3], [124, -22, 88, 4]].map(([X, Z, h, s]) => ({ X, Z, h, s, nod: 0, face: 0.8 }));
layer({
  id: 'sunflowers', z: 31.8,
  hit: (x, y) => flowers.some((f) => Math.hypot(x - f.hx, y - f.hy) < 22),
  update(dt, t, L) {
    for (const f of flowers) {
      const [x, y] = pr(f.X, f.h, f.Z), near = P.inside && Math.hypot(P.x - x, P.y - y) < 600;
      f.face = ease(f.face, near ? clamp((P.x - x) / 220, -1, 1) : 0.8, near ? 2.5 : 0.6, dt);
      f.nod = ease(f.nod, L.hovered && Math.hypot(P.x - f.hx, P.y - f.hy) < 30 ? 1 : 0, 4, dt);
    }
  },
  draw(g, t) {
    for (const f of flowers.slice().sort((a, b) => a.Z - b.Z)) {
      const [x, y] = pr(f.X, 0, f.Z), H = f.h * CF.CAM.C;
      const sway = (wind(t, x) - 0.7) * 6 + Math.sin(t * 1.4 + f.s) * 1.5 + f.face * 5;
      const hx = x + sway, hy = y - H + f.nod * 6 + Math.sin(t * 8) * f.nod * 2;
      f.hx = hx; f.hy = hy;
      CF.contact(g, x, y, 8, 2.5, 0.4);
      tube(g, quad(x, y, x + sway * 0.2, y - H * 0.5, hx, hy + 6), '#5f9a49', 3, 1.4);
      for (const [u, side] of [[0.35, 1], [0.6, -1]]) ink(g, ell(x + sway * u + side * 8, y - H * u, 9, 4, undefined, -0.5 * side), side > 0 ? '#6fae55' : '#4f8a4a', 1.2, M.leaf.line);
      g.save(); g.translate(hx, hy); g.scale(0.55 + 0.45 * Math.cos(f.face * 0.9), 1); g.rotate(f.face * 0.15);
      for (let i = 0; i < 16; i++) { const a = (i / 16) * TAU + t * 0.05 * f.nod; ink(g, ell(Math.cos(a) * 11.5, Math.sin(a) * 11.5, 6.5, 2.8, undefined, a), i % 2 ? '#f6b83a' : '#ffd965', 1.1, '#6a4020'); }
      ink(g, circ(f.face * 2, 0, 8), radial(g, f.face * 2 + 2, -2, 1, 8, ['#b07a48', '#6e4030', '#4a2a22']), 1.3, '#3a2020');
      g.fillStyle = 'rgba(255,220,150,0.35)'; for (let k = 0; k < 6; k++) g.fill(circ(f.face * 2 + Math.cos(k * 2.4) * 4, Math.sin(k * 2.4) * 4, 0.8));
      if (f.nod > 0.3) { g.fillStyle = '#2a1c26'; g.fill(circ(f.face * 2 - 2.5, -1, 1)); g.fill(circ(f.face * 2 + 2.5, -1, 1)); g.lineWidth = 1; g.strokeStyle = '#2a1c26'; g.beginPath(); g.arc(f.face * 2, 1, 2.4, 0.3, Math.PI - 0.3); g.stroke(); }
      g.restore();
    }
  },
});

// ------------------------------------------------------------------ the beehive and its bees
const HIVE = [142, 0, 18];
const bees = Array.from({ length: 7 }, (_, i) => ({ ph: i * 0.9, x: 0, y: 0, out: 0 }));
const hive = { out: 0 };
layer({
  id: 'hive', z: 31.9,
  hit: (x, y) => { const [hx, hy] = pr(...HIVE); return Math.abs(x - hx) < 22 && y > hy - 44 && y < hy + 4; },
  update(dt, t, L) {
    hive.out = ease(hive.out, L.hovered ? 1 : 0, L.hovered ? 2 : 0.6, dt);
    const [hx, hy] = pr(...HIVE);
    bees.forEach((b, i) => {
      const home = [hx + Math.cos(t * 2 + b.ph) * 18, hy - 30 + Math.sin(t * 2.7 + b.ph) * 10];
      const follow = [P.x + Math.cos(t * 3 + b.ph) * 26, P.y + Math.sin(t * 3.4 + b.ph) * 18];
      const k = clamp(hive.out * 1.2 - i * 0.05, 0, 1);
      const tx = lerp(home[0], follow[0], k), ty = lerp(home[1], follow[1], k);
      b.x = ease(b.x || hx, tx, 3 + i * 0.3, dt); b.y = ease(b.y || hy, ty, 3 + i * 0.3, dt);
    });
  },
  draw(g, t) {
    const [hx, hy] = pr(...HIVE);
    CF.contact(g, hx, hy, 16, 4, 0.5);
    // a straw skep on a stump
    ink(g, poly([[hx - 9, hy], [hx - 8, hy - 9], [hx + 8, hy - 9], [hx + 9, hy]]), tone(M.bark, 0.55), 1.4, M.bark.line);
    const sk = new Path2D(); sk.moveTo(hx - 15, hy - 9); sk.bezierCurveTo(hx - 17, hy - 30, hx - 8, hy - 40, hx, hy - 40); sk.bezierCurveTo(hx + 8, hy - 40, hx + 17, hy - 30, hx + 15, hy - 9); sk.closePath();
    ink(g, sk, grad(g, hx - 15, 0, hx + 15, 0, ['#a0743a', '#e0b45c', '#f8dc8a']), 1.8, '#5a3a20');
    g.save(); g.clip(sk); g.lineWidth = 1.2; g.strokeStyle = 'rgba(90,58,32,0.55)';
    for (let k = 0; k < 6; k++) { const y = hy - 12 - k * 5.4; g.beginPath(); g.ellipse(hx, y, 17 - k * 1.6, 2.4, 0, 0, Math.PI); g.stroke(); }
    g.restore();
    ink(g, ell(hx + 2, hy - 13, 3.4, 2.4), '#2a1c26', 0);
    for (const b of bees) {
      const wing = Math.sin(t * 60 + b.ph) * 0.5 + 0.5;
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fill(ell(b.x - 1, b.y - 3, 2.4, 1.4 + wing));
      ink(g, ell(b.x, b.y, 3.2, 2.2), '#f6c445', 0.9, '#2a1c26');
      g.lineWidth = 1; g.strokeStyle = '#2a1c26'; g.beginPath(); g.moveTo(b.x - 0.6, b.y - 2); g.lineTo(b.x - 0.6, b.y + 2); g.stroke();
    }
  },
});

// ------------------------------------------------------------------ the pond, the brook, the duckling
const POND = { X: 152, Z: 104, rx: 92, rz: 60 };
const pond = { rings: [], duck: { a: 0, sp: 0.35, q: 0 } };
const pondPath = () => { const pts = []; for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU, k = 1 + 0.06 * noise(a * 3 + 2); pts.push(pr(POND.X + Math.cos(a) * POND.rx * k, 0, POND.Z + Math.sin(a) * POND.rz * k)); } return curve(pts, true); };
const LIP = (() => { const [X, Z] = CF.rim(0.42); return [X * 0.99, Z * 0.99]; })();
CF.LIP = LIP;
const brookPts = () => [[POND.X + POND.rx - 8, POND.Z + 4], [POND.X + POND.rx + 30, POND.Z + 18], [lerp(POND.X + POND.rx + 30, LIP[0], 0.6), lerp(POND.Z + 18, LIP[1], 0.6) - 4], LIP];
layer({
  id: 'pond', z: 34,
  hit: (x, y) => { const [cx, cy] = pr(POND.X, 0, POND.Z); return ((x - cx) / (POND.rx + 8)) ** 2 + ((y - cy) / (POND.rz * S + 10)) ** 2 < 1; },
  update(dt, t, L) {
    if (L.hovered && P.sp > 40 && Math.random() < dt * 12) pond.rings.push({ x: P.x, y: P.y, age: 0 });
    for (const r of pond.rings) r.age += dt;
    while (pond.rings.length && pond.rings[0].age > 1.6) pond.rings.shift();
    const d = pond.duck;
    d.sp = ease(d.sp, L.hovered ? 1.3 : 0.35, 2, dt); d.a += d.sp * dt * 0.5; d.q -= dt;
    if (L.hovered && d.q < 0) { d.q = 1.1; spawn({ kind: 'note', x: d.x + 6, y: d.y - 16, vy: -24, vx: 8, life: 1.6, size: 0.9 }); }
  },
  draw(g, t) {
    // the brook: a channel cut in the turf, its far bank showing as a little wall of earth
    const bp = brookPts(), N = 24, L_ = [], R_ = [], W_ = [];
    const cat = (u) => { const n = bp.length - 1, i = Math.min(n - 1, Math.floor(u * n)), f = u * n - i; return [lerp(bp[i][0], bp[i + 1][0], f), lerp(bp[i][1], bp[i + 1][1], f)]; };
    for (let i = 0; i <= N; i++) {
      const u = i / N, [X, Z] = cat(u), [X2, Z2] = cat(Math.min(1, u + 0.02)), [X0, Z0] = cat(Math.max(0, u - 0.02));
      const dx = X2 - X0, dz = Z2 - Z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l, nz = dx / l, w = 15 + u * 12 + Math.sin(u * 9) * 2;
      const m = Math.sin(u * 7) * 5;
      L_.push([X + nx * (w + m * 0.2) + nz * m, Z + nz * w]); R_.push([X - nx * w + nz * m, Z - nz * (w + m * 0.2)]); W_.push(w);
    }
    const far = L_.map(([X, Z]) => (Z < 0 ? null : null) || [X, Z]);
    const farSide = (L_[0][1] < R_[0][1]) ? L_ : R_, nearSide = farSide === L_ ? R_ : L_;
    const bank = poly(farSide.map(([X, Z]) => pr(X, 0, Z)).concat(farSide.slice().reverse().map(([X, Z]) => pr(X, -5, Z))));
    ink(g, bank, tone(M.soil, 0.45), 1.2, M.soil.line);
    const wat = poly(farSide.map(([X, Z]) => pr(X, -5, Z)).concat(nearSide.slice().reverse().map(([X, Z]) => pr(X, -4, Z))));
    const [b0x] = pr(...bp[0].flatMap((v, i) => (i ? [0, v] : [v])));
    g.fillStyle = grad(g, b0x, 0, pr(LIP[0], 0, LIP[1])[0], 0, ['#8fc6d8', '#b8e2ea', '#dff3f2']); g.fill(wat);
    g.lineWidth = 1.4; g.strokeStyle = M.water.line; g.stroke(wat);
    g.save(); g.clip(wat);
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,255,255,0.8)'; g.setLineDash([5, 9]); g.lineDashOffset = -t * 34;
    g.stroke(curve(bp.map(([X, Z]) => pr(X, -4, Z)), false)); g.lineDashOffset = -t * 34 + 7; g.globalAlpha = 0.5;
    g.stroke(curve(bp.map(([X, Z]) => pr(X + 2, -4, Z + 4)), false)); g.setLineDash([]); g.globalAlpha = 1;
    g.restore();
    // grass hanging over its near edge, and two stones to hop across on
    for (let i = 1; i < N; i++) { const [X, Z] = nearSide[i], [x, y] = pr(X, 0, Z); g.lineWidth = 1.3; g.strokeStyle = tone(M.grass, 0.55); g.beginPath(); g.moveTo(x - 2, y + 1); g.lineTo(x + 1, y - 4); g.moveTo(x + 2, y + 1); g.lineTo(x + 4, y - 3); g.stroke(); }
    for (const u of [0.36]) { const [X, Z] = cat(u); const [x, y] = pr(X, -2, Z); ink(g, ell(x - 4, y, 5, 2.4), tone(M.stone, 0.7), 1, M.stone.line); ink(g, ell(x + 6, y + 3, 4.5, 2.2), tone(M.stone, 0.6), 1, M.stone.line); }
    void far; void W_;
    // the pond's stone rim
    const water = pondPath(), [cx, cy] = pr(POND.X, 0, POND.Z);
    const r = rng(8);
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * TAU, k = 1.06 + 0.06 * noise(a * 3 + 2); if (Math.abs(a - 0.25) < 0.22) continue;
      const [x, y] = pr(POND.X + Math.cos(a) * POND.rx * k, 0, POND.Z + Math.sin(a) * POND.rz * k);
      ink(g, ell(x, y, 8 + r() * 4, 4 + r() * 1.5), grad(g, x - 10, 0, x + 10, 0, [tone(M.stone, 0.4), tone(M.stone, 0.8)]), 1.3, M.stone.line);
    }
    // the water: it mirrors the sky, darker toward us where we look down into it
    g.lineWidth = 2.2; g.strokeStyle = M.water.line; g.stroke(water);
    g.fillStyle = grad(g, 0, cy - POND.rz * S, 0, cy + POND.rz * S, ['#f7d8b0', '#a9cfe0', '#5a8fb4', '#3e6f9a']); g.fill(water);
    g.save(); g.clip(water);
    // the far bank's reflection: a band of green just under the far edge
    g.fillStyle = 'rgba(60,110,80,0.35)'; g.fill(ell(cx, cy - POND.rz * S + 3, POND.rx, 5));
    g.fillStyle = 'rgba(255,246,220,0.6)';
    for (let i = 0; i < 4; i++) { const x = cx - POND.rx + ((t * 8 + i * 47) % (POND.rx * 2)); g.fill(ell(x, cy - 3 + i * 3, 14, 1.4)); }
    for (const rg of pond.rings) { g.lineWidth = 1.3; g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - rg.age / 1.6)})`; g.stroke(ell(rg.x, rg.y, 4 + rg.age * 22, 1.3 + rg.age * 6)); }
    g.restore();
    // lily pads and a lotus
    for (const [X, Z, s] of [[110, 92, 1], [190, 118, 0.8], [204, 96, 0.7], [128, 124, 0.75]]) {
      const [x, y] = pr(X, 0, Z), pad = new Path2D(); pad.moveTo(x, y); pad.ellipse(x, y, 11 * s, 4 * s, 0, 0.35, TAU - 0.05); pad.closePath();
      ink(g, pad, tone(M.leaf, 0.6), 1.2, M.leaf.line);
    }
    const [lx, ly] = pr(110, 0, 92);
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.5; ink(g, ell(lx + Math.cos(a) * 4, ly - 2 + Math.sin(a) * 3, 2.6, 5.5, undefined, a + Math.PI / 2), '#f7b6c6', 1, '#7a3a4a'); }
    // reeds at the back of the pond, swaying
    for (let i = 0; i < 12; i++) {
      const a = Math.PI + 0.5 + i * 0.12, [x, y] = pr(POND.X + Math.cos(a) * POND.rx, 0, POND.Z + Math.sin(a) * POND.rz), sw = (wind(t, x) - 0.6) * 5 + Math.sin(t * 2 + i) * 1.5, h = 24 + (i % 3) * 8;
      g.lineWidth = 1.8; g.strokeStyle = '#4f7a42'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + sw * 0.3, y - h * 0.5, x + sw, y - h); g.stroke();
      if (i % 3 === 0) ink(g, ell(x + sw, y - h, 2.2, 5), '#7a4e38', 0.8);
    }
    // the duckling
    const d = pond.duck, da = d.a;
    [d.x, d.y] = pr(POND.X + Math.cos(da) * POND.rx * 0.6, 0, POND.Z + Math.sin(da) * POND.rz * 0.55);
    const dir = -Math.sin(da) >= 0 ? 1 : -1, bob = Math.sin(t * 4) * 0.8;
    g.save(); g.translate(d.x, d.y + bob); g.scale(dir, 1);
    g.lineWidth = 1; g.strokeStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse(-4, 1, 12, 2.4, 0, 0, Math.PI); g.stroke();
    ink(g, ell(0, -4, 9, 6), grad(g, 0, -10, 0, 2, ['#ffe27a', '#f2b83f']), 1.4);
    ink(g, circ(7, -11, 5), '#ffe27a', 1.4);
    ink(g, poly([[11.5, -11.5], [16, -10], [11.5, -8.5]]), '#f2843c', 1);
    g.fillStyle = '#2a1c26'; g.fill(circ(8.6, -12.2, 1.2));
    g.restore();
  },
});

// ------------------------------------------------------------------ the waterfall
// the brook's water shoots out over the lip on an arc, falls as one sheet, then tears into
// ribbons and blows away as spray long before the cloud floor
const fall = { flow: 0 };
const OUT = CF.norm([Math.cos(0.42), 0, Math.sin(0.42)]), TAN = [-OUT[2], 0, OUT[0]];
const fallAt = (t, side, w0 = 13) => {
  const v = 34, gg = 60, sp = w0 + t * 5.5;
  return pr(LIP[0] + OUT[0] * v * t + TAN[0] * side * sp, -4 - 0.5 * gg * t * t, LIP[1] + OUT[2] * v * t + TAN[2] * side * sp);
};
layer({
  id: 'waterfall', z: 35,
  hit: (x, y) => { const [lx, ly] = pr(LIP[0], 0, LIP[1]); return y > ly && y < 1150 && Math.abs(x - lx - 30) < 44; },
  onEnter() { const [lx, ly] = pr(LIP[0], 0, LIP[1]); spawn({ kind: 'fish', x: lx + 20, y: ly + 130, vx: 60 + Math.random() * 30, vy: -170, g: 300, life: 1.6, size: 1 }); },
  update(dt, t, L) { fall.flow = ease(fall.flow, L.hover, 2, dt); },
  draw(g, t) {
    const f = fall.flow, gust = (wind(t, 1100) - 0.7) * 6;
    const T1 = 4.3, TS = 2.1, N = 30;
    const edge = (side, t0, t1, w0, off = 0) => { const pts = []; for (let i = 0; i <= N; i++) { const tt = lerp(t0, t1, i / N), sp = clamp((tt - TS + 0.5) / (T1 - TS + 0.5), 0, 1), [x, y] = fallAt(tt, side, w0 + f * 2 + (1 - sp) * (13 - w0) * (off ? 1 : 0)); pts.push([x + off * sp + gust * tt * tt * 0.6 + Math.sin(tt * 3 + t * 2 + off) * tt * 2, y]); } return pts; };
    const sheet = (t0, t1, w0, off, a0, a1) => {
      const L = edge(-1, t0, t1, w0, off), R = edge(1, t0, t1, w0, off);
      const p = poly(L.concat(R.reverse()));
      const y0 = L[0][1], y1 = L[L.length - 1][1];
      g.fillStyle = grad(g, 0, y0, 0, y1, [[0, `rgba(120,188,218,${a0})`], [0.5, `rgba(190,228,242,${(a0 + a1) / 2})`], [1, `rgba(255,250,244,${a1})`]]);
      g.fill(p);
      g.save(); g.clip(p);
      const [cx] = fallAt((t0 + t1) / 2, 0);
      g.fillStyle = grad(g, cx - 30, 0, cx + 30, 0, ['rgba(50,100,150,0.25)', 'rgba(50,100,150,0.04)', 'rgba(255,236,200,0.5)']); g.fillRect(cx - 80, y0, 160, y1 - y0);
      for (let i = 0; i < 9; i++) {
        const u = (i + 0.5) / 9 * 2 - 1, sp = 0.9 + (i % 3) * 0.2 + f * 0.4;
        for (let k = 0; k < 3; k++) {
          const tt = t0 + ((t * sp * 0.6 + i * 0.37 + k * 0.33) % 1) * (t1 - t0), [x, y] = fallAt(tt, u, w0), [x2, y2] = fallAt(Math.min(t1, tt + 0.12), u, w0);
          g.lineWidth = 1.7; g.strokeStyle = `rgba(255,255,255,${0.8 - (tt - t0) / (t1 - t0) * 0.5})`;
          g.beginPath(); g.moveTo(x + off + gust * tt * tt * 0.6, y); g.lineTo(x2 + off + gust * tt * tt * 0.6, y2); g.stroke();
        }
      }
      g.restore();
      return p;
    };
    // the main sheet, inked down its first stretch, then three ribbons tearing apart
    const main = sheet(0, TS, 13, 0, 1, 0.5);
    g.save(); g.clip(new Path2D(main)); g.restore();
    const L0 = edge(-1, 0, TS * 0.55, 13 + f * 2), R0 = edge(1, 0, TS * 0.55, 13 + f * 2);
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(40,66,94,0.55)'; g.stroke(poly(L0, false)); g.stroke(poly(R0, false));
    for (const [w0, off, a] of [[5, -16, 0.8], [6, 1, 0.9], [4, 17, 0.7]]) sheet(TS - 0.5, T1, w0, off, 0.75 * a, 0);
    // the lip: a lit roll of water where it goes over, foam at its foot
    const [lx, ly] = fallAt(0, -1), [rx, ry] = fallAt(0, 1);
    g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.moveTo(lx, ly + 2); g.quadraticCurveTo((lx + rx) / 2, (ly + ry) / 2 + 6, rx, ry + 2); g.stroke();
    for (let i = 0; i < 6; i++) { const ph = (t * 1.5 + i * 0.17) % 1, [fx_, fy] = fallAt(0.05, -1 + i * 0.4); g.fillStyle = `rgba(255,255,255,${0.7 * (1 - ph)})`; g.fill(circ(fx_, fy - ph * 6, 1.8 + ph * 2.5)); }
    // spray: drops blown off the edges, and the veil of mist where it all comes apart
    for (let i = 0; i < 18; i++) { const ph = (t * 0.5 + i / 18) % 1, tt = 0.4 + ph * (T1 - 0.4), [x, y] = fallAt(tt, i % 2 ? 1.4 : -1.3); g.fillStyle = `rgba(255,255,255,${0.45 * (1 - ph)})`; g.fill(circ(x + gust * tt * tt + ph * 16 + Math.sin(i * 3) * 5, y, 1.2 + ph * 2)); }
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const ph = (t * 0.25 + i / 6) % 1, [x, y] = fallAt(T1 - 0.3 + ph * 0.3, (i - 2.5) * 0.5); const mx = x + gust * 4 + ph * 20, my = y - ph * 30, mr = 22 + ph * 30; g.fillStyle = radial(g, mx, my, 0, mr, [[0, `rgba(255,246,236,${0.22 * Math.sin(ph * Math.PI)})`], [1, 'rgba(255,246,236,0)']]); g.fill(circ(mx, my, mr)); }
    g.restore();
  },
});
})();
