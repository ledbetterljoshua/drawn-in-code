/* The Low-Tide Fair — once a year the sea goes out far enough for the house-snails, who carry
   whole villages on their shells, to meet on the wet sand. This file starts the stage; the parts
   are kit.js (shared rigs, light, palette), sky.js, flats.js, shells.js, snails.js, folk.js,
   front.js, bunting.js, more.js and fx.js.

   What lives here, idle and on hover (43):

   everywhere
    1. every snail's eyestalks turn to follow the pointer (idle: they wave and look about)
    2. move the pointer fast and every eyestalk on the flats flinches in, then creeps back out
    3. drag across water: rings spread from the pointer
    4. little fish in the creek dart away from the pointer
    5. move over dry sand: sand-hoppers spring up round it
    6. ring the tide bell and every folk turns to look at the sea
   the snails
    7. grandmother: her bell swings and rings notes; window lights climb the tower as you linger
    8. grandmother, linger: she lowers her stalks to look at you and smiles; the old mole at the
       top stops fiddling and waves his hat
    9. tea-house: the kettle chimney puffs steam rings; linger: the paper lanterns light one by one
   10. bookbinder: loose pages blow out of the top window and away on the wind
   11. fishmonger: the shutter flips up and an otter holds up the catch; two gulls swoop in
   12. youngster: it wriggles and the three kids in its basket throw up their arms
   13. the sleeper: its door opens a crack and two eyes peer out; the z's stop
   14. latecomers on the far trails: their riders wave in
   the fair
   15. band: the tempo picks up, the dancers spin, the audience claps along; linger: the conch
   16. tea tables: cups up, "clink!", steam off the cups
   17. bakery: the baker holds out a loaf and the customer takes it
   18. shell chimes: they clack and swing ("tink tink")
   19. kite: it climbs and its tail streams; the kid goes up on tiptoe
   20. laundry pool: splash, and the washing flaps hard
   21. sandcastle: a flag goes on the top tower; linger: the kids clap
   22. puffin porters: they stumble and a fish flops out of the basket
   23. strolling couple: they stop and he lifts his hat
   24. ladder climber on the grandmother: stops and waves
   25. netters in the creek: up comes the net with a crab in it, which pinches
   26. kids chasing a crab: they speed up
   27. snail race: the punters roar, the snails surge; linger: one wins "by a head!"
   28. clam diggers: a clam squirts the digger in the face
   29. puddle jumpers: they jump together, big splash
   30. parcel cart: the tipped cart rights itself and the parcels hop back in
   31. picnic: they wave, and a gull swoops off with a sandwich
   32. shrimpers: up come the push-nets, full of shrimp
   33. hermit crabs: the biggest moves into the empty whelk and every crab trades up one shell
       (teacup and thimble included); later visits get a cheer
   the edges
   34. heron: strikes and comes up with a fish; linger: it swallows
   35. tide bell: the puffin rings it ("ding!")
   36. seal: one eye opens, a flipper waves; linger: it rolls onto its back
   37. rock pool: the anemones pull in; the starfish lifts an arm
   38. razor clams: a squirt of water
   39. bunting: pluck a string and a wave runs along it
   40. eelgrass tufts at the front: they shake
   41. clouds: they brighten as you linger
   42. the far caravan: their lamps come on one by one
   43. gulls: they bank away with a cry  */
Drawn.start({ W: Fair.W, H: Fair.H, slack: 1, focus: 860, panW: 700, fill: 0.75, skyBias: 0.62, hint: { desk: 'hover or tap anything', pan: 'drag to look along the flats · tap anything' } });
