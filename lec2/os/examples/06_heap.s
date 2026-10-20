# The heap is memory you ask the OS for. malloc is just a function call
# (here, a syscall shortcut) that hands back a pointer in a0.
# Build an array of 10 squares on the heap and print them.

    .include "syscalls.inc"
    .equ N, 10

    .text
    .globl _start
_start:
    li   a0, N * 8                   # 10 dwords
    li   a7, SYS_malloc
    ecall
    mv   s0, a0                      # s0 = array base
    ebreak                           # look at a0: an address in the heap

    li   t0, 0                       # i
    li   t1, N
fill:
    mul  t2, t0, t0                  # i * i
    slli t3, t0, 3                   # byte offset = i * 8
    add  t3, s0, t3
    sd   t2, 0(t3)                   # array[i] = i * i
    addi t0, t0, 1
    blt  t0, t1, fill

    li   s1, 0
print:
    slli t3, s1, 3
    add  t3, s0, t3
    ld   a0, 0(t3)
    li   a7, SYS_print_int
    ecall
    li   a0, ' '
    li   a7, SYS_print_char
    ecall
    addi s1, s1, 1
    li   t1, N
    blt  s1, t1, print

    li   a0, '\n'
    li   a7, SYS_print_char
    ecall

    # Underneath, malloc moved the "break" (the end of the heap). brk(0) reports it:
    li   a0, 0
    li   a7, SYS_brk
    ecall                            # a0 = s0 + 80

    # Reading past the break faults. Uncomment to see:
    # ld   t0, 80(s0)

    li   a0, 0
    li   a7, SYS_exit
    ecall
