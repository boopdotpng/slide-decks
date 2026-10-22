/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { range } from './viz';

/**
 * From a chain to direct links. Schematic.
 *   0 rnn: the last character reaches the first only through 18 hand-offs of h
 *   1 attention: the last character looks straight at every earlier one
 *   2 every position does that, all at once
 *   3 → a transformer
 */
const TEXT = 'To be, or not to be';
const W = 1400, X0 = 60, DX = (W - 2 * X0) / (TEXT.length - 1), Y = 440;
const x = (i: number) => X0 + i * DX;
const arc = (i: number, j: number) => {
  const h = Math.abs(x(i) - x(j)) * 0.3 + 15;
  return `M ${x(i)} ${Y - 34} C ${x(i)} ${Y - 34 - h}, ${x(j)} ${Y - 34 - h}, ${x(j)} ${Y - 34}`;
};
const CAPS = [
  <>rnn: the last character only hears about <b class="o">T</b> through 18 hand-offs of h, each one squeezing and overwriting</>,
  <>attention: the last character looks <b>straight at</b> every earlier one, and picks what it needs</>,
  <>every position does this, all at the same time. nothing is handed along, nothing has to wait</>,
  <>that's a transformer: this look-back, stacked a few layers deep</>,
];
export default function RnnToAttn() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const last = TEXT.length - 1;
  const chars = [...TEXT];
  return (
    <div class="rta" ref={root}>
      <svg viewBox={`0 0 ${W} ${Y + 40}`}>
        <g class={`chain ${step === 0 ? 'on' : ''}`}>
          {range(last).map((i) => <path d={`M ${x(i) + 16} ${Y - 10} L ${x(i + 1) - 16} ${Y - 10}`} />)}
        </g>
        <g class={`all ${step >= 2 ? 'on' : ''}`}>
          {range(last).flatMap((i) => range(i).map((j) => <path d={arc(i, j)} />))}
        </g>
        <g class={`one ${step >= 1 ? 'on' : ''}`}>
          {range(last).map((j) => <path d={arc(last, j)} />)}
        </g>
        {chars.map((c, i) => (
          <text x={x(i)} y={Y} class={`c ${c === ' ' ? 'sp' : ''} ${i === last && step >= 1 ? 'me' : ''} ${i === 0 && step === 0 ? 'first' : ''}`}>
            {c === ' ' ? '·' : c}
          </text>
        ))}
      </svg>
      <div class="cap">{CAPS[Math.min(step, CAPS.length - 1)]}</div>
      <style>{`
        .rta svg { width: 100%; display: block; overflow: visible; }
        .rta .c { font-family: var(--mono); font-size: 44px; fill: var(--fg); text-anchor: middle; transition: fill .3s; }
        .rta .c.sp { fill: var(--muted); }
        .rta .c.me { fill: var(--accent); font-weight: 700; }
        .rta .c.first { fill: var(--hot); font-weight: 700; }
        .rta path { fill: none; stroke-linecap: round; }
        .rta .chain path { stroke: var(--muted); stroke-width: 3; }
        .rta .chain { opacity: 0; transition: opacity .4s; }
        .rta .chain.on { opacity: 1; }
        .rta .one path { stroke: var(--accent); stroke-width: 3; }
        .rta .one { opacity: 0; transition: opacity .4s; }
        .rta .one.on { opacity: 1; }
        .rta .all path { stroke: var(--accent); stroke-width: 1.2; opacity: .18; }
        .rta .all { opacity: 0; transition: opacity .5s; }
        .rta .all.on { opacity: 1; }
        .rta .cap { font-size: .75em; margin-top: 1em; min-height: 2.6em; }
        .rta .cap b { color: var(--accent); }
        .rta .cap b.o { color: var(--hot); }
      `}</style>
    </div>
  );
}
