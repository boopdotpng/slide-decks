# slide deck (from boopdotpng/slides)

Astro + Preact. `bun dev`, `bun run build`, `bun run check`, `bun run record` (mp4 of the whole deck, see scripts/record.mjs), `bun run shot 3.2 14-stack.1` (png of a slide at a step against a running dev server, see scripts/shot.mjs). See README.md for keys and components.

## how it fits together

- Every file in `src/slides/` is one slide (`.astro` or `.mdx`), ordered by filename (`01-`, `02-`, …). `pages/index.astro` renders them all as `<section class="slide">` on one page.
- `deck/deck.ts` owns navigation; `deck/presenter.ts` is the ?presenter window; `deck/notes-file.ts` + `notes-server.ts` read / write notes.md. A slide's step count = number of `.step` elements + the sum of every `data-steps="N"`. Islands get the step through `useSlideStep` (`deck/hooks.ts`).
- URL modes: `?presenter` (notes + previews, synced over BroadcastChannel), `?embed` (used by presenter iframes), `?print` (all slides, all steps revealed).

## conventions

- Islands render purely from `step` (no accumulated state), so ←, the picker, reload at `#5.2` and print all work. Put per-step content in one table at the top of the file (see `TemplateIsland.tsx`, `demos/`).
- Wrap an island in `<div data-steps="N">` with N = its last step index. Use `client:load`.
- Formulas: `components/Math.astro` (KaTeX, build time). Reuse `components/viz` before writing new marks or animations; if a new animation looks reusable, add it there (props-driven, styles in `styles/viz.css`) rather than inline in a deck-specific island.
- Island-specific styles go in a `<style>` inside the island, scoped by its root class.
- Colors: CSS vars in `styles/deck.css` (`--accent`, `--muted`, …) and `COLORS` in `viz/color.ts`. Code font is `var(--mono)` (Paper Mono).
- Real numbers over made-up ones: export json into `public/data/` with a script and load it with `useData`.
- Speaker notes: a `# <file name>` section in `src/slides/notes.md` (markdown; the presenter window edits it under `bun dev` via `deck/notes-server.ts`), or `<aside class="notes">` in the slide.
- Lowercase, terse slide text.

## checking work

Build, then open the slide at `http://localhost:4321/#N.K` and step through it, including going back (or `bun run shot --url http://localhost:4321/ N.K …` and read the pngs; it also reports page errors). Check `?print` for slides with islands.
