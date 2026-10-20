# 07-memory-c
- the only instructions that touch memory are loads and stores. everything else is register to register
- 1: a[i] is a + i * sizeof(long). the scale comes from the type, that's why c needs types
- 2: same shape, × 4 for int. sw stores only the low 4 bytes of a2
- 3: lbu zero-extends. char is unsigned on risc-v linux (signed on x86): a real portability gotcha
- the offset in 0(a0) is a free add: ld a0, 16(a0) would read a[2] with no extra instruction
