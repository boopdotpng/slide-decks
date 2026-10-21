/** @jsxImportSource preact */
import { Chip, Strip, at, pct, rms, useIsland } from './viz';
import { LENS } from './common';

/**
 * Copying: each token's hand-over strip, turned down to its share of the budget, then all added up.
 *  0 the hand-over strips and the budget   1 each scaled by its share   2 added up: what this head brings back to " of"
 */
export default function Copy() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length, me = S - 1;
  const V: number[][] = d.lenses.v.out, p: number[] = d.probs[me];
  const sc = 2 * rms(V.flat());
  const out: number[] = d.head_out[me];
  return (
    <div class="cp" ref={root}>
      <div class="hdr"><span /><span class="muted">budget</span><span class="muted" style={{ color: LENS.v.color }}>{LENS.v.plain}</span></div>
      {d.toks.map((t: string, j: number) => (
        <div class="row">
          <Chip t={t} />
          <span class="p">{pct(p[j])}</span>
          <Strip values={step >= 1 ? V[j].map((v) => v * p[j]) : V[j]} scale={sc} height={30} />
        </div>
      ))}
      <div class={`row sum ${at(step, 2)}`}>
        <span class="k">all added up</span><span />
        <Strip values={out} scale={sc} height={44} />
      </div>
      <div class="cap">
        {[<>every token's third strip: what it hands over if it's picked</>,
          <>turn each one down to its share of the budget</>,
          <>add them up. it's mostly <Chip t={d.toks[2]} />'s strip: that's what this head brings back to <Chip t={d.toks[me]} /></>][Math.min(step, 2)]}
      </div>
      <style>{`
        .cp { display: flex; flex-direction: column; gap: .6em; font-size: .8em; }
        .cp .hdr, .cp .row { display: grid; grid-template-columns: 7em 4em 1fr; gap: 1em; align-items: center; }
        .cp .hdr > * { font-size: .55em; }
        .cp .row .chip { justify-self: end; font-size: .8em; }
        .cp .p { font: .65em var(--mono); color: var(--accent); }
        .cp .row canvas { transition: none; }
        .cp .sum { margin-top: .8em; padding-top: .8em; border-top: 1px solid var(--border); }
        .cp .sum .k { text-align: right; font-size: .6em; color: var(--muted); }
        .cp .cap { margin-top: .8em; font-size: .7em; color: var(--muted); min-height: 1.6em; }
      `}</style>
    </div>
  );
}
