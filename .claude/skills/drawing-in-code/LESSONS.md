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

## The Overwinter (Opus 5.5, ten rounds)

- **Route every point on a big form through one tiny projection function.** The stack's face was
  flat-looking until everything (cabinets, rails, ledges, bedding, far slots) went through one
  `(u, v) → screen` function that foreshortens vertically, narrows toward the edges and arcs
  horizontals the way a drum does above eye level. One function gave every part the same
  perspective for free; it was the biggest single improvement of the whole scene.
- **Check what the subject hides.** The pitch put the sunset "behind the stack", so the brightest
  thing in the picture was behind the darkest. Moving the light source just off the silhouette lit
  the empty half of the frame and gave the rim and the arch a reason to glow.
- **Correct perspective can be unreadable; take the illustrator's cheat.** Seen from below, an open
  drawer hides what's in it, so every sleeper read as lying *on* its drawer. Three critics flagged it.
  Drawing the drawer's dark inside above its lip (as if seen at eye level) fixed it at once.
- **Soft shapes without `ctx.filter`:** draw the shape far off-canvas and let its blurred *shadow*
  land in place (`shadowOffsetX` is in device pixels, so divide by the transform's scale).
- **Cache what rests, animate cheaply.** Sixty drawers redrawn every frame halved the phone frame
  rate. Drawing each resting sleeper once into a sprite and letting it breathe as a 2.5% stretch
  about its lip got it back. Anything waking or stirring is drawn live.
- **`translate(NaN)` is silently ignored.** A porter's head was drawn at its feet because an
  uninitialised idle value turned its look into NaN. When a part appears in a strange place,
  suspect NaN before the maths.
