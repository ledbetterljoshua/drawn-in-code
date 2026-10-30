/* kit.js — what every Kilnhill part shares: the viewpoint, the fire-light model, colour maths,
   materials, the pendulum and idle-actor rigs, glow sprites and the event bus.

   The light model: every surface is painted as albedo × (night ambient + the fires around it).
   lightAt(x, y) sums the fire sources below, so a brick next to the firemouth and a shingle on the
   far terrace are lit by the same system and agree about where the light comes from.
   The viewpoint: eye level is at y = HZ. rimRy(y, r) gives the half-height of a horizontal circle
   of radius r at height y: negative above eye level (seen from below, rims bow up), positive below. */
(function () {
  const { clamp, lerp, rng, noise, TAU } = Drawn;
  const K = (window.Kiln = {});
  K.W = 1600; K.H = 1200;
  K.HZ = 800;
  // how strongly rims open up with distance from eye level (a gentle, wide-angle feel)
  K.rimRy = (y, r) => r * clamp((y - K.HZ) / 900, -0.42, 0.42);

  // ------------------------------------------------------------------ colour
  const hexCache = new Map();
  K.rgb = (h) => {
    if (Array.isArray(h)) return h;
    let c = hexCache.get(h);
    if (!c) { const n = parseInt(h.slice(1), 16); c = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; hexCache.set(h, c); }
    return c;
  };
  const to255 = (v) => Math.round(clamp(v, 0, 1) * 255);
  K.css = ([r, g, b], a = 1) => (a >= 1 ? `rgb(${to255(r)},${to255(g)},${to255(b)})` : `rgba(${to255(r)},${to255(g)},${to255(b)},${a.toFixed(3)})`);
  K.mix = (a, b, t) => { a = K.rgb(a); b = K.rgb(b); return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; };
  K.mixc = (a, b, t, al) => K.css(K.mix(a, b, t), al);
  K.mul = (a, k) => { a = K.rgb(a); return [a[0] * k, a[1] * k, a[2] * k]; };

  // ------------------------------------------------------------------ the fires
  // col is the light's colour × strength; r its reach. Flicker happens at runtime in light.js;
  // these are the steady values the still layers are painted with.
  K.AMB = [0.13, 0.135, 0.27];
  K.lights = [];
  K.addLight = (o) => { const L = Object.assign({ x: 0, y: 0, z: 70, r: 300, p: 2, col: [1.4, 0.7, 0.3], k: 1, id: '' }, o); K.lights.push(L); return L; };
  // the sum of fire light at a point. n = [nx, ny, nz] is the surface normal in screen space
  // (nz toward the viewer); with it, faces turned away from a fire fall dark. A light's z is how
  // far in front of the surfaces around it the flame sits.
  K.lightAt = (x, y, n, skip) => {
    let r = 0, g = 0, b = 0;
    for (const L of K.lights) {
      if (L === skip || L.k <= 0) continue;
      const dx = L.x - x, dy = L.y - y, d = Math.hypot(dx, dy);
      if (d > L.r) continue;
      let f = Math.pow(1 - d / L.r, L.p) * L.k;
      if (n) { const d3 = Math.hypot(dx, dy, L.z) || 1; f *= 0.18 + 0.82 * Math.max(0, (n[0] * dx + n[1] * dy + (n[2] || 0) * L.z) / d3); }
      r += L.col[0] * f; g += L.col[1] * f; b += L.col[2] * f;
    }
    return [r, g, b];
  };
  const tone = (v) => 1 - Math.exp(-v * 1.55);
  // albedo × (ambient + fire), tone-mapped. extra adds a light of your own on top
  K.lit = (albedo, x, y, n, extra = 0, ambK = 1) => {
    const a = K.rgb(albedo), L = K.lightAt(x, y, n);
    return [tone(a[0] * (K.AMB[0] * ambK + L[0] * (1 + extra))), tone(a[1] * (K.AMB[1] * ambK + L[1] * (1 + extra))), tone(a[2] * (K.AMB[2] * ambK + L[2] * (1 + extra)))];
  };
  K.litc = (albedo, x, y, n, extra, ambK) => K.css(K.lit(albedo, x, y, n, extra, ambK));
  // lit, ignoring one light (a lamp inside a pot doesn't light the pot's own outside)
  K.litSkip = (albedo, x, y, n, skip) => {
    const a = K.rgb(albedo), L = K.lightAt(x, y, n, skip);
    return [tone(a[0] * (K.AMB[0] + L[0])), tone(a[1] * (K.AMB[1] + L[1])), tone(a[2] * (K.AMB[2] + L[2]))];
  };
  // intensity only (0..~2), for deciding rims and glints
  K.glowAt = (x, y) => { const L = K.lightAt(x, y); return (L[0] + L[1] + L[2]) / 3; };
  // the ink line: a deep plum in the dark that warms toward rust near a fire
  K.inkAt = (x, y, k = 1) => K.css(K.mix('#0b0710', '#3e170c', clamp(K.glowAt(x, y) * 1.4 * k, 0, 1)));
  K.LINE = '#0b0710';
  Drawn.style.line = K.LINE;

  // materials (albedo: the colour the thing would be in daylight)
  K.M = {
    brick: '#b45a3c', brick2: '#9c4a34', brick3: '#c4704a', brickBurnt: '#5e3a34', mortar: '#7a6a5e',
    iron: '#3a3a44', soot: '#1a1418',
    clay: '#c89a74', clayPale: '#e2c7a4', clayDark: '#8e6248', terracotta: '#c86a44', slip: '#b8a088',
    glazeTeal: '#3e8c8a', glazeCream: '#e8dcc0', glazeOx: '#7a3a30', glazeHoney: '#c8902e', glazeBlue: '#3a5a9a',
    earth: '#6a4a3a', earthDark: '#3e2c26', grass: '#4c6a3a', grassDry: '#8a7a4a', stone: '#8a8290',
    wood: '#8a5a3a', woodDark: '#5a3a28', woodPale: '#b08860', rope: '#a48a60',
    cloth: '#c8b48c', clothRed: '#a84438', clothBlue: '#4a5a8a', clothGreen: '#5a7a4a',
    fur: '#4c4858', furDark: '#2e2a38', skin: '#f2a4a0', skinDark: '#c87878',
    smoke: '#5a5058',
  };
  // fire colours, from coolest to hottest
  K.FIRE = ['#3a0c08', '#8a1e0a', '#d8500e', '#ff8a1e', '#ffc04a', '#fff0b0', '#fffbe8'];
  K.fireAt = (v) => { v = clamp(v, 0, 0.999) * (K.FIRE.length - 1); const i = Math.floor(v); return K.mix(K.FIRE[i], K.FIRE[i + 1], v - i); };

  // a licking tongue of flame from (x, y) up: hot at the root, fading to a dark red tip.
  // lean bends the tip sideways; hot (0..1) sets how white the root burns; green tints toward salt
  K.tongue = (g, x, y, w, h, lean, hot = 0.8, green = 0) => {
    const p = new Path2D();
    p.moveTo(x - w, y);
    p.bezierCurveTo(x - w * 1.25, y - h * 0.4, x - w * 0.5 + lean * 0.4, y - h * 0.75, x + lean, y - h);
    p.bezierCurveTo(x + lean * 0.9 + w * 0.5, y - h * 0.82, x + w * 0.7 + lean * 0.4, y - h * 0.5, x + w * 1.05, y - h * 0.2);
    p.quadraticCurveTo(x + w * 1.1, y - h * 0.05, x + w, y);
    p.closePath();
    const c0 = K.mix(K.fireAt(0.6 + hot * 0.35), [0.6, 1, 0.8], green), c1 = K.mix(K.fireAt(0.5), [0.3, 0.9, 0.6], green), c2 = K.fireAt(0.22);
    const gr = g.createLinearGradient(x, y, x + lean, y - h);
    gr.addColorStop(0, K.css(c0, 0.95)); gr.addColorStop(0.45, K.css(c1, 0.85)); gr.addColorStop(1, K.css(c2, 0));
    g.fillStyle = gr; g.fill(p);
    return p;
  };

  // ------------------------------------------------------------------ bus
  const bus = {};
  K.on = (name, fn) => (bus[name] = bus[name] || []).push(fn);
  K.emit = (name, data) => (bus[name] || []).forEach((fn) => fn(data));
  // shared, slowly breathing fire level (0.85..1.15) the glow pass and flames read
  K.fire = { level: 1, salt: 0, saltT: 99, flare: 0 };

  // ------------------------------------------------------------------ rigs
  // a damped pendulum that leans into the shared breeze; kick() pushes it
  K.pendulum = (o) => Object.assign({ a: 0, v: 0, len: 60, damp: 1.1, lean: 0.05, sway: 0.03, seed: 1, x: 800 }, o);
  K.swing = (p, dt, t, L) => {
    const w = Drawn.wind(t, p.x);
    const k = 900 / p.len;
    const target = p.lean * w + p.sway * Math.sin(t * Math.sqrt(k) * 0.9 + p.seed * 5) * (0.5 + w * 0.5) + 0.04 * noise(t * 0.6 + p.seed * 9) * w;
    for (let i = 0; i < 3; i++) { p.v += (-k * Math.sin(p.a - target) - p.damp * p.v) * dt / 3; p.a += p.v * dt / 3; }
    if (L && L.hovered) p.v += Drawn.P.vx * 0.00012 * Math.cos(p.a) * dt * 60 * (1 / p.len) * 40;
  };
  K.kick = (p, v) => { p.v += v; };

  // a random idle "action" chooser: every few seconds plays one named action, u goes 0 → 1
  K.actor = (seed, acts, gap = [3, 8]) => {
    const r = rng(seed);
    let wait = gap[0] * 0.4 + r() * gap[1] * 0.6;
    return {
      name: null, u: 0, dur: 1, r,
      step(dt) {
        if (this.name) {
          this.u += dt / this.dur;
          if (this.u >= 1) { this.name = null; this.u = 0; wait = gap[0] + r() * (gap[1] - gap[0]); }
        } else if ((wait -= dt) <= 0) {
          const a = acts[Math.floor(r() * acts.length)];
          this.play(a[0], a[1]);
        }
      },
      play(name, dur) { this.name = name; this.dur = dur; this.u = 0; },
      is(name) { return this.name === name ? this.u : -1; },
    };
  };
  // 0 → 1 → 0 bell over u in [0, 1]
  K.bell = (u) => (u < 0 || u > 1 ? 0 : Math.sin(u * Math.PI));
  K.smooth = (u) => { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); };
  // a spring: approaches target with overshoot
  K.spring = (o = {}) => Object.assign({ x: 0, v: 0, k: 120, d: 12 }, o);
  K.springTo = (s, target, dt) => { s.v += ((target - s.x) * s.k - s.v * s.d) * dt; s.x += s.v * dt; return s.x; };

  // ------------------------------------------------------------------ glow sprites
  // soft additive halos, cached per colour so nothing builds a gradient per frame
  const halos = new Map();
  K.halo = (col) => {
    let c = halos.get(col);
    if (c) return c;
    c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), [r, gg, b] = K.rgb(col).map(to255);
    const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${r},${gg},${b},1)`);
    gr.addColorStop(0.18, `rgba(${r},${gg},${b},0.55)`);
    gr.addColorStop(0.45, `rgba(${r},${gg},${b},0.18)`);
    gr.addColorStop(0.75, `rgba(${r},${gg},${b},0.05)`);
    gr.addColorStop(1, `rgba(${r},${gg},${b},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    halos.set(col, c);
    return c;
  };
  // draw a halo (call inside globalCompositeOperation = 'lighter')
  K.glow = (g, x, y, r, col, a = 1, sy = 1) => {
    if (a <= 0.003) return;
    g.globalAlpha = Math.min(1, a);
    g.drawImage(K.halo(col), x - r, y - r * sy, r * 2, r * 2 * sy);
    g.globalAlpha = 1;
  };

  // ------------------------------------------------------------------ path helpers
  K.rrect = (x, y, w, h, r, p = new Path2D()) => {
    r = Math.min(r, w / 2, h / 2);
    p.moveTo(x + r, y); p.arcTo(x + w, y, x + w, y + h, r); p.arcTo(x + w, y + h, x, y + h, r);
    p.arcTo(x, y + h, x, y, r); p.arcTo(x, y, x + w, y, r); p.closePath();
    return p;
  };
  // jitter a polyline so built things sag and lean: pts → pts with seeded wobble
  K.wobble = (pts, amt, seed) => { const r = rng(seed); return pts.map(([x, y]) => [x + (r() - 0.5) * amt, y + (r() - 0.5) * amt]); };
  // stroke a list of points
  K.line = (g, pts, lw, col, closed = false) => {
    g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    if (closed) g.closePath();
    g.lineWidth = lw; g.strokeStyle = col; g.stroke();
  };

  // A turned (lathe) form: profile is [[halfWidth, y], ...] top → bottom around centre cx.
  // Returns the silhouette path plus a sampler for the surface. Rims follow rimRy.
  K.lathe = (cx, prof) => {
    const n = prof.length;
    const p = new Path2D();
    // right side down, bottom front arc, left side up, top front arc
    const top = prof[0], bot = prof[n - 1];
    const ryT = K.rimRy(top[1], top[0]), ryB = K.rimRy(bot[1], bot[0]);
    p.moveTo(cx + top[0], top[1]);
    const side = (s) => {
      const pts = prof.map(([w, y]) => [cx + s * w, y]);
      return s > 0 ? pts : pts.reverse();
    };
    Drawn.curve(side(1), false, p);
    // bottom: the visible edge is the front arc when below eye level (∪) and the front arc
    // seen from below (∩) above it; either way it's the half of the ellipse nearer the viewer
    p.ellipse(cx, bot[1], bot[0], Math.abs(ryB) + 0.001, 0, 0, Math.PI, ryB < 0);
    const ls = side(-1);
    ls.forEach(([x, y]) => p.lineTo(x, y));
    p.closePath();
    const halfW = (y) => {
      if (y <= prof[0][1]) return prof[0][0];
      for (let i = 1; i < n; i++) if (y <= prof[i][1]) { const a = prof[i - 1], b = prof[i], u = (y - a[1]) / (b[1] - a[1]); return lerp(a[0], b[0], K.smooth(u) * 0.6 + u * 0.4); }
      return prof[n - 1][0];
    };
    return { cx, prof, path: p, halfW, top, bot };
  };
  // a point on a turned surface at angle th (0 = right edge, PI/2 = facing us) and height y
  K.onLathe = (F, th, y) => {
    const w = F.halfW(y);
    return [F.cx + w * Math.cos(th), y + K.rimRy(y, w) * Math.sin(th)];
  };
})();

// ------------------------------------------------------------------ the light map
// Big painted areas (earth, clay faces, the yard) are painted in their daylight albedo, then
// multiplied by this map of ambient + fire light, so terrain and objects share one light.
(function () {
  const K = window.Kiln, { st } = Drawn;
  let map = null, mapKey = '';
  const tone = (v) => 1 - Math.exp(-v * 1.55);
  K.lightmap = () => {
    const v = st.view, key = [v.x0, v.y0, v.x1, v.y1].map(Math.round).join();
    if (map && mapKey === key) return map;
    const step = 5;
    const w = Math.ceil((v.x1 - v.x0) / step) + 2, h = Math.ceil((v.y1 - v.y0) / step) + 2;
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), img = g.createImageData(w, h);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const x = v.x0 + (i - 1) * step, y = v.y0 + (j - 1) * step;
      const L = K.lightAt(x, y, [0, -0.25, 0.97]);
      const o = (j * w + i) * 4;
      img.data[o] = tone(K.AMB[0] + L[0]) * 255; img.data[o + 1] = tone(K.AMB[1] + L[1]) * 255; img.data[o + 2] = tone(K.AMB[2] + L[2]) * 255; img.data[o + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    map = { c, x0: v.x0 - step, y0: v.y0 - step, w: w * step, h: h * step };
    mapKey = key;
    return map;
  };
  // multiply whatever is inside `clip` by the light map
  K.applyLight = (g, clip) => {
    const m = K.lightmap();
    g.save();
    if (clip) g.clip(clip);
    g.globalCompositeOperation = 'multiply';
    g.imageSmoothingEnabled = true;
    g.drawImage(m.c, m.x0, m.y0, m.w, m.h);
    g.restore();
  };
})();
