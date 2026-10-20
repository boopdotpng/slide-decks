# 06-arith-c
- all asm on these slides is real clang -O1 output (c/build.sh)
- 1: no stack, no memory: args come in registers, result leaves in a0
- 2: an instruction is 32 bits, so the constant field is only 12 bits (±2048). lui loads the upper 20 bits, addi the low 12
- 3: the compiler knows multiply-by-8 is a shift. you write the clear thing, it picks the cheap thing
