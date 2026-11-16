# 01-title

**booth runbook**

- start: `cd ai-day/blackhole/slides && bun run dev`, open http://localhost:4321, press `f` for fullscreen
- `→` / space: next · `←`: back · `g`: grid of every slide (jump straight to a backup) · `t`: light / dark theme · `p`: this notes window
- when nobody is being walked through: come back here (`home`). this slide is the idle screen
- no laptop / dev server? use the pdf export (open the deck with `?print`, cmd+p, save as pdf)
- every number on the slides lives in `src/facts.json`. if the demo gets rerun and the speed changes, edit it there

**say:** this is project blackhole. the demo on the other screen is a chat model running on an open-source ai chip, plugged into a mac. want to see how that works?

# 02-what-you-saw

**say:** that chat you just saw isn't running on the mac's own chip, and it isn't in the cloud. it's running on this tenstorrent card, a $999 ai accelerator, over a thunderbolt cable. until now the card only worked on linux; we got it running on macos.

**step 1** labels the card, the enclosure and the laptop.

**likely questions**
- *what's a token?* a piece of a word, about ¾ of one on average. 146 tokens a second is over 100 words a second.
- *how big is the model?* llama 3.2 1b: about a billion numbers (weights). small, but a real chat model.
- *is it using the mac's gpu?* no. the mac only sends commands; all the math runs on the card.

**sources:** booth terminal screenshot (145.9 tok/s, 6.85 ms/token, 0.86 s startup); $999 list price from the cair blackhole deck.

# 03-problem

**say:** nearly all ai today runs on gpus from one company, through a deep, mostly closed software stack. pytorch makes ai easy, but almost nobody, students especially, sees what's under it.

**step 1** names the hidden layers: graph compiler, kernel library, runtime and driver.

**likely questions**
- *isn't cuda free?* free to use, but the stack under it is closed and only targets one vendor's hardware.

**sources:** general industry framing, kept qualitative on purpose (no market-share number on the slide).

# 04-asics

**say:** a gpu is a general tool that started out drawing graphics. an asic is built for one job; for ai, that job is multiplying big grids of numbers. this card has 120 ai cores and 28 gb of memory for $999, with matrix math in the same class as an rtx 5090, and everything above the chip design is open source.

**step 1** zooms into one core: its own 1.5 mb memory, a matrix engine, a vector engine and five tiny risc-v cpus.

**likely questions**
- *is it faster than nvidia?* at raw matrix math it's comparable to an rtx 5090. its weak spot is memory speed (448 gb/s of gddr6), which limits how fast it can generate text.
- *what's open source exactly?* the driver, firmware, low-level kernels, runtime and compilers. only the chip's circuit design (verilog) and a few small third-party firmware blobs aren't.

**sources:** cair blackhole deck appendix 1 (120 cores, 28 gb, 448 gb/s, $999); "tenstorrent blackhole architecture guide" (anuraagw.me, feb 2026): ~5090 matmul, 1.5 mb l1, 5 risc-v cores, open above the verilog.

# 05-software-catch

**say:** the hardware is great; programming it is the hard part. the official stack is many layers deep, runs only on linux, and even one math operation means writing three separate programs by hand.

**likely questions**
- *why three programs?* data comes in, gets computed, goes out, and each step runs on its own small cpu inside the core. the toolchain turns your three files into five programs.
- *why 32 × 32?* the hardware works on fixed-size tiles of numbers. anything else is padded to fit.

**sources:** architecture guide (three kernels per op, 32 × 32 tiles); tt-kmd is a linux kernel module.

# 06-mac

**say:** blackhole-py replaces most of that stack with a few readable files. on the mac there's no tenstorrent driver at all, so we forked tinygrad's open-source macos gpu driver to just connect the card to python, and wrote about 350 lines of python to do the rest of the linux driver's job. the model code didn't change at all, and a laptop over thunderbolt is within about 10% of a full linux desktop.

**step 1** highlights the two new pieces: the python driver layer and the macos driver.

**likely questions**
- *what does the mac driver actually do?* it claims the card, maps its memory into python, gives the card memory it can copy into, and passes messages to the chip's management core. everything else is python.
- *why is the desktop faster?* most likely a different card (p150a, 8 memory banks vs 7) and a direct pcie slot instead of thunderbolt.

**sources:** blackhole-py `macos` branch @ 668e57b: `system_darwin.py` (356 lines), `ttgpu-dext/README.md`; readme performance table (p150a 1b bf16: 161.0 tok/s).

# 07-learning

**say:** the project is about learning both halves: how ml models work inside, and how computers and this chip actually compute. the synthesis is compilers: software that turns a model into code this chip runs. you don't even need the card to start; a simulator runs a virtual one.

**sources:** cair blackhole project deck and interest flyer.

# 08-next

**say:** next we keep building out the software stack: a compiler for whole models, more operations, and making it faster. the qr code is the code behind the demo.

**sources:** qr points to github.com/boopdotpng/blackhole-py/tree/macos.

# 09-inside-a-core

backup, for anyone who wants depth. reach it with `g`.

**say:** each core is an assembly line. one small cpu reads data in, one unpacks it into the math engines, one drives the math, one packs results, one writes them out. all five work at once on different blocks, passing data through 1.5 mb of fast local memory. there's no cache anywhere on the card.

**sources:** architecture guide (ncrisc / trisc0-2 / brisc roles, 1.5 mb l1, no cache, sfpu ~64× slower than the fpu).

# 10-one-token

backup.

**say:** llama 3.2 1b has 16 layers. one token is an embedding lookup, then 5 kernels per layer, then scoring every possible next token and picking the best: 83 launches. they're recorded once as a graph, the mac sends one replay command per token, and the answer is written straight back into the mac's memory.

**steps 1–3** reveal the three facts at the bottom.

**sources:** `kernels/llama3-1b-p100a/manifest.json` (8 programs, up to 88 cores, 83 launches); `llama3.py` (graph replay, argmax writes to host memory).

# 11-rmsnorm

backup.

**say:** writing kernels by hand is about deciding where each piece of work runs. rmsnorm needs a sum and a square root, which only the vector engine can do. but multiplying by the weights doesn't depend on the sum, so it can move to the matrix engine and run alongside. that alone saves about 11%; tuning how instructions are issued gets it to 32% fewer cycles.

**sources:** "intro to kernel writing on blackhole" (anuraagw.me, sep 2026): 1,471 → 1,306 → 996 cycles for a 2048-element rmsnorm.
