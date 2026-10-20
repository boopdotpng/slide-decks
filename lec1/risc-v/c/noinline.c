__attribute__((noinline)) long square(long x) {
    return x * x;
}

long dist2(long x, long y) {
    return square(x) + square(y);
}
