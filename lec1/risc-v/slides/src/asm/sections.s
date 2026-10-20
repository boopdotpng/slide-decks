next:
    lui   a1, %hi(count)
    ld    a0, %lo(count)(a1)
    addi  a0, a0, 1
    sd    a0, %lo(count)(a1)
    ret

    .section .rodata.str1.1
.L.str:
    .asciz "hello"

    .data
msg:
    .quad .L.str

count:
    .quad 5

    .bss
zeros:
    .zero 800
