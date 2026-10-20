fact:
    mv    a1, a0
    li    a0, 1
    li    a2, 2
    blt   a1, a2, .LBB0_2
.LBB0_1:
    mul   a0, a0, a1
    addi  a1, a1, -1
    bge   a1, a2, .LBB0_1
.LBB0_2:
    ret
