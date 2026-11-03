/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { highlight } from './Code';
import { Mat, Tex, SvgHtml, diverging, sequential, useIsland, range } from './viz';
import './roles';

/** a wrapped paragraph inside the svg (SvgHtml keeps to one line) */
const Note = ({ x, y, w, h = 120, children }: { x: number; y: number; w: number; h?: number; children: ComponentChildren }) => (
  <foreignObject x={x} y={y} width={w} height={h}><div class="note">{children}</div></foreignObject>
);

/**
 * Slide 6: attention as four tensor operations, one line lit per step, with its formula, its shapes and the matrices it
 * touches. One example all the way through: qwdk7mzpa in task 1's trained head (head1.json, "one head at a time"), the
 * same q and k as slide 3. q, k, v, the raw and scaled scores and the weights are the recorded ones; write = weights @ v
 * is computed here from them.
 *   0 q, k, v and the mask, already built      1 compare: q @ kᵀ (k turns over)      2 scale: ÷ √32
 *   3 mask + normalize: softmax over source positions, rows sum to 1                  4 retrieve: weights @ v
 */
type H = { text: string; trained: { q: number[][]; k: number[][]; v: number[][]; raw: number[][]; scores: (number | null)[][]; attn: (number | null)[][] } };
const LINES: [string, string][] = [
  ['1 · compare', 'scores = q @ k.transpose(-1, -2)'],
  ['2 · scale', 'scores = scores / math.sqrt(q.shape[-1])'],
  ['3 · mask + norm', 'weights = (scores + mask).softmax(axis=-1)'],
  ['4 · retrieve', 'write = weights @ v'],
];
const MATH: { tex: string; shape: string; note: ComponentChildren }[] = [
  { tex: 'M_{ij} = \\begin{cases} 0 & j \\le i \\\\ -\\infty & j > i \\end{cases}', shape: 'q,\\ k,\\ v:\\ (B, T, 32) \\qquad M:\\ (T, T)',
    note: <>the learned projections already made <b>q</b>, <b>k</b>, <b>v</b>; <b>mask</b> is built once</> },
  { tex: 'S = Q\\,K^{\\top}', shape: '(B,T,32)\\ @\\ (B,32,T) \\to (B,T,T)',
    note: <><code>transpose(-1, -2)</code> swaps the last two axes; each cell is one query · one key</> },
  { tex: 'S = \\dfrac{Q K^{\\top}}{\\sqrt{d_k}},\\quad d_k = 32', shape: '(B,T,T) \\to (B,T,T)',
    note: <><code>q.shape[-1]</code> is 32, so every score is divided by <Tex tex="\sqrt{32} \approx 5.66" /></> },
  { tex: '\\begin{aligned} A &= \\operatorname{softmax}(S + M) \\\\ A_{ij} &= \\frac{e^{S_{ij}+M_{ij}}}{\\sum_{k} e^{S_{ik}+M_{ik}}} \\end{aligned}', shape: '(B,T,T) \\to (B,T,T)',
    note: <><code>axis=-1</code>: over source positions, so <b>each row sums to 1</b>; <Tex tex="e^{-\infty} = 0" /> hides the future</> },
  { tex: '\\begin{aligned} O &= A\\,V \\\\ o_i &= \\textstyle\\sum_j A_{ij}\\, v_j \\end{aligned}', shape: '(B,T,T)\\ @\\ (B,T,32) \\to (B,T,32)',
    note: <>each position's write is a weighted mix of value vectors</> },
];

export default function AttnOps() {
  const { root, step, d } = useIsland<H>('head1');
  const shell = (body: ComponentChildren) => (
    <div class="ao" ref={root}><div class="ain">
      <div class="lft">
        <div class="lines card">
          {LINES.map(([lab, code], i) => (
            <div class={`ln ${step === i + 1 ? 'on' : ''} ${step > i + 1 ? 'done' : ''}`}>
              <span class="lb">{lab}</span><code>{highlight(code, 'py')}</code>
            </div>
          ))}
        </div>
        {body}
      </div>
      <div class="rgt">
        <div class="card mcard">
          <div class="mt">{step === 0 ? 'before line 1' : `line ${step}`}</div>
          <Tex block tex={MATH[step].tex} />
          <div class="shp"><Tex tex={MATH[step].shape} /></div>
          <div class="nt">{MATH[step].note}</div>
        </div>
        <div class="card bar-a sm">
          <h3>tensor shapes</h3>
          <div class={step === 0 || step === 1 ? 'on' : ''}><code>q, k, v</code> : (B, T, 32)</div>
          <div class={step >= 1 && step <= 3 ? 'on' : ''}><code>scores, weights</code> : (B, T, T)</div>
          <div class={step === 4 ? 'on' : ''}><code>write</code> : (B, T, 32)</div>
        </div>
        <div class="card bar-h sm">
          <h3>masking and properties</h3>
          <div class={step === 0 || step === 3 ? 'on' : ''}>allowed positions: <code>mask = 0</code></div>
          <div class={step === 0 || step === 3 ? 'on' : ''}>future positions: <code>mask = -inf</code></div>
          <div class={step === 3 ? 'on' : ''}><b>each attention row sums to 1</b></div>
        </div>
      </div>
    </div>{CSS}</div>
  );
  if (!d) return shell(<div class="viz card" />);
  const r = d.trained, chars = [...d.text], T = chars.length, L = T - 1, J = chars.indexOf('7');
  const lab = (i: number) => (/\d/.test(chars[i]) ? 'dg' : '');
  const SQ = Math.sqrt(32);
  const scaled = r.raw.map((row) => row.map((v) => v / SQ));
  const write = r.attn.map((row) => range(32).map((k) => row.reduce((s: number, a, j) => s + (a ?? 0) * r.v[j][k], 0)));
  const sc = (m: number[][]) => Math.max(...m.flat().map(Math.abs)) / 2;
  const mask = range(T).map((i) => range(T).map((j) => (j > i ? 1 : 0)));
  const Qp = { x: 70, y: 196, cw: 5, ch: 25 }, Kp = { x: 266, y: 34, cw: 4, ch: 25 }, Sp = { x: 266, y: 196, cw: 25, ch: 25 };
  const Vp = { x: 560, y: 196, cw: 5, ch: 25 }, Op = { x: 800, y: 196, cw: 5, ch: 25 };
  const S = step >= 3 ? r.attn : step === 2 ? scaled : r.raw;
  const sColor = step >= 3 ? (v: number) => sequential(v) : (v: number) => diverging(v, step === 2 ? 4 : 4 * SQ);
  const sText = (v: number | null, i: number) => (v === null ? '' : step >= 3 ? (i === L || v > .5 ? `${Math.round(v * 100)}` : null) : i === L ? (step === 2 ? v.toFixed(1) : v.toFixed(0)) : null);
  return shell(
    <div class="viz card">
      <div class="tag-rec rc">one example (B = 1 of the batch): qwdk7mzpa in task 1's trained head</div>
      <svg viewBox="0 0 1000 440">
        {/* q */}
        <Mat data={r.q} {...Qp} color={(v) => diverging(v, sc(r.q))} rowLabels={chars} labelCls={lab} hlRows={step === 1 ? [L] : []} dim={step === 1} />
        <text class="nm" x={Qp.x} y={Qp.y + T * Qp.ch + 26}>q</text>
        {/* k: drawn upright at step 0, turned over (transpose) from step 1 */}
        <Mat data={r.k} {...Kp} t={step >= 1} color={(v) => diverging(v, sc(r.k))} rowLabels={chars} labelCls={lab} hlRows={step === 1 ? [J] : []} dim={step === 1} />
        <text class="nm" x={Kp.x - 16} y={Kp.y + 64} text-anchor="end">{step >= 1 ? 'kᵀ' : 'k'}</text>
        <text class="sh" x={Kp.x - 16} y={Kp.y + 88} text-anchor="end">{step >= 1 ? '(32, 9)' : '(9, 32)'}</text>
        {/* scores / weights, or the mask before line 1 */}
        {step === 0 ? (
          <Mat data={mask} {...Sp} color={(v) => (v ? 'color-mix(in srgb, var(--bad) 25%, var(--surface))' : 'var(--surface)')} text={(v) => (v ? '−∞' : '0')} textCls={(v) => (v ? 'ninf' : 'zero')} />
        ) : (
          <Mat data={S} {...Sp} class="sm" color={sColor} text={sText} inv={step >= 3 ? (v) => v > .6 : undefined}
            hlCells={step === 1 || step === 2 ? [[L, J]] : []} hlRows={step === 3 || step === 4 ? [L] : []} dim={step === 4} />
        )}
        <text class="nm" x={Sp.x} y={Sp.y + T * Sp.ch + 26}>{['mask', 'scores', 'scores', 'weights', 'weights'][step]}</text>
        <text class="sh" x={Sp.x + 120} y={Sp.y + T * Sp.ch + 26}>(9, 9)</text>
        {step === 3 && range(T).map((i) => <text class="rs" x={Sp.x + T * Sp.cw + 10} y={Sp.y + i * Sp.ch + 18}>Σ=1</text>)}
        {step === 2 && <SvgHtml x={Sp.x} y={Sp.y - 22} size={17} w={260}><span class="mut">a·7: {r.raw[L][J].toFixed(1)} → {scaled[L][J].toFixed(2)}</span></SvgHtml>}
        {/* v and write */}
        <g class={`fd ${step === 4 ? 'on' : ''}`}>
          <text class="op" x={Vp.x - 30} y={Vp.y + 120}>@</text>
          <Mat data={r.v} {...Vp} color={(v) => diverging(v, sc(r.v))} rowLabels={chars} labelCls={lab} hlRows={[J]} />
          <text class="nm" x={Vp.x} y={Vp.y + T * Vp.ch + 26}>v</text>
          <text class="op" x={Op.x - 40} y={Op.y + 120}>=</text>
          <Mat data={write} {...Op} color={(v) => diverging(v, sc(r.v))} rowLabels={chars} labelCls={lab} hlRows={[L]} />
          <text class="nm" x={Op.x} y={Op.y + T * Op.ch + 26}>write</text>
          <Note x={Vp.x - 20} y={40} w={440}><span>row a: <b>{((r.attn[L][J] ?? 0) * 100).toFixed(1)}%</b> of the weight is on the 7,<br />so a's write is almost exactly the 7's value</span></Note>
        </g>
        <g class={`fd ${step === 0 ? 'on' : ''}`}>
          <Note x={560} y={200} w={420}>the mask: row <b>i</b> may read columns <b>0 … i</b>. built once, added to every example's scores</Note>
        </g>
        <g class={`fd ${step >= 1 && step <= 3 ? 'on' : ''}`}>
          <Note x={560} y={200} w={420} h={160}><span>{[null,
            <>row <b>a</b> × column <b>7</b>: one dot product, {r.raw[L][J].toFixed(1)}. the same for all 81 cells</>,
            <>same grid, every cell ÷ 5.66: the softmax won't be pushed to all-or-nothing by size alone</>,
            <>add the mask, softmax each row: the hidden half becomes exactly 0%, every row sums to 100%. row <b>a</b>: {((r.attn[L][J] ?? 0) * 100).toFixed(1)}% on the 7</>][step]}</span></Note>
        </g>
      </svg>
    </div>
  );
}

const CSS = <style>{`
  .ao { flex: 1; min-height: 0; }
  .ao .ain { display: grid; grid-template-columns: 1fr 440px; gap: .7em; height: 100%; font-size: .6em; }
  .ao .lft, .ao .rgt { display: flex; flex-direction: column; gap: .5em; min-height: 0; }
  .ao .lines { padding: .35em .5em; display: flex; flex-direction: column; gap: .25em; }
  .ao .ln { display: flex; align-items: center; gap: .8em; padding: .25em .4em; border-radius: 8px; border: 1px solid transparent; transition: all .3s; opacity: .55; }
  .ao .ln.on { opacity: 1; background: var(--hl); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
  .ao .ln.done { opacity: .8; }
  .ao .ln .lb { flex: none; width: 9.5em; font-size: .7em; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--accent);
    background: color-mix(in srgb, var(--accent) 10%, transparent); border-radius: 6px; padding: .2em .5em; text-align: center; }
  .ao .ln code { background: none; font-size: 1.02em; white-space: pre; }
  .ao .viz { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: .3em .5em; }
  .ao .viz svg { flex: 1; min-height: 0; width: 100%; overflow: visible; }
  .ao .rc { align-self: flex-start; }
  .ao .nm { font-family: var(--mono); font-size: 21px; fill: var(--fg); }
  .ao .sh { font-family: var(--mono); font-size: 17px; fill: var(--muted); }
  .ao .op { font-family: var(--mono); font-size: 30px; fill: var(--muted); text-anchor: middle; }
  .ao .rs { font-family: var(--mono); font-size: 13px; fill: var(--good); }
  .ao .mx .ct.ninf { fill: var(--bad); font-size: 11px; } .ao .mx .ct.zero { fill: var(--muted); font-size: 12px; }
  .ao .mx .rl.dg { fill: var(--digit); }
  .ao .fd { opacity: 0; transition: opacity .35s; } .ao .fd.on { opacity: 1; }
  .ao .mut { color: var(--muted); }
  .ao .note { font-size: 19px; line-height: 1.4; color: var(--fg); }
  .ao .mcard { display: flex; flex-direction: column; gap: .3em; flex: 1; }
  .ao .mcard .mt { font-size: .62em; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); }
  .ao .mcard .katex-display { margin: .2em 0; font-size: 1em; text-align: left; }
  .ao .mcard .katex-display > .katex { text-align: left; }
  .ao .mcard .shp { color: var(--accent); font-size: .9em; }
  .ao .mcard .nt { font-size: .85em; color: var(--muted); line-height: 1.35; }
  .ao .mcard .nt b { color: var(--fg); }
  .ao .sm { font-size: .82em; display: flex; flex-direction: column; gap: .15em; }
  .ao .sm > div { color: var(--muted); transition: color .3s; }
  .ao .sm > div.on { color: var(--fg); }
  .ao .sm h3 { color: var(--accent); }
  .ao .bar-h h3 { color: var(--hot); }
  .ao .sm code { font-size: .95em; }
`}</style>;
