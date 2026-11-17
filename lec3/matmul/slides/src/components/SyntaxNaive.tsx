/** @jsxImportSource preact */
import Syntax, { type Row } from './Syntax';

/** The cuda syntax in solution 1, every piece of which solution 2 uses too. */
const ROWS: Row[] = [
  { code: '__global__ void matmul(...)', what: <>a <b>kernel</b>: a function the gpu runs, once for every thread</>,
    where: <>both solutions: same name, same inputs</> },
  { code: 'const float* A', what: <>the address of A's numbers in the gpu's memory. <code>const</code>: read it, never change it</>,
    where: <>both: A and B are read-only, C is written</> },
  { code: 'blockIdx  blockDim  threadIdx', what: <>which block I'm in, how big a block is, and where I am inside my block. each has <code>.x</code> and <code>.y</code></>,
    where: <>both: turned into my row and column of C</> },
  { code: 'A[row * N + i]', what: <>memory is one long line, so a matrix is stored row after row: row r starts at r × (row length)</>,
    where: <>both: every read of A and B, every write of C</> },
  { code: 'dim3 block(16, 16)', what: <>a size with an x, a y (and a z, which defaults to 1): 16 × 16 = 256 threads per block</>,
    where: <>both: 16 × 16 blocks</> },
  { code: 'matmul<<<grid, block>>>(...)', what: <>start the kernel on the gpu: grid × block threads, all running it at once</>,
    where: <>both: one thread per cell of C</> },
  { code: 'cudaDeviceSynchronize();', what: <>the cpu waits here until the gpu has finished</>,
    where: <>both: in leetgpu's <code>solve</code>, after the launch</> },
];

export default function SyntaxNaive() {
  return <Syntax rows={ROWS} whereHead="in the solutions" />;
}
