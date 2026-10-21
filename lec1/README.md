# lec 1: assembly → the cpu → rnn → gpt-2

one 90-minute session, two decks.

- `risc-v/`: assembly + cpu execution (21 slides), all built around one program, `sum.s` (sum an array in `.data`; `rv.sh run sum.s`).
- `rnn/`: a char rnn on tiny shakespeare in pytorch, the live demo before gpt-2. see `rnn/README.md`.
- `gpt-2-arch/`: rnn → gpt-2, beginner level, one 4-token prompt ("The United States of") followed through the whole model with
  real weights (28 slides: animations only, no code or math). `impl/` makes the data.

`risc-v/_cut/` holds the slides that didn't make the 90 minutes. running assembly live uses the emulator
in `../lec2/os` (`rv.sh run FILE.s`, `compile.sh FILE.c`); see `../lec2/os/README.md`.

```sh
cd risc-v/slides && bun install && bun run dev       # :4321. g = slide picker, p = presenter notes, f = fullscreen
cd risc-v/c && ./build.sh                            # c/*.c -> slides/src/asm/*.s

cd gpt-2-arch
impl/download.sh                                     # weights/ from openai-community/gpt2 (once, not in git)
../../../ml/.venv/bin/python impl/live.py            # gpt-2 in ~90 lines of pytorch, cpu, real weights: greedy completion
../../../ml/.venv/bin/python impl/live.py --check    # one head at a time == 12 heads in one matmul
../../../ml/.venv/bin/python impl/live.py --no-mask  # what breaks
../../../ml/.venv/bin/python impl/export.py          # -> slides/public/data/{embed,forward,loop}.json (real activations the slides draw)
cd slides && bun install && bun run dev -- --port 4322
```

to pull template fixes: `cd ~/code/web/slides && bun run sync ~/code/edu/lec1/*/slides ~/code/edu/lec2/os/slides`.
