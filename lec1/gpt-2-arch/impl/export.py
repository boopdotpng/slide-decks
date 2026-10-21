# Runs GPT-2 small on one 4-token prompt with taps on, and writes the numbers the slides draw to
# ../slides/public/data/*.json. pytorch on the cpu, straight from weights/model.safetensors.
#
#   python export.py
import json, os, sys, base64
import numpy as np
import torch
import torch.nn.functional as F
from safetensors.torch import load_file
from tokenizers import Tokenizer

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, "..", "slides", "public", "data")
W = load_file(os.path.join(HERE, "weights", "model.safetensors"))
TOK = Tokenizer.from_file(os.path.join(HERE, "weights", "tokenizer.json"))
n_layers, n_heads, head_dim, emb_dim = 12, 12, 64, 768

PROMPT = "The United States of" # 4 tokens -> " America" (97%)
FOCUS = (3, 3) # block, head walked through in detail: ' of' puts most of its budget on ' States'
ANSWER = " America"

# single-token words for the embedding similarity plot
WORDS = [" king", " queen", " man", " woman", " boy", " girl",
         " Paris", " France", " London", " England", " Tokyo", " Japan",
         " cat", " dog", " horse",
         " one", " two", " three",
         " red", " blue", " green",
         " run", " walk", " jump"]
NEIGHBOR_QUERIES = [" king", " Paris", " dog", " blue"]
SPLIT_WORDS = [" tokenization", " ChatGPT", " 2026"]
BPE_WORD = " tokenization" # built merge by merge on the bpe slide
SAME = "I saw the cat and the dog" # the same word twice: identical strips until position is added

def r(x, d=3):
  x = np.asarray(x, dtype=np.float64)
  return np.round(x, d).tolist()

def shape(x): return list(np.shape(x))

def q8(x, scale):
  # a matrix as a base64 string of uint8: tanh(v / scale) mapped to 0..255 (128 = 0). the slides draw it on a
  # canvas with the same diverging colors as everything else; 1 byte per cell keeps big tables small
  t = np.tanh(np.asarray(x, dtype=np.float64) / scale)
  return {"b64": base64.b64encode(np.round((t + 1) / 2 * 255).astype(np.uint8).tobytes()).decode(), "shape": shape(x), "scale": float(scale)}

def rms(x): return float(np.sqrt((np.asarray(x) ** 2).mean()))
dec = lambda i: TOK.decode([int(i)])
write = lambda name, obj: json.dump(obj, open(os.path.join(OUT, name), "w"), separators=(",", ":"))

def ln(x, p): return F.layer_norm(x, (emb_dim,), W[p + ".weight"], W[p + ".bias"], 1e-5)

def forward(ids, pos=True):
  """the whole model on one sequence (no batch). returns final logits (S, vocab) and every intermediate, as numpy.
  pos=False leaves the position table out (only for the slide on why it's needed)"""
  T = {}
  tap = lambda k, v: T.__setitem__(k, v.detach().numpy().copy())
  S = len(ids)
  tok_emb, pos_emb = W["wte.weight"][ids], W["wpe.weight"][:S] * (1.0 if pos else 0.0)
  x = tok_emb + pos_emb
  tap("tok_emb", tok_emb); tap("pos_emb", pos_emb); tap("embed", x)
  mask = torch.full((S, S), float("-inf")).triu(1) # token i can't see tokens after it
  for l in range(n_layers):
    p = f"h.{l}."
    tap(f"{l}.resid_in", x)
    h = ln(x, p + "ln_1"); tap(f"{l}.ln1", h)
    q, k, v = (h @ W[p + "attn.c_attn.weight"] + W[p + "attn.c_attn.bias"]).split(emb_dim, -1) # each (S, 768)
    tap(f"{l}.q", q); tap(f"{l}.k", k); tap(f"{l}.v", v)
    qh, kh, vh = (t.view(S, n_heads, head_dim).transpose(0, 1) for t in (q, k, v)) # (12, S, 64)
    dots = qh @ kh.transpose(1, 2); tap(f"{l}.dots", dots) # (12, S, S)
    probs = (dots / head_dim ** 0.5 + mask).softmax(-1); tap(f"{l}.probs", probs)
    ho = probs @ vh; tap(f"{l}.head_out", ho) # (12, S, 64)
    cat = ho.transpose(0, 1).reshape(S, emb_dim)
    a = cat @ W[p + "attn.c_proj.weight"] + W[p + "attn.c_proj.bias"]; tap(f"{l}.attn_out", a)
    x = x + a; tap(f"{l}.resid_mid", x)
    h = ln(x, p + "ln_2"); tap(f"{l}.ln2", h)
    up = h @ W[p + "mlp.c_fc.weight"] + W[p + "mlp.c_fc.bias"]; tap(f"{l}.mlp_up", up)
    g = F.gelu(up, approximate="tanh"); tap(f"{l}.mlp_hidden", g)
    m = g @ W[p + "mlp.c_proj.weight"] + W[p + "mlp.c_proj.bias"]; tap(f"{l}.mlp_out", m)
    x = x + m; tap(f"{l}.resid_out", x)
  x = ln(x, "ln_f"); tap("norm", x)
  logits = x @ W["wte.weight"].T
  return logits.detach().numpy(), T

def softmax(x):
  e = np.exp(x - x.max(-1, keepdims=True))
  return e / e.sum(-1, keepdims=True)

def main():
  os.makedirs(OUT, exist_ok=True)
  wte, wpe = W["wte.weight"].numpy(), W["wpe.weight"].numpy()
  nf_w, nf_b = W["ln_f.weight"].numpy(), W["ln_f.bias"].numpy()
  def final_norm(x):
    x = (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + 1e-5)
    return x * nf_w + nf_b
  def lens(resid, k=5):
    # pretend this block was the last one: final norm + compare with every token's embedding
    p = softmax(final_norm(resid) @ wte.T)
    return [{"tok": dec(i), "p": round(float(p[i]), 3)} for i in p.argsort()[::-1][:k]]

  ids = TOK.encode(PROMPT).ids
  toks = [dec(i) for i in ids]
  S = len(ids)
  assert S == 4, toks
  ans = TOK.encode(ANSWER).ids[0]

  # ── embeddings ───────────────────────────────────────────────────────────
  word_ids = []
  for w in WORDS:
    e = TOK.encode(w).ids
    assert len(e) == 1, f"{w!r} is {len(e)} tokens"
    word_ids.append(e[0])
  Wv = wte[word_ids]
  Wn = Wv / np.linalg.norm(Wv, axis=-1, keepdims=True)
  wten = wte / np.linalg.norm(wte, axis=-1, keepdims=True)
  neighbors = {}
  for q in NEIGHBOR_QUERIES:
    qi = TOK.encode(q).ids[0]
    sims = wten @ wten[qi]
    neighbors[q] = [{"tok": dec(i), "sim": round(float(sims[i]), 3)} for i in sims.argsort()[::-1][1:9]]
  # channels that swing the most across positions (skipping the position-0 spike)
  wpe_dims = sorted(np.argsort(wpe[1:].var(0))[::-1][:4].tolist())
  # principal components of the position table (position 0 is an outlier, left out): the top ones come in
  # sin/cos pairs, so each pair is a plane the positions circle around, like one hand of a clock
  X = wpe[1:] - wpe[1:].mean(0)
  U, Sv, _ = np.linalg.svd(X, full_matrices=False)
  pcs = U[:, :4] * Sv[:4] # (1023, 4)
  pc_var = Sv[:4] ** 2 / (Sv ** 2).sum()
  pc_period = [round(1023 / (np.abs(np.fft.rfft(c - c.mean()))[1:].argmax() + 1)) for c in pcs.T]
  Z = (wpe - wpe[1:].mean(0)) / wpe[1:].std(0)
  spec = np.fft.rfft(Z[1:], axis=0)
  dom = np.abs(spec[1:]).argmax(0) + 1 # each column's main wave: how many times it goes up and down over 1024 positions
  phase = np.angle(spec[dom, np.arange(emb_dim)])
  order = np.lexsort((phase, dom))
  logits, t = forward(ids)
  # byte-pair encoding: gpt-2's 50,000 merges, in the order they were learned. build one word by applying them
  merges = json.load(open(os.path.join(HERE, "weights", "tokenizer.json")))["model"]["merges"]
  rank = {tuple(m.split(" ")): i for i, m in enumerate(merges)}
  show = lambda p: p.replace("Ġ", " ") # gpt-2 writes a leading space as Ġ
  pieces, bpe_steps = list("Ġ" + BPE_WORD.strip()), []
  while True:
    pairs = [(rank.get((a, b), 1e9), k) for k, (a, b) in enumerate(zip(pieces, pieces[1:]))]
    best, k = min(pairs, default=(1e9, 0))
    if best == 1e9: break
    pieces = pieces[:k] + [pieces[k] + pieces[k + 1]] + pieces[k + 2:]
    bpe_steps.append({"rank": int(best) + 1, "at": k, "pieces": [show(x) for x in pieces]})
  assert [show(x) for x in pieces] == [dec(i) for i in TOK.encode(BPE_WORD).ids], pieces
  # without the position table, order is invisible: " of" gets the same budget in a scrambled prompt
  PERM = [2, 0, 1, 3] # "States The United of"
  _, tn = forward(ids, pos=False)
  _, tp = forward([ids[k] for k in PERM], pos=False)
  P0 = tn["0.probs"][:, -1] # (12 heads, 4): block 0, the last token's budget
  NH0 = int(np.argmax(P0[:, :-1].max(-1))) # the block-0 head that leans hardest on another token
  assert np.abs(tp["0.probs"][:, -1][:, np.argsort(PERM)] - P0).max() < 1e-5
  sids = TOK.encode(SAME).ids
  si, sj = [k for k, i in enumerate(sids) if dec(i) == " the"]
  assert np.array_equal(wte[sids[si]], wte[sids[sj]])
  write("embed.json", {
    "words": WORDS, "word_ids": word_ids,
    "bpe": {"word": BPE_WORD, "start": [show(c) for c in "Ġ" + BPE_WORD.strip()], "steps": bpe_steps,
            "first": [[show(x) for x in m.split(" ")] for m in merges[:8]], "n": len(merges)},
    "order": {"perm": PERM, "head": NH0, "probs": r(P0[NH0]), "probs_perm": r(tp["0.probs"][NH0, -1])},
    "same": {"toks": [dec(i) for i in sids], "i": si, "j": sj, "word": r(wte[sids[si]]), "pos_i": r(wpe[si]), "pos_j": r(wpe[sj]),
             "diff_after": round(float(np.abs(wpe[si] - wpe[sj]).mean() / np.abs(wte[sids[si]] + wpe[si]).mean()), 2)},
    "splits": [{"word": w, "toks": [dec(i) for i in TOK.encode(w).ids], "ids": TOK.encode(w).ids} for w in SPLIT_WORDS],
    "cos": r(Wn @ Wn.T), "neighbors": neighbors,
    "wte_shape": shape(wte), "wpe_shape": shape(wpe),
    "wpe_dims": {str(d): r(wpe[:, d], 3) for d in wpe_dims}, # position curves for a few channels
    "wpe_pca": {"coords": r(pcs, 3), "var": r(pc_var), "period": pc_period}, # positions 1..1023 on the top 4 PCs
    # (512, 768): the table as a picture. each column centered and scaled by its own spread (raw, a few huge columns
    # wash everything else out), and the columns rearranged: slowest wave first, then by where the wave starts
    "wpe_img": q8(Z[::2, order], 1.5), "wpe_order": order.tolist(),
    "prompt": PROMPT, "ids": ids, "toks": toks,
    "tok_emb": r(t["tok_emb"]), "pos_emb": r(t["pos_emb"]), "embed": r(t["embed"]), # (4, 768) each
  })

  # ── the forward pass ─────────────────────────────────────────────────────
  L, H = FOCUS
  hs = slice(H * head_dim, (H + 1) * head_dim)
  p = f"h.{L}."
  c_attn, c_attn_b = W[p + "attn.c_attn.weight"].numpy(), W[p + "attn.c_attn.bias"].numpy() # (768, 2304): q | k | v
  W_o, W_o_b = W[p + "attn.c_proj.weight"].numpy(), W[p + "attn.c_proj.bias"].numpy() # (768 in, 768 out)
  x_in = t[f"{L}.ln1"] # (4, 768) what the lenses read
  lenses = {}
  for j, name in enumerate("qkv"):
    Wl = c_attn[:, j * emb_dim:(j + 1) * emb_dim][:, hs] # (768, 64): head H's columns
    b = c_attn_b[j * emb_dim:(j + 1) * emb_dim][hs]
    got = x_in @ Wl + b
    assert np.abs(got - t[f"{L}.{name}"][:, hs]).max() < 1e-3
    lenses[name] = {"img": q8(Wl, 2 * rms(Wl)), "out": r(got)} # out: (4, 64)
  CELL = int(np.abs(lenses["q"]["out"][-1]).argmax()) # the output cell we animate: the biggest one in the last token's q
  for j, name in enumerate("qkv"):
    lenses[name]["col"] = r(c_attn[:, j * emb_dim + H * head_dim + CELL]) # (768,) that cell's weights
    lenses[name]["bias"] = round(float(c_attn_b[j * emb_dim + H * head_dim + CELL]), 3)
  ho = t[f"{L}.head_out"] # (12, 4, 64)
  msgs = np.stack([ho[h, -1] @ W_o[h * head_dim:(h + 1) * head_dim] for h in range(n_heads)]) # (12, 768): what each head writes, last token
  assert np.abs(msgs.sum(0) + W_o_b - t[f"{L}.attn_out"][-1]).max() < 1e-3

  # mlp: the block whose mlp pushes hardest toward ' America' for the last token (straight through the final norm's scale)
  unembed = wte[ans] * nf_w
  push = [float(t[f"{l}.mlp_out"][-1] @ unembed) for l in range(n_layers)]
  ML = int(np.argmax(push))
  hid = t[f"{ML}.mlp_hidden"] # (4, 3072)
  Wd = W[f"h.{ML}.mlp.c_proj.weight"].numpy() # (3072, 768)
  contrib = hid[-1] * (Wd @ unembed) # each neuron's push toward ' America'
  top_n = [n for n in np.argsort(contrib)[::-1] if hid[-1, n] > 0.1][:8] # the neurons that fired and push hardest

  resid = np.stack([t[f"{l}.resid_out"] for l in range(n_layers)]) # (12, 4, 768)
  P = np.stack([t[f"{l}.probs"] for l in range(n_layers)]) # (12 layers, 12 heads, 4, 4)
  prev = np.array([[np.mean([P[l, h, i, i - 1] for i in range(1, S)]) for h in range(n_heads)] for l in range(n_layers)])
  pl, ph = np.unravel_index(prev.argmax(), prev.shape)
  probs = softmax(logits[-1])
  top = probs.argsort()[::-1][:10]
  write("forward.json", {
    "prompt": PROMPT, "toks": toks, "ids": ids, "focus": FOCUS, "cell": CELL,
    "embed": r(t["embed"]), # (4, 768)
    # the focus block, the focus head
    "resid_in": r(t[f"{L}.resid_in"]), "ln1": r(x_in), # (4, 768)
    "ln1_stats": {"mean": r(t[f"{L}.resid_in"].mean(-1)), "std": r(t[f"{L}.resid_in"].std(-1))},
    "lenses": lenses,
    "dots": r(t[f"{L}.dots"][H], 2), # (4, 4) looking-for · advertise, before the scale and mask
    "probs": r(t[f"{L}.probs"][H]), # (4, 4) the budget
    "head_out": r(ho[H]), # (4, 64)
    "V": r(t[f"{L}.v"][:, hs]), # (4, 64)
    "W_o_img": q8(W_o[hs], 2 * rms(W_o)), # (64, 768): head H's rows of the output lens
    "W_o_full_img": q8(W_o[::4, ::4], 2 * rms(W_o)), # (192, 192)
    "c_attn_img": q8(c_attn[::4, ::4], 2 * rms(c_attn)), # (192, 576): q | k | v, each 12 heads wide
    "head_msgs": r(msgs), "o_bias": r(W_o_b), "attn_out": r(t[f"{L}.attn_out"][-1]),
    "resid_mid": r(t[f"{L}.resid_mid"][-1]),
    # all 12 heads of the focus block (the 3d scene), and every head in every block
    "q_all": r(t[f"{L}.q"], 2), "k_all": r(t[f"{L}.k"], 2), "v_all": r(t[f"{L}.v"], 2), # (4, 768)
    "probs_focus_block": r(P[L]), # (12, 4, 4)
    "scores_focus_block": r(t[f"{L}.dots"] / head_dim ** 0.5, 2), # (12, 4, 4) before the mask and softmax
    "probs_all": r(P, 3), # (12, 12, 4, 4)
    "prev_head": [int(pl), int(ph), round(float(prev[pl, ph]), 3)],
    # mlp
    "mlp": {"layer": ML, "push": r(push, 2), "in": r(t[f"{ML}.ln2"][-1]), "up": r(t[f"{ML}.mlp_up"][-1], 2),
            "hidden": r(hid, 2), "out": r(t[f"{ML}.mlp_out"][-1]), # hidden: (4, 3072)
            "active": [int((row > 0.1).sum()) for row in hid],
            "top": [{"n": int(n), "act": round(float(hid[-1, n]), 2), "push": round(float(contrib[n]), 2)} for n in top_n]},
    # the stack and the answer
    "resid_norm": r(np.linalg.norm(resid[:, -1], axis=-1), 1),
    "lens": [lens(resid[l, -1]) for l in range(n_layers)], # the guess after each block, last token
    "lens_all": [[lens(resid[l, i], 1)[0] for i in range(S)] for l in range(n_layers)], # (12, 4) top guess at every position
    "final": r(t["norm"][-1]),
    "top": [{"tok": dec(i), "id": int(i), "logit": round(float(logits[-1, i]), 2), "p": round(float(probs[i]), 4)} for i in top],
  })
  print(f"forward: {toks} -> {dec(top[0])!r} p={probs[top[0]]:.3f}; focus L{L}.H{H} row {r(P[L, H, -1], 2)}; "
        f"prev-token head L{pl}.H{ph} ({prev[pl, ph]:.2f}); mlp block {ML} (push {push[ML]:+.1f}), cell {CELL}")

  # ── generating: the loop, and why the cache works ────────────────────────
  gen, steps = list(ids), []
  for _ in range(5):
    lg, _ = forward(gen)
    nxt = int(lg[-1].argmax())
    steps.append({"n": len(gen), "next": dec(nxt)})
    gen.append(nxt)
  _, t2 = forward(gen[:S + 1]) # run it again with one more token: the old tokens' k and v come out the same
  kv_diff = max(float(np.abs(t2[f"{l}.{n}"][:S] - t[f"{l}.{n}"]).max()) for l in range(n_layers) for n in ("k", "v"))
  write("loop.json", {
    "toks": [dec(i) for i in gen], "steps": steps, "focus": FOCUS,
    "K1": r(t[f"{L}.k"][:, hs]), "K2": r(t2[f"{L}.k"][:, hs]), "V1": r(t[f"{L}.v"][:, hs]), "V2": r(t2[f"{L}.v"][:, hs]),
    "kv_diff": float(f"{kv_diff:.1e}"), # over every block, head, position and channel
  })
  print(f"loop: {PROMPT!r} + {''.join(s['next'] for s in steps)!r}, old k/v max diff on rerun {kv_diff:.1e}")
  for f in ("embed.json", "forward.json", "loop.json"): print(f, os.path.getsize(os.path.join(OUT, f)) // 1024, "KB")

if __name__ == "__main__":
  with torch.no_grad(): main()
