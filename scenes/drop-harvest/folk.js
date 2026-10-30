/* folk.js — the drop harvesters: pill-bug folk working the left shoulder of the island in the
   rain, out from under the leaf.
     · the cistern: an acorn cup heaped with caught drops, each a glass ball holding a tiny
       upside-down sunset; the leaf tip drips into it;
     · two haulers rolling a drop up the bark path to it on a grass rope, heave by heave, then
       tipping it onto the heap and trudging back down for the next;
     · the netter on the twig jetty, holding a woven net up into the rain on a long stem;
     · the tally-keeper on a pebble by the cup, notching a grass blade for every drop.
   A pill-bug rig (DH.bug) is shared by everyone in the village: domed plates, an elbowed pair of
   antennae, a busy fringe of legs; it can curl into a ball.

   Hover the haulers: they curl up into balls (as pill-bugs do), the drop rolls back a little, then
   they uncurl and start again. Hover the netter: he lunges and nets a drop out of the air. Hover
   the heap: every drop wobbles like jelly. Hover the tally-keeper: he holds his tally up to show
   you how many.

   cistern z12 · haulers z13 · netter z13.5 · tally z12.2 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, ink, st, P, layer, onLayout } = Drawn;
  const { C, SUN, LINE, SHORE } = DH;
  const BG = C.bug;

  // ------------------------------------------------------------ the pill-bug rig
  // feet at (x, y), facing o.dir; o: { dir, roll 0..1, look [x,y], open, smile, walk (phase),
  // rot, hat, tint }
  DH.bug = function (g, x, y, s = 1, o = {}) {
    const dir = o.dir || 1, roll = o.roll || 0, open = o.open == null ? 1 : o.open;
    const lk = o.look || [0.4, 0];
    const col = o.tint || BG;
    g.save();
    g.translate(x, y); if (o.rot) g.rotate(o.rot); g.scale(s * dir, s);
    const lw = 1.7 / s;
    // the body: an arc of plates that closes into a ball as it rolls
    const phi = Math.PI * (1 + roll * 0.88), R = 15 * Math.PI / phi;
    const cy = lerp(-2.5, -R - 0.5, roll);
    const a0 = -Math.PI / 2 - phi / 2, a1 = -Math.PI / 2 + phi / 2;
    // legs first (behind the body), a busy fringe that ripples when walking
    if (roll < 0.7) {
      g.lineWidth = 1.3 / s * s; g.strokeStyle = col.deep;
      for (let i = 0; i < 7; i++) {
        const lx = -10 + i * 3.4, ph = (o.walk || 0) * 9 + i * 0.9;
        const sw = Math.sin(ph) * 1.6 * (o.walk != null ? 1 : 0.2);
        g.beginPath(); g.moveTo(lx, -2.5); g.lineTo(lx + 1.2 + sw, 0.5 - Math.max(0, Math.cos(ph)) * 1.2); g.stroke();
      }
    }
    const body = new Path2D();
    g.save(); g.scale(1, lerp(0.78, 1, roll));
    body.arc(0, cy, R * 1.02, a0, a1);
    if (roll < 0.98) body.quadraticCurveTo(0, cy + R * 0.25 * (1 - roll) + 2, Math.cos(a0) * R, cy + Math.sin(a0) * R);
    body.closePath();
    const squash = lerp(0.78, 1, roll);
    g.lineWidth = lw * 2.2; g.strokeStyle = LINE; g.stroke(body);
    g.fillStyle = col.base; g.fill(body);
    g.save(); g.clip(body);
    // the shaded side away from the sun, then the plate seams with a lit lip on each plate
    const sun = DH.sunSide(x) * dir;
    g.fillStyle = col.shade; g.fill(DH.shift(body, -sun * 4, 3));
    g.fillStyle = col.base; g.fill(DH.shift(body, sun * 1, 1.5));
    // plates: bands across the back, each lit along its front lip (when curled they wrap round)
    const n = 8;
    for (let i = 1; i < n; i++) {
      const u = i / n;
      if (roll < 0.5) {
        const x = lerp(-R, R, u) * 1.02, c = (u - 0.5) * 3;
        g.lineWidth = 1.3; g.strokeStyle = col.deep;
        g.beginPath(); g.moveTo(x + c, cy - R * 1.2); g.quadraticCurveTo(x - c * 0.6, cy - R * 0.4, x - c * 0.4, cy + 2); g.stroke();
        g.lineWidth = 1; g.strokeStyle = col.lit;
        g.beginPath(); g.moveTo(x + c + 1.4, cy - R * 1.2); g.quadraticCurveTo(x - c * 0.6 + 1.4, cy - R * 0.5, x - c * 0.4 + 1.4, cy - R * 0.3); g.stroke();
      } else {
        const a = lerp(a0, a1, u);
        g.lineWidth = 1.2; g.strokeStyle = col.deep;
        g.beginPath(); g.moveTo(Math.cos(a) * R * 1.05, cy + Math.sin(a) * R * 1.05); g.lineTo(Math.cos(a) * R * 0.15, cy + Math.sin(a) * R * 0.15); g.stroke();
      }
    }
    // wet sheen along the top
    g.lineWidth = 2; g.strokeStyle = 'rgba(255,255,255,0.25)';
    g.beginPath(); g.arc(0, cy, R * 0.82, a0 + phi * 0.25, a0 + phi * 0.55); g.stroke();
    g.restore();
    // rim of sun on the back
    g.save(); g.clip(body);
    g.lineWidth = 2.6; g.strokeStyle = col.rim;
    const ra = -Math.PI / 2 - sun * phi * 0.18;
    g.beginPath(); g.arc(0, cy, R * 1.02, ra - phi * 0.22, ra + phi * 0.22); g.stroke();
    g.restore();
    g.restore();
    // the head at the front end, tucked away when rolled
    if (roll < 0.75) {
      const k = 1 - roll / 0.75;
      const hx = Math.cos(a1) * R - 1, hy = (cy + Math.sin(a1) * R) * squash - 4;
      g.save(); g.translate(hx, hy); g.scale(k, k);
      // antennae: elbowed, reaching forward
      g.lineWidth = 1.2; g.strokeStyle = col.deep;
      const tw = o.ant || 0;
      for (const [ax, ay] of [[1, -3], [3, -2]]) {
        g.beginPath(); g.moveTo(ax, ay); g.lineTo(ax + 6, ay - 7 + tw * 2); g.lineTo(ax + 12, ay - 4 + tw * 3 + lk[1] * 2); g.stroke();
      }
      const head = ell(2, -1, 5.5, 4.8);
      ink(g, head, col.base, lw);
      DH.crescent(g, head, col.shade, -2, 1.5);
      // the eye: dark, with a glint that follows the look
      if (open > 0.3) {
        g.fillStyle = LINE; g.fill(ell(3.5 + lk[0] * 0.6, -2 + lk[1] * 0.6, 1.7, 1.8 * open));
        g.fillStyle = '#fff'; g.fill(circ(4 + lk[0] * 0.8, -2.6 + lk[1] * 0.8, 0.7));
      } else { g.lineWidth = 0.9; g.strokeStyle = LINE; g.beginPath(); g.moveTo(2, -2); g.quadraticCurveTo(3.5, -1, 5, -2); g.stroke(); }
      if (o.smile) { g.lineWidth = 0.8; g.strokeStyle = LINE; g.beginPath(); g.moveTo(4.5, 1.2); g.quadraticCurveTo(5.8, 2.2 + o.smile * 0.6, 7, 1); g.stroke(); }
      g.restore();
      // tail spikes
      g.lineWidth = 1.3; g.strokeStyle = col.deep;
      const tx = Math.cos(a0) * R, ty = (cy + Math.sin(a0) * R) * squash;
      g.beginPath(); g.moveTo(tx + 1, ty - 1); g.lineTo(tx - 4 * k, ty + 0.5); g.moveTo(tx + 1, ty - 2.5); g.lineTo(tx - 3.5 * k, ty - 2.5); g.stroke();
    }
    // a rain hat: half a seed husk worn like a sou'wester
    if (o.hat && roll < 0.4) {
      const hy = (cy - R) * squash + 1;
      const hat = new Path2D(); hat.moveTo(-9, hy + 3); hat.quadraticCurveTo(-2, hy - 9, 8, hy + 1); hat.quadraticCurveTo(12, hy + 4, 14, hy + 6); hat.quadraticCurveTo(2, hy + 6, -9, hy + 3); hat.closePath();
      ink(g, hat, o.hat, lw);
      DH.crescent(g, hat, 'rgba(0,0,0,0.25)', -2, 2);
      DH.crescent(g, hat, col.rim, sun * 1.5, 1);
    }
    g.restore();
  };

  // ------------------------------------------------------------ the cistern
  const CX = 1012, CB = DH.ridgeY(1012) + 4;
  const RIM = CB - 60, RX = 58;
  const heap = [];
  onLayout(() => {
    heap.length = 0;
    const rows = [[4, 14.5], [3, 15], [2, 14], [1, 13]];
    let y = RIM - 6;
    const r = rng(9);
    for (const [n, rr] of rows) {
      for (let i = 0; i < n; i++) heap.push({ x: CX + (i - (n - 1) / 2) * rr * 1.75 + (r() - 0.5) * 4, y: y + (r() - 0.5) * 3, r: rr * (0.75 + r() * 0.45), w: DH.spring(160, 5, 0), ph: r() * TAU });
      y -= rr * 1.45;
    }
  });
  DH.cisternTop = () => (heap.length ? heap[heap.length - 1].y - heap[heap.length - 1].r : RIM - 40);
  const tally = { n: 23, raise: 0, notch: 0, blink: Drawn.blinker() };
  DH.cisternPlink = (x, r) => {
    const top = heap[heap.length - 1];
    if (top) top.w.v += 3 + r;
    for (const h of heap) h.w.v += 0.8;
    for (let i = 0; i < 4; i++) DH.spawn({ kind: 'spray', x, y: DH.cisternTop(), vx: (Math.random() - 0.5) * 90, vy: -50 - Math.random() * 60, r: 0.8, life: 0.4, g: 900, z: 'mid' });
    if (r > 4) { tally.n++; tally.notch = 1; }
  };

  function cupPath() {
    const p = new Path2D();
    p.moveTo(CX - RX - 2, RIM);
    p.bezierCurveTo(CX - RX + 2, CB - 10, CX - 20, CB + 2, CX, CB + 1);
    p.bezierCurveTo(CX + 20, CB + 2, CX + RX - 2, CB - 10, CX + RX + 2, RIM);
    p.ellipse(CX, RIM, RX + 2, 9, 0, 0, Math.PI, true);
    p.closePath();
    return p;
  }
  function paintCup(g) {
    const r = rng(12);
    g.fillStyle = 'rgba(10,8,16,0.55)'; g.fill(ell(CX, CB + 2, RX * 0.8, 5));
    const cup = cupPath();
    g.lineWidth = 5.2; g.strokeStyle = LINE; g.stroke(cup);
    g.fillStyle = grad(g, CX - RX, 0, CX + RX, 0, ['#a2905a', '#76683e', '#4a3e2c']); g.fill(cup);
    g.save(); g.clip(cup);
    // overlapping scales in staggered rows, each with a lit tip on the sun side
    for (let row = 0; row < 8; row++) {
      const y = RIM + 5 + row * 7.2, n = 15 - row;
      for (let i = 0; i <= n; i++) {
        const x = CX - RX + (i + (row % 2) * 0.5) * (RX * 2 / n);
        const sc = new Path2D(); sc.moveTo(x - 5, y); sc.quadraticCurveTo(x + (r() - 0.5) * 2, y + 11, x + 5, y); sc.quadraticCurveTo(x, y + 3.5, x - 5, y);
        g.fillStyle = r() < 0.5 ? '#8a7a4a' : '#6e6038'; g.fill(sc);
        g.lineWidth = 0.9; g.strokeStyle = 'rgba(40,30,20,0.7)'; g.stroke(sc);
        g.fillStyle = 'rgba(255,214,140,0.45)'; g.fill(circ(x - 1.5, y + 2, 1));
      }
    }
    g.fillStyle = 'rgba(30,24,44,0.45)'; g.fill(DH.shift(cup, 12, 3));
    g.restore();
    DH.rim(g, cup, CX, 4);
    DH.bounce(g, cup, 4);
    // the lip of the rim seen from below, thick and wet
    g.lineWidth = 5; g.strokeStyle = '#b8a46a'; g.beginPath(); g.ellipse(CX, RIM, RX + 1, 8.5, 0, 0.05, Math.PI - 0.05); g.stroke();
    g.lineWidth = 1.4; g.strokeStyle = LINE; g.stroke();
    g.lineWidth = 1.2; g.strokeStyle = 'rgba(255,230,170,0.6)'; g.beginPath(); g.ellipse(CX, RIM - 1, RX, 6, 0, 0.3, 1.2); g.stroke();
    // a grass-stem spout for the overflow, dripping toward the water
    g.lineWidth = 5; g.strokeStyle = LINE; g.beginPath(); g.moveTo(CX - RX + 4, RIM + 8); g.quadraticCurveTo(CX - RX - 14, RIM + 14, CX - RX - 24, RIM + 30); g.stroke();
    g.lineWidth = 3; g.strokeStyle = '#a8a05a'; g.stroke();
  }
  // the bark path up the slope, under the haulers
  function paintPath(g) {
    const p = new Path2D(), q = [];
    for (let x = 872; x <= 962; x += 6) q.push([x, DH.ridgeY(x) - 2]);
    q.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    for (let i = q.length - 1; i >= 0; i--) p.lineTo(q[i][0] + 3, q[i][1] + 7);
    p.closePath();
    ink(g, p, '#6a4a3a', 1.8);
    g.lineWidth = 1; g.strokeStyle = 'rgba(30,16,20,0.6)';
    for (let x = 878; x < 958; x += 9) { const y = DH.ridgeY(x); g.beginPath(); g.moveTo(x, y - 2); g.lineTo(x + 3, y + 5); g.stroke(); }
    g.lineWidth = 1.6; g.strokeStyle = 'rgba(255,200,140,0.6)';
    g.beginPath(); q.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke();
  }
  layer({ id: 'cup', z: 11.9, still: true, draw(g) { paintCup(g); } });
  DH.mirror(SHORE + 2, (g) => { paintCup(g); });
  DH.cisternX = CX;

  const heapL = { wob: 0 };
  layer({
    id: 'cistern', z: 12,
    hit: (x, y) => Math.abs(x - CX) < RX + 4 && y > RIM - 70 && y < CB,
    onEnter() { for (const h of heap) h.w.v += 6 + Math.random() * 4; },
    update(dt, t, L) {
      for (const h of heap) { if (L.hovered) h.w.v += Math.sin(t * 10 + h.ph) * dt * 20; h.w.step(dt); }
    },
    draw(g, t) {
      for (const h of heap) {
        const w = clamp(h.w.x * 0.06, -0.35, 0.35);
        DH.glassDrop(g, h.x, h.y - h.r * 0.6, h.r, { sx: 1 + w, sy: 1 - w, flat: 0.15, bright: 0.7 + 0.3 * Math.sin(t * 0.8 + h.ph) });
      }
    },
  });

  // ------------------------------------------------------------ the crane and its two winders
  // A twig mast on the island's shoulder with a jib hinged at its top. The winders turn a
  // windlass at its foot: the sling rises from the jetty to the jib, the jib swings up and over
  // and lowers the drop onto the heap, then swings back and lets the empty sling down for the next.
  const MAST = { x: 928, y: DH.ridgeY(928) + 2 }, TOP = [950, 556], JIB = 88;
  const WIND = { x: 936, y: DH.ridgeY(936) - 12 };
  const crane = { phase: 'hoist', tt: 0, rope: 200, jib: Math.PI, sw: 0, swv: 0, load: true, roll: 0, crank: 0, heave: 0, blinkA: Drawn.blinker(), blinkB: Drawn.blinker() };
  const ROPE_DOWN = 214, ROPE_UP = 26;
  const jibTip = () => [TOP[0] + Math.cos(crane.jib) * JIB, TOP[1] + Math.sin(crane.jib) * JIB];
  const loadPos = () => { const [tx, ty] = jibTip(); return [tx + Math.sin(crane.sw) * crane.rope, ty + Math.cos(crane.sw) * crane.rope]; };
  layer({
    id: 'crane', z: 13,
    hit(x, y) {
      const [lx, ly] = loadPos();
      return Math.hypot(x - WIND.x, y - WIND.y) < 44 || Math.hypot(x - lx, y - ly) < 22 || (Math.abs(x - MAST.x - 8) < 14 && y > TOP[1] && y < MAST.y);
    },
    update(dt, t, L) {
      // hovered, the winders curl up into balls and the sling slips back down a little
      crane.roll = ease(crane.roll, L.hovered ? 1 : 0, L.hovered ? 8 : 2.5, dt);
      const swingTo = (target) => { crane.jib = ease(crane.jib, target, 1.6, dt); return Math.abs(crane.jib - target) < 0.02; };
      // the load swings on its rope as the jib moves
      const prevTip = jibTip();
      if (crane.roll > 0.3) {
        if (crane.phase === 'hoist') crane.rope = Math.min(ROPE_DOWN, crane.rope + dt * 30);
      } else {
        crane.tt += dt;
        if (crane.phase === 'hoist') {
          const c = (crane.tt % 1.4) / 1.4;
          crane.heave = Math.max(0, Math.sin(c * Math.PI * 2)) ** 2;
          crane.crank += dt * (1 + crane.heave * 3);
          crane.rope = Math.max(ROPE_UP, crane.rope - dt * (6 + crane.heave * 40));
          if (crane.rope <= ROPE_UP) { crane.phase = 'swing'; crane.tt = 0; }
        } else if (crane.phase === 'swing') {
          if (swingTo(-0.72) && crane.tt > 1.2) { crane.phase = 'drop'; crane.tt = 0; crane.load = false; DH.cisternPlink(DH.cisternX, 7); }
        } else if (crane.phase === 'drop') {
          if (crane.tt > 0.8) { crane.phase = 'back'; crane.tt = 0; }
        } else if (crane.phase === 'back') {
          if (swingTo(Math.PI) && crane.tt > 1) { crane.phase = 'lower'; crane.tt = 0; }
        } else if (crane.phase === 'lower') {
          crane.crank -= dt * 2;
          crane.rope = Math.min(ROPE_DOWN, crane.rope + dt * 70);
          if (crane.rope >= ROPE_DOWN && crane.tt > 3.5) { crane.load = true; crane.phase = 'hoist'; crane.tt = 0; DH.jettyTake && DH.jettyTake(); }
        }
      }
      const tip = jibTip();
      crane.swv += (-(crane.sw) * (900 / Math.max(30, crane.rope)) - crane.swv * 1.6) * dt - ((tip[0] - prevTip[0]) / Math.max(dt, 1e-3)) * 0.0025;
      crane.swv += (Drawn.wind(t, tip[0]) - 0.6) * dt * 0.4;
      crane.sw += crane.swv * dt;
    },
    draw(g, t) {
      const roll = crane.roll;
      // the mast: a forked twig, lashed at the joints, guyed back into the moss
      g.lineCap = 'round';
      const twig = (x0, y0, x1, y1, w, col = '#6e4a38') => {
        g.lineWidth = w + 3.2; g.strokeStyle = LINE; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
        g.lineWidth = w; g.strokeStyle = col; g.stroke();
        g.lineWidth = Math.max(1, w * 0.3); g.strokeStyle = 'rgba(255,200,140,0.85)'; g.beginPath(); g.moveTo(x0 - w * 0.25, y0); g.lineTo(x1 - w * 0.25, y1); g.stroke();
      };
      g.lineWidth = 1; g.strokeStyle = 'rgba(220,200,150,0.8)';
      g.beginPath(); g.moveTo(TOP[0], TOP[1] + 4); g.lineTo(1000, DH.ridgeY(1000) - 2); g.stroke();
      twig(MAST.x, MAST.y, TOP[0], TOP[1], 6);
      twig(MAST.x + 14, MAST.y - 4, TOP[0] + 2, TOP[1] + 40, 3.6);
      // lashings
      g.lineWidth = 2; g.strokeStyle = '#c8b070';
      for (const [x, y] of [[TOP[0] - 1, TOP[1] + 6], [TOP[0] + 1, TOP[1] + 42], [MAST.x + 3, MAST.y - 16]]) { g.beginPath(); g.moveTo(x - 4, y - 2); g.lineTo(x + 4, y + 2); g.moveTo(x - 4, y + 1); g.lineTo(x + 4, y + 5); g.stroke(); }
      // the jib
      const [tx, ty] = jibTip();
      twig(TOP[0], TOP[1], tx, ty, 4.2, '#7a5440');
      ink(g, circ(TOP[0], TOP[1], 4.5), '#a88a5a', 1.6);
      ink(g, circ(tx, ty, 3.2), '#a88a5a', 1.4);
      // the thread: windlass → masthead → jib tip → load
      const [lx, ly] = loadPos();
      g.lineWidth = 1.1; g.strokeStyle = '#e6d6a8';
      g.beginPath(); g.moveTo(WIND.x, WIND.y - 6); g.lineTo(TOP[0] - 3, TOP[1]); g.lineTo(tx, ty); g.lineTo(lx, ly - 10); g.stroke();
      // the sling: a little net bag, with a drop in it if loaded
      const bag = new Path2D(); bag.moveTo(lx - 12, ly - 10); bag.quadraticCurveTo(lx - 14, ly + 10, lx, ly + 12); bag.quadraticCurveTo(lx + 14, ly + 10, lx + 12, ly - 10); bag.closePath();
      if (crane.load) DH.glassDrop(g, lx, ly + 1, 11, { flat: 0.4, bright: 0.6 });
      g.save(); g.clip(bag);
      g.lineWidth = 0.7; g.strokeStyle = 'rgba(230,210,160,0.9)';
      for (let i = -3; i <= 3; i++) { g.beginPath(); g.moveTo(lx + i * 4, ly - 12); g.lineTo(lx + i * 2, ly + 14); g.stroke(); }
      for (let j = 0; j < 4; j++) { g.beginPath(); g.ellipse(lx, ly - 6 + j * 5, 13 - j * 2, 2, 0, 0, Math.PI); g.stroke(); }
      g.restore();
      g.lineWidth = 1; g.strokeStyle = LINE; g.stroke(bag);
      g.lineWidth = 1; g.strokeStyle = '#e6d6a8'; g.beginPath(); g.moveTo(lx - 11, ly - 9); g.lineTo(lx, ly - 13); g.lineTo(lx + 11, ly - 9); g.stroke();
      // the windlass: a hollow stem spool on two forked pegs, with a crank
      const { x: wx, y: wy } = WIND;
      twig(wx - 15, wy + 14, wx - 12, wy - 2, 2.6);
      twig(wx + 15, wy + 10, wx + 12, wy - 2, 2.6);
      const spool = new Path2D(); spool.rect(wx - 12, wy - 9, 24, 14);
      ink(g, spool, '#b8a060', 1.8);
      g.save(); g.clip(spool);
      g.lineWidth = 1; g.strokeStyle = 'rgba(230,214,168,0.9)';
      const wound = clamp(1 - (crane.rope - ROPE_UP) / (ROPE_DOWN - ROPE_UP), 0, 1);
      for (let i = 0; i < 3 + wound * 10; i++) { const x = wx - 10 + ((i * 2.1 + crane.crank * 3) % 20); g.beginPath(); g.moveTo(x, wy - 9); g.lineTo(x + 1.5, wy + 5); g.stroke(); }
      g.fillStyle = 'rgba(40,30,40,0.35)'; g.fillRect(wx - 12, wy, 24, 5);
      g.restore();
      const ca = crane.crank * 3;
      const hx = wx + Math.cos(ca) * 9, hy = wy - 2 + Math.sin(ca) * 9;
      g.lineWidth = 2; g.strokeStyle = LINE; g.beginPath(); g.moveTo(wx + 12, wy - 2); g.lineTo(wx + 14, wy - 2); g.lineTo(hx + 4, hy); g.stroke();
      ink(g, circ(hx + 4, hy, 2), '#d8c080', 1);
      // the winders, either side of the spool, leaning into it
      const look = DH.underUmbrella(wx, wy) > 0.2 ? [0.1, -1] : [0.7, -0.3];
      const h = crane.phase === 'hoist' ? crane.heave : 0;
      DH.bug(g, wx - 26, DH.ridgeY(wx - 26) + 1, 1.2, { dir: 1, rot: -0.42 - h * 0.12, roll, walk: crane.phase === 'hoist' ? crane.crank : null, open: crane.blinkA(t), look, hat: '#b58a4a', smile: crane.phase === 'drop' ? 1.5 : 0, ant: h });
      DH.bug(g, wx + 30, DH.ridgeY(wx + 30) + 1, 1.15, { dir: -1, rot: 0.3 + h * 0.1, roll, walk: crane.phase === 'hoist' ? -crane.crank : null, open: crane.blinkB(t), look: [0.6, -0.6], smile: crane.phase === 'drop' ? 1.5 : 0, ant: h });
    },
  });
  DH.craneLoad = () => crane.load && crane.phase !== 'hoist' ? null : loadPos();

  // ------------------------------------------------------------ the netter on the jetty
  const NET = { x: 856, y: SHORE - 6 };
  const net = { a: -0.28, v: 0, load: 0, catch: 0, lunge: 0, blink: Drawn.blinker(), next: 4 };
  const jetty = { waiting: true };
  DH.jettyTake = () => { jetty.waiting = false; };
  layer({
    id: 'jetty', z: 13.2, still: true,
    draw(g) {
      // a jetty of three twigs on stilts, out over the water
      for (const [x0, x1, y] of [[820, 880, SHORE - 4], [826, 884, SHORE - 1]]) {
        g.lineWidth = 6; g.strokeStyle = LINE; g.beginPath(); g.moveTo(x0, y); g.lineTo(x1, y - 2); g.stroke();
        g.lineWidth = 3.6; g.strokeStyle = '#7a5440'; g.stroke();
        g.lineWidth = 1; g.strokeStyle = 'rgba(255,200,140,0.7)'; g.beginPath(); g.moveTo(x0, y - 1.3); g.lineTo(x1, y - 3.3); g.stroke();
      }
      for (const x of [828, 850, 872]) { g.lineWidth = 3; g.strokeStyle = LINE; g.beginPath(); g.moveTo(x, SHORE - 4); g.lineTo(x + 1, SHORE + 22); g.stroke(); g.lineWidth = 1.6; g.strokeStyle = '#5a3a2c'; g.stroke(); }
      // drops waiting on the jetty for the haulers

    },
  });
  DH.mirror(SHORE + 2, (g) => { for (const x of [828, 850, 872]) { g.lineWidth = 3; g.strokeStyle = '#3a2430'; g.beginPath(); g.moveTo(x, SHORE - 4); g.lineTo(x + 1, SHORE + 22); g.stroke(); } });

  const netEnd = () => { const L = 210; return [NET.x + 6 + Math.sin(net.a) * L, NET.y - 14 - Math.cos(net.a) * L]; };
  layer({
    id: 'netter', z: 13.5,
    hit(x, y) {
      const [nx, ny] = netEnd();
      return Math.hypot(x - NET.x, y - NET.y + 10) < 26 || Math.hypot(x - nx, y - ny) < 30;
    },
    onEnter() { net.lunge = 1; net.v -= 1.6; },
    update(dt, t, L) {
      const w = Drawn.wind(t, NET.x);
      const target = -0.3 + (w - 0.6) * 0.06 + Math.sin(t * 0.8) * 0.04 - net.lunge * 0.25 + net.load * 0.12;
      net.v += (-(net.a - target) * 18 - net.v * 3.2) * dt;
      net.a += net.v * dt;
      net.lunge = Math.max(0, net.lunge - dt * 1.4);
      if ((net.next -= dt) <= 0 || (net.lunge > 0.5 && net.load < 0.5)) { net.next = 6 + Math.random() * 5; net.catch = 1; }
      if (net.catch > 0) { net.catch -= dt * 1.5; if (net.catch <= 0) { net.load = 1; net.v += 0.5; } }
      if (net.load > 0) { net.load = Math.max(0, net.load - dt * 0.12); if (net.load < 0.3 && !jetty.waiting) { jetty.waiting = true; net.load = 0; } }
    },
    draw(g, t) {
      if (jetty.waiting) DH.glassDrop(g, 838, SHORE - 14, 9, { flat: 0.6, bright: 0.5 });
      const [nx, ny] = netEnd();
      // the pole: a long grass stem, bowing under the net
      g.lineCap = 'round';
      const bx = NET.x + 6, by = NET.y - 14;
      const mx = (bx + nx) / 2 - 8 - net.load * 6, my = (by + ny) / 2 + 6;
      g.lineWidth = 4.6; g.strokeStyle = LINE; g.beginPath(); g.moveTo(bx, by); g.quadraticCurveTo(mx, my, nx, ny); g.stroke();
      g.lineWidth = 2.6; g.strokeStyle = '#b8a45a'; g.stroke();
      g.lineWidth = 1; g.strokeStyle = 'rgba(255,230,160,0.9)'; g.beginPath(); g.moveTo(bx - 0.6, by); g.quadraticCurveTo(mx - 0.8, my, nx - 0.6, ny); g.stroke();
      // the net: a hoop of grass seen from below, its mesh bag hanging
      const sag = 18 + net.load * 10;
      const bag = new Path2D(); bag.moveTo(nx - 22, ny); bag.quadraticCurveTo(nx - 18, ny + sag, nx + 2, ny + sag + 2); bag.quadraticCurveTo(nx + 20, ny + sag, nx + 22, ny); bag.closePath();
      g.fillStyle = 'rgba(200,180,120,0.18)'; g.fill(bag);
      g.save(); g.clip(bag);
      g.lineWidth = 0.7; g.strokeStyle = 'rgba(220,200,140,0.9)';
      for (let i = -5; i <= 5; i++) { g.beginPath(); g.moveTo(nx + i * 4.4, ny); g.lineTo(nx + i * 1.5, ny + sag + 4); g.stroke(); }
      for (let j = 1; j < 5; j++) { g.beginPath(); g.ellipse(nx, ny + j * sag / 5, 22 - j * 3.5, 2.5, 0, 0, Math.PI); g.stroke(); }
      g.restore();
      g.lineWidth = 1.2; g.strokeStyle = LINE; g.stroke(bag);
      if (net.load > 0.02) DH.glassDrop(g, nx + 1, ny + sag - 6, 7 * Math.min(1, net.load * 3), { flat: 0.7, bright: 0.6 });
      g.lineWidth = 3.4; g.strokeStyle = LINE; g.beginPath(); g.ellipse(nx, ny, 22, 4.5, 0, 0, TAU); g.stroke();
      g.lineWidth = 1.8; g.strokeStyle = '#c8b06a'; g.stroke();
      // a drop falling into the net
      if (net.catch > 0) DH.fallingDrop(g, nx + 3, ny - 40 * net.catch - 4, 3.4, 30, 900, DH.sunNear(nx, ny), 1);
      // the netter, leaning back to hold the pole up
      DH.bug(g, NET.x, NET.y - 2, 1.3, { dir: -1, rot: 0.1 + net.lunge * 0.2, open: net.blink(t), look: [0.8, -1], hat: '#c89a4a', smile: net.load > 0.5 ? 1.2 : 0, walk: net.lunge > 0 ? t : null });
    },
  });

  // ------------------------------------------------------------ the tally-keeper
  const TX = 1098, TY = DH.ridgeY(1098) + 1;
  layer({
    id: 'tally', z: 12.2,
    hit: (x, y) => Math.hypot(x - TX, y - TY + 18) < 24,
    update(dt, t, L) {
      tally.raise = ease(tally.raise, L.hovered ? 1 : 0, 4, dt);
      tally.notch = Math.max(0, tally.notch - dt * 1.6);
    },
    draw(g, t) {
      // a pebble seat
      const peb = DH.blob(TX, TY - 5, 16, 9, 8, 0.15, 3);
      ink(g, peb, '#5b5266', 1.6); DH.crescent(g, peb, '#3a3046', 0, -2.5); DH.rim(g, peb, TX, 2);
      const sx = TX - 2, sy = TY - 13;
      const look = DH.underUmbrella(sx, sy) > 0.2 ? [0.1, -1] : tally.raise > 0.4 ? [1, -0.4] : [-0.8, -0.6];
      DH.bug(g, sx, sy, 1.1, { dir: -1, open: tally.blink(t), look, hat: '#8a6a3a', smile: tally.raise * 1.5 + tally.notch });
      // the tally: a grass blade notched in fives, held up when you look
      const a = -1.1 + tally.raise * 0.9 - tally.notch * 0.3;
      g.save(); g.translate(sx - 14, sy - 8); g.rotate(a);
      const L = 40;
      const blade = poly([[0, -1.6], [L, -0.8], [L + 4, 0], [L, 0.8], [0, 1.6]]);
      ink(g, blade, '#a8b05a', 1);
      g.lineWidth = 0.8; g.strokeStyle = LINE;
      const marks = Math.min(22, tally.n);
      for (let i = 0; i < marks; i++) { const x = 3 + i * 1.2; if (i % 5 === 4) { g.beginPath(); g.moveTo(x - 4.8, 1.4); g.lineTo(x + 0.4, -1.4); g.stroke(); } else { g.beginPath(); g.moveTo(x, -1.2); g.lineTo(x, 1.2); g.stroke(); } }
      g.restore();
    },
  });
})();
