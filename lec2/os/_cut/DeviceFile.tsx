/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code from './Code';
import { useSlideStep } from '../deck/hooks';

/**
 * Talking to the accelerator from your program, roughly the sequence
 * blackhole-py (pcie.py) runs against tt-kmd (the tenstorrent kernel driver,
 * treated as in-tree here): the card is a file; ioctls allocate a 2 MiB
 * window into the card (a "tlb", not the cpu's tlb), mmap it, aim it at a
 * core; bulk data goes through pinned host memory instead. Request names and
 * numbers are tt-kmd's (ioctl.h); the core, addresses and page numbers are
 * illustrative. SET_POWER_STATE (done at open) is left out. Steps:
 *   1 the card is a file   2 ioctl: device-specific syscalls
 *   3 ALLOCATE_TLB + mmap   4 CONFIGURE_TLB   5 plain stores, and their cost
 *   6 PIN_PAGES: the card fetches from your ram (dma + iommu)
 */

const CODE = `write(1, msg, 13);                    // hello: fd 1 is the terminal

fd  = open("/dev/tenstorrent/0", O_RDWR);
ioctl(fd, ALLOCATE_TLB, &tlb);        // a 2 MiB window
win = mmap(…, fd, tlb.mmap_offset);
ioctl(fd, CONFIGURE_TLB, &aim);       // aim it: core (x, y), addr
win[0] = x;                           // a plain store
buf = mmap(…, 256 MiB);               // your own ram
ioctl(fd, PIN_PAGES, &pin);           // the card may use buf`;

// tt-kmd's ioctl.h: request number = magic (0xfa, "this is tenstorrent") + index
const IOCTL_H = `#define TENSTORRENT_IOCTL_PIN_PAGES      _IO(0xFA, 7)
#define TENSTORRENT_IOCTL_ALLOCATE_TLB   _IO(0xFA, 11)
#define TENSTORRENT_IOCTL_CONFIGURE_TLB  _IO(0xFA, 13)`;

// side panel: either a header snippet or one table row
type Side = { title: string; code?: string; row?: string[] };
const PT: Side = { title: 'your page table', row: ['0x7f000', '→ the window (2 MiB)', 'w - u'] };
const AIM: Side = { title: 'the window, aimed', row: ['win[0]', '→ core (1, 2)', 'address 0x0'] };

const STEPS: { hl: number[]; side?: Side; text: string }[] = [
  { hl: [0], text: 'on linux almost everything is a file: open, read, write, close. hello\'s write went to fd 1, the terminal' },
  { hl: [2], text: 'the card is a file too: tt-kmd creates /dev/tenstorrent/0. open it and you get an fd, like any file' },
  { hl: [3, 5, 8], side: { title: 'tt-kmd\'s ioctl.h', code: IOCTL_H },
    text: 'but "give me a window into the card" isn\'t a read or a write. ioctl(fd, request, &args) is the escape hatch: one syscall, and each driver defines its own requests' },
  { hl: [3, 4], side: PT,
    text: 'ALLOCATE_TLB reserves a 2 MiB window into the card; mmap puts it in your page table, with u. (tenstorrent calls these windows tlbs. not the cpu\'s tlb)' },
  { hl: [5], side: AIM,
    text: 'the chip is a grid of cores on a network (the noc). CONFIGURE_TLB aims the window at one core and an address inside it' },
  { hl: [6], side: AIM,
    text: 'now a plain store lands in that core, no syscall. but every access crosses pcie, and every load waits a full round trip: fine for poking registers, slow for real data' },
  { hl: [7, 8], side: { title: 'iommu: the card\'s page table', row: ['noc addr', '→ buf', 'your 256 MiB'] },
    text: 'so for bulk data, flip it: keep it in your ram and let the card fetch it (dma). PIN_PAGES locks buf in place, maps it in the iommu, and returns the address the card uses' },
];

export default function DeviceFile() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const cur = STEPS[step];
  // keep the previous panel's content in place while it fades out
  const side = STEPS.slice(0, step + 1).reverse().find((s) => s.side)?.side ?? STEPS[2].side!;

  return (
    <div class="devfile" ref={root}>
      <Code lang="c" code={CODE} hl={cur.hl} />
      <div class={`devfile-side fade ${cur.side ? 'on' : ''}`}>
        <div class="muted">{side.title}</div>
        {side.code && <Code lang="c" code={side.code} />}
        {side.row && <table class="devfile-row"><tr>{side.row.map((c) => <td>{c}</td>)}</tr></table>}
      </div>
      <div class="caption">{cur.text}</div>
      <style>{`
        .devfile pre { font-size: .62em; }
        .devfile-side { font-size: .6em; margin-top: .8em; min-height: 5.5em; }
        .devfile-side pre { font-size: .9em; margin-top: .3em; }
        .devfile-row { font-family: var(--mono); margin-top: .3em; }
        .devfile-row td { padding-right: 1.6em; }
      `}</style>
    </div>
  );
}
