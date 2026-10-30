/* far.js — the far side of the puddle, a hand's breadth away and so, at this scale, huge and out
   of focus: a low bank of moss, giant grass blades leaning into the storm, and bokeh — far drops
   on far grass catching the sun. Nothing here has an ink line; it's all soft and hazed toward the
   sky. The giant blades sway with the shared wind; the bokeh shimmers when they do.

   Hover the far grass: a gust. It leans, the rain curtains sweep sideways, the whole scene
   gets windy for a moment.

   far-bank z4 (still) · giants z4.5 · bokeh z5 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, st, P, layer, onLayout } = Drawn;
  const { C, SUN, HZ, FAR } = DH;

  // the far bank's top edge
  const bankTop = (x) => {
    const d = (x - SUN.x) / 900;
    return FAR - 16 - 40 * Math.max(0, -d - 0.45) * 2.2 - 26 * Math.max(0, d - 0.55) * 2 + 6 * noise(x * 0.02) + 3 * noise(x * 0.09);
  };

  function paintBank(g, v) {
    const x0 = v.x0 - 20, x1 = v.x1 + 20;
    const p = new Path2D();
    p.moveTo(x0, FAR + 2);
    for (let x = x0; x <= x1; x += 8) p.lineTo(x, bankTop(x));
    p.lineTo(x1, FAR + 2); p.closePath();
    g.fillStyle = grad(g, 0, 620, 0, FAR, [[0, '#4a3858'], [1, '#2a2238']]);
    g.fill(p);
    // the backlit tops of far moss: soft gold fringes, brightest by the sun
    const r = rng(5);
    for (let x = x0; x <= x1; x += 6 + r() * 8) {
      const y = bankTop(x), near = clamp(1 - Math.abs(x - SUN.x) / 650, 0, 1);
      const rr = 5 + r() * 9;
      g.fillStyle = `rgba(${lerp(110, 255, near) | 0},${lerp(80, 200, near) | 0},${lerp(110, 120, near) | 0},${0.18 + near * 0.5})`;
      g.fill(ell(x, y + 2, rr, rr * 0.55));
      g.fillStyle = `rgba(42,34,56,${0.7 - near * 0.2})`;
      g.fill(ell(x + (r() - 0.5) * 4, y + 6, rr * 0.9, rr * 0.5));
    }
    // a wet line at the waterline
    g.fillStyle = 'rgba(255,214,150,0.25)';
    g.fillRect(x0, FAR - 1.5, x1 - x0, 1.5);
  }
  DH.paintBank = paintBank;

  layer({ id: 'far-bank', z: 4, still: true, draw(g) { paintBank(g, st.view); } });

  // ------------------------------------------------------------ giant grass, soft and leaning
  const giants = [];
  onLayout(() => {
    giants.length = 0;
    const v = st.view;
    // a few broad blades arching over, out of focus and hazed toward the sky
    // [x, height, width, bend]: a hedge of broad far leaves and a couple of tall blades, low on the bank
    const spec = [[-260, 520, 70, 160], [-120, 300, 90, -60], [40, 380, 60, 120], [150, 220, 80, -40], [420, 160, 60, 50], [1060, 150, 60, -40], [1230, 260, 80, 60], [1420, 340, 70, -90], [1600, 260, 90, 60], [1760, 460, 70, -150], [1900, 300, 90, 40]];
    for (const [x, h, w, bend] of spec) {
      if (x < v.x0 - 400 || x > v.x1 + 400) continue;
      giants.push({ x, h, w, bend, ph: x * 0.01, near: clamp(1 - Math.abs(x - SUN.x) / 900, 0, 1) });
    }
  });
  const gust = { v: 0 };

  function giantPath(G, t) {
    const sway = (Drawn.wind(t, G.x) - 0.6) * 22 + Math.sin(t * 0.5 + G.ph) * 5 + gust.v * 50;
    const base = bankTop(G.x) + 14;
    // centreline: up, then arching over so the tip hangs lower than the crest
    const p0 = [G.x, base], p1 = [G.x + G.bend * 0.3, base - G.h * 0.95], p2 = [G.x + G.bend + sway, base - G.h * 0.85 + Math.abs(sway) * 0.2];
    const at = (u) => [(1 - u) ** 2 * p0[0] + 2 * u * (1 - u) * p1[0] + u * u * p2[0], (1 - u) ** 2 * p0[1] + 2 * u * (1 - u) * p1[1] + u * u * p2[1]];
    const L = [], R = [], n = 14;
    for (let i = 0; i <= n; i++) {
      const u = i / n, [x, y] = at(u), [x2, y2] = at(Math.min(1, u + 0.02));
      // broad leaves: widest a third of the way up, pointed at the tip
      const dx = x2 - x, dy = y2 - y, l = Math.hypot(dx, dy) || 1, w = G.w * Math.sin(Math.min(1, u * 1.4 + 0.08) * Math.PI) ** 0.7 * (1 - u * 0.5) / 2;
      L.push([x - (dy / l) * w, y + (dx / l) * w]); R.push([x + (dy / l) * w, y - (dx / l) * w]);
    }
    return { p: curve([...L, ...R.reverse()]), at };
  }

  layer({
    id: 'giants', z: 4.5,
    hit(x, y) {
      for (const G of giants) {
        const { at } = giantPath(G, st.t);
        for (let u = 0.1; u <= 1; u += 0.06) { const [px, py] = at(u); if (Math.hypot(x - px, y - py) < G.w * 0.7 + 10) return true; }
      }
      return false;
    },
    onEnter() { gust.kick = 1; },
    update(dt, t, L) {
      if (gust.kick) { gust.kick = 0; gust.target = 1; }
      gust.target = L.hovered ? 1 : Math.max(0, (gust.target || 0) - dt * 0.8);
      gust.v = ease(gust.v, gust.target, 2.2, dt);
      Drawn.breeze.extra = gust.v * 0.9;
    },
    draw(g, t) {
      for (const G of giants) {
        const { p } = giantPath(G, t);
        const a = G.near;
        // hazed toward the sky: violet-grey, lifting to mauve near the sun
        const col = `${lerp(50, 104, a) | 0},${lerp(44, 66, a) | 0},${lerp(74, 92, a) | 0}`;
        // soft: three widening skins under the body, no line
        for (const [w, al] of [[14, 0.12], [8, 0.2], [3, 0.35]]) { g.lineWidth = w; g.strokeStyle = `rgba(${col},${al})`; g.stroke(p); }
        g.fillStyle = `rgba(${col},0.78)`; g.fill(p);
        DH.crescent(g, p, a > 0.25 ? 'rgba(255,196,130,0.55)' : 'rgba(150,130,175,0.4)', -DH.sunSide(G.x) * 5, 3, 0.6 + a * 0.4);
        // a beaded midrib, out of focus: blurry bright dots
        const { at } = giantPath(G, t);
        g.save(); g.globalCompositeOperation = 'lighter';
        for (let u = 0.25; u < 0.95; u += 0.11) { const [bx, by] = at(u); g.fillStyle = `rgba(255,210,160,${0.05 + a * 0.12})`; g.fill(circ(bx, by, 5 + G.w * 0.08)); }
        g.restore();
      }
    },
  });
  DH.gust = gust;

  // ------------------------------------------------------------ bokeh
  const bokeh = [];
  onLayout(() => {
    bokeh.length = 0;
    const r = rng(77), v = st.view;
    for (let i = 0; i < 46; i++) {
      const x = lerp(v.x0, v.x1, r()), y = 480 + r() * 240;
      const near = clamp(1 - Math.hypot(x - SUN.x, (y - SUN.y) * 2) / 900, 0, 1);
      if (near < 0.05 && r() < 0.7) continue;
      bokeh.push({ x, y, r: 4 + r() * 16 * (0.4 + near), near, ph: r() * TAU, sp: 0.6 + r() * 1.4 });
    }
  });
  layer({
    id: 'bokeh', z: 5,
    draw(g, t) {
      g.save(); g.globalCompositeOperation = 'lighter';
      for (const b of bokeh) {
        const tw = 0.55 + 0.45 * Math.sin(t * b.sp + b.ph + gust.v * 6);
        const a = (0.06 + b.near * 0.2) * tw * (1 + DH.storm.sun * 0.8);
        g.fillStyle = `rgba(255,${lerp(170, 220, b.near) | 0},${lerp(120, 160, b.near) | 0},${a})`;
        g.fill(circ(b.x, b.y, b.r));
        g.lineWidth = 1.2; g.strokeStyle = `rgba(255,230,180,${a * 1.2})`; g.stroke(circ(b.x, b.y, b.r * 0.95));
      }
      g.restore();
    },
  });

  DH.bankTop = bankTop;
})();
