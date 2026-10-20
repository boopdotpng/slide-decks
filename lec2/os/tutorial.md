# how an OS (a computer) executes programs

to keep things simple for now, a computer is two things: many tiers of
memory, and a cpu. the cpu is stupid. it reads an instruction (usually
4 bytes) at the memory address in its program counter, executes it,
and then moves the program counter forward 4 bytes to the next one,
unless the instruction was a jump or branch, in which case it goes
wherever that instruction says. every program you run on your computer
is just billions of these 4-byte instructions.

each instruction is just bytes in memory. the cpu decodes them (figures
out what they mean) and executes them. imagine a massive switch
statement over every possible instruction.

cpus have a lot of tricks to execute instructions faster, but that
would take too much time to get into. just know that your instructions
are not necessarily executed in order, or one by one. the cpu only
promises your program will *behave as if* they were. this is a massive
rabbit hole. i think there are some interesting jane street talks
about this.

## who's in charge: the kernel

your program is not alone on the computer. there's one special program
that's always there, running before yours starts and after it exits:
the kernel. it's the core of the operating system.

the cpu runs in different modes. your program runs in user mode, which
is restricted: it can do math, read and write its own memory, and jump
around its own code, but it can't touch hardware directly. it can't
talk to the disk, draw to the screen, or even print a character.

the kernel runs in a privileged mode where it can do all of that. so
when your program wants something only the kernel can do, it asks.
that request is a syscall. in risc-v, you put a number in a register
saying what you want (e.g. 64 means "write"), put the arguments in
other registers, and run the `ecall` instruction. the cpu jumps into
the kernel, the kernel does the work, and then it jumps back to your
program.

we'll come back to how this actually works, and why your program can't
just cheat, later.

## risc-v instructions (what a cpu actually executes)

we'll look at rv64im: the 64-bit base integer instruction set, plus
the "m" extension for multiply and divide. all you have to work with
in assembly is:

- registers: 32 small slots inside the cpu (x0 through x31, and x0 is
  always zero)
- math on registers: add, subtract, multiply, shifts, and, or, xor
- loads and stores: copy values between registers and memory
- branches and jumps: change where the program counter goes next
- syscalls: `ecall`, to ask the kernel for help

that's it. everything else is built out of these.

*insert rv64im instruction table*

## tiers of memory

rough latency:

- nvme ssd: 50-100 µs
- ram: 80-100 ns, ~1000x faster than ssd
- l3 cache: 10-15 ns, 5-8x faster than ram (shared between physical cores)
- l2 cache: 3-4 ns, 3-4x faster than l3 (usually private to a core)
- l1 cache: ~1 ns, or 4-5 cycles (private to a core)
- cpu registers: effectively free, 4-5x faster than l1
