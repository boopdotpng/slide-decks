// ./compile.sh compiled/sum.c        -> compiled/sum.s (read it!)
// ./rv.sh run compiled/sum.s

#include "rv.h"

long numbers[] = {3, 1, 4, 1, 5, 9, 2, 6};      // initialized global: goes in .data

// noinline: keep sum a real function so you can see the call in the assembly.
__attribute__((noinline)) long sum(const long *values, long count) {
    long total = 0;
    for (long i = 0; i < count; i++)
        total += values[i];
    return total;
}

int main(void) {
    long s = sum(numbers, 8);
    ebreak();                // find 31 in the dump: the compiler picks which register holds s
    print_str("sum = ");     // string literal: goes in .rodata
    print_int(s);
    print_char('\n');
    return 0;                // main's return value becomes the exit code
}
