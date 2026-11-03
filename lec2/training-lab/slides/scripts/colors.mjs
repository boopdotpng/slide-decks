/**
 * Fail on color literals (#hex, rgb(), rgba()) outside the palette, so every color comes from styles/deck.css and a
 * theme change reaches every slide. Runs as part of `bun run check`; `bun scripts/colors.mjs` alone also works.
 *
 * Use var(--x) / COLORS.x instead, and color-mix(in srgb, var(--x) 30%, transparent) for tints. A literal that isn't
 * a theme color (a WebGL texture's white base, a mask) can stay if its line says `colors-ok`.
 */
import { readFile, readdir } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const ALLOWED = ['src/styles/deck.css', 'src/components/viz/color.ts']; // where the palette lives
const LITERAL = /#[0-9a-fA-F]{3,8}\b|\brgba?\(/;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else if (/\.(tsx?|astro|mdx|css)$/.test(e.name)) yield p;
  }
}

let bad = 0;
for await (const f of walk(join(root, 'src'))) {
  const rel = relative(root, f);
  if (ALLOWED.includes(rel)) continue;
  (await readFile(f, 'utf8')).split('\n').forEach((line, i) => {
    if (LITERAL.test(line) && !line.includes('colors-ok')) {
      console.log(`${rel}:${i + 1}: ${line.trim().slice(0, 140)}`);
      bad++;
    }
  });
}
if (bad) {
  console.log(`\n${bad} color literal${bad > 1 ? 's' : ''}: use var(--x) from styles/deck.css or COLORS from components/viz (see AGENTS.md)`);
  process.exit(1);
}
