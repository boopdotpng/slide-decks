/** @jsxImportSource preact */
import { ByteHeat, Strip, Tok, at, fmt, useIsland } from './viz';
import { LENS, type LensId } from './common';

/**
 * Three lenses on one strip (block 3, head 3, the token " of"). The strip stands on its side so each of its 768
 * numbers sits next to one row of the grid; each output cell is one column: every row × the strip's number, added up.
 *  0 the strip and the first grid   1 one column → one number   2 the whole output strip   3 two more grids, same strip
 *  4 what each output is for
 */
const H = 430, GW = 150, SW = 30;
const IDS: LensId[] = ['q', 'k', 'v'];

export default function Lenses() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length, cell: number = d.cell;
  const x: number[] = d.ln1[S - 1];
  const q = d.lenses.q;
  const prod = x.map((v, i) => v * q.col[i]);
  return (
    <div class="ln" ref={root}>
      <div class="x">
        <div class="lbl"><Tok t={d.toks[S - 1]} /></div>
        <Strip values={x} vertical height={H} width={SW} label="strip" />
        <div class="lbl">768</div>
      </div>
      <div class={`prod ${step === 1 ? 'on' : ''}`}>
        <div class="lbl">× weight</div>
        <Strip values={prod} vertical height={H} width={SW} label="number × weight" />
        <div class="lbl">add up ↓</div>
      </div>
      {IDS.map((id, j) => {
        const L = d.lenses[id], c = LENS[id];
        const shown = j === 0 || step >= 3;
        return (
          <div class={`lens fade ${shown ? 'on' : ''}`} style={{ '--lc': c.color }}>
            <div class="lbl">a grid of learned numbers</div>
            <ByteHeat m={L.img} w={GW} h={H}>
              {j === 0 && <div class={`colhl ${step === 1 ? 'on' : ''}`} style={{ left: `${(cell / 64) * 100}%`, width: `${100 / 64}%` }} />}
            </ByteHeat>
            <div class={`out ${j > 0 || step >= 2 ? 'on' : ''}`}>
              <Strip values={L.out[S - 1]} height={26} label={c.plain} />
            </div>
            {j === 0 && <div class={`one ${step === 1 ? 'on' : ''}`} style={{ left: `${((cell + 0.5) / 64) * 100}%` }}>
              {fmt(L.out[S - 1][cell])}
            </div>}
            <div class={`name ${at(step, 4)}`}>{c.plain}</div>
            <div class="lbl">64 numbers</div>
          </div>
        );
      })}
      <div class="cap">
        {[<>the strip for <Tok t={d.toks[S - 1]} />, standing on its side, next to a grid</>,
          <>one column: each of the 768 numbers times its weight, all added up. that's <b>one</b> number out</>,
          <>64 columns, 64 numbers. the grid turned 768 numbers into 64</>,
          <>the <b>same</b> strip through two more grids: three different short strips</>,
          <>three readings of one token, each for a different job</>][Math.min(step, 4)]}
      </div>
      <style>{`
        .ln { display: grid; grid-template-columns: auto auto repeat(3, auto); gap: 0 1.6em; justify-content: start; align-items: start; font-size: .8em; }
        .ln .x, .ln .prod { display: flex; flex-direction: column; align-items: center; gap: .3em; }
        .ln .prod { opacity: 0; transition: opacity .35s; } .ln .prod.on { opacity: 1; }
        .ln .lens { position: relative; display: flex; flex-direction: column; gap: .3em; width: ${GW}px; }
        .ln .lens .byteheat { outline: 3px solid var(--lc); outline-offset: 2px; border-radius: 3px; }
        .ln .colhl { position: absolute; top: -6px; bottom: -6px; outline: 3px solid #fff; border-radius: 2px; opacity: 0; transition: opacity .3s; }
        .ln .colhl.on { opacity: 1; }
        .ln .out { opacity: 0; transition: opacity .35s; margin-top: .4em; outline: 2px solid var(--lc); border-radius: 3px; }
        .ln .out.on { opacity: 1; }
        .ln .one { position: absolute; top: calc(${H}px + 4.2em); transform: translateX(-50%); font-family: var(--mono); font-size: .7em;
          color: #fff; opacity: 0; transition: opacity .3s; }
        .ln .one.on { opacity: 1; }
        .ln .name { color: var(--lc); font-size: .6em; min-height: 1.4em; white-space: nowrap; }
        .ln .lbl { font-size: .5em; white-space: nowrap; }
        .ln .cap { grid-column: 1 / -1; margin-top: 1em; font-size: .7em; color: var(--muted); min-height: 1.5em; }
        .ln .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
