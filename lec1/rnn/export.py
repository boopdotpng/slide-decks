# real numbers for the rnn slides -> ../gpt-2-arch/slides/public/data/rnn_*.json
# runs the trained rnn in numpy (same math as RNN.step in train.py), so it's quick
import json, os
import numpy as np
from safetensors.numpy import load_file
from train import HERE, chars, encode, text

w = load_file(f"{HERE}/rnn.safetensors")
Wxh, Whh, bh, Why, by = (w[k] for k in ("Wxh", "Whh", "bh", "Why", "by"))
OUT = f"{HERE}/../gpt-2-arch/slides/public/data"

def run(ids, h=None):
  """ids: (B, T). returns hs (B, T, H) and probs (B, T, V)"""
  ids = np.asarray(ids)
  h = np.zeros((ids.shape[0], Whh.shape[0]), np.float32) if h is None else h
  hs = []
  for t in range(ids.shape[1]):
    h = np.tanh(Wxh[ids[:, t]] + h @ Whh + bh)
    hs.append(h)
  hs = np.stack(hs, 1)
  logits = hs @ Why + by
  p = np.exp(logits - logits.max(-1, keepdims=True))
  return hs, p / p.sum(-1, keepdims=True)

def top(p, k=5): return [[chars[i], round(float(p[i]), 3)] for i in np.argsort(-p)[:k]]

def save(name, obj):
  with open(f"{OUT}/{name}.json", "w") as f: json.dump(obj, f, separators=(",", ":"))
  print(f"{name}.json", os.path.getsize(f"{OUT}/{name}.json"), "bytes")

# 1. the task: a few contexts and what the trained model thinks comes next
CONTEXTS = ["First Citiz", "ROMEO", "I pray thee, tell me th", "What is your "]
save("rnn_task", [{"ctx": c, "top": top(run([encode(c)])[1][0, -1])} for c in CONTEXTS])

# 2. one character at a time: h after every character, and the guess for the next one
PHRASE = "To be, or not to be"
hs, p = run([encode(PHRASE)])
save("rnn_unroll", {"chars": list(PHRASE),
  "h": [[round(float(v), 3) for v in hs[0, t]] for t in range(len(PHRASE))],
  "top": [top(p[0, t], 3) for t in range(len(PHRASE))]})

# 3. memory fades: change one character k steps back. how much does the guess at the end move?
# total variation distance between the two next-char distributions: 0 = identical, 1 = completely different
rng = np.random.default_rng(0)
N, K = 500, 100
starts = rng.integers(0, len(text) - K - 2, N)
data = np.array(encode(text))
win = np.stack([data[s:s + K] for s in starts])                  # (N, K)
_, base = run(win)
base = base[:, -1]
moved = []
for k in range(1, K):
  x = win.copy()
  x[:, K - k] = (x[:, K - k] + rng.integers(1, len(chars), N)) % len(chars)   # a different random character
  _, p = run(x)
  moved.append(round(float(0.5 * np.abs(p[:, -1] - base).sum(-1).mean()), 4))
save("rnn_fade", {"k": list(range(1, K)), "moved": moved, "n": N})
print("moved at k=1,5,10,20,40,80:", [moved[k - 1] for k in (1, 5, 10, 20, 40, 80)])

# 4. the same thing for one real line: the 60 characters before the 's' of "breaks"
# each position is swapped for 30 different random characters, averaged
i = text.index("yonder window break") + len("yonder window break")
ctx = data[i - 60:i]
R = 30
ex = []
_, b = run(ctx[None])
for k in range(1, 61):
  x = np.repeat(ctx[None], R, 0)
  x[:, 60 - k] = (x[:, 60 - k] + rng.integers(1, len(chars), R)) % len(chars)
  _, p = run(x)
  ex.append(round(float(0.5 * np.abs(p[:, -1] - b[0, -1]).sum(-1).mean()), 4))
save("rnn_fade_line", {"ctx": text[i - 60:i], "next": text[i], "p_next": round(float(b[0, -1, data[i]]), 3), "moved": ex})
print("line:", repr(text[i - 60:i]), "p(next)=", b[0, -1, data[i]], ex[:12], ex[20], ex[40])
