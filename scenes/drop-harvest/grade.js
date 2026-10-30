/* grade.js — the last word over the whole picture: a cool vignette (the storm closing in at the
   edges), a breath of warm light spreading from the sun, and the lightning lighting everything
   for a blink.

   grade z60 (still) · flash z61 */
(function () {
  const { radial, grad, st, layer } = Drawn;
  const { SUN } = DH;
  layer({
    id: 'grade', z: 60, still: true,
    draw(g) {
      const v = st.view, cx = SUN.x + 100, cy = SUN.y, R = Math.hypot(v.x1 - v.x0, v.y1 - v.y0) / 2;
      g.fillStyle = radial(g, cx, cy, R * 0.35, R * 1.15, [[0, 'rgba(20,16,40,0)'], [1, 'rgba(20,16,40,0.5)']]);
      g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      g.save(); g.globalCompositeOperation = 'soft-light';
      g.fillStyle = radial(g, SUN.x, SUN.y, 0, 900, [[0, 'rgba(255,190,120,0.55)'], [1, 'rgba(255,190,120,0)']]);
      g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      g.restore();
    },
  });
  layer({
    id: 'flash', z: 61,
    draw(g) {
      const f = DH.storm.flash;
      if (f < 0.02) return;
      const v = st.view, k = f * (0.55 + 0.45 * Math.sin((1 - f) * 38));
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = `rgba(150,150,210,${0.08 * k})`; g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
      g.restore();
    },
  });
})();
