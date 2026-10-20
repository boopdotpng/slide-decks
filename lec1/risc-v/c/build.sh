#!/bin/sh
# Compile every c/*.c to RISC-V assembly for the slides: ./build.sh
#   -> ../slides/src/asm/NAME.s, imported by slides as '../asm/NAME.s?raw'.
# Same flags as os/compile.sh. The output is clang's, with the bookkeeping
# directives (.type, .size, .p2align, ...) and compiler comments removed.
set -e
cd "$(dirname "$0")"
clang="${RV_LLVM_BIN:-/opt/homebrew/opt/llvm/bin}/clang"
out=../slides/src/asm
mkdir -p "$out"
for src in *.c; do
    name="${src%.c}"
    "$clang" --target=riscv64 -march=rv64im -mabi=lp64 -mno-relax -O1 \
        -ffreestanding -fno-asynchronous-unwind-tables -fno-addrsig -fno-ident \
        -S -o - "$src" |
    grep -v -e '^[[:space:]]*\.\(attribute\|file\|p2align\|type\|size\|globl\)' \
            -e '^\.Lfunc_end' -e '%bb\.' -e 'note\.GNU-stack' -e '^[[:space:]]*\.text$' |
    sed -E -e 's/[[:space:]]+#.*$//' \
           -e 's/^[[:space:]]*(\.section[[:space:]]+[^,]+),.*/    \1/' \
           -e 's/^\t([a-z.]+)\t/    \1 /' |
    awk '{ if (match($0, /^    [a-z.]+ /)) { m = $1; rest = substr($0, RSTART + RLENGTH); printf "    %-5s %s\n", m, rest } else print }' |
    sed -E 's/^\t\.section\t/.section /; s/\.section\t/.section /; s/^\t/    /' |
    cat -s | sed -e '/./,$!d' > "$out/$name.s"
    # drop a trailing blank line
    printf '%s\n' "$(cat "$out/$name.s")" > "$out/$name.s"
    echo "$out/$name.s"
done
