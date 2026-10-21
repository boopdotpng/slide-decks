/** @jsxImportSource preact */
import { Heatmap, Tok, at, pct, sequential, useIsland } from './viz';

/**
 * Why position had to be in the strip: a head that only uses position.
 *  0 the head we followed (block 3 head 3): " of" looks at " States"
 *  1 block 4 head 11: every token looks at the one right before it, ~100%. only possible because position is in the strip
 */
function Pattern({ P, toks, title }: { P: number[][]; toks: string[]; title: preact.ComponentChildren }) {
  return (
    <div class="pat">
      <div class="ttl">{title}</div>
      <Heatmap data={P.map((r, i) => r.map((v, j) => (j > i ? null : v)))} cell={70} gap={4} color={(v) => sequential(Math.sqrt(v))}
        rowLabels={toks.map((t) => <Tok t={t} />)} colLabels={toks.map((t) => <Tok t={t} />)}
        tipFn={(_, __, v) => (v === null ? 'the future' : pct(v))} />
    </div>
  );
}
export default function PrevHead() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const [L, H] = d.focus, [pl, ph] = d.prev_head;
  return (
    <div class="ph" ref={root}>
      <Pattern P={d.probs_all[L][H]} toks={d.toks} title={<>block {L}, head {H} · the one we followed</>} />
      <div class={at(step, 1)}>
        <Pattern P={d.probs_all[pl][ph]} toks={d.toks} title={<>block {pl}, head {ph} · always the word before</>} />
      </div>
      <div class={`cap ${at(step, 1)}`}>
        this head ignores the words and reads only position: "who sits right before me?". without the position strip, it couldn't exist
      </div>
      <style>{`
        .ph { display: grid; grid-template-columns: auto auto; gap: 1em 5em; justify-content: start; font-size: .8em; }
        .ph .pat { display: flex; flex-direction: column; gap: .8em; }
        .ph .ttl { font-size: .62em; color: var(--muted); }
        .ph .heat .rl, .ph .heat .cl { font-size: .6em; }
        .ph .cap { grid-column: 1 / -1; font-size: .7em; color: var(--muted); margin-top: .6em; }
      `}</style>
    </div>
  );
}
