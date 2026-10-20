# The calling convention: arguments in a0..a7, result in a0, ra = return address.
# Callee must preserve s0..s11 and sp; t* and a* registers may be clobbered.

    .include "syscalls.inc"
    .text
    .globl _start
_start:
    li   a0, 10
    call fact                        # auipc ra, ... ; jalr ra, ...(ra)
    li   a7, SYS_print_int           # a0 already holds the result
    ecall
    li   a0, '\n'
    li   a7, SYS_print_char
    ecall

    li   a0, 3
    li   a1, 4
    call square_sum                  # 3*3 + 4*4
    ebreak                           # a0 = 25

    li   a0, 0
    li   a7, SYS_exit
    ecall

# long fact(long n): recursive, so it's a non-leaf function and must save ra.
fact:
    addi sp, sp, -16                 # prologue: the stack must stay 16-byte aligned
    sd   ra, 8(sp)                   # the call below overwrites ra
    sd   s0, 0(sp)                   # we use s0, so we must preserve the caller's value
    mv   s0, a0                      # n survives the call in s0

    li   t0, 1
    ble  a0, t0, 1f                  # if n <= 1, return 1
    addi a0, a0, -1
    call fact                        # a0 = fact(n - 1)
    mul  a0, a0, s0                  # a0 = n * fact(n - 1)
    j    2f
1:  li   a0, 1
2:  ld   ra, 8(sp)                   # epilogue: restore in reverse
    ld   s0, 0(sp)
    addi sp, sp, 16
    ret                              # jalr zero, 0(ra)

# long square_sum(long a, long b): a leaf (calls nothing), so no stack frame needed.
square_sum:
    mul  a0, a0, a0
    mul  a1, a1, a1
    add  a0, a0, a1
    ret
