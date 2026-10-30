/* houses.js — the village under the Great Leaf, dry while the storm drums overhead. Seen from the
   waterline, so we look up into their undersides:
     · the Cap House, a parasol mushroom: snakeskin stalk with a door in its bulb and a porthole,
       a collar, and the gills of its cap fanning overhead; beads of water hang from the cap's rim;
     · the Pod House, a dry poppy head on its stalk: ribbed urn, scalloped lid, a ring of pores
       under the lid for windows, a door with a petal awning;
     · the Nut House, a hazelnut on its side under the frill of its own husk, with someone asleep
       in the round hole;
     · a thread strung between them with caught drops hung on it like lanterns.

   Hover the Cap House: the cap shudders and flings its beads, the door opens and a child holds
   out an acorn cup to catch a drip. Hover the Pod House: it rattles and seeds sprinkle out of the
   pores (that's how poppies sow), and a face looks out of a pore. Hover the Nut House: the
   sleeper wakes, yawns at the weather and curls up again. Hover the lantern thread: it bounces and
   the drops swing.

   houses z10.5 (still) · cap-life z11.4 · pod-life z11.5 · nut-life z11.6 · lanterns z11.8 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, ink, st, P, layer, onLayout } = Drawn;
  const { C, SUN, LINE } = DH;

  // ------------------------------------------------------------ geometry
  // each house is drawn in its own design space (x, base…) and placed on the ridge at scale K
  const K = 1.35;
  const CAP = { x: 1200, base: 594, top: 470, rx: 80, ry: 21, dome: 50 };
  const POD = { x: 1372, base: 568, y0: 540, y1: 458, w: 34 };
  const NUT = { x: 1546, base: 606, r: 31 };
  for (const h of [CAP, POD, NUT]) {
    h.real = DH.ridgeY(h.x) + 3;
    h.fwd = (px, py) => [h.x + (px - h.x) * K, h.real + (py - h.base) * K];
    h.inv = (x, y) => [h.x + (x - h.x) / K, h.base + (y - h.real) / K];
    h.on = (g) => { g.translate(h.x, h.real); g.scale(K, K); g.translate(-h.x, -h.base); };
  }
  DH.CAP = CAP; DH.POD = POD; DH.NUT = NUT;

  // ------------------------------------------------------------ the Cap House
  function capStalk(g) {
    const { x, base, top } = CAP;
    const p = new Path2D();
    p.moveTo(x - 21, base); p.bezierCurveTo(x - 25, base - 18, x - 12, base - 40, x - 11, base - 60);
    p.lineTo(x - 9, top + 4); p.lineTo(x + 9, top + 4); p.lineTo(x + 11, base - 60);
    p.bezierCurveTo(x + 12, base - 40, x + 25, base - 18, x + 21, base); p.closePath();
    return p;
  }
  function paintCapHouse(g) {
    const { x, base, top, rx, ry, dome } = CAP, r = rng(501);
    // contact shadow in the moss
    g.fillStyle = 'rgba(10,8,16,0.5)'; g.fill(ell(x, base + 1, 30, 5));
    // the gills: the cap's underside seen from below, fanning from the stalk
    const under = ell(x, top, rx, ry);
    g.lineWidth = 5; g.strokeStyle = LINE; g.stroke(under);
    g.fillStyle = '#d9c7a8'; g.fill(under);
    g.save(); g.clip(under);
    g.fillStyle = radial(g, x, top, 0, rx, [[0, 'rgba(70,50,50,0.55)'], [0.5, 'rgba(120,96,80,0.2)'], [1, 'rgba(255,210,150,0.25)']]);
    g.fillRect(x - rx, top - ry, rx * 2, ry * 2);
    g.lineWidth = 0.8;
    for (let i = 0; i < 64; i++) {
      const a = (i / 64) * TAU;
      g.strokeStyle = i % 2 ? 'rgba(110,84,74,0.7)' : 'rgba(150,120,100,0.5)';
      g.beginPath(); g.moveTo(x + Math.cos(a) * 9, top + Math.sin(a) * 2); g.lineTo(x + Math.cos(a) * rx, top + Math.sin(a) * ry); g.stroke();
    }
    g.restore();
    // the dome of the cap above the rim (its top turned from us, lit along the sun side)
    const cap = new Path2D();
    cap.moveTo(x - rx - 2, top);
    cap.bezierCurveTo(x - rx + 4, top - dome * 0.9, x - 22, top - dome, x - 8, top - dome - 4);
    cap.quadraticCurveTo(x, top - dome - 12, x + 8, top - dome - 4);
    cap.bezierCurveTo(x + 22, top - dome, x + rx - 4, top - dome * 0.9, x + rx + 2, top);
    cap.ellipse(x, top, rx + 2, ry * 0.9, 0, 0, Math.PI, false);
    cap.closePath();
    g.lineWidth = 5.4; g.strokeStyle = LINE; g.stroke(cap);
    g.fillStyle = grad(g, x - rx, 0, x + rx, 0, ['#e8d4b0', '#c8ab86', '#8e7262']); g.fill(cap);
    g.save(); g.clip(cap);
    // the dark crown and the shaggy brown scales of a parasol
    g.fillStyle = '#5a3a32'; g.fill(ell(x, top - dome - 2, 22, 12));
    for (let i = 0; i < 46; i++) {
      const u = r(), a = (r() - 0.5) * Math.PI * 0.9;
      const sx = x + Math.sin(a) * rx * (0.25 + u * 0.75), sy = top - dome * (1 - u * 0.85) * Math.cos(a * 0.8) + 4;
      const s = 2.5 + (1 - u) * 4;
      g.fillStyle = r() < 0.5 ? '#7a5444' : '#9a6f56';
      g.fill(poly([[sx - s, sy], [sx + s * 0.2, sy - s * 0.6], [sx + s, sy + s * 0.3], [sx, sy + s * 0.5]]));
    }
    g.restore();
    DH.shadeFace(g, cap, x - rx, x + rx, 0.78);
    DH.rim(g, cap, x, 5, 'rgba(255,214,140,0.95)');
    // the rim's edge seen from below catches the warm bounce
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,200,150,0.55)';
    g.beginPath(); g.ellipse(x, top + 1, rx, ry * 0.95, 0, 0.1, Math.PI - 0.1); g.stroke();

    // the stalk
    const S = capStalk(g);
    g.lineWidth = 5; g.strokeStyle = LINE; g.stroke(S);
    g.fillStyle = grad(g, x - 22, 0, x + 22, 0, ['#e6d8bc', '#bba684', '#7d6a5c']); g.fill(S);
    g.save(); g.clip(S);
    // snakeskin chevrons
    g.strokeStyle = 'rgba(110,80,64,0.65)'; g.lineWidth = 1.3;
    for (let y = top + 16; y < base - 50; y += 9 + r() * 4) { g.beginPath(); g.moveTo(x - 12, y); g.lineTo(x - 2, y + 4); g.lineTo(x + 3, y + 1); g.lineTo(x + 12, y + 5); g.stroke(); }
    g.restore();
    DH.shadeFace(g, S, x - 22, x + 22, 0.72);
    DH.rim(g, S, x, 3.5);
    // the collar (annulus): a thick skirt round the stalk
    const col = new Path2D();
    col.moveTo(x - 14, top + 32); col.quadraticCurveTo(x - 20, top + 44, x - 17, top + 48); col.quadraticCurveTo(x, top + 52, x + 17, top + 48); col.quadraticCurveTo(x + 20, top + 44, x + 14, top + 32); col.closePath();
    ink(g, col, '#efe2c4', 2.4);
    DH.crescent(g, col, '#a88f78', 0, -4);
    DH.shadeFace(g, col, x - 20, x + 20, 0.5);
    DH.rim(g, col, x, 2.5);
    // porthole with a warm lamp and a curtain
    const wy = top + 74;
    ink(g, circ(x + 1, wy, 7.5), '#6a4a3a', 2.4);
    g.fillStyle = radial(g, x + 1, wy, 0, 7, [[0, '#ffd890'], [1, '#e0884a']]); g.fill(circ(x + 1, wy, 5.5));
    g.fillStyle = '#b84a44'; g.fill(poly([[x - 4.5, wy - 5], [x + 1, wy - 5], [x - 1, wy + 4], [x - 4.5, wy + 4]]));
    g.lineWidth = 1; g.strokeStyle = '#4a2a24'; g.beginPath(); g.moveTo(x - 4, wy); g.lineTo(x + 6, wy); g.moveTo(x + 1, wy - 5); g.lineTo(x + 1, wy + 5); g.stroke();
    // a ladder of grass stems to a hook below the collar
    g.lineWidth = 1.6; g.strokeStyle = '#a88a52';
    for (const dx of [-30, -22]) { g.beginPath(); g.moveTo(x + dx, base); g.lineTo(x + dx + 12, top + 54); g.stroke(); }
    for (let i = 1; i < 8; i++) { const u = i / 8; g.beginPath(); g.moveTo(x - 30 + u * 12, base - u * (base - top - 54)); g.lineTo(x - 22 + u * 12, base - u * (base - top - 54)); g.stroke(); }
    // door frame in the bulb (the door itself is in the life layer)
    ink(g, capDoor(0), '#1a0e16', 2);
  }
  function capDoor(open) {
    const x = CAP.x + 1, y = CAP.base - 1, w = 8.5, h = 20;
    const p = new Path2D();
    const dw = w * (1 - open * 0.8);
    p.moveTo(x - w, y); p.lineTo(x - w, y - h + w); p.arc(x - w + dw, y - h + w, dw, Math.PI, 0); p.lineTo(x - w + dw * 2, y); p.closePath();
    return p;
  }

  // ------------------------------------------------------------ the Pod House
  function podBody() {
    const { x, y0, y1, w } = POD;
    const p = new Path2D();
    // a round urn narrowing to a neck under the lid
    p.moveTo(x - 6, y0 + 2);
    p.bezierCurveTo(x - w * 1.25, y0 - 8, x - w * 1.2, y1 + 34, x - w * 0.62, y1 + 12);
    p.quadraticCurveTo(x - w * 0.5, y1 + 6, x - w * 0.56, y1 + 2);
    p.lineTo(x + w * 0.56, y1 + 2);
    p.quadraticCurveTo(x + w * 0.5, y1 + 6, x + w * 0.62, y1 + 12);
    p.bezierCurveTo(x + w * 1.2, y1 + 34, x + w * 1.25, y0 - 8, x + 6, y0 + 2);
    p.closePath();
    return p;
  }
  function paintPodHouse(g) {
    const { x, base, y0, y1, w } = POD, r = rng(502);
    g.fillStyle = 'rgba(10,8,16,0.5)'; g.fill(ell(x, base + 1, 18, 4));
    // the stalk, ridged and a little bent
    const stalk = new Path2D();
    stalk.moveTo(x - 5, base); stalk.quadraticCurveTo(x - 9, (base + y0) / 2, x - 6, y0); stalk.lineTo(x + 6, y0); stalk.quadraticCurveTo(x - 1, (base + y0) / 2, x + 5, base); stalk.closePath();
    ink(g, stalk, '#8c8a5a', 2.4);
    DH.rim(g, stalk, x, 2);
    const B = podBody();
    g.lineWidth = 5; g.strokeStyle = LINE; g.stroke(B);
    g.fillStyle = grad(g, x - w, 0, x + w, 0, ['#cdb98a', '#a89064', '#6e5e4c']); g.fill(B);
    g.save(); g.clip(B);
    // ribs running up the urn
    for (let i = -4; i <= 4; i++) {
      const xx = x + i * w * 0.24;
      g.lineWidth = 1.4; g.strokeStyle = 'rgba(80,64,50,0.55)';
      g.beginPath(); g.moveTo(x + i * 1.5, y0); g.bezierCurveTo(xx + i * 3, y0 - 30, xx + i * 2, y1 + 20, xx * 0.9 + x * 0.1, y1); g.stroke();
      g.lineWidth = 0.8; g.strokeStyle = 'rgba(240,220,170,0.35)';
      g.beginPath(); g.moveTo(x + i * 1.5 - 1.5, y0); g.bezierCurveTo(xx + i * 3 - 2, y0 - 30, xx + i * 2 - 2, y1 + 20, xx * 0.9 + x * 0.1 - 2, y1); g.stroke();
    }
    // weathered blotches
    for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(70,56,60,${0.1 + r() * 0.2})`; g.fill(ell(x + (r() - 0.5) * w * 2, y1 + r() * (y0 - y1), 2 + r() * 5, 1.5 + r() * 3)); }
    g.restore();
    DH.shadeFace(g, B, x - w * 1.25, x + w * 1.25, 0.6);
    DH.rim(g, B, x, 4);
    // the scalloped lid, seen from below: its overhanging skirt
    const lid = new Path2D(), n = 11, lw2 = w * 1.08;
    lid.moveTo(x - lw2, y1 + 1);
    for (let i = 0; i < n; i++) { const a = x - lw2 + (i + 0.5) * (lw2 * 2 / n); lid.quadraticCurveTo(a, y1 + 10, x - lw2 + (i + 1) * (lw2 * 2 / n), y1 + 1); }
    lid.lineTo(x + lw2 * 0.86, y1 - 5); lid.quadraticCurveTo(x, y1 - 13, x - lw2 * 0.86, y1 - 5); lid.closePath();
    g.lineWidth = 4.6; g.strokeStyle = LINE; g.stroke(lid);
    g.fillStyle = '#8c744e'; g.fill(lid);
    DH.crescent(g, lid, '#5e4a3a', 0, -4);
    DH.shadeFace(g, lid, x - w * 1.1, x + w * 1.1, 0.5);
    DH.rim(g, lid, x, 3);
    // the starry rays on top just show as ridges on the lid's crown
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(60,44,36,0.8)';
    for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(x + i * 6, y1 - 11); g.lineTo(x + i * 9, y1 - 3); g.stroke(); }
    // pores under the lid: little round windows, dark
    for (let i = -3; i <= 3; i++) {
      const px = x + i * w * 0.15, py = y1 + 8.5 + Math.abs(i) * 0.4;
      ink(g, ell(px, py, 2.1, 1.8), '#1a0e16', 0.9);
    }
    // a door with a rose-petal awning
    const dx = x - 4, dy = y0 - 12;
    const door = new Path2D(); door.moveTo(dx - 7, dy); door.lineTo(dx - 7, dy - 14); door.quadraticCurveTo(dx, dy - 22, dx + 7, dy - 14); door.lineTo(dx + 7, dy); door.closePath();
    ink(g, door, '#5a3828', 2);
    g.lineWidth = 0.8; g.strokeStyle = 'rgba(20,10,10,0.6)'; g.beginPath(); g.moveTo(dx, dy - 19); g.lineTo(dx, dy); g.stroke();
    g.fillStyle = '#e0b060'; g.fill(circ(dx + 4, dy - 7, 1.2));
    const awn = new Path2D(); awn.moveTo(dx - 12, dy - 18); awn.quadraticCurveTo(dx, dy - 30, dx + 12, dy - 18); awn.quadraticCurveTo(dx + 4, dy - 14, dx, dy - 17); awn.quadraticCurveTo(dx - 4, dy - 14, dx - 12, dy - 18); awn.closePath();
    ink(g, awn, '#d8505a', 1.6);
    DH.crescent(g, awn, '#a03040', 0, -2);
    DH.rim(g, awn, x, 1.6);
    // a step of a pebble and a stair of seeds up the stalk
    ink(g, ell(dx - 2, dy + 2, 9, 2.6), '#6e5a4a', 1.2);
  }

  // ------------------------------------------------------------ the Nut House
  function paintNutHouse(g) {
    const { x, base, r: R } = NUT, r = rng(503);
    const cy = base - R * 0.95;
    g.fillStyle = 'rgba(10,8,16,0.55)'; g.fill(ell(x, base, R * 1.05, 5));
    const nut = new Path2D();
    nut.moveTo(x - R, cy + 4); nut.bezierCurveTo(x - R, cy - R * 1.1, x + R, cy - R * 1.1, x + R, cy + 4);
    nut.bezierCurveTo(x + R, cy + R * 0.9, x - R, cy + R * 0.9, x - R, cy + 4);
    g.lineWidth = 5; g.strokeStyle = LINE; g.stroke(nut);
    g.fillStyle = grad(g, x - R, 0, x + R, 0, ['#c88a4a', '#9a5c32', '#5c3424']); g.fill(nut);
    g.save(); g.clip(nut);
    // stripes running round the shell
    for (let i = -5; i <= 5; i++) { g.lineWidth = 1.2 + r(); g.strokeStyle = 'rgba(70,36,24,0.5)'; g.beginPath(); g.moveTo(x + i * 6, cy + R); g.quadraticCurveTo(x + i * 9, cy, x + i * 5, cy - R); g.stroke(); }
    // the pale scar where it hung
    g.fillStyle = '#d8b88a'; g.fill(ell(x - 4, cy + R * 0.72, R * 0.55, R * 0.2));
    g.fillStyle = 'rgba(255,230,190,0.3)'; g.fill(ell(x - R * 0.45, cy - R * 0.35, R * 0.2, R * 0.12, undefined, -0.6));
    g.restore();
    DH.shadeFace(g, nut, x - R, x + R, 0.6);
    DH.rim(g, nut, x, 4);
    // the round door hole (chewed), dark inside
    ink(g, ell(x + 3, cy + 2, 11, 10), '#140a12', 2.4);
    g.lineWidth = 1.6; g.strokeStyle = '#d8a070'; g.beginPath(); g.ellipse(x + 3, cy + 2, 11, 10, 0, Math.PI * 0.9, Math.PI * 1.7); g.stroke();
    // the husk: a ragged frilled hood over the top
    const hk = new Path2D();
    const pts = [];
    for (let i = 0; i <= 14; i++) {
      const u = i / 14, a = Math.PI * (1.05 + u * 0.9);
      const rr = R * (1.12 + (i % 2 ? 0.18 : -0.02) + (r() - 0.5) * 0.1);
      pts.push([x + Math.cos(a) * rr, cy - 6 + Math.sin(a) * rr * 0.95]);
    }
    for (let i = 14; i >= 0; i--) { const u = i / 14, a = Math.PI * (1.08 + u * 0.84); pts.push([x + Math.cos(a) * R * 0.86, cy - 4 + Math.sin(a) * R * 0.86]); }
    const H = curve(pts);
    g.lineWidth = 4.6; g.strokeStyle = LINE; g.stroke(H);
    g.fillStyle = '#7c8a44'; g.fill(H);
    DH.crescent(g, H, '#4c5a34', 4, -4);
    DH.shadeFace(g, H, x - R * 1.3, x + R * 1.3, 0.5);
    DH.rim(g, H, x, 3.4, 'rgba(255,224,130,0.95)');
    g.save(); g.clip(H);
    g.lineWidth = 0.8; g.strokeStyle = 'rgba(40,50,30,0.6)';
    for (let i = 0; i < 12; i++) { const a = Math.PI * (1.1 + i / 12 * 0.8); g.beginPath(); g.moveTo(x + Math.cos(a) * R * 0.9, cy - 4 + Math.sin(a) * R * 0.9); g.lineTo(x + Math.cos(a) * R * 1.2, cy - 6 + Math.sin(a) * R * 1.15); g.stroke(); }
    g.restore();
    // a chimney of a hollow grass stem, capped with a bead
    g.lineWidth = 5; g.strokeStyle = LINE; g.beginPath(); g.moveTo(x + 16, cy - R * 0.9); g.lineTo(x + 19, cy - R * 1.6); g.stroke();
    g.lineWidth = 3; g.strokeStyle = '#b8a060'; g.stroke();
  }

  function paintHouses(g) {
    for (const [h, f] of [[POD, paintPodHouse], [CAP, paintCapHouse], [NUT, paintNutHouse]]) { g.save(); h.on(g); f(g); g.restore(); }
  }
  layer({ id: 'houses', z: 10.5, still: true, draw: paintHouses });
  DH.mirror(DH.SHORE + 2, paintHouses);

  // ------------------------------------------------------------ Cap House life
  const cap = { shake: DH.spring(140, 7), door: 0, beads: [], act: DH.actor(31, ['door'], [9, 14], 3.5), blink: Drawn.blinker() };
  onLayout(() => {
    cap.beads.length = 0;
    const r = rng(77);
    for (let i = 0; i < 9; i++) { const a = 0.15 + (i / 8) * (Math.PI - 0.3); cap.beads.push({ a, s: r(), grow: r() }); }
  });
  layer({
    id: 'cap-life', z: 11.4,
    hit(X, Y) {
      const [x, y] = CAP.inv(X, Y);
      const { x: cx, top, rx, base } = CAP;
      return (Math.abs(x - cx) < rx && y > top - 56 && y < top + 18) || (Math.abs(x - cx) < 24 && y > top && y < base);
    },
    onEnter() { cap.shake.v += 9; },
    update(dt, t, L) {
      cap.shake.step(dt);
      cap.act.step(dt);
      const want = L.hovered && L.since > 0.35 ? 1 : cap.act.name ? DH.bump(cap.act.u) : 0;
      cap.door = ease(cap.door, want, 3, dt);
      for (const b of cap.beads) {
        b.grow += dt * (0.08 + b.s * 0.1);
        const fling = Math.abs(cap.shake.v) > 4 && Math.random() < 0.4;
        if (b.grow > 1 || fling) {
          const [x, y] = CAP.fwd(CAP.x + Math.cos(b.a) * CAP.rx, CAP.top + Math.sin(b.a) * CAP.ry + 2);
          DH.spawn({ kind: 'drip', x, y, vx: fling ? cap.shake.v * 6 : 0, vy: 10, r: 1.8 + b.grow * 1.6, life: 2, g: 1500, z: 'mid', land: DH.ridgeY(x) });
          b.grow = 0;
        }
      }
    },
    draw(g, t) {
      g.save(); CAP.on(g);
      const { x, top, rx, ry, base } = CAP;
      // the cap shudders on its stalk: redraw only its beads and the door
      const sh = cap.shake.x * 0.6;
      for (const b of cap.beads) {
        const bx = x + Math.cos(b.a) * rx + sh, by = top + Math.sin(b.a) * ry + 2 + b.grow * 2;
        DH.glassDrop(g, bx, by, 1.3 + b.grow * 1.6, { sy: 1 + b.grow * 0.3 });
      }
      // the door swings in and a child holds out an acorn cup
      const o = cap.door;
      if (o > 0.04) {
        const dp = capDoor(0);
        g.save(); g.clip(dp);
        g.fillStyle = `rgba(255,176,96,${0.7 * o})`; g.fillRect(x - 12, base - 24, 24, 26);
        g.restore();
        const kx = x + 1 + o * 6, ky = base - 2;
        DH.bug(g, kx, ky, 0.6, { dir: 1, look: [0.4, -1], open: cap.blink(t), smile: 1 });
        if (o > 0.5) {
          // the acorn cup, held out on a stick under the cap's rim
          const cx = kx + 16 * o, cy = ky - 14;
          g.lineWidth = 1.4; g.strokeStyle = '#7a5a3a'; g.beginPath(); g.moveTo(kx + 5, ky - 8); g.lineTo(cx, cy + 2); g.stroke();
          const cup = new Path2D(); cup.moveTo(cx - 5, cy); cup.quadraticCurveTo(cx, cy + 8, cx + 5, cy); cup.closePath();
          ink(g, cup, '#8a7448', 1.1);
          DH.glassDrop(g, cx, cy - 1, 2.4 * o, { flat: 0.8 });
        }
      }
      ink(g, capDoor(o), '#8a5a3a', 1.6);
      if (o < 0.6) { g.fillStyle = '#e0b060'; g.fill(circ(x + 5 - o * 6, base - 9, 1.1)); }
      g.restore();
    },
  });

  // ------------------------------------------------------------ Pod House life
  const pod = { rattle: DH.spring(220, 8), face: 0, act: DH.actor(41, ['peek'], [7, 11], 3), blink: Drawn.blinker(), seedT: 0 };
  layer({
    id: 'pod-life', z: 11.5,
    hit(X, Y) { const [x, y] = POD.inv(X, Y); return Math.abs(x - POD.x) < POD.w + 4 && y > POD.y1 - 16 && y < POD.base; },
    onEnter() { pod.rattle.v += 6; },
    update(dt, t, L) {
      pod.rattle.step(dt);
      if (L.hovered) pod.rattle.v += Math.sin(t * 24) * dt * 30;
      pod.act.step(dt);
      pod.face = ease(pod.face, L.hovered && L.since > 0.5 ? 1 : pod.act.name ? DH.bump(pod.act.u) : 0, 3, dt);
      // seeds sprinkle out of the pores when it rattles, or in a gust
      const shake = Math.abs(pod.rattle.x) + Math.max(0, Drawn.wind(t, POD.x) - 1.2) * 0.5;
      pod.seedT += dt * shake * 14;
      while (pod.seedT > 1) {
        pod.seedT -= 1;
        const i = Math.floor(Math.random() * 7) - 3;
        const [sx, sy] = POD.fwd(POD.x + i * POD.w * 0.15, POD.y1 + 9);
        DH.spawn({ kind: 'seed', x: sx, y: sy, vx: i * 12 + (Math.random() - 0.5) * 20, vy: -20, r: 1.1, life: 1.2, g: 700, z: 'mid' });
      }
    },
    draw(g, t) {
      for (const p of DH.fx) if (p.kind === 'seed') { g.fillStyle = '#1e1420'; g.fill(ell(p.x, p.y, 1.5, 1.1)); }
      g.save(); POD.on(g);
      // the pod itself is still; the rattle shows in the lid's pores and the seeds
      const i = 1, px = POD.x + i * POD.w * 0.15, py = POD.y1 + 8.5 + 0.4;
      if (pod.face > 0.05) {
        g.save(); g.beginPath(); g.ellipse(px, py, 2.1, 1.8, 0, 0, TAU); g.clip();
        g.fillStyle = C.bug.base; g.fillRect(px - 3, py - 3, 6, 6);
        g.restore();
        const o = pod.blink(t) * pod.face;
        g.fillStyle = '#fff'; g.fill(circ(px - 0.7, py - 0.2, 0.7 * o)); g.fill(circ(px + 0.7, py - 0.2, 0.7 * o));
      }
      // a shiver line beside it when rattling
      const a = Math.abs(pod.rattle.x);
      if (a > 0.2) {
        g.lineWidth = 1; g.strokeStyle = `rgba(255,230,180,${Math.min(0.6, a * 0.3)})`;
        for (const s of [-1, 1]) { g.beginPath(); g.arc(POD.x, (POD.y0 + POD.y1) / 2, POD.w + 8 + a * 2, s > 0 ? -0.4 : Math.PI - 0.4, s > 0 ? 0.4 : Math.PI + 0.4); g.stroke(); }
      }
      g.restore();
    },
  });

  // ------------------------------------------------------------ Nut House life: the sleeper
  const nut = { wake: 0, yawn: 0, z: 0 };
  layer({
    id: 'nut-life', z: 11.6,
    hit(X, Y) { const [x, y] = NUT.inv(X, Y); return Math.hypot(x - NUT.x, y - (NUT.base - NUT.r)) < NUT.r + 8; },
    update(dt, t, L) {
      nut.wake = ease(nut.wake, L.hovered ? 1 : 0, L.hovered ? 2.2 : 1, dt);
      nut.yawn = L.hovered ? clamp((L.since - 0.6) / 1.4, 0, 1) : 0;
      nut.z += dt;
      if (nut.wake < 0.2 && nut.z > 1.8) { nut.z = 0; const [zx, zy] = NUT.fwd(NUT.x + 8, NUT.base - NUT.r * 0.95 - 6); DH.spawn({ kind: 'zz', x: zx, y: zy, vx: 6, vy: -10, r: 1, life: 2.2, g: 0, z: 'mid' }); }
    },
    draw(g, t) {
      g.save(); NUT.on(g);
      const cx = NUT.x + 3, cy = NUT.base - NUT.r * 0.95 + 2;
      g.save(); g.beginPath(); g.ellipse(cx, cy, 10, 9, 0, 0, TAU); g.clip();
      g.fillStyle = 'rgba(255,170,90,0.25)'; g.fillRect(cx - 12, cy - 12, 24, 24);
      const k = nut.wake;
      // curled up asleep (a ball of plates), or uncurled and looking out
      const by = cy + 6 - k * 3;
      const breath = 1 + Math.sin(t * 1.4) * 0.04 * (1 - k);
      g.save(); g.translate(cx, by); g.scale(breath, breath);
      const ball = circ(0, 0, 8);
      ink(g, ball, C.bug.base, 1.2);
      g.strokeStyle = C.bug.deep; g.lineWidth = 0.9;
      for (let i = -2; i <= 2; i++) { g.beginPath(); g.arc(i * 3.2, 0, 7, -Math.PI * 0.9, -Math.PI * 0.1); g.stroke(); }
      DH.crescent(g, ball, C.bug.lit, -2, 2, 0.6);
      if (k > 0.3) {
        const e = clamp((k - 0.3) / 0.5, 0, 1) * (nut.yawn > 0.2 && nut.yawn < 0.7 ? 0.2 : 1);
        g.fillStyle = LINE; g.fill(ell(-3, -1, 1.2, 1.3 * e)); g.fill(ell(2, -1, 1.2, 1.3 * e));
        const yw = DH.bump(nut.yawn);
        g.fillStyle = '#5a2a34'; g.fill(ell(-0.5, 3, 1.5 + yw * 1.5, 0.6 + yw * 2.6));
      } else {
        g.lineWidth = 0.8; g.strokeStyle = LINE;
        for (const ex of [-3, 2]) { g.beginPath(); g.moveTo(ex - 1.4, -1); g.quadraticCurveTo(ex, 0.2, ex + 1.4, -1); g.stroke(); }
      }
      g.restore();
      g.restore();
      g.restore();
      for (const p of DH.fx) if (p.kind === 'zz') {
        const a = Math.min(1, p.age * 2) * (1 - p.age / p.life);
        p.x += Math.sin(p.age * 3) * 0.15;
        g.font = `italic 600 ${9 + p.age * 3 | 0}px Georgia, serif`; g.fillStyle = `rgba(230,220,250,${a})`; g.textAlign = 'center';
        g.fillText('z', p.x, p.y);
      }
    },
  });

  // ------------------------------------------------------------ the lantern thread
  const A = CAP.fwd(CAP.x + 14, CAP.top + 40), B = POD.fwd(POD.x - POD.w + 2, POD.y1 + 34), Cc = NUT.fwd(NUT.x - NUT.r + 8, NUT.base - NUT.r * 1.5);
  const spans = [[A, B], [B, Cc]];
  const thread = { pluck: DH.spring(60, 3), lanterns: [] };
  onLayout(() => {
    thread.lanterns.length = 0;
    const r = rng(88);
    for (let s = 0; s < 2; s++) for (const u of [0.22, 0.48, 0.74]) thread.lanterns.push({ s, u, r: 4.2 + r() * 2.8, a: 0, v: 0, len: 8 + r() * 10 });
  });
  const sag = (s, u, t) => {
    const [p0, p1] = spans[s];
    const w = Drawn.wind(t, p0[0]);
    return [lerp(p0[0], p1[0], u), lerp(p0[1], p1[1], u) + 4 * u * (1 - u) * (18 + w * 4 + thread.pluck.x * 10 + Math.sin(t * 1.7 + s) * 1.5)];
  };
  layer({
    id: 'lanterns', z: 11.8,
    hit(x, y) {
      for (let s = 0; s < 2; s++) for (let u = 0.05; u < 1; u += 0.1) { const [px, py] = sag(s, u, st.t); if (Math.hypot(x - px, y - py - 8) < 14) return true; }
      return false;
    },
    onEnter() { thread.pluck.v += 4; for (const l of thread.lanterns) l.v += (P.vx || 30) * 0.004; },
    update(dt, t) {
      thread.pluck.step(dt);
      for (const l of thread.lanterns) {
        const w = Drawn.wind(t, 1300);
        l.v += (-(l.a - (w - 0.6) * 0.25) * 30 - l.v * 1.8) * dt;
        l.a += l.v * dt;
      }
    },
    draw(g, t) {
      g.lineWidth = 1.1; g.strokeStyle = '#d0b88a';
      for (let s = 0; s < 2; s++) {
        g.beginPath();
        for (let u = 0; u <= 1.001; u += 0.05) { const [px, py] = sag(s, u, t); u ? g.lineTo(px, py) : g.moveTo(px, py); }
        g.stroke();
      }
      for (const l of thread.lanterns) {
        const [px, py] = sag(l.s, l.u, t);
        const bx = px + Math.sin(l.a) * l.len, by = py + Math.cos(l.a) * l.len;
        g.lineWidth = 0.8; g.strokeStyle = 'rgba(210,190,150,0.9)';
        g.beginPath(); g.moveTo(px, py); g.lineTo(bx, by - l.r * 0.8); g.stroke();
        // a tiny knot of grass holding each drop
        g.fillStyle = '#9a8a4a'; g.fill(ell(bx, by - l.r * 0.85, l.r * 0.5, 1.2));
        DH.glassDrop(g, bx, by, l.r, { bright: 0.8 });
      }
    },
  });

  // rain landing on the caps (only at the edges the leaf doesn't cover)
  DH.surface({ band: 'near', x0: CAP.x - CAP.rx * K, x1: CAP.x + CAP.rx * K, y: (x) => CAP.fwd(x, CAP.top - CAP.dome * Math.sqrt(Math.max(0, 1 - ((CAP.x + (x - CAP.x) / K - CAP.x) / CAP.rx) ** 2)))[1], hit(x, y, d) { cap.shake.v += 0.6; DH.splash(x, y, d.r * 0.6, 'ground', 'mid'); } });
})();
