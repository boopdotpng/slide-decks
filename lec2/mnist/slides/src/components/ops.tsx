/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';
import { useIsland } from 'slides/viz';
import { Digit } from './mnist';

/**
 * The tensor-operation slides. One small engine: cells with stable ids placed on a grid, so when a step moves a cell
 * (reshape, transpose, a reduction) it slides there instead of the picture swapping. Each island is a table of
 * frames, one per slide step: a code line, the shape it makes, and where every cell is.
 */

type Tone = 'a' | 'b' | 'c' | 'r' | 'g' | 'd' | 'op' | 'hl' | '';
type Cell = { id: string; v: number | string; x: number; y: number; tone?: Tone; hide?: boolean };
type Frame = { code: string; shape?: string; cells: Cell[]; note?: ComponentChildren };

const S = 58; // px per cell
function Cells({ cells, w, h }: { cells: Cell[]; w: number; h: number }) {
  return (
    <div class="cells" style={{ width: `${w * S}px`, height: `${h * S}px` }}>
      {cells.map((c) => (
        <div key={c.id} class={`cell t-${c.tone || 'n'} ${c.hide ? 'hide' : ''}`}
          style={{ transform: `translate(${c.x * S}px, ${c.y * S}px)` }}>{typeof c.v === 'number' ? fmtN(c.v) : c.v}</div>
      ))}
    </div>
  );
}
const fmtN = (v: number) => (v < 0 ? `−${-v}` : `${v}`);

function Stage({ frames, w, h, cls = '' }: { frames: Frame[]; w: number; h: number; cls?: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const f = frames[Math.min(step, frames.length - 1)];
  return (
    <div class={`ops ${cls}`} ref={root}>
      <div class="line"><code class="cl">{f.code}</code>{f.shape && <span class="sh">{f.shape}</span>}</div>
      <Cells cells={f.cells} w={w} h={h} />
      <div class="note">{f.note}</div>
    </div>
  );
}

// a grid of values as cells: ids `${p}${r}_${c}`, at (ox + c, oy + r)
const grid = (p: string, m: (number | string)[][], ox = 0, oy = 0, tone?: (r: number, c: number) => Tone): Cell[] =>
  m.flatMap((row, r) => row.map((v, c) => ({ id: `${p}${r}_${c}`, v, x: ox + c, y: oy + r, tone: tone?.(r, c) })));
const op = (id: string, v: string, x: number, y: number, hide = false): Cell => ({ id, v, x, y, tone: 'op', hide });
const ROW: Tone[] = ['a', 'b', 'c'];

const X = [[1, -2, 3, 0], [-1, 4, -3, 2], [2, 0, -1, 5]];
const map = (f: (v: number) => number) => X.map((r) => r.map(f));

// ── elementwise: every number on its own, shape unchanged ───────────────────
export function Elementwise() {
  const changed = (f: (v: number) => number) => (r: number, c: number): Tone => (f(X[r][c]) !== X[r][c] ? 'b' : '');
  const relu = (v: number) => Math.max(0, v);
  const frames: Frame[] = [
    { code: 'x', shape: '(3, 4)', cells: grid('x', X) },
    { code: 'x * 2', shape: '(3, 4)', cells: grid('x', map((v) => v * 2), 0, 0, () => 'b') },
    { code: 'x + 1', shape: '(3, 4)', cells: grid('x', map((v) => v + 1), 0, 0, () => 'b') },
    { code: 'x.relu()', shape: '(3, 4)', cells: grid('x', map(relu), 0, 0, changed(relu)), note: 'negatives become 0' },
  ];
  return <Stage frames={frames} w={4} h={3} />;
}

// ── reductions: one axis disappears ──────────────────────────────────────────
export function Reduce() {
  const base = (tone?: (r: number, c: number) => Tone) => grid('x', X, 0, 0, tone);
  const colSum = X[0].map((_, c) => X.reduce((s, r) => s + r[c], 0));
  const rowSum = X.map((r) => r.reduce((s, v) => s + v, 0));
  const arg = X.map((r) => r.indexOf(Math.max(...r)));
  const out = (vals: number[], tone: (i: number) => Tone, x0 = 0, y0 = 4, vertical = false): Cell[] =>
    vals.map((v, i) => ({ id: `o${i}`, v, x: vertical ? x0 : x0 + i, y: vertical ? i : y0, tone: tone(i) }));
  const frames: Frame[] = [
    { code: 'x', shape: '(3, 4)', cells: base() },
    { code: 'x.sum(axis=0)', shape: '(4,)', cells: [...base(), ...out(colSum, () => 'r')], note: 'down the columns: axis 0 is gone' },
    { code: 'x.sum(axis=1)', shape: '(3,)', cells: [...base((r) => ROW[r]), ...out(rowSum, (i) => ROW[i])], note: 'along each row: axis 1 is gone' },
    { code: 'x.sum(axis=1, keepdim=True)', shape: '(3, 1)', cells: [...base((r) => ROW[r]), ...out(rowSum, (i) => ROW[i], 5, 0, true)], note: 'same sums, the axis stays as size 1' },
    { code: 'x.argmax(axis=1)', shape: '(3,)', cells: [...base((r, c) => (arg[r] === c ? 'hl' : '')), ...out(arg, () => 'r')], note: 'where the biggest is: the predicted digit' },
  ];
  return <Stage frames={frames} w={6} h={5} />;
}

// ── reshape / flatten: same numbers, same order, new shape ───────────────────
export function Reshape() {
  const N = Array.from({ length: 12 }, (_, i) => i);
  const at = (f: (i: number) => [number, number]): Cell[] => N.map((i) => { const [x, y] = f(i); return { id: `n${i}`, v: i, x, y, tone: 'a' }; });
  const frames: Frame[] = [
    { code: 'x', shape: '(3, 4)', cells: at((i) => [i % 4, Math.floor(i / 4)]) },
    { code: 'x.reshape(4, 3)', shape: '(4, 3)', cells: at((i) => [i % 3, Math.floor(i / 3)]) },
    { code: 'x.reshape(2, 6)', shape: '(2, 6)', cells: at((i) => [i % 6, Math.floor(i / 6)]) },
    { code: 'x.flatten()', shape: '(12,)', cells: at((i) => [i, 0]) },
    { code: 'x.reshape(2, 2, 3)', shape: '(2, 2, 3)', cells: at((i) => [Math.floor(i / 6) * 4 + (i % 3), Math.floor((i % 6) / 3)]) },
    { code: 'x.reshape(2, 2, 3).flatten(1)', shape: '(2, 6)', cells: at((i) => [i % 6, Math.floor(i / 6)]),
      note: <>keep axis 0, merge the rest. mnist: <code>(256, 1, 28, 28)</code> → <code>(256, 784)</code></> },
  ];
  return <Stage frames={frames} w={12} h={4} />;
}

// ── transpose: rows become columns (not the same as reshape) ─────────────────
export function Transpose() {
  const N = Array.from({ length: 12 }, (_, i) => i);
  const t = (i: number) => ROW[Math.floor(i / 4)];
  const xs = (f: (i: number) => [number, number]): Cell[] => N.map((i) => { const [x, y] = f(i); return { id: `n${i}`, v: i, x, y, tone: t(i) }; });
  const rs = (hide: boolean): Cell[] => N.map((i) => ({ id: `r${i}`, v: i, x: 6 + (i % 3), y: Math.floor(i / 3), tone: t(i), hide }));
  const tr = (i: number): [number, number] => [Math.floor(i / 4), i % 4];
  const frames: Frame[] = [
    { code: 'x', shape: '(3, 4)', cells: [...xs((i) => [i % 4, Math.floor(i / 4)]), ...rs(true)] },
    { code: 'x.T', shape: '(4, 3)', cells: [...xs(tr), ...rs(true)], note: 'each row becomes a column' },
    { code: 'x.T   vs   x.reshape(4, 3)', shape: 'both (4, 3)', cells: [...xs(tr), ...rs(false)], note: 'same shape, different order' },
  ];
  return <Stage frames={frames} w={9} h={4} />;
}

// ── broadcasting: a size-1 or missing axis is reused ─────────────────────────
export function Broadcast() {
  const b = [10, 20, 30, 40];
  const m = X.map((r) => Math.max(...r));
  const xg = grid('x', X);
  const bRow = (ghosts: boolean): Cell[] => [0, 1, 2].flatMap((r) => b.map((v, c) => ({ id: `b${r}_${c}`, v, x: 5 + c, y: r, tone: r ? 'g' : 'b', hide: r > 0 && !ghosts } as Cell)));
  const mCol = (ghosts: boolean, hide = false): Cell[] => X.flatMap((_, r) => [0, 1, 2, 3].map((c) => ({ id: `m${r}_${c}`, v: m[r], x: 5 + c, y: r, tone: c ? 'g' : 'b', hide: hide || (c > 0 && !ghosts) } as Cell)));
  const res = (vals: number[][], hide = false): Cell[] => grid('o', vals, 10, 0, () => 'r').map((c) => ({ ...c, hide }));
  const sym = (s: string, e: string, show: boolean) => [op('s1', s, 4, 1, !show), op('s2', e, 9, 1, !show)];
  const plus = X.map((r) => r.map((v, c) => v + b[c]));
  const minus = X.map((r, i) => r.map((v) => v - m[i]));
  const frames: Frame[] = [
    { code: 'x + b', shape: '(3, 4) + (4,)', cells: [...xg, ...bRow(false), ...mCol(false, true), ...sym('+', '', true), ...res(plus, true)] },
    { code: 'x + b', shape: '(3, 4) + (4,)', cells: [...xg, ...bRow(true), ...mCol(false, true), ...sym('+', '', true), ...res(plus, true)], note: 'b is reused for every row' },
    { code: 'x + b', shape: '→ (3, 4)', cells: [...xg, ...bRow(true), ...mCol(false, true), ...sym('+', '=', true), ...res(plus)] },
    { code: 'x - x.max(axis=1, keepdim=True)', shape: '(3, 4) − (3, 1)', cells: [...xg, ...bRow(false).map((c) => ({ ...c, hide: true })), ...mCol(false), ...sym('−', '', true), ...res(minus, true)] },
    { code: 'x - x.max(axis=1, keepdim=True)', shape: '(3, 4) − (3, 1)', cells: [...xg, ...bRow(false).map((c) => ({ ...c, hide: true })), ...mCol(true), ...sym('−', '', true), ...res(minus, true)], note: 'the size-1 axis stretches across' },
    { code: 'x - x.max(axis=1, keepdim=True)', shape: '→ (3, 4)', cells: [...xg, ...bRow(false).map((c) => ({ ...c, hide: true })), ...mCol(true), ...sym('−', '=', true), ...res(minus)], note: 'every row now tops out at 0' },
  ];
  return <Stage frames={frames} w={14} h={3} />;
}

// ── matmul: every row against every column ───────────────────────────────────
export function Matmul() {
  const A = [[1, 2, 3], [4, 5, 6]];
  const B = [[1, 0], [0, 1], [2, -1]];
  const C = A.map((r) => B[0].map((_, j) => r.reduce((s, v, k) => s + v * B[k][j], 0)));
  const term = (i: number, j: number) => A[i].map((v, k) => `${fmtN(v)}·${B[k][j] < 0 ? `(${fmtN(B[k][j])})` : B[k][j]}`).join(' + ') + ` = ${fmtN(C[i][j])}`;
  const cells = (hi?: [number, number], filled: (i: number, j: number) => boolean = () => false): Cell[] => [
    op('la', 'a', 1, 2), op('lb', 'b', 3, 1),
    ...grid('a', A, 0, 3, (r) => (hi && hi[0] === r ? 'a' : '')),
    ...grid('b', B, 4, 0, (_, c) => (hi && hi[1] === c ? 'b' : '')),
    ...C.flatMap((r, i) => r.map((v, j) => ({ id: `c${i}_${j}`, v: filled(i, j) ? v : '', x: 4 + j, y: 3 + i, tone: (hi && hi[0] === i && hi[1] === j ? 'r' : filled(i, j) ? 'r' : 'd') as Tone }))),
  ];
  const frames: Frame[] = [
    { code: 'a @ b', shape: '(2, 3) @ (3, 2)', cells: cells() },
    { code: 'a @ b', shape: '(2, 3) @ (3, 2)', cells: cells([0, 0], (i, j) => i === 0 && j === 0), note: term(0, 0) },
    { code: 'a @ b', shape: '(2, 3) @ (3, 2)', cells: cells([0, 1], (i, j) => i === 0 && j <= 1), note: term(0, 1) },
    { code: 'a @ b', shape: '→ (2, 2)', cells: cells(undefined, () => true), note: 'row of a · column of b, for every pair' },
    { code: 'a @ b', shape: '→ (2, 2)', cells: cells(undefined, () => true),
      note: <>the inside sizes must match, and disappear: <code>(2, <b class="m">3</b>) @ (<b class="m">3</b>, 2) → (2, 2)</code></> },
    { code: 'x.dot(l1.T)', shape: '→ (256, 128)', cells: cells(undefined, () => true),
      note: <><code>(256, <b class="m">784</b>) @ (<b class="m">784</b>, 128)</code>. l1 is <code>(128, 784)</code>, so <code>.T</code> it first</> },
  ];
  return <Stage frames={frames} w={6} h={5} cls="mm" />;
}

// ── chaining: each call returns a new tensor ─────────────────────────────────
const CHAIN: [string, string, string][] = [
  ['x', '(256, 1, 28, 28)', 'a batch of images'],
  ['.flatten(1)', '(256, 784)', 'each image → one row'],
  ['.dot(l1.T)', '(256, 128)', '128 numbers per image'],
  ['.relu()', '(256, 128)', 'negatives → 0'],
  ['.dot(l2.T)', '(256, 10)', '10 scores per image'],
  ['.argmax(axis=1)', '(256,)', 'one guess per image'],
];
export function Chain() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  return (
    <div class="chain" ref={root}>
      <code class="code">{CHAIN.map(([p], i) => <span class={i === step ? 'on' : i < step ? 'done' : ''}>{p}</span>)}</code>
      <div class="shapes">
        {CHAIN.map(([, s, w], i) => (
          <div class={`sh ${i === step ? 'on' : ''} ${i > step ? 'later' : ''}`}><b>{s}</b><span>{w}</span></div>
        ))}
      </div>
    </div>
  );
}

// ── a batch is a loop you don't write ────────────────────────────────────────
// 0 the batch   1 a python loop, one image at a time   2 one call, all at once   3 measured
export function Batch() {
  const { root, step, d } = useIsland('mnist');
  const rt = useIsland('runtime').d;
  if (!d || !rt) return <div ref={root} />;
  const n = 8, b = rt.batch;
  return (
    <div class="batch" ref={root}>
      <div class={`rows ${step === 1 ? 'loop' : step >= 2 ? 'all' : ''}`}>
        {Array.from({ length: n }, (_, i) => (
          <div class="r" style={{ animationDelay: `${i * 0.35}s` }}><Digit m={d.grid} i={(i * 11) % 80} size={46} /><span>image {i}</span><i>→ 10 scores</i></div>
        ))}
        <div class="more">… 256 images</div>
      </div>
      <div class="side">
        <code class={`fade ${step >= 1 ? 'on' : ''}`}>for img in batch: model(img)</code>
        <code class={`fade ${step >= 2 ? 'on' : ''} g`}>model(batch)</code>
        <div class={`num fade ${step >= 3 ? 'on' : ''}`}>
          <div><span>256 calls</span><b>{b.loop_ms.toFixed(0)} ms</b></div>
          <div class="g"><span>1 call</span><b>{b.batched_ms.toFixed(1)} ms</b></div>
          <p>{Math.round(b.loop_ms / b.batched_ms)}× faster, same math · cpu, {rt.machine}</p>
        </div>
      </div>
      <style>{`
        .batch { display: flex; gap: 80px; align-items: center; }
        .batch .rows { display: flex; flex-direction: column; gap: 6px; }
        .batch .r { display: flex; align-items: center; gap: 16px; font-size: 20px; color: var(--muted); padding: 2px 10px 2px 2px; border-radius: 8px; }
        .batch .r i { font-style: normal; opacity: 0; }
        .batch .rows.all .r { background: color-mix(in srgb, var(--good) 22%, transparent); color: var(--fg); }
        .batch .rows.all .r i { opacity: 1; }
        .batch .rows.loop .r { animation: batchrow ${n * 0.35}s steps(1) infinite; }
        @keyframes batchrow { 0% { background: color-mix(in srgb, var(--hot) 30%, transparent); color: var(--fg); } ${100 / n}% { background: transparent; color: var(--muted); } }
        .batch .more { font-size: 18px; color: var(--faint); padding-left: 64px; }
        .batch .side { display: flex; flex-direction: column; gap: 22px; font-size: .62em; }
        .batch .side code { font-size: 1em; padding: .3em .6em; }
        .batch .side code.g { color: var(--good); }
        .batch .num { display: flex; flex-direction: column; gap: 8px; margin-top: 10px; }
        .batch .num div { display: flex; justify-content: space-between; gap: 40px; font-size: 1.1em; }
        .batch .num b { font-family: var(--mono); }
        .batch .num .g b { color: var(--good); }
        .batch .num p { margin: 0; font-size: .7em; color: var(--muted); }
        @media (prefers-reduced-motion: reduce) { .batch .rows.loop .r { animation: none; } }
        .mode-print .batch .rows.loop .r { animation: none; }
      `}</style>
    </div>
  );
}

// ── TinyJit: record the step's kernels once, replay them each batch ──────────
// 0 without: every step, python rebuilds the graph and submits each kernel   1 with: replayed in one go   2 measured
export function Jit() {
  const { root, step, d } = useIsland('runtime');
  if (!d) return <div ref={root} />;
  const j = d.jit, K = 12; // kernels drawn per step (the real step runs j.kernels)
  const W = 1300, lane = (y: number, label: string) => <text x={0} y={y + 26} class="ln">{label}</text>;
  const stepsPlain = [0, 1, 2].map((s) => {
    const x0 = 150 + s * 380;
    return <g>
      <rect x={x0} y={20} width={150} height={40} rx={6} class="py" /><text x={x0 + 75} y={46} class="lb">python</text>
      {Array.from({ length: K }, (_, k) => <rect x={x0 + 150 + k * 19} y={90} width={9} height={40} rx={2} class="k" />)}
    </g>;
  });
  const stepsJit = [0, 1, 2, 3, 4, 5].map((s) => {
    const x0 = s === 0 ? 150 : 560 + (s - 1) * 150;
    return <g>
      <rect x={x0} y={20} width={s === 0 ? 150 : 14} height={40} rx={4} class={s === 0 ? 'py' : 'py rp'} />
      {s === 0 && <text x={x0 + 75} y={46} class="lb">record</text>}
      {Array.from({ length: K }, (_, k) => <rect x={x0 + (s === 0 ? 150 + k * 19 : 16 + k * 10)} y={90} width={9} height={40} rx={2} class="k" />)}
    </g>;
  });
  return (
    <div class="jit" ref={root}>
      <div class="lanes">
        <p class="kick">without <code>@TinyJit</code>: every step</p>
        <svg viewBox={`0 0 ${W} 140`}>{lane(20, 'cpu')}{lane(90, 'gpu')}{stepsPlain}</svg>
        <div class={`fade ${step >= 1 ? 'on' : ''}`}>
          <p class="kick">with <code>@TinyJit</code>: recorded once, replayed</p>
          <svg viewBox={`0 0 ${W} 140`}>{lane(20, 'cpu')}{lane(90, 'gpu')}{stepsJit}</svg>
        </div>
      </div>
      <div class={`num fade ${step >= 2 ? 'on' : ''}`}>
        <span><b>{j.kernels}</b> kernels per step</span>
        <span><b>{j.plain_ms.toFixed(1)} ms</b> → <b class="g">{j.jit_ms.toFixed(2)} ms</b> per step</span>
        <span class="muted">{Math.round(j.plain_ms / j.jit_ms)}× · {j.device === 'METAL' ? 'Metal' : j.device}, {d.machine} · drawing not to scale</span>
      </div>
      <style>{`
        .jit { display: flex; flex-direction: column; gap: 18px; width: 100%; }
        .jit .kick { font-size: 20px; color: var(--muted); margin: 0 0 4px; }
        .jit svg { width: 100%; display: block; }
        .jit .ln { font: 22px var(--mono); fill: var(--muted); }
        .jit .py { fill: color-mix(in srgb, var(--hot) 30%, transparent); stroke: var(--hot); }
        .jit .lb { font: 18px var(--sans); fill: var(--fg); text-anchor: middle; }
        .jit .k { fill: var(--accent); }
        .jit .num { display: flex; gap: 48px; align-items: baseline; font-size: .6em; }
        .jit .num b { font-family: var(--mono); } .jit .num .g { color: var(--good); }
        .jit .num .muted { font-size: .75em; }
      `}</style>
    </div>
  );
}

