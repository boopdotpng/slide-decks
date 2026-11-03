# train mnist (lecture 2)

Replaces the transformer training lab for beginners: what mnist is, a two-layer model in tinygrad, the loss, the
training loop, what it learned, then setup on a mac or wsl
(blackhole's `labs/02-mnist-train`: `setup.sh`, `check_setup.py`) and exercises.

```sh
cd slides && bun run dev      # after bun install at the repo root. p: presenter notes, ?theme=light, ?print
bun run check
```

## where the numbers come from

`slides/public/data/mnist.json`: `python -I export.py`, with the lab's environment
(`../../../labs/mnist-lab/.venv/bin/python`; it also needs numpy). It trains the exact loop from the slides
(seed 0): real digits, the loss curve, test accuracy along the way, one test digit's probabilities before / after,
the confusion matrix and the most confident mistakes.

The script on slides 4-7 and 13 is `slides/src/lab.ts`, a copy of `labs/mnist-lab/mnist.py`: keep them identical.
The setup commands were run as written on macOS (uv 0.13, Python 3.14, tinygrad master `bd683c47a`): about 98% test
accuracy in ~5 s on METAL, ~30 s with `DEV=CPU`. The layout is `labs/02-mnist-train/{.venv, tinygrad, mnist.py}`; the install needs
`-C editable_mode=compat`, because setuptools' default editable hook loses to the `tinygrad/` folder next to the script
(`cannot import name 'Context'`).

Slides 20-21 match blackhole's `labs/02-mnist-train/README.md`: `setup.sh` runs these same commands in that folder
and `check_setup.py` checks the result. On a mac, METAL also needs Homebrew's `libLLVM` (tinygrad's Metal compiler
loads it): `brew install llvm@21`, with `LLVM_PATH` pointing at it when Homebrew isn't under `/opt/homebrew`. Without
it, only `DEV=CPU` runs.
