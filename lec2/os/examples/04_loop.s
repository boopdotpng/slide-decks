# Loops and branches. RISC-V has no flags register: compare-and-branch is one instruction.
# sum = 1 + 2 + ... + 10

    .include "syscalls.inc"
    .text
    .globl _start
_start:
    li   t0, 0                       # sum
    li   t1, 1                       # i
    li   t2, 10                      # limit
loop:
    add  t0, t0, t1                  # sum += i
    addi t1, t1, 1                   # i++
    ble  t1, t2, loop                # pseudo for: bge t2, t1, loop

    mv   a0, t0
    li   a7, SYS_print_int
    ecall
    li   a0, '\n'
    li   a7, SYS_print_char
    ecall

    mv   a0, t0                      # the sum is also the exit code (echo $?)
    li   a7, SYS_exit
    ecall
