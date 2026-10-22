/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { Arrow, Box, COLORS, Reveal } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * A process (page table + resources) holding threads (pc + registers + stack),
 * a second process, then two cores running one thread each. Steps:
 *   1 the thread   2 more threads, shared memory   3 another process   4 cores
 */

const CAPTIONS = [
  'a process: its own page table (so its own memory), plus things like open files',
  'a thread: a pc, its registers and a stack. the thread is what actually runs',
  'more threads in the same process: same page table, same memory, but each has its own pc, registers and stack',
  'another process has a different page table. it can\'t see hello\'s memory at all',
  'each core runs one thread at a time. 2 cores, 4 threads: two are always waiting. so they take turns',
];

function Thread({ x, n, on, color = COLORS.accent }: { x: number; n: number; on: boolean; color?: string }) {
  return (
    <Reveal on={on}>
      <rect x={x} y={150} width={190} height={150} rx={10} fill="var(--surface)" stroke={color} stroke-width={2} />
      <text x={x + 20} y={192} font-size="26" font-weight="700" fill="var(--fg)">thread {n}</text>
      <text x={x + 20} y={232} font-size="20" fill="var(--muted)">pc · registers</text>
      <text x={x + 20} y={264} font-size="20" fill="var(--muted)">its own stack</text>
    </Reveal>
  );
}

function Core({ x, n }: { x: number; n: number }) {
  return (
    <g>
      <rect x={x} y={440} width={240} height={90} rx={10} fill="var(--panel)" stroke="var(--border)" />
      <text x={x + 120} y={495} font-size="28" font-weight="700" fill="var(--fg)" text-anchor="middle">core {n}</text>
    </g>
  );
}

export default function ProcessThreads() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);

  return (
    <div ref={root}>
      <svg viewBox="0 0 1100 540" class="diagram">
        <Box x={10} y={10} w={690} h={320} title="process: hello" sub="page table · memory · open files" />
        <Thread x={40} n={1} on />
        <Thread x={260} n={2} on={step >= 2} />
        <Thread x={480} n={3} on={step >= 2} />

        <Reveal on={step >= 3}>
          <Box x={740} y={10} w={350} h={320} title="process: shell" sub="a different page table" />
          <Thread x={770} n={1} on={step >= 3} color={COLORS.purple} />
        </Reveal>

        <Reveal on={step >= 4}>
          <Core x={140} n={0} />
          <Core x={720} n={1} />
        </Reveal>
        <Arrow from={[260, 440]} to={[160, 305]} on={step >= 4} color={COLORS.good} label="running" labelOffset={[-120, 0]} />
        <Arrow from={[840, 440]} to={[865, 305]} on={step >= 4} color={COLORS.good} label="running" />
      </svg>
      <div class="caption">{CAPTIONS[step]}</div>
    </div>
  );
}
