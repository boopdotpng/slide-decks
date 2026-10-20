/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Heatmap, Shape, Tok, diverging, sequential, useData } from './viz';

/**
 * scores -> causal mask -> softmax, on the real layer-10 head-7 matrix.
 * Steps: 1. mask the future (-inf)  2. softmax per row  3. last row == the row followed through one pass
 */
const CAP = [
  'scores, every query vs every key',
  'causal mask: position i may only see keys ≤ i  (−∞)',
  'softmax along each row',
  'last row = exactly the row we followed through the model',
];

export default function MaskSoftmax() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('prefill');
  if (!d) return <div ref={root} />;
  const [L, H] = d.focus;
  const S = d.toks.length;
  const scores: number[][] = d.scores[L][H];
  const probs: number[][] = d.probs[L][H];
  const data = (step >= 2 ? probs : scores).map((row, r) => row.map((v, c) => (step >= 1 && c > r ? null : v)));
  const labels = d.toks.map((t: string) => <Tok t={t} />);

  return (
    <div class="ms" ref={root}>
      <Heatmap data={data} cell={27} rowLabels={labels} colLabels={labels}
        color={(v) => (step >= 2 ? sequential(Math.sqrt(v)) : diverging(v, 4))}
        hlRow={step >= 3 ? S - 1 : undefined}
        tipFn={(r, c, v) => `'${d.toks[r].trim()}' → '${d.toks[c].trim()}' = <b>${v === null ? '−∞' : v.toFixed(3)}</b>`} />
      <div class="side">
        <div class="cap">{CAP[step]}</div>
        <div class="lbl">{step >= 2 ? 'probs' : step >= 1 ? 'scores + mask' : 'scores'}</div>
        <Shape dims={[1, 12, S, S]} names={['B', 'H', 'S', 'T']} />
        <div class="lbl">block {L} head {H}</div>
      </div>
      <style>{`
        .ms { font-size: .8em; display: flex; gap: 2.5em; align-items: flex-end; padding-top: 2em; }
        .ms .side { display: flex; flex-direction: column; gap: .4em; padding-bottom: 1em; max-width: 14em; }
        .ms .cap { font-size: .7em; min-height: 3em; }
        .ms .heat .hc.on { outline-color: var(--accent); }
        .ms .shape { font-size: .7em; }
      `}</style>
    </div>
  );
}
