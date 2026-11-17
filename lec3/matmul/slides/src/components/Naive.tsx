/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import { NAIVE } from './kernels';
import { MM, MM_CSS } from './mm';

/**
 * The naive kernel, line by line, next to a picture: C cut into 16 × 16 blocks (the brighten2d picture), leetgpu's
 * example 2 (a 1 × 1 answer, so 255 of the block's threads do nothing), the dot product as a row of A meeting a column
 * of B, and where those numbers sit in row-major memory. The drawn C is 64 × 48 (4 × 3 blocks); the benchmark size
 * (M = 8192, K = 4096) is in the launch step's arithmetic. The code appears a few lines per step, and all of it
 * only on the last step.
 */
const T = 16, BX = 2, BY = 1, TX = 9, TY = 6; // the block and thread we point at
const ROW = BY * T + TY, COL = BX * T + TX;
const CW = 4 * T, CH = 3 * T; // the drawn C, in cells
// the small matmul for the dot-product steps
const SM = 6, SN = 8, SK = 5, R = 2, Q = 3, I = 3;

type Pic = 'blocks' | 'me' | 'edge' | 'dot' | 'index' | 'launch';
// show: how many lines of the code are visible (the rest stay hidden until their step); hl: the lines this step is about
const STEPS: { show: number; hl: number[]; pic: Pic; text: ComponentChildren }[] = [
  { show: 2, hl: [0, 1], pic: 'blocks',
    text: <><code>__global__</code> makes this a <b>kernel</b>: the gpu runs it once for every thread. A, B and C are already in the gpu's memory</> },
  { show: 4, hl: [2, 3], pic: 'me',
    text: <>each thread first asks: <b>which cell of C is mine?</b> skip the blocks before mine, then add my spot inside my block. x counts columns, y counts rows</> },
  { show: 5, hl: [4], pic: 'edge',
    text: <>C doesn't always split evenly into 16 × 16 blocks, so some threads land outside it. they stop right here</> },
  { show: 9, hl: [6, 7, 8], pic: 'dot',
    text: <>the math: go along my row of A and down my column of B, multiply each pair, add it to <code>sum</code></> },
  { show: 11, hl: [9, 10], pic: 'index',
    text: <>store the answer. each row of C is K numbers long, so C[row][col] sits at <code>row * K + col</code></> },
  { show: 14, hl: [12, 13], pic: 'launch',
    text: <>back on the cpu: 16 × 16 threads per block, and enough blocks to cover all of C. <code>&lt;&lt;&lt; &gt;&gt;&gt;</code> starts them</> },
  { show: 14, hl: [], pic: 'blocks',
    text: <>the whole solution. every thread runs these same lines, each on its own cell of C</> },
];

const pct = (a: number, b: number) => `${(a / b) * 100}%`;

export default function Naive() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  const pic = st.pic;
  const onC = pic === 'blocks' || pic === 'me' || pic === 'launch';
  const onMM = pic === 'dot' || pic === 'index';
  return (
    <div class="naive" ref={root}>
      <div class="nv-cols">
        <div class="nv-code"><Code lang="cpp" code={NAIVE} hl={st.hl} /></div>
        <style>{`.naive .nv-code .ln:nth-child(n + ${st.show + 1}) { opacity: 0; }`}</style>
        <div class="nv-pic">
          <div class={`nv-c fade ${onC ? 'on' : ''}`}>
            <div class="nv-img">
              {Array.from({ length: CW / T - 1 }, (_, c) => <i class="nv-v" style={{ left: pct((c + 1) * T, CW) }} />)}
              {Array.from({ length: CH / T - 1 }, (_, r) => <i class="nv-h" style={{ top: pct((r + 1) * T, CH) }} />)}
              {pic === 'me' && <>
                <i class="nv-blk" style={{ left: pct(BX * T, CW), top: pct(BY * T, CH), width: pct(T, CW), height: pct(T, CH) }} />
                <i class="nv-cx" style={{ left: pct(COL + .5, CW) }} /><i class="nv-cy" style={{ top: pct(ROW + .5, CH) }} />
                <i class="nv-px" style={{ left: pct(COL, CW), top: pct(ROW, CH), width: pct(1, CW), height: pct(1, CH) }} />
              </>}
            </div>
            <div class="muted nv-cap">C, cut into 16 × 16 blocks: one thread per cell</div>
            <div class="nv-sc">
              {pic === 'me' && <>
                <span class="muted">blockIdx.y * blockDim.y + threadIdx.y</span>{'\n'}row = <span class="c-b">{BY}</span> * <span class="c-s">16</span> + <span class="c-t">{TY}</span> = <span class="c-r">{ROW}</span>,{' '}
                {'\n'}col = <span class="c-b">{BX}</span> * <span class="c-s">16</span> + <span class="c-t">{TX}</span> = <span class="c-r">{COL}</span>
              </>}
              {pic === 'launch' && <>benchmark: (<span class="c-s">4096</span> + 15) / 16 = <span class="c-r">256</span> blocks across{'\n'}           (<span class="c-s">8192</span> + 15) / 16 = <span class="c-r">512</span> blocks down</>}
            </div>
          </div>
          <div class={`nv-edge fade ${pic === 'edge' ? 'on' : ''}`}>
            <div class="nv-blk16">{Array.from({ length: 256 }, (_, i) => <i class={i === 0 ? 'live' : ''} />)}</div>
            <div class="muted nv-cap">one 16 × 16 block over a 1 × 1 C: only thread (0, 0) has a cell</div>
          </div>
          <div class={`nv-mm fade ${onMM ? 'on' : ''}`}>
            <MM m={SM} n={SN} k={SK} cell={26}
              names={['A · M × N', 'B · N × K', 'C · M × K']}
              a={(r, c) => (r === R ? (c === I ? 'cur' : 'in') : '')}
              b={(r, c) => (c === Q ? (r === I ? 'cur' : 'in') : '')}
              c={(r, c) => (r === R && c === Q ? 'out' : '')} />
            <div class="nv-sc nv-ix">
              {pic === 'dot' && <>sum += A[row][<span class="c-t">i</span>] * B[<span class="c-t">i</span>][col], for <span class="c-t">i</span> = 0 … N − 1</>}
              {pic === 'index' && <>A[row][i] = A[row * <span class="c-s">N</span> + i]   B[i][col] = B[i * <span class="c-s">K</span> + col]</>}
            </div>
          </div>
        </div>
      </div>
      <div class="caption nv-text">{st.text}</div>
      <style>{MM_CSS + `
        .naive .nv-cols { display: flex; gap: 1.4em; align-items: center; }
        .naive .nv-code { flex: 1; min-width: 0; }
        .naive .nv-code pre { margin: 0; font-size: .46em; overflow: hidden; }
        .naive .nv-pic { flex: none; width: 600px; display: grid; align-items: center; }
        .naive .nv-c, .naive .nv-edge, .naive .nv-mm { grid-area: 1 / 1; }
        .naive .nv-img { position: relative; aspect-ratio: ${CW} / ${CH}; background: color-mix(in srgb, var(--hot) 22%, var(--surface)); border-radius: 4px; overflow: hidden; }
        .naive .nv-img i { position: absolute; pointer-events: none; }
        .naive .nv-v { top: 0; bottom: 0; width: 2px; background: var(--bg); }
        .naive .nv-h { left: 0; right: 0; height: 2px; background: var(--bg); }
        .naive .nv-blk { box-shadow: inset 0 0 0 3px var(--accent); background: color-mix(in srgb, var(--accent) 25%, transparent); }
        .naive .nv-cx { top: 0; bottom: 0; width: 1px; background: color-mix(in srgb, var(--hot) 70%, transparent); }
        .naive .nv-cy { left: 0; right: 0; height: 1px; background: color-mix(in srgb, var(--hot) 70%, transparent); }
        .naive .nv-px { background: var(--hot); outline: 2px solid var(--hot); outline-offset: 2px; }
        .naive .nv-cap { font-size: .42em; margin-top: .4em; }
        .naive .nv-sc { font: .46em/1.6 var(--mono); margin-top: .6em; min-height: 1.6em; white-space: pre; overflow: hidden; }
        .naive .nv-ix { text-align: center; }
        .naive .nv-blk16 { display: grid; grid-template-columns: repeat(16, 1fr); gap: 3px; width: 72%; margin: 0 auto; aspect-ratio: 1; }
        .naive .nv-blk16 i { border-radius: 2px; outline: 1px dashed var(--muted); outline-offset: -1px; }
        .naive .nv-blk16 i.live { background: var(--hot); outline: none; }
        .naive .nv-edge .nv-cap { text-align: center; }
        .naive .mm-g i.in { background: var(--accent); }
        .naive .mm-g i.cur { background: var(--accent); box-shadow: 0 0 0 2px var(--fg); }
        .naive .mm-g i.out { background: var(--hot); }
        .naive .c-b { color: var(--accent); } .naive .c-t { color: var(--teal); }
        .naive .c-s { color: var(--purple); } .naive .c-r { color: var(--hot); font-weight: 700; }
        .naive .nv-text { font-size: .8em; min-height: 2.4em; margin-top: 1em; }
      `}</style>
    </div>
  );
}
