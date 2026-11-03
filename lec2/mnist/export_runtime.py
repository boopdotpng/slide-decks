"""Runtime numbers for the tensor-library slides: slides/public/data/runtime.json.

1. batch = a loop you don't write: the model's forward pass on 256 images, as a python loop of 256 one-image calls
   vs one call on the whole (256, 784) batch. CPU.
2. TinyJit: one training step of the lab's model with and without @TinyJit, and how many kernels one step runs.
   Default device (Metal on a mac).
Medians after warm-up, each run synced. Run with the lab's environment:

  ../../../labs/mnist-lab/.venv/bin/python -I export_runtime.py
"""
import json, os, subprocess, sys
from pathlib import Path

OUT = Path(__file__).resolve().parent / "slides/public/data/runtime.json"

BATCH = r"""
import time, statistics, json
from tinygrad import Tensor, Device
Tensor.manual_seed(0)
x = Tensor.rand(256, 784).realize()
l1, l2 = Tensor.rand(128, 784).realize(), Tensor.rand(10, 128).realize()
def model(x): return x.dot(l1.T).relu().dot(l2.T)
rows = [x[i:i+1].contiguous().realize() for i in range(256)]
def loop():
  for r in rows: model(r).realize()
def batched(): model(x).realize()
for f in (loop, batched): f(); f()
def t(f, n):
  ts = []
  for _ in range(n):
    s = time.perf_counter(); f(); Device[Device.DEFAULT].synchronize(); ts.append(time.perf_counter() - s)
  return statistics.median(ts) * 1000
print("RESULT", json.dumps({"device": Device.DEFAULT, "loop_ms": t(loop, 7), "batched_ms": t(batched, 50)}))
"""

JIT = r"""
import time, statistics, json
from tinygrad import Context, Tensor, nn, Device
from tinygrad.engine.jit import TinyJit
from tinygrad.helpers import GlobalCounters
from tinygrad.nn.datasets import mnist
Tensor.manual_seed(0)
xtrain, ytrain, _, _ = mnist()
xtrain = xtrain.float() / 255
xtrain = (xtrain - xtrain.mean()).realize()
l1, l2 = Tensor.kaiming_normal(128, 28*28), Tensor.kaiming_normal(10, 128)
def model(x): return x.flatten(1).dot(l1.T).relu().dot(l2.T)
def cross_entropy_loss(logits, y):
  z = logits - logits.max(-1, keepdim=True)
  logp = z - z.exp().sum(-1, keepdim=True).log()
  return -logp.gather(-1, y.unsqueeze(-1)).mean()
opt = nn.optim.SGD([l1, l2], lr=0.05, momentum=0.9)
@Context(TRAINING=True)
def step():
  opt.zero_grad()
  batch = Tensor.randint(256, high=xtrain.shape[0])
  loss = cross_entropy_loss(model(xtrain[batch]), ytrain[batch]).backward()
  return loss.realize(*opt.schedule_step())
jit = TinyJit(step)
def t(f, n):
  for _ in range(5): f().item()
  ts = []
  for _ in range(n):
    s = time.perf_counter(); f().item(); ts.append(time.perf_counter() - s)
  return statistics.median(ts) * 1000
plain = t(step, 50)
GlobalCounters.reset(); step().item(); kernels = GlobalCounters.kernel_count
print("RESULT", json.dumps({"device": Device.DEFAULT, "plain_ms": plain, "jit_ms": t(jit, 200), "kernels": kernels}))
"""

def run(code, **env):
  out = subprocess.run([sys.executable, "-I", "-c", code], env={**os.environ, **env}, capture_output=True, text=True, check=True).stdout
  return json.loads(out.split("RESULT ", 1)[1])

batch = run(BATCH, DEV="CPU")
jit = run(JIT)
chip = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True).stdout.strip() or sys.platform
OUT.write_text(json.dumps({"machine": chip, "batch": batch, "jit": jit}))
print(f"batch ({batch['device']}): loop {batch['loop_ms']:.1f} ms vs batched {batch['batched_ms']:.2f} ms = {batch['loop_ms'] / batch['batched_ms']:.0f}x")
print(f"jit ({jit['device']}): {jit['kernels']} kernels/step, plain {jit['plain_ms']:.2f} ms vs jit {jit['jit_ms']:.2f} ms = {jit['plain_ms'] / jit['jit_ms']:.1f}x")
