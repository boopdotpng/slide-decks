# 01-title

**booth runbook**

- start: `cd ai-day/blackhole/slides && bun run dev`, open http://localhost:4321, press `f` for fullscreen
- `→` / space: next · `←`: back · `g`: grid of every slide (jump straight to any slide) · `t`: light / dark theme · `p`: this notes window
- when nobody is being walked through: come back here (`home`). this slide is the idle screen
- no laptop / dev server? use the pdf export (open the deck with `?print`, cmd+p, save as pdf)
- every number on the slides lives in `src/facts.json`. if the demo gets rerun and the speed changes, edit it there

**say:** this is project blackhole. the demo on the other screen is a chat model running on an open-source ai chip, plugged into a mac. want to see how that works?

# 02-what-you-saw

**say:** that chat you just saw isn't running on the mac's own chip, and it isn't in the cloud. it's running on this tenstorrent card, a $999 ai accelerator, over a thunderbolt cable. until now the card only ran in linux desktops and full pcs; we got it running on a macbook.

**step 1** labels the card, the enclosure and the laptop.

**likely questions**
- *what's a token?* a piece of a word, about ¾ of one on average. 146 tokens a second is over 100 words a second.
- *how big is the model?* llama 3.2 1b: about a billion numbers (weights). small, but a real chat model.
- *is it using the mac's gpu?* no. the mac only sends commands; all the math runs on the card.

**sources:** booth terminal screenshot (145.9 tok/s, 6.85 ms/token, 0.86 s startup); $999 list price from the cair blackhole deck.

# 03-problem

**say:** nearly all ai today runs on nvidia gpus. pytorch, the library everyone uses, is open source, but almost everything under it is closed: the compiler that makes machine code, the math libraries, the runtime, the firmware, even the instruction set isn't documented. *(step)* amd is much better: its whole software stack, rocm, is open source, the instruction set is documented, and tinygrad goes further, running amd gpus with none of rocm at all, just its own compiler and a python driver. only the firmware is still locked. *(step)* this card is the other way around. every layer is open source except the circuit design, which nobody publishes. it's an asic, a chip built for one job, multiplying big grids of numbers: 120 ai cores and 28 gb of memory for $999, with matrix math in the same class as an rtx 5090. it's the most open ai chip you can buy.

**step 1** brings in amd (to the left of nvidia). **step 2** brings in tenstorrent and the card's specs.

**likely questions**
- *isn't cuda free?* free to use, but the stack under it is closed and only targets nvidia hardware.
- *nvidia's driver is open source now, right?* the linux kernel modules are (since 2022), hence the one green box. the user-space driver (libcuda), the cuda runtime, cublas / cudnn and the gpu's firmware are still closed.
- *what about torch.compile / triton?* those are open and generate kernels, but nvidia's ptxas (closed) still turns them into machine code, and they run on the closed runtime.
- *so why not just use amd?* amd is a great second choice and tinygrad proves it. but its firmware is signed blobs, and on the official stack you still need rocm on linux. tenstorrent opens the firmware too, and the card was built for ai from the start.
- *what does tinygrad do on amd?* it generates amd machine code itself (tinygrad/renderer/amd) and drives the gpu from python (tinygrad/runtime/support/am), loading only amd's firmware. it's the same idea as blackhole-py, and our mac driver is a fork of tinygrad's tinygpu driver.
- *"mostly open" firmware?* tt-system-firmware is open; a few small third-party pieces in it are binary blobs.
- *is it faster than nvidia?* at raw matrix math it's comparable to an rtx 5090. its weak spot is memory speed (448 gb/s of gddr6), which limits how fast it can generate text.
- *what's inside a core?* 1.5 mb of its own memory (a scratchpad, no cache), a matrix engine, a vector engine and five tiny risc-v cpus: one reads data in, three drive the math (unpack, math, pack), one writes results out.

**sources:** amd: github.com/ROCm (llvm amdgpu, rocblas, miopen, hip, rocr), amdgpu / amdkfd in linux, amd's published rdna / cdna isa guides; tinygrad @ 7dd8c6f (renderer/amd, runtime/support/am loads psp / smu / sdma / mec firmware blobs). nvidia: open-gpu-kernel-modules (2022); cuda toolkit, cublas, cudnn, gsp firmware are closed / binary-only; sass encodings undocumented. tenstorrent: github.com/tenstorrent (tt-mlir, sfpi, tt-metal, tt-umd, tt-kmd, tt-system-firmware, tt-isa-documentation). card: cair blackhole deck appendix 1 (120 cores, 28 gb, 448 gb/s, $999); "tenstorrent blackhole architecture guide" (anuraagw.me, feb 2026): ~5090 matmul, 1.5 mb l1, 5 risc-v cores.

# 04-software-catch

**say:** so how do you actually program it? this is every repo on tenstorrent's github that sits between a model and the card: 163 repos in the org, 28 archived. there are several ways in from pytorch, some already dead, four different libraries that talk to the card, and the first build from source, dependencies and all, takes around 40 minutes. all of it kind of works, with footguns everywhere, and all of it is linux only.

**step 1** lights up the path tenstorrent's own readmes recommend for pytorch: pytorch → tt-xla (with their pytorch-xla fork) → tt-mlir → tt-nn → tt-metalium (kernels built with sfpi, their gcc fork) → tt-umd / tt-kmd → card. 6 of their repos + 2 forks before you write any code of your own.

**step 2** stamps it: everything kind of works.

**the counts** (8 dead, 11 forks) are computed from the chips on the slide. the green box is the contrast: our whole path is llama3.py → blackhole-py → card. the kernels it runs come from our own python kernel generator (blackhole-py-old, examples/llama3/kernels.py + asm.py), exported as assembly: no tt-metal, no sfpi.

**likely questions**
- *what are the purple ones?* their own forks of upstream projects that the stack depends on: pytorch-xla (tt-xla's pytorch path), tvm (tt-forge-onnx), torch-mlir (tt-torch), gcc + binutils (sfpi: the risc-v compiler that builds every kernel, plus the c++ interface for the vector engine), zephyr (firmware), open mpi (multi-host), qemu (ttsim), tracy (profiler), and a vllm fork that's now deprecated in favor of a plugin.
- *which one should i use?* tenstorrent currently points pytorch and jax users at tt-xla (through tt-mlir to tt-nn and tt-metalium). tt-torch and pytorch2.0_ttnn are deprecated, tt-buda is archived.
- *why five programs per op?* each core has five small cpus, each running its own program: one reads data in, three drive the math (unpack, math, pack), one writes results out.
- *no cache?* each core's 1.5 mb "l1" is a plain scratchpad. kernels copy data between gddr6 and l1 themselves. there's no cache.

**sources:** `gh repo list tenstorrent` (2026-11-16: 163 repos, 28 archived); readmes: tt-torch and pytorch2.0_ttnn "deprecated", tt-llk "frozen, moved to tt-metal", tenstorrent/vllm "deprecated, will be archived", luwen "deprecated" per tt-smi --help; tt-buda, tt-budabackend, tt-llk-bh, tt-firmware archived. ~40 min builds and "kind of works": our experience.

# 05-lines

**say:** and it's big. 2.4 million lines of source across the official stack, not counting tests or model demos: tt-metal alone is 1.7 million, and it has another 1.8 million lines of tests. one matmul file is over 6,000 lines. the part of blackhole-py that replaces the bottom of that stack, the runtime and the mac driver, is about 3,000.

**step 1** shows the blackhole-py line.

**likely questions**
- *how did you count?* non-blank lines in git-tracked source files (c/c++/python/rust/tablegen/asm/cmake), leaving out tests, docs, third-party code and submodules, from each repo's main branch (late oct to early nov 2026).
- *isn't that unfair to blackhole-py?* it does one thing (llama decode on blackhole). its kernels come from our own python generator in an earlier prototype (blackhole-py-old), exported as assembly (~75k lines); neither is counted. that generator is the seed of the kernel language on the last slide. the point is how little you need underneath, not that it replaces all of tt-metal.

**sources:** facts.json `loc` (counting script: /tmp/loc/count.py).

# 06-deps

**say:** and those 2.4 million lines are only tenstorrent's own code. to build the recommended pytorch path you also pull in 34 other projects' c++ libraries, 15 pinned python packages including their own build of torch-xla, and tt-mlir builds its own copy of llvm from source: another 5 million lines, pinned to one exact commit. *(step)* and it's fickle. pull the wrong llvm commit and you find out from a build error ten minutes later. every version has to line up, every time. *(step)* blackhole-py needs numpy, tokenizers, jinja2 and whatever clang is already on your machine.

**likely questions**
- *isn't every big project like this?* pretty much, which is the point: the official stack is a big-company build. to learn how the chip works, or to run it on a mac, you want something you can read in an afternoon.
- *do you need all of these?* not all on every build: some are only for tests (googletest, benchmark) or the profiler (tracy, emsdk). the dashed ones are tenstorrent's own repos, already counted on the lines slide.
- *why does fmt / flatbuffers / spdlog show up twice?* tt-metal and tt-umd each pull them in separately, so their versions have to agree too.

**sources:** facts.json `deps`: CPMAddPackage / FetchContent / ExternalProject / submodules in each repo's cmake and .gitmodules, tt-xla python_package/requirements.txt; llvm count on a local llvm-project (llvm + mlir + lld, no tests), tt-mlir pins 4efe170 with LLVM_ENABLE_PROJECTS=mlir,lld. "build error 10 minutes later": our experience.

# 07-mac

**say:** blackhole-py replaces most of that stack with a python runtime and its own small firmware. on the mac there's no tt-kmd, so two pieces do its job: a small macos driver, derived from tinygrad's tinygpu driver, claims the card and maps its memory into python; about 350 lines of python do the rest (memory windows onto the chip, messages to its management core). the model code didn't change. and the egpu dock costs almost no speed: the mac uses about 81% of the p100a's memory speed, the linux desktop 78% of its p150a's.

**likely questions**
- *why is the desktop faster in tok/s, then?* generating text is memory-bound, and the p150a has 8 memory channels (512 gb/s) to the p100a's 7 (448 gb/s), 1/8 less. same share of bandwidth, smaller pipe.
- *what does the mac driver actually do?* claims the card (pci 1e52:b140), maps its bars into python, allocates dma memory the card can reach, passes config-space and power messages. tlb windows, iatu setup and the arc message queue are in python.
- *where's 81% from?* the desktop reads ~2.48 gb per token (78% × 512 gb/s × 6.21 ms, about the size of llama 3.2 1b in bf16). the mac reads the same in 6.85 ms: 362 gb/s, 81% of 448.

**sources:** blackhole-py `macos` @ 668e57b: `system_darwin.py` (356 lines, header lists the tt-kmd functions it replaces), `ttgpu-dext/README.md`; readme performance table (p150a 1b bf16 short: 6.21 ms, 161.0 tok/s, 78% dram); booth terminal (6.85 ms/token).

# 08-access

**say:** this is the point of the egpu setup. before, running a tenstorrent card meant a linux desktop with a free pcie slot, or renting one in the cloud. now the whole setup is about $1,200: the $999 card plus a ~$200 egpu dock, on the laptop you already own. for that you get 120 ai cores and 28 gb of memory with an open stack. i don't know a cheaper way to get that much ai memory, or a more interesting chip to learn on.

**step 1** brings in the post announcing the mac port: 14k views and 291 likes in under a day. people want this.

**step 2** shows the takeaway line.

**likely questions**
- *does it need a mac?* the driver we wrote is for macos. on linux the official driver already works.

**sources:** $999 list price (facts.json); post stats from the x screenshot, 2026-11-16 (facts.json `post`, refresh before the event).

# 09-learning

**say:** the project is about learning both halves: how ml models work inside, and how computers and this chip actually compute. the synthesis is compilers: software that turns a model into code this chip runs.

**sources:** cair blackhole project deck and interest flyer.

# 10-next

**say:** right now every kernel in the demo is written by hand, from a python generator we built for llama. that doesn't scale past one model. so three steps: first a language for writing fast blackhole kernels, so one short program drives all five cpus in a core and both engines. then a simple compiler that turns a model's graph into kernels in that language. then plug that into tinygrad, so a researcher writes `model(x)` like on any gpu and it runs on the card. that's the `model(x)` from the problem slide, with nothing hidden underneath. the qr code is the code behind the demo.

**likely questions**
- *doesn't tenstorrent already have a kernel language?* tt-lang, yes (on the software-catch slide). it sits on top of tt-metalium. ours targets blackhole-py's runtime directly, so the whole path stays small enough to read.
- *why tinygrad?* it's small, its backends are a short list of primitives, and it already has a mac gpu driver we started from (tinygpu). a new accelerator is a backend, not a fork.
- *when?* the language and compiler are what we're working on next; tinygrad comes after they can produce the llama kernels.

**sources:** qr points to github.com/boopdotpng/blackhole-py/tree/macos.
