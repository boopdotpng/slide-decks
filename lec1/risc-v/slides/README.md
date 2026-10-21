# slides

A template for educational slide decks: Astro + Preact islands. Slides are
plain `.astro` / `.mdx` files; anything animated or interactive is an island
that reacts to the deck's step counter.

## start a new deck

```sh
bunx degit boopdotpng/slides my-deck   # or "Use this template" on github
cd my-deck
bun install
bun dev                                # http://localhost:4321
```

Then:
1. set the title in `src/deck.config.ts` (and `scale`, if the deck is dense: it sets the type size)
2. delete the demo slides in `src/slides/` (and `src/components/demos/`) once you've seen them
3. write `src/slides/01-whatever.astro`, `02-….astro`, …

`bun run build` makes a static site in `dist/`. `bun run check` typechecks.

## keeping decks up to date

Edit the template, then `bun run sync ~/path/to/deck [more decks…]` from here. It overwrites the
template's own files in each deck (`src/deck/`, `pages/index.astro`, `styles/`, `Code.tsx`, `viz/`,
fonts, `scripts/`, configs, these docs; see `scripts/sync.mjs`) and merges package.json. Slides,
islands, `public/` assets and `deck.config.ts` are never touched, so keep deck-specific code there.

## presenting

| key | |
|---|---|
| → space l j | next step / slide |
| ← h k | back (going back into a slide lands fully revealed) |
| g | slide grid: every slide as a thumbnail at its last step. arrows / hjkl or a number, then enter; or click one (or click the counter to open it) |
| p | presenter window: notes (editable under `bun dev`: click or e), next-step preview, timer. Synced both ways with the deck |
| f | fullscreen |
| home / end | first / last |

The URL keeps your place: `#7.3` is slide 7, step 3.
`bun run build && bun run record` exports `deck.mp4`: it presses → through every step, waiting for each step's
animations to finish plus `--hold` ms (default 1500). Options: `--out`, `--hold`, `--from 3 --to 7`, `--width`, `--height`, `--fps`, `--crf` (14), `--scale` (2× supersampling).
JS-driven animations (`LatencyRace`, `auto` Walkthrough, `Terminal`) set their own `data-hold`; put `data-hold="5000"` on any
element to make a slide linger. Needs Google Chrome and ffmpeg.

`bun run shot 3.0 3.2 14-stack.1` screenshots slides at given steps from a running deck (default `--url http://localhost:4400/`)
into `/tmp/shots/`, and prints any page errors. Options: `--url`, `--out`, `--wait`, `--width`, `--height`, `--jobs` (pages in parallel, default 8).

`?print` shows every slide fully revealed, one per page: cmd+p → save as pdf (1600×900 pages, backgrounds on).

## writing slides

One file per slide in `src/slides/`, ordered by filename. Title in the picker
comes from `data-title`, else the first h1/h2, else the filename.

```astro
---
import Code from '../components/Code.tsx';
import MyThing from '../components/MyThing.tsx';
---
<header>                                       <!-- title at the very top, content centered below -->
  <div class="section">part 2</div>            <!-- optional kicker -->
  <h2>title</h2>
  <p class="sub">optional subtitle</p>
</header>
<p class="step">revealed on the first →</p>
<Code lang="c" code={src} hl={[2, 3]} />
<div data-steps="4"><MyThing client:load /></div>   <!-- island gets 4 more steps -->
<div class="full"><img src="/diagram.svg" alt="…"></div>  <!-- full-slide image from public/ -->
<div data-steps="3" class="fill"><Big client:load /></div>  <!-- title to the top, this gets the rest -->
<aside class="notes">only visible in the presenter window</aside>
```

Speaker notes: under `bun dev`, open the presenter window (p), click the notes
(or press e) and type. Markdown, saved as you type, esc to finish; the deck
doesn't reload. They're stored in `src/slides/notes.md`, one `#` heading per
slide (file name without the extension, or a slide number), which you can also
edit by hand. Notes can also go in the slide as `<aside class="notes">`.

```md
# 1
say hi, ask who's written assembly before

# 03-bytes
- step through slowly
- point at the opcode bits
```

Without a `<header>`, the title and content are centered together (good for title slides and short lists).

Every slide is laid out on a 1600×900 canvas that's scaled to fit the window: on a big screen everything
(text, islands, px sizes) gets bigger together, in a small window smaller, and nothing is ever cut off. A window
that isn't 16:9 extends the canvas the long way rather than letterboxing. So size things in px or em, and use
`cqw` / `cqh` (% of the slide) instead of `vw` / `vh` (% of the window). If a slide's content doesn't fit in 1600×900,
`bun run shot` says OVERFLOW. Islands measuring the DOM get screen px from `getBoundingClientRect`: `box()` already
converts, otherwise divide by `deckScale()` (`deck/hooks.ts`).

Classes in `styles/deck.css`: `step`, `cols`, `small`, `muted`, `accent`,
`center`, `full`, `fill`, `sub`, `caption`, `fade` + `on`, `notes` (and `section`, the kicker, in `viz.css`). Theme colors and fonts are
the variables at the top of that file.

## islands

Copy `src/components/TemplateIsland.tsx`. Hooks (`src/deck/hooks.ts`):

- `useSlideStep(ref)`: current step, for step-driven animation. Render purely from it.
- `useIsland(name)` (viz): `{ root, step, d }`: a root ref, the step, and `public/data/<name>.json`, the usual start of a data-driven island.
- `useSlideActive(ref)`: is this slide on screen
- `useFrame(ref, ms => …)`: per-frame callback while on screen, ms since entering
- `useTicker(ref, ms)`: a counter that runs by itself while on screen

## components

- `Code`: tiny highlighter for `asm` (risc-v / x86 / arm names), `c`, `cpp`, `py`. `hl` highlights lines and dims the rest; `highlight(line, lang)` for inline.
- `Math`: LaTeX via KaTeX at build time, `<Math tex="..." />` inline or `block`. static html, no client js.
- `components/viz` (see the demo slides for each one in use):
  - `Walkthrough`: code + state table + caption, stepped or `auto`; `StateTable` on its own
  - `BitFields`, `Bytes`: binary words split into fields, memory as byte cells
  - `Timeline`: bars growing on a time axis (pipelines, schedules)
  - `LatencyRace`: log-scaled ping dots with honest counters
  - `Box`, `Arrow`, `Reveal`: SVG diagrams with self-drawing arrows
  - `Terminal`: types out new output
  - `StepCode`: `Code` whose highlighted lines follow the slide step (`hl={{ 1: [0], 2: [1] }}`), to show the real code beside an island
  - `ZoomStage`, `ZoomView`, `nest`: a picture you zoom into, views nested in views (put it in a `.fill`)
  - `Strip`, `Heatmap`, `HeatCanvas`, `ByteHeat` (big matrices, 1 byte per cell), `Bars`, `Shape`, `Tok`, `Chip`, `Crumbs`: data marks
  - `useMeasure`, `box`: measure rendered HTML inside an island (to point Arrows at it, box cells)
  - `diverging`, `sequential`, `COLORS`, `useData('name')` (loads `public/data/name.json`), `tip`

## layout

```
src/
  deck.config.ts        title
  deck/                 the engine: deck.ts (nav, steps, picker, modes), presenter.ts, hooks.ts
  pages/index.astro     loads every slide into one page
  slides/               your slides
  components/           Code, Math, TemplateIsland, viz/, demos/
  styles/               deck.css (engine + theme), viz.css
public/                 images, fonts (Paper Mono, OFL), data/
```

Code font is [Paper Mono](https://github.com/paper-design/paper-mono) (SIL OFL,
license in `public/fonts/`). If you deploy under a subpath (`base` in
`astro.config.mjs`), update the `/fonts/` and `/example.svg` URLs too.
