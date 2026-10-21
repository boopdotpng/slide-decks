/** @jsxImportSource preact */
import { Chip, Strip, at, pct, useIsland } from './viz';

/**
 * Why position has to be added. Real numbers, with the position table left out on purpose.
 *  0 our prompt, word rows only: " of"'s budget in block 0, head 4 (89% on " States")
 *  1 scrambled order: exactly the same budget, it just follows " States" around. order is invisible
 *  2 the same word twice ("I saw the cat and the dog"): the two " the" strips are identical
 *  3 add each token's position row: now they differ, and so does every order
 */
function Order({ toks, probs }: { toks: string[]; probs: number[] }) {
  return (
    <div class="ord">
      {toks.map((t, i) => (
        <div class="col">
          <div class="bar"><div style={{ height: `${probs[i] * 100}%` }} /></div>
          <span class="p">{pct(probs[i])}</span>
          <Chip t={t} class={i === toks.length - 1 ? 'on' : ''} />
        </div>
      ))}
    </div>
  );
}

export default function WhichOne() {
  const { root, step, d } = useIsland('embed');
  if (!d) return <div ref={root} />;
  const o = d.order, s = d.same;
  const word: number[] = s.word;
  const withPos = step >= 3;
  const a = withPos ? word.map((v, k) => v + s.pos_i[k]) : word;
  const b = withPos ? word.map((v, k) => v + s.pos_j[k]) : word;
  return (
    <div class="wo" ref={root}>
      <div class="top">
        <div>
          <div class="lbl">no position: how much <Chip t={d.toks[3]} /> reads each word (block 0, head {o.head})</div>
          <Order toks={d.toks} probs={o.probs} />
        </div>
        <div class={at(step, 1)}>
          <div class="lbl">scrambled</div>
          <Order toks={o.perm.map((k: number) => d.toks[k])} probs={o.probs_perm} />
        </div>
      </div>
      <div class={`same ${at(step, 2)}`}>
        <div class="sent">{s.toks.map((t: string, i: number) => <Chip t={t} class={i === s.i || i === s.j ? 'on' : ''} />)}</div>
        <div class="r"><span class="k"><Chip t=" the" /> #{s.i + 1}</span><Strip values={a} scale={0.25} height={30} /></div>
        <div class="r"><span class="k"><Chip t=" the" /> #{s.j + 1}</span><Strip values={b} scale={0.25} height={30} /></div>
      </div>
      <div class="cap">
        {[<><Chip t={d.toks[3]} /> reads mostly <Chip t={d.toks[2]} /></>,
          <>same words, any order: the exact same budget. without position, order is invisible</>,
          <>the same word twice: the two strips are identical. nothing can tell them apart</>,
          <>add each token's position row, right after the lookup: now every token is different</>][Math.min(step, 3)]}
      </div>
      <style>{`
        .wo { display: flex; flex-direction: column; gap: 1.2em; font-size: .8em; }
        .wo .top { display: flex; gap: 4em; }
        .wo .lbl { margin-bottom: .5em; min-height: 1.8em; display: flex; align-items: center; gap: .3em; }
        .wo .ord { display: flex; gap: .6em; align-items: flex-end; }
        .wo .col { display: flex; flex-direction: column; align-items: center; gap: .2em; }
        .wo .bar { width: 46px; height: 110px; background: #1a1a1a; border-radius: 4px; display: flex; align-items: flex-end; overflow: hidden; }
        .wo .bar div { width: 100%; background: var(--accent); transition: height .5s; }
        .wo .p { font: .55em var(--mono); color: var(--muted); }
        .wo .col .chip { font-size: .75em; }
        .wo .same { display: flex; flex-direction: column; gap: .5em; }
        .wo .sent { display: flex; gap: .3em; font-size: .75em; margin-bottom: .3em; }
        .wo .r { display: grid; grid-template-columns: 7em 1fr; gap: .8em; align-items: center; }
        .wo .k { font-size: .65em; color: var(--muted); text-align: right; }
        .wo .cap { font-size: .7em; color: var(--muted); min-height: 1.6em; }
      `}</style>
    </div>
  );
}
