/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { highlight } from './Code';
import { COLORS } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * The sum loop's body on a 5-stage pipeline: instructions × cycles, one cell per
 * stage (F fetch, D decode, X execute, M memory, W write back).
 * Steps: one at a time (20 cycles) → overlapped (8) → load-use bubble when add
 * comes right after the ld → clang's real order hides it → a branch has to be
 * guessed → a wrong guess flushes what was fetched behind it.
 * Simple textbook pipeline with forwarding: a loaded value can be used one
 * cycle after M; an alu result in the next X; a branch resolves in X.
 */

type Stage = 'F' | 'D' | 'X' | 'M' | 'W';
type Row = {
  op: string;
  /** cycle each stage happens in; '-' = bubble (stalled) cycle, drawn hatched */
  cells: [number, Stage | '-'][];
  guess?: boolean;   // fetched on a prediction
  flushed?: boolean; // thrown away
  note?: string;
};

const run = (op: string, start: number, extra: Partial<Row> = {}, stall: { before: Stage; n: number } | null = null): Row => {
  const cells: [number, Stage | '-'][] = [];
  let c = start;
  for (const s of ['F', 'D', 'X', 'M', 'W'] as Stage[]) {
    if (stall && s === stall.before) for (let k = 0; k < stall.n; k++) cells.push([c++, '-']);
    cells.push([c++, s]);
  }
  return { op, cells, ...extra };
};
const cut = (r: Row, upTo: number): Row => ({ ...r, cells: r.cells.filter(([c]) => c <= upTo) });

const LD = 'ld   a3, 0(a0)', ADDI = 'addi a0, a0, 8', ADD = 'add  a2, a3, a2', BNE = 'bne  a0, a1, loop';

const STEPS: { rows: Row[]; cycles: number; total: ComponentChildren; text: ComponentChildren }[] = [
  {
    rows: [run(LD, 0), run(ADDI, 5), run(ADD, 10), run(BNE, 15)], cycles: 20, total: '20 cycles',
    text: 'every instruction goes through 5 stages. one at a time: 4 instructions × 5 = 20 cycles, and 4 of 5 stages sit idle',
  },
  {
    rows: [run(LD, 0), run(ADDI, 1), run(ADD, 2), run(BNE, 3)], cycles: 20, total: '8 cycles',
    text: 'pipelined: start the next one as soon as fetch is free. same 4 instructions in 8 cycles, and once it\'s full, one finishes every cycle',
  },
  {
    rows: [run(LD, 0), run(ADD, 1, { note: 'needs a3' }, { before: 'X', n: 1 }), run(ADDI, 2, {}, { before: 'D', n: 1 }), run(BNE, 3, {}, { before: 'F', n: 1 })],
    cycles: 20, total: '9 cycles',
    text: <>but if <code>add</code> comes right after the <code>ld</code>, a3 isn't loaded yet (it arrives at the end of M). the add waits a cycle: a <b>bubble</b>, and everything behind it waits too</>,
  },
  {
    rows: [run(LD, 0), run(ADDI, 1, { note: 'independent' }), run(ADD, 2, { note: 'a3 ready in time' }), run(BNE, 3)], cycles: 20, total: '8 cycles',
    text: <>that's why clang put the <code>addi</code> between them (it's the real order): the add starts one cycle later, exactly when a3 is ready. no bubble</>,
  },
  {
    rows: [run(LD, 0), run(ADDI, 1), run(ADD, 2), run(BNE, 3, { note: 'taken? known in X' }),
      cut(run(LD, 4, { guess: true, note: 'guess: taken' }), 5), cut(run(ADDI, 5, { guess: true }), 5)],
    cycles: 20, total: '…',
    text: <>the bne isn't decided until X (cycle 6), but fetch needs the next instruction at cycle 5. so the cpu <b>guesses</b>. loop branches are almost always taken, so it guesses "loop again" and keeps fetching</>,
  },
  {
    rows: [run(LD, 0), run(ADDI, 1), run(ADD, 2), run(BNE, 3, { note: 'not taken!' }),
      cut(run(LD, 4, { flushed: true, note: 'thrown away' }), 5), cut(run(ADDI, 5, { flushed: true }), 5),
      run('mv   a0, a2', 6, { note: 'after the loop' })],
    cycles: 20, total: '11 cycles',
    text: <>on the last iteration the guess is wrong: the 2 guessed instructions are thrown away and fetch restarts after the loop. 2 cycles lost here; ~15–20 on a big modern core</>,
  },
];

const MAX_ROWS = Math.max(...STEPS.map((s) => s.rows.length));

const STAGE_COLOR: Record<Stage, string> = {
  F: COLORS.slate, D: COLORS.blue, X: COLORS.amber, M: COLORS.violet, W: COLORS.green,
};

export default function Pipeline() {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];

  return (
    <div class="pipeline" ref={root}>
      <div class="pl-legend muted">
        {(Object.keys(STAGE_COLOR) as Stage[]).map((s) => (
          <span><b style={{ background: STAGE_COLOR[s] }}>{s}</b> {{ F: 'fetch', D: 'decode', X: 'execute', M: 'memory', W: 'write back' }[s]}</span>
        ))}
        <span class="pl-total">total: <strong>{cur.total}</strong></span>
      </div>
      <table class="pl-grid"><tbody>
        <tr>
          <th></th>
          {Array.from({ length: cur.cycles }, (_, c) => <th class="pl-c">{c + 1}</th>)}
          <th></th>
        </tr>
        {cur.rows.map((r) => (
          <tr key={`${step}-${r.op}-${r.cells[0][0]}`} class={`${r.guess ? 'guess' : ''} ${r.flushed ? 'flushed' : ''}`}>
            <td class="pl-op"><code>{highlight(r.op, 'asm')}</code></td>
            {Array.from({ length: cur.cycles }, (_, c) => {
              const cell = r.cells.find(([k]) => k === c);
              if (!cell) return <td class="pl-cell" />;
              const s = cell[1];
              return (
                <td class="pl-cell">
                  <div class={`pl-st ${s === '-' ? 'bubble' : ''}`}
                    style={{ background: s === '-' ? undefined : STAGE_COLOR[s], animationDelay: `${c * 90}ms` }}>
                    {s === '-' ? '' : s}
                  </div>
                </td>
              );
            })}
            <td class="pl-note muted">{r.note}</td>
          </tr>
        ))}
        {/* pad to the tallest step so the slide doesn't jump */}
        {Array.from({ length: MAX_ROWS - cur.rows.length }, () => (
          <tr class="pl-pad"><td class="pl-op">&nbsp;</td><td class="pl-cell" /></tr>
        ))}
      </tbody></table>
      <div class="caption pl-text">{cur.text}</div>
      <style>{`
        .pipeline { font-size: .9em; }
        .pipeline .pl-legend { display: flex; gap: 1.1em; font-size: .55em; margin-bottom: .6em; align-items: center; }
        .pipeline .pl-legend b { display: inline-block; width: 1.6em; text-align: center; border-radius: 4px; color: var(--fg); }
        .pipeline .pl-total { margin-left: auto; font-size: 1.4em; }
        .pipeline .pl-total strong { color: var(--fg); }
        .pipeline .pl-grid { border-collapse: separate; border-spacing: 3px; }
        .pipeline .pl-grid th { font-size: .42em; text-align: center; padding: 0; color: var(--muted); }
        .pipeline .pl-op { font-size: .6em; padding: 0 .8em 0 0; white-space: nowrap; }
        .pipeline .pl-op code { background: none; padding: 0; white-space: pre; }
        .pipeline .pl-cell { width: 1.45em; height: 1.35em; padding: 0; background: #121212; border-radius: 4px; }
        .pipeline .pl-st { width: 100%; height: 100%; border-radius: 4px; display: flex; align-items: center; justify-content: center;
          font: .55em var(--mono); color: var(--fg); animation: pl-in .25s both; }
        .pipeline .pl-st.bubble { background: repeating-linear-gradient(135deg, #555 0 2px, transparent 2px 7px); }
        @keyframes pl-in { from { opacity: 0; transform: scale(.6); } }
        .pipeline tr.guess .pl-st { outline: 2px dashed ${COLORS.hot}; outline-offset: -2px; }
        .pipeline tr.flushed .pl-st { opacity: .3; }
        .pipeline tr.flushed .pl-op { text-decoration: line-through; opacity: .5; }
        .pipeline tr.pl-pad .pl-cell { visibility: hidden; }
        .pipeline .pl-note { font-size: .5em; white-space: nowrap; padding-left: .6em; }
        .pipeline .pl-text { font-size: .72em; min-height: 3.2em; margin-top: .6em; }
      `}</style>
    </div>
  );
}
