"""The GPU code tinygrad generates for one line of array math: slides/public/data/kernel.json (the "why a library" slide).

Runs a small linear fit's loss, `(x @ w - y).square().mean()` (not the lab's model, so the slide doesn't give it away),
with DEBUG=4, which prints the source of every kernel it compiles. tinygrad fuses the whole line into one kernel. On a mac that's Metal; set DEV=CPU for C. Run with the
lab's environment:

  ../../../labs/mnist-lab/.venv/bin/python -I export_kernel.py
"""
import json, os, re, subprocess, sys
from pathlib import Path

OUT = Path(__file__).resolve().parent / "slides/public/data/kernel.json"
CODE = """
import numpy as np
from tinygrad import Tensor, Device
x = Tensor(np.ones((256, 512), np.float32)).realize()
w = Tensor(np.ones((512, 64), np.float32)).realize()
y = Tensor(np.ones((256, 64), np.float32)).realize()
(x @ w - y).square().mean().realize()
print("DEVICE", Device.DEFAULT)
"""
out = subprocess.run([sys.executable, "-I", "-c", CODE], env={**os.environ, "DEBUG": "4"}, capture_output=True, text=True, check=True).stdout
device = re.search(r"^DEVICE (\w+)", out, re.M).group(1)
# kernel sources start at a line naming the kernel (metal: `kernel void`, c: `void`, cuda: `extern "C" __global__`)
kernels = re.findall(r"^((?:kernel void|void|extern \"C\" __global__ void) \w+\(.*?^})", out, re.M | re.S)
assert len(kernels) == 1, f"expected one kernel, got {len(kernels)}"
lines = kernels[0].split("\n")
OUT.write_text(json.dumps({"device": device, "line": "(x @ w - y).square().mean()", "lines": lines}))
print(f"{OUT}: {device}, 1 kernel, {len(lines)} lines")
