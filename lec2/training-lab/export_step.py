# writes slides/public/data/step.json (for Backward.tsx and TrainStep.tsx): one training update of a model shaped like
# task 3 (two layers, one head each, head width 32, position embeddings, an MLP after layer 2), from FRESH weights
# (seed 0), on one example, a2f5c9d3fc -> 4. Everything is computed by tinygrad 0.14.0, the lab's pinned version, so the
# forward pass, the loss, the gradients and the optimizer step on the slides are one consistent run:
#   "ids", "target"      token ids (index into VOCAB) and the target's id
#   "E", "P"             token and position tables (36 x 32, 10 x 32), "x0" = E[ids] + P, every position's first stream
#   "attn1", "attn2"     each layer's attention (10 x 10, None where the causal mask hides a source)
#   "last"               the last position's stream before / after each write, and each write ("x0", "a1", "x1", "a2",
#                        "x2", "m", "x3"), 32 numbers each: residual addition is x_next = x + write
#   "mlp"                the last position inside the MLP: "pre" (64, before the relu), "h" (after), "write" (32), "active"
#                        (how many of the 64 are above 0, counted before rounding)
#   "logits", "probs"    the final position's 36 scores and their softmax; "loss" = -log probs[target]
#   "dlogits"            the gradient of the loss at the 36 scores: probs - onehot(target)
#   "grad_norm"          every parameter tensor's gradient norm; "emb_rows_grad": which of the 36 token rows got a
#                        nonzero gradient (only rows the input used); "dx0_norm": the gradient at each position's first stream
#   "update"             one Adam step (lr 0.001, the lab's configs): how many entries of each tensor moved (> 1e-6), the largest
#                        change, a few entries of the target's unembedding row before / after, and the loss on the same
#                        example after the step
#   python -I export_step.py        (needs tinygrad==0.14.0 and numpy; CPU)
import json, math, os, sys
os.environ.setdefault("DEV", "CPU")
import numpy as np
from tinygrad import Tensor, Context, nn, dtypes
from tinygrad.nn.state import get_parameters
from importlib.metadata import version

assert version("tinygrad") == "0.14.0", "pin tinygrad==0.14.0 (the lab's requirements.txt)"
VOCAB = "abcdefghijklmnopqrstuvwxyz0123456789"
TEXT, TARGET = "a2f5c9d3fc", "4"     # task 3: f -> 5, c -> 9, (5 + 9) mod 10 = 4
T, D, H, M = 10, 32, 32, 64

class Attention:
  def __init__(self):
    self.q, self.k, self.v = (nn.Linear(D, H, bias=False) for _ in range(3))
  def __call__(self, x):
    q, k, v = self.q(x), self.k(x), self.v(x)
    mask = Tensor.full((x.shape[1], x.shape[1]), -math.inf).triu(1)
    w = (q @ k.transpose(-1, -2) / math.sqrt(H) + mask).softmax(axis=-1)
    return w @ v, w

class Model:
  def __init__(self):
    self.E, self.P = nn.Embedding(36, D), nn.Embedding(T, D)
    self.l1, self.l2 = Attention(), Attention()
    self.up, self.down = nn.Linear(D, M), nn.Linear(M, D)
    self.U = nn.Linear(D, 36, bias=False)
  def __call__(self, ids, trace=None):
    x0 = self.E(ids) + self.P(Tensor.arange(ids.shape[1]))
    a1, w1 = self.l1(x0); x1 = x0 + a1
    a2, w2 = self.l2(x1); x2 = x1 + a2
    pre = self.up(x2); h = pre.relu(); m = self.down(h); x3 = x2 + m
    logits = self.U(x3[:, -1])                       # only the final position is graded
    if trace is not None: trace.update(x0=x0, a1=a1, x1=x1, w1=w1, a2=a2, x2=x2, w2=w2, pre=pre, h=h, m=m, x3=x3)
    return logits

Tensor.manual_seed(0)
model = Model()
params = get_parameters(model)
names = {id(p): n for n, p in [("E", model.E.weight), ("P", model.P.weight), ("l1.Wq", model.l1.q.weight), ("l1.Wk", model.l1.k.weight),
         ("l1.Wv", model.l1.v.weight), ("l2.Wq", model.l2.q.weight), ("l2.Wk", model.l2.k.weight), ("l2.Wv", model.l2.v.weight),
         ("mlp.W_up", model.up.weight), ("mlp.b_up", model.up.bias), ("mlp.W_down", model.down.weight), ("mlp.b_down", model.down.bias),
         ("U", model.U.weight)]}
optimizer = nn.optim.Adam(params, lr=0.001)
ids = Tensor([[VOCAB.index(c) for c in TEXT]], dtype=dtypes.int32)
target = Tensor([VOCAB.index(TARGET)], dtype=dtypes.int32)
before = {n: p.numpy().copy() for p in params if (n := names.get(id(p)))}

tr = {}
with Context(TRAINING=1):
  optimizer.zero_grad()
  logits = model(ids, tr)
  loss = logits.sparse_categorical_crossentropy(target)
  dx0 = loss.gradient(tr["x0"])[0]                   # the gradient that reaches each position's first stream
  loss.backward()
  optimizer.step()

after = {n: p.numpy() for p in params if (n := names.get(id(p)))}
with Context(TRAINING=0):
  loss_after = model(ids).sparse_categorical_crossentropy(target).item()

r = lambda a, d=3: np.round(np.asarray(a, dtype=np.float64), d).tolist()
def att(w):
  w = w.numpy()[0]
  return [[None if c > i else round(float(w[i, c]), 3) for c in range(T)] for i in range(T)]
p = logits.softmax(-1).numpy()[0]
lg = logits.numpy()[0]
onehot = np.eye(36)[VOCAB.index(TARGET)]
L = lambda k: tr[k].numpy()[0, -1]
emb_g = model.E.weight.grad.numpy()
grads = {}
for prm in params:
  n = names.get(id(prm))
  if n: grads[n] = round(float(np.linalg.norm(prm.grad.numpy())), 4)
# "changed": moved by more than 1e-6. Adam moves an entry with a gradient by about lr (1e-3) on its first step; entries
# whose gradient is exactly 0 (unused embedding rows) only pick up float32 rounding, ~1e-8
changed = {n: int((np.abs(after[n] - before[n]) > 1e-6).sum()) for n in before}
sizes = {n: int(before[n].size) for n in before}
tgt = VOCAB.index(TARGET)
out = {
  "text": TEXT, "target": TARGET, "ids": [VOCAB.index(c) for c in TEXT], "vocab": VOCAB, "seed": 0, "tinygrad": "0.14.0",
  "E": r(before["E"], 2), "P": r(before["P"], 2), "x0": r(tr["x0"].numpy()[0], 2),
  "attn1": att(tr["w1"]), "attn2": att(tr["w2"]),
  "last": {k: r(L(k)) for k in ("x0", "a1", "x1", "a2", "x2", "m", "x3")},
  "mlp": {"pre": r(L("pre")), "h": r(L("h")), "write": r(L("m")), "active": int((L("pre") > 0).sum())},
  "logits": r(lg), "probs": r(p, 4), "loss": round(float(loss.item()), 4), "ln36": round(math.log(36), 4),
  "dlogits": r(p - onehot, 4),
  "grad_norm": grads, "emb_rows_grad": [bool(np.abs(emb_g[i]).sum() > 0) for i in range(36)],
  "dx0_norm": r(np.linalg.norm(dx0.numpy()[0], axis=-1), 4),
  "update": {"lr": 0.001, "optimizer": "adam", "changed": changed, "size": sizes,
             "max_change": {n: float(f"{np.abs(after[n] - before[n]).max():.6f}") for n in before},
             "U_target_before": r(before["U"][tgt][:8], 4), "U_target_after": r(after["U"][tgt][:8], 4),
             "loss_after": round(loss_after, 4)},
}
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides/public/data/step.json")
json.dump(out, open(dst, "w"), separators=(",", ":"))
print(f"loss {out['loss']} (ln 36 = {out['ln36']}) -> after one adam step {loss_after:.4f}")
print(f"p(target) {p[tgt]:.4f}; argmax {VOCAB[int(p.argmax())]}")
print("emb rows with a gradient:", sum(out["emb_rows_grad"]), "of 36:", "".join(c for c, g in zip(VOCAB, out["emb_rows_grad"]) if g))
print("changed:", {n: f"{changed[n]}/{sizes[n]}" for n in changed})
print("grad norms:", grads)
print("dx0 norms:", out["dx0_norm"])
print(f"wrote {dst}")
