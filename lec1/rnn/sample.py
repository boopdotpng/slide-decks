# generate text with the trained rnn: feed the prompt one character at a time, then keep going
#
#   python sample.py "ROMEO:"
#   python sample.py "ROMEO:" -n 400 --temp 0.8
import argparse
from tinygrad import Tensor
from tinygrad.nn.state import load_state_dict, safe_load
from train import RNN, H, HERE, encode, decode

p = argparse.ArgumentParser()
p.add_argument("prompt", nargs="?", default="ROMEO:\n")
p.add_argument("-n", type=int, default=300)
p.add_argument("--temp", type=float, default=0.8)   # < 1: safer picks. > 1: wilder
p.add_argument("--seed", type=int, default=0)
args = p.parse_args()

Tensor.manual_seed(args.seed)
model = RNN()
load_state_dict(model, safe_load(f"{HERE}/rnn.safetensors"), verbose=False)

# read the prompt: the only thing carried forward is h
h = Tensor.zeros(1, H)
for c in encode(args.prompt):
  h, logits = model.step(Tensor([c]), h)

# write: sample a character, feed it back in, repeat
print(args.prompt, end="", flush=True)
for _ in range(args.n):
  c = (logits / args.temp).softmax(-1).multinomial().item()
  print(decode([c]), end="", flush=True)
  h, logits = model.step(Tensor([c]), h)
  h = h.realize()
print()
