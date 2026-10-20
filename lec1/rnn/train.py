# a character-level rnn on tiny shakespeare, in tinygrad. read top to bottom.
#
#   ./download.sh                      # data/input.txt, ~1 MB of plays
#   python train.py                    # ~2 min on an m-series mac (loss 4.2 -> 1.4), saves rnn.safetensors
#   python sample.py "ROMEO:"          # generate from a prompt
import os, time
from tinygrad import Tensor, TinyJit, Context
from tinygrad.nn.optim import Adam
from tinygrad.nn.state import get_parameters, get_state_dict, safe_save

HERE = os.path.dirname(os.path.abspath(__file__))

# 1. the data: every character is a number
text = open(f"{HERE}/data/input.txt").read()
chars = sorted(set(text))                     # 65 distinct characters: letters, punctuation, space, newline
V = len(chars)
stoi = {c: i for i, c in enumerate(chars)}
encode = lambda s: [stoi[c] for c in s]
decode = lambda ids: "".join(chars[i] for i in ids)

# 2. the model: one hidden state h, updated once per character
H = 512                                       # size of h: everything the rnn remembers lives in these 512 numbers

class RNN:
  def __init__(self):
    self.Wxh = Tensor.randn(V, H) * 0.1       # character -> hidden
    self.Whh = Tensor.randn(H, H) * H**-0.5   # old hidden -> new hidden (the memory)
    self.bh = Tensor.zeros(H)
    self.Why = Tensor.randn(H, V) * H**-0.5   # hidden -> a score for every possible next character
    self.by = Tensor.zeros(V)

  def step(self, x, h):
    # x is a character id. one_hot(x) @ Wxh just picks row x of Wxh, so we index instead
    h = (self.Wxh[x] + h @ self.Whh + self.bh).tanh()
    return h, h @ self.Why + self.by          # new memory, and scores ("logits") for the next character

  def __call__(self, xs, h):
    # xs: (B, T) ids. the loop is the whole point: character t can't start until t-1 is done
    out = []
    for t in range(xs.shape[1]):
      h, logits = self.step(xs[:, t], h)
      out.append(logits)
    return Tensor.stack(*out, dim=1), h       # (B, T, V)

# 3. training: show it 64-character snippets, ask it to predict each next character
B, T, STEPS, LR = 64, 64, 4000, 2e-3

if __name__ == "__main__":
  data = Tensor(encode(text))
  model = RNN()
  params = get_parameters(model)
  opt = Adam(params, lr=LR)

  @TinyJit
  @Context(TRAINING=1)                        # the optimizer refuses to step outside training mode
  def train_step(x, y):
    logits, _ = model(x, Tensor.zeros(B, H))
    loss = logits.sparse_categorical_crossentropy(y)    # how surprised was it by the real next character?
    opt.zero_grad()
    loss.backward()
    # clip the gradient: through 64 tanh steps it can blow up
    norm = Tensor.stack(*[p.grad.square().sum() for p in params]).sum().sqrt()
    for p in params: p.grad = p.grad * (1.0 / norm.maximum(1.0))
    opt.step()
    return loss.realize()

  t0 = time.time()
  for i in range(STEPS):
    idx = Tensor.randint(B, high=len(text) - T - 1).unsqueeze(1) + Tensor.arange(T + 1)
    chunk = data[idx]                         # (B, T+1): input is chars 0..T-1, target is chars 1..T
    loss = train_step(chunk[:, :-1].contiguous(), chunk[:, 1:].contiguous())
    if i % 100 == 0 or i == STEPS - 1:
      print(f"step {i:4d}  loss {loss.item():.3f}  {time.time() - t0:5.0f}s")
  safe_save(get_state_dict(model), f"{HERE}/rnn.safetensors")
  print("saved rnn.safetensors")
