/**
 * Copy the template's own files into a deck made from it, so engine / viz kit
 * fixes land everywhere:
 *
 *   bun run sync ~/code/edu/lec1/risc-v/slides [more decks…]
 *
 * Overwrites only the files listed in OWNED (the deck's slides, islands,
 * public/ assets and deck.config.ts are never touched). package.json is merged:
 * the deck keeps its name and any extra dependencies. Run `bun install` in the
 * deck afterwards if dependencies changed.
 */
import { cp, readFile, writeFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

const OWNED = [
  'src/deck', 'src/pages/index.astro', 'src/styles/deck.css', 'src/styles/viz.css',
  'src/components/Code.tsx', 'src/components/Math.astro', 'src/components/TemplateIsland.tsx', 'src/components/viz',
  'public/fonts', 'scripts', 'astro.config.mjs', 'tsconfig.json', '.gitignore', 'README.md', 'AGENTS.md',
];

const root = resolve(import.meta.dirname, '..');
const decks = process.argv.slice(2);
if (!decks.length) { console.error('usage: bun run sync <deck dir> [...]'); process.exit(1); }

for (const d of decks.map((d) => resolve(d))) {
  if (d === root) continue;
  if (!(await stat(join(d, 'src/slides')).catch(() => null))) { console.error(`${d}: no src/slides, skipping`); continue; }
  for (const f of OWNED) await cp(join(root, f), join(d, f), { recursive: true, force: true });

  const t = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'));
  const p = JSON.parse(await readFile(join(d, 'package.json'), 'utf8'));
  const merged = {
    ...p, ...t, name: p.name,
    scripts: { ...p.scripts, ...t.scripts },
    dependencies: { ...p.dependencies, ...t.dependencies },
    devDependencies: { ...p.devDependencies, ...t.devDependencies },
  };
  await writeFile(join(d, 'package.json'), JSON.stringify(merged, null, 2) + '\n');
  console.log(`synced ${d}`);
}
