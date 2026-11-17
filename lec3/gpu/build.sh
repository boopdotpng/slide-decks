#!/bin/sh
# Compile every kernels/*.hip to AMD gpu assembly for the slides: ./build.sh
#   -> slides/src/asm/NAME.CPU.s, imported by slides as '../asm/NAME.gfx1100.s?raw'
# CPU is llvm's name for a gpu: gfx1201 = rx 9070 xt (rdna4), the deck's gpu. brighten is also built for
# gfx1100 (rdna3, rx 7900) and gfx942 (cdna3, instinct mi300) for the "same program, other amd gpus" slide.
#
# The output is clang's, cut down to the kernel body: assembler directives, compiler comments and the non-kernel copy
# of the function (__clang_ocl_kern_imp_*) are dropped, and so are three things the slides don't explain:
#   _e32 / _e64     which encoding of the instruction llvm picked (4 or 8 bytes). the assembler accepts the bare name
#   s_delay_alu     a hint: "the next instruction depends on the one before", lets the hardware skip a check
#   s_clause        a hint: "don't switch to another wave between the next n instructions"
# Needs no rocm install: clang compiles hip by itself (-x hip), and kernels/hip.h stands in for hip's headers.
set -e
cd "$(dirname "$0")"
clang="${LLVM_BIN:-/opt/homebrew/opt/llvm/bin}/clang"
out=slides/src/asm
mkdir -p "$out"
build() { # NAME CPU
    "$clang" -x hip --cuda-device-only -nogpulib -nogpuinc --offload-arch="$2" -O2 -S -o - "kernels/$1.hip" |
    sed -n "/^$1:/,/s_endpgm/p" |
    grep -v -e '^[[:space:]]*\.[a-z]' -e '^;' -e 's_delay_alu' -e 's_clause' |
    sed -E -e 's/[[:space:]]+;.*$//' -e 's/_e(32|64)([[:space:]])/\2/' -e 's/^\t([a-z0-9_]+)\t/    \1 /' -e 's/^\t/    /' \
        > "$out/$1.$2.s"
    echo "$out/$1.$2.s"
}
for k in brighten shadows hist_naive hist_atomic hist_lds tile; do build "$k" gfx1201; done
for cpu in gfx1100 gfx942; do build brighten "$cpu"; done
