/** @jsxImportSource preact */
import { Chip, Heatmap, Strip, Tok, at, fmt, pct, sequential, useIsland } from './viz';
import { LENS } from './common';

/**
 * " of" against every token it can see (itself included): a score each, then a budget that adds up to 100%.
 *  0 every token's advertise strip   1 the scores, on one line: only the gaps matter   2 the budget
 *  3 every token does the same: the full 4 × 4 pattern, with the future blocked
 */
export default function Budget() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length, me = S - 1;
  const sc: number[] = d.dots[me].map((v: number) => v / 8); // the slide calls this the score; ÷8 is in the notes
  const lo = Math.min(...sc) - 0.5, hi = Math.max(...sc) + 0.5;
  const P: number[][] = d.probs;
  const best = sc.indexOf(Math.max(...sc));
  return (
    <div class="bg" ref={root}>
      <div class="main">
      <div class="left">
        <div class="me"><span class="k" style={{ color: LENS.q.color }}><Tok t={d.toks[me]} /> is looking for</span>
          <Strip values={d.lenses.q.out[me]} height={26} /></div>
        <div class="hdr"><span /><span class="muted">{LENS.k.plain}</span>
          <span class={`muted ${at(step, 1)}`}>score ÷ 8 <span class="ax">worse ← → better</span></span>
          <span class={`muted ${at(step, 2)}`}>budget</span></div>
        {d.toks.map((t: string, j: number) => (
          <div class={`row ${step >= 2 && j === best ? 'top' : ''}`}>
            <Chip t={t} />
            <Strip values={d.lenses.k.out[j]} height={26} />
            <div class={`line ${at(step, 1)}`}><div class="dot" style={{ left: `${((sc[j] - lo) / (hi - lo)) * 100}%` }} />
              <span class="sv">{fmt(sc[j], 1)}</span></div>
            <div class={`bud ${at(step, 2)}`}><div class="fill" style={{ width: `${P[me][j] * 100}%` }} /><span>{pct(P[me][j])}</span></div>
          </div>
        ))}
      </div>
      <div class={`grid ${at(step, 3)}`}>
        <div class="lbl">every token does this. rows: who's looking · columns: who's looked at</div>
        <Heatmap data={P.map((r, i) => r.map((v, j) => (j > i ? null : v)))} cell={64} gap={4}
          color={(v) => sequential(Math.sqrt(v))} rowLabels={d.toks.map((t: string) => <Tok t={t} />)}
          colLabels={d.toks.map((t: string) => <Tok t={t} />)} hlRow={me}
          tipFn={(r, c, v) => (v === null ? 'the future: blocked' : `${pct(v)}`)} />
        <div class="lbl">striped: the future. a token can't look at words that come after it</div>
      </div>
      </div>
      <div class="cap">
        {[<>every token's advertise strip, against what <Tok t={d.toks[me]} /> is looking for</>,
          <>the match score for each, ÷ 8 (the square root of 64, keeps the numbers tame). all negative, and that's fine: only the <b>gaps</b> matter</>,
          <>the budget: raise e to each score, then take each one's share of the total. a gap of 2.5 becomes 87% against 7%. it always adds up to 100%</>,
          <>every token does this. the future is blocked because in training the next word <b>is</b> the answer: a token must guess it, not read it</>][Math.min(step, 3)]}
      </div>
      <style>{`
        .bg { display: flex; flex-direction: column; gap: 1em; font-size: .8em; }
        .bg .main { display: flex; gap: 3em; align-items: center; }
        .bg .cap { font-size: .7em; color: var(--muted); min-height: 1.6em; max-width: 60em; }
        .bg .cap b { color: var(--fg); }
        .bg .left { display: flex; flex-direction: column; gap: .5em; flex: 1; }
        .bg .me { display: grid; grid-template-columns: 9em 1fr; gap: .8em; align-items: center; margin-bottom: .8em; }
        .bg .k { font-size: .6em; text-align: right; }
        .bg .hdr, .bg .row { display: grid; grid-template-columns: 5em 1fr 12em 8em; gap: .8em; align-items: center; }
        .bg .hdr > * { font-size: .55em; }
        .bg .ax { opacity: .7; margin-left: .5em; }
        .bg .row .chip { justify-self: end; font-size: .75em; }
        .bg .row.top .chip { border-color: var(--accent); background: var(--hl); }
        .bg .line { position: relative; height: 26px; border-bottom: 1px solid var(--line-2); }
        .bg .dot { position: absolute; bottom: -8px; width: 16px; height: 16px; margin-left: -8px; border-radius: 50%; background: ${LENS.k.color}; }
        .bg .sv { position: absolute; right: 0; top: -2px; font: .5em var(--mono); color: var(--muted); }
        .bg .bud { position: relative; height: 26px; background: var(--surface); border-radius: 4px; }
        .bg .bud .fill { position: absolute; inset: 0 auto 0 0; background: var(--accent); border-radius: 4px; transition: width .5s; }
        .bg .bud span { position: absolute; left: .4em; top: 50%; transform: translateY(-50%); font: .55em var(--mono); color: var(--fg); }
        .bg .grid { display: flex; flex-direction: column; gap: .6em; max-width: 21em; }
        .bg .grid .heat .rl, .bg .grid .heat .cl { font-size: .55em; }
      `}</style>
    </div>
  );
}
