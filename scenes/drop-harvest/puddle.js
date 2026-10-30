/* puddle.js — the water. It mirrors the storm, the rift, the far bank and the island (each about
   its own waterline), broken into wavering strips by the rain; a glitter path runs down from the
   sun's reflection; every drop that lands leaves a ring, flattened more the nearer it is to the
   horizon. The water body darkens toward us (we see into it, not off it).

   Hover the water: rings spread from the pointer and the reflection wobbles under it.

   puddle z8 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, hash, circ, ell, poly, curve, grad, radial, st, P, layer, onLayout, sprite } = Drawn;
  const { C, SUN, HZ, FAR, SHORE } = DH;

  // other parts add what the water should mirror: { axis, draw(g, v) }
  DH.mirrors = [];
  DH.mirror = (axis, draw) => DH.mirrors.push({ axis, draw });
  DH.mirror(HZ, (g, v) => DH.paintSky(g, { x0: v.x0, x1: v.x1, y0: HZ - (v.y1 - HZ) - 40 }));
  DH.mirror(FAR, (g, v) => DH.paintBank(g, v));

  let refl = null;
  onLayout(() => {
    const v = st.view;
    const x0 = v.x0 - 30, w = v.x1 - v.x0 + 60, y0 = FAR - 2, h = v.y1 - y0 + 10;
    refl = sprite(x0, y0, w, h, (g) => {
      g.save(); g.beginPath(); g.rect(x0, y0, w, h); g.clip();
      for (const m of DH.mirrors) {
        g.save();
        // anything mirrored about a lower waterline only shows below it
        if (m.axis > FAR + 2) { g.beginPath(); g.rect(x0, m.axis - 1, w, h); g.clip(); }
        g.translate(0, 2 * m.axis); g.scale(1, -1);
        m.draw(g, v);
        g.restore();
        // things standing in the water mirror darker than the sky does
        if (m.axis > FAR + 2) { g.save(); g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(16,12,30,0.32)'; g.fillRect(x0, m.axis, w, h); g.restore(); }
      }
      // the water body: reflections weaken toward us and go blue-violet
      g.fillStyle = grad(g, 0, FAR, 0, Math.max(v.y1, 1300), [[0, 'rgba(46,40,78,0.18)'], [0.15, 'rgba(38,34,68,0.42)'], [0.45, 'rgba(30,28,56,0.62)'], [1, 'rgba(20,18,38,0.85)']]);
      g.fillRect(x0, y0, w, h);
      g.restore();
    });
  });

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
    },
    draw(g, t) {
      const v = st.view;
      if (!refl) return;
      const c = refl.c, R = st.R;
      const I = DH.intensity(t);
      // strips: thin near the horizon (fine chop), thicker toward us
      let y = FAR;
      while (y < v.y1) {
        const d = y - FAR;
        const h = 2 + Math.min(6, d * 0.012);
        const amp = (0.6 + d * 0.006) * (0.7 + I * 0.4);
        let off = noise(y * 0.21 + t * 2.3) * amp + Math.sin(y * 0.7 + t * 5) * amp * 0.35;
        if (stir.a > 0.01) { const q = Math.exp(-((y - stir.y) ** 2) / 1800); off += Math.sin(y * 0.5 - t * 9) * 6 * stir.a * q; }
        const sy = (y - refl.y0) * R, sh = h * R;
        if (sy + sh > c.height) break;
        g.drawImage(c, 0, sy, c.width, sh, refl.x0 + off, y, refl.w, h + 0.4);
        y += h;
      }
      // glitter: the sun broken into dashes down the water toward us
      const gy0 = 2 * HZ - SUN.y - 8;
      g.save(); g.globalCompositeOperation = 'lighter';
      const sun = 1 + DH.storm.sun * 0.9;
      for (let i = 0; i < 90; i++) {
        const u = i / 90, yy = gy0 + u * u * (Math.min(v.y1, 1500) - gy0);
        const spread = 10 + u * 120 * sun;
        const seed = Math.floor(t * 6 + i * 3.7);
        const xx = SUN.x + (hash(seed) - 0.5) * 2 * spread * (0.4 + hash(seed + 1));
        const len = (6 + hash(seed + 2) * 22) * (0.4 + u);
        const a = (1 - u) ** 1.4 * 0.7 * (0.4 + hash(seed + 3) * 0.6) * sun;
        g.fillStyle = `rgba(255,${210 + hash(i) * 40 | 0},150,${a})`;
        g.fillRect(xx - len / 2, yy, len, 1 + u * 2.2);
      }
      // a warm swell of the reflected rift right under the far bank
      g.fillStyle = radial(g, SUN.x, gy0, 0, 300, [[0, `rgba(255,214,150,${0.22 * sun})`], [1, 'rgba(255,190,120,0)']]);
      g.save(); g.translate(SUN.x, gy0); g.scale(2.4, 0.4); g.translate(-SUN.x, -gy0); g.fill(circ(SUN.x, gy0, 300)); g.restore();
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
    },
  });
})();
