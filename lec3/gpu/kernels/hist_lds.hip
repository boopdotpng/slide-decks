#include "hip.h"
// each block counts 16 × 256 pixels into its own 256 bins in lds, then adds them to the real ones
__global__ void hist_lds(unsigned *bins, const unsigned char *img, unsigned n) {
  __shared__ unsigned local[256];                // one copy per block, in lds
  unsigned t = threadIdx.x;                      // 256 threads, 256 bins: bin t is mine
  local[t] = 0;
  __syncthreads();                               // wait: every bin is cleared
  for (unsigned k = 0; k < 16; k++) {
    unsigned i = (blockIdx.x * 16 + k) * 256 + t;
    if (i < n) atomicAdd(&local[img[i]], 1);     // near: lds
  }
  __syncthreads();                               // wait: every pixel is counted
  atomicAdd(&bins[t], local[t]);                 // far: one add per bin per block
}
