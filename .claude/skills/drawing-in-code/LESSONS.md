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
