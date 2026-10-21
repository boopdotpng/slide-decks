/** @jsxImportSource preact */
import { Tok, pct, useIsland } from './viz';

/**
 * The guess after each block (the strip for " of", read out as if that block were the last).
 * Each press shows three more blocks: " the" → " course" → " America".
 */
export default function Stack() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const n = Math.min(12, 3 * (step + 1));
  const lens = d.lens as { tok: string; p: number }[][];
  return (
    <div class="sk" ref={root}>
      {lens.map((g, l) => {
        const changed = l > 0 && g[0].tok !== lens[l - 1][0].tok;
        return (
          <div class={`r ${l < n ? 'on' : ''} ${changed ? 'chg' : ''}`}>
            <span class="b muted">after block {l}</span>
            <span class="g"><Tok t={g[0].tok} /></span>
            <span class="bar"><span style={{ width: `${g[0].p * 100}%` }} /></span>
            <span class="p">{pct(g[0].p)}</span>
            <span class="rest muted">{g.slice(1, 3).map((x) => <><Tok t={x.tok} /> {pct(x.p)} </>)}</span>
          </div>
        );
      })}
      <style>{`
        .sk { display: grid; grid-template-columns: auto 7em 18em 3.5em auto; gap: .25em 1em; align-items: center; font-size: .7em; }
        .sk .r { display: contents; }
        .sk .r > * { opacity: 0; transition: opacity .35s; }
        .sk .r.on > * { opacity: 1; }
        .sk .b { font-size: .75em; text-align: right; }
        .sk .r.chg .g { color: var(--accent); font-weight: 700; }
        .sk .bar { height: .9em; background: #1a1a1a; border-radius: 4px; overflow: hidden; }
        .sk .bar span { display: block; height: 100%; background: var(--accent); }
        .sk .p { font: .8em var(--mono); }
        .sk .rest { font-size: .7em; }
      `}</style>
    </div>
  );
}
