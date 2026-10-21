/** @jsxImportSource preact */
import { Chip, at, useIsland } from './viz';

/**
 * Side quest: byte-pair encoding, with gpt-2's real merge list (tokenizer.json, 50,000 merges in the order they were
 * learned). Left: how the list was made, its first 8 entries. Right: " tokenization" built from single characters by
 * applying those merges, lowest number first, one per step, until no merge applies: " token" + "ization".
 *  0 single characters   1…11 one merge each (the merged piece lights up, its rank underneath)
 */
type Step = { rank: number; at: number; pieces: string[] };
export default function Bpe() {
  const { root, step, d } = useIsland('embed');
  if (!d) return <div ref={root} />;
  const b = d.bpe as { start: string[]; steps: Step[]; first: string[][]; n: number };
  const k = Math.min(step, b.steps.length);
  const cur = k === 0 ? null : b.steps[k - 1];
  const pieces = cur ? cur.pieces : b.start;
  const done = k === b.steps.length;
  return (
    <div class="bpe" ref={root}>
      <div class="list">
        <div class="lbl">how the list was made: find the most common pair of neighbors in a pile of text, glue it, repeat</div>
        {b.first.map(([a, c], i) => (
          <div class={`m ${cur?.rank === i + 1 ? 'hit' : ''}`}>
            <span class="n">#{i + 1}</span><Chip t={a} /><span class="op">+</span><Chip t={c} /><span class="op">→</span><Chip t={a + c} />
          </div>
        ))}
        <div class="more muted">… {b.n.toLocaleString()} merges</div>
      </div>
      <div class="word">
        <div class="pieces">{pieces.map((p, i) => <Chip t={p} class={cur && i === cur.at ? 'on' : ''} />)}</div>
        <div class="what">
          {cur ? <>merge <b>#{cur.rank.toLocaleString()}</b></> : <>start: single characters</>}
        </div>
        <div class={`cap ${at(step, b.steps.length)}`}>
          no merge applies any more: {pieces.length} tokens. rare words end up in pieces, common ones in one
        </div>
        {!done && <div class="cap muted">always apply the earliest merge in the list that fits</div>}
      </div>
      <style>{`
        .bpe { display: grid; grid-template-columns: auto 1fr; gap: 4em; align-items: start; font-size: .8em; }
        .bpe .list { display: flex; flex-direction: column; gap: .35em; max-width: 15em; }
        .bpe .list .lbl { margin-bottom: .5em; line-height: 1.4; }
        .bpe .m { display: flex; align-items: center; gap: .35em; font-size: .75em; padding: .1em .3em; border-radius: 6px; transition: background .3s; }
        .bpe .m.hit { background: var(--hl); }
        .bpe .m .n { width: 2.2em; color: var(--muted); font: .7em var(--mono); }
        .bpe .op { color: var(--muted); }
        .bpe .more { font-size: .6em; margin-top: .3em; }
        .bpe .word { display: flex; flex-direction: column; gap: 1em; padding-top: 2em; }
        .bpe .pieces { display: flex; gap: .3em; font-size: 1.3em; flex-wrap: wrap; }
        .bpe .what { font-size: .75em; color: var(--muted); min-height: 1.5em; }
        .bpe .what b { color: var(--accent); font-family: var(--mono); }
        .bpe .cap { font-size: .65em; }
      `}</style>
    </div>
  );
}
