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

## Kilnhill (Opus 5.5, nine rounds)

- **Make the light a system, not a tint.** Give every light source a position, colour, reach and
  falloff, and colour every surface as albedo × (ambient + the lights around it). Paint big
  terrain in albedo and multiply it by a low-res light map of the same function. Then the kiln,
  the houses, the ground and the creatures all agree about where the light is, and moving one
  lamp relights everything. Two traps: a light set *in* a surface (a firemouth in a wall, a lamp
  inside a pot) must skip that surface, or it lights its own outside evenly; and squared falloff
  over a big radius turns the whole picture one warm mush, so give the key light a steep
  exponent and let the dark come back within a few hundred units.
- **Count your still bitmaps.** Every live layer sitting between two still layers splits them
  into separate full-screen caches that are composited every frame. Thirteen of them cost a
  throttled phone half its frame rate; regrouping z so stills sit together (five caches) bought it
  back with no visual change.
