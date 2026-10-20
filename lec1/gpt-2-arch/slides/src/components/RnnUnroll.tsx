/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Strip, useData } from './viz';
import { Ch, CH_CSS } from './RnnCommon';

/**
 * The same step, once per character, left to right. Each column: the character in, h after it
 * (all of its numbers, as a vertical strip), the top guess for the next character (green when right).
 * Real values from rnn_unroll. SHOW[step] = how many columns are visible.
 */
const SHOW = [1, 2, 5, 10, 19];
export default function RnnUnroll() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<{ chars: string[]; h: number[][]; top: [string, number][][] }>('rnn_unroll');
  if (!d) return <div ref={root} />;
  const n = SHOW[Math.min(step, SHOW.length - 1)];
  const right = d.chars.map((_, t) => d.chars[t + 1] !== undefined && d.top[t][0][0] === d.chars[t + 1]);
  return (
    <div class="ru" ref={root}>
      <div class="grid" style={{ gridTemplateColumns: `auto repeat(${d.chars.length}, 1fr)` }}>
        <div class="rl muted">guess</div>
        {d.chars.map((_, t) => (
          <div class={`g ${t < n ? 'on' : ''} ${right[t] ? 'ok' : ''}`}>
            <Ch c={d.top[t][0][0]} /><span class="p">{Math.round(d.top[t][0][1] * 100)}%</span>
          </div>
        ))}
        <div class="rl muted">h</div>
        {d.chars.map((_, t) => (
          <div class={`h ${t < n ? 'on' : ''}`}>
            <Strip values={d.h[t]} scale={1} vertical height={230} width={18} />
            {t < d.chars.length - 1 && <span class="to">→</span>}
          </div>
        ))}
        <div class="rl muted">read</div>
        {d.chars.map((c, t) => <div class={`x ${t < n ? 'on' : ''} ${t === n - 1 ? 'cur' : ''}`}><Ch c={c} /></div>)}
      </div>
      <div class={`cap muted fade ${step >= SHOW.length - 1 ? 'on' : ''}`}>
        the same mix, {d.chars.length} times. the only thing handed from one step to the next is h
      </div>
      <style>{`
        ${CH_CSS}
        .ru { font-size: .8em; }
        .ru .grid { display: grid; column-gap: .35em; row-gap: .5em; align-items: center; justify-items: center; }
        .ru .rl { font-size: .6em; justify-self: end; padding-right: .5em; }
        .ru .g, .ru .h, .ru .x { opacity: 0; transition: opacity .3s; }
        .ru .on { opacity: 1; }
        .ru .g { display: flex; flex-direction: column; align-items: center; font-size: .85em; line-height: 1.1; }
        .ru .g .p { font-size: .5em; color: var(--muted); }
        .ru .g.ok .ch { color: #8ddb8c; }
        .ru .h { position: relative; }
        .ru .h .to { position: absolute; left: calc(100% + .02em); top: 50%; transform: translateY(-50%); color: var(--accent); font-size: .6em; }
        .ru .x { font-size: 1.1em; padding: 0 .15em; border-radius: 5px; }
        .ru .x.cur { background: var(--hl); }
        .ru .cap { margin-top: .9em; font-size: .75em; }
      `}</style>
    </div>
  );
}
