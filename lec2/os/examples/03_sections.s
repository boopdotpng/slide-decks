# Where things live. Each directive switches which section the following lines go into:
#
#   .text            instructions                                   read-only, executable
#   .section .rodata constants: string literals, lookup tables      read-only
#   .data            global variables with a starting value         writable
#   .bss             global variables that start as zero            writable
#
# .bss is for big zero-filled buffers: you only say how many bytes you want
# (.zero 4096), so nothing has to be stored for them. They're zeroed at startup.

    .include "syscalls.inc"

    .section .rodata
greeting:
    .asciz "counter = "              # .asciz adds the terminating 0 byte

    .data
counter:
    .dword 40                        # 8 bytes; also .byte (1) .half (2) .word (4)
primes:
    .word 2, 3, 5, 7, 11

    .bss
    .align 3                         # align to 2^3 = 8 bytes
buffer:
    .zero 4096                       # 4 KB of zeros

    .text
    .globl _start
_start:
    la   t0, counter
    ld   t1, 0(t0)                   # load 8 bytes
    addi t1, t1, 2
    sd   t1, 0(t0)                   # store them back: .data is writable

    la   t2, primes
    lw   t3, 16(t2)                  # primes[4]: element size 4, so offset 4*4

    la   t4, buffer
    sd   t3, 2040(t4)                # offsets are 12-bit signed: -2048..2047.
    li   t5, 4088                    # `sd t3, 4088(t4)` won't assemble, so to reach
    add  t5, t4, t5                  # the last 8 bytes of buffer, compute the
    sd   t3, 0(t5)                   # address first
    ebreak                           # t0, t2, t4, t5 hold addresses: see where they point

    la   a0, greeting
    li   a7, SYS_print_str
    ecall
    mv   a0, t1
    li   a7, SYS_print_int
    ecall
    li   a0, '\n'
    li   a7, SYS_print_char
    ecall

    # Uncomment to see what read-only means:
    # la   t0, greeting
    # sb   zero, 0(t0)               # crash: .rodata is not writable

    li   a0, 0
    li   a7, SYS_exit
    ecall
