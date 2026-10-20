/** @jsxImportSource preact */
import { useRef, useState } from 'preact/hooks';
import Code from './Code';
import { COLORS } from './viz';
import { useFrame, useSlideStep } from '../deck/hooks';

/**
 * An array of 64 longs (8 cache lines of 64 B) and a loop reading it. Each step
 * replays one walk by itself, one load at a time; misses take longer on screen
 * than hits so you can feel the difference, and the counters use real-ish ns.
 *   0  the array, split into lines. no walk yet
 *   1  in order: one miss per line, then 7 hits
 *   2  every 8th long: same 8 lines, but each load is a miss
 *   3  in order, with a prefetcher: only the first line misses
 * Numbers: ram ~70 ns per miss, l1 ~0.7 ns per hit (ryzen 9 7950x, slide 27).
 */

const N = 64, PER_LINE = 8;
const RAM_NS = 70, L1_NS = 0.7;
// on-screen ms per access: compressed, but misses still clearly slower
const MISS_MS = 550, HIT_MS = 70, PF_MS = 70;

type Kind = 'miss' | 'hit' | 'pf';
type Walk = { code: string; idx: number[]; prefetch?: boolean; text: string };

const range = (n: number, by = 1) => Array.from({ length: n }, (_, k) => k * by);
const WALKS: (Walk | null)[] = [
  null,
  { code: 'for (i = 0; i < 64; i++)\n    total += a[i];', idx: range(64),
    text: 'a miss brings in the whole line, so the next 7 loads hit' },
  { code: 'for (i = 0; i < 64; i += 8)\n    total += a[i];', idx: range(8, 8),
    text: 'every 8th long: each load lands in a new line. 8 loads, 8 misses: about as slow as the 64 loads before' },
  { code: 'for (i = 0; i < 64; i++)\n    total += a[i];', idx: range(64), prefetch: true,
    text: 'real cpus have a prefetcher: it sees you walking forward and fetches the next lines before you ask. that\'s why walking an array in order is fast' },
];
const CAPTION0 = 'a long is 8 bytes. memory moves to the cache in 64-byte lines: 8 longs at a time, never less';

// what each load in a walk is, and when it finishes on screen
function plan(w: Walk) {
  const seen = new Set<number>();
  let t = 0;
  return w.idx.map((i) => {
    const line = Math.floor(i / PER_LINE);
    const kind: Kind = seen.has(line) ? 'hit' : w.prefetch && seen.size > 0 ? 'pf' : 'miss';
    seen.add(line);
    t += kind === 'miss' ? MISS_MS : kind === 'pf' ? PF_MS : HIT_MS;
    return { i, line, kind, end: t };
  });
}
const PLANS = WALKS.map((w) => (w ? plan(w) : []));

export default function CacheWalk() {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(WALKS.length - 1, useSlideStep(root));
  const walk = WALKS[step];
  const loads = PLANS[step];

  // how many loads of this step's walk are done; restarts whenever the step changes
  const [done, setDone] = useState(0);
  const start = useRef<{ step: number; ms: number } | null>(null);
  useFrame(root, (ms) => {
    if (!start.current || start.current.step !== step || ms < start.current.ms) start.current = { step, ms };
    const t = ms - start.current.ms - 400; // a beat before it starts
    const n = loads.filter((l) => l.end <= t).length;
    if (n !== done) setDone(n);
  });
  const printing = typeof document !== 'undefined' && document.body.classList.contains('mode-print');
  const n = printing ? loads.length : Math.min(done, loads.length);
  const past = loads.slice(0, n);
  const cur = n < loads.length ? loads[n] : null;

  const cached = new Set(past.map((l) => l.line));
  if (cur && cur.kind !== 'miss') cached.add(cur.line); // hits are instant; prefetched lines are already there
  const misses = past.filter((l) => l.kind === 'miss').length;
  const hits = past.length - misses;
  const ns = misses * RAM_NS + hits * L1_NS;
  const status = new Map(past.map((l) => [l.i, l.kind]));

  return (
    <div class="cache-walk" ref={root} data-hold={loads.length ? loads[loads.length - 1].end + 1500 : undefined}>
      <div class="cw-top">
        <div class="cw-code">{walk ? <Code lang="c" code={walk.code} /> : <Code lang="c" code={'long a[64];\n '} />}</div>
        <table class={`cw-stats fade ${walk ? 'on' : ''}`}>
          <tr><td>loads</td><td>{past.length}</td></tr>
          <tr><td class="cw-miss">misses</td><td>{misses} <span class="muted">× ~{RAM_NS} ns</span></td></tr>
          <tr><td class="cw-hit">hits</td><td>{hits} <span class="muted">× ~{L1_NS} ns</span></td></tr>
          <tr class="cw-total"><td>time</td><td>~{Math.round(ns)} ns</td></tr>
        </table>
      </div>
      <div class="cw-lines">
        {range(N / PER_LINE).map((line) => (
          <div class={`cw-line ${cached.has(line) ? 'in' : ''} ${cur?.line === line && cur.kind === 'miss' ? 'fetching' : ''}`}>
            <div class="cw-cells">
              {range(PER_LINE).map((k) => {
                const i = line * PER_LINE + k;
                const s = status.get(i);
                return <span class={`cw-c ${s ?? ''} ${cur?.i === i ? 'now' : ''}`}>{i}</span>;
              })}
            </div>
            <div class="cw-label">line {line} · 64 B</div>
          </div>
        ))}
      </div>
      <div class="cw-key muted">
        <span><i class="miss" /> miss: wait for ram</span>
        <span><i class="hit" /> hit: already in l1</span>
        {walk?.prefetch && <span><i class="pf" /> prefetched: arrived early</span>}
        <span><i class="in" /> line in the cache</span>
      </div>
      <div class="caption cw-text">{walk ? walk.text : CAPTION0}</div>
      <style>{`
        .cache-walk { font-size: .9em; }
        .cache-walk .cw-top { display: flex; gap: 2em; align-items: flex-start; justify-content: space-between; min-height: 4.6em; }
        .cache-walk .cw-code pre { font-size: .7em; margin: 0; }
        .cache-walk .cw-stats { font-family: var(--mono); font-size: .62em; font-variant-numeric: tabular-nums; }
        .cache-walk .cw-stats td { padding: .05em 1em .05em 0; }
        .cache-walk .cw-stats td:first-child { color: var(--muted); }
        .cache-walk .cw-stats .cw-total td { color: var(--fg); font-weight: 700; border-top: 1px solid var(--border); padding-top: .2em; }
        .cache-walk .cw-lines { display: grid; grid-template-columns: repeat(4, 1fr); gap: .8em .7em; margin-top: 1em; }
        .cache-walk .cw-line { border-radius: 8px; padding: .3em; background: #111; box-shadow: inset 0 0 0 2px transparent;
          transition: background .3s, box-shadow .3s; }
        .cache-walk .cw-line.in { background: ${COLORS.green}55; box-shadow: inset 0 0 0 2px ${COLORS.green}; }
        .cache-walk .cw-line.fetching { box-shadow: inset 0 0 0 2px ${COLORS.bad}; animation: cw-pulse .5s ease-in-out infinite alternate; }
        @keyframes cw-pulse { to { box-shadow: inset 0 0 0 2px ${COLORS.bad}44; } }
        .cache-walk .cw-cells { display: grid; grid-template-columns: repeat(8, 1fr); gap: 2px; }
        .cache-walk .cw-c { font-family: var(--mono); font-size: .5em; text-align: center; padding: .45em 0; border-radius: 3px;
          background: #1f1f1f; color: var(--muted); transition: background .2s, color .2s; }
        .cache-walk .cw-c.miss { background: ${COLORS.bad}; color: #000; }
        .cache-walk .cw-c.hit { background: ${COLORS.good}; color: #000; }
        .cache-walk .cw-c.pf { background: ${COLORS.accent}; color: #000; }
        .cache-walk .cw-c.now { outline: 2px solid var(--fg); }
        .cache-walk .cw-label { font-size: .45em; color: var(--muted); text-align: center; margin-top: .25em; }
        .cache-walk .cw-key { display: flex; gap: 1.6em; font-size: .5em; margin-top: .9em; }
        .cache-walk .cw-key i { display: inline-block; width: .9em; height: .9em; border-radius: 2px; vertical-align: -.1em; margin-right: .3em; }
        .cache-walk .cw-key i.miss { background: ${COLORS.bad}; }
        .cache-walk .cw-key i.hit { background: ${COLORS.good}; }
        .cache-walk .cw-key i.pf { background: ${COLORS.accent}; }
        .cache-walk .cw-key i.in { background: ${COLORS.green}55; box-shadow: inset 0 0 0 2px ${COLORS.green}; }
        .cache-walk .cw-text { font-size: .8em; min-height: 2.6em; margin-top: .6em; }
      `}</style>
    </div>
  );
}
