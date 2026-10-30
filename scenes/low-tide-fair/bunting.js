/* bunting.js — the strings of flags that make the flats a fair (z18.6, in front of the
   grandmother): from her ledges out to two tall driftwood masts, to the tea-house's roof and down to
   the band. They all flap in the one wind. Hover a string and you pluck it: a wave runs along it. */
(() => {
const D = Drawn, F = Fair;
const { clamp, lerp, ease, ell, st, P, layer } = D;
const { pxu } = F;
const LINE = F.LINE;

// masts: [x, base y, height in world units]
const MASTS = [[1150, 805, 178], [1300, 1002, 128], [520, 884, 142]];
const top = ([x, y, h]) => [x, y - h * pxu(y)];
const lines = [];
function granAt(i, side, v = 1.0) {
  const gr = F.gran, w = gr.sp.ws[i], up = gr.sp.ws[i + 1];
  const x = w.cx + side * w.rt * 0.92, y = F.bandBottom(up, x) - 10;
  return [gr.x + x * gr.S, gr.y + y * gr.S];
}
function build() {
  lines.length = 0;
  const [m1, m2, m3] = MASTS.map(top);
  const tea = F.tea, tl = tea.lantern[0];
  const teaRoof = [tea.x + (tea.gl.cx + tea.gl.R * 0.85) * tea.S, tea.y + (tea.gl.cy - tea.gl.R * 0.55) * tea.S];
  lines.push({ a: granAt(2, 1), b: m1, n: 14, sag: 26, sc: 1.05, off: 0 });
  lines.push({ a: m1, b: teaRoof, n: 16, sag: 30, sc: 0.85, off: 3 });
  lines.push({ a: m1, b: m2, n: 11, sag: 22, sc: 1.2, off: 5 });
  lines.push({ a: granAt(1, -1), b: m3, n: 10, sag: 24, sc: 1.2, off: 7 });
  lines.push({ a: granAt(4, 1), b: m1, n: 14, sag: 34, sc: 0.95, off: 2 });
  for (const l of lines) { l.pluck = 0; l.pts = []; }
}
D.onLayout(build);

layer({
  id: 'bunting', z: F.zOf(F.gran.y) + 0.35,
  hit(x, y) {
    for (const l of lines) for (const [px, py] of l.pts) if (Math.abs(px - x) < 10 && Math.abs(py - y) < 12) return (this.which = l), true;
    return false;
  },
  onEnter(L) { if (L.which) L.which.pluck = 1; },
  update(dt) { for (const l of lines) l.pluck = Math.max(0, l.pluck - dt * 0.6); },
  draw(g, t) {
    // the masts: driftwood poles with a guy rope and a little knob of a cap
    for (const m of MASTS) {
      const [x, y, h] = m, s = pxu(y), [tx, ty] = top(m);
      F.castShadow(g, x, y, (g) => g.fillRect(-1.6 * s, -h * s, 3.2 * s, h * s), 0.32);
      F.contact(g, x, y, 5 * s, 0.5);
      F.post(g, x, ty, y, 3.4 * s, F.PAL.drift, 1.1);
      g.strokeStyle = 'rgba(80,60,70,0.6)'; g.lineWidth = 0.8;
      g.beginPath(); g.moveTo(tx, ty + 6); g.lineTo(x - 40 * s, y + 4 * s); g.stroke();
      D.ink(g, D.circ(tx, ty - 1, 2.6 * s), '#d65a4a', 1);
    }
    for (const l of lines) {
      F.bunting(g, l.a, l.b, { n: l.n, sag: l.sag, sc: l.sc, off: l.off, pluck: l.pluck }, t);
      // keep a few points along it for the hit test
      l.pts.length = 0;
      for (let i = 1; i < 12; i++) { const u = i / 12; l.pts.push([lerp(l.a[0], l.b[0], u), lerp(l.a[1], l.b[1], u) + Math.sin(u * Math.PI) * l.sag + 6]); }
    }
  },
});
})();
