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
