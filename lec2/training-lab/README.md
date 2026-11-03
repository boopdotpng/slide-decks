# transformer training lab (lecture 2)

The intro lecture for the transformer training lab: from "one head at a time" (`../interp`) to students implementing,
configuring and training the five models in [rvfvn/transformer-training-lab](https://github.com/rvfvn/transformer-training-lab).
Slides 1–9 are the ~13 minute lecture (in the order of the revised draft); 10–13 are local setup, kept up during the lab;
14 is the source index.

```sh
cd slides && bun install && bun run dev      # http://localhost:4321  (p: presenter notes, ?theme=light, ?print)
bun run check                                # slide numbering, palette-only colors, astro check
bun run build                                # static site in slides/dist
```

The deck was written for the light theme (`t` cycles auto / light / dark, or open with `?theme=light`); every slide
also works in dark.

## where the numbers come from

- `slides/public/data/task0.json`, `task1.json`, `head1.json`, `task2w.json`, `task3w.json`, `task4.json`: copied from
  `../interp/slides/public/data` (recorded runs of the earlier lecture). Slides 2, 3, 5, 6 and the labelled insets on 4.
- `slides/public/data/step.json`: `python -I export_step.py`. One training update, computed by tinygrad 0.14.0: a model
  with task 3's shape at fresh weights (seed 0) on `a2f5c9d3fc → 4`. Slides 4 and 8.
- `slides/public/data/kernels.json`: `python -I export_kernels.py`. The kernels tinygrad 0.14.0 generates and launches on
  CPU for slide 6's first three lines, on a (1, 4, 4) example. Slide 7.

Both scripts need `tinygrad==0.14.0` (the lab's pin) and numpy, and run on CPU in a few seconds.
The setup slides follow the lab repo's README, `scripts/setup_environment.py`, `check_environment.py`, `check_configs.py`
and `configs/`; the expected output on slide 12 comes from running `bash setup-mac.sh` on a fresh clone (paths shortened).
