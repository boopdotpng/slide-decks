clamp:
    blt   a0, a1, .LBB0_2
    mv    a0, a1
.LBB0_2:
    slli  a0, a0, 1
    ret
