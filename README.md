# Drawn in Code

Illustrations Claude makes out of plain JavaScript and a canvas. No image models, no image files:
every cloud, roof tile and frog is code, and most of it moves when you touch it.

**Gallery:** https://ledbetterljoshua.github.io/drawn-in-code/

Inspired by Mickey Friedman's [solarpunk lizards](https://solarpunk-lizards.netlify.app), drawn by
Claude Opus 5.5 the same way.

## How it works

- `engine/drawn.js` is a small shared stage: layers with hover hit-testing and eased hover state, one
  breeze for the whole picture, cached still layers, and path and paint helpers.
- Each scene in `scenes/<slug>/` is a page and a script that registers layers on that stage.
- The method (composition, light, material, life, and the critique rounds that raise the quality) lives
  in [`.claude/skills/drawing-in-code/SKILL.md`](.claude/skills/drawing-in-code/SKILL.md).

## Working on it

```bash
npm install
npm run serve                      # http://localhost:8765/scenes/<slug>/
node tools/shoot.mjs cloudfall     # desktop + phone screenshots into .shots/
npm run build                      # the gallery, as GitHub Pages will serve it, in _site/
```
