/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import SplitHeads from './SplitHeads';
import { useSlideStep } from '../deck/hooks';
import { Shape, Strip, useData } from './viz';

/**
 * 12 head outputs -> concat -> o_proj -> added to the residual stream (layer 10).
 * Steps: 1. concat (heads back into one row)  2. o_proj  3. x + self_attn(...)
 */
export default function OutProj() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const S = d.toks.length; // a full pass: every position. the strips show the last one
  const st = d.stages;
  const rows = [
    { k: 'o_proj(concat)', v: st['self_attn.out'], s: [1, S, 768], n: 'attn out', on: 2 },
    { k: 'x (residual)', v: st.resid_in, s: [1, S, 768], n: '', on: 3 },
    { k: 'x + attn out', v: st.resid_mid, s: [1, S, 768], n: '', on: 3 },
  ];

  return (
    <div class="op2" ref={root}>
      <div class="hrow">
        <span class="k">{step >= 1 ? 'concat' : 'head outs'}</span>
        <SplitHeads values={st['self_attn.head_out'].flat()} heads={step < 1} width={768} rowH={14} scale={1.2} label="out" />
        <span>{step >= 1 ? <Shape dims={[1, S, 768]} names={['B', 'S', 'D']} /> : <Shape dims={[1, 12, S, 64]} names={['B', 'H', 'S', 'd']} />}</span>
      </div>
      {rows.map((r) => (
        <div class={`hrow fade ${step >= r.on ? 'on' : ''}`}>
          <span class="k">{r.k}</span>
          <Strip values={r.v} scale={6} height={22} label={r.k} />
          <Shape dims={r.s} />
        </div>
      ))}
      <style>{`
        .op2 { font-size: .8em; display: flex; flex-direction: column; gap: .8em; }
        .op2 .hrow { display: grid; grid-template-columns: 8em 768px auto; gap: 1em; align-items: center; }
        .op2 .k { font-family: var(--mono); font-size: .72em; text-align: right; }
        .op2 .shape { font-size: .75em; }
      `}</style>
    </div>
  );
}
