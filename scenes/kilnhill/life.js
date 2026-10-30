/* life.js — more of the hill's inhabitants and the things they leave lying about.
   z 17 / 18.5  hill door (still / live): a round door into the cut clay face, its fanlight lit.
     Hover: it swings open and a mole in a nightcap steps onto the threshold with a candle
   z 18.6  digger (live): a mole hacking clay out of the face with a mattock, chips flying.
     Hover: it stops and leans on the handle to get its breath; linger and it finds a worm in the
     clay and holds it up, delighted
   z 18.8  hoist (live): a basket of clay on a rope from a beam on the terrace lip, bobbing.
     Hover: it's hauled up to the top, then lowered again
   z 50.5 / 51.5  puddle (still / live): a slip puddle by the path that catches the kiln's glow in
     shivering streaks. Hover: it ripples out from the pointer
   z 52.5  barrow (still): a barrow of dug clay with a spade stuck in it
   z 37  kite (live): the mole on top of the jar stack is flying a paper lantern-kite, its candle
     glowing through the paper. Idle: it rides the breeze. Hover: it dips on a tug and climbs back;
     linger and it loops right round
   z 60 / 61  ground door (still / live): a hatch in a grassy mound, propped open on a stick,
     light pouring up the steps; boots left by it (mostly below the artboard: the phone frame).
     Hover: a mole climbs up and looks out */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, rect, poly, curve, grad, radial, st, P, layer } = Drawn;
  const K = window.Kiln, M = K.M;

  // ------------------------------------------------------------------ hill door
  const DX = -66, DY = 882, DW = 50, DH = 66;
  const doorPath = (() => { const p = new Path2D(); p.moveTo(DX - DW / 2, DY); p.lineTo(DX - DW / 2, DY - DH + DW / 2); p.arc(DX, DY - DH + DW / 2, DW / 2, Math.PI, 0); p.lineTo(DX + DW / 2, DY); p.closePath(); return p; })();
  layer({
    id: 'hillDoor', z: 17, still: true,
    draw(g) {
      // a surround of fitted stones, then the dark of the doorway
      const r = rng(3);
      for (let i = 0; i < 13; i++) {
        const a = Math.PI + (i / 12) * Math.PI, R = DW / 2 + 9;
        const x = DX + Math.cos(a) * R, y = DY - DH + DW / 2 + Math.sin(a) * R;
        const p = ell(x, y, 8, 6, undefined, a + Math.PI / 2);
        g.fillStyle = K.litc(K.mix(M.stone, M.clayPale, r()), x, y, [Math.cos(a), Math.sin(a), 0.8]); g.fill(p); g.lineWidth = 1.2; g.strokeStyle = K.LINE; g.stroke(p);
      }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) {
        const x = DX + s * (DW / 2 + 9), y = DY - 10 - k * 13, p = K.rrect(x - 8, y - 6, 16, 12, 4);
        g.fillStyle = K.litc(K.mix(M.stone, M.clayPale, r()), x, y, [s, 0, 0.8]); g.fill(p); g.lineWidth = 1.2; g.strokeStyle = K.LINE; g.stroke(p);
      }
      g.fillStyle = '#1a0a06'; g.fill(doorPath);
      // doorstep, a boot-scraper, a pot of something green
      g.fillStyle = K.litc(M.stone, DX, DY + 4, [0, -1, 0.5]); g.fill(K.rrect(DX - 34, DY - 1, 68, 8, 3)); g.lineWidth = 1.3; g.strokeStyle = K.LINE; g.stroke(K.rrect(DX - 34, DY - 1, 68, 8, 3));
      const pot = K.lathe(DX + 46, [[9, DY - 16], [10, DY - 14], [8, DY]]);
      g.fillStyle = K.litc(M.terracotta, DX + 46, DY - 8); g.fill(pot.path); g.lineWidth = 1.3; g.stroke(pot.path);
      Drawn.lumps(g, [[DX + 42, DY - 22, 6], [DX + 50, DY - 24, 6], [DX + 46, DY - 30, 6]], { line: K.LINE, lw: 1.2, shade: K.litc('#2a4a2a', DX + 46, DY - 24), base: K.litc('#3a5a34', DX + 46, DY - 24), lit: K.litc('#5a7a40', DX + 40, DY - 26) });
    },
  });
  const blinkD = Drawn.blinker(2, 4);
  layer({
    id: 'hillDoorLive', z: 18.5,
    hit: (x, y) => Math.abs(x - DX) < 40 && y > DY - DH - 10 && y < DY + 6,
    draw(g, t, L) {
      const f = 0.9 + 0.1 * noise(t * 3.3);
      const h = K.smooth(L.hover);
      g.save(); g.clip(doorPath);
      g.fillStyle = grad(g, 0, DY - DH, 0, DY, [[0, K.css(K.fireAt(0.62 * f))], [1, K.css(K.fireAt(0.72 * f))]]); g.fill(doorPath);
      // a hall: a peg with a coat, a picture on the wall
      g.fillStyle = 'rgba(90,30,10,0.5)'; g.fillRect(DX - 18, DY - 50, 12, 9); g.fillRect(DX + 8, DY - 44, 3, 18);
      if (h > 0.05) {
        const step = K.smooth((L.since - 0.4) / 0.6) * (L.hovered ? 1 : h);
        K.mole(g, DX + 2 - (1 - step) * 6, DY + 2, 0.84, { hands: { f: [16, -24 - Math.sin(L.since * 7) * 2 * K.bell(clamp((L.since - 1) / 1.5, 0, 1))], b: [-12, -16] }, cap: '#8a5a7a', open: blinkD(t), smile: 1.2, lx: DX, ly: DY - 30 });
        g.fillStyle = K.css(K.fireAt(0.9)); g.fill(ell(DX + 16, DY - 30, 1.6, 3));
      }
      g.restore();
      // the door itself, swinging inward on its left hinge
      const sw = 1 - h * 0.85;
      g.save(); g.translate(DX - DW / 2, DY); g.transform(sw, 0, 0, 1, 0, 0);
      const dp = new Path2D(); dp.moveTo(0, 0); dp.lineTo(0, -DH + DW / 2); dp.arc(DW / 2, -DH + DW / 2, DW / 2, Math.PI, 0); dp.lineTo(DW, 0); dp.closePath();
      g.fillStyle = K.litc(M.clothGreen, DX, DY - 30, [0, 0, 1]); g.fill(dp);
      g.lineWidth = 0.9; g.strokeStyle = 'rgba(10,6,10,0.6)';
      for (const x of [12, 25, 38]) { g.beginPath(); g.moveTo(x, -4); g.lineTo(x, -DH + 10 + Math.abs(x - 25) * 0.6); g.stroke(); }
      // a round fanlight with glazing bars, lit from behind
      g.fillStyle = K.css(K.fireAt(0.66 * f)); g.fill(circ(DW / 2, -DH + 22, 8));
      g.lineWidth = 1.2; g.strokeStyle = '#1a0e10'; g.stroke(circ(DW / 2, -DH + 22, 8));
      g.beginPath(); g.moveTo(DW / 2 - 8, -DH + 22); g.lineTo(DW / 2 + 8, -DH + 22); g.moveTo(DW / 2, -DH + 14); g.lineTo(DW / 2, -DH + 30); g.stroke();
      g.fillStyle = '#c8a050'; g.fill(circ(DW - 8, -28, 2.2));
      g.lineWidth = 1.6; g.strokeStyle = K.LINE; g.stroke(dp);
      g.restore();
      g.globalCompositeOperation = 'lighter';
      K.glow(g, DX, DY - 4, 50 + h * 30, '#ffb050', 0.14 + h * 0.2);
      g.globalCompositeOperation = 'source-over';
    },
  });

  // ------------------------------------------------------------------ the digger
  const chips = [];
  const blinkG = Drawn.blinker(2, 4);
  layer({
    id: 'digger', z: 18.6, ph: 0,
    hit: (x, y) => x > 40 && x < 140 && y > 800 && y < 884,
    update(dt, t, L) {
      if (!L.hovered) this.ph += dt / 2.2;
      const u = this.ph % 1;
      if (u < this.lastU) for (let i = 0; i < 7; i++) chips.push({ x: 50, y: 846 + Math.random() * 10, vx: -20 + Math.random() * 90, vy: -60 - Math.random() * 60, age: 0, s: 1.5 + Math.random() * 2.5 });
      this.lastU = u;
      for (const c of chips) { c.age += dt; c.vy += 260 * dt; c.x += c.vx * dt; c.y = Math.min(882, c.y + c.vy * dt); if (c.y >= 882) c.vx *= 0.8; }
      while (chips.length && chips[0].age > 2.5) chips.shift();
    },
    draw(g, t, L) {
      // the dug alcove in the face, and the heap of clay beside it
      { const al = curve([[12, 886], [14, 838], [28, 818], [50, 814], [62, 838], [64, 886]]); g.fillStyle = '#1c0e0c'; g.fill(al); g.lineWidth = 1.6; g.strokeStyle = K.LINE; g.stroke(al); g.lineWidth = 2; g.strokeStyle = K.litc(M.clayPale, 40, 830); g.beginPath(); g.moveTo(30, 820); g.quadraticCurveTo(50, 812, 62, 838); g.stroke(); }
      Drawn.lumps(g, [[148, 880, 10], [160, 878, 12], [172, 881, 8], [156, 868, 9], [166, 870, 7]], { line: K.LINE, lw: 1.2, shade: K.litc(M.clayDark, 160, 874), base: K.litc(M.clay, 160, 874), lit: K.litc(M.clayPale, 150, 866) });
      // his lantern on the ground
      const f = 0.9 + 0.1 * noise(t * 5);
      g.fillStyle = K.litc(M.iron, 120, 878); g.fill(K.rrect(114, 862, 12, 16, 3)); g.lineWidth = 1.2; g.strokeStyle = K.LINE; g.stroke(K.rrect(114, 862, 12, 16, 3));
      g.fillStyle = K.css(K.fireAt(0.82 * f)); g.fill(ell(120, 870, 3.4, 5));
      g.beginPath(); g.arc(120, 860, 5, Math.PI, 0); g.stroke();
      // swing: raise slowly, strike fast
      const u = this.ph % 1, rest = L.hovered ? K.smooth(L.since / 0.4) : 0;
      let a = u < 0.7 ? -0.3 - K.smooth(u / 0.7) * 1.6 : -1.9 + K.smooth((u - 0.7) / 0.12) * 1.9;
      a = lerp(a, 0.6, rest);
      const worm = L.hovered && L.since > 1.6 ? K.smooth((L.since - 1.6) / 0.6) : 0;
      const mx = 82, my = 884;
      const hands = K.mole(g, mx, my, 0.88, {
        flip: true, lean: rest ? -0.06 : u > 0.7 && u < 0.85 ? 0.18 : -0.05,
        hands: worm > 0 ? { f: [12, -38 - worm * 6], b: [-8, -18] } : { f: [10, -22 + Math.sin(a) * 8], b: [4, -20 + Math.sin(a) * 6] },
        open: worm > 0.5 ? 1 : blinkG(t), smile: worm > 0.5 ? 2.2 : rest ? -0.4 : 0.4, mouth: rest && !worm ? 0.4 + 0.2 * Math.sin(t * 6) : 0, apron: '#7a6a5a', lx: 90, ly: 850,
      });
      // the mattock
      const [hx, hy] = worm > 0 ? hands.b : hands.f;
      const ang = Math.PI + a;
      const head = [hx + Math.cos(ang) * 32, hy + Math.sin(ang) * 32];
      Drawn.tube(g, Drawn.seg(hx - Math.cos(ang) * 6, hy - Math.sin(ang) * 6, head[0], head[1]), K.litc(M.woodPale, hx, hy), 2.6, 1.2);
      g.save(); g.translate(head[0], head[1]); g.rotate(ang + Math.PI / 2);
      const bl = poly([[-10, -2], [8, -3], [12, 0], [8, 3], [-10, 2]]);
      g.fillStyle = K.litc(M.iron, head[0], head[1]); g.fill(bl); g.lineWidth = 1.1; g.strokeStyle = K.LINE; g.stroke(bl);
      g.restore();
      if (worm > 0) {
        const [wx, wy] = hands.f;
        g.lineCap = 'round'; g.lineWidth = 3.4; g.strokeStyle = K.LINE;
        const wp = new Path2D(); wp.moveTo(wx, wy - 2); wp.bezierCurveTo(wx + 4, wy + 6, wx - 4, wy + 10, wx + 2 + Math.sin(t * 8) * 3, wy + 16);
        g.stroke(wp); g.lineWidth = 2; g.strokeStyle = '#e88a8a'; g.stroke(wp);
      }
      for (const c of chips) { g.fillStyle = K.litc(M.clay, c.x, c.y); g.fillRect(c.x, c.y, c.s, c.s); }
    },
  });

  // ------------------------------------------------------------------ the hoist
  const HX = 236, HTOP = 584;
  layer({
    id: 'hoist', z: 18.8, lift: 0,
    hit(x, y) { const by = basketY(Drawn.st.t, this.lift); return Math.abs(x - (HX + 19)) < 24 && y > by - 26 && y < by + 14; },
    update(dt, t, L) { this.held = L.hovered ? 1.6 : Math.max(0, (this.held || 0) - dt); this.lift = ease(this.lift, this.held > 0 ? 1 : 0, 0.8, dt); },
    draw(g, t, L) {
      // the beam out over the lip with its pulley
      Drawn.tube(g, Drawn.seg(HX - 40, HTOP + 6, HX + 20, HTOP - 2), K.litc(M.wood, HX, HTOP), 5, 1.4);
      Drawn.tube(g, Drawn.seg(HX - 30, HTOP + 6, HX - 36, HTOP + 30), K.litc(M.woodDark, HX, HTOP), 4, 1.2);
      g.fillStyle = K.litc(M.woodPale, HX + 14, HTOP + 4); g.fill(circ(HX + 14, HTOP + 4, 5)); g.lineWidth = 1.2; g.strokeStyle = K.LINE; g.stroke(circ(HX + 14, HTOP + 4, 5));
      const by = basketY(t, this.lift);
      g.lineWidth = 1; g.strokeStyle = K.litc(M.rope, HX, 700);
      g.beginPath(); g.moveTo(HX + 19, HTOP + 4); g.lineTo(HX + 19, by - 14); g.stroke();
      g.beginPath(); g.moveTo(HX + 9, HTOP + 4); g.lineTo(HX + 2, 878); g.stroke();
      // the basket: woven, full of clay
      const sway = Math.sin(t * 1.3) * 1.5;
      g.save(); g.translate(HX + 19 + sway, by);
      g.lineWidth = 0.9; g.strokeStyle = K.litc(M.rope, HX, by); g.beginPath(); g.moveTo(0, -14); g.lineTo(-10, -4); g.moveTo(0, -14); g.lineTo(10, -4); g.stroke();
      const bk = poly([[-11, -4], [11, -4], [8, 10], [-8, 10]]);
      g.fillStyle = K.litc(M.grassDry, HX, by, [0.4, 0, 0.9]); g.fill(bk);
      g.lineWidth = 0.7; g.strokeStyle = 'rgba(40,24,16,0.6)'; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(-10 + k * 0.8, -1 + k * 3); g.lineTo(10 - k * 0.8, -1 + k * 3); g.stroke(); }
      g.lineWidth = 1.3; g.strokeStyle = K.LINE; g.stroke(bk);
      Drawn.lumps(g, [[-5, -5, 4.5], [2, -6, 5], [7, -4, 3.5]], { line: K.LINE, lw: 1, shade: K.litc(M.clayDark, HX, by), base: K.litc(M.clay, HX, by), lit: K.litc(M.clayPale, HX, by) });
      g.restore();
    },
  });
  function basketY(t, lift) { return lerp(760 + Math.sin(t * 0.9) * 3, 622, K.smooth(lift)); }

  // ------------------------------------------------------------------ puddle
  const PU = { x: 470, y: 1074, rx: 96, ry: 14 };
  const puddle = curve([[PU.x - PU.rx, PU.y], [PU.x - PU.rx * 0.6, PU.y - PU.ry], [PU.x + PU.rx * 0.3, PU.y - PU.ry * 1.1], [PU.x + PU.rx, PU.y - 2], [PU.x + PU.rx * 0.7, PU.y + PU.ry], [PU.x - PU.rx * 0.4, PU.y + PU.ry * 0.9]]);
  layer({
    id: 'puddle', z: 50.5, still: true,
    draw(g) {
      // the slip puddle mirrors the dark above it, and the kiln's glow at its far edge
      // a muddy rim first, trodden wet clay
      g.fillStyle = K.litc(M.clayDark, PU.x, PU.y); g.fill(ell(PU.x + 4, PU.y + 2, PU.rx * 1.08, PU.ry * 1.5));
      g.fillStyle = grad(g, 0, PU.y - PU.ry, 0, PU.y + PU.ry, [[0, '#a8501e'], [0.3, '#4a2216'], [0.7, '#1a1014'], [1, '#0e0a10']]); g.fill(puddle);
      // the kiln's silhouette upside down at the far edge, dark against the glow
      g.save(); g.clip(puddle);
      g.fillStyle = 'rgba(14,8,12,0.75)'; g.fill(poly([[PU.x + 20, PU.y - PU.ry], [PU.x + 120, PU.y - PU.ry], [PU.x + 96, PU.y + 2], [PU.x + 70, PU.y + 10], [PU.x + 50, PU.y + 2]]));
      g.restore();
      g.lineWidth = 1.6; g.strokeStyle = 'rgba(20,10,14,0.9)'; g.stroke(puddle);
      g.lineWidth = 1; g.strokeStyle = K.css(K.lit('#e0c8a8', PU.x, PU.y), 0.6); g.beginPath(); g.ellipse(PU.x, PU.y + 1, PU.rx * 0.98, PU.ry, 0, 0.2, Math.PI - 0.2); g.stroke();
    },
  });
  const rings = [];
  layer({
    id: 'puddleLive', z: 51.5,
    hit: (x, y) => Math.hypot((x - PU.x) / PU.rx, (y - PU.y) / (PU.ry + 6)) < 1,
    update(dt, t, L) {
      if (L.hovered && Math.random() < dt * 3) rings.push({ x: P.x, y: PU.y + clamp(P.y - PU.y, -6, 6), age: 0 });
      for (const r of rings) r.age += dt;
      while (rings.length && rings[0].age > 1.6) rings.shift();
    },
    draw(g, t) {
      g.save(); g.clip(puddle);
      g.globalCompositeOperation = 'lighter';
      // shivering streaks of the firemouths' reflection
      for (let i = 0; i < 9; i++) {
        const y = PU.y - PU.ry + 2 + i * 2.2, w = (14 + noise(t * 2 + i * 3) * 10) * (1 - i / 12);
        const x = PU.x + 40 + noise(t * 1.5 + i * 7) * 6 + (i % 3 - 1) * 10;
        g.fillStyle = `rgba(255,${140 + i * 6},60,${0.32 * (1 - i / 10) * K.fire.level})`;
        g.fillRect(x - w, y, w * 2, 1.2);
      }
      for (const r of rings) {
        const u = r.age / 1.6;
        g.lineWidth = 0.9; g.strokeStyle = `rgba(255,170,100,${0.4 * (1 - u)})`;
        g.beginPath(); g.ellipse(r.x, r.y, 4 + u * 40, 1 + u * 5, 0, 0, TAU); g.stroke();
      }
      g.restore();
    },
  });

  // ------------------------------------------------------------------ barrow
  layer({
    id: 'barrow', z: 52.5, still: true,
    draw(g) {
      const x = 380, y = 1186;
      g.fillStyle = 'rgba(8,4,10,0.5)'; g.fill(ell(x + 10, y + 4, 70, 8));
      // handles back to the right, legs, the tray, the wheel at the front (left)
      Drawn.tube(g, Drawn.seg(x - 30, y - 30, x + 78, y - 52), K.litc(M.wood, x + 30, y - 40), 4, 1.4);
      Drawn.tube(g, Drawn.seg(x + 40, y - 34, x + 46, y), K.litc(M.woodDark, x + 40, y - 16), 3.5, 1.3);
      const tray = poly([[x - 46, y - 52], [x + 44, y - 62], [x + 36, y - 26], [x - 26, y - 20]]);
      g.fillStyle = K.litc(M.wood, x, y - 40, [0, 0, 1]); g.fill(tray);
      g.lineWidth = 0.8; g.strokeStyle = 'rgba(30,18,14,0.6)'; for (let k = 1; k < 4; k++) { g.beginPath(); g.moveTo(x - 44 + k * 4, y - 52 + k * 8); g.lineTo(x + 42 - k * 2, y - 61 + k * 9); g.stroke(); }
      g.lineWidth = 1.8; g.strokeStyle = K.inkAt(x, y, 0.5); g.stroke(tray);
      Drawn.lumps(g, [[x - 26, y - 58, 13], [x - 6, y - 64, 16], [x + 16, y - 64, 14], [x + 32, y - 62, 10], [x + 4, y - 72, 11]], { line: K.LINE, lw: 1.5, shade: K.litc(M.clayDark, x, y - 60), base: K.litc(M.clay, x, y - 62), lit: K.litc(M.clayPale, x - 10, y - 70) });
      // spade stuck in the load
      Drawn.tube(g, Drawn.seg(x + 6, y - 72, x - 8, y - 126), K.litc(M.woodPale, x, y - 100), 3, 1.3);
      g.fillStyle = K.litc(M.woodPale, x - 9, y - 128); g.fill(K.rrect(x - 17, y - 132, 16, 5, 2)); g.lineWidth = 1.2; g.strokeStyle = K.LINE; g.stroke(K.rrect(x - 17, y - 132, 16, 5, 2));
      const wx = x - 40, wy = y - 14;
      g.fillStyle = K.litc(M.woodDark, wx, wy); g.fill(ell(wx, wy, 6, 14)); g.lineWidth = 1.6; g.strokeStyle = K.LINE; g.stroke(ell(wx, wy, 6, 14));
      g.fillStyle = K.litc(M.iron, wx, wy); g.fill(ell(wx, wy, 1.6, 3));
    },
  });

  // ------------------------------------------------------------------ the lantern kite
  const kite = { x: 1290, y: 380, dip: K.spring({ k: 14, d: 3 }), loop: -1 };
  K.kiteHand = [1452, 612];
  layer({
    id: 'kite', z: 37,
    hit(x, y) { return Math.hypot(x - kite.x, y - kite.y) < 40; },
    onEnter() { kite.dip.v += 90; },
    update(dt, t, L) {
      const w = Drawn.wind(t, 1300);
      K.springTo(kite.dip, 0, dt);
      if (L.hovered && L.since > 1.4 && kite.loop < 0) kite.loop = 0;
      if (kite.loop >= 0) { kite.loop += dt / 2.2; if (kite.loop >= 1) kite.loop = -1; }
      const lp = kite.loop >= 0 ? K.smooth(kite.loop) * TAU : 0;
      kite.x = 1290 + w * 40 + noise(t * 0.3) * 30 + Math.sin(lp) * 40;
      kite.y = 380 - w * 20 + noise(t * 0.4 + 5) * 20 + kite.dip.x + (1 - Math.cos(lp)) * 40;
      kite.rot = -0.25 + noise(t * 0.7 + 2) * 0.15 + kite.dip.v * 0.003 + lp;
    },
    draw(g, t) {
      const [hx, hy] = K.kiteHand;
      // the string sags in a long curve
      g.lineWidth = 0.8; g.strokeStyle = 'rgba(200,170,130,0.55)';
      g.beginPath(); g.moveTo(hx, hy); g.quadraticCurveTo((hx + kite.x) / 2 + 30, (hy + kite.y) / 2 + 60, kite.x, kite.y + 14); g.stroke();
      // the tail: paper bows on a thread, trailing downwind
      const tail = []; for (let i = 0; i <= 7; i++) tail.push([kite.x - 4 + i * 9 + Math.sin(t * 3 + i * 0.8) * 4 * (i / 7), kite.y + 18 + i * 8 + Math.cos(t * 2.4 + i) * 3]);
      g.lineWidth = 0.7; g.strokeStyle = 'rgba(180,150,120,0.6)'; g.stroke(curve(tail, false));
      for (let i = 2; i <= 7; i += 2) { const [bx, by] = tail[i]; g.fillStyle = i % 4 ? '#a84438' : '#c8902e'; g.fill(poly([[bx - 4, by - 2], [bx, by], [bx - 4, by + 2]])); g.fill(poly([[bx + 4, by - 2], [bx, by], [bx + 4, by + 2]])); }
      g.save(); g.translate(kite.x, kite.y); g.rotate(kite.rot);
      const f = 0.85 + 0.15 * noise(t * 7);
      g.globalCompositeOperation = 'lighter';
      K.glow(g, 0, 0, 60, '#ff9a40', 0.25 * f);
      g.globalCompositeOperation = 'source-over';
      // paper lit from inside: brightest round the candle, the bamboo frame dark across it
      const body = poly([[0, -22], [16, 0], [0, 16], [-16, 0]]);
      g.fillStyle = radial(g, 0, 2, 2, 22, [[0, K.css(K.fireAt(0.86 * f))], [0.5, K.css(K.fireAt(0.66 * f))], [1, K.css(K.fireAt(0.46))]]); g.fill(body);
      g.lineWidth = 1.2; g.strokeStyle = 'rgba(60,24,10,0.85)';
      g.beginPath(); g.moveTo(0, -22); g.lineTo(0, 16); g.moveTo(-16, 0); g.lineTo(16, 0); g.stroke();
      g.fillStyle = 'rgba(120,40,20,0.35)'; g.fill(poly([[0, -22], [8, -11], [0, -2], [-8, -11]]));
      g.lineWidth = 1.6; g.strokeStyle = K.LINE; g.stroke(body);
      g.restore();
    },
  });

  // ------------------------------------------------------------------ ground door
  const GX = 1040, GY = 1400;
  layer({
    id: 'groundDoor', z: 60, still: true,
    draw(g) {
      // a grassy mound with a round hatch in its face, propped open
      const mound = curve([[GX - 150, GY + 34], [GX - 110, GY - 20], [GX - 40, GY - 50], [GX + 40, GY - 50], [GX + 110, GY - 22], [GX + 150, GY + 34]], false);
      mound.closePath();
      g.fillStyle = M.earth; g.fill(mound);
      g.save(); g.clip(mound);
      for (let i = 0; i < 40; i++) { const r = rng(i); g.fillStyle = 'rgba(70,90,50,0.4)'; g.fill(ell(GX - 140 + r() * 280, GY - 50 + r() * 80, 10 + r() * 14, 3)); }
      g.restore();
      K.applyLight(g, mound);
      g.lineWidth = 2.2; g.strokeStyle = K.LINE; g.stroke(mound);
      // the opening: steps going down into the light
      const hole = ell(GX, GY + 4, 46, 20);
      g.fillStyle = grad(g, 0, GY - 16, 0, GY + 24, [[0, '#3a1408'], [1, '#f0a040']]); g.fill(hole);
      g.save(); g.clip(hole);
      for (let k = 0; k < 4; k++) { g.fillStyle = `rgba(255,${200 - k * 20},${110 - k * 20},${0.4 + k * 0.1})`; g.fillRect(GX - 40, GY - 6 + k * 7, 80, 2.5); }
      g.restore();
      g.lineWidth = 2.4; g.strokeStyle = K.LINE; g.stroke(hole);
      // the hatch, swung up and back on its stick
      const hatch = ell(GX + 8, GY - 40, 46, 26, undefined, -0.12);
      g.fillStyle = K.litc(M.wood, GX, GY - 30, [0, 0.4, 0.9]); g.fill(hatch);
      g.lineWidth = 0.9; g.strokeStyle = 'rgba(30,18,14,0.6)'; for (const dx of [-24, -8, 8, 24]) { g.beginPath(); g.moveTo(GX + 8 + dx, GY - 62 + Math.abs(dx) * 0.3); g.lineTo(GX + 8 + dx, GY - 18 - Math.abs(dx) * 0.3); g.stroke(); }
      g.lineWidth = 2; g.strokeStyle = K.LINE; g.stroke(hatch);
      Drawn.tube(g, Drawn.seg(GX + 30, GY - 2, GX + 34, GY - 26), K.litc(M.woodPale, GX + 30, GY - 14), 2.4, 1.2);
      // a pair of boots by the door, a mat
      g.fillStyle = K.litc(M.clothRed, GX - 60, GY + 30); g.fill(K.rrect(GX - 80, GY + 26, 40, 9, 3)); g.lineWidth = 1.3; g.strokeStyle = K.LINE; g.stroke(K.rrect(GX - 80, GY + 26, 40, 9, 3));
      for (const bx of [GX + 64, GX + 82]) {
        const b = curve([[bx - 6, GY + 34], [bx - 6, GY + 12], [bx + 4, GY + 12], [bx + 5, GY + 26], [bx + 12, GY + 28], [bx + 12, GY + 34]]);
        g.fillStyle = K.litc('#3a4a3a', bx, GY + 24, [-0.6, 0, 0.8]); g.fill(b); g.lineWidth = 1.4; g.strokeStyle = K.LINE; g.stroke(b);
      }
    },
  });
  const blinkGD = Drawn.blinker(2, 4);
  layer({
    id: 'groundDoorLive', z: 61,
    hit: (x, y) => Math.hypot((x - GX) / 70, (y - GY) / 40) < 1,
    draw(g, t, L) {
      const f = 0.9 + 0.1 * noise(t * 2.6 + 4);
      g.globalCompositeOperation = 'lighter';
      K.glow(g, GX, GY - 10, 90, '#ffb050', 0.25 * f + L.hover * 0.1, 0.8);
      g.globalCompositeOperation = 'source-over';
      const h = K.smooth(L.hover);
      if (h > 0.03) {
        g.save(); g.clip(ell(GX, GY - 4, 46, 24 + 40));
        g.beginPath(); g.rect(GX - 50, GY - 80, 100, 84); g.clip();
        K.mole(g, GX - 4, GY + 10 + (1 - h) * 40, 0.9, { hands: { f: [14, -26], b: [-14, -26] }, open: blinkGD(t), look: [0.4, -0.8], smile: 1.4, lx: GX, ly: GY });
        g.restore();
      }
    },
  });
})();
