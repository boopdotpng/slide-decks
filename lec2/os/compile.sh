#!/bin/sh
# Compile C to RISC-V assembly:   ./compile.sh compiled/foo.c [-O0|-O1|-O2]
#   -> compiled/foo.s, which ./rv.sh run can execute.
# The default is -O1, which is readable but still optimized. Try -O0 to see every
# variable go through the stack, or -O2 to see what the optimizer can do.
set -e
src="$1"; shift
opt="${1:--O1}"
clang="${RV_LLVM_BIN:-/opt/homebrew/opt/llvm/bin}/clang"
"$clang" --target=riscv64 -march=rv64im -mabi=lp64 -mno-relax "$opt" \
    -ffreestanding -fno-asynchronous-unwind-tables -fno-addrsig -fno-ident \
    -S -o "${src%.c}.s" "$src"
echo "${src%.c}.s"
