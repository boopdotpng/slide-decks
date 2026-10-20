/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { Timeline } from './viz';
import { highlight } from './Code';
import { useSlideStep } from '../deck/hooks';

/**
 * The sum loop, one and a bit iterations, on a cycle timeline. Step 0 runs them
 * in order; step 1 starts each one as soon as its inputs are ready, while the
 * load waits on memory; step 2 shows results still becoming visible
 * ("committing") in program order: finished instructions wait (hatched) for
 * everything before them. Cycle counts are illustrative (a short cache miss).
 */

// clang's real loop body, then the next iteration's load
const PROGRAM = [
  { op: 'ld   a3, 0(a0)', note: 'slow: cache miss' },
  { op: 'addi a0, a0, 8', note: 'independent' },
  { op: 'add  a2, a3, a2', note: 'needs a3' },
  { op: 'bne  a0, a1, loop', note: 'needs a0' },
  { op: 'ld   a3, 0(a0)', note: 'next iteration' },
];
const IN_ORDER = [[0, 6], [6, 7], [7, 8], [8, 9], [9, 15]];
const OUT_OF_ORDER = [[0, 6], [1, 2], [6, 7], [2, 3], [3, 9]];
const MS_PER_CYCLE = 280;

// results commit in program order: each waits for itself and everything before it
const commit = OUT_OF_ORDER.reduce<number[]>((acc, [, end], k) => [...acc, Math.max(end, acc[k - 1] ?? 0)], []);

export default function OutOfOrder() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const times = step === 0 ? IN_ORDER : OUT_OF_ORDER;
  const total = Math.max(...times.map(([, e]) => e));

  return (
    <div ref={root}>
      {/* run only changes in → out of order, so step 2 doesn't regrow the bars */}
      <Timeline units={15} msPerUnit={MS_PER_CYCLE} run={step === 0 ? 'in' : 'ooo'}
        title={<>{step === 0 ? 'in order' : 'out of order'}: <strong>{total} cycles</strong>
          <span class={`fade ${step >= 2 ? 'on' : ''}`}> · <span class="wait-key" /> done, waiting to commit</span></>}
        rows={PROGRAM.map((p, k) => ({
          label: <code style={{ background: 'none', padding: 0, whiteSpace: 'pre' }}>{highlight(p.op, 'asm')}</code>,
          note: p.note, start: times[k][0], end: times[k][1], wait: step >= 2 ? commit[k] : undefined,
        }))}
        afterTitle={<span class={`fade ${step >= 2 ? 'on' : ''}`}>committed</span>}
        after={(_, k) => step >= 2 && (
          <span class="pop" style={{ animationDelay: `${commit[k] * MS_PER_CYCLE}ms` }}>{k + 1} ✓</span>
        )} />
      <style>{`.wait-key { display: inline-block; width: 1.6em; height: .8em; vertical-align: middle; opacity: .5;
        background: repeating-linear-gradient(135deg, var(--muted) 0 2px, transparent 2px 7px); border-radius: 2px; }`}</style>
      <p class="muted" style={{ fontSize: '.75em', minHeight: '2.6em' }}>{[
        'in order: everything waits behind the slow load',
        <>out of order: start anything whose inputs are ready. the next iteration's load starts early too (it writes a3 while the old a3 is still needed: next slide)</>,
        <>results still become visible in program order (the reorder buffer). your program can't tell: it behaves <em>as if</em> they ran one at a time</>,
      ][Math.min(step, 2)]}</p>
    </div>
  );
}
