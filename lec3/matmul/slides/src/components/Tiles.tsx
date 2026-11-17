/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';
import { MM, MM_CSS } from './mm';

/**
 * The tiling idea, no code yet: one block's tile of C walks along a strip of A and down a strip of B, a tile at a
 * time, copying each pair of tiles into shared memory and multiplying them there. Drawn with 4 × 4 tiles (real ones
 * are 16 × 16): C is 3 × 3 tiles, the shared dimension 4 tiles.
 */
const T = 4, TR = 1, TC = 1, NT = 4; // tile size drawn, the block's tile of C, tiles along N
const M = 3 * T, K = 3 * T, N = NT * T;

type St = { t: number; phase: 'none' | 'load' | 'use' | 'done'; text: ComponentChildren };
const STEPS: St[] = [
  { t: -1, phase: 'none', text: <>one block works out one 16 × 16 square of C. for that it needs these 16 rows of A and 16 columns of B</> },
  { t: 0, phase: 'load', text: <><b>step 1, load</b>: the 256 threads each copy one number into <b>shared memory</b>, a small, fast memory inside the block</> },
  { t: 0, phase: 'use', text: <><b>step 2, use</b>: multiply using only the fast copies. every number copied gets used 16 times</> },
  { t: 1, phase: 'load', text: <>move one tile over and do it again, adding onto the same answers</> },
  { t: 3, phase: 'done', text: <>after the last tile, the answers are done: the same C as solution 1</> },
  { t: 3, phase: 'done', text: <>each number now comes from slow main memory <b>once per block</b>, not 16 times</> },
];

export default function Tiles() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  const tile = (i: number) => Math.floor(i / T);
  // a tile along N: current (in), already used (used), still to come in the strip (strip)
  const along = (i: number) => (st.phase !== 'none' && tile(i) === st.t && st.phase !== 'done' ? 'in' : tile(i) <= st.t ? 'used' : 'rest');
  const progress = st.phase === 'none' ? 0 : st.phase === 'done' ? NT : st.t + (st.phase === 'use' ? 1 : 0);
  const loaded = st.phase === 'load' || st.phase === 'use';
  return (
    <div class="tiles" ref={root}>
      <div class="tl-cols">
        <MM m={M} n={N} k={K} cell={18}
          names={['A', 'B', 'C']}
          a={(r, c) => (tile(r) === TR ? along(c) : '')}
          b={(r, c) => (tile(c) === TC ? along(r) : '')}
          c={(r, c) => (tile(r) === TR && tile(c) === TC ? (progress === NT ? 'out' : 'blk') : '')} />
        <div class="tl-side">
          <div class="muted tl-cap">shared memory (this block only)</div>
          <div class="tl-sh">
            {['As', 'Bs'].map((n) => (
              <div class="tl-m">
                <div class={`tl-g ${loaded ? 'in' : ''} ${st.phase === 'use' ? 'use' : ''}`}>{Array.from({ length: T * T }, () => <i />)}</div>
                <div class="tl-n">{n}{loaded ? ` · tile ${st.t}` : ''}</div>
              </div>
            ))}
          </div>
          <div class="tl-prog">
            <div class="muted tl-cap">the block's sums: {progress} of {NT} tiles added</div>
            <div class="tl-bar">{Array.from({ length: NT }, (_, i) => <i class={i < progress ? 'on' : ''} />)}</div>
          </div>
        </div>
      </div>
      <div class="caption tl-text">{st.text}</div>
      <style>{MM_CSS + `
        .tiles .tl-cols { display: flex; gap: 3em; align-items: center; justify-content: center; }
        .tiles .mm-g i.rest { background: color-mix(in srgb, var(--accent) 14%, var(--surface)); }
        .tiles .mm-g i.in { background: var(--accent); }
        .tiles .mm-g i.used { background: color-mix(in srgb, var(--accent) 40%, var(--surface)); box-shadow: inset 0 0 0 1px var(--accent); }
        .tiles .mm-g i.blk { background: color-mix(in srgb, var(--hot) 35%, var(--surface)); }
        .tiles .mm-g i.out { background: var(--hot); }
        .tiles .mm-g { gap: 1px; }
        .tiles .tl-side { display: grid; gap: 1.4em; min-width: 9em; }
        .tiles .tl-cap { font-size: .42em; margin-bottom: .5em; }
        .tiles .tl-sh { display: flex; gap: 1em; padding: .6em; border: 2px dashed var(--line-2); border-radius: 8px; }
        .tiles .tl-m { display: flex; flex-direction: column; align-items: center; }
        .tiles .tl-g { display: grid; grid-template-columns: repeat(${T}, 26px); grid-auto-rows: 26px; gap: 2px; }
        .tiles .tl-g i { background: var(--surface); border-radius: 2px; transition: background .3s, box-shadow .3s; }
        .tiles .tl-g.in i { background: var(--accent); }
        .tiles .tl-g.use i { box-shadow: inset 0 0 0 2px var(--fg); }
        .tiles .tl-n { font: .4em var(--mono); color: var(--muted); margin-top: .4em; }
        .tiles .tl-bar { display: grid; grid-template-columns: repeat(${NT}, 1fr); gap: 4px; height: 18px; }
        .tiles .tl-bar i { background: var(--surface); border-radius: 3px; transition: background .3s; }
        .tiles .tl-bar i.on { background: var(--hot); }
        .tiles .tl-text { font-size: .8em; min-height: 2.4em; margin-top: 1.2em; text-align: center; }
      `}</style>
    </div>
  );
}
