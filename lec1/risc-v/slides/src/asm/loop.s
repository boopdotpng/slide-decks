sum:
    li    a2, 0
    blez  a1, .LBB0_3
    slli  a1, a1, 3
    add   a1, a0, a1
.LBB0_2:
    ld    a3, 0(a0)
    addi  a0, a0, 8
    add   a2, a3, a2
    bne   a0, a1, .LBB0_2
.LBB0_3:
    mv    a0, a2
    ret
