# writes slides/public/data/train0.json: the task 0 network (embed -> unembed, no layers) trained one example at a time
# with plain sgd, so the "how did it learn to only say digits?" slide can show each nudge. numpy re-implementation of
# ~/code/ml/interp/model.py with n_layers=0, pos=False (same shapes and tinygrad's default inits); the examples are the
# first ones of hidden_digit_dataset() (same generator, seed 0).
# score of each token = unembed . embed[last letter], averaged over the 26 letters. kept after examples 0-3 (one at a
# time on the slide) and every EVERY-th example after that (the fast-forward), with how often each token was the answer.
#   uv run --with numpy export_train0.py
import json, os, string
import numpy as np

VOCAB, L, D = string.ascii_lowercase + string.digits, 26, 32
EVERY = 50
LR, DECAY, N = 0.5, 300, 3000   # lr = LR / (1 + i / DECAY): big nudges early, small ones later so the digits settle
KEEP = [0, 1, 2, 3, *range(EVERY, N + 1, EVERY)]   # the first three examples, then every EVERY-th

# hidden_digit_dataset(seed=0): only the last token (always a letter) and the answer reach this network
rng = np.random.default_rng(0)
n, seq_len = 11000, 9
X = rng.integers(0, L, (n, seq_len)).astype(np.int32)
pos = rng.integers(0, seq_len - 1, n)
y = (rng.integers(0, 10, n) + L).astype(np.int32)
X[np.arange(n), pos] = y

init = np.random.default_rng(1)
E = init.uniform(-1, 1, (36, D)) * np.sqrt(6 / (36 + D))   # nn.Embedding: glorot uniform
U = init.uniform(-1, 1, (36, D)) / np.sqrt(D)              # nn.Linear(32, 36, bias=False): uniform +-1/sqrt(in)

def scores(): return (E[:L] @ U.T).mean(0)                 # (36,): each token's score, averaged over last letters
frames, pushes = [scores()], []
for i in range(N):
  q, t = X[i, -1], y[i]
  s = U @ E[q]
  p = np.exp(s - s.max()); p /= p.sum()
  g = p.copy(); g[t] -= 1                                   # d loss / d scores = p - onehot
  if i < 3: pushes.append(-g)                               # the push on each score: answer up by 1 - p, the rest down by p
  gU, gE = np.outer(g, E[q]), U.T @ g
  lr = LR / (1 + i / DECAY)
  U -= lr * gU; E[q] -= lr * gE
  frames.append(scores())

F = np.array(frames)
probs = np.exp(F - F.max(1, keepdims=True)); probs /= probs.sum(1, keepdims=True)
dec = lambda row: ''.join(VOCAB[t] for t in row)
out = {"tokens": list(VOCAB), "n": N,
       "examples": [{"input": dec(X[i]), "answer": VOCAB[y[i]], "push": np.round(pushes[i], 3).tolist()} for i in range(3)],
       "frames": [{"n": k, "answer": VOCAB[y[k - 1]] if k else "", "scores": np.round(F[k], 3).tolist(),
                   "probs": np.round(probs[k], 4).tolist(), "count": np.bincount(y[:k], minlength=36).tolist()} for k in KEEP]}
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides/public/data/train0.json")
json.dump(out, open(dst, "w"), separators=(",", ":"))
print(f"wrote {dst}: {len(KEEP)} frames over {N} examples. first three: {[(e['input'], e['answer']) for e in out['examples']]}")
for k in [0, 1, 2, 3, 10, 100, 1000, N]:
  print(f"after {k:5d}: letters {F[k, :L].mean():6.2f}  digits {F[k, L:].mean():6.2f} (min {F[k, L:].min():.2f} max {F[k, L:].max():.2f})  p(digits) {probs[k, L:].sum():.3f}")
