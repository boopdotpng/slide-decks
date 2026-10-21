/** @jsxImportSource preact */
import { Bars, Chip, Strip, Tok, at, pct, sequential, useIsland } from './viz';

/**
 * The answer. The final strip for " of" is compared with every token's embedding row (the same table as the start).
 *  0 the final strip   1 compared with all 50,257 rows: one score each   2 turned into chances, top 10
 */
export default function Answer() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length;
  const top = d.top as { tok: string; p: number }[];
  return (
    <div class="an" ref={root}>
      <div class="r"><span class="k">final strip for <Tok t={d.toks[S - 1]} /></span><Strip values={d.final} scale={3} height={40} /></div>
      <div class={`r ${at(step, 1)}`}><span class="k" /><span class="msg">match it against every token's row in the table from the start, like key against query: <b>50,257 scores</b>. one more multiply, 768 × 50,257</span></div>
      <div class={`dist ${at(step, 2)}`}>
        <div class="lbl">the budget trick again (e to each score, share of the total): the chances for what comes after <Chip t={d.toks[S - 1]} /></div>
        <Bars values={top.map((t) => t.p)} labels={top.map((t) => <Tok t={t.tok} />)} max={1} width={460} hl={0}
          color={(v) => sequential(0.4 + v)} fmtV={(v) => (v >= 0.01 ? pct(v) : `${(v * 100).toFixed(1)}%`)} />
      </div>
      <style>{`
        .an { display: flex; flex-direction: column; gap: 1em; font-size: .8em; }
        .an .r { display: grid; grid-template-columns: 11em 1fr; gap: 1em; align-items: center; }
        .an .k { text-align: right; font-size: .6em; color: var(--muted); }
        .an .msg { font-size: .7em; color: var(--muted); }
        .an .msg b { color: var(--fg); }
        .an .dist { margin-left: 12em; }
        .an .dist .bars { font-size: .85em; }
        .an .dist .lbl { margin-bottom: .5em; }
      `}</style>
    </div>
  );
}
