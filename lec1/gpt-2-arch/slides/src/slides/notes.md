# 09-stream

- "rescale" is layer norm: for each token, shift the 768 numbers so they average 0, stretch them so their spread is 1, then a learned per-cell scale and shift. It keeps every block seeing numbers in the same range. The copy that goes out is rescaled; what gets added back lands on the raw strip.
- There is one before attention and one before the mlp in every block, and one more at the very end before the answer.

# 10-problem

- The strips are the starting strips (word + position). Nothing has read anything yet.
- The guess is a separate, real run: the whole model given the one-token prompt " of". It says " the" at 9%, i.e. it has no idea. That's what " of" knows on its own. The point: the answer needs the other strips.
- (An earlier version read the guess after block 0, " the" 74%. That's after attention has run once, so it couldn't honestly be called "alone".)

# 10b-ask

- The analogy, with the real numbers of block 3, head 3 behind it: a room with the four tokens in it. " of" has a question (what i'm looking for = query), everyone wears a tag (what i advertise = key) and holds a note (what i hand over = value). Don't say the real names yet; they land on the names slide.
- Why a tag and a note are different strips: how you want to be found is not what you contribute. " States" is found by "a country-ish name before 'of'", but hands over something that pushes toward " America".
- The share bars are the real softmax budget (87% on " States"). "Match" vs "share" gets precise on the budget slide.
- Step 4 is the token-independence point: all three short strips are made from each token's own strip, nobody has looked at anybody. Only the match crosses tokens. Every token asks at once (the other tokens' questions appear, faded).
- Step 5 is the signpost: 144 of these (12 blocks × 12 heads). The next slides follow one, by its real address, so it doesn't feel like a toy.

# 11-lenses

- The whole model is this one move: a strip through a grid. Every "projection", the mlp, and the final answer are the same thing with a different grid.
- Two ways to see one multiply, both true: (column view) each output number is the strip dotted with one column; (row view) each input number scales one row, and the 768 scaled rows add up. The lookup table on the embed slide is the row view with a strip that's one 1 and 767 zeros.
- Each grid also has a bias: 64 numbers added to the output. Left off the slide.
- The grid is 768 × 64, labeled with the head's real address (block 3, head 3). 64 = 768 ÷ 12 heads; the room slide said "144 of these", the glue slide shows the cut.

# 11b-four-at-once

- Stacking the strips as rows doesn't change any number: row i of the output only ever uses row i of the input. The tokens never touch each other inside a multiply. That is why "each token on its own" is literally true for the mlp, and why the cache slide works.
- Shapes in the code: x is (4, 768), W is (768, 64), x @ W is (4, 64). With a batch it's (batch, 4, 768).
- The last step is the abstraction the rest of the deck leans on: a loop whose turns are independent becomes a dimension in front of the tensor, and the gpu runs every turn at the same time. Tokens here; sentences in a batch; the 12 heads on the glue / 3d slides (`for h in heads: attn(h)` → one stacked op with a heads dimension in front).

# 12-match

- The score is the dot product of query and key: multiply cell by cell, add up. Same operation as a column of the grid.
- Negative is normal. Softmax only sees differences, so −21 vs −44 is a huge gap and −21 is "the best" here.

# 13-budget

- ÷ 8 is ÷ √64 (√head size). Without it the scores grow with the head size and the softmax saturates to 100% / 0%.
- Softmax: e^score for each, divide by the sum. e to a gap of 2.5 is about 12×, which is where 87% vs 7% comes from.
- Why the future is blocked (the causal mask): the model is trained to predict the next token at every position at once. If " of" could read " America" it would just copy it. So at training time the future is hidden, and the model is built that way forever. This is also what makes the cache possible later.

# 14-copy

- The value strip is 64 wide like the other two. The budget turns each one down; the four scaled strips add to one 64-number result. 87% on " States" means the result is mostly " States"'s value.

# 15-write

- Output grid for one head: 64 × 768, same move, input along the rows this time. The real output grid is 768 × 768: all 12 heads' 64-row slabs stacked. "12 results side by side (768) through the 768 × 768 grid" is exactly "12 notes added up".
- Plus a bias of 768 numbers, once for all heads.

# 16-names

- c_attn is the glued 768 × 2304 weight (query | key | value, 12 heads each). c_proj is W_O, 768 × 768.
- "scaled dot-product attention" = scores ÷ √64. "causal" = the mask. "softmax" = the budget.

# 22-glue

- Head h owns columns 64h … 64h+63 of each third of c_attn. Every head reads all 768 rows (the whole strip). Nothing special happens at the cut: it's just reading the output 64 at a time.
- 12 × 64 = 768 is a design choice (head size × number of heads = model width), not a law. Other models pick differently.

# 23-heads-3d

- "key, turned" is the transpose: (4, 64) → (64, 4), so query (4, 64) · key turned (64, 4) = scores (4, 4), per head.
- The output grid is the only place heads mix: each output number reads all 768 (= 12 × 64) inputs.

# 24-mlp

- A neuron = one column of the 768 × 3072 grid: one dot product with the strip, then the gate (GELU, roughly "below zero → off"). 3072 = 4 × 768 by convention.
- Then 3072 × 768 back down and add on. Two multiplies, one gate. Most of the parameters in the model live here.

# 25-stack

- "the guess after block l" (the logit lens): take " of"'s strip after block l, apply the final rescale, match against the embedding table, softmax. Pretend the model stopped there.

# 25b-breadth-depth

- Heads = breadth: how many questions a token asks in one round. They share the 768 numbers (12 × 64), so more heads at the same width = narrower slices, not more capacity. Inner loop: parallel, no extra time.
- Blocks = depth: rounds, in order. Later rounds can ask about what earlier rounds pulled in. Induction ("Harry Potter … Harry → Potter"): the previous-word head (block 4, head 11, slide 21) marks each token with the word before it; a later head uses that mark to find the earlier repeat and copy what followed. Needs two rounds, however many heads.
- gpt-2 sizes: width 768 / 1024 / 1280 / 1600, heads 12 / 16 / 20 / 25 (always 64 wide), blocks 12 / 24 / 36 / 48. Head count follows width; depth is the real knob.
- One-liner: heads decide how many questions at once; blocks decide how many rounds, and later rounds build on earlier answers.

# 26-answer

- The final multiply is against the same table as the start (weight tying): 768 × 50,257, one score per token. Then softmax, the same as the budget. Sampling picks from these chances; greedy takes the top one.

# 27-cache

- Keys and values of old tokens never change when a new token arrives, because of the causal mask: a token's strip never depends on what comes after it. So save them.
- Queries aren't saved: only the newest token is looking, and it uses its own query once.
