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

## Round 2 (fresh-eyes critic, screenshots only)

Critic's ten, condensed: (1) silhouette is a boot/chimney — the brow cantilevers like a toe, the
shoulder over the arch is a flat step, no wave-cut notch; (2) the upper "dissolving" drawers read
as ghost wallpaper; (3) light contradicts itself — a white wash over the upper-left drawers, lamps
are tiny squares that cast nothing; (4) everything one mid violet — push the stack darker, the
glow brighter and warmer behind the base, lamps the cyan accent, caps the warm one; (5) sleepers lie
*on* drawers, the bear cub is smaller than a stoat, porters all one pose; (6) centred, empty left,
no foreground; (7) reflection is a full-strength mirror; (8) causeway seen from above while the
stack is at eye level; (9) materials all one gradient, brass rails read as string lights (the
dashed snow); (10) machine repetition — a tag on every drawer, even lichen, even icicles, a
double-stripe snow cap, uniform line, pink double outline where the stack meets the glow.

My own after testing the chain: woken dormice read as teddy bears (round ears, small eyes);
reading-size tags flood the face during a chain. Fixed both (hazel-dormouse redesign: golden ball,
huge black eyes, small ears, bottle-brush tail; tags only reach reading size under a lingering
pointer).

Fixed in round 2: the sunset moved left of the stack (SUNX 720 → 300) — its brightest glow had
been hidden behind the stack; now it lights the empty left and shines through the arch. Eye level
up to 1150 so the foot drawers show their insides. Stack value down again (#1a1628), rim reduced to
one soft inner rose glow (no double outline), silhouette ink lighter where it meets the glow. Brow
cut back from a boot toe; the shoulder over the arch rounded into a buttress. Lamp pools tighter
with a defined falloff, lamps 1.5× bigger. Rails lost their dashed snow (string lights). Causeway
width now strictly ∝ distance below the horizon (it was seen from above), bending into the
foreground. Reflection half strength and fading fast. Foreground slabs at the bottom left. The
high face is now a scatter of dark half-buried slots instead of ghost wallpaper. Snow on every
cabinet top, drifted to one end; rock lips creep over cabinet corners. Cap snow drifted, uneven.
Sleepers sunk into their drawers with heads on the lips; tags on far fewer drawers.

## Round 3

Five worst:
1. **Sky: pinstripe streaks over a flat field — and it's snowing out of a clear sky.** → a snow-cloud
   deck over the top of the picture, its soft underside in rolls lit rose/apricot near the sunset,
   above a clear band on the horizon. First try had a scalloped edge (doily), second dangling blobs;
   third — a per-column soft fade plus 260 soft lit rolls — reads as weather.
2. **The bear cub sleeps *on* its drawer.** → drawer pulled right out (it won't shut), cub sunk into it
   with only its back, head and paw over the lip; side boards drawn over the guest below eye level.
3. **The kettle dangles in empty sky past the stack's edge.** → davit moved in; the rope now hangs
   down across the face to the bottle porter.
4. **Sea dashes ruled like a ledger.** → half as many, fainter.
5. **Lichen as even noise.** → nine colonies along the seams.
Perf: 60 fps desktop.

## Round 4

Five worst (mine):
1. **Hover the bare rock and nothing happens** — the header promised it. → rock-shed layer: hovering
   the rock knocks a little snow and a chip of stone off the seam above the pointer.
2. **The focal moment has no payoff.** → hover the feather porter: it shushes you, and the dormouse's
   nose twitches… twitches… and it sneezes (a breath puff; the head jerks back).
3. **Porters are one pose, and nobody notices the pointer.** → each porter has its own lean and rung;
   their eyes follow the pointer when it comes within reach.
4. **Steel cabinets are the same gradient as card.** → a cold sheen streak down the pressed panel and
   a dent catching it.
5. **The sleeping dormouse's face is tucked out of sight** under the cap. → less tucked.

## Round 5 (second fresh critic, then fixes)

Critic's ten, condensed: silhouette still a boot (nose at top left, a heel with a straight edge, the
arch a thin pink hoop); drawers don't belong to the rock; light has no logic — lamp halos whiten
fronts; sleepers lie *on* drawers; hedgehogs are flattened bugs; no focal hot spot, empty left;
clouds in two unrelated styles (polka dots vs airbrush); a flat lilac rectangle with a hard edge on
the left horizon (a bug); distant stacks are tombstones; causeway and water inert; uniform line;
copy-paste repetition.

Fixed:
- **Perf first** (phone at 4× CPU throttle was 24 fps idle, 18 in a chain): removed the CSS
  saturate filter on the canvas, merged still buckets, cached each drawer front per opening step,
  and cached every *resting* sleeper as a sprite that breathes by a 2.5% stretch about its lip →
  35 fps idle under throttle, 60 on desktop.
- The hard-edged band: a flat `fillRect` of afterglow on the tide sheets. Now a radial.
- **The arch is a tunnel**: its far mouth sits smaller and nearer the vanishing point, so the left
  jamb and the vault's underside show between the mouths, warming toward the far mouth where the
  afterglow pours in.
- **Sleepers sit in their drawers**: an open drawer shows a dark box above its lip framed by side
  boards (an illustrator's cheat — we're below it — but it is what reads).
- Lamp halos bluer and softer (they were whitening fronts).
- **Hedgehogs walk upright** in profile, scarves and suitcases swinging, 1.45× bigger.
- Rock lips over cabinet corners were reading as ink blots: lighter, with a snow cap.

## Round 6

Five worst (mine, at thumbnail size):
1. **The cloud's lit rolls were polka dots** (one bright ellipse per roll). Two retries — per-column
   gradients left vertical seams; stepped strokes read as a neon line. What worked: soft shapes made
   by drawing each shape far off-canvas and letting its blurred *shadow* land in place (shadow
   offsets are device pixels, so divide by the transform scale). Portable — no `ctx.filter`.
2. **Far stacks were flat light tombstones.** → cooler, lower contrast, five of varied width/height.
3. **Foreground rocks were brown loaves.** → bigger, near-black slabs with only a faint glow plane.
4. **Snowfall invisible at full frame.** → flakes 2× bigger, plus 26 near, soft, big flakes.
5. **Cabinets float on the rock.** → shelves of harder stone run partway round between cabinet rows
   (first try ran one all the way round: a wedding-cake ring; now broken into pieces).
