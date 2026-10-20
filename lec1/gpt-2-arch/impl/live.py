# gpt-2 small, written in the order you'd teach it. no kv cache, no jit: the whole
# sequence goes through the model every step (the gen-loop slide). ~90 lines, real weights.
#
#   python live.py                       # greedy completion
#   python live.py --prompt "..." -n 20
#   python live.py --no-mask             # predict first: what breaks?
#   python live.py --check               # one head at a time == 12 heads in one matmul
from tinygrad import Tensor
from safetensors.numpy import load_file
from tokenizers import Tokenizer
import argparse, os

HERE = os.path.dirname(os.path.abspath(__file__))

# the knobs (sticky note)
D = 768            # width of the residual stream
H = 12             # heads
HD = D // H        # 64 numbers per head
L = 12             # blocks
V = 50257          # vocab
CTX = 1024         # learned positions only go this far

# huggingface stores every linear weight as (in, out), so it's always x @ W + b. no transposes.
w = {k: Tensor(v) for k, v in load_file(f"{HERE}/weights/model.safetensors").items()}
tok = Tokenizer.from_file(f"{HERE}/weights/tokenizer.json")
MASK = True

def layernorm(x, g, b):                       # per token: zero mean, unit variance, then a learned scale and shift
  x = (x - x.mean(-1, keepdim=True)) / (x.var(-1, keepdim=True) + 1e-5).sqrt()
  return x * g + b

def one_head(q, k, v):                        # q, k, v: (S, 64). the whole idea of attention, for one head
  scores = q @ k.transpose(-2, -1) / HD**0.5   # (S, S): how well does every query match every key?
  S = q.shape[-2]
  if MASK: scores = scores + Tensor.full((S, S), float("-inf")).triu(1)   # no peeking at the future: -inf above the diagonal
  return scores.softmax(-1) @ v               # weights that sum to 1, times the values: (S, 64)

def attention(x, i, batched=True):            # x: (S, 768) -> (S, 768)
  S = x.shape[0]
  qkv = x @ w[f"h.{i}.attn.c_attn.weight"] + w[f"h.{i}.attn.c_attn.bias"]   # (S, 2304): all 12 heads' q, k, v at once
  q, k, v = qkv.split(D, dim=-1)              # 3 x (S, 768); head h owns columns h*64 .. h*64+63
  if not batched:                             # version 1: a python loop over heads
    out = Tensor.cat(*[one_head(q[:, h*HD:(h+1)*HD], k[:, h*HD:(h+1)*HD], v[:, h*HD:(h+1)*HD]) for h in range(H)], dim=-1)
  else:                                       # version 2: the same thing, with "head" as a tensor dimension
    q, k, v = [t.reshape(S, H, HD).transpose(0, 1) for t in (q, k, v)]   # (12, S, 64). no math, just a cut
    out = one_head(q, k, v)                   # (12, S, 64). the same function: @ only touches the last two dims, the 12 rides along
    out = out.transpose(0, 1).reshape(S, D)   # (S, 12, 64) -> (S, 768): concat the heads back
  return out @ w[f"h.{i}.attn.c_proj.weight"] + w[f"h.{i}.attn.c_proj.bias"]

def mlp(x, i):                                # per token, no mixing between tokens: 768 -> 3072 -> gelu -> 768
  h = (x @ w[f"h.{i}.mlp.c_fc.weight"] + w[f"h.{i}.mlp.c_fc.bias"]).gelu()
  return h @ w[f"h.{i}.mlp.c_proj.weight"] + w[f"h.{i}.mlp.c_proj.bias"]

def block(x, i):                              # the residual stream: every sublayer reads a normalized copy and *adds* back
  x = x + attention(layernorm(x, w[f"h.{i}.ln_1.weight"], w[f"h.{i}.ln_1.bias"]), i)
  x = x + mlp(layernorm(x, w[f"h.{i}.ln_2.weight"], w[f"h.{i}.ln_2.bias"]), i)
  return x

def gpt2(ids):                                # list of token ids -> (S, 50257) scores over the vocab, one row per position
  S = len(ids)
  x = w["wte.weight"][Tensor(ids)] + w["wpe.weight"][:S]   # what the token is + where it is: (S, 768)
  for i in range(L): x = block(x, i)
  x = layernorm(x, w["ln_f.weight"], w["ln_f.bias"])
  return x @ w["wte.weight"].T                # weight tying: unembed with the embedding matrix

def generate(prompt, n):
  ids = tok.encode(prompt).ids
  print(prompt, end="", flush=True)
  for _ in range(n):
    next_id = gpt2(ids)[-1].argmax().item()   # greedy: only the last row's prediction matters
    ids.append(next_id)
    print(tok.decode([next_id]), end="", flush=True)
  print()

def check():
  ids = tok.encode("When Mary and John went to the store, John gave a drink to").ids
  x = w["wte.weight"][Tensor(ids)] + w["wpe.weight"][:len(ids)]
  a, b = attention(x, 0, batched=False).numpy(), attention(x, 0, batched=True).numpy()
  print("one head at a time vs 12 heads in one call: max |diff| =", abs(a - b).max())

if __name__ == "__main__":
  p = argparse.ArgumentParser()
  p.add_argument("--prompt", default="When Mary and John went to the store, John gave a drink to")
  p.add_argument("-n", type=int, default=12)
  p.add_argument("--no-mask", action="store_true")
  p.add_argument("--check", action="store_true")
  a = p.parse_args()
  MASK = not a.no_mask
  check() if a.check else generate(a.prompt, a.n)
