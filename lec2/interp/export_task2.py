# writes slides/public/data/task2w.json (for Task2.tsx): the trained task 2 model (two layers, one head each, position
# embeddings) from ~/code/ml/interp/checkpoints/task2.safetensors (written by task2.py), read the interp way:
#   "write"    layer 1's write read by layer 2: layer 2's score from the query position to a value position, averaged over
#              all 11000 sequences by (query letter, the key letter right before that value, which layer 1 copied in). 26 × 26.
#              full real streams: the token × layer-1-write product alone only picks the right letter in some rows
#   "wins"     how often layer 2 picks the matching value using only the query token × layer 1 write term, the whole
#              query × layer 1 write, or the full score (K-composition: layer 2's K reads layer 1's V)
#   "embedding", "position"  the token and position tables (36 and 9 rows of d0..d31), for Net.tsx
#   "l2_from_query"  layer 2's attention from the query, averaged: on key positions, on values, on the right value, on itself
#   "example"  one input through the model: layer 1 and layer 2 attention (9 × 9 each; attn2_nomask: layer 2 on the same
#              streams with its mask dropped, for one picture), output probabilities, and layer 2's
#              value read by the unembedding: per position (v2_logits), the head's write at the query (write2_logits), and
#              everything else in the query's stream (rest_logits: tok + pos + layer 1's write). write2 + rest = the logits
# the test-set averages (attention, qk splits, ablations) are task2.json, copied from the csvs by export_task.py 2
#   PYTHONPATH=~/code/ml/tinygrad uv run --with numpy --with matplotlib python export_task2.py [~/code/ml/interp] [a2f5c9d3f]
import json, os, sys
import numpy as np

src = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/code/ml/interp")
text = sys.argv[2] if len(sys.argv) > 2 else "a2f5c9d3f"
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides/public/data/task2w.json")
sys.path.insert(0, src); os.chdir(src)
from tinygrad import nn
from model import Model
from dataset import VOCAB, N_LETTERS, lookup_dataset

model = Model(seq_len=9, n_layers=2, n_heads=1)
nn.state.load_state_dict(model, nn.state.safe_load("checkpoints/task2.safetensors"))
E, P, U = model.emb.weight.numpy(), model.pos_emb.weight.numpy(), model.unembed.weight.numpy()
A1, A2 = model.layers[0].attn, model.layers[1].attn
Wq1, Wk1, Wv1 = (w.weight.numpy() for w in (A1.q_proj, A1.k_proj, A1.v_proj))
Wq2, Wk2, Wv2 = (w.weight.numpy() for w in (A2.q_proj, A2.k_proj, A2.v_proj))
SQ = np.sqrt(Wq1.shape[0])

def attend(x, Wq, Wk, Wv):                                   # x: (..., T, 32)
  s = (x @ Wq.T) @ np.swapaxes(x @ Wk.T, -1, -2) / SQ
  s = s + np.triu(np.full(s.shape[-2:], -np.inf), 1)
  a = np.exp(s - s.max(-1, keepdims=True)); a /= a.sum(-1, keepdims=True)
  return a, a @ (x @ Wv.T), s

ids = [VOCAB.index(c) for c in text]
x0 = E[ids] + P[:len(ids)]
a1, w1, _ = attend(x0, Wq1, Wk1, Wv1)
x1 = x0 + w1
a2, w2, _ = attend(x1, Wq2, Wk2, Wv2)
lg = U @ (x1 + w2)[-1]
# layer 2 on the same streams without its mask (for one picture only: the model was trained with it). every key row's
# target, the digit right after it, is no longer hidden
s2 = (x1 @ Wq2.T) @ (x1 @ Wk2.T).T / SQ
a2_open = np.exp(s2 - s2.max(1, keepdims=True)); a2_open /= a2_open.sum(1, keepdims=True)
v2_logits = (x1 @ Wv2.T) @ U.T                               # (9, 36): each position's layer 2 value, read by the unembedding
p = np.exp(lg - lg.max()); p /= p.sum()

X = np.concatenate([t.numpy() for t in lookup_dataset()[:2]])  # every train and test sequence
VALS = [1, 3, 5, 7]
_, W1, _ = attend(E[X] + P, Wq1, Wk1, Wv1)
A2, _, S2 = attend(E[X] + P + W1, Wq2, Wk2, Wv2)
sums, cnt = np.zeros((N_LETTERS, N_LETTERS)), np.zeros((N_LETTERS, N_LETTERS))
for v in (1, 3, 5, 7):                                       # value positions; the key letter sits right before each
  np.add.at(sums, (X[:, -1], X[:, v - 1]), S2[:, -1, v]); np.add.at(cnt, (X[:, -1], X[:, v - 1]), 1)
write = sums / cnt                                           # row = query letter, column = letter copied into the value

# how often the matching value has the highest layer 2 score among the four values, using only some of the score's terms.
# the big term (query token × layer 1's write) carries the lookup; the small terms fix the letter pairs it confuses
Xi = np.arange(len(X))
target = np.array([2 * list(x[0:8:2]).index(x[-1]) + 1 for x in X])
kw = W1[:, VALS] @ Wk2.T                                     # (B, 4, 32): the key part from layer 1's write at each value
def wins(q):                                                 # q: (B, 32), the query part used
  s = np.einsum("bd,bjd->bj", q, kw)
  return float((np.array(VALS)[s.argmax(1)] == target).mean())
xq = E[X[:, -1]] + P[-1] + W1[:, -1]                         # the query position's stream entering layer 2
terms = {"token x write": wins(E[X[:, -1]] @ Wq2.T), "query x write": wins(xq @ Wq2.T),
         "full": float((np.array(VALS)[S2[Xi, -1][:, VALS].argmax(1)] == target).mean())}
# where layer 2 looks from the query, averaged over every sequence: why layer 1's writes at key positions don't matter
l2 = {"keys": float(A2[:, -1, [0, 2, 4, 6]].sum(1).mean()), "values": float(A2[:, -1, VALS].sum(1).mean()),
      "target": float(A2[Xi, -1, target].mean()), "query": float(A2[:, -1, -1].mean())}

r = lambda m, d=2: np.round(np.asarray(m, dtype=np.float64), d).tolist()   # float64 first, or json gets 0.23999999463558197
nul = lambda m: [[None if j > i else round(float(m[i][j]), 3) for j in range(len(m))] for i in range(len(m))]
rows = lambda m: [{f"d{k}": round(float(v), 3) for k, v in enumerate(row)} for row in m]   # Net.tsx's table format
out = {"embedding": rows(E), "position": rows(P), "letters": list(VOCAB[:N_LETTERS]), "write": r(write), "wins": {k: round(v, 4) for k, v in terms.items()}, "l2_from_query": {k: round(v, 4) for k, v in l2.items()},
       "example": {"text": text, "attn1": nul(a1), "attn2": nul(a2), "attn2_nomask": r(a2_open, 3), "probs": r(p, 4), "tokens": list(VOCAB),
                   "v2_logits": r(v2_logits), "write2_logits": r(U @ w2[-1]), "rest_logits": r(U @ x1[-1])}}
json.dump(out, open(dst, "w"), separators=(",", ":"))
diag = np.diag(write)
off = write[~np.eye(N_LETTERS, dtype=bool)].reshape(N_LETTERS, N_LETTERS - 1)
print(f"write: diagonal {diag.mean():.1f} (min {diag.min():.1f}), off-diagonal {off.mean():.1f} (max {off.max():.1f}); "
      f"diagonal is the row max in {(write.argmax(1) == np.arange(N_LETTERS)).sum()}/26 rows")
print(f"{text}: layer 1 one-back {[round(float(a1[i, i-1]), 2) for i in range(1, 9, 2)]}, layer 2 from the query {r(a2[-1])}")
print(f"matching value wins: {terms}")
print(f"layer 2 from the query: {l2}")
print(f"layer 2 without the mask, where each row looks: {[text[j] + '@' + str(j) for j in a2_open.argmax(1)]} {r([a2_open[i].max() for i in range(9)])}")
print(f"layer 2 values say: {[VOCAB[int(i)] for i in v2_logits.argmax(1)]}; write says {VOCAB[int((U @ w2[-1]).argmax())]}, rest says {VOCAB[int((U @ x1[-1]).argmax())]}")
print(f"output {VOCAB[int(p.argmax())]} ({p.max():.3f}); wrote {dst}")
