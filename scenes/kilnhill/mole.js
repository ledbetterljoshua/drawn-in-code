/* mole.js — the rig every mole in Kilnhill is drawn with.
   A mole stands upright, feet at its anchor, ~44 units tall at s = 1, facing right (flip for left).
   Velvet fur takes the firelight as a warm rim on the side facing the fire and falls into cool
   indigo on the far side; the pink hands and snout catch the light more. Every mole blinks on its
   own clock and breathes. Options:
     flip, lean (rad), squash, breathe (0..1 phase-driven), look [-1..1], open (eyes 0..1), smile,
     hands: { f: [x, y], b: [x, y] } front/back hand in mole space (default at the belly),
     apron: colour, cap: colour, specs: true, scarf: colour, sleep: true, mouth (0..1 open),
     snout (sniff offset), lx/ly: world position for lighting (defaults to x, y)
   Returns the world positions of the two hands so callers can draw the tools they hold. */
(function () {
  const { clamp, lerp, circ, ell, curve, poly, grad } = Drawn;
  const K = window.Kiln, M = K.M;

  // direction (unit) toward where most of the light at a point comes from, and how much there is
  K.keyAt = (x, y) => {
    let sx = 0, sy = 0, tot = 0;
    for (const L of K.lights) {
      const dx = L.x - x, dy = L.y - y, d = Math.hypot(dx, dy);
      if (d > L.r || d < 1) continue;
      const f = Math.pow(1 - d / L.r, L.p) * L.k * (L.col[0] + L.col[1]);
      sx += (dx / d) * f; sy += (dy / d) * f; tot += f;
    }
    const m = Math.hypot(sx, sy) || 1;
    return { dx: sx / m, dy: sy / m, I: tot };
  };

  const bodyPts = [[-15, -1], [-19, -13], [-17, -27], [-10, -37], [1, -41], [11, -38], [17, -30], [19, -16], [15, -3], [0, 1]];
  const BODY = curve(bodyPts);
  const APRON = curve([[-4, -27], [10, -27], [15, -16], [15, -5], [8, -1], [-6, -1], [-8, -12]]);

  // a mole's digging paw: a broad pink spade, palm outward, with five short pale claws
  function paw(g, x, y, ang, s, col, line, lw, rim) {
    g.save(); g.translate(x, y); g.rotate(ang);
    const p = curve([[-5, -4.6], [2, -6], [6.6, -3.4], [7.4, 1.6], [4, 5.2], [-3, 5], [-6.4, 1]]);
    g.lineWidth = lw * 2; g.strokeStyle = line; g.stroke(p);
    g.fillStyle = col; g.fill(p);
    if (rim) { g.save(); g.clip(p); g.fillStyle = rim; g.fill(ell(-1, -4.4, 6, 2.4)); g.restore(); }
    g.fillStyle = 'rgba(120,40,50,0.28)'; g.fill(ell(0.6, 1, 3.4, 2.4));
    // claws: short curved wedges along the leading edge
    for (let i = 0; i < 5; i++) {
      const a = -1.05 + i * 0.5, bx = Math.cos(a) * 6.4, by = Math.sin(a) * 4.8;
      const c = poly([[bx - Math.sin(a) * 1.1, by + Math.cos(a) * 1.1], [bx + Math.cos(a) * 3.2, by + Math.sin(a) * 3.2 + 0.6], [bx + Math.sin(a) * 1.1, by - Math.cos(a) * 1.1]]);
      g.fillStyle = '#e8dcc4'; g.fill(c); g.lineWidth = lw * 0.6; g.strokeStyle = line; g.stroke(c);
    }
    g.restore();
  }
  // an arm that tapers from a thick shoulder to the wrist
  function arm(g, x0, y0, x1, y1, w0, w1, fill, line, lw, rim) {
    const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L;
    const mx = (x0 + x1) / 2 + nx * 1.5, my = (y0 + y1) / 2 + ny * 1.5;
    const p = new Path2D();
    p.moveTo(x0 + nx * w0, y0 + ny * w0);
    p.quadraticCurveTo(mx + nx * (w0 + w1) / 2, my + ny * (w0 + w1) / 2, x1 + nx * w1, y1 + ny * w1);
    p.lineTo(x1 - nx * w1, y1 - ny * w1);
    p.quadraticCurveTo(mx - nx * (w0 + w1) / 2, my - ny * (w0 + w1) / 2, x0 - nx * w0, y0 - ny * w0);
    p.closePath();
    g.lineWidth = lw * 2; g.strokeStyle = line; g.stroke(p);
    g.fillStyle = fill; g.fill(p);
    if (rim) { g.lineWidth = 1.4; g.strokeStyle = rim; g.beginPath(); g.moveTo(x0 + nx * w0 * 0.8, y0 + ny * w0 * 0.8 - 0.6); g.quadraticCurveTo(mx + nx * (w0 + w1) / 2 * 0.8, my + ny * (w0 + w1) / 2 * 0.8 - 0.6, x1 + nx * w1 * 0.8, y1 + ny * w1 * 0.8 - 0.6); g.stroke(); }
  }

  K.mole = function (g, x, y, s = 1, o = {}) {
    const lx = o.lx == null ? x : o.lx, ly = o.ly == null ? y - 22 * s : o.ly;
    const key = K.keyAt(lx, ly);
    const flip = o.flip ? -1 : 1;
    // the key direction in mole space
    const kdx = key.dx * flip, kdy = key.dy;
    const I = clamp(key.I * 0.55, 0, 1.6);
    const fur = K.lit(M.fur, lx, ly, [key.dx, key.dy, 0.4]);
    const furShade = K.css(K.mix(K.lit(M.furDark, lx, ly), [0.05, 0.05, 0.12], 0.4));
    const furBase = K.css(fur);
    const rim = K.css(K.mix(fur, [1, 0.7, 0.4], clamp(0.18 + I * 0.9, 0, 0.95)));
    const skin = K.css(K.lit(M.skin, lx, ly, [key.dx, key.dy, 0.6], 0.25));
    const skinRim = K.css(K.mix(K.lit(M.skin, lx, ly), [1, 0.86, 0.7], clamp(I * 0.6, 0, 0.9)));
    const line = K.inkAt(lx, ly, 0.6);
    const lw = 1.7 / s;
    const br = o.breathe == null ? 0 : o.breathe;
    const hands = o.hands || {};
    const hf = hands.f || [12, -14], hb = hands.b || [-8, -15];

    g.save();
    g.translate(x, y);
    g.scale(s * flip, s * (o.squash || 1));
    if (o.lean) g.rotate(o.lean);
    // contact shadow
    g.fillStyle = 'rgba(8,4,10,0.45)'; g.fill(ell(1, 0.5, 15, 3.2));
    // back arm, behind the body
    g.lineCap = 'round';
    arm(g, -6, -24, hb[0], hb[1], 4.4, 3, furShade, line, lw, null);
    paw(g, hb[0], hb[1], Math.atan2(hb[1] + 24, hb[0] + 6), s, skin, line, lw, null);
    // a stub of a tail
    { const tl = ell(-17, -5, 4, 2.4, undefined, 0.5); g.lineWidth = lw * 2; g.strokeStyle = line; g.stroke(tl); g.fillStyle = skin; g.fill(tl); }
    // feet
    for (const fx of [-7, 6]) { const p = ell(fx + 2, -1, 5.5, 2.6); g.lineWidth = lw * 2; g.strokeStyle = line; g.stroke(p); g.fillStyle = skin; g.fill(p); }
    // body: breathing swells the chest a touch
    g.save();
    g.translate(0, -20); g.scale(1 + br * 0.03, 1 + br * 0.02); g.translate(0, 20);
    g.lineWidth = lw * 2.2; g.strokeStyle = line; g.stroke(BODY);
    g.fillStyle = grad(g, -kdx * 18, -20 - kdy * 18, kdx * 18, -20 + kdy * 18, [[0, furShade], [0.55, furBase], [1, furBase]]);
    g.fill(BODY);
    g.save(); g.clip(BODY);
    // velvet sheen and the warm rim on the fire side
    g.lineWidth = 6;
    g.strokeStyle = grad(g, -kdx * 18, -20 - kdy * 18, kdx * 18, -20 + kdy * 18, [[0, 'rgba(0,0,0,0)'], [0.55, 'rgba(0,0,0,0)'], [1, rim]]);
    g.stroke(BODY);
    g.fillStyle = 'rgba(170,180,230,0.07)'; g.fill(ell(-4, -30, 9, 5)); g.fill(ell(2, -36, 6, 3));
    if (s > 1.4) {
      // velvet: tiny fur strokes just inside the silhouette, lit on the fire side
      g.lineWidth = 0.5; 
      for (let i = 0; i < bodyPts.length; i++) {
        const [ax, ay] = bodyPts[i], [bx, by] = bodyPts[(i + 1) % bodyPts.length];
        for (let k = 0; k < 4; k++) {
          const u = k / 4, px = lerp(ax, bx, u), py = lerp(ay, by, u), nx = px * 0.06, ny = (py + 20) * 0.06;
          const lit = (px * kdx + (py + 20) * kdy) > 4;
          g.strokeStyle = lit ? rim : 'rgba(20,16,30,0.5)';
          g.beginPath(); g.moveTo(px - nx * 0.4, py - ny * 0.4); g.lineTo(px - nx * 1.6 + 0.4, py - ny * 1.6); g.stroke();
        }
      }
    }
    if (o.apron) {
      const ap = K.lit(o.apron, lx, ly, [key.dx, key.dy, 0.7]);
      g.fillStyle = grad(g, -kdx * 14, -14, kdx * 14, -14, [[0, K.css(K.mul(ap, 0.55))], [1, K.css(ap)]]);
      g.fill(APRON);
      // clay smears and the strings
      g.fillStyle = K.css(K.mix(ap, K.lit(M.clay, lx, ly), 0.6), 0.8); g.fill(ell(6, -10, 3.5, 2)); g.fill(ell(10, -18, 2, 1.4));
      g.lineWidth = 0.9; g.strokeStyle = line; g.stroke(APRON);
      g.beginPath(); g.moveTo(-4, -27); g.quadraticCurveTo(-10, -26, -15, -20); g.stroke();
    }
    g.restore();
    if (o.scarf) {
      const sc = K.css(K.lit(o.scarf, lx, ly, [key.dx, key.dy, 0.7]));
      const p = curve([[-13, -30], [0, -27], [14, -30], [14, -26], [0, -23], [-14, -26]]);
      g.lineWidth = lw * 2; g.strokeStyle = line; g.stroke(p); g.fillStyle = sc; g.fill(p);
      const tail = poly([[-10, -27], [-16, -14], [-11, -13], [-7, -25]]);
      g.stroke(tail); g.fill(tail);
    }
    g.restore();

    // head details: snout, eyes, whiskers, mouth
    const sn = o.snout || 0;
    const snout = curve([[13, -36], [19.5, -34.5 + sn * 0.4], [24, -32 + sn], [23.6, -29.6 + sn], [18.5, -28.6], [14, -29.4]]);
    g.lineWidth = lw * 2; g.strokeStyle = line; g.stroke(snout);
    g.fillStyle = skin; g.fill(snout);
    g.save(); g.clip(snout); g.fillStyle = skinRim; g.fill(ell(18 + kdx * 3, -33 - Math.max(0, -kdy) * 2, 5, 2.2)); g.restore();
    g.fillStyle = K.css(K.lit('#c05a64', lx, ly)); g.fill(ell(23.8, -31 + sn, 2.1, 1.9));
    g.lineWidth = 0.6; g.strokeStyle = 'rgba(255,230,220,0.55)';
    g.strokeStyle = 'rgba(255,230,220,0.3)'; for (const [a, b] of [[-36, -38], [-32, -31], [-30, -25]]) { g.beginPath(); g.moveTo(21, -31 + sn); g.quadraticCurveTo(26, (a + b) / 2, 30, b + 3); g.stroke(); }
    if (o.mouth) { g.fillStyle = '#5a1a24'; g.fill(ell(17.5, -27.6, 2.8 * o.mouth, 2 * o.mouth)); }
    else { g.lineWidth = 0.9; g.strokeStyle = line; g.beginPath(); g.moveTo(14.5, -28.4); g.quadraticCurveTo(16.5, -26.6 + (o.smile || 0.6) * 1.1, 18.8, -28.4); g.stroke(); }
    const open = o.sleep ? 0 : o.open == null ? 1 : o.open, lk = o.look || [0, 0];
    if (open > 0.3) {
      g.fillStyle = '#05030a'; g.fill(ell(10 + lk[0] * 0.8, -33.6 + lk[1] * 0.6, 1.55, 1.5 * open));
      g.fillStyle = K.css(K.mix([0.8, 0.7, 0.6], [1, 0.85, 0.5], clamp(I, 0, 1))); g.fill(circ(10.6 + lk[0] * 0.8, -34.2 + lk[1] * 0.6, 0.5));
    } else {
      g.lineWidth = 0.9; g.strokeStyle = line; g.beginPath(); g.moveTo(8.2, -33.6); g.quadraticCurveTo(10, -32.2, 11.8, -33.6); g.stroke();
    }
    if (o.specs) {
      const glint = K.css(K.mix([0.7, 0.6, 0.6], [1, 0.9, 0.6], clamp(I * 0.9, 0, 1)), 0.9);
      g.lineWidth = 0.9; g.strokeStyle = '#c8a050';
      g.stroke(circ(10.4, -33.6, 3.4)); g.beginPath(); g.moveTo(7, -34); g.lineTo(-2, -36); g.stroke();
      g.fillStyle = glint; g.fill(ell(11.4, -35, 1.3, 0.8));
    }
    if (o.cap) {
      const cp = K.lit(o.cap, lx, ly, [key.dx, key.dy, 0.6]);
      const p = curve([[-11, -36], [-6, -45], [5, -47], [12, -41], [10, -38], [-2, -39]]);
      g.lineWidth = lw * 2; g.strokeStyle = line; g.stroke(p);
      g.fillStyle = K.css(cp); g.fill(p);
      g.fillStyle = K.css(K.mul(cp, 0.6)); g.fill(curve([[4, -41], [15, -40], [12, -38], [4, -39]]));
    }
    // front arm and paw, in front of everything
    arm(g, 7, -24, hf[0], hf[1], 4.8, 3.2, furBase, line, lw, rim);
    paw(g, hf[0], hf[1], Math.atan2(hf[1] + 24, hf[0] - 7), s, skin, line, lw, skinRim);
    g.restore();
    const W = (p) => [x + p[0] * s * flip, y + p[1] * s * (o.squash || 1)];
    return { f: W(hf), b: W(hb), head: W([12, -34]) };
  };
})();
