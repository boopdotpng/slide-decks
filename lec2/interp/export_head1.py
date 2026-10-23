# writes slides/public/data/head1.json (for Head1.tsx): one input run through the trained task 1 model (one layer, one
# head, no position embedding), every matrix of the forward pass ("trained"), the weights ("W", E is the whole embedding
# table) and each digit's value read through the unembedding ("copy"). imports ~/code/ml/interp/task1.py, which builds the
# model from seed 0, and runs its training loop. a fresh run: close to, but not bit-for-bit, the one in data/task1/
#   PYTHONPATH=~/code/ml/tinygrad uv run --with numpy --with matplotlib python export_head1.py [~/code/ml/interp] [qwdk7mzpa]
import json, os, sys
import numpy as np

src = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/code/ml/interp")
text = sys.argv[2] if len(sys.argv) > 2 else "qwdk7mzpa"
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides/public/data/head1.json")
sys.path.insert(0, src); os.chdir(src)
import task1
from dataset import VOCAB

def weights():
  a = task1.model.layers[0].attn
  return {k: w.numpy().copy() for k, w in (("E", task1.model.emb.weight), ("U", task1.model.unembed.weight),
                                           ("Wq", a.q_proj.weight), ("Wk", a.k_proj.weight), ("Wv", a.v_proj.weight))}

def run(W, ids):
  x = W["E"][ids]                                            # (9, 32): each position's stream before the head
  q, k, v = x @ W["Wq"].T, x @ W["Wk"].T, x @ W["Wv"].T      # (9, 32) each. nn.Linear stores (out, in), so x @ weight.T
  T = len(ids)
  raw = q @ k.T                                              # (9, 9): row = the position asking, column = the one it looks at
  s = raw / np.sqrt(q.shape[1])
  s[np.triu_indices(T, 1)] = -np.inf                         # causal: only earlier positions (and itself)
  a = np.exp(s - s.max(1, keepdims=True)); a /= a.sum(1, keepdims=True)
  o = a @ v                                                  # (9, 32): every position's write
  out = o[-1]                                                # the head's write at the last position
  le, lh = W["U"] @ x[-1], W["U"] @ out
  lg = le + lh
  p = np.exp(lg - lg.max()); p /= p.sum()
  r = lambda m, d=2: np.round(np.asarray(m, dtype=np.float64), d).tolist()   # float64 first, or json gets 0.23999999463558197
  nul = lambda m: [[None if not np.isfinite(c) else round(float(c), 3) for c in row] for row in m]
  return {"x": r(x, 3), "q": r(q, 3), "k": r(k, 3), "v": r(v, 3), "raw": r(raw), "scores": nul(s), "attn": nul(np.where(np.isfinite(s), a, np.inf)),
          "logits_head": r(lh), "probs": np.round(p.astype(np.float64), 4).tolist(),
          "v_logits": r(v @ W["U"].T)}                       # (9, 36): what each position's v would vote for, if copied

ids = [VOCAB.index(c) for c in text]
for i in range(task1.STEPS): task1.train_step()
W1 = weights()
digits = [VOCAB.index(c) for c in "0123456789"]
copy = W1["E"][digits] @ W1["Wv"].T @ W1["U"].T                # (10, 36): a digit's value, read through the unembedding
out = {"text": text, "tokens": list(VOCAB), "answer": next(c for c in text if c.isdigit()), "trained": run(W1, ids),
       "W": {k: np.round(W1[k].astype(np.float64), 3).tolist() for k in ("E", "Wq", "Wk", "Wv", "U")}, "copy": np.round(copy[:, digits].astype(np.float64), 2).tolist()}
json.dump(out, open(dst, "w"), separators=(",", ":"))
d = out["trained"]
print(f"last-row scores {[round(s, 2) for s in d['scores'][-1]]}")
print(f"attention       {[round(s, 2) for s in d['attn'][-1]]}  -> output {VOCAB[int(np.argmax(d['probs']))]} ({max(d['probs']):.2f})")
print(f"wrote {dst}")
