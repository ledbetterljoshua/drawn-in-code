/* gaze.js — look at the drawing instead of pointing at it. An opt-in add-on for any scene built on
   the stage (engine/drawn.js or a scene's copy of it that exports `pick`): load it after the stage
   and before the scene calls Drawn.start, then open the page with ?gaze.

   The webcam finds your irises (MediaPipe's face landmarker, in the browser, nothing leaves the
   machine). A short calibration maps where your irises sit to where you are looking on screen.
   Webcam gaze is only good to a thumb's width at arm's length, so it is not used as a cursor:
     · a glance does nothing; a fixation of about a quarter second moves the attention there
     · the attention is a soft pool, and it snaps to whatever interactive thing fills most of it
     · a slow, deliberate blink taps
   Flags: ?gaze (a button to start) · ?gaze=sim (the mouse plus webcam-like noise, no camera)
   · ?gaze=debug (draws raw samples, the fixation and the snap). Keys: c recalibrates, Esc stops. */
(function () {
  const qs = new URLSearchParams(location.search);
  if (!qs.has('gaze')) return;
  const flags = (qs.get('gaze') || '').split(',');
  const SIM = flags.includes('sim'), DEBUG = flags.includes('debug');
  const { st, P, layer, ease, clamp, TAU } = Drawn;
  const pick = Drawn.pick;

  const MP = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14';
  const MODEL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

  const G = (window.Gaze = {
    on: false,           // gaze is driving the pointer
    phase: 'idle',       // idle · loading · face · calibrating · live
    x: 0, y: 0,          // committed attention, artboard units
    seen: null,          // the layer being looked at
    errPx: null,         // calibration accuracy (median leave-one-out error, screen px)
    drawTarget: null,    // (g, x, y, r, phase, t) → draw a calibration target yourself; default is a bubble
    onCalibrated: null,
  });

  // ------------------------------------------------------------ page bits
  const css = document.createElement('style');
  css.textContent = `
    .gaze-pill { position: fixed; right: calc(14px + env(safe-area-inset-right, 0px)); bottom: calc(18px + env(safe-area-inset-bottom, 0px));
      font: italic 500 14px/1.2 Georgia, "Iowan Old Style", serif; letter-spacing: .02em; color: #fff8ea; background: rgba(40, 26, 40, .42);
      -webkit-backdrop-filter: blur(6px); backdrop-filter: blur(6px); padding: 7px 14px; border-radius: 99px; border: 0; z-index: 3; transition: opacity 1.2s }
    button.gaze-pill { cursor: pointer } button.gaze-pill:hover { background: rgba(40, 26, 40, .6) }
    .gaze-pill.gone { opacity: 0; pointer-events: none }
    .gaze-msg { left: 50%; right: auto; top: 30%; bottom: auto; transform: translate(-50%, -50%); font-size: 17px; padding: 10px 18px; pointer-events: none; text-align: center; white-space: nowrap }
    .gaze-cam { position: fixed; left: 50%; top: calc(50% + 40px); width: 132px; height: 132px; margin-left: -66px; border-radius: 50%; object-fit: cover;
      transform: scaleX(-1); z-index: 3; box-shadow: 0 0 0 3px rgba(255, 248, 234, .5); transition: box-shadow .4s, opacity .6s }
    .gaze-cam.found { box-shadow: 0 0 0 3px #b8e6a0 } .gaze-cam.gone { opacity: 0 }`;
  document.head.appendChild(css);
  const el = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls; if (text) e.textContent = text; document.body.appendChild(e); return e; };
  let btn, msg, cam;
  const say = (text, sticky) => {
    if (!msg) msg = el('div', 'gaze-pill gaze-msg');
    msg.textContent = text; msg.classList.remove('gone');
    clearTimeout(say.t); if (!sticky) say.t = setTimeout(() => msg.classList.add('gone'), 4200);
  };
  const hush = () => msg && msg.classList.add('gone');
  const mount = () => {
    btn = el('button', 'gaze-pill', SIM ? 'look with the mouse (simulated eyes)' : 'look with your eyes');
    btn.addEventListener('click', begin);
  };
  if (document.readyState === 'loading') addEventListener('DOMContentLoaded', mount); else mount();

  // while gaze drives, the mouse doesn't (in sim mode it feeds the fake eyes instead)
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  addEventListener('pointermove', (e) => { mouse.x = e.clientX; mouse.y = e.clientY; if (G.on) e.stopImmediatePropagation(); }, true);
  addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && G.phase !== 'idle') stop();
    if (e.key === 'c' && (G.phase === 'live' || G.phase === 'calibrating')) calibrate();
  });

  // ------------------------------------------------------------ the camera and the face
  let video, landmarker, stream, lastVideoT = -1;
  const face = { found: false, lostAt: 0, open: 1, f: null };
  async function begin() {
    btn.classList.add('gone');
    if (SIM) { G.phase = 'live'; G.on = true; fit = null; say('the mouse is standing in for your eyes, with webcam-sized wobble'); return; }
    G.phase = 'loading'; say('waking the camera…', true);
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false });
    } catch (err) { G.phase = 'idle'; btn.classList.remove('gone'); say('no camera, so no eyes this time'); return; }
    video = cam = document.createElement('video'); cam.className = 'gaze-cam'; cam.playsInline = true; cam.muted = true; cam.srcObject = stream;
    document.body.appendChild(cam); await cam.play();
    say('fetching the eye-finder (a few MB, once)…', true);
    try {
      const { FaceLandmarker, FilesetResolver } = await import(MP + '/vision_bundle.mjs');
      const fileset = await FilesetResolver.forVisionTasks(MP + '/wasm');
      landmarker = await FaceLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: MODEL, delegate: 'GPU' }, runningMode: 'VIDEO', numFaces: 1,
        outputFacialTransformationMatrixes: true,
      });
    } catch (err) { console.error(err); say('the eye-finder would not load'); stop(); return; }
    G.phase = 'face'; say('centre your face in the circle, about an arm away', true);
    requestAnimationFrame(watch);
  }
  function stop() {
    G.on = false; G.phase = 'idle'; P.inside = false; G.seen = null;
    if (stream) stream.getTracks().forEach((t) => t.stop());
    if (cam) cam.remove();
    stream = cam = video = null;
    if (btn) btn.classList.remove('gone');
    say('eyes off');
  }

  // where the eyes point, as a handful of numbers. Landmarks are normalised to the frame; x is
  // rescaled so distances are square.
  const EYES = [[33, 133, 159, 145], [362, 263, 386, 374]];
  function features(res) {
    const lm = res.faceLandmarks && res.faceLandmarks[0];
    if (!lm) return null;
    const ar = video.videoWidth / video.videoHeight;
    const p = (i) => ({ x: lm[i].x * ar, y: lm[i].y });
    const irises = [p(468), p(473)];
    let u = 0, v = 0, open = 0;
    for (const [ia, ib, iu, il] of EYES) {
      const a = p(ia), b = p(ib), up = p(iu), lo = p(il);
      const ax = b.x - a.x, ay = b.y - a.y, w2 = ax * ax + ay * ay, mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const iris = irises.reduce((m, q) => (Math.hypot(q.x - mx, q.y - my) < Math.hypot(m.x - mx, m.y - my) ? q : m));
      const dx = iris.x - mx, dy = iris.y - my;
      u += (dx * ax + dy * ay) / w2 / 2;
      v += (-dx * ay + dy * ax) / w2 / 2;
      open += Math.hypot(up.x - lo.x, up.y - lo.y) / Math.sqrt(w2) / 2;
    }
    let yaw = 0, pitch = 0;
    const m = res.facialTransformationMatrixes && res.facialTransformationMatrixes[0];
    if (m) { const d = m.data; yaw = Math.atan2(d[8], d[10]); pitch = Math.asin(clamp(-d[9], -1, 1)); }
    const nose = p(1);
    return { f: [u, v, open, yaw, pitch, nose.x, nose.y], open };
  }

  function watch(now) {
    if (!landmarker || !video) return;
    requestAnimationFrame(watch);
    if (video.currentTime === lastVideoT) return;
    lastVideoT = video.currentTime;
    const res = landmarker.detectForVideo(video, now);
    const ft = features(res);
    const ms = performance.now();
    if (!ft) { if (face.found) face.lostAt = ms; face.found = false; if (cam) cam.classList.remove('found'); return; }
    if (!face.found) face.since = ms;
    face.found = true; face.f = ft.f; face.open = ft.open;
    if (cam) cam.classList.add('found');
    if (G.phase === 'face' && ms - face.since > 900) calibrate();
    blinks(ft.open, ms);
    if (G.phase === 'calibrating') calSample(ft.f, ms);
    else if (G.phase === 'live' && fit && !face.closed) feed(predict(ft.f), ms);
  }

  // a slow blink (eyes shut for about a third of a second to a second) taps what you are looking at
  function blinks(open, ms) {
    const base = fit ? fit.open : face.openBase || open;
    if (!face.openBase) face.openBase = open;
    const closed = open < base * 0.55;
    if (closed && !face.closed) face.closedAt = ms;
    if (!closed && face.closed && G.phase === 'live') {
      const d = ms - face.closedAt;
      if (d > 320 && d < 1100 && G.seen && G.seen.onTap) G.seen.onTap(G.seen);
    }
    face.closed = closed;
  }

  // ------------------------------------------------------------ calibration: follow the bubbles
  // Nine stops around the screen. The bubble drifts between them (samples taken while you follow it
  // count too, lagged by how long eyes take to catch up), then holds while it is sampled, and pops.
  const STOPS = [[0.5, 0.5], [0.12, 0.15], [0.5, 0.12], [0.88, 0.15], [0.88, 0.5], [0.88, 0.85], [0.5, 0.88], [0.12, 0.85], [0.12, 0.5]];
  const T_GROW = 0.7, T_DRIFT = 0.9, T_SETTLE = 0.45, T_SAMPLE = 0.9, LAG = 120;
  let cal = null, fit = null;
  function calibrate() {
    G.phase = 'calibrating'; G.on = false; P.inside = false;
    cal = { i: 0, stage: 'grow', at: performance.now(), samples: [], path: [], pops: [] };
    if (cam) cam.classList.add('gone');
    say('follow the bubbles with your eyes', true);
  }
  function bubbleAt(ms) {
    const s = STOPS[cal.i], k = (ms - cal.at) / 1000;
    if (cal.stage === 'drift') {
      const a = STOPS[cal.i - 1], e = k / T_DRIFT, q = e * e * (3 - 2 * e);
      return [(a[0] + (s[0] - a[0]) * q) * innerWidth, (a[1] + (s[1] - a[1]) * q) * innerHeight + Math.sin(e * Math.PI) * -30];
    }
    return [s[0] * innerWidth, s[1] * innerHeight];
  }
  function calStep(ms) {
    const k = (ms - cal.at) / 1000;
    const next = (stage) => { cal.stage = stage; cal.at = ms; };
    if (cal.stage === 'grow' && k > T_GROW) next('settle');
    else if (cal.stage === 'drift' && k > T_DRIFT) next('settle');
    else if (cal.stage === 'settle' && k > T_SETTLE) next('sample');
    else if (cal.stage === 'sample' && k > T_SAMPLE) {
      cal.pops.push({ x: bubbleAt(ms)[0], y: bubbleAt(ms)[1], at: ms });
      if (++cal.i >= STOPS.length) return finish();
      next('drift');
    }
    cal.path.push([ms, ...bubbleAt(ms)]);
    if (cal.path.length > 120) cal.path.shift();
  }
  function calSample(f, ms) {
    if (face.closed) return;
    if (cal.stage === 'sample') cal.samples.push({ f, x: bubbleAt(ms)[0], y: bubbleAt(ms)[1], w: 1, stop: cal.i });
    else if (cal.stage === 'drift') {
      // where the bubble was LAG ms ago is where the eyes are now
      const back = ms - LAG, h = cal.path.find((q, j) => q[0] >= back) || cal.path[0];
      if (h) cal.samples.push({ f, x: h[1], y: h[2], w: 0.35, stop: -1 });
    }
  }
  function finish() {
    const fitted = train(cal.samples);
    if (!fitted) { say('lost your eyes in the middle of that, trying again'); return calibrate(); }
    // how well it did: predict each stop from a fit that never saw it
    const errs = [], jit = [];
    for (let i = 0; i < STOPS.length; i++) {
      const held = cal.samples.filter((s) => s.stop === i);
      if (!held.length) continue;
      const m = train(cal.samples.filter((s) => s.stop !== i), fitted.norm);
      const ps = held.map((s) => predict(s.f, m)), cx = avg(ps.map((q) => q[0])), cy = avg(ps.map((q) => q[1]));
      errs.push(Math.hypot(cx - held[0].x, cy - held[0].y));
      const own = held.map((s) => predict(s.f, fitted)), ox = avg(own.map((q) => q[0])), oy = avg(own.map((q) => q[1]));
      jit.push(Math.sqrt(avg(own.map((q) => (q[0] - ox) ** 2 + (q[1] - oy) ** 2))));
    }
    fit = fitted;
    fit.open = median(cal.samples.map((s) => s.f[2]));
    G.errPx = Math.round(median(errs));
    fit.jitter = median(jit);
    FIX_R = clamp(Math.max(fit.jitter * 2.2, G.errPx * 0.6), 55, 170);
    console.info(`gaze: calibrated on ${cal.samples.length} samples · error ≈ ${G.errPx}px (median, leave-one-out) · jitter ≈ ${Math.round(fit.jitter)}px · fixation radius ${Math.round(FIX_R)}px`);
    cal.done = performance.now(); G.phase = 'live'; G.on = true; trail.length = 0;
    say(`now just look around · blink slowly to tap · c to redo (accurate to about ${G.errPx}px)`);
    if (G.onCalibrated) G.onCalibrated(G.errPx);
  }

  // ridge regression from the eye numbers to screen x and y, features standardised first
  const avg = (a) => a.reduce((s, v) => s + v, 0) / Math.max(1, a.length);
  const median = (a) => { const b = [...a].sort((p, q) => p - q); return b.length ? b[b.length >> 1] : 0; };
  function train(samples, norm) {
    if (samples.length < 40) return null;
    const k = samples[0].f.length;
    if (!norm) {
      const mu = [], sd = [];
      for (let j = 0; j < k; j++) { const col = samples.map((s) => s.f[j]); mu[j] = avg(col); sd[j] = Math.sqrt(avg(col.map((v) => (v - mu[j]) ** 2))) || 1; }
      norm = { mu, sd };
    }
    const row = (f) => [1, ...f.map((v, j) => (v - norm.mu[j]) / norm.sd[j])];
    const n = k + 1, A = Array.from({ length: n }, () => new Float64Array(n)), bx = new Float64Array(n), by = new Float64Array(n);
    for (const s of samples) {
      const r = row(s.f);
      for (let a = 0; a < n; a++) { bx[a] += s.w * r[a] * s.x; by[a] += s.w * r[a] * s.y; for (let b = 0; b < n; b++) A[a][b] += s.w * r[a] * r[b]; }
    }
    const wsum = samples.reduce((t, s) => t + s.w, 0);
    for (let a = 1; a < n; a++) A[a][a] += 0.04 * wsum;
    const wx = solve(A, bx), wy = solve(A, by);
    return wx && wy ? { norm, wx, wy, row, vw: innerWidth, vh: innerHeight } : null;
  }
  function solve(A0, b0) {
    const n = b0.length, A = A0.map((r) => Float64Array.from(r)), b = Float64Array.from(b0);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-12) return null;
      [A[c], A[p]] = [A[p], A[c]]; [b[c], b[p]] = [b[p], b[c]];
      for (let r = c + 1; r < n; r++) { const m = A[r][c] / A[c][c]; for (let j = c; j < n; j++) A[r][j] -= m * A[c][j]; b[r] -= m * b[c]; }
    }
    const x = new Float64Array(n);
    for (let r = n - 1; r >= 0; r--) { let s = b[r]; for (let j = r + 1; j < n; j++) s -= A[r][j] * x[j]; x[r] = s / A[r][r]; }
    return x;
  }
  function predict(f, m = fit) {
    const r = m.row(f);
    let x = 0, y = 0;
    for (let j = 0; j < r.length; j++) { x += m.wx[j] * r[j]; y += m.wy[j] * r[j]; }
    // the fit is in the screen size it was calibrated at; a resize stretches it along
    return [x * innerWidth / m.vw, y * innerHeight / m.vh];
  }

  if (DEBUG) G._fit = { train, predict };

  // ------------------------------------------------------------ from samples to attention
  // Raw gaze (screen px) is smoothed a little, then a fixation is a quarter second of samples that
  // stay inside FIX_R. A fixation far from the current attention moves it there in one step (so
  // nothing reads it as a fast swipe); a fixation close by drifts it there slowly.
  let FIX_R = 90;
  const DWELL = 260;
  const trail = [];
  const sm = { x: 0, y: 0, ok: false };
  const fix = { x: 0, y: 0, since: 0 };
  const att = { x: -1, y: -1, live: false, snapAt: 0 };
  function feed([x, y], ms) {
    if (!sm.ok) { sm.x = x; sm.y = y; sm.ok = true; }
    sm.x += (x - sm.x) * 0.45; sm.y += (y - sm.y) * 0.45;
    trail.push({ x: sm.x, y: sm.y, ms, rx: x, ry: y });
    while (trail.length && ms - trail[0].ms > 600) trail.shift();
  }
  function settle(ms) {
    const win = trail.filter((s) => ms - s.ms < 200);
    if (win.length < 3) return;
    const cx = avg(win.map((s) => s.x)), cy = avg(win.map((s) => s.y));
    const spread = Math.max(...win.map((s) => Math.hypot(s.x - cx, s.y - cy)));
    if (spread > FIX_R) { fix.since = 0; return; }                 // eyes in flight
    if (!fix.since || Math.hypot(cx - fix.x, cy - fix.y) > FIX_R * 0.7) { fix.since = ms; }
    fix.x = cx; fix.y = cy;
    if (ms - fix.since < DWELL) return;
    const far = !att.live || Math.hypot(cx - att.x, cy - att.y) > FIX_R;
    if (far) { att.x = cx; att.y = cy; att.live = true; att.snapAt = ms; att.jump = true; }
    else { att.x += (cx - att.x) * 0.06; att.y += (cy - att.y) * 0.06; }
  }

  // snap: sample the pool, give each layer a vote (the middle counts most), and put the pointer on
  // the winner at the sample nearest the middle
  const RING = [[0, 0, 3]];
  for (let i = 0; i < 6; i++) RING.push([0.5 * Math.cos(i * TAU / 6), 0.5 * Math.sin(i * TAU / 6), 1.6]);
  for (let i = 0; i < 10; i++) RING.push([Math.cos(i * TAU / 10 + 0.3), Math.sin(i * TAU / 10 + 0.3), 1]);
  let lastProbe = [];
  function snap(ax, ay, r) {
    if (!pick) return [ax, ay, null];
    const votes = new Map();
    lastProbe = [];
    for (const [dx, dy, w] of RING) {
      const x = ax + dx * r, y = ay + dy * r, L = pick(x, y);
      lastProbe.push([x, y, L]);
      if (!L) continue;
      const v = votes.get(L) || { w: 0, x, y, d: Infinity };
      v.w += w;
      const d = Math.hypot(dx, dy); if (d < v.d) { v.d = d; v.x = x; v.y = y; }
      votes.set(L, v);
    }
    let best = null, bw = 0;
    for (const [L, v] of votes) if (v.w > bw) { bw = v.w; best = [v.x, v.y, L]; }
    // stickiness: what you were already looking at keeps it unless clearly outvoted
    const cur = G.seen && votes.get(G.seen);
    if (cur && cur.w >= bw * 0.6) return [cur.x, cur.y, G.seen];
    return best || [ax, ay, null];
  }

  // ------------------------------------------------------------ the sim: mouse plus webcam trouble
  // Gaussian wobble, a slow drift and a little lag, sized like a calibrated webcam.
  const gauss = () => Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) * Math.cos(TAU * Math.random());
  let simDrift = [0, 0], simLast = 0;
  function simTick(ms) {
    if (ms - simLast < 33) return;
    simLast = ms;
    simDrift = [simDrift[0] * 0.995 + gauss() * 1.2, simDrift[1] * 0.995 + gauss() * 1.2];
    feed([mouse.x + gauss() * 38 + simDrift[0], mouse.y + gauss() * 38 + simDrift[1]], ms);
  }

  // ------------------------------------------------------------ the stage layer
  const toArt = (x, y) => [(x - st.ox) / st.s, (y - st.oy) / st.s];
  const pool = { x: 0, y: 0, a: 0, r: 0 };
  layer({
    id: 'gaze', z: 1e6,
    update(dt) {
      const ms = performance.now();
      if (G.phase === 'calibrating' && cal) calStep(ms);
      if (SIM && G.phase === 'live') simTick(ms);
      if (G.phase !== 'live') { pool.a = ease(pool.a, 0, 3, dt); return; }
      const away = !SIM && !face.found && ms - face.lostAt > 600;
      settle(ms);
      if (away || !att.live) { P.inside = false; G.seen = null; pool.a = ease(pool.a, 0, 2, dt); return; }
      const [ax, ay] = toArt(att.x, att.y), r = (FIX_R * 0.9) / st.s;
      const [px, py, L] = snap(ax, ay, r);
      P.x = px; P.y = py; P.inside = true;
      if (att.jump) { P.px = px; P.py = py; att.jump = false; } // a jump is not a swipe
      G.x = px; G.y = py; G.seen = L;
      if (pool.a < 0.02) { pool.x = ax; pool.y = ay; }
      pool.x = ease(pool.x, ax, 6, dt); pool.y = ease(pool.y, ay, 6, dt);
      pool.r = ease(pool.r, r * 1.5, 4, dt); pool.a = ease(pool.a, 1, 2, dt);
    },
    draw(g, t) {
      if (pool.a > 0.01) {
        // a soft pool of light where you are looking, gentle enough to read as the sun finding it
        g.save(); g.globalCompositeOperation = 'soft-light';
        const gr = g.createRadialGradient(pool.x, pool.y, 0, pool.x, pool.y, pool.r);
        gr.addColorStop(0, `rgba(255, 244, 214, ${0.5 * pool.a})`); gr.addColorStop(1, 'rgba(255, 244, 214, 0)');
        g.fillStyle = gr; g.fillRect(pool.x - pool.r, pool.y - pool.r, pool.r * 2, pool.r * 2);
        g.restore();
      }
      if (G.phase === 'calibrating' && cal) drawCal(g, t);
      if (DEBUG) drawDebug(g);
    },
  });

  function drawCal(g, t) {
    const ms = performance.now();
    g.save(); g.fillStyle = 'rgba(30, 20, 34, 0.18)'; g.fillRect(st.view.x0, st.view.y0, st.view.x1 - st.view.x0, st.view.y1 - st.view.y0); g.restore();
    const [sx, sy] = bubbleAt(ms), [x, y] = toArt(sx, sy);
    const k = (ms - cal.at) / 1000, grow = cal.stage === 'grow' ? clamp(k / T_GROW, 0, 1) : 1;
    const r = (15 / st.s) * (0.3 + 0.7 * grow) * (1 + 0.04 * Math.sin(t * 7));
    if (G.drawTarget) G.drawTarget(g, x, y, r, cal.stage, t); else bubble(g, x, y, r, t);
    for (const p of cal.pops) {
      const a = (ms - p.at) / 450; if (a > 1) continue;
      const [qx, qy] = toArt(p.x, p.y);
      g.strokeStyle = `rgba(255, 255, 255, ${0.8 * (1 - a)})`; g.lineWidth = 1.5 / st.s;
      for (let i = 0; i < 8; i++) { const an = i * TAU / 8, d0 = (10 + a * 18) / st.s, d1 = d0 + 6 / st.s; g.beginPath(); g.moveTo(qx + Math.cos(an) * d0, qy + Math.sin(an) * d0); g.lineTo(qx + Math.cos(an) * d1, qy + Math.sin(an) * d1); g.stroke(); }
    }
  }
  // a soap bubble: clear body, an oily rainbow rim, a window highlight, and a bright dot to fix on
  function bubble(g, x, y, r, t) {
    g.save();
    const body = g.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
    body.addColorStop(0, 'rgba(255,255,255,0.05)'); body.addColorStop(0.75, 'rgba(200,230,255,0.12)'); body.addColorStop(1, 'rgba(255,255,255,0.5)');
    g.fillStyle = body; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
    g.lineWidth = r * 0.12;
    for (let i = 0; i < 6; i++) {
      g.strokeStyle = `hsla(${(t * 60 + i * 60) % 360}, 90%, 72%, 0.55)`;
      g.beginPath(); g.arc(x, y, r * 0.94, i * TAU / 6 + t * 0.8, (i + 1) * TAU / 6 + t * 0.8); g.stroke();
    }
    g.fillStyle = 'rgba(255,255,255,0.85)';
    g.beginPath(); g.ellipse(x - r * 0.42, y - r * 0.45, r * 0.22, r * 0.12, -0.7, 0, TAU); g.fill();
    g.fillStyle = '#fffdf4'; g.beginPath(); g.arc(x, y, Math.max(r * 0.12, 1.6 / st.s), 0, TAU); g.fill();
    g.restore();
  }
  function drawDebug(g) {
    g.save();
    const u = 1 / st.s;
    for (const s of trail) { const [x, y] = toArt(s.rx, s.ry); g.fillStyle = 'rgba(255,60,60,0.5)'; g.fillRect(x - 2 * u, y - 2 * u, 4 * u, 4 * u); }
    if (fix.since) { const [x, y] = toArt(fix.x, fix.y); g.strokeStyle = 'rgba(255,220,60,0.9)'; g.lineWidth = 2 * u; g.beginPath(); g.arc(x, y, FIX_R * u, 0, TAU); g.stroke(); }
    for (const [x, y, L] of lastProbe) { g.fillStyle = L === G.seen ? '#3cf' : 'rgba(255,255,255,0.6)'; g.beginPath(); g.arc(x, y, 3 * u, 0, TAU); g.fill(); }
    g.fillStyle = '#3cf'; g.beginPath(); g.arc(P.x, P.y, 6 * u, 0, TAU); g.fill();
    g.font = `${13 * u}px ui-monospace, monospace`; g.fillStyle = '#fff';
    g.fillText(`${G.phase} · ${G.seen ? G.seen.id : '—'} · fix r ${Math.round(FIX_R)}px${G.errPx != null ? ` · err ${G.errPx}px` : ''}`, st.view.x0 + 14 * u, st.view.y1 - 60 * u);
    g.restore();
  }
})();
