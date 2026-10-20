length:
    li    a1, 0
.LBB0_1:
    add   a2, a0, a1
    lbu   a2, 0(a2)
    addi  a1, a1, 1
    bnez  a2, .LBB0_1
    addi  a0, a1, -1
    ret

greeting:
    lui   a0, %hi(.L.str)
    addi  a0, a0, %lo(.L.str)
    ret

    .section .rodata.str1.1
.L.str:
    .asciz "hi\n"
