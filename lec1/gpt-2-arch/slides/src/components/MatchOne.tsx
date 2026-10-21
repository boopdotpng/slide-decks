/** @jsxImportSource preact */
import { Heatmap, Tok, at, diverging, fmt, useIsland } from './viz';
import { LENS } from './common';

/**
 * Matching two tokens: " of"'s looking-for strip against " States"'s advertise strip, cell by cell.
 *  0 the two strips   1 multiply each pair of cells (red = they agree, blue = they disagree)   2 add it all up: one score
 */
const CELL = 15;
export default function MatchOne() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length, J = 2; // ' States'
  const q: number[] = d.lenses.q.out[S - 1], k: number[] = d.lenses.k.out[J];
  const prod = q.map((v, i) => v * k[i]);
  const row = (vals: number[], sc: number) => (
    <Heatmap data={[vals]} cell={CELL} gap={1} color={(v) => diverging(v, sc)} tipFn={(_, c, v) => `[${c}] = <b>${fmt(v ?? 0)}</b>`} />
  );
  return (
    <div class="m1" ref={root}>
      <div class="r"><span class="k" style={{ color: LENS.q.color }}><Tok t={d.toks[S - 1]} /> · {LENS.q.plain}</span>{row(q, 2)}</div>
      <div class="r"><span class="k" style={{ color: LENS.k.color }}><Tok t={d.toks[J]} /> · {LENS.k.plain}</span>{row(k, 2)}</div>
      <div class={`r ${at(step, 1)}`}><span class="k">× cell by cell</span>{row(prod, 4)}</div>
      <div class={`sum ${at(step, 2)}`}>
        <span class="k">add them all up</span>
        <span class="v">{fmt(d.dots[S - 1][J], 1)}</span>
        <span class="muted">one number: how well <Tok t={d.toks[J]} /> matches what <Tok t={d.toks[S - 1]} /> is looking for</span>
      </div>
      <div class={`cap ${at(step, 2)}`}>
        the same move as the grid: multiply pairs, add up. negative is fine, it's the <b>gaps</b> between the four scores that matter (next slide)
      </div>
      <style>{`
        .m1 { display: flex; flex-direction: column; gap: .8em; font-size: .8em; }
        .m1 .r, .m1 .sum { display: grid; grid-template-columns: 13em auto; gap: 1em; align-items: center; }
        .m1 .k { text-align: right; font-size: .62em; white-space: nowrap; color: var(--muted); }
        .m1 .heat { height: 34px; grid-auto-rows: 34px !important; }
        .m1 .sum { grid-template-columns: 13em auto 1fr; margin-top: .6em; }
        .m1 .sum .v { font-family: var(--mono); font-size: 1.4em; color: var(--accent); }
        .m1 .sum .muted { font-size: .6em; }
        .m1 .cap { margin-top: 1em; font-size: .62em; color: var(--muted); }
        .m1 .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
