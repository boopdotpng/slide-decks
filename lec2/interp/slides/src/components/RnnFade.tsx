/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { useData } from './viz';
import { Ch, CH_CSS } from './RnnCommon';

/**
 * How far back does the rnn really look? Swap one character k steps back for a random one and
 * measure how much the guess for the next character moves (0% = same guess, 100% = completely different).
 * Bars sit under the character they measure. Real: rnn_fade_line (this line) and rnn_fade (500 snippets).
 *   0 the line · 1 the bars · 2 the average over 500 snippets
 */
const AT = [1, 10, 20, 40];
export default function RnnFade() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const line = useData<{ ctx: string; next: string; p_next: number; moved: number[] }>('rnn_fade_line');
  const avg = useData<{ moved: number[]; n: number }>('rnn_fade');
  if (!line || !avg) return <div ref={root} />;
  const N = line.ctx.length;
  const max = Math.max(...line.moved);
  const pct = (v: number) => (v >= 0.01 ? `${Math.round(v * 100)}%` : `${(v * 100).toFixed(2)}%`);
  return (
    <div class="rf" ref={root}>
      <div class="grid" style={{ gridTemplateColumns: `repeat(${N}, 1fr) auto` }}>
        {[...line.ctx].map((_, j) => {
          const v = line.moved[N - 1 - j];
          return <div class="bar"><div class={`fill ${step >= 1 ? 'on' : ''}`} style={{ height: `${(v / max) * 100}%` }} /></div>;
        })}
        <div />
        {[...line.ctx].map((c) => <div class="c"><Ch c={c} /></div>)}
        <div class="c q">?</div>
        <div class="axis muted" style={{ gridColumn: `1 / ${N + 1}` }}>
          <span>← {N} characters back</span><span>1 back →</span>
        </div>
      </div>
      <div class="caps">
        <div class="cap muted">
          {step === 0
            ? <>the guess for <span class="q">?</span>: swap one earlier character for a random one. does the guess change?</>
            : <>bar = how much the guess changes. the start of the line barely counts: every step rewrote h, and what those characters put there got mixed away</>}
        </div>
        <div class={`avg fade ${step >= 2 ? 'on' : ''}`}>
          <span class="muted">average over {avg.n} snippets:</span>
          {AT.map((k) => <span class="pt"><b>{pct(avg.moved[k - 1])}</b> <span class="muted">{k} back</span></span>)}
        </div>
      </div>
      <style>{`
        ${CH_CSS}
        .rf { font-size: .8em; }
        .rf .grid { display: grid; column-gap: 1px; align-items: end; }
        .rf .bar { height: 230px; display: flex; align-items: flex-end; }
        .rf .bar .fill { width: 100%; background: var(--accent); border-radius: 2px 2px 0 0; transform-origin: bottom;
          transform: scaleY(0); transition: transform .5s; }
        .rf .bar .fill.on { transform: scaleY(1); }
        .rf .c { text-align: center; font-size: .72em; padding-top: .3em; border-top: 1px solid var(--border); }
        .rf .c.q { padding-left: .4em; border-top: none; }
        .rf .q { color: var(--accent); font-weight: 700; font-family: var(--mono); }
        .rf .axis { display: flex; justify-content: space-between; font-size: .55em; margin-top: .3em; }
        .rf .caps { margin-top: 1em; font-size: .75em; }
        .rf .avg { display: flex; gap: 1.6em; margin-top: .6em; }
        .rf .avg b { color: var(--fg); font-family: var(--mono); }
      `}</style>
    </div>
  );
}
