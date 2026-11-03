"""The GPU code tinygrad generates for one line of the model: slides/public/data/kernel.json (the "why a library" slide).

Runs `x.flatten(1).dot(l1.T).relu()` on a batch of 256 MNIST-shaped inputs with DEBUG=4, which prints the source of
every kernel it compiles, and saves the one that does the work. On a mac that's Metal; set DEV=CPU for C. Run with the
lab's environment:

  ../../../labs/mnist-lab/.venv/bin/python -I export_kernel.py
"""
import json, os, re, subprocess, sys
from pathlib import Path

OUT = Path(__file__).resolve().parent / "slides/public/data/kernel.json"
CODE = """
import numpy as np
from tinygrad import Tensor, Device
x = Tensor(np.ones((256, 1, 28, 28), np.float32)).realize()
l1 = Tensor(np.ones((128, 784), np.float32)).realize()
x.flatten(1).dot(l1.T).relu().realize()
print("DEVICE", Device.DEFAULT)
"""
out = subprocess.run([sys.executable, "-I", "-c", CODE], env={**os.environ, "DEBUG": "4"}, capture_output=True, text=True, check=True).stdout
device = re.search(r"^DEVICE (\w+)", out, re.M).group(1)
# kernel sources start at a line naming the kernel (metal: `kernel void`, c: `void`, cuda: `extern "C" __global__`)
kernels = re.findall(r"^((?:kernel void|void|extern \"C\" __global__ void) \w+\(.*?^})", out, re.M | re.S)
assert len(kernels) == 1, f"expected one kernel, got {len(kernels)}"
lines = kernels[0].split("\n")
OUT.write_text(json.dumps({"device": device, "line": "x.flatten(1).dot(l1.T).relu()", "lines": lines}))
print(f"{OUT}: {device}, 1 kernel, {len(lines)} lines")
