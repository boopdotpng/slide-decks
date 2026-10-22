/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code from './Code';
import { Arrow, Box, COLORS, Reveal } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * PIN_PAGES with NOC_DMA, as blackhole-py's Sysmem uses it (256 MiB of host
 * memory for its command queue). What tt-kmd does (memory.c ioctl_pin_pages):
 * pin_user_pages (FOLL_LONGTERM), dma_map_sgtable through the iommu into one
 * contiguous iova range, then (NOC_DMA) program an outbound iatu region in the
 * card's pcie controller and return noc_address = 4 << 58 + base. Page
 * positions and the 4-page buffer are illustrative; (14, 2) is blackhole-py's
 * prefetch core. Steps:
 *   1 pin   2 iommu   3 noc address   4 the card reads it   5 command queue
 */

const CODE = `
buf = mmap(256 MiB)
out = ioctl(fd, PIN_PAGES, buf, 256 MiB, NOC_DMA)
out.noc_address`;

const CAPTIONS = [
  'bulk data goes the other way round: put it in your own ram and let the card pull it (dma). buf is ordinary memory, spread over random physical pages',
  'PIN_PAGES, part 1: pin. normally the kernel may move or swap your pages whenever it likes; the card would read garbage. pinned pages stay put',
  'part 2: the iommu, a page table for devices. it maps the scattered pages to one contiguous device address. the card can only reach pages that someone pinned',
  'part 3 (NOC_DMA): tt-kmd sets up the card\'s pcie tile so a noc address (0x1000…) leads to that device address, and hands that noc address back',
  'now a core on the card reads buf with an ordinary noc read: out the pcie tile, through the iommu, into your ram. the cpu isn\'t involved at all',
  'blackhole-py runs its command queue like this: you write commands into buf, a core fetches them, results come back the same way. you only ring a doorbell through a tlb window',
];

// host ram: 6 × 6 pages; buf is 4 of them, scattered
const COLS = 6, PW = 64, PH = 46, PX = 40, PY = 120;
const BUF = [3, 14, 19, 31];
const pagePos = (i: number): [number, number] => [PX + (i % COLS) * (PW + 14), PY + Math.floor(i / COLS) * (PH + 14)];
const ROW_Y = (k: number) => 240 + k * 54;

export default function PinPages() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const hl = [[0], [1], [1], [1, 2], [], []][step];

  return (
    <div class="pin" ref={root}>
      <Code lang="py" code={CODE} hl={hl} />
      <svg viewBox="0 0 1600 560" class="diagram">
        <Box x={0} y={0} w={520} h={540} title="your ram" sub="the host" />
        {Array.from({ length: 36 }, (_, i) => {
          const [x, y] = pagePos(i), k = BUF.indexOf(i);
          return (
            <g>
              <rect x={x} y={y} width={PW} height={PH} rx={6} fill={k >= 0 ? COLORS.violet : 'var(--surface)'}
                stroke={k >= 0 && step >= 1 ? 'var(--fg)' : 'none'} stroke-width={3} style={{ transition: 'stroke .3s' }} />
              {k >= 0 && <text x={x + PW / 2} y={y + 30} font-size="18" fill="var(--fg)" text-anchor="middle">{step >= 5 ? 'cmd' : 'buf'}</text>}
            </g>
          );
        })}
        <Reveal on={step >= 1}><text x={40} y={510} font-size="22" fill="var(--fg)">white outline = pinned: won't move</text></Reveal>

        <Reveal on={step >= 2}>
          <Box x={640} y={130} w={300} h={300} title="iommu" sub="device addresses" />
          {BUF.map((_, k) => (
            <text x={790} y={ROW_Y(k) + 18} font-size="22" font-family="var(--mono)" fill="var(--fg)" text-anchor="middle">+{k * 4} KiB</text>
          ))}
        </Reveal>
        {BUF.map((p, k) => {
          const [x, y] = pagePos(p);
          return <Arrow from={[650, ROW_Y(k) + 10]} to={[x + PW, y + PH / 2]} on={step >= 2} color="var(--muted)" width={2} />;
        })}

        <Box x={1020} y={0} w={580} h={540} title="the card" />
        <rect x={1050} y={250} width={150} height={100} rx={10} fill={COLORS.green} />
        <text x={1125} y={308} font-size="26" font-weight="700" fill="var(--fg)" text-anchor="middle">pcie</text>
        <rect x={1380} y={250} width={190} height={100} rx={10} fill={step >= 4 ? COLORS.accent : 'var(--surface)'} style={{ transition: 'fill .3s' }} />
        <text x={1475} y={298} font-size="24" font-weight="700" fill={step >= 4 ? 'var(--on-color)' : 'var(--fg)'} text-anchor="middle">core</text>
        <text x={1475} y={328} font-size="20" font-family="var(--mono)" fill={step >= 4 ? 'var(--on-color)' : 'var(--muted)'} text-anchor="middle">(14, 2)</text>
        <Reveal on={step >= 3}>
          <text x={1050} y={395} font-size="22" fill="var(--muted)">noc address of buf:</text>
          <text x={1050} y={430} font-size="24" font-family="var(--mono)" fill="var(--fg)">0x1000_0000_0000_0000</text>
          <text x={1050} y={462} font-size="24" font-family="var(--mono)" fill="var(--muted)">  + base</text>
        </Reveal>

        <Arrow from={[1380, 300]} to={[1200, 300]} on={step >= 4} color={COLORS.accent} label="noc read" labelOffset={[-50, -16]} />
        <Arrow from={[1050, 300]} to={[940, 300]} on={step >= 4} color={COLORS.accent} label="pcie" labelOffset={[-26, -16]} />
      </svg>
      <div class="caption">{CAPTIONS[step]}</div>
      <style>{`
        .pin pre { font-size: .7em; margin: 0 0 .6em; }
        .pin .caption { color: var(--fg); font-size: .75em; min-height: 3em; }
      `}</style>
    </div>
  );
}
