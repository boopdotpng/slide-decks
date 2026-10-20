# Hello world: two Linux syscalls and nothing else.

    .section .rodata                 # read-only data: string literals live here
msg:
    .ascii "hello, world\n"          # 13 bytes (\n is one byte)

    .text                            # code
    .globl _start
_start:                              # execution begins here
    li   a0, 1                       # fd 1 = stdout
    la   a1, msg                     # address of the bytes
    li   a2, 13                      # how many bytes
    li   a7, 64                      # syscall 64 = write
    ecall                            # a0 = bytes written
    ebreak                           # look at the registers

    li   a0, 0                       # exit code
    li   a7, 93                      # syscall 93 = exit
    ecall
