/** @jsxImportSource preact */
import { Strip, Tok, at, useIsland } from './viz';
import { LENS } from './common';

/**
 * Why the cache works (block 3, head 3's key and value strips).
 *  0 the first run: 4 tokens, a key and a value strip each
 *  1 run again with " America" on the end: the old rows come out exactly the same (a token never sees what comes after it)
 *  2 so keep them: next time, only the new token is worked out
 */
export default function Cache() {
  const { root, step, d } = useIsland('loop');
  if (!d) return <div ref={root} />;
  const n = step >= 1 ? 5 : 4;
  const col = (id: 'k' | 'v', A: number[][], B: number[][]) => (
    <div class="col">
      <div class="hd" style={{ color: LENS[id].color }}>{LENS[id].name} strips <span class="muted">· block {d.focus[0]}, head {d.focus[1]}</span></div>
      <div class={`saved ${step >= 2 ? 'on' : ''}`}>
        {Array.from({ length: 4 }, (_, i) => (
          <div class="row"><span class="t"><Tok t={d.toks[i]} /></span>
            <Strip values={step >= 1 ? B[i] : A[i]} scale={2.5} height={22} />
            <span class={`ok ${at(step, 1)}`}>{step >= 2 ? 'saved' : 'same'}</span></div>
        ))}
        <div class={`tag ${at(step, 2)}`}>the cache</div>
      </div>
      <div class={`row new ${n > 4 ? 'on' : ''}`}><span class="t"><Tok t={d.toks[4]} /></span>
        <Strip values={B[4]} scale={2.5} height={22} /><span class="ok nw">new</span></div>
    </div>
  );
  return (
    <div class="kc" ref={root}>
      <div class="cols">{col('k', d.K1, d.K2)}{col('v', d.V1, d.V2)}</div>
      <div class="cap">
        {[<>the first run: every token gets its key and value strips</>,
          <>run it again with <Tok t={d.toks[4]} /> on the end: the old strips come out <b>exactly</b> the same</>,
          <>so keep them. each new token only works out its own strips, then looks back at the saved ones. queries aren't kept: only the newest token is looking</>][Math.min(step, 2)]}
      </div>
      <style>{`
        .kc { font-size: .8em; }
        .kc .cols { display: flex; gap: 3em; }
        .kc .col { flex: 1; display: flex; flex-direction: column; gap: 6px; }
        .kc .hd { font-size: .62em; margin-bottom: .3em; }
        .kc .saved { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 6px; border: 2px dashed transparent;
          border-radius: 8px; transition: border-color .4s; }
        .kc .saved.on { border-color: var(--faint); }
        .kc .tag { position: absolute; right: 8px; bottom: -1.4em; font-size: .5em; color: var(--muted); }
        .kc .row { display: grid; grid-template-columns: 6em 1fr 3.5em; gap: .6em; align-items: center; }
        .kc .row.new { margin: 0 8px; opacity: 0; transform: translateX(30%); transition: opacity .5s, transform .6s cubic-bezier(.4, 0, .2, 1); }
        .kc .row.new.on { opacity: 1; transform: none; margin-top: 1.2em; }
        .kc .t { font-size: .7em; text-align: right; }
        .kc .ok { font-size: .5em; color: var(--good); }
        .kc .ok.nw { color: var(--accent); }
        .kc .cap { margin-top: 1.4em; font-size: .7em; color: var(--muted); min-height: 1.6em; }
        .kc .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
