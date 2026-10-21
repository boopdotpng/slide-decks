/** @jsxImportSource preact */
import { ByteHeat, Strip, Tok, at, useIsland } from './viz';
import { LENS } from './common';

/**
 * The same multiply for all four tokens at once: the strips stacked as rows, (4 × 768) through the (768 × 64) grid,
 * gives (4 × 64). Row i of the output comes only from row i of the input: the tokens never mix here.
 *  0 the four strips as rows, and the grid   1 one row in → one row out (the strip from the last slide)
 *  2 all four: the shape in the code
 *  3 the conclusion: a loop over independent turns becomes a dimension in front, and the gpu runs every turn at once
 */
const GW = 110, GH = 300, SH = 36;
export default function FourAtOnce() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length, me = S - 1;
  const X: number[][] = d.ln1, O: number[][] = d.lenses.q.out;
  const rowOn = (i: number) => step >= 2 || (step === 1 && i === me);
  return (
    <div class="fa" ref={root}>
      <div class="eq">
        <div class="blk">
          <div class="lbl">4 strips, as rows · <b>4 × 768</b></div>
          {X.map((v, i) => (
            <div class={`row ${step >= 1 && !rowOn(i) ? 'dim' : ''} ${step === 1 && i === me ? 'hl' : ''}`}>
              <span class="t"><Tok t={d.toks[i]} /></span>
              <Strip values={v} height={SH} label={d.toks[i]} />
            </div>
          ))}
        </div>
        <span class="op">·</span>
        <div class="blk grid">
          <div class="lbl">the grid · <b>768 × 64</b></div>
          <ByteHeat m={d.lenses.q.img} w={GW} h={GH} />
        </div>
        <span class="op">=</span>
        <div class="blk">
          <div class="lbl" style={{ color: LENS.q.color }}>{LENS.q.plain} · <b>4 × 64</b></div>
          {O.map((v, i) => (
            <div class={`row out ${at(step, 1)} ${step >= 1 && !rowOn(i) ? 'dim' : ''} ${step === 1 && i === me ? 'hl' : ''}`}>
              <Strip values={v} height={SH} width={GW} label={d.toks[i]} />
            </div>
          ))}
        </div>
      </div>
      <div class={`code ${at(step, 3)}`}>
        <div class="c">
          <div class="lbl">one token at a time</div>
          <pre>{'for i in range(4):\n    out[i] = x[i] @ W'}</pre>
          <div class="lbl">4 turns, one after another</div>
        </div>
        <span class="eqs">=</span>
        <div class="c">
          <div class="lbl">all at once</div>
          <pre>{'out = x @ W'}</pre>
          <div class="lbl">(4, 768) @ (768, 64) → (4, 64)</div>
        </div>
        <div class="c wide">
          <div class="lbl">the loop is gone. its counter became a dimension at the <b>front</b> of x</div>
          <pre>{'x[i]      (768,)       one strip\nx         (4, 768)     the loop over tokens, as a dimension\nxs        (batch, 4, 768)   a loop over sentences, in front of that'}</pre>
        </div>
      </div>
      <div class="cap">
        {[<>the four strips lie flat, one per row. one grid for all of them</>,
          <>row <Tok t={d.toks[me]} /> in, row <Tok t={d.toks[me]} /> out: exactly the strip from the last slide. the other rows don't touch it</>,
          <>all four rows at once, one multiply. <b>rows never mix</b>: each token is on its own here. in code: <code>x @ W</code>, (4, 768) @ (768, 64) → (4, 64)</>,
          <>the rule: a loop whose turns don't depend on each other becomes a dimension in <b>front</b>, and a gpu runs every turn of it at the same time. tokens here, sentences in a batch, and soon the 12 heads: same trick each time</>][Math.min(step, 3)]}
      </div>
      <style>{`
        .fa { display: flex; flex-direction: column; gap: 1em; font-size: .8em; }
        .fa .eq { display: flex; align-items: center; gap: 1.2em; }
        .fa .blk { display: flex; flex-direction: column; gap: 6px; }
        .fa .blk.grid { align-items: center; }
        .fa .lbl { font-size: .5em; color: var(--muted); margin-bottom: .3em; white-space: nowrap; }
        .fa .lbl b { color: var(--fg); }
        .fa .row { display: grid; grid-template-columns: 6em 560px; gap: .6em; align-items: center; padding: 2px; border-radius: 4px;
          border: 2px solid transparent; transition: opacity .35s, border-color .3s; }
        .fa .row.out { grid-template-columns: ${GW}px; }
        .fa .row .t { font-size: .75em; text-align: right; }
        .fa .row.dim { opacity: .25; }
        .fa .row.hl { border-color: #fff; }
        .fa .op { font-size: 1.6em; color: var(--muted); }
        .fa .code { display: flex; align-items: center; gap: 1.2em; }
        .fa .code .c { display: flex; flex-direction: column; gap: .3em; background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: .6em .9em; }
        .fa .code .c.wide { margin-left: 1.2em; }
        .fa .code .c .lbl { margin: 0; }
        .fa .code pre { margin: 0; font: .62em var(--mono); color: var(--fg); line-height: 1.5; }
        .fa .code .eqs { font-size: 1.4em; color: var(--muted); }
        .fa .cap { font-size: .7em; color: var(--muted); min-height: 1.6em; max-width: 60em; }
        .fa .cap b { color: var(--fg); }
        .fa .cap code { font-family: var(--mono); color: var(--fg); }
      `}</style>
    </div>
  );
}
