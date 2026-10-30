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
