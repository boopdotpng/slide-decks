first_plus_last:
    addi  sp, sp, -48
    sd    ra, 40(sp)
    addi  a0, sp, 8
    li    a1, 4
    call  fill
    ld    a0, 8(sp)
    ld    a1, 32(sp)
    add   a0, a1, a0
    ld    ra, 40(sp)
    addi  sp, sp, 48
    ret
