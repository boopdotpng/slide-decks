/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code from './Code';
import { Box, COLORS, Reveal } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Opening the card, and what the host can see of it: its bars. Sizes are
 * tt-kmd's for blackhole (blackhole.c / memory.c): bar0 = 512 MiB holding 202
 * windows of 2 MiB (the last is the kernel's) + the tlb config registers;
 * bar2 = pcie controller registers; bar4 = up to 8 windows of 4 GiB. Not to
 * scale. Steps:
 *   1 the bars   2 bar0   3 bar4   4 a store into a window is plain mmio
 */

const CODE = `fd = open("/dev/tenstorrent/0", O_RDWR)`;

const CAPTIONS = [
  'open the file tt-kmd made. you get an fd: every ioctl and mmap after this goes through it. close it and the driver frees everything you allocated',
  'at boot the card was given ranges of physical addresses: its bars, like the devices slide. this is all the host can see of the card',
  'bar0: 202 windows of 2 MiB each (the last one is the kernel\'s), plus the registers that say where each window points',
  'bar4: up to 8 windows of 4 GiB. 32 GB, the size of the card\'s dram',
  'a store into a window is plain mmio: no syscall, it goes straight out over pcie. but a window points nowhere until it\'s aimed',
];

const SMALL = 23;

export default function OpenCard() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);

  return (
    <div class="open" ref={root}>
      <Code lang="py" code={CODE} hl={step === 0 ? [0] : []} />
      <svg viewBox="0 0 1500 520" class="diagram">
        <Reveal on={step >= 1}>
          <text x={0} y={34} font-size="24" fill="var(--muted)">physical addresses (not to scale)</text>
          <rect x={0} y={50} width={300} height={70} rx={8} fill="#1c1c1c" />
          <text x={150} y={94} font-size="24" fill="var(--muted)" text-anchor="middle">ram</text>
          <text x={350} y={94} font-size="24" fill="var(--muted)" text-anchor="middle">…</text>
          <rect x={400} y={50} width={420} height={70} rx={8} fill={step === 2 ? COLORS.blue : '#26324a'} />
          <text x={610} y={94} font-size="26" font-weight="700" fill="var(--fg)" text-anchor="middle">bar0 · 512 MiB</text>
          <rect x={830} y={50} width={130} height={70} rx={8} fill="#26324a" />
          <text x={895} y={94} font-size="24" fill="var(--fg)" text-anchor="middle">bar2</text>
          <rect x={970} y={50} width={530} height={70} rx={8} fill={step === 3 ? COLORS.blue : '#26324a'} />
          <text x={1235} y={94} font-size="26" font-weight="700" fill="var(--fg)" text-anchor="middle">bar4 · up to 32 GiB</text>
          <text x={895} y={150} font-size={SMALL} fill="var(--muted)" text-anchor="middle">pcie controller regs</text>
        </Reveal>

        <Reveal on={step >= 2}>
          <Box x={0} y={190} w={700} h={150} title="bar0" sub="202 windows × 2 MiB · window 201 is the kernel's" />
          {Array.from({ length: 16 }, (_, k) => (
            <rect x={30 + k * 34} y={300} width={28} height={26} rx={4} fill={COLORS.accent} opacity={k === 15 ? .35 : 1} />
          ))}
          <text x={590} y={320} font-size={SMALL} fill="var(--muted)">… + config</text>
        </Reveal>

        <Reveal on={step >= 3}>
          <Box x={760} y={190} w={740} h={150} title="bar4" sub="8 windows × 4 GiB" />
          {Array.from({ length: 8 }, (_, k) => (
            <rect x={790 + k * 86} y={292} width={78} height={34} rx={5} fill={COLORS.accent} />
          ))}
        </Reveal>

        <Reveal on={step >= 4}>
          <text x={0} y={410} font-size="28" font-family="var(--mono)" fill="var(--fg)">win[0x100] = 42</text>
          <text x={270} y={410} font-size="26" fill="var(--muted)">→ a pcie write into the window → … where? the card decides</text>
        </Reveal>
      </svg>
      <div class="caption">{CAPTIONS[step]}</div>
      <style>{`
        .open pre { font-size: .7em; margin: 0 0 .6em; }
        .open .caption { color: var(--fg); font-size: .75em; min-height: 3em; }
      `}</style>
    </div>
  );
}
