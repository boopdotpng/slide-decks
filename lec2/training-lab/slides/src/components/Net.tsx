/** @jsxImportSource preact */
import { range, diverging, useData } from './viz';
import { EMB, VOCAB } from './tinyEmbed';
import './roles';

/**
 * The network trained in a section, top to bottom: the input string, tokenized (one character = one token),
 * embedded (each token's real 32-number row, drawn as a column), then one band per layer, then the
 * unembedding reads the last position and the highest-scoring token is the output.
 * Embedding columns are the 2-layer lookup model's (tinyEmbed.ts), or a task's model with weights="task0" etc.
 * pos: each position's row of the position table drawn beside its token's row (the weights file needs "position")
 *   <Net text="qwdk7mzpa" layers={[]} weights="task0" />                  no layers
 *   <Net text="a2f5c9d3f" layers={[{ heads: 1 }, { heads: 1 }]} weights="task2w" pos />
 */
type Layer = { heads: number; mlp?: boolean };
const COL = 100, X0 = 330, CELL = 5;

type Row = Record<string, number | string>;
const rowsToTable = (rows: Row[]) => rows.map((r) => range(32).map((k) => r[`d${k}`] as number));

export default function Net({ text, layers, weights, pos = false }: { text: string; layers: Layer[]; weights?: string; pos?: boolean }) {
  const d = useData<{ embedding: Row[]; position?: Row[] }>(weights ?? 'task0');
  const emb = weights ? (d ? rowsToTable(d.embedding) : null) : EMB;
  const posEmb = pos && d?.position ? rowsToTable(d.position) : null;
  const N = text.length, LAST = N - 1;
  const x = (i: number) => X0 + i * COL;
  const ids = [...text].map((c) => VOCAB.indexOf(c));
  const Y = { input: 50, tok: 150, emb: 250 };
  const embEnd = Y.emb + 32 * CELL;
  let y = embEnd + 30;
  const rows = layers.map((l) => {
    const attn = y + 40;
    const mlp = l.mlp ? attn + 80 : null;
    y = (mlp ?? attn) + 60;
    return { l, attn, mlp };
  });
  const unemb = y + 50, out = unemb + 90;
  const H = out + 30, W = x(LAST) + 120;
  const midX = (x(0) + x(LAST)) / 2;

  return (
    <div class="net">
      <svg viewBox={`0 0 ${W} ${H}`}>
        <text class="lbl" x="0" y={Y.input + 10}>input</text>
        <text class="lbl" x="0" y={Y.tok + 4}>tokenize</text>
        <text class="sub" x="0" y={Y.tok + 34}>1 character = 1 token</text>
        <text class="lbl" x="0" y={Y.emb + 16 * CELL + 8}>{pos ? 'embed + position' : 'embed'}</text>
        <text class="sub" x="0" y={Y.emb + 16 * CELL + 38}>{pos ? 'token row + position row, added' : '32 numbers per token'}</text>
        {rows.map(({ l, attn, mlp }, i) => (
          <>
            <text class="lbl" x="0" y={attn + 8}>layer {i + 1} · {l.heads === 1 ? '1 head' : `${l.heads} heads`}</text>
            {mlp !== null && <text class="lbl" x="0" y={mlp + 8}>layer {i + 1} · mlp</text>}
          </>
        ))}
        <text class="lbl" x="0" y={unemb + 8}>unembed</text>
        <text class="sub" x="0" y={unemb + 38}>1 score per vocab token (36)</text>
        <text class="lbl" x="0" y={out + 8}>pick</text>
        <text class="sub" x="0" y={out + 38}>the output: 1 token = 1 character</text>

        <text class="str" x={midX} y={Y.input + 14}>"{text}"</text>

        {range(N).map((i) => (
          <g>
            <path class="arr" d={`M ${x(i)} ${Y.input + 34} V ${Y.tok - 40}`} />
            <rect class="tbox" x={x(i) - 30} y={Y.tok - 32} width="60" height="54" rx="8" />
            <text class={`tok ${/\d/.test(text[i]) ? 'dg' : ''}`} x={x(i)} y={Y.tok + 8}>{text[i]}</text>
            <text class="id" x={x(i)} y={Y.tok + 46}>{ids[i]}</text>
            <path class="arr" d={`M ${x(i)} ${Y.tok + 58} V ${Y.emb - 8}`} />
            {emb?.[ids[i]].map((v, k) => (
              <rect x={x(i) - (pos ? 36 : 14)} y={Y.emb + k * CELL} width={pos ? 24 : 28} height={CELL - 0.5} fill={diverging(v, 0.5)} />
            ))}
            {pos && <text class="plus" x={x(i)} y={Y.emb + 16 * CELL + 7}>+</text>}
            {posEmb?.[i].map((v, k) => (
              <rect x={x(i) + 12} y={Y.emb + k * CELL} width="24" height={CELL - 0.5} fill={diverging(v, 0.5)} />
            ))}
            <line class={`stream ${i === LAST ? 'last' : ''}`} x1={x(i)} x2={x(i)} y1={embEnd + 6}
              y2={i === LAST ? unemb - 22 : rows.length ? (rows[rows.length - 1].mlp ?? rows[rows.length - 1].attn) + 30 : embEnd + 6} />
          </g>
        ))}

        {rows.map(({ l, attn, mlp }) => (
          <>
            {range(l.heads).map((h) => (
              <rect class="band" x={x(0) - 45} y={attn - 22 + h * 10 - (l.heads - 1) * 5} width={x(LAST) - x(0) + 90} height="44" rx="10" />
            ))}
            {mlp !== null && range(N).map((i) => <rect class="mlpbox" x={x(i) - 32} y={mlp - 20} width="64" height="40" rx="8" />)}
          </>
        ))}

        <rect class="unemb" x={x(LAST) - 80} y={unemb - 22} width="160" height="44" rx="10" />
        <text class="ulbl" x={x(LAST)} y={unemb + 7}>36 scores</text>
        <path class="arr" d={`M ${x(LAST)} ${unemb + 28} V ${out - 30}`} />
        <text class="out" x={x(LAST)} y={out + 10}>highest-scoring token</text>
      </svg>
      <style>{`
        .net svg { width: 100%; display: block; overflow: visible; max-height: 72cqh; }
        .net .lbl { font-family: var(--mono); font-size: 24px; fill: var(--muted); }
        .net .sub { font-size: 20px; fill: var(--muted); opacity: .7; }
        .net .str { font-family: var(--mono); font-size: 40px; fill: var(--fg); text-anchor: middle; }
        .net .tbox { fill: var(--panel); stroke: var(--border); stroke-width: 1.5; }
        .net .tok { font-family: var(--mono); font-size: 34px; fill: var(--fg); text-anchor: middle; }
        .net .tok.dg { fill: var(--digit); }
        .net .plus { font-family: var(--mono); font-size: 22px; fill: var(--muted); text-anchor: middle; }
        .net .id { font-family: var(--mono); font-size: 17px; fill: var(--muted); text-anchor: middle; }
        .net .arr { stroke: var(--faint); stroke-width: 2; fill: none; }
        .net .stream { stroke: var(--line); stroke-width: 8; stroke-linecap: round; }
        .net .stream.last { stroke: var(--steel-line); }
        .net .band { fill: color-mix(in srgb, var(--attn) 08%, transparent); stroke: var(--attn); stroke-width: 2; }
        .net .mlpbox { fill: color-mix(in srgb, var(--mlp) 10%, transparent); stroke: var(--mlp); stroke-width: 2; }
        .net .unemb { fill: color-mix(in srgb, var(--answer) 10%, transparent); stroke: var(--answer); stroke-width: 2; }
        .net .ulbl { font-family: var(--mono); font-size: 22px; fill: var(--answer); text-anchor: middle; }
        .net .out { font-family: var(--mono); font-size: 24px; fill: var(--fg); text-anchor: middle; }
      `}</style>
    </div>
  );
}
