# test

# 01-title

- three questions: how does a program run? how does the kernel juggle many of them? how do you reach the accelerator?
- x86 + linux for all of that, since it's the host the card plugs into. risc-v at the end, because that's what the card's cores run

# 02-two-things

- the cpu is a dumb loop. it has no idea what a "program" is, only "the bytes at pc"
- let the race run a few seconds: ram is ~100× slower than a register. keep that in mind for the card later: distance costs time

# 05-kernel

- the kernel is just a program. what's special is that the cpu runs it in ring 0 (privileged) and yours in ring 3. the cpu enforces this; it's not a convention
- 1: touching the card directly faults. 2–4: the shape of every syscall: ask, the kernel does it, you come back
- the next five slides fill in each arrow

# 07-hello

- ./hello is a file (an elf): "put these bytes here, start running here"
- who starts it? the shell asks the kernel: fork (copy me) + exec (replace the copy with ./hello)
- hello only needs the kernel twice: write and exit

# 07a-virtual

- every address your program sees is virtual. the mmu rewrites it on every load, store and fetch
- why: programs can't touch each other's memory, and every program can use the same addresses

# 07b-page-tables

- 4 KiB pages. the table maps your page → a real page, plus permission bits
- the u bit is the whole security story for ring 3: no u, no access
- accelerator row: it's not in your table at all. that's the fault from the kernel slide
- really a tree (shown on "all of it at once"). the tlb caches lookups

# 07c-devices

- physical addresses aren't all ram. device registers sit in the same address space (mmio)
- at boot the card gets a range (its bar). a store there turns into a pcie message to the card
- step 3 is the definition of a driver: kernel code that knows one device's registers. more at the end

# 08-syscall

- the "ioctl / return" arrows from the kernel slide, slowed down
- the points to land: the cpu does the jump and you don't pick where you land (1). the kernel saves your registers (2). it never trusts your pointers (4). you come back as if it were one slow instruction (7)
- 8: three ways to cheat, all closed. syscall is the only door
- a syscall costs far more than a function call. that's why the card's fast path (last part of the talk) avoids them

# 08b-threads

- process = page table + resources. thread = pc + registers + stack. the thread is what runs
- threads share memory. that's why locks exist (one sentence, move on)

# 08c-switching

- 1: a timer interrupt is a syscall nobody asked for: same trip into the kernel
- 4: a different process means switching cr3. a thread in the same process skips this
- 8 is the payoff: "everything runs at once" is really taking turns, fast
- 9–10: optional, deeper than beginners need. skip unless someone asks

two ways a thread stops (steps 9–10):

- **interrupted**: the kernel decides (the timer fired). the thread can be anywhere, mid-calculation, so every value might matter: save and restore every register.
- **stops itself**: the thread decides (sleep, wait for a lock, a read that blocks). it's inside a function call into the kernel, and the abi only promises that callee-saved registers (rbx, rbp, r12–r15) and the stack pointer survive a call. the caller already assumes the rest are trashed, so their values don't matter. linux's `__switch_to_asm` pushes exactly those six, then swaps rsp; the return address is already on the stack.
- nuance: on linux, the thread that stopped itself still came in through a syscall, which saved its user registers on entry. what's cheap is the switch between threads. it's cleanest with switches entirely in user space (green threads) or on bare-metal cores.

# 08d-machine

- recap of everything, as one zoom
- 1: let the shuffle play
- 4–6 (the 4-level walk): go quickly. it's the same flat table from before, stored as a tree to save space

# 09-tt-kmd

- 0: the map for the rest of the talk. people won't write ioctls themselves: the library does. this is what's underneath it
- 1: a driver runs in ring 0 with full access. a bug takes down the machine, not just your program
- 2: `make dkms` is the whole install. in tree = ships with linux. tt-kmd is out of tree: a separate module (tenstorrent.ko). it uses the kernel's internal apis, which change between versions (syscalls don't), so it's built for one kernel version. update linux → rebuild it. dkms does that for you
- 3: the driver tells the kernel "i handle 1e52:b140" (tenstorrent, blackhole). a udev rule makes the file mode 0666: anyone on the machine can open the card. for each matching card the kernel calls the driver's probe function, which maps the bar and creates /dev/tenstorrent/N
- if it's broken: `lsmod | grep tenstorrent`, `ls /dev/tenstorrent`, `dmesg`
- why out of tree: the hardware moves faster than linux's review and release cycle
- 4: teaser for the next slide

# 09a-open

- open: the driver sets up bookkeeping for this fd. everything you allocate (windows, pinned memory) is tied to it and freed on close
- 1–3: the bars are the card's slice of physical addresses (like the devices slide). bar0: 202 × 2 MiB windows. bar4: 8 × 4 GiB windows, 32 GB total, the size of the dram
- there's no "dram at this address": the bars hold windows, and every window has to be aimed first
- 4: a store into a window is just mmio. the cpu doesn't know it's a card

# 09b-tlb

- "tlb" here is tenstorrent's name for a window. not the cpu's tlb
- 1: CONFIGURE_TLB = the driver writes 12 bytes into a register on the card: x, y, address, multicast. that register is the whole mapping. the host's page table only knows "this is the window"
- 2: the store goes cpu → pcie → pcie tile → reads window 3's register → a noc packet to core (1, 2)
- 3: dram banks are just more noc endpoints. same window, same store, different target
- 4: blackhole-py's boot(): soft reset all cores, write firmware into all 120 at once, write a risc-v `jal` at their boot address, release reset. that's the risc-v part of the talk
- 5: stores don't wait. loads wait for a full round trip, so you don't move bulk data this way

# 09c-pin

- the flip side: instead of the host pushing data, the card pulls it from host memory
- 1: pinning stops the kernel from moving or swapping the pages while the card might be reading them
- 2: the iommu is the card's page table on the host side: the card sees one contiguous range, and only what you pinned
- 3: with NOC_DMA the driver programs the card's pcie tile so a noc address (0x1000… + offset) goes out over pcie to that range. that's what you get back
- 4: from a core's point of view, host memory is just one more noc address
- 5: blackhole-py pins 256 MiB at startup: an issue queue (host writes commands, a core fetches them), a completion queue (cores write back), and a staging area for dram copies

# 20-riscv

- the host is x86 + linux: that's what talks to the card. the cores on the card run risc-v, so that's the instruction set you'll read and write for them
- the cpu loop from the start applies to them directly
- this table is for reading x86 docs next to risc-v docs, not for memorizing

# 21-rv64im

- registers have abi names by role. x0 always reads 0, which saves instructions (mv = addi rd, rs, 0)
- this really is the whole core set. the next slides open up the bytes

# 22-cpu-loop

- it loops by itself. narrate the pc: +4, +4, jump back, until t0 hits 0

# 23-bytes

- this is literally what a cpu, or an emulator, does for every instruction: fetch, pull the fields out, switch, pc += 4

# 24-formats

- optional. point: register fields never move, so the hardware can start reading registers before it knows the instruction

# 25-hello-asm

- the same program as the hello world slide. a7 plays rax's part, a0–a2 are the arguments
- la is two instructions, and pc-relative: it works wherever the program gets loaded
- the ecall at the end → the syscall slide again

# 26-rv64im-table

- reference, don't read it out. "it fits on one slide" is the point
