/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from '../deck/hooks';
import { Bars, Strip, useData } from './viz';

/**
 * The real residual stream of the 2-layer lookup model on a2f5c9d3f (public/data/resid.json, from export.py).
 * One row per position, 32 numbers each.
 *   0 x0 = tok_emb + pos_emb
 *   1 + what layer 0's head adds = x1 (with where the head looked hardest)
 *   2 + what layer 1's head adds = x2
 *   3 the unembedding reads the last row only
 */
type D = {
  toks: string[]; stages: number[][][]; writes: number[][][]; attn: number[][][];
  probs: number[]; vocab: string[];
};
const SCALE = 1.5; // one color scale for every strip, so sizes compare across columns
const CAPS = [
  <>each row is one position's stream: 32 numbers. it starts as <code>tok_emb + pos_emb</code></>,
  <>layer 0's head adds something to every row. <span class="muted">(→ marks where each position's head looked hardest)</span></>,
  <>layer 1's head adds again. the row keeps everything that was added</>,
  <>the unembedding reads only the last row</>,
];

export default function ResidReal() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<D>('resid');
  if (!d) return <div ref={root} />;
  const T = d.toks.length, last = T - 1;
  const top = d.probs.map((p, i) => [p, i]).sort((a, b) => b[0] - a[0]).slice(0, 3);
  const looked = (l: number, i: number) => {
    const row = d.attn[l][i];
    const j = row.indexOf(Math.max(...row));
    return <span class="lk">→ {d.toks[j]} <span class="muted">{row[j].toFixed(2)}</span></span>;
  };
  const cell = (on: boolean, i: number, v: number[], extra?: ComponentChildren) => (
    <div class={`cell fade ${on ? 'on' : ''}`}>
      <Strip values={v} scale={SCALE} height={step >= 3 && i === last ? 30 : 20} label={`pos ${i}`} />
      {extra}
    </div>
  );

  return (
    <div class="rr" ref={root}>
      <div class="grid">
        <div />
        <div class="h">x₀ = tok + pos</div>
        <div class={`h op fade ${step >= 1 ? 'on' : ''}`}>+</div>
        <div class={`h fade ${step >= 1 ? 'on' : ''}`}>layer 0 adds</div>
        <div class={`h op fade ${step >= 1 ? 'on' : ''}`}>=</div>
        <div class={`h fade ${step >= 1 ? 'on' : ''}`}>x₁</div>
        <div class={`h op fade ${step >= 2 ? 'on' : ''}`}>+</div>
        <div class={`h fade ${step >= 2 ? 'on' : ''}`}>layer 1 adds</div>
        <div class={`h op fade ${step >= 2 ? 'on' : ''}`}>=</div>
        <div class={`h fade ${step >= 2 ? 'on' : ''}`}>x₂</div>
        {d.toks.map((t, i) => {
          const dim = step >= 3 && i !== last ? 'dim' : '';
          return (
            <>
              <div class={`t ${/\d/.test(t) ? 'dg' : ''} ${dim}`}>{t}</div>
              <div class={dim}>{cell(true, i, d.stages[0][i])}</div>
              <div class={`op fade ${step >= 1 ? 'on' : ''} ${dim}`}>+</div>
              <div class={dim}>{cell(step >= 1, i, d.writes[0][i], looked(0, i))}</div>
              <div class={`op fade ${step >= 1 ? 'on' : ''} ${dim}`}>=</div>
              <div class={dim}>{cell(step >= 1, i, d.stages[1][i])}</div>
              <div class={`op fade ${step >= 2 ? 'on' : ''} ${dim}`}>+</div>
              <div class={dim}>{cell(step >= 2, i, d.writes[1][i], looked(1, i))}</div>
              <div class={`op fade ${step >= 2 ? 'on' : ''} ${dim}`}>=</div>
              <div class={dim}>{cell(step >= 2, i, d.stages[2][i])}</div>
            </>
          );
        })}
      </div>
      <div class="foot">
        <div class="caption cap">{CAPS[Math.min(step, CAPS.length - 1)]}</div>
        <div class={`out fade ${step >= 3 ? 'on' : ''}`}>
          <span class="muted">unembed(x₂[{last}]) →</span>
          <Bars values={top.map(([p]) => p)} labels={top.map(([, i]) => d.vocab[i])} max={1}
            fmtV={(v) => `${(v * 100).toFixed(v > 0.999 ? 2 : 1)}%`} width={160} hl={0} />
        </div>
      </div>
      <style>{`
        .rr { display: flex; flex-direction: column; gap: .8em; font-size: .8em; }
        .rr .grid { display: grid; grid-template-columns: 1.5em repeat(2, 1fr auto) 1fr auto 1fr auto 1fr; gap: 5px .5em; align-items: center; }
        .rr .h { font-family: var(--mono); font-size: .7em; color: var(--muted); text-align: center; }
        .rr .op { font-family: var(--mono); color: var(--muted); text-align: center; }
        .rr .t { font-family: var(--mono); font-size: 1.1em; text-align: center; }
        .rr .t.dg { color: var(--hot); }
        .rr .dim { opacity: .2; transition: opacity .4s; }
        .rr .cell { display: flex; align-items: center; gap: .4em; }
        .rr .cell .strip { flex: 1; min-width: 0; transition: height .3s; }
        .rr .lk { font-family: var(--mono); font-size: .65em; white-space: nowrap; width: 4.5em; }
        .rr .foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 2em; }
        .rr .cap { font-size: .9em; }
        .rr .out { display: flex; align-items: center; gap: .8em; font-family: var(--mono); font-size: .8em; }
        .rr code { white-space: nowrap; font-family: var(--mono); color: var(--fg); }
      `}</style>
    </div>
  );
}
