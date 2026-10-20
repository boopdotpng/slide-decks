/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Shape, Strip, Tok, useData } from './viz';

/**
 * The cache for one head (layer 10, head 7): one row of k and v per past token.
 * Step 1: the new token's k and v slide in as row T. Nothing old is recomputed.
 */
export default function KVCache() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const T = d.toks.length;
  const [L, H] = d.focus;

  const mat = (rows: number[][], name: string) => (
    <div class="mat">
      <div class="mh">{name} cache <span class="muted">· block {L} head {H}</span></div>
      {rows.map((r, i) => (
        <div class={`kr ${i === T - 1 ? 'new' : ''} ${i === T - 1 && step >= 1 ? 'in' : ''}`}>
          <span class="t"><Tok t={d.toks[i]} /></span>
          <Strip values={r} scale={2.5} height={14} label={`${name}[${i}]`} />
        </div>
      ))}
      <div class="ms"><Shape dims={[1, 12, step >= 1 ? T : T - 1, 64]} names={['B', 'H', 'T', 'd']} hl={[2]} /></div>
    </div>
  );

  return (
    <div class="kvc" ref={root}>
      {mat(d.K, 'k')}
      {mat(d.V, 'v')}
      <style>{`
        .kvc { display: flex; gap: 4em; font-size: .8em; }
        .kvc .mat { display: flex; flex-direction: column; gap: 3px; width: 34vw; }
        .kvc .mh { font-size: .7em; margin-bottom: .3em; }
        .kvc .kr { display: grid; grid-template-columns: 5.5em 1fr; gap: .6em; align-items: center; transition: transform .6s cubic-bezier(.4,0,.2,1), opacity .5s; }
        .kvc .kr .t { font-size: .72em; text-align: right; }
        .kvc .kr.new { opacity: 0; transform: translateX(40%); }
        .kvc .kr.new.in { opacity: 1; transform: none; }
        .kvc .kr.new.in .t { color: var(--accent); }
        .kvc .ms { margin-top: .5em; }
      `}</style>
    </div>
  );
}
