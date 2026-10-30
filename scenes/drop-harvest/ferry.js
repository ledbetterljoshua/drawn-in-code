/* ferry.js — life on the open water.
     · the ferry: a banded snail poling a curled willow leaf across the puddle, slow as anything,
       with a passenger under a petal and a seed for luggage. It crosses the glitter path, so for a
       while it's a silhouette against the sun's reflection. Its reflection wavers under it;
     · a water strider skating about on dimpled feet in front of the island, keeping clear of the
       pointer.

   Hover the ferry: the snail rings its bell (a hanging seed husk), its eyestalks duck in and out,
   and the boat rocks. Hover the strider: it skates off in a hurry, rings spreading from its feet.

   ferry z14 · strider z14.2 */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, circ, ell, poly, curve, grad, radial, ink, st, P, layer } = Drawn;
  const { C, SUN, LINE, FAR, SHORE } = DH;

  const boat = { x: 430, dir: 1, rock: DH.spring(40, 2.5), bell: 0, eyes: 1, pole: 0, blink: Drawn.blinker(), blinkP: Drawn.blinker() };
  const BY = 930;
  const SNAIL = { shell: '#f1dcb0', band: '#6a3a2e', body: '#b49a86', bodyShade: '#7e6a60' };

  function drawBoat(g, t, x, y, refl) {
    const tilt = boat.rock.x * 0.05 + Math.sin(t * 1.3) * 0.02;
    g.save(); g.translate(x, y); g.rotate(tilt); g.scale(boat.dir, 1);
    // the willow-leaf hull, sides curled up, seen nearly side-on
    const hull = new Path2D();
    hull.moveTo(-64, -10); hull.quadraticCurveTo(-30, 8, 10, 7); hull.quadraticCurveTo(48, 6, 70, -14);
    hull.quadraticCurveTo(40, -4, 0, -5); hull.quadraticCurveTo(-36, -5, -64, -10); hull.closePath();
    g.lineWidth = 2.4; g.strokeStyle = LINE; g.stroke(hull);
    g.fillStyle = grad(g, 0, -10, 0, 8, ['#c8a040', '#8a6a2c', '#4a3a24']); g.fill(hull);
    g.lineWidth = 1; g.strokeStyle = 'rgba(60,40,20,0.7)';
    g.beginPath(); g.moveTo(-60, -9); g.quadraticCurveTo(0, 2, 66, -12); g.stroke();
    for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * 13, 0); g.lineTo(i * 13 + 8, -5); g.stroke(); }
    DH.crescent(g, hull, 'rgba(255,214,140,0.9)', 0, 2.5);
    if (!refl) {
      // passenger: a pill-bug under a rose-petal brolly, a seed for luggage
      ink(g, ell(26, -9, 8, 5), '#4a3424', 1.4);
      g.fillStyle = 'rgba(255,220,160,0.5)'; g.fill(ell(24, -11, 4, 1.4));
      DH.bug(g, 8, -5, 0.8, { dir: 1, open: boat.blinkP(t), look: DH.underUmbrella(x, y - 20) > 0.2 ? [0, -1] : [0.6, -0.3] });
      g.lineWidth = 1.2; g.strokeStyle = '#7a5a3a'; g.beginPath(); g.moveTo(14, -12); g.lineTo(10, -38); g.stroke();
      const petal = new Path2D(); petal.moveTo(-8, -34); petal.quadraticCurveTo(10, -54, 30, -36); petal.quadraticCurveTo(10, -38, -8, -34); petal.closePath();
      ink(g, petal, '#e8768a', 1.5);
      DH.crescent(g, petal, '#b04a64', 0, -3);
      DH.crescent(g, petal, 'rgba(255,230,190,0.9)', -DH.sunSide(x) * boat.dir * 2, 1);
      // the snail at the stern
      const sx = -38, sy = -7;
      const foot = new Path2D(); foot.moveTo(sx - 18, sy + 1); foot.quadraticCurveTo(sx, sy + 4, sx + 18, sy); foot.quadraticCurveTo(sx + 26, sy - 2, sx + 22, sy - 12);
      foot.quadraticCurveTo(sx + 16, sy - 18, sx + 12, sy - 8); foot.quadraticCurveTo(sx, sy - 6, sx - 18, sy + 1); foot.closePath();
      ink(g, foot, SNAIL.body, 1.6);
      DH.crescent(g, foot, SNAIL.bodyShade, 0, -2.5);
      g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill(ell(sx + 8, sy - 5, 6, 1.2));
      // eyestalks (they duck when the bell rings)
      const e = boat.eyes;
      for (const [ox, ln] of [[18, 16], [22, 13]]) {
        const ex = sx + ox + 4 * e, ey = sy - 12 - ln * e;
        g.lineWidth = 2.2; g.strokeStyle = SNAIL.body; g.beginPath(); g.moveTo(sx + ox - 2, sy - 12); g.lineTo(ex, ey); g.stroke();
        g.lineWidth = 0.9; g.strokeStyle = LINE; g.stroke();
        ink(g, circ(ex, ey, 2.2), SNAIL.body, 1);
        if (e > 0.5) { g.fillStyle = LINE; g.fill(circ(ex + 0.5, ey, 1.1 * boat.blink(t))); }
      }
      // shell: a banded spiral
      const shell = circ(sx - 4, sy - 18, 15);
      ink(g, shell, SNAIL.shell, 2);
      g.save(); g.clip(shell);
      g.lineWidth = 3; g.strokeStyle = SNAIL.band;
      g.beginPath();
      for (let a = 0; a < TAU * 2.4; a += 0.15) { const rr = 14 - a * 0.9; g.lineTo(sx - 4 + Math.cos(a + 2) * rr, sy - 18 + Math.sin(a + 2) * rr); }
      g.stroke();
      g.fillStyle = 'rgba(80,50,60,0.4)'; g.fill(DH.shift(shell, 6, 3));
      g.restore();
      DH.rim(g, shell, x, 3);
      g.fillStyle = 'rgba(255,250,230,0.7)'; g.fill(ell(sx - 10, sy - 26, 4, 2.2, undefined, -0.5));
      // the bell on a hook at the bow: a little seed husk
      const bx = 58, by = -30;
      g.lineWidth = 1.4; g.strokeStyle = '#6a4a2a'; g.beginPath(); g.moveTo(52, -10); g.lineTo(54, -34); g.lineTo(bx, -34); g.stroke();
      g.save(); g.translate(bx, by); g.rotate(Math.sin(t * 14) * 0.4 * boat.bell);
      const bl = new Path2D(); bl.moveTo(-3, 0); bl.quadraticCurveTo(-5, 7, -5, 9); bl.lineTo(5, 9); bl.quadraticCurveTo(5, 7, 3, 0); bl.closePath();
      ink(g, bl, '#c8a050', 1.1);
      g.restore();
      // the pole: a pine needle, worked in a slow rhythm
      const pa = -0.35 + Math.sin(boat.pole) * 0.18;
      g.save(); g.translate(sx + 14, sy - 10); g.rotate(pa);
      g.lineWidth = 3; g.strokeStyle = LINE; g.beginPath(); g.moveTo(0, -24); g.lineTo(0, 60); g.stroke();
      g.lineWidth = 1.6; g.strokeStyle = '#7a8a3a'; g.stroke();
      g.restore();
    }
    g.restore();
  }

  layer({
    id: 'ferry', z: 14,
    hit: (x, y) => Math.abs(x - boat.x) < 76 && y > BY - 56 && y < BY + 12,
    onEnter() { boat.bell = 1; boat.rock.v += 2; },
    update(dt, t, L) {
      // across and back, slow as a snail
      boat.x += boat.dir * dt * 4.5;
      if (boat.x > 790) boat.dir = -1; if (boat.x < 380) boat.dir = 1;
      boat.pole += dt * 1.1;
      boat.rock.step(dt);
      boat.bell = Math.max(0, boat.bell - dt * 0.7);
      boat.eyes = ease(boat.eyes, boat.bell > 0.3 ? 0.15 : 1, 5, dt);
      if (Math.random() < dt * 1.4) DH.spawn({ kind: 'ring', x: boat.x - boat.dir * 66, y: BY + 4, r: 2, k: DH.persp(BY), life: 1.4, g: 0, z: 'water' });
    },
    draw(g, t) {
      // reflection first: the hull and a smear of the passengers, flipped
      g.save(); g.globalAlpha = 0.35;
      g.translate(0, BY * 2 + 8); g.scale(1, -1);
      drawBoat(g, t, boat.x, BY, true);
      g.restore();
      // the waterline
      g.fillStyle = 'rgba(255,220,160,0.35)'; g.fill(ell(boat.x, BY + 6, 58, 2));
      drawBoat(g, t, boat.x, BY, false);
    },
  });

  // ------------------------------------------------------------ the water strider
  const sk = { x: 1260, y: 1010, vx: 0, vy: 0, a: 0, flee: 0, next: 2 };
  layer({
    id: 'strider', z: 14.2,
    hit: (x, y) => Math.hypot(x - sk.x, (y - sk.y) * 1.6) < 40,
    onEnter() { const a = Math.atan2(sk.y - P.y, sk.x - P.x) || 0; sk.vx += Math.cos(a) * 260; sk.vy += Math.sin(a) * 60; sk.flee = 1; },
    update(dt, t) {
      // little skating hops, keeping clear of the pointer, staying in front of the island
      if ((sk.next -= dt) <= 0) { sk.next = 1.5 + Math.random() * 3; sk.vx += (Math.random() - 0.5) * 120; sk.vy += (Math.random() - 0.5) * 20; for (const s of [-1, 1]) DH.spawn({ kind: 'ring', x: sk.x + s * 16, y: sk.y + 2, r: 1.6, k: DH.persp(sk.y), life: 1, g: 0, z: 'water' }); }
      const d = Math.hypot(P.x - sk.x, P.y - sk.y);
      if (d < 120 && P.inside) { sk.vx += (sk.x - P.x) / d * 200 * dt; }
      sk.vx *= Math.exp(-2.4 * dt); sk.vy *= Math.exp(-2.4 * dt);
      sk.x += sk.vx * dt; sk.y += sk.vy * dt;
      sk.x = clamp(sk.x, 1000, 1560); sk.y = clamp(sk.y, 960, 1080);
      if (Math.abs(sk.vx) > 5) sk.a = ease(sk.a, sk.vx > 0 ? 0 : Math.PI, 3, dt);
      sk.flee = Math.max(0, sk.flee - dt);
    },
    draw(g, t) {
      const { x, y } = sk, f = Math.cos(sk.a) >= 0 ? 1 : -1;
      // dimples where its feet press the surface
      const feet = [[-22, 3], [-8, 5], [14, 5], [26, 2], [-14, -2], [20, -1]];
      for (const [fx, fy] of feet) {
        const px = x + fx * f, py = y + fy;
        g.fillStyle = 'rgba(20,18,40,0.5)'; g.fill(ell(px, py + 1, 4, 1.2));
        g.lineWidth = 0.8; g.strokeStyle = 'rgba(220,214,250,0.7)'; g.beginPath(); g.ellipse(px, py, 4.5, 1.4, 0, Math.PI, TAU); g.stroke();
      }
      g.lineWidth = 1.1; g.strokeStyle = LINE;
      for (const [fx, fy] of feet) { const px = x + fx * f, py = y + fy; g.beginPath(); g.moveTo(x + fx * 0.2 * f, y - 7); g.quadraticCurveTo(x + fx * 0.6 * f, y - 14, px, py); g.stroke(); }
      const body = ell(x, y - 8, 11, 2.6);
      ink(g, body, '#4a3a3a', 1.2);
      ink(g, circ(x + 11 * f, y - 9, 2.4), '#4a3a3a', 1);
      g.fillStyle = '#fff'; g.fill(circ(x + 12 * f, y - 10, 0.8));
      DH.crescent(g, body, 'rgba(255,214,140,0.8)', 0, 1.2);
      // its reflection
      g.globalAlpha = 0.25; g.fillStyle = '#4a3a3a'; g.fill(ell(x, y + 6, 11, 2)); g.globalAlpha = 1;
    },
  });
})();
