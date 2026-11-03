"""Real numbers for the mnist deck: slides/public/data/mnist.json.

Trains the exact model and loop from the lab (../../../labs/mnist-lab/mnist.py), seed 0, and saves:
dataset sizes, a grid of real training digits, one digit's pixel values, the loss curve, held-out accuracy along the
way, one test digit's probabilities before and after training, the confusion matrix and its
mistakes. Run with the lab's environment (tinygrad from a clone, `uv pip install -e ./tinygrad -C editable_mode=compat`):

  ../../../labs/mnist-lab/.venv/bin/python -I export.py
"""
import base64, json, math
from pathlib import Path
import numpy as np
from tinygrad import Context, Tensor, nn, Device
from tinygrad.engine.jit import TinyJit
from tinygrad.nn.datasets import mnist

OUT = Path(__file__).resolve().parent / "slides/public/data/mnist.json"
b64 = lambda a: base64.b64encode(np.ascontiguousarray(a, dtype=np.uint8).tobytes()).decode()
def q8(x, scale):  # tanh(v / scale) -> 0..255, 128 = 0 (viz/marks.tsx ByteHeat)
  t = np.tanh(np.asarray(x, dtype=np.float64) / scale)
  return {"b64": b64(np.round((t + 1) / 2 * 255)), "shape": list(np.shape(x)), "scale": float(scale)}

Tensor.manual_seed(0)
xtrain_u8, ytrain, xtest_u8, ytest = mnist()
X, Y = xtrain_u8.numpy().reshape(-1, 784), ytrain.numpy()
XT, YT = xtest_u8.numpy().reshape(-1, 784), ytest.numpy()

# ── the lab's code, unchanged except for the recording ───────────────────────
xtrain = xtrain_u8.float() / 255
mean = xtrain.mean()
xtrain = (xtrain - mean).realize()
xtest = (xtest_u8.float() / 255 - mean).realize()

l1 = Tensor.kaiming_normal(128, 28*28)
l2 = Tensor.kaiming_normal(10, 128)
def model(x): return x.flatten(1).dot(l1.T).relu().dot(l2.T)

def cross_entropy_loss(logits: Tensor, y: Tensor):
  z = logits - logits.max(-1, keepdim=True)
  logp = z - z.exp().sum(-1, keepdim=True).log()
  return -logp.gather(-1, y.unsqueeze(-1)).mean()

opt = nn.optim.SGD([l1, l2], lr=0.05, momentum=0.9)
BS, STEPS = 256, 5000

@TinyJit
@Context(TRAINING=True)
def train():
  opt.zero_grad()
  batch = Tensor.randint(BS, high=xtrain.shape[0])
  loss = cross_entropy_loss(model(xtrain[batch]), ytrain[batch]).backward()
  return loss.realize(*opt.schedule_step())

def test_acc(): return float((model(xtest).argmax(-1) == ytest).float().mean().item())
def probs(x): return model(x).softmax(-1).numpy()

EX = [int(i) for i in np.where(YT == 7)[0][:1]] + [int(np.where(YT == d)[0][0]) for d in (2, 1, 0, 4, 9)]
before = probs(xtest[EX])
losses, accs = [], [{"step": 0, "acc": test_acc()}]
for i in range(STEPS):
  losses.append(float(train().item()))
  if (i + 1) % 250 == 0: accs.append({"step": i + 1, "acc": test_acc()})
after = probs(xtest[EX])

pred = model(xtest).argmax(-1).numpy()
conf = np.zeros((10, 10), dtype=int)
np.add.at(conf, (YT, pred), 1)
p_all = model(xtest).softmax(-1).numpy()
wrong = np.where(pred != YT)[0]
wrong = wrong[np.argsort(-p_all[wrong, pred[wrong]])][:24]  # its most confident mistakes first

# ── the digits ───────────────────────────────────────────────────────────────
grid = [int(np.where(Y == d)[0][k]) for k in range(8) for d in range(10)]  # 8 rows, columns 0..9

data = {
  "device": Device.DEFAULT,
  "n_train": int(len(Y)), "n_test": int(len(YT)),
  "count_train": np.bincount(Y, minlength=10).tolist(), "count_test": np.bincount(YT, minlength=10).tolist(),
  "mean": float(mean.item()),
  "grid": {"b64": b64(X[grid]), "labels": Y[grid].tolist()},
  "one": {"index": 0, "label": int(Y[0]), "pixels": X[0].tolist()},
  "bs": BS, "steps": STEPS, "lr": 0.05, "momentum": 0.9,
  "loss": [round(v, 4) for v in losses],
  "acc": accs,
  "final_acc": accs[-1]["acc"],
  "uniform_loss": math.log(10),
  "example": {"idx": EX, "labels": YT[EX].tolist(), "b64": b64(XT[EX]),
              "before": np.round(before, 4).tolist(), "after": np.round(after, 4).tolist()},
  "confusion": conf.tolist(),
  "mistakes": {"b64": b64(XT[wrong]), "label": YT[wrong].tolist(), "pred": pred[wrong].tolist(),
               "p": np.round(p_all[wrong, pred[wrong]], 3).tolist()},
  "n_wrong": int((pred != YT).sum()),
}
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(json.dumps(data, separators=(",", ":")))
print(f"{OUT}: {OUT.stat().st_size // 1024} KB, device {Device.DEFAULT}, final loss {np.mean(losses[-50:]):.3f}, "
      f"test accuracy {data['final_acc']*100:.2f}%, {data['n_wrong']} wrong")
