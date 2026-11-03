"""One training step of the lab's model on the CPU vs the GPU: slides/public/data/speed.json.

Same loop as the lab (batch 256, sgd with momentum), BEAM=2 so tinygrad searches for fast kernels on each device. Each
device runs in its own process: 20 warm-up steps (the JIT compiles and BEAM searches during these), then the median
of 200 timed steps, each one synced with .item() so the time includes the device finishing. Run with the lab's
environment:

  ../../../labs/mnist-lab/.venv/bin/python -I export_speed.py
"""
import json, os, platform, subprocess, sys
from pathlib import Path

OUT = Path(__file__).resolve().parent / "slides/public/data/speed.json"
CODE = r"""
import json, time, statistics
from tinygrad import Context, Tensor, nn, Device
from tinygrad.engine.jit import TinyJit
from tinygrad.nn.datasets import mnist
Tensor.manual_seed(0)
xtrain, ytrain, _, _ = mnist()
xtrain = xtrain.float() / 255
xtrain = (xtrain - xtrain.mean()).realize()
l1 = Tensor.kaiming_normal(128, 28*28)
l2 = Tensor.kaiming_normal(10, 128)
def model(x): return x.flatten(1).dot(l1.T).relu().dot(l2.T)
def cross_entropy_loss(logits, y):
  z = logits - logits.max(-1, keepdim=True)
  logp = z - z.exp().sum(-1, keepdim=True).log()
  return -logp.gather(-1, y.unsqueeze(-1)).mean()
opt = nn.optim.SGD([l1, l2], lr=0.05, momentum=0.9)
@TinyJit
@Context(TRAINING=True)
def train():
  opt.zero_grad()
  batch = Tensor.randint(256, high=xtrain.shape[0])
  loss = cross_entropy_loss(model(xtrain[batch]), ytrain[batch]).backward()
  return loss.realize(*opt.schedule_step())
for _ in range(20): train().item()
ts = []
for _ in range(200):
  t = time.perf_counter(); train().item(); ts.append(time.perf_counter() - t)
print("RESULT", json.dumps({"device": Device.DEFAULT, "ms": statistics.median(ts) * 1000}))
"""
res = []
for dev in ["CPU", None]:  # None: the default device (METAL on a mac)
  env = {**os.environ, "BEAM": "2"}
  if dev: env["DEV"] = dev
  out = subprocess.run([sys.executable, "-I", "-c", CODE], env=env, capture_output=True, text=True, check=True).stdout
  r = json.loads(out.split("RESULT ", 1)[1])
  res.append(r)
  print(f"{r['device']}: {r['ms']:.2f} ms per step")
chip = subprocess.run(["sysctl", "-n", "machdep.cpu.brand_string"], capture_output=True, text=True).stdout.strip() if platform.system() == "Darwin" else platform.processor()
data = {"machine": chip or f"{platform.system()} {platform.machine()}", "beam": 2, "batch": 256, "steps": 5000, "runs": res}
OUT.write_text(json.dumps(data))
print(f"{OUT}: {res[0]['device']} / {res[1]['device']} = {res[0]['ms'] / res[1]['ms']:.1f}x")
