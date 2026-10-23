# trains task 3's model again with the relu taken out of the MLP (down(up(x)), so the MLP is one 32 x 32 linear map), same
# seed, steps and data as task3.py, and saves it next to task3's checkpoint. export_task3.py reads it for the "without relu" slide
#   PYTHONPATH=~/code/ml/tinygrad uv run --with numpy --with matplotlib python train_task3_norelu.py [~/code/ml/interp]
import os, sys
src = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/code/ml/interp")
sys.path.insert(0, src); os.chdir(src)
from tinygrad import Tensor, nn
import model as M
from analysis import train
from task3 import STEPS, LR, xtrain, xtest, ytrain, ytest

M.Mlp.__call__ = lambda self, x: self.down(self.up(x))      # no relu
Tensor.manual_seed(0)
m = M.Model(seq_len=10, n_layers=2, n_heads=1, mlp=True)
run = train(m, xtrain, ytrain, xtest, ytest, STEPS, LR, "plus MLP, no relu")
nn.state.safe_save(nn.state.get_state_dict(m), "checkpoints/task3_norelu.safetensors")
print(f"no relu: test accuracy {run[1]:.2f}%")
