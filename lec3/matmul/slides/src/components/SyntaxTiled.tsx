/** @jsxImportSource preact */
import Syntax, { type Row } from './Syntax';

/** The cuda syntax solution 2 adds on top of solution 1's, and what solution 1 did instead. */
const ROWS: Row[] = [
  { code: '#define TILE 16', what: <>a name for a number. the compiler swaps every <code>TILE</code> for 16</>,
    where: <>solution 1 just wrote 16</> },
  { code: '__shared__ float As[TILE][TILE];', what: <><b>shared memory</b>: small, fast memory inside the chip. each block gets its own copy, and all its threads can see it</>,
    where: <>solution 1 read everything from the big, slow main memory</> },
  { code: 'As[ty][tx]', what: <>a real 2d array: row ty, column tx. no <code>row * N + col</code> needed</>,
    where: <>solution 1 only had flat, one-line arrays</> },
  { code: 'cond ? x : 0.0f', what: <>pick x if cond is true, otherwise 0</>,
    where: <>solution 1 used <code>if (...) return;</code> at the edge</> },
  { code: '__syncthreads();', what: <>wait here until <b>every</b> thread in my block has arrived</>,
    where: <>solution 1 never needed it: its threads never shared anything</> },
];

export default function SyntaxTiled() {
  return <Syntax rows={ROWS} whereHead="compared to solution 1" />;
}
