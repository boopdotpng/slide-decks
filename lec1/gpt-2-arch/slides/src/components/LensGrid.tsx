/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Tok, sequential, useData } from './viz';

/**
 * Logit lens over the whole prompt: for every layer and position, the top
 * next-token guess. Prefill gets a prediction at every position for free.
 * Step 1 adds the row of tokens that actually came next.
 */
export default function LensGrid() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('prefill');
  if (!d) return <div ref={root} />;
  const S = d.toks.length;
  const lens = d.logit_lens as { tok: string; p: number }[][][]; // (layers, S, 1)
  const actual = [...d.toks.slice(1), '?'];

  return (
    <div class="lg" ref={root}>
      <div class="g" style={{ gridTemplateColumns: `auto repeat(${S}, 1fr)` }}>
        <div />
        {d.toks.map((t: string) => <div class="hd"><Tok t={t} /></div>)}
        {lens.map((row, l) => <>
          <div class="ln">block {l}</div>
          {row.map(([top]) => (
            <div class="c" style={{ background: sequential(0.1 + top.p * 0.8), color: top.p > 0.55 ? 'var(--bg)' : undefined }}
              title={`${top.p.toFixed(2)}`}>
              <Tok t={top.tok} />
            </div>
          ))}
        </>)}
        <div class={`ln fade ${step >= 1 ? 'on' : ''}`}>next</div>
        {actual.map((t, i) => {
          const hit = lens[lens.length - 1][i][0].tok === t;
          return <div class={`c act fade ${step >= 1 ? 'on' : ''} ${hit ? 'hit' : ''}`}><Tok t={t} /></div>;
        })}
      </div>
      <style>{`
        .lg { font-size: .8em; }
        .lg .g { display: grid; gap: 2px; font-size: .55em; }
        .lg .hd { text-align: center; color: var(--fg); padding-bottom: .4em; overflow: hidden; }
        .lg .ln { color: var(--muted); text-align: right; padding-right: .6em; align-self: center; }
        .lg .c { padding: .25em .2em; border-radius: 3px; text-align: center; overflow: hidden; white-space: nowrap; }
        .lg .act { background: var(--panel); margin-top: 4px; border: 1px solid var(--border); }
        .lg .act.hit { border-color: var(--accent); }
      `}</style>
    </div>
  );
}
