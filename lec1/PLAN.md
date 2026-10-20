# lec 1: assembly → the cpu → gpt-2

90 minutes, beginners. requested: assembly programs, cpu execution, llm architecture.

**format: live code, slides interleaved.** the editor is the main screen. the decks are pictures you
pull up for the things code can't show: real weights and activations, what a token is, twelve heads going
through one matmul, a loop running through a pipeline. press `g`, type the number, enter, then back to the editor.

the thread: a computer is a dumb loop over numbers in memory. write it by hand, see what the chip does to
run it fast, then see that gpt-2 is the same loop with learned numbers.

## before class

```sh
cd lec1/gpt-2-arch/impl && ../../../../ml/.venv/bin/python live.py   # once, caches the kernels. ~10 s per run after
cd lec1/risc-v/slides && bun run build && bun run preview --port 4321      # offline
cd lec1/gpt-2-arch/slides && bun run build && bun run preview --port 4322
cd lec2/os && ./rv.sh run examples/04_loop.s && ./compile.sh compiled/sum.c && ./rv.sh run compiled/sum.s
```

live assembly goes in `lec2/os/examples/live.s` (needs `syscalls.inc` next to it). `ebreak` dumps all 32 registers, `*` on what changed.

sticky note for gpt-2: `768` wide · `12` heads × `64` · mlp `4×` · vocab `50257` · `12` blocks · hf stores W as in×out, so it's always `x @ W + b`

## 0:00 hook (3 min)

run `live.py` with a prompt from the room. "by the end you'll know what the cpu did to produce that, starting from one instruction."

## 0:03 assembly programs (25 min) · `risc-v/` deck

| pull up | code | say |
|---|---|---|
| 2 two things, 3 isa, 4 registers | `li t0, 40` · `addi t0, t0, 2` · `ebreak`. run | a cpu is dumb: read the instruction at pc, do it, pc += 4. 32 registers is all it has |
| 5 cpu loop, 6 arith, 7 memory, 8 branch | | no flags register: compare and branch is one instruction. `ld`/`sd` are the only way to touch memory |
| 9 loop | write `sum = 1..10` by hand (= `examples/04_loop.s`) with an `ebreak` in the loop. **ask first: how many dumps?** run | watch t0 and t1 tick |
| 10 loop running | `./compile.sh compiled/sum.c`, read the asm next to the C | the compiler deleted `i` and walks a pointer. same loop you just wrote |
| 11 ilist | | don't read it. "it fits on one slide" is the point |
| 12 call/ret, 13 stack · *if ahead* | `examples/05_functions.s`. **ask: what if fact forgets `sd ra`?** delete `sd ra` and `ld ra` (keep the `2:` label), run | tested: no hang. the emulator stops: ra → fact+0x20, "load from 0x80000000: nothing is there. did you pop more than you pushed?" |

## 0:28 cpu execution (15 min) · `risc-v/` deck

slides only. everything is about the sum loop they just wrote.

| slide | say |
|---|---|
| 14 bytes | instructions are just bytes. the first bytes of hello, as the cpu sees them |
| 15 inside a cpu | one `add` start to finish. with one instruction in flight nearly everything is idle |
| 16 pipeline | 20 cycles → 8. the compiler put the addi between the ld and the add because it knows the pipeline. branches get guessed |
| 17 out of order | the ld misses; addi and bne don't need it, so they go. results commit in order: "as if" is the contract the isa keeps |
| 18 cache lines | ask for a[0], get a[0]–a[7]. one miss then 7 free loads. data you use together should sit together |
| 19 what we covered | 30 seconds. "now the same loop, with learned numbers" |

not today: rename, hierarchy numbers, eviction / write-back, mesi, anything from os. say "part two" once and move on.

## 0:43 gpt-2 (40 min) · `gpt-2-arch/` deck

type attention only. the rest of `gpt-2-arch/impl/live.py` is pre-written: scroll it, don't type it.

| min | pull up | code | say |
|---|---|---|---|
| 0:43 | 2 model, 3 loop | show `generate` | whole sequence in, one token out, append, repeat. argmax of the last row |
| 0:47 | 4 tokens, 5 embed | show `gpt2`: `wte[ids] + wpe[:S]` | a token id is a row number into a 50257 × 768 table. position is another lookup, added |
| 0:51 | 6 block | show `block` | the residual stream: every sublayer reads a normalized copy and *adds*. nothing overwrites x |
| 0:55 | 7 one head (4 lines), 8 scores, 9 weighted | **type `one_head`**: `q @ kᵀ / 8`, softmax, `@ v`, for (S, 64) | q = what i'm looking for, k = what i have, v = what i hand over. real numbers from block 10 head 7: " to" puts 0.58 on " Mary" |
| 1:05 | 10 twelve heads one matmul, 11 batched | **type `attention`**: `c_attn` → split → python loop over 12 column slices of 64 → then `reshape(S, 12, 64).transpose(0, 1)` and the *same* `one_head`. run `--check` | the 768 × 768 is 12 W_Q side by side. `@` only touches the last two dims; the 12 rides along. that's the whole trick |
| 1:13 | 12 mask | **ask first: what breaks without it?** add the `-inf` triu, run `--no-mask` | "gave a drink to drink the store to drink the store" |
| 1:17 | 13 mlp, 14 next token | show `mlp`, final `@ wte.T` | mlp is per token, no mixing. unembed with the embedding matrix |
| 1:20 | | run it. prompt from the room | |

## 1:22 close (3 min)

`logits = x @ wte.T` is 50257 × 768 multiply-adds. that's the sum loop from the first half, and risc-v slide 18 is why it's fast when the rows are contiguous. same machine, top to bottom.

## 60 minute slot

asm 20 (stop after slide 10), execution 8 (15, 16, 18), gpt-2 30 (skip 4/5 and 13, say them in a sentence), hook and close as above.

## running long

in order: drop 12/13 call and stack · drop 17 out of order · don't type `attention`, show it and run `--check`.

## cut

`risc-v/_cut/` (encodings, inlining, strings, heap, frames, sections, hello, rename, hierarchy, cache levels) and
`gpt-2-arch/_cut/` (config, position circles, layernorm, logit lens, rerun, kv cache, prefill vs decode, all 144 heads,
what changed since). each is a `mv` back into that deck's `slides/src/slides/` with a number that puts it where you want.
speaker notes for every slide are in each deck's `slides/src/slides/notes.md`, keyed by filename.
