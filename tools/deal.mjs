// Deal hands from the idea factory's deck: one card from each suit per hand.
// Cards that earlier batches already used are dealt less often, so the deck keeps rotating.
//
//   node tools/deal.mjs [hands=4] [--seed N]
//
// Prints each hand as a JSON line: { "hand": n, "cards": { suit: card, ... } }.
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const n = +(args.find((a) => /^\d+$/.test(a)) || 4);
const si = args.indexOf('--seed');
let seed = si >= 0 ? +args[si + 1] : (Date.now() % 1e9);

const rand = () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const deck = JSON.parse(readFileSync(resolve(root, 'ideas/deck.json'), 'utf8')).suits;
const store = resolve(root, 'ideas/ideas.json');
const used = {};
if (existsSync(store)) for (const idea of JSON.parse(readFileSync(store, 'utf8')).ideas || []) for (const c of Object.values(idea.hand || {})) used[c] = (used[c] || 0) + 1;

const taken = new Set();
for (let h = 1; h <= n; h++) {
  const cards = {};
  for (const [suit, list] of Object.entries(deck)) {
    // weight 1 / (1 + times used), and never the same card twice in one deal
    const pool = list.filter((c) => !taken.has(c));
    const w = pool.map((c) => 1 / (1 + (used[c] || 0) * 1.5));
    let r = rand() * w.reduce((a, b) => a + b, 0), i = 0;
    while ((r -= w[i]) > 0 && i < pool.length - 1) i++;
    cards[suit] = pool[i];
    taken.add(pool[i]);
  }
  console.log(JSON.stringify({ hand: h, cards }));
}
