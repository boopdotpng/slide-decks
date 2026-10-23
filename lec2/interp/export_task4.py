# writes slides/public/data/task4.json (for Task4.tsx): task 4, two-key difference (a2f5c9d3fc → (5 − 9) mod 10 = 6), from the
# csvs ~/code/ml/interp's task4.py and task3.py already wrote, plus one input run through the trained models:
#   "accuracy"  test accuracy per model shape (data/task4/accuracy.csv); "sum": task 3's same shape on the sum (data/task3/accuracy.csv)
#   "split"     layer 2's attention from the last position on the value at q1 (the first value), at q2 (the second), elsewhere,
#               per head: task 3's one head (the sum), task 4 with one head per layer (seed 0, stalls), the lucky seed (a
#               lopsided blend), and task 4 with two heads per layer
#   "example"   a2f5c9d3fc: layer 2's attention from the last position (10 numbers per head), for the one-head model
#               (checkpoints/task4_one_head.safetensors) and the two-head model (task4.safetensors), and each one's answer;
#               "l1": the two-head model's layer 1 attention, both heads, all 10 rows
#   "ablation"  knockouts of the two-head model (data/task4/ablation.csv)
#   "probe_first"  linear-probe accuracy for the first value after layer 2 (data/task{3,4}/probes.csv)
import csv, json, os, sys

src = os.path.expanduser(sys.argv[1] if len(sys.argv) > 1 else "~/code/ml/interp")
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), "slides/public/data/task4.json")
rows = lambda f: list(csv.DictReader(open(os.path.join(src, "data", f))))
split = lambda f: [{"head": r["head"], "first": round(float(r["on_value_at_q1"]), 3), "second": round(float(r["on_value_at_q2"]), 3)} for r in rows(f)]
out = {"accuracy": [(r["model"], float(r["test_accuracy"])) for r in rows("task4/accuracy.csv")],
       "ablation": [(r["model"], float(r["test_accuracy"])) for r in rows("task4/ablation.csv")],
       # a linear probe after layer 2 for the first value (a): task 3's one head (a 50/50 blend) vs task 4's two heads
       "probe_first": {m: next(float(r["probe_accuracy"]) for r in rows(f"{t}/probes.csv") if r["stage"] == "after layer 2" and r["target"].startswith("a "))
                       for m, t in (("one_head", "task3"), ("two_heads", "task4"))},
       "sum": next(float(r["test_accuracy"]) for r in rows("task3/accuracy.csv") if r["model"] == "2 layers, 1 head each, plus MLP"),
       "split": {"sum": split("task3/attention_split.csv"), "one_head": split("task4/one_head/attention_split.csv"),
                 "lucky": split("task4/one_head_lucky/attention_split.csv"), "two_heads": split("task4/attention_split.csv")}}

# the example through both models
sys.path.insert(0, src); os.chdir(src)
import numpy as np
from tinygrad import nn
from model import Model
from dataset import VOCAB
from analysis import forward
text = "a2f5c9d3fc"
ids = np.array([[VOCAB.index(c) for c in text]])
ex = {"text": text}
for name, ckpt, heads in (("one_head", "task4_one_head", 1), ("two_heads", "task4", 2)):
  m = Model(seq_len=10, n_layers=2, n_heads=heads, mlp=True)
  nn.state.load_state_dict(m, nn.state.safe_load(f"checkpoints/{ckpt}.safetensors"))
  e = forward(m, ids)
  ex[name] = {"attn": [np.round(e["pattern"][1][0, h, -1].astype(np.float64), 3).tolist() for h in range(heads)],
              "answer": VOCAB[int(e["logits"][0].argmax())]}
  if heads == 2:   # layer 1's two heads, every row: is the second one doing anything?
    ex["l1"] = [np.round(e["pattern"][0][0, h].astype(np.float64), 3).tolist() for h in range(heads)]
out["example"] = ex
json.dump(out, open(dst, "w"), separators=(",", ":"))
print(json.dumps(out, indent=1))
