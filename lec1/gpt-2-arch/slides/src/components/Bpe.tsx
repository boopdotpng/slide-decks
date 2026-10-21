/** @jsxImportSource preact */
import { Chip, at, useIsland } from './viz';

/**
 * Side quest: byte-pair encoding, with gpt-2's real merge list (tokenizer.json, 50,000 merges in the order they were
 * learned). Left: how the list was made, its first 8 entries. Right: " tokenization" built from single characters by
 * applying those merges, lowest number first, one per step, until no merge applies: " token" + "ization".
 * Shares a slide with Tokenize, so it starts at slide step `from` (fades in there) and counts from that.
 *  from: single characters   from+1 … from+11: one merge each (the merged piece lights up, its rank underneath)
 */
type Step = { rank: number; at: number; pieces: string[] };
export default function Bpe({ from = 0 }: { from?: number }) {
  const { root, step: slideStep, d } = useIsland('embed');
  const step = Math.max(0, slideStep - from);
  if (!d) return <div ref={root} />;
  const b = d.bpe as { start: string[]; steps: Step[]; first: string[][]; n: number };
  const k = Math.min(step, b.steps.length);
  const cur = k === 0 ? null : b.steps[k - 1];
  const pieces = cur ? cur.pieces : b.start;
  const done = k === b.steps.length;
  return (
    <div class={`bpe ${at(slideStep, from)}`} ref={root}>
      <div class="list">
        <div class="lbl">the list: find the most common pair of neighbors in a pile of text, glue it, repeat</div>
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
          {cur ? <>merge <b>#{cur.rank.toLocaleString()}</b></> : <>side quest: how gpt-2 splits it, starting from single characters</>}
        </div>
        <div class={`cap ${done ? '' : 'muted'}`}>
          {done ? <>no merge fits any more: {pieces.length} tokens</> : <>always the earliest merge in the list that fits</>}
        </div>
      </div>
      <style>{`
        .bpe { display: flex; flex-direction: column-reverse; gap: 1.4em; font-size: .8em; }
        .bpe .list { display: grid; grid-template-columns: auto auto; gap: .3em 1.6em; justify-content: start; }
        .bpe .list .lbl, .bpe .list .more { grid-column: 1 / -1; }
        .bpe .list .lbl { margin-bottom: .3em; }
        .bpe .m { display: flex; align-items: center; gap: .3em; font-size: .7em; padding: .1em .3em; border-radius: 6px; transition: background .3s; }
        .bpe .m.hit { background: var(--hl); }
        .bpe .m .n { width: 2.2em; color: var(--muted); font: .7em var(--mono); }
        .bpe .op { color: var(--muted); }
        .bpe .more { font-size: .6em; }
        .bpe .word { display: flex; flex-direction: column; gap: .6em; }
        .bpe .pieces { display: flex; gap: .25em; font-size: 1em; flex-wrap: wrap; min-height: 1.8em; }
        .bpe .what { font-size: .7em; color: var(--muted); }
        .bpe .what b { color: var(--accent); font-family: var(--mono); }
        .bpe .cap { font-size: .6em; min-height: 1.2em; }
      `}</style>
    </div>
  );
}
