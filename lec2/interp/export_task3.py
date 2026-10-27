# writes slides/public/data/task3w.json (for Task3.tsx): the trained task 3 model (two layers, one head each, position
# embeddings, an MLP after layer 2) from ~/code/ml/interp/checkpoints/task3.safetensors (written by task3.py), read the interp way:
#   "embedding", "position"  the token and position tables, for Net.tsx
#   "l1"       layer 1's attention, test averages: each value row on the key right before it, and q2 on q1 (new in task 3)
#   "l2"       layer 2's attention from the last position, test averages: on the value at q1, on the value at q2; and from
#              q1's position: on q1's value, and how often that's its top pick
#   "qk"       layer 2's score advantage of each target value over the other values, split by which part of the query
#              stream (its token, layer 1's write) meets which part of the key stream (layer 1's write). test averages
#   "qk2"      the same split as raw scores from the last position: on the value at q1, at q2, and on the last position
#              itself: "token" its token x the key's tag, "write" layer 1's copy x the tag, "pos" everything else
#              (position), "total". test averages
#   "acc"      test accuracy: the full model, the stream before the MLP read by the unembedding, the MLP's write alone
#   "active"   MLP neurons above 0 at the last position, test average (of 64)
#   "mlp_in"   how much of the variation in the MLP's input (the last stream after attention) is explained by the ordered
#              pair (a, b), by the unordered pair, and by the answer (a + b) mod 10. test set
#   "fit_r2"   every neuron's input over the (a, b) grid fit as score(a) + score(b) + bias (one score table for both):
#              the worst neuron's r²
#   "neuron"   one neuron, the one that helps the example's answer most: its score table (10, per digit), bias, its input and
#              its firing (after the relu) for every pair (a, b) (means over 100 random sequences each, analysis.py's
#              two_key_inputs), and its votes: its column of W_down read by the unembedding, digits only
#   "votes"    every neuron's column of W_down read by the unembedding (36 x 64)
#   "mlp_out"  the same as mlp_in for the stream leaving the MLP (the last stream after the MLP's write): pair, answer
#   "grid"     every neuron over the 10 x 10 pairs (a, b), means over the same 100 random sequences each: "h" its firing
#              (64 x 10 x 10); "help" how much it helps on average (its write's vote for the right answer minus its mean vote over
#              the ten digits, per sequence); "stripe" how many neurons' top vote is one of the two commonest answers in the cells
#              where they fire; "topk" the MLP's write alone (digits only) with just the k most helpful neurons kept: accuracy
#              over the grid and per cell; "match" per neuron, the correlation between its votes and the answers under its patch
#              (how often each digit is the answer in the cells it fires on, weighted by how hard it fires)
#   "no_relu"  test accuracy with the relu taken out: the trained model with relu swapped for identity, and the same model
#              retrained without it (checkpoints/task3_norelu.safetensors, from train_task3_norelu.py)
#   "example"  one input through the model: both attention matrices, the MLP's neurons at the last position before the relu (pre) and after (h), the
#              unembedding's read of the stream before the MLP, the MLP's write, and after (before + write = after);
#              layer 2's value read by the unembedding: per position (v2_logits), its write at the last position
#              (write2_logits), and the rest of the last stream entering layer 2 (rest_logits). write2 + rest = logits_before
#   "shapes", "ablation"  test accuracy by model shape, and with one piece of the trained model removed (task3.py's csvs)
#   PYTHONPATH=~/code/ml/tinygrad uv run --with numpy --with matplotlib python export_task3.py [~/code/ml/interp] [a2f5c9d3fc]
import csv, json, os, sys
import numpy as np

src = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/code/ml/interp")
text = sys.argv[2] if len(sys.argv) > 2 else "a2f5c9d3fc"
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides/public/data/task3w.json")
sys.path.insert(0, src); os.chdir(src)
from tinygrad import nn
from lib.model import Model
from lib.dataset import VOCAB, N_LETTERS, two_key_dataset
from lib.analysis import forward, qk_parts, two_key_inputs

model = Model(seq_len=10, n_layers=2, n_heads=1, mlp=True)
nn.state.load_state_dict(model, nn.state.safe_load("checkpoints/task3.safetensors"))
E, P, U = model.emb.weight.numpy(), model.pos_emb.weight.numpy(), model.unembed.weight.numpy()
Wup, Wdown = model.layers[1].mlp.up.weight.numpy(), model.layers[1].mlp.down.weight.numpy()   # (64, 32), (32, 64)

# test set
_, xtest, _, ytest = two_key_dataset(op="sum")
X, Y = xtest.numpy(), ytest.numpy()
B, I = len(X), np.arange(len(X))
r = forward(model, X)
first = 2*(X[:, 0:8:2] == X[:, 8:9]).argmax(1) + 1          # position of the value at q1, and at q2
second = 2*(X[:, 0:8:2] == X[:, 9:10]).argmax(1) + 1
a1, a2 = r["pattern"][0][:, 0], r["pattern"][1][:, 0]
l1 = {"one_back": [float(a1[:, v, v - 1].mean()) for v in (1, 3, 5, 7)], "q2_on_q1": float(a1[:, 9, 8].mean())}
l2 = {"q1": float(a2[I, -1, first].mean()), "q2": float(a2[I, -1, second].mean()),
      # the row at q1 (one key in its stream, layer 1 wrote digits there): task 2's lookup, on its own
      "q1_row": float(a2[I, -2, first].mean()), "q1_row_top": float((a2[:, -2].argmax(1) == first).mean())}
is_value = np.zeros((B, 10), dtype=bool); is_value[:, 1:8:2] = True
qk = {}
for target, name in ((first, "q1"), (second, "q2")):
  names, M = qk_parts(model, r, 1, 0, -1, target, is_value)
  t, w = names.index("token"), names.index("L1H1")
  qk[name] = {"token": float(M[t, w]), "write": float(M[w, w])}   # query part x layer 1's write in the key
# the same split as raw scores (not advantages), for the slide's 2 x 2: the last stream's token (c) and layer 1's copy (f),
# each against layer 1's tag under the 5 and the 9; "pos" is the rest of the score (position with everything), and the last
# column itself, which carries the f tag too but sits in a letter slot
from lib.analysis import head_dim
attn2 = model.layers[1].attn
Wq2, Wk2 = attn2.q_proj.weight.numpy()[:head_dim], attn2.k_proj.weight.numpy()[:head_dim]
def score(nq, nk, idx):
  s = np.einsum("bd,btd->bt", r["parts"][nq][:, -1] @ Wq2.T, r["parts"][nk] @ Wk2.T) / head_dim ** 0.5
  return float(s[I, idx].mean())
qk2 = {}
for name, idx in (("q1", first), ("q2", second), ("self", np.full(B, 9))):
  parts = ["token", "position", "L1H1"]
  full = sum(score(a, b, idx) for a in parts for b in parts)
  qk2[name] = {"token": score("token", "L1H1", idx), "write": score("L1H1", "L1H1", idx)}
  qk2[name]["pos"] = full - qk2[name]["token"] - qk2[name]["write"]
  qk2[name]["total"] = full
pre_stream = r["resid"][2][:, -1]                             # after layer 2's attention, entering the MLP
acc = {"full": float((r["logits"].argmax(-1) == Y).mean()), "before": float(((pre_stream @ U.T).argmax(-1) == Y).mean()),
       "write": float(((r["parts"]["MLP"][:, -1] @ U.T).argmax(-1) == Y).mean())}
active = float((r["neurons"] > 0).sum(1).mean())

# what the MLP reads: the pair, not the answer
a_, b_ = X[I, first] - N_LETTERS, X[I, second] - N_LETTERS             # the two value digits, 0..9
def explained(groups, S=pre_stream):
  res = sum(((S[groups == g] - S[groups == g].mean(0))**2).sum() for g in np.unique(groups))
  return float(1 - res / ((S - S.mean(0))**2).sum())
mlp_in = {"pair": explained(a_ * 10 + b_), "unordered": explained(np.minimum(a_, b_) * 10 + np.maximum(a_, b_)), "sum": explained((a_ + b_) % 10)}

rd = lambda m, d=2: np.round(np.asarray(m, dtype=np.float64), d).tolist()   # float64 first, or json gets 0.23999999463558197

# neurons over every pair of values (a, b): input and firing, means over n random sequences each
rng = np.random.default_rng(0)
n = 100
G = np.concatenate([two_key_inputs(a, b, n, rng) for a in range(10) for b in range(10)])
g = forward(model, G)
pre_g = (g["resid"][2][:, -1] @ Wup.T).reshape(10, 10, n, -1).mean(2)   # (a, b, 64)
act = g["neurons"].reshape(10, 10, n, -1).mean(2)
bias = pre_g.mean((0, 1))
score = (pre_g.mean(1) + pre_g.mean(0)) / 2 - bias                       # one table for a and b
fit = bias + score[:, None] + score[None]
fit_r2 = 1 - ((pre_g - fit)**2).sum((0, 1)) / ((pre_g - pre_g.mean((0, 1)))**2).sum((0, 1))
V = U @ Wdown                                                            # (36, 64): each neuron's votes

# leaving the mlp: the answer is in the stream now
post_stream = pre_stream + r["parts"]["MLP"][:, -1]
mlp_out = {"pair": explained(a_ * 10 + b_, post_stream), "sum": explained((a_ + b_) % 10, post_stream)}

# every neuron over the grid, per sequence: what it helps, and the write with only the most helpful kept
act_n = g["neurons"].reshape(10, 10, n, -1)                               # (a, b, seq, 64)
ans = np.add.outer(np.arange(10), np.arange(10)) % 10
Vd = V[N_LETTERS:]                                                       # (10, 64): votes for the digits
contrib = act_n[..., None, :] * Vd                                       # (a, b, seq, digit, 64)
right = np.take_along_axis(contrib, np.broadcast_to(ans[:, :, None, None, None], (10, 10, n, 1, 64)), 3)[..., 0, :]
help_ = (right - contrib.mean(3)).mean((0, 1, 2))
order = np.argsort(-help_)
topk = []
for kk in (8, 16, 32, 48, 64):
  m = np.zeros(64); m[order[:kk]] = 1
  ok = ((contrib * m).sum(-1).argmax(-1) == ans[..., None]).mean(2)     # (a, b): fraction right
  topk.append({"k": kk, "acc": round(float(ok.mean()), 3), "cells": np.round(ok.astype(np.float64), 2).tolist()})
fires = act > 0.05
stripe = sum(int(np.argmax(Vd[:, k_]) in np.argsort(-np.bincount(ans[fires[..., k_]], minlength=10))[:2]) for k_ in range(64) if fires[..., k_].any())
under = np.stack([np.bincount(ans.ravel(), weights=act[..., k_].ravel(), minlength=10) for k_ in range(64)], 1)   # (10, 64)
match = [float(np.corrcoef(under[:, k_], Vd[:, k_])[0, 1]) if under[:, k_].any() else 0.0 for k_ in range(64)]
grid = {"score": rd(score.T), "bias": rd(bias),   # per neuron: its score for each digit (same for a and b), and its bias
        "match": np.round(match, 2).tolist(), "h": np.round(act.transpose(2, 0, 1).astype(np.float64), 1).tolist(), "help": np.round(help_.astype(np.float64), 3).tolist(), "stripe": stripe,
        "fire_any": int(fires.any((0, 1)).sum()), "topk": topk}

# no relu: swapped out of the trained model, and retrained without it
lin = pre_stream + (pre_stream @ Wup.T) @ Wdown.T
no_relu = {"swapped": float(((lin @ U.T).argmax(-1) == Y).mean())}
if os.path.exists("checkpoints/task3_norelu.safetensors"):
  import model as model_mod
  relu_call = model_mod.Mlp.__call__
  model_mod.Mlp.__call__ = lambda self, x: self.down(self.up(x))
  m2 = Model(seq_len=10, n_layers=2, n_heads=1, mlp=True)
  nn.state.load_state_dict(m2, nn.state.safe_load("checkpoints/task3_norelu.safetensors"))
  r2_ = forward(m2, X)
  x2 = r2_["resid"][2][:, -1]
  W2u, W2d = m2.layers[1].mlp.up.weight.numpy(), m2.layers[1].mlp.down.weight.numpy()
  no_relu["retrained"] = float((((x2 + (x2 @ W2u.T) @ W2d.T) @ m2.unembed.weight.numpy().T).argmax(-1) == Y).mean())
  model_mod.Mlp.__call__ = relu_call

# the example
ids = np.array([[VOCAB.index(c) for c in text]])
e = forward(model, ids)
x = e["resid"][2][0, -1]
pre = Wup @ x
h = np.maximum(pre, 0)
write = Wdown @ h
lg = e["logits"][0]
v2 = e["values"][1][0, 0]                                    # (10, 32): each position's layer 2 value
w2 = e["parts"]["L2H1"][0, -1]                               # layer 2's write at the last position
p = np.exp(lg - lg.max()); p /= p.sum()
k = int(np.argmax(h * (V[int(p.argmax())] - V[N_LETTERS:].mean(0))))   # the neuron that helps the answer most
neuron = {"id": k, "score": np.round(score[:, k].astype(np.float64), 2).tolist(), "bias": round(float(bias[k]), 2),
          "pre": np.round(pre_g[..., k].astype(np.float64), 2).tolist(), "h": np.round(act[..., k].astype(np.float64), 2).tolist(),
          "votes": np.round(V[N_LETTERS:, k].astype(np.float64), 2).tolist()}

nul = lambda m: [[None if j > i else round(float(m[i][j]), 3) for j in range(len(m))] for i in range(len(m))]
rows = lambda m: [{f"d{k}": round(float(v), 3) for k, v in enumerate(row)} for row in m]   # Net.tsx's table format
table = lambda f: [(row["model"], float(row["test_accuracy"])) for row in csv.DictReader(open(f"data/task3/{f}.csv"))]
out = {"shapes": table("accuracy"), "ablation": table("ablation"), "embedding": rows(E), "position": rows(P), "l1": l1, "l2": l2, "qk": qk, "qk2": {k_: {k2: round(v, 2) for k2, v in d_.items()} for k_, d_ in qk2.items()}, "acc": acc, "active": round(active, 1),
       "mlp_in": {k_: round(v, 3) for k_, v in mlp_in.items()}, "fit_r2": round(float(fit_r2.min()), 3), "neuron": neuron, "votes": rd(V),
       "mlp_out": {k_: round(v, 3) for k_, v in mlp_out.items()}, "grid": grid,
       "no_relu": {k_: round(v, 3) for k_, v in no_relu.items()},
       "example": {"text": text, "tokens": list(VOCAB), "attn1": nul(e["pattern"][0][0, 0]), "attn2": nul(e["pattern"][1][0, 0]),
                   "probs": rd(p, 4), "pre": rd(pre), "h": rd(h), "logits_before": rd(U @ x),
                   # the whole mlp on all ten streams, for the matmul slide: in, before / after the relu, the write; and its weights
                   "mlp": {"x": rd(e["resid"][2][0]), "pre": rd(e["resid"][2][0] @ Wup.T), "h": rd(np.maximum(e["resid"][2][0] @ Wup.T, 0)),
                           "write": rd(np.maximum(e["resid"][2][0] @ Wup.T, 0) @ Wdown.T), "up": rd(Wup.T), "down": rd(Wdown.T)},
                   "v2_logits": rd(v2 @ U.T), "write2_logits": rd(U @ w2), "rest_logits": rd(U @ e["resid"][1][0, -1]), "logits_write": rd(U @ write), "logits_after": rd(lg)}}
json.dump(out, open(dst, "w"), separators=(",", ":"))
print(f"layer 1: one back {np.round(l1['one_back'], 3)}, q2 on q1 {l1['q2_on_q1']:.3f}; layer 2: {l2}")
print(f"qk: {qk}\nqk2: {qk2}")
print(f"acc: {acc}; active neurons {active:.1f} / 64; mlp input explained by {mlp_in}; score(a) + score(b) + bias fit, worst r² {fit_r2.min():.3f}")
print(f"leaving the mlp: {mlp_out}; top-k helpful neurons: {[(t['k'], t['acc']) for t in topk]}; top vote in own patch: {stripe}/{grid['fire_any']}; votes vs answers under the patch: median corr {np.median(match):.2f}, min {min(match):.2f}, >= 0.9: {sum(m_ >= 0.9 for m_ in match)}")
print(f"no relu: {no_relu}; neuron {k}: score {np.round(score[:, k], 1)}, bias {bias[k]:.1f}, votes {np.round(V[N_LETTERS:, k], 2)}")
print(f"{text}: layer 2 from the last position {np.round(e['pattern'][1][0, 0, -1], 2)}; {(h > 0).sum()} neurons fire")
print(f"  before says {VOCAB[int((U @ x).argmax())]}, write says {VOCAB[int((U @ write).argmax())]}, output {VOCAB[int(p.argmax())]} ({p.max():.3f})")
print(f"  |x| {np.linalg.norm(x):.1f}, |write| {np.linalg.norm(write):.1f}; wrote {dst}")
