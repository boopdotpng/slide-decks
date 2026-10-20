/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Bars, Strip, useData } from './viz';
import { Ch, CH_CSS } from './RnnCommon';

/**
 * One step of the rnn: this character + the memory so far -> new memory -> a guess.
 * Real h vectors from rnn_unroll ("To be, or not to be"), at the 'e' of "be".
 *   0 the character comes in · 1 the memory comes in · 2 they mix into a new memory · 3 the guess
 */
const T = 4;
export default function RnnStep() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<{ chars: string[]; h: number[][]; top: [string, number][][] }>('rnn_unroll');
  if (!d) return <div ref={root} />;
  const on = (s: number) => `fade ${step >= s ? 'on' : ''}`;
  const top = d.top[T];
  return (
    <div class="rs" ref={root}>
      <div class={`guess ${on(3)}`}>
        <Bars values={top.map((t) => t[1])} labels={top.map((t) => <Ch c={t[0]} />)} max={1}
          fmtV={(v) => `${Math.round(v * 100)}%`} width={220} />
        <div class="cap muted">guess the next character</div>
        <div class="arr">↑</div>
      </div>

      <div class={`old ${on(1)}`}>
        <div class="cap muted">memory so far <span class="dim">h · {d.h[0].length} numbers</span></div>
        <Strip values={d.h[T - 1]} scale={1} height={34} />
        <div class="seen muted">after reading “{d.chars.slice(0, T).map((c) => <Ch c={c} />)}”</div>
      </div>
      <div class={`arr side a1 ${on(1)}`}>→</div>
      <div class="cell">
        <div class="mix">mix</div>
        <div class={`f muted ${on(2)}`}>tanh(x·W<sub>xh</sub> + h·W<sub>hh</sub> + b)</div>
      </div>
      <div class={`arr side a2 ${on(2)}`}>→</div>
      <div class={`new ${on(2)}`}>
        <div class="cap muted">new memory <span class="dim">h</span></div>
        <Strip values={d.h[T]} scale={1} height={34} />
        <div class="seen muted">now it has read “{d.chars.slice(0, T + 1).map((c) => <Ch c={c} />)}”</div>
      </div>

      <div class="in">
        <div class="arr">↑</div>
        <div class="char"><Ch c={d.chars[T]} /></div>
        <div class="cap muted">this character <span class="dim">x</span></div>
      </div>
      <style>{`
        ${CH_CSS}
        .rs { display: grid; grid-template-columns: 1fr auto auto auto 1fr; grid-template-rows: auto auto auto;
          column-gap: 1em; row-gap: .4em; align-items: center; font-size: .8em; }
        .rs .guess { grid-column: 3; grid-row: 1; display: flex; flex-direction: column; align-items: center; }
        .rs .old { grid-column: 1; grid-row: 2; }
        .rs .a1 { grid-column: 2; grid-row: 2; } .rs .a2 { grid-column: 4; grid-row: 2; }
        .rs .cell { grid-column: 3; grid-row: 2; border: 2px solid var(--accent); border-radius: 14px; padding: .7em 1.4em;
          text-align: center; background: var(--panel); }
        .rs .new { grid-column: 5; grid-row: 2; }
        .rs .in { grid-column: 3; grid-row: 3; display: flex; flex-direction: column; align-items: center; }
        .rs .mix { font-weight: 700; font-size: 1.2em; }
        .rs .f { font-family: var(--mono); font-size: .75em; white-space: nowrap; margin-top: .3em; }
        .rs .arr { color: var(--accent); font-size: 1.4em; line-height: 1; }
        .rs .char { font-size: 2em; color: var(--accent); border: 2px solid var(--border); border-radius: 8px; padding: 0 .5em; }
        .rs .cap { font-size: .75em; margin: .2em 0; }
        .rs .dim { font-family: var(--mono); opacity: .7; margin-left: .4em; }
        .rs .seen { font-size: .7em; margin-top: .3em; }
        .rs .bars { font-size: 1.05em; }
      `}</style>
    </div>
  );
}
