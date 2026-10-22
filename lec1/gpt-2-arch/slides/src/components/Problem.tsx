/** @jsxImportSource preact */
import { Bars, Strip, Tok, at, pct, useIsland } from './viz';

/**
 * The problem attention solves. Each strip starts out knowing only its own token.
 *  0 four separate strips, nothing has read anything yet
 *  1 what the whole model says when it's given " of" and nothing else (a real one-token run): " the", and unsure
 *  2 the answer is in the other strips: " of" has to look back
 */
export default function Problem() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length;
  const alone = d.alone as { tok: string; p: number }[]; // the model run on the last token by itself
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
          <div class="lbl">the whole model, given only <Tok t={d.toks[S - 1]} /></div>
          <Bars values={alone.map((e) => e.p)} labels={alone.map((e) => <Tok t={e.tok} />)} fmtV={pct} width={160} />
        </div>
      </div>
      <div class="cap">
        {[<>four strips, one per token. so far each one knows only its own word and place: nothing has read anything</>,
          <>run the model on <Tok t={d.toks[S - 1]} /> by itself and it says <Tok t={alone[0].tok} />, at {pct(alone[0].p)}: a lone <Tok t={d.toks[S - 1]} /> is a generic word with no idea what comes next</>,
          <>the answer is in <b>other</b> strips. how does <Tok t={d.toks[S - 1]} /> read them?</>][Math.min(step, 2)]}
      </div>
      <style>{`
        .pb { font-size: .8em; }
        .pb .cols { display: flex; gap: 1.2em; align-items: flex-end; }
        .pb .cols > * { flex: none; }
        .pb .c { display: flex; flex-direction: column; align-items: center; gap: .4em; padding: .4em; border-radius: 8px;
          border: 2px solid transparent; transition: border-color .3s; }
        .pb .c .t { font-size: .9em; }
        .pb .c.me { border-color: var(--accent); }
        .pb .c.src { border-color: var(--good); border-style: dashed; }
        .pb .guess { margin-left: 1.5em; align-self: center; }
        .pb .guess .bars { font-size: .9em; }
        .pb .guess .lbl { margin-bottom: .5em; }
        .pb .cap { margin-top: 1em; font-size: .75em; color: var(--muted); max-width: 60em; }
        .pb .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
