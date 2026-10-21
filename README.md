# slide decks

lecture decks, each an astro project made from the template at **[boopdotpng/slides](https://github.com/boopdotpng/slides)**.

| dir | what |
|---|---|
| `lec1/risc-v` | assembly and the cpu |
| `lec1/gpt-2-arch` | rnn → gpt-2 for beginners: one 4-token prompt through the whole model, real weights |
| `lec1/rnn` | char rnn on tiny shakespeare, pytorch (no slides; the rnn slides are in `gpt-2-arch`) |
| `lec2/os` | how an os executes programs, plus `rv`, the risc-v emulator lec 1 runs assembly on |

in any deck: `cd slides && bun install && bun run dev` (:4321).

## new deck

```sh
bunx degit boopdotpng/slides lec3/topic/slides   # or "use this template" on github for a standalone repo
cd lec3/topic/slides && bun install && bun run dev
```

then set the title in `src/deck.config.ts`, delete the demo slides (`src/slides/`, `src/components/demos/`),
and write `src/slides/01-….astro`, `02-….astro`, …. the [template readme](https://github.com/boopdotpng/slides#readme)
covers keys, steps, islands and the `viz` kit; its `AGENTS.md` (copied into every deck) is the short version.

## template changes

fixes to the engine, styles, `Code` / `Math` / `viz`, or `scripts/` belong in the template, not in a deck: a deck's copy
of those files is overwritten on the next sync. edit them in a checkout of [boopdotpng/slides](https://github.com/boopdotpng/slides),
push there, then pull them into every deck:

```sh
git clone git@github.com:boopdotpng/slides.git ~/code/web/slides   # once
cd ~/code/web/slides && bun run sync ~/code/edu/lec*/*/slides
```

slides, deck-specific islands, `public/` and `deck.config.ts` are never touched by sync.
