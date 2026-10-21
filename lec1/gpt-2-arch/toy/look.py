# What did the dictionary model learn? Prints the numbers and draws plots/<run>-*.png.
#
#   python look.py runs/sep-L2H1-s0.pt
import os, sys, random
import numpy as np
import torch
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from dict import Model, vocab, batch, LET, DIG

path = sys.argv[1]
run = os.path.basename(path)[:-3]
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "plots"); os.makedirs(OUT, exist_ok=True)
ck = torch.load(path)
cfg = ck["cfg"]
paired = cfg["paired"]
V = vocab(paired); I = {t: i for i, t in enumerate(V)}
m = Model(len(V), cfg["d"], cfg["layers"], cfg["heads"], cfg["mlp"]); m.load_state_dict(ck["state"]); m.eval()
L, H = cfg["layers"], cfg["heads"]
torch.set_grad_enabled(False)
rng = random.Random(7)

def run_heads(x, kill=None):
  """forward pass, optionally with one head's output zeroed: kill = (layer, head)"""
  B, S = x.shape
  h = m.tok(x) + m.pos(torch.arange(S))
  mask = torch.full((S, S), float("-inf")).triu(1)
  att, vs = [], []
  for l in range(L):
    q, k, v = (t.view(B, S, H, m.dh).transpose(1, 2) for t in m.qkv[l](h).split(h.shape[-1], -1))
    a = (q @ k.transpose(-1, -2) / m.dh ** 0.5 + mask).softmax(-1)
    o = a @ v
    if kill and kill[0] == l: o[:, kill[1]] = 0
    att.append(a); vs.append(v)
    h = h + m.o[l](o.transpose(1, 2).reshape(B, S, -1))
    if m.mlp: h = h + m.mlp[l](h)
  return m.out(h), att

def letter_of(x, j):
  """the letter a key position belongs to: its own letter (paired) or the letter before it (separate)"""
  return V[int(x[j])][0] if paired else V[int(x[j - 1])]

# ── accuracy, per dictionary size ──────────────────────────────────────────
print(f"== {run}")
for n in range(3, 9):
  x, y = batch(2000, paired, rng, n, n)
  logits, _ = run_heads(x)
  pred = logits[:, -1].argmax(-1)
  acc = (pred == y).float().mean().item()
  line = f"  n={n}: acc {acc:.3f}"
  if not paired and L == 1: # the 1-layer separate model can't look up. does it guess the most common digit?
    digs = x[:, 1:-2:2]
    mode = torch.mode(digs, -1).values
    line += f"   (answer is the prompt's most common digit {(y == mode).float().mean():.3f}, predicts it {(pred == mode).float().mean():.3f})"
  print(line)

# ── which head matters: zero one at a time ─────────────────────────────────
x, y = batch(2000, paired, rng, 6, 6)
for l in range(L):
  for hd in range(H):
    acc = (run_heads(x, (l, hd))[0][:, -1].argmax(-1) == y).float().mean().item()
    print(f"  without L{l}H{hd}: acc {acc:.3f}")

# ── where each head looks ──────────────────────────────────────────────────
_, att = run_heads(x)
S = x.shape[1]
qpos = S - 1
key_letter = x[:, -1] # the asked letter, as an id
for l in range(L):
  for hd in range(H):
    a = att[l][:, hd]
    prev = np.mean([a[:, j, j - 1].mean().item() for j in range(1, S - 2, 1 if paired else 2)]) # each value's weight on the token just before it
    # at the question: weight on the matching pair (paired) / the matching letter and its digit (separate)
    hit_letter, hit_digit = [], []
    for b in range(x.shape[0]):
      qc = V[int(key_letter[b])]
      if paired:
        j = next(j for j in range(S - 2) if V[int(x[b, j])][0] == qc)
        hit_digit.append(a[b, qpos, j].item())
      else:
        j = next(j for j in range(0, S - 2, 2) if V[int(x[b, j])] == qc)
        hit_letter.append(a[b, qpos, j].item()); hit_digit.append(a[b, qpos, j + 1].item())
    s = f"  L{l}H{hd}: values -> token before {prev:.2f};  question -> matching {'pair' if paired else 'digit'} {np.mean(hit_digit):.2f}"
    if not paired: s += f", matching letter {np.mean(hit_letter):.2f}, the '|' {a[:, qpos, S - 2].mean():.2f}"
    print(s)

# ── plot: every head on one prompt ─────────────────────────────────────────
x1, _ = batch(1, paired, random.Random(3), 5, 5)
_, att1 = run_heads(x1)
labels = [V[int(t)] for t in x1[0]]
fig, axs = plt.subplots(L, H, figsize=(4.2 * H, 4 * L), squeeze=False)
for l in range(L):
  for hd in range(H):
    ax = axs[l][hd]
    ax.imshow(att1[l][0, hd], cmap="viridis", vmin=0, vmax=1)
    ax.set_xticks(range(len(labels)), labels); ax.set_yticks(range(len(labels)), labels)
    ax.set_title(f"layer {l} head {hd}  (row looks at column)")
fig.tight_layout(); fig.savefig(os.path.join(OUT, f"{run}-heads.png"), dpi=110); plt.close(fig)

# ── plot: many query/key pairs. last layer, every head: asked letter × the key's letter, the raw score ──
x, y = batch(4000, paired, rng, 8, 8)
S = x.shape[1]
B = x.shape[0]
h = m.tok(x) + m.pos(torch.arange(S))
mask = torch.full((S, S), float("-inf")).triu(1)
for l in range(L):
  q, k, v = (t.view(B, S, H, m.dh).transpose(1, 2) for t in m.qkv[l](h).split(h.shape[-1], -1))
  sc = q @ k.transpose(-1, -2) / m.dh ** 0.5
  if l == L - 1: break
  a = (sc + mask).softmax(-1)
  h = h + m.o[l]((a @ v).transpose(1, 2).reshape(B, S, -1))
  if m.mlp: h = h + m.mlp[l](h)
keys = range(0, S - 2) if paired else range(1, S - 2, 2) # the positions that hold a value
fig, axs = plt.subplots(1, H, figsize=(5.5 * H, 5), squeeze=False)
for hd in range(H):
  tot, cnt = np.zeros((26, 26)), np.zeros((26, 26))
  for b in range(B):
    qi = LET.index(V[int(x[b, -1])])
    for j in keys:
      ki = LET.index(letter_of(x[b], j))
      tot[qi, ki] += sc[b, hd, -1, j].item(); cnt[qi, ki] += 1
  M = tot / np.maximum(cnt, 1)
  diag = np.mean(np.diag(M)); off = M[~np.eye(26, dtype=bool) & (cnt > 0)].mean()
  print(f"  last layer H{hd} score, asked letter vs the key's letter: same {diag:.1f}, different {off:.1f}")
  ax = axs[0][hd]
  ax.imshow(M, cmap="RdBu_r", vmin=-np.abs(M).max(), vmax=np.abs(M).max())
  ax.set_xticks(range(26), list(LET)); ax.set_yticks(range(26), list(LET))
  ax.set_xlabel("the key's letter"); ax.set_ylabel("the asked letter"); ax.set_title(f"layer {L - 1} head {hd}: match score")
fig.tight_layout(); fig.savefig(os.path.join(OUT, f"{run}-qk.png"), dpi=110); plt.close(fig)

# ── plot: watching it learn. the loss, and on the fixed prompt: how hard each head does each job ──
hist = ck["hist"]
fixed = ck["fixed"][0]
S = len(fixed)
qc = V[int(fixed[-1])]
match = next(j for j in range(S - 2) if letter_of(fixed, j) == qc and (paired or j % 2 == 1)) # where the answer sits
vals = range(0, S - 2) if paired else range(1, S - 2, 2)
fig, ax = plt.subplots(figsize=(10, 4))
ax.plot(hist["step"], hist["loss"], color="black", label="loss"); ax.set_yscale("log"); ax.set_ylabel("loss")
ax2 = ax.twinx(); ax2.set_ylim(0, 1); ax2.set_ylabel("attention")
for l in range(L):
  for hd in range(H):
    look = [s[l][hd, -1, match].item() for s in hist["snaps"]]
    ax2.plot(hist["step"], look, label=f"L{l}H{hd}: question -> answer")
    if not paired:
      prev = [np.mean([s[l][hd, j, j - 1].item() for j in vals]) for s in hist["snaps"]]
      ax2.plot(hist["step"], prev, "--", label=f"L{l}H{hd}: digit -> its letter")
fig.legend(loc="center right", fontsize=8); ax.set_xlabel("training step")
fig.tight_layout(); fig.savefig(os.path.join(OUT, f"{run}-learn.png"), dpi=110); plt.close(fig)
print("  plots:", ", ".join(f"plots/{run}-{k}.png" for k in ("heads", "qk", "learn")))
