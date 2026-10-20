/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { Arrow, Box, COLORS, Reveal } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Two copies of hello world both use msg at 0x10120 (the address `rv` really
 * loads it at); the mmu sends each to different ram. Physical addresses are
 * illustrative. Steps:
 *   1 the mmu translates copy 1's address
 *   2 a second copy, same virtual address, different ram
 */

const CAPTIONS = [
  'hello\'s msg is at 0x10120. but that\'s not where the bytes really are in ram: it\'s a virtual address',
  'the mmu, part of the cpu, translates every load, store and instruction fetch into a real (physical) address',
  'run hello twice: both say 0x10120, but land in different ram. neither can even name the other\'s memory',
];

const mono = { 'font-family': 'var(--mono)', 'font-size': 22 };

function Program({ y, n, on }: { y: number; n: number; on: boolean }) {
  return (
    <Reveal on={on}>
      <Box x={10} y={y} w={300} h={220} title={`hello (${n})`} sub="virtual addresses">
        <text x={40} y={y + 150} fill="var(--muted)" {...mono}>.text    0x11130</text>
        <text x={40} y={y + 190} fill="var(--fg)" {...mono}>msg      0x10120</text>
      </Box>
    </Reveal>
  );
}

function Slot({ y, label, on }: { y: number; label: string; on: boolean }) {
  return (
    <Reveal on={on}>
      <rect x={830} y={y - 26} width={230} height={52} rx={8} fill={COLORS.blue} />
      <text x={850} y={y + 8} fill="var(--fg)" {...mono}>{label}</text>
    </Reveal>
  );
}

export default function VirtualAddresses() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);

  return (
    <div ref={root}>
      <svg viewBox="0 0 1100 520" class="diagram">
        <Program y={10} n={1} on />
        <Program y={290} n={2} on={step >= 2} />
        <Box x={450} y={10} w={190} h={500} title="mmu" sub="on the cpu" />
        <Box x={800} y={10} w={290} h={500} title="ram" sub="physical addresses" />

        <Arrow from={[310, 190]} to={[450, 190]} on={step >= 1} label="0x10120" labelOffset={[-60, -14]} />
        <Arrow from={[640, 190]} to={[800, 190]} on={step >= 1} label="0x1a203120" labelOffset={[-72, -14]} />
        <Slot y={190} label="msg (1)" on={step >= 1} />

        <Arrow from={[310, 470]} to={[450, 470]} on={step >= 2} color={COLORS.purple} label="0x10120" labelOffset={[-60, -14]} />
        <Arrow from={[640, 470]} to={[800, 470]} on={step >= 2} color={COLORS.purple} label="0x2f517120" labelOffset={[-72, -14]} />
        <Slot y={470} label="msg (2)" on={step >= 2} />
      </svg>
      <div class="caption">{CAPTIONS[step]}</div>
    </div>
  );
}
