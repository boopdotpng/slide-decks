/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Heatmap, diverging, range, sequential, tip, useData } from './viz';
import { BarChart, CHART_CSS, DIGIT, LETTER, LineChart } from './Charts';

/**
 * Charts for each task, drawn from public/data/task<N>.json (export_task.py N, from ~/code/ml/interp/task<N>.py).
 * Every chart takes data="task0" | "task1" | …
 */
type Row = Record<string, number | string>;
type D = Record<'embedding' | 'loss' | 'loss_reference' | 'moved_tokens' | 'prediction' | 'table' | 'unembedding' | 'attention' | 'qk' | 'ov', Row[]>;
const col = (rows: Row[], k: string) => rows.map((r) => r[k] as number);
const str = (rows: Row[], k: string) => rows.map((r) => String(r[k]));
const pct = (v: number) => `${(v * 100).toFixed(v < 0.001 ? 3 : 1)}%`;

/** loss over training, with ln 36 and ln 10 appearing on steps 1 and 2 */
export function Loss({ data }: { data: string }) {
  const d = useData<D>(data);
  if (!d) return <div />;
  const [all, digits] = col(d.loss_reference, 'loss');
  return (
    <div class="s0">
      <LineChart ys={col(d.loss, 'loss')} yLabel="loss" height={440} refs={[
        { y: all, label: `guess evenly over all 36 tokens: ln 36 = ${all.toFixed(2)}`, step: 1 },
        { y: digits, label: `guess evenly over the 10 digits: ln 10 = ${digits.toFixed(2)}`, step: 2 },
      ]} />
      <style>{CHART_CSS}</style>
    </div>
  );
}

/** average prediction over the test set: random weights, then (step 1) trained */
export function Pred({ data }: { data: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<D>(data);
  if (!d) return <div ref={root} />;
  const p = d.prediction, labels = str(p, 'token'), kinds = str(p, 'kind');
  const refs = [{ y: 0.1, label: '0.1' }];
  return (
    <div class="s0" ref={root}>
      <BarChart title="at model init (random weights)" values={col(p, 'probability_random_weights')} labels={labels} kinds={kinds}
        max={0.11} height={220} refs={refs} fmtV={pct} />
      <div class={`fade ${step >= 1 ? 'on' : ''}`}>
        <BarChart title="after training" values={col(p, 'probability_trained')} labels={labels} kinds={kinds}
          max={0.11} height={220} refs={refs} fmtV={pct} />
      </div>
      <style>{CHART_CSS}{`.s0 { display: flex; flex-direction: column; gap: .6em; }`}</style>
    </div>
  );
}

/** P(digit | last letter), 26 x 10 */
export function LetterTable({ data }: { data: string }) {
  const d = useData<D>(data);
  if (!d) return <div />;
  const digits = Object.keys(d.table[0]).filter((k) => k.startsWith('p_digit_'));
  const m = d.table.map((r) => digits.map((k) => r[k] as number));
  const flat = m.flat(), lo = Math.min(...flat), hi = Math.max(...flat);
  return (
    <div class="s0t">
      <Heatmap data={m} cell={17} gap={2} color={(v) => sequential(v / 0.2)}
        rowLabels={str(d.table, 'last_letter')} colLabels={digits.map((k) => k.slice(-1))}
        tipFn={(r, c, v) => `last letter ${d.table[r].last_letter} → ${c}: <b>${pct(v ?? 0)}</b>`} />
      <div class="side">
        <div class="key"><span>0</span><i />{' '}<span>0.2</span></div>
        <div>every cell is between <b>{lo.toFixed(2)}</b> and <b>{hi.toFixed(2)}</b></div>
        <div class="muted">a perfectly even guess is 0.10 everywhere</div>
      </div>
      <style>{`
        .s0t { display: flex; gap: 3em; align-items: center; font-size: .8em; }
        .s0t .heat .cl span { transform: none; left: 0; }
        .s0t .side { display: flex; flex-direction: column; gap: .6em; }
        .s0t .side b { font-family: var(--mono); }
        .s0t .key { display: flex; align-items: center; gap: .5em; font-family: var(--mono); font-size: .8em; color: var(--muted); }
        .s0t .key i { width: 160px; height: 14px; border-radius: 3px;
          background: linear-gradient(90deg, ${[0, .25, .5, .75, 1].map((t) => sequential(t)).join(', ')}); }
      `}</style>
    </div>
  );
}

/** how far each token's embedding moved from its random start */
export function Moved({ data }: { data: string }) {
  const d = useData<D>(data);
  if (!d) return <div />;
  const tok = d.moved_tokens;
  return (
    <div class="s0">
      <BarChart values={col(tok, 'distance_moved')} labels={str(tok, 'token')} kinds={str(tok, 'kind')}
        height={360} yLabel="moved" fmtV={(v) => v.toFixed(2)} />
      <style>{CHART_CSS}</style>
    </div>
  );
}

/**
 * How the unembedding turns the last position's stream into 36 scores, with the trained weights.
 * With no layers the last stream is just the last token's embedding.
 *   0 the stream (the last token's 32 numbers) above the unembedding table, columns lined up
 *   1 one row times the stream, number by number, summed: one score
 *   2 every row: 36 scores
 *   3 the highest score is the output
 */
export function Unembed({ data, query, show: SHOW }: { data: string; query: string; show: string }) {
  const QUERY = query;
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<D>(data);
  if (!d) return <div ref={root} />;
  const vec = (r: Row) => range(32).map((k) => r[`d${k}`] as number);
  const toks = str(d.unembedding, 'token');
  const U = d.unembedding.map(vec), x = vec(d.embedding[toks.indexOf(QUERY)]);
  const scores = U.map((u) => u.reduce((s, v, k) => s + v * x[k], 0));
  const best = scores.indexOf(Math.max(...scores)), show = toks.indexOf(SHOW);
  const shown = (r: number) => step >= 2 || (step === 1 && r === show);
  const PX = 12, ZERO = 64; // bar px per unit of score; where 0 sits in the score column
  const CAPS = [
    <>the unembedding is another learned table: one row of 32 numbers per token, <b>(36, 32)</b>. above it, the last position's stream. with no layers, that's just the last token's embedding: <b>{QUERY}</b></>,
    <>multiply row <b>{SHOW}</b> by the stream, number by number, and add up: one score, <b>{scores[show].toFixed(2)}</b></>,
    <>do that for every row: <b>36 scores</b>. letters score low, digits high</>,
    <>the output is the token with the highest score: <b class="best">{toks[best]}</b></>,
  ];
  const cell = (v: number) => <i style={{ background: diverging(v, 0.5) }} />;
  return (
    <div class="s0u" ref={root}>
      <div class="grid">
        <span class="rl">{QUERY}</span><div class="vec x">{x.map(cell)}</div><span class="sh muted">last position's stream</span>
        <span /><div class="gap" /><span class="sh muted">score</span>
        {U.map((u, r) => <>
          <span class={`rl ${/\d/.test(toks[r]) ? 'dg' : ''} ${step >= 3 && r === best ? 'best' : ''}`}>{toks[r]}</span>
          <div class={`vec ${step === 1 && r === show ? 'on' : ''} ${step === 1 && r !== show ? 'dim' : ''}`}>{u.map(cell)}</div>
          <div class={`sc fade ${shown(r) ? 'on' : ''} ${step >= 3 && r === best ? 'best' : ''}`}>
            <span class="zero" />
            <i class={/\d/.test(toks[r]) ? 'dg' : ''} style={{ left: `${ZERO + Math.min(0, scores[r]) * PX}px`, width: `${Math.abs(scores[r]) * PX}px` }} />
            {(step === 1 && r === show) || (step >= 3 && r === best) ? <b>{scores[r].toFixed(2)}</b> : null}
          </div>
        </>)}
      </div>
      <div class="caption cap">{CAPS[Math.min(step, 3)]}</div>
      <style>{`
        .s0u { display: flex; gap: 3em; align-items: center; font-size: .8em; }
        .s0u .grid { display: grid; grid-template-columns: auto auto 140px; column-gap: .7em; row-gap: 1px; align-items: center; }
        .s0u .vec { display: flex; gap: 1px; transition: opacity .3s; }
        .s0u .vec i { width: 11px; height: 11px; display: block; }
        .s0u .vec.x i { height: 16px; }
        .s0u .vec.dim { opacity: .2; }
        .s0u .vec.on { outline: 2px solid var(--accent); outline-offset: 1px; }
        .s0u .gap { height: 10px; }
        .s0u .rl { font-family: var(--mono); font-size: .45em; color: var(--muted); text-align: right; line-height: 1; }
        .s0u .rl.dg { color: var(--hot); }
        .s0u .rl.best { color: var(--fg); font-weight: 700; font-size: .6em; }
        .s0u .sh { font-size: .45em; }
        .s0u .sc { position: relative; height: 11px; }
        .s0u .sc .zero { position: absolute; left: 64px; top: -1px; bottom: -1px; width: 1px; background: var(--border); }
        .s0u .sc i { position: absolute; top: 1px; height: 9px; background: var(--faint); border-radius: 2px; }
        .s0u .sc i.dg { background: var(--hot); }
        .s0u .sc b { position: absolute; left: 112px; top: -.35em; font-family: var(--mono); font-size: .55em; color: var(--fg); }
        .s0u .sc.best i { background: var(--good); }
        .s0u .cap { max-width: 18em; font-size: .9em; }
        .s0u .cap b { font-family: var(--mono); color: var(--fg); }
        .s0u .cap .best { color: var(--good); }
      `}</style>
    </div>
  );
}

/**
 * Where the last position looks, on a few test sequences: one row per sequence, one cell per position,
 * shaded by attention. Every row puts nearly all of it on the digit.
 */
export function Attention({ data }: { data: string }) {
  const d = useData<D>(data);
  if (!d) return <div />;
  const seqs = [...new Set(str(d.attention, 'sequence'))];
  const rows = seqs.map((q) => d.attention.filter((r) => r.sequence === q));
  const onDigit = rows.map((r) => r.filter((c) => c.kind === 'digit').reduce((a, c) => a + (c.attention as number), 0));
  const mean = onDigit.reduce((a, b) => a + b, 0) / onDigit.length;
  return (
    <div class="t1a">
      <div class="grid" style={{ gridTemplateColumns: `auto repeat(${rows[0].length}, 54px)` }}>
        <span />{rows[0].map((_, i) => <span class="pos">{i}</span>)}
        {rows.map((r) => <>
          <span class="seq">{r[0].sequence}</span>
          {r.map((c) => {
            const a = c.attention as number;
            return <span class={`cell ${a > 0.5 ? 'hot' : ''} ${c.kind === 'digit' ? 'dg' : ''}`} style={{ background: sequential(a) }}
              onMouseMove={(e) => tip(e, `${c.token} at ${c.position}: <b>${pct(a)}</b>`)} onMouseLeave={() => tip(null)}>{c.token}</span>;
          })}
        </>)}
      </div>
      <div class="side">
        <div>the last position looks at the digit, wherever it is</div>
        <div class="big">{pct(mean)}</div>
        <div class="muted">of its attention lands on the digit, averaged over these {rows.length}</div>
      </div>
      <style>{`
        .t1a { display: flex; gap: 3em; align-items: center; font-size: .8em; }
        .t1a .grid { display: grid; gap: 3px; }
        .t1a .pos { font-family: var(--mono); font-size: .5em; color: var(--muted); text-align: center; }
        .t1a .seq { font-family: var(--mono); font-size: .55em; color: var(--muted); padding-right: .8em; align-self: center; }
        .t1a .cell { height: 44px; display: grid; place-items: center; font-family: var(--mono); font-size: .8em; color: var(--muted); border-radius: 4px; }
        .t1a .cell.hot { color: var(--on-color); font-weight: 700; }
        .t1a .side { display: flex; flex-direction: column; gap: .4em; max-width: 14em; }
        .t1a .big { font-family: var(--mono); font-size: 2em; color: var(--accent); }
      `}</style>
    </div>
  );
}

/** QK: the score a letter at the last position gives each key token, averaged over the 26 letters. digits score high */
export function QK({ data }: { data: string }) {
  const d = useData<D>(data);
  if (!d) return <div />;
  return (
    <div class="s0">
      <BarChart values={col(d.qk, 'score_mean')} labels={str(d.qk, 'key_token')} kinds={str(d.qk, 'kind')}
        height={380} yLabel="score" fmtV={(v) => v.toFixed(1)} />
      <style>{CHART_CSS}</style>
    </div>
  );
}

/** OV: if the head copies digit d to the last position, what comes out? 10 x 10, the identity */
export function OV({ data }: { data: string }) {
  const d = useData<D>(data);
  if (!d) return <div />;
  const digits = Object.keys(d.ov[0]).filter((k) => k.startsWith('p_digit_'));
  const m = d.ov.map((r) => digits.map((k) => r[k] as number));
  const diag = Math.min(...m.map((r, i) => r[i]));
  return (
    <div class="s0t">
      <div class="ovw">
        <div class="ax">output digit →</div>
        <Heatmap data={m} cell={34} gap={2} color={(v) => sequential(v)}
          rowLabels={str(d.ov, 'source_digit')} colLabels={digits.map((k) => k.slice(-1))}
          tipFn={(r, c, v) => `copies ${r} → outputs ${c}: <b>${pct(v ?? 0)}</b>`} />
      </div>
      <div class="side">
        <div>rows: the digit the head copied. columns: what the model outputs</div>
        <div>every digit comes out as itself, at least <b>{pct(diag)}</b></div>
        <div class="muted">the head writes the digit's identity into the last position, and the unembedding reads it back</div>
      </div>
      <style>{`
        .s0t { display: flex; gap: 3em; align-items: center; font-size: .8em; }
        .s0t .heat .cl span { transform: none; left: 0; }
        .s0t .ax { font-size: .55em; color: var(--muted); margin-left: 2em; margin-bottom: .3em; }
        .s0t .side { display: flex; flex-direction: column; gap: .6em; max-width: 18em; }
        .s0t .side b { font-family: var(--mono); }
      `}</style>
    </div>
  );
}

/**
 * How a model with no layers learns "some digit, evenly". The scores are unembed · embed[last letter], and every
 * example pushes the right digit up and everything else down (the cross-entropy gradient on the scores is p − onehot).
 * The arrows are schematic; the bars from step 2 on are the real trained scores, averaged over the 26 last letters.
 *   0 at init every score is about the same   1 one example: 7 up, all 35 others down
 *   2 the answer is never a letter: letters only go down   3 each digit is right 1 time in 10: they rise together, evenly
 *   4 softmax: letters ≈ 0, digits ≈ 10% each
 */
export function HowDigits({ data }: { data: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<D>(data);
  if (!d) return <div ref={root} />;
  const vec = (r: Row) => range(32).map((k) => r[`d${k}`] as number);
  const toks = str(d.unembedding, 'token'), U = d.unembedding.map(vec), E = d.embedding.map(vec);
  const letters = range(26);
  // real trained score of each token, averaged over every possible last letter
  const score = U.map((u) => letters.reduce((a, q) => a + u.reduce((s, v, k) => s + v * E[q][k], 0), 0) / letters.length);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const sl = avg(score.slice(0, 26)), sd = avg(score.slice(26));
  const isDigit = (i: number) => i >= 26, TARGET = toks.indexOf('7');
  const shown = (i: number) => (step >= 3 || (step === 2 && !isDigit(i)) ? score[i] : 0);
  const W = 1200, H = 330, X0 = 40, BW = (W - X0) / 36, Z = 165, PX = 26;
  const CAPS = [
    <>the whole network: <b>score = unembed · embed[last letter]</b>. at model init every score is about the same, so it guesses all 36 tokens evenly</>,
    <>one training example, <code>qwdk7mzpa → 7</code>: push the score of <b class="v">7</b> up by how unsure it was (1 − p), push each of the other 35 down by how much it bet on them (p)</>,
    <>the answer is never a letter, so letter scores only ever get pushed down. averaged over every last letter they end at <b>{sl.toFixed(1)}</b></>,
    <>which digit is right is random: each is right 1 time in 10. up by (1 − p) once, down by p nine times: those cancel exactly at <b>p = 10%</b>. so all ten rise together and settle level, around <b>{sd.toFixed(1)}</b></>,
    <>after the softmax: letters ≈ 0, every digit ≈ 10%. that's all this network can learn: the last letter says nothing about the digit</>,
  ];
  return (
    <div class="hd" ref={root}>
      <svg viewBox={`0 0 ${W} ${H}`}>
        <line x1={X0} x2={W} y1={Z} y2={Z} class="zero" />
        <text x={X0 - 10} y={Z + 6} class="tk" text-anchor="end">0</text>
        {score.map((_, i) => {
          const v = shown(i), x = X0 + i * BW;
          return (
            <g>
              <rect x={x + BW * .15} width={BW * .7} y={Math.min(Z, Z - v * PX)} height={Math.max(1, Math.abs(v) * PX)} rx="2"
                class={`bar ${isDigit(i) ? 'dg' : ''}`} />
              <text x={x + BW / 2} y={H - 4} class={`xl ${isDigit(i) ? 'dg' : ''}`} text-anchor="middle">{toks[i]}</text>
              {step === 1 && (i === TARGET
                ? <text x={x + BW / 2} y={Z - 22} class="up" text-anchor="middle">↑</text>
                : <text x={x + BW / 2} y={Z + 38} class="down" text-anchor="middle">↓</text>)}
            </g>
          );
        })}
      </svg>
      <div class="caption cap">{CAPS[Math.min(step, 4)]}</div>
      <style>{`
        .hd { display: flex; flex-direction: column; gap: .8em; font-size: .8em; }
        .hd svg { width: 100%; display: block; overflow: visible; }
        .hd .zero { stroke: var(--raised-2); }
        .hd .tk, .hd .xl { font-family: var(--mono); font-size: 20px; fill: var(--muted); }
        .hd .xl.dg { fill: ${DIGIT}; }
        .hd .bar { fill: ${LETTER}; transition: y .6s ease, height .6s ease; }
        .hd .bar.dg { fill: ${DIGIT}; }
        .hd .up { font-size: 40px; fill: var(--good); font-weight: 700; }
        .hd .down { font-size: 26px; fill: var(--bad); }
        .hd .cap { font-size: .95em; min-height: 3em; }
        .hd .cap b { color: var(--fg); font-family: var(--mono); }
        .hd .cap b.v { color: var(--good); }
        .hd code { font-family: var(--mono); color: var(--fg); }
      `}</style>
    </div>
  );
}
