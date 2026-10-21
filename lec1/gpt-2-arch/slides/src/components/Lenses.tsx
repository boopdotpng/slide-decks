/** @jsxImportSource preact */
import { ByteHeat, Strip, Tok, at, fmt, useIsland } from './viz';
import { LENS, type LensId } from './common';

/**
 * The one move in the whole model, taught once: a strip through a grid (block 3, head 3, the token " of"). The strip
 * stands on its side so each of its 768 numbers sits next to one row of the grid.
 *  0 the strip and the first grid, 768 × 64
 *  1 one column: every row's number × the strip's number, added up → one number out
 *  2 the next column, the same way → the next number
 *  3 all 64 columns → the 64-number output strip
 *  4 the other way to see it: each strip number scales its row of the grid; add the 768 scaled rows (the lookup on
 *    the embed slide was this with a strip of one 1 and 767 zeros)
 *  5 two more grids, same strip
 *  6 what each output is for
 */
const H = 430, GW = 150, SW = 30;
const IDS: LensId[] = ['q', 'k', 'v'];

export default function Lenses() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length, cell: number = d.cell, [BL, BH] = d.focus as [number, number]; // block, head: the head's real address
  const x: number[] = d.ln1[S - 1];
  const q = d.lenses.q;
  // step 1 is the column we exported the weights for; step 2 is the column after it
  const col = step === 2 ? cell + 1 : cell;
  const prod = x.map((v, i) => v * (step === 2 ? q.col_next[i] : q.col[i]));
  const colOn = step === 1 || step === 2;
  const row: number = q.row; // the row we light up for the row view
  const rowOn = step === 4 ? 'fade on' : 'fade';
  return (
    <div class="ln" ref={root}>
      <div class="x">
        <div class="lbl"><Tok t={d.toks[S - 1]} /></div>
        <div class="sw">
          <Strip values={x} vertical height={H} width={SW} label="strip" />
          <div class={`rowpick ${rowOn}`} style={{ top: `${(row / 768) * 100}%` }} />
        </div>
        <div class="lbl">768</div>
      </div>
      <div class={`prod ${colOn ? 'on' : ''}`}>
        <div class="lbl">× weight</div>
        <Strip values={prod} vertical height={H} width={SW} label="number × weight" />
        <div class="lbl">add up ↓</div>
      </div>
      {IDS.map((id, j) => {
        const L = d.lenses[id], c = LENS[id];
        const shown = j === 0 || step >= 5;
        return (
          <div class={`lens fade ${shown ? 'on' : ''}`} style={{ '--lc': c.color }}>
            <div class="lbl top">{j === 0 ? <>block {BL}, head {BH}'s grid of learned numbers, <b>768 × 64</b></> : <b>768 × 64</b>}</div>
            <ByteHeat m={L.img} w={GW} h={H}>
              {j === 0 && <>
                <div class={`colhl ${colOn ? 'on' : ''}`} style={{ left: `${(col / 64) * 100}%`, width: `${100 / 64}%` }} />
                <div class={`rowhl ${rowOn}`} style={{ top: `${(row / 768) * 100}%`, height: `${100 / 768}%` }} />
              </>}
            </ByteHeat>
            <div class={`out ${j > 0 || step >= 3 ? 'on' : ''}`}>
              <Strip values={L.out[S - 1]} height={26} label={c.plain} />
            </div>
            {j === 0 && <div class={`one ${colOn ? 'on' : ''}`} style={{ left: `${((col + 0.5) / 64) * 100}%` }}>
              {fmt(L.out[S - 1][col])}
            </div>}
            <div class={`name ${at(step, 6)}`}>{c.plain}</div>
            <div class="lbl">64 numbers</div>
          </div>
        );
      })}
      <div class={`side ${rowOn}`}>
        <div class="lbl">the other way to see it</div>
        <div class="rowview">
          <span class="n">strip [{row}] = <b>{fmt(x[row])}</b></span>
          <span class="muted">× its row of the grid</span>
          <Strip values={q.row_vals} height={18} label={`row ${row}`} />
          <span class="muted">= one scaled row, 64 wide. do that for all 768 rows and add them up: the same 64 numbers</span>
        </div>
      </div>
      <div class="cap">
        {[<>the strip for <Tok t={d.toks[S - 1]} />, on its side, next to the head's first grid: 768 rows, 64 columns. a real piece of the model: block {BL}, head {BH}</>,
          <>one column: each of the 768 numbers times the weight beside it, all added up. that's <b>one</b> number out</>,
          <>the next column, the same way: the next number. every column is its own multiply-and-add</>,
          <>64 columns, 64 numbers. the grid turned 768 numbers into 64. in code: <code>x @ W</code>, a matrix multiply</>,
          <>or: each number in the strip picks up its <b>row</b>, scaled. the lookup table earlier was this with a strip of one 1 and 767 zeros: pick one row. a multiply picks every row, a little</>,
          <>the <b>same</b> strip through the head's two other grids: the question, the tag and the note from the room. three different short strips</>,
          <>three readings of one token, each for a different job</>][Math.min(step, 6)]}
      </div>
      <style>{`
        .ln { display: grid; grid-template-columns: auto auto repeat(3, auto) 1fr; gap: 0 1.6em; justify-content: start; align-items: start; font-size: .8em; }
        .ln .x, .ln .prod { position: relative; display: flex; flex-direction: column; align-items: center; gap: .3em; }
        .ln .prod { opacity: 0; transition: opacity .35s; } .ln .prod.on { opacity: 1; }
        .ln .sw { position: relative; }
        .ln .rowpick { position: absolute; left: -6px; right: -6px; height: 3px; background: #fff; border-radius: 2px; }
        .ln .lens { position: relative; display: flex; flex-direction: column; gap: .3em; width: ${GW}px; }
        .ln .lens .byteheat { outline: 3px solid var(--lc); outline-offset: 2px; border-radius: 3px; }
        .ln .colhl { position: absolute; top: -6px; bottom: -6px; outline: 3px solid #fff; border-radius: 2px; opacity: 0; transition: opacity .3s, left .4s; }
        .ln .colhl.on { opacity: 1; }
        .ln .rowhl { position: absolute; left: -6px; right: -6px; min-height: 3px; background: #fff; border-radius: 2px; }
        .ln .out { opacity: 0; transition: opacity .35s; margin-top: .4em; outline: 2px solid var(--lc); border-radius: 3px; }
        .ln .out.on { opacity: 1; }
        .ln .one { position: absolute; top: calc(${H}px + 4.2em); transform: translateX(-50%); font-family: var(--mono); font-size: .7em;
          color: #fff; opacity: 0; transition: opacity .3s, left .4s; }
        .ln .one.on { opacity: 1; }
        .ln .name { color: var(--lc); font-size: .6em; min-height: 1.4em; white-space: nowrap; }
        .ln .lbl { font-size: .5em; white-space: nowrap; }
        .ln .lens .lbl.top { white-space: normal; line-height: 1.2; min-height: 2.4em; }
        .ln .lbl b { color: var(--fg); }
        .ln .side { align-self: center; max-width: 22em; display: flex; flex-direction: column; gap: .6em; }
        .ln .rowview { display: flex; flex-direction: column; gap: .4em; font-size: .6em; }
        .ln .rowview .n { font-family: var(--mono); }
        .ln .rowview .n b { color: #fff; }
        .ln .cap { grid-column: 1 / -1; margin-top: 1em; font-size: .7em; color: var(--muted); min-height: 1.5em; max-width: 60em; }
        .ln .cap b { color: var(--fg); }
        .ln .cap code { font-family: var(--mono); color: var(--fg); }
      `}</style>
    </div>
  );
}
