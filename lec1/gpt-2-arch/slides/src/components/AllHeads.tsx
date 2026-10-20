/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { HeatCanvas, Tok, sequential, useData } from './viz';

/** All 144 attention patterns at once. Step 1 swaps to the repeated-text prompt. */
const TILE = 50;

export default function AllHeads() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const pre = useData('prefill');
  const rep = useData('repeat');
  if (!pre || !rep) return <div ref={root} />;
  const d = step >= 1 ? rep : pre;
  const color = (v: number) => sequential(Math.sqrt(v));

  return (
    <div class="ah" ref={root}>
      <div class="grid">
        <div />
        {Array.from({ length: 12 }, (_, h) => <div class="hl">{h}</div>)}
        {d.probs.map((layer: number[][][], l: number) => <>
          <div class="ll">block {l}</div>
          {layer.map((P, h) => (
            <HeatCanvas data={P} w={TILE} h={TILE} color={color}
              tipFn={(r, c, v) => `block ${l} head ${h}<br>'${d.toks[r].trim()}' → '${d.toks[c].trim()}' = <b>${v.toFixed(2)}</b>`} />
          ))}
        </>)}
      </div>
      <div class="side">
        <div class="lbl">block ↓ · head →</div>
        <div class="p">{d.toks.map((t: string) => <Tok t={t} />)}</div>
      </div>
      <style>{`
        .ah { display: flex; gap: 2em; align-items: center; }
        .ah .grid { display: grid; grid-template-columns: auto repeat(12, ${TILE}px); gap: 5px; }
        .ah .hl, .ah .ll { font-size: 15px; color: var(--muted); text-align: center; align-self: center; }
        .ah .ll { text-align: right; padding-right: .4em; }
        .ah .side { max-width: 14em; display: flex; flex-direction: column; gap: .6em; }
        .ah .p { font-size: .65em; line-height: 1.6; }
      `}</style>
    </div>
  );
}
