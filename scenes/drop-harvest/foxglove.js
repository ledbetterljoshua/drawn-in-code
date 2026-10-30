/* foxglove.js — the left of the picture: a foxglove spire on the near shore, its bells lit pink
   through from behind, a bumblebee sheltering in the lowest bell (bees really do sit out rain in
   flowers), a tall blade of grass leaning over the water, and an orb web strung between them,
   beaded with rain that glows gold against the rift.

   Hover the bee's bell: the bee backs out, buzzes the wet off its wings, and climbs back in.
   Hover the spire: it sways and the bells shed their water.
   Hover the web: it bounces like a trampoline, the beads shiver and a few fall; the spider runs to
   the hub and holds on. Gusts billow the web.

   blade z15.6 · web z15.8 · foxglove z15.9 · bee z16 (they stand on the near shore, in front of the
   water; the shore hides their feet) */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, ink, st, P, layer, onLayout } = Drawn;
  const { C, SUN, LINE } = DH;

  // ------------------------------------------------------------ the foxglove
  const FOX = { x: 196, base: 1060, top: 70 };
  const sway = DH.spring(30, 2.2);
  const stemAt = (u, t) => {
    // u 0 (foot) → 1 (tip); the stem bows right, the top sways
    const w = Drawn.wind(t, FOX.x);
    const b = (w - 0.6) * 14 + sway.x * 30 + Math.sin(t * 0.6) * 3;
    return [FOX.x + Math.sin(u * 1.4) * 24 + u * u * b, lerp(FOX.base, FOX.top, u)];
  };
  const bells = [];
  onLayout(() => {
    bells.length = 0;
    const r = rng(61);
    // biggest at the bottom, buds at the top; they hang off the sun side of the stem
    let u = 0.42;
    for (let i = 0; i < 11; i++) {
      u += i ? 0.036 + r() * 0.03 - i * 0.0015 : 0;
      const s = lerp(1.08, 0.3, (i / 10) ** 0.8) * (0.88 + r() * 0.24);
      bells.push({ u, s, side: [1, 1, -1, 1, -1, 1, 1, -1, 1, -1, 1][i], ph: r() * TAU, wet: r(), a: 0, v: 0, bud: i >= 8, droop: i === 2 ? 0.4 : (r() - 0.5) * 0.4 });
    }
  });
  function bellPath(s) {
    // a tube hanging from its stalk at (0, 0), mouth opening down and out
    const L = 78 * s, W = 30 * s;
    const p = new Path2D();
    p.moveTo(-4 * s, 0);
    p.bezierCurveTo(-W * 0.55, L * 0.25, -W * 0.85, L * 0.7, -W * 0.95, L);
    p.quadraticCurveTo(-W * 0.4, L * 1.12, W * 0.1, L * 1.02);
    p.quadraticCurveTo(W * 0.7, L * 1.18, W * 1.05, L * 0.98);
    p.bezierCurveTo(W * 0.9, L * 0.62, W * 0.55, L * 0.22, 4 * s, 0);
    p.closePath();
    return p;
  }
  function drawBell(g, b, x, y, t) {
    if (b.bud) {
      // a closed bud: a plump teardrop, green flushing pink
      g.save(); g.translate(x, y); g.rotate(b.side * 0.3 + b.a);
      const bp = new Path2D(); bp.moveTo(0, 0); bp.bezierCurveTo(-12 * b.s, 10 * b.s, -10 * b.s, 46 * b.s, 0, 52 * b.s); bp.bezierCurveTo(10 * b.s, 46 * b.s, 12 * b.s, 10 * b.s, 0, 0);
      ink(g, bp, '#8a5a6a', 1.8);
      g.fillStyle = grad(g, 0, 0, 0, 52 * b.s, ['#5a7a46', '#a8607e']); g.fill(bp);
      DH.crescent(g, bp, 'rgba(255,214,190,0.8)', -2, 0);
      g.restore();
      return;
    }
    g.save(); g.translate(x, y); g.rotate(b.side * (0.5 + b.droop) + b.a - 0.08); g.scale(b.side, 1);
    const s2 = b.s, L = 78 * s2, W = 30 * s2;
    const P0 = bellPath(s2);
    g.lineWidth = 2.4; g.strokeStyle = LINE; g.stroke(P0);
    // a tube lit through from behind: deep rose on the shaded flank, hot pink toward the sun side
    g.fillStyle = grad(g, -W, 0, W, 0, [[0, '#6a2a5a'], [0.45, '#b04a7e'], [0.85, '#e47aa6'], [1, '#ffb0cc']]);
    g.fill(P0);
    g.save(); g.clip(P0);
    g.fillStyle = grad(g, 0, 0, 0, L * 0.5, [[0, 'rgba(60,30,50,0.6)'], [1, 'rgba(60,30,50,0)']]); g.fillRect(-W * 1.2, 0, W * 2.4, L * 0.5);
    // veins along the tube
    g.lineWidth = 0.7; g.strokeStyle = 'rgba(255,190,215,0.35)';
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 2 * s2, 4); g.quadraticCurveTo(i * 9 * s2, 40 * s2, i * 14 * s2, 80 * s2); g.stroke(); }
    g.restore();
    // the open mouth, seen at an angle: a dark throat freckled with spots, a pale long lower lip
    const mx = W * 0.05, my = L * 1.02, mrx = W * 0.98, mry = W * 0.34;
    const mouth = ell(mx, my, mrx, mry, undefined, 0.12);
    ink(g, mouth, '#4a1838', 1.6);
    g.save(); g.clip(mouth);
    g.fillStyle = '#f6d6e2'; g.fill(ell(mx + W * 0.1, my + mry * 0.55, mrx * 0.9, mry * 0.6, undefined, 0.12));
    const r = rng(b.ph * 1000 | 0);
    for (let i = 0; i < 8; i++) { g.fillStyle = '#7a1a4a'; g.fill(ell(mx + (r() - 0.5) * mrx * 1.4, my + mry * (0.2 + r() * 0.6), 1.3 * s2 + 0.5, 1 * s2 + 0.4)); }
    g.restore();
    DH.crescent(g, P0, 'rgba(255,224,210,0.9)', -2.6, 0);
    // a drop hanging from the lip
    if (b.wet > 0.35) DH.glassDrop(g, mx - mrx * 0.6, my + mry + 2 + b.wet * 2, 2 + b.wet * 2 * s2, { sy: 1.15 });
    g.restore();
  }

  layer({
    id: 'foxglove', z: 15.9,
    hit(x, y, t) {
      for (let u = 0.35; u < 1; u += 0.05) { const [sx, sy] = stemAt(u, st.t); if (Math.abs(y - sy) < 40 && x > sx - 30 && x < sx + 70) return true; }
      return false;
    },
    onEnter() { sway.v += (P.vx > 0 ? 1 : -1) * 0.8; for (const b of bells) b.v += (Math.random() - 0.5) * 1.5; },
    update(dt, t, L) {
      sway.step(dt);
      for (const b of bells) {
        const w = Drawn.wind(t, FOX.x);
        b.v += (-(b.a - (w - 0.6) * 0.12 - Math.sin(t * 1.1 + b.ph) * 0.03) * 22 - b.v * 2.4) * dt;
        b.a += b.v * dt;
        b.wet += dt * 0.05;
        if (b.wet > 1 || (Math.abs(b.v) > 0.6 && b.wet > 0.4)) {
          const [sx, sy] = stemAt(b.u, t);
          DH.spawn({ kind: 'drip', x: sx + b.side * 30 * b.s, y: sy + 82 * b.s, vx: b.v * 20, vy: 20, r: 2, life: 2, g: 1400, z: 'mid', land: 1000 + Math.random() * 60 });
          b.wet = 0;
        }
      }
    },
    draw(g, t) {
      // the stem, hairy, in shade with a rim of sun on its right
      const pts = [];
      for (let u = 0; u <= 1.001; u += 0.1) pts.push(stemAt(u, t));
      const stem = curve(pts, false);
      g.lineCap = 'round';
      g.lineWidth = 12; g.strokeStyle = LINE; g.stroke(stem);
      g.lineWidth = 8; g.strokeStyle = '#3e5a3a'; g.stroke(stem);
      g.lineWidth = 2; g.strokeStyle = 'rgba(255,220,140,0.85)'; g.save(); g.translate(3, 0); g.stroke(stem); g.restore();
      // fine hairs catching the light
      g.lineWidth = 0.7; g.strokeStyle = 'rgba(255,230,170,0.55)';
      for (let u = 0.02; u < 0.98; u += 0.018) { const [x, y] = stemAt(u, t); g.beginPath(); g.moveTo(x + 4, y); g.lineTo(x + 9, y - 3); g.stroke(); }
      // leaves at the foot, broad and downy
      for (const [u, s, d] of [[0.1, 1, 1], [0.16, 0.8, -1], [0.24, 0.6, 1]]) {
        const [x, y] = stemAt(u, t);
        const lf = new Path2D(); lf.moveTo(x, y); lf.quadraticCurveTo(x + d * 60 * s, y - 50 * s, x + d * 130 * s, y - 10 * s); lf.quadraticCurveTo(x + d * 60 * s, y + 10 * s, x, y); lf.closePath();
        ink(g, lf, '#3a5434', 2.4);
        DH.crescent(g, lf, 'rgba(255,214,140,0.7)', -3 * d, 3);
        g.lineWidth = 1; g.strokeStyle = 'rgba(200,220,160,0.5)'; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + d * 60 * s, y - 30 * s, x + d * 120 * s, y - 10 * s); g.stroke();
      }
      // bells, top buds first
      for (let i = bells.length - 1; i >= 0; i--) {
        const b = bells[i], [x, y] = stemAt(b.u, t);
        g.lineWidth = 2.2; g.strokeStyle = '#3e5a3a'; g.beginPath(); g.moveTo(x, y); g.lineTo(x + b.side * 8, y + 4); g.stroke();
        const br = new Path2D(); br.moveTo(x, y + 2); br.quadraticCurveTo(x - b.side * 10 * b.s, y + 4, x - b.side * 16 * b.s, y + 14 * b.s); br.quadraticCurveTo(x - b.side * 4, y + 10 * b.s, x, y + 2); br.closePath();
        ink(g, br, '#3e5a3a', 1.2);
        if (i === 0) continue; // the bee's bell is drawn over the bee
        drawBell(g, b, x + b.side * 8, y + 4, t);
      }
      // the tip: a cluster of tight green buds
      for (let i = 0; i < 5; i++) { const [x, y] = stemAt(0.93 + i * 0.016, t); ink(g, ell(x + (i % 2 ? 4 : -3), y, 4 - i * 0.5, 6 - i * 0.6), '#6a8a4a', 1.4); }
    },
  });

  // ------------------------------------------------------------ the bee in the bottom bell
  const bee = { out: 0, buzz: 0, blink: Drawn.blinker(), act: DH.actor(17, ['peek'], [10, 16], 3) };
  layer({
    id: 'bee', z: 16,
    hit(x, y) { const [sx, sy] = stemAt(bells[0] ? bells[0].u : 0.42, st.t); return Math.hypot(x - sx - 30, y - sy - 60) < 46; },
    update(dt, t, L) {
      bee.act.step(dt);
      bee.out = ease(bee.out, L.hovered ? 1 : bee.act.name ? DH.bump(bee.act.u) * 0.5 : 0, 2.6, dt);
      bee.buzz = L.hovered && L.since > 0.6 && L.since < 2.6 ? 1 : 0;
      if (bee.buzz && Math.random() < 0.3) { const [sx, sy] = stemAt(bells[0].u, t); DH.spawn({ kind: 'spray', x: sx + 30, y: sy + 92, vx: (Math.random() - 0.5) * 140, vy: -30 - Math.random() * 60, r: 0.8, life: 0.4, g: 800, z: 'mid' }); }
    },
    draw(g, t) {
      const b = bells[0];
      if (!b) return;
      const [sx, sy] = stemAt(b.u, t);
      const bx = sx + 8, by = sy + 4;
      // the bee sits in the mouth of the bell, face out; backing out shows more of it
      g.save(); g.translate(bx, by); g.rotate(b.side * 0.45 + b.a - 0.1);
      const k = bee.out, mx = 6 * b.s, my = 70 * b.s + k * 26;
      g.save(); g.translate(mx, my); g.rotate(-0.2);
      // wings, a blur when buzzing
      const flap = bee.buzz ? Math.sin(t * 90) * 0.5 : 0;
      for (const s of [-1, 1]) {
        g.save(); g.rotate(s * (0.5 + flap) - 0.2);
        const wg = ell(s * 6, -8, 9, 4.5, undefined, s * 0.6);
        g.fillStyle = bee.buzz ? 'rgba(230,236,255,0.35)' : 'rgba(220,226,250,0.6)'; g.fill(wg);
        g.lineWidth = 0.8; g.strokeStyle = 'rgba(37,24,40,0.6)'; g.stroke(wg);
        g.restore();
      }
      // fuzzy body: black and gold bands, a hundred short hairs
      const body = ell(0, 0, 12, 10);
      ink(g, body, '#2a2028', 1.6);
      g.save(); g.clip(body);
      g.fillStyle = '#f2b83a'; g.fillRect(-14, -10, 28, 7);
      g.fillStyle = '#f6e6c0'; g.fillRect(-14, 5, 28, 6);
      g.restore();
      const r = rng(5);
      g.lineWidth = 0.8;
      for (let i = 0; i < 60; i++) { const a = r() * TAU, rr = 10 + r() * 2.5; g.strokeStyle = a > Math.PI ? 'rgba(255,214,120,0.8)' : 'rgba(40,30,40,0.8)'; g.beginPath(); g.moveTo(Math.cos(a) * rr * 1.1, Math.sin(a) * rr * 0.9); g.lineTo(Math.cos(a) * (rr + 2) * 1.1, Math.sin(a) * (rr + 2) * 0.9); g.stroke(); }
      // the face
      ink(g, ell(1, 8, 7, 6), '#2a2028', 1.3);
      const o = bee.blink(t);
      g.fillStyle = '#0e0a10'; g.fill(ell(-2.5, 8, 2.4, 2.8 * o)); g.fill(ell(4.5, 8, 2.4, 2.8 * o));
      g.fillStyle = '#fff'; g.fill(circ(-1.8, 7, 0.8)); g.fill(circ(5.2, 7, 0.8));
      g.lineWidth = 1.1; g.strokeStyle = '#2a2028';
      for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 2 + 1, 3); g.quadraticCurveTo(s * 6 + 1, -2, s * 8 + 1, 0); g.stroke(); }
      g.restore();
      g.restore();
      drawBell(g, b, bx, by, t);
    },
  });

  // ------------------------------------------------------------ the tall blade
  const BLADE = { x: 560, base: 1240, top: 150 };
  const bladePts = (t) => {
    const w = Drawn.wind(t, BLADE.x);
    const b = (w - 0.6) * 10 + web.bounce.x * 4;
    // up out of the water, then arching over to the left above the web
    const p0 = [BLADE.x, BLADE.base], p1 = [BLADE.x + 30, 120], p2 = [300 + b * 2, 230 + b];
    const pts = [];
    for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([(1 - u) ** 2 * p0[0] + 2 * u * (1 - u) * p1[0] + u * u * p2[0], (1 - u) ** 2 * p0[1] + 2 * u * (1 - u) * p1[1] + u * u * p2[1]]); }
    return pts;
  };
  const web = { bounce: DH.spring(50, 2.6), beads: [], spider: { x: 0, y: 0, hold: 0 }, billow: 0 };
  layer({
    id: 'blade', z: 15.6,
    draw(g, t) {
      const pts = bladePts(t), L = [], R = [];
      for (let i = 0; i < pts.length; i++) {
        // tapering, with a pinch where the blade twists to show its paler back
        const u = i / (pts.length - 1), w = 16 * (1 - u * 0.88) * (0.35 + 0.65 * Math.min(1, Math.abs(u - 0.58) * 6));
        const [ax, ay] = pts[Math.max(0, i - 1)], [bx2, by2] = pts[Math.min(pts.length - 1, i + 1)], l = Math.hypot(bx2 - ax, by2 - ay) || 1;
        const nx = -(by2 - ay) / l, ny = (bx2 - ax) / l;
        L.push([pts[i][0] - nx * w, pts[i][1] - ny * w]); R.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
      }
      const p = curve([...L, ...R.reverse()]);
      g.lineWidth = 2.6; g.strokeStyle = LINE; g.stroke(p);
      g.fillStyle = grad(g, pts[0][0], pts[0][1], pts[10][0], pts[10][1], [[0, '#2a4030'], [0.55, '#46663a'], [0.6, '#7a9454'], [1, '#6a8a4a']]); g.fill(p);
      g.save(); g.clip(p);
      g.lineWidth = 1; g.strokeStyle = 'rgba(200,230,150,0.35)';
      for (const off of [-0.4, 0, 0.4]) { g.beginPath(); L.forEach(([x, y], i) => { const [rx2, ry2] = R[R.length - 1 - i]; const k = 0.5 + off; (i ? g.lineTo : g.moveTo).call(g, lerp(x, rx2, k), lerp(y, ry2, k)); }); g.stroke(); }
      g.restore();
      DH.crescent(g, p, 'rgba(255,224,140,0.9)', -3, 0);
      // beads running down its midrib
      for (let i = 3; i < 10; i++) { const [x, y] = pts[i]; DH.glassDrop(g, x, y + 14, 2.2 + (i % 3), { sy: 1.15 }); }
    },
  });

  // ------------------------------------------------------------ the web
  const HUB = [395, 395];
  onLayout(() => {
    web.beads.length = 0;
    const r = rng(73);
    for (let k = 0; k < 120; k++) web.beads.push({ spoke: Math.floor(r() * 22), ring: 0.18 + r() * 0.8, r: 1 + r() * 2.2, a: 0, v: 0, on: true, ph: r() * TAU });
  });
  // the frame: anchor points on the stem and the blade, a hub, spokes and a spiral
  function webGeom(t) {
    const fox = (u) => stemAt(u, t), bp = bladePts(t);
    const bx = (i) => bp[i];
    const bil = web.billow + web.bounce.x;
    const anchors = [fox(0.86), bx(7), bx(4), fox(0.5)]; // TL, TR, BR, BL
    const hub = [HUB[0] + bil * 3, HUB[1] + bil * 6];
    return { anchors, hub };
  }
  function spokeEnd(geo, i, n) {
    // the spoke runs from the hub to the frame quad's edge
    const a = (i / n) * TAU, [hx, hy] = geo.hub;
    const dx = Math.cos(a), dy = Math.sin(a);
    // intersect with the quad (anchors in order)
    let best = 220;
    const A = geo.anchors;
    for (let k = 0; k < 4; k++) {
      const [x1, y1] = A[k], [x2, y2] = A[(k + 1) % 4];
      const ex = x2 - x1, ey = y2 - y1, den = dx * ey - dy * ex;
      if (Math.abs(den) < 1e-6) continue;
      const s = ((x1 - hx) * ey - (y1 - hy) * ex) / den, u = ((x1 - hx) * dy - (y1 - hy) * dx) / den;
      if (s > 0 && u >= 0 && u <= 1) best = Math.min(best, s);
    }
    return best;
  }
  layer({
    id: 'web', z: 15.8,
    hit(x, y) { const d = Math.hypot(x - HUB[0], y - HUB[1]); return d < 150; },
    onEnter() { web.bounce.v += 5; web.spider.hold = 1; },
    update(dt, t, L) {
      web.bounce.step(dt);
      web.billow = ease(web.billow, (Drawn.wind(t, 400) - 0.6) * 1.4, 1.5, dt);
      if (L.hovered) web.bounce.v += Math.sin(t * 7) * dt * 6;
      web.spider.hold = ease(web.spider.hold, L.hovered ? 1 : 0, 2, dt);
      for (const b of web.beads) {
        b.v += (-(b.a) * 120 - b.v * 4 + web.bounce.v * 0.4) * dt;
        b.a += b.v * dt;
        if (b.on && Math.abs(web.bounce.v) > 4 && Math.random() < 0.01) {
          b.on = false; b.back = 3 + Math.random() * 6;
          const geo = webGeom(t), n = 22, a = (b.spoke / n) * TAU, len = spokeEnd(geo, b.spoke, n) * b.ring;
          DH.spawn({ kind: 'drip', x: geo.hub[0] + Math.cos(a) * len, y: geo.hub[1] + Math.sin(a) * len, vx: 0, vy: 0, r: b.r, life: 2, g: 1400, z: 'mid', land: 800 + Math.random() * 200 });
        }
        if (!b.on && (b.back -= dt) <= 0) b.on = true;
      }
    },
    draw(g, t) {
      const geo = webGeom(t), n = 22, [hx, hy] = geo.hub;
      const near = 0.9;
      g.save();
      g.lineCap = 'round';
      // frame threads
      g.lineWidth = 0.9; g.strokeStyle = 'rgba(255,236,200,0.55)';
      // frame threads sag between their anchors under the weight of the beads
      g.beginPath();
      for (let i = 0; i < 4; i++) {
        const [x1, y1] = geo.anchors[i], [x2, y2] = geo.anchors[(i + 1) % 4];
        if (i === 0) g.moveTo(x1, y1);
        g.quadraticCurveTo((x1 + x2) / 2 + (i === 1 ? -14 : 0), (y1 + y2) / 2 + [10, 6, 26, 8][i], x2, y2);
      }
      g.stroke();
      // spokes
      const ends = [];
      for (let i = 0; i < n; i++) { const a = (i / n) * TAU, L = spokeEnd(geo, i, n); ends.push(L); g.beginPath(); g.moveTo(hx, hy); g.lineTo(hx + Math.cos(a) * L, hy + Math.sin(a) * L); g.stroke(); }
      // the capture spiral: sagging between spokes, heavier where beaded
      g.lineWidth = 0.7; g.strokeStyle = 'rgba(255,230,190,0.5)';
      // the capture spiral: sagging between spokes, a few strands broken and hanging loose
      let ri = 0;
      for (let ring = 0.2; ring < 0.97; ring += 0.045, ri++) {
        g.beginPath();
        let pen = false;
        for (let i = 0; i <= n; i++) {
          const k = i % n, a = (k / n) * TAU, L = ends[k] * (ring + (i / n) * 0.045);
          const x = hx + Math.cos(a) * L, y = hy + Math.sin(a) * L + 2 * ring;
          const broken = Drawn.hash(ri * 31 + k * 7) < 0.07;
          if (!pen || broken) {
            if (broken && pen) { g.lineTo(x - Math.cos(a) * 2, y + 9); }
            g.moveTo(x, y); pen = true; continue;
          }
          const pa = ((k - 0.5) / n) * TAU, pl = ends[k] * ring * (0.93 - Drawn.hash(ri + k) * 0.06);
          g.quadraticCurveTo(hx + Math.cos(pa) * pl, hy + Math.sin(pa) * pl + (6 + 8 * Math.max(0, Math.sin(pa))) * ring, x, y);
        }
        g.stroke();
      }
      g.restore();
      // the beads: gold glass on every thread
      for (const b of web.beads) {
        if (!b.on) continue;
        const a = (b.spoke / n) * TAU, L = ends[b.spoke] * b.ring;
        const x = hx + Math.cos(a) * L, y = hy + Math.sin(a) * L + b.a * 2;
        DH.glassDrop(g, x, y, b.r, { bright: 1, sy: 1 - b.a * 0.1 });
      }
      // the spider at the hub, a round little orb-weaver, legs splayed on the spokes
      const sx = hx, sy = hy - 2;
      g.lineWidth = 1.2; g.strokeStyle = LINE;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU + 0.2, k = 1 - web.spider.hold * 0.25, wig = Math.sin(t * 3 + i) * 0.04;
        g.beginPath(); g.moveTo(sx, sy); g.lineTo(sx + Math.cos(a + wig) * 9 * k, sy + Math.sin(a + wig) * 9 * k - 2); g.lineTo(sx + Math.cos(a + wig) * 15 * k, sy + Math.sin(a + wig) * 15 * k + 1); g.stroke();
      }
      const ab = ell(sx, sy + 4, 6.5, 7.5);
      ink(g, ab, '#c8843e', 1.4);
      g.fillStyle = '#f6e2b0'; g.fill(poly([[sx - 2.5, sy + 1], [sx + 2.5, sy + 1], [sx + 1.5, sy + 8], [sx - 1.5, sy + 8]]));
      DH.crescent(g, ab, 'rgba(255,220,150,0.8)', -1.5, 1);
      ink(g, circ(sx, sy - 3, 3.6), '#8a5a34', 1.2);
      g.fillStyle = LINE; g.fill(circ(sx - 1.3, sy - 3.4, 0.9)); g.fill(circ(sx + 1.3, sy - 3.4, 0.9));
    },
  });
})();
