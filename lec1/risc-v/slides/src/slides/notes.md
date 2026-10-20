# 01-title
- one program the whole way: we write it in assembly, turn it into bytes, then watch a cpu run those bytes
- the program is `lec1/risc-v/sum.s`: add up 8 numbers. no functions, no stack
- risc-v because it's small enough to see all of it, and it's what tenstorrent's cores run

# 02-assembly
- left to right is what a toolchain does: compiler (c → assembly), assembler (assembly → bytes). the bytes are real (llvm-objdump)
- point at `add a0, a1, a0`: one line of c became one instruction. `ret` = go back to whoever called
- python / js: you never compile them, but the interpreter running them is a compiled program. the cpu only ever runs instructions
- "assembly" = the instructions as text, one per line. today we skip the compiler and write it ourselves

# 03-isa
- the isa is a contract: what each instruction does and how it's written as bytes. compilers target it, chips implement it
- 1: one binary runs on a microcontroller and a desktop core. same answer, wildly different speed
- 2–3: "doesn't say" is the end of the talk: how a chip makes it fast is its own business
- the bytes `b3 83 c3 01` are an instruction from our loop. we'll build them by hand later
- tenstorrent: blackhole has 120 tensix tiles, each with 5 small risc-v cores

# 04-registers
- registers are the cpu's own tiny storage: 32 of them, 8 bytes each. to compute on something it has to be in a register
- 1: x0 is always 0. that's why `li t1, 8` can be `addi t1, zero, 8`
- 2: t registers: scratch. our whole program uses t0–t4
- 3: a0 and a7 show up at the end of our program, to exit
- 4: ra, sp, s registers: they're for function calls and the stack. skip, say "next time"
- 5: the names are a convention. the hardware only cares that x0 is 0

# 05-cpu-loop
- this is the whole job of a cpu. pc is just a register holding an address
- step through slowly: each instruction runs, then pc goes up by 4 (every instruction is 4 bytes)
- the pc column shows the *next* address, after the instruction runs. same on every slide after this
- ebreak: our emulator stops and prints every register. we'll use it to check our work

# 06-arith
- the format is always destination first. `add t2, t2, t3` means t2 = t2 + t3
- addi: the number is inside the instruction itself (an "immediate"). we'll see the bits later
- no subi: addi with a negative number. that's what our countdown does
- li and mv are shorthands the assembler expands. you'll see them in our program
- every instruction here is one we'll use in the program

# 07-memory
- the addresses are real: this is exactly where the linker put our numbers (we'll see the file later)
- 0: memory is a giant array of bytes. our numbers are 8 bytes each, so their addresses go up by 8
- 1: la gives you an address, not a value. t0 "points at" nums
- 2–3: `8(t0)` means address t0 + 8. the 8 is a free add, no extra instruction
- 5: the store writes 1 into total (orange). total is just more memory, right after the numbers
- 6: other sizes exist. we only need 8-byte ld / sd today
- key idea: only loads and stores touch memory. add can't read memory directly

# 08-branch
- step through: watch pc go 0x04 → 0x08 → back to 0x04
- a label is free: it's just a name the assembler turns into an address
- bne = "branch if not equal". this exact countdown is how our program knows when to stop
- if/else is the same instruction jumping forwards instead of backwards

# 09-program
- this is the file you'll type live: lec1/risc-v/sum.s. `../../lec2/os/rv.sh run sum.s` from lec1/risc-v
- walk the steps: data first (what), then text (how)
- 3: three registers, three jobs: t0 = where we are, t1 = how many left, t2 = running sum
- 4: the loop is every instruction from the last three slides, together
- 6: ecall = "ask the os". a7 says which request (93 = exit), a0 is the argument. `echo $?` shows it
- ask before running: what will ebreak show in t2? (31)

# 10-program-run
- the addresses and the final register values match what rv prints at the ebreak
- go slowly through lap 1 (one step per instruction), then each lap is one step
- watch t0 walk across the memory row, one 8-byte cell per lap
- at the end t0 has walked one past nums, onto total. the emulator says "t0 -> total" too
- 8 laps × 5 instructions = 40 instructions for the loop

# 11-encode
- the cpu can't read "add". this is what the assembler does to every line
- 1: register names → numbers. t2 = x7, t3 = x28 (back to the register grid). 5 bits picks 1 of 32
- 2: opcode 0x33 = the register-register family. funct3 / funct7 pick add vs sub vs and…
- 4: little-endian: the lowest byte comes first in memory. these are the same 4 bytes from the isa slide

# 12-formats
- rows are our program's instructions, with their real encodings
- point at how rd, rs1, rs2 never move. the cpu can start reading registers before it knows what the instruction is
- I: addi, li, ld all share it. S: our sd. B: our bne. U: half of our la. J: function calls, not today
- the bne's constant is −16: "jump back 16 bytes" = 4 instructions, to ld. labels are gone at this point

# 13-immediates
- 12 bits of constant: −2048 to 2047. 8 fits easily
- the address of nums (0x12198) doesn't. so the assembler splits it
- auipc = "add upper immediate to pc": the address is relative to where the code is. that's why it works wherever the program is loaded
- this is why pc jumped by 8 on the `la` two slides ago

# 14-elf
- the file is 1304 bytes. the numbers are from llvm-readelf on the real file
- 1: every linux executable starts with 7f 45 4c 46 ("\x7fELF"). try `xxd sum | head -1`
- 2–3: these are the same bytes we built by hand. .text is executable and read-only, .data is writable
- 4: the program headers are what the os reads: copy these bytes to these addresses. then pc = the entry point
- 5: names live in the file but never reach the cpu. other sections we didn't need: .rodata (constants, strings), .bss (zeroed buffers)
- stack and heap: not in the file at all. next lecture

# 15-decode
- this is the encode slide in reverse. it's literally what a cpu, or an emulator, does for every instruction
- fetch: read 4 bytes at pc. decode: shift and mask the fields, switch on the opcode. execute: do the add. pc += 4
- the c here is the idea; rv (our emulator) does the same thing in python

# 16-cpu-blocks
- rough, not a floorplan. top = front end (get instructions ready), bottom = back end (do them)
- 1–5: our add, start to finish. decode is the last slide, in hardware
- 6–7: our ld takes the same front end, then the load/store unit + L1d. a hit is ~4 cycles; misses are the memory part
- 8: the point of the slide. with one instruction in flight, nearly everything is idle → pipelining

# 17-pipeline
- one lap of our loop. textbook 5-stage pipeline, with forwarding (results go straight to the next instruction)
- 0 → 1: 25 cycles → 9. once it's full, one instruction finishes per cycle
- 2: our hand-written order has a bubble: add right after ld. a loaded value isn't ready until the end of M
- 3: move `addi t1, t1, -1` up between them. try it in sum.s: same answer. compilers do this for you
- 4–5: the bne is only decided in X, so fetch has to guess. loops go around again every time but the last, so the guess is right 7 of our 8 laps
- big cores: ~15–20 cycle penalty for a wrong guess, and they guess hundreds of instructions ahead

# 18-memory-slow
- let the race run a few seconds. ram is ~100× slower than l1, ssd ~1000× slower than ram
- every ld in our loop is a trip to memory. the next slide is what saves us

# 19-cache-lines
- real addresses: nums starts at 0x12198. that's not a multiple of 64, so it's split over two lines
- red = miss (wait for ram, ~70 ns), green = hit (~1 ns)
- 2 misses cost ~140 ns, 7 hits (incl. the sd) cost ~7 ns. you pay for lines, not loads
- if nums started at a multiple of 64 (`.align 6` before it), all 8 would be one line: 1 miss

# 20-cache-walk
- a bigger array: 64 numbers, 8 lines. same idea as our 8
- 1: in order: one miss per line, then 7 free loads
- 2: every 8th number: same 8 lines, but each load is a miss. 8 loads cost about as much as 64
- 3: idealized prefetcher: it sees the forward walk and fetches the next lines early. great for arrays, bad for random access (linked lists, hash tables)
- takeaway: data you use together should sit together

# 21-recap
- one line per part. ask what was unclear
- try it: change the numbers or the loop count in sum.s, predict t2, run it
- the gpt-2 half is the same machine: a huge matmul is this loop, many times over, walking memory in order
