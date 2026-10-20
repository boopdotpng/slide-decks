# Runs GPT-2 on a couple of short prompts with taps on, and writes the intermediate
# activations the slides visualize to ../slides/public/data/*.json.
#
#   python export.py
import main as gpt
from main import Tensor, load_model, n_layers, emb_dim, n_heads, head_dim
import numpy as np
import json, os, sys

OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(gpt.HERE, "..", "slides", "public", "data")

PROMPT = "When Mary and John went to the store, John gave a drink to" # indirect object identification
REPEAT = "The cat sat on the mat. The cat sat on the" # repeated text: induction heads
FOCUS = (10, 7) # layer, head walked through in detail: attends ' to' -> ' Mary', but pushes *against* ' Mary'
PAIR = (9, 6) # looks at ' Mary' too, and pushes *for* it
ANSWER, WRONG = " Mary", " John"

# single-token words for the embedding similarity plot
WORDS = [" king", " queen", " man", " woman", " boy", " girl",
         " Paris", " France", " London", " England", " Tokyo", " Japan",
         " cat", " dog", " horse",
         " one", " two", " three",
         " red", " blue", " green",
         " run", " walk", " jump"]
NEIGHBOR_QUERIES = [" king", " Paris", " dog", " blue", " three", " happy", " computer"]
# words that split into several tokens: tokens are neither words nor letters
SPLIT_WORDS = [" tokenization", " ChatGPT", " 2026"]

def r(x, d=3):
  # numpy -> nested lists, rounded so the json stays small
  return np.round(np.asarray(x, dtype=np.float64), d).tolist()

def shape(x): return list(np.shape(x))

def capture(model, ids, start_pos=0):
  gpt.TAPS = {}
  model.logits(Tensor([ids]), start_pos)
  taps, gpt.TAPS = gpt.TAPS, None
  return taps

def softmax(x):
  e = np.exp(x - x.max(-1, keepdims=True))
  return e / e.sum(-1, keepdims=True)

def main():
  model, tok = load_model()
  os.makedirs(OUT, exist_ok=True)
  wte = model.embed_tokens.weight.numpy() # (vocab, emb_dim)
  wpe = model.embed_positions.weight.numpy() # (max_seq_len, emb_dim)
  norm_w, norm_b = model.norm.weight.numpy(), model.norm.bias.numpy()
  dec = lambda i: tok.decode([int(i)])

  def norm(x):
    x = (x - x.mean(-1, keepdims=True)) / np.sqrt(x.var(-1, keepdims=True) + gpt.norm_eps)
    return x * norm_w + norm_b

  def logit_lens(resid, k=3):
    # pretend each layer is the last one: final norm + unembed the residual stream
    p = softmax(norm(resid) @ wte.T)
    top = p.argsort(-1)[..., ::-1][..., :k]
    return [[{"tok": dec(i), "p": round(float(pp[i]), 3)} for i in t] for t, pp in zip(top, p)]

  ids = tok.encode(PROMPT).ids
  toks = [dec(i) for i in ids]
  S = len(ids)
  write = lambda name, obj: json.dump(obj, open(os.path.join(OUT, name), "w"), separators=(",", ":"))

  # ── embeddings ───────────────────────────────────────────────────────────
  word_ids = []
  for w in WORDS:
    e = tok.encode(w).ids
    assert len(e) == 1, f"{w!r} is {len(e)} tokens"
    word_ids.append(e[0])
  W = wte[word_ids]
  Wn = W / np.linalg.norm(W, axis=-1, keepdims=True)
  wten = wte / np.linalg.norm(wte, axis=-1, keepdims=True)
  neighbors = {}
  for q in NEIGHBOR_QUERIES:
    qi = tok.encode(q).ids[0]
    sims = wten @ wten[qi]
    top = sims.argsort()[::-1][1:9]
    neighbors[q] = [{"tok": dec(i), "sim": round(float(sims[i]), 3)} for i in top]
  pos_idx = list(range(0, 1024, 16))
  # channels that swing the most across positions (skipping the position-0 spike): the first few are nearly flat
  wpe_dims = sorted(np.argsort(wpe[1:].var(0))[::-1][:4].tolist())
  # principal components of the position table (position 0 is an outlier, left out): the top ones come in
  # sin/cos pairs, so each pair is a plane the positions circle around, like a rope frequency
  X = wpe[1:] - wpe[1:].mean(0)
  U, Sv, _ = np.linalg.svd(X, full_matrices=False)
  pcs = U[:, :4] * Sv[:4] # (1023, 4)
  pc_var = Sv[:4] ** 2 / (Sv ** 2).sum()
  pc_period = [round(1023 / (np.abs(np.fft.rfft(c - c.mean()))[1:].argmax() + 1)) for c in pcs.T]
  P = wpe[pos_idx]
  Pn = P / np.linalg.norm(P, axis=-1, keepdims=True)
  embed_taps = capture(model, ids)
  model.reset()
  write("embed.json", {
    "words": WORDS, "word_ids": word_ids,
    "splits": [{"word": w, "toks": [dec(i) for i in tok.encode(w).ids], "ids": tok.encode(w).ids} for w in SPLIT_WORDS],
    "cos": r(Wn @ Wn.T), "dot": r(W @ W.T, 2),
    "neighbors": neighbors,
    "wte_shape": shape(wte), "wpe_shape": shape(wpe),
    "word_vecs": r(W[:6], 3), # a few full rows, for the "a token is 768 numbers" strip
    "wpe_pos": pos_idx, "wpe_cos": r(Pn @ Pn.T),
    "wpe_dims": {str(d): r(wpe[:, d], 3) for d in wpe_dims}, # position curves for a few channels
    "wpe_pca": {"coords": r(pcs, 3), "var": r(pc_var), "period": pc_period}, # positions 1..1023 on the top 4 PCs
    "prompt": PROMPT, "ids": ids, "toks": toks,
    "tok_emb": r(embed_taps["tok_emb"][0]), "pos_emb": r(embed_taps["pos_emb"]), "embed": r(embed_taps["embed"][0]),
    "shapes": {k: shape(embed_taps[k]) for k in ("tok_emb", "pos_emb", "embed")},
  })

  # ── decode: prompt[:-1] already in the kv cache, the last token comes in alone ──
  capture(model, ids[:-1]) # prefill the cache (taps thrown away)
  t = capture(model, ids[-1:], start_pos=S-1)
  model.reset()
  L, H = FOCUS
  A = f"layers.{L}.self_attn"
  logits = t["logits"][0, -1]
  probs = softmax(logits)
  top = probs.argsort()[::-1][:10]
  resid = np.stack([t[f"layers.{l}.resid_out"][0, -1] for l in range(n_layers)])
  per_head = ["self_attn.q", "self_attn.k_new", "self_attn.v_new", "self_attn.head_out"] # (1, n_heads, 1, head_dim) -> (n_heads, head_dim)
  per_token = ["input_layernorm", "self_attn.concat", "self_attn.out", "resid_mid", "post_attention_layernorm",
               "mlp.up", "mlp.hidden", "mlp.out", "resid_out"]
  stages = {n: r(t[f"layers.{L}.{n}"][0, :, 0]) for n in per_head} | {n: r(t[f"layers.{L}.{n}"][0, -1]) for n in per_token}
  stages["resid_in"] = r(t[f"layers.{L-1}.resid_out"][0, -1]) # what layer L reads

  # direct logit attribution: each head's output, pushed straight through o_proj, the final norm and
  # the unembedding, measured along (answer - wrong). the norm's scale is frozen at the final residual,
  # so the heads (plus everything else writing to the stream) sum to the real logit difference
  ans, wrong = tok.encode(ANSWER).ids[0], tok.encode(WRONG).ids[0]
  direction = norm_w * (wte[ans] - wte[wrong]) / np.sqrt(resid[-1].var() + gpt.norm_eps)
  dla = np.zeros((n_layers, n_heads))
  for l in range(n_layers):
    W_o = model.layers[l].self_attn.o_proj.weight.numpy() # (emb_dim out, emb_dim in)
    for h in range(n_heads):
      dla[l, h] = (W_o[:, h*head_dim:(h+1)*head_dim] @ t[f"layers.{l}.self_attn.head_out"][0, h, 0]) @ direction
  write("decode.json", {
    "toks": toks, "pos": S-1, "focus": FOCUS,
    "embed": r(t["embed"][0, -1]), "tok_emb": r(t["tok_emb"][0, -1]), "pos_emb": r(t["pos_emb"][-1]),
    "shapes": {k: shape(v) for k, v in t.items() if not k.startswith("layers.") or k.startswith(f"layers.{L}.")},
    # the focus head, step by step
    "q": r(t[f"{A}.q"][0, H, 0]), # (head_dim,)
    "K": r(t[f"{A}.k"][0, H]), # (T, head_dim)
    "V": r(t[f"{A}.v"][0, H]), # (T, head_dim)
    "raw_dots": r(t[f"{A}.scores"][0, H, 0] * np.sqrt(head_dim)), # q·k before the 1/sqrt(d) scale
    "scores": r(t[f"{A}.scores"][0, H, 0]),
    "probs": r(t[f"{A}.probs"][0, H, 0]),
    "head_out": r(t[f"{A}.head_out"][0, H, 0]),
    # every head in every layer, for this one query
    "all_scores": [r(t[f"layers.{l}.self_attn.scores"][0, :, 0]) for l in range(n_layers)], # (layers, heads, T)
    "all_probs": [r(t[f"layers.{l}.self_attn.probs"][0, :, 0]) for l in range(n_layers)],
    # full vectors at each stage of the focus layer
    "stages": stages,
    "resid_norm": r(np.linalg.norm(resid, axis=-1), 1),
    "attn_out_norm": r([np.linalg.norm(t[f"layers.{l}.self_attn.out"][0, -1]) for l in range(n_layers)], 1),
    "mlp_out_norm": r([np.linalg.norm(t[f"layers.{l}.mlp.out"][0, -1]) for l in range(n_layers)], 1),
    "norm": r(t["norm"][0, -1]),
    "logit_lens": logit_lens(resid),
    "logits_stats": {"min": round(float(logits.min()), 2), "max": round(float(logits.max()), 2), "mean": round(float(logits.mean()), 2)},
    "top": [{"tok": dec(i), "id": int(i), "logit": round(float(logits[i]), 2), "p": round(float(probs[i]), 4)} for i in top],
    "dla": {"answer": ANSWER, "wrong": WRONG, "pair": PAIR, "heads": r(dla, 2),
            "logit_diff": round(float(logits[ans] - logits[wrong]), 2)},
  })
  print(f"decode: ' to' -> {dec(top[0])!r} p={probs[top[0]]:.3f}")
  print(f"dla: L{L}.{H} {dla[L, H]:+.2f}, L{PAIR[0]}.{PAIR[1]} {dla[PAIR]:+.2f}, logit diff {logits[ans] - logits[wrong]:.2f}")

  # ── naive generation: the whole sequence through the model, every step ───
  gen, steps = list(ids), []
  for _ in range(4):
    nxt = model(Tensor([gen])).item()
    model.reset()
    steps.append({"n": len(gen), "next": dec(nxt)})
    gen.append(nxt)
  # run it again with one more token: k, v for the old positions come out the same
  t1 = capture(model, ids); model.reset()
  t2 = capture(model, gen[:S+1]); model.reset()
  kv_diff = max(float(np.abs(t2[f"layers.{l}.self_attn.{n}"][:, :, :S] - t1[f"layers.{l}.self_attn.{n}"]).max())
                for l in range(n_layers) for n in ("k", "v"))
  write("loop.json", {
    "toks": [dec(i) for i in gen], "steps": steps, "focus": FOCUS,
    "K1": r(t1[f"{A}.k"][0, H]), "K2": r(t2[f"{A}.k"][0, H]), # (S, head_dim), (S+1, head_dim)
    "kv_diff": float(f"{kv_diff:.1e}"), # over every layer, head, position and channel
  })
  print(f"loop: {''.join(s['next'] for s in steps)!r}, old k/v max diff on rerun {kv_diff:.1e}")

  # ── prefill: the whole prompt at once ────────────────────────────────────
  def prefill(prompt):
    pids = tok.encode(prompt).ids
    t = capture(model, pids)
    model.reset()
    resid = np.stack([t[f"layers.{l}.resid_out"][0] for l in range(n_layers)]) # (layers, S, emb_dim)
    return pids, t, {
      "prompt": prompt, "toks": [dec(i) for i in pids],
      "probs": [r(t[f"layers.{l}.self_attn.probs"][0]) for l in range(n_layers)], # (layers, heads, S, S)
      "scores": [r(t[f"layers.{l}.self_attn.scores"][0], 2) for l in range(n_layers)], # pre-mask
      "logit_lens": [logit_lens(resid[l], k=1) for l in range(n_layers)], # (layers, S)
      "next": logit_lens(resid[-1, -1:], k=5)[0],
    }
  pids, pt, pre = prefill(PROMPT)
  pre["shapes"] = {k: shape(v) for k, v in pt.items() if not k.startswith("layers.") or k.startswith(f"layers.{L}.")}
  pre["focus"] = FOCUS
  pre["Q"] = r(pt[f"{A}.q"][0, H]) # (S, head_dim)
  pre["K"] = r(pt[f"{A}.k"][0, H])
  write("prefill.json", pre)
  _, _, rep = prefill(REPEAT)
  write("repeat.json", rep)

  # sanity: the decode step's attention row is exactly the last row of the prefill matrix
  d = np.abs(np.array(json.load(open(os.path.join(OUT, "decode.json")))["probs"]) - pt[f"{A}.probs"][0, H, -1]).max()
  print(f"decode row vs prefill last row: max diff {d:.2e}")
  for f in sorted(os.listdir(OUT)): print(f"{f:14s} {os.path.getsize(os.path.join(OUT, f))/1e3:8.0f} kB")

if __name__ == "__main__":
  main()
