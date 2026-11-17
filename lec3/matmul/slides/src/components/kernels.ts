/**
 * The two leetgpu solutions, as shown on the slides: the kernel and its launch, without the #include / extern "C"
 * boilerplate. Both pass leetgpu's matrix multiplication problem (A is M × N, B is N × K, C is M × K, row-major);
 * the full submissions are in notes.md.
 */
export const NAIVE = `__global__ void matmul(const float* A, const float* B, float* C,
                       int M, int N, int K) {
  int row = blockIdx.y * blockDim.y + threadIdx.y;   // which row of C
  int col = blockIdx.x * blockDim.x + threadIdx.x;   // which column of C
  if (row >= M || col >= K) return;                  // past the edge

  float sum = 0.0f;
  for (int i = 0; i < N; ++i)
    sum += A[row * N + i] * B[i * K + col];
  C[row * K + col] = sum;
}

dim3 block(16, 16), grid((K + 15) / 16, (M + 15) / 16);
matmul<<<grid, block>>>(A, B, C, M, N, K);`;

export const TILED = `#define TILE 16

__global__ void matmul(const float* A, const float* B, float* C,
                       int M, int N, int K) {
  __shared__ float As[TILE][TILE];   // this block's tile of A
  __shared__ float Bs[TILE][TILE];   // this block's tile of B
  int tx = threadIdx.x, ty = threadIdx.y;
  int row = blockIdx.y * TILE + ty, col = blockIdx.x * TILE + tx;

  float sum = 0.0f;
  for (int t = 0; t < (N + TILE - 1) / TILE; ++t) {
    int a = t * TILE + tx, b = t * TILE + ty;   // my A column, my B row
    As[ty][tx] = (row < M && a < N) ? A[row * N + a] : 0.0f;
    Bs[ty][tx] = (b < N && col < K) ? B[b * K + col] : 0.0f;
    __syncthreads();                   // wait: tiles full

    for (int i = 0; i < TILE; ++i)
      sum += As[ty][i] * Bs[i][tx];
    __syncthreads();                   // wait: everyone done with them
  }
  if (row < M && col < K) C[row * K + col] = sum;
}`;
