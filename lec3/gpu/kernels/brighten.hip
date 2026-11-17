#include "hip.h"
// brighten a grayscale image: every pixel times a, capped at 255 (white). one thread per pixel
__global__ void brighten(unsigned char *img, unsigned n, unsigned a) {
  unsigned i = blockIdx.x * 256 + threadIdx.x;   // my pixel
  if (i < n) {                                   // the last block sticks out past the end
    unsigned p = img[i] * a;
    img[i] = p < 255 ? p : 255;
  }
}
