/* island.js — the mossy island in the puddle. We're at the waterline looking up at it, so its
   front is a bank of soil in shade (roots, pebbles, strata, a burrow door at the waterline), its
   top is a silhouette of moss rimmed gold by the sun behind, and moss capsules on thin stalks
   stand up along the ridge like little lamps, each holding a bead of rain.

   Hover the moss: it squelches, a few bubbles rise at the waterline and the capsules shiver.
   Hover the burrow door at the waterline: it opens and a woodlouse grandmother looks out at the
   weather, then shuts it again.

   island z10 (still) · capsules z10.8 · burrow z11 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, ink, st, P, layer, onLayout } = Drawn;
  const { C, SUN, HZ, FAR, SHORE, LINE } = DH;
  const M = C.moss, S = C.soil;

  // the front waterline, gently wavering in toward us at the middle
  const shoreY = (x) => SHORE + 6 * Math.sin((x - 858) / 822 * Math.PI) + 2 * noise(x * 0.05);
  DH.shoreY = shoreY;
  DH.groundAt = (x) => (x > 870 && x < 1670 ? DH.ridgeY(x) : SHORE + 40 + Math.random() * 200);

  function bodyPath() {
    const p = new Path2D(), R = DH.ridge;
    p.moveTo(R[0][0], shoreY(R[0][0]));
    for (let x = R[0][0]; x <= R[R.length - 1][0]; x += 6) p.lineTo(x, DH.ridgeY(x) + 1.5 * noise(x * 0.3));
    for (let x = R[R.length - 1][0]; x >= R[0][0]; x -= 8) p.lineTo(x, shoreY(x));
    p.closePath();
    return p;
  }

  function paintIsland(g) {
    const B = bodyPath();
    const r = rng(101);
    // the face is in shade (the sun is behind the island): cool and dark, wetter toward the water,
    // a warm bounce off the bright water only low down on the sun's side
    g.fillStyle = grad(g, 0, 620, 0, SHORE, [[0, '#2c1e2c'], [0.55, '#231824'], [1, '#150d17']]);
    g.fill(B);
    g.save(); g.clip(B);
    g.fillStyle = radial(g, 880, SHORE + 10, 0, 300, [[0, 'rgba(240,150,100,0.42)'], [0.5, 'rgba(200,110,100,0.15)'], [1, 'rgba(200,110,100,0)']]);
    g.fillRect(850, 560, 600, 260);
    g.fillStyle = grad(g, 0, SHORE - 50, 0, SHORE, [[0, 'rgba(160,110,140,0)'], [1, 'rgba(160,110,140,0.22)']]);
    g.fillRect(850, SHORE - 50, 840, 50);
    // clods of humus: soft darker and lighter lumps, no stripes
    for (let i = 0; i < 70; i++) {
      const x = 870 + r() * 800, top = DH.ridgeY(x) + 30, y = top + r() * Math.max(4, shoreY(x) - top - 10);
      const rr = 6 + r() * 16;
      g.fillStyle = r() < 0.55 ? 'rgba(12,6,14,0.18)' : 'rgba(90,60,76,0.1)';
      g.fill(DH.blob(x, y, rr * 1.4, rr * 0.8, 7, 0.4, i));
    }
    // grit
    for (let i = 0; i < 220; i++) {
      const x = 860 + r() * 820, y = DH.ridgeY(x) + 24 + r() * (shoreY(x) - DH.ridgeY(x) - 24);
      g.fillStyle = r() < 0.5 ? 'rgba(130,92,100,0.4)' : 'rgba(8,4,10,0.45)';
      g.fill(circ(x, y, 0.5 + r() * 1.3));
    }
    // a few stones bedded in the face, mostly half-buried, and a cluster at the waterline
    const stones = [[968, 744, 9], [1150, 706, 7], [1452, 690, 8], [905, 786, 11], [930, 790, 7], [1092, 788, 14], [1120, 792, 8], [1340, 788, 12], [1372, 792, 7], [1560, 784, 13], [1594, 790, 8], [1470, 790, 6]];
    for (const [x, y, sz] of stones) {
      const tone = r();
      const p = DH.blob(x, y, sz * 1.3, sz * 0.82, 9, 0.22, x);
      g.fillStyle = 'rgba(6,4,10,0.5)'; g.fill(DH.blob(x + 1, y + 3, sz * 1.4, sz * 0.9, 9, 0.22, x));
      ink(g, p, tone < 0.5 ? '#3e3850' : '#4a3e44', 1.4);
      DH.crescent(g, p, tone < 0.5 ? '#2a2438' : '#2f262c', 0, -sz * 0.35);
      DH.crescent(g, p, y > 770 ? 'rgba(255,170,120,0.55)' : 'rgba(200,140,150,0.35)', 0, -2.2);
      DH.crescent(g, p, 'rgba(255,200,140,0.5)', -DH.sunSide(x) * 2, 1.5);
    }
    // little bracket fungi on the face, rimmed in gold
    for (const [x, y, s2] of [[1196, 724, 1], [1210, 736, 0.7], [1528, 724, 0.9], [1010, 728, 0.6]]) {
      const sh = new Path2D(); sh.moveTo(x - 11 * s2, y); sh.quadraticCurveTo(x, y - 9 * s2, x + 11 * s2, y); sh.quadraticCurveTo(x, y + 3 * s2, x - 11 * s2, y); sh.closePath();
      g.fillStyle = 'rgba(6,4,10,0.45)'; g.fill(ell(x, y + 4 * s2, 10 * s2, 2.5 * s2));
      ink(g, sh, '#c07040', 1.3);
      DH.crescent(g, sh, '#7a3a2a', 0, -2.5 * s2);
      g.lineWidth = 1.2; g.strokeStyle = '#f0c080'; g.beginPath(); g.moveTo(x - 10 * s2, y - 0.5); g.quadraticCurveTo(x, y - 8 * s2, x + 10 * s2, y - 0.5); g.stroke();
    }
    // root tangles hanging from under the moss, some reaching into the water
    g.lineCap = 'round';
    for (const cx of [890, 1060, 1236, 1400, 1630]) {
      const y0 = DH.ridgeY(cx) + 22;
      const n = 5 + (r() * 4 | 0);
      for (let i = 0; i < n; i++) {
        const x = cx + (r() - 0.5) * 50, len = (shoreY(x) - y0) * (0.4 + r() * 0.7);
        const pts = [[x, y0 + r() * 8]];
        let px = x, py = y0;
        for (let k = 0; k < 6; k++) { py += len / 6; px += (r() - 0.5) * 14 + (k > 3 ? (r() - 0.5) * 10 : 0); pts.push([px, py]); }
        const p = curve(pts, false);
        g.lineWidth = 2.6 + r() * 1.4; g.strokeStyle = 'rgba(8,4,10,0.6)'; g.stroke(p);
        g.lineWidth = 1 + r() * 1.4; g.strokeStyle = r() < 0.5 ? '#7a5a5a' : '#6a4a52'; g.stroke(p);
        g.lineWidth = 0.6; g.strokeStyle = 'rgba(255,180,140,0.35)'; g.save(); g.translate(-0.6, -0.4); g.stroke(p); g.restore();
        const [tx, ty] = pts[pts.length - 1];
        if (ty < shoreY(tx) - 6 && r() < 0.5) DH.glassDrop(g, tx, ty + 2.5, 1.6 + r());
      }
    }
    // the wet band at the waterline, and the meniscus where the soil meets the water
    g.fillStyle = grad(g, 0, SHORE - 26, 0, SHORE + 6, [[0, 'rgba(8,4,14,0)'], [1, 'rgba(8,4,14,0.65)']]);
    g.fillRect(850, SHORE - 30, 840, 50);
    g.restore();
    g.lineWidth = 2.8; g.strokeStyle = LINE; g.stroke(B);
    const men = new Path2D();
    for (let x = 858; x <= 1676; x += 8) x === 858 ? men.moveTo(x, shoreY(x) - 1) : men.lineTo(x, shoreY(x) - 1);
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,214,170,0.55)'; g.stroke(men);

    // the moss cap along the ridge: a thick mat overhanging the face, its lumpy lower edge in
    // shade, its upper fringe lit from behind
    const mat = new Path2D(), r2 = rng(202);
    mat.moveTo(864, DH.ridgeY(864));
    for (let x = 864; x <= 1676; x += 5) mat.lineTo(x, DH.ridgeY(x) - 2 - Math.abs(noise(x * 0.11)) * 5);
    for (let x = 1676; x >= 864; x -= 7) mat.lineTo(x, DH.ridgeY(x) + 18 + Math.abs(noise(x * 0.035 + 3)) * 26 + (r2() < 0.18 ? 9 + r2() * 12 : 0));
    mat.closePath();
    g.lineWidth = 4.6; g.strokeStyle = LINE; g.stroke(mat);
    g.fillStyle = M.shade; g.fill(mat);
    // beards of moss hanging off the mat's lip
    for (let x = 874; x < 1670; x += 10 + r2() * 26) {
      const y = DH.ridgeY(x) + 22 + Math.abs(noise(x * 0.035 + 3)) * 22, L = 8 + r2() * 26;
      g.lineWidth = 3; g.strokeStyle = LINE; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y + L * 0.6, x - 1, y + L); g.stroke();
      g.lineWidth = 1.6; g.strokeStyle = '#3c5a34'; g.stroke();
      if (r2() < 0.4) DH.glassDrop(g, x - 1, y + L + 2, 1.5);
    }
    g.save(); g.clip(mat);
    // lower lumps darker, then the body, then the lit fringe
    for (let x = 866; x <= 1676; x += 7 + r2() * 6) {
      const y = DH.ridgeY(x) + 10 + r2() * 12, rr = 6 + r2() * 9;
      g.fillStyle = r2() < 0.5 ? M.base : '#435f36'; g.fill(circ(x, y - rr * 0.4, rr));
      g.fillStyle = M.deep; g.fill(ell(x, y + rr * 0.7, rr, rr * 0.45));
    }
    g.restore();
    // fronds: little star sprigs along the top, tips catching gold
    for (let x = 866; x <= 1676; x += 3 + r2() * 4) {
      const y = DH.ridgeY(x) - 1, near = DH.sunNear(x, y), h = 4 + r2() * 8;
      const lean = (r2() - 0.5) * 4;
      g.lineWidth = 1.4; g.strokeStyle = r2() < 0.5 ? M.base : M.lit;
      g.beginPath(); g.moveTo(x, y + 4); g.lineTo(x + lean, y - h); g.stroke();
      g.strokeStyle = `rgba(255,${200 + near * 40 | 0},120,${0.35 + near * 0.6})`;
      g.lineWidth = 1.1; g.beginPath(); g.moveTo(x + lean * 0.7, y - h * 0.6); g.lineTo(x + lean, y - h); g.stroke();
    }
    // the rim of light along the whole ridge
    const rimP = new Path2D();
    for (let x = 864; x <= 1676; x += 5) { const y = DH.ridgeY(x) - 2 - Math.abs(noise(x * 0.11)) * 5; x === 864 ? rimP.moveTo(x, y) : rimP.lineTo(x, y); }
    g.lineWidth = 2.2; g.strokeStyle = 'rgba(255,214,130,0.75)'; g.stroke(rimP);
  }
  DH.paintIsland = paintIsland;

  layer({ id: 'island', z: 10, still: true, draw: paintIsland });
  DH.mirror(SHORE + 2, (g) => paintIsland(g));

  // ------------------------------------------------------------ moss capsules (sporophytes)
  const caps = [];
  onLayout(() => {
    caps.length = 0;
    const r = rng(303);
    for (let x = 880; x < 1660; x += 14 + r() * 30) {
      if (x > 940 && x < 1120) continue; // the cistern stands here
      caps.push({ x, h: 14 + r() * 26, lean: (r() - 0.5) * 0.5, ph: r() * TAU, s: 0.8 + r() * 0.5, bead: r() < 0.6 });
    }
  });
  const squelch = { v: 0 };
  layer({
    id: 'capsules', z: 10.8,
    hit: (x, y) => x > 870 && x < 1670 && y > DH.ridgeY(x) - 18 && y < DH.ridgeY(x) + 30,
    onEnter() {
      squelch.v = 1;
      for (let i = 0; i < 6; i++) DH.spawn({ kind: 'bubble', x: P.x + (Math.random() - 0.5) * 80, y: shoreY(P.x) + 4 + Math.random() * 20, vx: 0, vy: -8, r: 1.5 + Math.random() * 2.5, life: 1.2 + Math.random(), g: 0, z: 'mid' });
    },
    update(dt) { squelch.v = Math.max(0, squelch.v - dt * 0.9); },
    draw(g, t) {
      for (const c of caps) {
        const y0 = DH.ridgeY(c.x) + 2;
        const w = Drawn.wind(t, c.x);
        const shiver = squelch.v * Math.sin(t * 40 + c.ph) * 0.12 * Math.exp(-Math.abs(c.x - P.x) / 200);
        const a = c.lean + (w - 0.6) * 0.18 + Math.sin(t * 1.6 + c.ph) * 0.05 + shiver;
        const tx = c.x + Math.sin(a) * c.h, ty = y0 - Math.cos(a) * c.h;
        const near = DH.sunNear(c.x, y0);
        g.lineWidth = 1.2; g.strokeStyle = '#7a4a3a';
        g.beginPath(); g.moveTo(c.x, y0); g.quadraticCurveTo(c.x + Math.sin(a) * c.h * 0.4, y0 - c.h * 0.6, tx, ty); g.stroke();
        g.save(); g.translate(tx, ty); g.rotate(a);
        const p = ell(0, -3 * c.s, 2.2 * c.s, 4 * c.s);
        ink(g, p, '#a8663e', 0.9);
        DH.crescent(g, p, `rgba(255,${200 + near * 40 | 0},120,1)`, -DH.sunSide(c.x) * 1.2, 0.6);
        g.restore();
        if (c.bead) DH.glassDrop(g, tx - 1, ty - 7.5 * c.s, 1.9 * c.s);
      }
    },
  });

  // ------------------------------------------------------------ the burrow at the waterline
  const BURROW = { x: 1258, y: SHORE - 6 };
  const burrow = { open: 0, act: DH.actor(7, ['peek'], [12, 18], 3.2), blink: Drawn.blinker() };
  layer({
    id: 'burrow', z: 11,
    hit: (x, y) => Math.hypot(x - BURROW.x, (y - BURROW.y + 16) * 1.2) < 30,
    update(dt, t, L) {
      burrow.act.step(dt);
      const idle = burrow.act.name ? DH.bump(burrow.act.u) : 0;
      burrow.open = ease(burrow.open, Math.max(idle, L.hovered ? 1 : 0), L.hovered ? 4 : 2.5, dt);
    },
    draw(g, t, L) {
      const { x, y } = BURROW;
      // frame: an arch of twigs lashed with grass
      const arch = new Path2D();
      arch.moveTo(x - 17, y); arch.lineTo(x - 17, y - 18); arch.bezierCurveTo(x - 17, y - 40, x + 17, y - 40, x + 17, y - 18); arch.lineTo(x + 17, y); arch.closePath();
      g.fillStyle = '#120a14'; g.fill(arch);
      // warm inside, only when the door's open
      if (burrow.open > 0.05) {
        g.save(); g.clip(arch);
        g.fillStyle = `rgba(255,170,90,${0.55 * burrow.open})`; g.fillRect(x - 20, y - 44, 40, 46);
        // grandmother woodlouse: a dome of plates, spectacles, a knitted shawl
        const k = burrow.open, by = y + 18 - k * 20;
        const body = ell(x, by, 14, 10);
        ink(g, body, C.bug.base, 1.4);
        DH.crescent(g, body, C.bug.shade, 0, -3);
        g.strokeStyle = C.bug.deep; g.lineWidth = 1;
        for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(x + i * 5, by, 9, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); }
        g.fillStyle = '#c8564a'; g.fill(poly([[x - 14, by + 4], [x + 14, by + 4], [x + 10, by + 10], [x - 10, by + 10]]));
        const o = burrow.blink(t);
        for (const ex of [-4.5, 4.5]) {
          g.fillStyle = LINE; g.fill(ell(x + ex, by - 3, 1.6, 1.8 * o));
          g.lineWidth = 0.9; g.strokeStyle = '#d8c28a'; g.stroke(circ(x + ex, by - 3, 3.2));
        }
        g.restore();
      }
      // the door swings inward (we see it narrow)
      const dw = 15 * (1 - burrow.open * 0.85);
      const door = new Path2D();
      door.moveTo(x - 15, y); door.lineTo(x - 15, y - 17); door.bezierCurveTo(x - 15, y - 37, x - 15 + dw * 2, y - 37, x - 15 + dw * 2, y - 17); door.lineTo(x - 15 + dw * 2, y); door.closePath();
      ink(g, door, '#7a4a34', 1.3);
      g.save(); g.clip(door);
      g.strokeStyle = 'rgba(40,20,20,0.6)'; g.lineWidth = 1;
      for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(x - 15 + dw * 2 * i / 4, y - 36); g.lineTo(x - 15 + dw * 2 * i / 4, y); g.stroke(); }
      g.fillStyle = 'rgba(255,190,130,0.35)'; g.fillRect(x - 15, y - 37, 3, 37);
      g.restore();
      g.fillStyle = '#d8b06a'; g.fill(circ(x - 15 + dw * 1.6, y - 14, 1.6));
      ink(g, arch, null, 2.2);
      // twig lintel
      g.lineWidth = 4; g.strokeStyle = '#5a3a2c'; g.beginPath(); g.moveTo(x - 22, y - 33); g.quadraticCurveTo(x, y - 46, x + 22, y - 33); g.stroke();
      g.lineWidth = 1.2; g.strokeStyle = LINE; g.stroke();
      // a step of flat stone, wet
      ink(g, ell(x, y + 1, 22, 4), '#4a4256', 1.3);
      g.fillStyle = 'rgba(255,214,160,0.4)'; g.fill(ell(x - 4, y - 0.5, 12, 1.4));
    },
  });

  // bubbles rising at the waterline (from the moss squelch)
  layer({
    id: 'bubbles', z: 11.2,
    update(dt) { for (const p of DH.fx) if (p.kind === 'bubble') { p.y += p.vy * dt * 0.3; p.x += Math.sin(p.age * 6 + p.r) * 0.2; } },
    draw(g) {
      for (const p of DH.fx) if (p.kind === 'bubble') {
        const k = p.age / p.life;
        g.globalAlpha = 1 - k;
        g.lineWidth = 0.9; g.strokeStyle = 'rgba(230,226,250,0.9)'; g.stroke(circ(p.x, p.y, p.r * (0.6 + k * 0.6)));
        g.fillStyle = 'rgba(255,255,255,0.8)'; g.fill(circ(p.x - p.r * 0.3, p.y - p.r * 0.3, p.r * 0.25));
        g.globalAlpha = 1;
      }
    },
  });

  // rain on the island: a puff of spray off the moss
  DH.surface({ band: 'near', x0: 862, x1: 1676, y: (x) => DH.ridgeY(x) - 3, hit(x, y, d) { DH.splash(x, y, d.r * 0.7, 'ground', 'mid'); } });
})();
