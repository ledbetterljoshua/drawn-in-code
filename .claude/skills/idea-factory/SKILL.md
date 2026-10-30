---
name: idea-factory
description: Generate a batch of bold, drawable worlds for the drawn-in-code gallery: deal constraint cards, have blind pitch agents collide them into worlds, have a critic rank them, and keep the backlog in ideas/ideas.json (shown at /ideas/ in the gallery). Use when Joshua asks for scene ideas, "run the idea factory", a new batch, or when scene sessions need worlds to draw.
---

# The idea factory

Left alone, every Claude reaches for the same first idea: a cosy cottage, a floating island, a
lighthouse, a tree house. The factory exists to make that impossible. It forces collisions
between constraints nobody would pick together, and it keeps a ranked backlog of worlds that
the scene sessions in `drawing-in-code` draw from.

The method, not the content, lives here. The deck (`ideas/deck.json`) and the backlog
(`ideas/ideas.json`) are the content, and both should keep changing.

## One batch

1. **Deal.** Run `node tools/deal.mjs 4`. Each hand gets one card from every suit: place, time,
   inhabitants, light, material, composition, mechanic and feeling. Cards that earlier batches
   used come up less often.
2. **Pitch, blind.** Spawn one pitch agent per hand, in parallel, using the brief below. Each
   one sees only its own hand, the list of worlds already taken, and the bar. Agents mustn't see
   one another's pitches: independence is the point.
3. **Critique.** Give every pitch to one critic agent (brief below). It scores and ranks them,
   and it names the cliché hiding inside each one.
4. **Keep.** Append every pitch to `ideas/ideas.json` with its scores and the critic's note,
   with `status: "pitched"` and `batch: <YYYY-MM-DD-n>`. Keep the weak ones too: their hands
   help the dealer rotate.
5. **Show.** Commit and push. The gallery's `/ideas/` page lists the backlog, best first. Tell
   Joshua the top three in one line each, and ask which to greenlight.
6. **Greenlight.** When Joshua picks one, set it to `"greenlit"`, then start a scene session
   with the standard scene brief (the five lane sessions show its shape), using the pitch as the
   world. Set it to `"in-progress"` with `scene: <slug>`, and to `"hung"` once it's merged.

Look after the deck as you go. Add cards whenever a batch suggests a missing suit or a fresh
fragment. Retire a card once it has produced the same kind of idea twice.

## What "worlds already taken" means

It's every `scenes/*/meta.json` title and blurb, every in-flight scene session's lane, and every
backlog idea that isn't `"shelved"`. Pass all of them to each pitch agent, so nothing gets
pitched twice.

## Pitch brief

> You are pitching worlds for an illustration that Claude will draw entirely in JavaScript
> canvas code: no images, but full of detail, light and small interactive life (hover a thing
> and it reacts with personality). The bar is https://solarpunk-lizards.netlify.app. Your hand
> of constraint cards: `<hand>`. Worlds already taken (don't come near them): `<taken>`.
>
> Write **six** worlds from this hand. Each must collide at least five of the eight cards, and
> the collision should feel inevitable once you see it. Then throw away the three most
> predictable and polish the other three. Your first idea is the one every other model would
> have, so it should almost never survive.
>
> For each surviving world, return JSON with these fields:
> - `title`: two to four words, a name rather than a description.
> - `logline`: one sentence, concrete, present tense.
> - `who`: who lives here and what they're doing right now.
> - `light`: the light and the weather.
> - `focal`: where the eye lands first, then where it goes.
> - `unique`: the one thing only this world has (its architecture, tools, materials, customs).
> - `signature`: the one interaction people will tell a friend about.
> - `reactions`: five more hover or idle reactions.
> - `palette`: words, not hex codes.
> - `composition`: the viewpoint and the big shapes.
> - `risk`: what will be hardest to draw well.
> - `hand`: the cards it used, as `{ suit: card }`.
>
> Concrete beats clever. "Lanterns" is weak and "lanterns made from hollowed winter squash, one
> per child born in the village" is strong. No existing IP, no named artists' styles.

## Critic brief

> You are a picture-book art director choosing what your studio paints next. Here are the
> pitches: `<pitches>`. Score each one from 1 to 5 on:
> - **bold**: would it stop someone scrolling?
> - **drawable**: can it reach a professional illustrator's bar in canvas code, through
>   composition, light and material rather than effects?
> - **life**: does it offer twenty-plus interactions that come out of the world itself?
> - **distinct**: is it unlike everything already taken, and unlike everything else in this batch?
>
> For each, also name the cliché it's closest to falling into, and the one change that would
> make it better. Return JSON: `[{ "title", "scores": { "bold", "drawable", "life", "distinct" },
> "cliche", "fix", "rank" }]`, ranked best first. Be ruthless. Most pitches are a 3.

## Notes

- A batch is four pitch agents and one critic. Don't run more than one batch at a time
  without asking. Each one costs real tokens.
- Ideas come from the dealt cards, never from the factory runner's own preferences. If you
  catch yourself steering a hand toward an idea you like, deal again.
- When a scene lands, read the critic's note against how the scene actually turned out, and
  add a line to `ideas/LEARNED.md` about what the scores missed. The critic should get better
  at predicting what draws well.
