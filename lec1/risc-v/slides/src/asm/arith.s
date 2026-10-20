f:
    mul   a0, a1, a0
    add   a0, a0, a2
    ret

big:
    lui   a1, 244
    addi  a1, a1, 576
    add   a0, a0, a1
    ret

scale:
    slli  a0, a0, 3
    ret
