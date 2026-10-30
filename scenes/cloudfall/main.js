/* main.js — the last layers over everything and the start: golden motes in the low light (z40,
   they swirl round the pointer), the near clouds drifting past below the island and the mist
   where the waterfall meets them (z45, hover one to make it billow), the particles every part
   spawns (z55: hearts, z's, notes, leaves, sparks, drops, a leaping sky-fish), and the grade
   (z60: a vignette and a breath of warmth from the sun's side).

   Everything that reacts, in one place:
   windmill sails race and the whole drawing gets windy · the miller oils the shaft, then a drop
   falls and she wipes her brow · the cottage door opens and a frog waves, then offers tea ·
   grandma peeks out of the upstairs curtains · the weathervane spins · the stargazer's telescope
   follows you, she hops and hearts float up · the washing whips about · the hammock rocks, a heart
   rises, linger and the sleeper wakes · the peach tree shakes, leaves fall, a peach drops and rolls
   · the gardener waters and her cabbages perk up · the bees leave the hive to follow you · the
   sunflowers turn to watch, and nod with a face when you touch one · ripples follow you over the
   pond and the duckling paddles faster, singing · a sky-fish leaps from the waterfall · the
   fisher reels in a catch · the mailbox flag pops up, then a letter pokes out · the rope bridge
   bounces and its lanterns swing · the roots and vines swing with you · the crystals chime · the
   round door opens on a hedgehog, who smiles if you stay · the floating stones drift apart · the
   balloon's burner roars and it strains on its tether, its pilot waving · the flock scatters ·
   clouds billow · motes swirl round the pointer. */
(() => {
const D = Drawn, { TAU, clamp, lerp, ease, rng, noise, wind, circ, ell, poly, ink, grad, radial, lumps, st, P, layer, onLayout, sprite, blit } = D;
const { rgba } = CF;

// ------------------------------------------------------------------ motes
const motes = [];
{ const r = rng(99); for (let i = 0; i < 22; i++) motes.push({ x: 300 + r() * 1000, y: 140 + r() * 600, ph: r() * 10, s: 0.5 + r() * 0.8, ox: 0, oy: 0, glow: 0 }); }
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
      const a = (0.08 + 0.22 * Math.max(0, Math.sin(t * 1.3 + m.ph))) * m.s + m.glow * 0.45, r = 4.5 * m.s + m.glow * 2.5;
      g.fillStyle = radial(g, m.x + m.ox, m.y + m.oy, 0, r, [[0, `rgba(255,236,170,${a})`], [1, 'rgba(255,236,170,0)']]);
      g.fill(circ(m.x + m.ox, m.y + m.oy, r));
    }
    g.restore();
  },
});

// ------------------------------------------------------------------ near clouds, drifting past below
const front = [{ x: 260, y: 1170, w: 620, h: 160, seed: 42, sp: 1.4 }, { x: 1560, y: 1150, w: 640, h: 170, seed: 43, sp: 1.8 }, { x: 760, y: 1330, w: 520, h: 200, seed: 44, sp: 1.1 }, { x: 1180, y: 1380, w: 420, h: 150, seed: 46, sp: 1.3 }, { x: -160, y: 1270, w: 520, h: 150, seed: 45, sp: 1.6 }];
const FRONT = { union: true, line: 'rgba(140,84,120,0.35)', lw: 1.6, shade: '#c891b4', base: '#f9d2c6', lit: '#fff1de' };
onLayout(() => { for (const c of front) { c.cs = CF.cumulusCircles(c.seed, c.w, c.h); c.sp_ = sprite(-c.w * 0.6 - c.h, -c.h * 1.9, c.w * 1.2 + c.h * 2, c.h * 2.6, (g) => {
      lumps(g, c.cs, FRONT);
      g.save(); g.globalCompositeOperation = 'source-atop';
      g.fillStyle = D.grad(g, 0, -c.h * 0.6, 0, c.h * 0.5, [[0, 'rgba(150,100,160,0)'], [1, 'rgba(150,100,160,0.45)']]); g.fillRect(-c.w, -c.h * 0.6, c.w * 2, c.h * 1.2);
      g.fillStyle = radial(g, c.w * 0.25, -c.h * 1.1, 0, c.w * 0.5, [[0, 'rgba(255,220,170,0.4)'], [1, 'rgba(255,220,170,0)']]); g.fillRect(-c.w, -c.h * 2, c.w * 2, c.h * 2);
      g.restore();
    }); c.billow = 0; } });
layer({
  id: 'front-clouds', z: 45,
  hit(x, y) { for (const c of front) if (((x - c.cx) / (c.w * 0.5)) ** 2 + ((y - c.y + c.h * 0.45) / (c.h * 0.6)) ** 2 < 1) return (this.which = c), true; return false; },
  update(dt, t, L) {
    for (const c of front) {
      c.cx = c.x + Math.sin(t * 0.05 * c.sp + c.seed) * 40;
      const on = L.hovered && L.which === c;
      c.billow = ease(c.billow, on ? 1 : 0, on ? 3 : 1.2, dt);
    }
  },
  draw(g, t) {
    // mist rising where the waterfall meets the cloud
    const [lx] = CF.pr(CF.LIP[0], 0, CF.LIP[1]), mx = lx + 40;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 7; i++) { const ph = (t * 0.35 + i / 7) % 1; g.fillStyle = `rgba(255,248,240,${0.2 * Math.sin(ph * Math.PI)})`; g.fill(circ(mx + (i - 3) * 16 + ph * 24, 1165 - ph * 50, 20 + ph * 32)); }
    g.restore();
    // and a scrap of rainbow in it, on the side away from the sun
    g.save(); g.globalAlpha = 0.22 + 0.06 * Math.sin(t * 0.5);
    g.beginPath(); g.rect(mx - 70, 1060, 140, 130); g.clip();
    ['#ff7a7a', '#ffc070', '#fff09a', '#9ae0a0', '#8ab8ff', '#b898f0'].forEach((c, i) => { g.lineWidth = 4; g.strokeStyle = c; g.beginPath(); g.arc(mx - 260, 1460, 420 - i * 4, -1.2, -0.6); g.stroke(); });
    g.restore();
    for (const c of front) {
      const k = 1 + c.billow * (0.05 + 0.015 * Math.sin(t * 3));
      g.save(); g.translate(c.cx, c.y); g.scale(k, k); blit(g, c.sp_); g.restore();
    }
  },
});

// ------------------------------------------------------------------ particles
layer({
  id: 'fx', z: 55,
  update(dt) {
    for (const p of CF.fx) {
      p.age += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
      if (p.kind === 'leaf') { p.vx = Math.sin(p.age * 2.4) * 30 + 16; p.vy = 34; }
    }
    for (let i = CF.fx.length - 1; i >= 0; i--) if (CF.fx[i].age > CF.fx[i].life) CF.fx.splice(i, 1);
  },
  draw(g) {
    for (const p of CF.fx) {
      const k = p.age / p.life, a = Math.min(1, p.age * 5) * (1 - k * k);
      g.save(); g.globalAlpha = a; g.translate(p.x, p.y);
      if (p.kind === 'heart') { const s = 7 * p.size * (0.8 + Math.min(1, p.age * 4) * 0.2); CF.heartPath(g, Math.sin(p.age * 5) * 3, 0, s); g.fillStyle = '#f2788a'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = CF.LINE; g.stroke(); }
      else if (p.kind === 'z' || p.kind === 'note') {
        g.font = `italic 600 ${Math.round(14 * p.size * (0.8 + k * 0.5))}px Georgia, serif`;
        g.fillStyle = p.c || (p.kind === 'z' ? '#5a4a7a' : '#3a2232'); g.textAlign = 'center';
        g.fillText(p.kind === 'z' ? 'z' : '♪', Math.sin(p.age * 3) * 4, 0);
      } else if (p.kind === 'leaf') { g.rotate(p.rot); ink(g, ell(0, 0, 6 * p.size, 3 * p.size), '#7cbc5c', 1.2, '#24392c'); }
      else if (p.kind === 'spark') { g.globalCompositeOperation = 'lighter'; g.fillStyle = '#fff3c0'; g.fill(poly([[0, -6], [1.5, -1.5], [6, 0], [1.5, 1.5], [0, 6], [-1.5, 1.5], [-6, 0], [-1.5, -1.5]])); }
      else if (p.kind === 'drop') { g.fillStyle = 'rgba(170,220,240,0.9)'; g.fill(ell(0, 0, 1.6, 2.6)); }
      else if (p.kind === 'fish') {
        g.rotate(Math.atan2(p.vy, p.vx));
        ink(g, poly([[-8, 0], [-15, -5], [-15, 5]]), '#f2a65e', 1.3);
        ink(g, ell(0, 0, 10, 6), grad(g, 0, -6, 0, 6, ['#ffd48a', '#f29a5e']), 1.4);
        g.fillStyle = CF.LINE; g.fill(circ(5, -1.5, 1.4));
        if (Math.random() < 0.3) CF.spawn({ kind: 'spark', x: p.x, y: p.y, life: 0.5, vy: 10 });
      }
      g.restore();
    }
  },
});

// ------------------------------------------------------------------ the grade
layer({
  id: 'grade', z: 60, still: true,
  draw(g) {
    const v = st.view, cx = (v.x0 + v.x1) / 2, cy = (v.y0 + v.y1) / 2, R = Math.hypot(v.x1 - v.x0, v.y1 - v.y0) / 2;
    g.fillStyle = radial(g, cx, cy, R * 0.5, R * 1.05, [[0, 'rgba(40,24,60,0)'], [1, 'rgba(40,24,60,0.24)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    g.save(); g.globalCompositeOperation = 'soft-light';
    g.fillStyle = radial(g, 1800, 440, 0, 1500, [[0, 'rgba(255,190,120,0.45)'], [1, 'rgba(255,190,120,0)']]);
    g.fillRect(v.x0, v.y0, v.x1 - v.x0, v.y1 - v.y0);
    g.restore();
  },
});

Drawn.start({ W: 1600, H: 1100, slack: 0.72 });
})();
