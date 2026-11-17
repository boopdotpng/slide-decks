#include "hip.h"
// brighten only the dark pixels: a branch, so the threads of one wave can disagree
__global__ void shadows(unsigned char *img, unsigned n) {
  unsigned i = blockIdx.x * 256 + threadIdx.x;
  if (i < n) {
    unsigned p = img[i];
    if (p < 40) img[i] = p * 2;                  // dark: brighten. light: do nothing
  }
}
