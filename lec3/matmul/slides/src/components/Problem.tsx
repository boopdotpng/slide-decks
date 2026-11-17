/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';
import { Tex } from 'slides/viz';

/**
 * The problem, on leetgpu's example 1: A (2 × 2) · B (2 × 2) = C, laid out the usual way (B above C, A to its left) so
 * a row of A and a column of B meet at their cell of C. Then: every cell is the same recipe, so one thread per cell,
 * and row-major storage (where C[row][col] actually lives).
 */
const A = [[1, 2], [3, 4]];
const B = [[5, 6], [7, 8]];
const C = [[19, 22], [43, 50]];

type St = { cell?: [number, number]; done: [number, number][]; threads?: boolean; flat?: boolean; text: ComponentChildren };
const ALL: [number, number][] = [[0, 0], [0, 1], [1, 0], [1, 1]];
const STEPS: St[] = [
  { done: [], text: <>A is M × N, B is N × K. their product C is M × K. here, leetgpu's example 1: all 2 × 2</> },
  { cell: [0, 0], done: [], text: <>one cell of C: <b>row 0 of A</b> times <b>column 0 of B</b>, multiplied pairwise and added up</> },
  { cell: [1, 0], done: [[0, 0]], text: <>the next cell: row 1 of A, column 0 of B. N multiply-adds per cell, whatever the size</> },
  { done: ALL, threads: true, text: <>every cell is the same recipe, and no cell needs another one. so: <b>one thread per cell of C</b></> },
  { done: ALL, threads: true, flat: true, text: <>in memory each matrix is one line of floats, row after row (<b>row-major</b>). a row of C is K long, so <code>C[row][col]</code> is <code>C[row * K + col]</code></> },
];

const TEX: Record<string, string> = {
  '0,0': '1 \\cdot 5 + 2 \\cdot 7 = \\htmlClass{pr-r}{19}',
  '1,0': '3 \\cdot 5 + 4 \\cdot 7 = \\htmlClass{pr-r}{43}',
};

function Mat({ name, data, cls, label }: { name: string; data: number[][]; cls: (r: number, c: number) => string; label?: (r: number, c: number) => ComponentChildren }) {
  return (
    <div class="pr-m">
      <div class="pr-g">
        {data.map((row, r) => row.map((v, c) => <i class={cls(r, c)}><span>{v}</span>{label && <em>{label(r, c)}</em>}</i>))}
      </div>
      <div class="pr-n">{name}</div>
    </div>
  );
}

export default function Problem() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  const [cr, cc] = st.cell ?? [-1, -1];
  const isDone = (r: number, c: number) => st.done.some(([a, b]) => a === r && b === c);
  return (
    <div class="problem" ref={root}>
      <div class="pr-cols">
        <div class="pr-mm">
          <span />
          <Mat name="B · N × K" data={B} cls={(_, c) => (c === cc ? 'in' : '')} />
          <Mat name="A · M × N" data={A} cls={(r) => (r === cr ? 'in' : '')} />
          <Mat name="C · M × K" data={C}
            cls={(r, c) => (r === cr && c === cc ? 'out' : isDone(r, c) ? 'done' : 'empty')}
            label={st.threads ? (r, c) => <>thread ({c}, {r})</> : undefined} />
        </div>
        <div class="pr-side">
          <div class={`pr-sum fade ${st.cell ? 'on' : ''}`}>
            {st.cell && <>C[{cr}][{cc}] = <Tex tex={TEX[`${cr},${cc}`]} /></>}
          </div>
          <div class={`pr-flat fade ${st.flat ? 'on' : ''}`}>
            <div class="muted pr-cap">C in memory</div>
            <div class="pr-line">
              {C.flat().map((v, i) => <i class={i === 2 ? 'out' : ''}><span>{v}</span><em>{i}</em></i>)}
            </div>
            <div class="pr-idx">C[1][0] = C[<span class="pr-r">1</span> * <span class="pr-k">2</span> + <span class="pr-c">0</span>] = C[2]</div>
          </div>
        </div>
      </div>
      <div class="caption pr-text">{st.text}</div>
      <style>{`
        .problem .pr-cols { display: flex; gap: 2.4em; align-items: center; justify-content: center; }
        .problem .pr-mm { display: grid; grid-template-columns: auto auto; gap: .6em 1em; align-items: end; }
        .problem .pr-g { display: grid; grid-template-columns: repeat(2, 3.2em); grid-auto-rows: 3.2em; gap: 5px; }
        .problem .pr-g i { position: relative; display: grid; place-items: center; font: 700 .8em var(--mono); font-style: normal;
          background: var(--surface); border-radius: 6px; transition: background .3s, color .3s; }
        .problem .pr-g i.in { background: var(--accent); color: var(--on-color); }
        .problem .pr-g i.out { background: var(--hot); color: var(--on-color); }
        .problem .pr-g i.empty span { opacity: 0; }
        .problem .pr-g i.done { background: var(--fill-amber); }
        .problem .pr-g em { position: absolute; bottom: .25em; font: .42em var(--mono); color: var(--fg); white-space: nowrap; }
        .problem .pr-g i.out em { color: var(--on-color); }
        .problem .pr-n { font: .44em var(--mono); color: var(--muted); margin-top: .5em; text-align: center; }
        .problem .pr-side { width: 15em; display: grid; gap: 1.2em; }
        .problem .pr-sum { font-size: .8em; min-height: 1.6em; }
        .problem .pr-r { color: var(--hot); font-weight: 700; }
        .problem .pr-k { color: var(--purple); } .problem .pr-c { color: var(--teal); }
        .problem .pr-cap { font-size: .44em; margin-bottom: .4em; }
        .problem .pr-line { display: grid; grid-template-columns: repeat(4, 2.2em); grid-auto-rows: 2.2em; gap: 3px; }
        .problem .pr-line i { position: relative; display: grid; place-items: center; font: 700 .6em var(--mono); font-style: normal;
          background: var(--fill-amber); border-radius: 4px; }
        .problem .pr-line i.out { background: var(--hot); color: var(--on-color); }
        .problem .pr-line em { position: absolute; top: 100%; margin-top: .3em; font: .6em var(--mono); color: var(--muted); }
        .problem .pr-idx { font: .5em var(--mono); margin-top: 2em; white-space: nowrap; }
        .problem .pr-text { font-size: .8em; min-height: 2.4em; margin-top: 1.2em; text-align: center; }
      `}</style>
    </div>
  );
}
