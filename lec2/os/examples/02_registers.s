# Registers, li, and ebreak. Each ebreak prints all 32 registers (* = changed).

    .include "syscalls.inc"
    .text
    .globl _start
_start:
    li   t0, 42                      # fits in 12 bits: a single addi
    li   t1, -1                      # all 64 bits set
    li   t2, 0x12345678              # too big for 12 bits: lui + addiw
    li   t3, 0x12345fff              # the sign-extension trap: low 12 bits = 0xfff = -1,
                                     # so lui must load 0x12346, not 0x12345
    li   t4, 0x123456789abcdef0      # 64-bit constants take a whole sequence
    mv   s1, t0                      # really: addi s1, t0, 0
    add  zero, t0, t1                # writes to x0 are thrown away
    ebreak                           # register dump here, then keep going

    addi t0, t0, 1
    sub  t1, t0, t2
    ebreak

    li   a0, 0
    li   a7, SYS_exit
    ecall
