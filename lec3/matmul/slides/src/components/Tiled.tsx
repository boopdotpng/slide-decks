/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import { TILED } from './kernels';

/**
 * The tiled kernel, line by line, next to the block's two shared tiles (16 × 16 each) and one thread in them. The
 * edge step draws a block hanging off the bottom-right corner: its threads past the edge load zeros. The code
 * appears a few lines per step, and all of it only on the last step.
 */
const T = 16, TX = 5, TY = 9; // the thread we point at
const EDGE = 11; // the edge step: columns from here on are past the edge

type Pic = 'empty' | 'shared' | 'names' | 'loop' | 'mine' | 'full' | 'dot' | 'next' | 'edge';
// show: how many lines of the code are visible (the rest stay hidden until their step); hl: the lines this step is about
const STEPS: { show: number; hl: number[]; pic: Pic; text: ComponentChildren }[] = [
  { show: 4, hl: [0, 2, 3], pic: 'empty', text: <>the same inputs as solution 1. <code>TILE</code> is just a name for 16</> },
  { show: 6, hl: [4, 5], pic: 'shared', text: <>two 16 × 16 scratch tiles in <b>shared memory</b>: small, fast, and seen by all 256 threads of the block</> },
  { show: 8, hl: [6, 7], pic: 'names', text: <>my row and column of C, worked out exactly like solution 1. tx and ty are short names for my x and y</> },
  { show: 11, hl: [9, 10], pic: 'loop', text: <>go across A and down B <b>one tile at a time</b>. for the full-size problem: 6144 / 16 = 384 tiles</> },
  { show: 14, hl: [11, 12, 13], pic: 'mine', text: <>each thread copies <b>one</b> number of A and one of B into the tiles, at its own spot. off the edge of the matrix, it writes 0</> },
  { show: 15, hl: [14], pic: 'full', text: <><code>__syncthreads()</code>: wait until all 256 threads have copied their number. now the tiles are complete</> },
  { show: 18, hl: [16, 17], pic: 'dot', text: <>the math, reading only the fast tiles: my row of As times my column of Bs</> },
  { show: 20, hl: [18, 19], pic: 'next', text: <>wait again, so nobody loads the next tile over numbers someone is still using</> },
  { show: 22, hl: [20, 21], pic: 'edge', text: <>store the answer if my cell is inside C. no early exit this time: every thread must reach every <code>__syncthreads()</code>, even ones off the edge</> },
  { show: 22, hl: [], pic: 'full', text: <>the whole solution. same answer as solution 1, but 16 times fewer trips to the slow main memory</> },
];

export default function Tiled() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  const p = st.pic;
  const cls = (which: 'a' | 'b', r: number, c: number) => {
    if (p === 'empty') return 'off';
    if (p === 'shared' || p === 'names' || p === 'loop') return '';
    if (p === 'edge') return (which === 'a' ? r : c) >= EDGE ? 'zero' : 'ld';
    const me = r === TY && c === TX;
    if (p === 'mine') return me ? 'me' : '';
    if (p === 'dot') return me ? 'me' : (which === 'a' ? r === TY : c === TX) ? 'use' : 'ld';
    if (p === 'next') return 'ld old';
    return 'ld';
  };
  return (
    <div class="tiled" ref={root}>
      <div class="td-cols">
        <div class="td-code"><Code lang="cpp" code={TILED} hl={st.hl} /></div>
        <style>{`.tiled .td-code .ln:nth-child(n + ${st.show + 1}) { opacity: 0; }`}</style>
        <div class="td-pic">
          <div class="td-sh">
            {(['a', 'b'] as const).map((w) => (
              <div class="td-m">
                <div class="td-g">
                  {Array.from({ length: T * T }, (_, i) => <i class={cls(w, Math.floor(i / T), i % T)} />)}
                </div>
                <div class="td-n">{w === 'a' ? 'As' : 'Bs'}</div>
              </div>
            ))}
          </div>
          <div class="td-sc">
            {p === 'mine' && <>thread (tx = <span class="c-t">{TX}</span>, ty = <span class="c-t">{TY}</span>):{'\n'}As[{TY}][{TX}] ← A[row][t·16 + {TX}]{'\n'}Bs[{TY}][{TX}] ← B[t·16 + {TY}][col]</>}
            {p === 'full' && <>all 256 spots filled</>}
            {p === 'dot' && <>sum += As[{TY}][i] * Bs[i][{TX}], i = 0 … 15</>}
            {p === 'next' && <>everyone done with this tile: safe to load the next</>}
            {p === 'edge' && <>a block on the bottom-right corner:{'\n'}As rows past M and Bs columns past K load 0</>}
          </div>
        </div>
      </div>
      <div class="caption td-text">{st.text}</div>
      <style>{`
        .tiled .td-cols { display: flex; gap: 1.2em; align-items: center; }
        .tiled .td-code { flex: 1.6; min-width: 0; }
        .tiled .td-code pre { margin: 0; font-size: .44em; overflow: hidden; }
        .tiled .td-pic { flex: none; width: 560px; }
        .tiled .td-sh { display: flex; gap: 1em; justify-content: center; }
        .tiled .td-m { display: flex; flex-direction: column; align-items: center; }
        .tiled .td-g { display: grid; grid-template-columns: repeat(${T}, 14px); grid-auto-rows: 14px; gap: 1px;
          padding: 6px; border: 2px dashed var(--line-2); border-radius: 6px; }
        .tiled .td-g i { background: var(--surface); border-radius: 1px; transition: background .3s, opacity .3s; }
        .tiled .td-g i.off { opacity: .25; }
        .tiled .td-g i.ld { background: var(--accent); }
        .tiled .td-g i.old { opacity: .45; }
        .tiled .td-g i.use { background: var(--good); }
        .tiled .td-g i.me { background: var(--hot); }
        .tiled .td-g i.zero { background: transparent; outline: 1px dashed var(--muted); outline-offset: -1px; }
        .tiled .td-n { font: .42em var(--mono); color: var(--muted); margin-top: .4em; }
        .tiled .td-sc { font: .42em/1.7 var(--mono); margin-top: 1em; min-height: 5.1em; white-space: pre; text-align: center; }
        .tiled .c-t { color: var(--teal); }
        .tiled .td-text { font-size: .8em; min-height: 2.4em; margin-top: .8em; }
      `}</style>
    </div>
  );
}
