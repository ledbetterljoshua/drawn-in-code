/* shell.js — the ark itself: the cut face of the shell (porcelain skin, nacre walls, every septum),
   the chamber hollows behind it with the sun's shadow and the nacre's sheen, the siphuncle that
   threads every chamber, and the uncut body chamber, striped, standing toward us.

   It's one heavy picture, so it is painted once into a sprite (onLayout) and blitted every frame
   with the ark's bob. Rooms add their fixed furniture to the same sprite through A.furnish(fn, z),
   so a room's floor, shelves and stove cost nothing per frame.

   shell z30 · the shadow it casts on the sand is in sea.js. */
(() => {
const { TAU, lerp, clamp, rng, circ, ell, curve, poly, grad, radial, st, layer, onLayout, sprite, blit } = Drawn;
const A = window.ARK, LINE = A.LINE, NA = A.NACRE, SH = A.SHELL;

// furniture painted into the shell sprite, in z order (lower first)
const furniture = [];
A.furnish = (fn, z = 0) => { furniture.push({ fn, z }); furniture.sort((a, b) => a.z - b.z); };

// the spiral angles of the cut part, from the oldest septum to the back of the body chamber
const thMin = A.septa[A.septa.length - 1].th, th0 = A.thE - A.Wb;
const arc = (a, b, rf, n) => { const out = []; for (let i = 0; i <= n; i++) { const th = lerp(a, b, i / n); out.push(A.pt(th, rf(th))); } return out; };
// the porcelain skin: the outermost part of every whorl's wall, all the way round
const skin = (() => {
  const n = 260;
  return A.toPath([...arc(thMin, A.thE, A.R, n), ...arc(A.thE, thMin, (th) => A.R(th) * (1 - A.tw * 0.42), n)]);
})();
// the siphuncle runs just off the inner wall of every chamber
A.siphR = (th) => lerp(A.ri(th), A.ro(th), 0.14);
A.siphPts = arc(thMin + 0.25, th0 + 0.05, A.siphR, 300);
// distance along the siphuncle, for bubbles riding it
A.siphLen = (() => { let L = 0; const d = [0]; for (let i = 1; i < A.siphPts.length; i++) { L += Math.hypot(A.siphPts[i][0] - A.siphPts[i - 1][0], A.siphPts[i][1] - A.siphPts[i - 1][1]); d.push(L); } A.siphD = d; return L; })();
A.siphAt = (u) => {
  const L = clamp(u, 0, 1) * A.siphLen, d = A.siphD;
  let i = 1; while (i < d.length - 1 && d[i] < L) i++;
  const f = (L - d[i - 1]) / (d[i] - d[i - 1] || 1), p = A.siphPts[i - 1], q = A.siphPts[i];
  return [lerp(p[0], q[0], f), lerp(p[1], q[1], f)];
};

// ------------------------------------------------------------------ painting
function chamberHollow(g, ch, r) {
  const s = ch.size;
  g.save(); g.clip(ch.path);
  // the far wall: nacre in shadow (it's recessed), cooler toward the inner whorl
  const [ix, iy] = A.pt(ch.thm, ch.rIn), [ox, oy] = A.pt(ch.thm, ch.rOut);
  g.fillStyle = grad(g, ix, iy, ox, oy, ['#8c86a6', '#a69bb4', '#b8a6b4']);
  g.fill(ch.path);
  // the sheen of nacre: soft bands following the curve of the whorl
  for (let i = 0; i < 3; i++) {
    const f = 0.3 + i * 0.22 + (r() - 0.5) * 0.08;
    const pts = arc(ch.th0 - 0.1, ch.th1 + 0.1, (th) => lerp(A.ri(th), A.ro(th), f), 16);
    g.globalAlpha = 0.14;
    A.stroke(g, pts, s * (0.1 + r() * 0.06), [NA.mint, NA.pink, NA.gold][i]);
  }
  g.globalAlpha = 1;
  // the cut face's own edges shade the far wall from the sun (it's high on the left)
  const dx = s * 0.17, dy = s * 0.21;
  const sh = new Path2D(); sh.rect(ch.box.x0 - 50, ch.box.y0 - 50, ch.box.w + 100, ch.box.h + 100);
  const lit = new Path2D(); lit.addPath(ch.path, new DOMMatrix([1, 0, 0, 1, dx, dy]));
  g.save(); g.clip(sh); g.fillStyle = 'rgba(64, 70, 122, 0.36)';
  // even-odd: everything but the lit (shifted) chamber
  const both = new Path2D(); both.addPath(sh); both.addPath(lit);
  g.fill(both, 'evenodd'); g.restore();
  // ambient occlusion along every edge
  for (const [w, a] of [[s * 0.34, 0.08], [s * 0.18, 0.1], [s * 0.08, 0.12], [s * 0.03, 0.14]]) {
    g.lineWidth = w; g.strokeStyle = `rgba(56, 44, 84, ${a})`; g.stroke(ch.path);
  }
  g.restore();
}

// the hollows and everything furnished inside them (behind the crew)
function paintBack(g) {
  const r = rng(77);
  g.fillStyle = '#9a90ac';
  for (const ch of A.chambers) g.fill(ch.path);
  for (const ch of A.chambers) chamberHollow(g, ch, r);
  for (const f of furniture) { g.save(); f.fn(g); g.restore(); }
}
// the cut face: nacre walls and septa with the hollows cut out of it, the siphuncle, the body
// chamber whole, and the silhouette (in front of the crew)
function paintFace(g) {
  const r = rng(78);
  const [cx, cy] = A.C;
  g.fillStyle = grad(g, cx - 500, cy - 450, cx + 400, cy + 500, ['#fbf3ee', '#efe6ea', '#e2dbe6']);
  g.fill(A.outlinePath);
  g.save(); g.globalCompositeOperation = 'destination-out';
  for (const ch of A.chambers) g.fill(ch.path);
  g.restore();
  // the porcelain skin on every whorl, with the stripes' pigment where they reach the cut
  g.save(); g.clip(skin);
  g.fillStyle = SH.base; g.fill(skin);
  g.globalAlpha = 0.9;
  for (let th = thMin; th < th0; th += 0.05 + r() * 0.05) {
    const band = Math.sin(th * 5.3 + Math.sin(th * 2.1) * 1.5);
    if (band < 0.25) continue;
    const R = A.R(th);
    g.fillStyle = band > 0.7 ? SH.stripeDk : SH.stripe;
    g.fill(poly([A.pt(th, R + 2), A.pt(th + 0.035, R + 2), A.pt(th + 0.045, R * (1 - A.tw * 0.4)), A.pt(th + 0.01, R * (1 - A.tw * 0.4))]));
  }
  g.restore();
  g.lineWidth = 0.9; g.strokeStyle = 'rgba(120, 92, 96, 0.55)'; g.stroke(skin);
  // septa: the nacre walls, each cut edge inked, lit on the sun side
  for (const s of A.septa) {
    const w = Math.max(1.6, A.R(s.th) * 0.024);
    A.stroke(g, s.pts, w + 2.2, LINE);
    A.stroke(g, s.pts, w, '#f6eee9');
    A.stroke(g, s.pts.map(([x, y]) => [x - w * 0.18, y - w * 0.22]), w * 0.35, '#ffffff');
  }
  g.lineWidth = 1.4; g.strokeStyle = 'rgba(51, 33, 58, 0.75)';
  for (const ch of A.chambers) g.stroke(ch.path);
  // the siphuncle: a pearl tube, cut open, collared where it passes each septum
  const sp = A.siphPts;
  A.stroke(g, sp, 9.5, LINE);
  A.stroke(g, sp, 7, '#e9d6c6');
  A.stroke(g, sp, 3.2, '#8a6f78');
  A.stroke(g, sp.map(([x, y]) => [x - 1.4, y - 1.6]), 1.3, '#fff6ec');
  for (const s of A.septa) {
    if (s.th < thMin + 0.25 || s.th > th0 + 0.05) continue;
    const [x, y] = A.pt(s.th, A.siphR(s.th)), w = Math.max(2.5, A.R(s.th) * 0.03);
    g.save(); g.translate(x, y); g.rotate(s.th + Math.PI / 2);
    crewInk(g, A.rr(-w * 0.6, -6.5, w * 1.2, 13, 2), '#c9a258', 1.2);
    g.fillStyle = '#f4dc9a'; g.fillRect(-w * 0.45, -5, w * 0.25, 10);
    g.restore();
  }
  for (const f of faceItems) { g.save(); f(g); g.restore(); }
  paintBody(g, r);
  // the silhouette: a heavy ink line, a warm rim where the sun catches it, cool below
  g.save(); g.clip(A.outlinePath);
  g.lineWidth = 7; g.strokeStyle = 'rgba(255, 240, 210, 0.5)';
  g.save(); g.translate(5, 6); g.stroke(A.outlinePath); g.restore();
  g.lineWidth = 9; g.strokeStyle = 'rgba(40, 90, 120, 0.25)';
  g.save(); g.translate(-6, -7); g.stroke(A.outlinePath); g.restore();
  g.restore();
  g.lineWidth = 3.4; g.strokeStyle = LINE; g.stroke(A.outlinePath);
}
// things fixed into the cut face itself (a telescope through the wall, a tube through a septum)
const faceItems = [];
A.faceItem = (fn) => faceItems.push(fn);
const crewInk = (g, p, fill, lw) => { g.fillStyle = fill; g.fill(p); g.lineWidth = lw; g.strokeStyle = LINE; g.stroke(p); };
A.ink = crewInk;

function paintBody(g, r) {
  const W = A.wedgePath;
  g.save(); g.clip(W);
  // a rounded tube seen from the side: lit up toward the coil, falling into shade at the keel
  g.fillStyle = SH.base; g.fill(W);
  const rm = A.R((th0 + A.thE) / 2), rim = A.ri((th0 + A.thE) / 2);
  g.fillStyle = radial(g, A.C[0], A.C[1], rim, rm, [[0, '#cbbca8'], [0.22, '#f6ead6'], [0.5, '#fff6e6'], [0.78, '#ead9bf'], [1, '#bfb2a4']]);
  g.fill(W);
  // flame stripes: broad wavy bands from the coil outward, swept back, strongest on the older
  // part of the whorl and fading out toward the aperture
  const n = 11;
  for (let i = 0; i < n; i++) {
    const f0 = i / (n - 1);
    const thS = lerp(th0 + 0.06, A.thE - 0.12, Math.pow(f0, 0.9)) + (r() - 0.5) * 0.04;
    const fade = clamp(1.15 - f0 * 1.1, 0, 1);
    if (fade <= 0.05) continue;
    const reach = lerp(0.92, 0.5, f0) * (0.85 + r() * 0.2);
    const wob = r() * 10, wid = 0.075 * (1 - f0 * 0.3);
    const L = [], Rr = [];
    for (let j = 0; j <= 16; j++) {
      const u = j / 16, f = u * reach;
      const th = thS - u * 0.2 + Math.sin(u * 6 + wob) * 0.022;
      const rad = lerp(A.ri(th) * 0.98, A.R(th), f);
      const w = wid * (1 - u * 0.6) * (0.75 + 0.35 * Math.sin(u * 8 + wob));
      L.push(A.pt(th - w / 2, rad)); Rr.push(A.pt(th + w / 2, rad));
    }
    const S = curve([...L, ...Rr.reverse()]);
    g.globalAlpha = 0.9 * fade;
    g.fillStyle = SH.stripe; g.fill(S);
    g.save(); g.clip(S); g.globalAlpha = 0.55 * fade; g.fillStyle = SH.stripeDk; g.translate(4, 5); g.fill(S); g.restore();
    g.globalAlpha = 1;
  }
  // growth lines: fine arcs parallel to the aperture
  g.lineWidth = 0.9;
  for (let th = th0 + 0.04; th < A.thE - 0.02; th += 0.035 + r() * 0.03) {
    g.strokeStyle = `rgba(150, 120, 104, ${0.05 + r() * 0.06})`;
    const a = A.pt(th, A.ri(th)), b = A.pt(th + 0.05, (A.ri(th) + A.R(th)) / 2), c = A.pt(th - 0.02, A.R(th));
    g.beginPath(); g.moveTo(...a); g.quadraticCurveTo(...b, ...c); g.stroke();
  }
  // a glossy highlight where the sun hits the shoulder of the whorl
  const hi = A.toPath([...arc(th0 + 0.2, A.thE - 0.15, (th) => lerp(A.ri(th), A.R(th), 0.3), 30), ...arc(A.thE - 0.15, th0 + 0.2, (th) => lerp(A.ri(th), A.R(th), 0.4), 30)]);
  g.fillStyle = 'rgba(255, 252, 240, 0.35)'; g.fill(hi);
  g.restore();
  // the near wall's sawn edge along the cut, a band showing its two layers
  const e0 = A.pt(th0, A.ri(th0)), e1 = A.pt(th0, A.R(th0));
  const nx = Math.cos(th0 + Math.PI / 2), ny = Math.sin(th0 + Math.PI / 2);
  const T = A.R(th0) * 0.045;
  const edge = poly([e0, e1, [e1[0] - nx * T, e1[1] - ny * T], [e0[0] - nx * T * 0.6, e0[1] - ny * T * 0.6]]);
  crewInk(g, edge, '#f6eee9', 1.6);
  g.save(); g.clip(edge); g.fillStyle = SH.base; g.fill(poly([e0, e1, [e1[0] - nx * T * 0.4, e1[1] - ny * T * 0.4], [e0[0] - nx * T * 0.25, e0[1] - ny * T * 0.25]])); g.restore();
  g.lineWidth = 2.4; g.strokeStyle = LINE; g.stroke(W);
}

// ------------------------------------------------------------------ the layer
let back = null, face = null;
const pad = 30;
const box = (() => {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const [x, y] of A.outline) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0: x0 - pad, y0: y0 - pad - 60, w: x1 - x0 + pad * 2, h: y1 - y0 + pad * 2 + 60 };
})();
A.shellBox = box;
onLayout(() => {
  back = sprite(box.x0, box.y0, box.w, box.h, paintBack);
  face = sprite(box.x0, box.y0, box.w, box.h, paintFace);
});

layer({
  id: 'bob', z: -1,
  update(dt, t) { A.stepBob(dt, t); },
  draw() {},
});
layer({ id: 'shell-back', z: 30, draw(g) { if (back) A.inShell(g, () => blit(g, back)); } });
layer({ id: 'shell-face', z: 55, draw(g) { if (face) A.inShell(g, () => blit(g, face)); } });

// bubble-mail: little silver capsules riding the siphuncle between rooms. A.mail(from, to, done)
const mail = [];
A.mail = (u0, u1, done) => mail.push({ u: u0, u1, done, sp: 0.09 + Math.random() * 0.04, wob: Math.random() * 6 });
let nextMail = 2;
layer({
  id: 'mail', z: 56,
  update(dt, t) {
    if ((nextMail -= dt) < 0) { nextMail = 3 + Math.random() * 5; const a = Math.random(), b = Math.random(); A.mail(a, b); }
    for (const m of mail) { const d = m.u1 - m.u; m.u += Math.sign(d) * Math.min(Math.abs(d), m.sp * dt); if (Math.abs(m.u1 - m.u) < 1e-4) { m.gone = true; if (m.done) m.done(); } }
    for (let i = mail.length - 1; i >= 0; i--) if (mail[i].gone) mail.splice(i, 1);
  },
  draw(g, t) {
    if (!mail.length) return;
    A.inShell(g, () => {
      for (const m of mail) {
        const [x, y] = A.siphAt(m.u);
        const s = 2.2 + Math.sin(t * 8 + m.wob) * 0.3;
        g.fillStyle = 'rgba(236,252,250,0.95)'; g.fill(circ(x, y, s));
        g.lineWidth = 0.8; g.strokeStyle = LINE; g.stroke(circ(x, y, s));
        g.fillStyle = '#fff'; g.fill(circ(x - 0.7, y - 0.8, 0.7));
      }
    });
  },
});
})();
