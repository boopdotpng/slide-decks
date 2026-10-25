# slide deck (from boopdotpng/slides)

Astro + Preact. `bun dev`, `bun run build`, `bun run check`, `bun run record` (mp4 of the whole deck, see scripts/record.mjs), `bun run shot 3.2 14-stack.1` (png of a slide at a step against a running dev server, see scripts/shot.mjs). See README.md for keys and components.

## finding and changing slides

"Slide N" (what the user sees in the counter, the grid, the URL `#N.K` = slide N at step K) is the file `src/slides/NN-*` (zero-padded: slide 7 is `07-…`). `bun run slides` lists every slide: number, file, steps, notes, title; `bun run slides 22` prints slide 22's path (also takes a name: `bun run slides loss`).

Never create, rename, move or delete slide files by hand (that breaks the numbering and leaves notes.md behind); use:

```sh
bun run slides new <name> [--after N | --at N] [--mdx]   # stub slide; later files move up one
bun run slides mv <slide> --after N | --at N            # N = the numbers you see now
bun run slides rename <slide> <new-name>                # keeps the number
bun run slides rm <slide>                                # deletes it and its notes, closes the gap
```

`<slide>` is a number, a file name or the part after the number. Each prints the new path; numbers after the change point shift, so re-look-up (`bun run slides`) before touching another slide by number. `bun run check` fails if numbers have drifted (`bun run slides renumber` fixes it).

## how it fits together

- Every file in `src/slides/` is one slide (`.astro` or `.mdx`), ordered by filename (`01-`, `02-`, …). File number = slide number (see above). `#04-name.K` also works in the URL and in `bun run shot`. `pages/index.astro` renders them all as `<section class="slide">` on one page.
- `deck/deck.ts` owns navigation; `deck/presenter.ts` is the ?presenter window; `deck/notes-file.ts` + `notes-server.ts` read / write notes.md. A slide's step count = number of `.step` elements + the sum of every `data-steps="N"`. Islands get the step through `useSlideStep` (`deck/hooks.ts`).
- URL modes: `?presenter` (notes + previews, synced over BroadcastChannel), `?embed` (used by presenter iframes), `?print` (all slides, all steps revealed), `?overview` (the g picker's thumbnail grid, loaded in an iframe; the picker drives it through `window.deckOverview`).

## conventions

- Islands render purely from `step` (no accumulated state), so ←, the picker, reload at `#5.2` and print all work. Put per-step content in one table at the top of the file (see `TemplateIsland.tsx`, `demos/`).
- Wrap an island in `<div data-steps="N">` with N = its last step index. Use `client:load`.
- Formulas: `components/Math.astro` (KaTeX, build time) in slides, `Tex` / `SvgTex` / `SvgHtml` from `viz` in islands. Any formula (subscripts, greek, softmax, matmuls) goes through KaTeX, not plain text. Reuse `components/viz` before writing new marks or animations; if a new animation looks reusable, add it there (props-driven, styles in `styles/viz.css`) rather than inline in a deck-specific island.
- Content slides start with `<header>` (`.section` kicker, `h2`, `p.sub`): it pins them to the top and centers the rest below; `class="fill"` on the content gives it all the room.
- Slides are laid out on a 1600×900 canvas scaled to the window: size in px / em, `cqw` / `cqh` for % of the slide, never `vw` / `vh`. DOM measurements are screen px: use `box()` or divide by `deckScale()`.
- Island-specific styles go in a `<style>` inside the island, scoped by its root class.
- Colors: only the palette at the top of `styles/deck.css` (`var(--surface)`, `var(--hot)`, `var(--fill-blue)`, …; read its comments for which is for what) and `COLORS` in `viz/color.ts` (the same vars, for JS). No hex / `rgb()` in slides or islands: `bun run check` fails on them. Tints: `color-mix(in srgb, var(--good) 20%, transparent)`. Every var has a dark and a light value (`:root[data-theme=light]`), so slides follow the theme switch (t) by themselves; check new work in both (`?theme=light`). Canvas / WebGL can't read vars: wrap colors in `resolve()` and add `useTheme()` to the drawing effect's deps so it redraws. A color the palette lacks goes into the template's `deck.css` (both blocks), not the deck. Code font is `var(--mono)` (Paper Mono).
- Real numbers over made-up ones: export json into `public/data/` with a script and load it with `useData` (or `useIsland`, which also gives the root ref and step). Big matrices: one byte per cell, drawn with `ByteHeat` (see marks.tsx for the export helper).
- Speaker notes: a `# <file name>` section in `src/slides/notes.md` (markdown; the presenter window edits it under `bun dev` via `deck/notes-server.ts`), or `<aside class="notes">` in the slide.
- Lowercase, terse slide text.

## checking work

Build, then open the slide at `http://localhost:4321/#N.K` and step through it, including going back (or `bun run shot --url http://localhost:4321/ N.K …` and read the pngs; it also reports page errors and content that overflows the canvas). Check `?print` for slides with islands.
