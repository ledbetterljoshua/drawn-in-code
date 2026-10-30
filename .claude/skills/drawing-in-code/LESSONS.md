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

## Cloudfall Isle, rounds 3–15 (Opus 5.5)

- **Build to one camera, then draw flat.** Pick a projection once (an orthographic view tilted
  down ~18° was enough) and give every flat surface a matrix: `DOMMatrix([u.x, u.y, v.x, v.y, o.x,
  o.y])` from the plane's two axes projected to the artboard. Draw stones, tiles, windows and
  doors in that plane's own flat coordinates and carry the path across with
  `path.addPath(p, M)`: they foreshorten correctly and line widths stay even. Shade each face by
  its own normal against one light vector. Perspective stops being something you fix by eye.
- **Check the horizon against what you look down on.** If you can see the top of something,
  the horizon has to sit above it. A low horizon under a top-down island was a second
  perspective error nobody had named, and it was louder than the frontal houses.
- **Cast shadows only count where they're visible.** Physically right shadows fell behind the
  buildings that cast them and read as "no shadows". Small things (flowers, posts, the hive, the
  characters) throwing long thin streaks across open ground sold the light far better than the
  big volumes did.
