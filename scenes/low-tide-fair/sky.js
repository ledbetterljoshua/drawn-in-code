/* sky.js — everything beyond the flats: the golden-hour sky (z0), the long clouds (z1, drifting;
   hover one and it slowly brightens and sheds a breath of light), the headland behind the
   grandmother snail with its lighthouse and cottages (z2), the far sea where the tide is turning
   (z3, glinting, waves curling in), the caravan still crawling in along the horizon (z4: hover it and
   their lanterns come on one by one) and the gulls (z60: they wheel on their own; hover one and it
   banks away with a cry). */
(() => {
const D = Drawn, F = Fair;
const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, ink, grad, radial, lumps, st, P, layer, onLayout, sprite, blit } = D;
const { HZ, W } = F;
const LINE = F.LINE;

// ------------------------------------------------------------ sky
layer({
  id: 'sky', z: 0, still: true,
  draw(g) {
    const v = st.view;
    g.fillStyle = grad(g, 0, v.y0, 0, HZ, [[0, '#5d80b4'], [0.35, '#8fb0cf'], [0.7, '#cfd5d2'], [0.9, '#efdfc6'], [1, '#f6e6cb']]);
    g.fillRect(v.x0 - 10, v.y0 - 10, v.x1 - v.x0 + 20, HZ - v.y0 + 30);
    // the low sun is off to the upper left: its warmth spills across that side of the sky
    g.save(); g.globalCompositeOperation = 'soft-light';
    g.fillStyle = radial(g, -260, 60, 0, 1500, [[0, 'rgba(255,196,120,0.95)'], [0.4, 'rgba(255,190,130,0.45)'], [1, 'rgba(255,190,130,0)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, HZ - v.y0 + 20);
    g.restore();
    g.fillStyle = radial(g, -200, 120, 0, 900, [[0, 'rgba(255,232,190,0.55)'], [1, 'rgba(255,225,180,0)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, HZ - v.y0 + 20);
    // mares' tails: high cirrus brushed across the top of the sky, lit gold from underneath
    const rc = rng(57);
    for (let i = 0; i < 9; i++) {
      const x = 200 + rc() * 1900, y = -20 + rc() * 120, L = 160 + rc() * 260;
      for (let k = 0; k < 5; k++) {
        const yy = y + k * 5 + rc() * 3, x0 = x + k * 14 + rc() * 20;
        g.beginPath(); g.moveTo(x0, yy); g.bezierCurveTo(x0 + L * 0.3, yy - 8, x0 + L * 0.7, yy + 6, x0 + L, yy - 14 - rc() * 10);
        g.lineWidth = 2 + rc() * 3; g.strokeStyle = `rgba(255,236,214,${0.12 + rc() * 0.14})`; g.lineCap = 'round'; g.stroke();
      }
    }
    // a pale band of haze sitting on the horizon
    g.fillStyle = grad(g, 0, HZ - 70, 0, HZ + 4, [[0, 'rgba(250,236,214,0)'], [1, 'rgba(250,238,218,0.85)']]);
    g.fillRect(v.x0, HZ - 70, v.x1 - v.x0, 76);
  },
});

// ------------------------------------------------------------ clouds
// long, low golden-hour streaks: lilac bodies, warm undersides lit from the left by the low sun
const CL = { union: true, line: 'rgba(130,96,140,0.35)', lw: 1.2, shade: '#b9a9c6', base: '#e2d4d8', lit: '#fbf0e6' };
const CL_FAR = { union: true, line: 0, shade: '#cdc0d0', base: '#e5dbdc', lit: '#f5ece4' };
// a flat-bottomed deck: a run of small lumps along the top with one or two bigger heads, tapering
// at both ends; sat on a flat base the low sun lights from underneath
function streak(seed, w, h) {
  const r = rng(seed), cs = [];
  const heads = [0.25 + r() * 0.2, 0.6 + r() * 0.25];
  let x = -w / 2;
  while (x < w / 2) {
    const u = (x + w / 2) / w, env = Math.sin(Math.PI * clamp(u, 0, 1)) ** 0.6;
    const head = Math.max(...heads.map((hu) => Math.exp(-(((u - hu) / 0.1) ** 2)))) * (0.6 + r() * 0.5);
    const rr = h * (0.18 + 0.32 * env + head * 0.45) * (0.75 + r() * 0.5);
    cs.push([x, -rr * 0.55 - head * h * 0.25, rr]);
    if (r() < 0.5) cs.push([x + rr * 0.4, -rr * 0.2, rr * 0.7]);
    x += rr * (0.55 + r() * 0.5);
  }
  return cs;
}
const clouds = [
  { x: 1530, y: 120, w: 560, h: 46, seed: 3, sp: 2.4, col: CL },
  { x: 900, y: 60, w: 220, h: 30, seed: 31, sp: 3.4, col: CL },
  { x: 1960, y: 210, w: 300, h: 52, seed: 7, sp: 3.1, col: CL },
  { x: 260, y: 95, w: 640, h: 28, seed: 11, sp: 1.8, col: CL },
  { x: 1180, y: 250, w: 300, h: 24, seed: 17, sp: 2.7, col: CL_FAR },
  { x: 600, y: 300, w: 260, h: 18, seed: 23, sp: 2.2, col: CL_FAR },
  { x: 1800, y: 300, w: 420, h: 22, seed: 29, sp: 2.0, col: CL_FAR },
];
// a bank of towering cumulus far out over the sea on the right, catching pink on their sunward sides
const TOWER = { union: true, line: 'rgba(140,110,150,0.28)', lw: 1.1, shade: '#d3c3cf', base: '#f0dcd6', lit: '#fde9da' };
onLayout(() => {
  for (const c of clouds) {
    c.cs = streak(c.seed, c.w, c.h);
    c.sp_ = sprite(-c.w * 0.62, -c.h * 2.2, c.w * 1.3, c.h * 2.3, (g) => {
      lumps(g, c.cs, c.col, 0);
      // the warm underside: the low sun lights the bellies of the clouds from the left
      g.save(); g.globalCompositeOperation = 'source-atop';
      g.fillStyle = grad(g, 0, -c.h * 0.5, 0, 0, ['rgba(255,196,150,0)', 'rgba(255,186,140,0.7)']);
      g.fillRect(-c.w, -c.h * 0.5, c.w * 2, c.h * 0.5);
      g.fillStyle = grad(g, -c.w * 0.6, 0, c.w * 0.6, 0, ['rgba(255,200,150,0.45)', 'rgba(255,200,160,0)']);
      g.fillRect(-c.w, -c.h * 2, c.w * 2, c.h * 2);
      g.restore();
    });
    c.glow = 0;
  }
});
layer({
  id: 'clouds', z: 1,
  hit(x, y) { for (const c of clouds) if (c.cx != null && Math.abs(x - c.cx) < c.w * 0.45 && y > c.y - c.h * 1.3 && y < c.y + 6) return (this.which = c), true; return false; },
  update(dt, t, L) {
    for (const c of clouds) {
      const span = W + 1400;
      c.cx = -700 + ((((c.x + 700) + t * c.sp) % span) + span) % span;
      const on = L.hovered && L.which === c;
      c.glow = ease(c.glow, on ? 1 : 0, on ? 1.5 : 0.8, dt);
    }
  },
  draw(g, t) {
    for (const c of clouds) {
      g.save(); g.translate(c.cx, c.y + Math.sin(t * 0.15 + c.seed) * 2);
      blit(g, c.sp_);
      if (c.glow > 0.02) {
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = c.glow * 0.35;
        blit(g, c.sp_);
      }
      g.restore();
    }
  },
});

// ------------------------------------------------------------ the far sea, the headland, the far flats
const HEAD = [[-140, HZ + 2], [-140, 268], [-40, 248], [70, 252], [170, 226], [300, 214], [400, 192], [500, 176], [590, 164], [680, 158], [760, 166], [850, 186], [930, 212], [1010, 236], [1090, 262], [1170, 296], [1240, 322], [1300, 342], [1350, 352], [1380, 366], [1420, HZ + 2]];
F.HEAD = HEAD;
layer({
  id: 'far', z: 2, still: true,
  draw(g) {
    const v = st.view;
    // the sea, out past the headland's point: a bright band, with the tide's lines in it
    g.fillStyle = grad(g, 0, HZ - 24, 0, HZ + 6, ['#9fb6c6', '#bccbd0', '#e3e2d6']);
    g.fillRect(1300, HZ - 22, v.x1 - 1300 + 10, 28);
    g.strokeStyle = 'rgba(140,160,180,0.45)'; g.lineWidth = 0.8;
    const r = rng(81);
    for (let i = 0; i < 26; i++) { const y = HZ - 12 + r() * 14, x = 1350 + r() * (v.x1 - 1350); g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + r() * 60, y); g.stroke(); }

    // far cumulus out over the sea, sitting on its far edge
    const towers = [[1700, HZ - 22, 240, 70, 41], [2000, HZ - 22, 300, 92, 43], [1450, HZ - 22, 150, 40, 47], [2250, HZ - 22, 200, 60, 53]];
    for (const [x, y, w, h, s] of towers) {
      const rr = rng(s), cs = [];
      const n = Math.round(w / 26);
      for (let i = 0; i < n; i++) { const u = i / (n - 1), env = Math.sin(Math.PI * (0.1 + u * 0.8)); const rad = h * (0.25 + 0.4 * env) * (0.8 + rr() * 0.4); cs.push([x + (u - 0.5) * w, y - rad * 0.6 - env * h * 0.35 * rr(), rad]); }
      g.save(); g.globalAlpha = 0.75; lumps(g, cs, TOWER, y); g.restore();
    }

    // the headland: cool violet rock in its own shadow, warm only where its bluffs turn to the sun
    const hp = curve(HEAD, true);
    g.fillStyle = grad(g, 0, 150, 0, HZ, ['#6c6890', '#757096', '#8a83a3']);
    g.fill(hp);
    g.save(); g.clip(hp);
    const rs = rng(5);
    // bluffs: each a lit left face and a shaded front, between coves
    const bluffs = [[-90, 140], [150, 60], [300, 190], [610, 90], [830, 210], [1120, 70], [1260, 40]];
    for (const [x, w] of bluffs) {
      const top = headY(x + w * 0.3) + 20, x1 = x + w;
      g.fillStyle = 'rgba(176,144,160,0.32)';
      g.fill(poly([[x, headY(x) + 22], [x + w * 0.28, top], [x + w * 0.22, HZ], [x - w * 0.05, HZ]]));
      g.fillStyle = 'rgba(84,78,120,0.22)';
      g.fill(poly([[x + w * 0.7, headY(x + w * 0.7) + 22], [x1, headY(x1) + 24], [x1 - w * 0.05, HZ], [x + w * 0.62, HZ]]));
      g.strokeStyle = 'rgba(60,52,90,0.5)'; g.lineWidth = 1.2;
      g.beginPath(); g.moveTo(x + w * 0.28, top); g.quadraticCurveTo(x + w * 0.25 + rs() * 6, (top + HZ) / 2, x + w * 0.22, HZ); g.stroke();
    }
    // bedding: long, slightly tilted strata catching a little light
    for (let i = 0; i < 26; i++) {
      const y = 200 + rs() * 170, x = -100 + rs() * 1400, w = 60 + rs() * 220;
      if (y < headY(x) + 26) continue;
      g.strokeStyle = rs() < 0.5 ? 'rgba(200,170,180,0.3)' : 'rgba(70,62,100,0.3)'; g.lineWidth = 1 + rs();
      g.beginPath(); g.moveTo(x, y); g.lineTo(x + w, y + w * 0.04); g.stroke();
    }
    // grassy cap with a ragged lower edge that hangs down into the gullies
    const cap = new Path2D();
    cap.moveTo(-140, HEAD[1][1] - 2);
    for (const [x, y] of HEAD.slice(1, -1)) cap.lineTo(x, y - 2);
    for (let x = 1420; x >= -140; x -= 12) cap.lineTo(x, headY(x) + 10 + Math.abs(noise(x * 0.05)) * 14 + (Math.abs(noise(x * 0.013 + 4)) > 0.7 ? 18 : 0));
    cap.closePath();
    g.fillStyle = '#8f8f78'; g.fill(cap);
    g.save(); g.clip(cap); g.fillStyle = grad(g, 0, 150, 0, 300, ['#b0a98a', '#8f8f78']); g.translate(-6, -6); g.fill(cap); g.restore();
    g.strokeStyle = 'rgba(70,66,70,0.5)'; g.lineWidth = 1; g.stroke(cap);
    // a band of haze at its foot, where it meets the far flats
    g.fillStyle = grad(g, 0, HZ - 40, 0, HZ, ['rgba(236,222,210,0)', 'rgba(240,226,212,0.55)']);
    g.fillRect(-150, HZ - 60, 1600, 62);
    g.restore();
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(80,66,104,0.55)'; g.stroke(hp);

    // cottages and a windbreak of pines up on the headland: where the town was before it walked
    const houses = [[260, 0.9], [300, 1], [338, 0.8], [1060, 0.9], [1095, 0.7], [200, 0.7]];
    for (const [x, s] of houses) {
      const y = headY(x) + 6, w = 13 * s, h = 9 * s;
      g.fillStyle = '#d9c3b3'; g.fillRect(x - w / 2, y - h, w, h);
      g.fillStyle = '#a99aaf'; g.fillRect(x + w * 0.05, y - h, w * 0.45, h);
      g.fillStyle = '#9c6a72'; g.fill(poly([[x - w * 0.62, y - h], [x, y - h - 7 * s], [x + w * 0.62, y - h]]));
      g.fillStyle = '#f3d08a'; g.fillRect(x - w * 0.3, y - h * 0.6, 2, 2.2);
    }
    for (const [x, n] of [[420, 5], [960, 4], [150, 3]]) for (let i = 0; i < n; i++) {
      const px = x + i * 9 + Math.sin(i * 3) * 3, py = headY(px) + 4, ph = 16 + (i % 2) * 6;
      g.fillStyle = '#6f7486'; g.fill(poly([[px - 4, py], [px, py - ph], [px + 4, py]]));
      g.fillStyle = 'rgba(200,170,150,0.5)'; g.fill(poly([[px - 4, py], [px, py - ph], [px - 0.5, py]]));
    }
    // the lighthouse on the headland's point
    const lx = 1318, ly = headY(1318) + 3;
    g.fillStyle = '#efe4d8'; g.fill(poly([[lx - 5, ly], [lx - 3.4, ly - 30], [lx + 3.4, ly - 30], [lx + 5, ly]]));
    g.fillStyle = '#b9a9bb'; g.fill(poly([[lx + 0.5, ly], [lx + 0.3, ly - 30], [lx + 3.4, ly - 30], [lx + 5, ly]]));
    g.fillStyle = '#c4645a'; for (const k of [8, 18]) g.fillRect(lx - 4.6 + k * 0.05, ly - k - 3, 9.2 - k * 0.1, 3.4);
    g.fillStyle = '#6a5a70'; g.fillRect(lx - 4, ly - 34, 8, 4);
    g.fillStyle = '#ffe9a8'; g.fillRect(lx - 2.6, ly - 38, 5.2, 4);
    g.fillStyle = '#c4645a'; g.fill(poly([[lx - 4.5, ly - 38], [lx, ly - 43], [lx + 4.5, ly - 38]]));

    // the surf line where the sea meets the flats: the tide is out here, but on its way back
    g.fillStyle = 'rgba(255,255,248,0.9)'; g.fillRect(1290, HZ + 3, v.x1 - 1280, 1.6);
    g.fillStyle = 'rgba(120,140,160,0.35)'; g.fillRect(1290, HZ + 4.6, v.x1 - 1280, 1.4);
    // the far flats: pale, glassy, mirroring the sky in long bands
    g.fillStyle = grad(g, 0, HZ, 0, HZ + 90, ['#eadcd0', '#e1cdbd']);
    g.fillRect(v.x0 - 10, HZ, v.x1 - v.x0 + 20, 90);
    const rf = rng(12);
    for (let i = 0; i < 50; i++) {
      const y = HZ + 2 + rf() ** 1.6 * 80, x = v.x0 + rf() * (v.x1 - v.x0), w = (40 + rf() * 220) * (0.4 + (y - HZ) / 80);
      g.fillStyle = rf() < 0.6 ? 'rgba(246,238,224,0.7)' : 'rgba(186,196,210,0.35)';
      g.fill(ell(x, y, w, 0.6 + (y - HZ) * 0.03));
    }
  },
});
function headY(x) {
  for (let i = 1; i < HEAD.length; i++) if (HEAD[i][0] >= x) { const [x0, y0] = HEAD[i - 1], [x1, y1] = HEAD[i]; return lerp(y0, y1, (x - x0) / Math.max(1, x1 - x0)); }
  return HZ;
}
F.headY = headY;

// ------------------------------------------------------------ the far sea moving: glints and the turning tide
layer({
  id: 'sea', z: 3,
  draw(g, t) {
    const v = st.view;
    g.save();
    g.beginPath(); g.rect(1300, HZ - 22, v.x1 - 1290, 28); g.clip();
    for (let i = 0; i < 30; i++) {
      const x = 1320 + ((i * 137.3 + t * (6 + (i % 3) * 3)) % (v.x1 - 1300 + 40)), y = HZ - 19 + (i * 7.3) % 22;
      const a = 0.5 + 0.5 * Math.sin(t * (1.2 + (i % 5) * 0.4) + i);
      g.fillStyle = `rgba(255,252,236,${0.75 * a})`; g.fillRect(x, y, 6 + (i % 4) * 5, 1);
    }
    // the line where the incoming tide breaks on the far bars
    for (let i = 0; i < 3; i++) {
      const ph = (t * 0.07 + i / 3) % 1, y = HZ - 1 + ph * 4;
      g.fillStyle = `rgba(255,255,250,${0.8 * Math.sin(ph * Math.PI)})`;
      g.fillRect(1300, y, v.x1 - 1290, 1.2);
    }
    g.restore();
    // a sail far out
    const sx = 2060 + Math.sin(t * 0.05) * 30;
    g.fillStyle = '#7c7590'; g.fillRect(sx - 6, HZ - 9, 12, 2.4);
    g.fillStyle = '#fff4e2'; g.fill(poly([[sx - 1, HZ - 9], [sx - 1, HZ - 25], [sx + 7, HZ - 10]]));
    g.fillStyle = '#e3a48c'; g.fill(poly([[sx - 2, HZ - 10], [sx - 2, HZ - 21], [sx - 7, HZ - 10]]));
  },
});

// ------------------------------------------------------------ the caravan still coming in along the horizon
const caravan = [];
{
  const r = rng(101);
  for (let i = 0; i < 6; i++) caravan.push({ x: 1440 + i * 112 + r() * 30, y: HZ + 6 + r() * 8, k: 0.7 + r() * 0.5, shape: i % 3, lamps: 0, lit: 0, ph: r() * 10 });
}
layer({
  id: 'caravan', z: 4,
  hit: (x, y) => x > 1400 && x < 2200 && y > HZ - 30 && y < HZ + 20,
  update(dt, t, L) {
    caravan.forEach((c, i) => {
      const on = L.hovered && L.since > i * 0.25;
      c.lit = ease(c.lit, on ? 1 : 0, on ? 3 : 0.6, dt);
    });
  },
  draw(g, t) {
    for (const c of caravan) {
      const x = c.x - ((t * 0.9) % 4000) * 0.0 - t * 0.6, y = c.y, s = c.k * (y - HZ + 8) / 14;
      const xx = ((x - 1300) % 1000 + 1000) % 1000 + 1300;
      g.save(); g.translate(xx, y); g.scale(-s, s);
      // a hazy silhouette: foot, a shell, and a lamp swinging from the shell
      g.fillStyle = 'rgba(150,134,160,0.85)';
      g.fill(curve([[-12, 0], [-8, -2.4], [8, -2.6], [12, -6], [14, -3.5], [14, 0]]));
      g.fillRect(11.5, -10, 0.6, 5); g.fillRect(13, -9.5, 0.6, 4.5);
      g.fillStyle = 'rgba(176,154,170,0.95)';
      if (c.shape === 0) g.fill(circ(-1, -9, 8));
      else if (c.shape === 1) g.fill(poly([[-9, -2], [-4, -16], [-1, -20], [3, -14], [7, -2]]));
      else g.fill(ell(-1, -7.5, 10, 6.5));
      g.fillStyle = 'rgba(206,182,186,0.9)';
      g.fill(ell(-4, -9, 3, 4));
      // their little lamps (come on when you look at them)
      const sw = Math.sin(t * 1.5 + c.ph) * 0.8;
      g.fillStyle = `rgba(255,214,140,${0.25 + c.lit * 0.75})`;
      g.fill(circ(6 + sw, -3.5, 1.3 + c.lit * 0.6));
      if (c.lit > 0.05) { g.fillStyle = radial(g, 6 + sw, -3.5, 0, 6, [[0, `rgba(255,220,150,${0.5 * c.lit})`], [1, 'rgba(255,220,150,0)']]); g.fill(circ(6 + sw, -3.5, 6)); }
      g.restore();
    }
  },
});

// ------------------------------------------------------------ gulls
const gulls = [];
{
  const r = rng(77);
  for (let i = 0; i < 7; i++) gulls.push({ cx: 300 + r() * 1800, cy: 70 + r() * 200, rx: 60 + r() * 120, ry: 14 + r() * 24, sp: (0.16 + r() * 0.2) * (r() < 0.5 ? -1 : 1), ph: r() * TAU, s: 0.7 + r() * 0.7, flapPh: r() * TAU, dodge: 0, dvx: 0, dvy: 0, ox: 0, oy: 0 });
}
F.gulls = gulls;
layer({
  id: 'gulls', z: 60,
  hit(x, y) { for (const q of gulls) if (Math.hypot(x - q.x, y - q.y) < 26 * q.s) return (this.which = q), true; return false; },
  onEnter(L) { const q = L.which; if (q) { q.dodge = 1; q.dvx = (P.vx > 0 ? 1 : -1) * 120 + (q.x - P.x) * 2; q.dvy = -140; F.spawn({ kind: 'word', text: 'kyow!', x: q.x, y: q.y - 18, vy: -12, life: 1.3, size: 0.9 }); } },
  update(dt, t) {
    for (const q of gulls) {
      q.ph += q.sp * dt * (1 + q.dodge * 2);
      const bx = q.cx + Math.cos(q.ph) * q.rx, by = q.cy + Math.sin(q.ph * 2) * q.ry * 0.5;
      q.ox += q.dvx * dt; q.oy += q.dvy * dt;
      q.dvx *= Math.exp(-1.6 * dt); q.dvy *= Math.exp(-1.6 * dt);
      q.ox *= Math.exp(-0.5 * dt); q.oy *= Math.exp(-0.5 * dt);
      q.dodge = ease(q.dodge, 0, 0.8, dt);
      const nx = bx + q.ox, ny = by + q.oy;
      q.vx = (nx - (q.x ?? nx)) / Math.max(dt, 1e-3);
      q.x = nx; q.y = ny;
    }
  },
  draw(g, t) {
    for (const q of gulls) {
      const dir = q.vx >= 0 ? 1 : -1;
      // glide most of the time, flap in bursts
      const burst = Math.max(0, Math.sin(t * 0.5 + q.flapPh)) > 0.6 || q.dodge > 0.2;
      const flap = burst ? t * 11 + q.flapPh : Math.sin(t * 0.8 + q.flapPh) * 0.25 + 0.3;
      F.gull(g, q.x, q.y, q.s, flap, dir, 0.25);
    }
  },
});
})();
