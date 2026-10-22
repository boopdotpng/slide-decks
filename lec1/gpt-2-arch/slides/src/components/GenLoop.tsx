/** @jsxImportSource preact */
import { Tok, useIsland } from './viz';

/**
 * Generation as a loop: the sequence goes in, one token comes out and is appended. Real greedy steps.
 * Shown twice: early, plain (every step runs the whole sequence), and after the kv cache with
 * `split`: the first step is prefill, the rest are decode steps that only feed in the newest token.
 * Each press reveals the next step.
 */
export default function GenLoop({ split = false }: { split?: boolean }) {
  const { root, step, d } = useIsland('loop');
  if (!d) return <div ref={root} />;
  const toks: string[] = d.toks;
  const steps: { n: number; next: string }[] = d.steps;

  return (
    <div class={`gl ${split ? 'split' : ''}`} ref={root}>
      {steps.map((s, i) => {
        const decode = split && i > 0;
        return (
          <div class={`row ${step >= i ? 'on' : ''}`}>
            {split ? <span class={`kind ${decode ? 'muted' : 'accent'}`}>{decode ? 'one new token' : 'whole prompt'}</span> : <span />}
            <span class="seq">
              <span class={`old ${decode ? 'cached' : ''}`}>
                {toks.slice(0, decode ? s.n - 1 : s.n).map((t, j) => <span class={`chip ${!split && i > 0 && j >= steps[0].n ? 'added' : ''}`}><Tok t={t} /></span>)}
              </span>
              {decode && <span class="chip added"><Tok t={toks[s.n - 1]} /></span>}
            </span>
            <span class="via muted">→ model →</span>
            <span class="chip out"><Tok t={s.next} /></span>
          </div>
        );
      })}
      <div class={`cap muted fade ${step >= steps.length - 1 ? 'on' : ''}`}>
        {split
          ? <>same answer. the prompt goes in all at once, then each new token goes in alone and reads the cache</>
          : <>every step: the whole sequence in, one token out, append it, repeat</>}
      </div>
      <style>{`
        .gl { display: grid; grid-template-columns: auto auto auto auto; justify-content: start; gap: .7em .8em; align-items: center; font-size: .75em; }
        .gl .row { display: contents; }
        .gl .row > * { opacity: 0; transition: opacity .35s; }
        .gl .row.on > * { opacity: 1; }
        .gl .kind { text-align: right; font-size: .9em; }
        .gl .seq { display: flex; align-items: center; gap: .25em; }
        .gl .old { display: flex; flex-wrap: nowrap; gap: .25em; padding: .25em; border: 2px dashed transparent; border-radius: 8px; }
        .gl .old.cached { border-color: var(--line-2); }
        .gl .old.cached .chip { opacity: .4; }
        .gl .chip.added { color: var(--accent); }
        .gl .chip.out { color: var(--accent); font-weight: 700; }
        .gl .via { white-space: nowrap; font-size: .9em; }
        .gl .cap { grid-column: 1 / -1; margin-top: .6em; font-size: 1.15em; }
        .gl .out { justify-self: start; }
      `}</style>
    </div>
  );
}
