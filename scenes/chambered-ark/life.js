/* life.js — the particles every part spawns (bubbles, notes, z's, sparkles, ink puffs), the bubbles
   the pointer trails through the water, and the last colour grade.

   fx z80 · grade z95 */
(() => {
const { TAU, lerp, clamp, circ, ell, poly, radial, st, P, layer, wind } = Drawn;
const A = window.ARK, LINE = A.LINE;

let trail = 0;
layer({
  id: 'fx', z: 80,
  update(dt, t) {
    // a swimmer's wake: the pointer trails a few bubbles when it moves through open water
    if (P.inside && P.sp > 160) { trail += dt * Math.min(8, P.sp / 80); while (trail > 1) { trail--; A.spawn({ kind: 'bubble', x: P.x, y: P.y, vx: (Math.random() - 0.5) * 20, vy: -20, life: 1.6, size: 1.5 + Math.random() * 2.5, shell: false }); } }
    for (const p of A.fx) {
      p.age += dt;
      if (p.kind === 'bubble') { p.vy -= 60 * dt; p.vx += (wind(t, p.x) * 18 - p.vx) * dt * 0.8; p.vy *= 1 - dt * 0.6; }
      else if (p.kind === 'note' || p.kind === 'z' || p.kind === 'heart') { p.vx = Math.sin(p.age * 3 + p.size * 5) * 12; }
      else if (p.kind === 'ink') { p.vx *= 1 - dt * 1.5; p.vy *= 1 - dt * 1.5; }
      p.x += p.vx * dt; p.y += p.vy * dt;
    }
    for (let i = A.fx.length - 1; i >= 0; i--) if (A.fx[i].age > A.fx[i].life) A.fx.splice(i, 1);
    if (A.fx.length > 400) A.fx.splice(0, A.fx.length - 400);
  },
  draw(g, t) {
    for (const p of A.fx) {
      const u = p.age / p.life, a = Math.min(1, u * 6, (1 - u) * 3);
      g.save();
      if (p.shell) { const [sx, sy] = A.fromShell(p.x, p.y); g.translate(sx, sy); g.scale(A.SC, A.SC); }
      else g.translate(p.x, p.y);
      g.globalAlpha = a;
      if (p.kind === 'bubble') {
        const s = p.size * (1 + u * 0.3);
        g.lineWidth = Math.max(0.8, s * 0.22); g.strokeStyle = 'rgba(240,255,250,0.85)'; g.fillStyle = 'rgba(220,250,245,0.18)';
        g.beginPath(); g.ellipse(0, 0, s, s * (1 - Math.sin(p.age * 9) * 0.06), 0, 0, TAU); g.fill(); g.stroke();
        g.fillStyle = 'rgba(255,255,255,0.9)'; g.fill(circ(-s * 0.35, -s * 0.35, s * 0.25));
      } else if (p.kind === 'note') {
        g.rotate(Math.sin(p.age * 4) * 0.2); g.scale(p.size, p.size);
        g.fillStyle = LINE; g.fill(ell(0, 0, 3.4, 2.6, undefined, -0.4));
        g.fillRect(2.6, -11, 1.3, 11);
        g.beginPath(); g.moveTo(3.9, -11); g.quadraticCurveTo(8, -9, 7, -5); g.lineWidth = 1.3; g.strokeStyle = LINE; g.stroke();
      } else if (p.kind === 'z') {
        g.scale(p.size, p.size); g.lineWidth = 1.5; g.strokeStyle = 'rgba(255,255,255,0.9)';
        g.beginPath(); g.moveTo(-3, -3); g.lineTo(3, -3); g.lineTo(-3, 3); g.lineTo(3, 3); g.stroke();
      } else if (p.kind === 'heart') {
        g.scale(p.size, p.size); g.fillStyle = '#f2778a';
        g.beginPath(); g.moveTo(0, 3); g.bezierCurveTo(-6, -2, -3, -7, 0, -3); g.bezierCurveTo(3, -7, 6, -2, 0, 3); g.fill();
        g.lineWidth = 0.9; g.strokeStyle = LINE; g.stroke();
      } else if (p.kind === 'spark') {
        g.globalCompositeOperation = 'lighter'; g.scale(p.size, p.size); g.fillStyle = '#fff6c8';
        g.fill(poly([[0, -5], [1.2, -1.2], [5, 0], [1.2, 1.2], [0, 5], [-1.2, 1.2], [-5, 0], [-1.2, -1.2]]));
      } else if (p.kind === 'ink') {
        g.fillStyle = p.color || 'rgba(40,30,60,0.5)'; g.globalAlpha = a * 0.6; g.fill(circ(0, 0, p.size * (1 + u * 2)));
      } else if (p.kind === 'steam') {
        g.fillStyle = 'rgba(255,250,240,0.35)'; g.fill(circ(0, 0, p.size * (1 + u * 1.5)));
      }
      g.restore();
    }
  },
});

// the last word: a soft vignette, a little more warmth where the sun is, cooler in the depths
layer({
  id: 'grade', z: 95, still: true,
  draw(g) {
    const v = st.view, cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2, R = Math.hypot(v.x1 - v.x0, v.y1 - v.y0) / 2;
    g.fillStyle = radial(g, cx, cy, R * 0.5, R * 1.1, [[0, 'rgba(20,40,70,0)'], [1, 'rgba(20,40,70,0.3)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    g.save(); g.globalCompositeOperation = 'soft-light';
    g.fillStyle = radial(g, 150, -500, 0, 1500, [[0, 'rgba(255,220,160,0.55)'], [1, 'rgba(255,220,160,0)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    g.restore();
  },
});
})();
