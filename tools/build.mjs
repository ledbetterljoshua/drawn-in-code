// Build the gallery site into _site/: the gallery page, the engine, every scene, a scenes.json
// listing them (from each scene's meta.json, plus how many lines of code it took), and a
// thumbnail of each scene shot live in headless Chromium. CI runs this on every push to main.
//
//   node tools/build.mjs [--no-thumbs]
import { chromium } from 'playwright';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, '_site');
const thumbs = !process.argv.includes('--no-thumbs');

rmSync(out, { recursive: true, force: true });
mkdirSync(join(out, 'thumbs'), { recursive: true });
for (const f of ['index.html', 'engine', 'scenes']) cpSync(join(root, f), join(out, f), { recursive: true });
writeFileSync(join(out, '.nojekyll'), '');

const lines = (dir) => readdirSync(dir).filter((f) => f.endsWith('.js')).reduce((n, f) => n + readFileSync(join(dir, f), 'utf8').split('\n').length, 0);
const scenes = [];
for (const slug of readdirSync(join(root, 'scenes'))) {
  const dir = join(root, 'scenes', slug), metaFile = join(dir, 'meta.json');
  if (!existsSync(metaFile)) continue;
  const meta = JSON.parse(readFileSync(metaFile, 'utf8'));
  if (meta.draft) continue;
  scenes.push({ slug, ...meta, lines: lines(dir) });
}
scenes.sort((a, b) => (b.made || '').localeCompare(a.made || '') || a.title.localeCompare(b.title));
writeFileSync(join(out, 'scenes.json'), JSON.stringify(scenes, null, 2));
console.log(`${scenes.length} scenes: ${scenes.map((s) => s.slug).join(', ')}`);

if (thumbs) {
  const browser = await chromium.launch();
  for (const s of scenes) {
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 1.5 });
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(pathToFileURL(join(root, 'scenes', s.slug, 'index.html')).href + '?bare' + (s.thumbAt ? `&t=${s.thumbAt}` : ''));
    const ok = await Promise.race([
      page.evaluate(() => window.__drawn && window.__drawn.ready.then(() => true)),
      new Promise((r) => setTimeout(() => r(false), 15000)),
    ]);
    if (!ok) { console.error(`${s.slug}: never drew a frame\n${errors.join('\n')}`); process.exitCode = 1; await page.close(); continue; }
    await page.waitForTimeout(2500);
    await page.screenshot({ path: join(out, 'thumbs', `${s.slug}.jpg`), type: 'jpeg', quality: 86 });
    if (errors.length) console.warn(`${s.slug}: page errors\n${errors.join('\n')}`);
    await page.close();
  }
  await browser.close();
}
console.log('built _site/');
