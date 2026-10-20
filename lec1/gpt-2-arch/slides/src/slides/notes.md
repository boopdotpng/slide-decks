# 01-title
- picks up from the cpu deck: the sum loop, with learned numbers
- gpt-2 small: 124M parameters, real weights from openai-community/gpt2. every number on these slides comes from impl/export.py

# 02-model
- GPT-2 small: 124M parameters, released by OpenAI in 2019. Trained only to predict the next token, on ~40GB of web text (pages linked from reddit posts with 3+ karma).
- This one screen is the whole forward pass, top to bottom, with the tensor shape after each stage. Everything after this zooms into one box.
- → (steps 1–6) light up each stage: tokens → embeddings → 12 blocks (layernorm, attention, mlp) → final norm → logits. [check: stage order on screen]
- Keep it quick: it's a map, we come back to each piece.

# 03-gen-loop
- Before any detail: generation is a loop. Whole sequence in, one token out, append, repeat.
- Our prompt for the whole talk: "When Mary and John went to the store, John gave a drink to". GPT-2 says " Mary".
- → → → each press is one more trip around the loop: " Mary", " and", " said", ",". Real greedy output.
- Point at the code: every call feeds in the *whole* sequence. Hold onto that, it's the setup for the kv cache later.

# 04-tokens
- The model never sees text, only integer ids.
- → the text splits into 14 tokens. Note the leading space is part of the token (" Mary", not "Mary"); the dots show the spaces.
- → each token becomes an id from a 50,257-entry vocab. Common words have small ids: " the" = 262, " to" = 284.
- Shape (1, 14): batch of 1, 14 tokens.
- → tokens are neither words nor letters, they're somewhere in between. Common words get one token each (every word in our prompt does), rarer ones split into pieces: "tokenization" → " token" + "ization", "ChatGPT" → " Chat" + "G" + "PT", even "2026" → " 20" + "26". The vocab is learned from frequent chunks of text (byte-pair encoding), so it ends up between characters and words.

# 05-embed
- The first step is just a lookup table: id → row.
- → the table is 50257 × 768. Our prompt's rows are marked. Every id here is under 6000 (" Mary" = 5335), so we only draw that slice.
- → pull out one row per token: (1, 14, 768).
- → zoom on one: a token is now just 768 numbers. Those numbers were learned during training.

# 06-block
- The core idea of a transformer block: x is a "residual stream" that runs straight through. Each sublayer reads a normalized copy and *adds* its output back. Nothing overwrites x.
- → input_layernorm. → self_attn, added back. → post_attention_layernorm. → mlp, added back.
- → stack 12 of these. The bars show how long x gets after each block for our last token: 51 after block 0, 478 after block 11. It only grows because every block adds to it and nothing ever shrinks it. The final norm rescales it before the output.

# 07-attn-head
- Before any matrices: what does *one* attention head compute, for *one* token? Four lines.
- → each token's 768-vector is projected to three 64-number vectors: q ("what am I looking for"), k ("what do I contain"), v ("what I hand over if picked"). Each head has its own three 768 × 64 matrices.
- → score every token j: dot product of my q with its k, divided by √64 = 8 (keeps the scores from growing with the dimension and saturating softmax).
- Same line, all tokens at once: stack every kⱼ as a row of a matrix K (14 × 64). A matmul dots rows of the left with *columns* of the right, so K gets flipped: q Kᵀ = all 14 dot products. That's the transpose you'll see in the code (`k.transpose(-2, -1)`) from here on.
- → softmax turns the scores into weights that sum to 1.
- → output = the values blended by those weights. 64 numbers out.
- Same line as a matmul: stack every vⱼ as a row of V (14 × 64). p (1 × 14) @ V (14 × 64) = out (1 × 64): each output number is p dotted with one column of V. No transpose this time: V's rows are already the tokens, which is what p's 14 weights line up with. That's `attn @ v` in the code.
- → next two slides: exactly these lines, with the real numbers for block 10 head 7.

# 08-scores
- The last token's query vs every key, block 10 head 7.
- → multiply q and k channel by channel.
- → sum: a dot product, one number per key. Big = good match.
- → divide by √64 = 8. Without this, dot products grow with head_dim and softmax saturates onto one key.
- → softmax turns scores into probabilities that sum to 1. " to" puts 0.58 on " Mary", 0.14 on " John".
- This is one row of a 14 × 14 score matrix. We'll see the whole matrix in prefill.

# 09-weighted
- q·k decided *where* to look. v is *what* each token hands over when it's looked at. The output is the v rows blended by those weights.
- Start: the 14 value rows (block 10 head 7), with the weights from the q·k slide next to them. " Mary" 0.58, " John" 0.14.
- → scale each row by its weight. Almost everything fades out; " Mary"'s row stays bright.
- → sum the rows: that's the head's output. Directly under it is " Mary"'s own v. They look nearly the same (cosine 0.94).
- The point: this head *copied* what " Mary" hands over into the " to" position. Attention is the only place tokens exchange information, and this is the mechanism.

# 10-heads-proj
- So far one head. The model has 12 per block, and it computes them all at once. Here's why that's not a different algorithm.
- Start: one head, exactly the formula's first line: x (14 tokens × 768) times head 7's W_Q (768 × 64) gives head 7's q for every token (14 × 64).
- → q_proj is just the 12 heads' W_Q matrices placed side by side: 768 × 768 = 12 × (768 × 64). One matmul computes every head's q. Column band h of the output only ever touches band h of W, so the heads never mix. Same for k_proj and v_proj.
- → the reshape does no math. It cuts q into its 12 bands of 64 and stacks them: (1, 14, 768) → (1, 12, 14, 64). "Head" is now just another dimension.

# 11-heads-batched
- The rest of the formula as matrix shapes.
- Start: one head, all 14 tokens at once. q (14 × 64) @ kᵀ (64 × 14) = a 14 × 14 score matrix: row i is token i's q·k against every token. Softmax per row, then @ v (14 × 64) = out (14 × 64). The last row is exactly the row we followed on the previous slides. (The other rows also need the causal mask; that comes in prefill.)
- → now every matrix has a leading 12. `@` only multiplies the last two dimensions; the 12 just rides along. 12 independent attentions in one call, none of them sees another.
- → the loop it replaces (what it means) next to the single line that actually runs. And the textbook formula, softmax(QKᵀ/√d)V, which is the same thing.
- Takeaway: the "fancy" batched matmuls are just N copies of the one-head computation, run side by side.

# 12-mask
- Problem: in one pass, earlier tokens could peek at later ones. During generation they can't, so training and prefill have to match that.
- → causal mask: set every score above the diagonal to −∞.
- → softmax per row: −∞ becomes exactly 0. Each row sums to 1 over its past only.
- → the last row sees everything, so it's exactly the row we followed through the model. That's why the one-pass slides didn't need the mask.

# 13-mlp
- Second half of every block. Attention moves information between tokens; the MLP works on each token by itself.
- → up_proj: 768 → 3072.
- → gelu: 88% of these values are negative, and gelu squashes negatives to about 0. So only a small fraction of the "neurons" fire for this token.
- → down_proj back to 768, added to x.
- Two thirds of each block's parameters live here.

# 14-unembed
- After block 11: the final layernorm, then multiply by the *same* embedding matrix, transposed (weight tying). Score = how much the final vector looks like each token's embedding.
- → logits, one per vocab entry. All negative (−114 to −81); only the differences matter to softmax.
- → softmax, top 10: " Mary" 0.45, " them" 0.21, " the" 0.07, " John" 0.06. Greedy decoding picks " Mary". Correct answer.
