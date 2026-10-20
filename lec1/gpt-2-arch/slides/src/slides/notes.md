# 01-title
- picks up from the cpu deck: the sum loop, with learned numbers
- gpt-2 small: 124M parameters, real weights from openai-community/gpt2. every number on these slides comes from impl/export.py

# 02-rnn-task
- after the rnn demo (lec1/rnn: `python train.py`, `python sample.py "ROMEO:"`). every number on the rnn slides comes from rnn/export.py, run on that model
- the whole job of a language model: given the text so far, a probability for every possible next character. 65 characters in tiny shakespeare
- → → → four contexts. "First Citiz" → e 97%, "ROMEO" → ":" 99% (it learned the play format: a name, a colon, a speech). "tell me th" is a toss-up between y/e/a/i. "What is your " is wide open, 11% at best
- the sampler draws from these bars, which is why sample.py gives a different play every time

# 03-rnn-step
- this is the one line in train.py's `step`: `h = tanh(Wxh[x] + h @ Whh + bh)`, then `h @ Why` for the guess
- → the memory comes in: 512 numbers (red positive, blue negative). it's everything the rnn knows about "To b"
- → mix the character and the memory into a new memory. same three weight matrices every step
- → the guess comes out of the new memory. after "To be": a space 62%, then "a" 20%
- the important part: h is a fixed size. 512 numbers, no matter how long the text gets

# 04-rnn-unroll
- the same step, run once per character. real h after each character of "To be, or not to be"
- → → → → reveal 1, 2, 5, 10, all 19. top guess on top, green when it's right
- point out the second "to be": after the second "b" it says "e" 91%, after the first only 69%. it's seen "to b" just before, and h carried that
- the only thing passed left to right is h. that's both the trick and the problem

# 05-rnn-fade
- experiment: take the 60 characters before the "s" of "yonder window breaks". swap one character for a random one and see how much the guess for the next character changes (0% = same guess, 100% = completely different). each bar is that character's effect, averaged over 30 random swaps
- → the bars: the last ~10 characters matter, "yonder" a little, "But, soft!" and "wound" essentially nothing
- → averaged over 500 random snippets: 73% one back, 8% ten back, 1% twenty back, 0.03% forty back
- why: every step rewrites h through a tanh. old information gets squeezed and overwritten. there's nowhere else to keep it
- (honest caveat if asked: it was trained on 64-character snippets, so it never needed more. bigger rnns and lstms stretch this, but the squeeze through one fixed h is still there)

# 06-rnn-serial
- the second problem is speed. step 19 needs h from step 18, which needs step 17, ... you can't start them early
- training on a 64-character snippet is 64 small matmuls in a row. a gpu wants one big one
- → attention: every position computed at the same time. one big matmul. that's why transformers train on thousands of tokens at once (gpt-2: 1024)
- schematic: the rnn row's timing is for show

# 07-rnn-to-attn
- step 0: the rnn's only path from "T" to "e" is the chain: 18 hand-offs, each overwriting part of h
- → attention: the last position looks straight at every earlier character, one hop each, and decides how much of each to use. no squeezing, nothing forgotten
- → every position does the same thing, all at once (fixes problem 2)
- → that's what gpt-2 is. tokens instead of characters, attention instead of h, 12 layers of it. next: the model

# 08-model
- GPT-2 small: 124M parameters, released by OpenAI in 2019. Trained only to predict the next token, on ~40GB of web text (pages linked from reddit posts with 3+ karma).
- This one screen is the whole forward pass, top to bottom, with the tensor shape after each stage. Everything after this zooms into one box.
- → (steps 1–6) light up each stage: tokens → embeddings → 12 blocks (layernorm, attention, mlp) → final norm → logits. [check: stage order on screen]
- Keep it quick: it's a map, we come back to each piece.

# 09-gen-loop
- Before any detail: generation is a loop. Whole sequence in, one token out, append, repeat.
- Our prompt for the whole talk: "When Mary and John went to the store, John gave a drink to". GPT-2 says " Mary".
- → → → each press is one more trip around the loop: " Mary", " and", " said", ",". Real greedy output.
- Every call feeds in the *whole* sequence. `generate` in live.py is exactly this.

# 10-tokens
- The model never sees text, only integer ids.
- → the text splits into 14 tokens. Note the leading space is part of the token (" Mary", not "Mary"); the dots show the spaces.
- → each token becomes an id from a 50,257-entry vocab. Common words have small ids: " the" = 262, " to" = 284.
- Shape (14,): 14 tokens.
- → tokens are neither words nor letters, they're somewhere in between. Common words get one token each (every word in our prompt does), rarer ones split into pieces: "tokenization" → " token" + "ization", "ChatGPT" → " Chat" + "G" + "PT", even "2026" → " 20" + "26". The vocab is learned from frequent chunks of text (byte-pair encoding), so it ends up between characters and words.

# 11-embed
- The first step is just a lookup table: id → row.
- → the table is 50257 × 768. Our prompt's rows are marked. Every id here is under 6000 (" Mary" = 5335), so we only draw that slice.
- → pull out one row per token: (14, 768).
- → zoom on one: a token is now just 768 numbers. Those numbers were learned during training.

# 12-block
- The core idea of a transformer block: x is a "residual stream" that runs straight through. Each sublayer reads a normalized copy and *adds* its output back. Nothing overwrites x.
- → layernorm (ln_1). → attention, added back. → layernorm (ln_2). → mlp, added back.
- → stack 12 of these. The bars show how long x gets after each block for our last token: 51 after block 0, 478 after block 11. It only grows because every block adds to it and nothing ever shrinks it. The final norm rescales it before the output.

# 13-attn-head
- Before any matrices: what does *one* attention head compute, for *one* token? Four lines.
- → each token's 768-vector is projected to three 64-number vectors: q ("what am I looking for"), k ("what do I contain"), v ("what I hand over if picked"). Each head has its own three 768 × 64 matrices.
- → score every token j: dot product of my q with its k, divided by √64 = 8 (keeps the scores from growing with the dimension and saturating softmax).
- Same line, all tokens at once: stack every kⱼ as a row of a matrix K (14 × 64). A matmul dots rows of the left with *columns* of the right, so K gets flipped: q Kᵀ = all 14 dot products. That's the transpose you'll see in the code (`k.transpose(-2, -1)`) from here on.
- → softmax turns the scores into weights that sum to 1.
- → output = the values blended by those weights. 64 numbers out.
- Same line as a matmul: stack every vⱼ as a row of V (14 × 64). p (1 × 14) @ V (14 × 64) = out (1 × 64): each output number is p dotted with one column of V. No transpose this time: V's rows are already the tokens, which is what p's 14 weights line up with. That's `attn @ v` in the code.
- → next two slides: exactly these lines, with the real numbers for block 10 head 7.

# 14-scores
- The last token's query vs every key, block 10 head 7.
- → multiply q and k channel by channel.
- → sum: a dot product, one number per key. Big = good match.
- → divide by √64 = 8. Without this, dot products grow with head_dim and softmax saturates onto one key.
- → softmax turns scores into probabilities that sum to 1. " to" puts 0.58 on " Mary", 0.14 on " John".
- This is one row of a 14 × 14 score matrix. Two slides from now: the whole matrix.

# 15-weighted
- q·k decided *where* to look. v is *what* each token hands over when it's looked at. The output is the v rows blended by those weights.
- Start: the 14 value rows (block 10 head 7), with the weights from the q·k slide next to them. " Mary" 0.58, " John" 0.14.
- → scale each row by its weight. Almost everything fades out; " Mary"'s row stays bright.
- → sum the rows: that's the head's output. Directly under it is " Mary"'s own v. They look nearly the same (cosine 0.94).
- The point: this head *copied* what " Mary" hands over into the " to" position. Attention is the only place tokens exchange information, and this is the mechanism.

# 16-one-head
- The last two slides were one row of this. Same head (block 10, head 7), now every token at once: this is `one_head(q, k, v)`, line by line.
- Start: q (14 × 64) @ kᵀ (64 × 14) / 8 = scores (14 × 14). Row i = token i's question against every token's key. The highlighted bottom row is " to", the row we did by hand.
- → mask: everything above the diagonal is −∞. Token i may only look at tokens 0…i. Good moment to ask "what breaks without it?" and run `--no-mask`.
- → softmax per row: −∞ becomes 0, each row sums to 1. Every row is one token's attention.
- → @ v = out (14 × 64). The bottom row of out is the " Mary" copy from the last slide.

# 17-heads-3d
- The whole attention layer, all 12 heads. Real attention maps from block 10. Pairs with typing `attention` in live.py.
- 0: x going into attention, 14 tokens × 768.
- → one matmul (c_attn, 768 × 2304) makes q, k, v for every token, then split three ways.
- → each 768 is 12 heads × 64, side by side. Colors = heads, same colors through the rest of the slide.
- → reshape (14, 12, 64): no math, just marks the cuts.
- → transpose (12, 14, 64): each head's band slides back into a stack. "head" is now the first dimension.
- → k flips to kᵀ, and q @ kᵀ gives 12 score maps at once. `@` only multiplies the last two dims; the 12 rides along. This is why `one_head` works unchanged on (12, S, 64).
- → mask + softmax: 12 attention patterns.
- → fanned out side by side. Most heads dump a lot of weight on the first token (a known "attention sink": a place to park attention when there's nothing useful to look at). Head 7's bottom row has " to" → " Mary".
- → @ v: 12 outputs, still separate. No head has seen another's numbers.
- → transpose + reshape back: (14, 768), each head's 64 columns exactly where it was cut out.
- → c_proj (768 × 768): every output column reads all 12 heads. The only place heads mix. (The output strip's colors are illustrative, not real values.)

# 18-mlp
- Second half of every block. Attention moves information between tokens; the MLP works on each token by itself.
- → c_fc: 768 → 3072.
- → gelu: 88% of these values are negative, and gelu squashes negatives to about 0. So only a small fraction of the "neurons" fire for this token.
- → c_proj back to 768, added to x.
- Two thirds of each block's parameters live here.

# 19-unembed
- After block 11: the final layernorm, then multiply by the *same* embedding matrix, transposed (weight tying). Score = how much the final vector looks like each token's embedding.
- → logits, one per vocab entry. All negative (−114 to −81); only the differences matter to softmax.
- → softmax, top 10: " Mary" 0.45, " them" 0.21, " the" 0.07, " John" 0.06. Greedy decoding picks " Mary". Correct answer.
