/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { HeatCanvas, Shape, Strip, Tok, sequential, useData } from './viz';

/**
 * embed_positions: one learned vector per position (1024 x 768). Steps:
 *  1. the channels of embed_positions that vary most, plotted against position: smooth waves, learned not designed
 *  2. cosine similarity between positions: nearby positions look alike
 *  3. x = tok_emb + pos_emb, for one token
 */
const W = 520, H = 170;
const LINE = ['#3987e5', '#d95926', '#199e70', '#9085e9'];

export default function PosEmbed() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('embed');
  if (!d) return <div ref={root} />;
  const dims = Object.keys(d.wpe_dims);
  const all = dims.flatMap((k) => d.wpe_dims[k] as number[]);
  const lo = Math.min(...all), hi = Math.max(...all);
  const path = (ys: number[]) => ys.map((y, i) => `${(i / (ys.length - 1)) * W},${H - ((y - lo) / (hi - lo)) * H}`).join(' ');
  const i = 1; // token shown in the sum: ' Mary'
  const S = d.ids.length;

  return (
    <div class="pe" ref={root}>
      <div class="top">
        <div class={`fade ${step >= 1 ? 'on' : ''}`}>
          <svg width={W} height={H + 20} viewBox={`0 0 ${W} ${H + 20}`}>
            <line x1="0" x2={W} y1={H - ((0 - lo) / (hi - lo)) * H} y2={H - ((0 - lo) / (hi - lo)) * H} stroke="var(--border)" />
            {dims.map((k, j) => <polyline points={path(d.wpe_dims[k])} fill="none" stroke={LINE[j]} stroke-width="2" />)}
            <text x="0" y={H + 16} fill="var(--muted)" font-size="12">position 0</text>
            <text x={W} y={H + 16} fill="var(--muted)" font-size="12" text-anchor="end">1023</text>
          </svg>
          <div class="legend">embed_positions{dims.map((k, j) => <span><i style={{ background: LINE[j] }} />[:, {k}]</span>)}</div>
        </div>
        <div class={`fade ${step >= 2 ? 'on' : ''}`}>
          <HeatCanvas data={d.wpe_cos} size={200} color={(v) => sequential((v + 0.2) / 1.2)}
            tipFn={(r, c, v) => `cos(pos ${d.wpe_pos[r]}, pos ${d.wpe_pos[c]}) = <b>${v.toFixed(2)}</b>`} />
          <div class="lbl">cos(pos i, pos j), i, j ∈ 0…1023</div>
        </div>
      </div>

      <div class={`sum fade ${step >= 3 ? 'on' : ''}`}>
        <span class="k">tok_emb[<Tok t={d.toks[i]} />]</span><Strip values={d.tok_emb[i]} scale={0.25} /><Shape dims={[1, S, 768]} />
        <span class="k">+ pos_emb[{i}]</span><Strip values={d.pos_emb[i]} scale={0.25} /><Shape dims={[S, 768]} />
        <span class="k">= x</span><Strip values={d.embed[i]} scale={0.25} /><Shape dims={[1, S, 768]} names={['B', 'S', 'D']} />
      </div>
      <style>{`
        .pe { display: flex; flex-direction: column; gap: 1.2em; font-size: .8em; }
        .pe .top { display: flex; gap: 3em; align-items: flex-end; }
        .pe .legend { display: flex; gap: 1em; white-space: nowrap; font-size: .59em; color: var(--muted); font-family: var(--mono); }
        .pe .legend i { display: inline-block; width: 10px; height: 3px; margin-right: 5px; vertical-align: middle; border-radius: 2px; }
        .pe .sum { display: grid; grid-template-columns: auto 1fr auto; gap: .4em 1em; align-items: center; font-size: .7em; }
        .pe .sum .k { text-align: right; white-space: nowrap; font-family: var(--mono); font-size: .8em; }
      `}</style>
    </div>
  );
}
