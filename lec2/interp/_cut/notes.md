# 06c-net
- the smallest possible model: no layers at all. input → tokenize → embed → unembed → sample
- every position gets its token's 32 numbers, but only the last position is read: 36 scores, pick the highest
- nothing moves between positions. keep that in mind for how well it can do on the lookup

# 06d-unembed
- the unembedding is the other half of task 0's network: a second learned table, (36, 32), separate from the embedding
- real weights from the no-layer model (section0.py). with no layers the last stream is just f's embedding
- → one score = one row · the stream: 32 products, added up
- → all 36 rows: letters come out low, digits high. training already learned "the answer is a digit"
- → highest score wins: 9. (the right answer was 5. why it can't do better is the next few slides)

# 20-task-digit
- one digit, anywhere, among letters. the model has to find it by what it is, not where it is
- → spot it. → copy it to the last position
- (not trained yet)

# 07-task-lookup
- keys are four distinct letters, values are digits 0–9, then the query key
- → the query is the last token. → blue arc: look back for the key f. → green arc: copy the digit after it to the end
- the hard part, for later: "the digit after f" is a fact about two positions

# 40-task-sum
- same four pairs, two different query keys
- → two queries. → look up both keys. → bring both values to the end. → add them, mod 10
- for later: attention can fetch both values, but adding them is a new token nobody wrote

# 50-task-diff
- same input as the sum, but first minus second, mod 10
- → → → same three steps as the sum. → (5 − 9) mod 10 = 6. swapping the queries gives 4: order matters now, it didn't for the sum

# 10-pos
- gpt-2's learned position table (1024 × 768). ours is 9 × 32 (10 for the two-key tasks)
- → a few of its columns against position: smooth waves, learned, not designed
- → cosine similarity between positions: nearby positions look alike
- → x = tok_emb + pos_emb. position isn't a separate input, it's just added into the same vector

# 14-resid-real
- real numbers: the 2-layer, attention-only lookup model on a2f5c9d3f (export.py; it gets 100% on random lookups). red positive, blue negative, same color scale everywhere
- step 0: x₀ = tok_emb + pos_emb, 32 numbers per row
- → layer 0's head adds a row of its own to every position. the "→" is where that position's head looked hardest: the digits look one back at their key (2 → a, 5 → f, 9 → c, 3 → d). why that's useful comes later
- → layer 1 adds again. the last position looks at 5 with 0.98
- → unembed reads only the last row: 5 at 99.97%

# 15-t0-table
- split by the last letter, the only thing the network sees. no letter favours any digit
- the spread (0.07–0.14) is noise: the last letter has nothing to do with the hidden digit

