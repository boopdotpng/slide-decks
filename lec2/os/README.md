# rv: run RISC-V assembly

```sh
./rv.sh run examples/01_hello.s
```

Write a `.s` file and run it. Every `ebreak` in your program prints all 32 registers,
and then execution continues. `*` marks registers that changed since the previous
`ebreak`, and addresses say what they point to (`-> msg`, `-> heap+0x40`, `-> stack`).

Requires `python3.15` and `brew install llvm lld` (used to assemble).
Tests: `python3.15 -m unittest discover tests`.

## A program

```asm
    .section .rodata
msg:
    .ascii "hello, world\n"

    .text
    .globl _start
_start:                     # execution begins here
    li   a0, 1              # stdout
    la   a1, msg
    li   a2, 13             # length
    li   a7, 64             # write
    ecall
    ebreak                  # print registers

    li   a0, 0
    li   a7, 93             # exit
    ecall
```

## C → assembly

```sh
./compile.sh compiled/sum.c          # writes compiled/sum.s (add -O0 or -O2 to compare)
./rv.sh run compiled/sum.s
```

Uses Homebrew `clang --target=riscv64 -march=rv64im`. There's no C library: include
`rv.h` for `print_int`, `print_str`, `malloc`, `exit`, and `ebreak()`. C programs
define `main` instead of `_start`; `rv` supplies a `_start` that calls `main` and
exits with its return value.

## Where things go

| directive | holds | writable? |
|-----------|-------|-----------|
| `.text` | instructions | no |
| `.section .rodata` | constants: string literals, tables | no |
| `.data` | global variables with a starting value | yes |
| `.bss` | global variables that start as zero (`.zero 4096`) | yes |

Data directives: `.byte` (1 byte), `.half` (2), `.word` (4), `.dword` (8),
`.ascii "..."`, `.asciz "..."` (adds a 0 byte at the end), `.zero n`, `.align n` (2ⁿ bytes).
Other directives: `.globl name`, `.equ NAME, value`, `.include "file"`.

## Syscalls

Put the number in `a7` and the arguments in `a0`, `a1`, ...; then `ecall`. The result comes
back in `a0`. `examples/syscalls.inc` defines names for all of these.

| a7 | name | args | notes |
|----|------|------|-------|
| 63 | read | fd, buf, len | Linux |
| 64 | write | fd, buf, len | Linux |
| 93 | exit | code | Linux |
| 214 | brk | addr | Linux: moves the end of the heap; `brk(0)` returns the current end |
| 1000 | print_int | value | rv only |
| 1001 | print_hex | value | rv only |
| 1002 | print_str | addr of a 0-terminated string | rv only |
| 1003 | print_char | char | rv only |
| 1004 | malloc | size | rv only: returns 0 when the 1 MB heap is full |
| 1005 | free | ptr | rv only: does nothing |

## Memory

```
0x10000...   your .rodata, .text, .data, .bss
after that   heap: 1 MB, usable up to the "break" (grown by malloc / brk)
0x7ff00000   stack: 1 MB, grows down; sp starts at 0x7fffffe0
```

Bad memory accesses stop the program with an explanation and a register dump. That
includes NULL pointers, writes to `.text`/`.rodata`, stack overflows, and reads past
the end of the heap.

## Scope

- RV64I + M (multiply/divide). No floating point, atomics, or compressed instructions.
- One core, running one instruction at a time. `fence` is accepted and does nothing:
  with a single core, every load already sees every earlier store.
