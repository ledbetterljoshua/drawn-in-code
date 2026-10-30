# The Chambered Ark

## Finding the world

Three candidates (lane: a cutaway):
1. A termite-mound city on a dusk savanna, sliced like a cake. First idea, the one everyone has.
2. A grandfather clock in an attic, opened up, a family of moths living between the gears.
3. **A giant chambered nautilus drifting over a shallow reef, sliced along its midplane, every
   chamber crewed by small sea creatures who keep the old shell afloat.** The strangest one I can
   still draw well, and the cut is the most famous cross-section in nature.

Picked 3.

- **Who lives here, doing what?** A crew of small sea creatures who run the ark from inside the
  spiral: a hermit-crab captain at the wheel, an octopus cook, shrimp working the buoyancy pump,
  seahorses asleep hooked on a rail, a snail librarian, a nudibranch gardener, a squid who paints
  with her own ink. The nautilus itself is alive at the aperture, eye open, tentacles adrift.
- **When, what weather?** A calm late afternoon in a shallow tropical sea, about four metres down.
  Sun low in the upper left: warm light from the surface, caustic nets on the sand, cool teal
  ambient everywhere it doesn't reach. The rooms are lit warm by jars of glowing jellies, so the
  inside reads warm against the cool sea.
- **Eye path.** First the big spiral silhouette and the nautilus' eye at the aperture (strongest
  contrast, highest saturation); then the wheelhouse and galley in the big outer chambers; then
  round the spiral inward, chambers getting smaller and smaller until the single pearl at the centre.
  Out to the edges: kelp, the garden eels on the sand, a turtle in the haze.
- **What moves untouched?** The whole ark bobs on its buoyancy; tentacles drift; kelp leans in one
  current; bubble-mail rides the siphuncle from room to room; every creature has its own idle and
  blinks. The tell-a-friend: work the pump room and the whole ark rises in the water.
- **Only here.** The architecture is the shell: crescent rooms whose walls are septa, nacre walls
  that shimmer, driftwood floors laid level across curved chambers, the siphuncle as the ark's
  lift and speaking tube, portholes drilled through the shell wall.

## Composition

Artboard 1600 × 1150, landscape. The cut face is the picture plane, so the perspective is a clean
frontal section; the uncut body chamber (bottom left) stands toward us and shows the striped outside
of the shell, so we see outside and in at once. Spiral centre right of middle, the nautilus faces
left into the light and the open water. Sea surface above the artboard (phone shows it), seabed below.

## Round 1 — first full pass
Block-in settled the spiral (log spiral, K = 2.7 per turn, 11 chambers a turn, the body chamber left
whole), then everything went in together: water, haze ridges, sand, caustics, kelp, the shell's two
sprites (hollows + furniture behind the crew, cut face in front), the nautilus, nine outer rooms and
thirteen inner ones, bubble-mail on the siphuncle, the pearl's light-wave.

Worst five, looking at it cold:
1. The nautilus' hood is a brown egg and the body under the eye is a flat pink slab; the head is the
   focal point and it's the weakest drawing in the frame.
2. Kelp reads as bamboo: straight poles, hooked leaves, evenly spaced like a fence on both sides.
3. The haze coral are bunches of grapes (lumps) in a row; no variety of form, nothing that says reef.
4. The phone frame is half empty sand; the near seabed has no foreground at all.
5. The siphuncle's gold collars make a target of the coil; the inner whorls read as a clock face.

## Round 2
Fixed: the head is now one soft mass (hood, face, eye, a fringe of sheaths and cirri) instead of an egg
on a slab; kelp blades are long ribbons with floats; the reef has real forms (brain domes, staghorn,
table coral, tube sponges, fans) fogged by depth; boulders with coral, sea grass, garden eels that duck
when you come near, a starfish and shells, an anchor and the mooring line from the keel. The siphuncle's
collars are pearl and scale with the whorl. Found that the engine's lumps() is lit from the upper right
while this sea's sun is upper left; mirrored it (A.lumps) and flipped the coral highlights.

Worst five now:
1. Kelp still reads as a garden fern: paired leaves up a straight pole, all strands the same height.
2. The left third of the desktop frame is empty water and kelp: no secondary point of interest.
3. Rooms are pale lilac and evenly lit; the jelly-light doesn't pool; interiors don't feel warm vs sea.
4. The body crescent is a big blank cream fan; its stripes are thin rays like a paper fan.
5. Rocks in the phone foreground are dull grey mounds with tiny coral on top.

## Round 3 — after the first critic
The critic (screenshots only) named ten: the head as a bread roll on a pink plane with a broom of
straight cirri; the cutaway with no depth (flat lavender rooms, lanterns that light nothing, thin cut
rim); no focal room, the inner whorls a procedural pinwheel; the ark not grounded; generated-looking
kelp as bookends; a stamped phone crop; one line weight everywhere; flat shell and candy-coloured reef;
a story that contradicts itself (moored, yet a captain at the wheel); a lazy scribble caustic.

Did:
- Light: each room's jelly-light is now an additive pool drawn over the furniture *and* the crew,
  breathing with the jellies; hollows darker and cooler, with deeper corner falloff; small inner
  chambers sink toward dark so the wheelhouse and galley carry the picture (hero rooms get a stronger
  pool). Septa are thick pearly slices with a lit side and a shaded side. Contact shadows under the crew.
- Head: the hood wears the shell's own rust flames, lies back over the coil, tubercles; cirri grow in
  bunches from ringed sheaths, back bunches darker; the fang under the funnel is gone.
- Story: committed to under way. Anchor and mooring line removed.
- Kelp: blades stream downstream off mostly one side, irregular spacing and lengths, strands of
  different heights, fogged line colour with distance, one short strand in front on the left.
- Phone: slack 0.7 so a portrait screen crops the sides and the ark is half again as big; one big
  near outcrop instead of three clones; surface brought down into view.
- Caustics: a warped Voronoi net built once as pixels, finer and flatter with distance.
- Reef: distant forms fogged harder, no table "mushrooms" in the haze. Eels have burrow mounds.
- A sea turtle, a fusilier school that scatters from the pointer, two moon jellies.

## Round 4
Looked at every hover (wheelhouse, pump, galley, nautilus) and the hit map. Measured speed: headless
software Chromium gave 18 fps at 1440×900 @2x, which sent me hunting; the costs were spread thin
(shafts, caustics, room light, kelp, the two shell sprites ~5 ms each in software). Real Chrome with
the GPU holds 60 fps desktop @2x and phone @3x, worst frame 16.8 ms. Kept the cheap wins anyway:
shafts painted at quarter resolution every third frame, kelp blades without clip/inner strokes, small
rooms' light baked, the shell's bob translate-only (no per-frame rotation of the big sprites).

Worst five, and what I did:
1. The body crescent was a big dead cream fan → the sea's caustic net now plays over it (slow, faint),
   stripes vary in width and spacing, a crust of barnacles along the keel, a cleaner wrasse working
   the shell (hover: it darts off, then comes back to its job).
2. The coil centre read as a clock face → septum ink thins and lightens toward the coil, chamber
   outlines scale with size, so the oldest chambers go quiet.
3. Every room lit by the same jar → three kinds of light: jelly jars, scallop-shell sconces with a
   glowing sea-pen, a jelly on a tether drifting in the observatory and the garden.
4. Caustics on the shell first read as crackle glaze → bigger cells, much fainter, one tall tile (no seam).
5. Barnacles first came out as upside-down cups mid-shell → plate volcanoes seen from the side, on the keel.

## Round 5
Worst five:
1. Kelp, still a fern on a pole → rebuilt the blades as twisting ribbons: narrow where they turn
   edge-on, the paler underside showing past the twist, a gradient from dark base to a backlit tip,
   lengths from 45 to 200, fewer and irregular; brown line instead of plum; far strands unlined.
2. Grass tufts sprinkled evenly at one size → meadows gathered round the rocks and the eels, thinning
   over open sand, scaled with distance.
3. Sheaths on the face read as popcorn cups → lower contrast, lighter line, closer to the face colour.
4. (kept) values are mid-everywhere; the cut face's whites carry the read. Watching.
5. (kept) the eel colony is a picket line at full frame. Watching.

## Round 6 — after the second critic
The second critic: the rooms don't read at desktop size (an inventory, not a scene); the coil reads as
a concentric bullseye; the head is a salmon box with a bowling-ball eye; interiors cold lilac, no
belly shadow on the shell; broom tentacles; kelp as wallpaper; procedural textures (Voronoi on the
shell, evenly sprinkled dots, identical barnacles, a translucent gloss band over the stripes); one line
weight; flat midground cutouts; a phone crop that floats the shell in a third and gives the bottom to a
grey rock.

Two of those I'd have argued with (the spiral *is* logarithmic) until I looked again: the siphuncle,
run all the way in along the inner wall of every whorl, drew a ring per turn, and that is the bullseye.

Did:
- The ark is drawn 12% larger and a little higher (A.SC / A.OFF: shell space scaled onto the artboard,
  sprites painted at the higher resolution, hit tests and particles mapped through it).
- The siphuncle now runs only through the last turn and a half and thins into the wall; no rings.
- Interiors warmer (less lilac in the nacre), amber pools stronger; everything inside the shell is
  inked in a lighter, warmer ink (A.INK_IN) so the rooms stop turning to mush; the silhouette keeps
  the heavy dark line.
- The whorl's belly turns blue away from the sun; the gloss band over the stripes is gone; some
  flame stripes fork; caustics on the shell barely there; barnacles vary from specks to big ones.
- The eye has a lid resting a third down (calm), lifting when you come near or move fast, and a brow
  fold: she has an attitude now. The face is shaded (hood shadow, a lit cheek, falling into the aperture).
- Cirri in four clusters, each curling its own way, a darker back row behind each.
- Kelp bows downstream in the current with its own lean and thickness per strand; the front strand
  moved off the face.
- Phone: sky above the surface cooler, the big near rock pushed down so it's cropped.

## Round 7
Worst five:
1. The cirri sheaths read as four metal nozzles with brooms in them → soft fleshy collars in the face
   colour, the cirri leaving from under them.
2. The haze ridges ended in a hard horizon band → a wash of water rises over the top of each ridge so
   it dissolves upward.
3. The eel colony was a picket fence at one height → nine eels at staggered depths, nearer ones taller,
   each with its own lean.
4. The chin was a right-angled jaw → a rounder underside to the head, the funnel tucked beneath.
5. (kept) the turtle and the school both sit in the upper-left quadrant; the lower left is kelp and rock.

## Round 8
Close-ups of every room at the new scale.
1. The siphuncle, drawn in short capped pieces to fade it, became a beaded chain looping round the
   second whorl (a ring again) → one slim continuous tube, faint where it enters the older coil.
2. Septa were uniform white tubes ("hamster tubes") → each is a pearly band thin across the middle and
   flaring where it grows from the walls, lit on the sun side, the nacre showing on the far side.
3. (checked) wheelhouse, galley, pump room, library, garden, bunks, band, lamps and the inner rooms
   draw cleanly at 2×; the warm pools now carry the hero rooms.
4. (kept) the telescope on the roof reads as a stick at full frame.
5. (kept) the eel colony is small at desktop size.

## Round 9 — after the third critic
The third critic: a grey elliptical "lid" between the rooms and the body chamber (the cut seemed to
change view partway round); the head reading as a human face in a beanie (lip-like collars); no rim
light or core shadow on the shell; materials (chrome septa, a rail through the chambers); a crackle-
glaze caustic everywhere, shell included; mirrored corners; tangents (kelp through the cirri, jelly and
turtle kissing the silhouette); copied lanterns; no story beat linking inside to out; flat values,
peach cirri lost against a peach face; an empty top on the phone.

Did:
- The "lid" was the room light adding over the dark pocket under the wheelhouse floor, plus a grey
  keel stop in the shell gradient: room light now clips to above its deck (under-floor stays dark),
  the sawn-edge quad is gone (the cut is flush on one plane), the keel stop is warm.
- Story beat: left alone, the observatory goby keeps the telescope trained on the old turtle as it
  cruises past (and the turtle comes round again behind the ark).
- The scope through the roof is a three-draw brass spyglass with a dew hood, not a stick.
- Sun rim on the shell's upper left much stronger, a deeper teal core along the lower right.
- Caustics: the net is faint everywhere and bright only in drifting patches; none on the shell.
- The right corner is a great brain coral with two sea fans instead of the twin of the left rock.
- Cirri cooler and darker (mauve) so they separate from the face; the collars are small and soft.
- Jelly and turtle moved off the silhouette; the front kelp moved clear of the face.
- A manta glides far up near the surface (only a tall screen sees it), filling the phone's top.

## Still wrong (for whoever picks this up)
- The head still has a faintly human profile (brow, nose-tip hood, chin); a real nautilus head is
  stranger. It wants a redraw from reference, not more tweaks.
- The small inner rooms all hang the same jar lamp; the coil would be better with a few rooms dark,
  used as storage, so the lit ones count.
- The septum at the back of the body chamber is the thickest band in the drawing and, with the
  crescent's coil edge, still reads a little like a rim where the cut meets the whole whorl.
