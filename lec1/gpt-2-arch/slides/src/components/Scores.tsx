/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Bars, COLORS, Shape, Strip, Tok, sequential, useData } from './viz';

/**
 * The last token's query against every key (layer 10, head 7, ' to'): one row of the S × T scores.
 * Steps:
 *  1. q ⊙ k_j: multiply channel by channel
 *  2. sum: raw dot product per key
 *  3. ÷ √64
 *  4. softmax: scores -> probabilities (both columns stay up: before / after)
 */
export default function Scores() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const q: number[] = d.q;
  const K: number[][] = d.K;
  const T = K.length;
  const [L, H] = d.focus;
  const best = d.probs.indexOf(Math.max(...d.probs));
  const labels = d.toks.map((t: string) => <Tok t={t} />);
  const dots: number[] = step >= 3 ? d.scores : d.raw_dots;
  const maxDot = Math.max(...d.raw_dots.map(Math.abs));

  return (
    <div class="sc" ref={root}>
      <div class="qrow">
        <span class="k">q <span class="muted">(<Tok t={d.toks[T - 1]} />)</span></span>
        <Strip values={q} scale={2.5} height={22} label="q" />
        <Shape dims={[64]} />
      </div>
      <div class="grid">
        <div class="hdr" />
        <div class="hdr">{step >= 1 ? 'q ⊙ k' : 'k'} <span class="muted">· block {L} head {H}</span></div>
        <div class={`hdr fade ${step >= 2 ? 'on' : ''}`}>{step >= 3 ? 'q·k / √64' : 'q·k'}</div>
        <div class={`hdr fade ${step >= 4 ? 'on' : ''}`}>softmax</div>
        {K.map((k, j) => {
          const prod = k.map((x, c) => x * q[c]);
          return <>
            <div class={`t ${j === best && step >= 4 ? 'hl' : ''}`}>{labels[j]}</div>
            <div class="kcell">
              <Strip values={step >= 1 ? prod : k} scale={step >= 1 ? 4 : 2.5} height={15} label={step >= 1 ? `q⊙k[${j}]` : `k[${j}]`} />
            </div>
            <div class={`fade ${step >= 2 ? 'on' : ''}`}>
              <Bars values={[dots[j]]} labels={['']} signed max={maxDot} width={150}
                color={(v) => (v < 0 ? COLORS.neg : COLORS.pos)} fmtV={(v) => v.toFixed(1)} />
            </div>
            <div class={`fade ${step >= 4 ? 'on' : ''}`}>
              <Bars values={[d.probs[j]]} labels={['']} max={1} width={150} hl={j === best ? 0 : undefined}
                color={(v) => sequential(0.35 + v)} fmtV={(v) => v.toFixed(2)} />
            </div>
          </>;
        })}
        <div />
        <div />
        <div class={`fade ${step >= 2 ? 'on' : ''}`}><Shape dims={[T]} /> <span class="muted small">one score per token</span></div>
        <div class={`fade ${step >= 4 ? 'on' : ''}`}><Shape dims={[T]} /> <span class="muted small">Σ = 1</span></div>
      </div>
      <style>{`
        .sc { font-size: .8em; display: flex; flex-direction: column; gap: .6em; }
        .sc .qrow { display: grid; grid-template-columns: 6.5em 360px auto; gap: .8em; align-items: center; }
        .sc .qrow .k { font-size: .75em; text-align: right; }
        .sc .grid { display: grid; grid-template-columns: 6.5em 360px auto auto; gap: 2px .8em; align-items: center; }
        .sc .hdr { font-size: .65em; color: var(--fg); height: 1.6em; }
        .sc .t { font-size: .72em; text-align: right; transition: color .3s; }
        .sc .t.hl { color: var(--accent); font-weight: 700; }
        .sc .bars { font-size: .59em; }
        .sc .bars { grid-template-columns: var(--bw) auto; }
        .sc .bars .bl { display: none; }
        .sc .grid > .fade:last-child .shape, .sc .grid .shape { font-size: .72em; }
      `}</style>
    </div>
  );
}
