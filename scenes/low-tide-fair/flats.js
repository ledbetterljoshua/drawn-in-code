/* flats.js — the wet sand the fair stands on (z5, still): dry ridges with ripple marks that tighten
   toward the horizon, glassy sheets of standing water mirroring the sky, the creek that winds from
   the near left corner past the grandmother snail and out to the sea, tide pools, worm casts,
   shells and wrack, footprints, and the silver trails every snail left coming in from the horizon.
   Live on top (z6): the water's shimmer and ripples, rings where the pointer drags across water,
   little fish in the creek who dart away from it, sand-hoppers who spring up around it. */
(() => {
const D = Drawn, F = Fair;
const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, ink, grad, radial, st, P, layer, onLayout } = D;
const { HZ, W, H, pxu, flat } = F;
const PAL = F.PAL;

// ------------------------------------------------------------ water: the creek and the pools
// the creek's centreline, its width in world units, and the outline built from them in perspective
const CREEK = [[-120, 1070], [80, 1020], [260, 975], [440, 918], [620, 862], [820, 828], [1040, 808], [1240, 760], [1420, 690], [1580, 612], [1740, 546], [1900, 484], [2050, 436], [2200, 404], [2320, 390]];
const creekW = 74;
function creekOutline() {
  const L = [], R = [];
  const n = 120;
  // resample the centreline smoothly
  const pts = [];
  for (let i = 0; i < CREEK.length - 1; i++) {
    const a = CREEK[Math.max(0, i - 1)], b = CREEK[i], c = CREEK[i + 1], d = CREEK[Math.min(CREEK.length - 1, i + 2)];
    for (let k = 0; k < 10; k++) {
      const u = k / 10, u2 = u * u, u3 = u2 * u;
      const f = (p0, p1, p2, p3) => 0.5 * (2 * p1 + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u2 + (-p0 + 3 * p1 - 3 * p2 + p3) * u3);
      pts.push([f(a[0], b[0], c[0], d[0]), f(a[1], b[1], c[1], d[1])]);
    }
  }
  pts.push(CREEK[CREEK.length - 1]);
  const r = rng(9);
  for (let i = 0; i < pts.length; i++) {
    const [x, y] = pts[i], [x1, y1] = pts[Math.min(pts.length - 1, i + 1)], [x0, y0] = pts[Math.max(0, i - 1)];
    const fl = flat(y), s = pxu(y);
    // direction in world (undo the ground squash), its perpendicular, back to screen
    let dx = x1 - x0, dy = (y1 - y0) / fl; const m = Math.hypot(dx, dy) || 1; dx /= m; dy /= m;
    const hw = creekW * 0.5 * s * (0.85 + 0.3 * noise(i * 0.21 + 3));
    const nx = -dy * hw, ny = dx * hw * fl;
    L.push([x + nx, y + ny]); R.push([x - nx, y - ny]);
  }
  return { L, R, pts };
}
const creek = creekOutline();
F.creek = creek;
const creekPath = poly([...creek.L, ...creek.R.slice().reverse()]);
// tide pools: [x, y, rx, seed]; ry follows the perspective
const POOLS = [[440, 940, 150, 1], [1190, 1012, 175, 2], [1665, 772, 92, 3], [290, 652, 76, 4], [1950, 612, 70, 5], [770, 1062, 90, 6], [1415, 868, 70, 7], [2120, 760, 80, 8]];
function poolPath(x, y, rx, seed) {
  const r = rng(seed * 13), pts = [], n = 14, ry = rx * flat(y) * 1.15;
  for (let i = 0; i < n; i++) { const a = (i / n) * TAU, k = 0.82 + r() * 0.3; pts.push([x + Math.cos(a) * rx * k, y + Math.sin(a) * ry * k]); }
  return curve(pts);
}
const pools = POOLS.map(([x, y, rx, s]) => ({ x, y, rx, path: poolPath(x, y, rx, s) }));
const water = new Path2D();
water.addPath(creekPath);
for (const p of pools) water.addPath(p.path);
F.water = water;
F.pools = pools;
const hitCtx = document.createElement('canvas').getContext('2d');
F.inWater = (x, y) => hitCtx.isPointInPath(water, x, y);

// the colour the water reflects at depth y: near the horizon the pale glow, nearer the sky's blue
const waterGrad = (g) => grad(g, 0, HZ, 0, H, [[0, '#f5e7cf'], [0.25, '#e9e1d2'], [0.55, '#c9d6d6'], [1, '#9fb9cb']]);

// ------------------------------------------------------------ the ground itself
layer({
  id: 'flats', z: 5, still: true,
  draw(g) {
    const v = st.view;
    const y0 = HZ + 60;
    // the sand: hazy and pale far off, warmer and deeper close to
    g.fillStyle = grad(g, 0, HZ + 40, 0, v.y1, [[0, '#e3cfbf'], [0.15, '#e0c6ab'], [0.45, '#dcbc98'], [1, '#cfa983']]);
    g.fillRect(v.x0 - 10, HZ + 40, v.x1 - v.x0 + 20, v.y1 - HZ);
    // a soft blend up into the far flats
    g.fillStyle = grad(g, 0, HZ + 30, 0, HZ + 95, ['rgba(232,218,206,1)', 'rgba(232,218,206,0)']);
    g.fillRect(v.x0 - 10, HZ + 30, v.x1 - v.x0 + 20, 66);

    // wet sand: broad darker, cooler, glossier sheets between the dry ridges
    const r = rng(3);
    for (let i = 0; i < 70; i++) {
      const y = y0 + r() ** 0.8 * (v.y1 - y0 + 60), s = pxu(y), x = v.x0 - 100 + r() * (v.x1 - v.x0 + 200);
      const w = (90 + r() * 260) * s, h = w * flat(y) * (0.5 + r() * 0.6);
      g.fillStyle = r() < 0.55 ? 'rgba(160,136,150,0.16)' : 'rgba(232,220,214,0.22)';
      g.fill(ell(x, y, w, h, undefined, (r() - 0.5) * 0.08));
    }
    // standing water films: thin sheets that mirror the sky in long horizontal strokes
    for (let i = 0; i < 46; i++) {
      const y = y0 + r() ** 1.3 * (v.y1 - y0), s = pxu(y), x = v.x0 + r() * (v.x1 - v.x0);
      const w = (60 + r() * 200) * s, h = Math.max(0.8, w * flat(y) * 0.16);
      g.fillStyle = F.rgba(F.mix('#f6eadb', '#b7cad6', (y - HZ) / (H - HZ)), 0.5 + r() * 0.3);
      g.fill(ell(x, y, w, h));
    }

    // ripple marks: rows of little wave-ridges, their spacing and size shrinking toward the horizon.
    // Each ridge is a lit crest (warm, facing the sun on the left) over a cool shadowed trough.
    for (let y = y0; y < v.y1 + 10;) {
      const s = pxu(y), sp = Math.max(1.6, 5.2 * s);
      const rowR = rng(Math.round(y * 10));
      let x = v.x0 - 40 + rowR() * 30;
      while (x < v.x1 + 40) {
        const len = (14 + rowR() * 30) * s, gap = (3 + rowR() * 22) * s;
        if (!F.inWater(x + len / 2, y) && rowR() < 0.82) {
          const wob = sp * 0.35, ph = rowR() * TAU;
          g.beginPath();
          for (let k = 0; k <= 6; k++) { const u = k / 6, px = x + len * u, py = y + Math.sin(u * TAU * 0.8 + ph) * wob - Math.sin(u * Math.PI) * sp * 0.15; k ? g.lineTo(px, py) : g.moveTo(px, py); }
          g.lineWidth = Math.max(0.5, 1.1 * s); g.strokeStyle = 'rgba(150,120,128,0.32)'; g.stroke();
          g.translate(0, -Math.max(0.6, 1.1 * s)); g.lineWidth = Math.max(0.4, 0.8 * s); g.strokeStyle = 'rgba(250,228,196,0.5)'; g.stroke(); g.translate(0, Math.max(0.6, 1.1 * s));
        }
        x += len + gap;
      }
      y += sp * (0.9 + rowR() * 0.5);
    }

    // trails: every snail came in from the horizon, and left a silver ribbon behind it
    for (const sn of F.SNAILS || []) {
      if (!sn.trail) continue;
      const pts = sn.trail;
      for (let i = 0; i < pts.length - 1; i++) {
        const [xa, ya] = pts[i], [xb, yb] = pts[i + 1], s = pxu((ya + yb) / 2);
        g.lineCap = 'round';
        g.lineWidth = Math.max(0.6, sn.trailW * s * flat(ya) * 2.2); g.strokeStyle = 'rgba(150,130,160,0.22)';
        g.beginPath(); g.moveTo(xa, ya); g.lineTo(xb, yb); g.stroke();
        g.lineWidth = Math.max(0.4, sn.trailW * s * flat(ya) * 1.1); g.strokeStyle = 'rgba(250,246,240,0.55)';
        g.beginPath(); g.moveTo(xa, ya - 0.5); g.lineTo(xb, yb - 0.5); g.stroke();
      }
    }

    // the creek's banks: a dark wet lip on the far side (seen in shadow) and a bright near edge
    g.save();
    g.lineJoin = 'round';
    g.beginPath(); creek.L.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.lineWidth = 7; g.strokeStyle = 'rgba(130,108,124,0.35)'; g.stroke();
    g.beginPath(); creek.R.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.lineWidth = 9; g.strokeStyle = 'rgba(150,126,140,0.3)'; g.stroke();
    g.restore();
    for (const p of pools) { g.save(); g.translate(0, -p.rx * flat(p.y) * 0.18); g.lineWidth = Math.max(2, p.rx * 0.05); g.strokeStyle = 'rgba(128,104,122,0.35)'; g.stroke(p.path); g.restore(); }
    // the water itself: the sky, upside down
    g.fillStyle = waterGrad(g); g.fill(water);
    g.save(); g.clip(water);
    // reflected cloud streaks and the bright bands of the low sky
    const rw = rng(44);
    for (let i = 0; i < 160; i++) {
      const y = HZ + rw() ** 1.2 * (H - HZ + 40), x = v.x0 + rw() * (v.x1 - v.x0), s = pxu(y);
      g.fillStyle = rw() < 0.5 ? 'rgba(255,246,228,0.5)' : 'rgba(200,184,206,0.35)';
      g.fill(ell(x, y, (30 + rw() * 120) * s, Math.max(0.5, 1.4 * s)));
    }
    // near edges catch the light; the shallows show sand through them
    g.globalCompositeOperation = 'multiply';
    for (const p of pools) { g.fillStyle = radial(g, p.x, p.y, p.rx * 0.2, p.rx, [[0, 'rgba(255,255,255,0)'], [1, 'rgba(214,190,170,0.55)']]); g.save(); g.translate(p.x, p.y); g.scale(1, flat(p.y) * 1.15); g.translate(-p.x, -p.y); g.fill(circ(p.x, p.y, p.rx * 1.1)); g.restore(); }
    g.restore();
    // the bright near rim of each pool and the creek, where the water meets the lit sand
    g.save(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,248,232,0.7)';
    g.beginPath(); creek.R.forEach(([x, y], i) => (i ? g.lineTo(x, y + 0.5) : g.moveTo(x, y + 0.5))); g.stroke();
    for (const p of pools) { g.save(); g.clip(new Path2D(`M${p.x - 400} ${p.y}h800v300h-800z`)); g.stroke(p.path); g.restore(); }
    g.restore();

    // worm casts, pebbles, cockles, razor shells, sand dollars, bits of wrack
    const rp = rng(17);
    for (let i = 0; i < 520; i++) {
      const y = y0 + 20 + rp() ** 0.7 * (v.y1 - y0), x = v.x0 + rp() * (v.x1 - v.x0), s = pxu(y);
      if (F.inWater(x, y) || s < 0.25) continue;
      const kind = rp();
      const fl = flat(y);
      if (kind < 0.3) { // worm cast: a little coil of sand
        g.strokeStyle = 'rgba(160,126,110,0.55)'; g.lineWidth = Math.max(0.6, 1.2 * s);
        g.beginPath(); for (let k = 0; k < 14; k++) { const a = k * 0.9, rr = (0.6 + k * 0.28) * s; const px = x + Math.cos(a) * rr * 1.4, py = y + Math.sin(a) * rr * fl * 2.4 - k * 0.1 * s; k ? g.lineTo(px, py) : g.moveTo(px, py); } g.stroke();
        g.strokeStyle = 'rgba(248,224,196,0.55)'; g.lineWidth = Math.max(0.4, 0.6 * s); g.stroke();
      } else if (kind < 0.55) { // pebble
        const rr = (1.2 + rp() * 3) * s, c = ['#8f8aa0', '#b5a69c', '#a49a8f', '#c9b9a8'][Math.floor(rp() * 4)];
        F.contact(g, x, y + rr * fl * 0.6, rr * 1.3, 0.35);
        ink(g, ell(x, y, rr, rr * 0.7), c, Math.max(0.4, 0.6 * s), 'rgba(80,60,80,0.5)');
        g.fillStyle = 'rgba(255,244,226,0.55)'; g.fill(ell(x - rr * 0.35, y - rr * 0.25, rr * 0.35, rr * 0.22));
      } else if (kind < 0.72) { // cockle shell
        const rr = (1.6 + rp() * 2.2) * s;
        F.contact(g, x, y + rr * 0.3, rr * 1.2, 0.3);
        const c = ['#f2e1cf', '#e9c3ad', '#f5d9b8', '#dcc4c8'][Math.floor(rp() * 4)];
        const p = curve([[x - rr, y], [x - rr * 0.8, y - rr * 0.8], [x, y - rr], [x + rr * 0.8, y - rr * 0.8], [x + rr, y]]);
        ink(g, p, c, Math.max(0.4, 0.55 * s), 'rgba(110,80,90,0.6)');
        g.strokeStyle = 'rgba(150,110,110,0.4)'; g.lineWidth = Math.max(0.3, 0.35 * s);
        for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(x, y + rr * 0.05); g.lineTo(x + k * rr * 0.4, y - rr * 0.85 + Math.abs(k) * rr * 0.15); g.stroke(); }
      } else if (kind < 0.8) { // razor shell
        const L = (6 + rp() * 6) * s, a = (rp() - 0.5) * 0.6;
        F.contact(g, x, y + 0.5, L * 0.6, 0.25);
        g.save(); g.translate(x, y); g.rotate(a); g.scale(1, Math.max(0.35, fl * 2));
        ink(g, ell(0, 0, L, L * 0.14), '#d9c7bf', Math.max(0.4, 0.5 * s), 'rgba(90,70,100,0.6)');
        g.fillStyle = 'rgba(130,120,160,0.5)'; g.fill(ell(0, L * 0.05, L * 0.9, L * 0.06));
        g.restore();
      } else if (kind < 0.86) { // a sand dollar
        const rr = (2.4 + rp() * 1.5) * s;
        ink(g, ell(x, y, rr, rr * fl * 2.2), '#ecdccb', Math.max(0.4, 0.5 * s), 'rgba(110,90,100,0.5)');
        g.fillStyle = 'rgba(170,140,140,0.55)';
        for (let k = 0; k < 5; k++) { const a = k / 5 * TAU - Math.PI / 2; g.fill(ell(x + Math.cos(a) * rr * 0.45, y + Math.sin(a) * rr * 0.45 * fl * 2.2, rr * 0.12, rr * 0.12 * fl * 3)); }
      } else { // a ribbon of wrack
        const L = (8 + rp() * 16) * s, a = (rp() - 0.5) * 0.5;
        g.save(); g.translate(x, y); g.rotate(a);
        const col = rp() < 0.7 ? '#6e7444' : '#9a4b44';
        g.strokeStyle = col; g.lineWidth = Math.max(0.8, 1.8 * s); g.lineCap = 'round';
        g.beginPath(); g.moveTo(-L / 2, 0); g.bezierCurveTo(-L / 4, -2 * s, L / 4, 2 * s, L / 2, -0.5 * s); g.stroke();
        g.fillStyle = col; for (let k = 0; k < 3; k++) g.fill(circ(-L / 3 + k * L / 3, (k % 2 - 0.5) * s, Math.max(0.6, 1.1 * s)));
        g.restore();
      }
    }
    // footprints: little paired prints wandering between the stalls
    const paths = [[[620, 900], [760, 880], [900, 905], [1010, 880]], [[1130, 840], [1250, 810], [1340, 790]], [[480, 1060], [600, 1000], [700, 990]], [[1450, 960], [1560, 930], [1700, 960]]];
    for (const pth of paths) {
      for (let i = 0; i < pth.length - 1; i++) {
        const [xa, ya] = pth[i], [xb, yb] = pth[i + 1];
        const n = Math.round(Math.hypot(xb - xa, yb - ya) / (7 * pxu(ya)));
        for (let k = 0; k < n; k++) {
          const u = k / n, x = lerp(xa, xb, u), y = lerp(ya, yb, u), s = pxu(y), side = k % 2 ? 1 : -1;
          g.fillStyle = 'rgba(140,110,120,0.32)';
          g.fill(ell(x, y + side * 1.6 * s * flat(y) * 3, 1.5 * s, 0.9 * s * flat(y) * 2.4));
        }
      }
    }
  },
});

// ------------------------------------------------------------ the water, alive
const rings = [];
const fish = [];
{
  const r = rng(55);
  for (let i = 0; i < 9; i++) fish.push({ u: r(), sp: 0.004 + r() * 0.006, side: r() * 2 - 1, ph: r() * TAU, dart: 0, du: 0, col: r() < 0.5 ? '#6f7f8c' : '#8a7f78' });
}
const hoppers = [];
let lastRing = 0;
function creekAt(u) {
  const pts = creek.pts, k = clamp(u, 0, 0.999) * (pts.length - 1), i = Math.floor(k), f = k - i;
  const a = pts[i], b = pts[i + 1];
  return [lerp(a[0], b[0], f), lerp(a[1], b[1], f), Math.atan2(b[1] - a[1], b[0] - a[0])];
}
layer({
  id: 'water-life', z: 6,
  update(dt, t) {
    F.tick(dt);
    // rings where the pointer drags across water
    if (P.inside && P.sp > 40 && t - lastRing > 0.12 && F.inWater(P.x, P.y)) { rings.push({ x: P.x, y: P.y, age: 0 }); lastRing = t; }
    for (const r of rings) r.age += dt;
    while (rings.length && rings[0].age > 1.6) rings.shift();
    // fish drift up and down the creek, and dart away from the pointer
    for (const f of fish) {
      const [x, y] = creekAt(f.u);
      const near = P.inside && Math.hypot(P.x - x, P.y - y) < 60 * pxu(y) + 20;
      if (near && f.dart < 0.2) { f.dart = 1; f.du = (P.x < x ? 1 : -1) * 0.02; }
      f.dart = ease(f.dart, 0, 1.5, dt);
      f.u += (f.sp * Math.sin(t * 0.2 + f.ph) * 0.4 + f.du * f.dart) * dt * 6;
      f.u = ((f.u % 1) + 1) % 1;
      if (f.u > 0.82) f.u = 0.02;
    }
    // sand-hoppers spring up where the pointer moves over dry sand
    if (P.inside && P.sp > 120 && P.y > HZ + 120 && Math.random() < dt * 8 && !F.inWater(P.x, P.y)) {
      const s = pxu(P.y);
      for (let k = 0; k < 2; k++) hoppers.push({ x: P.x + (Math.random() - 0.5) * 30 * s, y0: P.y + (Math.random() - 0.5) * 10 * s, h: 0, vh: (60 + Math.random() * 60) * s, vx: (Math.random() - 0.5) * 50 * s, s, age: 0 });
    }
    for (const h of hoppers) { h.age += dt; h.vh -= 400 * h.s * dt; h.h += h.vh * dt; h.x += h.vx * dt; if (h.h < 0) { h.h = 0; h.vh = Math.abs(h.vh) * 0.4; } }
    for (let i = hoppers.length - 1; i >= 0; i--) if (hoppers[i].age > 1.4) hoppers.splice(i, 1);
  },
  draw(g, t) {
    const v = st.view;
    g.save(); g.clip(water);
    // slow shimmer: bright dashes sliding across the surface, wider close up
    for (let i = 0; i < 90; i++) {
      const y = HZ + 50 + ((i * 97.13) % (H - HZ)), s = pxu(y);
      const x = v.x0 + ((i * 211.7 + t * (8 + (i % 5) * 3) * s) % (v.x1 - v.x0 + 100)) - 50;
      const a = 0.5 + 0.5 * Math.sin(t * (0.8 + (i % 7) * 0.2) + i);
      g.fillStyle = `rgba(255,252,240,${0.55 * a})`;
      g.fillRect(x, y, (6 + (i % 4) * 5) * s, Math.max(0.6, 0.9 * s));
    }
    // fish: dark little shapes under the surface
    for (const f of fish) {
      const [x, y, a] = creekAt(f.u), s = pxu(y);
      const off = f.side * creekW * 0.25 * s * flat(y), wig = Math.sin(t * (8 + f.dart * 16) + f.ph) * 0.25;
      g.save(); g.translate(x, y + off); g.rotate(a + (f.du < 0 && f.dart > 0.1 ? Math.PI : 0)); g.scale(s, s * Math.max(0.4, flat(y) * 2));
      g.globalAlpha = 0.45; g.fillStyle = f.col;
      g.fill(ell(0, 0, 6, 1.8)); g.beginPath(); g.moveTo(-5, 0); g.lineTo(-9, -2 + wig * 4); g.lineTo(-9, 2 + wig * 4); g.fill();
      g.restore();
    }
    // rings
    for (const r of rings) {
      const s = pxu(r.y), k = r.age / 1.6;
      g.strokeStyle = `rgba(255,255,250,${0.7 * (1 - k)})`; g.lineWidth = Math.max(0.6, 1.2 * s);
      g.beginPath(); g.ellipse(r.x, r.y, (4 + k * 30) * s, (4 + k * 30) * s * flat(r.y) * 1.3, 0, 0, TAU); g.stroke();
      if (k > 0.25) { g.strokeStyle = `rgba(120,140,160,${0.3 * (1 - k)})`; g.beginPath(); g.ellipse(r.x, r.y, (k * 18) * s, (k * 18) * s * flat(r.y) * 1.3, 0, 0, TAU); g.stroke(); }
    }
    g.restore();
    // hoppers: tiny specks with a shadow on the sand
    for (const h of hoppers) {
      const a = 1 - h.age / 1.4;
      g.fillStyle = `rgba(90,70,90,${0.3 * a})`; g.fill(ell(h.x + h.h * 0.4, h.y0, 1.6 * h.s, 0.6 * h.s));
      g.fillStyle = `rgba(110,90,80,${a})`; g.fill(ell(h.x, h.y0 - h.h, 1.3 * h.s, 0.8 * h.s));
    }
  },
});
})();
