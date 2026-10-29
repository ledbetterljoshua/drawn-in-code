---
name: drawing-in-code
description: Make an illustrated, interactive scene out of plain JavaScript and a canvas (no image models, no image files) to the standard of a professional illustrator. Covers finding a world worth drawing, composing it, painting light and material with code, giving it subtle life, and the critique rounds that actually raise the quality. Use when making or improving a scene in the drawn-in-code gallery (~/builds/drawn-in-code), or any hand-drawn-looking illustration built from code.
---

# Drawing in code

You are making a picture a person would stop scrolling for, then lean in to explore. It is drawn
with canvas paths and nothing else. This skill is about *how* to get there. It deliberately says
nothing about *what* to draw: that part is yours, and it should surprise.

## The bar

The scene that started this project is Mickey Friedman's
[solarpunk lizards](https://solarpunk-lizards.netlify.app): a stilt town of domes and decks in a
sunset forest, drawn by Opus 5.5 in pure JavaScript. Open it. Hover everything. Then read its
source (`/js/stage.js`, `/js/parts/*.js`, the comment at the top of each file). Study it for craft.
Never borrow its subject, palette or creatures.

- It took **dozens of rounds**. Mickey said it was "def not a one prompt thing". The picture is
  good because someone kept looking and kept fixing.
- It is **~700 KB of hand-written drawing code across ~30 part files**. Every part has a short
  header saying what it is, what it does when you hover it, and where it sits in depth.
- **Every element is designed.** Each one has its own palette and its own idle motion, and it
  reacts to the pointer in a way that suits it. The ghosts get spooked. The flag snaps. The chimes
  clack. The sleeping axolotl smiles and stretches.

Cloudfall (`scenes/cloudfall`) was the first scene here: ~1,250 lines over two rounds. Joshua's
verdict was "lovely, but a lower bar on quality than the original." The technique is fine. What
it lacks is the *density of considered decisions*: a more deliberate perspective, materials that
look like materials, more story per square inch, and simply more rounds. Use it to learn the
engine. Don't use it as a ceiling.

Be ambitious. The sense of "this is good enough" you get after a first pass is wrong. Count on
eight or more critique rounds, and keep adding detail until it stops improving the picture.

## The loop

### 1. Find a world, not a subject

"A lighthouse" is a subject. A world is a lighthouse whose keeper is a heron who's let the
library take over the lamp room, the night the first winter storm comes in, with the lamp
swinging. Before you write any code, write five lines in `NOTES.md`:

- **Who lives here, and what are they doing right now?** Creatures in the middle of their own
  lives make a scene feel inhabited.
- **When and in what weather?** Time of day and weather decide the whole palette and the light.
- **Where does the eye land first, and where does it go next?** Name one focal point and a path
  through two or three secondary ones.
- **What moves when nobody touches it?** And what's the one interaction people will tell a
  friend about?
- **What's the one thing only this world has?** Its own architecture, materials, tools and
  vernacular. This is where originality comes from.

Push past your first idea. Your first idea is the one every other Claude would have too. Write
three worlds and pick the strangest one you can still draw well. Avoid other scenes' worlds;
`ls scenes/` and read the `meta.json` files first.

### 2. Compose before you decorate

Block the scene in flat shapes and **three or four values only**, with no colour and no detail,
then shoot it (`node tools/shoot.mjs <scene>`). Look at it shrunk to the width of a thumbnail.

- Does the silhouette read? Do the big masses make a good shape on their own?
- Decide the **horizon line and viewpoint**, and build everything to them. Cloudfall's houses
  are frontal boxes standing on an ellipse seen from above, which is a perspective
  contradiction. An illustrator would catch it immediately.
- Use **overlap and scale** for depth: foreground, middle ground and background, with
  atmospheric fade between them. Keep creatures small against architecture so everything feels
  bigger.
- Put the focal point **off centre**, give it the strongest contrast, and leave the eye a path
  out to the edges.
- Leave negative space. Quiet areas make busy ones read.

Fix the composition now. Once there's detail on it, nobody wants to move a building.

### 3. Paint in passes across the whole picture

Bring the whole picture up together: block-in, light, materials, detail, life, grade. Finishing
one object while the rest are still flat makes it impossible to judge how the parts relate.

**Light.** One key light with a consistent direction everywhere.
- Paint the sunward side lit and the far side shaded.
- Add rim light on sunward edges and bounce light in the shadows.
- **Give every object that touches the ground a contact shadow.** A missing one is the
  commonest tell that something is floating.
- Darken crevices (ambient occlusion). Cast shadows from things onto other things.

**Colour.**
- Build the palette from materials. Each material gets its own shade, base and lit colours.
  Don't make one tint darker and call it shade: shadows shift in hue (usually cooler, toward the
  ambient sky), not just in darkness.
- Make the line colour belong to the thing it outlines. A warm plum ink, darker and more
  saturated than the fill, reads as illustration. Black reads as clip art.
- Use atmospheric perspective: with distance, contrast drops and colour drifts toward the sky.
- Save the highest saturation for the focal point.

**Line.**
- Line weight carries hierarchy: silhouettes heavy, interior detail light, distant things
  lighter or unlined.
- Organic things are never perfect geometry. Use `curve()` through irregular points, seeded
  noise and slight asymmetry.
- Built things *can* be straight, but they should sag, lean and weather.

**Material.** Make wood, stone, thatch, glass, cloth, water and leaves each look like itself.
- Grain and knots on wood. Courses and chips on stone.
- Glass reflects the sky and glows when lit from inside. Cloth drapes and folds.
- **Repetition always varies.** A row of identical shingles is a tell. Vary every tile's size,
  tone and angle slightly with a seeded `rng`.

**Detail and story.**
- Cluster detail near the focal points and let it thin out toward the edges. Even density
  everywhere is noise.
- Use props that imply lives: a mug on a sill, laundry, a ladder left leaning, a hand-painted
  sign, a garden someone tends. Every prop should answer "who put this here?"
- Zoom in on every square of the picture at 2×. Each one should hold something worth finding.

### 4. Give it life

The life is what makes these feel magic instead of merely pretty. These rules come from the
solarpunk site and from what worked in Cloudfall:

- **Everything idles.** Eyes blink on random clocks (`blinker()`), chests breathe, leaves and
  cloth sway, water flows, smoke drifts, light flickers. If a region of the frame doesn't change
  for several seconds, it's dead.
- **One shared wind.** Everything leans into the same gusts (`wind(t, x)`), so the scene moves as
  a whole. Things can feed back into it: hovering Cloudfall's windmill raises `breeze.extra` and
  the whole drawing gets windy.
- **Hover has personality.** Each reaction belongs to the thing and tells a small story: a door
  opens and someone waves, a ghost startles and drifts back, a fisher reels in a catch. "Scale up
  1.1 and glow" is not a reaction.
- **Reward lingering.** Give a second beat after `L.since > ~0.4s`: the catch comes up, the
  hedgehog peeks out, the hammock frog smiles in its sleep.
- **Notice the pointer without a hover.** Eyes and telescopes track it, flowers turn to face it,
  motes swirl around it, fish dodge it.
- **Make it physical.** Use springs and damped pendulums. Push in the direction the pointer was
  travelling (`P.vx`, `P.vy`). Ease everything, and never snap.
- **Keep it subtle.** Reactions are small next to the scene. Nothing flashes, and nothing
  dominates the frame. Most last 0.3–2 s and ease back to idle.
- **Make hit areas generous** and match them to how the thing looks. Check them with
  `?debug=hits`. A tap holds the hover for 2.6 s so touch works.
- Aim for 20+ distinct reactions in a scene. List them in a comment at the top of `scene.js`.

### 5. Critique rounds: this is where the quality comes from

After every pass:

1. Shoot the scene: `node tools/shoot.mjs <scene> --zoom x,y,w,h ... --hover x,y ...`.
   Read every PNG it writes.
2. Look at the full frame at thumbnail size, the desktop frame, the phone frame, and 2× zooms
   of every region.
3. In `NOTES.md`, write **round N** with the **five worst things in the picture** and what an
   illustrator would do about each one. Be specific and harsh: "the stone wall is a grid of
   identical rectangles", not "improve the wall".
4. Fix them, then shoot again. Every few rounds, hand the critique to a fresh pair of eyes.
   Spawn a critic subagent that sees **only the screenshots and this bar**, not your code or
   your reasoning:

   > You are an art director at an illustration studio. Here are screenshots of a scene drawn
   > in code: `<paths>`. The bar is a professional children's-book or animation-background
   > illustrator. Name the ten things that most hurt this image, worst first: composition,
   > perspective, light consistency, material, line weight, colour, density, story, anything
   > that looks generated or lazy. For each one, say exactly what you see and what a skilled
   > illustrator would change. Don't praise anything.

5. Keep going while the critique keeps finding things that matter. You're done when two
   rounds in a row can't name a fix that would visibly improve the picture at full-frame size.
   "It feels finished" is not done.

Read `LESSONS.md` next to this file before you start. At the end, add the one or two lessons
from your scene that would most help the next one. Lessons are about *how*, never about your
particular subject.

## The engine and the repo

```
engine/drawn.js        the shared stage (read its header): layers, hover, shared wind, sprites, helpers
scenes/<slug>/         index.html, scene.js (split into more files as it grows), meta.json, NOTES.md
tools/shoot.mjs        screenshots: desktop, phone, --zoom artboard rects, --hover before/after, --hits
tools/build.mjs        builds _site/ with the gallery and thumbnails (CI runs it on push to main)
```

- **The layer model:** `layer({ id, z, draw, update, hit, still, onEnter, onTap })`.
  - `still: true` layers are painted once into a cached bitmap. Put everything that doesn't
    move there.
  - Moving parts each get their own layer. Anything heavy that still has to move (a whole tree
    swaying) goes in a `sprite()` built in `onLayout`, then gets transformed with `blit()`.
  - The top `z` wins hit tests.
- **Units:** draw in artboard units. The artboard fits the window, and the world carries on
  past its edges: paint backgrounds across `st.view`. Check the phone frame, where a portrait
  screen shows a lot of sky and ground.
- **Changing the engine:** keep changes additive and backward compatible, then re-shoot every
  scene. If your scene needs something deeply different, copy the engine into your scene folder
  rather than bending the shared one.
- **meta.json:** `{ "title", "blurb", "made": "YYYY-MM-DD", "by": "<model>", "rounds": N }`.
  - Add `"draft": true` to keep a scene out of the gallery.
  - Add `"thumbAt": seconds` to pick the thumbnail moment.
- **Rules:** no external images or image-model output, no network fetches, and nothing but
  canvas, paths and code. Keep 60 fps on a phone. Respect `prefers-reduced-motion` (the engine
  slows the clock for it).
- **Branches:** work on a branch, commit every round, and open a PR when the scene is ready.
  The gallery deploys from `main`.

## Never

- **Recreate an existing work or character.** That means no Totoro, no soot sprites, no Ghibli
  or Pixar characters, and no "in the style of" a named living artist. Genre and mood are fair
  game. Specific IP is not.
- **Hide weak drawing under effects.** God rays, glow, blur and bloom flatter a scene, but they
  can't rescue it. Cloudfall leaned on them.
- **Polish one corner** while the rest is still a block-in.
- **Call a scene finished after one or two rounds.**
- **Make loud interactions:** big bounces, spins, flashes, or anything that pulls the eye off
  the picture.
