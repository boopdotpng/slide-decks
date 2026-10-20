# Syscall numbers: put one in a7, the arguments in a0..a5, then `ecall`.
# The result comes back in a0.

# Real Linux syscalls: these also work under qemu-riscv64.
.equ SYS_read,        63    # read(fd, buf, len)  -> bytes read
.equ SYS_write,       64    # write(fd, buf, len) -> bytes written
.equ SYS_exit,        93    # exit(code)
.equ SYS_brk,        214    # brk(addr) -> new break (brk(0) = current break)

# Shortcuts that exist only in the rv emulator.
.equ SYS_print_int,  1000   # print a0 as a signed decimal
.equ SYS_print_hex,  1001   # print a0 as hex
.equ SYS_print_str,  1002   # print the NUL-terminated string at a0
.equ SYS_print_char, 1003   # print the low byte of a0
.equ SYS_malloc,     1004   # a0 = size -> a0 = pointer (0 if the 1 MB heap is full)
.equ SYS_free,       1005   # does nothing; the toy malloc never reuses memory
