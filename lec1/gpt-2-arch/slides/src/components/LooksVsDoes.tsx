/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Bars, COLORS, Heatmap, Tok, diverging, sequential, useData } from './viz';

/**
 * Where a head looks vs. what it does. Two heads attend to ' Mary' almost the
 * same way, and push the prediction in opposite directions. Steps:
 *  1. each head's direct push on the ' Mary' − ' John' logit
 *  2. that push for all 144 heads
 */
export default function LooksVsDoes() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const { answer, wrong, pair, heads, logit_diff } = d.dla;
  const dla: number[][] = heads;
  const two: [number, number][] = [pair, d.focus];
  const toks: string[] = d.toks;
  const total = dla.flat().reduce((a, b) => a + b, 0);
  const name = ([l, h]: [number, number]) => `block ${l} head ${h}`;

  return (
    <div class="lvd" ref={root}>
      <div class="left">
        <div class="lbl">where they look, from <Tok t={toks[toks.length - 1]} /></div>
        <Heatmap data={two.map(([l, h]) => d.all_probs[l][h])} cell={30}
          color={(v) => sequential(Math.sqrt(v))}
          rowLabels={two.map((x) => <span class="hn">{name(x)}</span>)} colLabels={toks.map((t) => <Tok t={t} />)}
          tipFn={(r, c, v) => `${name(two[r])}: '${toks[c].trim()}' = <b>${v!.toFixed(2)}</b>`} />

        <div class={`push fade ${step >= 1 ? 'on' : ''}`}>
          <div class="lbl">what they do: push on <Tok t={answer} /> − <Tok t={wrong} /></div>
          <Bars values={two.map(([l, h]) => dla[l][h])} labels={two.map((x) => <span class="hn">{name(x)}</span>)}
            signed width={360} max={1.3} color={(v) => (v < 0 ? COLORS.neg : COLORS.pos)}
            fmtV={(v) => (v > 0 ? '+' : '') + v.toFixed(2)} />
          <div class="axis lbl"><span>← <Tok t={wrong} /></span><span><Tok t={answer} /> →</span></div>
        </div>
      </div>

      <div class={`right fade ${step >= 2 ? 'on' : ''}`}>
        <div class="lbl">all 144 heads · block ↓ head →</div>
        <Heatmap data={dla} cell={24} color={(v) => diverging(v, 0.6)} hlCells={two}
          rowLabels={dla.map((_, l) => `block ${l}`)} colLabels={dla[0].map((_, h) => String(h))}
          tipFn={(l, h, v) => `block ${l} head ${h} push = <b>${v! > 0 ? '+' : ''}${v!.toFixed(2)}</b>`} />
        <div class="sum lbl">
          sum of all heads {total > 0 ? '+' : ''}{total.toFixed(2)} · final <Tok t={answer} /> − <Tok t={wrong} /> logit {logit_diff > 0 ? '+' : ''}{logit_diff.toFixed(2)}
          <br />the mlps and embeddings account for the gap
        </div>
      </div>
      <style>{`
        .lvd { font-size: .8em; display: flex; gap: 3.5em; align-items: flex-start; padding-top: 1em; }
        .lvd .left { display: flex; flex-direction: column; gap: .4em; }
        .lvd .left .heat { margin-top: 2.6em; }
        .lvd .hn { font-family: var(--mono); font-size: 1.4em; color: var(--fg); }
        .lvd .push { margin-top: 1.4em; display: flex; flex-direction: column; gap: .4em; }
        .lvd .push .bars { font-size: .7em; }
        .lvd .push .hn { font-size: 1em; }
        .lvd .axis { display: flex; justify-content: space-between; width: 360px; margin-left: 4.2em; }
        .lvd .right { display: flex; flex-direction: column; gap: .4em; }
        .lvd .right .heat { margin-top: .8em; }
        .lvd .right .heat .hc.on { outline-color: var(--fg); }
        .lvd .sum { margin-top: .4em; max-width: 22em; line-height: 1.5; }
      `}</style>
    </div>
  );
}
