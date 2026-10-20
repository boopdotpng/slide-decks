void fill(long *buf, long n);

long first_plus_last(void) {
    long buf[4];
    fill(buf, 4);
    return buf[0] + buf[3];
}
