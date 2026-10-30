# Kilnhill

## Finding the world

Three worlds for "night, lit from within":

1. **Deep-trench abbey**: anglerfish monks keeping vigil in a sunken abbey, every light a lure.
   Strong, but bioluminescent deep sea is the first idea every Claude has for this lane.
2. **Glow-silk orchard**: silk farmers whose worms spin luminous thread; cocoons hang like lamps and
   the loom-houses glow through silk walls. Pretty, but "lanterns in trees" is a well-worn picture.
3. **Kilnhill** (picked): a hill of mole potters on the third night of the great firing. They dig
   the clay out of the hill they live in, their houses are giant thrown pots, and every house is
   *pierced*, like a pierced-clay lantern, so lamplight spills out in patterns of dots and stars.
   In the middle stands the bottle kiln, banded with iron, burning for its third night. The
   strangest thing I can still draw well, and every light in it is a fire someone made.

- **Who lives here, and what are they doing right now?** Moles. The stoker feeds the firemouth
  and throws salt for the glaze; the cone-watcher squints through the spy-hole; a potter throws a
  pot in a workshop cut into a giant broken jar; a carrier climbs a ladder with a stack of
  greenware; a pup toasts a mushroom at a firehole; someone has fallen asleep on the warm bricks.
- **When and in what weather?** Deep night, no moon and no stars: the sky is black smoke lit from
  underneath by the kiln. A light breeze leans the plume to the right. Everything warm is fire;
  everything else falls into cold indigo.
- **Where does the eye land first?** The firemouth at the base of the kiln (white-hot, stoker
  silhouetted, the only near-white in the picture), up the bottle to the flame at its lip, across
  the lit underside of the smoke, down onto the pierced teapot house on the right terrace and its
  dots of light, and back along the foreground cooling bench to the kiln.
- **What moves when nobody touches it?** Fire breathes and the whole hill's warm light breathes
  with it; sparks rise; smoke rolls; moths circle every lamp; the wheel turns; pierced lamps turn
  so their dots crawl over the ground; steam from cooling pots; bats in the smoke.
  **The one interaction:** hover the stoker and the salt goes in: the flame flashes green, a
  white plume of vapour bursts from the chimney, and the kiln-hills far away answer with flashes.
- **What only this world has:** pierced-pot houses that throw patterns of light; the bottle kiln
  with its iron bands and bricked-up wicket glowing at the seams; pyrometric cones bending in the
  spy-hole; greenware drying on racks; a heat pipe of clay running house to house.

## Viewpoint

Eye level sits at y = 800, the kiln yard. Everything above it is seen from below (rims and
brick courses bow upward, ∩), everything below from above (∪, and we see into the pots on the
foreground racks). Rims flatten to a straight line at eye level. One rule, used everywhere through
`rimRy(y, r)` in kit.js.

Light comes from the fires only. Every surface takes its colour from `lightAt(x, y)`, the sum of
the scene's fire sources, so the lighting is one consistent system instead of hand-tinted parts.

## Round 0 — block-in
Four flat values. Kiln reads as a strong bottle silhouette at 35% across; the houses on the right
were one flat row of equal blobs on a single line, the bottom third was empty, and the phone frame
showed a huge black void above. Fixed before detail: houses stepped in height and depth (jar stack
up on a knoll, bowl house in front), a path leading from the bottom edge up to the firemouth, and a
plume tall enough to fill the phone's sky.

## Round 1 — first full pass
Built the light model (albedo × fire light, terrain multiplied by a shared light map), the kiln,
five pot houses, the moles, the foreground. Five worst things after the first shot:
1. **Plume was flat orange discs.** Each smoke circle was shaded on its own: the scales problem.
   Now shaded as union masses with radial gradients from the chimney; only the underside warms.
2. **The kiln was evenly orange all the way up.** The firemouth light (which sits *in* the wall)
   lit the wall it's set in. Kiln bricks now skip the fires inside them and take a bounce from the
   yard that dies by the shoulder, a halo round each arch, and the lip flame on the top courses.
   The bottle now goes dark as it rises, which is what makes the base glow.
3. **The pot houses were lit by their own lamps from outside.** Same mistake; added `litSkip` so a
   house ignores the lamp inside it. The teapot now has a real dark side.
4. **Clay strata were flag stripes.** Now lens-shaped beds that thicken and pinch out, muted, with
   crevices under each lip and fissures.
5. **The yard was a stage-like ellipse with an ink ring, the path a flat pale strip.** Yard edge
   breaks into soil and loose bricks; the path is darker, footprinted, grass creeps over its edges.
Also: moles up ~20% (they didn't read), rack and bench brought nearer and bigger, saggar wall made
irregular (sagging courses, round saggars end-on), heat pipe thickened and propped on a post.
