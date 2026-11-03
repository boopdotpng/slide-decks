/** The lab's whole script, exactly as students run it (labs/mnist-lab/mnist.py). Slides 4-10 show parts of it,
 *  slide 15 all of it with a copy button. Keep the two in sync: export.py trains this same loop. */
export const SCRIPT = `from tinygrad import Context, Tensor, nn
from tinygrad.engine.jit import TinyJit
from tinygrad.helpers import trange

# dataset
from tinygrad.nn.datasets import mnist
xtrain, ytrain, xtest, ytest = mnist()
xtrain = (xtrain.float() / 255)
mean = xtrain.mean()
xtrain -= mean
xtest = xtest.float() / 255 - mean

l1 = Tensor.kaiming_normal(128, 28*28)
l2 = Tensor.kaiming_normal(10, 128) # transpose later
def model(x): return x.flatten(1).dot(l1.T).relu().dot(l2.T)

def cross_entropy_loss(logits: Tensor, y: Tensor):
  z = logits - logits.max(-1, keepdim=True) # overflow protection
  logp = z - z.exp().sum(-1, keepdim=True).log()
  return -logp.gather(-1, y.unsqueeze(-1)).mean()

# training loop
opt = nn.optim.SGD([l1, l2], lr=0.05, momentum=0.9)
BS = 256
STEPS = 5000

@TinyJit
@Context(TRAINING=True)
def train():
  opt.zero_grad()
  batch = Tensor.randint(BS, high=xtrain.shape[0])
  loss = cross_entropy_loss(model(xtrain[batch]), ytrain[batch]).backward()
  return loss.realize(*opt.schedule_step())

for i in (t:=trange(STEPS)):
  loss = train()
  t.set_description(f"loss at step {i}: {loss.item():.2f}")

# held-out check: 10,000 images the model never trained on
acc = (model(xtest).argmax(-1) == ytest).float().mean().item()
print(f"test accuracy: {acc*100:.2f}%")`;
export const LINES = SCRIPT.split('\n');
/** the lines from `from` to the first line that starts with `to` (or the end), for showing a part */
export function part(from: string, to?: string) {
  const a = LINES.findIndex((l) => l.startsWith(from));
  const b = to ? LINES.findIndex((l, i) => i > a && l.startsWith(to)) : LINES.length;
  return LINES.slice(a, b < 0 ? LINES.length : b).join('\n').replace(/\n+$/, '');
}
