# A tiny transformer that looks things up in a dictionary:
#
#   c 4 t 8 p 9 | t   ->  8
#
# separate (default): letters and digits are their own tokens, so a digit has to learn which letter it belongs to
#   before the question can find it (two rounds).
# --paired: each letter-digit pair is one token ("t8"), so one search is enough.
#
#   python dict.py                          # 2 layers, 1 head each, separate tokens
#   python dict.py --paired --layers 1      # one layer, pair tokens
#   python dict.py --heads 2 --mlp          # anything else
#
# writes runs/<name>.pt: the weights, the config, the loss curve, and the attention on one fixed prompt every
# --snap steps (to watch the heads form).
import argparse, os, random
import torch
import torch.nn as nn
import torch.nn.functional as F

LET, DIG = "abcdefghijklmnopqrstuvwxyz", "0123456789"

def vocab(paired):
  pairs = [l + d for l in LET for d in DIG] if paired else []
  return pairs + list(LET) + list(DIG) + ["|"]

def make(n, paired, rng):
  """one prompt with n pairs: (tokens as strings, answer digit)"""
  keys = rng.sample(LET, n)
  vals = [rng.choice(DIG) for _ in keys]
  q = rng.randrange(n)
  body = [k + v for k, v in zip(keys, vals)] if paired else [t for kv in zip(keys, vals) for t in kv]
  return body + ["|", keys[q]], vals[q]

def batch(B, paired, rng, lo=3, hi=8):
  n = rng.randint(lo, hi) # one length per batch, so no padding
  V = {t: i for i, t in enumerate(vocab(paired))}
  xs, ys = zip(*(make(n, paired, rng) for _ in range(B)))
  return torch.tensor([[V[t] for t in x] for x in xs]), torch.tensor([V[y] for y in ys])

class Model(nn.Module):
  def __init__(s, V, d=64, layers=2, heads=1, mlp=False, ctx=32):
    super().__init__()
    s.heads, s.dh = heads, d // heads
    s.tok, s.pos = nn.Embedding(V, d), nn.Embedding(ctx, d)
    s.qkv = nn.ModuleList(nn.Linear(d, 3 * d) for _ in range(layers))
    s.o = nn.ModuleList(nn.Linear(d, d) for _ in range(layers))
    s.mlp = nn.ModuleList(nn.Sequential(nn.Linear(d, 4 * d), nn.GELU(), nn.Linear(4 * d, d)) for _ in range(layers)) if mlp else None
    s.out = nn.Linear(d, V)

  def forward(s, ids):
    """logits for the next token after every position, and every head's attention: [layer](B, heads, S, S)"""
    B, S = ids.shape
    x = s.tok(ids) + s.pos(torch.arange(S))
    mask = torch.full((S, S), float("-inf")).triu(1) # no looking ahead
    att = []
    for l in range(len(s.qkv)):
      q, k, v = (t.view(B, S, s.heads, s.dh).transpose(1, 2) for t in s.qkv[l](x).split(x.shape[-1], -1)) # (B, heads, S, dh)
      a = (q @ k.transpose(-1, -2) / s.dh ** 0.5 + mask).softmax(-1)
      att.append(a)
      x = x + s.o[l]((a @ v).transpose(1, 2).reshape(B, S, -1))
      if s.mlp: x = x + s.mlp[l](x)
    return s.out(x), att

def main():
  ap = argparse.ArgumentParser()
  ap.add_argument("--paired", action="store_true")
  ap.add_argument("--layers", type=int, default=2)
  ap.add_argument("--heads", type=int, default=1)
  ap.add_argument("--d", type=int, default=64)
  ap.add_argument("--mlp", action="store_true")
  ap.add_argument("--steps", type=int, default=4000)
  ap.add_argument("--lr", type=float, default=1e-3)
  ap.add_argument("--snap", type=int, default=50)
  ap.add_argument("--seed", type=int, default=0)
  ap.add_argument("--name")
  a = ap.parse_args()
  name = a.name or f"{'paired' if a.paired else 'sep'}-L{a.layers}H{a.heads}{'-mlp' if a.mlp else ''}-s{a.seed}"
  torch.manual_seed(a.seed); rng = random.Random(a.seed)
  V = vocab(a.paired)
  m = Model(len(V), a.d, a.layers, a.heads, a.mlp)
  opt = torch.optim.AdamW(m.parameters(), lr=a.lr, weight_decay=0.01)
  fixed, _ = batch(1, a.paired, random.Random(1234), 5, 5) # the prompt we watch while it trains
  hist = {"step": [], "loss": [], "acc": [], "snaps": []}
  for step in range(a.steps + 1):
    x, y = batch(256, a.paired, rng)
    logits, _ = m(x)
    loss = F.cross_entropy(logits[:, -1], y) # only the answer counts
    if step % a.snap == 0:
      with torch.no_grad():
        acc = (logits[:, -1].argmax(-1) == y).float().mean().item()
        hist["step"].append(step); hist["loss"].append(loss.item()); hist["acc"].append(acc)
        hist["snaps"].append([t[0].clone() for t in m(fixed)[1]])
      if step % (a.snap * 10) == 0: print(f"{name} step {step:5d} loss {loss.item():.3f} acc {acc:.2f}", flush=True)
    opt.zero_grad(); loss.backward(); opt.step()
  os.makedirs(os.path.join(os.path.dirname(os.path.abspath(__file__)), "runs"), exist_ok=True)
  torch.save({"cfg": vars(a), "state": m.state_dict(), "hist": hist, "fixed": fixed},
             os.path.join(os.path.dirname(os.path.abspath(__file__)), "runs", name + ".pt"))

if __name__ == "__main__":
  main()
