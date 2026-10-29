/* Cloudfall Isle — a floating island at golden hour: a crooked cottage, a windmill that stirs the
   breeze, a waterfall pouring into a sea of cloud, and the frogs who live there. */
(() => {
const { TAU, clamp, lerp, ease, rng, noise, wind, breeze, circ, ell, rect, seg, quad, poly, curve,
  ink, grad, radial, tube, lumps, blinker, st, P, layer, onLayout, sprite, blit } = Drawn;
const W = 1600, H = 1600;
const LINE = (Drawn.style.line = '#3a2232');

// ============================================================ shared bits: particles, blinks, frogs
const fx = [];
const spawn = (p) => fx.push(Object.assign({ age: 0, life: 2, vx: 0, vy: 0, rot: 0, vr: 0, size: 1, g: 0 }, p));
function heartPath(g, x, y, s) {
  g.beginPath();
  g.moveTo(x, y + s * 0.35);
  g.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.5, y - s * 1.05, x, y - s * 0.45);
  g.bezierCurveTo(x + s * 0.5, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
  g.closePath();
}


const FROG = { base: '#86c75a', shade: '#5c9c48', light: '#bfe582', belly: '#eaf3b0', cheek: '#f39aa0' };
// a little sitting frog, feet at (x, y); o: open (eyes 0..1), look [-1..1, -1..1], smile, sleep,
// flip, rot, squash, arms: [[x, y], ...] hand positions in frog space
function frog(g, x, y, s = 1, o = {}) {
  const c = o.c || FROG, open = o.open == null ? 1 : o.open, lk = o.look || [0, 0];
  g.save();
  g.translate(x, y);
  if (o.rot) g.rotate(o.rot);
  g.scale(s * (o.flip ? -1 : 1), s * (o.squash || 1));
  const lw = 1.8 / s;
  if (o.armsBack) for (const a of o.armsBack) frogArm(g, a, c, lw);
  const parts = [ell(0, -13, 21, 14), ell(-10, -26.5, 8.5, 8), ell(10, -26.5, 8.5, 8)];
  g.lineWidth = lw * 2; g.strokeStyle = LINE;
  for (const p of parts) g.stroke(p);
  g.fillStyle = grad(g, -21, 0, 21, 0, [c.shade, c.base, c.light]);
  for (const p of parts) g.fill(p);
  g.fillStyle = c.belly; g.fill(ell(0, -7.5, 12, 6.5));
  ink(g, ell(-13, -1, 6.5, 3), c.base, lw);
  ink(g, ell(13, -1, 6.5, 3), c.base, lw);
  g.globalAlpha = 0.85; g.fillStyle = c.cheek;
  g.fill(ell(-13.5, -16, 3.8, 2.3)); g.fill(ell(13.5, -16, 3.8, 2.3));
  g.globalAlpha = 1;
  for (const ex of [-10, 10]) {
    if (o.sleep || open < 0.25) {
      g.beginPath(); g.moveTo(ex - 4.5, -27); g.quadraticCurveTo(ex, -23.5, ex + 4.5, -27);
      g.lineWidth = lw; g.strokeStyle = LINE; g.stroke();
    } else {
      g.save(); g.translate(ex, -27.5); g.scale(1, open);
      ink(g, ell(0, 0, 5.6, 5.8), '#fffdf3', lw * 0.8);
      g.fillStyle = LINE; g.fill(ell(lk[0] * 2, lk[1] * 2 + 0.4, 3, 3.3));
      g.fillStyle = '#fff'; g.fill(circ(lk[0] * 2 + 1.1, lk[1] * 2 - 0.9, 1.05));
      g.restore();
    }
  }
  const sm = o.smile == null ? 2.2 : o.smile;
  g.beginPath(); g.moveTo(-5.5, -19.5); g.quadraticCurveTo(0, -19.5 + sm * 1.6, 5.5, -19.5);
  g.lineWidth = lw; g.strokeStyle = LINE; g.stroke();
  if (o.arms) for (const a of o.arms) frogArm(g, a, c, lw);
  g.restore();
}
function frogArm(g, [hx, hy, sx = hx < 0 ? -13 : 13, sy = -11], c, lw) {
  const p = seg(sx, sy, hx, hy);
  g.lineCap = 'round';
  g.lineWidth = 5 + lw * 2; g.strokeStyle = LINE; g.stroke(p);
  g.lineWidth = 5; g.strokeStyle = c.base; g.stroke(p);
  ink(g, circ(hx, hy, 3.4), c.base, lw);
}

// ============================================================ the sky
layer({
  id: 'sky', z: 0, still: true,
  draw(g) {
    const v = st.view;
    g.fillStyle = grad(g, 0, -300, 0, 1400, [[0, '#3b6aa3'], [0.3, '#6f9fcb'], [0.55, '#b7d0d6'], [0.72, '#f1dcb4'], [0.86, '#f7c995'], [1, '#f3b48a']]);
    g.fillRect(v.x0 - 10, v.y0 - 10, v.x1 - v.x0 + 20, v.y1 - v.y0 + 20);
    // the low sun on the right, and its light washing across
    const sx = 1270, sy = 1160;
    g.fillStyle = radial(g, sx, sy, 0, 900, [[0, 'rgba(255,244,210,0.95)'], [0.12, 'rgba(255,228,170,0.6)'], [0.4, 'rgba(255,205,150,0.22)'], [1, 'rgba(255,200,150,0)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    g.save();
    g.globalCompositeOperation = 'lighter';
    const r = rng(4);
    for (let i = 0; i < 9; i++) {
      const a = Math.PI + 0.25 + i * 0.2 + r() * 0.08, len = 1500, w = 0.025 + r() * 0.03;
      g.beginPath(); g.moveTo(sx, sy);
      g.lineTo(sx + Math.cos(a - w) * len, sy + Math.sin(a - w) * len);
      g.lineTo(sx + Math.cos(a + w) * len, sy + Math.sin(a + w) * len);
      g.closePath();
      g.fillStyle = radial(g, sx, sy, 0, len, [[0, 'rgba(255,236,190,0.075)'], [1, 'rgba(255,236,190,0)']]);
      g.fill();
    }
    g.restore();
    g.fillStyle = radial(g, sx, sy, 40, 70, [[0, '#fffbea'], [1, 'rgba(255,248,220,0)']]);
    g.fill(circ(sx, sy, 70));
    ink(g, circ(sx, sy, 44), '#fffbea', 0);
  },
});

// far mountains poking through the sea of cloud, and far islands hanging in the haze
layer({
  id: 'far', z: 3, still: true,
  draw(g) {
    const ranges = [
      { pts: [[-400, 1420], [-240, 1260], [-150, 1300], [-40, 1200], [80, 1290], [170, 1250], [300, 1420]], c: '#a6aacb', lit: '#c8c3d8' },
      { pts: [[1050, 1420], [1160, 1300], [1240, 1330], [1380, 1190], [1480, 1270], [1560, 1230], [1700, 1320], [1800, 1260], [2000, 1420]], c: '#aeaccb', lit: '#d9c9d2' },
    ];
    for (const R of ranges) {
      const p = poly(R.pts);
      g.fillStyle = R.c; g.fill(p);
      g.save(); g.clip(p);
      for (let i = 1; i < R.pts.length - 1; i++) {
        const [px, py] = R.pts[i], [nx, ny] = R.pts[i + 1];
        if (ny < py) continue;
        g.fillStyle = R.lit;
        g.fill(poly([[px, py], [nx, ny], [nx - 10, 1420], [px + 6, 1420]]));
      }
      // snow on the tallest
      g.fillStyle = 'rgba(255,248,240,0.75)';
      g.restore();
      g.lineWidth = 1.4; g.strokeStyle = 'rgba(90,80,120,0.25)'; g.stroke(p);
    }
    const snow = (x, y, w) => { g.fillStyle = 'rgba(255,248,240,0.8)'; g.fill(poly([[x, y], [x + w, y + w * 1.1], [x + w * 0.4, y + w * 0.8], [x, y + w * 1.2], [x - w * 0.5, y + w * 0.9], [x - w * 0.8, y + w * 1.1]])); };
    snow(-40, 1200, 34); snow(1380, 1190, 40);

    const isle = (cx, cy, w, a) => {
      g.save(); g.globalAlpha = a;
      const rock = new Path2D();
      rock.moveTo(cx - w / 2, cy);
      rock.quadraticCurveTo(cx - w * 0.32, cy + w * 0.42, cx + w * 0.04, cy + w * 0.78);
      rock.quadraticCurveTo(cx + w * 0.3, cy + w * 0.38, cx + w / 2, cy);
      rock.closePath();
      g.fillStyle = grad(g, cx - w / 2, 0, cx + w / 2, 0, ['#8f8fb4', '#b9a9c0', '#dcbcb4']); g.fill(rock);
      g.fillStyle = '#a9c4a4'; g.fill(ell(cx, cy, w / 2, w * 0.09));
      g.fillStyle = '#8eb196'; g.fill(circ(cx - w * 0.18, cy - w * 0.12, w * 0.12)); g.fill(circ(cx - w * 0.08, cy - w * 0.15, w * 0.09));
      g.fillStyle = '#c9b8b0'; g.fillRect(cx + w * 0.12, cy - w * 0.16, w * 0.1, w * 0.14);
      g.fillStyle = '#c0756a'; g.fill(poly([[cx + w * 0.1, cy - w * 0.16], [cx + w * 0.17, cy - w * 0.26], [cx + w * 0.24, cy - w * 0.16]]));
      g.lineWidth = w * 0.022; g.strokeStyle = 'rgba(255,255,255,0.7)';
      g.beginPath(); g.moveTo(cx + w * 0.34, cy + w * 0.04); g.quadraticCurveTo(cx + w * 0.38, cy + w * 0.4, cx + w * 0.37, cy + w * 1.1); g.stroke();
      g.restore();
    };
    isle(1395, 690, 150, 0.75);
    isle(150, 560, 90, 0.6);
    isle(1080, 250, 60, 0.45);
  },
});

// ============================================================ clouds
const CLOUD = { union: true, line: 'rgba(170,112,124,0.5)', lw: 1.5, shade: '#e2c3cf', base: '#f9e5d6', lit: '#fff6ea' };
const CLOUD_HI = { union: true, line: 'rgba(120,120,170,0.38)', lw: 1.4, shade: '#c9d0e6', base: '#ecebf2', lit: '#fff8f0' };
function cumulusCircles(seed, w, h) {
  const r = rng(seed), cs = [], n = Math.max(4, Math.round(w / 42));
  for (let i = 0; i < n; i++) {
    const u = i / (n - 1), env = Math.sin(Math.PI * (0.06 + u * 0.88));
    const rr = h * (0.28 + 0.42 * env) * (0.85 + r() * 0.3);
    cs.push([(u - 0.5) * w + (r() - 0.5) * 14, -rr * 0.5, rr]);
  }
  for (let i = 0; i < n * 0.7; i++) {
    const u = 0.18 + r() * 0.64, env = Math.sin(Math.PI * u);
    cs.push([(u - 0.5) * w, -h * (0.45 + 0.45 * env * (0.6 + r() * 0.4)), h * (0.2 + 0.3 * env)]);
  }
  return cs;
}
const clouds = [
  { x: 1180, y: 380, w: 520, h: 150, seed: 3, sp: 3.2, col: CLOUD_HI },
  { x: 520, y: 250, w: 300, h: 95, seed: 9, sp: 4.5, col: CLOUD_HI },
  { x: 180, y: 820, w: 340, h: 110, seed: 5, sp: 2.4, col: CLOUD },
  { x: 1460, y: 930, w: 260, h: 90, seed: 12, sp: 3.6, col: CLOUD },
  { x: -80, y: 330, w: 280, h: 85, seed: 21, sp: 5, col: CLOUD_HI },
];
onLayout(() => {
  for (const c of clouds) {
    c.cs = cumulusCircles(c.seed, c.w, c.h);
    c.sp_ = sprite(-c.w * 0.6 - 10, -c.h * 1.25, c.w * 1.2 + 20, c.h * 1.3, (g) => lumps(g, c.cs, c.col, 0));
    c.billow = c.billow || 0;
  }
});
layer({
  id: 'clouds', z: 4,
  hit(x, y) { for (const c of clouds) if (((x - c.cx) / (c.w * 0.5)) ** 2 + ((y - c.cy + c.h * 0.45) / (c.h * 0.6)) ** 2 < 1) return (this.which = c), true; return false; },
  update(dt, t, L) {
    const v = st.view;
    for (const c of clouds) {
      const span = v.x1 - v.x0 + c.w * 1.4;
      c.cx = v.x0 - c.w * 0.7 + ((((c.x - v.x0 + c.w * 0.7) + t * c.sp * (0.6 + wind(t) * 0.5)) % span) + span) % span;
      c.cy = c.y + Math.sin(t * 0.2 + c.seed) * 4;
      c.billow = ease(c.billow, L.hovered && L.which === c ? 1 : 0, L.hovered && L.which === c ? 3 : 1.2, dt);
    }
  },
  draw(g, t) {
    for (const c of clouds) {
      const k = 1 + 0.035 * Math.sin(t * 0.6 + c.seed) * 0.5 + c.billow * (0.05 + 0.015 * Math.sin(t * 3));
      g.save(); g.translate(c.cx, c.cy); g.scale(k, k); blit(g, c.sp_); g.restore();
      if (c.billow > 0.05) {
        g.save(); g.globalCompositeOperation = 'lighter';
        const r = rng(c.seed * 7);
        for (let i = 0; i < 10; i++) {
          const px = c.cx + (r() - 0.5) * c.w * 0.8, py = c.cy - r() * c.h, tw = Math.max(0, Math.sin(t * (2 + r() * 3) + i));
          g.globalAlpha = c.billow * tw * 0.8;
          g.fillStyle = '#fff6dc'; g.fill(circ(px, py, 1.6 + tw * 1.6));
        }
        g.restore();
      }
    }
  },
});

// a little flock crossing the high sky; get near and it scatters
const flock = { x: 200, y: 160, scatter: 0, birds: [] };
for (let i = 0; i < 6; i++) flock.birds.push({ dx: -i * 28 + (i % 2) * 12, dy: (i % 2 ? 1 : -1) * i * 9, ph: i * 1.7, ox: 0, oy: 0 });
layer({
  id: 'birds', z: 6,
  hit: (x, y) => Math.hypot(x - flock.x + 60, y - flock.y) < 110,
  onEnter() { for (const b of flock.birds) { b.ox += (Math.random() - 0.5) * 80; b.oy -= 30 + Math.random() * 50; } },
  update(dt, t, L) {
    const v = st.view;
    flock.x += dt * (34 + L.hover * 40);
    if (flock.x > v.x1 + 240) flock.x = v.x0 - 80;
    flock.y = 160 + Math.sin(t * 0.3) * 30;
    for (const b of flock.birds) { b.ox = ease(b.ox, 0, 0.6, dt); b.oy = ease(b.oy, 0, 0.6, dt); }
  },
  draw(g, t, L) {
    for (const b of flock.birds) {
      const x = flock.x + b.dx + b.ox, y = flock.y + b.dy + b.oy + Math.sin(t * 1.3 + b.ph) * 4;
      const f = Math.sin(t * (7 + L.hover * 8) + b.ph);
      g.beginPath();
      g.moveTo(x - 11, y - 3 - f * 6); g.quadraticCurveTo(x - 5, y - 4 - f * 3, x, y);
      g.quadraticCurveTo(x + 5, y - 4 - f * 3, x + 11, y - 3 - f * 6);
      g.lineWidth = 2.4; g.strokeStyle = '#4a3a5a'; g.stroke();
    }
  },
});

// the sea of cloud below
layer({
  id: 'cloudsea', z: 5, still: true,
  draw(g) {
    const v = st.view, x0 = v.x0 - 120, x1 = v.x1 + 120;
    const row = (y, rMin, rMax, step, seed, col) => {
      const r = rng(seed), cs = [];
      for (let x = x0; x < x1; x += step * (0.7 + r() * 0.5)) {
        const rr = rMin + r() * (rMax - rMin);
        cs.push([x, y + noise(x * 0.004 + seed) * 22 + rr * 0.1, rr]);
        cs.push([x + step * 0.5, y + rMax * 0.95, rMax * 1.05]);
      }
      lumps(g, cs, col);
    };
    row(1395, 40, 85, 62, 1, { union: true, line: 'rgba(170,112,140,0.32)', lw: 1.3, shade: '#e0c3d2', base: '#f3d8d0', lit: '#fde9dc' });
    row(1470, 55, 110, 80, 2, { union: true, line: 'rgba(170,112,140,0.38)', lw: 1.4, shade: '#dcbdd0', base: '#f6ddd1', lit: '#fff1e2' });
    row(1570, 70, 130, 95, 3, { union: true, line: 'rgba(160,100,130,0.4)', lw: 1.5, shade: '#d4b4cc', base: '#f3d8cf', lit: '#fdeadd' });
    g.fillStyle = '#e8c8cf'; g.fillRect(x0, 1800, x1 - x0, Math.max(0, v.y1 - 1790));
    // the sun's glow on the cloud tops
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = radial(g, 1270, 1300, 0, 700, [[0, 'rgba(255,214,160,0.35)'], [1, 'rgba(255,214,160,0)']]);
    g.fillRect(x0, 1250, x1 - x0, 700);
    g.restore();
  },
});

// ============================================================ hot-air balloon, tied to the tree
const balloon = { x: 300, y: 285, rise: 0, flame: 0, tie: [522, 468], blink: blinker() };
layer({
  id: 'balloon', z: 8,
  hit: (x, y) => Math.hypot(x - balloon.cx, y - balloon.cy) < 92 || (Math.abs(x - balloon.cx) < 30 && y > balloon.cy + 80 && y < balloon.cy + 150),
  update(dt, t, L) {
    balloon.rise = ease(balloon.rise, L.hover, 1.4, dt);
    balloon.flame = ease(balloon.flame, L.hovered ? 1 : 0, L.hovered ? 9 : 4, dt);
    balloon.cx = balloon.x + (wind(t, 300) - 0.75) * 26 + Math.sin(t * 0.5) * 5;
    balloon.cy = balloon.y + Math.sin(t * 0.8) * 7 - balloon.rise * 26;
  },
  draw(g, t, L) {
    const cx = balloon.cx, cy = balloon.cy, r = 82, tilt = (wind(t, 300) - 0.75) * 0.06;
    // tether: from the basket down to the tree, sagging less as the balloon pulls up
    const bx = cx, by = cy + 150, [tx, ty] = balloon.tie;
    const sag = 60 - balloon.rise * 40;
    g.lineWidth = 1.6; g.strokeStyle = '#6e4c46';
    g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo((bx + tx) / 2 - 10, (by + ty) / 2 + sag, tx, ty); g.stroke();
    g.save(); g.translate(cx, cy); g.rotate(tilt);
    // envelope
    const env = new Path2D();
    env.moveTo(-22, r + 14);
    env.bezierCurveTo(-58, r - 6, -r, r * 0.35, -r, -6);
    env.bezierCurveTo(-r, -r * 0.62, -r * 0.55, -r * 1.02, 0, -r * 1.02);
    env.bezierCurveTo(r * 0.55, -r * 1.02, r, -r * 0.62, r, -6);
    env.bezierCurveTo(r, r * 0.35, 58, r - 6, 22, r + 14);
    env.closePath();
    g.lineWidth = 4.4; g.strokeStyle = LINE; g.stroke(env);
    g.save(); g.clip(env);
    const gores = ['#f6e6c8', '#e8735a', '#f6e6c8', '#4f9da0', '#f6e6c8', '#e8735a', '#f6e6c8'];
    g.fillStyle = gores[0]; g.fillRect(-r - 5, -r - 20, r * 2 + 10, r * 2 + 50);
    for (let i = 1; i < gores.length; i++) {
      const k = Math.cos((i / gores.length) * Math.PI * 0.5);
      g.fillStyle = gores[i]; g.fill(ell(0, 0, r * k, r * 1.25));
    }
    g.fillStyle = grad(g, -r, 0, r, 0, [[0, 'rgba(70,40,90,0.35)'], [0.55, 'rgba(70,40,90,0)'], [0.85, 'rgba(255,230,180,0.25)'], [1, 'rgba(255,220,170,0.4)']]);
    g.fillRect(-r - 5, -r - 20, r * 2 + 10, r * 2 + 50);
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(58,34,50,0.4)';
    for (const yy of [-r * 0.45, 0, r * 0.45]) { g.beginPath(); g.ellipse(0, yy, r, 10, 0, 0, Math.PI); g.stroke(); }
    if (balloon.flame > 0.02) { g.fillStyle = radial(g, 0, r, 0, r * 1.2, [[0, `rgba(255,200,110,${0.5 * balloon.flame})`], [1, 'rgba(255,190,110,0)']]); g.fillRect(-r - 5, -r - 20, r * 2 + 10, r * 2 + 50); }
    g.restore();
    // ropes and basket
    g.lineWidth = 1.4; g.strokeStyle = '#5a3c3c';
    for (const sx of [-1, 1]) { g.beginPath(); g.moveTo(sx * 20, r + 14); g.lineTo(sx * 17, r + 42); g.stroke(); }
    if (balloon.flame > 0.02) {
      const f = balloon.flame, fl = 14 + 8 * Math.sin(t * 40) * 0.3;
      g.fillStyle = `rgba(255,170,60,${0.9 * f})`;
      g.beginPath(); g.moveTo(-6, r + 30); g.quadraticCurveTo(-7, r + 14 - fl * f * 0.6, 0, r + 12 - fl * f); g.quadraticCurveTo(7, r + 14 - fl * f * 0.6, 6, r + 30); g.fill();
      g.fillStyle = `rgba(255,240,170,${f})`; g.fill(ell(0, r + 26 - fl * 0.3 * f, 3, 6 * f + 1));
    }
    // the frog in the basket
    const lookX = clamp((P.x - cx) / 300, -1, 1), lookY = clamp((P.y - cy - 120) / 300, -1, 1);
    frog(g, 2, r + 62, 0.72, { open: balloon.blink(t), look: [lookX, lookY], smile: 2 + L.hover * 2.5,
      arms: L.hover > 0.3 ? [[18, -20 - Math.sin(t * 12) * 6 * L.hover]] : null });
    const bk = poly([[-20, r + 42], [20, r + 42], [17, r + 68], [-17, r + 68]]);
    ink(g, bk, grad(g, -20, 0, 20, 0, ['#9b6a3f', '#c99a5e', '#e2b878']), 2);
    g.lineWidth = 1; g.strokeStyle = 'rgba(58,34,50,0.45)';
    for (let yy = r + 49; yy < r + 68; yy += 6) { g.beginPath(); g.moveTo(-19, yy); g.lineTo(19, yy); g.stroke(); }
    ink(g, rect(-22, r + 40, 44, 5), '#7c5234', 1.6);
    g.restore();
  },
});

// ============================================================ the little rock, its bridge and the fisher
layer({
  id: 'sat-rock', z: 10, still: true,
  draw(g) {
    const top = ell(215, 862, 80, 15);
    const rock = curve([[135, 862], [146, 895], [168, 935], [192, 975], [208, 1003], [226, 975], [252, 935], [278, 898], [295, 862]], true);
    ink(g, rock, grad(g, 135, 0, 295, 0, ['#5d4257', '#8f6262', '#d8a078']), 2.2);
    g.save(); g.clip(rock);
    g.fillStyle = grad(g, 0, 870, 0, 1003, ['rgba(60,30,60,0)', 'rgba(60,30,60,0.4)']); g.fillRect(130, 860, 170, 150);
    g.lineWidth = 1.4; g.strokeStyle = 'rgba(58,34,50,0.35)';
    for (const y of [900, 935, 965]) { g.beginPath(); g.moveTo(150, y); g.quadraticCurveTo(210, y + 10, 280, y - 4); g.stroke(); }
    g.restore();
    ink(g, top, grad(g, 0, 847, 0, 877, ['#b2d777', '#79ad53']), 2.2);
    g.fillStyle = '#5f9a49';
    g.fill(curve([[135, 862], [160, 873], [190, 877], [215, 878], [245, 876], [272, 871], [295, 862], [280, 880], [262, 883], [240, 892], [222, 884], [200, 890], [178, 882], [152, 884]], true));
    // the mailbox
    tube(g, seg(240, 864, 240, 822), '#9a6a48', 4, 1.6);
    const box = new Path2D(); box.moveTo(224, 822); box.lineTo(224, 806); box.arc(238, 806, 14, Math.PI, 0); box.lineTo(252, 822); box.closePath();
    ink(g, box, grad(g, 224, 0, 252, 0, ['#b8443a', '#e0644c', '#f08a62']), 2);
    ink(g, rect(226, 807, 3, 12), '#3a2232', 0);
    tube(g, seg(253, 812, 253, 798), '#f2c14e', 2, 1.2);
    ink(g, poly([[253, 798], [263, 801], [253, 805]]), '#f2c14e', 1.4);
    // a tuft and a pebble
    ink(g, ell(195, 858, 9, 4), '#c8b8b0', 1.4);
  },
});

const bridge = { b: 0, bv: 0, lan: [0, 0], lanv: [0, 0] };
const bA = [290, 857], bB = [374, 896], bPA = [286, 826], bPB = [381, 862];
layer({
  id: 'bridge', z: 11,
  hit: poly([[280, 815], [395, 850], [395, 925], [280, 880]]),
  onEnter() { bridge.bv += 70; },
  update(dt, t, L) {
    if (L.hovered) bridge.bv += clamp(P.vy, -400, 400) * dt * 0.9;
    const a = -70 * bridge.b - 3.2 * bridge.bv;
    bridge.bv += a * dt; bridge.b += bridge.bv * dt;
    for (let i = 0; i < 2; i++) {
      const push = (wind(t, 300 + i * 40) - 0.7) * 0.35 + bridge.bv * 0.004;
      bridge.lanv[i] += (-30 * (bridge.lan[i] - push) - 1.5 * bridge.lanv[i]) * dt;
      bridge.lan[i] += bridge.lanv[i] * dt;
    }
  },
  draw(g, t) {
    const sag = 17 + bridge.b, rs = 11 + bridge.b * 0.6, sway = Math.sin(t * 1.1) * 1.2;
    const deck = (u) => [lerp(bA[0], bB[0], u), lerp(bA[1], bB[1], u) + sag * 4 * u * (1 - u) + sway * Math.sin(Math.PI * u)];
    const rope = (u) => [lerp(bPA[0], bPB[0], u), lerp(bPA[1], bPB[1], u) + rs * 4 * u * (1 - u) + sway * Math.sin(Math.PI * u)];
    // posts
    tube(g, seg(bPA[0], bPA[1] - 3, bA[0] - 3, bA[1] + 6), '#8f5f43', 4, 1.6);
    tube(g, seg(bPB[0], bPB[1] - 3, bB[0] + 6, bB[1] + 8), '#8f5f43', 4, 1.6);
    // hangers
    g.lineWidth = 1.2; g.strokeStyle = '#6e4c46';
    for (let i = 1; i < 10; i++) { const u = i / 10, d = deck(u), r = rope(u); g.beginPath(); g.moveTo(...r); g.lineTo(...d); g.stroke(); }
    // the deck: planks seen edge-on
    const dp = new Path2D(); for (let i = 0; i <= 20; i++) { const d = deck(i / 20); i ? dp.lineTo(...d) : dp.moveTo(...d); }
    tube(g, dp, '#c9945e', 4.5, 1.7);
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(58,34,50,0.6)';
    for (let i = 1; i < 14; i++) { const d = deck(i / 14); g.beginPath(); g.moveTo(d[0], d[1] - 2.5); g.lineTo(d[0], d[1] + 2.5); g.stroke(); }
    // hand rope
    const rp = new Path2D(); for (let i = 0; i <= 20; i++) { const r = rope(i / 20); i ? rp.lineTo(...r) : rp.moveTo(...r); }
    g.lineWidth = 1.8; g.strokeStyle = '#6e4c46'; g.stroke(rp);
    // paper lanterns hanging from the rope
    [0.33, 0.7].forEach((u, i) => {
      const [x, y] = rope(u);
      g.save(); g.translate(x, y); g.rotate(bridge.lan[i]);
      g.lineWidth = 1.1; g.strokeStyle = '#5a3c3c'; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 9); g.stroke();
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = radial(g, 0, 17, 0, 26, [[0, 'rgba(255,190,110,0.5)'], [1, 'rgba(255,190,110,0)']]); g.fill(circ(0, 17, 26));
      g.restore();
      ink(g, ell(0, 17, 7, 9), grad(g, -7, 0, 7, 0, ['#e88a4f', '#f8c47a', '#ffe2a0']), 1.6);
      ink(g, rect(-4, 7, 8, 2.5), '#6e3c32', 1);
      g.restore();
    });
  },
});

// the fisher: a frog on the little rock's edge, fishing the open sky; little sky-fish circle the bobber
const fisher = { catch: 0, blink: blinker(), fish: [0, 1, 2].map((i) => ({ ph: i * 2.1, r: 18 + i * 7 })) };
layer({
  id: 'fisher', z: 12,
  hit: (x, y) => Math.hypot(x - 158, y - 845) < 34 || (x > 60 && x < 120 && y > 780 && y < fisher.by + 20),
  update(dt, t, L) { fisher.catch = ease(fisher.catch, L.hovered && L.since > 0.25 ? 1 : 0, L.hovered ? 1.6 : 0.9, dt); },
  draw(g, t, L) {
    const c = fisher.catch;
    const tip = [88 - c * 6, 786 - c * 20];
    const bob = Math.sin(t * 1.7) * 4;
    const fall = 1040 - c * 205;
    const bx = 82 + Math.sin(t * 0.7) * 3 + (wind(t, 80) - 0.7) * 10;
    fisher.by = fall;
    // the rod and line
    const rod = quad(150, 842, 120, 800 - c * 15, tip[0], tip[1]);
    tube(g, rod, '#b07a4c', 2.4, 1.3);
    g.lineWidth = 1; g.strokeStyle = 'rgba(58,34,50,0.7)';
    g.beginPath(); g.moveTo(...tip); g.quadraticCurveTo(bx - 8, (tip[1] + fall) / 2, bx, fall + bob); g.stroke();
    // the bobber
    ink(g, circ(bx, fall + bob, 5), '#fff6e8', 1.4);
    g.save(); g.beginPath(); g.rect(bx - 6, fall + bob, 12, 6); g.clip(); g.fillStyle = '#e0644c'; g.fill(circ(bx, fall + bob, 5)); g.restore();
    g.lineWidth = 1.4; g.strokeStyle = LINE; g.stroke(circ(bx, fall + bob, 5));
    // the sky-fish: round, blushing, finned; one bites and gets reeled up when you linger
    fisher.fish.forEach((f, i) => {
      const caught = i === 0 ? c : 0;
      const a = t * (0.9 + i * 0.2) + f.ph;
      let fx_ = bx + Math.cos(a) * f.r * 1.6, fy_ = fall + 40 + Math.sin(a) * f.r * 0.6 + i * 10;
      let dir = -Math.sin(a) > 0 ? 1 : -1;
      if (caught > 0.02) { fx_ = lerp(fx_, bx, caught); fy_ = lerp(fy_, fall + bob + 14, caught); dir = 1; }
      g.save(); g.translate(fx_, fy_); g.scale(dir, 1);
      if (caught > 0.5) g.rotate(-1.2 + Math.sin(t * 14) * 0.3);
      const wag = Math.sin(t * 9 + i) * 3;
      ink(g, poly([[-8, 0], [-15, -5 + wag], [-15, 5 + wag]]), '#f2a65e', 1.3);
      ink(g, ell(0, 0, 9, 6.5), grad(g, 0, -7, 0, 7, ['#ffd48a', '#f29a5e']), 1.4);
      g.fillStyle = LINE; g.fill(circ(4, -1.2, 1.5));
      g.fillStyle = 'rgba(243,120,130,0.7)'; g.fill(ell(2, 2.2, 2.2, 1.3));
      g.restore();
    });
    if (c > 0.85 && Math.random() < 0.04) spawn({ kind: 'spark', x: bx + (Math.random() - 0.5) * 20, y: fall + 10, vy: -20, life: 0.8 });
    // the frog
    const lean = c * 0.12;
    frog(g, 160, 858, 0.95, { flip: true, rot: lean, open: fisher.blink(t), look: [1, 0.4], smile: 2 + c * 3,
      arms: [[-14, -10 - c * 6, -10, -11]] });
  },
});

// ============================================================ the island
const IS = { cx: 770, cy: 895, rx: 410, ry: 70 };
const frontY = (x) => IS.cy + IS.ry * Math.sqrt(Math.max(0, 1 - ((x - IS.cx) / IS.rx) ** 2));
const ROCK = [[360, 895], [366, 940], [395, 995], [440, 1050], [505, 1112], [560, 1160], [622, 1220], [690, 1284], [748, 1335], [795, 1368], [838, 1335], [900, 1272], [970, 1200], [1040, 1128], [1098, 1060], [1146, 985], [1172, 935], [1180, 895]];

// roots hanging from under the island, swinging in the breeze; a lantern on the lowest one
const roots = [[470, 1075, 45], [545, 1145, 70], [610, 1205, 38], [672, 1268, 85], [735, 1325, 50], [795, 1360, 120], [858, 1318, 60], [935, 1235, 80], [1005, 1162, 42], [1075, 1088, 65]];
layer({
  id: 'roots', z: 14,
  hit: poly([[460, 1060], [1090, 1060], [820, 1560], [760, 1560]]),
  update(dt, t, L) { this.stir = ease(this.stir || 0, L.hovered ? clamp(P.sp / 300, 0.3, 1) : 0, 3, dt); },
  draw(g, t) {
    roots.forEach(([x, y, len], i) => {
      const sw = (wind(t, x) - 0.7) * len * 0.25 + Math.sin(t * 1.3 + i) * (3 + this.stir * 14);
      const ex = x + sw, ey = y + len;
      // tapered: sample the curve and step the width down toward a curled tip
      const pts = [];
      for (let k = 0; k <= 14; k++) {
        const u = k / 14, m = 1 - u;
        pts.push([m ** 3 * x + 3 * m * m * u * (x - 6) + 3 * m * u * u * (ex - sw * 0.4) + u ** 3 * ex, m ** 3 * (y - 12) + 3 * m * m * u * (y + len * 0.35) + 3 * m * u * u * (y + len * 0.7) + u ** 3 * ey]);
      }
      const curl = i % 3 === 1 ? 1 : -1;
      pts.push([ex + curl * 5, ey + 5], [ex + curl * 8, ey]);
      for (const pass of [0, 1]) for (let k = 0; k < pts.length - 1; k++) {
        const w = lerp(5, 1.2, k / (pts.length - 1));
        g.lineWidth = pass ? w : w + 2.8; g.strokeStyle = pass ? (k < 5 ? '#8a6650' : '#9c7a5e') : LINE;
        g.beginPath(); g.moveTo(...pts[k]); g.lineTo(...pts[k + 1]); g.stroke();
      }
      if (i % 2 === 0) { ink(g, ell(ex + 4, ey - 4, 6, 3, undefined, -0.6), '#6fa64f', 1.2); ink(g, ell(ex - 5, ey - 12, 5, 2.6, undefined, 0.6), '#86c75a', 1.2); }
      if (i === 5) {
        g.save(); g.globalCompositeOperation = 'lighter';
        g.fillStyle = radial(g, ex, ey + 14, 0, 40, [[0, 'rgba(255,200,110,0.55)'], [1, 'rgba(255,200,110,0)']]); g.fill(circ(ex, ey + 14, 40));
        g.restore();
        ink(g, rect(ex - 5, ey + 2, 10, 3), '#5a3c3c', 1.2);
        ink(g, poly([[ex - 6, ey + 5], [ex + 6, ey + 5], [ex + 5, ey + 22], [ex - 5, ey + 22]]), grad(g, 0, ey, 0, ey + 22, ['#ffe39a', '#f6a95a']), 1.6);
        ink(g, rect(ex - 6, ey + 22, 12, 3), '#5a3c3c', 1.2);
      }
    });
  },
});

// stones floating under the island; wave the pointer through and they drift apart, then settle
const stones = [[560, 1430, 20, 1], [990, 1395, 15, 2], [700, 1495, 11, 3], [1195, 1300, 13, 4], [400, 1250, 17, 5], [880, 1460, 9, 6]].map(([x, y, r, s]) => ({ x, y, r, s, ox: 0, oy: 0, vx: 0, vy: 0 }));
layer({
  id: 'stones', z: 13,
  hit: (x, y) => stones.some((s) => Math.hypot(x - s.x - s.ox, y - s.y - s.oy) < s.r + 26),
  update(dt, t) {
    for (const s of stones) {
      const dx = s.x + s.ox - P.x, dy = s.y + s.oy - P.y, d = Math.hypot(dx, dy);
      if (P.inside && d < 80) { s.vx += (dx / d) * 300 * dt; s.vy += (dy / d) * 300 * dt; }
      s.vx += -4 * s.ox * dt - 1.4 * s.vx * dt; s.vy += -4 * s.oy * dt - 1.4 * s.vy * dt;
      s.ox += s.vx * dt; s.oy += s.vy * dt;
    }
  },
  draw(g, t) {
    for (const s of stones) {
      const x = s.x + s.ox, y = s.y + s.oy + Math.sin(t * 0.8 + s.s * 1.7) * 6, r = s.r;
      const p = curve([[x - r, y - r * 0.2], [x - r * 0.4, y - r * 0.5], [x + r * 0.6, y - r * 0.45], [x + r, y - r * 0.1], [x + r * 0.3, y + r * 0.9], [x - r * 0.3, y + r * 0.7]], true);
      ink(g, p, grad(g, x - r, 0, x + r, 0, ['#5d4257', '#9a6e62', '#e0a77a']), 1.8);
      ink(g, ell(x, y - r * 0.32, r * 0.8, r * 0.22), '#8ec261', 1.4);
    }
  },
});

layer({
  id: 'island-rock', z: 15, still: true,
  draw(g) {
    const rock = curve(ROCK, true);
    g.lineWidth = 4.8; g.strokeStyle = LINE; g.stroke(rock);
    g.fillStyle = grad(g, 360, 0, 1180, 0, [[0, '#563d55'], [0.35, '#7e5560'], [0.7, '#b67a66'], [1, '#e3a77b']]); g.fill(rock);
    g.save(); g.clip(rock);
    g.fillStyle = grad(g, 0, 920, 0, 1370, ['rgba(60,30,70,0)', 'rgba(60,30,70,0.5)']); g.fillRect(340, 880, 860, 500);
    // strata, broken and wandering
    const r = rng(77);
    for (let k = 0; k < 8; k++) {
      const y0 = 960 + k * 48;
      g.setLineDash([60 + r() * 120, 18 + r() * 40, 20 + r() * 50, 30 + r() * 30]);
      g.lineDashOffset = r() * 200;
      g.beginPath();
      for (let x = 340; x <= 1200; x += 20) { const y = y0 + Math.sin(x * 0.009 + k * 1.3) * 10 + (x - 770) * (x - 770) * -0.00006 * (k + 2); x === 340 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.lineWidth = 1.6; g.strokeStyle = 'rgba(46,24,44,0.42)'; g.stroke();
      g.lineDashOffset += 4;
      g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,214,170,0.22)';
      g.save(); g.translate(0, 2.5); g.stroke(); g.restore();
    }
    g.setLineDash([]);
    // embedded stones and a few crystals catching the light
    for (let i = 0; i < 16; i++) {
      const x = 430 + r() * 700, y = 960 + r() * 300;
      if (!g.isPointInPath(rock, x * st.R + st.ox * st.dpr, y * st.R + st.oy * st.dpr)) continue;
      ink(g, ell(x, y, 6 + r() * 9, 4 + r() * 5, undefined, r() - 0.5), r() < 0.5 ? 'rgba(220,170,140,0.5)' : 'rgba(80,50,80,0.35)', 1.2, 'rgba(46,24,44,0.45)');
    }
    for (const [x, y, s] of [[1010, 1120, 1], [1040, 1135, 0.7], [610, 1180, 0.8]]) {
      const cp = poly([[x, y], [x + 6 * s, y - 20 * s], [x + 13 * s, y], [x + 7 * s, y + 6 * s]]);
      ink(g, cp, grad(g, x, y - 20, x + 13, y, ['#c9f0f2', '#7fc4d6', '#6a8fc0']), 1.4);
    }
    // warm rim light along the sunward edge
    g.lineWidth = 9; g.strokeStyle = grad(g, 760, 0, 1180, 0, ['rgba(255,214,160,0)', 'rgba(255,214,160,0.75)']); g.stroke(rock);
    g.restore();
  },
});

// the round door in the rock; linger and a hedgehog peeks out
const hedge = { open: 0, blink: blinker() };
layer({
  id: 'rock-door', z: 17,
  hit: (x, y) => Math.hypot(x - 905, y - 1072) < 40,
  update(dt, t, L) { hedge.open = ease(hedge.open, L.hovered ? 1 : 0, L.hovered ? 3 : 1.5, dt); },
  draw(g, t, L) {
    const x = 905, y = 1072, r = 24;
    ink(g, circ(x, y, r + 7), grad(g, x - r, 0, x + r, 0, ['#8d7a86', '#c5aaa0']), 2);
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(58,34,50,0.5)';
    for (let i = 0; i < 10; i++) { const a = (i / 10) * TAU; g.beginPath(); g.moveTo(x + Math.cos(a) * r, y + Math.sin(a) * r); g.lineTo(x + Math.cos(a) * (r + 7), y + Math.sin(a) * (r + 7)); g.stroke(); }
    const o = hedge.open;
    ink(g, circ(x, y, r), radial(g, x, y + 6, 2, r, ['#ffcf7a', '#c9703f', '#5a2a24']), 1.8);
    if (o > 0.05) {
      // the hedgehog: a round face, a black nose, spikes behind
      const hx = x + 6 - (1 - o) * 26, hy = y + 6;
      g.save(); g.clip(circ(x, y, r));
      const sp = new Path2D();
      for (let i = 0; i <= 12; i++) { const a = Math.PI * 0.75 + (i / 12) * Math.PI * 1.1, rr = i % 2 ? 15 : 20; i ? sp.lineTo(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr) : sp.moveTo(hx + Math.cos(a) * rr, hy + Math.sin(a) * rr); }
      sp.closePath();
      ink(g, sp, '#7a5244', 1.6);
      ink(g, ell(hx + 4, hy + 2, 12, 10), '#f0d2b0', 1.6);
      ink(g, circ(hx + 15, hy + 3, 2.6), LINE, 0);
      const op = hedge.blink(t);
      g.fillStyle = LINE; g.fill(ell(hx + 6, hy - 2, 1.8, 2 * op + 0.2));
      g.fillStyle = 'rgba(243,120,130,0.6)'; g.fill(ell(hx + 9, hy + 4, 2.5, 1.5));
      g.restore();
    }
    // the door swings open on its left hinge
    const dw = Math.cos(o * 1.35);
    if (dw > 0.02) {
      g.save(); g.translate(x - r, y); g.scale(dw, 1);
      ink(g, circ(r, 0, r - 1), grad(g, 0, 0, r * 2, 0, ['#8a4f33', '#b86e44', '#cf8a55']), 1.8);
      g.lineWidth = 1 / Math.max(dw, 0.2); g.strokeStyle = 'rgba(58,34,50,0.45)';
      for (const dx of [-9, 0, 9]) { g.beginPath(); g.moveTo(r + dx, -r + 4); g.lineTo(r + dx, r - 4); g.stroke(); }
      ink(g, circ(r + 13, 2, 2.2), '#f2c14e', 1);
      g.restore();
    }
    // a step and a lamp
    ink(g, ell(x, y + r + 9, 26, 5), '#a58b8a', 1.6);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = radial(g, x + 42, y - 14, 0, 34, [[0, 'rgba(255,200,110,0.6)'], [1, 'rgba(255,200,110,0)']]); g.fill(circ(x + 42, y - 14, 34));
    g.restore();
    tube(g, quad(x + 30, y - 4, x + 42, y - 6, x + 42, y - 22), '#5a3c3c', 1.6, 1.2);
    ink(g, ell(x + 42, y - 14, 5, 7), '#ffe39a', 1.4);
  },
});

layer({
  id: 'island-top', z: 16, still: true,
  draw(g) {
    const top = ell(IS.cx, IS.cy, IS.rx, IS.ry);
    g.fillStyle = grad(g, 0, IS.cy - IS.ry, 0, IS.cy + IS.ry, ['#b6da7c', '#94c564', '#6ea551']); g.fill(top);
    g.save(); g.clip(top);
    g.fillStyle = radial(g, 1080, 880, 0, 380, [[0, 'rgba(255,232,160,0.45)'], [1, 'rgba(255,232,160,0)']]); g.fillRect(340, 800, 860, 200);
    g.fillStyle = radial(g, 430, 900, 0, 260, [[0, 'rgba(50,70,90,0.18)'], [1, 'rgba(50,70,90,0)']]); g.fillRect(340, 800, 860, 200);
    g.restore();
    // the grassy skirt draping over the front edge, with moss trailing down
    const r = rng(31), N = 90, upper = [], lower = [];
    for (let i = 0; i <= N; i++) {
      const a = (i / N) * Math.PI, x = IS.cx + IS.rx * Math.cos(a), y = IS.cy + IS.ry * Math.sin(a);
      upper.push([x, y - 2]);
      const drip = (6 + Math.abs(noise(i * 0.7)) * 14) * Math.sin(a) ** 0.5 + (r() < 0.12 ? 18 + r() * 22 : 0);
      lower.push([x, y + drip]);
    }
    const skirt = new Path2D();
    skirt.moveTo(...upper[0]); for (const p of upper) skirt.lineTo(...p);
    curve(lower.slice().reverse(), false, skirt); skirt.closePath();
    g.fillStyle = grad(g, 0, IS.cy + 20, 0, IS.cy + IS.ry + 40, ['#76ad55', '#4c8645']); g.fill(skirt);
    g.lineWidth = 2.2; g.strokeStyle = LINE; g.stroke(curve(lower.slice().reverse(), false));
    g.beginPath(); g.ellipse(IS.cx, IS.cy, IS.rx, IS.ry, 0, Math.PI, TAU); g.stroke();
    g.beginPath(); g.moveTo(IS.cx + IS.rx, IS.cy); g.lineTo(...lower[0]); g.moveTo(IS.cx - IS.rx, IS.cy); g.lineTo(...lower[N]); g.stroke();
    // tufts and tiny flowers
    for (let i = 0; i < 160; i++) {
      const a = r() * TAU, d = Math.sqrt(r()) * 0.93, x = IS.cx + Math.cos(a) * IS.rx * d, y = IS.cy + Math.sin(a) * IS.ry * d;
      g.lineWidth = 1.2; g.strokeStyle = 'rgba(52,100,56,0.55)';
      g.beginPath(); g.moveTo(x - 3, y - 4); g.lineTo(x, y); g.lineTo(x + 3, y - 5); g.moveTo(x, y); g.lineTo(x, y - 6); g.stroke();
      if (r() < 0.3) { g.fillStyle = ['#fff6e0', '#f7d55a', '#f3a0b0', '#c9b6ef'][(r() * 4) | 0]; g.fill(circ(x + 4, y - 6, 2.2)); }
    }
    // stepping stones from the door out toward the pond
    for (const [x, y] of [[700, 950], [742, 955], [786, 957], [830, 954], [874, 948], [916, 940], [954, 930]]) ink(g, ell(x, y, 15, 5.5), grad(g, x - 15, 0, x + 15, 0, ['#c8b4ae', '#efe0cf']), 1.6);
  },
});

// ============================================================ the windmill
const mill = { a: 0.4, w: 0.5, hub: [960, 566] };
layer({
  id: 'mill-tower', z: 20, still: true,
  draw(g) {
    const L = poly([[925, 896], [960, 901], [960, 578], [944, 581]]), Rf = poly([[960, 901], [995, 896], [976, 581], [960, 578]]);
    ink(g, L, grad(g, 925, 0, 960, 0, ['#83573f', '#a87452']), 2);
    ink(g, Rf, grad(g, 960, 0, 995, 0, ['#c88e5a', '#eab27a']), 2);
    g.lineWidth = 1.1; g.strokeStyle = 'rgba(58,34,50,0.4)';
    for (let y = 600; y < 890; y += 15) { const k = (y - 578) / 323; g.beginPath(); g.moveTo(944 - 19 * k, y); g.lineTo(960, y + 3 * k); g.lineTo(976 + 19 * k, y); g.stroke(); }
    const door = new Path2D(); door.moveTo(951, 899); door.lineTo(951, 878); door.arc(961, 878, 10, Math.PI, 0); door.lineTo(971, 899); door.closePath();
    ink(g, door, '#6e3f2c', 1.8);
    ink(g, rect(955, 716, 12, 17), '#ffd27a', 1.6);
    const cap = new Path2D(); cap.moveTo(937, 586); cap.quadraticCurveTo(936, 552, 960, 545); cap.quadraticCurveTo(984, 552, 983, 586); cap.closePath();
    ink(g, cap, grad(g, 937, 0, 983, 0, ['#9b3f3a', '#d9664a', '#f39466']), 2);
  },
});
layer({
  id: 'mill-sails', z: 21,
  hit: (x, y) => Math.hypot(x - mill.hub[0], y - mill.hub[1]) < 150,
  update(dt, t, L) {
    const idle = 0.25 + 0.45 * wind(t, 960);
    mill.w = ease(mill.w, L.hovered ? 5.2 : idle, L.hovered ? 0.9 : 0.35, dt);
    mill.a += mill.w * dt;
    // a racing mill stirs the breeze for the whole drawing
    breeze.extra = ease(breeze.extra, clamp((mill.w - 1) / 4, 0, 1) * 1.1, 1, dt);
  },
  draw(g) {
    const [hx, hy] = mill.hub;
    for (let i = 0; i < 4; i++) {
      const a = mill.a + (i * TAU) / 4, ca = Math.cos(a), sa = Math.sin(a);
      const at = (r, q) => [hx + ca * r - sa * q, hy + sa * r + ca * q];
      tube(g, seg(...at(8, 0), ...at(148, 0)), '#8f5f43', 4.5, 1.6);
      const sail = poly([at(32, 3), at(146, 3), at(146, 34), at(36, 30)]);
      ink(g, sail, i % 2 ? '#f6ead2' : '#fbe1c4', 1.8);
      g.lineWidth = 1.1; g.strokeStyle = 'rgba(58,34,50,0.5)';
      for (let k = 1; k < 6; k++) { const r = 32 + k * 19; g.beginPath(); g.moveTo(...at(r, 3)); g.lineTo(...at(r, 31 + k * 0.6)); g.stroke(); }
      g.beginPath(); g.moveTo(...at(34, 17)); g.lineTo(...at(146, 19)); g.stroke();
    }
    ink(g, circ(hx, hy, 11), '#6e3f2c', 2);
    ink(g, circ(hx, hy, 4.5), '#f2c14e', 1.4);
  },
});

// ============================================================ the tree
let treeSprite = null;
function drawTree(g) {
  const trunk = new Path2D();
  trunk.moveTo(444, 922); trunk.bezierCurveTo(456, 860, 438, 790, 457, 700); trunk.lineTo(478, 700);
  trunk.bezierCurveTo(470, 790, 494, 860, 500, 922);
  trunk.quadraticCurveTo(472, 914, 444, 922); trunk.closePath();
  for (const p of [quad(464, 770, 430, 720, 395, 660), quad(470, 735, 510, 690, 548, 625), quad(466, 712, 470, 660, 462, 600), quad(470, 700, 505, 560, 520, 470)]) tube(g, p, '#8b5a44', 9, 2);
  ink(g, trunk, grad(g, 444, 0, 500, 0, ['#6e4436', '#94624a', '#c08a5e']), 2.2);
  g.lineWidth = 1.2; g.strokeStyle = 'rgba(58,34,50,0.45)';
  for (const [x0, y0, x1, y1] of [[462, 900, 466, 840], [480, 880, 476, 800], [470, 790, 468, 740]]) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x0 + 5, (y0 + y1) / 2, x1, y1); g.stroke(); }
  // the canopy: clumps of leaves, lit from the upper right
  const r = rng(11), clusters = [];
  for (let i = 0; i < 17; i++) {
    const a = (i / 17) * TAU + r() * 0.3, d = 0.45 + r() * 0.5;
    clusters.push([460 + Math.cos(a) * 160 * d, 590 + Math.sin(a) * 118 * d]);
  }
  clusters.push([460, 580], [500, 540], [420, 610]);
  clusters.sort((a, b) => a[1] - b[1]);
  const col = { line: '#2f4a3a', lw: 2, shade: '#3f7a4f', base: '#5f9e52', lit: '#97c967', seam: 'rgba(40,70,50,0.45)' };
  const all = [];
  for (const [cx, cy] of clusters) {
    const n = 5 + ((r() * 3) | 0);
    for (let k = 0; k < n; k++) { const a = r() * TAU, d = r() * 26; all.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, 20 + r() * 18]); }
  }
  lumps(g, all, col);
  // ripe peaches
  for (let i = 0; i < 12; i++) {
    const x = 330 + r() * 260, y = 500 + r() * 190;
    if (((x - 460) / 165) ** 2 + ((y - 595) / 125) ** 2 > 0.8) continue;
    ink(g, circ(x, y, 5), grad(g, x - 5, y - 5, x + 5, y + 5, ['#ffc27a', '#ef7a55']), 1.5);
    g.fillStyle = 'rgba(255,255,240,0.8)'; g.fill(circ(x + 1.6, y - 1.8, 1.3));
  }
}
onLayout(() => { treeSprite = sprite(250, 400, 450, 530, drawTree); });
const tree = { sh: 0 };
layer({
  id: 'tree', z: 24,
  hit: (x, y) => ((x - 460) / 185) ** 2 + ((y - 590) / 150) ** 2 < 1 || (x > 440 && x < 505 && y > 690 && y < 925),
  update(dt, t, L) {
    tree.sh = ease(tree.sh, L.hovered ? clamp(0.25 + P.sp / 500, 0, 1) : 0, 4, dt);
    if (L.hovered && Math.random() < dt * (2 + P.sp / 60)) spawn({ kind: 'leaf', x: 330 + Math.random() * 260, y: 520 + Math.random() * 160, vy: 20, vx: 10, life: 4.5, rot: Math.random() * 6, vr: 2, size: 0.8 + Math.random() * 0.5 });
  },
  draw(g, t) {
    const sk = (wind(t, 460) - 0.75) * 0.025 + Math.sin(t * 23) * 0.006 * tree.sh + Math.sin(t * 1.1) * 0.004;
    g.save(); g.translate(472, 922); g.transform(1, 0, -sk, 1, 0, 0); g.translate(-472, -922);
    blit(g, treeSprite);
    g.restore();
  },
});

// the hammock between the tree and the cottage, with someone asleep in it
const ham = { a: 0, v: 0, blink: 0, zt: 0, ht: 0 };
const hA = [494, 806], hB = [600, 812];
layer({
  id: 'hammock', z: 26,
  hit: poly([[494, 800], [604, 800], [580, 870], [510, 870]]),
  onEnter() { ham.v += (P.vx >= 0 ? 1 : -1) * 1.4; },
  update(dt, t, L) {
    const push = (wind(t, 540) - 0.75) * 0.25;
    ham.v += (-9 * (ham.a - push) - 0.5 * ham.v) * dt;
    if (L.hovered && Math.abs(ham.a) < 0.05) ham.v += Math.sign(ham.v || 1) * 2.2 * dt * 10;
    ham.v = clamp(ham.v, -2.2, 2.2);
    ham.a += ham.v * dt;
    ham.zt -= dt; ham.ht -= dt;
    if (ham.zt < 0) { ham.zt = 1.7; spawn({ kind: 'z', x: 560 + ham.a * 30, y: 818, vx: 8, vy: -16, life: 2.6, size: 0.8 }); }
    if (L.hovered && ham.ht < 0) { ham.ht = 0.9; spawn({ kind: 'heart', x: 560 + ham.a * 30, y: 815, vx: (Math.random() - 0.5) * 10, vy: -26, life: 2, size: 0.9 }); }
  },
  draw(g, t, L) {
    const off = ham.a * 26, lift = Math.abs(ham.a) * 6;
    const e1 = [hA[0] + 10, hA[1] + 10], e2 = [hB[0] - 10, hB[1] + 10];
    const mx = (e1[0] + e2[0]) / 2 + off, my = 858 - lift;
    g.lineWidth = 1.4; g.strokeStyle = '#6e4c46';
    g.beginPath(); g.moveTo(...hA); g.lineTo(...e1); g.moveTo(...hB); g.lineTo(...e2); g.stroke();
    ink(g, circ(hB[0], hB[1], 2.5), '#5a3c3c', 1);
    // the sleeper's head peeks over the edge; its body is in the hammock
    const breathe = Math.sin(t * 1.6) * 0.6;
    frog(g, mx + 14, my - 18 + breathe, 0.78, { sleep: true, smile: 1.4 + L.hover * 2, rot: -0.15 + ham.a * 0.3 });
    const top = quad(e1[0], e1[1], mx * 2 - (e1[0] + e2[0]) / 2, (my - 22) * 2 - (e1[1] + e2[1]) / 2, e2[0], e2[1]);
    const fabric = new Path2D(top);
    fabric.quadraticCurveTo(mx * 2 - (e1[0] + e2[0]) / 2, (my + 6) * 2 - (e1[1] + e2[1]) / 2, e1[0], e1[1]);
    ink(g, fabric, '#f3cf74', 2);
    g.save(); g.clip(fabric);
    g.lineWidth = 4; g.strokeStyle = '#e0644c';
    for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(e1[0], e1[1] + 6 + k * 7); g.quadraticCurveTo(mx * 2 - (e1[0] + e2[0]) / 2, (my - 4 + k * 7) * 2 - (e1[1] + e2[1]) / 2, e2[0], e2[1] + 6 + k * 7); g.stroke(); }
    g.restore();
    g.lineWidth = 2; g.strokeStyle = LINE; g.stroke(fabric);
    // a foot hanging over
    ink(g, ell(e1[0] + 22 + off * 0.5, my - 14, 5.5, 3, undefined, 0.5), FROG.base, 1.4);
  },
});

// ============================================================ the garden, front left
layer({
  id: 'garden', z: 27, still: true,
  draw(g) {
    const bed = curve([[418, 914], [470, 910], [540, 912], [576, 922], [560, 938], [490, 942], [430, 936], [410, 924]], true);
    ink(g, bed, grad(g, 0, 910, 0, 942, ['#a06e4c', '#7a4e38']), 1.8);
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(58,34,50,0.4)';
    for (const y of [920, 930]) { g.beginPath(); g.moveTo(425, y); g.quadraticCurveTo(495, y + 5, 565, y); g.stroke(); }
    for (const [x, y] of [[436, 918], [462, 922], [489, 918], [450, 932]]) {
      lumps(g, [[x - 5, y, 7], [x + 5, y - 1, 7], [x, y - 5, 7]], { line: LINE, lw: 1.1, shade: '#4f8a4a', base: '#7cbc5c', lit: '#b5e08a' });
    }
    for (const [x, y, s] of [[520, 928, 1], [548, 924, 0.8], [505, 917, 0.65]]) {
      const p = ell(x, y - 7 * s, 12 * s, 9 * s);
      ink(g, p, grad(g, x - 12 * s, 0, x + 12 * s, 0, ['#c9562f', '#ef8a3c', '#f9b25a']), 1.6);
      g.lineWidth = 1.1; g.strokeStyle = 'rgba(58,34,50,0.5)';
      for (const dx of [-5, 0, 5]) { g.beginPath(); g.ellipse(x + dx * s, y - 7 * s, 4 * s, 9 * s, 0, -Math.PI / 2, Math.PI / 2, dx < 0); g.stroke(); }
      tube(g, quad(x, y - 15 * s, x + 2, y - 20 * s, x + 5 * s, y - 21 * s), '#5f7a3a', 2.2, 1);
    }
    // the little fence along the front
    const posts = [];
    for (let x = 400; x <= 585; x += 23) posts.push([x, frontY(x) - 4]);
    for (const [x, y] of posts) ink(g, poly([[x - 2.5, y], [x - 2.5, y - 16], [x, y - 19], [x + 2.5, y - 16], [x + 2.5, y]]), '#f3e4c8', 1.4);
    g.lineWidth = 2.4; g.strokeStyle = LINE; const rail = curve(posts.map(([x, y]) => [x, y - 10]), false); g.stroke(rail);
    g.lineWidth = 1.4; g.strokeStyle = '#e8d6b4'; g.stroke(rail);
  },
});

// ============================================================ the cottage
function win(g, x, y, w, h, opts = {}) {
  const frame = rect(x - 3, y - 3, w + 6, h + 6);
  ink(g, frame, '#6e4632', 1.8);
  ink(g, rect(x, y, w, h), grad(g, 0, y, 0, y + h, ['#ffb85e', '#ffd88a', '#ffe9b0']), 1.4);
  g.lineWidth = 2.2; g.strokeStyle = '#6e4632';
  g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * 0.48); g.lineTo(x + w, y + h * 0.48); g.stroke();
  if (opts.curtain) { g.fillStyle = 'rgba(224,100,76,0.75)'; g.fill(poly([[x, y], [x + w * 0.3, y], [x + w * 0.12, y + h * 0.7], [x, y + h * 0.8]])); }
  ink(g, rect(x - 6, y + h + 2, w + 12, 5), '#8f5f43', 1.6);
}
const winGlow = [[613, 714, 40], [705, 712, 40], [798, 714, 40], [755, 844, 46], [714, 548, 40]];
layer({
  id: 'cottage', z: 30, still: true,
  draw(g) {
    // chimney (the roof covers its foot)
    ink(g, rect(766, 372, 24, 72), grad(g, 766, 0, 790, 0, ['#a8503c', '#d9765a']), 2);
    g.lineWidth = 1; g.strokeStyle = 'rgba(58,34,50,0.4)';
    for (let y = 382; y < 440; y += 9) { g.beginPath(); g.moveTo(766, y); g.lineTo(790, y); g.stroke(); }
    ink(g, rect(762, 366, 32, 9), '#6e3f2c', 1.8);

    // ---- ground floor: stone
    const gf = rect(600, 792, 210, 140), gside = poly([[810, 792], [848, 784], [848, 926], [810, 932]]);
    ink(g, gf, grad(g, 600, 0, 810, 0, ['#cdb79c', '#e8d6b8']), 2.2);
    ink(g, gside, grad(g, 810, 0, 848, 0, ['#f3dcb6', '#ffeccb']), 2.2);
    g.save(); g.clip(gf);
    const r = rng(5);
    for (let row = 0, y = 794; y < 932; row++, y += 17) {
      for (let x = 598 - (row % 2) * 14; x < 812; ) {
        const w = 22 + r() * 18;
        ink(g, rect(x + 1.5, y + 1.5, w - 3, 14, new Path2D()), `rgba(${200 + r() * 40},${180 + r() * 30},${150 + r() * 30},0.5)`, 1, 'rgba(58,34,50,0.32)');
        x += w;
      }
    }
    g.restore();
    // the door
    const door = new Path2D(); door.moveTo(640, 932); door.lineTo(640, 872); door.arc(665, 872, 25, Math.PI, 0); door.lineTo(690, 932); door.closePath();
    ink(g, door, '#4e2a20', 2.2);
    ink(g, rect(632, 930, 66, 6), '#bba596', 1.6);
    // window with shutters and a flower box
    win(g, 728, 822, 54, 44, { curtain: true });
    ink(g, rect(712, 820, 13, 48), '#5e9aa0', 1.6); ink(g, rect(785, 820, 13, 48), '#5e9aa0', 1.6);
    ink(g, rect(722, 874, 66, 11), '#8f5f43', 1.6);
    for (let i = 0; i < 7; i++) ink(g, circ(728 + i * 9, 871 - (i % 2) * 3, 4.2), ['#e0644c', '#f3a0b0', '#fff2d8'][i % 3], 1.2);
    // ivy up the left corner
    const ivy = curve([[604, 930], [612, 890], [603, 850], [614, 812], [606, 790]], false);
    g.lineWidth = 1.6; g.strokeStyle = '#3f6a3e'; g.stroke(ivy);
    for (let i = 0; i < 12; i++) { const y = 925 - i * 11, x = 607 + Math.sin(i * 1.7) * 6; ink(g, ell(x + (i % 2 ? 5 : -5), y, 5, 3, undefined, i % 2 ? 0.5 : -0.5), i % 3 ? '#5f9e52' : '#86c75a', 1.1); }
    // potted fern by the door
    ink(g, poly([[618, 932], [634, 932], [631, 914], [621, 914]]), '#c9704a', 1.6);
    lumps(g, [[621, 908, 7], [630, 906, 7], [626, 900, 6]], { line: LINE, lw: 1, shade: '#4f8a4a', base: '#6fae55', lit: '#a9d46f' });

    // ---- beam between floors
    ink(g, rect(570, 786, 282, 10), '#7a4e38', 2);
    ink(g, poly([[852, 786], [878, 779], [878, 787], [852, 796]]), '#a06e4c', 1.8);

    // ---- second floor: half timber, overhanging
    const sf = rect(578, 668, 257, 118), sside = poly([[835, 668], [872, 660], [872, 780], [835, 786]]);
    ink(g, sf, grad(g, 578, 0, 835, 0, ['#ead6b4', '#f6e6c8']), 2.2);
    ink(g, sside, grad(g, 835, 0, 872, 0, ['#fbe9c6', '#fff3d8']), 2.2);
    g.save(); g.clip(sf);
    g.lineWidth = 1; g.strokeStyle = 'rgba(160,120,90,0.25)';
    for (let i = 0; i < 40; i++) { const x = 580 + r() * 250, y = 670 + r() * 110; g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6, y + 1); g.stroke(); }
    g.restore();
    win(g, 594, 690, 38, 46);
    win(g, 779, 690, 38, 46, { curtain: true });
    ink(g, circ(705, 712, 28), '#6e4632', 2);
    ink(g, circ(705, 712, 22), radial(g, 705, 712, 2, 22, ['#ffe9b0', '#ffc46a']), 1.6);
    g.lineWidth = 2; g.strokeStyle = '#6e4632'; g.beginPath(); g.moveTo(683, 712); g.lineTo(727, 712); g.moveTo(705, 690); g.lineTo(705, 734); g.stroke();
    const timber = (x0, y0, x1, y1) => tube(g, seg(x0, y0, x1, y1), '#8a5a3c', 5, 1.4);
    for (const x of [582, 647, 763, 831]) timber(x, 670, x, 786);
    timber(578, 752, 835, 752);
    for (const [a, b] of [[586, 642], [652, 758], [768, 826]]) { timber(a + 2, 782, b - 2, 756); timber(a + 2, 756, b - 2, 782); }
    // the side balcony, where the stargazer stands
    ink(g, poly([[872, 772], [925, 772], [925, 780], [872, 782]]), '#a06e4c', 1.8);
    tube(g, seg(874, 804, 902, 781), '#7a4e38', 4, 1.4);
    for (let x = 878; x <= 922; x += 7) tube(g, seg(x, 772, x, 750), '#f3e4c8', 2, 1.1);
    tube(g, seg(872, 750, 925, 750), '#8a5a3c', 3.4, 1.4);

    // ---- skirt roof between the floors
    const skirt = poly([[552, 670], [866, 670], [800, 608], [626, 608]]);
    const skirtSide = poly([[866, 670], [892, 657], [818, 602], [800, 608]]);
    ink(g, skirt, grad(g, 552, 0, 866, 0, ['#46668c', '#5f86ad', '#7fa6c8']), 2.2);
    ink(g, skirtSide, grad(g, 820, 0, 892, 0, ['#86aed0', '#a8c8e0']), 2.2);
    g.save(); g.clip(skirt);
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(30,40,70,0.45)';
    for (let y = 618; y < 670; y += 11) { g.beginPath(); for (let x = 540; x < 880; x += 12) { g.moveTo(x, y); g.arc(x + 6, y, 6, Math.PI, 0, true); } g.stroke(); }
    g.restore();

    // ---- turret, leaning a little
    const tf = poly([[640, 612], [780, 612], [788, 482], [648, 482]]), tside = poly([[780, 612], [806, 604], [814, 476], [788, 482]]);
    ink(g, tf, grad(g, 640, 0, 788, 0, ['#e6cfa8', '#f4e1bc']), 2.2);
    ink(g, tside, grad(g, 788, 0, 814, 0, ['#fbe8c2', '#fff3d6']), 2.2);
    const tw = new Path2D(); tw.moveTo(696, 576); tw.lineTo(696, 532); tw.arc(716, 532, 20, Math.PI, 0); tw.lineTo(736, 576); tw.closePath();
    ink(g, new Path2D(tw), '#6e4632', 0); g.lineWidth = 7; g.strokeStyle = '#6e4632'; g.stroke(tw);
    ink(g, tw, grad(g, 0, 512, 0, 576, ['#ffb85e', '#ffe2a0']), 1.6);
    g.lineWidth = 2; g.strokeStyle = '#6e4632'; g.beginPath(); g.moveTo(716, 512); g.lineTo(716, 576); g.moveTo(696, 546); g.lineTo(736, 546); g.stroke();
    ink(g, rect(690, 578, 52, 9), '#8f5f43', 1.6);
    for (let i = 0; i < 5; i++) ink(g, circ(696 + i * 10, 576 - (i % 2) * 2, 4), ['#f7d55a', '#e0644c'][i % 2], 1.1);

    // ---- the witch-hat roof
    const roof = new Path2D();
    roof.moveTo(612, 494); roof.quadraticCurveTo(690, 450, 728, 330); roof.quadraticCurveTo(772, 438, 848, 482); roof.quadraticCurveTo(732, 512, 612, 494); roof.closePath();
    ink(g, roof, grad(g, 612, 0, 848, 0, ['#93393a', '#c9573f', '#f28e5c']), 2.4);
    g.save(); g.clip(roof);
    g.lineWidth = 1.3; g.strokeStyle = 'rgba(70,20,30,0.45)';
    for (let k = 0; k < 9; k++) {
      const y = 365 + k * 16;
      g.beginPath(); g.moveTo(600, y + 30); g.quadraticCurveTo(730, y + 24 + k * 2.4, 860, y + 6); g.stroke();
      for (let x = 610 + (k % 2) * 9; x < 860; x += 18) { const yy = y + 30 - ((x - 600) / 260) * 24 + Math.sin(((x - 600) / 260) * Math.PI) * (k * 1.2); g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 1, yy + 14); g.stroke(); }
    }
    g.fillStyle = grad(g, 760, 0, 848, 0, ['rgba(255,220,160,0)', 'rgba(255,220,160,0.35)']); g.fillRect(700, 320, 160, 200);
    g.restore();
    tube(g, seg(728, 332, 728, 288), '#5a3c3c', 2.4, 1.3);
    ink(g, circ(728, 304, 3.5), '#f2c14e', 1.3);

    // ---- the ladder up to the turret
    const la = [588, 664], lb = [640, 508], n = [-(lb[1] - la[1]), lb[0] - la[0]], nl = Math.hypot(...n), off = [(n[0] / nl) * 9, (n[1] / nl) * 9];
    for (const sgn of [-1, 1]) tube(g, seg(la[0] + off[0] * sgn, la[1] + off[1] * sgn, lb[0] + off[0] * sgn, lb[1] + off[1] * sgn), '#e2b070', 3.2, 1.4);
    for (let k = 1; k < 11; k++) { const u = k / 11, x = lerp(la[0], lb[0], u), y = lerp(la[1], lb[1], u); tube(g, seg(x - off[0], y - off[1], x + off[0], y + off[1]), '#e2b070', 2.4, 1.2); }

    // the door lantern bracket
    tube(g, quad(694, 846, 704, 846, 706, 852), '#3a2232', 1.4, 1);
  },
});

// the cottage's moving bits: lamp-lit windows, a waving neighbour at the door, smoke, the vane
const cot = { open: 0, vane: 0, vv: 0, smokeT: 0, blink: blinker() };
const smoke = [];
layer({
  id: 'cottage-life', z: 31,
  hit: (x, y) => (x > 598 && x < 850 && y > 786 && y < 934) || (x > 570 && x < 875 && y > 600 && y < 790) || (x > 612 && x < 848 && y > 330 && y < 612),
  update(dt, t, L) {
    cot.open = ease(cot.open, L.hovered ? 1 : 0, L.hovered ? 2.6 : 1.4, dt);
    const w = wind(t, 728);
    cot.vv += (-(cot.vane - (0.6 + Math.sin(t * 0.4) * 0.4 * w)) * 4 - cot.vv * 1.2) * dt + (L.hovered && L.since < 0.1 ? 8 : 0);
    cot.vane += cot.vv * dt;
    cot.smokeT -= dt;
    if (cot.smokeT < 0) { cot.smokeT = 0.5 + Math.random() * 0.3; smoke.push({ x: 778 + (Math.random() - 0.5) * 6, y: 362, r: 6 + Math.random() * 3, a: 0, age: 0, s: Math.random() }); }
    for (const p of smoke) { p.age += dt; p.x += (4 + p.age * (3 + w * 7)) * dt; p.y -= (30 - p.age * 4) * dt; p.r += (5 + p.s * 3) * dt; }
    while (smoke.length && smoke[0].age > 5) smoke.shift();
  },
  draw(g, t, L) {
    // smoke
    for (const p of smoke) {
      const a = Math.min(1, p.age * 2) * Math.max(0, 1 - p.age / 5) * 0.7;
      g.globalAlpha = a;
      ink(g, circ(p.x + Math.sin(p.age * 2 + p.s * 6) * 4, p.y, p.r), '#fbf1e6', 1.2, 'rgba(150,110,130,0.6)');
    }
    g.globalAlpha = 1;
    // window glow, breathing like lamplight
    g.save(); g.globalCompositeOperation = 'lighter';
    winGlow.forEach(([x, y, r], i) => {
      const f = 0.24 + 0.06 * Math.sin(t * 2.3 + i * 1.7) + 0.04 * noise(t * 4 + i * 9) + L.hover * 0.14;
      g.fillStyle = radial(g, x, y, 0, r * 1.6, [[0, `rgba(255,190,100,${f})`], [1, 'rgba(255,190,100,0)']]);
      g.fill(circ(x, y, r * 1.6));
    });
    g.restore();
    // the door lantern
    const lx = 706, ly = 860;
    g.save(); g.globalCompositeOperation = 'lighter';
    g.fillStyle = radial(g, lx, ly, 0, 42, [[0, `rgba(255,200,110,${0.55 + 0.1 * Math.sin(t * 5)})`], [1, 'rgba(255,200,110,0)']]); g.fill(circ(lx, ly, 42));
    g.restore();
    ink(g, poly([[lx - 5, ly - 8], [lx + 5, ly - 8], [lx + 6, ly + 6], [lx - 6, ly + 6]]), '#ffe39a', 1.5);
    ink(g, rect(lx - 7, ly + 6, 14, 3), '#3a2232', 0);
    // the door: swings open, warm light spills, a frog waves
    const o = cot.open, dx = 640, dy = 932;
    if (o > 0.03) {
      const inside = new Path2D(); inside.moveTo(dx, dy); inside.lineTo(dx, 872); inside.arc(dx + 25, 872, 25, Math.PI, 0); inside.lineTo(dx + 50, dy); inside.closePath();
      g.fillStyle = radial(g, dx + 25, 900, 4, 50, ['#ffd98a', '#e08a4a', '#7a3a28']); g.fill(inside);
      g.save(); g.clip(inside);
      frog(g, dx + 25, dy, 0.95, { open: cot.blink(t), look: [clamp((P.x - 665) / 200, -1, 1), clamp((P.y - 900) / 200, -1, 1)], smile: 3.5,
        arms: [[17, -28 - Math.sin(t * 10) * 7 * o, 13, -12]] });
      g.restore();
      g.save(); g.globalCompositeOperation = 'lighter';
      g.fillStyle = radial(g, dx + 25, dy + 6, 0, 70, [[0, `rgba(255,200,110,${0.45 * o})`], [1, 'rgba(255,200,110,0)']]);
      g.fill(ell(dx + 25, dy + 6, 70, 18));
      g.restore();
    }
    const dw = Math.cos(o * 1.3);
    g.save(); g.translate(dx, 0); g.scale(Math.max(dw, 0.02), 1);
    const door = new Path2D(); door.moveTo(0, dy); door.lineTo(0, 872); door.arc(25, 872, 25, Math.PI, 0); door.lineTo(50, dy); door.closePath();
    ink(g, door, grad(g, 0, 0, 50, 0, ['#7a4530', '#a8643f', '#c07a4c']), 2 / Math.max(dw, 0.3));
    g.lineWidth = 1.2 / Math.max(dw, 0.3); g.strokeStyle = 'rgba(58,34,50,0.5)';
    for (const x of [12, 25, 38]) { g.beginPath(); g.moveTo(x, 852); g.lineTo(x, dy - 3); g.stroke(); }
    ink(g, circ(40, 902, 2.6), '#f2c14e', 1.2 / Math.max(dw, 0.3));
    g.restore();
    // the frog weathervane, seen side-on as it turns
    const va = Math.cos(cot.vane);
    g.save(); g.translate(728, 290); g.scale(va, 1);
    tube(g, seg(-26, 0, 22, 0), '#3a2232', 1.6, 0.8);
    g.fillStyle = '#3a2232';
    g.fill(poly([[22, -5], [30, 0], [22, 5]]));
    g.fill(poly([[-26, 0], [-32, -8], [-22, -8], [-18, 0]]));
    g.beginPath(); g.ellipse(-4, -9, 10, 7, 0, Math.PI, TAU); g.fill();
    g.fill(circ(-10, -15, 3)); g.fill(circ(2, -15, 3));
    g.restore();
  },
});

// the stargazer on the balcony: its telescope follows you about
const gazer = { a: -0.6, hop: 0, hv: 0, blink: blinker(), ht: 0 };
layer({
  id: 'gazer', z: 32,
  hit: (x, y) => x > 872 && x < 935 && y > 700 && y < 775,
  onEnter() { gazer.hv = -160; },
  update(dt, t, L) {
    const dx = P.x - 905, dy = P.y - 735, near = P.inside && Math.hypot(dx, dy) < 520;
    const target = near ? Math.atan2(dy, dx) : -0.7 + Math.sin(t * 0.25) * 0.35;
    gazer.a = ease(gazer.a, clamp(target, -2.6, 0.4), near ? 3 : 0.8, dt);
    gazer.hv += 900 * dt; gazer.hop += gazer.hv * dt;
    if (gazer.hop > 0) { gazer.hop = 0; gazer.hv = L.hovered ? -150 : 0; }
    gazer.ht -= dt;
    if (L.hovered && gazer.ht < 0) { gazer.ht = 0.7; spawn({ kind: 'heart', x: 900, y: 715 + gazer.hop, vy: -28, vx: (Math.random() - 0.5) * 12, life: 1.8, size: 0.9 }); }
  },
  draw(g, t, L) {
    const px = 912, py = 742;
    // tripod
    for (const fx_ of [902, 912, 922]) tube(g, seg(px, py, fx_, 772), '#6e4632', 1.6, 1);
    // the telescope
    g.save(); g.translate(px, py); g.rotate(gazer.a);
    ink(g, poly([[-14, -4], [26, -5.5], [26, 5.5], [-14, 4]]), grad(g, 0, -5, 0, 5, ['#f6d27a', '#c98f3e']), 1.6);
    ink(g, rect(24, -7, 6, 14), '#8a5a3c', 1.5);
    ink(g, rect(-18, -3, 5, 6), '#8a5a3c', 1.3);
    g.restore();
    const ex = px + Math.cos(gazer.a) * -15, ey = py + Math.sin(gazer.a) * -15;
    const lk = [clamp(Math.cos(gazer.a), -1, 1), clamp(Math.sin(gazer.a), -1, 1)];
    frog(g, 888, 772 + gazer.hop, 0.82, { open: gazer.blink(t), look: lk, smile: 2 + L.hover * 2.5, squash: gazer.hop < -1 ? 1.06 : 1,
      arms: gazer.hop < -2 ? [[-20, -30], [20, -30]] : [[(ex - 888) / 0.82, (ey - 772) / 0.82]] });
  },
});

// ============================================================ the pond, the waterfall, the duckling
const pond = { cx: 1020, cy: 905, rx: 80, ry: 18, rings: [], duck: { a: 0, sp: 0.35, q: 0 } };
layer({
  id: 'pond', z: 34,
  hit: (x, y) => ((x - pond.cx) / (pond.rx + 6)) ** 2 + ((y - pond.cy) / (pond.ry + 8)) ** 2 < 1,
  update(dt, t, L) {
    if (L.hovered && P.sp > 40 && Math.random() < dt * 12) pond.rings.push({ x: P.x, y: P.y, age: 0 });
    for (const r of pond.rings) r.age += dt;
    while (pond.rings.length && pond.rings[0].age > 1.6) pond.rings.shift();
    const d = pond.duck;
    d.sp = ease(d.sp, L.hovered ? 1.3 : 0.35, 2, dt);
    d.a += d.sp * dt * 0.5;
    d.q -= dt;
    if (L.hovered && d.q < 0) { d.q = 1.1; spawn({ kind: 'note', x: d.x + 6, y: d.y - 18, vy: -24, vx: 8, life: 1.6, size: 1 }); }
  },
  draw(g, t) {
    const { cx, cy, rx, ry } = pond;
    // the brook to the edge
    const brook = new Path2D(); brook.moveTo(1088, 900); brook.quadraticCurveTo(1112, 905, 1112, 924); brook.lineTo(1138, 922); brook.quadraticCurveTo(1128, 900, 1094, 893); brook.closePath();
    ink(g, brook, grad(g, 1090, 0, 1138, 0, ['#7cc4d6', '#b8e8ee']), 1.8);
    const water = ell(cx, cy, rx, ry);
    for (let i = 0; i < 18; i++) { const a = (i / 18) * TAU; ink(g, ell(cx + Math.cos(a) * (rx + 3), cy + Math.sin(a) * (ry + 3), 8, 4.5), i % 3 ? '#c9b8b5' : '#e6d8cc', 1.4); }
    ink(g, water, grad(g, 0, cy - ry, 0, cy + ry, ['#5aa9c4', '#86cfe0', '#c4eef2']), 2);
    g.save(); g.clip(water);
    // sky glints sliding across
    g.fillStyle = 'rgba(255,246,220,0.55)';
    for (let i = 0; i < 4; i++) { const x = cx - rx + ((t * 9 + i * 47) % (rx * 2)); g.fill(ell(x, cy - 3 + i * 3, 16, 1.6)); }
    for (const r of pond.rings) { g.lineWidth = 1.4; g.strokeStyle = `rgba(255,255,255,${0.7 * (1 - r.age / 1.6)})`; g.stroke(ell(r.x, r.y, 4 + r.age * 22, 1.5 + r.age * 5)); }
    g.restore();
    // lily pads and a lotus
    for (const [x, y, s] of [[985, 908, 1], [1045, 900, 0.8], [1062, 912, 0.7]]) {
      const pad = new Path2D(); pad.moveTo(x, y); pad.ellipse(x, y, 11 * s, 4 * s, 0, 0.35, TAU - 0.05); pad.closePath();
      ink(g, pad, '#6fae55', 1.3);
    }
    for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i - 2) * 0.5; ink(g, ell(985 + Math.cos(a) * 4, 902 + Math.sin(a) * 3, 2.6, 5.5, undefined, a + Math.PI / 2), '#f7b6c6', 1.1); }
    // the duckling, paddling round
    const d = pond.duck, da = d.a;
    d.x = cx + Math.cos(da) * rx * 0.62; d.y = cy + Math.sin(da) * ry * 0.55;
    const dir = -Math.sin(da) >= 0 ? 1 : -1, bob = Math.sin(t * 4) * 0.8;
    g.save(); g.translate(d.x, d.y + bob); g.scale(dir, 1);
    ink(g, ell(0, -4, 9, 6), grad(g, 0, -10, 0, 2, ['#ffe27a', '#f2b83f']), 1.5);
    ink(g, circ(7, -11, 5), '#ffe27a', 1.5);
    ink(g, poly([[11.5, -11.5], [16, -10], [11.5, -8.5]]), '#f2843c', 1.1);
    g.fillStyle = LINE; g.fill(circ(8.6, -12.2, 1.2));
    g.restore();
  },
});

const fall = { flow: 0, leap: 0 };
layer({
  id: 'waterfall', z: 35,
  hit: (x, y) => y > 925 && y < 1420 && Math.abs(x - (1124 + Math.sqrt(Math.max(0, y - 925)) * 2.2)) < 26,
  onEnter() {
    spawn({ kind: 'fish', x: 1140, y: 1060, vx: 70 + Math.random() * 30, vy: -170, g: 300, life: 1.6, size: 1 });
  },
  update(dt, t, L) { fall.flow = ease(fall.flow, L.hover, 2, dt); },
  draw(g, t) {
    const y0 = 925, y1 = 1440, f = fall.flow;
    const xAt = (y) => 1124 + Math.sqrt(Math.max(0, y - y0)) * 2.2;
    const half = (y) => 13 + (y - y0) * 0.04 + f * 4;
    const left = [], right = [];
    for (let y = y0; y <= y1; y += 15) { left.push([xAt(y) - half(y), y]); right.push([xAt(y) + half(y), y]); }
    const sheet = new Path2D(); sheet.moveTo(...left[0]);
    for (const p of left) sheet.lineTo(...p);
    for (const p of right.slice().reverse()) sheet.lineTo(...p);
    sheet.closePath();
    g.fillStyle = grad(g, 0, y0, 0, y1, [[0, 'rgba(150,214,230,1)'], [0.35, 'rgba(190,232,240,0.97)'], [0.75, 'rgba(232,246,246,0.85)'], [0.92, 'rgba(255,248,240,0.5)'], [1, 'rgba(255,248,240,0)']]);
    g.fill(sheet);
    g.save(); g.clip(sheet);
    // falling streaks
    for (let i = 0; i < 11; i++) {
      const u = (i + 0.5) / 11 - 0.5, sp = 230 + (i % 3) * 40 + f * 120;
      for (let k = 0; k < 4; k++) {
        const yy = y0 + ((t * sp + i * 97 + k * 140) % (y1 - y0));
        const len = 30 + (yy - y0) * 0.1;
        g.lineWidth = 2; g.strokeStyle = `rgba(255,255,255,${0.75 - (yy - y0) / (y1 - y0) * 0.6})`;
        g.beginPath(); g.moveTo(xAt(yy) + u * half(yy) * 2, yy); g.lineTo(xAt(yy + len) + u * half(yy + len) * 2, yy + len); g.stroke();
      }
    }
    g.fillStyle = grad(g, xAt(1000) - 30, 0, xAt(1000) + 30, 0, ['rgba(60,110,150,0.2)', 'rgba(60,110,150,0)', 'rgba(255,240,210,0.35)']);
    g.fillRect(1080, y0, 160, y1 - y0);
    g.restore();
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(58,34,50,0.45)';
    g.stroke(poly(left.slice(0, 18), false)); g.stroke(poly(right.slice(0, 18), false));
    // spray where it slides off the lip
    for (let i = 0; i < 5; i++) { const ph = (t * 1.5 + i * 0.2) % 1; g.fillStyle = `rgba(255,255,255,${0.6 * (1 - ph)})`; g.fill(circ(1124 + (i - 2) * 7, 928 - ph * 6, 2 + ph * 3)); }
  },
});

// sunflowers by the cottage: they turn to watch you
const flowers = [[818, 936, 92, 1], [842, 940, 74, 2], [864, 935, 108, 3]].map(([x, y, h, s]) => ({ x, y, h, s, nod: 0, face: 0.8 }));
layer({
  id: 'sunflowers', z: 36,
  hit: (x, y) => flowers.some((f) => Math.hypot(x - f.hx, y - f.hy) < 22),
  update(dt, t, L) {
    for (const f of flowers) {
      const near = P.inside && Math.hypot(P.x - f.x, P.y - f.y + f.h) < 600;
      f.face = ease(f.face, near ? clamp((P.x - f.x) / 220, -1, 1) : 0.8, near ? 2.5 : 0.6, dt);
      f.nod = ease(f.nod, L.hovered && Math.hypot(P.x - f.hx, P.y - f.hy) < 30 ? 1 : 0, 4, dt);
    }
  },
  draw(g, t) {
    for (const f of flowers) {
      const sway = (wind(t, f.x) - 0.7) * 6 + Math.sin(t * 1.4 + f.s) * 1.5 + f.face * 5;
      const hx = f.x + sway, hy = f.y - f.h + f.nod * 6 + Math.sin(t * 8) * f.nod * 2;
      f.hx = hx; f.hy = hy;
      tube(g, quad(f.x, f.y, f.x + sway * 0.2, f.y - f.h * 0.5, hx, hy + 6), '#5f9a49', 3, 1.4);
      ink(g, ell(f.x + sway * 0.3 + 7, f.y - f.h * 0.4, 8, 3.5, undefined, -0.5), '#6fae55', 1.3);
      g.save(); g.translate(hx, hy); g.scale(0.55 + 0.45 * Math.cos(f.face * 0.9), 1);
      g.rotate(f.face * 0.15);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + t * 0.05 * f.nod;
        ink(g, ell(Math.cos(a) * 11, Math.sin(a) * 11, 6.5, 3, undefined, a), i % 2 ? '#f6c445' : '#ffd965', 1.2);
      }
      ink(g, circ(f.face * 2, 0, 7.5), radial(g, f.face * 2, 0, 1, 7.5, ['#a0683c', '#6e4030']), 1.4);
      if (f.nod > 0.3) { g.fillStyle = LINE; g.fill(circ(f.face * 2 - 2.5, -1, 1)); g.fill(circ(f.face * 2 + 2.5, -1, 1)); g.lineWidth = 1; g.strokeStyle = LINE; g.beginPath(); g.arc(f.face * 2, 1, 2.4, 0.3, Math.PI - 0.3); g.stroke(); }
      g.restore();
    }
  },
});

// ============================================================ motes in the low light
const motes = [];
{ const r = rng(99); for (let i = 0; i < 46; i++) motes.push({ x: 300 + r() * 1000, y: 380 + r() * 620, ph: r() * 10, s: 0.6 + r() * 0.9, ox: 0, oy: 0 }); }
layer({
  id: 'motes', z: 40,
  update(dt, t) {
    for (const m of motes) {
      m.x += ((wind(t, m.x) - 0.6) * 10 + Math.sin(t * 0.3 + m.ph) * 6) * dt;
      m.y += Math.cos(t * 0.4 + m.ph) * 5 * dt;
      if (m.x > 1360) m.x = 260;
      const dx = P.x - m.x - m.ox, dy = P.y - m.y - m.oy, d = Math.hypot(dx, dy);
      if (P.inside && d < 140 && d > 1) { m.ox += (-dy / d) * 40 * dt + (dx / d) * 10 * dt; m.oy += (dx / d) * 40 * dt + (dy / d) * 10 * dt; }
      m.ox = ease(m.ox, 0, 0.4, dt); m.oy = ease(m.oy, 0, 0.4, dt);
      m.glow = clamp(1 - d / 160, 0, 1);
    }
  },
  draw(g, t) {
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const m of motes) {
      const a = (0.25 + 0.35 * Math.max(0, Math.sin(t * 1.3 + m.ph))) * m.s + m.glow * 0.5;
      g.fillStyle = radial(g, m.x + m.ox, m.y + m.oy, 0, 6 * m.s + m.glow * 3, [[0, `rgba(255,236,170,${a})`], [1, 'rgba(255,236,170,0)']]);
      g.fill(circ(m.x + m.ox, m.y + m.oy, 6 * m.s + m.glow * 3));
    }
    g.restore();
  },
});

// ============================================================ front clouds, drifting past below
const front = [{ x: 1120, y: 1475, w: 360, h: 120, seed: 41, sp: 2 }, { x: 380, y: 1540, w: 460, h: 140, seed: 42, sp: 1.4 }, { x: 1550, y: 1560, w: 380, h: 120, seed: 43, sp: 1.8 }, { x: 760, y: 1610, w: 420, h: 130, seed: 44, sp: 1.2 }];
const FRONT = { union: true, line: 'rgba(170,112,140,0.45)', lw: 1.6, shade: '#e8c9d3', base: '#fbe7dc', lit: '#fff6ec' };
onLayout(() => { for (const c of front) { c.cs = cumulusCircles(c.seed, c.w, c.h); c.sp_ = sprite(-c.w * 0.6 - 10, -c.h * 1.25, c.w * 1.2 + 20, c.h * 1.8, (g) => lumps(g, c.cs, FRONT)); c.billow = 0; } });
layer({
  id: 'front-clouds', z: 45,
  hit(x, y) { for (const c of front) if (((x - c.cx) / (c.w * 0.5)) ** 2 + ((y - c.y + c.h * 0.45) / (c.h * 0.6)) ** 2 < 1) return (this.which = c), true; return false; },
  update(dt, t, L) {
    for (const c of front) {
      c.cx = c.x + Math.sin(t * 0.05 * c.sp + c.seed) * 60;
      c.billow = ease(c.billow, L.hovered && L.which === c ? 1 : 0, L.hovered && L.which === c ? 3 : 1.2, dt);
    }
  },
  draw(g, t) {
    // mist where the waterfall meets the cloud
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 6; i++) { const ph = (t * 0.4 + i / 6) % 1; g.fillStyle = `rgba(255,250,240,${0.22 * Math.sin(ph * Math.PI)})`; g.fill(circ(1170 + (i - 3) * 16 + ph * 20, 1430 - ph * 40, 20 + ph * 30)); }
    g.restore();
    for (const c of front) {
      const k = 1 + c.billow * (0.05 + 0.015 * Math.sin(t * 3));
      g.save(); g.translate(c.cx, c.y); g.scale(k, k); blit(g, c.sp_); g.restore();
    }
  },
});

// ============================================================ particles: hearts, z's, notes, leaves, sparks, leaping fish
layer({
  id: 'fx', z: 55,
  update(dt) {
    for (const p of fx) {
      p.age += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.kind === 'leaf') { p.vx = Math.sin(p.age * 2.4) * 30 + 16; p.vy = 34; }
    }
    for (let i = fx.length - 1; i >= 0; i--) if (fx[i].age > fx[i].life) fx.splice(i, 1);
  },
  draw(g) {
    for (const p of fx) {
      const k = p.age / p.life, a = Math.min(1, p.age * 5) * (1 - k * k);
      g.save(); g.globalAlpha = a; g.translate(p.x, p.y);
      if (p.kind === 'heart') { const s = 7 * p.size * (0.8 + Math.min(1, p.age * 4) * 0.2); heartPath(g, Math.sin(p.age * 5) * 3, 0, s); g.fillStyle = '#f2788a'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = LINE; g.stroke(); }
      else if (p.kind === 'z' || p.kind === 'note') {
        g.font = `italic 600 ${Math.round(14 * p.size * (0.8 + k * 0.5))}px Georgia, serif`;
        g.fillStyle = p.kind === 'z' ? '#5a4a7a' : '#3a2232'; g.textAlign = 'center';
        g.fillText(p.kind === 'z' ? 'z' : '♪', Math.sin(p.age * 3) * 4, 0);
      } else if (p.kind === 'leaf') { g.rotate(p.rot); ink(g, ell(0, 0, 6 * p.size, 3 * p.size), '#7cbc5c', 1.2); }
      else if (p.kind === 'spark') { g.globalCompositeOperation = 'lighter'; g.fillStyle = '#fff3c0'; g.fill(poly([[0, -6], [1.5, -1.5], [6, 0], [1.5, 1.5], [0, 6], [-1.5, 1.5], [-6, 0], [-1.5, -1.5]])); }
      else if (p.kind === 'fish') {
        g.rotate(Math.atan2(p.vy, p.vx));
        ink(g, poly([[-8, 0], [-15, -5], [-15, 5]]), '#f2a65e', 1.3);
        ink(g, ell(0, 0, 10, 6), grad(g, 0, -6, 0, 6, ['#ffd48a', '#f29a5e']), 1.4);
        g.fillStyle = LINE; g.fill(circ(5, -1.5, 1.4));
        if (Math.random() < 0.3) spawn({ kind: 'spark', x: p.x, y: p.y, life: 0.5, vy: 10 });
      }
      g.restore();
    }
  },
});

// the last word: a soft vignette and a breath of warm light from the sun's side
layer({
  id: 'grade', z: 60, still: true,
  draw(g) {
    const v = st.view, cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2, R = Math.hypot(v.x1 - v.x0, v.y1 - v.y0) / 2;
    g.fillStyle = radial(g, cx, cy, R * 0.45, R * 1.05, [[0, 'rgba(40,24,60,0)'], [1, 'rgba(40,24,60,0.28)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    g.save(); g.globalCompositeOperation = 'soft-light';
    g.fillStyle = radial(g, 1270, 1160, 0, 1100, [[0, 'rgba(255,190,120,0.5)'], [1, 'rgba(255,190,120,0)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    g.restore();
  },
});

Drawn.start({ W, H });
})();
