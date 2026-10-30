/* top.js — the cupola on the stack's top: a little timber lantern with a blue night-light in it,
   a snow-capped lead dome, and on its finial a cockerel weathervane wearing a nightcap (a hotel of
   sleepers can't have a cockerel crowing). The vane swings with the shared wind.
   Hover: the cockerel tries to crow, the nightcap slides down over its eyes and it gives up; the
   vane spins round once. z 27. */
(() => {
const { TAU, clamp, lerp, ease, wind, P, layer, grad, radial, poly, curve, circ, ell, ink } = Drawn;
const C = OW.C, LINE = OW.LINE, mix = OW.mix;
const X = 628, Y = 192; // the cupola's foot, on the turf
const V = { a: 0, va: 0, spin: 0, crow: 0 };
layer({
  id: 'cupola', z: 27,
  hit(x, y) { return x > X - 26 && x < X + 26 && y > Y - 96 && y < Y + 4; },
  onEnter() { V.va += 9 * Math.sign(P.vx || 1); },
  update(dt, t, L) {
    // the vane points downwind, a damped spring, with a kick from the pointer
    const target = (wind(t, X) - 0.6) * 1.6;
    V.va += (-(V.a - target) * 4 - V.va * 1.1) * dt; V.a += V.va * dt;
    V.crow = ease(V.crow, L.hovered && L.since > 0.3 ? 1 : 0, 3, dt);
  },
  draw(g, t) {
    g.save(); g.translate(OW.shake.x, OW.shake.y);
    const lw = 1.4;
    // the lantern: four posts, a blue light inside, a dark lead skirt
    const base = poly([[X - 18, Y], [X - 16, Y - 22], [X + 16, Y - 22], [X + 18, Y]]);
    ink(g, base, '#3a2a30', lw);
    const win = curve([[X - 9, Y - 4], [X - 9, Y - 14], [X - 5, Y - 19], [X, Y - 20], [X + 5, Y - 19], [X + 9, Y - 14], [X + 9, Y - 4]]);
    const fl = 0.85 + 0.15 * Math.sin(t * 6.1) * Math.sin(t * 3.7);
    OW.lampGlow(g, X, Y - 11, 40, 0.35 * fl);
    ink(g, win, mix('#5e7ed8', '#cfe0ff', 0.4 * fl), 1.1);
    g.lineWidth = 0.9; g.strokeStyle = LINE; g.beginPath(); g.moveTo(X, Y - 20); g.lineTo(X, Y - 4); g.moveTo(X - 9, Y - 12); g.lineTo(X + 9, Y - 12); g.stroke();
    g.fillStyle = 'rgba(255,190,170,0.6)'; g.fillRect(X - 16.5, Y - 21, 2, 20);
    // the dome
    const dome = new Path2D(); dome.moveTo(X - 20, Y - 22); dome.quadraticCurveTo(X - 18, Y - 40, X, Y - 44); dome.quadraticCurveTo(X + 18, Y - 40, X + 20, Y - 22); dome.closePath();
    ink(g, dome, '#4a4660', lw);
    g.save(); g.clip(dome); g.fillStyle = 'rgba(255,190,170,0.4)'; g.fill(ell(X - 14, Y - 30, 5, 12)); g.restore();
    ink(g, curve([[X - 20, Y - 24], [X - 12, Y - 38], [X, Y - 45], [X + 10, Y - 40], [X + 18, Y - 30], [X + 8, Y - 33], [X - 6, Y - 32]]), C.snow, 1, C.snowShade);
    ink(g, poly([[X - 21, Y - 23], [X + 21, Y - 23], [X + 20, Y - 20], [X - 20, Y - 20]]), '#2a2230', 1);
    // the finial, then the vane on top
    g.lineWidth = 1.6; g.strokeStyle = '#2a2430'; g.beginPath(); g.moveTo(X, Y - 44); g.lineTo(X, Y - 70); g.stroke();
    ink(g, circ(X, Y - 48, 2), C.brass.base, 0.8);
    // the compass letters on their cross-arms
    g.lineWidth = 1; g.beginPath(); g.moveTo(X - 10, Y - 56); g.lineTo(X + 10, Y - 56); g.stroke();
    g.fillStyle = '#2a2430'; g.font = '600 5px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText('W', X - 13, Y - 56); g.fillText('E', X + 13, Y - 56); g.textAlign = 'start';
    // the cockerel turns on the pin: seen side-on it's long, end-on it's thin
    const a = V.a, sx = Math.cos(a), sgn = sx >= 0 ? 1 : -1, w = Math.max(0.18, Math.abs(sx));
    g.save(); g.translate(X, Y - 70); g.scale(w * sgn, 1);
    const lw2 = 1.2 / Math.max(0.4, w);
    // arrow
    ink(g, poly([[-20, 1], [16, 1], [16, 3], [-20, 3]]), '#2a2430', 0);
    ink(g, poly([[16, 0], [22, 2], [16, 4]]), '#2a2430', 0);
    ink(g, poly([[-20, -1], [-26, -4], [-24, 2], [-26, 7], [-20, 5]]), '#2a2430', 0);
    // bird
    const crow = V.crow, beak = Math.sin(t * 14) * crow * 0.8;
    const bird = curve([[-10, 0], [-14, -10], [-12, -16], [-6, -12], [0, -12], [4, -17], [8, -18], [10, -14], [8, -9], [4, -4], [0, 0]]);
    ink(g, bird, '#2a2430', 0);
    g.fillStyle = '#3a3448'; g.fill(bird);
    g.fillStyle = 'rgba(255,190,170,0.55)'; g.fill(curve([[-12, -15], [-6, -11], [0, -11], [4, -16], [-2, -13], [-8, -13]]));
    ink(g, poly([[10, -15], [14 + beak, -14.5 - beak], [10, -13]]), '#2a2430', 0);
    g.lineWidth = 1; g.strokeStyle = '#2a2430'; g.beginPath(); g.moveTo(-2, 0); g.lineTo(-2, 1); g.moveTo(2, 0); g.lineTo(2, 1); g.stroke();
    // the nightcap: striped, its tassel hanging; crowing makes it slip down over the eyes
    const slip = crow * 3;
    const cap = curve([[4, -17 + slip], [7, -23 + slip], [12, -24 + slip], [16, -20 + slip + Math.sin(t * 1.1) * 1], [11, -18 + slip], [6, -16 + slip]]);
    ink(g, cap, '#dcd6ee', lw2 * 0.7);
    g.save(); g.clip(cap); g.fillStyle = '#8a6cb4'; for (let k = 2; k < 18; k += 4) g.fillRect(k, -26, 1.8, 12); g.restore();
    ink(g, circ(17, -19 + slip + Math.sin(t * 1.1), 1.6), '#f0eaff', lw2 * 0.5);
    g.restore();
    g.restore();
    // its "cock-a—" never gets out: a small stifled note
    if (V.crow > 0.4) {
      g.globalAlpha = (V.crow - 0.4) * 0.9;
      g.fillStyle = '#efe6d6'; g.font = 'italic 7px Georgia, serif'; g.fillText('cock-a—', X + 14, Y - 84);
      g.globalAlpha = 1;
    }
  },
});
})();
