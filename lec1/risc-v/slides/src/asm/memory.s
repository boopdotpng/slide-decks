get:
    slli  a1, a1, 3
    add   a0, a0, a1
    ld    a0, 0(a0)
    ret

set:
    slli  a1, a1, 2
    add   a0, a0, a1
    sw    a2, 0(a0)
    ret

first:
    lbu   a0, 0(a0)
    ret
