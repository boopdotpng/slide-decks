/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Heatmap, Tok, sequential, useData } from './viz';

/**
 * Where all 12 heads of a block look, from the last token ' to'. Each row is one head's softmax, the same
 * thing as the softmax column on the q·k slide, turned sideways. Each press moves to a later block; at
 * block 10, head 7's row is the one computed on the q·k slide.
 */
const LAYERS = [0, 4, 8, 10, 11];

export default function DecodeHeads() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const L = LAYERS[Math.min(step, LAYERS.length - 1)];
  const P: number[][] = d.all_probs[L];
  const toks: string[] = d.toks;
  const [FL, FH] = d.focus;

  return (
    <div class="dh" ref={root}>
      <div class="layers">
        {LAYERS.map((l) => <span class={l === L ? 'on' : ''}>block {l}</span>)}
      </div>
      <Heatmap data={P} cell={34} color={(v) => sequential(Math.sqrt(v))}
        rowLabels={P.map((_, h) => <span class={L === FL && h === FH ? 'focus' : ''}>{L === FL && h === FH ? 'the q·k slide → ' : ''}head {h}</span>)}
        colLabels={toks.map((t) => <Tok t={t} />)} hlRow={L === FL ? FH : undefined}
        tipFn={(h, j, v) => `block ${L} head ${h}: ' to' → '${toks[j].trim()}' = <b>${v!.toFixed(3)}</b>`} />
      <div class="lbl">each row: one head's softmax from <Tok t={toks[toks.length - 1]} /> (sums to 1) · each square: how much that head looks at that token · brighter = more</div>
      <style>{`
        .dh { font-size: .8em; display: flex; flex-direction: column; gap: .6em; }
        .dh .layers + * { margin-top: 1.2em; }
        .dh .layers { display: flex; gap: 1.6em; font-size: .75em; color: #444; font-family: var(--mono); }
        .dh .layers .on { color: var(--accent); }
        .dh .focus { color: var(--accent); }
        .dh .heat .hc.on { outline-color: var(--accent); }
      `}</style>
    </div>
  );
}
