// rv.h: talk to the rv emulator from C.
// There's no C library here, so each function below is just a syscall:
// number in a7, argument in a0, then `ecall`. Same as you'd write in assembly.
#pragma once

static inline long rv_syscall(long number, long arg) {
    register long a0 __asm__("a0") = arg;
    register long a7 __asm__("a7") = number;
    __asm__ volatile("ecall" : "+r"(a0) : "r"(a7) : "memory");
    return a0;
}

static inline void print_int(long value)        { rv_syscall(1000, value); }
static inline void print_hex(long value)        { rv_syscall(1001, value); }
static inline void print_str(const char *s)     { rv_syscall(1002, (long)s); }
static inline void print_char(char c)           { rv_syscall(1003, c); }
static inline void *malloc(unsigned long size)  { return (void *)rv_syscall(1004, (long)size); }
static inline void free(void *ptr)              { rv_syscall(1005, (long)ptr); }
static inline void exit(int code)               { rv_syscall(93, code); }

// Print all 32 registers, then keep going.
#define ebreak() __asm__ volatile("ebreak")
