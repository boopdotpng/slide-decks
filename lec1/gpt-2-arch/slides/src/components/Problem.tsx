/** @jsxImportSource preact */
import { Bars, Strip, Tok, at, pct, useIsland } from './viz';

/**
 * The problem attention solves. Each strip only knows its own token.
 *  0 four separate strips   1 what the model guesses after " of" before any reading (the guess after block 0)
 *  2 the answer is in the other strips: " of" has to look back
 */
export default function Problem() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length;
  const early = d.lens[0].slice(0, 3) as { tok: string; p: number }[];
  return (
    <div class="pb" ref={root}>
      <div class="cols">
        {d.toks.map((t: string, i: number) => (
          <div class={`c ${i === S - 1 ? 'me' : ''} ${step >= 2 && (i === 1 || i === 2) ? 'src' : ''}`}>
            <div class="t"><Tok t={t} /></div>
            <Strip values={d.embed[i]} vertical height={300} width={44} scale={0.25} />
          </div>
        ))}
        <div class={`guess ${at(step, 1)}`}>
          <div class="lbl">guess after <Tok t={d.toks[S - 1]} />, on its own</div>
          <Bars values={early.map((e) => e.p)} labels={early.map((e) => <Tok t={e.tok} />)} max={1} fmtV={pct} width={160} />
        </div>
      </div>
      <div class="cap">
        {step < 2
          ? <>each strip only knows its own word. <Tok t={d.toks[S - 1]} /> alone is a generic word</>
          : <>the answer is in <b>other</b> strips. how does <Tok t={d.toks[S - 1]} /> read them?</>}
      </div>
      <style>{`
        .pb { font-size: .8em; }
        .pb .cols { display: flex; gap: 1.2em; align-items: flex-end; }
        .pb .c { display: flex; flex-direction: column; align-items: center; gap: .4em; padding: .4em; border-radius: 8px;
          border: 2px solid transparent; transition: border-color .3s; }
        .pb .c .t { font-size: .9em; }
        .pb .c.me { border-color: var(--accent); }
        .pb .c.src { border-color: #8ddb8c; border-style: dashed; }
        .pb .guess { margin-left: 1.5em; align-self: center; }
        .pb .guess .bars { font-size: .9em; }
        .pb .guess .lbl { margin-bottom: .5em; }
        .pb .cap { margin-top: 1em; font-size: .75em; color: var(--muted); }
        .pb .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
