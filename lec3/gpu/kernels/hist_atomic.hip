#include "hip.h"
// the same, with the add done as one step by the memory itself. right, but every thread queues on 256 counters
__global__ void hist_atomic(unsigned *bins, const unsigned char *img, unsigned n) {
  unsigned i = blockIdx.x * 256 + threadIdx.x;
  if (i < n) atomicAdd(&bins[img[i]], 1);
}
