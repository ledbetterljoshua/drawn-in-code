/* Kilnhill — a hill of mole potters on the third night of the great firing. Their houses are giant
   thrown pots, pierced like lanterns; in the middle a brick bottle kiln burns. Every light in the
   picture is a fire someone made: nothing comes from the sky.

   Files: kit.js (light model, colour, rigs) · world.js (the fires) · mole.js (the mole rig) ·
   sky.js · hill.js · kiln.js · houses.js · fore.js · life.js · light.js · this file (starts it).

   Reactions (hover or tap; each part's header says more):
    1  stoker — throws a scoop of salt: the fire flashes green, a white plume bursts from the chimney
    2  far towns — answer the salt flash, one after another; hover them and they signal back
    3  spy-hole watcher — pulls the bung; the pyrometric cones inside bend one by one, then he nods
    4  side firemouths — roar up and spit sparks
    5  pup at the firemouth — its toasting mushroom catches fire and it blows on it frantically
    6  chimney plume — a burst of sparks; the pointer parts the new smoke
    7  teapot house — lid lifts on a spring, a mole peeks out, steam from the spout, the lamp spins
       faster so its dots of light swirl over the terrace
    8  lantern pot — the lamp inside turns and its stars crawl across the clay face
    9  jug tower — the shutter swings open and a mole leans out and waves
   10  bowl house — the door opens, someone leans out; the washing line swings
   11  jar stack — wobbles on a spring and the mole on top grabs the rim
   12  lantern kite — dips on a tug and climbs back; linger and it loops
   13  workshop — the pot on the wheel rises taller and taller, then slumps; the potter sighs
   14  heat pipe — a pulse of glow runs along it and each house it reaches brightens
   15  hill door — swings open; a mole in a nightcap steps out with a candle
   16  digger — stops to catch its breath; linger and it finds a worm, delighted
   17  hoist — the basket of clay is hauled up to the terrace and lowered again
   18  carrier on the ladder — freezes; the stack of greenware wobbles and it steadies it
   19  upper burrow — a snout comes out sniffing
   20  wall burrow — a sleepy mole yawns and pulls its head in
   21  front burrow — a whole family of noses appears, oldest first
   22  drying rack — greenware wobbles like dominoes in the direction you moved
   23  cooling bench — the glaze crazes as it cools: tink, and crackle lines spark across it
   24  sleeper — rolls back, smiles wider, more Zs; linger and it scratches its nose
   25  watchers — the pup hops and points, the parent lifts its mug; linger: an arm round the pup
   26  lantern post — the lantern swings and its ring of dots sways over the ground
   27  sherd chime — clacks and spins
   28  puddle — ripples out from the pointer
   29  ground door (phone frame) — a mole climbs up and looks out
   30  bats — the nearest swerves and the rest follow
   31  moths — drawn to a pointer that lingers near a lamp, scattered by a quick one
   Idle: the fire breathes and the whole hill's light breathes with it; sparks and smoke rise;
   the wheel turns; the stoker shovels; the watcher squints and takes notes; the digger swings;
   the carrier climbs; teapot shadows pass windows; steam, heat shimmer, washing and chimes in
   the shared wind; bats and moths; the kite rides the breeze. */
Drawn.start({ W: Kiln.W, H: Kiln.H, slack: 0.72, hint: 'hover the fire, the moles, the houses' });
