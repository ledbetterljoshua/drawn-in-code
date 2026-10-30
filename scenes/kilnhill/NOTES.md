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

## Round 2
1. **Moles read as rats** (long snouts, lanky pear bodies, brown). Redesigned: chunkier, darker
   velvet with a cool sheen, short pink snout, eyes up on the dome, much bigger spade paws, a stub
   tail.
2. **The left clay face was a big empty striped panel.** Gave it a story: a round green door into
   the hill with a lit fanlight, a mole digging clay out with a mattock (chips fly; linger and it
   finds a worm), a hoist with a basket of clay hanging off the terrace lip.
3. **Far hills invisible**: the hills were the colour of the sky. Now there's a warm haze band from
   the far towns behind dark hill silhouettes, with more windows.
4. **Bottom band was flat earth with scattered pebbles.** Fewer, bigger stones; a slip puddle that
   catches the firemouths' glow; a barrow of dug clay with a spade stuck in; on the phone frame a
   ground door in a mound with steps going down into light and boots left outside.
5. **Kiln brickwork was mechanically even.** Salt crust speckling the shoulder and arches (three
   nights of salt glazing), a patch of newer bricks where a crack was mended.

## Round 3 — fresh-eyes critique
A critic who saw only screenshots named ten things. The ones that mattered, and what changed:
1. **"Values sit in one muddy band."** True: sky, smoke, hill and ground were all dark maroon. The
   sky is now a cool deep indigo (still no moon or stars; it's just the colour of the dark), the
   town's warm haze on it is much smaller, and the main firemouth light has a steeper falloff
   (exponent 4.6 instead of 2) over a longer reach, so there's a hot pool at the kiln's foot that
   dies quickly instead of a warm wash over everything. Minor lamps shrank by ~25%.
2. **"Smoke is stacked flat discs."** Smoke colour now cools to blue-grey with distance from the
   chimney, with a few curling lit edges inside each bank to show it rolling.
3. **"Empty bottom third, no hero figures."** Added the nearest figures in the picture: a mole
   and its pup up late by the lantern post, watching the firing, the parent with a steaming mug,
   the pup pointing. They're 2× the scale of the stoker, so the picture has a near layer.
4. **"A ruler line runs across the foreground."** The near ground's edge undulates and has a soft
   shadowed crest instead of an inked line; grass now clusters (noise-gated) instead of stamping.
5. **"Every house wears the same star pattern."** Each house has its own piercing language now:
   teapot stars and moons, jug slots and drops, lantern pot a dense spiral of dots, bowl house
   crescents and triangles, jar stack diamonds; lamp colours differ slightly per house.
Also: the path is an S-curve, logs are oval and split and varied, the sleeper is a proper mole
slumped against the bench leg (it read as a slug), the far jar stack has lighter lines.
Rejected: "add a cool moonlight fill" and "stars through gaps": the lane is light from within only.
Disagreed: "brick rows run dead straight" — they follow the viewpoint ellipses; near eye level
they're nearly straight, which is correct.

## Round 4
1. **The mole rig looked crude at the near figures' scale**: tube arms, paws like pink flowers,
   flat grey fur. Arms now taper from shoulder to wrist with a lit edge; paws are broad spades with
   a pad and five short cream claws; the fire-side rim is stronger and always present; moles drawn
   big get velvet fur strokes along the silhouette.
2. **The upper right was still an empty black field.** The mole on top of the jar stack is now
   flying a paper lantern-kite on a long sagging string, the candle glowing through the paper and
   a tail of paper bows. It gives the sky a small lit accent that belongs to the world.
3. **The greenware on the rack was flat grey-blue with no light.** It now has a warm rim on the
   side facing the kiln and a dark far side.
4. **Teapot spout steam was grey blobs.** Now thin curling wisps.
5. Checked every hit area with `--hits`: all generous and matching the shapes.

## Round 5
1. **Crest and terrace grass glowed saturated green in the dark**: tufts above a terrain edge fell
   outside the light-map clip, so they kept their daylight colour. Tufts now take their colour
   from the light model directly and are drawn after the light pass: dark at night, warm only
   near a fire.
2. **Glaze edges were a regular sawtooth.** The glaze line is now a soft waver with a few rounded
   runs hanging off it, and the pots are faceted finer (3-unit rows, 40 slices) so the runs read.
3. **Glaze highlights followed each pot's own lamp** (a white stripe down the jug and jar stack,
   lit from inside). The highlight now ignores the lamp inside the pot it's on.
4. **Doors were flat yellow arches.** The teapot's door has an inside now (far wall, rug, a chair
   back) and its door leaf stands open against the jamb.
5. **The thorn tree on the right knoll read as balls of dark smoke** next to the jar stack.
   Removed.

## Round 6 — second fresh-eyes critique
The second critic (screenshots only) led with the smoke, the phone frame, the shelf of buildings,
the clip-art flames and depth. What changed:
1. **"The smoke is a stack of circles."** Rebuilt as one designed shape: a ribbon along a spine
   that leaves the lip tight, twists, shears right and thins to wisps, with billows only on the
   leading edge, a smoother underside lit near the chimney, fold lines where it turns, and a soft
   edgeless haze high up instead of the disc ceiling. It exits the top of the desktop frame early,
   so it covers far less sky.
2. **"Flames look like clip-art"** (zigzag crown, a row of ellipses). Flames are now a handful of
   large licking tongues (`Kiln.tongue`) with curled tips and a gradient from a white-yellow root
   to a dark red tip, a different count and rhythm per firemouth, bent by the shared wind.
3. **"Every building sits on one baseline; kiln and teapot compete."** The teapot stands a step
   further back up the terrace at 84% size, so the kiln is clearly first and the bowl house
   overlaps in front of it.
4. **"Brick outlines buzz; no depth from atmosphere."** Mortar is darker so the brickwork reads as
   a surface, not a grid; the far jar stack sits behind a layer of night haze with lighter lines.
5. **"Phone path leads nowhere; ground is procedural noise; shelf is clone-stamped."** The path
   now ends at the ground door on the phone frame. Random ground blotches replaced with designed
   wear: barrow ruts running up to the kiln steps, spilled clay, a trodden patch where the
   watchers stand, raked ash. The rack is cropped harder off the left edge with fewer, spaced pots.
   Round saggars (read as tyres) removed from the wall. The dug alcove read as a hooded figure, so
   it's now just pale fresh-cut scars in the clay face.

## Round 7
1. **The kiln was still warm from base to collar** (critic 2, point 4). The yard's bounce light now
   dies faster up the wall, and the upper bottle sits under a night shadow gradient, so the
   brickwork is lit at the foot and sinks into dark toward the lip.
2. **No heat at the firemouths' edges.** Ember glow now bleeds onto each arch's brick lip and its
   sides, breathing with the fire (green during a salt throw), with faint heat shimmer rising off
   the main mouth.
3. **The jug's waving mole never showed**: it stood too low for the window. Raised into the frame.
4. **Too slow on a phone.** 13 cached still bitmaps were composited every frame because live
   layers sat between stills. Regrouped z so stills merge into 5 buckets (moved the front burrow
   out from behind the rack to under the bench). With the CPU throttled 4× in headless Chromium:
   desktop 17 → 26 fps, phone frame 21 → 31 fps. Unthrottled: 60 fps on both.
