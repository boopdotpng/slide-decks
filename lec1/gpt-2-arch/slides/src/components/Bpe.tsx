/** @jsxImportSource preact */
import { Chip, at, useIsland } from './viz';

/**
 * Side quest: byte-pair encoding, with gpt-2's real merge list (tokenizer.json, 50,000 merges in the order they were
 * learned). Below: how the list was made, its first 8 entries. Above: a short paragraph, cut into words, then every word
 * into single characters, and the list applied top to bottom: each merge glues its pair everywhere it appears.
 * Shares a slide with Tokenize, so it starts at slide step `from` (fades in there) and counts from that.
 *  from: single characters   from+1 … from+8: merges #1 … #8, one each (the new pieces light up, and the merge in the list)
 *  from+9, from+10: everything up to #100, #1,000   from+11: the rest of the list, the paragraph as gpt-2 sees it (colors-ok: not colors)
 */
type Step = { upto: number | null; on: [number, number][]; n: number; words: string[][] };
export default function Bpe({ from = 0 }: { from?: number }) {
  const { root, step: slideStep, d } = useIsland('embed');
  const step = Math.max(0, slideStep - from);
  if (!d) return <div ref={root} />;
  const b = d.bpe as { text: string; start: string[][]; steps: Step[]; first: string[][]; n: number };
  const k = Math.min(step, b.steps.length);
  const cur = k === 0 ? null : b.steps[k - 1];
  const words = cur ? cur.words : b.start;
  const on = new Set(cur?.on.map(([w, i]) => `${w}.${i}`));
  const one = cur && cur.upto !== null && cur.upto <= b.first.length ? cur.upto : 0; // a single merge from the list
  const lo = k > 1 ? (b.steps[k - 2].upto ?? 0) + 1 : 1;
  const count = (xs: string[][]) => xs.reduce((s, w) => s + w.length, 0);
  const done = k === b.steps.length;
  const n = (v: number) => v.toLocaleString();
  return (
    <div class={`bpe ${at(slideStep, from)}`} ref={root}>
      <div class="list">
        <div class="lbl">the list: find the most common pair of neighbors in a pile of text, glue it, repeat</div>
        {b.first.map(([a, c], i) => (
          <div class={`m ${one === i + 1 ? 'hit' : ''}`}>
            <span class="n">#{i + 1}</span><Chip t={a} /><span class="op">+</span><Chip t={c} /><span class="op">→</span><Chip t={a + c} />
          </div>
        ))}
        <div class="more muted">… {n(b.n)} merges</div>
      </div>
      <div class="text">
        <div class="pieces">
          {words.map((w, wi) => <span class="w">{w.map((p, i) => <Chip t={p} class={on.has(`${wi}.${i}`) ? 'on' : ''} />)}</span>)}
        </div>
        <div class="what">
          {!cur ? <>side quest: how gpt-2 splits a paragraph, starting from single characters</>
            : one ? <>merge <b>#{one}</b>: glued in {cur.n} {cur.n === 1 ? 'place' : 'places'}</>
            : <>merges <b>#{n(lo)}</b> … <b>{cur.upto ? `#${n(cur.upto)}` : `#${n(b.n)}`}</b>: {cur.n} more glues</>}
        </div>
        <div class={`cap ${done ? '' : 'muted'}`}>
          {done ? <>no merge fits any more: {count(b.start)} characters → {count(words)} tokens</>
            : <>go down the list in order. a merge never crosses a word</>}
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
        .bpe .text { display: flex; flex-direction: column; gap: .6em; }
        .bpe .pieces { display: flex; flex-wrap: wrap; gap: .45em .7em; font-size: .7em; align-content: flex-start; height: 8.4em; }
        .bpe .w { display: flex; gap: .12em; }
        .bpe .w .chip { padding: .1em .25em; }
        .bpe .what { font-size: .7em; color: var(--muted); }
        .bpe .what b { color: var(--accent); font-family: var(--mono); }
        .bpe .cap { font-size: .6em; min-height: 1.2em; }
      `}</style>
    </div>
  );
}
