/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { Bars, Mat, diverging, range, sequential, useIsland } from './viz';
import Task from './Task';
import { AM_CSS, AttnMatrix, CH, STREAM_CSS, Streams, ValueRead, type Arc, type Chip } from './Task2';

/**
 * Task 3, two-key sum (a2f5c9d3fc → (5 + 9) mod 10 = 4): task 2's two heads fetch both values, an MLP after layer 2 adds
 * them. Everything trained comes from public/data/task3w.json (export_task3.py). The head slides reuse task 2's views
 * (AttnMatrix, ValueRead), so every task reads the same way. Colors as in task 2: layer 1 accent, layer 2 purple.
 */
const TEXT = 'a2f5c9d3fc';
const N = TEXT.length, LAST = N - 1;
const VALS = [1, 3, 5, 7];
const pct = (v: number) => `${Math.round(v * 100)}%`;
const pct1 = (v: number) => `${(v * 100).toFixed(1)}%`;
const argmax = (xs: number[]) => xs.indexOf(Math.max(...xs));

type T3 = {
  shapes: [string, number][]; ablation: [string, number][];
  l1: { one_back: number[]; q2_on_q1: number }; l2: { q1: number; q2: number; q1_row: number; q1_row_top: number };
  qk: Record<'q1' | 'q2', { token: number; write: number }>;
  acc: { full: number; before: number; write: number }; active: number;
  mlp_in: { pair: number; unordered: number; sum: number }; mlp_out: { pair: number; sum: number }; fit_r2: number;
  grid: { h: number[][][]; help: number[]; match: number[]; score: number[][]; bias: number[]; topk: { k: number; acc: number; cells: number[][] }[] };
  neuron: { id: number; score: number[]; bias: number; pre: number[][]; h: number[][]; votes: number[] };
  votes: number[][]; no_relu: { swapped: number; retrained: number };
  example: {
    text: string; tokens: string[]; attn1: (number | null)[][]; attn2: (number | null)[][]; probs: number[]; pre: number[]; h: number[];
    mlp: Record<'x' | 'pre' | 'h' | 'write' | 'up' | 'down', number[][]>;   // the whole mlp on all ten streams, and its weights
    v2_logits: number[][]; write2_logits: number[]; rest_logits: number[];
    logits_before: number[]; logits_write: number[]; logits_after: number[];
  };
};


// ── the task ─────────────────────────────────────────────────────────────────
const INTRO_CAPS: ComponentChildren[] = [
  <>trained with attention only, it stalls: attention can find both digits and bring them over, but nothing in it <b>adds</b>. a second head per layer doesn't help</>,
  <>so, by the plan: add one piece. an <b>mlp</b> after layer 2</>,
];
/**
 * The task worked by hand, as task 0's (Task.tsx's "sum": steps 0–4), then test accuracy:
 *   5 attention only: 27% (1 head per layer), 30% (2 heads)   6 plus an mlp: 98%
 */
export function Intro() {
  const { root, step, d } = useIsland<T3>('task3w');
  const names = ['attention only, 1 head per layer', 'attention only, 2 heads per layer', 'plus an mlp after layer 2'];
  const s = step - 5;
  return (
    <div class="t3i" ref={root}>
      <Task task="sum" />
      <div class={`acc fade ${s >= 0 ? 'on' : ''}`}>
        <div class="cap">{INTRO_CAPS[Math.max(0, Math.min(s, 1))]}</div>
        <div class="accrow">
          {d && <Bars width={560} max={100} hl={s >= 1 ? 2 : undefined}
            labels={names.map((n, i) => <span class={`fade ${i < 2 || s >= 1 ? 'on' : ''}`}>{n}</span>)}
            values={d.shapes.map(([, a], i) => (i < 2 || s >= 1 ? a : 0))}
            color={(_, i) => (i === 2 ? 'var(--good)' : 'var(--faint)')}
            fmtV={(v) => (v ? `${v.toFixed(0)}%` : '')} />}
          <div class="ax">test accuracy, 2 layers</div>
        </div>
      </div>
      <style>{`
        .t3i { display: flex; flex-direction: column; gap: .4em; width: 100%; }
        .t3i .task .work { gap: .1em; font-size: .72em; } .t3i .task .work li { margin: 0; }
        .t3i .cap { font-size: .7em; color: var(--muted); margin-bottom: .3em; } .t3i .cap b { color: var(--fg); }
        .t3i .accrow { display: flex; align-items: center; gap: 1.2em; font-size: .95em; }
        .t3i .fade { transition: opacity .35s; } .t3i .fade:not(.on) { opacity: 0; }
        .t3i .ax { font-size: .55em; color: var(--muted); }
      `}</style>
    </div>
  );
}

// ── the heads, in task 2's format ────────────────────────────────────────────
const ROLES = ['k1', 'v1', 'k2', 'v2', 'k3', 'v3', 'k4', 'v4', 'q1', 'q2'];
/** the input and its answer, over the matrices, like task 2's layer 1 slide */
function Prompt() {
  return (
    <div class="t3in">
      {[...TEXT].map((c, i) => <span class="ic"><b class={/\d/.test(c) ? 'dg' : ''}>{c}</b><i>{ROLES[i]}</i></span>)}
      <span class="ar">→ 4</span>
    </div>
  );
}
const HEAD_CSS = AM_CSS + STREAM_CSS + `
  .t3col { display: flex; flex-direction: column; gap: .3em; }
  .t3in { display: flex; gap: .5em; align-items: flex-end; font-size: .7em; }
  .t3in .ic { display: flex; flex-direction: column; align-items: center; min-width: 1.6em; }
  .t3in .ic b { font-family: var(--mono); font-size: 1.2em; color: var(--fg); } .t3in .ic b.dg { color: var(--hot); }
  .t3in .ic i { font-size: .5em; font-style: normal; color: var(--muted); }
  .t3in .ar { font-family: var(--mono); color: var(--good); margin: 0 0 .55em .4em; font-weight: 700; }
  .t3a { display: flex; gap: 2em; align-items: center; }
  .t3a .side { display: flex; flex-direction: column; gap: .8em; font-size: .64em; max-width: 22em; color: var(--muted); }
  .t3a .side b { color: var(--fg); } .t3a .side b.dg { color: var(--hot); }
  .t3a .side .tg { font-family: var(--mono); color: var(--accent); font-weight: 600; }
  .t3a .side .l1c { color: var(--accent); font-weight: 600; } .t3a .side .l2c { color: var(--purple); font-weight: 600; }
  .t3a.wide { flex-direction: column; gap: .4em; align-items: stretch; }
  .t3a.wide .side { max-width: none; font-size: .72em; }
`;
/**
 * Layer 1, head 1 on a2f5c9d3fc: task 2's slide, with one new row.
 *   0 the matrix: every digit looks one back, and so does the last row (c at q2 → f at q1)
 *   1 only the digit rows and the last row matter
 */
export function L1() {
  const { root, step, d } = useIsland<T3>('task3w');
  if (!d) return <div ref={root} />;
  const att = d.example.attn1, chars = [...TEXT], ob = d.l1.one_back;
  const back = [...VALS, LAST].map((v) => [v, v - 1] as [number, number]);
  return (
    <div class="t3col" ref={root}>
    <Prompt />
    <div class="t2s t3a">
      <AttnMatrix chars={chars} att={att} keep={[...VALS, LAST]} dim={step >= 1} hlCells={back} roles={ROLES} />
      <div class="side">
        {step === 0 && <>
          <div>the same reading as task 2: each <b>row</b> is a query, each <b>column</b> a key, rows sum to 100%</div>
          <div>outlined: every digit looks <b>one back</b>, at its key, as before ({pct1(Math.min(...ob))}–{pct1(Math.max(...ob))}, test average)</div>
          <div>new, the <b>last row</b>: the c at q2 looks one back too, at the f at q1: <b>{pct(att[LAST][LAST - 1] as number)}</b> ({pct1(d.l1.q2_on_q1)} over the test set)</div>
        </>}
        {step >= 1 && <>
          <div><b>digit rows</b>: each copies its key into its own stream, "5, after f", as in task 2</div>
          <div><b>the last row</b>: copies the f into the c's stream. it's the only stream layer 2 asks from, and now it says <b>c</b> and <b>f</b>: both keys</div>
          <div>the other rows write where nobody reads, as in task 2</div>
        </>}
      </div>
    </div>
      <style>{HEAD_CSS}</style>
    </div>
  );
}

/**
 * Layer 2, head 1 on a2f5c9d3fc: task 2's slide, digits tagged with what layer 1 wrote, and the last column tagged too.
 *   0 the matrix, every row but the last dimmed from the start: the last row splits between the 5 and the 9
 *   1 why: two questions from one stream (QK split, test averages)
 */
export function L2() {
  const { root, step, d } = useIsland<T3>('task3w');
  if (!d) return <div ref={root} />;
  const att = d.example.attn2, chars = [...TEXT], A = att[LAST] as number[], q = d.qk;
  const tags = chars.map((_, i) => (VALS.includes(i) || i === LAST ? `+${chars[i - 1]}` : null));
  const letterCols = range(N).filter((i) => !VALS.includes(i));
  return (
    <div class="t3col" ref={root}>
    <Prompt />
    <div class="t2s t3a">
      <AttnMatrix chars={chars} att={att} keep={[LAST]} dim hlCells={[[LAST, 3], [LAST, 5]]} tags={tags} greyCols={letterCols} roles={ROLES} />
      <div class="side">
        {step === 0 && <>
          <div>layer 2 reads the streams as layer 1 left them: each digit tagged with its key, and the last stream with <span class="tg">+f</span></div>
          <div>outlined: the c at the end puts <b>{pct(A[3])}</b> on the <b class="dg">5</b> and <b>{pct(A[5])}</b> on the <b class="dg">9</b>
            . task 2's head picked one digit; this one splits evenly</div>
          <div>the f's stream holds one letter: one question, one digit (the row above, {pct(att[LAST - 1][3] as number)} on the 5, in a stream nothing reads). the c's holds two letters: two questions, two digits</div>
        </>}
        {step === 1 && <div class="qk">
          <div class="h">part of the last stream</div><div class="h">matches</div><div class="h">pulls toward</div><div class="h n">score</div>
          <div><span class="ch tok">c</span> its token</div><div><span class="ch l1">c</span></div><div>the <b class="dg">9</b></div><div class="n">+{q.q2.token.toFixed(1)}</div>
          <div><span class="ch l1">f</span> layer 1's copy</div><div><span class="ch l1">f</span></div><div>the <b class="dg">5</b></div><div class="n">+{q.q1.write.toFixed(1)}</div>
          <div class="note">why: the first row is task 2's lookup. the second is new: the query also reads what layer 1 wrote into the last stream. two questions,
            nearly the same size (each also pulls {q.q1.token.toFixed(1)} from the other's digit), so softmax splits about evenly. test averages</div>
        </div>}
      </div>
    </div>
      <style>{HEAD_CSS + `
        .t3a b.dg { color: var(--hot); }
        .t3a .side { max-width: 30em; }
        .t3a .qk .h, .t3a .qk > div:not(.note) { white-space: nowrap; }
        .t3a .qk { display: grid; grid-template-columns: auto auto auto auto; gap: .35em 1.2em; align-items: center; color: var(--muted); }
        .t3a .qk .h { font-size: .8em; border-bottom: 1px solid var(--border); padding-bottom: .2em; }
        .t3a .qk .n { font-family: var(--mono); color: var(--fg); text-align: right; }
        .t3a .qk .note { grid-column: 1 / -1; font-size: .9em; margin-top: .3em; }
        .t3a .ch { display: inline-block; font-family: var(--mono); font-weight: 600; padding: 0 .45em; border-radius: 5px; border: 2px solid; margin-right: .3em; }
        .t3a .ch.tok { background: var(--raised); border-color: var(--line-2); color: var(--fg); }
        .t3a .ch.l1 { background: color-mix(in srgb, var(--accent) 20%, var(--bg)); border-color: var(--accent); color: var(--accent); }
      `}</style>
    </div>
  );
}

/**
 * Layer 2's value on a2f5c9d3fc, task 2's slide (ValueRead). Here the unembedding can't read the values: their reader is the mlp.
 *   0 every position's value, read by the unembedding   1 scaled by the c's attention: the 5's and the 9's, about half each
 *   2 the write + the rest of the stream: what the stream entering the mlp says (chance on the test set)
 */
export function Value3() {
  const { root, step, d } = useIsland<T3>('task3w');
  if (!d) return <div ref={root} />;
  const ex = d.example, toks = ex.tokens;
  const says = (v: number[]) => toks[argmax(v)];
  return (
    <div ref={root}>
      <ValueRead step={step} toks={toks} chars={[...TEXT]} roles={ROLES} values={ex.v2_logits} A={ex.attn2[LAST] as number[]}
        write={ex.write2_logits} rest={ex.rest_logits}
        head={['position', 'c\'s attention', 'its value, read by the unembedding: one score per token']}
        sum={<>= the stream entering the mlp says <tspan class="dg">{says(ex.logits_before)}</tspan>. the answer is <tspan class="b">4</tspan></>}
        caps={[
          <>every position's value, read the way the unembedding reads the stream. in task 2 each digit's value said that digit. not here:
            the <b class="dg">5</b>'s says <b>{says(ex.v2_logits[3])}</b>, the <b class="dg">9</b>'s says <b>{says(ex.v2_logits[5])}</b></>,
          <>scaled by the c's attention from the last slide: the <b class="dg">5</b>'s and the <b class="dg">9</b>'s survive, about half each</>,
          <>the head's write plus the rest of the c's stream says <b>{says(ex.logits_before)}</b>: right on <b>{pct(d.acc.before)}</b> of the test set, chance.
            the 5 and the 9 are in there, but not for the unembedding. its reader is the mlp</>,
        ]} />
    </div>
  );
}

// ── the mlp: one position at a time ──────────────────────────────────────────
const x = (i: number) => 210 + i * 128;
/**
 * The streams after attention, then the mlp on every one of them, on its own.
 *   0 the mlp on every position, the last one lit: the unembedding reading its stream before the mlp is at chance
 *   1 the mlp's write alone: 98%. attention moves, the mlp computes
 */
export function MlpWhere() {
  const { root, step, d } = useIsland<T3>('task3w');
  if (!d) return <div ref={root} />;
  const rows = { mlp: 70, l2: 190, l1: 300, tok: 410 };
  const chips: Chip[] = [
    ...range(N).map((i) => ({ col: i, row: 'tok' as const, text: TEXT[i], on: true })),
    ...[...VALS, LAST].map((v) => ({ col: v, row: 'l1' as const, text: TEXT[v - 1], on: true })),
    { col: LAST, row: 'l2', text: '5 9', on: true },
    ...range(N).map((i) => ({ col: i, row: 'mlp' as const, text: i === LAST && step >= 1 ? '4' : 'mlp', on: true, hl: i === LAST })),
  ];
  const arcs: Arc[] = [
    ...[...VALS, LAST].map((v) => ({ from: v - 1, to: v, y0: rows.tok - CH / 2, y1: rows.l1 + CH / 2, kind: 'l1' as const, on: true })),
    ...[3, 5].map((v) => ({ from: v, to: LAST, y0: rows.l1 - CH / 2, y1: rows.l2 + CH / 2, kind: 'l2' as const, on: true })),
    ...range(N).map((i) => ({ from: i, to: i, y0: rows.l2 - CH / 2 - 6, y1: rows.mlp, kind: 'mlp' as const, on: true })),
  ];
  const caps: ComponentChildren[] = [
    <>the mlp runs on each position alone, no arcs between them. only the last one is graded. its stream holds the <b class="dg">5</b> and the <b class="dg">9</b>, but read it with the unembedding and it's right <b>{pct(d.acc.before)}</b> of the time: chance. the <b class="dg">4</b> isn't in there</>,
    <>the mlp's write alone, read the same way: <b>{pct(d.acc.write)}</b>. it wrote something no token had: <b>attention moves, the mlp computes</b></>,
  ];
  return (
    <div class="t2s t3w" ref={root}>
      <Streams rows={rows} chips={chips} arcs={arcs} H={480} n={N} x={x} labelsOn={{ mlp: true }} dimCols={range(LAST)} />
      <div class="below">
        <div class="cap">{caps[Math.min(step, 1)]}</div>
        <div class="ex">
          <div class="h">the unembedding reading</div><div class="h n">right, test set</div>
          <div>the last stream before the mlp</div><div class="n">{pct(d.acc.before)}</div>
          <div class={`fade ${step >= 1 ? 'on' : ''}`}>the mlp's write alone</div><div class={`n fade ${step >= 1 ? 'on' : ''}`}><b>{pct(d.acc.write)}</b></div>
          <div class={`fade ${step >= 1 ? 'on' : ''}`}>the full stream</div><div class={`n fade ${step >= 1 ? 'on' : ''}`}>{pct(d.acc.full)}</div>
        </div>
      </div>
      <style>{STREAM_CSS + `
        .t3w .below { display: flex; gap: 2.4em; align-items: flex-start; }
        .t3w .cap { flex: 1; font-size: .72em; color: var(--muted); } .t3w .cap b { color: var(--fg); } .t3w .cap b.dg { color: var(--hot); }
        .t3w .ex { flex: none; display: grid; grid-template-columns: auto auto; gap: .3em 1.4em; font-size: .6em; color: var(--muted); }
        .t3w .ex .h { font-size: .85em; border-bottom: 1px solid var(--border); padding-bottom: .2em; }
        .t3w .ex .n { font-family: var(--mono); text-align: right; color: var(--fg); } .t3w .ex b { color: var(--good); }
        .t3w .fade { transition: opacity .35s; } .t3w .fade:not(.on) { opacity: 0; }
      `}</style>
    </div>
  );
}

// ── inside the mlp: up, relu, down ───────────────────────────────────────────
const rms2 = (m: number[][]) => 2 * Math.sqrt(m.flat().reduce((a, b) => a + b * b, 0) / m.flat().length);
/**
 * The mlp as matmuls on all ten streams (example.mlp), drawn the way HeadScores draws q · k: the left matrix's rows times
 * the top matrix's columns land where they cross. Two of those side by side, the relu between them.
 *   0 up: (10, 32) @ (32, 64)   1 relu: below zero is 0   2 down: (10, 64) @ (64, 32)   3 added into the stream
 *   4 only the last row is read
 */
export function MlpOps() {
  const { root, step, d } = useIsland<T3>('task3w');
  if (!d) return <div ref={root} />;
  const m = d.example.mlp, chars = [...TEXT];
  const fired = m.h[LAST].filter((v) => v > 0).length;
  const sx = rms2(m.x), sp = rms2(m.pre), sw = rms2(m.write), su = rms2(m.up), sd = rms2(m.down);
  // columns 6 wide everywhere; the ten stream rows 22 tall; the weights 192 tall (32 rows of 6, 64 rows of 3)
  const TY = 30, BY = 262, RH = 22, X0 = 60, PX = 282, HX = 780, WX = 1200;
  const last = step >= 4 ? [LAST] : [];
  const on = (s: number) => `fd ${step >= s ? 'on' : ''}`;
  const lab = (i: number) => (/\d/.test(chars[i]) ? 'dg' : '');
  const caps: ComponentChildren[] = [
    <><b>up</b>: each stream (a row, 32 numbers) times W_up gives 64 numbers, one per <b>neuron</b>. a row times a column lands where they cross. column n of W_up is what neuron n looks for</>,
    <><b>relu</b>: anything below zero becomes exactly 0. a neuron <b>fires</b> when its number is positive and is silent otherwise. on the last row, {fired} of 64 fire</>,
    <><b>down</b>: back to 32 numbers. each neuron that fired adds its row of W_down, scaled by how hard it fired. the silent ones add nothing</>,
    <><b>add</b>: the write goes into the stream, like every attention write. 32 in, 64 inside, 32 out, so it fits back into the residual stream</>,
    <>the same weights run on all ten rows, but nothing reads rows 0–8: no layer comes after, and only the last position is graded. so from here on, <b>only the last row</b></>,
  ];
  return (
    <div class="t3o" ref={root}>
      <svg viewBox="0 0 1500 615">
        <Mat data={m.x} x={X0} y={BY} cw={6} ch={RH} color={(v) => diverging(v, sx)} rowLabels={chars} labelCls={lab} name="x" shape hlRows={last} dim={step >= 4} />
        <Mat data={m.up} x={PX} y={TY} cw={6} ch={6} gap={0.4} color={(v) => diverging(v, su)} name="W_up" shape />
        <Mat data={m.pre} x={PX} y={BY} cw={6} ch={RH} color={(v) => diverging(v, sp)} name="before relu" shape hlRows={last} dim={step >= 4} />
        <g class={on(1)}>
          <text class="op" x={(PX + 384 + HX) / 2} y={BY + 5 * RH + 8}>relu →</text>
          <Mat data={m.h} x={HX} y={BY} cw={6} ch={RH} color={(v) => diverging(v, sp)} name="after relu" shape hlRows={last} dim={step >= 4} />
        </g>
        <g class={on(2)}>
          <Mat data={m.down} x={WX} y={TY} cw={6} ch={3} gap={0.3} color={(v) => diverging(v, sd)} name="W_down" shape />
          <Mat data={m.write} x={WX} y={BY} cw={6} ch={RH} color={(v) => diverging(v, sw)} name="write" shape hlRows={last} dim={step >= 4} />
        </g>
        <g class={on(3)}>
          <path class="loop" d={`M ${WX + 96} 525 C ${WX + 96} 575, ${WX - 40} 575, ${(X0 + WX) / 2} 575 S ${X0 + 96} 575, ${X0 + 96} 525`} />
          <path class="loop" d={`M ${X0 + 88} 535 L ${X0 + 96} 525 L ${X0 + 104} 535`} />
          <text class="loopl" x={(X0 + WX) / 2} y={605}>x + write: added back into the stream</text>
        </g>
      </svg>
      <div class="cap">{caps[Math.min(step, 4)]}</div>
      <style>{`
        .t3o { display: flex; flex-direction: column; gap: .4em; width: 100%; }
        .t3o svg { width: 100%; display: block; overflow: visible; }
        .t3o .mx .rl.dg { fill: var(--hot); }
        .t3o .op { font-family: var(--mono); font-size: 22px; fill: var(--fg); text-anchor: middle; }
        .t3o .loop { fill: none; stroke: var(--good); stroke-width: 2.5; marker-end: none; }
        .t3o .loopl { font-size: 20px; fill: var(--good); text-anchor: middle; }
        .t3o .fd { opacity: 0; transition: opacity .35s; } .t3o .fd.on { opacity: 1; }
        .t3o .cap { font-size: .72em; color: var(--muted); min-height: 3em; max-width: 56em; }
        .t3o .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}

// ── a neuron is a key and a value ────────────────────────────────────────────
/** a row of cells, one per key, with a label under every one (or every few) */
function Strip({ v, color, cw, labels, y = 0, hl = [] }: {
  v: number[]; color: (v: number) => string; cw: number; labels: (i: number) => string | null; y?: number; hl?: number[];
}) {
  return (
    <g transform={`translate(0 ${y})`}>
      {v.map((x, i) => <rect x={i * cw} y={0} width={cw - 2} height={34} rx="2" style={{ fill: color(x) }} class={hl.includes(i) ? 'hl' : ''} />)}
      {v.map((_, i) => { const l = labels(i); return l === null ? null : <text class="sl" x={i * cw + cw / 2 - 1} y={54}>{l}</text>; })}
    </g>
  );
}
/**
 * The mlp in attention's terms (Geva et al. 2021): a neuron is a key and a value, the keys memorized instead of read from the streams.
 *   0 attention's three parts   1 the mlp's, side by side   2 on a2f5c9d3fc: attention's last row, the mlp's 64 match scores
 *   3 softmax vs relu: compete vs fire on their own   4 what the hidden layer is
 */
export function KeyValue() {
  const { root, step, d } = useIsland<T3>('task3w');
  if (!d) return <div ref={root} />;
  const ex = d.example, A = ex.attn2[LAST] as number[], pre = ex.pre, h = ex.h;
  const fired = h.filter((v) => v > 0).length, pl = Math.max(...pre.map(Math.abs)), hl = Math.max(...h);
  const rows: [string, ComponentChildren, ComponentChildren][] = [
    ['asks', <>a query, read from the last stream</>, <>the last stream itself</>],
    ['keys', <>one per position, read from the <b>streams</b>: change with every input. 10 here</>, <>column n of W_up: <b>learned</b>, the same for every input. 64</>],
    ['match', <><b>softmax</b>: the keys compete, the row sums to 100%</>, <><b>relu</b>: each key on its own. no match, exactly 0</>],
    ['adds', <>each position's value × its weight</>, <>row n of W_down × how hard neuron n fired</>],
  ];
  const caps: ComponentChildren[] = [
    <>layer 2's head, the way we've read every head: a query, compared against keys, and the values of whatever matched added into the stream</>,
    <>the mlp is the same grammar with one change: the keys are <b>memorized</b> instead of fetched. column n of W_up is a fixed question asked of the stream; row n of W_down is what gets added if it matches</>,
    <>on a2f5c9d3fc. attention's last row: 10 live keys. the mlp's: the stream · each of its 64 keys, one row of match scores, like a row of the attention matrix before softmax</>,
    <>the difference: softmax makes keys <b>compete</b>, one row, 100% to share. relu doesn't: every key that matches fires, on its own, and the rest say exactly nothing. {fired} of 64 fire here</>,
    <>so the 64 aren't a wider stream. they're the answers to 64 questions, kept only long enough to add up their values, then thrown away. next: what they do together</>,
  ];
  const CW = 21, W = 64 * CW;
  return (
    <div class="t3k" ref={root}>
      <div class="kv">
        <div /><div class="h">attention: layer 2's head</div><div class={`h fade ${step >= 1 ? 'on' : ''}`}>mlp: neuron n, of 64</div>
        {rows.map(([k, a, m]) => <>
          <div class="k">{k}</div><div>{a}</div><div class={`fade ${step >= 1 ? 'on' : ''}`}>{m}</div>
        </>)}
      </div>
      <svg class={`rows fade ${step >= 2 ? 'on' : ''}`} viewBox={`-150 -8 ${W + 160} 196`} style={{ width: `${(W + 160) * 0.9}px` }}>
        <text class="rl" x={-14} y={23}>attention</text>
        <Strip v={A} cw={42} color={(v) => sequential(v)} labels={(i) => TEXT[i]} hl={[3, 5]} />
        {[3, 5].map((i) => <text class="pv" x={i * 42 + 20} y={22}>{pct(A[i])}</text>)}
        <text class="rl" x={-14} y={123}>{step >= 3 ? 'relu' : 'mlp'}</text>
        <Strip y={100} v={step >= 3 ? h : pre} cw={CW} color={(v) => (step >= 3 ? (v > 0 ? sequential(v / hl) : 'var(--raised)') : diverging(v, pl))}
          labels={(i) => (i % 8 === 0 || i === 63 ? `${i}` : null)} hl={step >= 3 ? range(64).filter((i) => h[i] > 0) : []} />
        <text class="note" x={W} y={180}>{step >= 3 ? `${fired} of 64 fire; no sum to share` : 'the stream · each of the 64 keys'}</text>
        <text class="note" x={10 * 42} y={23} style={{ textAnchor: 'start' }}> ← sums to 100%</text>
      </svg>
      <div class="cap">{caps[Math.min(step, 4)]}</div>
      <style>{`
        .t3k { display: flex; flex-direction: column; gap: .8em; width: 100%; }
        .t3k .kv { display: grid; grid-template-columns: auto 1fr 1fr; gap: .45em 2em; font-size: .62em; color: var(--muted); }
        .t3k .kv .h { color: var(--fg); font-weight: 600; border-bottom: 1px solid var(--border); padding-bottom: .2em; }
        .t3k .kv .k { font-family: var(--mono); color: var(--accent); }
        .t3k b { color: var(--fg); }
        .t3k .fade { transition: opacity .35s; } .t3k .fade:not(.on) { opacity: 0; }
        .t3k svg { overflow: visible; display: block; }
        .t3k .rl { font-family: var(--mono); font-size: 22px; fill: var(--fg); text-anchor: end; }
        .t3k .sl { font-family: var(--mono); font-size: 16px; fill: var(--muted); text-anchor: middle; }
        .t3k .pv { font-family: var(--mono); font-size: 14px; fill: var(--bg); text-anchor: middle; font-weight: 700; }
        .t3k .note { font-size: 18px; fill: var(--muted); text-anchor: end; }
        .t3k rect.hl { stroke: var(--hot); stroke-width: 2; }
        .t3k .cap { font-size: .66em; color: var(--muted); min-height: 2.6em; }
      `}</style>
    </div>
  );
}

// ── what the neurons fire on ─────────────────────────────────────────────────
const ANS = range(10).map((a) => range(10).map((b) => (a + b) % 10));
/** a 10 × 10 grid over (a, b), with the answers written in when cw is big enough */
function PairGrid({ data, color, cw, hl = [], inv, text = cw >= 30, axes = cw >= 30 }: {
  data: number[][]; color: (v: number, a: number, b: number) => string; cw: number; hl?: [number, number][]; text?: boolean; axes?: boolean;
  inv?: (v: number) => boolean;   // cells bright enough for dark text
}) {
  const S = 10 * cw, m = axes ? 44 : 2;
  return (
    <svg class="pg" viewBox={`${-m} ${-m} ${S + m + 2} ${S + m + 2}`} style={{ width: `${S + m + 2}px` }}>
      {axes && <>
        {range(10).map((i) => <text class="gl" x={-16} y={i * cw + cw / 2 + 6}>{i}</text>)}
        {range(10).map((i) => <text class="gl" x={i * cw + cw / 2} y={-10}>{i}</text>)}
        <text class="ga" x={-36} y={S / 2} transform={`rotate(-90 -36 ${S / 2})`}>a →</text>
        <text class="ga" x={S / 2} y={-28}>b →</text>
      </>}
      <Mat data={data} x={0} y={0} cw={cw} ch={cw} gap={2} color={color} hlCells={hl} inv={inv} text={text ? (_, a, b) => `${ANS[a][b]}` : undefined} />
    </svg>
  );
}
/**
 * The six most helpful neurons (help: how much each raises the right answer over its mean vote, averaged over all 100 pairs),
 * each as a 10 × 10 of how hard it fires on every pair (a, b). r² of firing by a, b, answer: ~/code/ml/interp data/task3/neuron_summary.csv. Then
 * the crowd: the mlp's write alone, keeping the 8 / 32 / all 64 most helpful neurons, and where on the 10 × 10 it's right.
 *   0 the six   1–3 top 8, 32, 64
 */
export function Patterns() {
  const { root, step, d } = useIsland<T3>('task3w');
  if (!d) return <div ref={root} />;
  const g = d.grid;
  const six = range(64).sort((a, b) => g.help[b] - g.help[a]).slice(0, 6);
  const hmax = (k: number) => Math.max(...g.h[k].flat(), 1e-9);
  const ex = six.includes(43) ? 43 : six[1];
  const kk = [0, 8, 32, 64][Math.min(step, 3)], tk = g.topk.find((t) => t.k === (kk || 8))!;
  const mix = (c: string, t: number) => `color-mix(in srgb, ${c} ${Math.round(t * 100)}%, var(--raised))`;
  const right = (v: number) => (v >= 0.5 ? mix('var(--good)', 0.2 + 0.5 * v) : mix('var(--bad)', 0.6 - 0.5 * v));
  return (
    <div class="t3t" ref={root}>
      <div class="many">
        {six.map((k) => (
          <div class="mini">
            <PairGrid data={g.h[k]} color={(v) => sequential(v / hmax(k))} cw={21} hl={[[5, 9]]} />
            <div class="ml">n{k}</div>
          </div>
        ))}
      </div>
      <div class="txt">
        <div class="hd">the 6 most helpful of 64 neurons. row a, column b: how hard it fires. <span class="o">□</span> our input (5, 9)</div>
        <div class="cap">each fires on <b>sets of digits</b>, not on an answer: over all 64, which digits came in explains a neuron's firing far better
          (a: 37%, b: 39%) than the answer does (7%). the clearest, n{ex}, fires when both digits are odd. no single neuron knows the answer</div>
        <div class={`fade ${step >= 1 ? 'on' : ''} crowd`}>
          <div class="hd">add up the votes of the {kk || 8} most helpful: right on <b>{pct(tk.acc)}</b> of pairs (<span class="g">green</span>: right)</div>
          <div class="row">
            <PairGrid data={tk.cells} color={right} cw={20} />
            <Bars width={150} max={100} values={g.topk.map((t) => (t.k <= kk ? t.acc * 100 : 0))} labels={g.topk.map((t) => `top ${t.k}`)}
              hl={g.topk.findIndex((t) => t.k === kk)} color={(_, i) => (g.topk[i].k === kk ? 'var(--good)' : 'var(--faint)')} fmtV={(v) => (v ? `${v.toFixed(0)}%` : '')} />
          </div>
        </div>
      </div>
      <style>{`
        .t3t { display: flex; gap: 3em; width: 100%; color: var(--muted); align-items: flex-start; }
        .t3t .txt { display: flex; flex-direction: column; gap: .9em; flex: 1; }
        .t3t .hd { font-size: .62em; } .t3t .hd .o { color: var(--hot); } .t3t .hd b { color: var(--fg); } .t3t .hd .g { color: var(--good); }
        .t3t .many { display: grid; grid-template-columns: repeat(3, auto); gap: 1.2em 2.4em; flex: none; }
        .t3t .mini { display: flex; flex-direction: column; gap: .15em; }
        .t3t svg { overflow: visible; display: block; }
        .t3t .pg .mx .hlbox { stroke: var(--hot); stroke-width: 2.5; }
        .t3t .ml { font-family: var(--mono); font-size: .55em; } .t3t .ml b { color: var(--hot); } .t3t .ml i { font-style: normal; color: var(--fg); }
        .t3t .cap { font-size: .68em; }
        .t3t .crowd { display: flex; flex-direction: column; gap: .5em; padding-top: .6em; }
        .t3t .crowd .row { display: flex; gap: 1.6em; align-items: center; } .t3t .crowd .bars { font-size: .8em; }
        .t3t .fade { opacity: 0; transition: opacity .35s; } .t3t .fade.on { opacity: 1; }
      `}</style>
    </div>
  );
}

// ── without the relu ─────────────────────────────────────────────────────────
/**
 * With vs without the relu, on the last row of a2f5c9d3fc: the 64 neurons after the relu (most silent) and without it (all
 * speak). Without it the two matmuls are one matrix, a linear read like the one before the mlp.
 *   0 the two rows, and the collapse   1 measured: swapped out, retrained without it
 */
export function NoRelu() {
  const { root, step, d } = useIsland<T3>('task3w');
  if (!d) return <div ref={root} />;
  const pre = d.example.pre, h = d.example.h, s = rms2([pre]);
  const fired = h.filter((v) => v > 0).length;
  const attnOnly = d.shapes[0][1];
  const rows: [string, number][] = [
    ['with the relu (the trained model)', d.acc.full * 100], ['relu taken out of the trained model', d.no_relu.swapped * 100],
    ['retrained without the relu', d.no_relu.retrained * 100], ['attention only, no mlp', attnOnly],
  ];
  const X = 220, CW = 17, CH = 44;
  return (
    <div class="t3r" ref={root}>
      <svg viewBox="0 0 1500 150">
        <text class="rl" x={X - 24} y={CH / 2 + 7}>with the relu</text>
        <Mat data={[h]} x={X} y={0} cw={CW} ch={CH} gap={2} color={(v) => diverging(v, s)} />
        <text class="n" x={X + 64 * CW + 20} y={CH / 2 + 7}>{fired} of 64 speak</text>
        <text class="rl" x={X - 24} y={CH + 34 + CH / 2 + 7}>without</text>
        <Mat data={[pre]} x={X} y={CH + 34} cw={CW} ch={CH} gap={2} color={(v) => diverging(v, s)} />
        <text class="n" x={X + 64 * CW + 20} y={CH + 34 + CH / 2 + 7}>64 of 64 speak</text>
      </svg>
      <div class="cap">without it, every neuron passes its number on, negative or not, and the two matmuls collapse into one:
        <span class="eq"> (x @ W_up) @ W_down = x @ (W_up @ W_down)</span>, a single 32 × 32 matrix. that's the same kind of read as the unembedding
        before the mlp, which got {pct(d.acc.before)}</div>
      <div class={`fade ${step >= 1 ? 'on' : ''}`}>
        <Bars width={720} max={100} values={rows.map(([, v]) => v)} labels={rows.map(([l]) => l)}
          color={(_, i) => (i === 0 ? 'var(--good)' : i === 3 ? 'var(--faint)' : 'var(--bad)')} fmtV={(v) => `${v.toFixed(0)}%`} />
      </div>
      <style>{`
        .t3r { display: flex; flex-direction: column; gap: 1.4em; width: 100%; color: var(--muted); }
        .t3r svg { width: 100%; display: block; overflow: visible; }
        .t3r .rl { font-family: var(--mono); font-size: 22px; fill: var(--fg); text-anchor: end; }
        .t3r .n { font-family: var(--mono); font-size: 22px; fill: var(--muted); }
        .t3r .cap { font-size: .72em; max-width: 56em; } .t3r .eq { font-family: var(--mono); color: var(--fg); white-space: nowrap; }
        .t3r .bars { font-size: .85em; gap: .5em .8em; } .t3r .bar-row .track { height: 1.5em; }
        .t3r .fade { opacity: 0; transition: opacity .4s; } .t3r .fade.on { opacity: 1; }
      `}</style>
    </div>
  );
}

// ── knock out one piece ──────────────────────────────────────────────────────
export function Ablate() {
  const { root, d } = useIsland<T3>('task3w');
  if (!d) return <div ref={root} />;
  const names: Record<string, string> = {
    'full model': 'the trained model', 'layer 1 attention removed': 'without layer 1 (no "after f" tags)',
    'layer 2 attention removed': 'without layer 2 (nothing fetches the values)', 'MLP removed': 'without the mlp (nothing adds)',
    'position embedding removed': 'without the position embedding',
  };
  return (
    <div class="t3b" ref={root}>
      <Bars width={620} max={100} values={d.ablation.map(([, a]) => a)} labels={d.ablation.map(([m]) => names[m] ?? m)}
        color={(_, i) => (i === 0 ? 'var(--good)' : 'var(--bad)')} fmtV={(v) => `${v.toFixed(0)}%`} />
      <div class="cap">same trained weights, one piece zeroed. without the mlp the heads still fetch both digits; nothing turns them into the answer</div>
      <style>{`
        .t3b { display: flex; flex-direction: column; gap: 1.2em; font-size: 1.25em; }
        .t3b .cap { font-size: .6em; color: var(--muted); max-width: 40em; }
        .t3b .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
