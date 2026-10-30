/* light.js — the last pass: the glare of each fire on the air in front of it, drawn additively
   over everything, breathing with the shared fire level. Kept faint on purpose: the painted light
   on every surface is what carries the picture; this only adds the haze a camera would see.
   During a salt throw the firemouth glare turns green for a moment. */
(function () {
  const { clamp, noise, layer } = Drawn;
  const K = window.Kiln;
  layer({
    id: 'glare', z: 70,
    draw(g, t) {
      const lv = K.fire.level, salt = K.fire.salt;
      g.globalCompositeOperation = 'lighter';
      const mouthCol = salt > 0.05 ? '#9affd0' : '#ff8a30';
      K.glow(g, 560, 846, 230, '#ff6a20', 0.22 * lv);
      K.glow(g, 560, 840, 90, mouthCol, (0.32 + salt * 0.5) * lv);
      K.glow(g, 418, 846, 70, '#ff7a28', 0.22 * lv);
      K.glow(g, 702, 846, 70, '#ff7a28', 0.22 * lv);
      // the lip flame and the underside of the smoke it lights
      K.glow(g, 560, 214, 150, '#ff7a28', 0.26 * lv + salt * 0.2);
      K.glow(g, 560, 120, 260, '#a03a18', 0.12 * lv);
      // doors and windows spill a little glare
      const f = (s) => 0.9 + 0.1 * noise(t * 2 + s);
      K.glow(g, 1104, 860, 60, '#ffb050', 0.22 * f(1));
      K.glow(g, 884, 860, 90, '#ffb050', 0.18 * f(2));
      K.glow(g, 128, 400, 40, '#ffb050', 0.2 * f(3));
      K.glow(g, 1296, 1070, 140, '#ff4010', 0.14 * f(4));
      g.globalCompositeOperation = 'source-over';
    },
  });
})();
