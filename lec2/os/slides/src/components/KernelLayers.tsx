/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { Arrow, Box, COLORS, Reveal } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Program / kernel / hardware stack. Steps:
 *   1 program writes to the accelerator directly → fault
 * Both routes aim at the same card, so the only difference is who touches it.
 *   2 ioctl (a syscall) drops into the kernel; the ioctl slide elaborates
 *   3 kernel does the work on the hardware
 *   4 kernel returns to the next instruction
 */

const CAPTIONS = [
  '',
  'write to the accelerator\'s registers yourself? the cpu blocks it: fault, and the kernel kills your program',
  'instead you ask the kernel, with a syscall. for a device-specific request like this one, that\'s ioctl (more on both later)',
  'the kernel checks the request and talks to the card for you',
  'then jumps back to the instruction after your ioctl, with the result',
];

export default function KernelLayers() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);

  return (
    <div ref={root}>
      <svg viewBox="0 0 1100 520" class="diagram">
        <Box x={10} y={10} w={1080} h={120} title="your program" sub="math · its own memory · jumps in its own code" tag="ring 3" />
        <Box x={10} y={200} w={1080} h={120} title="kernel" sub="can touch everything" tag="ring 0" />
        <Box x={10} y={390} w={1080} h={120} title="hardware" sub="disk · network · timer">
          {/* the device both routes are trying to reach: a pcie card */}
          <rect x={460} y={420} width={420} height={60} rx={10} fill="var(--surface)" stroke="var(--line)" />
          <text x={670} y={459} font-size="24" fill="var(--fg)" text-anchor="middle">accelerator <tspan fill="var(--muted)">(pcie card)</tspan></text>
        </Box>

        {/* 1: straight at the card, blocked at the kernel boundary; dashed = where it wanted to go */}
        <Arrow from={[520, 130]} to={[520, 185]} on={step >= 1} color={COLORS.bad} label="write to the card" labelOffset={[-240, 8]} />
        <Reveal on={step >= 1}>
          <text x="520" y="232" font-size="44" font-weight="700" fill={COLORS.bad} text-anchor="middle">✗</text>
          <line x1="520" y1="250" x2="520" y2="385" stroke={COLORS.bad} stroke-width="2" stroke-dasharray="6 8" opacity="0.4" />
        </Reveal>
        {/* 2–4: the syscall round trip */}
        <Arrow from={[780, 130]} to={[780, 195]} on={step >= 2} color={COLORS.good} label="ioctl" />
        <Arrow from={[780, 320]} to={[780, 385]} on={step >= 3} color={COLORS.good} label="writes it" />
        <Arrow from={[950, 195]} to={[950, 135]} on={step >= 4} color={COLORS.accent} label="return" />
      </svg>
      <div class="caption">{CAPTIONS[step]}</div>
    </div>
  );
}
