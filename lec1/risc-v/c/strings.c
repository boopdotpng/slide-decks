long length(const char *s) {
    long n = 0;
    while (s[n] != 0)
        n++;
    return n;
}

const char *greeting(void) {
    return "hi\n";
}
