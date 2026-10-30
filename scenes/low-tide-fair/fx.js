/* fx.js — the particles every part can throw (z70): music notes, smoke and steam (soft puffs that
   swell and thin), steam rings, loose pages tumbling on the wind, sleepy z's, little cries, and
   water splashes. Plus the last grade over everything (z90). */
(() => {
const D = Drawn, F = Fair;
const { TAU, clamp, lerp, circ, ell, poly, ink, grad, radial, st, layer } = D;
const LINE = F.LINE;

layer({
  id: 'fx', z: 70,
  update(dt, t) {
    for (const p of F.fx) {
      p.age += dt;
      p.vy += p.g * dt;
      if (p.kind === 'smoke' || p.kind === 'steam' || p.kind === 'ring') { p.vx += D.wind(t, p.x) * 10 * dt; p.vy *= Math.exp(-0.25 * dt); }
      if (p.kind === 'page') { p.vx = 30 + D.wind(t, p.x) * 40 + Math.sin(p.age * 2.2 + p.rot) * 20; p.vy = Math.sin(p.age * 1.7) * 18 + 6; p.rot += p.vr * dt * Math.sin(p.age * 2); }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = F.fx.length - 1; i >= 0; i--) if (F.fx[i].age > F.fx[i].life) F.fx.splice(i, 1);
  },
  draw(g, t) {
    for (const p of F.fx) {
      const k = p.age / p.life;
      g.save(); g.translate(p.x, p.y);
      if (p.kind === 'smoke' || p.kind === 'steam') {
        const r = (4 + k * 14 * (p.grow || 1)) * p.size, a = (p.kind === 'steam' ? 0.55 : 0.38) * Math.min(1, p.age * 3) * (1 - k);
        g.fillStyle = p.kind === 'steam' ? `rgba(255,250,242,${a})` : `rgba(206,192,204,${a})`;
        g.fill(circ(Math.sin(p.age * 1.3 + p.x) * 3, 0, r));
        g.fillStyle = p.kind === 'steam' ? `rgba(255,240,210,${a * 0.6})` : `rgba(240,214,190,${a * 0.5})`;
        g.fill(circ(-r * 0.3, -r * 0.25, r * 0.6));
      } else if (p.kind === 'ring') {
        const r = (3 + k * 10) * p.size;
        g.strokeStyle = `rgba(255,252,246,${0.8 * (1 - k)})`; g.lineWidth = 2 * (1 - k * 0.5);
        g.beginPath(); g.ellipse(0, 0, r, r * 0.55, 0, 0, TAU); g.stroke();
      } else if (p.kind === 'note' || p.kind === 'z' || p.kind === 'word') {
        const a = Math.min(1, p.age * 4) * (1 - k * k);
        g.globalAlpha = a;
        const sz = Math.round((p.kind === 'word' ? 11 : 15) * p.size * (0.85 + k * 0.4));
        g.font = `italic 700 ${sz}px Georgia, serif`; g.textAlign = 'center';
        const txt = p.kind === 'note' ? (p.alt ? '♫' : '♪') : p.kind === 'z' ? 'z' : p.text;
        g.lineWidth = 3; g.strokeStyle = 'rgba(255,246,230,0.8)'; g.strokeText(txt, Math.sin(p.age * 3) * 4, 0);
        g.fillStyle = p.kind === 'z' ? '#6a5a8a' : '#4a2a3e'; g.fillText(txt, Math.sin(p.age * 3) * 4, 0);
      } else if (p.kind === 'page') {
        const a = Math.min(1, p.age * 3) * (1 - Math.max(0, k - 0.7) / 0.3);
        g.globalAlpha = a; g.rotate(p.rot); g.scale(Math.cos(p.age * 4 + p.rot), 1);
        ink(g, poly([[-5, -6.5], [5, -6.5], [5, 6.5], [-5, 6.5]]), '#f8f0de', 0.8);
        g.strokeStyle = 'rgba(80,60,80,0.45)'; g.lineWidth = 0.5;
        for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(-3.5, -4 + i * 2.6); g.lineTo(3.5, -4 + i * 2.6); g.stroke(); }
      } else if (p.kind === 'drop') {
        const a = 1 - k;
        g.fillStyle = `rgba(236,246,250,${a})`; g.fill(ell(0, 0, 1.4 * p.size, 2 * p.size));
      } else if (p.kind === 'spark') {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = 1 - k;
        const s = 4 * p.size; g.fillStyle = '#fff3c0';
        g.fill(poly([[0, -s], [s * 0.25, -s * 0.25], [s, 0], [s * 0.25, s * 0.25], [0, s], [-s * 0.25, s * 0.25], [-s, 0], [-s * 0.25, -s * 0.25]]));
      }
      g.restore();
    }
  },
});

// the last word: warmth from the sun's side, a cool falloff toward the right and down, a soft vignette
layer({
  id: 'grade', z: 90, still: true,
  draw(g) {
    const v = st.view;
    g.save();
    g.globalCompositeOperation = 'soft-light';
    g.fillStyle = radial(g, -200, 200, 0, 1900, [[0, 'rgba(255,184,110,0.45)'], [0.5, 'rgba(255,196,140,0.1)'], [1, 'rgba(255,196,140,0)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    g.restore();
    const cx = F.W * 0.42, cy = F.H * 0.5, R = Math.hypot(F.W, F.H) * 0.55;
    g.fillStyle = radial(g, cx, cy, R * 0.55, R * 1.15, [[0, 'rgba(60,34,50,0)'], [1, 'rgba(60,34,50,0.3)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
  },
});
})();
