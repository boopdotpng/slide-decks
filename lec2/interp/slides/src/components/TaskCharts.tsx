/** @jsxImportSource preact */
import { useEffect, useRef, useState } from 'preact/hooks';
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

/** loss over training (ln 36 and ln 10 on steps 1 and 2), then (step 3) the average prediction after training */
export function LossPred({ data }: { data: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<D>(data);
  if (!d) return <div ref={root} />;
  const [all, digits] = col(d.loss_reference, 'loss');
  const p = d.prediction;
  return (
    <div class="s0" ref={root}>
      <LineChart ys={col(d.loss, 'loss')} yLabel="loss" height={330} refs={[
        { y: all, label: `guess evenly over all 36 tokens: ln 36 = ${all.toFixed(2)}`, step: 1 },
        { y: digits, label: `guess evenly over the 10 digits: ln 10 = ${digits.toFixed(2)}`, step: 2 },
      ]} />
      <div class={`fade ${step >= 3 ? 'on' : ''}`}>
        <BarChart title="what it predicts after training, averaged over the test set" values={col(p, 'probability_trained')} labels={str(p, 'token')} kinds={str(p, 'kind')}
          max={0.11} height={190} refs={[{ y: 0.1, label: '0.1' }]} fmtV={pct} />
      </div>
      <style>{CHART_CSS}{`.s0 { display: flex; flex-direction: column; gap: .4em; }`}</style>
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
  const PX = 17, ZERO = 90; // bar px per unit of score; where 0 sits in the score column
  const CAPS = [
    <>unembedding <b>(36, 32)</b> · stream (<b>{QUERY}</b>'s embedding)</>,
    <>row <b>{SHOW}</b> · stream = <b>{scores[show].toFixed(2)}</b></>,
    <>36 dot products → <b>36 scores</b>. letters low, digits high. the digits' own embedding rows never moved: never at the last position, so never a gradient</>,
    <>output: <b class="best">{toks[best]}</b>. the answer was <b class="dg">{SHOW}</b>: the last position never saw it</>,
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
        .s0u .grid { display: grid; grid-template-columns: auto auto 200px; column-gap: .7em; row-gap: 1px; align-items: center; }
        .s0u .vec { display: flex; gap: 1px; transition: opacity .3s; }
        .s0u .vec i { width: 16px; height: 15px; display: block; }
        .s0u .vec.x i { height: 22px; }
        .s0u .vec.dim { opacity: .2; }
        .s0u .vec.on { outline: 2px solid var(--accent); outline-offset: 1px; }
        .s0u .gap { height: 10px; }
        .s0u .rl { font-family: var(--mono); font-size: .6em; color: var(--muted); text-align: right; line-height: 1; }
        .s0u .rl.dg { color: var(--hot); }
        .s0u .rl.best { color: var(--fg); font-weight: 700; font-size: .75em; }
        .s0u .sh { font-size: .55em; }
        .s0u .sc { position: relative; height: 15px; }
        .s0u .sc .zero { position: absolute; left: 90px; top: -1px; bottom: -1px; width: 1px; background: var(--border); }
        .s0u .sc i { position: absolute; top: 2px; height: 11px; background: var(--faint); border-radius: 2px; }
        .s0u .sc i.dg { background: var(--hot); }
        .s0u .sc b { position: absolute; left: 160px; top: -.3em; font-family: var(--mono); font-size: .65em; color: var(--fg); }
        .s0u .sc.best i { background: var(--good); }
        .s0u .cap { max-width: 18em; font-size: .9em; }
        .s0u .cap b { font-family: var(--mono); color: var(--fg); }
        .s0u .cap .best { color: var(--good); }
        .s0u .cap .dg { color: var(--hot); }
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

/** OV: if the head copies digit d to the last position, what comes out? 10 x 10, the identity. table: the csv (task 2: ov_layer2) */
export function OV({ data, table = 'ov' }: { data: string; table?: string }) {
  const d = useData<Record<string, Row[]>>(data);
  if (!d) return <div />;
  const ov = d[table];
  const digits = Object.keys(ov[0]).filter((k) => k.startsWith('p_digit_'));
  const m = ov.map((r) => digits.map((k) => r[k] as number));
  const diag = Math.min(...m.map((r, i) => r[i]));
  return (
    <div class="s0t">
      <div class="ovw">
        <div class="ax">output digit →</div>
        <Heatmap data={m} cell={34} gap={2} color={(v) => sequential(v)}
          rowLabels={str(ov, 'source_digit')} colLabels={digits.map((k) => k.slice(-1))}
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
 * How a model with no layers learns "some digit, evenly", from one real training run (public/data/train0.json,
 * export_train0.py: this network trained one example at a time). Bars: each token's score, unembed · embed[last letter]
 * averaged over the 26 last letters. Arrows: one example's push on the scores, the cross-entropy gradient −(p − onehot).
 *   0 at init every score is about 0   1–3 the first three examples, each pushing its answer up and the other 35 down
 *   4 fast-forward to the last example: letters only ever go down, the ten digits rise together   5 softmax: digits ≈ 10% each
 */
type Frame = { n: number; answer: string; scores: number[]; probs: number[]; count: number[] };
type Train = { tokens: string[]; n: number; examples: { input: string; answer: string; push: number[] }[]; frames: Frame[] };
const FF = 4, FF_MS = 70;
export function HowDigits({ data }: { data: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<Train>(data);
  // the fast-forward replays frames 3 → last each time step 4 is entered; every other step is a fixed frame
  const [ff, setFf] = useState(0);
  const start = d ? d.frames.findIndex((f) => f.n === 3) : 0, end = d ? d.frames.length - 1 : 0;
  useEffect(() => {
    if (step !== FF || !d) return;
    setFf(start);
    const id = setInterval(() => setFf((i) => (i >= end ? (clearInterval(id), i) : i + 1)), FF_MS);
    return () => clearInterval(id);
  }, [step, d]);
  if (!d) return <div ref={root} />;
  const { tokens: toks, examples: ex } = d;
  const fi = step <= 3 ? d.frames.findIndex((f) => f.n === step) : step === FF ? ff : end;
  const f = d.frames[fi], last = d.frames[end];
  const isDigit = (i: number) => i >= 26;
  const push = step >= 1 && step <= 3 ? ex[step - 1].push : null;
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
  const W = 1200, X0 = 40, BW = (W - X0) / 36, Z = 190, PX = 36, AK = 130, LBL = Z + 90, H = LBL + 44;
  const P = (e: Train['examples'][0]) => {
    const t = toks.indexOf(e.answer);
    return { up: e.push[t].toFixed(2), down: (-avg(e.push.filter((_, i) => i !== t))).toFixed(3) };
  };
  const p1 = P(ex[0]);
  const CAPS = [
    <><b>score = unembed · embed[last letter]</b> · at init ≈ 0</>,
    <><code>{ex[0].input} → {ex[0].answer}</code> · <b class="v">{ex[0].answer}</b> ↑ 1 − p = <b>{p1.up}</b> · other 35 ↓ p ≈ <b>{p1.down}</b></>,
    <><code>{ex[1].input} → {ex[1].answer}</code> · <b class="v">{ex[1].answer}</b> ↑ · rest ↓</>,
    <><code>{ex[2].input} → {ex[2].answer}</code></>,
    <>fast-forward</>,
    <>softmax: letters ≈ 0 · digits ≈ 10%</>,
  ];
  return (
    <div class="hd" ref={root} data-hold={String(FF_MS * (end - start) + 500)}>
      <svg viewBox={`0 0 ${W} ${H}`}>
        <line x1={X0} x2={W} y1={Z} y2={Z} class="zero" />
        <text x={X0 - 10} y={Z + 6} class="tk" text-anchor="end">0</text>
        {step >= FF && <text x={X0 + 10} y={40} class="ctr">example {f.n} / {d.n}</text>}
        <text x={X0 - 10} y={LBL + 34} class="tk sm" text-anchor="end">answer</text>
        {f.scores.map((v, i) => {
          const x = X0 + i * BW, cx = x + BW / 2;
          const a = push ? push[i] * AK : 0;
          return (
            <g>
              <rect x={x + BW * .15} width={BW * .7} y={Math.min(Z, Z - v * PX)} height={Math.max(1, Math.abs(v) * PX)} rx="2"
                class={`bar ${isDigit(i) ? 'dg' : ''} ${step === 5 && !isDigit(i) ? 'dim' : ''}`} />
              {push && Math.abs(a) >= 1 && <>
                <line x1={cx} x2={cx} y1={Z} y2={Z - a} class={a > 0 ? 'pu' : 'pd'} />
                {a > 0 ? <path d={`M ${cx - 9} ${Z - a + 12} L ${cx} ${Z - a} L ${cx + 9} ${Z - a + 12}`} class="pu" />
                  : <path d={`M ${cx - 3} ${Z - a - 3} L ${cx} ${Z - a} L ${cx + 3} ${Z - a - 3}`} class="pd" />}
              </>}
              {step === FF && toks[i] === f.answer && <text x={cx} y={Z - v * PX - 10} class="up" text-anchor="middle">↑</text>}
              {step === 5 && isDigit(i) && <text x={cx} y={Z - v * PX - 10} class="pr" text-anchor="middle">{Math.round(last.probs[i] * 100)}%</text>}
              <text x={cx} y={LBL} class={`xl ${isDigit(i) ? 'dg' : ''}`} text-anchor="middle">{toks[i]}</text>
              <text x={cx} y={LBL + 34} class={`cnt ${f.count[i] ? 'dg' : ''}`} text-anchor="middle">{f.count[i]}</text>
            </g>
          );
        })}
      </svg>
      <div class="caption cap">{CAPS[Math.min(step, 5)]}</div>
      <style>{`
        .hd { display: flex; flex-direction: column; gap: .8em; font-size: .8em; }
        .hd svg { width: 100%; display: block; overflow: visible; }
        .hd .zero { stroke: var(--raised-2); }
        .hd .tk, .hd .xl { font-family: var(--mono); font-size: 20px; fill: var(--muted); }
        .hd .tk.sm { font-size: 14px; }
        .hd .xl.dg { fill: ${DIGIT}; }
        .hd .cnt { font-family: var(--mono); font-size: 13px; fill: var(--faint); }
        .hd .cnt.dg { fill: var(--muted); }
        .hd .ctr { font-family: var(--mono); font-size: 22px; fill: var(--fg); }
        .hd .bar { fill: ${LETTER}; transition: y .25s linear, height .25s linear, opacity .4s; }
        .hd .bar.dg { fill: ${DIGIT}; }
        .hd .bar.dim { opacity: .3; }
        .hd .pu { stroke: var(--good); stroke-width: 4; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .hd .pd { stroke: var(--bad); stroke-width: 2.5; fill: none; stroke-linecap: round; stroke-linejoin: round; }
        .hd .up { font-size: 30px; fill: var(--good); font-weight: 700; }
        .hd .pr { font-family: var(--mono); font-size: 15px; fill: var(--fg); }
        .hd .cap { font-size: .95em; min-height: 3em; }
        .hd .cap b { color: var(--fg); font-family: var(--mono); }
        .hd .cap b.v { color: var(--good); }
        .hd code { font-family: var(--mono); color: var(--fg); }
      `}</style>
    </div>
  );
}

/**
 * What the two tables learned: cosine similarity between rows of the embedding (E), of the unembedding (U), and between
 * U rows and E rows. Letters first (a–z), then digits (0–9); the block averages in the captions are computed here.
 *   0 E: letters alike, digits random   1 U: two opposite groups   2 U vs E: digit rows line up with the letter embeddings
 */
export function Cosine({ data }: { data: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<D>(data);
  if (!d) return <div ref={root} />;
  const unit = (r: Row) => { const v = range(32).map((k) => r[`d${k}`] as number); const n = Math.hypot(...v); return v.map((x) => x / n); };
  const E = d.embedding.map(unit), U = d.unembedding.map(unit);
  const cos = (A: number[][], B: number[][]) => A.map((a) => B.map((b) => a.reduce((s, x, k) => s + x * b[k], 0)));
  const L = 26, mats = [cos(E, E), cos(U, U), cos(U, E)];
  // average of a block, leaving out the diagonal (a row's similarity with itself is always 1)
  const blk = (m: number[][], r0: number, r1: number, c0: number, c1: number) => {
    let s = 0, n = 0;
    for (let r = r0; r < r1; r++) for (let c = c0; c < c1; c++) if (r !== c || m === mats[2]) { s += m[r][c]; n++; }
    return s / n;
  };
  const f = (v: number) => <b class={v > 0.3 ? 'pos' : v < -0.3 ? 'neg' : ''}>{v >= 0 ? '+' : '−'}{Math.abs(v).toFixed(2)}</b>;
  const [cE, cU, cX] = mats;
  const PANELS = [
    { t: 'embedding', rows: 'E', cols: 'E', m: cE },
    { t: 'unembedding', rows: 'U', cols: 'U', m: cU },
    { t: 'unembedding vs embedding', rows: 'U', cols: 'E', m: cX },
  ];
  const CAPS = [
    <>letters vs letters {f(blk(cE, 0, L, 0, L))} · digits vs digits {f(blk(cE, L, 36, L, 36))}</>,
    <>letters {f(blk(cU, 0, L, 0, L))} · digits {f(blk(cU, L, 36, L, 36))} · letters vs digits {f(blk(cU, 0, L, L, 36))}</>,
    <>digit rows vs letter embeddings {f(blk(cX, L, 36, 0, L))} · letter rows {f(blk(cX, 0, L, 0, L))}</>,
  ];
  const CELL = 11, G = 1, span = (n: number) => n * (CELL + G) - G;
  return (
    <div class="cosn" ref={root}>
      <div class="panels">
        {PANELS.map((p, i) => (
          <div class={`panel fade ${step >= i ? 'on' : ''} ${step === i ? 'cur' : ''}`}>
            <div class="pt">{p.t}</div>
            <div class="axes">
              <div />
              <div class="top"><span style={{ width: `${span(L)}px` }}>{p.cols} a–z</span><span style={{ width: `${span(10)}px` }}>0–9</span></div>
              <div class="left"><span style={{ height: `${span(L)}px` }}>{p.rows} a–z</span><span style={{ height: `${span(10)}px` }}>0–9</span></div>
              <Heatmap data={p.m} cell={CELL} gap={G} color={(v) => diverging(v, 0.6)}
                tipFn={(r, c, v) => `cos(${p.rows}[${d.embedding[r].token}], ${p.cols}[${d.embedding[c].token}]) = <b>${(v ?? 0).toFixed(2)}</b>`} />
            </div>
          </div>
        ))}
      </div>
      <div class="legend"><span class="sw neg" /> −1 opposite <span class="sw mid" /> 0 unrelated <span class="sw pos" /> +1 same direction</div>
      <div class="caption cap">{CAPS[Math.min(step, 2)]}</div>
      <style>{`
        .cosn { display: flex; flex-direction: column; gap: .6em; font-size: .8em; }
        .cosn .panels { display: flex; gap: 2.2em; }
        .cosn .panel { transition: opacity .35s; }
        .cosn .panel.on:not(.cur) { opacity: .55; }
        .cosn .pt { font-size: .7em; color: var(--fg); font-weight: 600; margin-bottom: .3em; }
        .cosn .axes { display: grid; grid-template-columns: auto auto; gap: 4px; }
        .cosn .top { display: flex; gap: ${G}px; }
        .cosn .left { display: flex; flex-direction: column; gap: ${G}px; }
        .cosn .top span, .cosn .left span { font-family: var(--mono); font-size: 15px; color: var(--muted); display: flex; align-items: center; justify-content: center;
          border-bottom: 2px solid var(--border); }
        .cosn .left span { writing-mode: vertical-rl; transform: rotate(180deg); border-bottom: 0; border-left: 2px solid var(--border); }
        .cosn .top span:last-child, .cosn .left span:last-child { color: ${DIGIT}; }
        .cosn .heat { display: grid; }
        .cosn .legend { font-size: .55em; color: var(--muted); display: flex; align-items: center; gap: .5em; }
        .cosn .sw { width: 14px; height: 14px; display: inline-block; border-radius: 2px; margin-left: .8em; }
        .cosn .sw.neg { background: var(--neg); } .cosn .sw.mid { background: var(--mid); } .cosn .sw.pos { background: var(--pos); }
        .cosn .cap { font-size: .95em; min-height: 3em; }
        .cosn .cap b { font-family: var(--mono); color: var(--fg); }
        .cosn .cap b.pos { color: var(--pos); } .cosn .cap b.neg { color: var(--neg); }
      `}</style>
    </div>
  );
}
