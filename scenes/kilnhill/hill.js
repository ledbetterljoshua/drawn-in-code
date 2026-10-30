/* hill.js — the ground of Kilnhill: the hill the moles dig their clay from.
   Painted in daylight albedo and then multiplied by the shared light map (Kiln.applyLight), so
   the earth is lit by exactly the same fires as everything standing on it.
   z 10  crest (still): the top of the hill, dark against the lit smoke; a crooked thorn tree
   z 16  ledge (still): the upper terrace's lip and the cut clay face below it, banded with the
         clays they dig (red, cream, grey, ochre), claw-scoop marks, roots, a ladder, a burrow
   z 18  burrowL (live): two eyes in the burrow blink. Hover: a mole pokes out its snout and sniffs
   z 24  terrace (still): the right terrace and its retaining wall of old saggars
   z 25  burrowR (live): a sleepy mole in the wall's burrow. Hover: it yawns and pulls in its head
   z 28  yard (still): the brick-paved kiln yard, ash and coal, the bank and the steps down
   z 50  front (still): the near ground, the path up to the kiln, stones, grass, roots
   z 51  burrowF (live): the front burrow. Hover: a whole family of noses appears, one by one */
(function () {
  const { TAU, clamp, lerp, rng, noise, circ, ell, rect, poly, curve, grad, radial, st, P, layer } = Drawn;
  const K = window.Kiln, M = K.M;
  const view = () => st.view;

  // ------------------------------------------------------------------ shapes
  const crestTop = [[-760, 300], [-520, 284], [-300, 292], [-100, 306], [60, 330], [190, 372], [310, 438], [420, 520], [540, 610], [660, 700], [780, 776], [880, 826], [1000, 850], [1160, 856], [1300, 838], [1380, 806], [1450, 778], [1540, 770], [1620, 786], [1720, 826], [1880, 848], [2100, 856], [2360, 862]];
  const crestPath = () => { const v = view(); return curve([[crestTop[0][0], v.y1 + 50], ...crestTop, [2360, v.y1 + 50]], false); };
  // the upper terrace lip and the clay face below it
  const lip = [[-760, 586], [-520, 580], [-260, 588], [-40, 594], [150, 600], [300, 608], [372, 622], [404, 660], [418, 730], [440, 800], [462, 862]];
  const facePath = () => curve([...lip, [300, 872], [0, 880], [-760, 882]], true);
  const yardBack = 858;
  // the kiln yard: a shallow plane seen just from above; front lip, then the bank down
  const yardPath = curve([[250, 864], [420, 852], [600, 850], [790, 858], [930, 880], [960, 910], [900, 936], [760, 944], [560, 946], [380, 940], [250, 930], [150, 916], [140, 880]], true);
  const bankPath = curve([[-760, 896], [140, 900], [260, 934], [420, 948], [600, 952], [800, 948], [960, 926], [1100, 960], [1400, 990], [2360, 990], [2360, 1060], [-760, 1060]], true);
  const terracePath = curve([[880, 870], [1000, 852], [1200, 858], [1320, 840], [1420, 800], [1540, 784], [1640, 812], [1760, 846], [2360, 860], [2360, 910], [1600, 912], [1200, 906], [960, 912]], true);
  const wallTop = 906, wallBot = 1000;
  const frontEdge = [[-760, 1010], [-400, 1004], [0, 1000], [300, 1006], [520, 1012], [700, 1004], [900, 1012], [1200, 1004], [1500, 1010], [1900, 1004], [2360, 1008]];
  const frontPath = () => { const v = view(); return curve([...frontEdge, [2360, v.y1 + 50], [-760, v.y1 + 50]], true); };

  K.ground = { crestTop, lip, yardBack, wallTop, wallBot, frontEdge };

  // ------------------------------------------------------------------ painting helpers
  // grass tufts along an edge: blades lean with the (still) wind, coloured in albedo
  function tufts(g, pts, seed, o = {}) {
    const r = rng(seed), n = o.n || 3, h = o.h || 14;
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1], len = Math.hypot(x1 - x0, y1 - y0);
      const cnt = Math.round(len / 40 * n);
      for (let k = 0; k < cnt; k++) {
        const u = r(), x = lerp(x0, x1, u), y = lerp(y0, y1, u) + 2;
        const hh = h * (0.5 + r()), blades = 3 + (r() * 4 | 0);
        for (let b = 0; b < blades; b++) {
          const lean = (r() - 0.35) * 0.9, bx = x + (b - blades / 2) * 2.2;
          g.beginPath(); g.moveTo(bx - 1.4, y);
          g.quadraticCurveTo(bx + lean * hh * 0.3, y - hh * 0.6, bx + lean * hh, y - hh * (0.8 + r() * 0.4));
          g.quadraticCurveTo(bx + lean * hh * 0.3 + 1.2, y - hh * 0.5, bx + 1.4, y);
          g.fillStyle = r() < 0.3 ? M.grassDry : M.grass; g.fill();
        }
      }
    }
  }
  function stones(g, region, box, n, seed, col = M.stone, size = 6) {
    const r = rng(seed);
    g.save(); g.clip(region);
    for (let i = 0; i < n; i++) {
      const x = box[0] + r() * box[2], y = box[1] + r() * box[3], s = size * (0.4 + r());
      const pts = []; for (let k = 0; k < 7; k++) { const a = k / 7 * TAU; pts.push([x + Math.cos(a) * s * (0.7 + r() * 0.5), y + Math.sin(a) * s * 0.6 * (0.7 + r() * 0.5)]); }
      const p = curve(pts);
      g.fillStyle = K.css(K.mix(col, '#ffffff', r() * 0.2)); g.fill(p);
      g.fillStyle = 'rgba(30,20,30,0.35)'; g.fill(ell(x + s * 0.15, y + s * 0.25, s * 0.8, s * 0.28));
      g.lineWidth = 1; g.strokeStyle = 'rgba(30,18,24,0.7)'; g.stroke(p);
    }
    g.restore();
  }
  // clay strata across a face: lens-shaped beds that thicken, thin and pinch out, each its own
  // clay, with a shadowed crevice under each bed's lip and the odd vertical fissure
  function strata(g, region, y0, y1, seed, bands) {
    const r = rng(seed);
    g.save(); g.clip(region);
    let y = y0, i = 0;
    while (y < y1) {
      const th = 12 + r() * 22, col = bands[i++ % bands.length], ph = r() * 50;
      const top = [], bot = [];
      for (let x = -800; x <= 2400; x += 40) top.push([x, y + noise(x * 0.004 + ph) * 7 + (x - 200) * 0.012]);
      for (let k = top.length - 1; k >= 0; k--) {
        const [x, yy] = top[k];
        const lens = 0.25 + 1.1 * Math.max(0, noise(x * 0.0035 + ph + 9) + 0.35);
        bot.push([x, yy + th * lens]);
      }
      const p = curve([...top, ...bot]);
      g.fillStyle = col; g.fill(p);
      // a little darker toward each bed's base, lighter along its lip
      g.save(); g.clip(p);
      g.fillStyle = grad(g, 0, y, 0, y + th * 1.2, [[0, 'rgba(255,240,220,0.12)'], [0.5, 'rgba(0,0,0,0)'], [1, 'rgba(30,14,20,0.25)']]); g.fillRect(-800, y - 20, 3200, th * 1.6 + 40);
      g.restore();
      g.beginPath(); top.forEach(([x, yy], k) => (k ? g.lineTo(x, yy) : g.moveTo(x, yy)));
      g.lineWidth = 2.2; g.strokeStyle = 'rgba(30,16,22,0.35)'; g.stroke();
      y += th * 0.85;
    }
    for (let k = 0; k < 9; k++) {
      const x = -700 + r() * 1100, yy = y0 + r() * (y1 - y0 - 60);
      g.beginPath(); g.moveTo(x, yy); g.lineTo(x + (r() - 0.5) * 8, yy + 14 + r() * 10); g.lineTo(x + (r() - 0.5) * 10, yy + 30 + r() * 20);
      g.lineWidth = 1.3; g.strokeStyle = 'rgba(30,16,22,0.5)'; g.stroke();
    }
    g.restore();
  }
  // curved scoop marks where mole hands dug the clay out: claw grooves in sets of four
  function scoops(g, region, pts, seed) {
    const r = rng(seed);
    g.save(); g.clip(region);
    for (const [x, y, s = 1] of pts) {
      const a = (r() - 0.5) * 0.6;
      g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s);
      g.fillStyle = 'rgba(40,22,26,0.28)'; g.fill(ell(0, 0, 24, 13));
      g.fillStyle = 'rgba(255,230,200,0.12)'; g.fill(ell(0, -4, 22, 6));
      for (let k = 0; k < 4; k++) {
        g.beginPath(); g.moveTo(-18 + k * 3, -6 + k * 4); g.quadraticCurveTo(0, 4 + k * 3, 18 - k * 2, -6 + k * 4);
        g.lineWidth = 1.4; g.strokeStyle = 'rgba(40,22,26,0.55)'; g.stroke();
        g.beginPath(); g.moveTo(-17 + k * 3, -7.5 + k * 4); g.quadraticCurveTo(0, 2.5 + k * 3, 17 - k * 2, -7.5 + k * 4);
        g.lineWidth = 0.8; g.strokeStyle = 'rgba(255,220,190,0.25)'; g.stroke();
      }
      g.restore();
    }
    g.restore();
  }
  function roots(g, x, y, len, seed, lw = 2) {
    const r = rng(seed);
    const pts = [[x, y]];
    let cx = x, cy = y;
    for (let i = 0; i < 5; i++) { cx += (r() - 0.5) * 10; cy += len / 5; pts.push([cx, cy]); }
    g.lineWidth = lw; g.strokeStyle = '#4a3428'; g.stroke(curve(pts, false));
    if (r() < 0.7) { const k = 2 + (r() * 2 | 0); g.lineWidth = lw * 0.5; g.stroke(curve([pts[k], [pts[k][0] + 8, pts[k][1] + 8], [pts[k][0] + 10, pts[k][1] + 18]], false)); }
  }
  // a dark round burrow mouth with a worn lip and the glow of a fire deep inside
  function burrowMouth(g, x, y, rx, ry, seed) {
    const r = rng(seed);
    const lipP = ell(x, y + 2, rx * 1.25, ry * 1.2);
    g.fillStyle = M.clayDark; g.fill(lipP);
    g.lineWidth = 1.5; g.strokeStyle = 'rgba(30,16,22,0.7)'; g.stroke(lipP);
    const hole = ell(x, y, rx, ry);
    g.fillStyle = grad(g, 0, y - ry, 0, y + ry, [[0, '#1a0c08'], [0.6, '#5a200c'], [1, '#c4561a']]);
    g.fill(hole);
    g.save(); g.clip(hole);
    g.fillStyle = 'rgba(255,170,80,0.5)'; g.fill(ell(x + rx * 0.1, y + ry * 0.55, rx * 0.6, ry * 0.4));
    g.restore();
    g.lineWidth = 2.2; g.strokeStyle = K.LINE; g.stroke(hole);
    // trodden clods at the threshold
    for (let i = 0; i < 6; i++) { g.fillStyle = M.clay; g.fill(ell(x + (r() - 0.5) * rx * 2.4, y + ry * 1.25 + r() * 5, 3 + r() * 3, 2 + r() * 1.5)); }
  }
  // a thorn tree on the crest: twisted trunk and spiky clumps, drawn as a near-silhouette
  function thornTree(g, x, y, s, seed) {
    const r = rng(seed);
    g.save(); g.translate(x, y); g.scale(s, s);
    const trunk = curve([[-8, 0], [-6, -40], [-14, -80], [-4, -120], [4, -118], [-2, -82], [8, -44], [10, 0]]);
    g.fillStyle = '#141014'; g.fill(trunk); g.lineWidth = 2; g.strokeStyle = K.LINE; g.stroke(trunk);
    const limbs = [[-8, -90, -60, -130], [-4, -110, 30, -160], [2, -60, 50, -100], [-6, -70, -50, -90]];
    for (const [ax, ay, bx, by] of limbs) {
      const p = Drawn.quad(ax, ay, (ax + bx) / 2 + (r() - 0.5) * 20, (ay + by) / 2 - 10, bx, by);
      g.lineWidth = 7; g.strokeStyle = K.LINE; g.stroke(p); g.lineWidth = 4.5; g.strokeStyle = '#141014'; g.stroke(p);
      const cl = []; for (let i = 0; i < 6; i++) cl.push([bx + (r() - 0.5) * 50, by + (r() - 0.6) * 26, 10 + r() * 12]);
      Drawn.lumps(g, cl, { line: K.LINE, lw: 1.6, shade: '#0e0e10', base: '#141418', lit: '#1c1a1e' });
    }
    g.restore();
  }

  // ------------------------------------------------------------------ crest
  layer({
    id: 'crest', z: 10, still: true,
    draw(g) {
      const p = crestPath();
      g.fillStyle = M.earthDark; g.fill(p);
      g.save(); g.clip(p);
      // the slope's turf, a little lighter where it's flatter
      g.fillStyle = grad(g, 0, 280, 0, 900, [[0, '#4a4a34'], [0.5, '#4a3c30'], [1, M.earthDark]]); g.fill(p);
      const r = rng(9);
      for (let i = 0; i < 260; i++) {
        const x = -700 + r() * 3000, y = 300 + r() * 600;
        g.fillStyle = r() < 0.5 ? 'rgba(90,100,60,0.35)' : 'rgba(40,30,30,0.3)';
        g.fill(ell(x, y, 10 + r() * 30, 3 + r() * 5));
      }
      // a footpath worn across the slope
      g.lineWidth = 9; g.strokeStyle = 'rgba(150,120,90,0.5)';
      g.stroke(curve([[-400, 460], [-200, 430], [0, 420], [140, 440]], false));
      g.restore();
      tufts(g, crestTop.slice(0, 9), 3, { n: 4, h: 16 });
      tufts(g, crestTop.slice(12), 5, { n: 3, h: 12 });
      thornTree(g, -150, 312, 1.05, 4);
      thornTree(g, 1500, 776, 0.55, 8);
      K.applyLight(g, p);
      // the silhouette line against the smoke
      g.lineWidth = 2.4; g.strokeStyle = K.LINE; g.stroke(curve(crestTop, false));
    },
  });

  // ------------------------------------------------------------------ ledge face
  layer({
    id: 'ledge', z: 16, still: true,
    draw(g) {
      const f = facePath();
      g.fillStyle = M.clay; g.fill(f);
      strata(g, f, 596, 900, 21, ['#a8644c', '#c4a888', '#94827c', '#b48a52', '#8e5646', '#c2ae92', '#7e7074', '#a86c50']);
      // the face leans back toward the top: shadow under the lip, lit lower down
      g.save(); g.clip(f);
      g.fillStyle = grad(g, 0, 590, 0, 660, [[0, 'rgba(20,10,20,0.55)'], [1, 'rgba(20,10,20,0)']]); g.fillRect(-800, 580, 1300, 90);
      g.restore();
      scoops(g, f, [[-60, 700, 1], [20, 760, 0.9], [210, 680, 1.1], [300, 760, 0.8], [-220, 690, 0.9], [-300, 790, 1], [170, 820, 0.8], [360, 700, 0.7]], 5);
      stones(g, f, [-700, 620, 1150, 240], 26, 7, M.stone, 5);
      burrowMouth(g, 96, 646, 26, 20, 3);
      // roots hanging off the lip
      const r = rng(17);
      for (let i = 0; i < 16; i++) { const x = -640 + r() * 1020; roots(g, x, 592 + (x > 300 ? (x - 300) * 0.2 : 0), 16 + r() * 34, i * 7, 1.2 + r()); }
      // the ladder from the yard up to the terrace
      ladder(g, 352, 866, 330, 600, 4);
      K.applyLight(g, f);
      // lip: grass hanging over the edge, ink along the top
      tufts(g, lip.slice(0, 7), 11, { n: 5, h: 13 });
      g.lineWidth = 2.6; g.strokeStyle = K.LINE; g.stroke(curve(lip, false));
      const rr = rng(4);
      for (let x = -700; x < 360; x += 18 + rr() * 30) {
        const y = 590 + (x > 150 ? (x - 150) * 0.05 : 0);
        g.fillStyle = '#2a3020'; g.beginPath(); g.moveTo(x - 6, y - 2); g.quadraticCurveTo(x, y + 6 + rr() * 8, x + 6, y - 2); g.fill();
      }
    },
  });
  // a wooden ladder leaning from (x0, y0) at the bottom to (x1, y1) at the top
  function ladder(g, x0, y0, x1, y1, seed) {
    const r = rng(seed), w = 22;
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L * w / 2, ny = dx / L * w / 2;
    const rungs = Math.round(L / 26);
    for (let i = 1; i < rungs; i++) {
      const u = i / rungs, x = x0 + dx * u, y = y0 + dy * u;
      const p = Drawn.seg(x - nx, y - ny + (r() - 0.5) * 2, x + nx, y + ny + (r() - 0.5) * 2);
      Drawn.tube(g, p, M.woodPale, 3, 1.2);
    }
    for (const s of [-1, 1]) Drawn.tube(g, Drawn.seg(x0 + nx * s, y0 + ny * s, x1 + nx * s * 0.9, y1 - 10 + ny * s * 0.9), M.wood, 4, 1.4);
  }
  K.ladder = ladder;

  // two eyes blinking in the upper burrow; hover and a snout comes out sniffing
  const blinkL = Drawn.blinker(2, 5);
  layer({
    id: 'burrowL', z: 18,
    hit: (x, y) => Math.hypot((x - 96) / 40, (y - 646) / 32) < 1,
    draw(g, t, L) {
      const o = blinkL(t), h = K.smooth(L.hover), sniff = L.since > 0.4 ? Math.sin(t * 22) * 1.2 : 0;
      g.save(); g.beginPath(); g.ellipse(96, 646, 25, 19, 0, 0, TAU); g.clip();
      const y = 650 - h * 8;
      g.fillStyle = '#2a2230'; g.fill(ell(96, y + 10, 18, 14));
      if (o > 0.2) for (const ex of [-6, 6]) { g.fillStyle = '#ffd890'; g.fill(ell(96 + ex, y + 2, 1.8, 1.6 * o)); }
      if (h > 0.05) {
        g.fillStyle = K.M.skin; g.fill(ell(96 + sniff * 0.4, y + 8, 5 * h, 4 * h));
        g.fillStyle = '#d06a6a'; g.fill(circ(96 + sniff * 0.4, y + 9.5, 2 * h));
      }
      g.restore();
    },
  });

  // ------------------------------------------------------------------ terrace + saggar wall
  const wallPath = poly([[930, wallTop - 4], [2360, wallTop], [2360, wallBot], [960, wallBot + 4], [940, 960]]);
  layer({
    id: 'terrace', z: 24, still: true,
    draw(g) {
      const tp = terracePath;
      g.fillStyle = M.earth; g.fill(tp);
      stones(g, tp, [900, 840, 1500, 70], 30, 31, M.clayPale, 4);
      g.save(); g.clip(tp);
      g.lineWidth = 12; g.strokeStyle = 'rgba(200,170,130,0.5)';
      g.stroke(curve([[960, 900], [1100, 884], [1260, 882], [1400, 870]], false));
      g.restore();
      tufts(g, [[1300, 842], [1420, 802], [1540, 786], [1640, 812], [1760, 846], [2000, 856]], 33, { n: 4, h: 11 });
      K.applyLight(g, tp);
      // the wall of saggars: fireclay boxes the pots are fired in, too cracked to use again
      g.fillStyle = '#3a2a26'; g.fill(wallPath);
      const r = rng(41);
      let y = wallTop, row = 0;
      while (y < wallBot) {
        const h = 20 + r() * 8;
        let x = 940 + (row % 2) * 22 - 30;
        while (x < 2360) {
          const w = 34 + r() * 22;
          // the courses sag a little between the terrace's buried posts
          const sag = Math.sin((x - 940) / 220 * Math.PI) * 3 + (r() - 0.5) * 2;
          if (r() < 0.12) roundSaggar(g, x + w / 2, y + sag + h / 2, Math.min(w, h) * 0.52, r);
          else saggar(g, x, y + sag, w, h, r);
          x += w + 1 + r() * 2;
        }
        y += h; row++;
      }
      // ferns and grass rooted in the cracks
      for (let i = 0; i < 14; i++) { const x = 980 + r() * 1300, yy = wallTop + 10 + r() * 80; fern(g, x, yy, 0.6 + r() * 0.5, r() < 0.5 ? -1 : 1); }
      burrowMouth(g, 1210, 954, 22, 17, 9);
      K.applyLight(g, wallPath);
      g.lineWidth = 2.4; g.strokeStyle = K.LINE; g.stroke(curve([[880, 870], [1000, 852], [1200, 858], [1320, 840], [1420, 800], [1540, 784], [1640, 812], [1760, 846], [2360, 860]], false));
      g.stroke(Drawn.seg(930, wallTop - 4, 2360, wallTop));
    },
  });
  function roundSaggar(g, x, y, R, r) {
    g.fillStyle = K.css(K.mix(M.slip, '#8a7060', r() * 0.6)); g.fill(circ(x, y, R));
    g.fillStyle = '#241816'; g.fill(circ(x + 1, y + 1, R * 0.7));
    g.lineWidth = 1.4; g.strokeStyle = 'rgba(30,16,20,0.85)'; g.stroke(circ(x, y, R)); g.stroke(circ(x + 1, y + 1, R * 0.7));
  }
  function saggar(g, x, y, w, h, r) {
    const broken = r() < 0.12;
    const p = K.rrect(x, y, w, h, 6);
    const col = K.mix(K.mix(M.slip, '#7a6458', 0.35), r() < 0.3 ? '#c08068' : '#b8a890', r() * 0.6);
    g.fillStyle = K.css(col); g.fill(p);
    // a fire-blush and the darker rim band where the lid sat
    if (r() < 0.4) { g.fillStyle = 'rgba(180,80,50,0.3)'; g.fill(ell(x + w * r(), y + h * 0.6, w * 0.4, h * 0.4)); }
    g.fillStyle = 'rgba(60,40,40,0.25)'; g.fillRect(x + 2, y + 3, w - 4, 3);
    g.fillStyle = 'rgba(30,20,24,0.35)'; g.fillRect(x + 2, y + h - 5, w - 4, 4);
    if (broken) {
      g.fillStyle = '#1c1214';
      g.fill(poly([[x + w * 0.3, y + h], [x + w * 0.4, y + h * 0.3], [x + w * 0.6, y + h * 0.5], [x + w * 0.75, y + h]]));
    } else if (r() < 0.3) {
      g.beginPath(); g.moveTo(x + w * r(), y); g.lineTo(x + w * 0.5, y + h * 0.5); g.lineTo(x + w * r(), y + h);
      g.lineWidth = 0.9; g.strokeStyle = 'rgba(40,24,28,0.6)'; g.stroke();
    }
    g.lineWidth = 1.4; g.strokeStyle = 'rgba(30,16,20,0.85)'; g.stroke(p);
  }
  function fern(g, x, y, s, dir) {
    g.save(); g.translate(x, y); g.scale(s * dir, s);
    for (let i = 0; i < 4; i++) {
      const a = -0.9 - i * 0.3, len = 18 + i * 3;
      g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(Math.cos(a) * len * 0.6, Math.sin(a) * len * 0.9, Math.cos(a + 0.3) * len, Math.sin(a + 0.3) * len);
      g.lineWidth = 1.6; g.strokeStyle = '#3a5a30'; g.stroke();
      for (let k = 1; k < 5; k++) { const u = k / 5, px = Math.cos(a) * len * u * 0.8, py = Math.sin(a) * len * u; g.fillStyle = '#4a6a38'; g.fill(ell(px + 2, py - 1, 3, 1.4, undefined, a + 1)); }
    }
    g.restore();
  }

  // a sleepy mole in the wall's burrow: yawns on hover and draws its head in
  const blinkR = Drawn.blinker(3, 6);
  layer({
    id: 'burrowR', z: 25,
    hit: (x, y) => Math.hypot((x - 1210) / 36, (y - 954) / 28) < 1,
    draw(g, t, L) {
      const h = L.hover, yawn = L.since > 0.25 ? K.bell(Math.min(1, (L.since - 0.25) / 1.6)) : 0;
      const tuck = L.since > 1.8 ? K.smooth((L.since - 1.8) / 0.8) : 0;
      g.save(); g.beginPath(); g.ellipse(1210, 954, 21, 16, 0, 0, TAU); g.clip();
      const y = 956 + tuck * 16 + Math.sin(t * 1.2) * 0.8;
      g.fillStyle = '#3a3240'; g.fill(ell(1210, y + 6, 15, 11));
      g.fillStyle = 'rgba(255,150,80,0.35)'; g.fill(ell(1210, y + 12, 12, 5));
      const o = h > 0.1 ? 1 - yawn : blinkR(t) * 0.4;
      for (const ex of [-5, 5]) {
        if (o > 0.25) { g.fillStyle = '#ffd890'; g.fill(ell(1210 + ex, y + 1, 1.5, 1.3 * o)); }
        else { g.lineWidth = 1; g.strokeStyle = '#120a10'; g.stroke(Drawn.seg(1210 + ex - 2, y + 1, 1210 + ex + 2, y + 1)); }
      }
      g.fillStyle = K.M.skin; g.fill(ell(1210, y + 6, 4, 3));
      if (yawn > 0.05) { g.fillStyle = '#6a1a24'; g.fill(ell(1210, y + 10, 3 * yawn, 3.5 * yawn)); }
      g.restore();
    },
  });

  // ------------------------------------------------------------------ yard
  layer({
    id: 'yard', z: 28, still: true,
    draw(g) {
      g.fillStyle = M.earth; g.fill(bankPath);
      g.save(); g.clip(bankPath);
      const r = rng(51);
      for (let i = 0; i < 120; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,80,60,0.4)' : 'rgba(40,24,24,0.3)'; g.fill(ell(-700 + r() * 3000, 900 + r() * 150, 6 + r() * 20, 2 + r() * 4)); }
      g.restore();
      tufts(g, [[-760, 896], [140, 900]], 52, { n: 4, h: 12 });
      // the yard: brick paving laid in rows, foreshortened (rows nearer the viewer are deeper)
      g.fillStyle = '#6a4434'; g.fill(yardPath);
      g.save(); g.clip(yardPath);
      let y = 850, row = 0;
      while (y < 950) {
        const depth = 4 + (y - 850) * 0.07;
        let x = 120 + (row % 2) * 12;
        while (x < 980) {
          const w = 22 + r() * 4;
          const c = K.mix(r() < 0.5 ? M.brick : M.brick2, '#2a1a18', r() * 0.35);
          g.fillStyle = K.css(c); g.fillRect(x + 0.8, y + 0.6, w - 1.6, depth - 1.2);
          if (r() < 0.1) { g.fillStyle = 'rgba(30,20,20,0.5)'; g.fillRect(x + w * 0.3, y + 1, w * 0.3, depth * 0.6); }
          x += w;
        }
        y += depth; row++;
      }
      // ash and coal raked around the firemouths
      for (let i = 0; i < 90; i++) {
        const a = r() * Math.PI, d = 90 + r() * 140, x = 560 + Math.cos(a) * d * 1.6, yy = 866 + Math.sin(a) * d * 0.28;
        g.fillStyle = r() < 0.6 ? 'rgba(200,190,180,0.45)' : '#1a1214'; g.fill(ell(x, yy, 2 + r() * 5, 1 + r() * 2));
      }
      g.fillStyle = 'rgba(180,170,160,0.3)'; g.fill(ell(560, 880, 140, 18));
      g.restore();
      // brick steps cut down the bank to the near ground (seen from above: treads, then risers)
      const steps = [[648, 944, 82], [640, 962, 88], [630, 982, 96], [618, 1004, 104]];
      for (const [cx, sy, w] of steps) {
        const tread = poly([[cx - w / 2, sy], [cx + w / 2, sy], [cx + w / 2 + 3, sy + 8], [cx - w / 2 - 3, sy + 8]]);
        g.fillStyle = K.css(K.mix(M.brick3, '#8a7a70', 0.3)); g.fill(tread);
        g.fillStyle = M.brick2; g.fillRect(cx - w / 2 - 3, sy + 8, w + 6, 10);
        g.lineWidth = 1.4; g.strokeStyle = 'rgba(30,16,20,0.85)'; g.stroke(tread); g.strokeRect(cx - w / 2 - 3, sy + 8, w + 6, 10);
      }
      // the yard's edge breaks up into soil: a ragged dark lip and bricks kicked loose
      const rr = rng(53);
      for (let i = 0; i < 70; i++) {
        const a = rr() * TAU, x = 555 + Math.cos(a) * 412 * (0.96 + rr() * 0.08), y = 898 + Math.sin(a) * 48 * (0.96 + rr() * 0.1);
        if (Math.sin(a) < -0.2) continue;
        g.fillStyle = rr() < 0.5 ? M.earth : M.earthDark; g.fill(ell(x, y, 8 + rr() * 14, 3 + rr() * 3));
      }
      for (let i = 0; i < 9; i++) { const x = 180 + rr() * 760, y = 936 + rr() * 30; const p = poly([[x, y], [x + 12, y - 1], [x + 13, y + 4], [x + 1, y + 5]]); g.fillStyle = M.brick2; g.fill(p); g.lineWidth = 1; g.strokeStyle = 'rgba(30,16,20,0.8)'; g.stroke(p); }
      K.applyLight(g, bankPath);
      K.applyLight(g, yardPath);
      g.lineWidth = 1.2; g.strokeStyle = 'rgba(20,10,14,0.5)'; g.stroke(yardPath);
    },
  });

  // ------------------------------------------------------------------ the near ground
  layer({
    id: 'front', z: 50, still: true,
    draw(g) {
      const p = frontPath(), v = view();
      g.fillStyle = M.earth; g.fill(p);
      g.save(); g.clip(p);
      g.fillStyle = grad(g, 0, 1000, 0, v.y1, [[0, M.earth], [0.4, M.earthDark], [1, '#22181a']]); g.fill(p);
      const r = rng(61);
      for (let i = 0; i < 220; i++) {
        const y = 1010 + Math.pow(r(), 1.4) * (v.y1 - 1000), s = 1 + (y - 1000) / 300;
        g.fillStyle = r() < 0.5 ? 'rgba(130,90,64,0.35)' : 'rgba(30,20,20,0.35)';
        g.fill(ell(-700 + r() * 3000, y, (8 + r() * 26) * s, (2 + r() * 4) * s));
      }
      // the path: packed clay, worn pale, widening toward us
      const path = curve([[600, 1012], [640, 1012], [700, 1060], [760, 1130], [800, 1220], [860, 1400], [940, v.y1 + 40], [600, v.y1 + 40], [600, 1400], [620, 1220], [600, 1130], [590, 1060]], true);
      g.fillStyle = '#9a8270'; g.fill(path);
      g.save(); g.clip(path);
      for (let i = 0; i < 80; i++) { const y = 1010 + r() * (v.y1 - 1000); g.fillStyle = r() < 0.5 ? 'rgba(255,240,220,0.25)' : 'rgba(90,60,50,0.3)'; g.fill(ell(560 + r() * 400, y, 4 + r() * 10, 1.5 + r() * 2)); }
      // broken brick and sherds pressed into it
      for (let i = 0; i < 26; i++) { const y = 1020 + r() * 500, x = 610 + (y - 1000) * 0.18 + r() * 120; g.fillStyle = r() < 0.5 ? M.brick2 : M.terracotta; g.fill(poly([[x, y], [x + 7, y - 2], [x + 9, y + 3], [x + 2, y + 4]])); }
      g.restore();
      // footprints: mole feet, five toes, going both ways
      for (let i = 0; i < 22; i++) {
        const y = 1030 + i * 26 + r() * 8, side = i % 2 ? 1 : -1, x = 640 + (y - 1000) * 0.22 + side * 12 + r() * 4, s = 1 + (y - 1000) / 500;
        g.fillStyle = 'rgba(60,40,36,0.35)'; g.fill(ell(x, y, 3.2 * s, 1.6 * s));
        for (let k = 0; k < 4; k++) g.fill(ell(x - 3 * s + k * 2 * s, y - 2.6 * s, 0.8 * s, 0.6 * s));
      }
      g.restore();
      // grass creeping over the path's edges so it isn't a hard strip
      tufts(g, [[596, 1060], [604, 1140], [622, 1240], [604, 1420], [610, 1700]], 66, { n: 7, h: 10 });
      tufts(g, [[690, 1050], [760, 1140], [810, 1240], [866, 1420], [930, 1700]], 67, { n: 7, h: 10 });
      stones(g, p, [-700, 1030, 3000, Math.max(200, v.y1 - 1030)], 26, 63, M.stone, 10);
      burrowMouth(g, 140, 1196, 32, 22, 12);
      tufts(g, frontEdge, 64, { n: 3, h: 14 });
      // tall grass in the very front, mostly beyond the artboard's bottom on a phone
      const rr = rng(65);
      const clumps = [];
      for (let i = 0; i < 40; i++) clumps.push([[-700 + rr() * 3000, 1180 + rr() * Math.max(80, v.y1 - 1180)]]);
      for (const [[x, y]] of clumps) { if (x > 560 && x < 980) continue; tufts(g, [[x - 30, y], [x + 30, y]], x | 0, { n: 6, h: 20 + (y - 1100) * 0.05 }); }
      K.applyLight(g, p);
      g.lineWidth = 2.4; g.strokeStyle = K.LINE; g.stroke(curve(frontEdge, false));
    },
  });

  // the front burrow: hover and noses appear one by one, oldest first
  const fam = [[-14, 1, 1], [8, 2, 0.8], [20, -1, 0.6], [-2, -3, 0.55]];
  const blinkF = fam.map(() => Drawn.blinker(2.5, 5));
  layer({
    id: 'burrowF', z: 51,
    hit: (x, y) => Math.hypot((x - 140) / 48, (y - 1196) / 34) < 1,
    draw(g, t, L) {
      g.save(); g.beginPath(); g.ellipse(140, 1196, 31, 21, 0, 0, TAU); g.clip();
      fam.forEach(([dx, dy, s], i) => {
        const on = K.smooth((L.since - i * 0.35) / 0.4) * (L.hovered ? 1 : L.hover);
        if (on < 0.02 && i > 0) return;
        const y = 1204 + dy + (1 - on) * 16 * s - (i === 0 ? 2 : 0);
        const x = 140 + dx;
        g.fillStyle = '#3a3240'; g.fill(ell(x, y + 6 * s, 12 * s, 10 * s));
        const o = blinkF[i](t);
        for (const ex of [-4, 4]) if (o > 0.25) { g.fillStyle = '#ffe0a0'; g.fill(ell(x + ex * s, y, 1.4 * s + 0.3, 1.3 * s * o + 0.2)); }
        g.fillStyle = K.M.skin; g.fill(ell(x + Math.sin(t * 9 + i) * 0.6, y + 5 * s, 4 * s, 3 * s));
      });
      g.restore();
    },
  });
})();
