# a character-level rnn on tiny shakespeare, in pytorch. read top to bottom.
#
#   ./download.sh                      # data/input.txt, ~1 MB of plays
#   python train.py                    # a few minutes (loss 4.2 -> 1.4), saves rnn.safetensors
#   python sample.py "ROMEO:"          # generate from a prompt
import os, time
import torch
import torch.nn.functional as F
from safetensors.torch import save_file

HERE = os.path.dirname(os.path.abspath(__file__))
DEVICE = os.environ.get("DEVICE", "cuda" if torch.cuda.is_available() else "cpu")   # DEVICE=cpu to skip the gpu

# 1. the data: every character is a number
text = open(f"{HERE}/data/input.txt").read()
chars = sorted(set(text))                     # 65 distinct characters: letters, punctuation, space, newline
V = len(chars)
stoi = {c: i for i, c in enumerate(chars)}
encode = lambda s: [stoi[c] for c in s]
decode = lambda ids: "".join(chars[i] for i in ids)

# 2. the model: one hidden state h, updated once per character
H = 512                                       # size of h: everything the rnn remembers lives in these 512 numbers

class RNN(torch.nn.Module):
  def __init__(self):
    super().__init__()
    P = torch.nn.Parameter
    self.Wxh = P(torch.randn(V, H) * 0.1)     # character -> hidden
    self.Whh = P(torch.randn(H, H) * H**-0.5) # old hidden -> new hidden (the memory)
    self.bh = P(torch.zeros(H))
    self.Why = P(torch.randn(H, V) * H**-0.5) # hidden -> a score for every possible next character
    self.by = P(torch.zeros(V))

  def step(self, x, h):
    # x is a character id. one_hot(x) @ Wxh just picks row x of Wxh, so we index instead
    h = torch.tanh(self.Wxh[x] + h @ self.Whh + self.bh)
    return h, h @ self.Why + self.by          # new memory, and scores ("logits") for the next character

  def forward(self, xs, h):
    # xs: (B, T) ids. the loop is the whole point: character t can't start until t-1 is done
    out = []
    for t in range(xs.shape[1]):
      h, logits = self.step(xs[:, t], h)
      out.append(logits)
    return torch.stack(out, dim=1), h         # (B, T, V)

# 3. training: show it 64-character snippets, ask it to predict each next character
B, T, STEPS, LR = 64, 64, 4000, 2e-3

if __name__ == "__main__":
  torch.manual_seed(0)
  data = torch.tensor(encode(text), device=DEVICE)
  model = RNN().to(DEVICE)
  opt = torch.optim.Adam(model.parameters(), lr=LR)

  t0 = time.time()
  for i in range(STEPS):
    idx = torch.randint(len(text) - T - 1, (B, 1), device=DEVICE) + torch.arange(T + 1, device=DEVICE)
    chunk = data[idx]                         # (B, T+1): input is chars 0..T-1, target is chars 1..T
    logits, _ = model(chunk[:, :-1], torch.zeros(B, H, device=DEVICE))
    loss = F.cross_entropy(logits.reshape(-1, V), chunk[:, 1:].reshape(-1))   # how surprised was it by the real next character?
    opt.zero_grad()
    loss.backward()
    torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)   # through 64 tanh steps the gradient can blow up
    opt.step()
    if i % 100 == 0 or i == STEPS - 1:
      print(f"step {i:4d}  loss {loss.item():.3f}  {time.time() - t0:5.0f}s", flush=True)
  save_file({k: v.detach().cpu().contiguous() for k, v in model.state_dict().items()}, f"{HERE}/rnn.safetensors")
  print("saved rnn.safetensors")
