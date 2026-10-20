/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Bars, Shape, Strip, Tok, sequential, useData } from './viz';

/**
 * Last token's final hidden state -> score for every vocab entry -> distribution.
 * Steps: 1. @ wte.T (logits)  2. softmax, top 10
 */
export default function Unembed() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const S = d.toks.length; // a full pass: every position. the strips show the last one
  const top = d.top as { tok: string; logit: number; p: number }[];
  const ls = d.logits_stats;

  return (
    <div class="ue" ref={root}>
      <div class="row">
        <span class="k">norm(x)</span>
        <Strip values={d.norm} scale={3} height={24} label="norm" />
        <Shape dims={[S, 768]} names={['S', 'D']} />
      </div>
      <div class={`row fade ${step >= 1 ? 'on' : ''}`}>
        <span class="k">@ wte.T</span>
        <span class="mid"><Shape dims={[768, 50257]} /> <span class="muted">same matrix as the input embedding</span></span>
        <Shape dims={[S, 50257]} names={['S', 'V']} hl={[1]} />
      </div>
      <div class={`row fade ${step >= 1 ? 'on' : ''}`}>
        <span class="k">logits</span>
        <span class="mid muted">min {ls.min} · mean {ls.mean} · max {ls.max}</span>
        <span />
      </div>
      <div class={`dist fade ${step >= 2 ? 'on' : ''}`}>
        <div class="lbl">softmax → top 10 of 50,257</div>
        <Bars values={top.map((t) => t.p)} labels={top.map((t) => <Tok t={t.tok} />)} max={top[0].p} width={420} hl={0}
          color={(v) => sequential(0.4 + v)} fmtV={(v) => v.toFixed(3)} />
      </div>
      <style>{`
        .ue { font-size: .8em; display: flex; flex-direction: column; gap: .7em; }
        .ue .row { display: grid; grid-template-columns: 12em 1fr auto; gap: 1em; align-items: center; }
        .ue .k { font-family: var(--mono); font-size: .72em; text-align: right; white-space: nowrap; }
        .ue .mid { font-size: .75em; }
        .ue .shape { font-size: .7em; }
        .ue .dist { margin-left: 13em; margin-top: .4em; }
        .ue .dist .bars { font-size: .75em; }
      `}</style>
    </div>
  );
}
