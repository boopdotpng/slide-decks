/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';
import { MM, MM_CSS } from './mm';

/**
 * Why the naive kernel is slow: neighbouring threads fetch the same numbers from global memory over and over. Drawn
 * small: 8 × 8 matrices and a 4 × 4 block (a real one is 16 × 16), with the read counts for the drawn sizes. The
 * benchmark totals: 2·M·N·K reads = 2 · 8192 · 6144 · 4096 ≈ 412 billion floats ≈ 1.6 TB, against
 * (8192·6144 + 6144·4096 + 8192·4096) floats ≈ 436 MB of matrices. Caches catch part of it; the point is the ratio.
 */
const S = 8, B0 = 2, BW = 4; // drawn sizes: matrices S × S, the block is rows / cols B0 … B0 + BW - 1
const inB = (i: number) => i >= B0 && i < B0 + BW;

type St = { rows: number; cols: number; reads: number; distinct: number; text: ComponentChildren };
// rows × cols of the block's threads lit; reads = every thread fetches 2 · S numbers
const STEPS: St[] = [
  { rows: 1, cols: 1, reads: 2 * S, distinct: 2 * S,
    text: <>one thread reads a whole row of A and a whole column of B from the gpu's <b>main memory</b>: big, but slow to reach</> },
  { rows: 1, cols: BW, reads: BW * 2 * S, distinct: S + BW * S,
    text: <>the threads next to it read <b>the same row of A</b>, and each one fetches it all over again</> },
  { rows: BW, cols: BW, reads: BW * BW * 2 * S, distinct: 2 * BW * S,
    text: <>the same goes for B. in this 4 × 4 block, every number is fetched 4 times. real blocks are 16 × 16: <b>16 times</b></> },
  { rows: BW, cols: BW, reads: BW * BW * 2 * S, distinct: 2 * BW * S,
    text: <>at full size: 412 billion reads for 436 MB of data. the threads spend most of their time waiting for memory</> },
];

export default function Slow() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  const thR = (r: number) => r >= B0 && r < B0 + st.rows;
  const thC = (c: number) => c >= B0 && c < B0 + st.cols;
  return (
    <div class="slow" ref={root}>
      <div class="sl-cols">
        <MM m={S} n={S} k={S} cell={30}
          names={['A', 'B', 'C: a 4 × 4 block of threads']}
          a={(r) => (thR(r) ? 'in' : '')}
          b={(_, c) => (thC(c) ? 'in' : '')}
          c={(r, c) => (thR(r) && thC(c) ? 'out' : inB(r) && inB(c) ? 'blk' : '')} />
        <div class="sl-count">
          <div class="sl-row"><span class="muted">numbers fetched</span><b class="sl-big">{st.reads}</b></div>
          <div class="sl-row"><span class="muted">different numbers</span><b class="sl-big sl-d">{st.distinct}</b></div>
          <div class={`sl-row fade ${k >= 2 ? 'on' : ''}`}><span class="muted">wasted</span><b class="sl-big sl-w">{st.reads / st.distinct}×</b></div>
          <div class={`sl-real fade ${k === 3 ? 'on' : ''}`}>
            <div>2 · M · N · K = <b>412 billion</b> reads</div>
            <div class="muted">for 436 MB of A, B and C</div>
          </div>
        </div>
      </div>
      <div class="caption sl-text">{st.text}</div>
      <style>{MM_CSS + `
        .slow .sl-cols { display: flex; gap: 3em; align-items: center; justify-content: center; }
        .slow .mm-g i.in { background: var(--accent); }
        .slow .mm-g i.out { background: var(--hot); }
        .slow .mm-g i.blk { background: color-mix(in srgb, var(--hot) 30%, var(--surface)); }
        .slow .sl-count { display: grid; gap: .5em; min-width: 9em; }
        .slow .sl-row { display: flex; justify-content: space-between; align-items: baseline; gap: 1em; font-size: .6em; }
        .slow .sl-big { font: 700 1.5em var(--mono); color: var(--accent); }
        .slow .sl-d { color: var(--good); } .slow .sl-w { color: var(--bad); }
        .slow .sl-real { font-size: .55em; margin-top: .8em; line-height: 1.6; }
        .slow .sl-text { font-size: .8em; min-height: 2.4em; margin-top: 1.2em; text-align: center; }
      `}</style>
    </div>
  );
}
