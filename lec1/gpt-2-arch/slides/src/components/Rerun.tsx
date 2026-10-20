/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Shape, Strip, Tok, useData } from './viz';

/**
 * Two naive passes in a row: the prompt, then the prompt + the token it predicted.
 * k for the old positions (layer 10, head 7) comes out identical: only the last row is new.
 * Steps: 1. the second pass   2. compare: the old rows didn't change
 */
export default function Rerun() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('loop');
  if (!d) return <div ref={root} />;
  const K1: number[][] = d.K1, K2: number[][] = d.K2;
  const [L, H] = d.focus;

  const mat = (K: number[][], title: string, second: boolean) => (
    <div class={`mat ${second ? `fade ${step >= 1 ? 'on' : ''}` : ''}`}>
      <div class="mh">{title} <span class="muted">· k, block {L} head {H}</span></div>
      {K.map((r, i) => {
        const isNew = second && i === K1.length;
        return (
          <div class={`kr ${isNew ? 'new' : ''} ${!isNew && step >= 2 ? 'same' : ''}`}>
            <span class="t"><Tok t={d.toks[i]} /></span>
            <Strip values={r} scale={2.5} height={13} label={`k[${i}]`} />
          </div>
        );
      })}
      <div class="ms"><Shape dims={[1, 12, K.length, 64]} names={['B', 'H', 'S', 'd']} hl={[2]} /></div>
    </div>
  );

  return (
    <div class="rr" ref={root}>
      <div class="mats">
        {mat(K1, `pass 1 · ${K1.length} tokens`, false)}
        {mat(K2, `pass 2 · ${K2.length} tokens`, true)}
      </div>
      <div class={`cap fade ${step >= 2 ? 'on' : ''}`}>
        old rows: max |Δ| = <b>{d.kv_diff === 0 ? '0' : d.kv_diff}</b> <span class="muted">over every block, head, position and channel, for k and v</span><br />
        <span class="muted">only the last row is new work. a token's k, v only depend on the tokens before it</span>
      </div>
      <style>{`
        .rr { font-size: .8em; display: flex; flex-direction: column; gap: .8em; }
        .rr .mats { display: flex; gap: 4em; }
        .rr .mat { display: flex; flex-direction: column; gap: 2px; width: 30vw; }
        .rr .mh { font-size: .65em; margin-bottom: .3em; }
        .rr .kr { display: grid; grid-template-columns: 5em 1fr; gap: .6em; align-items: center; transition: opacity .4s; }
        .rr .kr .t { font-size: .62em; text-align: right; }
        .rr .kr.same { opacity: .35; }
        .rr .kr.new .t { color: var(--accent); font-weight: 700; }
        .rr .ms { margin-top: .4em; font-size: .8em; }
        .rr .cap { font-size: .65em; }
      `}</style>
    </div>
  );
}
