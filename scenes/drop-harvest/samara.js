/* samara.js — every so often a maple key comes spinning down out of the storm in the upper left,
   a winged seed whirling on its own wing, pushed sideways by the gusts. It lands on the puddle
   with a ring and floats off with the petals.

   Hover it as it falls: it catches your umbrella's wind and spins faster, floating up a little.

   samara z20 */
(function () {
  const { TAU, clamp, lerp, ease, ell, circ, ink, st, P, layer } = Drawn;
  const { LINE, FAR } = DH;

  // a maple key: a seed with one veined wing; drawn flat, (x, y) at the seed
  DH.drawSamara = function (g, x, y, lw = 1) {
    const w = new Path2D();
    w.moveTo(x, y - 3); w.bezierCurveTo(x + 14, y - 12, x + 40, y - 10, x + 46, y - 2); w.bezierCurveTo(x + 40, y + 6, x + 16, y + 6, x, y + 3); w.closePath();
    ink(g, w, 'rgba(200,150,90,0.85)', 1.2 * lw);
    g.lineWidth = 0.6 * lw; g.strokeStyle = 'rgba(110,70,40,0.7)';
    for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(x + 2, y - 1); g.quadraticCurveTo(x + i * 6, y - 8 + i * 0.6, x + 8 + i * 7, y - 3 + i); g.stroke(); }
    ink(g, ell(x, y, 5, 4), '#8a5a34', 1.4 * lw);
  };

  const sk = { on: false, x: 0, y: 0, a: 0, spin: 9, vx: 0, next: 6 };
  layer({
    id: 'samara', z: 20,
    hit: (x, y) => sk.on && Math.hypot(x - sk.x, y - sk.y) < 36,
    onEnter() { sk.spin = 26; sk.vx += P.vx * 0.2; sk.lift = 1; },
    update(dt, t) {
      if (!sk.on) {
        if ((sk.next -= dt) <= 0) { sk.on = true; sk.x = st.view.x0 + 80 + Math.random() * 300; sk.y = Math.max(st.view.y0, -200) - 40; sk.vx = 0; sk.spin = 9; sk.lift = 0; }
        return;
      }
      sk.spin = ease(sk.spin, 9, 0.8, dt);
      sk.lift = Math.max(0, (sk.lift || 0) - dt * 0.6);
      sk.a += sk.spin * dt;
      sk.vx = ease(sk.vx, (Drawn.wind(t, sk.x) - 0.3) * 60, 1, dt);
      sk.x += sk.vx * dt;
      sk.y += (70 - sk.lift * 120) * dt;
      if (sk.y > FAR + 60 + (sk.x % 7) * 20) {
        DH.spawn({ kind: 'ring', x: sk.x, y: sk.y, r: 4, k: DH.persp(sk.y), life: 1.6, g: 0, z: 'water' });
        DH.addFloat && DH.addFloat({ kind: 'samara', x: sk.x, y: sk.y, s: 0.9 });
        sk.on = false; sk.next = 22 + Math.random() * 16;
      }
    },
    draw(g, t) {
      if (!sk.on) return;
      // seen whirling: the wing foreshortens as it turns
      g.save(); g.translate(sk.x, sk.y); g.scale(Math.cos(sk.a), 1); g.rotate(-0.35);
      DH.drawSamara(g, 0, 0, 1);
      g.restore();
      // a faint blur disc of the turning wing
      g.fillStyle = 'rgba(220,180,120,0.12)'; g.fill(ell(sk.x, sk.y - 2, 44, 10));
    },
  });
})();
