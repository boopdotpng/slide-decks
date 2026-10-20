# lec 1: assembly → the cpu → gpt-2

one 90-minute session, two decks. `PLAN.md` is the run sheet.

- `risc-v/`: assembly + cpu execution (19 slides). `c/` holds the C ↔ asm pairs the assembly slides show.
- `gpt-2-arch/`: gpt-2, top to bottom with real weights (14 slides). `impl/` is the model; `tutorial.md` is the prose version.

each deck's `_cut/` holds the slides that didn't make the 90 minutes. running assembly live uses the emulator
in `../lec2/os` (`rv.sh run FILE.s`, `compile.sh FILE.c`); see `../lec2/os/README.md`.

```sh
cd risc-v/slides && bun install && bun run dev       # :4321. g = slide picker, p = presenter notes, f = fullscreen
cd risc-v/c && ./build.sh                            # c/*.c -> slides/src/asm/*.s

cd gpt-2-arch
impl/download.sh                                     # weights/ from openai-community/gpt2 (once, not in git)
../../../ml/.venv/bin/python impl/live.py            # the live-coding version: 90 lines, no cache, real weights
../../../ml/.venv/bin/python impl/live.py --check    # one head at a time == 12 heads in one matmul
../../../ml/.venv/bin/python impl/live.py --no-mask  # what breaks
../../../ml/.venv/bin/python impl/main.py            # full version with kv cache + jit; export.py taps it for the slides
../../../ml/.venv/bin/python impl/export.py          # -> slides/public/data/*.json (real activations the slides draw)
cd slides && bun install && bun run dev -- --port 4322
```

to pull template fixes: `cd ~/code/web/slides && bun run sync ~/code/edu/lec1/*/slides ~/code/edu/lec2/os/slides`.
