# copies a task's csvs from ~/code/ml/interp/data/task<N>/ into slides/public/data/task<N>.json,
# one key per csv, each a list of rows (numbers parsed)
#   python3 export_task.py 0 [~/code/ml/interp]
import csv, json, os, sys

n = sys.argv[1]
src = os.path.join(os.path.expanduser(sys.argv[2] if len(sys.argv) > 2 else "~/code/ml/interp"), f"data/task{n}")

def num(v):
  try: return float(v)
  except ValueError: return v

out = {}
for f in sorted(os.listdir(src)):
  if f.endswith(".csv"):
    with open(os.path.join(src, f)) as fh: out[f[:-4]] = [{k: num(v) for k, v in row.items()} for row in csv.DictReader(fh)]
dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), f"slides/public/data/task{n}.json")
json.dump(out, open(dst, "w"), separators=(",", ":"))
print(f"wrote {dst}: {', '.join(f'{k} ({len(v)})' for k, v in out.items())}")
