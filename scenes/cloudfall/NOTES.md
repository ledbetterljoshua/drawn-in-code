# Cloudfall Isle

A floating island at golden hour: a crooked three-storey cottage, a windmill, a pond spilling over the
edge as a waterfall into a sea of cloud, and the frogs who live there.

## Round 1
First full pass. All layers in; clouds look scaly (per-lump shading), cloud sea has hard seams under each
row, god rays too strong, roots read as stilts, smoke is a string of pearls.

## Round 2
Clouds shaded as one mass; cloud sea rows filled with a second row of lumps; god rays at half strength;
roots tapered and shortened; smoke slower and looser. Joshua: "lovely, but a lower bar on quality than
the original".

## Still wrong after round 2 (the brief for round 3 on)
- The perspective: frontal houses on an island top seen from above.
- Materials are generic: the stone wall is a grid, the wood has no grain, the roof tiles don't vary.
- The rock face is a gradient with dashes; it needs real form, ledges and overhangs.
- Leans on god rays and glow to make the light; the light itself (cast shadows, contact shadows,
  bounce) is mostly missing.
- Detail density is even everywhere instead of clustering at the cottage.

## The world, restated (round 3)
- **Who lives here:** a household of frogs. Someone always at the door, a grandmother upstairs, a
  stargazer on the turret, a miller on the mill's stage, a gardener, a sleeper in the hammock, a
  fisher on the little rock, and a balloonist who lives tied to the peach tree.
- **When:** the last hour of a clear evening. The sun is low on the right and a little in front of
  us, so every right-facing wall glows and the long shadows run back and to the left.
- **The eye:** lands on the cottage's sunlit front and its open door, goes up the turret to the
  stargazer, across to the mill, down the waterfall, and out along the bridge to the fisher.
- **Moving on its own:** sails, washing, smoke, the hammock, the waterfall, the duckling, the
  balloon, roots, clouds, motes. The thing people tell a friend about: race the mill and the whole
  drawing gets windy.
- **Only here:** the frogs' vernacular: mended sails, flour sacks, a signpost pointing NOWHERE.

## Round 3: the perspective, rebuilt
Threw out the old flat drawing and rebuilt on one camera: an orthographic view looking down 18°
(`kit.js`). Plan coordinates X/Z, height Y; `CF.pr` puts a point on the artboard and `CF.plane`
/ `CF.wall` / `CF.quadM` give the matrix of any flat surface, so stones, timbers, tiles, windows
and doors are drawn flat in their wall's own coordinates and carried onto it. The cottage now
stands at an angle on its plot, long front in the sun, gable end in shade. Found a second
perspective contradiction the brief didn't list: the old horizon sat *below* an island top we
were looking down on. The horizon is now high, above the island, and the cloud floor recedes up
to it in rows; things floating above the horizon are seen from beneath, things below from above.
The rock is built as bands of facets, each shaded by its own normal against one light, with
overhangs and mossy ledges. Cast shadows are real projections of each building's volume. Split
into `kit / sky / island / cottage / mill / garden / main`. Artboard 1600×1100.

Worst five after the first shot, fixed in the same round:
1. The cloud floor was bubble-wrap: identical lumps in identical rows, no value structure, and
   it stopped short on the phone. Now each row breaks into separate mounded masses with shaded
   valleys between, and rows run on to the bottom of whatever screen it's on.
2. The rock read as purple planks: too little light contrast, strata lines like wood grain. Gave
   rock its own steeper light curve, broke strata into short courses, cut the overhang shadow.
3. Roots under the tip read as stilts. Fewer, shorter, none on the lowest bands.
4. A soft-light pass bleached the sun side of the clouds white. Halved it; added a cool shade
   across the far side.
5. The island was small in the desktop frame. Cropped the artboard to 1100 tall and lifted
   everything 60, so it's ~9% larger.

## Round 4
1. The brook was a raised blue pipe laid on the grass. Now a channel cut in the turf: water a
   little below ground, its far bank a strip of earth, grass hanging over the near edge, two
   stepping stones.
2. Back facets of the rock poked up through the grass at both tips of the island (their ink and
   rim-light strokes). The rock now only builds the front half; the grass overhang thins to
   nothing where the edge turns away from us.
3. Chimney smoke was outlined bubbles. Now soft puffs, shade low-left and lit top-right, no ink.
4. The gardener and her cabbages were hidden behind the fence, and the cabbages read as one
   green caterpillar. Lowered the fence, drew the cabbages as separate rosettes with pale hearts,
   moved her out onto the path by the bean poles. Found the cause of a deeper bug while there:
   everything in front of the cottage (garden, sunflowers, hive) had a lower z than the cottage
   and was drawn behind it. Re-layered by depth.
5. Roof moss was confetti. Now four clumps where the roof stays damp, olive not grass-green.
Also: the turret's lower window was a black slab (now an arrow slit); NOWHERE was clipped; the
canopy had rice-grain highlights; the sunflowers stood in front of the door lamp (moved past the
corner); stepping stones were too big for frogs.

## Round 5 (fresh-eyes critic, screenshots only)
The critic's ten, worst first, condensed: (1) the rock underside is the laziest passage: strata
ignore the cone, sticker crystals evenly spaced, identical roots, a skewer at the tip; (2) no
focal point, a picket-fence skyline, the island dead centre, the balloon touching the tree;
(3) "a different camera per object" (not so: the mill tapers and the pond shares the island's
tilt, but the roof's right edge has no barge and the dormer floats); (4) the light is announced
but not applied: no raking shadows across the grass, daylight halos on every lamp, generated-
looking motes; (5) clone repetition: cabbages, pumpkins, stepping stones, five confetti
islands; (6) one line weight at every distance; (7) the cloud floor is wallpaper with no big
masses; (8) the waterfall is a pale rectangle; (9) the grass lip and vines are combed; (10) five
frog clones with nothing happening between them, and a literal signpost.

Fixed this round:
- Rock: strata are now level courses carried round the cone, so they bow with the form and dip
  left; per-facet strata gone; each slab drifts a little ochre, plum or pale; a pink bounce from
  the cloud floor comes up into the shaded underside; crystals are three clusters of 5, 3 and 2
  prisms; roots taper to hair, bend, and split into rootlets; the lantern hangs from a root on
  the sunny side and the tip trails a short tangle; the five confetti islands are three chunks
  of different sizes near the tip, one still trailing a root.
- Composition: island moved right of centre; skyline stepped (tree lowest, turret higher, mill
  tallest); balloon pulled up and left, clear of the crown.
- Light: the sun swung more side-on so shadows run left across visible grass; lamp halos cut by
  a third, bridge lanterns by half; motes cut from 50 to 22 and dimmed.
- Cloud floor: three big cumulus banks heaped up out of it, left, right and near left: the
  large shapes the floor needed.
- The signpost reads HOME and NOWHERE and isn't hidden by the mailbox any more; the sky-fish
  nibble round the bobber instead of floating beside the line.
Left for round 6: waterfall, grass lip and vine curtains, the frogs' shared moment, line weight
by distance, small-object shadows.

## Round 6
1. The waterfall was a ruler-straight pale strip that faded out mid-air. Now the brook's water
   shoots out over the lip on a real arc (outward speed plus gravity, in plan), falls as one
   inked sheet, tears into three ribbons that drift apart, and goes to spray and soft mist; a
   lit roll of water where it goes over, the gust pushes it.
2. The grass lip was a combed fringe and the vines hung like evenly spaced strings. Now there
   are bites of bare soil, slumped clumps that hang further, and the vines gather in curtains of
   three to seven (one heavy curtain each side), with a couple of strays.
3. The light still wasn't applied to the small things. Every flower, pole, the hive, the barrel,
   the hammock post, the frogs, the barrow and each fence post now throws a long thin shadow to
   the left, the way they all would an hour before sunset.
4. Nothing happened between the frogs. Now there's one shared moment: when the fisher lands a
   catch, everyone turns to look: the door frog, grandma, the miller, the gardener, the
   balloonist, and the stargazer swings her telescope round to it (`CF.attn`, `CF.lookAt`).
5. The roof's right end had no barge board and the dormer floated on the tiles. Added the barge,
   a lead apron and a cast shadow down the roof under the dormer. Sky clouds' ink lightened.

## Round 7
1. The phone frame's top 40% was empty sky and its bottom 30% filler. The sky now goes on up
   into the first faint stars, with a neighbour's island floating far overhead (seen from
   underneath, so only its rock and the fringe of its trees) and a second, smaller one; low in
   the cloud floor a school of sky-fish porpoises in and out of the cloud tops (hover: scatter).
2. The sky cumulus had ruled-flat bases and heavy ink. Now a base of small lumps, a lavender
   underside in shadow, the sun-side tops warmer, lighter ink.
3. The rock's left half was one undifferentiated mass with no story. Swallows have mud nests
   under the turf overhang there and loop out and back (hover: they swoop round the pointer);
   ferns grow from the cracks on the wet side.
4. The hedgehog's door had no way in or out. A rope ladder now hangs to it from the turf above.
5. One of the new high islands was cut by the phone's left edge; moved.

## Round 8 (second fresh-eyes critic)
The critic's ten, condensed: (1) the near cloud floor still looks generated: one bump, one
lavender outline, wallpaper; (2) bullseye composition, the tip jammed on the bottom edge, the
phone crop dead weight, tangents (a far islet kissing the crown, an islet's waterfall landing
on a cloud like a pole); (3) no value structure: the rock's left flank the same value and hue as
the lavender clouds behind it; noon-lit clouds under the phone's stars; (4) the rock still
reads as crazy paving: every facet edge as heavy as the silhouette, crystals pasted on, the
little chunks one stamp; (5) "the tree and turret are lit from the left" (checked in close-up:
they aren't; both are lit from the right, so no change); (6) "the mill is a flat elevation"
(it isn't: its sails sweep an ellipse in their own plane; no change); (7) scale drift: frogs
of different sizes, pumpkins bigger than the gardener, a head-sized mailbox, a toy balloon;
(8) the front-left strip is an inventory of equal-weight props; (9) one line weight
everywhere; (10) the frogs' gags are scattered, and the sky-fish school reads as a bug.

Fixed:
- A warm, crisp foreground bank of cloud now crosses in front of the tip and the waterfall's
  end, with more saturated shade than anything behind it; the near rows of the floor lost their
  outlines and their heads vary far more in height.
- Island moved further right and up, so it sits off centre and the bank crops it, not the
  frame; `slack` 0.72 so the phone shows the island 20% larger; balloon larger (it's tethered
  to the tree, so it's near) and clear of the crown; the islet that kissed the crown is gone;
  the high islets moved clear of the phone's edges, their waterfalls fade out.
- Value: the rock's core shade on the left is deeper and the pink bounce cut by half, so the
  silhouette holds against the clouds. High clouds on the phone take the dusk: cooler,
  darker undersides, warm tops.
- Rock facet edges at half the weight of before, band lips kept heavier: big planes first, then
  courses. Crystals sit in a dark fissure and throw a cold light on the rock round them. Each
  chunk under the island is its own shape.
- One frog height as the unit (0.72 to 0.85); pumpkins shrunk, mailbox shrunk; roof tile lines
  thinned; the wheelbarrow and the carrot bed cut so the garden is one cluster.
- A static story at the focal point: the cottage door now rests ajar, lamplight on the step,
  tea steaming on the bench outside.
- The sky-fish school is a clear stream of fourteen with splash rings where they surface.

## Round 9
1. The foreground bank and the sky clouds had their tops sliced flat: their sprites were shorter
   than the tallest heads. Sprites now leave room for them.
2. The resting door didn't read as ajar. It now stands half open on the lamplight, someone just
   inside.
3. The gardener's hat brim sat on her eyes like sunglasses; raised it.
4. The flour-sack labels were clipped by the sacks in front; only the front one is lettered.
5. (Checked, not changed: the left cloud bank is paler and flatter than the right one. That's the
   side away from the sun, so it should be.)

## Round 10 (third fresh-eyes critic)
Asked this critic, besides the usual ten, which of its points would visibly improve the picture
at full-frame size. It named six: (1) the rock's belly was the largest, darkest mass and pulled
the eye off the story; (2) the foreground bank swallowed the tip so the island seemed to sit in
the clouds (the opposite of round 8's critic, who asked for the bank; I sided with the idea of
the picture: it floats); (3) the floor's rows still stamped, with one lavender rim; (4) the
phone's sky wisps looked like scanlines and the high islets like striped icons; (6) a
near-black hole under the tree where shadows stacked; (10) the waterfall dissolved with nowhere
to land. Its claim that the roof is twisted off the walls is wrong: ridge, eave and window
lines are parallel by construction in this camera.

Fixed:
- The belly hazes back toward the cloud colour as it descends; the grass lip got a warm rim on
  the sun side. The rock is now darkest just under the lip.
- The bank moved to frame the corners; the whole tip and its chunks hang in clear air.
- No ink at all on the floor rows; heads vary from 0.6 to 1.4 of the row's size. A big designed
  bank in the phone's lower third.
- Wisps are tapered, curved, and fewer; the high islets lost their stripes.
- Shadows are painted flat into one mask and laid over the grass once, so overlaps can't stack.
- The waterfall runs on down and ends in a warm plume of mist where it reaches the floor.
- (Also: the fisher's and gardener's hats sat on their eyes; the stargazer was hidden behind
  her rail, so she stands on a crate.)

## Round 11
Looked only at full-frame size. One thing would visibly help: the door, which is the focal point,
didn't announce itself. Its lamplight now falls out of the open door in a warm wedge across the
step and the path, the warmest accent in the picture. Waterfall mist puffs halved (they read as
a glint). Nothing else I could name changes the full frame.
