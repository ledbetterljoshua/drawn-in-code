// Look at a scene the way a viewer will: desktop and phone frames, close-ups of any part of the
// artboard, and before/after pairs for hover reactions.
//
//   node tools/shoot.mjs <scene> [options]
//     --out <dir>          where the PNGs go (default .shots/<scene>)
//     --wait <s>           seconds of live animation before each shot (default 2.5)
//     --zoom x,y,w,h       also shoot this artboard rectangle up close (repeatable)
//     --hover x,y          also shoot the scene with the pointer parked here (repeatable),
//                          after 0.3 s and after 2 s, so you can see the reaction develop
//     --phone / --no-phone include the 390×844 phone frame (default on)
//     --hits               tint every hit area (?debug=hits)
//
// Prints the files it wrote. Open them with the Read tool and look hard.
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const scene = args.shift();
if (!scene) { console.error('usage: node tools/shoot.mjs <scene> [--zoom x,y,w,h] [--hover x,y] [--wait s]'); process.exit(1); }
const opt = { out: `.shots/${scene}`, wait: 2.5, zoom: [], hover: [], phone: true, hits: false };
for (let i = 0; i < args.length; i++) {
  const a = args[i];
  if (a === '--out') opt.out = args[++i];
  else if (a === '--wait') opt.wait = +args[++i];
  else if (a === '--zoom') opt.zoom.push(args[++i].split(',').map(Number));
  else if (a === '--hover') opt.hover.push(args[++i].split(',').map(Number));
  else if (a === '--phone') opt.phone = true;
  else if (a === '--no-phone') opt.phone = false;
  else if (a === '--hits') opt.hits = true;
}
const outDir = resolve(root, opt.out);
mkdirSync(outDir, { recursive: true });
const url = (q = '') => pathToFileURL(resolve(root, 'scenes', scene, 'index.html')).href + '?bare' + (opt.hits ? '&debug=hits' : '') + q;

const browser = await chromium.launch();
const wrote = [];
const errors = [];

// the scene has drawn a few frames — or it threw, and we say so instead of hanging
async function ready(page) {
  const r = await Promise.race([
    page.evaluate(() => window.__drawn && window.__drawn.ready.then(() => 'ok')),
    new Promise((res) => setTimeout(() => res('timeout'), 10000)),
  ]);
  if (r !== 'ok') { console.error('scene never drew a frame:\n' + ([...new Set(errors)].join('\n') || '(no errors reported)')); process.exit(1); }
}
async function open(viewport, q = '', dpr = 1) {
  const page = await browser.newPage({ viewport, deviceScaleFactor: dpr });
  page.on('pageerror', (e) => errors.push(String(e)));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.goto(url(q));
  await ready(page);
  await page.waitForTimeout(opt.wait * 1000);
  return page;
}
// artboard rectangle → CSS-pixel clip on the page
const clipFor = (page, [x, y, w, h]) => page.evaluate(([x, y, w, h]) => {
  const s = Drawn.st;
  return { x: s.ox + x * s.s, y: s.oy + y * s.s, width: w * s.s, height: h * s.s };
}, [x, y, w, h]);

const desk = await open({ width: 1440, height: 900 }, '', 1);
const f1 = `${outDir}/desktop.png`;
await desk.screenshot({ path: f1 }); wrote.push(f1);
await desk.close();

for (const [i, z] of opt.zoom.entries()) {
  // zooms are shot big so the detail is really there to judge
  const page = await open({ width: 1440, height: 900 }, '', 2);
  const f = `${outDir}/zoom-${i + 1}.png`;
  await page.screenshot({ path: f, clip: await clipFor(page, z) }); wrote.push(f);
  await page.close();
}

for (const [i, [x, y]] of opt.hover.entries()) {
  for (const [tag, secs] of [['a', 0.3], ['b', 2]]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(url(`&hover=${x},${y}`));
    await ready(page);
    await page.waitForTimeout(secs * 1000);
    const f = `${outDir}/hover-${i + 1}${tag}.png`;
    await page.screenshot({ path: f, clip: await clipFor(page, [x - 260, y - 200, 520, 400]) }); wrote.push(f);
    await page.close();
  }
}

if (opt.phone) {
  const page = await open({ width: 390, height: 844 }, '', 2);
  const f = `${outDir}/phone.png`;
  await page.screenshot({ path: f }); wrote.push(f);
  await page.close();
}

await browser.close();
console.log(wrote.join('\n'));
if (errors.length) { console.log('\nPAGE ERRORS:\n' + [...new Set(errors)].join('\n')); process.exitCode = 1; }
