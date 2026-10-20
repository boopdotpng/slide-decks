squares:
    addi  sp, sp, -16
    sd    ra, 8(sp)
    sd    s0, 0(sp)
    mv    s0, a0
    slli  a0, a0, 3
    call  malloc
    blez  s0, .LBB0_3
    li    a1, 0
    mv    a2, a0
.LBB0_2:
    mul   a3, a1, a1
    addi  a1, a1, 1
    sd    a3, 0(a2)
    addi  a2, a2, 8
    bne   s0, a1, .LBB0_2
.LBB0_3:
    ld    ra, 8(sp)
    ld    s0, 0(sp)
    addi  sp, sp, 16
    ret
