/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Shape, Strip, useData } from './viz';

/**
 * The MLP on the real layer-10 activations. Steps:
 *  1. up_proj: 768 -> 3072   2. gelu (most neurons are negative and get squashed)   3. down_proj: 3072 -> 768, add to x
 */
const gelu = (x: number) => 0.5 * x * (1 + Math.tanh(0.7978845608 * (x + 0.044715 * x ** 3)));
const W = 160, H = 90;

export default function MLPViz() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const S = d.toks.length; // a full pass: every position. the strips show the last one
  const st = d.stages;
  const pre: number[] = st['mlp.up'];
  const off = pre.filter((v) => v < 0).length / pre.length;
  const pts = Array.from({ length: 81 }, (_, i) => {
    const x = -4 + i * 0.1;
    return `${((x + 4) / 8) * W},${H - ((gelu(x) + 0.5) / 4.5) * H}`;
  }).join(' ');

  const rows = [
    { k: 'post_attention_layernorm(x)', v: st.post_attention_layernorm, s: [1, S, 768], on: 0, sc: 1 },
    { k: 'up_proj', v: st['mlp.up'], s: [1, S, 3072], on: 1, sc: 2 },
    { k: 'gelu', v: st['mlp.hidden'], s: [1, S, 3072], on: 2, sc: 2 },
    { k: 'down_proj', v: st['mlp.out'], s: [1, S, 768], on: 3, sc: 6 },
    { k: 'x + mlp(…)', v: st.resid_out, s: [1, S, 768], on: 3, sc: 6 },
  ];

  return (
    <div class="mlp" ref={root}>
      <div class="rows">
        {rows.map((r) => (
          <div class={`mr fade ${step >= r.on ? 'on' : ''}`}>
            <span class="k">{r.k}</span>
            <div style={{ width: `${(r.v.length / 3072) * 100}%` }}><Strip values={r.v} scale={r.sc} height={24} label={r.k} /></div>
            <Shape dims={r.s} />
          </div>
        ))}
      </div>
      <div class={`side fade ${step >= 2 ? 'on' : ''}`}>
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
          <line x1="0" x2={W} y1={H - (0.5 / 4.5) * H} y2={H - (0.5 / 4.5) * H} stroke="var(--border)" />
          <line x1={W / 2} x2={W / 2} y1="0" y2={H} stroke="var(--border)" />
          <polyline points={pts} fill="none" stroke="var(--accent)" stroke-width="2" />
        </svg>
        <div class="lbl">gelu(x)</div>
        <div class="big">{Math.round(off * 100)}%</div>
        <div class="lbl">of 3072 neurons negative → squashed to ≈ 0</div>
      </div>
      <style>{`
        .mlp { font-size: .8em; display: flex; gap: 2em; align-items: center; }
        .mlp .rows { display: flex; flex-direction: column; gap: .9em; flex: 1; }
        .mlp .mr { display: grid; grid-template-columns: 12em 1fr auto; gap: 1em; align-items: center; }
        .mlp .k { font-family: var(--mono); font-size: .72em; text-align: right; }
        .mlp .shape { font-size: .75em; }
        .mlp .side { display: flex; flex-direction: column; align-items: center; gap: .2em; }
        .mlp .big { font-size: 1.6em; font-weight: 700; color: var(--accent); margin-top: .4em; }
      `}</style>
    </div>
  );
}
