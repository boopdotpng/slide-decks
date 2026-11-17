#include "hip.h"
// count how many pixels have each brightness: 256 counters. looks right, isn't
__global__ void hist_naive(unsigned *bins, const unsigned char *img, unsigned n) {
  unsigned i = blockIdx.x * 256 + threadIdx.x;
  if (i < n) bins[img[i]]++;                     // read, add 1, write: three steps
}
