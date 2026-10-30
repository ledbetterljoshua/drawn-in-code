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
