/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Tok, sequential, useData } from './viz';

/**
 * Logit lens: run the final norm + unembed on the residual stream after *every* block,
 * as if the model stopped there. Last token ' to'. Step 1 reveals layer by layer.
 */
export default function LogitLens() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const lens = d.logit_lens as { tok: string; p: number }[][];

  return (
    <div class="ll" ref={root}>
      {lens.map((top, l) => (
        <div class={`lr ${step >= 1 ? 'on' : ''}`} style={{ transitionDelay: `${l * 90}ms` }}>
          <span class="ln">after block {l}</span>
          {top.map((t, k) => (
            <span class={`chip ${k ? 'alt' : ''} ${!k && t.p > 0.5 ? 'light' : ''}`} style={{ background: k ? undefined : sequential(0.15 + t.p) }}>
              <Tok t={t.tok} /> <span class="p">{t.p.toFixed(2)}</span>
            </span>
          ))}
        </div>
      ))}
      <style>{`
        .ll { font-size: .75em; display: flex; flex-direction: column; gap: .25em; }
        .ll .lr { display: grid; grid-template-columns: 6em 12em 12em 12em; gap: .6em; align-items: center;
          opacity: .12; transition: opacity .4s; }
        .ll .lr:first-child, .ll .lr.on { opacity: 1; }
        .ll .ln { color: var(--muted); font-size: .8em; text-align: right; }
        .ll .chip { justify-content: space-between; }
        .ll .chip.alt { opacity: .55; }
        .ll .p { font-size: .75em; color: var(--muted); margin-left: .6em; }
        .ll .chip:not(.alt) .p { color: var(--fg); }
        .ll .chip.light, .ll .chip.light .p, .ll .chip.light .sp { color: var(--bg); }
      `}</style>
    </div>
  );
}
