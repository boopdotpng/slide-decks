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

