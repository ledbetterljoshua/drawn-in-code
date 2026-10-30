/* houses.js — the moles' houses, each one a giant thrown pot, pierced like a lantern so the lamp
   inside spills out through stars, crescents and dots. Every pot is a turned (lathe) form shaded
   facet by facet by the shared fire light, with throwing rings, glaze running down over bare clay,
   and highlights on the glaze from whichever fire is nearest.
   z 14 / 15  jug tower and lantern pot on the upper terrace (still / live)
     jug: hover and the shutter swings open, a mole leans out with a candle and waves
     lantern pot: hover and the lamp inside turns, so its stars crawl across the clay face
   z 38 / 39  the pierced teapot (still / live): the second focal point. Its dots of light turn
     slowly over the terrace. Hover: the lid lifts, a mole peeks out under it, steam from the spout;
     linger and the lamp spins faster, so the dots swirl round
   z 40 / 41  the bowl house (still / live): hover and the door opens, someone leans out, and the
     washing line on its foot ring swings
   z 36 / 37  the jar stack (still / live): two jars balanced on a knoll. Hover: it wobbles on a
     spring, then settles; the mole on top grabs the rim
   z 42 / 43  the broken-pot workshop (still / live): a giant cracked jar, its broken front the
     workshop's open door. The potter throws on a kick wheel. Hover: the pot rises taller and
     taller, and if you stay it slumps and the potter sighs
   z 33 / 44  the heat pipe (still / live): clay pipe carrying the kiln's heat house to house.
     Hover: a pulse of glow runs along it and each house it reaches brightens */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, rect, poly, curve, grad, radial, st, P, layer } = Drawn;
  const K = window.Kiln, M = K.M;
  const tone = (v) => 1 - Math.exp(-v * 1.55);

  // ------------------------------------------------------------------ shading a thrown form
  // glaze: { col, edge: y where it stops (drips run below), seed }
  function throwPot(g, F, o = {}) {
    const r = rng(o.seed || 1);
    const prof = F.prof, y0 = prof[0][1], y1 = prof[prof.length - 1][1];
    const key = K.keyAt(F.cx, (y0 + y1) / 2);
    const drips = []; for (let i = 0; i <= 32; i++) drips.push((r() < 0.3 ? 8 + r() * 30 : r() * 8));
    const edgeAt = (th) => { const u = (th / Math.PI) * 32, i = Math.floor(clamp(u, 0, 31.99)); return o.glaze ? o.glaze.edge + lerp(drips[i], drips[i + 1], u - i) : -1e9; };
    g.save(); g.clip(F.path);
    const dy = 4, nth = 26;
    for (let y = y0 - 2; y < y1 + 4; y += dy) {
      const w0 = F.halfW(y), w1 = F.halfW(y + dy), ry0 = K.rimRy(y, w0), ry1 = K.rimRy(y + dy, w1);
      const slope = (w1 - w0) / dy;
      for (let i = 0; i < nth; i++) {
        const a = (i / nth) * Math.PI, b = ((i + 1) / nth) * Math.PI, tm = (a + b) / 2;
        const p = poly([[F.cx + w0 * Math.cos(a), y + ry0 * Math.sin(a)], [F.cx + w0 * Math.cos(b), y + ry0 * Math.sin(b)], [F.cx + w1 * Math.cos(b), y + dy + ry1 * Math.sin(b)], [F.cx + w1 * Math.cos(a), y + dy + ry1 * Math.sin(a)]]);
        const nx = Math.cos(tm), nz = Math.sin(tm), ny = -slope, nn = Math.hypot(nx, ny, nz);
        const n = [nx / nn, ny / nn, nz / nn];
        const px = F.cx + w0 * nx, py = y + ry0 * nz;
        const glazed = o.glaze && y < edgeAt(tm);
        const alb = glazed ? o.glaze.col : o.clay || M.terracotta;
        let c = o.skip ? K.litSkip(alb, px, py, n, o.skip) : K.lit(alb, px, py, n, 0, o.ambK || 1);
        if (glazed) {
          // a highlight where the glaze turns toward the strongest fire
          const lx = key.dx, ly = key.dy, hz = 1, hn = Math.hypot(lx, ly, hz + 1);
          const s = Math.pow(Math.max(0, (n[0] * lx + n[1] * ly + n[2] * (hz + 1)) / hn), 40) * clamp(key.I * 0.5, 0, 1.2);
          c = K.mix(c, [1, 0.88, 0.68], clamp(s, 0, 0.9));
        }
        const cs = K.css(c);
        g.fillStyle = cs; g.fill(p);
        g.lineWidth = 0.6; g.strokeStyle = cs; g.stroke(p);
      }
    }
    // throwing rings: faint ridges spiralling up the wall
    if (o.rings !== false) {
      for (let y = y0 + 6; y < y1 - 4; y += 7 + r() * 4) {
        const w = F.halfW(y), ry = K.rimRy(y, w);
        g.beginPath(); g.ellipse(F.cx, y, w, Math.abs(ry) + 0.01, 0, ry >= 0 ? 0 : Math.PI, ry >= 0 ? Math.PI : TAU, false);
        g.lineWidth = 1; g.strokeStyle = 'rgba(20,8,12,0.16)'; g.stroke();
        g.beginPath(); g.ellipse(F.cx, y - 1.2, w, Math.abs(ry) + 0.01, 0, ry >= 0 ? 0.2 : Math.PI + 0.2, ry >= 0 ? Math.PI - 0.2 : TAU - 0.2, false);
        g.strokeStyle = 'rgba(255,220,190,0.07)'; g.stroke();
      }
    }
    // the glaze edge: a thicker lip where it pooled before running
    if (o.glaze) {
      g.beginPath();
      for (let i = 0; i <= 64; i++) { const th = (i / 64) * Math.PI, yy = edgeAt(th), w = F.halfW(yy), ry = K.rimRy(yy, w); const x = F.cx + w * Math.cos(th), y = yy + ry * Math.sin(th); i ? g.lineTo(x, y) : g.moveTo(x, y); }
      g.lineWidth = 1.6; g.strokeStyle = K.css(K.mul(K.lit(o.glaze.col, F.cx, o.glaze.edge), 0.6), 0.8); g.stroke();
    }
    // turn the edges away into shadow
    g.fillStyle = grad(g, F.cx - F.bot[0] * 1.6, 0, F.cx + F.bot[0] * 1.6, 0, [[0, 'rgba(6,4,12,0.55)'], [0.2, 'rgba(6,4,12,0.12)'], [0.5, 'rgba(6,4,12,0)'], [0.8, 'rgba(6,4,12,0.12)'], [1, 'rgba(6,4,12,0.55)']]);
    g.fillRect(F.cx - 400, y0 - 10, 800, y1 - y0 + 20);
    g.restore();
    g.lineWidth = o.lw || 2.6; g.strokeStyle = K.inkAt(F.cx, (y0 + y1) / 2, 0.5); g.stroke(F.path);
    // contact shadow
    g.fillStyle = 'rgba(8,4,10,0.5)'; g.fill(ell(F.cx, y1 + 1, F.bot[0] * 1.08, Math.max(3, K.rimRy(y1, F.bot[0]) + 3)));
  }
  // the visible top rim of an open or lidded form
  function rim(g, F, col, lw = 2) {
    const [w, y] = F.top, ry = K.rimRy(y, w);
    const p = ell(F.cx, y, w, Math.abs(ry) + 0.5);
    if (ry > 0) { g.fillStyle = K.litc(col, F.cx, y, [0, -1, 0.3]); g.fill(p); }
    g.lineWidth = lw; g.strokeStyle = K.inkAt(F.cx, y, 0.5);
    if (ry > 0) g.stroke(p);
    else { g.beginPath(); g.ellipse(F.cx, y, w, -ry + 0.5, 0, Math.PI, TAU, false); g.stroke(); }
  }
  // pierced holes on a form: returns a list of { path, x, y, k } (k = how squarely it faces us)
  function piercings(F, rows) {
    const out = [];
    for (const row of rows) {
      const { y, n, size, shape = 'dot', off = 0, from = 0.22, to = Math.PI - 0.22 } = row;
      for (let i = 0; i < n; i++) {
        const th = from + ((i + 0.5 + off) / n) * (to - from);
        const [x, yy] = K.onLathe(F, th, y), k = Math.sin(th);
        const sx = size * k, sy = size;
        const p = new Path2D();
        const sh = typeof shape === 'function' ? shape(i) : shape;
        if (sh === 'dot') p.ellipse(x, yy, sx, sy, 0, 0, TAU);
        else if (sh === 'star') { for (let j = 0; j < 8; j++) { const a = (j / 8) * TAU - Math.PI / 2, rr = j % 2 ? 0.38 : 1; const px = x + Math.cos(a) * sx * rr * 1.2, py = yy + Math.sin(a) * sy * rr * 1.2; j ? p.lineTo(px, py) : p.moveTo(px, py); } p.closePath(); }
        else if (sh === 'moon') { p.ellipse(x, yy, sx, sy, 0, -Math.PI / 2, Math.PI / 2, false); p.ellipse(x - sx * 0.45, yy, sx * 0.55, sy, 0, Math.PI / 2, -Math.PI / 2, true); p.closePath(); }
        else if (sh === 'slot') { p.ellipse(x, yy, sx * 0.4, sy * 1.6, 0, 0, TAU); }
        else if (sh === 'drop') { p.moveTo(x, yy - sy * 1.4); p.quadraticCurveTo(x + sx, yy, x, yy + sy); p.quadraticCurveTo(x - sx, yy, x, yy - sy * 1.4); }
        out.push({ path: p, x, y: yy, k, th });
      }
    }
    return out;
  }
  // still: the dark of each hole, with a thin lit lip on its lower edge (the hole's wall)
  function holesStill(g, holes) {
    for (const h of holes) { g.fillStyle = '#1e0c06'; g.fill(h.path); g.lineWidth = 0.9; g.strokeStyle = 'rgba(10,4,8,0.9)'; g.stroke(h.path); }
  }
  // live: the lamp shining through. a = brightness 0..~1.4
  function holesLive(g, holes, a, col = [1, 0.78, 0.4], t = 0, seed = 0) {
    for (const h of holes) {
      const f = a * (0.5 + 0.5 * h.k) * (0.85 + 0.15 * noise(t * 3 + h.x * 0.1 + seed));
      g.fillStyle = K.css(K.mix([0.9, 0.42, 0.12], col, clamp(f, 0, 1)), clamp(f, 0, 1));
      g.fill(h.path);
    }
  }
  // a lit doorway or window cut into a form: arch on the surface
  const surfArch = (F, thc, w, h, ybot) => {
    const pts = [], R = w / 2, spring = h - R;
    const at = (u, y) => { const ww = F.halfW(y), th = thc - u / ww; return [F.cx + ww * Math.cos(th), y + K.rimRy(y, ww) * Math.sin(th)]; };
    pts.push(at(-R, ybot)); pts.push(at(-R, ybot - spring));
    for (let i = 0; i <= 12; i++) { const a = Math.PI + (i / 12) * Math.PI; pts.push(at(Math.cos(a) * R, ybot - spring + Math.sin(a) * R)); }
    pts.push(at(R, ybot));
    return { path: poly(pts), at };
  };
  // a pot rendered once into a sprite (for pots that move), rebuilt on every layout
  const potSprites = [];
  const potSprite = (F, o, extra) => {
    const S = { sp: null };
    const y0 = F.prof[0][1], y1 = F.prof[F.prof.length - 1][1], w = Math.max(...F.prof.map((p) => p[0]));
    potSprites.push(() => { S.sp = Drawn.sprite(F.cx - w - 12, y0 - 30, w * 2 + 24, y1 - y0 + 50, (g) => { throwPot(g, F, o); if (extra) extra(g); }); });
    return S;
  };
  Drawn.onLayout(() => potSprites.forEach((f) => f()));
  // flicker of an interior lamp
  const lampFlicker = (t, seed) => 0.88 + 0.08 * noise(t * 1.3 + seed) + 0.05 * noise(t * 7 + seed * 3);

  // ------------------------------------------------------------------ upper terrace: jug tower
  const jug = K.lathe(128, [[30, 330], [24, 340], [21, 352], [22, 392], [34, 420], [58, 452], [72, 500], [74, 556], [66, 590], [62, 600]]);
  const jugHoles = piercings(jug, [
    { y: 476, n: 9, size: 3.2, shape: 'star' }, { y: 500, n: 11, size: 2.4, shape: 'dot', off: 0.5 },
    { y: 522, n: 9, size: 3, shape: 'moon' }, { y: 544, n: 11, size: 2.2, shape: 'dot', off: 0.5 },
  ]);
  const jugWin = surfArch(jug, Math.PI / 2 - 0.1, 22, 30, 412);
  const jugDoor = surfArch(jug, Math.PI / 2 + 0.25, 30, 44, 600);
  layer({
    id: 'jug', z: 14, still: true,
    draw(g) {
      throwPot(g, jug, { skip: K.L.jug, clay: M.terracotta, glaze: { col: M.glazeHoney, edge: 460, seed: 3 }, seed: 4 });
      rim(g, jug, M.terracotta);
      holesStill(g, jugHoles);
      // the handle: a great loop from neck to belly, with steps cut into it
      const hp = new Path2D(); hp.moveTo(150, 372); hp.bezierCurveTo(240, 360, 250, 470, 196, 520);
      g.lineCap = 'round'; g.lineWidth = 16; g.strokeStyle = K.inkAt(200, 440, 0.5); g.stroke(hp);
      g.lineWidth = 12; g.strokeStyle = K.litc(M.glazeHoney, 220, 430, [0.6, 0, 0.8]); g.stroke(hp);
      g.lineWidth = 3; g.strokeStyle = K.css(K.lit('#ffe0a0', 214, 420), 0.5); g.stroke(new Path2D('M160 368 C 220 362 236 430 222 462'));
      g.fillStyle = '#1e0c06'; g.fill(jugWin.path); g.fill(jugDoor.path);
      g.lineWidth = 1.6; g.strokeStyle = K.LINE; g.stroke(jugWin.path); g.stroke(jugDoor.path);
      // a little sill with a pot of herbs
      g.fillStyle = K.litc(M.woodPale, 128, 414); g.fillRect(112, 412, 30, 4); g.strokeRect(112, 412, 30, 4);
    },
  });
  const blinkJ = Drawn.blinker(2, 5);
  layer({
    id: 'jugLive', z: 15,
    hit: (x, y) => Math.abs(x - 128) < 70 && y > 330 && y < 600,
    draw(g, t, L) {
      const f = lampFlicker(t, 1) * (1 + L.hover * 0.2) * (K.pulse ? 1 + K.pulse.jug : 1);
      holesLive(g, jugHoles, f * 0.95, [1, 0.8, 0.45], t, 1);
      // the window: lamplight, a shutter that swings open on hover, and a mole leaning out
      g.save(); g.clip(jugWin.path);
      g.fillStyle = K.css(K.fireAt(0.72 * f)); g.fill(jugWin.path);
      const h = K.smooth(L.hover);
      if (h > 0.02) {
        const wave = L.since > 0.5 ? Math.sin((L.since - 0.5) * 9) * K.bell(Math.min(1, (L.since - 0.5) / 2)) : 0;
        K.mole(g, 126, 430 + (1 - h) * 22, 0.55, { hands: { f: [18, -26 - wave * 6], b: [10, -16] }, open: blinkJ(t), smile: 1.6, lx: 128, ly: 420 });
      }
      g.restore();
      // the shutter, hinged on the left of the window
      const sw = 1 - h;
      g.save();
      const [hx, hy] = jugWin.at(-11, 412);
      g.translate(hx, hy); g.transform(Math.max(0.08, sw), sw > 0.5 ? 0 : -0.15 * (1 - sw), 0, 1, 0, 0);
      const sp = K.rrect(0, -30, 22, 30, 9);
      g.fillStyle = K.litc(M.wood, 128, 400); g.fill(sp); g.lineWidth = 1.4; g.strokeStyle = K.LINE; g.stroke(sp);
      g.lineWidth = 0.8; g.beginPath(); g.moveTo(11, -28); g.lineTo(11, 0); g.stroke();
      g.restore();
      // door glow
      g.fillStyle = K.css(K.fireAt(0.6 * f), 0.9); g.fill(jugDoor.path);
    },
  });

  // ------------------------------------------------------------------ upper terrace: lantern pot
  const lant = K.lathe(298, [[16, 470], [26, 476], [42, 492], [56, 520], [62, 556], [58, 592], [52, 610]]);
  const lantHoles = piercings(lant, [
    { y: 492, n: 6, size: 3, shape: 'dot' }, { y: 516, n: 8, size: 4.6, shape: 'star', off: 0.5 },
    { y: 542, n: 9, size: 3.4, shape: 'moon' }, { y: 566, n: 8, size: 4.4, shape: 'star', off: 0.5 }, { y: 588, n: 9, size: 2.6, shape: 'dot' },
  ]);
  layer({
    id: 'lantern', z: 14.2, still: true,
    draw(g) {
      throwPot(g, lant, { skip: K.L.lantern, clay: M.clayDark, seed: 7 });
      holesStill(g, lantHoles);
      // the domed lid with a knob
      const lid = curve([[280, 472], [286, 458], [298, 452], [310, 458], [316, 472]]);
      g.fillStyle = K.litc(M.clayDark, 298, 460); g.fill(lid); g.lineWidth = 2; g.strokeStyle = K.LINE; g.stroke(lid);
      g.fillStyle = K.litc(M.clay, 298, 450); g.fill(circ(298, 448, 5)); g.stroke(circ(298, 448, 5));
    },
  });
  layer({
    id: 'lanternLive', z: 15.2, spin: 0, sp: 0,
    hit: (x, y) => Math.hypot((x - 298) / 70, (y - 540) / 80) < 1,
    update(dt, t, L) { this.sp = ease(this.sp, L.hovered ? 1.6 : 0.12, 1.5, dt); this.spin += this.sp * dt; },
    draw(g, t, L) {
      const f = lampFlicker(t, 2) * (1 + L.hover * 0.3) * (K.pulse ? 1 + K.pulse.lantern : 1);
      holesLive(g, lantHoles, f, [1, 0.82, 0.5], t, 2);
      // its pattern thrown on the clay face beside it, crawling as the lamp inside turns
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) {
        const a = this.spin + (i / 18) * TAU, side = Math.cos(a);
        if (Math.sin(a) < 0) continue;
        const d = 90 + (i % 3) * 22;
        const x = 298 + side * d * 1.4, y = 600 + 60 + (i % 3) * 30 - Math.abs(side) * 40;
        if (x > 400) continue;
        K.glow(g, x, y, 9 + (i % 3) * 3, '#ffb060', 0.22 * f * Math.sin(a));
      }
      g.globalCompositeOperation = 'source-over';
    },
  });

  // ------------------------------------------------------------------ the teapot
  const TX = 1112, TB = 886;
  const tea = K.lathe(TX, [[76, 634], [92, 642], [108, 660], [124, 690], [134, 730], [136, 774], [128, 822], [112, 860], [104, 878], [106, TB]]);
  const teaHoles = piercings(tea, [
    { y: 672, n: 11, size: 3, shape: 'dot', from: 0.3, to: Math.PI - 0.3 },
    { y: 700, n: 13, size: 5.4, shape: 'star', off: 0.5 },
    { y: 732, n: 15, size: 3.6, shape: (i) => (i % 2 ? 'moon' : 'dot') },
    { y: 764, n: 13, size: 5.8, shape: 'star', off: 0.5 },
    { y: 796, n: 15, size: 3.4, shape: (i) => (i % 3 === 1 ? 'drop' : 'dot') },
    { y: 824, n: 11, size: 2.6, shape: 'dot', off: 0.5, from: 0.4, to: Math.PI - 0.4 },
  ]).filter((h) => !(Math.abs(h.x - 1100) < 30 && h.y > 784) && !(Math.abs(h.x - 1150) < 22 && h.y > 708 && h.y < 760));
  const teaDoor = surfArch(tea, Math.PI / 2 + 0.1, 40, 62, TB);
  const teaWin = surfArch(tea, Math.PI / 2 - 0.28, 26, 26, 754);
  const lid = K.lathe(TX, [[22, 598], [30, 606], [56, 616], [80, 630], [88, 638]]);
  K.teapot = { x: TX, base: TB, tea, lid };
  layer({
    id: 'teapot', z: 38, still: true,
    draw(g) {
      // the handle loop on the left, a rope ladder inside it up to the lid hatch
      const hp = new Path2D(); hp.moveTo(990, 676); hp.bezierCurveTo(912, 666, 900, 806, 992, 820);
      g.lineCap = 'round'; g.lineWidth = 22; g.strokeStyle = K.inkAt(940, 740, 0.5); g.stroke(hp);
      g.lineWidth = 17; g.strokeStyle = K.litc(M.glazeTeal, 930, 740, [-0.6, 0, 0.8]); g.stroke(hp);
      g.lineWidth = 3.5; g.strokeStyle = K.css(K.lit('#d0f0e0', 930, 720, [-1, 0, 0.3], 0.3), 0.5); g.stroke(new Path2D('M984 670 C 920 668 906 740 914 770'));
      // the spout: a chimney sweeping up to the right
      const sp = new Path2D();
      sp.moveTo(1230, 820); sp.bezierCurveTo(1280, 800, 1272, 740, 1306, 690); sp.lineTo(1330, 684); sp.lineTo(1324, 700);
      sp.bezierCurveTo(1300, 760, 1300, 830, 1236, 860); sp.closePath();
      g.fillStyle = grad(g, 1230, 0, 1320, 0, [[0, K.litc(M.glazeTeal, 1240, 800, [-0.5, 0, 0.8])], [1, K.litc(M.glazeTeal, 1310, 720, [0.6, 0, 0.5])]]);
      g.fill(sp);
      g.lineWidth = 2.4; g.strokeStyle = K.inkAt(1270, 780, 0.5); g.stroke(sp);
      g.lineWidth = 2; g.strokeStyle = K.css(K.lit('#d8f0e0', 1250, 800, [-1, 0, 0.3], 0.4), 0.4); g.stroke(new Path2D('M1240 830 C 1276 810 1280 760 1300 712'));
      throwPot(g, tea, { skip: K.L.teapot, clay: M.terracotta, glaze: { col: M.glazeTeal, edge: 742, seed: 11 }, seed: 12 });
      holesStill(g, teaHoles);
      g.fillStyle = '#1e0c06'; g.fill(teaDoor.path); g.fill(teaWin.path);
      g.lineWidth = 2; g.strokeStyle = K.LINE; g.stroke(teaDoor.path); g.stroke(teaWin.path);
      // a door step of brick and a mat
      g.fillStyle = K.litc(M.brick2, 1100, TB + 6, [0, -1, 0.4]); g.fill(K.rrect(1074, TB + 1, 56, 8, 2)); g.lineWidth = 1.3; g.strokeStyle = K.LINE; g.stroke(K.rrect(1074, TB + 1, 56, 8, 2));
      // a little sign: a pot with a heart, painted in slip
      g.fillStyle = K.litc(M.woodPale, 1170, 846); g.fill(K.rrect(1158, 836, 24, 16, 2)); g.stroke(K.rrect(1158, 836, 24, 16, 2));
      g.fillStyle = K.litc(M.clothRed, 1170, 844); g.fill(new Path2D('M1170 849 C1162 843 1164 838 1170 841 C1176 838 1178 843 1170 849Z'));
    },
  });
  const blinkT = Drawn.blinker(2, 4);
  const lidSpring = K.spring({ k: 70, d: 9 });
  const steam = [];
  layer({
    id: 'teapotLive', z: 39, spin: 0, sp: 0.15,
    hit: (x, y) => Math.hypot((x - TX) / 150, (y - 760) / 140) < 1 || (x > 1230 && x < 1340 && y > 680 && y < 860),
    onEnter() { lidSpring.v += 30; },
    update(dt, t, L) {
      this.sp = ease(this.sp, L.hovered ? (L.since > 1 ? 2.2 : 0.6) : 0.15, 1.2, dt);
      this.spin += this.sp * dt;
      K.springTo(lidSpring, L.hovered ? 1 : 0, dt);
      // steam from the spout, more while hovered
      if (Math.random() < dt * (L.hovered ? 9 : 1.5)) steam.push({ x: 1324, y: 686, vx: 8 + Math.random() * 6, vy: -18 - Math.random() * 10, age: 0, life: 2.4 + Math.random(), r: 4 });
      for (const s of steam) { s.age += dt; s.x += (s.vx + Drawn.wind(t, s.x) * 14) * dt; s.y += s.vy * dt; s.r += dt * 6; }
      while (steam.length && steam[0].age > steam[0].life) steam.shift();
    },
    draw(g, t, L) {
      const f = lampFlicker(t, 3) * (1 + L.hover * 0.15) * (K.pulse ? 1 + K.pulse.teapot : 1);
      holesLive(g, teaHoles, f * 1.05, [1, 0.84, 0.5], t, 3);
      g.fillStyle = K.css(K.fireAt(0.7 * f)); g.fill(teaWin.path);
      g.fillStyle = K.css(K.fireAt(0.66 * f)); g.fill(teaDoor.path);
      // a shadow moving behind the window now and then
      const pass = (t * 0.13) % 1;
      if (pass < 0.25) { g.save(); g.clip(teaWin.path); g.fillStyle = 'rgba(40,16,10,0.55)'; g.fill(ell(1070 + pass * 4 * 60, 746, 9, 16)); g.restore(); }
      // the dots of light the pierced walls throw on the terrace, turning with the lamp
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 30; i++) {
        const a = this.spin + (i / 30) * TAU, s = Math.sin(a);
        if (s < 0.05) continue;
        const ring = i % 3, R = 150 + ring * 34;
        const x = TX + Math.cos(a) * R, y = TB + 8 + s * (8 + ring * 6);
        if (x > 1240 && x < 1290) continue;
        K.glow(g, x, y, 10 + ring * 3, '#ffb868', 0.32 * f * s, 0.35);
      }
      g.globalCompositeOperation = 'source-over';
      // the lid, lifting on a spring, a mole peeking out from under it
      const lift = lidSpring.x * 22;
      if (lift > 1) {
        g.save(); g.beginPath(); g.rect(TX - 80, 560, 160, 638 - 560 + 2); g.clip();
        g.fillStyle = K.css(K.fireAt(0.6 * f)); g.fill(ell(TX, 632, 70, 7));
        const peek = K.smooth((L.since - 0.3) / 0.5) * (L.hovered ? 1 : 0);
        if (peek > 0.02) K.mole(g, TX + 26, 640 + (1 - peek) * 30, 0.7, { flip: true, hands: { f: [16, -16], b: [-10, -16] }, open: blinkT(t), look: [-0.5, -0.6], smile: 1.2, lx: 1112, ly: 630 });
        g.restore();
      }
      g.save(); g.translate(0, -lift); if (lift > 1) { g.translate(TX - 40, 632); g.rotate(-lidSpring.x * 0.08); g.translate(-(TX - 40), -632); }
      drawLid(g);
      g.restore();
      for (const s of steam) {
        const u = s.age / s.life;
        g.fillStyle = `rgba(190,180,180,${0.28 * (1 - u) * Math.min(1, s.age * 3)})`;
        g.fill(circ(s.x, s.y, s.r));
      }
    },
  });
  const knob = K.lathe(TX, [[8, 576], [12, 580], [14, 590], [20, 600]]);
  const lidS = potSprite(lid, { clay: M.terracotta, glaze: { col: M.glazeTeal, edge: 700, seed: 5 }, rings: false, seed: 6, lw: 2.2 }, (g) => {
    // knob: a little lookout with a slot window
    throwPot(g, knob, { clay: M.terracotta, glaze: { col: M.glazeTeal, edge: 700, seed: 2 }, rings: false, seed: 9, lw: 1.8 });
  });
  function drawLid(g) {
    Drawn.blit(g, lidS.sp);
    g.fillStyle = K.css(K.fireAt(0.62)); g.fill(ell(TX, 588, 2, 4));
  }

  // ------------------------------------------------------------------ the bowl house
  const BX = 1352, BB = 912;
  const bowl = K.lathe(BX, [[34, 812], [40, 816], [52, 822], [84, 840], [110, 866], [124, 892], [128, 906], [126, BB]]);
  const bowlHoles = piercings(bowl, [{ y: 850, n: 9, size: 3, shape: 'dot', from: 0.4, to: Math.PI - 0.4 }, { y: 872, n: 11, size: 4.2, shape: 'star', off: 0.5 }]);
  const bowlDoor = surfArch(bowl, Math.PI / 2 - 0.12, 34, 52, BB);
  layer({
    id: 'bowl', z: 40, still: true,
    draw(g) {
      throwPot(g, bowl, { skip: K.L.bowl, clay: M.clayPale, glaze: { col: M.glazeBlue, edge: 900, seed: 21 }, seed: 22 });
      // the foot ring on top, a parapet with a chimney pot behind it
      const ft = K.lathe(BX, [[36, 800], [38, 804], [40, 814]]);
      throwPot(g, ft, { clay: M.clayPale, rings: false, seed: 23, lw: 2 });
      const cp = K.lathe(BX - 14, [[7, 774], [8, 778], [9, 800]]);
      throwPot(g, cp, { clay: M.terracotta, rings: false, seed: 24, lw: 1.6 });
      holesStill(g, bowlHoles);
      g.fillStyle = '#1e0c06'; g.fill(bowlDoor.path); g.lineWidth = 2; g.strokeStyle = K.LINE; g.stroke(bowlDoor.path);
      // a bench by the door with a mug on it
      g.fillStyle = K.litc(M.wood, 1420, BB - 8); g.fill(rect(1404, BB - 12, 34, 4)); g.lineWidth = 1.2; g.strokeStyle = K.LINE; g.strokeRect(1404, BB - 12, 34, 4);
      g.fillRect(1407, BB - 8, 3, 8); g.fillRect(1432, BB - 8, 3, 8);
      g.fillStyle = K.litc(M.glazeCream, 1426, BB - 18); g.fill(rect(1422, BB - 20, 7, 8)); g.strokeRect(1422, BB - 20, 7, 8);
    },
  });
  const line = [0, 1, 2, 3].map((i) => K.pendulum({ len: 14 + i * 2, seed: i + 30, x: BX + i * 20, lean: 0.12, sway: 0.05 }));
  const blinkB = Drawn.blinker(2, 4);
  layer({
    id: 'bowlLive', z: 41,
    hit: (x, y) => Math.hypot((x - BX) / 130, (y - 868) / 60) < 1,
    onEnter() { line.forEach((p, i) => K.kick(p, (P.vx >= 0 ? 1 : -1) * (2 + i * 0.4))); },
    update(dt, t, L) { for (const p of line) K.swing(p, dt, t, L); },
    draw(g, t, L) {
      const f = lampFlicker(t, 4) * (K.pulse ? 1 + K.pulse.bowl : 1);
      holesLive(g, bowlHoles, f, [1, 0.8, 0.46], t, 4);
      const h = K.smooth(L.hover);
      g.save(); g.clip(bowlDoor.path);
      g.fillStyle = K.css(K.fireAt(0.66 * f)); g.fill(bowlDoor.path);
      if (h > 0.05) K.mole(g, BX + 2, BB + 2, 0.84, { hands: { f: [16, -30 + Math.sin(L.since * 8) * 3 * K.bell(Math.min(1, L.since))], b: [-12, -18] }, open: blinkB(t), smile: 1.4, apron: M.clothGreen, lean: -0.15 * (1 - h) });
      g.restore();
      // the door, swinging in
      const [hx, hy] = bowlDoor.at(17, BB);
      g.save(); g.translate(hx, hy); g.transform(-(1 - h * 0.85), 0, 0, 1, 0, 0);
      const dp = K.rrect(0, -52, 34, 52, 16);
      g.fillStyle = K.litc(M.wood, BX, BB - 26, [0, 0, 1]); g.fill(dp); g.lineWidth = 1.5; g.strokeStyle = K.LINE; g.stroke(dp);
      g.lineWidth = 0.8; for (const x of [11, 22]) { g.beginPath(); g.moveTo(x, -50); g.lineTo(x, 0); g.stroke(); }
      g.fillStyle = '#c8a050'; g.fill(circ(28, -24, 1.6));
      g.restore();
      // the washing line on the foot ring: aprons and a sock
      const y0 = 812, x0 = BX + 30, x1 = BX + 112;
      g.lineWidth = 0.8; g.strokeStyle = '#8a7a6a'; g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2, y0 + 10, x1, y0 + 20); g.stroke();
      g.lineWidth = 1.4; g.strokeStyle = K.LINE; g.beginPath(); g.moveTo(x1, y0 + 20); g.lineTo(x1, BB - 30); g.stroke();
      const cl = [M.clothRed, M.cloth, M.clothBlue, M.cloth];
      line.forEach((p, i) => {
        const u = (i + 0.7) / 4.4, x = lerp(x0, x1, u), y = y0 + 10 * 4 * u * (1 - u) + 20 * u * u;
        g.save(); g.translate(x, y); g.rotate(p.a);
        const w = i === 3 ? 6 : 12, hh = i === 3 ? 12 : 16;
        const cp = curve([[-w / 2, 0], [w / 2, 0], [w / 2 + 1, hh * 0.6], [w / 2 - 1, hh], [-w / 2 + 1, hh], [-w / 2 - 1, hh * 0.6]]);
        g.fillStyle = K.litc(cl[i], x, y + 8, [0, 0, 1]); g.fill(cp); g.lineWidth = 1.1; g.strokeStyle = K.LINE; g.stroke(cp);
        g.restore();
      });
    },
  });

  // ------------------------------------------------------------------ the jar stack on the knoll
  const JX = 1470;
  const jarLo = K.lathe(JX, [[26, 690], [30, 696], [46, 716], [54, 744], [52, 770], [44, 788]]);
  const jarHi = K.lathe(JX, [[16, 630], [19, 634], [30, 648], [36, 668], [32, 684], [26, 692]]);
  const jarHolesLo = piercings(jarLo, [{ y: 730, n: 7, size: 3.2, shape: 'star' }, { y: 756, n: 8, size: 2.4, shape: 'dot', off: 0.5 }]);
  const jarHolesHi = piercings(jarHi, [{ y: 662, n: 6, size: 2.6, shape: 'moon' }]);
  const wob = K.spring({ k: 50, d: 3.2 });
  const jarLoS = potSprite(jarLo, { skip: K.L.jar, clay: M.clay, glaze: { col: M.glazeOx, edge: 728, seed: 31 }, seed: 32 }, (g) => holesStill(g, jarHolesLo));
  const jarHiS = potSprite(jarHi, { skip: K.L.jar, clay: M.clay, glaze: { col: M.glazeCream, edge: 676, seed: 33 }, seed: 34, lw: 2 }, (g) => { rim(g, jarHi, M.clay, 1.8); holesStill(g, jarHolesHi); });
  layer({
    id: 'jarLive', z: 36,
    hit: (x, y) => Math.abs(x - JX) < 60 && y > 610 && y < 792,
    onEnter() { wob.v += (P.vx >= 0 ? 1 : -1) * 1.6; },
    update(dt, t, L) { K.springTo(wob, 0, dt); },
    draw(g, t, L) {
      const f = lampFlicker(t, 5) * (K.pulse ? 1 + K.pulse.jar : 1);
      const a = wob.x * 0.12;
      g.save(); g.translate(JX, 788); g.rotate(a * 0.4); g.translate(-JX, -788);
      Drawn.blit(g, jarLoS.sp);
      holesLive(g, jarHolesLo, f, [1, 0.8, 0.46], t, 5);
      g.translate(JX, 692); g.rotate(a); g.translate(-JX, -692);
      Drawn.blit(g, jarHiS.sp);
      holesLive(g, jarHolesHi, f, [1, 0.8, 0.46], t, 6);
      // a mole on the very top, sitting with its feet over the rim, holding a little lamp
      const grab = clamp(Math.abs(wob.x) * 2, 0, 1);
      K.mole(g, JX - 2, 634, 0.5, { flip: true, hands: grab > 0.2 ? { f: [12, -4], b: [-12, -4] } : { f: [16, -18], b: [-8, -14] }, open: 1, mouth: grab > 0.3 ? 0.5 : 0, lean: -a * 2, lx: JX, ly: 700 });
      g.restore();
    },
  });

  // ------------------------------------------------------------------ the broken-pot workshop
  const WX = 884, WB = 934;
  const shop = K.lathe(WX, [[62, 756], [70, 762], [92, 786], [108, 830], [112, 878], [106, 916], [100, WB]]);
  // the jagged break across its front, and the inside wall seen through it
  const breakPts = [[804, WB - 2], [808, 900], [802, 870], [816, 842], [826, 812], [846, 800], [862, 784], [884, 792], [904, 778], [924, 796], [946, 806], [958, 832], [970, 860], [962, 890], [968, WB - 2]];
  const breakP = curve(breakPts, true);
  layer({
    id: 'shop', z: 42, still: true,
    draw(g) {
      throwPot(g, shop, { skip: K.L.shop, clay: M.clay, glaze: { col: M.glazeCream, edge: 818, seed: 41 }, seed: 42 });
      rim(g, shop, M.clay);
      // inside: the far wall of the jar, curving round, lit by the lamp
      g.save(); g.clip(breakP);
      g.fillStyle = radial(g, 884, 822, 6, 130, [[0, '#d89a5a'], [0.35, '#a8643a'], [0.75, '#5a2e1e'], [1, '#2a1410']]);
      g.fill(breakP);
      // inner throwing rings, curving the other way (we see the inside of the far wall)
      for (let y = 790; y < WB; y += 9) { const w = shop.halfW(y) - 6; g.beginPath(); g.ellipse(WX, y, w, Math.abs(K.rimRy(y, w)) + 0.01, 0, Math.PI, TAU); g.lineWidth = 0.9; g.strokeStyle = 'rgba(60,30,20,0.25)'; g.stroke(); }
      // shelves of greenware on the back wall
      for (const [sy, n] of [[836, 5], [868, 4]]) {
        g.fillStyle = K.litc(M.woodPale, 884, sy); g.fillRect(822, sy, 124, 4);
        g.lineWidth = 1; g.strokeStyle = K.LINE; g.strokeRect(822, sy, 124, 4);
        const r = rng(sy);
        for (let i = 0; i < n; i++) {
          const px = 832 + i * (110 / n) + r() * 6, h = 10 + r() * 10, w = 5 + r() * 4;
          const p = curve([[px - w * 0.5, sy], [px - w, sy - h * 0.5], [px - w * 0.5, sy - h], [px + w * 0.5, sy - h], [px + w, sy - h * 0.5], [px + w * 0.5, sy]]);
          g.fillStyle = K.litc(r() < 0.5 ? M.clayPale : M.slip, px, sy - h / 2, [0, 0, 1]); g.fill(p); g.lineWidth = 0.9; g.stroke(p);
        }
      }
      // floor
      g.fillStyle = K.litc(M.clayDark, 884, 925); g.fill(ell(884, 928, 80, 10));
      g.restore();
      // the break: a thick broken edge showing the wall's thickness, lit on its upper faces
      g.lineWidth = 6; g.strokeStyle = K.litc(M.clayDark, 884, 820); g.stroke(breakP);
      g.lineWidth = 2; g.strokeStyle = K.css(K.lit('#f0c890', 884, 800), 0.8);
      g.stroke(curve(breakPts.slice(2, 13), false));
      g.lineWidth = 2.2; g.strokeStyle = K.LINE; g.stroke(breakP);
      // a crack running on from the break
      g.lineWidth = 1.2; g.strokeStyle = K.LINE; g.beginPath(); g.moveTo(946, 806); g.lineTo(958, 790); g.lineTo(956, 776); g.lineTo(966, 766); g.stroke();
      // sherds of the broken piece at its foot
      const r = rng(4);
      for (let i = 0; i < 6; i++) { const x = 800 + r() * 170, y = WB + 2 + r() * 10; const p = poly([[x, y], [x + 8 + r() * 8, y - 3], [x + 12, y + 3], [x + 2, y + 5]]); g.fillStyle = K.litc(r() < 0.5 ? M.glazeCream : M.clay, x, y); g.fill(p); g.lineWidth = 1; g.strokeStyle = K.LINE; g.stroke(p); }
    },
  });
  const wheel = { rpm: 1, h: 0, slump: 0 };
  const potterAct = K.actor(51, [['kick', 1.6], ['sponge', 1.8], ['look', 1.4]], [1.5, 4]);
  const blinkW = Drawn.blinker(2, 4);
  layer({
    id: 'shopLive', z: 43,
    hit: (x, y) => Math.hypot((x - WX) / 100, (y - 860) / 90) < 1,
    update(dt, t, L) {
      potterAct.step(dt);
      // hovering raises the pot; staying too long overworks it and it slumps
      if (L.hovered) {
        if (L.since < 3.2) wheel.h = ease(wheel.h, 1, 0.9, dt);
        else wheel.slump = ease(wheel.slump, 1, 5, dt);
      } else { wheel.h = ease(wheel.h, 0, 0.5, dt); if (wheel.h < 0.08) wheel.slump = ease(wheel.slump, 0, 3, dt); }
      wheel.rpm = ease(wheel.rpm, L.hovered && wheel.slump < 0.5 ? 2.4 : 1, 2, dt);
      wheel.a = (wheel.a || 0) + wheel.rpm * dt * 6;
    },
    draw(g, t, L) {
      const f = lampFlicker(t, 6) * (K.pulse ? 1 + K.pulse.shop : 1);
      g.save(); g.clip(breakP);
      // the hanging lamp swinging a little
      const sw = Math.sin(t * 1.1) * 0.05;
      const lx = 884 + Math.sin(sw) * 40, ly = 806 + 4;
      g.lineWidth = 0.8; g.strokeStyle = '#3a2a24'; g.beginPath(); g.moveTo(884, 770); g.lineTo(lx, ly - 6); g.stroke();
      g.fillStyle = K.css(K.fireAt(0.84 * f)); g.fill(ell(lx, ly, 5, 6));
      g.globalCompositeOperation = 'lighter'; K.glow(g, lx, ly, 70, '#ffb050', 0.35 * f); g.globalCompositeOperation = 'source-over';
      // the kick wheel, and the pot on it
      const wx = 900, wy = 912;
      g.fillStyle = K.litc(M.woodDark, wx, wy + 8); g.fill(ell(wx, wy + 10, 26, 4)); g.lineWidth = 1.2; g.strokeStyle = K.LINE; g.stroke(ell(wx, wy + 10, 26, 4));
      g.fillRect(wx - 2, wy - 2, 4, 12);
      g.fillStyle = K.litc(M.wood, wx, wy - 2, [0, -1, 0.4]); g.fill(ell(wx, wy - 2, 16, 3)); g.stroke(ell(wx, wy - 2, 16, 3));
      // spokes going round
      g.lineWidth = 0.8; for (let k = 0; k < 4; k++) { const a = wheel.a + k * Math.PI / 2; g.beginPath(); g.moveTo(wx, wy + 10); g.lineTo(wx + Math.cos(a) * 24, wy + 10 + Math.sin(a) * 3.6); g.stroke(); }
      const ph = 14 + wheel.h * 26, sl = wheel.slump;
      const top = wy - 4 - ph * (1 - sl * 0.55), lean = sl * 9;
      const pp = curve([[wx - 9, wy - 3], [wx - 10, wy - 3 - ph * 0.4], [wx - 6 + lean * 0.5, (wy - 3 + top) / 2 - 2], [wx - 6 + lean, top], [wx + 6 + lean, top + sl * 4], [wx + 6 + lean * 0.5, (wy - 3 + top) / 2], [wx + 10, wy - 3 - ph * 0.4], [wx + 9, wy - 3]]);
      g.fillStyle = K.litc('#9a6a4a', wx, wy - 20, [0, 0, 1], 0.4); g.fill(pp); g.lineWidth = 1.2; g.strokeStyle = K.LINE; g.stroke(pp);
      // the spinning wet sheen
      const sh = (wheel.a * 0.6) % 1;
      g.save(); g.clip(pp); g.fillStyle = 'rgba(255,220,180,0.28)'; g.fillRect(wx - 9 + sh * 14, top, 3, ph + 4); g.restore();
      // the potter on a stool, hands on the clay
      const k = potterAct.is('kick'), sp = potterAct.is('sponge'), lk = potterAct.is('look');
      const sigh = sl > 0.5 ? 1 : 0;
      g.fillStyle = K.litc(M.wood, 852, 920); g.fillRect(842, 914, 20, 4); g.fillRect(844, 918, 3, 12); g.fillRect(857, 918, 3, 12);
      const handY = top + ph * 0.35 + (sp >= 0 ? Math.sin(sp * TAU * 2) * 4 : 0);
      K.mole(g, 852, 916, 0.84, {
        hands: sigh ? { f: [20, -12], b: [14, -10] } : { f: [(wx - 852) / 0.84 - 8 + lean / 0.84, (handY - 916) / 0.84], b: [(wx - 852) / 0.84 - 18, (handY - 912) / 0.84] },
        open: sigh ? 0.25 : blinkW(t), look: lk >= 0 ? [-1, -0.5] : [0.6, 0.6], apron: M.clothBlue, smile: sigh ? -0.6 : 0.8,
        lean: sigh ? 0.22 : 0.08 + (k >= 0 ? Math.sin(k * TAU * 2) * 0.03 : 0), lx: 884, ly: 880,
      });
      g.restore();
    },
  });

  // ------------------------------------------------------------------ heat pipe
  // clay pipe from the kiln's right flank, over the workshop, to the teapot
  const pipePts = [[742, 760], [790, 752], [840, 746], [884, 744], [940, 742], [990, 744]];
  layer({
    id: 'pipe', z: 33, still: true,
    draw(g) {
      const p = curve(pipePts, false);
      // a forked post holding it up between the kiln and the workshop
      Drawn.tube(g, Drawn.seg(784, 756, 788, 904), K.litc(M.woodDark, 786, 850, [-0.5, 0, 0.8]), 5, 1.5);
      Drawn.tube(g, Drawn.seg(786, 770, 774, 752), K.litc(M.woodDark, 786, 760), 3, 1.2);
      Drawn.tube(g, Drawn.seg(786, 770, 798, 750), K.litc(M.woodDark, 786, 760), 3, 1.2);
      g.lineCap = 'butt';
      g.lineWidth = 17; g.strokeStyle = K.LINE; g.stroke(p);
      g.lineWidth = 13; g.strokeStyle = K.litc(M.terracotta, 860, 740, [0, -0.5, 0.8]); g.stroke(p);
      g.lineWidth = 3; g.strokeStyle = K.css(K.lit('#f0b080', 860, 740), 0.5); g.stroke(curve(pipePts.map(([x, y]) => [x, y - 3]), false));
      // collars where sections join, and posts holding it up
      for (let i = 1; i < pipePts.length - 1; i++) {
        const [x, y] = pipePts[i];
        g.fillStyle = K.litc(M.clayDark, x, y); g.fill(K.rrect(x - 5, y - 10, 10, 20, 2)); g.lineWidth = 1.4; g.strokeStyle = K.LINE; g.stroke(K.rrect(x - 5, y - 10, 10, 20, 2));
      }
    },
  });
  K.pulse = { jug: 0, lantern: 0, teapot: 0, bowl: 0, jar: 0, shop: 0 };
  layer({
    id: 'pipeLive', z: 44, u: -1,
    hit: (x, y) => x > 740 && x < 1000 && Math.abs(y - (752 - (x - 740) * 0.035)) < 14,
    onEnter() { if (this.u < 0) this.u = 0; },
    update(dt, t, L) {
      for (const k in K.pulse) K.pulse[k] = ease(K.pulse[k], 0, 1.4, dt);
      if (this.u >= 0) {
        this.u += dt / 1.6;
        if (this.u > 0.55 && this.u - dt / 1.6 <= 0.55) K.pulse.shop = 0.5;
        if (this.u > 0.98 && !this.hitT) { this.hitT = true; K.pulse.teapot = 0.6; }
        if (this.u > 1.4) { this.u = -1; this.hitT = false; }
      }
    },
    draw(g, t) {
      g.globalCompositeOperation = 'lighter';
      // joints breathe with the fire
      for (let i = 1; i < pipePts.length - 1; i++) K.glow(g, pipePts[i][0], pipePts[i][1], 10, '#ff7030', 0.25 * K.fire.level * (0.7 + 0.3 * Math.sin(t * 2 + i)));
      if (this.u >= 0 && this.u <= 1) {
        const i = this.u * (pipePts.length - 1), k = Math.floor(i), fr = i - k;
        const a = pipePts[k], b = pipePts[Math.min(k + 1, pipePts.length - 1)];
        K.glow(g, lerp(a[0], b[0], fr), lerp(a[1], b[1], fr), 30, '#ff9040', 0.7 * K.bell(this.u));
      }
      g.globalCompositeOperation = 'source-over';
    },
  });
})();
