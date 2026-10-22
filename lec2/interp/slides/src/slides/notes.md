# 01-title
- every model in this deck is tiny (32 numbers per position, 1–2 layers) and trained on a toy task, small enough to read off the weights
- the one question for every piece: what can it add to the residual stream?

# 02-rnn-step
- this is the one line in train.py's `step`: `h = tanh(Wxh[x] + h @ Whh + bh)`, then `h @ Why` for the guess
- → the memory comes in: 512 numbers (red positive, blue negative). it's everything the rnn knows about "To b"
- → mix the character and the memory into a new memory. same three weight matrices every step
- → the guess comes out of the new memory. after "To be": a space 62%, then "a" 20%
- the important part: h is a fixed size. 512 numbers, no matter how long the text gets
- call h the rnn's stream: everything it knows flows through it. the catch is every step rewrites it. keep that in mind for the transformer, where the stream is only ever added to

# 03-rnn-fade
- experiment: take the 60 characters before the "s" of "yonder window breaks". swap one character for a random one and see how much the guess for the next character changes (0% = same guess, 100% = completely different). each bar is that character's effect, averaged over 30 random swaps
- → the bars: the last ~10 characters matter, "yonder" a little, "But, soft!" and "wound" essentially nothing
- → averaged over 500 random snippets: 73% one back, 8% ten back, 1% twenty back, 0.03% forty back
- why: every step rewrites h through a tanh. old information gets squeezed and overwritten. there's nowhere else to keep it
- (honest caveat if asked: it was trained on 64-character snippets, so it never needed more. bigger rnns and lstms stretch this, but the squeeze through one fixed h is still there)

# 04-rnn-serial
- the second problem is speed. step 19 needs h from step 18, which needs step 17, ... you can't start them early
- training on a 64-character snippet is 64 small matmuls in a row. a gpu wants one big one
- → attention: every position computed at the same time. one big matmul. that's why transformers train on thousands of tokens at once (gpt-2: 1024)
- schematic: the rnn row's timing is for show

# 05b-tokenize
- the model only sees integers. we keep it trivial: every character is its own token
- 26 letters + 10 digits = 36. a = 0 … z = 25, '0' = 26 … '9' = 35
- → a2f5c9d3f is 9 tokens, 9 ids

# 05c-embed
- the first step is just a lookup table: id → row. ours is 36 × 32 (real weights from the lookup model)
- → our input's rows are marked
- → pull out one row per position: (9, 32)
- → zoom on f: a token is now just 32 numbers, learned during training. both f's get the exact same row
- same idea as gpt-2's 50257 × 768 table, just smaller

# 05d-resid
- reframe before the tasks: a transformer is a stack of things that add to one vector per position
- each position starts as its token's embedding. that vector is its residual stream
- → attention: reads earlier positions' streams, adds into this one. the only way anything moves between positions
- → mlp: reads one position's stream, adds back into the same one
- → unembed reads the last stream: 36 scores
- → nothing overwrites. x = x + f(x). so for every piece, ask: what can it add?
- callback to slide 2: the rnn had one stream, h, and squeezed and overwrote it every step, one position at a time. here every position keeps its own stream, and only ever gets added to

# 06-tasks
- models and data: ~/code/ml/interp (task0.py, task1.py). same vocab and input format throughout
- → task 0: hidden digit on the smallest network, embed → unembed
- → task 1: the same problem, plus one attention head
- → more tasks after that: harder problems, each needing one more piece
- → every answer is one of 10 digits, so chance is 10%
- → THE PLAN. this is the shape of the whole talk: start small; each time the network fails a task, add one piece, retrain, then open it up and read what the new piece does

# 10-t0-net
- our current network: the smallest one possible. input → tokenize → embed → unembed → pick the highest score
- real weights from task0.py (no layers, no position embedding)
- the last token is always a letter, and only the last position gets read. nothing moves between positions
- keep that in mind: the digit is somewhere else

# 11-t0-unembed
- the unembedding is the other half of the network: a second learned table, (36, 32), separate from the embedding
- with no layers the last stream is just the last token's embedding, here a
- → one score = one row · the stream: 32 products, added up
- → all 36 rows: letters come out low, digits high. training learned "the answer is some digit"
- → highest score wins: 4. the right answer was 7. it never saw the 7

# 12-t0-task
- one digit, anywhere except the last position, among letters. find it by what it is, not where it is
- → spot it. → copy it to the last position
- that copy is exactly what this network can't do: nothing moves between positions

# 13-t0-loss
- starts at ln 36: random weights, an even guess over all 36 tokens
- → drops fast to ln 10: it learns "the answer is a digit", and that's all it can learn
- → and stays there. ~10% accuracy, chance

# 14-t0-pred
- average prediction over the test set at model init (random weights): a bit of everything
- → after training: letters ≈ 0, every digit ≈ 0.1. "some digit, evenly"

# 15-t0-how
- the only computation in this network: look up the last letter's embedding, dot it with all 36 rows of the unembedding. nothing else is learned
- at init the scores are about equal: ~1/36 each (the top chart on the last slide)
- → one example. cross-entropy's gradient on the scores is p − onehot: the right answer goes up, everything else goes down, in proportion to how likely it was
- → the answer is never a letter. every single example pushes every letter down. real trained average ≈ −4.8
- → which digit is right has nothing to do with the last letter. each digit is right 1 time in 10: pushed up by (1 − p) then, down by p the other 9 times. net push = 0.1(1 − p) − 0.9p = 0.1 − p, which is zero exactly at p = 0.1. so every digit climbs until it's at 10%, then stops
- → softmax of that: letters ≈ 0, digits ≈ 10% each. loss ln 10. that's the best possible without seeing the digit
- arrows are schematic; the bars from step 2 on are the real trained scores (U · E[letter], averaged over letters)

# 16-t0-moved
- what training changed: only the letters moved. the last position is always a letter, so only letters ever reach the unembedding
- digits never sit at the last position, get no gradient, and stay exactly at their random start
- → it can't solve the task. by the plan: add one piece

# 20-t1-net
- the one new piece: a single attention head between embed and unembed
- it can read the other positions' streams and add what it finds into this one. the first thing that moves information sideways
- same task, same data, same training

# 21-t1-loss
- task1.py: 100% on the test set within a few hundred steps
- → ln 36 → → it pauses at ln 10 ("some digit") like task 0 did, then the head learns which digit and the loss goes to ~0

# 22-t1-attn
- now open it up. attention from the last position on 8 test sequences
- all of it lands on the digit, wherever it is: 99.8% on average
- the head found the digit by what it is. there's no position embedding, so it can't know where

# 23-t1-qk
- query · key: how much a letter at the last position wants to look at each token, before the softmax
- every digit scores high, every letter low. after the softmax that's ~all the attention on the digit
- averaged over the 26 possible last letters; they all look about the same

# 24-t1-ov
- value: what the head writes once it's looking at a digit
- if it copies d, the model outputs d, ≥ 99.8%. the head writes the digit's identity, the unembedding reads it back
- so one head = find something by content (QK), copy it here (OV). that's what one head can write to the residual stream

