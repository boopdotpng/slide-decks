/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { Timeline } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Four instructions on a cycle timeline. Step 0 runs them in order; step 1
 * runs the independent ones while the load waits; step 2 shows results still
 * becoming visible ("committing") in program order: finished instructions wait
 * (hatched) for everything before them. Cycle counts are illustrative.
 */

// plain-language ops: the deck shows no assembly until the risc-v part
const PROGRAM = [
  { op: 'x = memory[p]', note: 'load: slow' },
  { op: 'y = x + 1', note: 'needs x' },
  { op: 'z = a × b', note: 'independent' },
  { op: 'w = c + d', note: 'independent' },
];
const IN_ORDER = [[0, 6], [6, 7], [7, 9], [9, 10]];
const OUT_OF_ORDER = [[0, 6], [6, 7], [1, 3], [1, 2]];
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
      <Timeline units={10} msPerUnit={MS_PER_CYCLE} run={step === 0 ? 'in' : 'ooo'}
        title={<>{step === 0 ? 'in order' : 'out of order'}: <strong>{total} cycles</strong>
          <span class={`fade ${step >= 2 ? 'on' : ''}`}> · <span class="wait-key" /> done, waiting to commit</span></>}
        rows={PROGRAM.map((p, k) => ({
          label: <code style={{ background: 'none', padding: 0 }}>{p.op}</code>,
          note: p.note, start: times[k][0], end: times[k][1], wait: step >= 2 ? commit[k] : undefined,
        }))}
        afterTitle={<span class={`fade ${step >= 2 ? 'on' : ''}`}>committed</span>}
        after={(_, k) => step >= 2 && (
          <span class="pop" style={{ animationDelay: `${commit[k] * MS_PER_CYCLE}ms` }}>{k + 1} ✓</span>
        )} />
      <style>{`.wait-key { display: inline-block; width: 1.6em; height: .8em; vertical-align: middle; opacity: .5;
        background: repeating-linear-gradient(135deg, var(--muted) 0 2px, transparent 2px 7px); border-radius: 2px; }`}</style>
      <p class={`muted fade ${step >= 2 ? 'on' : ''}`} style={{ fontSize: '.8em' }}>your program can't tell: it behaves <em>as if</em> they ran one at a time, in order</p>
    </div>
  );
}
