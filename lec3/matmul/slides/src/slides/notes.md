# 01-title.astro

the leetgpu "matrix multiplication" problem (easy): A is M × N, B is N × K, C = A · B is M × K, all row-major floats.
benchmark size: M = 8192, N = 6144, K = 4096. two solutions, then three real submissions that pass but are wrong in
some way.

# 02-problem.astro

example 1 from the problem. the point of the last two steps: every cell is independent (one thread each), and
row-major means C[row][col] is C[row * K + col]: the row length is the number of columns.

# 03-syntax-naive.astro

vocabulary before the code: one row per step. every row here shows up in both solutions, so this slide carries
over to solution 2. `solve` and `extern "C"` are leetgpu's wrapper: the cpu-side function their checker calls.

# 04-naive.astro

the full submission (passes):

```cuda
#include <cuda_runtime.h>

__global__ void matrix_multiplication_kernel(const float* A, const float* B, float* C, int M, int N, int K) {
  int row = blockIdx.y * blockDim.y + threadIdx.y;
  int col = blockIdx.x * blockDim.x + threadIdx.x;
  if (row >= M || col >= K) return;
  float sum = 0.0f;
  for (int i = 0; i < N; ++i)
    sum += A[row * N + i] * B[i * K + col];
  C[row * K + col] = sum;
}

extern "C" void solve(const float* A, const float* B, float* C, int M, int N, int K) {
  dim3 threadsPerBlock(16, 16);
  dim3 blocksPerGrid((K + 15) / 16, (M + 15) / 16);
  matrix_multiplication_kernel<<<blocksPerGrid, threadsPerBlock>>>(A, B, C, M, N, K);
  cudaDeviceSynchronize();
}
```

common mistake: square-matrix code (`b[i * N + col]`, `c[row * N + col]`) works on example 1 and breaks as soon as
N ≠ K. and without the bounds check, example 2's block writes 255 floats past the end of C.

# 05-slow.astro

drawn with a 4 × 4 block and 8 × 8 matrices; the counts are for the drawing. real block: 16 × 16, so each row of A and
column of B is fetched 16 times per block. benchmark: 2 · 8192 · 6144 · 4096 ≈ 412 billion float reads (≈ 1.6 TB)
for ≈ 436 MB of matrices. the caches catch part of that; the ratio is the point.

# 06-tiles.astro

drawn with 4 × 4 tiles. the c tile is the block; the strip of a and strip of b go through shared memory one tile pair
at a time. shared memory is per block (per sm), small and fast; global memory is the big slow dram.

# 07-syntax-tiled.astro

only the syntax solution 2 adds, each next to what solution 1 did instead. shared memory: per block, ~48 KB usable by
default on the t4, on-chip; global memory: the 16 GB of dram.

# 08-tiled.astro

same launch shape as the naive kernel (16 × 16 blocks, one thread per cell of C). the full submission (passes):

```cuda
#include <cuda_runtime.h>
#define TILE 16

__global__ void matrix_multiplication_kernel(const float* A, const float* B, float* C, int M, int N, int K) {
  __shared__ float As[TILE][TILE];
  __shared__ float Bs[TILE][TILE];
  int tx = threadIdx.x, ty = threadIdx.y;
  int row = blockIdx.y * TILE + ty, col = blockIdx.x * TILE + tx;
  float sum = 0.0f;
  for (int t = 0; t < (N + TILE - 1) / TILE; ++t) {
    int a = t * TILE + tx, b = t * TILE + ty;
    As[ty][tx] = (row < M && a < N) ? A[row * N + a] : 0.0f;
    Bs[ty][tx] = (b < N && col < K) ? B[b * K + col] : 0.0f;
    __syncthreads();
    for (int i = 0; i < TILE; ++i)
      sum += As[ty][i] * Bs[i][tx];
    __syncthreads();
  }
  if (row < M && col < K) C[row * K + col] = sum;
}

extern "C" void solve(const float* A, const float* B, float* C, int M, int N, int K) {
  dim3 threadsPerBlock(TILE, TILE);
  dim3 blocksPerGrid((K + TILE - 1) / TILE, (M + TILE - 1) / TILE);
  matrix_multiplication_kernel<<<blocksPerGrid, threadsPerBlock>>>(A, B, C, M, N, K);
  cudaDeviceSynchronize();
}
```

the barriers are the same idea as the histogram's lds version in the gpu deck. a __syncthreads() that some threads of
the block skip is undefined behaviour (in practice it can hang or silently mis-sync), hence no early return.

# 09-bugs.astro

all three are real leetgpu submissions for this problem, trimmed. 1: `C[idx] += sum` relies on C starting at zero.
2: the kernel's parameters are named (N, M, K) while solve passes (M, N, K); every use inside is swapped too, so it
works. 3: from a commented-out first attempt: row on threadIdx.x. still correct, but a warp's 32 threads read A 6144
floats apart instead of B side by side (uncoalesced), and write C K floats apart.
