/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Shape, Strip, Tok, useData } from './viz';

/**
 * out = Σ_j p_j · v_j  (block 10, head 7). q·k decided where to look; v is what each token hands over.
 * Steps:
 *  0. the value rows, next to the attention weights from the q·k slide
 *  1. scale each value row by its weight: most rows fade out
 *  2. sum the rows: the head's output, which is nearly ' Mary's value vector, so the head copied it
 */
const cos = (a: number[], b: number[]) => {
  let ab = 0, aa = 0, bb = 0;
  a.forEach((x, i) => { ab += x * b[i]; aa += x * x; bb += b[i] * b[i]; });
  return ab / Math.sqrt(aa * bb);
};

export default function WeightedSum() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const V: number[][] = d.V;
  const p: number[] = d.probs;
  const T = V.length;
  const best = p.indexOf(Math.max(...p));

  return (
    <div class="ws" ref={root}>
      <div class="lead muted">q·k picked <i>where</i> to look. v is <i>what</i> each token hands over: blend the v rows by those weights</div>
      <div class="rows">
        {V.map((v, j) => (
          <div class="vr">
            <span class={`t ${j === best ? 'hl' : ''}`}><Tok t={d.toks[j]} /></span>
            <span class="p"><i class="pb" style={{ width: `${p[j] * 100}%` }} /><b>{p[j].toFixed(2)}</b>{step >= 1 ? ' ×' : ''}</span>
            <Strip values={step >= 1 ? v.map((x) => x * p[j]) : v} scale={1.2} height={11} label={`v[${j}]`} />
          </div>
        ))}
      </div>
      <div class={`out fade ${step >= 2 ? 'on' : ''}`}>
        <div class="sum">Σ ↓ <span class="muted">v <Shape dims={[1, 12, T, 64]} names={['B', 'H', 'T', 'd']} /> → out <Shape dims={[1, 12, T, 64]} names={['B', 'H', 'S', 'd']} /></span></div>
        <div class="vr">
          <span class="t">out</span><span />
          <Strip values={d.head_out} scale={1.2} height={18} label="out" />
        </div>
        <div class="vr cmp">
          <span class="t"><Tok t={d.toks[best]} />'s v</span><span />
          <Strip values={V[best]} scale={1.2} height={18} label={`v[${best}]`} />
        </div>
        <div class="take">
          out ≈ <Tok t={d.toks[best]} />'s v <span class="muted">(cosine {cos(d.head_out, V[best]).toFixed(2)})</span>: this head <b>copies</b> what
          <Tok t={d.toks[best]} /> hands over into the <Tok t={d.toks[T - 1]} /> position. that's how information moves between tokens
        </div>
      </div>
      <style>{`
        .ws { font-size: .8em; display: flex; flex-direction: column; gap: .3em; }
        .ws .vr { display: grid; grid-template-columns: 6em 5em 520px; gap: .6em; align-items: center; }
        .ws .lead { font-size: .62em; margin-bottom: .4em; }
        .ws .p { position: relative; display: block; height: 1.2em; line-height: 1.2em; }
        .ws .p .pb { position: absolute; left: 0; top: 15%; height: 70%; background: var(--accent); opacity: .35; border-radius: 2px; }
        .ws .p b { position: relative; font-weight: normal; padding-left: .3em; }
        .ws .cmp .t { color: var(--accent); }
        .ws .take { font-size: .58em; margin: .2em 0 0 12em; max-width: 50em; }
        .ws .rows { display: flex; flex-direction: column; gap: 2px; }
        .ws .t { font-size: .72em; text-align: right; }
        .ws .t.hl { color: var(--accent); font-weight: 700; }
        .ws .p { font-size: .65em; font-family: var(--mono); color: var(--muted); }
        .ws .vr .strip { transition: none; }
        .ws .shp .shape { font-size: .72em; }
        .ws .sum { margin-left: 13.5em; color: var(--muted); font-size: .62em; }
        .ws .out .shape { font-size: .9em; }
      `}</style>
    </div>
  );
}
