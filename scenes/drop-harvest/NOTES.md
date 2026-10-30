# The Drop Harvest

## Finding the world

Three worlds, weather first:

1. **Fog harvest.** A cliff village of moths that net the sea fog at dawn; nets drip into cisterns, a
   fogbow stands over the bay. Lovely, but fog flattens value: hard to make bold, and it is mostly grey.
2. **Supercell over the rye.** A lone farmstead of hares battening down as a shelf cloud arrives; the
   eerie gold-green light under a black anvil. Dramatic, but the cloud is the only idea; the inhabitants
   would be generic "hurrying" and lightning wants to flash (loud).
3. **The drop harvest (picked).** A summer cloudburst seen at the scale of the things that live in a
   puddle. A raindrop here is a wobbling glass ball the size of a body, so the pill-bug folk of a mossy
   island go out in the storm with woven slings to *catch drops whole* and roll them into an acorn-cup
   cistern before the sun comes back. Strangest of the three, and every surface is water to draw.

- **Who, doing what right now:** pill-bug haulers rolling a caught drop up a bark ramp into the acorn
  cistern; a ladybird under a clover umbrella waiting for the ferry; a snail poling a leaf-boat across
  the puddle; a bumblebee sheltering in a foxglove bell; a spider guarding a web strung with drops; a
  moth wrapped in its wings under the leaf; an earthworm surfacing because it rains.
- **When, what weather:** late summer afternoon, a cloudburst with the sun breaking under the storm
  (a sunshower). Slate-violet sky, the low sun *behind* the island, so every drop and leaf edge is
  backlit gold and every front face is in cool shade.
- **Eye path:** the drip tip of the Great Leaf and the haulers beneath it, rimmed against the sun (focal,
  ~0.6 across) → the gold glitter path in the puddle down to the snail ferry → the jewelled web and the
  foxglove bee upper left → the sheltered houses under the leaf on the right.
- **Idle motion:** the rain (three depths, gusting in curtains), splash crowns and rings, the leaf
  jolting under hits, drops sliding off tips, ripples bending the reflection, everyone breathing,
  blinking and working. **The thing people tell a friend:** your pointer is an umbrella. Rain splashes
  off an invisible dome over it, and whoever is under it looks up.
- **Only this world:** drops as cargo. Raindrops are falling buns (flattened, not teardrops), stored
  drops are glass melons each holding a tiny upside-down sunset, and the architecture is
  mushroom caps seen from below (gills), acorn cups, woven grass gutters and a stem waterwheel.

Viewpoint: eye level at the water (horizon y≈700 on a 1600×1200 board). We look *up* at the island
top, so houses stand on its ridge and mushroom caps show their gills; puddle ripples flatten toward
the horizon.

## Round 1 — first full pass

All parts in: sky, far bank, four depths of rain, puddle with reflections, leaf, island, three houses,
haulers/netter/tally, foxglove + bee + web, ferry + strider, near bank, ladybird, worm, stone, grade.
The rift and the island-against-the-sun read at once. Five worst things:

1. **Clouds are chains of rings.** `crescent()` fills even-odd, and a union of circles XORs itself, so
   every lump outline shows. Storm decks are long flat rolls lit underneath, not bubbles. → paint
   unions with clip-intersections (cel: dark crown, base, lit belly), long flat ellipse lumps, no seams.
2. **The far grass reads as a forest of poles,** and the tall near blade bisects the rift. → five
   broad blades that arc over and lean, hazed toward the sky; bend the near blade over the web.
3. **The island is a light-brown loaf** with polka-dot pebbles and comb-tooth roots, too warm for a
   backlit mass, and its mirror image doubles the weight. → darker face, lower and lumpier profile,
   moss overhanging the face, pebbles clustered at the waterline, roots in hanging tangles; a darker,
   streakier reflection.
4. **The focal group is specks.** Cistern, haulers, netter are 20 px on the desktop frame; the village
   under the leaf is tiny on a huge mound. → scale the island's props ~1.35×, cistern bigger, gentler
   slope for the haulers.
5. **The leaf is a flat lime cutout on a pole,** zigzag teeth, faint veins. → olive underside with the
   glow concentrated by the tip, a darker vein network, wavy (not toothed) margin, a thick curved stalk.

Also: the deck's lit belly is drawn in 11 px columns (stepped); the near bank is a flat lawn tile with
a vertical cut edge on the phone; edge blades are black slashes; rain is too faint to be the star.

## Round 2

Fixed: cloud unions now cel-shaded by clip intersection (`DH.cel`), long flat rolls with a lit hem;
deck belly stroked along its edge with a horizontal gradient (no columns); island face dark and cool
with root tangles, bracket fungi, stones clustered at the waterline; props on the island 1.35×; glass
drops mostly clear (tinted, thin gold band, caustic, sharp window highlight); pill-bug plates are bands
across the back, not a fan; the leaf hangs 56 lower on a thick grooved stalk, olive with the glow
pooled at the tip and a dark vein net. The hauling up a 50° slope was unreadable, so it became a
**twig crane**: the netter's catch waits on the jetty, two winders hoist it in a sling, the jib swings
up and over and lowers it onto the heap, the tally gets a notch. Rain density up by half.

Five worst things now:
1. **The puddle is dead**: half the frame is flat violet. It mirrors only the sky gradient (the moving
   clouds aren't in the reflection), the glitter is thin, nothing floats. → mirror the cloud rolls
   live, widen the reflected rift, add floating petals and seeds, gust cat's-paws.
2. **The near bank's moss is a row of peas with cactus spines.** → overlapping irregular cushions shaded
   as one union, a fuzzy silhouette of shoots, no per-cushion outlines; on the phone it's a vertical slab.
3. **Foxglove bells are flat paper cones** stacked like a ladder. → cylindrical shading, a dark open
   throat seen as an ellipse, bells turning round the stem, a curve in the stem.
4. **Far "leaves" float as translucent surfboards,** and bokeh sits in front of the island like soap
   bubbles. → darker, attached silhouettes; bokeh only low by the far bank near the sun, fainter.
5. **The heap's drops are flat-bottomed domes** that read as onions. → rounder, more varied sizes.
