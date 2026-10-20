/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Heatmap, Tok, sequential, useData } from './viz';

/**
 * A few heads with a recognizable job, each its own press. All real attention
 * patterns from the two exported prompts.
 */
const HEADS = [
  { src: 'prefill', L: 4, H: 11, name: 'previous token', note: 'every token looks one step back' },
  { src: 'prefill', L: 0, H: 1, name: 'same token', note: "' John' finds the earlier ' John', ' to' the earlier ' to'" },
  { src: 'repeat', L: 5, H: 1, name: 'induction', note: 'seen this before? look at what came next last time' },
  { src: 'prefill', L: 10, H: 7, name: 'looks at the answer', note: "' to' → ' Mary', then pushes against it" },
];

export default function HeadGallery() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const pre = useData('prefill');
  const rep = useData('repeat');
  if (!pre || !rep) return <div ref={root} />;
  const h = HEADS[Math.min(step, HEADS.length - 1)];
  const d = h.src === 'prefill' ? pre : rep;
  const P: number[][] = d.probs[h.L][h.H];
  const labels = d.toks.map((t: string) => <Tok t={t} />);

  return (
    <div class="hg" ref={root}>
      <Heatmap data={P.map((row, r) => row.map((v, c) => (c > r ? null : v)))} cell={27}
        rowLabels={labels} colLabels={labels} color={(v) => sequential(Math.sqrt(v))}
        tipFn={(r, c, v) => `'${d.toks[r].trim()}' → '${d.toks[c].trim()}' = <b>${v === null ? '—' : v.toFixed(3)}</b>`} />
      <div class="side">
        <div class="tabs">
          {HEADS.map((x) => <span class={x === h ? 'on' : ''}>{x.name}</span>)}
        </div>
        <div class="hn">block {h.L} · head {h.H}</div>
        <div class="note muted">{h.note}</div>
      </div>
      <style>{`
        .hg { font-size: .8em; display: flex; gap: 2.5em; align-items: flex-end; padding-top: 2em; }
        .hg .side { display: flex; flex-direction: column; gap: .5em; padding-bottom: 1em; max-width: 15em; }
        .hg .tabs { display: flex; flex-direction: column; gap: .2em; font-size: .75em; color: #444; }
        .hg .tabs .on { color: var(--accent); }
        .hg .hn { font-family: var(--mono); font-size: .8em; margin-top: .6em; }
        .hg .note { font-size: .75em; }
      `}</style>
    </div>
  );
}
