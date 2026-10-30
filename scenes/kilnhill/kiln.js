/* kiln.js — the bottle kiln, third night of the firing. The focal point of the picture.
   A brick bottle banded with iron, three firemouths round its foot, a bricked-up wicket whose
   seams glow, a spy-hole, soot climbing to a flaming lip. Brick courses follow the viewpoint:
   they bow upward above eye level and the bricks narrow toward the edges as the bottle turns away.
   z 29  woodpile (still): split logs stacked by the left firemouth
   z 30  kiln (still): the brickwork, bands, arches, soot
   z 31  fires (live): coals and flames breathing in the firemouths; the wicket seams glow.
         Hover a side firemouth: it roars up and spits sparks
   z 32  lipflame (live): flames licking off the lip of the bottle
   z 34  stoker (live): shovels coal on a slow rhythm. Hover: throws a scoop of salt for the glaze —
         the fire flashes green, a white plume of vapour bursts from the chimney, far towns answer
   z 35  watcher (live): an old mole on a crate at the spy-hole. Hover: pulls the bung, the hole
         blazes, and inside the cones bend one after another; linger and they nod: "ready soon"
   z 36  pup (live): toasting a mushroom on a stick at the left firemouth. Hover: it catches fire,
         the pup blows on it frantically. Idle: the pup swings its feet */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, rect, poly, curve, grad, radial, st, P, layer } = Drawn;
  const K = window.Kiln, M = K.M;
  const cx = K.KX, base = K.KBASE;
  const F = K.lathe(cx, [[64, 236], [58, 246], [52, 258], [52, 290], [56, 330], [70, 380], [96, 440], [130, 510], [158, 590], [176, 670], [184, 750], [187, 820], [189, base]]);
  K.kilnForm = F;
  // a point on the kiln's skin: u is arc length from the centre line (+ right), v height above y0
  const onK = (thc, u, y) => {
    const w = F.halfW(y), th = thc - u / w;
    return [cx + w * Math.cos(th), y + K.rimRy(y, w) * Math.sin(th)];
  };
  const archPts = (thc, w, h, y0, n = 14) => {
    // rectangle sides and a round top, wrapped onto the bottle
    const pts = [], r = w / 2, spring = h - r;
    pts.push(onK(thc, -r, y0));
    pts.push(onK(thc, -r, y0 - spring));
    for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; pts.push(onK(thc, Math.cos(a) * r, y0 - spring + Math.sin(a) * r)); }
    pts.push(onK(thc, r, y0));
    return pts;
  };
  const archPath = (thc, w, h, y0) => poly(archPts(thc, w, h, y0));
  // firemouths: centre, left, right (angles on the bottle)
  const mouths = [
    { id: 'mouthC', th: Math.PI / 2, w: 64, h: 62, L: K.L.mouth },
    { id: 'mouthL', th: Math.PI / 2 + 0.78, w: 54, h: 52, L: K.L.mouthL },
    { id: 'mouthR', th: Math.PI / 2 - 0.78, w: 54, h: 52, L: K.L.mouthR },
  ];
  for (const m of mouths) { m.y0 = base + K.rimRy(base, 189) * Math.sin(m.th) - 2; m.path = archPath(m.th, m.w, m.h, m.y0); m.ring = archPath(m.th, m.w + 18, m.h + 10, m.y0); m.c = onK(m.th, 0, m.y0 - m.h * 0.4); }
  K.mouths = mouths;
  // The fires sit inside the kiln wall, so they barely light the wall they're set in. What lights
  // the brickwork is the glare bouncing up off the yard (strong at the foot, gone by the shoulder),
  // a hot halo round each arch, and the lip flame catching only the topmost courses.
  const skipK = new Set([K.L.mouth, K.L.mouthL, K.L.mouthR, K.L.flame]);
  const tone = (v) => 1 - Math.exp(-v * 1.55);
  function kilnLit(albedo, x, y, n) {
    const a = K.rgb(albedo);
    let L = [0, 0, 0];
    for (const l of K.lights) {
      if (skipK.has(l)) continue;
      const dx = l.x - x, dy = l.y - y, d = Math.hypot(dx, dy);
      if (d > l.r) continue;
      let f = (1 - d / l.r) ** 2 * l.k;
      const d3 = Math.hypot(dx, dy, l.z);
      f *= 0.18 + 0.82 * Math.max(0, (n[0] * dx + n[1] * dy + n[2] * l.z) / d3);
      L[0] += l.col[0] * f; L[1] += l.col[1] * f; L[2] += l.col[2] * f;
    }
    const bounce = Math.exp(-(base - y) / 95) * (0.5 + 0.5 * Math.max(0, n[2])) * (0.35 + 0.65 * Math.exp(-(((x - cx) / 170) ** 2)));
    let arch = 0;
    for (const m of mouths) { const d = Math.hypot((x - m.c[0]) / 1.1, y - m.c[1]); arch += Math.max(0, 1 - d / (m.w * 1.1)) ** 2 * (m === mouths[0] ? 1.6 : 1.1); }
    const lip = Math.max(0, 1 - (y - 236) / 50) ** 2 * 1.2;
    const add = bounce * 1.5 + arch + lip;
    L[0] += add * 1.5; L[1] += add * 0.62; L[2] += add * 0.22;
    return [tone(a[0] * (K.AMB[0] + L[0])), tone(a[1] * (K.AMB[1] + L[1])), tone(a[2] * (K.AMB[2] + L[2]))];
  }
  const wicket = { th: Math.PI / 2 + 0.42, w: 62, h: 150 };
  wicket.y0 = base + K.rimRy(base, 189) * Math.sin(wicket.th) - 2;
  // the wicket is to the left of centre; move it up above the left firemouth line so they don't touch
  const wick = archPath(wicket.th, wicket.w, wicket.h, wicket.y0 - 70);
  const wickRing = archPath(wicket.th, wicket.w + 16, wicket.h + 8, wicket.y0 - 70);
  const spy = { th: 0.36, y: 794 };
  spy.p = onK(spy.th, 0, spy.y);
  const bands = [404, 470, 548, 630, 712, 790];

  // ------------------------------------------------------------------ woodpile
  layer({
    id: 'woodpile', z: 29, still: true,
    draw(g) {
      const r = rng(81);
      // logs seen end-on, stacked in a rough pyramid, lit from the firemouth on their right
      const rows = [[244, 870, 6], [254, 848, 5], [266, 827, 4], [282, 808, 2]];
      g.fillStyle = 'rgba(8,4,10,0.5)'; g.fill(ell(310, 874, 110, 10));
      for (const [x0, y, n] of rows) {
        for (let i = 0; i < n; i++) {
          const x = x0 + i * 25 + (r() - 0.5) * 4, rr = 10.5 + r() * 2.5, yy = y + (r() - 0.5) * 3;
          const end = ell(x, yy, rr, rr * 0.95);
          const bark = K.litc(M.woodDark, x + 6, yy, [0.6, 0, 0.8]);
          g.fillStyle = bark; g.fill(ell(x - 4, yy, rr, rr * 0.95));
          g.fillStyle = K.litc('#c89a68', x, yy, [0.5, 0, 0.86]); g.fill(end);
          // growth rings and a split
          g.lineWidth = 0.7; g.strokeStyle = K.css(K.lit('#7a5434', x, yy), 0.9);
          for (let k = 1; k < 4; k++) g.stroke(ell(x + 0.8 * k, yy + 0.3 * k, rr * (1 - k * 0.24), rr * 0.95 * (1 - k * 0.24)));
          if (r() < 0.5) { g.beginPath(); g.moveTo(x, yy); g.lineTo(x + rr * 0.8, yy - rr * 0.5); g.stroke(); }
          g.lineWidth = 1.5; g.strokeStyle = K.inkAt(x, yy); g.stroke(end);
          g.beginPath(); g.ellipse(x - 4, yy, rr, rr * 0.95, 0, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
        }
      }
      // a chopping block with the axe left in it
      const bx = 196, by = 880;
      g.fillStyle = K.litc(M.woodDark, bx, by - 10); g.fill(rect(bx - 16, by - 22, 32, 22));
      g.fillStyle = K.litc('#b08458', bx, by - 22, [0.3, -1, 0.4]); g.fill(ell(bx, by - 22, 16, 4));
      g.lineWidth = 1.6; g.strokeStyle = K.inkAt(bx, by); g.strokeRect(bx - 16, by - 22, 32, 22); g.stroke(ell(bx, by - 22, 16, 4));
      g.fillStyle = K.litc(M.iron, bx, by - 28); g.fill(poly([[bx - 4, by - 22], [bx + 6, by - 22], [bx + 9, by - 33], [bx - 6, by - 32]]));
      Drawn.tube(g, Drawn.seg(bx + 1, by - 30, bx + 22, by - 64), K.litc(M.woodPale, bx + 10, by - 50), 3.5, 1.3);
    },
  });

  // ------------------------------------------------------------------ the kiln body
  layer({
    id: 'kiln', z: 30, still: true,
    draw(g) {
      const body = F.path;
      // contact shadow on the yard
      g.fillStyle = 'rgba(10,4,8,0.55)'; g.fill(ell(cx, base + 2, 205, 16));
      // mortar shows between the bricks
      g.fillStyle = grad(g, 0, 236, 0, base, [[0, K.css(kilnLit(M.mortar, cx, 300, [0, 0, 1]))], [0.7, K.css(kilnLit(M.mortar, cx, 700, [0, 0, 1]))], [1, K.css(kilnLit(M.mortar, cx, 850, [0, 0, 1]))]]); g.fill(body);
      g.save(); g.clip(body);
      const r = rng(1234);
      const ch = 8.6;
      let row = 0;
      for (let y = 250; y < base + 6; y += ch, row++) {
        const y1 = y + ch;
        const w0 = F.halfW(y), w1 = F.halfW(y1);
        const ry0 = K.rimRy(y, w0), ry1 = K.rimRy(y1, w1);
        const wm = (w0 + w1) / 2, dw = (w1 - w0) / ch;
        const len = 18 + r() * 2, dth = len / wm;
        let th = -0.02 - (row % 2) * dth * 0.5 - r() * 0.05;
        while (th < Math.PI + 0.04) {
          const tb = th + dth * (0.82 + r() * 0.3);
          const a = Math.max(th, -0.02), b = Math.min(tb, Math.PI + 0.02);
          const P0 = [cx + w0 * Math.cos(a), y + ry0 * Math.sin(a)], P1 = [cx + w0 * Math.cos(b), y + ry0 * Math.sin(b)];
          const P2 = [cx + w1 * Math.cos(b), y1 + ry1 * Math.sin(b)], P3 = [cx + w1 * Math.cos(a), y1 + ry1 * Math.sin(a)];
          const tm = (a + b) / 2, nx = Math.cos(tm), nz = Math.sin(tm), ny = -dw;
          const nn = Math.hypot(nx, ny, nz);
          const mx = (P0[0] + P2[0]) / 2, my = (P0[1] + P2[1]) / 2;
          // brick colour: a mix of reds, a few burnt dark ones, soot climbing toward the top
          const pick = r();
          let alb = pick < 0.45 ? M.brick : pick < 0.75 ? M.brick2 : pick < 0.9 ? M.brick3 : M.brickBurnt;
          const soot = clamp((520 - y) / 300, 0, 1) * 0.75 + clamp((y - 800) / 60, 0, 1) * 0.15;
          alb = K.mix(alb, M.soot, clamp(soot + (r() - 0.5) * 0.2, 0, 0.92));
          const c = kilnLit(alb, mx, my, [nx / nn, ny / nn, nz / nn]);
          // inset slightly so the mortar reads
          const ins = (p, q, k) => [lerp(p[0], q[0], k), lerp(p[1], q[1], k)];
          const Q = [ins(P0, P2, 0.06), ins(P1, P3, 0.06), ins(P2, P0, 0.06), ins(P3, P1, 0.06)];
          g.fillStyle = K.css(c); g.fill(poly(Q));
          // a lighter top edge on bricks that face a fire
          if (r() < 0.55) { g.fillStyle = K.css(K.mix(c, [1, 0.8, 0.6], 0.12)); g.fill(poly([Q[0], Q[1], ins(Q[1], Q[2], 0.3), ins(Q[0], Q[3], 0.3)])); }
          // the odd chipped corner
          if (r() < 0.05) { g.fillStyle = K.css(K.mul(c, 0.5)); g.fill(poly([Q[1], ins(Q[1], Q[0], 0.4), ins(Q[1], Q[2], 0.6)])); }
          th = tb;
        }
      }
      // soot streaks running down from the lip
      for (let i = 0; i < 14; i++) {
        const th = 0.3 + r() * 2.5, y0 = 250, y1 = 380 + r() * 220;
        const pts = []; for (let y = y0; y <= y1; y += 20) { const w = F.halfW(y); pts.push([cx + w * Math.cos(th), y + K.rimRy(y, w) * Math.sin(th)]); }
        g.lineWidth = 3 + r() * 6; g.strokeStyle = `rgba(8,5,8,${0.2 + r() * 0.25})`; g.stroke(curve(pts, false));
      }
      // the bottle turns away at its edges: darken the silhouette sides (ambient occlusion)
      g.fillStyle = grad(g, cx - 190, 0, cx + 190, 0, [[0, 'rgba(6,4,12,0.6)'], [0.14, 'rgba(6,4,12,0.15)'], [0.5, 'rgba(6,4,12,0)'], [0.86, 'rgba(6,4,12,0.12)'], [1, 'rgba(6,4,12,0.55)']]);
      g.fillRect(cx - 200, 220, 400, 660);
      g.restore();

      // iron bands with rivets and one buckle each
      for (const by of bands) band(g, by, r);
      // brick arch rings, then the dark recesses (the fires are live, on top)
      for (const m of mouths) {
        g.fillStyle = K.litc(M.brickBurnt, m.c[0], m.c[1] - 30); g.fill(m.ring);
        voussoirs(g, m.th, m.w + 18, m.h + 10, m.y0, 9, r);
        g.lineWidth = 2; g.strokeStyle = K.LINE; g.stroke(m.ring);
        // soot stain fanning up from each mouth
        const top = onK(m.th, 0, m.y0 - m.h - 6);
        g.fillStyle = radial(g, top[0], top[1] - 30, 0, 70, [[0, 'rgba(6,4,8,0.55)'], [1, 'rgba(6,4,8,0)']]);
        g.fill(ell(top[0], top[1] - 30, 46 * Math.sin(m.th), 60));
      }
      // the bricked-up wicket: newer, paler bricks laid stretcher-bond, smeared with clay
      g.fillStyle = K.litc(M.brickBurnt, cx - 60, 760); g.fill(wickRing);
      voussoirs(g, wicket.th, wicket.w + 16, wicket.h + 8, wicket.y0 - 70, 11, r);
      g.lineWidth = 2; g.strokeStyle = K.LINE; g.stroke(wickRing);
      g.save(); g.clip(wick);
      g.fillStyle = K.css(kilnLit('#c8b090', cx - 60, 760, [0, 0, 1])); g.fill(wick);
      for (let y = wicket.y0 - 70 - wicket.h; y < wicket.y0 - 70; y += 9) {
        for (let u = -wicket.w / 2 - 20 + (Math.round(y / 9) % 2) * 9; u < wicket.w / 2 + 20; u += 18) {
          const a = onK(wicket.th, u + 1, y + 1), b = onK(wicket.th, u + 16, y + 1), c = onK(wicket.th, u + 16, y + 8), d = onK(wicket.th, u + 1, y + 8);
          g.fillStyle = K.css(kilnLit(K.mix('#d8a070', '#b87050', r()), a[0], a[1], [-0.5, 0, 0.86])); g.fill(poly([a, b, c, d]));
        }
      }
      g.fillStyle = 'rgba(200,180,150,0.25)'; g.fill(ell(cx - 66, 700, 20, 40));
      g.restore();
      g.lineWidth = 1.6; g.strokeStyle = K.LINE; g.stroke(wick);
      for (const m of mouths) { g.fillStyle = '#120604'; g.fill(m.path); g.lineWidth = 2.2; g.strokeStyle = K.LINE; g.stroke(m.path); }
      // the spy-hole: a ring of fireclay, its bung on a chain
      const [sx, sy] = spy.p;
      g.fillStyle = K.litc(M.clayPale, sx, sy); g.fill(ell(sx, sy, 6, 7.5)); g.lineWidth = 1.4; g.strokeStyle = K.LINE; g.stroke(ell(sx, sy, 6, 7.5));
      g.fillStyle = '#1a0a06'; g.fill(ell(sx, sy, 3.2, 4));
      // the lip: an iron collar seen from below
      const top = F.top, ryT = K.rimRy(top[1], top[0]);
      const collar = new Path2D();
      collar.ellipse(cx, top[1] + 2, top[0] + 3, Math.abs(ryT) * 0.6, 0, 0, Math.PI, true);
      collar.ellipse(cx, top[1] + 14, top[0] - 2, Math.abs(ryT) * 0.6, 0, Math.PI, 0, false);
      collar.closePath();
      g.fillStyle = K.litc(M.iron, cx, top[1] - 10, [0, -1, 0.3]); g.fill(collar);
      g.lineWidth = 2; g.strokeStyle = K.LINE; g.stroke(collar);
      g.lineWidth = 1.2; g.strokeStyle = K.css(K.lit('#e08040', cx, top[1] - 20), 0.9);
      g.beginPath(); g.ellipse(cx, top[1] + 2, top[0] + 3, Math.abs(ryT) * 0.6, 0, Math.PI * 1.1, Math.PI * 1.9, false); g.stroke();
      // silhouette ink, heavier than anything else in the picture
      g.lineWidth = 3.2; g.strokeStyle = K.LINE; g.stroke(body);
      // a ladder up the flank for the chimney sweep
      K.ladder(g, cx + 196, base - 4, cx + 140, 520, 23);
    },
  });
  function band(g, by, r) {
    const w = F.halfW(by), ry = K.rimRy(by, w), n = 40;
    const pt = (th, dy = 0) => [cx + (w + 1.5) * Math.cos(th), by + dy + ry * Math.sin(th)];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI, b = ((i + 1) / n) * Math.PI, tm = (a + b) / 2;
      const p0 = pt(a, -3), p1 = pt(b, -3), p2 = pt(b, 3), p3 = pt(a, 3);
      g.fillStyle = K.css(kilnLit(M.iron, (p0[0] + p1[0]) / 2, by, [Math.cos(tm), 0, Math.sin(tm)])); g.fill(poly([p0, p1, p2, p3]));
    }
    // the lit top edge and the dark underside
    g.beginPath(); for (let i = 0; i <= n; i++) { const [x, y] = pt((i / n) * Math.PI, -3); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.lineWidth = 1.2; g.strokeStyle = K.css(kilnLit('#d0a080', cx, by + 6, [0, -0.3, 1]), 0.9); g.stroke();
    g.beginPath(); for (let i = 0; i <= n; i++) { const [x, y] = pt((i / n) * Math.PI, 4); i ? g.lineTo(x, y) : g.moveTo(x, y); }
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(5,3,8,0.8)'; g.stroke();
    // rivets every so often, foreshortened toward the edges
    for (let th = 0.15; th < Math.PI - 0.1; th += 0.22) {
      const [x, y] = pt(th, 0);
      g.fillStyle = K.css(kilnLit('#8a8a94', x, y, [Math.cos(th), 0.3, Math.sin(th)])); g.fill(ell(x, y, 1.7 * Math.sin(th) + 0.5, 1.7));
    }
    // a buckle where the band's ends are drawn tight
    const bt = 0.9 + ((by * 13) % 7) / 7 * 1.3, [bx, byy] = pt(bt, 0);
    g.fillStyle = K.litc(M.iron, bx, byy, [Math.cos(bt), 0, Math.sin(bt)], 0.4); g.fill(K.rrect(bx - 5 * Math.sin(bt), byy - 6, 10 * Math.sin(bt), 12, 2));
    g.lineWidth = 1; g.strokeStyle = K.LINE; g.stroke(K.rrect(bx - 5 * Math.sin(bt), byy - 6, 10 * Math.sin(bt), 12, 2));
  }
  // wedge-shaped arch bricks around an opening
  function voussoirs(g, thc, w, h, y0, n, r) {
    const R = w / 2, spring = h - R, Ri = R - 9;
    for (let i = 0; i < n; i++) {
      const a0 = Math.PI + (i / n) * Math.PI, a1 = Math.PI + ((i + 0.88) / n) * Math.PI;
      const q = [[Math.cos(a0) * Ri, Math.sin(a0) * Ri], [Math.cos(a0) * R, Math.sin(a0) * R], [Math.cos(a1) * R, Math.sin(a1) * R], [Math.cos(a1) * Ri, Math.sin(a1) * Ri]]
        .map(([u, v]) => onK(thc, u, y0 - spring + v));
      const c = kilnLit(K.mix(M.brick3, M.brickBurnt, r() * 0.6), q[0][0], q[0][1], [0, 0, 1]);
      g.fillStyle = K.css(c); g.fill(poly(q));
    }
  }

  // ------------------------------------------------------------------ the fires (live)
  const fires = layer({
    id: 'fires', z: 31,
    roar: [0, 0, 0],
    hit(x, y) {
      for (let i = 1; i < 3; i++) { const m = mouths[i]; if (Math.hypot((x - m.c[0]) / 34, (y - m.c[1]) / 34) < 1) { this.which = i; return true; } }
      return false;
    },
    onEnter() { this.roar[this.which] = 1; for (let i = 0; i < 8; i++) K.spark(1.2); },
    update(dt, t, L) {
      for (let i = 0; i < 3; i++) this.roar[i] = ease(this.roar[i], L.hovered && this.which === i ? 0.7 : 0, 1.5, dt);
      // the fire breathes: a slow swell and a quick flicker, shared by every flame and glow
      K.fire.level = 1 + 0.08 * noise(t * 0.7) + 0.05 * noise(t * 5.3 + 3);
      K.fire.salt = ease(K.fire.salt, 0, 0.9, dt);
      K.fire.saltT += dt;
    },
    draw(g, t, L) {
      const salt = K.fire.salt;
      mouths.forEach((m, i) => {
        const lv = K.fire.level + this.roar[i] * 0.4 + salt * 0.3;
        g.save(); g.clip(m.path);
        const [mx, my] = m.c, sw = m.w * Math.sin(m.th) / 2 + 4;
        g.fillStyle = grad(g, 0, m.y0 - m.h, 0, m.y0, [[0, K.css(K.fireAt(0.35 * lv))], [0.55, K.css(K.fireAt(0.62 * lv))], [1, K.css(K.fireAt(0.82 * lv))]]);
        g.fillRect(mx - sw - 4, m.y0 - m.h - 4, sw * 2 + 8, m.h + 8);
        // the far wall of the firebox and its fire-bars
        g.fillStyle = 'rgba(60,10,4,0.35)'; g.fillRect(mx - sw, m.y0 - m.h * 0.95, sw * 2, m.h * 0.3);
        // flames: tongues rising off the coal bed, each with its own flicker
        for (let k = 0; k < 7; k++) {
          const fx = mx + (k / 6 - 0.5) * sw * 1.6, ph = t * (5 + k * 0.7) + k * 13;
          const fh = m.h * (0.45 + 0.3 * (0.5 + 0.5 * noise(ph * 0.4))) * lv;
          const lean = noise(ph * 0.3 + 5) * 6;
          const p = new Path2D();
          p.moveTo(fx - 7, m.y0 - 6);
          p.quadraticCurveTo(fx - 8 + lean * 0.5, m.y0 - fh * 0.5, fx + lean, m.y0 - fh);
          p.quadraticCurveTo(fx + 6 + lean * 0.5, m.y0 - fh * 0.45, fx + 7, m.y0 - 6);
          const fc = salt > 0.05 ? K.mix(K.fireAt(0.7), [0.4, 1, 0.72], salt) : K.fireAt(0.72 + 0.1 * noise(ph));
          g.fillStyle = K.css(fc, 0.85); g.fill(p);
          g.fillStyle = K.css(K.fireAt(0.92), 0.7);
          g.fill(ell(fx + lean * 0.3, m.y0 - fh * 0.3, 3, fh * 0.25));
        }
        // the coal bed: lumps glowing on their own slow clocks
        const r = rng(i * 99 + 7);
        for (let k = 0; k < 12; k++) {
          const cxk = mx + (r() - 0.5) * sw * 2, cyk = m.y0 - 3 - r() * 9, rr = 3 + r() * 4;
          const hot = 0.65 + 0.3 * (0.5 + 0.5 * Math.sin(t * (0.8 + r()) + r() * 9));
          g.fillStyle = K.css(K.fireAt(hot * Math.min(1.1, lv))); g.fill(ell(cxk, cyk, rr, rr * 0.7));
          g.fillStyle = 'rgba(40,8,4,0.5)'; g.fill(ell(cxk - rr * 0.3, cyk + rr * 0.2, rr * 0.5, rr * 0.3));
        }
        g.restore();
      });
      // the wicket seams glow where the clay has cracked
      const r = rng(5);
      g.globalCompositeOperation = 'lighter';
      for (let k = 0; k < 9; k++) {
        const u = (r() - 0.5) * wicket.w * 0.8, y = wicket.y0 - 80 - r() * (wicket.h - 30), len = 6 + r() * 14;
        const a = onK(wicket.th, u, y), b = onK(wicket.th, u + len, y + (r() - 0.5) * 3);
        const pulse = 0.4 + 0.35 * (0.5 + 0.5 * Math.sin(t * (0.6 + r()) + k * 3)) * K.fire.level;
        g.lineWidth = 1.3; g.strokeStyle = K.css(K.fireAt(0.7), pulse);
        g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke();
        K.glow(g, (a[0] + b[0]) / 2, a[1], 12, '#ff6a20', pulse * 0.3);
      }
      g.globalCompositeOperation = 'source-over';
    },
  });

  // ------------------------------------------------------------------ lip flame (live)
  layer({
    id: 'lipflame', z: 32,
    draw(g, t) {
      const lv = K.fire.level, salt = K.fire.salt, top = F.top[1];
      const w = Drawn.wind(t, cx);
      for (let k = 0; k < 9; k++) {
        const fx = cx + (k / 8 - 0.5) * 100, ph = t * (3.5 + k * 0.4) + k * 7;
        const fh = (16 + 22 * (0.5 + 0.5 * noise(ph * 0.5))) * lv * (1 - Math.abs(k / 8 - 0.5) * 0.9) + salt * 20;
        const lean = w * 10 + noise(ph * 0.3) * 5;
        const p = new Path2D();
        p.moveTo(fx - 9, top + 4);
        p.quadraticCurveTo(fx - 6 + lean * 0.4, top - fh * 0.5, fx + lean, top - fh);
        p.quadraticCurveTo(fx + 6 + lean * 0.5, top - fh * 0.4, fx + 9, top + 4);
        const c = salt > 0.05 ? K.mix(K.fireAt(0.62), [0.5, 1, 0.78], salt) : K.fireAt(0.58 + 0.12 * noise(ph));
        g.fillStyle = K.css(c, 0.9); g.fill(p);
      }
      for (let k = 0; k < 5; k++) {
        const fx = cx + (k / 4 - 0.5) * 60, fh = (10 + 10 * (0.5 + 0.5 * noise(t * 4 + k * 3))) * lv;
        g.fillStyle = K.css(K.fireAt(0.86), 0.8);
        g.fill(ell(fx + w * 4, top - fh * 0.4, 5, fh * 0.5));
      }
    },
  });

  // ------------------------------------------------------------------ the stoker (live)
  const stokeAct = K.actor(11, [['shovel', 2.6], ['shovel', 2.6], ['wipe', 1.8], ['lean', 2.2]], [2.5, 6]);
  const blinkS = Drawn.blinker(2.5, 4);
  const stoker = layer({
    id: 'stoker', z: 34, saltU: -1,
    hit: (x, y) => x > 584 && x < 670 && y > 780 && y < 884,
    onEnter() { if (this.saltU < 0) this.saltU = 0; },
    onTap() { if (this.saltU < 0) this.saltU = 0; },
    update(dt, t, L) {
      if (this.saltU >= 0) {
        this.saltU += dt / 2.4;
        if (this.saltU > 0.42 && !this.thrown) { this.thrown = true; K.fire.salt = 1; K.fire.saltT = 0; K.emit('salt'); }
        if (this.saltU >= 1) { this.saltU = -1; this.thrown = false; }
      } else stokeAct.step(dt);
    },
    draw(g, t, L) {
      const x = 628, y = 874;
      let hf = [14, -12], hb = [-4, -10], lean = 0, look = [0, 0];
      // the shovel: blade at the hand, handle up and back
      let shovelA = -0.5, blade = 'coal', bladeOff = 0;
      const sh = stokeAct.is('shovel');
      if (this.saltU >= 0) {
        const u = this.saltU;
        // scoop from the salt tub (behind him), swing, fling into the mouth
        const swing = u < 0.3 ? K.smooth(u / 0.3) : u < 0.45 ? 1 - K.smooth((u - 0.3) / 0.15) * 1.6 : -0.6 + K.smooth((u - 0.45) / 0.55) * 0.6;
        shovelA = -0.5 - swing * 0.6; lean = -swing * 0.12; hf = [14 - swing * 6, -12 - swing * 6]; blade = u < 0.42 ? 'salt' : 'none';
      } else if (sh >= 0) {
        const swing = Math.sin(sh * TAU) * K.bell(sh);
        shovelA = -0.5 + swing * 0.5; lean = swing * 0.1; hf = [14 + swing * 4, -12 + swing * 3];
        if (sh > 0.5) blade = 'none';
      } else if (stokeAct.is('wipe') >= 0) {
        const u = stokeAct.is('wipe');
        hb = [10 + Math.sin(u * TAU * 2) * 3, -33]; look = [0, -1];
      } else if (stokeAct.is('lean') >= 0) { lean = 0.08 * K.bell(stokeAct.is('lean')); }
      // the salt tub behind him
      tub(g, 676, 876);
      const hands = K.mole(g, x, y, 1.26, { flip: true, lean, hands: { f: hf, b: hb }, cap: '#4a3a5a', apron: '#6a5a4a', open: blinkS(t), look, breathe: Math.sin(t * 2.2) * 0.5 + 0.5, lx: 600, ly: 846 });
      // the shovel
      const [hx, hy] = hands.f;
      const dx = Math.cos(Math.PI + shovelA), dy = Math.sin(Math.PI + shovelA);
      const end = [hx + dx * 30, hy + dy * 30], back = [hx - dx * 24, hy - dy * 24];
      Drawn.tube(g, Drawn.seg(back[0], back[1], end[0], end[1]), K.litc(M.woodPale, hx, hy), 2.6, 1.2);
      g.save(); g.translate(end[0], end[1]); g.rotate(shovelA + Math.PI);
      const bl = poly([[0, -6], [14, -7], [15, 7], [0, 6]]);
      g.fillStyle = K.litc(M.iron, end[0], end[1], [0, 0, 1], 0.6); g.fill(bl); g.lineWidth = 1.3; g.strokeStyle = K.LINE; g.stroke(bl);
      if (blade === 'coal') { g.fillStyle = '#1a1214'; for (let i = 0; i < 5; i++) g.fill(ell(4 + i * 2.5, -1 - (i % 2) * 2, 3, 2)); }
      if (blade === 'salt') { g.fillStyle = '#f0eee8'; g.fill(ell(8, -2, 7, 3)); }
      g.restore();
      // a flung arc of salt crystals
      if (this.saltU > 0.38 && this.saltU < 0.6) {
        const u = (this.saltU - 0.38) / 0.22, r = rng(3);
        g.fillStyle = 'rgba(255,255,250,0.9)';
        for (let i = 0; i < 18; i++) { const px = lerp(end[0], 566, u) + (r() - 0.5) * 30 * u, py = lerp(end[1], 834, u) - Math.sin(u * Math.PI) * 18 + (r() - 0.5) * 12; g.fillRect(px, py, 1.6, 1.6); }
      }
    },
  });
  function tub(g, x, y) {
    const r = 14, ry = K.rimRy(y - 20, r);
    const p = new Path2D(); p.moveTo(x - r, y - 20); p.lineTo(x - r + 2, y); p.ellipse(x, y, r - 2, Math.abs(K.rimRy(y, r)), 0, Math.PI, 0, true); p.lineTo(x + r, y - 20); p.closePath();
    g.fillStyle = K.litc(M.wood, x - 10, y - 10, [-0.7, 0, 0.7]); g.fill(p); g.lineWidth = 1.4; g.strokeStyle = K.inkAt(x, y); g.stroke(p);
    g.fillStyle = K.litc('#e8e4dc', x - 8, y - 22, [0, -1, 0.3]); g.fill(ell(x, y - 20, r, Math.abs(ry) + 1)); g.stroke(ell(x, y - 20, r, Math.abs(ry) + 1));
    g.lineWidth = 1; g.strokeStyle = K.litc(M.iron, x, y - 8); g.beginPath(); g.ellipse(x, y - 8, r - 0.5, Math.abs(ry) + 0.5, 0, 0, Math.PI); g.stroke();
  }

  // ------------------------------------------------------------------ the cone-watcher (live)
  const watchAct = K.actor(23, [['squint', 2.4], ['note', 2], ['scratch', 1.6]], [3, 7]);
  const blinkW = Drawn.blinker(3, 5);
  const cones = [0, 0, 0].map(() => K.spring({ k: 40, d: 7 }));
  layer({
    id: 'watcher', z: 35,
    hit: (x, y) => x > 724 && x < 804 && y > 770 && y < 884,
    update(dt, t, L) {
      watchAct.step(dt);
      const pull = L.hovered ? K.smooth(L.since / 0.4) : 0;
      this.pull = ease(this.pull || 0, pull, 6, dt);
      // cones bend one after another while the bung is out
      cones.forEach((c, i) => K.springTo(c, L.hovered && L.since > 0.5 + i * 0.5 ? 1 : 0, dt));
    },
    draw(g, t, L) {
      const [sx, sy] = spy.p;
      const pull = this.pull || 0;
      // the bung on its chain, swung out of the hole
      const bx = sx + 4 + pull * 10, by = sy + pull * 14;
      g.lineWidth = 0.8; g.strokeStyle = '#6a5a54'; g.beginPath(); g.moveTo(sx + 5, sy - 6); g.quadraticCurveTo(sx + 9, sy + 6, bx, by); g.stroke();
      g.fillStyle = K.litc(M.clayPale, bx, by); g.fill(ell(bx, by, 3.4, 4)); g.lineWidth = 1; g.strokeStyle = K.LINE; g.stroke(ell(bx, by, 3.4, 4));
      if (pull < 0.7) { g.fillStyle = K.litc(M.clayPale, sx, sy); g.fill(ell(sx + pull * 5, sy, 3.2 * (1 - pull), 4)); }
      // inside: the white-hot chamber and three cones, bending
      g.save(); g.beginPath(); g.ellipse(sx, sy, 3.2, 4, 0, 0, TAU); g.clip();
      g.fillStyle = K.css(K.fireAt(0.86 + pull * 0.1)); g.fillRect(sx - 5, sy - 5, 10, 10);
      g.restore();
      if (pull > 0.05) {
        g.globalCompositeOperation = 'lighter';
        K.glow(g, sx, sy, 26 + pull * 14, '#ffd070', 0.6 * pull);
        g.globalCompositeOperation = 'source-over';
        // a little lens of what the watcher sees: the cones, drawn large, beside the hole
        const lx = sx + 2, ly = sy - 42, R = 20 * K.smooth(pull);
        if (R > 2) {
          g.save();
          g.beginPath(); g.arc(lx, ly, R, 0, TAU);
          g.fillStyle = K.css(K.fireAt(0.9)); g.fill();
          g.clip();
          for (let i = 0; i < 3; i++) {
            const bend = cones[i].x, x0 = lx - 10 + i * 10, y0 = ly + 10;
            g.save(); g.translate(x0, y0); g.rotate(bend * 1.25);
            g.fillStyle = K.css(K.fireAt(0.78 - i * 0.04)); g.fill(poly([[-3, 0], [3, 0], [0.5, -15]]));
            g.lineWidth = 0.8; g.strokeStyle = 'rgba(120,40,10,0.8)'; g.stroke(poly([[-3, 0], [3, 0], [0.5, -15]]));
            g.restore();
          }
          g.fillStyle = 'rgba(160,60,20,0.6)'; g.fillRect(lx - R, ly + 10, R * 2, 4);
          g.restore();
          g.lineWidth = 1.6; g.strokeStyle = K.LINE; g.beginPath(); g.arc(lx, ly, R, 0, TAU); g.stroke();
          g.lineWidth = 1; g.beginPath(); g.moveTo(lx - 2, ly + R); g.lineTo(sx, sy - 5); g.stroke();
        }
      }
      // the crate he stands on
      const cx0 = 768, cy0 = 880;
      const crate = rect(cx0 - 18, cy0 - 34, 36, 34);
      g.fillStyle = K.litc(M.wood, cx0 - 8, cy0 - 12, [-0.8, 0, 0.6]); g.fill(crate);
      g.lineWidth = 1; g.strokeStyle = K.css(K.lit(M.woodDark, cx0, cy0)); for (const yy of [cy0 - 23, cy0 - 12]) { g.beginPath(); g.moveTo(cx0 - 18, yy); g.lineTo(cx0 + 18, yy); g.stroke(); }
      g.lineWidth = 1.5; g.strokeStyle = K.inkAt(cx0, cy0); g.stroke(crate);
      g.fillStyle = 'rgba(8,4,10,0.45)'; g.fill(ell(cx0, cy0 + 1, 22, 3));
      const sq = watchAct.is('squint'), note = watchAct.is('note'), scr = watchAct.is('scratch');
      let hf = [16, -20], hb = [-6, -14], lean = 0.12 + pull * 0.1, open = blinkW(t);
      if (sq >= 0) { lean += 0.08 * K.bell(sq); open = Math.min(open, 1 - 0.6 * K.bell(sq)); }
      if (note >= 0 && pull < 0.1) { hb = [4, -26 + Math.sin(note * 30) * 1.5]; hf = [10, -24]; lean = 0; }
      if (scr >= 0 && pull < 0.1) { hb = [-2, -42]; }
      // linger: he nods, satisfied
      const nod = L.hovered && L.since > 2.2 ? Math.sin((L.since - 2.2) * 7) * 0.06 * K.bell(Math.min(1, (L.since - 2.2) / 1.2)) : 0;
      K.mole(g, cx0 - 2, cy0 - 34, 1.14, { flip: true, lean: lean + nod, hands: { f: hf, b: hb }, specs: true, scarf: '#8a3a3a', open, lx: 740, ly: 820, smile: pull > 0.5 ? 1.4 : 0.4 });
      if (note >= 0 && pull < 0.1) { // a little notebook
        g.fillStyle = K.litc(M.glazeCream, cx0 - 8, cy0 - 50); g.fillRect(cx0 - 12, cy0 - 54, 7, 9); g.lineWidth = 0.8; g.strokeStyle = K.LINE; g.strokeRect(cx0 - 12, cy0 - 54, 7, 9);
      }
    },
  });

  // ------------------------------------------------------------------ the pup (live)
  const blinkP = Drawn.blinker(2, 4);
  layer({
    id: 'pup', z: 36, burn: 0,
    hit: (x, y) => x > 356 && x < 440 && y > 806 && y < 878,
    onEnter() { this.burn = Math.max(this.burn, 0.01); },
    update(dt, t, L) {
      if (this.burn > 0) { this.burn += dt / 3; if (this.burn > 1) this.burn = 0; }
    },
    draw(g, t, L) {
      const x = 384, y = 874, b = this.burn;
      // a brick to sit on
      g.fillStyle = K.litc(M.brick2, x, y - 6, [0.5, -0.4, 0.8]); g.fill(rect(x - 12, y - 10, 24, 10)); g.lineWidth = 1.2; g.strokeStyle = K.inkAt(x, y); g.strokeRect(x - 12, y - 10, 24, 10);
      const blow = b > 0.2 && b < 0.85;
      const swing = Math.sin(t * 3.2) * 0.5;
      // the stick, held out to the firemouth, the mushroom on its end
      const hand = [x + 15, y - 24];
      const tip = [x + 48, y - 36 + Math.sin(t * 1.3) * 1.5 + (blow ? -6 : 0)];
      g.lineWidth = 1.6; g.strokeStyle = K.litc(M.woodPale, x + 30, y - 30); g.beginPath(); g.moveTo(hand[0] - 2, hand[1] + 2); g.lineTo(tip[0], tip[1]); g.stroke();
      const cap = b > 0.15 ? K.mix(K.lit('#e8c8a0', tip[0], tip[1]), [0.12, 0.06, 0.05], clamp((b - 0.15) * 2, 0, 0.9)) : K.lit('#e8c8a0', tip[0], tip[1], [0.8, 0, 0.6]);
      g.fillStyle = K.litc('#f0e0c8', tip[0], tip[1] + 3); g.fillRect(tip[0] - 1.5, tip[1] - 1, 3, 6);
      g.fillStyle = K.css(cap); g.fill(ell(tip[0], tip[1] - 2, 6, 4)); g.lineWidth = 1; g.strokeStyle = K.LINE; g.stroke(ell(tip[0], tip[1] - 2, 6, 4));
      if (b > 0.12 && b < 0.7) {
        // it's caught!
        const fh = 10 * K.bell((b - 0.12) / 0.58);
        g.fillStyle = K.css(K.fireAt(0.75), 0.9);
        g.beginPath(); g.moveTo(tip[0] - 5, tip[1] - 4); g.quadraticCurveTo(tip[0] - 3, tip[1] - 4 - fh, tip[0] + Math.sin(t * 20) * 2, tip[1] - 6 - fh * 1.4); g.quadraticCurveTo(tip[0] + 3, tip[1] - 4 - fh, tip[0] + 5, tip[1] - 4); g.fill();
      }
      if (b > 0.6) { // a curl of smoke after it's out
        const u = (b - 0.6) / 0.4;
        g.lineWidth = 1.4; g.strokeStyle = `rgba(160,150,150,${0.5 * (1 - u)})`;
        g.beginPath(); g.moveTo(tip[0], tip[1] - 6); g.quadraticCurveTo(tip[0] + 6, tip[1] - 14 - u * 10, tip[0] - 2, tip[1] - 22 - u * 16); g.stroke();
      }
      K.mole(g, x, y - 10, 0.72, { hands: { f: [22, -20], b: [12, -18] }, open: blow ? 0.2 : blinkP(t), mouth: blow ? 0.6 + 0.3 * Math.sin(t * 18) : 0, smile: b > 0.85 || b === 0 ? 1.6 : 0.2, scarf: '#4a7a8a', lean: blow ? 0.12 : 0, lx: 396, ly: 846 });
      // feet swinging off the brick
      g.fillStyle = K.litc(M.skin, x, y - 6); for (const [fx, ph] of [[-3, 0], [4, 1.6]]) g.fill(ell(x + fx + Math.sin(t * 3.2 + ph) * 1.5, y - 8 + Math.max(0, Math.sin(t * 3.2 + ph)) * 2, 3, 2));
    },
  });
})();
