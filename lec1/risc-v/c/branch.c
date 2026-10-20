long clamp(long x, long hi) {
    if (x > hi)
        x = hi;
    return x * 2;
}
