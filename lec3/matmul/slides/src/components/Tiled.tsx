/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import { TILED } from './kernels';

/**
 * The tiled kernel, line by line, next to the block's two shared tiles (16 × 16 each) and one thread in them. The
 * edge step draws a block hanging off the right of the matrices: its threads past the edge load zeros.
 */
const T = 16, TX = 5, TY = 9; // the thread we point at
const EDGE = 11; // the edge step: columns from here on are past the edge

type Pic = 'empty' | 'shared' | 'mine' | 'ld' | 'dot' | 'next' | 'edge';
const STEPS: { hl: number[]; pic: Pic; text: ComponentChildren }[] = [
  { hl: [], pic: 'empty', text: <>the naive kernel plus three things: two shared tiles, a loop over tiles, two barriers</> },
  { hl: [4, 5], pic: 'shared', text: <><code>__shared__</code>: one copy per block, on-chip, seen by all its 256 threads. 2 × 16 × 16 floats = 2 KB</> },
  { hl: [10, 11, 12, 13], pic: 'mine', text: <>for each tile along N, every thread loads one number of each: its own (ty, tx) spot. past the edge of A or B, a 0, which adds nothing</> },
  { hl: [14], pic: 'ld', text: <>a <b>barrier</b>: nobody goes on until all 256 loads are done. without it, a thread could read a spot no one has filled yet</> },
  { hl: [16, 17], pic: 'dot', text: <>16 multiply-adds, all from shared memory: row ty of As times column tx of Bs</> },
  { hl: [18], pic: 'next', text: <>a second barrier: the next trip round the loop overwrites both tiles, so wait until everyone is done reading them</> },
  { hl: [20], pic: 'edge', text: <>no early return: every thread must reach every <code>__syncthreads()</code>. threads past the edge load zeros and just skip this write</> },
];

export default function Tiled() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  const p = st.pic;
  const cls = (which: 'a' | 'b', r: number, c: number) => {
    if (p === 'empty') return 'off';
    if (p === 'shared') return '';
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
            {p === 'ld' && <>all 256 spots filled</>}
            {p === 'dot' && <>sum += As[{TY}][i] * Bs[i][{TX}], i = 0 … 15</>}
            {p === 'next' && <>done with tile t: safe to load tile t + 1</>}
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
