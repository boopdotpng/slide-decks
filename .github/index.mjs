// writes _site/index.html: every deck in lec*/*/slides, grouped by lecture.
//   bun .github/index.mjs _site
// per deck it reads src/deck.config.ts (`title`, optional `order` to sort within a lecture)
// and the first `<p class="muted">` of the title slide (01-*.astro) as the subtitle.
import { readFileSync, readdirSync, writeFileSync, copyFileSync, mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const out = process.argv[2] ?? '_site';
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const strip = (s) => s.replace(/<[^>]+>/g, '').trim();

const lectures = new Map();
for (const lec of readdirSync('.').filter((d) => /^lec\d+$/.test(d)).sort((a, b) => +a.slice(3) - +b.slice(3))) {
  for (const topic of readdirSync(lec)) {
    const dir = join(lec, topic, 'slides');
    if (!existsSync(join(dir, 'src/deck.config.ts'))) continue;
    const config = readFileSync(join(dir, 'src/deck.config.ts'), 'utf8');
    const slides = readdirSync(join(dir, 'src/slides')).filter((f) => /\.(astro|mdx)$/.test(f)).sort();
    const titleSlide = slides[0] ? readFileSync(join(dir, 'src/slides', slides[0]), 'utf8') : '';
    const deck = {
      href: `${lec}-${topic}/`,
      title: config.match(/export const title = ['"](.*)['"]/)?.[1] ?? topic,
      order: +(config.match(/export const order = (\d+)/)?.[1] ?? 99),
      sub: strip(titleSlide.match(/<p class="muted">([\s\S]*?)<\/p>/)?.[1] ?? ''),
      topic, dir, count: slides.length,
    };
    if (!lectures.has(lec)) lectures.set(lec, []);
    lectures.get(lec).push(deck);
  }
}

// borrow the decks' code font
const font = [...lectures.values()].flat().map((d) => join(d.dir, 'public/fonts/PaperMono.woff2')).find(existsSync);
mkdirSync(out, { recursive: true });
if (font) copyFileSync(font, join(out, 'PaperMono.woff2'));

const sections = [...lectures].map(([lec, decks]) => `
  <section>
    <h2>lecture ${lec.slice(3)}</h2>
    ${decks.sort((a, b) => a.order - b.order || a.topic.localeCompare(b.topic)).map((d) => `
    <a class="deck" href="${d.href}">
      <span class="title">${esc(d.title)}</span>
      <span class="sub">${esc(d.sub)}</span>
      <span class="meta">${esc(d.topic)} · ${d.count} slides</span>
    </a>`).join('')}
  </section>`).join('');

writeFileSync(join(out, 'index.html'), `<!doctype html>
<html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>slides</title>
<style>
  @font-face { font-family: 'Paper Mono'; src: url('PaperMono.woff2') format('woff2'); font-weight: 100 900; }
  :root { --bg:#0a0a0a; --fg:#e5e5e5; --muted:#8a8a8a; --accent:#60a5fa; --panel:#141414; --border:#262626;
    --sans: -apple-system, 'Segoe UI', Inter, Helvetica, Arial, sans-serif;
    --mono: 'Paper Mono', ui-monospace, 'SF Mono', Menlo, Consolas, monospace; }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--fg); font: 17px/1.5 var(--sans); }
  main { max-width: 46rem; margin: 0 auto; padding: 5rem 1.5rem 4rem; }
  h1 { font-size: 2.6rem; line-height: 1.1; margin: 0 0 .4rem; letter-spacing: -.02em; }
  .lead { color: var(--muted); margin: 0 0 3.5rem; }
  h2 { font: 500 .78rem var(--mono); color: var(--accent); text-transform: uppercase; letter-spacing: .14em; margin: 0 0 .9rem; }
  section + section { margin-top: 2.8rem; }
  .deck { display: grid; gap: .2rem; padding: 1.1rem 1.3rem; margin-bottom: .7rem; text-decoration: none; color: inherit;
    background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
    transition: border-color .15s, transform .15s, background .15s; }
  .deck:hover, .deck:focus-visible { border-color: var(--accent); background: #161b22; transform: translateY(-1px); outline: none; }
  .title { font-size: 1.3rem; font-weight: 600; }
  .deck:hover .title { color: var(--accent); }
  .sub { color: var(--muted); }
  .meta { font: .78rem var(--mono); color: #5c5c5c; margin-top: .35rem; }
  footer { margin-top: 4rem; font: .78rem var(--mono); color: #5c5c5c; }
  footer a { color: inherit; }
</style>
<main>
  <h1>slides</h1>
  <p class="lead">lecture decks. arrow keys to move, <code>g</code> to jump, <code>f</code> for fullscreen.</p>
  ${sections}
  <footer><a href="https://github.com/boopdotpng/slide-decks">source</a></footer>
</main>
</html>
`);
console.log(`wrote ${join(out, 'index.html')}: ${[...lectures.values()].flat().length} decks`);
