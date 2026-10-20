long sum(long *a, long n) {
    long total = 0;
    for (long i = 0; i < n; i++)
        total += a[i];
    return total;
}
