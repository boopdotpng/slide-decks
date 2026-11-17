#!/bin/sh
# How many waves fit on one simd, by how many v registers the kernel uses: ./export_occupancy.sh
#   -> slides/public/data/occupancy.json   { cpu, rows: [{ vgprs, waves }] }
# The numbers are llvm's own: it prints "; Occupancy: N" under every kernel it compiles (the register file is a fixed
# size, shared by every wave on the simd). Each row compiles a one-line kernel that is forced to use `vgprs` registers
# (an empty asm block that says it overwrites the highest one).
set -e
cd "$(dirname "$0")"
clang="${LLVM_BIN:-/opt/homebrew/opt/llvm/bin}/clang"
cpu=gfx1201
rows=""
for n in 8 16 24 32 48 64 80 96 104 112 120 128 144 160 176 192 208 224 240 256; do
    occ=$(printf '__attribute__((global)) void k(float *y) { unsigned i = __builtin_amdgcn_workitem_id_x(); __asm__ volatile("" : : : "v%d"); y[i] = 1.0f; }\n' $((n - 1)) |
        "$clang" -x hip --cuda-device-only -nogpulib -nogpuinc --offload-arch=$cpu -O2 -S -o - - | awk '/^; Occupancy:/ { print $3; exit }')
    rows="$rows${rows:+, }{ \"vgprs\": $n, \"waves\": $occ }"
done
mkdir -p slides/public/data
printf '{ "cpu": "%s", "rows": [%s] }\n' "$cpu" "$rows" > slides/public/data/occupancy.json
cat slides/public/data/occupancy.json
