from tinygrad import Tensor, nn, dtypes, TinyJit, Variable, GlobalCounters
from tinygrad.nn.state import load_state_dict
from safetensors.numpy import load_file
from tokenizers import Tokenizer
import argparse, json, os, time

# GPT-2 small (124M) config
emb_dim = 768
n_layers = 12
n_heads = 12
head_dim = emb_dim // n_heads # 64
mlp_size = 4 * emb_dim # 3072

vocab_size = 50257
max_seq_len = 1024 # learned position embeddings only go this far
norm_eps = 1e-5
eot_id = 50256 # <|endoftext|>

HERE = os.path.dirname(os.path.abspath(__file__))
WEIGHTS = os.path.join(HERE, "weights")

# export.py sets this to a dict to capture intermediate activations by name.
# off (None) during normal generation, and never used inside the decode jit
TAPS: dict | None = None
def tap(name:str, x:Tensor) -> Tensor:
  if TAPS is not None: TAPS[name] = x.numpy()
  return x

class MLP:
  def __init__(self, i:int):
    self.i = i
    self.up_proj = nn.Linear(emb_dim, mlp_size)
    self.down_proj = nn.Linear(mlp_size, emb_dim)
  def __call__(self, x:Tensor) -> Tensor:
    # expand 4x, nonlinearity, project back down. gelu_new == tanh approximation
    up = tap(f"layers.{self.i}.mlp.up", self.up_proj(x)) # (B, S, mlp_size)
    hidden = tap(f"layers.{self.i}.mlp.hidden", up.gelu()) # (B, S, mlp_size)
    return tap(f"layers.{self.i}.mlp.out", self.down_proj(hidden)) # (B, S, emb_dim)

class Attention:
  def __init__(self, i:int):
    # x "words"
    # 1045
    # 1, 768 #embedding
    self.i = i
    # q, k, v projections. the checkpoint stores them fused as one c_attn matmul,
    # convert_from_huggingface splits it into these three
    self.q_proj = nn.Linear(emb_dim, emb_dim) # 768, 768
    # 768, (12, 64)
    self.k_proj = nn.Linear(emb_dim, emb_dim) # 768, 768
    self.v_proj = nn.Linear(emb_dim, emb_dim) # 768, 768
    self.o_proj = nn.Linear(emb_dim, emb_dim) # 768, 768

    # kv cache, BS=1
    # single tensor: (2, B, n_heads, max_seq_len, head_dim), [0]=k [1]=v
    self.kv_cache = None

  def __call__(self, x:Tensor, start_pos:int=0) -> Tensor:
    B, S, _ = x.shape
    q, k, v = self.q_proj(x), self.k_proj(x), self.v_proj(x) # 3x (B, S, emb_dim)
    q = q.reshape(B, S, n_heads, head_dim).transpose(1, 2) # (B, n_heads, S, head_dim)
    k = k.reshape(B, S, n_heads, head_dim).transpose(1, 2) # (B, n_heads, S, head_dim)
    v = v.reshape(B, S, n_heads, head_dim).transpose(1, 2) # (B, n_heads, S, head_dim)
    L = f"layers.{self.i}.self_attn"
    tap(f"{L}.q", q); tap(f"{L}.k_new", k); tap(f"{L}.v_new", v)

    if self.kv_cache is None:
      self.kv_cache = Tensor.zeros(2, 1, n_heads, max_seq_len, head_dim, device=k.device).contiguous().realize()

    # write this step's k and v into the cache at [start_pos, start_pos+S)
    kv = Tensor.stack(k, v) # (2, B, n_heads, S, head_dim)
    kv_cache = Tensor(self.kv_cache.uop.after(self.kv_cache[:, :B, :, start_pos:start_pos+S, :].uop.store(kv.uop)))

    # read back everything so far
    k = kv_cache[0, :B, :, :start_pos+S, :] # (B, n_heads, T, head_dim), T = start_pos + S
    v = kv_cache[1, :B, :, :start_pos+S, :] # (B, n_heads, T, head_dim)
    tap(f"{L}.k", k); tap(f"{L}.v", v)

    # how well does each query match each key?
    scores = q @ k.transpose(-2, -1) # (B, n_heads, S, T)
    scores = tap(f"{L}.scores", scores * (head_dim ** -0.5))

    # causal mask: query i can only see keys <= start_pos + i
    # decode (S == 1) needs no mask, the future isn't in the cache yet
    if S != 1:
      T = start_pos + S
      causal_mask = Tensor.full((1, 1, S, T), float("-inf")).triu(start_pos+1)
      scores = tap(f"{L}.scores_masked", scores + causal_mask)

    attn = tap(f"{L}.probs", scores.softmax(-1)) # (B, n_heads, S, T), each row sums to 1

    out = tap(f"{L}.head_out", attn @ v) # (B, n_heads, S, head_dim): weighted average of values
    out = tap(f"{L}.concat", out.transpose(1, 2).reshape(B, S, emb_dim)) # concat heads back together
    return tap(f"{L}.out", self.o_proj(out)) # (B, S, emb_dim)

class Block:
  def __init__(self, i:int):
    self.i = i
    self.input_layernorm = nn.LayerNorm(emb_dim, eps=norm_eps)
    self.self_attn = Attention(i)
    pass
    self.post_attention_layernorm = nn.LayerNorm(emb_dim, eps=norm_eps)
    self.mlp = MLP(i)

  def __call__(self, x:Tensor, start_pos:int=0) -> Tensor:
    # pre-norm: layernorm -> attention -> residual add, layernorm -> mlp -> residual add
    L = f"layers.{self.i}"
    x = x + self.self_attn(tap(f"{L}.input_layernorm", self.input_layernorm(x)), start_pos)
    tap(f"{L}.resid_mid", x)
    x = x + self.mlp(tap(f"{L}.post_attention_layernorm", self.post_attention_layernorm(x)))
    return tap(f"{L}.resid_out", x)

class Model:
  def __init__(self):
    self.decode_jit = TinyJit(self.forward)
    self.embed_tokens = nn.Embedding(vocab_size, emb_dim) # token embeddings
    self.embed_positions = nn.Embedding(max_seq_len, emb_dim) # learned position embeddings
    self.layers = [Block(i) for i in range(n_layers)]
    self.norm = nn.LayerNorm(emb_dim, eps=norm_eps) # final norm

  def hidden(self, tokens:Tensor, start_pos:int=0) -> Tensor:
    S = tokens.shape[1]
    # token meaning + where it is in the sequence
    tok_emb = tap("tok_emb", self.embed_tokens(tokens)) # (B, S, emb_dim)
    pos_emb = tap("pos_emb", self.embed_positions.weight[start_pos:start_pos+S]) # (S, emb_dim)
    x = tap("embed", tok_emb + pos_emb) # (B, S, emb_dim)
    for layer in self.layers: x = layer(x, start_pos)
    return tap("norm", self.norm(x))

  def logits(self, tokens:Tensor, start_pos:int=0) -> Tensor:
    # weight tying: the output projection is the embedding matrix, transposed
    return tap("logits", self.hidden(tokens, start_pos) @ self.embed_tokens.weight.T) # (B, S, vocab_size)

  def forward(self, tokens:Tensor, start_pos:int) -> Tensor:
    # greedy: only the last position's prediction matters
    return self.logits(tokens, start_pos)[:, -1, :].flatten().argmax()

  def __call__(self, tokens:Tensor, start_pos:int=0) -> Tensor:
    if tokens.shape[1] == 1 and start_pos != 0:
      sp = Variable("start_pos", 1, max_seq_len-1).bind(start_pos)
      return self.decode_jit(tokens.contiguous(), sp)
    return self.forward(tokens, start_pos)

  def reset(self):
    for layer in self.layers: layer.self_attn.kv_cache = None
    self.decode_jit.reset()

# GPT-2 checkpoint names -> ours (the llama names). c_proj is the output projection of
# both attention and the mlp, so it depends on its parent
RENAMES = {"wte": "embed_tokens", "wpe": "embed_positions", "h": "layers", "ln_1": "input_layernorm", "attn": "self_attn",
           "ln_2": "post_attention_layernorm", "c_fc": "up_proj", "ln_f": "norm"}
def rename(k:str) -> str:
  parts = k.split(".")
  return ".".join({"attn": "o_proj", "mlp": "down_proj"}[parts[i-1]] if p == "c_proj" else RENAMES.get(p, p) for i, p in enumerate(parts))

def convert_from_huggingface(weights:dict[str, Tensor]) -> dict[str, Tensor]:
  converted = {}
  for k, v in weights.items():
    if k.endswith(".attn.bias"): continue # precomputed causal mask buffer, we build our own
    # HF GPT-2 uses Conv1D, which stores weights as (in, out). nn.Linear wants (out, in)
    if k.endswith(".weight") and any(n in k for n in ("c_attn", "c_proj", "c_fc")): v = v.T
    if ".c_attn." in k:
      # fused (3 * emb_dim, ...) -> separate q, k, v projections
      for name, part in zip(("q_proj", "k_proj", "v_proj"), v.split(emb_dim, dim=0)):
        converted[rename(k.replace("c_attn", name))] = part.contiguous()
      continue
    converted[rename(k)] = v
  return converted

def load_model() -> tuple[Model, Tokenizer]:
  tokenizer = Tokenizer.from_file(os.path.join(WEIGHTS, "tokenizer.json"))
  model = Model()
  # load through numpy, not tinygrad's safe_load: this file's header is 14283 bytes, so the
  # float32 data starts at an offset that isn't 4-byte aligned and tinygrad's bitcast refuses it
  weights = {k: Tensor(v) for k, v in load_file(os.path.join(WEIGHTS, "model.safetensors")).items()}
  load_state_dict(model, convert_from_huggingface(weights), strict=False)
  return model, tokenizer

def generate(model:Model, tokenizer:Tokenizer, prompt:str, max_new_tokens:int):
  prompt_ids = tokenizer.encode(prompt).ids
  if len(prompt_ids) + max_new_tokens > max_seq_len:
    raise ValueError(f"prompt + generation length exceeds max_seq_len={max_seq_len}")

  print(f"prompt: {prompt!r} -> {len(prompt_ids)} tokens")
  print(prompt, end="", flush=True)

  # prefill: the whole prompt in one forward pass, fills the kv cache
  GlobalCounters.reset()
  st = time.perf_counter()
  next_id = model(Tensor([prompt_ids]), start_pos=0).item()
  pt = time.perf_counter()

  # decode: one token at a time, each attends over the cache
  generated_ids = []
  gt = time.perf_counter()
  for i in range(max_new_tokens):
    generated_ids.append(next_id)
    print(tokenizer.decode([next_id]), end="", flush=True)
    if next_id == eot_id: break
    next_id = model(Tensor([[next_id]]), start_pos=len(prompt_ids) + i).item()
  et = time.perf_counter()

  print()
  print(f"prefill: {len(prompt_ids)} tok in {(pt-st)*1e3:.0f} ms")
  print(f"decode:  {len(generated_ids)} tok in {(et-gt)*1e3:.0f} ms, {len(generated_ids)/(et-gt):.1f} tok/s")
  return generated_ids

def main():
  parser = argparse.ArgumentParser()
  parser.add_argument("--prompt", default="The capital of France is")
  parser.add_argument("--max-new-tokens", type=int, default=30)
  args = parser.parse_args()

  model, tokenizer = load_model()
  generate(model, tokenizer, args.prompt, args.max_new_tokens)

if __name__ == "__main__":
  main()
