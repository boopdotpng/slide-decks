void *malloc(unsigned long size);

long *squares(long n) {
    long *p = malloc(n * 8);
    for (long i = 0; i < n; i++)
        p[i] = i * i;
    return p;
}
