/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { highlight } from './Code';
import { COLORS } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * One lap of sum.s's loop on a 5-stage pipeline: instructions × cycles, one cell
 * per stage (F fetch, D decode, X execute, M memory, W write back).
 * Steps: one at a time (25 cycles) → overlapped (9) → our order has a load-use
 * bubble (add right after ld) → moving addi t1 up hides it → a branch has to be
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

const LD = 'ld   t3, 0(t0)', ADD = 'add  t2, t2, t3', ADDI0 = 'addi t0, t0, 8', ADDI1 = 'addi t1, t1, -1', BNE = 'bne  t1, zero, loop';
const C = 25; // columns, the same on every step so the grid doesn't jump

const STEPS: { rows: Row[]; cycles: number; total: ComponentChildren; text: ComponentChildren }[] = [
  {
    rows: [run(LD, 0), run(ADD, 5), run(ADDI0, 10), run(ADDI1, 15), run(BNE, 20)], cycles: C, total: '25 cycles',
    text: 'one lap of our loop. every instruction goes through 5 stages. one at a time: 5 × 5 = 25 cycles, and 4 of the 5 stages sit idle',
  },
  {
    rows: [run(LD, 0), run(ADD, 1), run(ADDI0, 2), run(ADDI1, 3), run(BNE, 4)], cycles: C, total: '9 cycles',
    text: 'pipelined: start the next instruction as soon as fetch is free, like a laundry line. once it\'s full, one finishes every cycle. (if no instruction had to wait for another…)',
  },
  {
    rows: [run(LD, 0), run(ADD, 1, { note: 'needs t3' }, { before: 'X', n: 1 }), run(ADDI0, 2, {}, { before: 'D', n: 1 }),
      run(ADDI1, 3, {}, { before: 'F', n: 1 }), run(BNE, 5)],
    cycles: C, total: '10 cycles',
    text: <>but our <code>add</code> needs t3, and the <code>ld</code> only has it at the end of M. the add waits a cycle: a <b>bubble</b>, and everything behind it waits too</>,
  },
  {
    rows: [run(LD, 0), run(ADDI1, 1, { note: 'doesn\'t need t3' }), run(ADD, 2, { note: 't3 ready just in time' }), run(ADDI0, 3), run(BNE, 4)],
    cycles: C, total: '9 cycles',
    text: <>fix: move <code>addi t1</code> up between them. same answer, no bubble. compilers reorder like this for you, because they know the pipeline</>,
  },
  {
    rows: [run(LD, 0), run(ADDI1, 1), run(ADD, 2), run(ADDI0, 3), run(BNE, 4, { note: 'jump? known in X' }),
      cut(run(LD, 5, { guess: true, note: 'guess: jump' }), 6), cut(run(ADDI1, 6, { guess: true }), 6)],
    cycles: C, total: '…',
    text: <>the bne is only decided in X (cycle 7), but fetch needs the next instruction in cycle 6. so the cpu <b>guesses</b>. loops almost always go around again, so it guesses "jump" and keeps fetching</>,
  },
  {
    rows: [run(LD, 0), run(ADDI1, 1), run(ADD, 2), run(ADDI0, 3), run(BNE, 4, { note: 't1 = 0: no jump!' }),
      cut(run(LD, 5, { flushed: true, note: 'thrown away' }), 6), cut(run(ADDI1, 6, { flushed: true }), 6),
      run('la   t4, total', 7, { note: 'after the loop' })],
    cycles: C, total: '12 cycles',
    text: <>on lap 8 the guess is wrong: the 2 guessed instructions are thrown away and fetch restarts after the loop. 2 cycles lost here; ~15–20 on a big modern core</>,
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
        .pipeline .pl-cell { width: 1.45em; height: 1.35em; padding: 0; background: var(--sunken); border-radius: 4px; }
        .pipeline .pl-st { width: 100%; height: 100%; border-radius: 4px; display: flex; align-items: center; justify-content: center;
          font: .55em var(--mono); color: var(--fg); animation: pl-in .25s both; }
        .pipeline .pl-st.bubble { background: repeating-linear-gradient(135deg, var(--faint) 0 2px, transparent 2px 7px); }
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
