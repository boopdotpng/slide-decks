# lec 3: the gpu, bottom up

how a gpu runs a program, for people who can program but have never touched a gpu, cuda or hip. amd-shaped, on one
card (rx 9070 xt, rdna 4), around one small grayscale photo and three programs.

1. **the map**: the whole chip and its memory, kept in the corner of every later slide.
2. **part 1, the model, no code**: one thread per pixel → waves of 32 sharing one instruction stream → branches and the
   exec mask → memory is far, so a simd parks many waves → blocks of 256 on one wgp, the grid of blocks on the chip.
3. **part 2, the code**: `brighten` (every thread alone), the host program, what a launch does.
4. **part 3, threads that cooperate**: a histogram for auto exposure. `bins[p]++` loses counts (a race), `atomicAdd`
   fixes it but queues on far-away counters, a per-block histogram in lds with two barriers fixes that.
5. **under the hood**: the real instructions, the exec mask and barriers in asm, tensor cores, other amd gpus.

```sh
./build.sh                   # kernels/*.hip -> slides/src/asm/*.s  (clang only: brew install llvm. no rocm, no gpu)
./export_occupancy.sh        # -> slides/public/data/occupancy.json (llvm's waves-per-simd for 8..256 v registers)
cd slides && bun run dev     # :4321. g = slide picker, p = presenter notes, f = fullscreen
```

- `kernels/`: `brighten`, `shadows` (a branch), `hist_naive` (the race), `hist_atomic`, `hist_lds` (lds + barriers),
  `tile` (one wmma matmul tile), and `hip.h`, the few names from hip's headers they need, so plain clang compiles them.
- `slides/src/asm/`: clang's output for them (gfx1201 = rx 9070 xt; brighten also for gfx1100 and gfx942), cut down to
  the kernel body. `build.sh`'s header says exactly what is dropped (encoding suffixes and two scheduling hints).
- `slides/src/components/image.ts`: the photo (a generated 128 × 80 dusk landscape, deterministic) and every number
  read off it: the histogram, the 99th percentile, the simulated racy histogram.
- `brighten.cpp`: the whole host program on the "the whole program" slide. written against hip's documented api;
  **not compiled here** (that needs a rocm install).

## what is real and what isn't

- every instruction on a slide is clang's (llvm 23) for that kernel. the photo is made up (generated, not a real
  picture); every count, percentile and pixel value on a slide is computed from it.
- the racy histogram is a simulation: lanes of a wave that hit the same counter count once (that part is how one
  store instruction behaves), and how many waves overlap is a parameter (on real hardware it depends on timing).
- waves per simd by register count: llvm's own numbers (`export_occupancy.sh`).
- the scheduling slide is a small simulation with a made-up 30-cycle wait and a made-up rule for which wave goes
  next (amd doesn't document one). the shape is right, the numbers are a sketch; the slide's caption and the
  island's comment say so.
- latencies on "memory is far away" were measured by chips and cheese on the generation before (rx 7900 xtx, lds on
  rx 6900 xt). nothing is published for the 9070 xt.
- "2 simds per compute unit" on rdna 4 is amd's rdna 1 diagram plus "same high level layout" (chips and cheese, hot
  chips 2025) plus 4096 stream processors / 64 cus / 32 lanes. amd hasn't drawn it again for rdna 4.

## sources

- amd, rdna 4 instruction set architecture guide (registers, wait counters, barriers, ttmp9, lds and workgroup limits,
  1536 registers per simd in blocks of 24): https://docs.amd.com/v/u/en-US/rdna4-instruction-set-architecture
- llvm, user guide for the amdgpu backend (gfx names ↔ products, kernel start state, memory spaces, the dispatch
  path): https://llvm.org/docs/AMDGPUUsage.html
- amd, rdna architecture deck (wgp = 2 cus, simd32, lds, "dependency stalls can be filled by other waves"):
  https://gpuopen.com/download/RDNA_Architecture_public.pdf
- amd, rocm gpu hardware specs table (64 cus, cache sizes, 16 GiB): https://rocm.docs.amd.com/en/latest/reference/gpu-arch-specs.html
- chips and cheese: rdna 4 at hot chips 2025 https://old.chipsandcheese.com/?p=37225 · rdna 4 architecture video
  https://chipsandcheese.com/p/amds-rdna4-architecture-video · latency testing on rdna 3
  https://chipsandcheese.com/p/latency-testing-is-hard-rdna-3-power-saving · rdna 2 https://chipsandcheese.com/p/amds-rdna-2-shooting-for-the-top
- amd gpuopen, using matrix cores on rdna 4 (wmma: 8 numbers per lane, 16 cycles): https://gpuopen.com/learn/using_matrix_core_amd_rdna4/
- nvidia, programming tensor cores in cuda 9: https://developer.nvidia.com/blog/programming-tensor-cores-cuda-9/
- hip docs (programming model, saxpy tutorial): https://rocm.docs.amd.com/projects/HIP · its terminology table: https://github.com/ROCm/HIP/blob/rocm-6.0.x/docs/reference/terms.md · the official saxpy: https://github.com/ROCm/rocm-examples/blob/amd-staging/HIP-Basic/saxpy/main.hip
- rocm's hsa.h (the 64-byte dispatch packet): https://github.com/ROCm/ROCR-Runtime/blob/amd-staging/runtime/hsa-runtime/inc/hsa.h
- linux amdgpu docs, user mode queues (doorbells, the firmware reads the queue): https://github.com/torvalds/linux/blob/master/Documentation/gpu/amdgpu/userq.rst
