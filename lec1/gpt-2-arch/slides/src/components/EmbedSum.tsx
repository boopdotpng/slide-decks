/** @jsxImportSource preact */
import { Chip, Strip, at, useIsland } from './viz';

/**
 * The strip each token starts as: its word row + its position row, added cell by cell.
 *  0 the word rows   1 + the position rows   2 = the starting strips
 */
const SC = 0.25;
export default function EmbedSum() {
  const { root, step, d } = useIsland('embed');
  if (!d) return <div ref={root} />;
  return (
    <div class="es" ref={root}>
      <div class="hdr" />
      <div class="hdr muted">the word</div><div />
      <div class={`hdr muted ${at(step, 1)}`}>its position</div><div />
      <div class={`hdr muted ${at(step, 2)}`}>the strip it starts as</div>
      {d.toks.map((t: string, i: number) => <>
        <div class="t"><Chip t={t} /></div>
        <Strip values={d.tok_emb[i]} scale={SC} height={44} label="word" />
        <div class={`op ${at(step, 1)}`}>+</div>
        <div class={at(step, 1)}><Strip values={d.pos_emb[i]} scale={SC} height={44} label={`position ${i}`} /></div>
        <div class={`op ${at(step, 2)}`}>=</div>
        <div class={at(step, 2)}><Strip values={d.embed[i]} scale={SC} height={44} label="start" /></div>
      </>)}
      <div class={`cap ${at(step, 2)}`}>added once, right after the lookup, before block 0. everything after reads these</div>
      <style>{`
        .es { display: grid; grid-template-columns: auto 1fr auto 1fr auto 1fr; gap: .7em .6em; align-items: center; font-size: .8em; }
        .es .hdr { font-size: .6em; }
        .es .t { text-align: right; font-size: .9em; }
        .es .op { font-size: 1.2em; color: var(--muted); }
        .es .cap { grid-column: 1 / -1; font-size: .7em; color: var(--muted); margin-top: .6em; }
      `}</style>
    </div>
  );
}
