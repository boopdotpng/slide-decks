# 01-title
- one program, one core, start to finish: what the instructions are, what c turns into, what the hardware does with them
- risc-v because it's small enough to see all of it, and it's what tenstorrent's cores run

# 02-two-things
- the cpu is a dumb loop. it has no idea what a "program" is, only "the bytes at pc"
- let the race run a few seconds: ram is ~100× slower than a register. we come back to this at the end: most of a modern cpu exists to hide that gap

# 03-isa
- the isa is the contract: what bytes mean. compilers target it, chips implement it
- 1: one binary runs on a microcontroller and a desktop core. same answer, wildly different speed
- 2–3: the "doesn't say" list is the whole second half of the talk. the last item (registers) comes back on the renaming slide
- tenstorrent numbers: blackhole has 120 tensix tiles, each with 5 small risc-v cores

# 04-registers
- registers are the cpu's own tiny storage: 32 of them, 8 bytes each. everything gets loaded into one before you can compute on it
- 1: x0 is why `mv a0, a1` can be `addi a0, a1, 0` and `li a0, 5` can be `addi a0, x0, 5`
- 5: that's why compiled code moves a value it still needs after a call into an s register (you'll see `mv s0, a0` a lot), and why a function that uses s0 saves it first
- 6: gp: loads only reach ±2 KB around a register, so a global normally takes lui + ld. with gp parked in the middle of the small globals, the linker rewrites those into one gp-relative ld ("linker relaxation"; our compile.sh turns it off with -mno-relax, which is why the slides show lui + ld). tp: each thread's own copy of thread-local variables (errno); the kernel swaps it on thread switches. don't go further, threads are out of scope
- 7: the names are only an agreement between functions (next slides). the hardware doesn't care what you keep in t0 vs s0

# 05-cpu-loop
- it loops by itself. narrate the pc: +4, +4, jump back, until t0 hits 0

# 06-arith
- all asm on these slides is real clang -O1 output (c/build.sh)
- 1: no stack, no memory: args come in registers, result leaves in a0
- 2: an instruction is 32 bits, so the constant field is only 12 bits (±2048). lui loads the upper 20 bits, addi the low 12
- 3: the compiler knows multiply-by-8 is a shift. you write the clear thing, it picks the cheap thing

# 07-memory
- the only instructions that touch memory are loads and stores. everything else is register to register
- 1: a[i] is a + i * sizeof(long). the scale comes from the type, that's why c needs types
- 2: same shape, × 4 for int. sw stores only the low 4 bytes of a2
- 3: lbu zero-extends. char is unsigned on risc-v linux (signed on x86): a real portability gotcha
- the offset in 0(a0) is a free add: ld a0, 16(a0) would read a[2] with no extra instruction

# 08-branch
- every if, while, for, && and || becomes compare-and-branch
- 1: the branch jumps *over* the then-block, so its condition is the opposite of the c. read compiler output with that in mind
- 2: try two calls: clamp(3, 5) jumps (3 < 5), clamp(9, 5) falls through and sets x = 5
- 3: labels cost nothing, they're names for addresses

# 09-loop
- 1: the blez guard: a for loop checks before the first lap
- 2: the optimizer rewrote i into a pointer. no i * 8 every lap, just one + 8
- 3–4: four instructions per lap. the next slide runs it

# 10-loop-run
- a = {3, 1, 4, 1} at 0x2000, n = 4. addresses are made up, the values are what the code computes
- step through the first lap one instruction at a time, then go faster: laps 2–4 are one step each
- watch a0 walk across the array and stop at a1, one past the end
- this exact loop comes back in the cache section: each ld here is a memory access

# 11-ilist
- reference, don't read it out. "it fits on one slide" is the point

# 12-call-ret
- a function call is not magic: two jumps and one register
- 1: jal writes the address of the next instruction into ra, then jumps. that's the whole "remember where I came from"
- 3: ret is jalr through ra. square doesn't know or care who called it
- 5: the problem: ra is one register. a function that calls another loses its own way back unless it saves ra first. → the stack
- footnote: call/ret/li/mv are assembler shorthands. objdump shows the real instructions

# 13-stack
- the centerpiece. go slowly through the first call (0–2), then speed up: 3–5 are the same thing again
- addresses and values are real: this is what the rv emulator shows for os/examples/05_functions.s with fact(3)
- 1: a frame is just "sp − 16, store two things". nothing allocates it, no bookkeeping
- 3: point at s0 = 3 being saved: that's the calling convention slide in action. fact(2) wants s0 for itself, so it saves fact(3)'s value first
- 4: every recursive call returns to the same address (the mul). the frames are what make each return different
- 7: popped frames are dimmed but the values are still in memory. "freeing" stack memory is just moving sp
- 12: stack overflow = sp walked off the end of the stack region (on linux: into a guard page → segfault)

# 14-bytes
- this is literally what a cpu, or an emulator, does for every instruction: fetch, pull the fields out, switch, pc += 4

# 15-cpu-blocks
- rough, not a floorplan. top = front end (get instructions ready), bottom = back end (do them)
- 1–5: one add, start to finish. decode is the switch from the bytes slide, in hardware
- rename and the reorder buffer are greyed out on purpose: they come back two slides from now
- 6–7: a load takes the same front end, then the load/store unit + L1d. a hit is ~4 cycles; misses are the memory part
- 8: the point of the slide. with one instruction in flight, nearly everything is idle → pipelining

# 16-pipeline
- textbook 5-stage pipeline, with forwarding (results go straight to the next instruction, no waiting for W)
- 0 → 1: 20 cycles → 8. once it's full, one instruction finishes per cycle
- 2: not clang's order: add moved right after the ld to show the bubble. a loaded value isn't ready until the end of M
- 3: clang's real order puts the addi in between. the compiler knows the pipeline
- 4–5: the branch is only decided in X, so fetch has to guess. loop branches are taken every time but the last, so predictors are right ~99% here
- big cores: ~15–20 cycle penalty for a wrong guess, and they guess hundreds of instructions ahead

# 17-ooo
- same loop. the load misses the cache (6 cycles here; a real miss to ram is hundreds)
- 1: anything whose inputs are ready can go. addi and bne don't need a3. the next iteration's ld starts early too
- that ld writes a3 while the add still needs the old a3: how? next slide
- 2: results become visible (commit) in program order, from the reorder buffer. if the ld faulted, nothing after it would have "happened"
- "as if": your program can't tell. this is the contract the isa keeps

# 18-cache-lines
- 0: the unit is a 64-byte line, not a byte or a long. ask for a[0], get a[0]–a[7]
- 1: the sum loop from earlier. red = miss (wait ~70 ns for ram), green = hit (~1 ns). one miss per line, then 7 free loads
- 2: same 8 lines, but only one long used per line. 8 loads cost about as much as the 64 before: you pay for lines, not loads
- 3: idealized: the prefetcher sees the forward walk and requests the next lines early. real ones are good at forward/backward strides, bad at random access (linked lists, hash tables)
- takeaway: data you use together should sit together

# 19-cpu-end
- one line per part. ask what was unclear
- the rv emulator lives in os/: `./rv.sh run file.s`, every ebreak prints all registers. `./compile.sh foo.c` to see what clang makes of your c
- next time (maybe): many cores. why mutexes are slow, cache coherence

