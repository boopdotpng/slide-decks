/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useSlideStep } from 'slides/hooks';
import { useData, diverging, range, Tex } from 'slides/viz';
import { VOCAB } from './tinyEmbed';
import './roles';

/**
 * Slide 2: the five models of "one head at a time", one at a time, drawn the way that lecture's Net.tsx drew them:
 * the input, one token box per character with its id, each token's real embedding row as a column (plus its position
 * row from task 2 on), the residual streams running down, a band per attention layer, an mlp box per position, and the
 * unembedding reading only the last stream. Attention arcs are recorded attention weights from that lecture's data
 * (public/data: task1 / head1, task2w, task3w, task4 .json); the side panel separates the task's target (green) from
 * what the trained model actually did (recorded).
 *   per task t (0..4), three steps: 3t   the input and its target (the previous model still drawn)
 *                                   3t+1 the architecture, the new piece outlined
 *                                   3t+2 which positions talk (recorded attention), what that makes possible, the result
 *   15  all five side by side
 */
type Arc = { from: number; to: number; w: number; band: 'l1' | 'l2'; head?: 0 | 1; pct?: boolean };
type Task = {
  name: string; text: string; target: string; why: ComponentChildren;
  layers: number; heads: number; pos: boolean; mlp: boolean;
  isNew: ('emb' | 'unemb' | 'l1' | 'l2' | 'pos' | 'mlp' | 'heads')[];
  newText: ComponentChildren; possible: ComponentChildren;
};
const TASKS: Task[] = [
  { name: 'hidden digit', text: 'qwdk7mzpa', target: '7', why: <>output the one digit</>, layers: 0, heads: 0, pos: false, mlp: false,
    isNew: ['emb', 'unemb'], newText: <>embedding → unembedding, nothing between</>,
    possible: <>a table lookup on the <b>last token alone</b>: it can learn "the answer is some digit", never which one</> },
  { name: 'hidden digit', text: 'qwdk7mzpa', target: '7', why: <>same task, new network</>, layers: 1, heads: 1, pos: false, mlp: false,
    isNew: ['l1'], newText: <>one attention layer, one head</>,
    possible: <>the last position <b>reads earlier streams</b>: it can find the digit wherever it is</> },
  { name: 'dictionary lookup', text: 'a2f5c9d3f', target: '5', why: <>the digit paired with the last letter: <b>f</b> → <b>5</b></>, layers: 2, heads: 1, pos: true, mlp: false,
    isNew: ['pos', 'l2'], newText: <>position embeddings and a second attention layer</>,
    possible: <>layer 1 tags each digit with the letter <b>one back</b>; layer 2 looks up the digit by that tag</> },
  { name: 'two-lookup sum', text: 'a2f5c9d3fc', target: '4', why: <>f → 5, c → 9, <Tex tex="(5+9) \bmod 10" /></>, layers: 2, heads: 1, pos: true, mlp: true,
    isNew: ['mlp'], newText: <>an mlp after layer 2</>,
    possible: <>attention <b>fetches</b> both digits; the mlp <b>computes</b> on them: their sum mod 10</> },
  { name: 'two-lookup difference', text: 'a2f5c9d3fc', target: '6', why: <>f → 5, c → 9, <Tex tex="(5-9) \bmod 10" /></>, layers: 2, heads: 2, pos: true, mlp: true,
    isNew: ['heads'], newText: <>two heads in every layer</>,
    possible: <>each lookup gets <b>its own head</b>, so the mlp can tell which digit comes first: order matters for subtraction</> },
];
const LAST_STEP = 15;

/** recorded attention arcs (and the recorded result line) for each task, from the earlier lecture's data files */
function arcsFor(t: number, d: Record<string, any>): { arcs: Arc[]; result: ComponentChildren; ok: boolean } | null {
  const pct = (v: number) => `${(v * 100).toFixed(v > .999 ? 2 : 1)}%`;
  if (t === 0) {
    const t0 = d.task0; if (!t0) return null;
    const row = t0.table.find((r: any) => r.last_letter === 'a');
    return { arcs: [], ok: false, result: <>after training, for last token <b>a</b>: every digit ≈ 10% (P(7) = {pct(row.p_digit_7)}). loss stalls at <b>{t0.loss.at(-1).loss.toFixed(2)}</b> ≈ <span class="nw">ln 10</span>: an even guess over digits</> };
  }
  if (t === 1) {
    const h = d.head1; if (!h) return null;
    const a: number[] = h.trained.attn.at(-1);
    const p7 = h.trained.probs[h.tokens.indexOf('7')];
    return { ok: true, arcs: a.map((w, j) => ({ from: j, to: 8, w, band: 'l1' as const, pct: w > .5 })).filter((x) => x.w > .02),
      result: <>the last position puts <b>{pct(a[4])}</b> of its attention on the 7. P(7) = <b>{pct(p7)}</b></> };
  }
  if (t === 2) {
    const e = d.task2w?.example; if (!e) return null;
    const l1: Arc[] = [1, 3, 5, 7].flatMap((i) => e.attn1[i].map((w: number | null, j: number) => ({ from: j, to: i, w: w ?? 0, band: 'l1' as const })).filter((x: Arc) => x.w > .3));
    const l2 = e.attn2.at(-1) as number[];
    const p5 = e.probs[e.tokens.indexOf('5')];
    return { ok: true, arcs: [...l1, ...l2.map((w, j) => ({ from: j, to: 8, w: w ?? 0, band: 'l2' as const, pct: (w ?? 0) > .5 })).filter((x) => x.w > .02)],
      result: <>layer 1: each digit looks one back at its letter. layer 2: <b>{pct(l2[3])}</b> on the 5. P(5) = <b>{pct(p5)}</b>; test accuracy 100%</> };
  }
  if (t === 3) {
    const e = d.task3w?.example; if (!e) return null;
    const l1: Arc[] = [1, 3, 5, 7, 9].flatMap((i) => e.attn1[i].map((w: number | null, j: number) => ({ from: j, to: i, w: w ?? 0, band: 'l1' as const })).filter((x: Arc) => x.w > .3));
    const l2 = e.attn2.at(-1) as number[];
    return { ok: true, arcs: [...l1, ...l2.map((w, j) => ({ from: j, to: 9, w: w ?? 0, band: 'l2' as const, pct: (w ?? 0) > .3 })).filter((x) => x.w > .02)],
      result: <>layer 2 splits <b>{pct(l2[3])}</b> / <b>{pct(l2[5])}</b> over the 5 and the 9. test accuracy <b>{(d.task3w.acc.full * 100).toFixed(1)}%</b> (27.1% without the mlp)</> };
  }
  const e = d.task4?.example; if (!e) return null;
  const acc = (m: string) => d.task4.accuracy.find(([k]: [string]) => k === m)[1];
  const l1: Arc[] = [1, 3, 5, 7, 9].flatMap((i) => (e.l1[0][i] as number[]).map((w, j) => ({ from: j, to: i, w, band: 'l1' as const, head: 0 as const })).filter((x) => x.w > .3));
  const [h1, h2] = e.two_heads.attn as number[][];
  const l2 = [...h1.map((w, j) => ({ from: j, to: 9, w, band: 'l2' as const, head: 0 as const, pct: w > .5 })),
    ...h2.map((w, j) => ({ from: j, to: 9, w, band: 'l2' as const, head: 1 as const, pct: w > .5 }))].filter((x) => x.w > .02);
  return { ok: true, arcs: [...l1, ...l2],
    result: <>layer 2's heads: <b>{pct(h1[5])}</b> on the 9, <b>{pct(h2[3])}</b> on the 5. test accuracy <b>{acc('2 layers, 2 heads each, plus MLP').toFixed(0)}%</b>; one head: {acc('2 layers, 1 head each, plus MLP').toFixed(1)}% or {acc('2 layers, 1 head each, plus MLP (seed 1)').toFixed(1)}%, by seed</> };
}

// ── geometry (svg units) ─────────────────────────────────────────────────────
const W = 1060, H = 650, COL = 76, CELL = 3;
const Y = { tok: 40, id: 88, emb: 104, l1: 300, l2: 392, mlp: 470, unemb: 548, out: 612 };
const EMB_END = Y.emb + 32 * CELL;
const x0For = (n: number) => 274 + (10 - n) * COL / 2;

type Row = Record<string, number | string>;
const vec = (r: Row | undefined) => (r ? range(32).map((k) => r[`d${k}`] as number) : null);

export default function Recall() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const data = { task0: useData('task0'), task1: useData('task1'), head1: useData('head1'), task2w: useData('task2w'), task3w: useData('task3w'), task4: useData('task4') };
  const final = step >= LAST_STEP;
  const t = Math.min(4, Math.floor(step / 3)), ph = final ? 2 : step % 3;
  // the network drawn: phase 0 still shows the previous task's (task 0's phase 0 shows only the input)
  const archT = ph === 0 ? t - 1 : t;
  const A = TASKS[Math.max(0, archT)], cur = TASKS[t];
  const hasArch = archT >= 0;
  const text = cur.text, N = text.length, LAST = N - 1, X0 = x0For(N);
  const x = (i: number) => X0 + i * COL;
  const ids = [...text].map((c) => VOCAB.indexOf(c));
  const isNew = (k: Task['isNew'][number]) => ph >= 1 && !final && TASKS[t].isNew.includes(k);
  const rec = ph === 2 ? arcsFor(t, data) : null;

  // embedding columns: the real rows from each task's data file (task 4's weights weren't exported: drawn empty)
  const src = [data.task0, data.task1, data.task2w, data.task3w, null][Math.max(0, archT)] as { embedding: Row[]; position?: Row[] } | null;
  const embRow = (id: number) => vec(src?.embedding?.[id]);
  const posRow = (i: number) => vec(src?.position?.[i]);
  const bandX0 = x(0) - 34, bandW = x(LAST) - x(0) + 68;
  const last = (y: number) => <line class="stream last" x1={x(LAST)} x2={x(LAST)} y1={y} y2={Y.unemb - 22} />;

  const arcPath = (a: Arc) => {
    const yb = (a.band === 'l1' ? Y.l1 : Y.l2) - 2 + (a.head === 1 ? 8 : 0);
    if (a.from === a.to) return `M ${x(a.to) - 10} ${yb - 30} Q ${x(a.to) - 14} ${yb - 8} ${x(a.to)} ${yb}`;
    const lift = 26 + Math.min(70, Math.abs(a.to - a.from) * 9);
    return `M ${x(a.from)} ${yb - 4} C ${x(a.from)} ${yb - lift}, ${x(a.to)} ${yb - lift}, ${x(a.to)} ${yb}`;
  };

  return (
    <div class="recall" ref={root}>
      <div class="strip">
        {TASKS.map((k, i) => (
          <div class={`tchip ${i === t && !final ? 'cur' : ''} ${i < t || final ? 'done' : ''} ${i > t && !final ? 'todo' : ''}`}>
            <b>task {i}</b> {k.name}
          </div>
        ))}
      </div>

      <div class={`main ${final ? 'gone' : ''}`}>
        <svg viewBox={`0 0 ${W} ${H}`} class="arch">
          {/* row labels */}
          <text class="lbl" x="0" y={Y.tok + 8}>input</text>
          <g class={`fade ${hasArch ? 'on' : ''}`}>
            <text class="lbl" x="0" y={Y.id + 4}>token ids</text>
            <text class="lbl" x="0" y={Y.emb + 44}>{A.pos && hasArch ? 'embed + position' : 'embed'}</text>
            <text class="lsub" x="0" y={Y.emb + 72}>{A.pos && hasArch ? 'token row + position row' : '32 numbers per token'}</text>
            <text class="lbl" x="0" y={Y.unemb + 8}>unembed</text>
            <text class="lsub" x="0" y={Y.unemb + 34}>last stream → 36 scores</text>
          </g>
          <text class={`lbl fade ${hasArch && A.layers >= 1 ? 'on' : ''}`} x="0" y={Y.l1 + 8}>layer 1 · {A.heads === 2 ? '2 heads' : '1 head'}</text>
          <text class={`lbl fade ${hasArch && A.layers >= 2 ? 'on' : ''}`} x="0" y={Y.l2 + 8}>layer 2 · {A.heads === 2 ? '2 heads' : '1 head'}</text>
          <text class={`lbl fade ${hasArch && A.mlp ? 'on' : ''}`} x="0" y={Y.mlp + 8}>mlp</text>

          {/* bands under the streams: attention layers */}
          {[1, 2].map((l) => {
            const on = hasArch && A.layers >= l, y = l === 1 ? Y.l1 : Y.l2;
            const nw = isNew(l === 1 ? 'l1' : 'l2') || (isNew('heads') && on);
            return (
              <g class={`fade ${on ? 'on' : ''}`}>
                {A.heads === 2 && <rect class={`band h2 ${nw ? 'new' : ''}`} x={bandX0 + 6} y={y - 16} width={bandW} height="40" rx="10" />}
                <rect class={`band ${nw ? 'new' : ''}`} x={bandX0} y={y - 22} width={bandW} height="40" rx="10" />
              </g>
            );
          })}

          {/* per-position columns */}
          {range(N).map((i) => {
            const c = text[i], dg = /\d/.test(c);
            const er = hasArch ? embRow(ids[i]) : null, pr = hasArch && A.pos ? posRow(i) : null;
            const dim = ph === 2 && t === 0 && i !== LAST;
            return (
              <g class={`col ${dim ? 'dim' : ''}`}>
                <rect class="tbox" x={x(i) - 28} y={Y.tok - 26} width="56" height="50" rx="8" />
                <text class={`tok ${dg ? 'dg' : ''}`} x={x(i)} y={Y.tok + 9}>{c}</text>
                <g class={`fade ${hasArch ? 'on' : ''}`}>
                  <text class="id" x={x(i)} y={Y.id + 4}>{ids[i]}</text>
                  <rect class={`newbox fade ${isNew('emb') ? 'on' : ''}`} x={x(i) - (A.pos ? 31 : 17)} y={Y.emb - 4} width={A.pos ? 30 : 34} height={32 * CELL + 8} rx="4" />
                  <g>
                    {range(32).map((k) => (
                      <rect x={x(i) - (A.pos ? 27 : 13)} y={Y.emb + k * CELL} width={A.pos ? 22 : 26} height={CELL - .4}
                        style={{ fill: er ? diverging(er[k], .5) : 'var(--raised)' }} />
                    ))}
                  </g>
                  <g class={`fade ${A.pos ? 'on' : ''}`}>
                    <rect class={`newbox fade ${isNew('pos') ? 'on' : ''}`} x={x(i) + 2} y={Y.emb - 4} width="30" height={32 * CELL + 8} rx="4" />
                    <text class="plus" x={x(i)} y={Y.emb + 52}>+</text>
                    {range(32).map((k) => (
                      <rect x={x(i) + 6} y={Y.emb + k * CELL} width="22" height={CELL - .4} style={{ fill: pr ? diverging(pr[k], .5) : 'var(--raised)' }} />
                    ))}
                  </g>
                  <line class="stream" x1={x(i)} x2={x(i)} y1={EMB_END + 8} y2={i === LAST ? Y.unemb - 22 : (A.mlp ? Y.mlp + 24 : A.layers === 2 ? Y.l2 + 26 : A.layers === 1 ? Y.l1 + 26 : EMB_END + 8)} />
                  <rect class={`mlpbox fade ${A.mlp ? 'on' : ''} ${isNew('mlp') ? 'new' : ''}`} x={x(i) - 28} y={Y.mlp - 18} width="56" height="36" rx="8" />
                </g>
              </g>
            );
          })}
          <g class={`fade ${hasArch ? 'on' : ''}`}>
            {last(EMB_END + 8)}
            <rect class={`unemb ${isNew('unemb') ? 'new' : ''}`} x={x(LAST) - 84} y={Y.unemb - 22} width="168" height="44" rx="10" />
            <text class="ulbl" x={x(LAST)} y={Y.unemb + 7}>36 scores</text>
            <path class="arr" d={`M ${x(LAST)} ${Y.unemb + 26} V ${Y.out - 22}`} />
            <text class="out" x={x(LAST)} y={Y.out + 4}>highest score</text>
          </g>

          {/* recorded attention: which positions talk */}
          {rec?.arcs.map((a) => (
            <path class={`arc ${a.band} h${a.head ?? 0}`} d={arcPath(a)} style={{ strokeWidth: 1.2 + 4 * a.w, opacity: .25 + .75 * a.w }} />
          ))}
          {rec?.arcs.filter((a) => a.pct).map((a) => (
            // beside the arc's foot, between two streams, so the arc doesn't run through it
            <text class={`apct ${a.band}`} x={x(a.from) - 10} y={(a.band === 'l1' ? Y.l1 : Y.l2) - 10 + (a.head === 1 ? 8 : 0)}>{Math.round(a.w * 100)}%</text>
          ))}
          {ph === 2 && t === 0 && <>
            <path class="never" d={`M ${x(4)} ${EMB_END + 30} C ${x(4)} ${EMB_END + 110}, ${x(LAST)} ${EMB_END + 110}, ${x(LAST) - 6} ${Y.l1 + 30}`} />
            <text class="nevert" x={x(4) - 12} y={EMB_END + 150}>✗ nothing moves the 7</text>
            <text class="nevert" x={x(4) - 12} y={EMB_END + 172}>to the last stream</text>
          </>}
          {ph >= 1 && !final && <text class="newtag" x="0" y={Y.out + 4}>outlined: new in task {t}</text>}
          {hasArch && archT === 4 && <text class="lsub" x="0" y={Y.emb + 92}>(task 4's weights</text>}
          {hasArch && archT === 4 && <text class="lsub" x="0" y={Y.emb + 110}>weren't exported:</text>}
          {hasArch && archT === 4 && <text class="lsub" x="0" y={Y.emb + 128}>columns drawn empty)</text>}
        </svg>

        <div class="side">
          <div class="kick">task {t} · {cur.name}</div>
          <div class="io">
            <code class="in">{[...cur.text].map((c) => <span class={/\d/.test(c) ? 'dg' : ''}>{c}</span>)}</code>
            <span class="arr">→</span>
            <span class="tgt"><span class="tl">target</span><code>{cur.target}</code></span>
          </div>
          <div class="why">{cur.why}</div>
          <div class="cfg">
            <span class="pill">{cur.layers} layer{cur.layers === 1 ? '' : 's'}</span>
            <span class={`pill ${cur.heads ? '' : 'no'}`}>{cur.heads ? `${cur.heads} head${cur.heads > 1 ? 's' : ''} / layer` : 'no heads'}</span>
            <span class={`pill ${cur.pos ? '' : 'no'}`}>positions {cur.pos ? 'yes' : 'no'}</span>
            <span class={`pill ${cur.mlp ? 'mlp' : 'no'}`}>mlp {cur.mlp ? 'after layer 2' : 'no'}</span>
          </div>
          <div class={`blk fade ${ph >= 1 ? 'on' : ''}`}><div class="h">new piece</div>{cur.newText}</div>
          <div class={`blk fade ${ph >= 2 ? 'on' : ''}`}><div class="h">now possible</div>{cur.possible}</div>
          <div class={`blk res fade ${ph >= 2 && rec ? 'on' : ''} ${rec && !rec.ok ? 'bad' : ''}`}>
            <div class="h">trained model <span class="tag-rec">recorded</span></div>
            {rec?.result}
          </div>
        </div>
      </div>

      <div class={`cmp ${final ? 'on' : ''}`}>
        <div class="cmphead">each column is one network, bottom to top; outlined: the piece that task added</div>
        {TASKS.map((k, i) => (
          <div class="cc">
            <div class="ct">new: <b>{['embed, unembed', 'attention', 'positions, layer 2', 'mlp', '2 heads / layer'][i]}</b></div>
            <div class="stack">
              <div class="sb u">unembed</div>
              {k.mlp && <div class={`sb m ${i === 3 ? 'nw' : ''}`}>mlp</div>}
              {k.layers >= 2 && <div class={`sb a2 ${i === 2 || i === 4 ? 'nw' : ''}`}>attn{k.heads === 2 ? ' ×2' : ''}</div>}
              {k.layers >= 1 && <div class={`sb a1 ${i === 1 || i === 4 ? 'nw' : ''}`}>attn{k.heads === 2 ? ' ×2' : ''}</div>}
              <div class={`sb e ${i === 2 ? 'nw' : ''}`}>embed{k.pos ? ' + pos' : ''}</div>
            </div>
            <div class="cio"><code>{k.text}</code> → <code class="g">{k.target}</code></div>
            <div class={`cres ${i === 0 ? 'bad' : ''}`}>{['fails: guesses a digit', 'finds the digit', 'looks up by key', 'fetches two, adds', 'two heads keep order'][i]}</div>
          </div>
        ))}
      </div>

      <div class="foot">all five: vocabulary <b>36</b> · residual width <b>32</b> · head width <b>32</b> · only the <b>final position</b> is graded</div>
      <style>{`
        .recall { position: relative; display: flex; flex-direction: column; gap: .3em; font-size: .62em; flex: 1; min-height: 0; }
        .recall .strip { display: flex; gap: .5em; }
        .recall .tchip { flex: 1; padding: .3em .6em; border-radius: 8px; color: var(--muted);
          font-size: .78em; white-space: nowrap; transition: all .3s; }
        .recall .tchip b { color: var(--fg); font-weight: 700; margin-right: .2em; }
        .recall .tchip.cur { background: color-mix(in srgb, var(--accent) 14%, transparent); color: var(--fg); }
        .recall .tchip.cur b { color: var(--accent); }
        .recall .tchip.todo { opacity: .45; }
        .recall .main { display: grid; grid-template-columns: 1fr 470px; gap: 1em; flex: 1; min-height: 0; transition: opacity .35s; }
        .recall .main.gone { opacity: 0; pointer-events: none; }
        .recall .arch { width: 100%; height: 100%; max-height: 100%; display: block; overflow: visible; }
        .recall .lbl { font-family: var(--mono); font-size: 21px; fill: var(--muted); }
        .recall .lsub { font-size: 16px; fill: var(--muted); opacity: .8; }
        .recall .col { transition: opacity .35s; }
        .recall .col.dim { opacity: .35; }
        .recall .tbox { fill: var(--panel); stroke: var(--border); stroke-width: 1.5; }
        .recall .tok { font-family: var(--mono); font-size: 32px; fill: var(--fg); text-anchor: middle; }
        .recall .tok.dg { fill: var(--digit); }
        .recall .id { font-family: var(--mono); font-size: 16px; fill: var(--muted); text-anchor: middle; }
        .recall .plus { font-family: var(--mono); font-size: 18px; fill: var(--muted); text-anchor: middle; }
        .recall .stream { stroke: var(--line); stroke-width: 7; stroke-linecap: round; }
        .recall .stream.last { stroke: var(--steel-line); }
        .recall .band { fill: color-mix(in srgb, var(--attn) 8%, transparent); stroke: var(--attn); stroke-width: 2; transition: stroke .3s; }
        .recall .band.h2 { fill: none; stroke-dasharray: 6 5; }
        .recall .mlpbox { fill: color-mix(in srgb, var(--mlp) 12%, var(--bg)); stroke: var(--mlp); stroke-width: 2; }
        .recall .unemb { fill: color-mix(in srgb, var(--answer) 10%, transparent); stroke: var(--answer); stroke-width: 2; }
        .recall .ulbl { font-family: var(--mono); font-size: 20px; fill: var(--answer); text-anchor: middle; }
        .recall .arr { stroke: var(--faint); stroke-width: 2; fill: none; }
        .recall .out { font-family: var(--mono); font-size: 19px; fill: var(--muted); text-anchor: middle; }
        .recall .new { stroke: var(--focus) !important; stroke-width: 4 !important; }
        .recall .newbox { fill: none; stroke: var(--focus); stroke-width: 3; }
        .recall .newtag { font-size: 17px; fill: var(--focus); }
        .recall .arc { fill: none; stroke-linecap: round; }
        .recall .arc.l1 { stroke: var(--attn); }
        .recall .arc.l2 { stroke: var(--l2); }
        .recall .arc.l2.h1 { stroke-dasharray: 7 5; }
        .recall .apct { font-family: var(--mono); font-size: 17px; font-weight: 700; text-anchor: end; paint-order: stroke; stroke: var(--bg); stroke-width: 4px; }
        .recall .apct.l1 { fill: var(--attn); } .recall .apct.l2 { fill: var(--l2); }
        .recall .never { fill: none; stroke: var(--bad); stroke-width: 2.5; stroke-dasharray: 6 6; }
        .recall .nevert { font-size: 18px; fill: var(--bad); text-anchor: end; }
        .recall .side { display: flex; flex-direction: column; gap: .45em; min-width: 0; }
        .recall .io { display: flex; align-items: center; gap: .5em; font-size: 1.15em; }
        .recall .io .in { font-size: 1em; letter-spacing: .06em; background: var(--panel); border: 1px solid var(--border); padding: .1em .4em; }
        .recall .io .dg, .recall .cio .dg { color: var(--digit); }
        .recall .io .arr { color: var(--muted); }
        .recall .tgt { display: inline-flex; flex-direction: column; align-items: center; line-height: 1.1; }
        .recall .tgt .tl { font-size: 13px; color: var(--target); }
        .recall .tgt code { color: var(--target); border: 2px solid var(--target); background: color-mix(in srgb, var(--target) 10%, transparent); font-size: 1em; font-weight: 700; }
        .recall .why { color: var(--muted); font-size: .9em; }
        .recall .cfg { display: flex; flex-wrap: wrap; gap: .3em; }
        .recall .cfg .pill { font-size: .72em; }
        .recall .blk { font-size: .92em; line-height: 1.35; }
        .recall .blk .h { font-size: .72em; color: var(--muted); margin-bottom: .1em; }
        .recall .blk b { color: var(--fg); }
        .recall .res { border-left: 4px solid var(--answer); padding-left: .6em; }
        .recall .res.bad { border-left-color: var(--bad); }
        .recall .cmp { position: absolute; inset: 2.6em 0 2em 0; display: grid; grid-template-columns: repeat(5, 1fr); grid-template-rows: auto 1fr; gap: .6em 1em; opacity: 0; pointer-events: none; transition: opacity .35s; }
        .recall .cmp.on { opacity: 1; }
        .recall .cc { display: flex; flex-direction: column; gap: .5em; align-items: stretch; }
        .recall .ct { font-size: .9em; color: var(--muted); } .recall .ct b { color: var(--fg); }
        .recall .stack { display: flex; flex-direction: column; gap: .3em; flex: 1; justify-content: flex-end; }
        .recall .sb { font-family: var(--mono); font-size: .85em; text-align: center; padding: .35em 0; border-radius: 8px; border: 2px solid var(--border); background: var(--sunken); }
        .recall .sb.u { border-color: var(--answer); color: var(--answer); }
        .recall .sb.m { border-color: var(--mlp); color: var(--mlp); }
        .recall .sb.a1 { border-color: var(--attn); color: var(--attn); }
        .recall .sb.a2 { border-color: var(--l2); color: var(--l2); }
        .recall .sb.nw { box-shadow: 0 0 0 3px color-mix(in srgb, var(--focus) 55%, transparent); }
        .recall .cio { font-size: .85em; white-space: nowrap; } .recall .cio code { font-size: 1em; }
        .recall .cio .g { color: var(--target); }
        .recall .cres { font-size: .85em; color: var(--muted); min-height: 2.6em; }
        .recall .cres.bad { color: var(--bad); }
        .recall .cmphead { grid-column: 1 / -1; font-size: .85em; color: var(--muted); }
        .recall .foot { font-size: .72em; color: var(--muted); text-align: right; }
        .recall .foot b { color: var(--fg); font-family: var(--mono); }
      `}</style>
    </div>
  );
}
