/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from '../deck/hooks';

/**
 * One task, worked by hand on one input. Each step marks tokens, draws arcs and adds a line of working:
 * blue arcs over the tokens are the last position looking something up, green arcs under them are a
 * value being copied to the end. The last step shows the answer. Steps = number of phases.
 *
 *   <div data-steps="3"><Task client:load task="lookup" /></div>
 */
type Arc = [from: number, to: number, cls: 'q' | 'v'];
type Phase = { marks: Record<number, 'q' | 'v'>; arcs: Arc[]; say: ComponentChildren };
type Def = { input: string; answer: string; phases: Phase[] };

const Q = (c: string) => <b class="q">{c}</b>, V = (c: string) => <b class="v">{c}</b>;
const QS = { 8: 'q', 9: 'q' } as const, BOTH = { ...QS, 2: 'q', 4: 'q', 3: 'v', 5: 'v' } as const;
const FIND2: Arc[] = [[8, 2, 'q'], [9, 4, 'q']], COPY2: Arc[] = [...FIND2, [3, 9, 'v'], [5, 9, 'v']];
const TWO_KEY = (last: ComponentChildren): Phase[] => [
  { marks: QS, arcs: [], say: <>queries: {Q('f')}, {Q('c')}</> },
  { marks: BOTH, arcs: FIND2, say: <>{Q('f')} → {V('5')}, {Q('c')} → {V('9')}</> },
  { marks: BOTH, arcs: COPY2, say: <>both to the end</> },
  { marks: BOTH, arcs: COPY2, say: last },
];

const TASKS: Record<string, Def> = {
  digit: { input: 'qwdk7mzpa', answer: '7', phases: [
    { marks: { 4: 'v' }, arcs: [], say: <>one digit among letters: {V('7')}</> },
    { marks: { 4: 'v' }, arcs: [[4, 8, 'v']], say: <>only the last position answers, so the {V('7')} has to get there</> },
  ] },
  lookup: { input: 'a2f5c9d3f', answer: '5', phases: [
    { marks: { 8: 'q' }, arcs: [], say: <>query: {Q('f')}</> },
    { marks: { 8: 'q', 2: 'q' }, arcs: [[8, 2, 'q']], say: <>find the key {Q('f')}</> },
    { marks: { 8: 'q', 2: 'q', 3: 'v' }, arcs: [[8, 2, 'q'], [3, 8, 'v']], say: <>copy the digit after it: {V('5')}</> },
  ] },
  sum: { input: 'a2f5c9d3fc', answer: '4', phases: TWO_KEY(<>add: {V('5')} + {V('9')} = 14, and 14 mod 10 = {V('4')}</>) },
  diff: { input: 'a2f5c9d3fc', answer: '6', phases: TWO_KEY(<>subtract: {V('5')} − {V('9')} = −4, and −4 mod 10 = {V('6')}</>) },
};

// px per token, box width, box height, room above (lookups) and below (copies) the boxes for arcs
const PITCH = 72, BOX = 62, BH = 72, ABOVE = 70, BELOW = 56;
const cx = (i: number) => i * PITCH + BOX / 2;
const arcPath = ([a, b, c]: Arc) => {
  const h = 10 + Math.abs(a - b) * 8;
  if (c === 'q') { const y = ABOVE - 4; return `M ${cx(a)} ${y} C ${cx(a)} ${y - h}, ${cx(b)} ${y - h}, ${cx(b)} ${y}`; }
  const y = ABOVE + BH + 4, hb = Math.min(h, BELOW - 8) * 1.3;
  return `M ${cx(a)} ${y} C ${cx(a)} ${y + hb}, ${cx(b)} ${y + hb}, ${cx(b)} ${y}`;
};
const key = ([a, b, c]: Arc) => `${a}-${b}-${c}`;

export default function Task({ task }: { task: keyof typeof TASKS }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const t = TASKS[task], n = t.input.length;
  const ph: Phase = step > 0 ? t.phases[Math.min(step, t.phases.length) - 1] : { marks: {}, arcs: [], say: '' };
  const done = step >= t.phases.length;
  // every arc the task ever draws, so each keeps its own element and draws itself in
  const arcs = [...new Map(t.phases.flatMap((p) => p.arcs).map((a) => [key(a), a])).values()];
  const live = new Set(ph.arcs.map(key));

  return (
    <div class="task" ref={root}>
      <div class="line">
        <div class="seq" style={{ width: `${n * PITCH}px` }}>
          <svg width={n * PITCH} height={ABOVE + BH + BELOW}>
            <defs>
              {(['q', 'v'] as const).map((c) => (
                <marker id={`task-${task}-${c}`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" class={`head ${c}`} />
                </marker>
              ))}
            </defs>
            {arcs.map((a) => <path d={arcPath(a)} pathLength={1} class={`arc ${a[2]} ${live.has(key(a)) ? 'on' : ''}`} marker-end={`url(#task-${task}-${a[2]})`} />)}
          </svg>
          <div class="toks">
            {[...t.input].map((c, i) => <span class={`c ${/\d/.test(c) ? 'dg' : ''} ${ph.marks[i] ?? ''}`}>{c}</span>)}
          </div>
        </div>
        <span class="to">→</span>
        <span class={`c out ${done ? 'on' : ''}`}>{done ? t.answer : '?'}</span>
      </div>
      <ol class="work">
        {t.phases.map((p, i) => <li class={`fade ${step > i ? 'on' : ''} ${step === i + 1 ? 'now' : ''}`}>{p.say}</li>)}
      </ol>
      <style>{`
        .task { display: flex; flex-direction: column; gap: 1em; margin-top: .2em; }
        .task .line { display: flex; align-items: flex-start; gap: .6em; }
        .task .line > .to, .task .line > .out { margin-top: ${ABOVE}px; }
        .task .line > .to { line-height: ${BH}px; }
        .task .seq { position: relative; height: ${ABOVE + BH + BELOW}px; }
        .task .seq svg { position: absolute; inset: 0; overflow: visible; }
        .task .toks { position: absolute; top: ${ABOVE}px; display: flex; gap: ${PITCH - BOX}px; }
        .task .c { position: relative; width: ${BOX}px; height: ${BH}px; display: grid; place-items: center; border-radius: 9px;
          font-family: var(--mono); font-size: 1.5em; background: var(--panel); border: 1px solid var(--border);
          transition: background .3s, border-color .3s, color .3s; }
        .task .c.dg { color: var(--hot); }
        .task .c.q { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
        .task .c.v { border-color: var(--good); background: color-mix(in srgb, var(--good) 16%, transparent); color: var(--good); }
        .task .to { color: var(--muted); font-size: 1.4em; margin: 0 .2em; }
        .task .c.out { color: var(--muted); border-style: dashed; }
        .task .c.out.on { color: var(--good); border: 1px solid var(--good); background: color-mix(in srgb, var(--good) 16%, transparent); }
        .task .work { margin: 0; padding-left: 1.2em; display: flex; flex-direction: column; gap: .35em; font-size: .8em; }
        .task .work li { transition: opacity .35s; }
        .task .work li.on:not(.now) { opacity: .55; }
        .task b.q { color: var(--accent); font-family: var(--mono); }
        .task b.v { color: var(--good); font-family: var(--mono); }
        .task .arc { fill: none; stroke-width: 3; stroke-dasharray: 1; stroke-dashoffset: 1; opacity: 0; transition: stroke-dashoffset .6s ease, opacity .2s; }
        .task .arc.on { stroke-dashoffset: 0; opacity: 1; }
        .task .arc.q { stroke: var(--accent); } .task .arc.v { stroke: var(--good); }
        .task .head.q { fill: var(--accent); } .task .head.v { fill: var(--good); }
      `}</style>
    </div>
  );
}
