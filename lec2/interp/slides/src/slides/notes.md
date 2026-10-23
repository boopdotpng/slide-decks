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
- reframe before the tasks: a transformer is a stack of things that add to one vector per position. 9 tokens, 9 streams
- each position starts as its token's embedding. that vector is its residual stream (the grey chip)
- → attention, shown for f only: reads the streams of every position up to itself, adds one vector into its own (blue chip). the only way anything moves between positions
- → every position does the same, at the same time: one matmul (callback to slide 4). position i reads 0..i, never later ones (the causal mask, more on 21c). every stream gets its own attention write
- → mlp: each position reads only its own stream, adds back into it (purple chip)
- → unembed reads only the last stream: 36 scores. the other streams were computed anyway (what gets graded, next)
- → nothing overwrites. x = x + f(x): each column is literally the sum of its chips. so for every piece, ask: what can it add?
- callback to slide 2: the rnn had one stream, h, and squeezed and overwrote it every step, one position at a time. here every position keeps its own stream, and only ever gets added to

# 06-tasks
- models and data: ~/code/ml/interp (task0.py, task1.py). same vocab and input format throughout
- → task 0: hidden digit on the smallest network, embed → unembed
- → task 1: the same problem, plus one attention head
- → task 2: four key/value pairs, then a key: output its value (f → 5). needs a second layer: layer 1 marks each value with its key, layer 2 finds it
- → task 3: two keys, output the sum of their values mod 10 (5 + 9 → 4). attention can fetch both digits but only copies; the mlp does the adding
- → task 4: same, but first minus second (5 − 9 → 6). order matters now, so one head's 50/50 blend isn't enough: two heads, one per value
- → every answer is one of 10 digits, so chance is 10%
- → THE PLAN. this is the shape of the whole talk: start small; each time the network fails a task, add one piece, retrain, then open it up and read what the new piece does

# 09-params
- the names come straight from model.py; every task picks n_layers, n_heads and whether there's an mlp, the rest stays fixed
- vocab_size and seq_len come from the data. emb_dim is the width of every stream and every write into it
- gpt-2 splits emb_dim across heads (12 × 64 = 768). ours doesn't: each head is 32 wide on its own, and its value writes all 32 numbers straight into the stream
- the task 0 network: n_layers = 0. task 1: n_layers = 1, n_heads = 1

# 11-t0-net
- our current network: the smallest one possible. input → tokenize → embed → unembed → pick the highest score
- real weights from task0.py (no layers, no position embedding)
- the last token is always a letter, and only the last position gets read. nothing moves between positions
- keep that in mind: the digit is somewhere else

# 10-t0-task
- one digit, anywhere except the last position, among letters. find it by what it is, not where it is
- → spot it. → copy it to the last position
- that copy is exactly what this network can't do: nothing moves between positions

# 13-t0-loss
- starts at ln 36: random weights, an even guess over all 36 tokens
- → drops fast to ln 10: it learns "the answer is a digit", and that's all it can learn
- → and stays there. ~10% accuracy, chance

# 17-t0-unembed
- this is the whole model: the last token's embedding times the unembedding table. training only ever moved the letters' embeddings (only letters sit at the last position; the digits' rows never get a gradient), and that's what makes the product favor digits
- the unembedding is the other half of the network: a second learned table, (36, 32), separate from the embedding
- with no layers the last stream is just the last token's embedding, here a
- → one score = one row · the stream: 32 products, added up
- → all 36 rows: letters come out low, digits high. training learned "the answer is some digit"
- → highest score wins: 4. the right answer was 7. it never saw the 7
- → it can't solve the task. by the plan: add one piece

# 20-t1-net
- the one new piece: a single attention head between embed and unembed
- it can read the other positions' streams and add what it finds into this one. the first thing that moves information sideways
- same task, same data, same training

# 21-t1-loss
- task1.py: 100% on the test set within a few hundred steps
- → ln 36 → → it pauses at ln 10 ("some digit") like task 0 did, then the head learns which digit and the loss goes to ~0

# 21b-t1-reads
- the stream, one row per position. so far it's just the embedding rows
- → three learned reads of every row: query (what I'm looking for), key (what I offer), value (what I pass on if looked at). three matmuls, every position at once
- → the 32 columns of each have no meaning on their own: rotate the query and key weights by the same rotation and every score is unchanged. so read each through what multiplies it: Q through K, K through Q, V through whoever reads it
- → compare the queries with each other: cosine ~1.00 between every letter's query, ~0.94 for the 7's. every position asks the same question

# 21c-t1-scores
- queries as rows, keys as columns: every cell is one row times one column
- → one cell: a's query · the 7's key, the 32 products summed
- → the grid fills cell by cell: each cell is that row's query · that column's key, the panel shows the 32 products and the sum. the first row goes slowly, then the rest fast. that's all a matmul is: this dot product for every pair (the gpu does them all at once). every row comes out the same shape: high on the 7
- → ÷ √32: a dot product of n numbers grows with n. scaling keeps the scores from getting out of hand, so softmax still spreads out early in training instead of snapping to one cell
- → the causal mask. back to "what gets graded": gpt grades every position on its next token, so a position that could read later ones would just copy its answer. we grade only the last position, so we could drop the mask, but then every position could see the digit wherever it is and the head would learn something gpt's heads can't. we keep gpt's rule so what we read here carries over
- → masked: the q, w, d, k rows can't see the 7
- → softmax per row: scores → probabilities, positive, summing to 100%. e^−∞ = 0
- → every row after the 7 puts ~100% on it; the rows before spread out
- → only the last row is graded. the rest are computed in the same matmul and thrown away here

# 21d-t1-ask
- slide 22 can't tell "find a 7" from "find a digit": the input has one digit and eight letters
- a key depends only on the token (embedding through the key weights, no position embedding), so every token has one key wherever it sits: we can make the keys of tokens that aren't in this input
- the 9 lit bars are exactly a's row from the last slide, before the mask and softmax (the 7 at the same score)
- → the other 27 keys: all 10 digits above all 26 letters. the query is "is this a digit?". the order among digits doesn't matter, every input has one
- every letter's query ranks them the same way (26 / 26)
- the general method, for later tasks: dot a vector with everything it could meet, read off what scores high

# 21e-t1-value
- one row per position; each row is that position's value read the way the unembedding will read it: if this value were copied into a's stream, which token would the unembedding pick? 36 scores as bars
- why the unembedding: V means nothing alone, you read it through whoever reads it. the head adds it to a's stream, the unembedding reads the stream
- start with the 7's row only: a spike on 7 (11.4). it says 7
- → the letters' values: junk, mostly "3" on this run, whatever the letter
- → a's attention column; each row's bars scale by it. the letters go flat, the 7's row is left: that's the head's write (bottom row). plus a's own embedding (task 0's "some digit") → 7, 100%
- → every digit's value (each digit's embedding through the value weights, then the unembedding): each spikes on itself. the head copies whatever digit the query finds
- the "for later" note: a value is only meaningful through its reader. in task 2, layer 1's value is read by layer 2's queries and keys, so we'll read it through those
# 22-t1-recap
- the two halves of one head, as task 1 showed them. QK: where to look, decided by what's in each stream. OV: what to bring back, a copy of what's in that stream
- → so a head can only find what's already written somewhere. but it also writes, and what it writes is something a later head can find. that's the whole next task

# 30-t2-twice
- task 2 from the overview: four key → value pairs, then a key. output that key's value. a2f5c9d3 f → 5
- before the model: the plan in two steps, each one a task 1 head
- → step 1 (layer 1), by place: every digit copies the letter just before it into its own stream. the 5's stream now says "5, after f"
- → step 2 (layer 2), by content: the f at the end looks for the stream with f written in it (exactly task 1's "find the digit", just a different question) and copies its digit
- → the point: step 2 can only find "after f" because step 1 wrote it. one head builds on another's output
- schematic: chips are what each stream "says", not its 32 numbers. the trained model does exactly this, coming up

# 31-t2-one-layer
- why not one head? at the f, it would need a key that says "the digit after f". before any head runs, the 5's stream only says 5. that fact lives between two streams, and a head scores each key stream on its own
- → one layer, one head: 39%. it finds a digit, not the digit (a little better than a 1 in 4 guess among the four values)
- → two heads in the same layer: 38%. they both read the same untouched streams, so neither can see "after f" either. width doesn't help
- → two layers: 100%. layer 2 reads what layer 1 wrote. depth lets a lookup use another's result
- (task2.py; the 1-layer runs are the same training setup, test accuracy after 4000 steps)

# 32-t2-pos
- why task 1 didn't need positions: it asks what a token is. the 7 is the answer wherever it sits, so a head finds it by content
- → task 2's answer is the order: a2f5 → 5, a5f2 → 2, same tokens. and without positions, a head sees the earlier streams as a bag: shuffle them and every score shuffles along with them. "the one right before me" can't be asked
- → the fix: a second learned table, one row per position (9 × 32), added into every stream at the start, just like the token embedding. now the stream says "f, at 2", and layer 1's query can ask for "the position just before mine"
- → trained without it: 47% on this run (38–61% over three seeds). not chance, because the causal mask leaks some order: position j sees exactly j + 1 streams, so it can sort of count. without the mask too: 37%, no order at all
- task 0 left positions out on purpose: with nothing reading other positions they'd only add a constant

# 32b-t2-net
- the network for task 2: same as task 1's, plus a second attention layer (one head each) and the position table added to every token's row
- each column: the token's row (left) + its position's row (right), real weights from task2.py. the stream starts as their sum
- same task 0 → 1 → 2 recipe: one piece added (well, two), retrain, read the weights. 100% on the test set

# 33-t2-l1
- the trained model now, on a2f5c9d3f (input on top). layer 1's only head: the whole attention matrix, every probability, the same softmax(q · k / √32 + mask) grid as task 1
- rows are queries (the position looking), columns are keys (looked at), each row sums to 100%. empty cells: the mask
- outlined: every digit looks at the key right before it: 97, 94, 92, 96% here, 91–98% averaged over the test set
- → only the digit rows matter. key rows (a, f, c, d) write into the keys' own streams, but layer 2 only looks out from the query, and puts 0.07% of that on key positions (99.9% on the digits): nobody reads those writes. the query row (f) writes into the f's own stream: a blend of earlier tokens. layer 2's query comes mostly from the f's token; this only nudges it (one of the "small terms" on the next slide)
- → why one back: layer 1 is the first thing to read the streams, so each one is just tok_emb + pos_emb. the key is linear in the stream, so every score splits exactly into a token part and a position part (the two tables add up to the real score; digit rows only, test averages). split each row of scores (before softmax) into the part from the key's position embedding and the part from its token. in every value row the position part peaks at the key just before (v1 −1.6 vs −2.2, then 1.9, 5.8, 10.3 for v2–v4: it gets sharper the more there is to choose from). the token part is small, mostly "don't look at a digit". layer 1 picks by place. v1 is the exception: its row has only k1 and itself, and softmax only cares about differences within a row (k1 wins −1.2 vs −3.9: +0.6 from position, +2.1 from token, so ~94%). with one letter to pick from, "not a digit" does most of the work there; position decides v2–v4. causal check: zero the position embedding in the trained model and it drops to 45%

# 34-t2-write
- layer 1, head 1 just copies the letter one back (the attention matrix showed it). its value is 32 numbers in its own basis, so read it through whoever reads it (the "for later" note from 21e): task 1's was read by the unembedding, this one's only reader is layer 2's key
- layer 2, head 1: its own Wq, Wk, Wv, applied to the streams as layer 1 left them (tok + pos + layer 1's write). new queries, new keys, a brand-new 9 × 9 attention matrix. same reading as the last slide
- the letter columns are greyed out on every step: layer 2 only ever picks a digit, so they're never a target (slide 30 keeps them, since layer 1 looks at letters)
- the blue tags under the digits: what layer 1 wrote there (+f under the 5). that's what layer 2's keys can now match on; in layer 1 the 5's stream only said "5 at position 3"
- outlined: the f at the end puts 98% on the 5
- → only the query row matters: only the last position is graded, and nothing after layer 2 reads the other streams (the other rows are computed in the same matmul and thrown away, like task 1)
- why the other rows look random: the weights are shared, so every row asks "where's the digit tagged with my letter?". for a key row (a, f, c, d) that digit is always the one right after it, and the mask hides it (the f at k2 is looking for +f, the 5 at position 3). the digit rows have no letter to match. only the last f has its digit behind it. and since nothing reads these rows, training never shaped them (zero gradient)
- → drop the mask, for one picture only (same trained weights, same streams, layer 2's mask removed; the model never ran like this). now each key row can see the digit right after it: f → 5 75%, c → 9 97%, d → 3 95%. a → 2 only 26% (50% on the 9): no row but the last was ever trained, so the others only work as far as the shared weights carry over, and position 0 is the furthest from position 8. the digit rows still have no letter to look for
- → back to the real, masked model. not luck: over all 11000 sequences the query puts 97% on the right digit, and for every query letter, the digit tagged with that letter wins (26 / 26, from layer 2's scores averaged by query letter × copied letter)
- name for it: K-composition (Anthropic, "A Mathematical Framework for Transformer Circuits"): a later head's key reads an earlier head's output. also Q- and V-composition. the main term is (query's token) × (layer 1's write), i.e. E Wq2ᵀ · Wk2 Wv1 Eᵀ
- honest caveat: that one term alone picks the right digit 83% of the time (a few letter pairs get confused, e.g. b and e). the small terms (the query's position, its own layer 1 write, the key's token and position) act as per-letter corrections: full score 100%
- this pair (a previous-token head feeding a matching head) is basically the induction head circuit, one of the best-known circuits in real llms

# 35-t2-value
- layer 2 is the last layer, so its value has a reader with labels: the unembedding. the same read as task 1's value slide (21e)
- every position's value through the unembedding: each digit's value says that digit (2, 5, 9, 3: 13.1, 14.9, 14.0, 11.7). the letters' values say junk digits, like task 1's (greyed: layer 2 only ever picks a digit, so their values never get copied)
- → scaled by the f's attention from the last slide (98% on the 5): everything else goes flat
- → that's the head's write into the f's stream: it says 5 (14.6). plus the rest of the f's stream (its token, position, layer 1's write), which barely votes → output 5, 100%
- not just this input: every digit's layer 2 value, measured on the real streams at value positions over the test set, through the unembedding, comes out as itself, at least 96%. the value reads the digit's own token; the key reads the letter layer 1 wrote. each reader picks its own piece of the same stream

# 37-t2-ablate
- same trained weights, one piece zeroed, test accuracy again
- without layer 1: 36%, nothing writes "after f". without layer 2: 30%, nothing goes looking. without positions: 45%, layer 1 can't find "one back"
- every piece does one step of the lookup. next: a task where copying isn't enough


# 40-t3-task
- the task, worked by hand like task 0's: a2f5c9d3fc → 4. four letter → digit pairs, then two query letters
- → queries f and c → each finds its key: f → 5, c → 9 → both digits to the end → add: 5 + 9 = 14, and 14 mod 10 = 4 (the answer is always one digit)
- → attention only stalls: 27% with one head per layer, 30% with two. attention can find both digits and bring them over, but nothing in it adds
- → by the plan: add one piece, an mlp after layer 2: 98%

# 42-t3-l1
- task 2's layer 1 slide, same reading. every digit looks one back (99.8–100%, test average)
- the new row is the last one: the c at q2 looks one back at the f at q1 (99.9%). same rule (copy the one before me), new use
- → digit rows tag each digit with its key, as in task 2. the last row copies f into the c's stream: the one stream layer 2 asks from now says c and f, both keys. the other rows write where nobody reads

# 42b-t3-l2
- task 2's layer 2 slide, the input on top. digits tagged with what layer 1 wrote; the last column too (+f)
- the c at the end: 48% on the 5, 51% on the 9. task 2's head picked one digit; this one splits evenly
- → the f at q1 (the row above): 100% on the 5 here, the right digit is its top pick on 97% of the test set (88% of its attention on average). that's task 2's lookup on its own: layer 1 wrote digits into the f's stream (87% of its layer 1 attention on digits), no letter, so it asks one question. the c's stream has two letters: two questions, two digits. only the last row is graded, so the f's lookup lands in a stream nothing reads
- other rows, if asked: the key rows here land on the digit just before them, but that's this example (over the test set k3 does it 35%, k4 29%). the digit rows mostly look at letters. nothing reads either
- → why the split: two questions from one stream. its token c matches the digit tagged c (+6.3), layer 1's copy f matches the digit tagged f (+6.4). each also pulls −2.0 from the other's digit. nearly equal, so softmax splits ~50/50. test averages (qk split, export_task3.py)

# 43-t3-mlp
- the streams after both attention layers (layer 1's tags, layer 2's "5 9" at the end). every arc so far crosses between positions: attention is the only thing that moves information from one stream to another
- → the mlp runs on every position with the same weights: (10, 32) → (10, 64) → (10, 32). each run reads only its own stream (32 numbers) and adds back into it (the green loops). no arcs between positions: it never sees the others. callback to 05d (the residual stream slide): mlp reads only its own stream
- → only the last position is graded, and the mlp is the last layer, so only its run matters; the other nine write into streams nobody reads (same as the other rows of every attention matrix). caveat: that's only because it's last. in gpt-2 the next layer's attention reads every position's mlp write, so those rows do real work there. so anything the mlp needs from other tokens, attention must already have brought: here the 5 and the 9
- → what's in that stream: the pair (a, b) explains 79% of its variation over the test set (ignoring order: 78%, so order barely matters, the 50/50 blend). the answer (a + b) mod 10 explains 0.9%. the 4 isn't in the stream; the mlp computes it
- → leaving the mlp (stream + the mlp's write), the answer explains 68%, per test sequence (the pair still explains 85%: the write adds, it doesn't erase). attention moves, the mlp computes: it writes a token nobody had

# 43a-t3-inside
- the whole mlp as matmuls, on all ten streams of a2f5c9d3fc, real weights (example.mlp in task3w.json). drawn like the q · k slide: a row of the left matrix times a column of the top one lands where they cross. no bias in this model
- up: x (10, 32) @ W_up (32, 64) → (10, 64). one number per position per neuron. column n of W_up is what neuron n looks for (next slide: its key)
- → relu: max(0, ·). negatives become exactly 0 (grey), positives pass unchanged. a neuron "fires" when positive. last row: 17 of 64 fire
- → down: (10, 64) @ W_down (64, 32) → (10, 32). each fired neuron adds its row of W_down times how hard it fired; silent ones contribute nothing (next slide: its value)
- → add: the write is added to the stream, like every attention write. 32 → 64 → 32 is what lets it go back in. 64 is 2× here; gpt-2 uses 4×
- → only the last row: the same weights ran on all ten rows, but no layer comes after and only the last position is graded, so rows 0–8 are never read (in gpt-2 the next layer would read them). from here on, the last row only: the 64 numbers of that row are the "relu" strip on the next slide

# 43c-t3-keys
- layer 2's head the way we've read every head since 21b: a query, keys, softmax, values
- → the mlp, same grammar, one change: the keys are memorized. column n of W_up is a fixed question asked of the stream (attention's keys come from the other positions' streams; these come from the weights). row n of W_down is the value: what gets added if it matched. geva et al. 2021, "transformer feed-forward layers are key-value memories"
- → on the example: attention's last row (10 live keys, 48% / 51%) next to the mlp's row: the stream · each of 64 keys, before the relu
- → relu vs softmax is the teaching point: softmax makes keys compete (one wins, the row sums to 100%). relu doesn't: every key that matches fires independently, and the ones that don't say exactly nothing. 17 of 64 fire here
- → so the hidden layer isn't "a wider stream". it's the answers to 64 yes/no questions, kept only long enough to add up their values and then thrown away. that's the "temporary expansion"

# 44b-t3-patterns
- the six most helpful neurons of the 64 (help = how hard it fires × how much more it votes for the right answer than its average vote, averaged over all 100 pairs × 100 sequences; export_task3.py). each a 10 × 10: row a, column b, how hard it fires (means over 100 random sequences per cell). orange box: our input (5, 9)
- a neuron reads the last stream, which holds half of each digit's value, so its input is score(a) + score(b) + bias (one score table per neuron, r² ≥ 0.997). it fires where a digit it likes meets another
- each neuron responds to sets of digits, not to an answer. r² of a neuron's firing over the 100 pairs (~/code/ml/interp, data/task3/neuron_summary.csv), median over all 64: explained by a 37%, by b 39%, by the answer (a + b) mod 10 only 7%. the mlp is a distributed lookup table, not one neuron per answer
- the clearest: n43 likes the odd digits (1 3 5 7 9, same for a and b), so it fires when both are odd (its r² for the answer is the highest of the six, 31%: odd + odd is always even). if asked about n51 (likes 0 4 5 9): those are digits, not an answer. 0+4 = 4 but 4+5 = 9 and 4+9 = 3, and it fires on all of them
- don't read single neurons' votes as "it says answer x": comparing each neuron's brightest cells with its top-3 votes only matches for some (n43, n51, n32 yes; n20, n3 no). what a neuron fires on is readable, what it writes is messy, only the sum is clean
- → the crowd: add up the votes (the mlp's write alone, digits only, per sequence), keeping only the k most helpful neurons. the 10 × 10 is where it's right (green). top 8: 23%, scattered. → top 32: 74%. → all 64: 97%, nearly every cell (16: 52%, 48: 91% on the bars). no small team does it; more neurons, more overlapping "one of these", and the right answer wins more cells

# 45-t3-relu
- the last row's 64 neurons on a2f5c9d3fc, with the relu (17 speak, the rest exactly 0) and without (all 64 speak, negatives included)
- without it, the two matmuls collapse: (x @ W_up) @ W_down = x @ (W_up @ W_down), one 32 × 32 matrix. a single linear read, the same kind as the unembedding before the mlp (11%). a sum of per-digit scores, with no term for the pair (the patches need the zeros)
- → measured: the trained model with its relu swapped for identity: 10%. retrained from scratch without a relu (train_task3_norelu.py, same seed, steps, data): 20%. attention only: 27%. with the relu: 98%

# 50-t4-order
- task 4: same input as task 3 (pairs, then the query f c), but first value minus second, mod 10: f → 5, c → 9, (5 − 9) mod 10 = 6. swapped it'd be 4: order matters now. ~/code/ml/interp task4.py; export_task4.py reads its csvs
- → the task 3 model (2 layers, 1 head each, plus the mlp), retrained on the difference: 42%. on the sum it got 98%
- → why: its last head makes one lookup, one softmax, one weighted average. task 3 only worked because order didn't matter: the stream held half of the 5 and half of the 9 (47% / 47%), and for a sum that's all the information needed. on the difference half of each can't say which came first, so it takes only c's value and guesses the rest. on this input: 100% on the 9, nothing on the 5, and it answers 4 (wrong). over the test set: 98% on the second value
- if asked: it's seed-dependent. 4 of 9 seeds find a lopsided 30% / 66% blend, which does say which came first, so the mlp untangles it: 89–97%, never 100%

# 51-t4-heads
- the reasoning: one head is one lookup. we need two lookups that stay apart: "what's f's value?" and "what's c's value?". two ways: a second layer does them one after the other, or a second head does them side by side in the same layer
- → two heads in layer 2, each with its own query (its own W_q, W_k, W_v): on this input, head 2 puts 100% on the 5 and head 1 99% on the 9, and it answers 6 (test averages: 99% and 94%). both digits arrive separately, in order (probes after layer 2: 100% each), and the mlp subtracts them
- → what lands in the stream: there's no output projection here, each head writes W_V·(its weighted values) straight into the stream and the heads' writes are summed (model.py). one head: ½ W_V v(5) + ½ W_V v(9), symmetric, swap the digits and the stream is identical. two heads: W_V2 v(5) + W_V1 v(9), different matrices, so the two digits land in different directions and swapping changes the stream. measured: a linear probe for the first value after layer 2 gets 53% on task 3's one-head model (it can see a 5 and a 9, not which was first), 100% on task 4's two-head model
- → the proof: same task, same layers and mlp, only a second head: 42% → 100% (6 of 6 seeds). that's multi-head attention, the last piece
- if asked: without the mlp, 2 heads get 20% (heads fetch, the mlp computes). a third one-head layer also gets 100%: heads do lookups side by side, layers one after another

# 52-t4-spare
- the two-head model gave layer 1 two heads as well. its full attention on a2f5c9d3fc, both heads (rows: who's looking, columns: at whom)
- head 1 has a job: each digit looks one back at its letter (100%), the tagging from task 2, so layer 2 can find "the digit after f". the last c looks at the f (80%), as in task 3
- head 2 is smeared: no row commits to anything in particular
- → knockouts (~/code/ml/interp data/task4/ablation.csv): without layer 1's head 2, 95%. without head 1, 21%. layer 2 needs both its heads (without either: 15% / 24%)
- the intuition: heads are a budget, not a guarantee. training uses what it needs and leaves the rest nearly idle; that's normal in big models too (many heads can be pruned)
