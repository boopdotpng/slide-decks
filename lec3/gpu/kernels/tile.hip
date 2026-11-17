#include "hip.h"
// one 16x16 tile of a matmul, d = a*b + d, as a single instruction (wmma: amd's "tensor core").
// the wave's 32 lanes together hold the three matrices: 8 numbers per lane, 32 x 8 = 256 = 16 x 16
typedef _Float16 half8 __attribute__((ext_vector_type(8)));
typedef float float8 __attribute__((ext_vector_type(8)));
__global__ void tile(float8 *d, const half8 *a, const half8 *b) {
  unsigned t = threadIdx.x;
  d[t] = __builtin_amdgcn_wmma_f32_16x16x16_f16_w32_gfx12(a[t], b[t], d[t]);
}
