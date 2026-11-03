/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { useIsland } from './viz';
import './roles';

/**
 * Slide 7: from tensor code to work on a device, on slide 6's first three lines. The kernels, their names and their C
 * source are what tinygrad 0.14.0 generated and launched on the CPU backend (kernels.json, export_kernels.py: DEBUG=4,
 * NOOPT=1 so the loops stay readable). The graph drawing is a schematic of the operations in those lines.
 *   0 tensor expressions (lazy: nothing runs)    1 the computation graph    2 scheduling + lowering: four kernels
 *   3 one kernel's generated code                4 the device: CPU now, GPU the same way    5 PyTorch, by comparison
 */
type K = { name: string; args: number; src: string };
type KJ = { tinygrad: string; device: string; flags: string; scores: K[]; weights: K[] };
const SRC = `scores = q @ k.transpose(-1, -2)
scores = scores / math.sqrt(q.shape[-1])
weights = (scores + mask).softmax(axis=-1)
weights.realize()   # tinygrad runs work only when a result is needed`;
const PIPE = [
  { t: 'tensor expressions', s: 'what you write' },
  { t: 'computation graph', s: 'operations and dependencies' },
  { t: 'scheduling + lowering', s: 'divide and translate the work' },
  { t: 'executable kernels', s: 'compiled numerical programs' },
  { t: 'cpu or gpu', s: 'the chosen device' },
];
/** the graph: [id, label, x, y, kind] and edges */
const GN: [string, string, number, number, string][] = [
  ['q', 'q', 60, 60, 'in'], ['k', 'k', 60, 160, 'in'], ['mask', 'mask', 60, 300, 'in'],
  ['T', 'transpose', 200, 160, 'mv'], ['mul', '× (pairs)', 340, 110, 'op'], ['sumd', 'sum over d', 480, 110, 'red'], ['sc', '× 0.5  (÷ √4)', 640, 110, 'op'],
  ['add', '+ mask', 340, 300, 'op'], ['max', 'max per row', 500, 230, 'red'], ['sub', '− max', 640, 300, 'op'], ['exp', 'exp', 760, 300, 'op'],
  ['sum', 'sum per row', 880, 230, 'red'], ['div', '÷ sum', 920, 360, 'op'],
];
const GE: [string, string][] = [['q', 'mul'], ['k', 'T'], ['T', 'mul'], ['mul', 'sumd'], ['sumd', 'sc'], ['sc', 'add'], ['mask', 'add'], ['add', 'max'], ['add', 'sub'],
  ['max', 'sub'], ['sub', 'exp'], ['exp', 'sum'], ['exp', 'div'], ['sum', 'div']];
const LOWER: { name: string; what: ComponentChildren; ops: string[]; line: string }[] = [
  { name: 'r_4_4_4', what: 'scores', ops: ['load q, k', '× pairs', 'sum over d', '× 0.5', 'store scores'], line: 'lines 1–2' },
  { name: 'r_4_4', what: 'row max m', ops: ['load scores, mask', '+', 'max per row', 'store m'], line: 'line 3' },
  { name: 'r_4_4', what: 'row sum ℓ', ops: ['load scores, mask, m', '+', '− m', 'exp', 'sum per row', 'store ℓ'], line: 'line 3' },
  { name: 'E_4_4', what: 'weights', ops: ['load scores, mask, m, ℓ', '+', '− m', 'exp', '÷ ℓ', 'store weights'], line: 'line 3' },
];

function Graph({ step }: { step: number }) {
  const at = Object.fromEntries(GN.map(([id, , x, y]) => [id, [x, y]]));
  return (
    <svg class="dag" viewBox="0 0 1010 400">
      {GE.map(([a, b]) => {
        const [x1, y1] = at[a], [x2, y2] = at[b];
        return <path class="ge" d={`M ${x1 + 50} ${y1} C ${x1 + 90} ${y1}, ${x2 - 90} ${y2}, ${x2 - 56} ${y2}`} marker-end="url(#ex-a)" />;
      })}
      {GN.map(([, t, x, y, kind]) => (
        <g class={`gn ${kind}`}>
          <rect x={x - 56} y={y - 20} width="112" height="40" rx={kind === 'in' ? 20 : 8} />
          <text x={x} y={y + 6}>{t}</text>
        </g>
      ))}
      <text class="gl" x={200} y={210}>a view: no data moves</text>
      <text class="gl" x={640} y={60}>= scores</text>
      <text class="gl" x={920} y={410}>= weights</text>
      {step === 1 && <text class="gl b" x={505} y={30}>built, not run: each op only records its inputs</text>}
      <defs><marker id="ex-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="ah" /></marker></defs>
    </svg>
  );
}

export default function Execution() {
  const { root, step, d } = useIsland<KJ>('kernels');
  const cur = Math.min(step, 4);
  const scoresSrc = d?.scores[0]?.src ?? '';
  const sm = d?.weights ?? [];
  const keyLine = (src: string, re: RegExp) => src.split('\n').find((l) => re.test(l))?.trim() ?? '';
  const views: ComponentChildren[] = [
    <div class="v0">
      <Code lang="py" code={SRC} hl={step === 0 ? [0, 1, 2] : []} />
      <p>in tinygrad these lines are <b>lazy</b>: each one adds to a graph. nothing is computed until a result is needed (<code>realize()</code>, <code>.numpy()</code>, <code>.item()</code>…)</p>
      <p class="mut">run here on a tiny example so the generated code fits: q, k of shape (1, 4, 4), so d = 4 and the scale is ÷ √4</p>
    </div>,
    <Graph step={1} />,
    <div class="v2">
      {LOWER.map((k, i) => (
        <div class={`kb k${i}`}>
          <div class="kh"><code>{k.name}</code><span>→ {k.what}</span><em>{k.line}</em></div>
          <div class="ops">{k.ops.map((o) => <span>{o}</span>)}</div>
        </div>
      ))}
      <p>the scheduler cut the graph into <b>4 kernels</b>. the transpose became an index pattern; <code>+ mask</code> and <code>exp</code> are recomputed inside the kernels that need them instead of being stored</p>
    </div>,
    <div class="v3">
      <div class="ksrc">
        <div class="sh"><code>r_4_4_4</code>: lines 1–2 as one C function, as tinygrad generated it</div>
        <Code lang="c" code={scoresSrc} hl={[2, 4, 6, 7, 8, 9, 11]} />
      </div>
      <div class="ann">
        <p><b>loops</b>: row <code>Lidx1</code>, column <code>Lidx2</code>, and the reduction <code>Ridx0</code> over d</p>
        <p><b>multiply-add</b> into <code>buf0</code>: the dot product</p>
        <p><code>* 0.5f</code>: line 2's <code>/ math.sqrt(4)</code>, folded into the same loop</p>
        <p class="sm">line 3's kernels, key line of each:</p>
        {sm.map((k, i) => (
          <p class="kl"><code>{k.name}</code> <span>{['row max of scores + mask', 'Σ exp(s + mask − m)', 'exp(s + mask − m) / ℓ'][i]}</span><br />
            <code class="raw">{keyLine(k.src, [/alu3 =/, /\*1\.44/, /\/val1\)/][i]).slice(0, 64)}</code></p>
        ))}
      </div>
    </div>,
    <div class="v4">
      <div class="dev on">
        <div class="dh">CPU · this lab</div>
        <div>the CPU backend writes C for each kernel, <b>clang</b> compiles it, and the program calls it. this run launched:</div>
        <div class="launch">{[...(d?.scores ?? []), ...sm].map((k) => <code>{k.name}</code>)}</div>
        <div class="mut">4 kernels for 3 lines. that's why setup checks for clang</div>
      </div>
      <div class="dev">
        <div class="dh">GPU</div>
        <div>the same graph and schedule; a different code generator emits GPU code (CUDA, Metal, …) and the runtime launches it on the device</div>
        <div class="mut">many threads per kernel: slide 3's concerns</div>
      </div>
    </div>,
    <div class="v5">
      <div class="cmp">
        <div class="ch">tinygrad</div><div class="ch">PyTorch, eager (default)</div>
        <div>builds a lazy graph, schedules it into kernels, generates code, runs it</div>
        <div>runs each operation as Python reaches it: <code>@</code>, <code>/</code>, <code>+</code>, <code>softmax</code> each dispatch to an existing implementation for that device</div>
        <div class="mut">fusion is the default: lines 1–2 → 1 kernel</div>
        <div class="mut">optional <code>torch.compile</code> captures a larger region and can compile it into fused kernels</div>
      </div>
    </div>,
  ];
  return (
    <div class="ex" ref={root}><div class="xin">
      <div class="card pipe">
        <div class="kick">execution pipeline</div>
        {PIPE.map((p, i) => (
          <div class={`ps ${i === cur && step < 5 ? 'on' : ''} ${i < cur || step === 5 ? 'done' : ''} ${i >= 3 ? 'late' : ''}`}>
            <span class="n">{i + 1}</span><div><div class="t">{p.t}</div><div class="s">{p.s}</div></div>
          </div>
        ))}
      </div>
      <div class="main">
        <div class="card view">{views[step] ?? views[0]}</div>
        <div class="row">
          <div class={`card bar-a fw ${step >= 1 && step <= 4 ? 'on' : ''}`}><b>tinygrad</b> builds a lazy graph, schedules work, generates code, and executes it</div>
          <div class={`card bar-n fw ${step === 5 ? 'on' : ''}`}><b>PyTorch</b>: eager operations dispatch to implementations; optional compilation can optimize larger regions</div>
        </div>
        <div class="row">
          <div class={`card call ${step >= 2 ? 'on' : ''}`}>one Python line need not mean one kernel: <b>2 lines → 1 kernel</b>, <b>1 line → 3 kernels</b></div>
          <div class={`card call2 ${step >= 4 ? 'on' : ''}`}>our first lab device is <b>CPU</b>. the tensor mathematics stays the same</div>
        </div>
      </div>
    </div>
      <style>{`
        .ex { flex: 1; min-height: 0; }
        .ex .xin { display: grid; grid-template-columns: 340px 1fr; gap: .7em; height: 100%; font-size: .6em; }
        .ex .pipe { display: flex; flex-direction: column; gap: .45em; padding: .5em .6em; }
        .ex .ps { display: flex; gap: .6em; align-items: center; padding: .4em .6em; border-radius: 8px; opacity: .55; transition: all .3s; }
        .ex .ps.done { opacity: .85; }
        .ex .ps.on { opacity: 1; background: color-mix(in srgb, var(--accent) 14%, transparent); }
        .ex .ps.late.on { background: color-mix(in srgb, var(--hot) 14%, transparent); }
        .ex .ps .n { flex: none; width: 1.2em; font-family: var(--mono); font-weight: 700; color: var(--accent); }
        .ex .ps.late .n { color: var(--hot); }
        .ex .ps .t { font-weight: 700; color: var(--accent); font-size: .92em; }
        .ex .ps.late .t { color: var(--hot); }
        .ex .ps .s { font-size: .78em; color: var(--muted); }
        .ex .main { display: flex; flex-direction: column; gap: .45em; min-height: 0; }
        .ex .view { flex: 1; min-height: 0; padding: .5em .8em; display: flex; flex-direction: column; justify-content: safe center; overflow: hidden; }
        .ex .row { display: grid; grid-template-columns: 1fr 1fr; gap: .6em; }
        .ex .fw { font-size: .82em; color: var(--muted); opacity: .7; transition: all .3s; }
        .ex .fw.on { opacity: 1; color: var(--fg); }
        .ex .fw b { color: var(--fg); }
        .ex .call, .ex .call2 { font-size: .85em; text-align: center; opacity: .3; transition: opacity .3s; }
        .ex .call { color: var(--hot); }
        .ex .call b { color: var(--hot); }
        .ex .call.on, .ex .call2.on { opacity: 1; }
        .ex p { margin: .4em 0; }
        .ex p b, .ex .v4 b { color: var(--fg); }
        .ex .v0 pre { font-size: .95em; }
        .ex .dag { width: 100%; height: 100%; max-height: 430px; overflow: visible; }
        .ex .gn rect { fill: var(--sunken); stroke: var(--line-2); stroke-width: 2; }
        .ex .gn.in rect { fill: color-mix(in srgb, var(--accent) 12%, var(--sunken)); stroke: var(--accent); }
        .ex .gn.red rect { stroke: var(--hot); }
        .ex .gn.mv rect { stroke-dasharray: 5 4; }
        .ex .gn text { font-family: var(--mono); font-size: 16px; fill: var(--fg); text-anchor: middle; }
        .ex .ge { fill: none; stroke: var(--faint); stroke-width: 2; }
        .ex .ah { fill: var(--faint); }
        .ex .gl { font-size: 16px; fill: var(--muted); text-anchor: middle; }
        .ex .gl.b { fill: var(--accent); font-size: 18px; }
        .ex .v2 { display: flex; flex-direction: column; gap: .35em; }
        .ex .kb { border-left: 3px solid var(--border); padding: .2em .7em; }
        .ex .kb.k0 { border-color: var(--accent); } .ex .kb.k1, .ex .kb.k2, .ex .kb.k3 { border-color: color-mix(in srgb, var(--hot) 60%, transparent); }
        .ex .kh { display: flex; gap: .7em; align-items: baseline; }
        .ex .kh code { font-weight: 700; }
        .ex .kh em { margin-left: auto; font-style: normal; font-size: .8em; color: var(--muted); }
        .ex .ops { display: flex; flex-wrap: wrap; gap: .3em; margin-top: .2em; }
        .ex .ops span { font-family: var(--mono); font-size: .72em; padding: .05em .45em; border-radius: 6px; background: var(--surface); }
        .ex .v3 { display: grid; grid-template-columns: 1.25fr 1fr; gap: .8em; align-items: start; }
        .ex .v3 .sh { font-size: .8em; color: var(--muted); margin-bottom: .2em; }
        .ex .v3 pre { font-size: .58em; margin: 0; }
        .ex .v3 .ann { font-size: .78em; }
        .ex .v3 .ann p { margin: .25em 0; }
        .ex .v3 .sm { color: var(--muted); margin-top: .8em; }
        .ex .v3 .kl { font-size: .9em; } .ex .v3 .kl span { color: var(--muted); }
        .ex .v3 .raw { font-size: .7em; color: var(--muted); }
        .ex .v4 { display: grid; grid-template-columns: 1fr 1fr; gap: .8em; }
        .ex .dev { border: 2px solid var(--border); border-radius: 12px; padding: .6em .8em; display: flex; flex-direction: column; gap: .4em; }
        .ex .dev.on { border-color: var(--hot); background: color-mix(in srgb, var(--hot) 6%, var(--sunken)); }
        .ex .dh { font-weight: 700; color: var(--hot); }
        .ex .launch { display: flex; gap: .4em; flex-wrap: wrap; }
        .ex .mut { color: var(--muted); font-size: .9em; }
        .ex .cmp { display: grid; grid-template-columns: 1fr 1fr; gap: .5em 1.2em; }
        .ex .cmp .ch { font-weight: 700; border-bottom: 2px solid var(--border); padding-bottom: .2em; }
      `}</style>
    </div>
  );
}
