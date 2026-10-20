# add up the numbers in an array. no functions, no stack: registers, memory, one loop.
#   ../../lec2/os/rv.sh run sum.s      ebreak prints the registers; the exit code is the sum (echo $?)

    .data
nums:
    .dword 3, 1, 4, 1, 5, 9, 2, 6    # 8 numbers, 8 bytes each
total:
    .dword 0                         # the answer goes here

    .text
    .globl _start
_start:
    la   t0, nums                    # t0 = address of nums[0]
    li   t1, 8                       # t1 = how many are left
    li   t2, 0                       # t2 = sum so far
loop:
    ld   t3, 0(t0)                   # t3 = the number t0 points at
    add  t2, t2, t3                  # sum += it
    addi t0, t0, 8                   # point at the next one (8 bytes on)
    addi t1, t1, -1                  # one fewer left
    bne  t1, zero, loop              # any left? go again

    la   t4, total
    sd   t2, 0(t4)                   # total = sum
    ebreak                           # print the registers: t2 should be 31

    mv   a0, t2                      # exit code = the sum
    li   a7, 93                      # syscall 93 is exit
    ecall
