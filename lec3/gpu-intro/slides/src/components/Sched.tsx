/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';

/**
 * One warp scheduler (a quarter of an sm), n warps parked on it, each running brighten's shape: 2 instructions (work out my pixel, ask for
 * it), a long sleep until the 32 pixels arrive, then 3 more (multiply, cap at 255, store). Rows are warps, columns are
 * cycles; the bottom row is the scheduler itself. It's a small simulation, not a measurement: every cycle the
 * scheduler issues one instruction from the first warp that is ready (nvidia doesn't document how it
 * really picks), and a load comes back WAIT cycles after it was sent. The real wait is a few hundred cycles, so real
 * warps sleep even more of the time than these do.
 */
const PRE = 2, POST = 3, WAIT = 30, COLS = 104;
type Cell = 'run' | 'sleep' | 'idle';

function simulate(n: number) {
  const done = Array(n).fill(0);       // instructions each wave has run
  const wake = Array(n).fill(0);       // cycle its loads are back
  const rows: Cell[][] = Array.from({ length: n }, () => []);
  const busy: boolean[] = [];
  let end = 0;
  for (let c = 0; c < COLS; c++) {
    const pick = done.findIndex((d, w) => d < PRE + POST && !(d === PRE && c < wake[w]));
    for (let w = 0; w < n; w++) {
      const asleep = done[w] === PRE && c < wake[w];
      rows[w].push(w === pick ? 'run' : asleep ? 'sleep' : 'idle');
    }
    busy.push(pick >= 0);
    if (pick >= 0) {
      done[pick]++;
      if (done[pick] === PRE) wake[pick] = c + 1 + WAIT;
      if (done.every((d) => d === PRE + POST)) { end = c + 1; break; }
    }
  }
  return { rows, busy, end, work: busy.filter(Boolean).length };
}

const N = [1, 2, 16];
const one = simulate(1);
const TEXT: ((s: ReturnType<typeof simulate>) => ComponentChildren)[] = [
  (s) => <>one warp: ask for pixels, sleep until they arrive, finish. busy {s.work} of {s.end} cycles</>,
  () => <>a second warp runs while the first one sleeps. switching is free</>,
  (s) => <>16 warps: busy {Math.round(100 * s.work / s.end)}% of the time, <b>16× the work in {(s.end / one.end).toFixed(1)}× the time</b>. that's why you launch thousands of threads (a small simulation; real waits are longer)</>,
];

export default function Sched() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(N.length - 1, useSlideStep(root));
  const s = simulate(N[k]);
  return (
    <div class="sched" ref={root}>
      <div class="sc-leg muted">
        <span><b class="run" /> running an instruction</span><span><b class="sleep" /> asleep, waiting for its pixels</span>
        <span class="sc-tot">{N[k]} warp{N[k] > 1 ? 's' : ''} · {N[k] * 32} pixels · {s.end} cycles</span>
      </div>
      <div class="sc-grid" key={k}>
        {Array.from({ length: 16 }, (_, w) => (
          <div class={`sc-row ${w < N[k] ? '' : 'none'}`}>
            <span class="sc-l">{w < N[k] ? `warp ${w}` : ''}</span>
            {Array.from({ length: COLS }, (_, c) => <i class={s.rows[w]?.[c] ?? 'idle'} />)}
          </div>
        ))}
        <div class="sc-row sc-simd">
          <span class="sc-l">scheduler</span>
          {Array.from({ length: COLS }, (_, c) => <i class={s.busy[c] ? 'busy' : c < s.end ? 'free' : 'idle'} />)}
        </div>
      </div>
      <div class="caption sc-text">{TEXT[k](s)}</div>
      <style>{`
        .sched .sc-leg { display: flex; gap: 1.6em; font-size: .52em; margin-bottom: .5em; align-items: center; }
        .sched .sc-leg b { display: inline-block; width: 1em; height: 1em; border-radius: 3px; vertical-align: -.12em; }
        .sched .sc-tot { margin-left: auto; color: var(--fg); font-size: 1.15em; }
        .sched .sc-row { display: grid; grid-template-columns: 5.5em repeat(${COLS}, 1fr); gap: 2px; margin-bottom: 2px; height: 16px; }
        .sched .sc-row.none { opacity: .25; }
        .sched .sc-l { font: .42em/16px var(--mono); color: var(--muted); }
        .sched .sc-row i { border-radius: 2px; background: var(--sunken); }
        .sched .run, .sched .sc-row i.run { background: var(--accent); }
        .sched .sleep, .sched .sc-row i.sleep { background: repeating-linear-gradient(135deg, var(--faint) 0 2px, transparent 2px 5px); }
        .sched .sc-simd { margin-top: 8px; height: 22px; }
        .sched .sc-simd .sc-l { line-height: 22px; color: var(--fg); }
        .sched .sc-row i.busy { background: var(--good); } .sched .sc-row i.free { background: var(--fill-red); }
        .sched .sc-text { font-size: .76em; min-height: 3.3em; margin-top: .7em; }
      `}</style>
    </div>
  );
}
