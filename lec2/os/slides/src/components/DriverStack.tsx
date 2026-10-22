/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code from './Code';
import { Arrow, Box, COLORS, Reveal } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Everything between your code and the card, and the driver in the middle:
 * tt-kmd, tenstorrent's out-of-tree kernel module. Opens the accelerator part;
 * the ioctl slide after it zooms into the syscall arrow. Steps:
 *   1 the driver   2 out of tree: installing it   3 loading it creates /dev/tenstorrent/0
 *   4 teaser: after setup, plain stores skip the kernel
 * Install commands and ids are tt-kmd's (README, Makefile's dkms target,
 * enumerate.h, the udev rule).
 */

const CAPTIONS = [
  'your code calls a library. the library asks the kernel (open, ioctl, mmap), and the kernel talks to the card over pcie',
  'the part of the kernel that knows the card is its driver: tt-kmd. it runs in ring 0, so a bug in it crashes the whole machine, not just your program',
  'most drivers ship inside linux. tt-kmd doesn\'t: you install it yourself, built for your exact kernel version. dkms rebuilds it when you update linux',
  'loading it: the card says "i\'m 1e52:b140" on pcie (tenstorrent, blackhole). the kernel hands it to tt-kmd, which sets the card up and creates /dev/tenstorrent/0',
  'once it\'s set up, the fast path skips the kernel entirely: plain stores straight to the card. next: how',
];

const inner = { fill: 'var(--surface)', stroke: 'var(--line)' };

// side panel, per step
const INSTALL = `
git clone https://github.com/tenstorrent/tt-kmd
cd tt-kmd
make dkms
  # dkms add .
  # dkms install tenstorrent/<version>
  # modprobe tenstorrent`;
const CHECK = `
lsmod | grep tenstorrent   # loaded?
ls /dev/tenstorrent/       # 0
dmesg | grep tenstorrent   # its log`;
const SIDE: Record<number, { title: string; code: string }> = {
  2: { title: 'install (once)', code: INSTALL },
  3: { title: 'is it there?', code: CHECK },
};

export default function DriverStack() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);

  return (
    <div class="drv" ref={root}>
      <div class="drv-cols">
      <svg viewBox="0 0 1100 600" class="diagram">
        <Box x={10} y={10} w={1080} h={170} fill="var(--sunken)" tag="ring 3" />
        <Box x={40} y={40} w={300} h={120} {...inner} title="your program" sub="python, c++, …" />
        <Box x={420} y={40} w={420} h={120} {...inner} title="a library" sub="tt-metal, blackhole-py, …" />
        <Arrow from={[340, 100]} to={[420, 100]} color="var(--muted)" />

        <Box x={10} y={250} w={1080} h={170} fill="var(--sunken)" tag="ring 0" />
        <text x={40} y={300} font-size="32" font-weight="700" fill="var(--fg)">kernel</text>
        <text x={40} y={340} font-size="22" fill="var(--muted)">scheduler · memory · …</text>
        <Box x={420} y={280} w={420} h={120} {...inner} stroke={step >= 1 ? COLORS.accent : inner.stroke}
          title="tt-kmd" sub={step >= 2 ? 'tenstorrent.ko: a kernel module' : 'the card\'s driver'} />

        <Box x={10} y={490} w={1080} h={100} title="accelerator" sub="a grid of risc-v cores" tag="pcie card" />

        <Arrow from={[630, 160]} to={[630, 280]} color={COLORS.good} label="open · ioctl · mmap" />
        <Arrow from={[630, 400]} to={[630, 490]} color={COLORS.good} label="pcie" />

        <Reveal on={step >= 3}>
          <rect x={300} y={196} width={300} height={44} rx={8} fill="var(--hl)" />
          <text x={450} y={226} font-size="24" font-family="var(--mono)" fill="var(--fg)" text-anchor="middle">/dev/tenstorrent/0</text>
        </Reveal>

        {/* 4: after mmap, stores go around the kernel */}
        <Arrow from={[190, 160]} to={[190, 490]} on={step >= 4} color={COLORS.accent} label="plain stores" />
      </svg>
      <div class={`drv-side fade ${SIDE[step] ? 'on' : ''}`}>
        <div class="muted">{SIDE[step]?.title}</div>
        <Code lang="py" code={SIDE[step]?.code ?? ''} />
      </div>
      </div>
      <div class="caption">{CAPTIONS[step]}</div>
      <style>{`
        .drv-cols { display: flex; gap: 1em; align-items: center; }
        .drv svg { flex: 1.15; min-width: 0; }
        .drv-side { flex: 1; min-width: 0; font-size: .55em; }
        .drv-side pre { margin: .3em 0 0; }
        .drv .caption { color: var(--fg); font-size: .75em; min-height: 3em; }
      `}</style>
    </div>
  );
}
