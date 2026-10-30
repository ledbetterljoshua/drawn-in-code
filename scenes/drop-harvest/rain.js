/* rain.js — the main character. Rain at four depths, all leaning into the shared wind and
   swelling and easing with the storm:
     back  (z6)  fine streaks behind everything, landing at the far bank;
     mid   (z9)  streaks landing all over the puddle (rings, small crowns);
     near  (z22) bun-shaped drops landing on whatever is there: the island, the caps, the Great
                 Leaf (which shelters what's under it), the water;
     fore  (z31) a few big drops falling right past the camera, with crowns and jets.
   Streaks in front of the rift glow gold (forward-scattered sun); the rest are pale lilac.
   Density sweeps across in curtains with the gusts.

   The pointer carries an umbrella: near and fore rain splashes off an invisible dome over it,
   beads run down the dome and drip off its rim, and whoever is under it looks up.

   Also here: every splash, crown, ring and spray particle in the scene (DH.fx). */
(function () {
  const { TAU, clamp, lerp, ease, rng, noise, hash, circ, ell, poly, curve, grad, radial, st, P, layer, onLayout } = Drawn;
  const { C, SUN, HZ, FAR, SHORE, UMB } = DH;

  const bands = {
    back: { n: 260, sp: 1500, len: [16, 34], w: 0.9, y: () => FAR - 4 + Math.random() * 10, list: [] },
    mid: { n: 200, sp: 1350, len: [24, 46], w: 1.15, y: () => FAR + 8 + Math.random() ** 1.6 * 330, list: [] },
    near: { n: 64, sp: 1150, r: [2, 3.6], y: () => SHORE + 10 + Math.random() * 340, list: [] },
    fore: { n: 9, sp: 1050, r: [5, 8.5], y: () => 1020 + Math.random() * 260, list: [] },
  };

  function reset(b, d, first) {
    const v = st.view;
    d.x = lerp(v.x0 - 200, v.x1 + 60, Math.random());
    d.land = b.y();
    d.y = first ? lerp(v.y0 - 60, d.land, Math.random()) : v.y0 - 40 - Math.random() * 300;
    d.r = b.r ? lerp(b.r[0], b.r[1], Math.random()) : 0;
    d.len = b.len ? lerp(b.len[0], b.len[1], Math.random()) : 0;
    d.vy = b.sp * (0.85 + Math.random() * 0.3);
    d.live = true;
  }
  onLayout(() => {
    for (const k in bands) {
      const b = bands[k];
      b.list.length = 0;
      for (let i = 0; i < b.n; i++) { const d = { seed: Math.random() }; reset(b, d, true); b.list.push(d); }
    }
  });

  // curtains of rain sweeping across with the wind
  const curtain = (x, t) => 0.55 + 0.45 * Math.sin((x - t * 150) * 0.0042 + noise(t * 0.1) * 2);

  function landAt(x, band) {
    let best = null, by = Infinity;
    for (const s of DH.surfaces) {
      if (s.band !== band || x < s.x0 || x > s.x1) continue;
      const y = s.y(x);
      if (y != null && y < by) { by = y; best = s; }
    }
    return best ? [best, by] : null;
  }

  function umbrellaHit(d, dt) {
    if (!UMB.on) return false;
    const cx = UMB.x, cy = UMB.y + 6, R = UMB.r;
    const dx = d.x - cx, dy = d.y - cy;
    if (dy > 0 || dx * dx + dy * dy > R * R) return false;
    const a = Math.atan2(dy, dx);
    const hx = cx + Math.cos(a) * R, hy = cy + Math.sin(a) * R;
    UMB.glow = Math.min(1, UMB.glow + 0.22);
    UMB.hits.push({ a, age: 0 });
    for (let i = 0; i < 3 + d.r; i++) {
      const sa = a + (Math.random() - 0.5) * 1.4, sp = 80 + Math.random() * 120;
      DH.spawn({ kind: 'spray', x: hx, y: hy, vx: Math.cos(sa) * sp + d.vy * DH.slant(st.t) * 0.1, vy: Math.sin(sa) * sp - 40, r: 0.7 + Math.random() * d.r * 0.2, life: 0.4, g: 1100, z: d.band === 'fore' ? 'fore' : 'mid' });
    }
    if (Math.random() < 0.6) DH.spawn({ kind: 'runner', a, side: Math.sign(dx) || 1, va: 0, r: 1.4 + d.r * 0.25, life: 3, g: 0, z: 'mid' });
    return true;
  }

  function step(b, name, dt, t) {
    const I = DH.intensity(t);
    const active = Math.round(b.n * clamp(I, 0.3, 1.6) / 1.6);
    const sl = DH.slant(t);
    for (let i = 0; i < b.list.length; i++) {
      const d = b.list[i];
      d.band = name;
      d.on = i < active;
      d.vx = d.vy * DH.slant(t, d.x);
      d.x += d.vx * dt; d.y += d.vy * dt;
      if ((name === 'near' || name === 'fore') && umbrellaHit(d, dt)) { reset(b, d); continue; }
      if (name === 'near' || name === 'fore') {
        const L = landAt(d.x, name);
        if (L && d.y >= L[1]) { if (d.on) L[0].hit(d.x, L[1], d); reset(b, d); continue; }
      }
      if (d.y >= d.land) {
        if (d.on) {
          if (name === 'back') { if (Math.random() < 0.25) DH.spawn({ kind: 'ring', x: d.x, y: d.land, r: 1.2, k: DH.persp(d.land), life: 0.6, g: 0, z: 'water' }); }
          else if (name === 'mid') { DH.spawn({ kind: 'ring', x: d.x, y: d.land, r: 1.6 + Math.random() * 1.4, k: DH.persp(d.land), life: 0.9, g: 0, z: 'water' }); if (Math.random() < 0.35) DH.spawn({ kind: 'crown', x: d.x, y: d.land, r: 1.8, life: 0.22, g: 0, z: 'back' }); }
          else DH.splash(d.x, d.land, name === 'fore' ? d.r : d.r * 0.9, 'water', name === 'fore' ? 'fore' : 'mid');
        }
        reset(b, d);
      }
    }
  }

  function drawStreaks(g, b, t, alpha) {
    const flash = DH.storm.flash, sun = DH.storm.sun;
    // three buckets: gold (by the sun), pale, and faint (between curtains)
    const gold = new Path2D(), pale = new Path2D(), faint = new Path2D();
    for (const d of b.list) {
      if (!d.on) continue;
      const len = d.len * (1 + d.vy / 3000);
      const ux = d.vx / d.vy;
      const x0 = d.x - ux * len, y0 = d.y - len;
      const glow = DH.sunNear(d.x, Math.min(d.y, 680)) * (d.y > 440 ? 1 : 0.3);
      const dens = curtain(d.x, t);
      const p = glow > 0.35 - sun * 0.15 ? gold : dens > 0.45 ? pale : faint;
      p.moveTo(x0, y0); p.lineTo(d.x, d.y);
    }
    g.lineCap = 'round';
    g.lineWidth = b.w;
    g.strokeStyle = `rgba(212,206,240,${(0.2 + flash * 0.3) * alpha})`; g.stroke(faint);
    g.strokeStyle = `rgba(226,220,250,${(0.46 + flash * 0.35) * alpha})`; g.stroke(pale);
    g.save(); g.globalCompositeOperation = 'lighter';
    g.strokeStyle = `rgba(255,214,140,${(0.42 + sun * 0.3) * alpha})`; g.stroke(gold);
    g.restore();
  }

  // ------------------------------------------------------------ fx
  function stepFx(dt) {
    const fx = DH.fx;
    for (let i = fx.length - 1; i >= 0; i--) {
      const p = fx[i];
      p.age += dt;
      if (p.kind === 'runner') {
        // a bead sliding down the dome, faster as it goes, dripping off the rim
        p.va += 2.4 * dt * p.side;
        p.a += p.va * dt;
        const rimA = p.side > 0 ? -0.05 : -Math.PI + 0.05;
        if ((p.side > 0 && p.a >= rimA) || (p.side < 0 && p.a <= rimA) || !UMB.on) {
          const x = UMB.x + Math.cos(p.a) * UMB.r, y = UMB.y + 6 + Math.sin(p.a) * UMB.r;
          if (UMB.on) DH.spawn({ kind: 'drip', x, y, vx: p.side * 20, vy: 30, r: p.r, life: 1.2, g: 1500, z: 'mid', land: Math.max(y + 40, DH.groundAt ? DH.groundAt(x) : SHORE + 60) });
          fx.splice(i, 1); continue;
        }
      } else if (p.g) {
        p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.kind === 'drip' && p.land && p.y >= p.land) { if (p.cistern && DH.cisternPlink) { DH.cisternPlink(p.x, p.r); fx.splice(i, 1); continue; } DH.splash(p.x, p.land, p.r * 0.8, p.land > SHORE ? 'water' : 'ground', 'mid'); fx.splice(i, 1); continue; }
      }
      if (p.age >= p.life) fx.splice(i, 1);
    }
  }

  function drawFx(g, z) {
    for (const p of DH.fx) {
      if (p.z !== z) continue;
      const k = p.age / p.life;
      if (p.kind === 'crown') {
        const r = p.r, h = r * 3.4 * Math.sin(Math.min(1, k * 1.15) * Math.PI), w = r * (1.3 + k * 2.6);
        const pk = DH.persp(p.y);
        const glow = DH.sunNear(p.x, 640);
        g.globalAlpha = 1 - k * 0.6;
        // the cup of the crown
        const n = 7, path = new Path2D();
        path.moveTo(p.x - w, p.y);
        for (let i = 0; i <= n; i++) {
          const u = i / n, x = p.x - w + u * w * 2;
          const tip = p.y - h * (0.75 + 0.25 * hash(i + p.x));
          path.lineTo(x - w * 0.06, p.y - h * 0.35);
          path.lineTo(x, tip);
          path.lineTo(x + w * 0.06, p.y - h * 0.35);
        }
        path.lineTo(p.x + w, p.y);
        path.ellipse(p.x, p.y, w, w * pk, 0, 0, Math.PI);
        g.fillStyle = glow > 0.3 ? 'rgba(255,220,160,0.55)' : 'rgba(206,198,232,0.5)'; g.fill(path);
        g.lineWidth = 0.7; g.strokeStyle = 'rgba(37,24,40,0.45)'; g.stroke(path);
        // droplets flung from the tips
        if (r > 2.5) {
          g.fillStyle = glow > 0.3 ? 'rgba(255,236,190,0.9)' : 'rgba(236,232,250,0.85)';
          for (let i = 0; i <= n; i += 2) { const u = i / n; g.fill(circ(p.x - w * 1.1 + u * w * 2.2, p.y - h * 1.05 - k * r * 2, 0.5 + r * 0.12)); }
        }
        // the jet that rises after the crown falls, on big drops
        if (r > 4.5 && k > 0.45) {
          const j = Math.sin((k - 0.45) / 0.55 * Math.PI), jh = r * 5 * j;
          g.fillStyle = 'rgba(214,208,240,0.7)';
          g.fill(poly([[p.x - r * 0.35, p.y], [p.x - r * 0.12, p.y - jh], [p.x + r * 0.12, p.y - jh], [p.x + r * 0.35, p.y]]));
          DH.glassDrop(g, p.x, p.y - jh - r * 0.5, r * 0.45);
        }
        g.globalAlpha = 1;
      } else if (p.kind === 'spray' || p.kind === 'drip') {
        const a = p.kind === 'drip' ? 1 : (1 - k) * 0.9;
        const glow = DH.sunNear(p.x, Math.min(p.y, 680));
        g.fillStyle = glow > 0.35 ? `rgba(255,224,160,${a})` : `rgba(226,222,246,${a})`;
        if (p.kind === 'drip') DH.fallingDrop(g, p.x, p.y, p.r, p.vx, p.vy + 1, glow, 1);
        else g.fill(circ(p.x, p.y, p.r));
      } else if (p.kind === 'ring' && p.z === z) {
        // rings on the ground plane in front of the island (fore puddle)
        const rx = p.r * (1.5 + k * 9) + k * 8, ry = rx * p.k;
        g.lineWidth = 1 + p.r * 0.1; g.strokeStyle = `rgba(214,206,240,${(1 - k) ** 2 * 0.6})`;
        g.beginPath(); g.ellipse(p.x, p.y, rx, ry, 0, 0, TAU); g.stroke();
      }
    }
  }
  DH.drawFx = drawFx;

  layer({
    id: 'rain-back', z: 6,
    update(dt, t) {
      DH.storm.I = DH.intensity(t);
      // the pointer's umbrella
      UMB.on = P.inside && P.y > st.view.y0 + 20;
      UMB.x = ease(UMB.x < -9000 ? P.x : UMB.x, P.x, 30, dt);
      UMB.y = ease(UMB.y < -9000 ? P.y : UMB.y, P.y, 30, dt);
      UMB.glow = Math.max(0, UMB.glow - dt * 0.9);
      for (const h of UMB.hits) h.age += dt;
      while (UMB.hits.length && UMB.hits[0].age > 0.5) UMB.hits.shift();
      step(bands.back, 'back', dt, t);
      step(bands.mid, 'mid', dt, t);
      step(bands.near, 'near', dt, t);
      step(bands.fore, 'fore', dt, t);
      stepFx(dt);
    },
    draw(g, t) { drawStreaks(g, bands.back, t, 0.8); },
  });
  UMB.hits = [];

  layer({
    id: 'rain-mid', z: 9,
    draw(g, t) { drawStreaks(g, bands.mid, t, 1); drawFx(g, 'back'); },
  });

  layer({
    id: 'rain-near', z: 22,
    draw(g, t) {
      for (const d of bands.near.list) {
        if (!d.on) continue;
        const glow = DH.sunNear(d.x, Math.min(d.y, 680)) * (d.y > 420 ? 1 : 0.4) + DH.storm.sun * 0.2;
        DH.fallingDrop(g, d.x, d.y, d.r, d.vx, d.vy, glow, 0.9);
      }
      drawFx(g, 'mid');
      // the umbrella: a dome you only see where the rain hits it
      if (UMB.on) {
        const cx = UMB.x, cy = UMB.y + 6, R = UMB.r;
        if (UMB.glow > 0.02) {
          g.save();
          g.lineCap = 'round';
          g.lineWidth = 1.6; g.strokeStyle = `rgba(236,232,255,${UMB.glow * 0.28})`;
          g.beginPath(); g.arc(cx, cy, R, Math.PI * 1.04, Math.PI * 1.96); g.stroke();
          g.lineWidth = 3; g.strokeStyle = `rgba(255,236,190,${UMB.glow * 0.14})`;
          g.beginPath(); g.arc(cx, cy, R - 2, Math.PI * 1.15, Math.PI * 1.45); g.stroke();
          g.restore();
        }
        for (const h of UMB.hits) {
          const k = h.age / 0.5;
          g.strokeStyle = `rgba(255,248,230,${(1 - k) * 0.55})`; g.lineWidth = 1.4;
          g.beginPath(); g.arc(cx, cy, R, h.a - 0.12 - k * 0.2, h.a + 0.12 + k * 0.2); g.stroke();
        }
        for (const p of DH.fx) if (p.kind === 'runner') DH.glassDrop(g, cx + Math.cos(p.a) * (R + p.r * 0.6), cy + Math.sin(p.a) * (R + p.r * 0.6), p.r);
      }
    },
  });

  layer({
    id: 'rain-fore', z: 31,
    draw(g, t) {
      for (const d of bands.fore.list) {
        if (!d.on) continue;
        const glow = DH.sunNear(d.x, Math.min(d.y, 680)) * 0.6 + DH.storm.sun * 0.2;
        DH.fallingDrop(g, d.x, d.y, d.r, d.vx, d.vy, glow, 0.85);
      }
      drawFx(g, 'fore');
    },
  });

  DH.bands = bands;
})();
