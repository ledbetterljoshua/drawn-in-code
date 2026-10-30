/* The Drop Harvest — a summer cloudburst at the scale of a puddle. On a mossy island under a
   burdock leaf the pill-bug folk catch raindrops whole and roll them into an acorn-cup cistern
   before the sun comes back. The weather is the main character: it sets the light (a low sun
   breaking under the storm, so everything is lit from behind), the palette, and most of the motion.

   The parts, back to front: kit.js (shared world, light, drops, the storm's state), sky.js,
   far.js, rain.js, puddle.js, leaf.js, island.js, houses.js, folk.js, foxglove.js, ferry.js,
   samara.js, fore.js, grade.js.

   Reactions — idle (no one touching anything):
     1. rain at four depths, swelling and easing with the storm, leaning into gusts, sweeping
        across in curtains; gold where it falls in front of the sun
     2. every drop that lands leaves a ring (flatter toward the horizon), a crown, spray
     3. big drops fall right past the camera and throw crowns with jets
     4. the Great Leaf jolts on its stalk when drops hit it; water runs to its tip, swells into a
        pendant and drips into the cistern (the heap wobbles, the tally gets a notch)
     5. the winders crank the twig crane: the sling rises from the jetty, the jib swings over the
        top and lowers the drop onto the heap, then swings back for the next
     6. the netter's net catches drops out of the air and sags with them
     7. cloud masses drift, scud races across the rift, rain shafts hang under the far deck
     8. lightning flickers inside the deck every half minute; the rain thickens after the thunder
     9. the reflection wavers in strips; the sun's glitter path twinkles
    10. the snail ferry crosses the puddle and back, through the glitter
    11. the water strider skates about on dimpled feet
    12. beads hang and grow on the Cap House rim, then fall
    13. the lantern drops on their thread swing in the wind
    14. the sleeper in the Nut House snores (z), the moss capsules nod, the foxglove bells drip,
        the web billows, the worm sways, everyone breathes and blinks
   Reactions — the pointer:
    15. the pointer is an umbrella: rain splashes off a dome over it, beads run down and drip off
        its rim, and whoever is under it looks up
    16. the water strider keeps clear of it
   Reactions — hover:
    17. the storm clouds: thunder — the deck lights from inside, the rain comes down harder
    18. the rift: the sun pushes through; the rain and the glitter turn gold
    19. the far giant grass: a gust; it leans, the rain slants, everything gets windy
    20. the Great Leaf: it sags and pours a rope of water off the tip into the cistern
    21. the tip drop: it swells and lets go
    22. the moth under the leaf opens its wings and shows its eyespots
    23. the cistern heap: every drop wobbles like jelly
    24. the crane's winders: they curl into balls (pill-bugs do), the sling slips back, they uncurl
    25. the netter: he lunges and nets a drop
    26. the tally-keeper holds his tally up to show you
    27. the Cap House: the cap shudders and flings its beads, a child opens the door with a cup
    28. the Pod House: it rattles, seeds pepper out of its pores, a face looks out of a pore
    29. the Nut House: the sleeper wakes, yawns at the weather, curls back up
    30. the lantern thread: it bounces and the drops swing
    31. the moss: it squelches and bubbles rise at the waterline; the capsules shiver
    32. the burrow door at the waterline: grandmother woodlouse looks out at the rain
    33. the water: rings spread from the pointer and the reflection wobbles under it
    34. the ferry: the snail rings its bell, ducks its eyestalks, the boat rocks
    35. the bee's bell: the bee backs out, buzzes the wet off, climbs back in
    36. the foxglove: it sways and the bells shed their water
    37. the web: it bounces, beads shiver and fall, the spider holds on at the hub
    38. the ladybird: she twirls her clover and flings a ring of water
    39. the worm: it stretches up to taste the rain
    40. the floating oak leaf: it rocks, its beads roll off into the puddle
    41. the catcher on the heap: he lifts his net and tips whatever's in it onto the heap
    42. a maple key spinning down out of the squall: it catches your umbrella's wind and lifts
   Also idle: the catcher nets the leaf's pendant drop and tips it onto the heap; the squall curtain
   marches in from the left; a maple key spins down every half minute and floats off; on a phone, a
   bramble's leaves drip into the top of the frame. */
Drawn.start({ W: DH.W, H: DH.H, slack: 0.84, hint: 'hover anything · your pointer is an umbrella' });
