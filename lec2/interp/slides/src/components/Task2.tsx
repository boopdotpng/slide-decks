/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { Bars, Mat, diverging, range, sequential, useData, useIsland } from './viz';

/**
 * Task 2, dictionary lookup (a2f5c9d3f → 5). Schematics first (Twice, OneLayer, Position): every stream drawn as
 * a column of labelled chips, one per thing written into it, so "what does this stream say" is readable. Then the
 * trained model, from public/data/task2.json (export_task.py 2: ~/code/ml/interp/data/task2/*.csv) and
 * task2w.json (export_task2.py: the layer 2 letter match on real streams, one example run).
 * Colors: layer 1's writes are accent, layer 2's are purple.
 */
const TEXT = 'a2f5c9d3f';
const N = TEXT.length, LAST = N - 1;
const VALS = [1, 3, 5, 7];
const isD = (c: string) => /\d/.test(c);
const W = 1400, CW = 64;
export const CH = 38;
const xDefault = (i: number) => 260 + i * 133;

type RowName = 'tok' | 'pos' | 'l1' | 'l2' | 'mlp' | 'out';
export type Chip = { col: number; row: RowName; text: string; on: boolean; hl?: boolean; bad?: boolean; delay?: number };
export type Arc = { from: number; to: number; y0: number; y1: number; kind: 'l1' | 'l2' | 'mlp' | 'bad'; on: boolean; delay?: number };
const LABEL: Record<RowName, string> = { tok: 'token', pos: 'position', l1: 'layer 1', l2: 'layer 2', mlp: 'mlp', out: 'answer' };

function arcPath({ from, to, y0, y1 }: Arc, x: (i: number) => number) {
  // a position reading its own stream (the mlp): out of the stream and into the chip's side
  if (from === to) return `M ${x(from)} ${y0} C ${x(from) + 52} ${y0 - 10}, ${x(from) + 52} ${y1 + 4}, ${x(from) + CW / 2} ${y1}`;
  const k = Math.min(70, (y0 - y1) * 0.6);
  return `M ${x(from)} ${y0} C ${x(from)} ${y0 - k}, ${x(to)} ${y1 + k}, ${x(to)} ${y1}`;
}

/**
 * the streams: a line per position, chips on it, arcs between them. rows: y of each chip row (only rows given get a label).
 * n positions, column i at x(i) (task 2's 9 by default; task 3 passes 10)
 */
export function Streams({ rows, chips, arcs, H, labelsOn = {}, dimCols = [], n = N, x = xDefault }: {
  rows: Partial<Record<RowName, number>>; chips: Chip[]; arcs: Arc[]; H: number;
  labelsOn?: Partial<Record<RowName, boolean>>; dimCols?: number[]; n?: number; x?: (i: number) => number;
}) {
  const ys = Object.values(rows) as number[];
  const bot = Math.max(...ys), top = Math.min(...ys) - 40;
  return (
    <svg viewBox={`0 0 ${W} ${H}`}>
      {(Object.entries(rows) as [RowName, number][]).map(([r, y]) => (
        <text class={`lbl fade ${labelsOn[r] ?? true ? 'on' : ''}`} x="20" y={y + 9}>{LABEL[r]}</text>
      ))}
      {range(n).map((i) => (
        <g class={`colg ${dimCols.includes(i) ? 'dim' : ''}`}>
          <line class="stream" x1={x(i)} x2={x(i)} y1={bot} y2={top} />
          <text class="pos" x={x(i)} y={bot + CH / 2 + 30}>{i}</text>
        </g>
      ))}
      {arcs.map((a) => (
        <path class={`arc ${a.kind} ${a.on ? 'on' : ''}`} d={arcPath(a, x)} style={{ transitionDelay: a.on ? `${a.delay ?? 0}ms` : '0ms' }} />
      ))}
      {chips.map((c) => {
        const cx = x(c.col), cy = rows[c.row]!;
        return (
          <g class={`chip ${c.row} ${c.bad ? 'bad' : ''} ${c.hl ? 'hl' : ''} ${isD(c.text) && c.row !== 'pos' ? 'dg' : ''} fade ${c.on ? 'on' : ''} ${dimCols.includes(c.col) ? 'dim' : ''}`}
            style={{ transitionDelay: c.on ? `${c.delay ?? 0}ms` : '0ms' }}>
            <rect x={cx - CW / 2} y={cy - CH / 2} width={CW} height={CH} rx="7" />
            <text x={cx} y={cy + 8}>{c.text}</text>
          </g>
        );
      })}
    </svg>
  );
}

export const STREAM_CSS = `
  .t2s svg { width: 100%; display: block; overflow: visible; }
  .t2s .lbl { font-family: var(--mono); font-size: 24px; fill: var(--muted); }
  .t2s .pos { font-family: var(--mono); font-size: 18px; fill: var(--faint); text-anchor: middle; }
  .t2s .stream { stroke: var(--raised-2); stroke-width: 5; stroke-linecap: round; }
  .t2s .colg, .t2s .chip { transition: opacity .35s; }
  .t2s .colg.dim { opacity: .35; }
  .t2s .chip.dim.on { opacity: .35; }
  .t2s .chip rect { stroke-width: 2; transition: stroke-width .3s; }
  .t2s .chip text { font-family: var(--mono); font-size: 24px; text-anchor: middle; }
  .t2s .chip.tok rect { fill: var(--raised); stroke: var(--line-2); } .t2s .chip.tok text { fill: var(--fg); }
  .t2s .chip.tok.dg text { fill: var(--hot); }
  .t2s .chip.pos rect { fill: var(--panel); stroke: var(--line); stroke-dasharray: 4 3; } .t2s .chip.pos text { fill: var(--muted); font-size: 20px; }
  .t2s .chip.l1 rect { fill: color-mix(in srgb, var(--accent) 20%, var(--bg)); stroke: var(--accent); } .t2s .chip.l1 text { fill: var(--accent); }
  .t2s .chip.l2 rect { fill: color-mix(in srgb, var(--purple) 20%, var(--bg)); stroke: var(--purple); } .t2s .chip.l2 text { fill: var(--purple); }
  .t2s .chip.mlp rect { fill: color-mix(in srgb, var(--good) 15%, var(--bg)); stroke: var(--good); } .t2s .chip.mlp text { fill: var(--good); font-size: 19px; }
  .t2s .chip.out rect { fill: color-mix(in srgb, var(--good) 15%, var(--bg)); stroke: var(--good); } .t2s .chip.out text { fill: var(--good); }
  .t2s .chip.bad rect { fill: color-mix(in srgb, var(--bad) 15%, var(--bg)); stroke: var(--bad); } .t2s .chip.bad text { fill: var(--bad); }
  .t2s .chip.hl rect { stroke-width: 4; }
  .t2s .arc { fill: none; stroke-width: 3; opacity: 0; transition: opacity .4s; }
  .t2s .arc.on { opacity: .9; }
  .t2s .arc.l1 { stroke: var(--accent); } .t2s .arc.l2 { stroke: var(--purple); } .t2s .arc.mlp { stroke: var(--good); }
  .t2s .arc.bad { stroke: var(--bad); stroke-dasharray: 7 6; }
  .t2s .fade { transition: opacity .35s; }
  .t2s .cap { font-size: .78em; min-height: 2.8em; }
  .t2s .cap b { color: var(--fg); }
  .t2s .cap code, .t2s code { font-family: var(--mono); }
  .t2s .l1c { color: var(--accent); font-weight: 600; } .t2s .l2c { color: var(--purple); font-weight: 600; }
`;

const tokChips = (on = true, hl: number[] = []): Chip[] =>
  range(N).map((i) => ({ col: i, row: 'tok', text: TEXT[i], on, hl: hl.includes(i) }));

// ── task 2 = task 1, twice ───────────────────────────────────────────────────
const TWICE_CAPS: ComponentChildren[] = [
  <>four key → value pairs, then a key: output that key's value. <b>a2f5c9d3 f → 5</b></>,
  <><span class="l1c">step 1, find by place:</span> every digit copies the letter just before it. the 5's stream now says <b>"5, after f"</b></>,
  <><span class="l2c">step 2, find by content:</span> the f at the end looks for the stream with <b>f</b> written in it, and copies its digit</>,
  <>each step is task 1's head. <b>step 2 can only find "after f" because step 1 wrote it</b></>,
];

/**
 *   0 the input: each stream says its token   1 step 1: every digit copies the letter one back (layer 1)
 *   2 step 2: the query finds the stream with its letter and copies the digit (layer 2)   3 the point: each step is task 1's head
 */
export function Twice() {
  const { root, step } = useIsland<null>('task2w');
  const rows = { tok: 390, l1: 260, l2: 110 };
  const chips: Chip[] = [
    ...tokChips(true, step === 2 ? [LAST] : []),
    ...VALS.map((v, j) => ({ col: v, row: 'l1' as const, text: TEXT[v - 1], on: step >= 1, delay: j * 120, hl: step === 2 && v === 3 })),
    { col: LAST, row: 'l2', text: '5', on: step >= 2, delay: 400 },
  ];
  const arcs: Arc[] = [
    ...VALS.map((v, j) => ({ from: v - 1, to: v, y0: rows.tok - CH / 2, y1: rows.l1 + CH / 2, kind: 'l1' as const, on: step >= 1, delay: j * 120 })),
    { from: 3, to: LAST, y0: rows.l1 - CH / 2, y1: rows.l2 + CH / 2, kind: 'l2', on: step >= 2 },
  ];
  return (
    <div class="t2s" ref={root}>
      <Streams rows={rows} chips={chips} arcs={arcs} H={460} labelsOn={{ l1: step >= 1, l2: step >= 2 }}
        dimCols={step === 2 ? range(N).filter((i) => i !== 3 && i !== LAST) : []} />
      <div class="cap">{TWICE_CAPS[Math.min(step, 3)]}</div>
      <style>{STREAM_CSS}</style>
    </div>
  );
}

// ── why one layer can't ──────────────────────────────────────────────────────
type T2 = { accuracy: { model: string; test_accuracy: number }[]; ablation: { model: string; test_accuracy: number }[] };
const ONE_CAPS: ComponentChildren[] = [
  <>one head at the f needs <b>the digit after f</b>. but before any head runs, the 5's stream only says <b>5</b>: no key says "after f"</>,
  <>so one head finds <b>a</b> digit, not <b>the</b> digit. better than a blind pick among the four (25%), far from 100%</>,
  <>a second head in the same layer reads the <b>same</b> streams: same problem</>,
  <>a second <b>layer</b> reads what the first one wrote</>,
];
/**
 *   0 the query's head can only match what's in each stream: nothing says "after f"   1 one layer, one head: 39%
 *   2 one layer, two heads: 38%   3 two layers: 100%
 */
export function OneLayer() {
  const { root, step, d } = useIsland<T2>('task2');
  const rows = { tok: 250, l2: 100 };
  const chips: Chip[] = [...tokChips(true, [LAST]), { col: LAST, row: 'l2', text: '?', on: true, bad: true }];
  const arcs: Arc[] = VALS.map((v) => ({ from: v, to: LAST, y0: rows.tok - CH / 2, y1: rows.l2 + CH / 2, kind: 'bad', on: true }));
  const acc = d ? d.accuracy.slice(0, 3) : [];
  const names = ['1 layer, 1 head', '1 layer, 2 heads', '2 layers, 1 head each'];
  return (
    <div class="t2s one" ref={root}>
      <Streams rows={rows} chips={chips} arcs={arcs} H={320} labelsOn={{ l2: false }} />
      <div class="cap">{ONE_CAPS[Math.min(step, 3)]}</div>
      <div class="acc">
        {d && <Bars width={560} max={100} hl={step >= 3 ? 2 : undefined}
          labels={names.map((n, i) => <span class={`fade ${step >= i + 1 ? 'on' : ''}`}>{n}</span>)}
          values={acc.map((a, i) => (step >= i + 1 ? a.test_accuracy : 0))}
          color={(_, i) => (i === 2 ? 'var(--good)' : 'var(--faint)')}
          fmtV={(v) => (v ? `${v.toFixed(0)}%` : '')} />}
        <div class="ax">test accuracy</div>
      </div>
      <style>{STREAM_CSS + `
        .t2s.one .acc { display: flex; align-items: center; gap: 1.2em; font-size: 1.1em; margin-top: .2em; }
        .t2s.one .ax { font-size: .55em; color: var(--muted); }
      `}</style>
    </div>
  );
}

// ── position embedding ───────────────────────────────────────────────────────
const POS_CAPS: ComponentChildren[] = [
  <>task 1 asks <b>what</b> a token is: the 7 is the answer wherever it sits. a head finds it by content, no position needed</>,
  <>task 2's answer <b>is</b> the order: same tokens, different answer. but a head only sees what's in each stream, so to it the earlier streams are a <b>bag</b>: shuffle them and the scores just shuffle along</>,
  <>a second learned table, one row per position (9 × 32): <code>x = tok + pos</code>. now a query can ask for "the one just before me"</>,
  <>trained without positions it never gets there</>,
];
/**
 *   0 task 1: same answer wherever the digit is   1 task 2: same tokens in a different order, different answer; a head sees a bag
 *   2 the position embedding: a second chip on every stream   3 the diagram gives way to test accuracy: no position and no mask,
 *     no position, with position
 */
const ACC = [
  ['2 layers, no position embedding, no mask', 'no position, no mask'],
  ['2 layers, no position embedding', 'no position'],
  ['2 layers, 1 head each', 'with position'],
] as const;
export function Position() {
  const { root, step, d } = useIsland<T2>('task2');
  const rows = { tok: 220, pos: 140 };
  const chips: Chip[] = [
    ...tokChips(true),
    ...range(N).map((i) => ({ col: i, row: 'pos' as const, text: `@${i}`, on: step >= 2, delay: i * 50 })),
  ];
  const acc = (m: string) => d?.accuracy.find((a) => a.model === m)?.test_accuracy ?? 0;
  const S = (t: string, hl: number[]) => <code>{[...t].map((c, i) => <span class={`${isD(c) ? 'dg' : ''} ${hl.includes(i) ? 'hl' : ''}`}>{c}</span>)}</code>;
  return (
    <div class="t2s t2p" ref={root}>
      <div class="cmp">
        <span class="tn">task 1</span>
        <span>{S('qwdk7mzpa', [4])} → <b>7</b></span><span>{S('q7wdkmzpa', [1])} → <b>7</b></span>
        <span class="nt">same answer, wherever the 7 is</span>
        <span class={`tn fade ${step >= 1 ? 'on' : ''}`}>task 2</span>
        <span class={`fade ${step >= 1 ? 'on' : ''}`}>{S('a2f5c9d3f', [1, 3])} → <b>5</b></span>
        <span class={`fade ${step >= 1 ? 'on' : ''}`}>{S('a5f2c9d3f', [1, 3])} → <b>2</b></span>
        <span class={`nt fade ${step >= 1 ? 'on' : ''}`}>same tokens, different answer</span>
      </div>
      {/* the bars take the diagram's place: there's no room for both */}
      <div class="mid">
        {step < 3
          ? <div class={`fade ${step >= 2 ? 'on' : ''}`}><Streams rows={rows} chips={chips} arcs={[]} H={270} labelsOn={{ pos: step >= 2 }} /></div>
          : d && <div class="acc">
            <Bars width={560} max={100} hl={2} labels={ACC.map(([, l]) => l)} values={ACC.map(([m]) => acc(m))}
              color={(_, i) => (i === 2 ? 'var(--good)' : 'var(--faint)')} fmtV={(v) => `${v.toFixed(0)}%`} />
            <div class="ax">test accuracy, 2 layers</div>
          </div>}
      </div>
      <div class="cap">{POS_CAPS[Math.min(step, 3)]}</div>
      <style>{STREAM_CSS + `
        .t2p .cmp { display: grid; grid-template-columns: auto auto auto 1fr; gap: .3em 1.6em; align-items: baseline; font-size: .8em; }
        .t2p .cmp code { font-size: 1.1em; letter-spacing: .06em; }
        .t2p .cmp code .dg { color: var(--hot); }
        .t2p .cmp code .hl { text-decoration: underline; text-underline-offset: 6px; }
        .t2p .cmp b { font-family: var(--mono); color: var(--hot); }
        .t2p .tn { font-size: .7em; color: var(--muted); }
        .t2p .nt { font-size: .7em; color: var(--muted); }
        .t2p .mid { min-height: 260px; display: flex; flex-direction: column; justify-content: center; }
        .t2p .acc { display: flex; align-items: center; gap: 1.2em; font-size: 1.1em; }
        .t2p .ax { font-size: .55em; color: var(--muted); }
      `}</style>
    </div>
  );
}

// ── layer 1, trained: look one back, by position ─────────────────────────────
type T2d = {
  attention_layer1: { query_position: string; key_position: string; attention: number }[];
  qk_layer1_split: { query_position: string; key_position: string; score_from_key_position: number; score_from_key_token: number }[];
  attention_layer2: { example: number; sequence: string; position: string; token: string; kind: string; attention: number }[];
  head_copies_test_average: { head: string; position: string; attention_on_top_position: number }[];
  ablation: { model: string; test_accuracy: number }[];
};
const POS = ['k1', 'v1', 'k2', 'v2', 'k3', 'v3', 'k4', 'v4', 'query'];
const grid = <R,>(rows: R[], get: (r: R) => [string, string, number]) => {
  const m: (number | null)[][] = POS.map(() => POS.map(() => null));
  for (const r of rows) { const [q, k, v] = get(r); m[POS.indexOf(q)][POS.indexOf(k)] = v; }
  return m;
};
const pct = (v: number) => `${Math.round(v * 100)}%`;
/** like pct, but keeps the digits that rounding to 0% / 100% would hide */
const pct2 = (v: number) => (v < 0.01 ? `${(v * 100).toFixed(2)}%` : v > 0.99 ? `${(v * 100).toFixed(1)}%` : pct(v));

/**
 * One head's attention on the example input, every probability written in, rows and columns labelled token over role,
 * in the style of task 1's (Head1.tsx HeadScores). tags: an extra line under a column (what layer 1 wrote into it).
 * keep: rows that stay lit when dim is on
 */
export function AttnMatrix({ chars, att, keep, dim, hlCells = [], tags, eq = 'softmax(q · k / √32 + mask)', greyCols = [], roles = POS, note }: {
  chars: string[]; att: (number | null)[][]; keep: number[]; dim: boolean; hlCells?: [number, number][]; tags?: (string | null)[]; eq?: string;
  greyCols?: number[];   // columns that are never a target: covered with a veil, labels faded
  roles?: string[];      // the line under each token (task 3 has two queries)
  note?: [row: number, text: string];   // a callout to the right of one row
}) {
  const n = chars.length;
  const M = { x: 150, y: tags ? 118 : 96, cw: 52, ch: 52 };
  const dg = (i: number) => (isD(chars[i]) ? 'dg' : '');
  return (
    <svg class="am" viewBox={`0 0 ${M.x + n * M.cw + 22} ${M.y + n * M.ch + 10}`} style={{ width: `${M.x + n * M.cw + 22}px` }}>
      <text class="eq" x={M.x} y={22}>{eq}</text>
      <text class="ax" x={M.x + n * M.cw} y={22} text-anchor="end">key (looked at) →</text>
      <text class="ax" transform={`translate(12, ${M.y}) rotate(90)`}>query (looking) →</text>
      {chars.map((c, i) => <>
        <g class={`clab ${greyCols.includes(i) ? 'grey' : ''}`}>
          <text class={`tk ${dg(i)}`} x={M.x + i * M.cw + M.cw / 2} y={M.y - (tags ? 54 : 32)}>{c}</text>
          <text class="rr" x={M.x + i * M.cw + M.cw / 2} y={M.y - (tags ? 34 : 12)}>{roles[i]}</text>
        </g>
        {tags?.[i] && <text class="tg" x={M.x + i * M.cw + M.cw / 2} y={M.y - 10}>{tags[i]}</text>}
        <g class={`rlab ${dim && !keep.includes(i) ? 'dim' : ''}`}>
          <text class={`tk ${dg(i)}`} x={M.x - 66} y={M.y + i * M.ch + M.ch / 2 + 8} text-anchor="end">{c}</text>
          <text class="rr" x={M.x - 12} y={M.y + i * M.ch + M.ch / 2 + 6} text-anchor="end">{roles[i]}</text>
        </g>
      </>)}
      <Mat data={att} {...M} gap={2} class="att" color={(v) => sequential(v)}
        text={(v) => (v === null ? null : pct(v))} inv={(v) => v > 0.55}
        hlRows={dim ? keep : []} hlCells={dim ? [] : hlCells} dim={dim} />
      {greyCols.map((c) => <rect class="veil" x={M.x + c * M.cw - 1} y={M.y - 1} width={M.cw + 1} height={n * M.ch + 1} />)}
      {/* the veils cover the outlines' edges: draw them again on top (same geometry as Mat's) */}
      {greyCols.length > 0 && (dim
        ? keep.map((r) => <rect class="hlbox top" x={M.x - 1.5} y={M.y + r * M.ch - 1.5} width={n * M.cw + 1} height={M.ch + 1} rx="3" />)
        : hlCells.map(([r, c]) => <rect class="hlbox top" x={M.x + c * M.cw - 1.5} y={M.y + r * M.ch - 1.5} width={M.cw + 1} height={M.ch + 1} rx="3" />))}
      {note && <text class="note" x={M.x + n * M.cw + 16} y={M.y + note[0] * M.ch + M.ch / 2 + 8}>← {note[1]}</text>}
    </svg>
  );
}
export const AM_CSS = `
  .am { width: 640px; flex: none; overflow: visible; }
  .am .eq { font-family: var(--mono); font-size: 19px; fill: var(--fg); }
  .am .ax { font-size: 15px; fill: var(--accent); }
  .am .note { font-size: 24px; font-weight: 700; fill: var(--hot); }
  .am .tk { font-family: var(--mono); font-size: 24px; font-weight: 600; fill: var(--fg); text-anchor: middle; }
  .am .rlab .tk { text-anchor: end; }
  .am .tk.dg { fill: var(--hot); }
  .am .rr { font-family: var(--mono); font-size: 15px; fill: var(--muted); text-anchor: middle; }
  .am .tg { font-family: var(--mono); font-size: 16px; font-weight: 600; fill: var(--accent); text-anchor: middle; }
  .am .rlab .rr { text-anchor: end; }
  .am .rlab { transition: opacity .35s; } .am .rlab.dim { opacity: .3; }
  .am .mx .ct { font-size: 15px; }
  .am .mx .hlbox { stroke: var(--hot); stroke-width: 4; }
  .am .veil { fill: var(--bg); opacity: .72; pointer-events: none; }
  .am .hlbox.top { fill: none; stroke: var(--hot); stroke-width: 4; }
  .am .clab { transition: opacity .35s; } .am .clab.grey { opacity: .3; }
`;

/**
 * Layer 1, head 1 on a2f5c9d3f (task2w.json's example run), every row and column labelled token over role.
 *   0 the whole attention matrix, softmax(q · k / √32 + mask), the digit rows lit: each looks one back at its letter
 *   1 the digit rows' scores split into the part from the key's position and the part from its token (test averages), numbers in
 *     every cell: the stream layer 1 reads is just token + position, so the split is exact. position finds one back
 */
export function Layer1() {
  const { root, step, d } = useIsland<T2d>('task2');
  const w = useData<T2w>('task2w');
  if (!d || !w) return <div ref={root} />;
  const ex = w.example, chars = [...ex.text];
  const att = ex.attn1;
  const fromPos = grid(d.qk_layer1_split, (r) => [r.query_position, r.key_position, r.score_from_key_position]);
  const fromTok = grid(d.qk_layer1_split, (r) => [r.query_position, r.key_position, r.score_from_key_token]);
  const lim = Math.max(...[...fromPos, ...fromTok].flat().map((v) => Math.abs(v ?? 0)));
  const oneBack = VALS.map((v) => [v, v - 1] as [number, number]);
  const dg = (i: number) => (isD(chars[i]) ? 'dg' : '');

  const matrix = <AttnMatrix chars={chars} att={att} keep={VALS} dim hlCells={oneBack} />;

  // step 2: the digit rows only, split by where the key's stream got each part. stacked, so the same rows line up
  const T = { x: 110, cw: 60, ch: 46 };
  const yPos = 92, yTok = yPos + 4 * T.ch + 110;
  const digitRows = (m: (number | null)[][]) => VALS.map((v) => m[v]);
  const hlBack = VALS.map((v, j) => [j, v - 1] as [number, number]);
  const table = (m: (number | null)[][], y: number, title: ComponentChildren) => (
    <g>
      <text class="tt" x={T.x} y={y - 46}>{title}</text>
      {POS.map((p, i) => <text class="rr" x={T.x + i * T.cw + T.cw / 2} y={y - 12}>{p}</text>)}
      {VALS.map((v, j) => <text class="rr" x={T.x - 18} y={y + j * T.ch + T.ch / 2 + 6} text-anchor="end">{POS[v]}</text>)}
      <Mat data={digitRows(m)} x={T.x} y={y} cw={T.cw} ch={T.ch} gap={2} color={(v) => diverging(v, lim / 2)}
        text={(v) => (v === null ? null : v.toFixed(1))} hlCells={hlBack} />
    </g>
  );
  const split = (
    <svg class="am sp" viewBox="0 0 660 580">
      <text class="ax" x={T.x + 9 * T.cw} y={yPos - 46} text-anchor="end">key (looked at) →</text>
      {table(fromPos, yPos, <>scores from the key's <tspan class="b">position</tspan> (test avg)</>)}
      {table(fromTok, yTok, <>scores from the key's <tspan class="b">token</tspan> (test avg)</>)}
    </svg>
  );

  return (
    <div class="t2l1" ref={root}>
      <div class="in">
        {chars.map((c, i) => <span class="ic"><b class={dg(i)}>{c}</b><i>{POS[i]}</i></span>)}
        <span class="ar">→ {ex.tokens[ex.probs.indexOf(Math.max(...ex.probs))]}</span>
      </div>
      {step < 1 ? (
        <div class="row">
          {matrix}
          <div class="side">
            <div>every digit looks <b>one back</b>, at its letter: {VALS.map((v, j) => <>{j ? ', ' : ''}<b class="dg">{chars[v]}</b> → <b>{chars[v - 1]}</b> {pct(att[v][v - 1] as number)}</>)}</div>
            <div>and copies it into its own stream: the 5 now says "<b>5, after f</b>"</div>
          </div>
        </div>
      ) : (
        <div class="row">
          {split}
          <div class="side">
            <div>layer 1 reads <code>tok + pos</code>, so each score splits in two</div>
            <div><b>position</b> picks the key just before</div>
            <div><b>token</b> barely matters</div>
          </div>
        </div>
      )}
      <style>{AM_CSS + `
        .t2l1 { display: flex; flex-direction: column; gap: .5em; }
        .t2l1 .row { display: flex; gap: 2em; align-items: center; }
        .t2l1 .sp .mx .ct { font-size: 17px; }
        .t2l1 .sp .rr { font-size: 17px; }
        .t2l1 .am .tt { font-size: 19px; fill: var(--muted); }
        .t2l1 .am .tt .b { fill: var(--fg); font-weight: 600; }
        .t2l1 .side code { font-family: var(--mono); color: var(--fg); }
        .t2l1 .side { display: flex; flex-direction: column; gap: .8em; font-size: .64em; color: var(--muted); max-width: 22em; }
        .t2l1 .side b { color: var(--fg); } .t2l1 .side b.dg { color: var(--hot); }
        .t2l1 .panels { display: flex; gap: 1.6em; align-items: center; }
        .t2l1 .pt { font-size: .6em; color: var(--muted); margin: 0 0 .5em 3em; }
        .t2l1 .pt b { color: var(--fg); }
        .t2l1 .hw { display: flex; gap: .2em; }
        .t2l1 .qy { writing-mode: vertical-rl; font-size: .5em; color: var(--accent); align-self: flex-end; margin-bottom: 4em; }
        .t2l1 .ky { font-size: .5em; color: var(--accent); margin: 0 0 1.4em 3.4em; }
        .t2l1 .heat .cl span { transform: none; left: 0; }
        .t2l1 .heat .cl i, .t2l1 .heat .rl i, .t2l1 .ic i { font-style: normal; color: var(--muted); }
        .t2l1 .heat .hc.on { outline: 3px solid var(--hot); outline-offset: -1px; z-index: 1; }
        .t2l1 .in { display: flex; gap: .5em; align-items: flex-end; font-size: .7em; }
        .t2l1 .ic { display: flex; flex-direction: column; align-items: center; min-width: 1.6em; }
        .t2l1 .ic b { font-family: var(--mono); font-size: 1.2em; color: var(--fg); } .t2l1 .ic b.dg { color: var(--hot); }
        .t2l1 .ic i { font-size: .5em; }
        .t2l1 .ar { font-family: var(--mono); color: var(--hot); margin: 0 0 .55em .4em; }
      `}</style>
    </div>
  );
}

// ── layer 2, head 1: QK on the streams layer 1 wrote into ───────────────────
type T2w = {
  letters: string[]; write: number[][]; wins: Record<string, number>; l2_from_query: Record<'keys' | 'values' | 'target' | 'query', number>;
  example: {
    text: string; attn1: (number | null)[][]; attn2: (number | null)[][]; attn2_nomask: number[][]; probs: number[]; tokens: string[];
    v2_logits: number[][]; write2_logits: number[]; rest_logits: number[];
  };
};
/**
 * Layer 2, head 1's attention on a2f5c9d3f, the same view as Layer1's, each digit's column tagged with the letter layer 1
 * wrote into its stream.
 *   0 the whole 9 × 9 matrix, every row but the query's dimmed from the start: only the last position was ever trained. the
 *     letter columns are greyed throughout: layer 2 only ever picks a digit. the 5, tagged f, gets 98%
 *   1 not just this input: over every sequence the right digit gets 97%, and every letter's own query wins (26 / 26). K-composition, named on the subtitle
 */
export function Write() {
  const { root, d } = useIsland<T2w>('task2w');
  if (!d) return <div ref={root} />;
  const ex = d.example, chars = [...ex.text], att = ex.attn2, L = LAST;
  const tags = chars.map((_, i) => (VALS.includes(i) ? `+${chars[i - 1]}` : null));
  const q = att[L] as number[], best = q.indexOf(Math.max(...q));
  const m = d.write, wins = m.filter((row, i) => row.indexOf(Math.max(...row)) === i).length;
  const letterCols = range(N).filter((i) => !VALS.includes(i));   // layer 2 only ever picks a digit
  return (
    <div class="t2w" ref={root}>
      <AttnMatrix chars={chars} att={att} keep={[L]} dim hlCells={[[L, best]]} tags={tags} greyCols={letterCols} />
      <div class="side">
        <div>each digit's key now carries layer 1's tag: <span class="tg">+f</span> under the 5</div>
        <div>the f's query finds the <span class="tg">+f</span>: the <b class="dg">{chars[best]}</b>, <b>{pct(q[best])}</b></div>
        <div>over the test set: <b>{pct(d.l2_from_query.target)}</b> on the right digit, all <b>{wins} / 26</b> letters</div>
      </div>
      <style>{AM_CSS + `
        .t2w { display: flex; gap: 2em; align-items: center; }
        .t2w .side { display: flex; flex-direction: column; gap: .8em; font-size: .64em; max-width: 22em; color: var(--muted); }
        .t2w .side b { color: var(--fg); } .t2w .side b.dg { color: var(--hot); }
        .t2w .side .tg { font-family: var(--mono); color: var(--accent); font-weight: 600; }
      `}</style>
    </div>
  );
}

// ── layer 2, head 1: what its value writes ───────────────────────────────────
/**
 * A last-layer head's value, read by the unembedding, in the style of task 1's HeadValue. Shared by task 2 and task 3.
 *   0 each position's value, read by the unembedding: 36 scores, and what it says
 *   1 scaled by the query's attention: only the picked values survive
 *   2 that's the head's write; plus the rest of the query's stream → what the stream says (sum)
 * sum: the last line's label, after the bars ("= output 5, 100%"). task 3's mlp slide reuses it with neurons for rows
 */
export function ValueRead({ step, toks, chars, roles, values, A, write, rest, sum, caps, head, fmtA = pct, picked = A.map((a) => a >= 0.3),
  labels = ['the head\'s write', '+ rest of stream'], lit0 = chars.map((c) => /^\d$/.test(c)) }: {
  step: number; toks: string[]; chars: string[]; roles: string[]; values: number[][]; A: number[]; write: number[]; rest: number[];
  sum: ComponentChildren; caps: ComponentChildren[];
  head: [row: string, a: string, bars: string];   // the column heads
  fmtA?: (a: number) => string;                     // A's label (A itself, 0..1, shades the cell and scales the bars)
  picked?: boolean[];                               // rows that stay lit once scaled
  labels?: [write: string, rest: string];
  lit0?: boolean[];                                 // rows lit before scaling (default: the digits)
}) {
  const n = chars.length;
  const dg = (c: string) => /^\d$/.test(c);   // a digit token (rows can be neurons, n51)
  const argmax = (xs: number[]) => xs.indexOf(Math.max(...xs));
  const top = Math.max(...values.flat(), ...write);
  // roomier rows until step 2, which needs the space for the write and output rows
  const tall = step < 2, RH = (tall ? 58 : 44) * 9 / Math.max(9, n);
  const TX = 30, AX = 150, BX = 260, BAND = 29, SX = BX + 36 * BAND + 30, Y0 = 96, PX = (tall ? 40 : 30) / top;
  const bars = (vals: number[], y: number, scale = 1, peak = false) => {
    const b = argmax(vals);
    return (
      <g>
        <line class="zero" x1={BX} x2={BX + 36 * BAND} y1={y} y2={y} />
        {vals.map((v, i) => (
          <rect class="vb" x={BX + i * BAND + 4} width={BAND - 8} y={v >= 0 ? y - v * PX : y} height={Math.max(1, Math.abs(v) * PX)} rx="2"
            style={{ fill: isD(toks[i]) ? 'var(--hot)' : 'var(--faint)', transform: `scaleY(${scale})`, transformOrigin: v >= 0 ? 'bottom' : 'top' }} />
        ))}
        {peak && <text class="pv" x={BX + b * BAND + BAND / 2} y={y - vals[b] * PX * scale - 6}>{(vals[b] * scale).toFixed(1)}</text>}
      </g>
    );
  };
  const WY = Y0 + (n - 1) * RH + 62;
  return (
    <div class="t2v">
      <svg viewBox={`0 0 1480 ${step >= 2 ? WY + 112 : WY - 20}`}>
        <text class="hd" x={TX} y={24}>{head[0]}</text>
        <g class={`fd ${step >= 1 ? 'on' : ''}`}><text class="hd" x={AX + 30} y={24} text-anchor="middle">{head[1]}</text></g>
        <text class="hd" x={BX} y={24}>{head[2]}</text>
        <text class="hd" x={SX} y={24}>says</text>
        {toks.map((t, i) => <text class={`tl ${isD(t) ? 'dg' : ''}`} x={BX + i * BAND + BAND / 2} y={56}>{t}</text>)}
        {chars.map((c, i) => {
          const y = Y0 + i * RH, says = toks[argmax(values[i])], att = step >= 1 ? A[i] : 1;
          return (
            <g class="vrow" style={{ opacity: step >= 1 ? (picked[i] ? 1 : 0.4) : lit0[i] ? 1 : 0.3 }}>
              <text class={`rt ${dg(c) ? 'dg' : ''}`} x={TX} y={y + 2}>{c}</text>
              <text class="rr" x={TX + 26} y={y + 2}>{roles[i]}</text>
              <g class={`fd ${step >= 1 ? 'on' : ''}`}>
                <rect x={AX} y={y - 24} width={60} height={30} rx="5" style={{ fill: sequential(A[i]) }} />
                <text class={`ap ${A[i] > 0.55 ? 'inv' : ''}`} x={AX + 30} y={y - 3}>{fmtA(A[i])}</text>
              </g>
              {bars(values[i], y, att, (step >= 1 && picked[i]) || (step === 0 && dg(c)))}
              <text class={`sy ${dg(c) ? 'dg' : ''}`} x={SX + 20} y={y + 2}>{says}</text>
            </g>
          );
        })}
        <g class={`fd ${step >= 2 ? 'on' : ''}`}>
          <line class="sep" x1={TX} x2={SX + 60} y1={WY - 46} y2={WY - 46} />
          <text class="note" x={TX} y={WY}>{labels[0]}</text>
          {bars(write, WY, 1, true)}
          <text class="sy dg" x={SX + 20} y={WY + 2}>{toks[argmax(write)]}</text>
          <text class="note" x={TX} y={WY + 52}>{labels[1]}</text>
          {bars(rest, WY + 52, 1)}
          <text class="note" x={BX} y={WY + 96}>{sum}</text>
        </g>
      </svg>
      <div class="cap">{caps[Math.min(step, caps.length - 1)]}</div>
      <style>{`
        .t2v { display: flex; flex-direction: column; gap: .3em; width: 100%; }
        .t2v svg { width: 100%; display: block; overflow: visible; }
        .t2v .hd { font-size: 17px; fill: var(--muted); }
        .t2v .tl { font-family: var(--mono); font-size: 15px; fill: var(--muted); text-anchor: middle; } .t2v .tl.dg { fill: var(--hot); }
        .t2v .rt { font-family: var(--mono); font-size: 24px; fill: var(--fg); font-weight: 600; } .t2v .rt.dg { fill: var(--hot); }
        .t2v .rr { font-family: var(--mono); font-size: 15px; fill: var(--muted); }
        .t2v .sy { font-family: var(--mono); font-size: 24px; fill: var(--muted); font-weight: 700; } .t2v .sy.dg { fill: var(--hot); }
        .t2v .ap { font-family: var(--mono); font-size: 14px; fill: var(--fg); text-anchor: middle; } .t2v .ap.inv { fill: var(--bg); }
        .t2v .pv { font-family: var(--mono); font-size: 13px; fill: var(--fg); text-anchor: middle; }
        .t2v .note { font-size: 20px; fill: var(--muted); } .t2v .note .dg { fill: var(--hot); font-weight: 700; } .t2v .note .b { fill: var(--fg); font-weight: 700; }
        .t2v .zero { stroke: var(--raised-2); } .t2v .sep { stroke: var(--border); }
        .t2v .vrow { transition: opacity .5s; }
        .t2v .vb { transform-box: fill-box; transition: transform .8s cubic-bezier(.5, 0, .2, 1); }
        .t2v .fd { opacity: 0; transition: opacity .35s; } .t2v .fd.on { opacity: 1; }
        .t2v .cap { font-size: .72em; min-height: 2.6em; }
        .t2v .cap b { color: var(--fg); } .t2v .cap b.dg { color: var(--hot); }
      `}</style>
    </div>
  );
}

/**
 * Layer 2 is the last layer, so its value has a reader with labels: the unembedding. On a2f5c9d3f; steps as ValueRead's.
 * Step 2 adds: every digit's value says itself over the test set (task2.json ov_layer2), the old 10 × 10 slide in one number
 */
export function Value2() {
  const { root, step, d } = useIsland<T2w>('task2w');
  const t2 = useData<{ ov_layer2: Record<string, number>[] }>('task2');
  if (!d || !t2) return <div ref={root} />;
  const ex = d.example, toks = ex.tokens;
  const out = ex.probs.indexOf(Math.max(...ex.probs));
  return (
    <div ref={root}>
      <ValueRead step={step} toks={toks} chars={[...ex.text]} roles={POS} values={ex.v2_logits} A={ex.attn2[LAST] as number[]}
        write={ex.write2_logits} rest={ex.rest_logits}
        head={['position', 'f\'s attention', 'its value, read by the unembedding: one score per token']}
        sum={<>= output <tspan class="dg">{toks[out]}</tspan>, <tspan class="b">{pct2(ex.probs[out])}</tspan></>}
        caps={[
          <>each <b>digit's</b> value says that digit</>,
          <>times the f's attention: only the <b class="dg">5</b> is left</>,
          <>the write says <b class="dg">5</b></>,
        ]} />
    </div>
  );
}

// ── knock out one piece ──────────────────────────────────────────────────────
/** test accuracy with one piece of the trained model removed */
export function Ablate() {
  const { root, d } = useIsland<T2d>('task2');
  if (!d) return <div ref={root} />;
  const names: Record<string, string> = {
    'full model': 'the trained model', 'layer 1 head removed': 'without layer 1 (nothing writes "after f")',
    'layer 2 head removed': 'without layer 2 (nothing goes looking)', 'position embedding removed': 'without the position embedding',
  };
  return (
    <div class="t2b" ref={root}>
      <Bars width={620} max={100} values={d.ablation.map((a) => a.test_accuracy)} labels={d.ablation.map((a) => names[a.model] ?? a.model)}
        color={(_, i) => (i === 0 ? 'var(--good)' : 'var(--bad)')} fmtV={(v) => `${v.toFixed(0)}%`} />
      <div class="cap">the same trained weights, one piece zeroed. every piece does one step of the lookup</div>
      <style>{`
        .t2b { display: flex; flex-direction: column; gap: 1.2em; font-size: 1.25em; }
        .t2b .cap { font-size: .6em; color: var(--muted); max-width: 40em; }
      `}</style>
    </div>
  );
}
