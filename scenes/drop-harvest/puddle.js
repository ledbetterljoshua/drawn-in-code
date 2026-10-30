/* puddle.js — the water. It mirrors the storm, the rift, the far bank and the island (each about
   its own waterline), broken into wavering strips by the rain; a glitter path runs down from the
   sun's reflection; every drop that lands leaves a ring, flattened more the nearer it is to the
   horizon. The water body darkens toward us (we see into it, not off it).

   Hover the water: rings spread from the pointer and the reflection wobbles under it.

   puddle z8 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, hash, circ, ell, poly, curve, grad, radial, ink, st, P, layer, onLayout, sprite } = Drawn;
  const { C, SUN, HZ, FAR, SHORE } = DH;

  // other parts add what the water should mirror: { axis, draw(g, v) }
  DH.mirrors = [];
  DH.mirror = (axis, draw) => DH.mirrors.push({ axis, draw });
  DH.mirror(HZ, (g, v) => DH.paintSky(g, { x0: v.x0, x1: v.x1, y0: HZ - (v.y1 - HZ) - 40 }));
  DH.mirror(FAR, (g, v) => DH.paintBank(g, v));

  // three reflections, drawn strip by strip with the same waver: the sky (opaque), the clouds
  // (live, at half resolution), and everything standing in the water (transparent around it)
  let sky = null, obj = null, cl = null;
  const waterBody = (g, v, alphaK = 1) => grad(g, 0, FAR, 0, Math.max(v.y1, 1300), [[0, `rgba(46,40,78,${0.16 * alphaK})`], [0.15, `rgba(38,34,68,${0.4 * alphaK})`], [0.45, `rgba(30,28,56,${0.6 * alphaK})`], [1, `rgba(20,18,38,${0.85 * alphaK})`]]);
  onLayout(() => {
    const v = st.view;
    const x0 = v.x0 - 30, w = v.x1 - v.x0 + 60, y0 = FAR - 2, h = v.y1 - y0 + 10;
    const mirrorInto = (g, list, darken) => {
      g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
      for (const m of list) {
        g.save();
        if (m.axis > FAR + 2) { g.beginPath(); g.rect(x0, m.axis - 1, w, h); g.clip(); }
        g.translate(0, 2 * m.axis); g.scale(1, -1);
        m.draw(g, v);
        g.restore();
      }
      g.globalCompositeOperation = darken ? 'source-atop' : 'source-over';
      if (darken) {
        g.fillStyle = 'rgba(14,10,28,0.5)'; g.fillRect(x0, y0, w, h);
        // the rain breaks it into dashes: thin bright and dark streaks across the mirrored shapes
        const rr = Drawn.rng(17);
        for (let yy = DH.SHORE; yy < y0 + h; yy += 3 + rr() * 5) {
          const xx = x0 + rr() * w, L = 20 + rr() * 120;
          g.fillStyle = rr() < 0.5 ? 'rgba(10,8,24,0.5)' : 'rgba(190,170,210,0.12)';
          g.fillRect(xx, yy, L, 1 + rr() * 1.5);
        }
      }
      g.fillStyle = waterBody(g, v); g.fillRect(x0, y0, w, h);
      g.restore();
    };
    sky = sprite(x0, y0, w, h, (g) => mirrorInto(g, DH.mirrors.filter((m) => m.axis <= FAR + 2), false));
    obj = sprite(x0, y0, w, h, (g) => mirrorInto(g, DH.mirrors.filter((m) => m.axis > FAR + 2), true));
    const c = document.createElement('canvas'), k = 0.5;
    c.width = Math.ceil(w * st.R * k); c.height = Math.ceil(h * st.R * k);
    cl = { c, g: c.getContext('2d'), x0, y0, w, h, k };
  });

  function paintClouds(t) {
    const { g, c, x0, y0, k } = cl, v = st.view;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(sky.c, 0, 0, c.width, c.height);
    g.setTransform(st.R * k, 0, 0, st.R * k, -x0 * st.R * k, -y0 * st.R * k);
    g.save();
    g.beginPath(); g.rect(x0, FAR + 6, cl.w, cl.h); g.clip();
    g.translate(0, 2 * HZ); g.scale(1, -1);
    g.globalAlpha = 0.55;
    for (const m of DH.masses) if (2 * HZ - m.y < v.y1 + 300) Drawn.blit(g, m.sp, m.x, m.y);
    g.restore();
  }

  // floating things: petals shed by the foxglove, seeds, a few rain bubbles that drift and pop
  const floats = [];
  onLayout(() => {
    floats.length = 0;
    const r = Drawn.rng(808), v = st.view;
    const nF = 7 + Math.round(Math.max(0, v.y1 - 1250) / 120);
    for (let i = 0; i < nF; i++) floats.push({ kind: r() < 0.5 ? 'petal' : 'seed', x: lerp(v.x0, v.x1, r()), y: lerp(FAR + 30, v.y1 - 40, r() ** 0.8), a: r() * TAU, s: 0.7 + r() * 0.6, ph: r() * TAU });
  });
  const bubbles = [];

  const stir = { x: 0, y: 0, a: 0, next: 0 };

  layer({
    id: 'puddle', z: 8,
    hit: (x, y) => y > FAR + 4,
    onEnter() { stir.next = 0; },
    update(dt, t, L) {
      stir.a = ease(stir.a, L.hovered ? 1 : 0, 3, dt);
      if (L.hovered) {
        stir.x = P.x; stir.y = P.y;
        if ((stir.next -= dt) <= 0) { stir.next = 0.32 + Math.random() * 0.2; DH.spawn({ kind: 'ring', x: P.x + (Math.random() - 0.5) * 6, y: P.y, r: 5 + P.sp * 0.004, k: DH.persp(P.y), life: 1.6, g: 0, z: 'water' }); }
      }
      const v = st.view;
      for (const f of floats) {
        const w = Drawn.wind(t, f.x), d = clamp((f.y - FAR) / 500, 0.2, 1.4);
        f.x += (w * 7 + Math.sin(t * 0.3 + f.ph) * 2) * dt * d;
        f.a += Math.sin(t * 0.4 + f.ph) * 0.1 * dt;
        if (f.x > v.x1 + 40) f.x = v.x0 - 40;
        if (f.x > 850 && f.x < 1690 && f.y < 830) f.y += 40; // nudged off the island's shore
      }
      // heavy rain raises bubbles that ride the surface a while
      if (Math.random() < dt * 3 * DH.storm.I && bubbles.length < 26) {
        const y = lerp(FAR + 40, v.y1 - 30, Math.random() ** 0.7);
        let x = lerp(v.x0, v.x1, Math.random());
        if (!(x > 850 && x < 1690 && y < SHORE + 10)) bubbles.push({ x, y, r: (1.6 + Math.random() * 3) * (0.5 + (y - FAR) / 500), age: 0, life: 2 + Math.random() * 5 });
      }
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i]; b.age += dt; b.x += Drawn.wind(t, b.x) * 5 * dt;
        if (b.age > b.life) { DH.spawn({ kind: 'ring', x: b.x, y: b.y, r: b.r * 0.6, k: DH.persp(b.y), life: 0.6, g: 0, z: 'water' }); bubbles.splice(i, 1); }
      }
    },
    draw(g, t) {
      const v = st.view;
      if (!sky) return;
      paintClouds(t);
      const R = st.R;
      const I = DH.intensity(t);
      // strips: thin near the horizon (fine chop), thicker toward us
      let y = FAR;
      while (y < v.y1) {
        const d = y - FAR;
        const h = 2.4 + Math.min(7, d * 0.014);
        const amp = (0.7 + d * 0.007) * (0.7 + I * 0.4) * (1 + DH.gust.v * 1.5);
        let off = noise(y * 0.21 + t * 2.3) * amp + Math.sin(y * 0.7 + t * 5) * amp * 0.35;
        if (stir.a > 0.01) { const q = Math.exp(-((y - stir.y) ** 2) / 1800); off += Math.sin(y * 0.5 - t * 9) * 6 * stir.a * q; }
        const sy = (y - sky.y0) * R, sh = h * R;
        if (sy + sh > sky.c.height) break;
        g.drawImage(cl.c, 0, sy * cl.k, cl.c.width, sh * cl.k, cl.x0 + off, y, cl.w, h + 0.4);
        g.drawImage(obj.c, 0, sy, obj.c.width, sh, obj.x0 + off * 1.3, y, obj.w, h + 0.4);
        y += h;
      }
      // cat's-paws: gusts ruffling dark patches across the water
      const gst = Math.max(0, Drawn.wind(t, 600) - 0.9) + DH.gust.v;
      if (gst > 0.02) {
        g.save();
        for (let i = 0; i < 5; i++) {
          const px = ((t * 60 + i * 430) % (v.x1 - v.x0 + 600)) + v.x0 - 300, py = FAR + 30 + ((i * 97) % 300);
          const rx = 120 + i * 30, ry = rx * DH.persp(py) * 0.8;
          g.fillStyle = `rgba(14,12,30,${Math.min(0.3, gst * 0.35)})`;
          g.fill(ell(px, py, rx, ry));
          g.strokeStyle = `rgba(200,190,230,${Math.min(0.25, gst * 0.3)})`; g.lineWidth = 0.8;
          for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(px - rx * 0.7 + k * 9, py + k * ry * 0.2); g.lineTo(px - rx * 0.2 + k * 9, py + k * ry * 0.2); g.stroke(); }
        }
        g.restore();
      }
      // glitter: the sun broken into dashes down the water toward us
      const gy0 = 2 * HZ - SUN.y - 8;
      g.save(); g.globalCompositeOperation = 'lighter';
      const sun = 1 + DH.storm.sun * 0.9;
      // broken, tapering sparkle: dense and bright near the horizon, scattered and thin toward us
      for (let i = 0; i < 170; i++) {
        const u = i / 170, yy = gy0 + u ** 1.6 * (Math.min(v.y1, 1500) - gy0);
        const spread = 10 + u * 110 * sun;
        const seed = Math.floor(t * (5 + (i % 3)) + i * 3.7);
        const xx = SUN.x + (hash(seed) - 0.5) * 2 * spread * (0.3 + hash(seed + 1) * 0.7);
        if (xx > 852 && yy < 820) continue;
        const len = (3 + hash(seed + 2) * 16) * (0.5 + u * 0.8) * (1 - u * 0.4);
        const a = (1 - u) ** 1.6 * 0.9 * (hash(seed + 3) < 0.35 ? 0.15 : 0.5 + hash(seed + 3) * 0.5) * sun;
        g.fillStyle = `rgba(255,${210 + hash(i) * 40 | 0},150,${a})`;
        g.fillRect(xx - len / 2, yy, len, 0.8 + u * 1.6);
      }
      // a warm swell of the reflected rift right under the far bank
      g.fillStyle = radial(g, SUN.x, gy0, 0, 300, [[0, `rgba(255,214,150,${0.3 * sun})`], [1, 'rgba(255,190,120,0)']]);
      g.save(); g.translate(SUN.x, gy0); g.scale(2.6, 0.5); g.translate(-SUN.x, -gy0); g.fill(circ(SUN.x, gy0, 300)); g.restore();

      g.restore();

      // rings from the rain
      for (const p of DH.fx) {
        if (p.kind !== 'ring' || p.z !== 'water') continue;
        const k = p.age / p.life, rx = p.r * (1.5 + k * 9) + k * 8, ry = rx * p.k;
        const near = clamp(1 - Math.abs(p.x - SUN.x) / 260, 0, 1) * (p.y < 1050 ? 1 : 0.5);
        const a = (1 - k) * (1 - k) * 0.6;
        g.lineWidth = 0.8 + p.r * 0.12;
        g.strokeStyle = near > 0.1 ? `rgba(255,220,150,${a * (0.5 + near)})` : `rgba(190,180,220,${a * 0.75})`;
        g.beginPath(); g.ellipse(p.x, p.y, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
        g.strokeStyle = `rgba(20,18,40,${a * 0.5})`;
        g.beginPath(); g.ellipse(p.x, p.y + 0.8, rx * 0.96, ry * 0.92, 0, Math.PI * 0.05, Math.PI * 0.95); g.stroke();
        if (k < 0.5) { g.strokeStyle = `rgba(210,200,236,${(0.5 - k) * 0.8})`; g.beginPath(); g.ellipse(p.x, p.y, rx * 0.45, ry * 0.45, 0, 0, TAU); g.stroke(); }
      }
      // floating petals and seeds, each with its reflection and a waterline
      for (const f of floats) {
        const k = DH.persp(f.y) * 2.2, sc = f.s * (0.5 + (f.y - FAR) / 600);
        g.save(); g.translate(f.x, f.y + Math.sin(t * 2 + f.ph) * 0.6); g.scale(sc, sc * k); g.rotate(f.a);
        if (f.kind === 'petal') {
          const p = new Path2D(); p.moveTo(-14, 0); p.quadraticCurveTo(-4, -12, 14, -4); p.quadraticCurveTo(6, 8, -14, 0); p.closePath();
          ink(g, p, '#c86a92', 2.2 / sc); g.fillStyle = 'rgba(255,200,220,0.6)'; g.fill(ell(2, -3, 7, 2.5));
        } else {
          ink(g, ell(0, 0, 6, 3.5), '#6a4a34', 2 / sc);
          g.lineWidth = 1 / sc; g.strokeStyle = 'rgba(230,220,200,0.8)';
          for (let i = 0; i < 6; i++) { const a = -Math.PI * (0.2 + i * 0.12); g.beginPath(); g.moveTo(4, 0); g.lineTo(4 + Math.cos(a) * 14, Math.sin(a) * 14); g.stroke(); }
        }
        g.restore();
        g.fillStyle = 'rgba(255,220,170,0.25)'; g.fill(ell(f.x, f.y + 2, 12 * sc, 1.2));
      }
      for (const b of bubbles) {
        const k = Math.min(1, b.age * 6), r = b.r * k;
        g.lineWidth = 0.9; g.strokeStyle = 'rgba(230,226,250,0.75)';
        g.beginPath(); g.arc(b.x, b.y, r, Math.PI, TAU); g.stroke();
        g.fillStyle = 'rgba(255,250,240,0.85)'; g.fill(circ(b.x - r * 0.35, b.y - r * 0.55, Math.max(0.5, r * 0.18)));
        g.fillStyle = 'rgba(255,214,150,0.25)'; g.fill(ell(b.x, b.y, r, r * 0.25));
      }
    },
  });
})();
