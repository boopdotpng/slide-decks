# 01-title

- the promise: models small enough that we can **read what they learned straight off the weights**, then map each piece onto gpt-2
- no frameworks, no tensor tricks: everything is a lookup, a dot product, or a sum

# 02-embed

- a token is just a row number. embedding = **pick that row** of a 36 × 32 table
- step 1: our input only uses 8 of the 36 rows (f appears twice)
- step 2: stack one row per position → X, 9 × 32. this matrix is the thing everything else reads and adds to
- step 3: **same token → same row**: both f's start out identical. anything that tells them apart has to be added later

# 03-resid

- the core picture for the whole talk: **one stream per position, and every layer only adds to it**
- step 1: attention at one position pulls from some earlier streams. which ones isn't fixed: it's learned, and it depends on the input
- step 2: all positions do this at once, one matmul. each reads only earlier streams (the mask, slide 15)
- step 3: the mlp is the opposite: **each position on its own**, no reading across
- say it plainly: **attention moves information between positions, the mlp computes on what's already there**
- step 4: only the last stream gets turned into 36 scores
- step 5: nothing is ever overwritten, so later we can take a stream apart into who wrote what

# 04-tasks

- one row at a time; each task is built so the previous network fails it
- point out: tasks 0 and 1 are the **same task**. the only change is the network
- the plan box is the method for the rest of the talk: smallest network → it fails → add one piece → retrain → read the weights

# 05-training

- step 0: 10,000 random training strings, 1,000 test strings it never trains on: test accuracy means it learned the rule, not the examples
- step 3: loss = −log p(answer). anchor the two numbers: guessing 1 in 10 = 2.30, 99% sure and right = 0.01. those come back on the loss charts
- step 5: the gradient only reaches weights the forward pass used. **with no layers, only the last position is ever read**: the 7's embedding gets no gradient at all. this is why task 0 fails
- step 6: nudge, repeat. that's all training is

# 06-graded

- gpt grades every position (predict the next word everywhere). for us the next character is random, so grading it would just add noise
- so we grade **only the last position**. this matters later: only the last row of every attention matrix counts

# 07-params

- the knobs are the same as gpt-2's, only smaller. don't read out every row
- worth saying: emb_dim 32 is the width of the stream; n_layers grows 0 → 2 over the tasks; position embeddings only show up in task 2
- the punchline is the last row: **124M vs ~19k**. small enough to look at every weight

# 08-t0-task

- the easiest possible task: one digit among letters, output the digit
- step 2: **only the last position answers**, so the 7 has to get to the last stream somehow. ask the room how, with no layers

# 09-t0-net

- with no layers: embed the last token, unembed it, pick the top score
- the last token here is "a". the output can only depend on "a": the 7 never reaches the last stream

# 10-t0-loss

- step 1: 3.58 = clueless over all 36 tokens
- step 2: it drops to **2.30 = an even guess over the 10 digits** and stays there
- step 3: what it learned: "the answer is a digit" (letters ~0, each digit ~10%). that's the most it can learn from the last letter alone

# 11-t0-unembed

- unembedding = 36 dot products of the last stream with the rows of U, one score per token
- step 2: letters score low, digits high and about equal: all it learned is "answer with a digit". the caption's second half is slide 5's backward pass paying off: **only the last token gets a gradient, and a digit is never last**, so the digits' embeddings never trained at all
- step 3: it outputs 4 here, more or less at random among the digits. **the last position never saw the 7**
- this is the setup for attention: we need a way to move information between positions

# 12-t1-net

- one change: a single attention head between embed and unembed. same task, same data
- no position embeddings here: "which one is the digit" doesn't depend on where it is

# 13-t1-loss

- straight down to ~0, well under the 2.30 floor from task 0. **one head is enough**
- now the interesting part: what did it learn? next 4 slides

# 14-t1-reads

- step 1: Q, K, V are three 32 × 32 matrices applied to **every row separately**. no row sees another yet
- the three roles: query = what I'm looking for, key = what I offer, value = what I pass on if I'm picked
- step 2: each one only means something through what reads it: queries through keys, values through the unembedding
- step 3: every letter's query is almost the same vector (similarity ~1): **every position asks the same question**

# 15-t1-scores

- the walkthrough of attention, one step per click. go slowly, this is the formula for the rest of the talk
- step 1: one cell = one dot product: a's query · 7's key = 32.7
- step 2: Q Kᵀ does all 81 at once
- step 3: divide by √32 so softmax doesn't saturate
- step 4: the mask: a position can't look ahead (gpt: "cat" can't see "sat")
- step 6: softmax per row → attention, each row sums to 100%
- step 7: every row that can see the 7 puts ~100% on it. rows above the 7 can't see it, so they spread out
- step 8: **only the last row is graded**, but every row learned to find the 7, because they all share the same weights

# 16-t1-ask

- a's query scored against every possible token's key, sorted
- step 1: **every digit beats every letter**, for all 26 letters' queries. the query is asking "is this a digit?"
- the head finds the digit by **what it is**, not where it is

# 17-t1-value

- the 7's value, read through the unembedding: it votes for 7 (11.4)
- step 2: attention is 100% on the 7, so the head's write ≈ the 7's value → output 7
- step 3: same check for every digit: each one's value says itself. **the head is a copier**
- if asked how to measure "copying" without eyeballing it: the copying score, roughly the normalized trace of this 10 × 10 matrix. not needed here, the picture shows it

# 18-t1-recap

- the two halves of a head: **QK decides where to look, V decides what to bring back**
- step 2: write = A X W_V. A mixes positions, W_V transforms the 32 numbers; they're independent, so order doesn't matter
- step 3: the bridge to task 2: a head can only find what's **already written** in a stream, but what it writes can be found by a later head

# 19-t2-twice

- dictionary: four letter → digit pairs, then a letter. output its digit
- the small numbers under each token are positions (0–8). on these slides "key" and "value" always mean attention's; the dictionary's are just letters and digits
- step 1: layer 1, by place: each digit copies the letter just before it. the 5's stream now says "5, after f"
- step 2: layer 2, by content: the last f looks for the stream that says "after f" and copies its digit
- step 3: each layer is just task 1's head. step 2 is only possible because step 1 wrote the tag

# 20-t2-one-layer

- why one layer can't: before any head runs, nothing in the 5's stream says "after f"
- step 1: 39%: it finds *a* digit, not *the* digit. better than a blind pick among the four (25%)
- step 2: a second head in the same layer reads the same streams: same problem (38%)
- step 3: a second layer reads what the first wrote: 100%. **depth = reading earlier writes**

# 21-t2-pos

- step 0: task 1 didn't care where the 7 was
- step 1: task 2 does. but attention by itself treats the earlier streams as a bag: shuffle them and the scores shuffle along
- step 2: fix: a second learned table, one row per position, added in: x = tok + pos. now "the one just before me" is something a query can ask for
- step 3: without positions, 47%. likely question: **why above chance with no positions?** the causal mask leaks some order: each position sees a different number of earlier tokens. no positions and no mask: 37%

# 22-t2-l1

- trained model, layer 1 attention. read the digit rows: **each digit looks one back**, at its letter (92–97%)
- the letter rows are messy; nothing reads them, so it doesn't matter
- step 1: split each score into the part from the key's position and the part from its token. **position does the work, token barely matters**

# 23-t2-write

- layer 2: each digit's stream now carries a tag (+f under the 5) from layer 1
- the last f's query finds the +f: 98% on the 5
- over the test set: 97% on the right digit, for all 26 letters

# 24-t2-value

- the key matched on the **tag**, but the value still says the **digit**: different weight matrices read different parts of the same stream. worth a sentence, it's the subtle point
- step 1: multiply by attention: only the 5 survives
- step 2: the write says 5 → output 5

# 25-t3-task

- two query letters at the end; output their digits added **mod 10** (so the answer stays one token)
- step 3: attention only: 27% with one head, 30% with two. attention can fetch both digits, but **nothing in attention adds**: it only takes weighted averages
- step 4: one new piece, an mlp after layer 2: 98%
- likely question: why didn't two heads help? the problem here isn't finding, it's computing

# 26-t3-l1

- step 0: same as task 2's layer 1: every digit looks one back at its letter
- step 1: new: the last c looks one back too, at the f. **its stream now holds two letters, c and f**. point at that cell: the next slide depends on it

# 27-t3-l2

- probably the most confusing slide; go slow
- the last stream holds **two letters**: its own token c, and the f layer 1 copied in
- so its query asks two questions at once: the 9 matches "c", the 5 matches "f"
- step 1: the two matches are about the same size (6.3 vs 6.4), so softmax splits ~50/50
- result: the write is **half the 5's value + half the 9's value**. it has both digits, not their sum

# 28-t3-mlp

- step 0: read the last stream right before the mlp with the unembedding: 11%, chance. the stream has 5 and 9 in it, not 4
- step 1: the mlp's write by itself gets 98%. **attention moved, the mlp computed**
- connects back to slide 3's split

# 29-t3-inside

- up: 32 → 64 numbers, one per neuron (a matmul, every row separately)
- relu: negatives → 0. a neuron "fires" if positive: 17 of 64 here
- down: each firing neuron adds its own row of W_down
- step 3: added back into the stream: x ← x + relu(x W_up) W_down
- step 4: only the last row is graded, so from here on only the last row

# 30-t3-patterns

- each grid = one neuron, over every pair of digits (a, b). □ marks (5, 9)
- **neurons fire on sets of digits, not on answers**. none of them alone knows the sum
- step 1: together they get it: keep the top 8 → 23%, top 32 → 74%, all 64 → 97%. the answer is spread over many neurons

# 31-t3-relu

- without the relu the two matmuls collapse into one linear map, and a linear map of the average can't do mod-10 addition
- step 1: take relu out of the trained model: 10% (chance). retrain without it: 20%
- likely question: why is 20% worse than attention-only's 27%? don't read into it: both fail. the point is that **the nonlinearity is what computes**

# 32-t4-order

- difference = first minus second. swap the two values: the sum stays the same, the difference doesn't
- step 1: task 3's head writes ½·5 + ½·9, which is the **same stream for both orders**. it can't tell which came first
- step 2: retrained on the difference: 42%. a blend can't tell a − b from b − a, so the best it could do is ~60% (always right when the digits are equal or 5 apart, a coin flip otherwise)

# 33-t4-heads

- step 0: two heads in layer 2: one finds f's value, the other c's. each write stays separate
- step 1: swap the values, and now the stream changes, because "the 5 from f's head" ≠ "the 5 from c's head"
- step 2: the only change is a second head: 42% → 100%. **that's what multi-head attention is for**: separate lookups whose writes don't blur together

# 34-gpt2-roles

- every piece we built exists in gpt-2, just 12 × 12 of them
- head = one lookup; parallel heads = lookups that stay apart; layers = a lookup reading an earlier write; mlp = per-position compute
- gpt-2 detail: its heads work in 64 dims, so one more matrix (W_O) maps the 12 × 64 back up to 768. only needed if someone asks or builds it
- name-drop: induction heads (5.5 / 6.9) are task 2's two-step circuit

# 35-gpt2-changes

- what's harder at scale: every position is graded, nobody hands out jobs, neurons do many unrelated things (more features than dimensions), knockouts are blunt (backup heads)
- end on the last row: **the circuits are still there**, and the tools are the ones we used: knock out, probe, read QK and V
- if they want to build gpt-2 next: what's missing is layernorm, gelu, biases, bpe tokens, tied embeddings. small pieces around the same structure
