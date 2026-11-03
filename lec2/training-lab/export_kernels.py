# writes slides/public/data/kernels.json (for Execution.tsx): what tinygrad 0.14.0 actually runs for slide 6's first three
# lines on a tiny (1, 4, 4) example, on the CPU backend. Runs a child python with DEBUG=4 (print each kernel's generated
# source and each launch) and NOOPT=1 (no unrolling / vectorizing, so the loops read like the math; the default settings
# keep the same kernel boundaries, with more tuned code inside), and keeps, for each realize():
#   "kernels": the kernels launched, in order: "name" (r_ = has a reduction, E_ = elementwise; the numbers are loop sizes),
#              "src" its generated C source (the CPU backend compiles it with clang)
#   python -I export_kernels.py        (needs tinygrad==0.14.0)
import json, os, re, subprocess, sys
from importlib.metadata import version

assert version("tinygrad") == "0.14.0", "pin tinygrad==0.14.0 (the lab's requirements.txt)"
CHILD = r'''
import math
from tinygrad import Tensor
q = Tensor.randn(1, 4, 4).realize(); k = Tensor.randn(1, 4, 4).realize()
mask = Tensor.full((4, 4), -math.inf).triu(1).realize()
print("@@ scores", flush=True)
scores = q @ k.transpose(-1, -2)
scores = scores / math.sqrt(q.shape[-1])
scores.realize()
print("@@ weights", flush=True)
weights = (scores + mask).softmax(axis=-1)
weights.realize()
print("@@ end", flush=True)
'''
env = {**os.environ, "DEV": "CPU", "DEBUG": "4", "NOOPT": "1"}
run = subprocess.run([sys.executable, "-I", "-c", CHILD], env=env, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, check=True)
log = re.sub(r"\x1b\[[0-9;]*m", "", run.stdout)     # one stream, so the markers and the kernel output stay in order

# every source in the log, keyed by (name, argument count): kernels compiled together print their source when the
# process exits, so a source is not always next to its launch; names repeat (E_4_4 also built the mask), counts tell apart
SRC = {}
for m in re.finditer(r"^void (\w+)\((.*?)\) \{.*?^\}", log, re.M | re.S):
  SRC.setdefault((m.group(1), m.group(2).count("restrict")), m.group(0))

def kernels(chunk):
  """the kernels launched in this chunk, in order, with their sources"""
  return [{"name": n, "args": int(a), "src": SRC.get((n, int(a)))}
          for n, a in re.findall(r"^\*\*\*\s+CPU\s+\d+\s+(\S+)\s+arg\s+(\d+)", chunk, re.M)]

scores_chunk = log.split("@@ scores")[1].split("@@ weights")[0]
weights_chunk = log.split("@@ weights")[1].split("@@ end")[0]
res = {"tinygrad": "0.14.0", "device": "CPU", "flags": "DEBUG=4 NOOPT=1", "shape": [1, 4, 4],
       "scores": kernels(scores_chunk), "weights": kernels(weights_chunk)}
assert all(k["src"] for k in res["scores"] + res["weights"]), "a launched kernel had no source in the log"
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides/public/data/kernels.json")
json.dump(res, open(dst, "w"), indent=1)
for name in ("scores", "weights"):
  print(name, [k["name"] for k in res[name]])
print(f"wrote {dst}")
