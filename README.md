# slide decks

lecture decks on the deck engine **[boopdotpng/slides](https://github.com/boopdotpng/slides)**, which lives here once, as the git
submodule `engine/`. each deck (`lec*/*/slides`) holds only its own files: `astro.config.mjs` (`integrations: [slides()]`),
`src/deck.config.ts`, `src/slides/`, its islands in `src/components/`, `public/` (data, images), `package.json`, `tsconfig.json`.
the root `package.json` is a bun workspace of the engine and every deck.

| dir | what |
|---|---|
| `lec1/risc-v` | assembly and the cpu |
| `lec1/gpt-2-arch` | rnn → gpt-2 for beginners: one 4-token prompt through the whole model, real weights |
| `lec1/rnn` | char rnn on tiny shakespeare, pytorch (no slides; the rnn slides are in `gpt-2-arch`) |
| `lec2/os` | how an os executes programs, plus `rv`, the risc-v emulator lec 1 runs assembly on |
| `lec2/interp` | transformers from the residual stream up, on tiny models from ~/code/ml/interp (`export.py` writes the slide data) |
| `lec2/mnist` | train mnist for beginners (replaces the training lab): a two-layer model in tinygrad, the loss, the loop, setup, exercises (`export*.py` write the slide data) |
| `lec2/training-lab` | the training lab intro: attention on a gpu, the backward pass, tensors, how tinygrad runs them, then local setup (`export_step.py`, `export_kernels.py` write the slide data) |

```sh
git clone --recurse-submodules git@github.com:boopdotpng/slide-decks.git   # or, in a clone: git submodule update --init
bun install                                 # once, at the root: the engine and every deck
cd lec2/os/slides && bun run dev            # any deck (:4321)
```

## new deck

copy a deck and empty it, or write the five files the [engine readme](https://github.com/boopdotpng/slides#start-a-new-deck)
lists (astro.config.mjs, package.json, tsconfig.json, src/deck.config.ts, a first slide):

```sh
mkdir -p lec3/topic && cp -r lec2/os/slides lec3/topic/slides && cd lec3/topic/slides
rm -rf src/slides/* src/components/* public/data/* dist .astro   # then set "name" in package.json (e.g. "topic-slides")
# add "lec3/topic/slides" to "workspaces" in the root package.json; then at the root: bun install
```

then set the title in `src/deck.config.ts` and write `src/slides/01-….astro`, `02-….astro`, …. the engine readme
covers keys, steps, islands and the `viz` kit; its `AGENTS.md` (linked at the root here) is the short version.
ci builds every `lec*/*/slides`, so a deck missing from the workspaces fails the pages build.

## engine changes

fixes to the engine, styles, `Code` / `Math` / `viz` or the scripts belong in the engine, not in a deck: decks import it
by name (`slides/Code`, `slides/Math`, `slides/viz`, `slides/hooks`) and have no copy of their own.

to pick up engine commits pushed to boopdotpng/slides (master), in every deck at once:

```sh
git submodule update --remote engine && bun install   # bun install only matters if the engine's dependencies changed
git commit -am "engine: <what changed>"
```

to change the engine while looking at a deck, edit `engine/` directly: it's a full checkout of boopdotpng/slides, and
every deck's `bun run dev` picks the edit up live. commit and push inside `engine/` (on a branch, it starts detached),
then commit the new `engine` pointer here.
