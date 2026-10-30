# The Overwinter

## The world (five lines)

- **Who, doing what:** White stoat night porters in red pillbox caps ride library ladders along brass
  rails up a sea stack whose seaward face is a jumble of filing cabinets rammed into the rock. They
  hold feathers under noses, re-tie luggage tags, refill hot-water bottles from a kettle on a
  pulley. The guests sleep with chins on the drawer lips: dormice, hedgehogs, a tortoise in a
  hatbox, bats on the handles, a bear cub in the bottom drawer, which won't shut. Three late
  hedgehogs are still crossing the causeway with suitcases.
- **When, weather:** 3pm, deep midwinter, the sun already down behind the stack. A rose/apricot band
  on the horizon behind the base, ink above, fine dry snow. We look west into the afterglow, so the
  face is in cool shade: warm bounce comes *up* from the wet sand mirror, cold sky light comes
  *down*, and the blue paper hush lamps make local pools. Where blue pools sit in the warm lower
  face, the card turns lilac.
- **Eye path:** focal = a mid-height drawer, left of centre, where a porter holds a goose feather
  under a dormouse's nose in the brightest blue pool, next to the red cap. Then up the drawers to
  the bats under the overhang and the cupola (weathervane in a nightcap), then down the causeway to
  the late hedgehogs and the creeping tide line.
- **Idle motion / the one interaction:** snow falls, lamps flicker, tags swing in the shared wind,
  sleepers breathe and snore, porters roll along rails, the tide creeps, a gull dings the bell.
  The one to tell a friend: tap a drawer and the guest wakes, squints at its tag and yawns; the
  yawn is contagious and walks down the cliff drawer by drawer while porters scramble with music
  boxes. If it reaches the bear cub, the whole stack shudders and every porter freezes.
- **Only here:** the vernacular of a hotel that is also a card catalogue that is also a cliff:
  brass label holders, luggage tags with wake conditions, ladders on rails, hush lamps (candles
  behind blue paper), a reception card index cross-referencing the snorers, punch-card music
  boxes. Cabinets of different makes and ages wedged into weathered strata, barnacled at the foot.

## Camera decisions

- Artboard 1200 × 1500, portrait; the desktop frame shows sea and causeway far to both sides.
- Eye at the sand. Horizon y = 1185. Everything above eye level shows its *underside* when it sticks
  out (ajar drawers, rails, ledges); nothing above shows a top except snow caps on lips.
- Face foreshortened vertically (power mapping): bottom drawers ~3–4× the height of the top ones.
  Above ~75% of the face height the drawers dissolve into rock texture and snow haze.
- The stack leans a touch left and narrows upward (a little three-point convergence).
- Critic's fix folded in: ~70 real drawers of wildly uneven size, grouped into cabinets of
  different makes, so there's never a grid.

## Round 0 (block-in, three passes)

- Tiered cabinets read as an office block; drawers near-square read as windows. Fixed: cabinets
  hand-placed with gaps of rock; rows computed so every drawer comes out ~1.3–1.9× wider than tall.
- Smooth catmull-rom silhouette read as a chimney. Fixed: stepped polygon, pinnacle, brow, an arch
  through the left foot (the causeway runs into it).
- Flat facade. Fixed: the face wraps a drum — above eye level horizontals arc down toward the edges
  and side cabinets narrow; flat at eye level. Biggest single improvement so far.

## Round 1 (first full pass: sky, sea, sand + reflection, rock, cabinets, guests, porters, lamps)

Five worst:
1. **No light design.** Everything is mid-value kraft-pink; the hush-lamp pools don't show at all.
   An illustrator would put the face in deep cool shade and let the lamps carve the light, the
   focal pool brightest. → bake a per-drawer lamp factor into the fronts (darker by default, lilac
   to blue-white near a lamp), keep the screen pools for flicker on top.
2. **Porters are white squiggles** ~30 px tall; you can't read a stoat or a cap. → ~1.8× bigger,
   simpler bolder silhouette, heavier line; the red cap is the scene's saturated accent.
3. **Full-width arcing rails** + arcing cabinet rows = wedding cake / carousel. → shorter rail
   segments at staggered heights; soften the drum arc (RZ 0.17 → 0.11).
4. **Silhouette edges are still smooth** lines (man-made). → subdivide every outline segment and
   jag it with seeded noise; brow less spout-like.
5. **Sky clouds are grey lozenges in rows; the tide foam is a dashed road marking; the causeway is
   a sidewalk.** → long thin tapering streaks, fewer; foam as wavy broken strokes of varying
   weight; causeway wider with soft edges.
- Done this round: value pass (rock #211c30, sky lifted so the stack separates; fronts in deep
  shade; lamplight baked per lamp with screen-blended radials, only 3 fixed lamps + porters so
  there is dark between pools); porters 1.6× (and a NaN in their look made canvas silently skip
  the head's translate — the head was drawn at the feet); rails shortened to staggered segments;
  silhouette jagged; brow made massive; reception in the arch, three late hedgehogs, the gull,
  the cupola with the nightcapped cockerel vane.
