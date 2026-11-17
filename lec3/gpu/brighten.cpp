#include <hip/hip_runtime.h>
#include <vector>

__global__ void brighten(unsigned char *img, unsigned n, unsigned a) {
  unsigned i = blockIdx.x * 256 + threadIdx.x;
  if (i < n) {
    unsigned p = img[i] * a;
    img[i] = p < 255 ? p : 255;
  }
}

int main() {
  const unsigned n = 12'000'000;            // a 12 megapixel photo, one byte per pixel
  std::vector<unsigned char> img(n);        // (reading the photo from a file: left out)

  unsigned char *gimg;
  hipMalloc(&gimg, n);
  hipMemcpy(gimg, img.data(), n, hipMemcpyHostToDevice);

  const unsigned block = 256, blocks = (n + block - 1) / block;
  brighten<<<blocks, block>>>(gimg, n, 2);

  hipMemcpy(img.data(), gimg, n, hipMemcpyDeviceToHost);
  hipFree(gimg);
}
