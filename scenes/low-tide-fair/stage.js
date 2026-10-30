/* stage.js — a copy of engine/drawn.js (the shared stage) every scene is built on. Plain script, no build step: it defines
   window.Drawn, the scene registers layers on it, then calls Drawn.start({ W, H }).

   A layer is { id, z, draw(g, t, L), update?(dt, t, L), hit?: Path2D | (x, y) => bool,
                still?: true (drawn once into a cached bitmap), onEnter?(L), onTap?(L) }.
   Each frame every layer gets L.hover (eased 0..1), L.hovered, L.since (seconds hovered).
   All drawing is in artboard units; the artboard is fitted to the window and the world carries on
   past its edges (st.view is the visible rectangle, in artboard units — paint backgrounds across it).

   Dev flags (query string): ?debug=hits tints every hit area · ?t=30 starts the clock at 30 s ·
   ?hover=x,y parks a virtual pointer there (artboard units) — the capture tool uses it. */
(function () {
  const TAU = Math.PI * 2;
  const qs = new URLSearchParams(location.search);
  const dev = {
    hits: qs.get('debug') === 'hits',
    t0: +qs.get('t') || 0,
    hover: qs.get('hover') ? qs.get('hover').split(',').map(Number) : null,
    pan: qs.get('pan') != null ? +qs.get('pan') : null,
  };

  // ---------------------------------------------------------------- maths
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  // frame-rate independent approach toward a target
  const ease = (cur, target, rate, dt) => cur + (target - cur) * (1 - Math.exp(-rate * dt));
  function rng(s) {
    return () => {
      s |= 0; s = (s + 0x6d2b79f5) | 0;
      let t = Math.imul(s ^ (s >>> 15), 1 | s);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (n) => { n = Math.sin(n * 127.1 + 311.7) * 43758.5453; return n - Math.floor(n); };
  const noise = (x) => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(hash(i), hash(i + 1), u) * 2 - 1; };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // one breeze for the whole drawing (blowing left → right by default). Scenes may replace the
  // shape with setWind(fn); breeze.extra is there for anything that should stir it up.
  const breeze = { extra: 0 };
  let windFn = (t, x) => 0.55 + 0.25 * Math.sin(t * 0.37 + x * 0.0015) + 0.35 * Math.max(0, noise(t * 0.22 + x * 0.0008)) + breeze.extra;
  const wind = (t, x = 0) => windFn(t, x);
  const setWind = (fn) => { windFn = fn; };

  // ---------------------------------------------------------------- paths
  const circ = (x, y, r, p = new Path2D()) => { p.moveTo(x + r, y); p.arc(x, y, r, 0, TAU); return p; };
  const ell = (x, y, rx, ry, p = new Path2D(), rot = 0) => { p.moveTo(x + rx * Math.cos(rot), y + rx * Math.sin(rot)); p.ellipse(x, y, rx, ry, rot, 0, TAU); return p; };
  const rect = (x, y, w, h, p = new Path2D()) => { p.rect(x, y, w, h); return p; };
  const seg = (x0, y0, x1, y1) => { const p = new Path2D(); p.moveTo(x0, y0); p.lineTo(x1, y1); return p; };
  const quad = (x0, y0, cx, cy, x1, y1) => { const p = new Path2D(); p.moveTo(x0, y0); p.quadraticCurveTo(cx, cy, x1, y1); return p; };
  function poly(pts, closed = true, p = new Path2D()) {
    pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
    if (closed) p.closePath();
    return p;
  }
  // Catmull-Rom spline through the points
  function curve(pts, closed = true, p = new Path2D()) {
    const n = pts.length, g = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    p.moveTo(pts[0][0], pts[0][1]);
    for (let i = 0; i < (closed ? n : n - 1); i++) {
      const a = g(i - 1), b = g(i), c = g(i + 1), d = g(i + 2);
      p.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1]);
    }
    if (closed) p.closePath();
    return p;
  }

  // ---------------------------------------------------------------- paint
  const style = { line: '#3a2232' };
  function ink(g, path, fill, lw = 2.2, line = style.line) {
    if (fill) { g.fillStyle = fill; g.fill(path); }
    if (lw) { g.lineWidth = lw; g.strokeStyle = line; g.stroke(path); }
  }
  const stops = (gr, list) => { list.forEach((c, i) => gr.addColorStop(Array.isArray(c) ? c[0] : i / (list.length - 1), Array.isArray(c) ? c[1] : c)); return gr; };
  const grad = (g, x0, y0, x1, y1, list) => stops(g.createLinearGradient(x0, y0, x1, y1), list);
  const radial = (g, x, y, r0, r1, list) => stops(g.createRadialGradient(x, y, r0, x, y, r1), list);
  // a stroke with an ink edge: the outline drawn wide, the colour narrower on top
  function tube(g, path, color, w, lw = 1.8) {
    g.lineWidth = w + lw * 2; g.strokeStyle = style.line; g.stroke(path);
    g.lineWidth = w; g.strokeStyle = color; g.stroke(path);
  }
  // Lumpy cel-shaded masses (clouds, foliage, bushes) from [x, y, r] circles, lit from the upper
  // right. One ink outline goes round the whole union (stroked at double width, then covered by the
  // fill). col: { line, lw, shade, base, lit, seam?, union? } — union:true shades the mass as one
  // (soft, for clouds); otherwise each lump is shaded in turn, lower lumps in front (clumpy, foliage).
  // flatY clips a flat underside (cumulus).
  function lumps(g, circles, col, flatY) {
    const U = new Path2D();
    for (const [x, y, r] of circles) circ(x, y, r, U);
    g.save();
    if (flatY != null) { g.beginPath(); g.rect(-1e5, -1e5, 3e5, flatY + 1e5); g.clip(); }
    if (col.line) { g.lineWidth = (col.lw || 2) * 2; g.strokeStyle = col.line; g.stroke(U); }
    if (col.union) {
      g.fillStyle = col.shade; g.fill(U);
      g.clip(U);
      const B = new Path2D(), L = new Path2D();
      for (const [x, y, r] of circles) { circ(x + r * 0.1, y - r * 0.12, r * 0.97, B); circ(x + r * 0.3, y - r * 0.32, r * 0.7, L); }
      g.fillStyle = col.base; g.fill(B);
      g.fillStyle = col.lit; g.fill(L);
      g.restore();
      return;
    }
    const sorted = circles.slice().sort((a, b) => a[1] + a[2] * 0.3 - (b[1] + b[2] * 0.3));
    for (const [x, y, r] of sorted) {
      const c = circ(x, y, r);
      g.fillStyle = col.shade; g.fill(c);
      g.save(); g.clip(c);
      g.fillStyle = col.base; g.fill(circ(x + r * 0.16, y - r * 0.15, r * 0.94));
      if (col.lit) { g.fillStyle = col.lit; g.fill(circ(x + r * 0.36, y - r * 0.34, r * 0.72)); }
      g.restore();
      if (col.seam) { g.lineWidth = 1.3; g.strokeStyle = col.seam; g.beginPath(); g.arc(x, y, r, Math.PI * 0.55, Math.PI * 1.05); g.stroke(); }
    }
    g.restore();
  }

  // eyes: open (1) → shut (0) → open, on a random clock of its own
  function blinker(min = 2, spread = 4.5) {
    let next = 1 + Math.random() * 4;
    return (t) => {
      if (t > next) { const d = t - next; if (d < 0.16) return Math.abs(d - 0.08) / 0.08; next = t + min + Math.random() * spread; }
      return 1;
    };
  }

  // ---------------------------------------------------------------- stage
  // This copy of engine/drawn.js adds panning: when the screen is too narrow to show the panorama
  // at a readable size (a phone held upright), the artboard is drawn larger than the screen and you
  // drag sideways to look along it. Still layers are baked across the whole pannable width, so a
  // pan is only an offset blit. ?pan=x starts the view centred on artboard x.
  const st = { W: 1600, H: 1600, slack: 0.86, t: dev.t0, s: 1, ox: 0, oy: 0, dpr: 1, R: 1, view: { x0: 0, y0: 0, x1: 1600, y1: 1600 }, hovered: null,
    pan: { on: false, x: 0, v: 0, min: 0, max: 0, focus: 800, panW: 900, fill: 0.55, skyBias: 0.5 } };
  const P = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0, sp: 0, inside: false };
  const layers = [], layoutFns = [];
  let cv, ctx, buckets = [], ready = false, readyResolve;
  const readyP = new Promise((r) => (readyResolve = r));
  const hitCtx = document.createElement('canvas').getContext('2d');

  // a tiny event bus so parts can talk to each other (the bell rings → everyone looks)
  const bus = {};
  const on = (name, fn) => (bus[name] = bus[name] || []).push(fn);
  const emit = (name, data) => (bus[name] || []).forEach((fn) => fn(data));

  const layer = (d) => { const L = Object.assign({ z: 0, hover: 0, hovered: false, since: 0, still: false }, d); layers.push(L); return L; };
  const onLayout = (fn) => layoutFns.push(fn);
  const base = (g) => g.setTransform(st.R, 0, 0, st.R, st.ox * st.dpr, st.oy * st.dpr);

  // an offscreen bitmap at screen resolution, drawn in artboard units; rebuild it from onLayout
  function sprite(x0, y0, w, h, fn) {
    const c = document.createElement('canvas');
    c.width = Math.max(1, Math.ceil(w * st.R)); c.height = Math.max(1, Math.ceil(h * st.R));
    const g = c.getContext('2d');
    g.setTransform(st.R, 0, 0, st.R, -x0 * st.R, -y0 * st.R);
    g.lineJoin = g.lineCap = 'round';
    fn(g);
    return { c, x0, y0, w, h };
  }
  const blit = (g, sp, dx = 0, dy = 0) => g.drawImage(sp.c, sp.x0 + dx, sp.y0 + dy, sp.w, sp.h);

  let vw = 0, vh = 0;
  function setView() {
    const s = st.s;
    if (st.pan.on) st.ox = vw / 2 - st.pan.x * s;
    st.view = { x0: -st.ox / s, y0: -st.oy / s, x1: (vw - st.ox) / s, y1: (vh - st.oy) / s };
  }
  function layout() {
    vw = innerWidth; vh = innerHeight;
    if (vw < 2 || vh < 2) return (ready = false);
    st.dpr = Math.min(devicePixelRatio || 1, 2);
    const pn = st.pan;
    // the whole artboard fits when it can be shown at a decent size; otherwise it's drawn bigger
    // (at least pn.fill of the screen's height, or pn.panW artboard units across) and pans
    const fit = Math.min(vw / (st.W * st.slack), vh / st.H);
    const s = Math.max(fit, Math.min((vh * pn.fill) / st.H, vw / pn.panW));
    st.s = s;
    pn.on = st.W * s > vw + 1;
    // when panning (a tall screen) show more of the sky above than of the sand below
    st.oy = (vh - st.H * s) * (pn.on ? pn.skyBias : 0.5);
    if (pn.on) {
      pn.min = vw / 2 / s; pn.max = st.W - pn.min;
      if (!pn.placed) { pn.x = dev.pan != null ? dev.pan : pn.focus; pn.placed = true; }
      pn.x = clamp(pn.x, pn.min, pn.max);
    } else st.ox = (vw - st.W * s) / 2;
    setView();
    cv.width = Math.round(vw * st.dpr); cv.height = Math.round(vh * st.dpr);
    cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
    st.R = s * st.dpr;
    layoutFns.forEach((f) => f());
    buildBuckets();
    return (ready = true);
  }

  // consecutive still layers are flattened into one cached bitmap, wide enough for the whole pan
  function buildBuckets() {
    layers.sort((a, b) => a.z - b.z);
    buckets = [];
    let cur = null;
    for (const L of layers) {
      if (L.still) { if (!cur) buckets.push((cur = { still: true, layers: [] })); cur.layers.push(L); }
      else { cur = null; buckets.push({ still: false, layer: L }); }
    }
    const real = st.view;
    const x0 = st.pan.on ? 0 : real.x0, x1 = st.pan.on ? st.W : real.x1;
    st.view = { x0, y0: real.y0, x1, y1: real.y1 };
    for (const b of buckets) {
      if (!b.still) continue;
      const c = document.createElement('canvas');
      c.width = Math.ceil((x1 - x0) * st.R); c.height = cv.height;
      const g = c.getContext('2d');
      g.lineJoin = g.lineCap = 'round';
      for (const L of b.layers) { g.setTransform(st.R, 0, 0, st.R, -x0 * st.R, st.oy * st.dpr); g.save(); L.draw(g, 0, L); g.restore(); }
      b.canvas = c; b.x0 = x0;
    }
    st.view = real;
  }

  const hitTest = (L, x, y) => (typeof L.hit === 'function' ? L.hit.call(L, x, y) : hitCtx.isPointInPath(L.hit, x, y));
  function pick(x, y) {
    for (let i = layers.length - 1; i >= 0; i--) { const L = layers[i]; if (L.hit && hitTest(L, x, y)) return L; }
    return null;
  }

  let hintEl, hintTimer = 0;
  let cx = 0, cy = 0;
  const drag = { id: null, x: 0, x0: 0, moved: false, lastX: 0, lastT: 0 };
  function onMove(e) {
    cx = e.clientX; cy = e.clientY;
    if (drag.id === e.pointerId && st.pan.on) {
      const dx = e.clientX - drag.x0;
      if (!drag.moved && Math.abs(dx) > 9) { drag.moved = true; tapUntil = 0; }
      if (drag.moved) {
        const now = performance.now();
        st.pan.x = clamp(st.pan.x - (e.clientX - drag.lastX) / st.s, st.pan.min, st.pan.max);
        st.pan.v = (-(e.clientX - drag.lastX) / st.s) / Math.max(1e-3, (now - drag.lastT) / 1000);
        drag.lastX = e.clientX; drag.lastT = now;
        setView();
      }
    }
    P.x = (cx - st.ox) / st.s; P.y = (cy - st.oy) / st.s; P.inside = true;
    if (hintEl && !hintTimer) hintTimer = setTimeout(() => hintEl.classList.add('gone'), 3500);
  }
  let tapUntil = 0;
  function onDown(e) {
    if (e.pointerType !== 'mouse') { drag.id = e.pointerId; drag.x0 = drag.lastX = e.clientX; drag.lastT = performance.now(); drag.moved = false; st.pan.v = 0; }
    onMove(e);
    if (e.pointerType !== 'mouse') tapUntil = performance.now() + 2600; // a tap holds the hover a while
    const L = pick(P.x, P.y);
    if (L && L.onTap) L.onTap(L);
  }
  function onUp(e) { if (drag.id === e.pointerId) { drag.id = null; if (!drag.moved) st.pan.v = 0; } }

  let last = 0, frames = 0, hitMap = null, hitMapAt = -1;
  function frame(now) {
    requestAnimationFrame(frame);
    if (!ready && !layout()) return;
    const dt = Math.min(0.05, (now - (last || now)) / 1000) * (reduced ? 0.35 : 1);
    last = now;
    st.t += dt;
    const t = st.t;
    // a flicked pan glides to a stop
    if (st.pan.on && drag.id == null && Math.abs(st.pan.v) > 1) {
      st.pan.x = clamp(st.pan.x + st.pan.v * dt, st.pan.min, st.pan.max);
      st.pan.v *= Math.exp(-4 * dt);
      setView();
      if (P.inside) { P.x = (cx - st.ox) / st.s; }
    }
    if (dev.hover) { P.x = dev.hover[0]; P.y = dev.hover[1]; P.inside = true; }
    P.vx = P.px < -9000 ? 0 : (P.x - P.px) / Math.max(dt, 1e-3);
    P.vy = P.px < -9000 ? 0 : (P.y - P.py) / Math.max(dt, 1e-3);
    P.px = P.x; P.py = P.y;
    P.sp = ease(P.sp, Math.hypot(P.vx, P.vy), 8, dt);

    const target = (P.inside && !drag.moved) || performance.now() < tapUntil ? pick(P.x, P.y) : null;
    if (target !== st.hovered) {
      if (target && target.onEnter) target.onEnter(target);
      st.hovered = target;
      cv.style.cursor = target ? 'pointer' : 'default';
    }
    for (const L of layers) {
      const on = L === st.hovered;
      if (on && !L.hovered) L.since = 0;
      L.hovered = on;
      if (on) L.since += dt;
      L.hover = ease(L.hover, on ? 1 : 0, on ? 5.5 : 2.4, dt);
      if (L.update) L.update(dt, t, L);
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const b of buckets) {
      if (b.still) { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(b.canvas, Math.round((st.ox + b.x0 * st.s) * st.dpr), 0); continue; }
      base(ctx); ctx.save(); b.layer.draw(ctx, t, b.layer); ctx.restore();
    }
    if (dev.hits) drawHits(t);
    if (++frames === 3) readyResolve();
  }

  // ?debug=hits: every hit area tinted in its own colour, top layer wins (refreshed once a second)
  function drawHits(t) {
    const step = 8;
    if (!hitMap || Math.floor(t) !== hitMapAt) {
      hitMapAt = Math.floor(t);
      hitMap = [];
      const v = st.view;
      for (let y = Math.max(v.y0, 0); y < Math.min(v.y1, st.H); y += step)
        for (let x = Math.max(v.x0, 0); x < Math.min(v.x1, st.W); x += step) { const L = pick(x, y); if (L) hitMap.push([x, y, L]); }
    }
    base(ctx);
    for (const [x, y, L] of hitMap) {
      const h = [...L.id].reduce((a, c) => a + c.charCodeAt(0) * 37, 0) % 360;
      ctx.fillStyle = `hsla(${h},90%,55%,${L === st.hovered ? 0.5 : 0.28})`;
      ctx.fillRect(x - step / 2, y - step / 2, step, step);
    }
  }

  // the little bits of page chrome every scene shares: a way back to the gallery and a hint
  function chrome({ hint }) {
    const css = document.createElement('style');
    css.textContent = `
      .drawn-home, .drawn-hint { position: fixed; font: italic 500 14px/1.2 Georgia, "Iowan Old Style", serif; letter-spacing: .02em;
        color: #fff8ea; background: rgba(40, 26, 40, .34); -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px);
        padding: 7px 14px; border-radius: 99px; text-decoration: none; white-space: nowrap; z-index: 2 }
      .drawn-home { top: calc(14px + env(safe-area-inset-top, 0px)); left: calc(14px + env(safe-area-inset-left, 0px)); opacity: .7; transition: opacity .3s }
      .drawn-home:hover, .drawn-home:focus-visible { opacity: 1 }
      .drawn-hint { left: 50%; bottom: calc(18px + env(safe-area-inset-bottom, 0px)); transform: translateX(-50%); pointer-events: none; transition: opacity 1.6s ease }
      .drawn-hint.gone { opacity: 0 }`;
    document.head.appendChild(css);
    // ?bare hides the chrome (captures, embeds)
    if (qs.has('bare')) return;
    const a = document.createElement('a'); a.className = 'drawn-home'; a.href = '../../'; a.textContent = '← all drawings';
    document.body.appendChild(a);
    if (hint) {
      hintEl = document.createElement('div'); hintEl.className = 'drawn-hint';
      hintEl.textContent = st.pan.on && typeof hint === 'object' ? hint.pan : typeof hint === 'object' ? hint.desk : hint;
      document.body.appendChild(hintEl);
    }
  }

  function start({ W = 1600, H = 1600, slack = 0.86, canvas, hint = 'hover or tap anything', focus, panW, fill, skyBias } = {}) {
    st.W = W; st.H = H; st.slack = slack;
    if (focus != null) st.pan.focus = focus;
    if (panW) st.pan.panW = panW;
    if (fill) st.pan.fill = fill;
    if (skyBias != null) st.pan.skyBias = skyBias;
    cv = canvas || document.querySelector('canvas');
    ctx = cv.getContext('2d');
    let rt;
    addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(layout, 120); });
    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('pointerup', onUp, { passive: true });
    addEventListener('pointercancel', onUp, { passive: true });
    document.addEventListener('pointerleave', () => { P.inside = false; });
    cv.addEventListener('pointerleave', () => { P.inside = false; });
    layout();
    chrome({ hint });
    requestAnimationFrame(frame);
  }

  window.__drawn = { ready: readyP, layers };
  window.Drawn = {
    TAU, clamp, lerp, ease, rng, hash, noise, reduced,
    breeze, wind, setWind,
    circ, ell, rect, seg, quad, poly, curve,
    style, ink, grad, radial, tube, lumps, blinker,
    st, P, layer, pick, onLayout, sprite, blit, start, on, emit,
  };
})();
