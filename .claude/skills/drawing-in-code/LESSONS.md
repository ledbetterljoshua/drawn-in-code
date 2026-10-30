# Lessons

What earlier scenes learned about *how* to draw in code. Read these before starting. When you
finish a scene, add the one or two lessons that would most help the next one. Keep each lesson
short, general, and about method rather than your subject. Newest at the bottom.

## Cloudfall Isle (Opus 5.5, two rounds)

- **Shade cel clouds as one mass.** Shading each circle in turn gives an overlapping-scales look.
  Shade the union instead (`lumps(..., { union: true })`), which puts the shadow only where the
  whole cloud turns away from the light. Per-lump shading suits foliage, where clumpiness is the
  point.
- **Don't fill under a row of lumps with a flat rectangle.** It leaves hard horizontal seams.
  Add a second row of big circles under the first instead.
- **Settle the perspective before anything else.** An island top seen from above with frontal
  houses standing on it looks fine at first glance and wrong on the second.
- **Check the phone frame from the first round.** A portrait screen shows far more sky and
  ground than the artboard, so paint backgrounds across `st.view` from the start.

## The Low-Tide Fair (Opus 5.5, nine rounds)

- **In a dense scene, hunt for things you can't see or can't reach.** A before/after hover sheet for
  every vignette found a picnic hidden behind the tower, clam diggers under a snail's tail, clams
  under the foreground bar, and a tower whose rectangular hit box swallowed everything behind it.
  Hit-test big shapes on their real silhouette (`isPointInPath` on the shape's own paths), and
  shoot every hover at least once.
- **Physically right can still read wrong.** A low sun's 1.45× shadow shear was correct, but the
  tower's shadow crossed two thirds of the frame and read as an unexplained band; a mirror image of
  the tower in a puddle 150 px away read as a stain. Shorten shadows until they visibly start at
  their object, and clip reflections to the water just under what's reflected.
- **Profile per layer before optimising.** Wrap each layer's `draw` with `performance.now()` in a
  headless phone viewport: one snail cost 4.6 ms a frame because its big body was filled through
  clips every frame. Caching the body as a sprite in its own local (flipped) space and drawing only
  the small moving parts live fixed it.
## The Drop Harvest (Opus 5.5, ten rounds)

- **Even-odd crescents break on unions.** A rim or core shadow made by filling `P + shift(P)` even-odd
  works for one closed shape, but on a union of overlapping circles every overlap flips and the shape
  turns into chains of rings. For unions, shade with clip intersections instead: fill the dark, clip to
  the shape *and* a shifted copy, fill the lit, fill the base through another shifted copy (`DH.cel` in
  `scenes/drop-harvest/kit.js`).
- **Commit to the light before the critic does.** With the sun behind the subject, every lit front
  face is a contradiction a viewer feels before they can name it; three critics in a row led with it.
  A shared helper that shades a whole shape away from its sunward edge (`DH.shadeFace`), applied to
  everything, did more than any per-object fix. Reflections follow the same rule: things standing in
  water mirror darker, lower in contrast, and fade with depth, or they read as a second object.
## The Chambered Ark (Opus 5.5, nine rounds)

- **Light a room after its occupants, not before.** A warm pool painted behind the furniture lights
  nothing. Draw each room's light last, additively (`'lighter'`), over the props *and* the creatures,
  and darken the hollow first so there's something for it to glow against. Small rooms can bake it.
- **A line that follows a form becomes the form's outline.** A pipe run parallel to every whorl of a
  spiral drew one ring per turn and turned the spiral into a bullseye; two critics saw it before I did.
  When a critic names a shape you didn't draw, look for what's tracing it.
- **Check the engine's light direction against your sun.** `lumps()` lights from the upper right; this
  sea's sun was upper left, so every boulder and coral was lit backwards until mirrored.
- **Headless fps lies low.** Playwright's bundled Chromium renders in software; measure with real Chrome
  and the GPU (`channel: 'chrome'`) before cutting detail for speed.
