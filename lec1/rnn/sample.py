# generate text with the trained rnn: feed the prompt one character at a time, then keep going
#
#   python sample.py "ROMEO:"
#   python sample.py "ROMEO:" -n 400 --temp 0.8
import argparse
import torch
from safetensors.torch import load_file
from train import RNN, H, HERE, encode, decode

p = argparse.ArgumentParser()
p.add_argument("prompt", nargs="?", default="ROMEO:\n")
p.add_argument("-n", type=int, default=300)
p.add_argument("--temp", type=float, default=0.8)   # < 1: safer picks. > 1: wilder
p.add_argument("--seed", type=int, default=0)
args = p.parse_args()

torch.manual_seed(args.seed)
model = RNN()
model.load_state_dict(load_file(f"{HERE}/rnn.safetensors"))

with torch.no_grad():
  # read the prompt: the only thing carried forward is h
  h = torch.zeros(1, H)
  for c in encode(args.prompt):
    h, logits = model.step(torch.tensor([c]), h)

  # write: sample a character, feed it back in, repeat
  print(args.prompt, end="", flush=True)
  for _ in range(args.n):
    c = torch.multinomial((logits / args.temp).softmax(-1), 1).item()
    print(decode([c]), end="", flush=True)
    h, logits = model.step(torch.tensor([c]), h)
print()
