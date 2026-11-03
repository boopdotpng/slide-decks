# train mnist (lecture 2)

Replaces the transformer training lab for beginners, sized for 60-90 minutes around the live coding: setup first on a
mac or wsl (blackhole's `labs/02-mnist-train`: `setup.sh`, `check_setup.py`), then what mnist is, the array operations
the script uses, what tinygrad does with them, the model, the loss and the training loop, then everyone builds and
trains `mnist.py` live, then exercises.

```sh
cd slides && bun run dev      # after bun install at the repo root. p: presenter notes, ?theme=light, ?print
bun run check
```

## where the numbers come from

`slides/public/data/mnist.json`: `python -I export.py`, with the lab's environment
(`../../../labs/mnist-lab/.venv/bin/python`; it also needs numpy). It trains the exact loop from the slides
(seed 0): real digits, the loss curve, test accuracy along the way, one test digit's probabilities before / after,
the confusion matrix and the most confident mistakes.
`kernel.json` (slide 12): `python -I export_kernel.py`, same environment. `speed.json` and `runtime.json` fed the speed
and TinyJit slides, which were cut to make time for the live coding.

The script built live on slide 16 is `slides/src/lab.ts`, a copy of `labs/mnist-lab/mnist.py`: keep them identical.
The setup commands were run as written on macOS (uv 0.13, Python 3.14, tinygrad master `bd683c47a`): about 98% test
accuracy in ~5 s on METAL, ~30 s with `DEV=CPU`. The layout is `labs/02-mnist-train/{.venv, tinygrad, mnist.py}`; the install needs
`-C editable_mode=compat`, because setuptools' default editable hook loses to the `tinygrad/` folder next to the script
(`cannot import name 'Context'`).

Slides 2-3 match blackhole's `labs/02-mnist-train/README.md`: `setup.sh` runs these same commands in that folder
and `check_setup.py` checks the result. On a mac, METAL also needs Homebrew's `libLLVM` (tinygrad's Metal compiler
loads it): `brew install llvm@21`, with `LLVM_PATH` pointing at it when Homebrew isn't under `/opt/homebrew`. Without
it, only `DEV=CPU` runs.
