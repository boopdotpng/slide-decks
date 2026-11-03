/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { Tex, diverging, useIsland, range } from 'slides/viz';
import { VOCAB } from './tinyEmbed';
import './roles';

/**
 * Slide 5: the shape table, each row drawn as a tensor. Rows of a slab are positions, columns are features (as in "one
 * head at a time", where X was 9 × 32, one row per position), and the batch is the stack of slabs going back: 16
 * independent examples, none of them reading another. The front slab is a real example, qwdk7mzpa through task 1's
 * trained model (head1.json: its stream, its head's scores, its scores at the last position); the 15 behind it are drawn
 * as outlines.
 *   0 one example's token ids: the position axis     1 sixteen examples: the batch axis           (16, 9)
 *   2 each id becomes 32 numbers: the feature axis    (16, 9, 32)
 *   3 one head's scores, query × source               (16, 9, 9)
 *   4 the final position's 36 scores                  (16, 36)
 *   5 one loss per example, averaged                  ()
 *   6 shape, dtype, device · the check question       7 the answer: (16, 10, 10)
 */
type H = { text: string; tokens: string[]; trained: { x: number[][]; scores: (number | null)[][]; logits_head: number[]; probs: number[] };
  W: { U: number[][] } };
const ROWS: { o: string; s: string; m: string; at: number }[] = [
  { o: 'token ids', s: '(16, 9)', m: 'one integer per token', at: 0 },
  { o: 'embedded inputs', s: '(16, 9, 32)', m: 'one vector per position', at: 2 },
  { o: 'attention scores, one head', s: '(16, 9, 9)', m: 'each query compared with every source position', at: 3 },
  { o: 'final-position logits', s: '(16, 36)', m: 'one score per possible output token', at: 4 },
  { o: 'mean loss', s: '()', m: 'one number to minimize', at: 5 },
];
const CAPS: ComponentChildren[] = [
  <>one example: 9 positions, one id each. <b>position axis</b> <Tex tex="T = 9" /></>,
  <>16 examples side by side: the <b>batch axis</b> <Tex tex="B = 16" />. none reads another</>,
  <>each id picks 32 numbers: the <b>feature axis</b> <Tex tex="D = 32" /></>,
  <>per example, one head: 9 queries × 9 source positions</>,
  <>only the final position is graded: its 36 scores per example</>,
  <>16 losses, averaged: one number, shape <code>()</code></>,
  <>every tensor also carries a dtype and a device</>,
  <>tasks 3 and 4 have 10 positions: scores are <b>(16, 10, 10)</b></>,
];

// slab geometry: the front slab at (FX, FY); slabs behind it step up and right
const FX = 170, FY = 100, DX = 7, DY = -6, NB = 16;

export default function TensorShapes() {
  const { root, step, d } = useIsland<H>('head1');
  const row = step <= 1 ? 0 : step <= 5 ? step - 1 : -1;
  const ten = step >= 7;
  // the front slab's contents and size, by step
  let rows = 9, cols = 1, cw = 30, ch = 30;
  if (step === 2) { cols = 32; cw = 11; }
  if (step === 3) { cols = 9; }
  if (step === 4) { rows = 1; cols = 36; cw = 11; }
  if (step >= 5) { rows = 1; cols = 1; cw = 150; ch = 70; }
  if (ten) { rows = 10; cols = 10; cw = 27; ch = 27; }
  const stack = step >= 1 && step !== 5 && step !== 6 ? NB : step >= 5 && !ten ? NB : 1;
  const W = cols * cw, Hh = rows * ch;
  const chars = d ? [...d.text] : [...'qwdk7mzpa'];
  const ids = chars.map((c) => VOCAB.indexOf(c));
  const logits = d ? d.W.U.map((u, i) => u.reduce((s, w, k) => s + w * d.trained.x[8][k], 0) + d.trained.logits_head[i]) : [];
  const p7 = d ? d.trained.probs[d.tokens.indexOf('7')] : 0;
  const cell = (r: number, c: number): { fill: string; t?: string; cls?: string } => {
    if (!d) return { fill: 'var(--surface)' };
    if (step <= 1) return { fill: 'var(--panel)', t: String(ids[r]), cls: /\d/.test(chars[r]) ? 'dg' : '' };
    if (step === 2) return { fill: diverging(d.trained.x[r][c], .5) };
    if (step === 3) { const v = d.trained.scores[r][c]; return v === null ? { fill: 'var(--panel)', t: '−∞', cls: 'ninf' } : { fill: diverging(v, 3) }; }
    if (step === 4) return { fill: diverging(logits[c], 6), cls: c === VOCAB.indexOf('7') ? 'hl' : '' };
    if (ten) return { fill: c > r ? 'var(--panel)' : 'color-mix(in srgb, var(--accent) 22%, var(--surface))' };
    return { fill: 'var(--surface)', t: (-Math.log(p7)).toFixed(4) };
  };
  // the loss stack (steps 5, 6) sits lower, so the slabs behind it stay under its caption
  const fy = step === 5 || step === 6 ? 210 : FY;
  const shapeNow = ['(9,)', '(16, 9)', '(16, 9, 32)', '(16, 9, 9)', '(16, 36)', '()', '()', '(16, 10, 10)'][step] ?? '';
  return (
    <div class="ts" ref={root}><div class="tin">
      <div class="lcol">
        <div class="card tab">
          <div class="th"><span>object</span><span>shape</span><span>meaning</span></div>
          {ROWS.map((r, i) => (
            <div class={`tr ${row === i ? 'on' : ''} ${step >= r.at ? '' : 'later'}`}>
              <span class="o">{r.o}</span><span class="s"><span class="pill">{r.s}</span></span><span class="m">{r.m}</span>
            </div>
          ))}
        </div>
        <div class={`card bar-a sdd ${step === 6 ? 'on' : ''}`}>
          <div><b>shape</b><span>tells you the axes</span><code>x.shape → (16, 9, 32)</code></div>
          <div><b>data type</b><span>tells you the numbers</span><code>ids int32 · x float32</code></div>
          <div><b>device</b><span>tells you where</span><code>x.device → 'CPU'</code></div>
        </div>
      </div>
      <div class="rcol">
        <div class="card viz">
          <svg viewBox="0 0 700 430">
            {/* the batch: slabs behind the front one */}
            {range(stack - 1).reverse().map((b) => (
              <rect class="back" x={FX + (b + 1) * DX} y={fy + (b + 1) * DY} width={W} height={Hh} rx="3" />
            ))}
            {range(rows).map((r) => range(cols).map((c) => {
              const k = cell(r, c);
              return <g>
                <rect class={`c ${k.cls ?? ''}`} x={FX + c * cw} y={fy + r * ch} width={cw - 1} height={ch - 1} style={{ fill: k.fill }} />
                {k.t && cw >= 28 && <text class={`ct ${k.cls ?? ''}`} x={FX + c * cw + cw / 2} y={fy + r * ch + ch / 2 + 6}>{k.t}</text>}
              </g>;
            }))}
            {/* axes */}
            <g class={`ax fade ${step <= 3 || ten ? 'on' : ''}`}>
              <path d={`M ${FX - 18} ${fy} V ${fy + Hh}`} marker-end="url(#ts-a)" />
              <text x={FX - 26} y={fy + Hh / 2} text-anchor="end">position</text>
              <text x={FX - 26} y={fy + Hh / 2 + 24} text-anchor="end" class="n">T = {ten ? 10 : 9}</text>
              {step <= 1 && chars.map((c, r) => <text class={`tl ${/\d/.test(c) ? 'dg' : ''}`} x={FX + cw + 12} y={fy + r * ch + 21}>{c}</text>)}
            </g>
            <g class={`ax fade ${step >= 1 && step !== 5 && step !== 6 ? 'on' : ''}`}>
              <path d={`M ${FX + W + 10} ${fy + Hh + 10} L ${FX + W + 10 + DX * 15} ${fy + Hh + 10 + DY * 15}`} marker-end="url(#ts-a)" />
              <text x={FX + W + 22 + DX * 15} y={fy + Hh + 24 + DY * 15}>batch</text>
              <text class="n" x={FX + W + 22 + DX * 15} y={fy + Hh + 48 + DY * 15}>B = 16</text>
            </g>
            <g class={`ax fade ${step === 2 ? 'on' : ''}`}>
              <path d={`M ${FX} ${fy + Hh + 14} H ${FX + W}`} marker-end="url(#ts-a)" />
              <text x={FX + W / 2} y={fy + Hh + 40} text-anchor="middle">features  D = 32</text>
            </g>
            <g class={`ax fade ${step === 3 || ten ? 'on' : ''}`}>
              <path d={`M ${FX} ${fy + Hh + 14} H ${FX + W}`} marker-end="url(#ts-a)" />
              <text x={FX + W / 2} y={fy + Hh + 40} text-anchor="middle">source positions</text>
            </g>
            <g class={`ax fade ${step === 4 ? 'on' : ''}`}>
              <path d={`M ${FX} ${fy + Hh + 14} H ${FX + W}`} marker-end="url(#ts-a)" />
              <text x={FX + W / 2} y={fy + Hh + 40} text-anchor="middle">36 output tokens (7 outlined)</text>
              <text x={FX - 14} y={fy + 26} text-anchor="end">last</text>
            </g>
            <g class={`fade ${step === 5 || step === 6 ? 'on' : ''}`}>
              <text class="ex" x={FX} y={fy + (NB - 1) * DY - 24}>16 per-example losses → their mean</text>
              <text class="ex m" x={FX} y={fy + 110}>front: this example's loss, −log p(7)</text>
            </g>
            <text class="shape" x={4} y={36}>{shapeNow}</text>
            <defs><marker id="ts-a" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0 L10 5 L0 10 z" class="ah" /></marker></defs>
          </svg>
          <div class="cap">{CAPS[step] ?? CAPS[0]}</div>
          {ten ? <div class="tag-ill rc">schematic: the causal mask's shape only</div>
            : <div class="tag-rec rc">front slab: qwdk7mzpa through task 1's trained model</div>}
        </div>
        <div class={`card q ${step >= 6 ? 'on' : ''}`}>
          <span class="kick">check question</span>
          <div class="qq">with 10 positions, what shape do the attention scores have?</div>
          <div class={`ans ${ten ? 'on' : ''}`}><span class="pill">(16, 10, 10)</span> one 10 × 10 grid per example</div>
        </div>
      </div>
    </div>
      <style>{`
        .ts { flex: 1; min-height: 0; }
        .ts .tin { display: grid; grid-template-columns: 1fr 720px; gap: .8em; height: 100%; font-size: .6em; }
        .ts .lcol, .ts .rcol { display: flex; flex-direction: column; gap: .6em; min-height: 0; }
        .ts .tab { padding: .4em .9em; }
        .ts .th, .ts .tr { display: grid; grid-template-columns: 1.15fr .8fr 1.6fr; gap: .6em; align-items: center; }
        .ts .th { font-size: .7em; color: var(--muted); padding: .3em .4em; border-bottom: 1px solid var(--border); }
        .ts .tr { padding: .5em .4em; border-bottom: 1px solid var(--border); border-radius: 8px; transition: background .3s, opacity .3s; }
        .ts .tr:last-child { border-bottom: none; }
        .ts .tr.on { background: color-mix(in srgb, var(--accent) 10%, transparent); }
        .ts .tr.later { opacity: .4; }
        .ts .tr .o { font-weight: 700; }
        .ts .tr .m { color: var(--muted); font-size: .9em; }
        .ts .sdd { display: grid; grid-template-columns: repeat(3, 1fr); gap: .8em; transition: background .3s; }
        .ts .sdd.on { background: color-mix(in srgb, var(--accent) 7%, var(--sunken)); }
        .ts .sdd > div { display: flex; flex-direction: column; gap: .1em; }
        .ts .sdd b { color: var(--accent); }
        .ts .sdd span { color: var(--muted); font-size: .9em; }
        .ts .sdd code { font-size: .72em; margin-top: .3em; opacity: 0; transition: opacity .3s; white-space: nowrap; }
        .ts .sdd.on code { opacity: 1; }
        .ts .viz { flex: 1; min-height: 0; display: flex; flex-direction: column; padding: .4em .6em; }
        .ts .viz svg { flex: 1; min-height: 0; width: 100%; overflow: visible; }
        .ts .back { fill: var(--sunken); stroke: var(--line-2); stroke-width: 1.2; transition: all .5s; }
        .ts .c { stroke: var(--bg); stroke-width: .5; transition: fill .4s; }
        .ts .c.hl { stroke: var(--focus); stroke-width: 2.5; }
        .ts .ct { font-family: var(--mono); font-size: 15px; fill: var(--fg); text-anchor: middle; }
        .ts .ct.dg, .ts .tl.dg { fill: var(--digit); }
        .ts .ct.ninf { fill: var(--bad); font-size: 11px; }
        .ts .tl { font-family: var(--mono); font-size: 18px; fill: var(--muted); }
        .ts .ax path { stroke: var(--accent); stroke-width: 2.5; fill: none; }
        .ts .ah { fill: var(--accent); }
        .ts .ax text { font-size: 19px; fill: var(--accent); }
        .ts .ax text.n { font-family: var(--mono); font-size: 17px; }
        .ts .ex { font-size: 18px; fill: var(--muted); }
        .ts .shape { font-family: var(--mono); font-size: 30px; font-weight: 700; fill: var(--accent); }
        .ts .cap { font-size: .9em; min-height: 1.5em; }
        .ts .cap b { color: var(--fg); }
        .ts .rc { align-self: flex-start; margin-top: .3em; }
        .ts .q { opacity: .35; transition: opacity .3s; }
        .ts .q.on { opacity: 1; }
        .ts .qq { font-weight: 700; font-size: 1.05em; margin-top: .3em; color: var(--fg); }
        .ts .ans { margin-top: .3em; opacity: 0; transition: opacity .35s; color: var(--muted); }
        .ts .ans.on { opacity: 1; }
      `}</style>
    </div>
  );
}
