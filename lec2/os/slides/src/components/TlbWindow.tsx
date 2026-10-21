/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code from './Code';
import { BlackholeChip, type Core, type Target } from './BlackholeChip';
import { useSlideStep } from '../deck/hooks';

/**
 * A 2 MiB tlb window, the way blackhole-py's pcie.py uses one (TLBWindow):
 * ALLOCATE_TLB + mmap, CONFIGURE_TLB to aim it, plain stores, re-aim at dram,
 * multicast to boot every core (device.py's boot()). CONFIGURE_TLB writes a
 * 12-byte register per window on the card (tt-kmd blackhole.c: address >> 21,
 * x/y start and end, multicast, ordering). Code is simplified python; (17, 14)
 * is a real p150 dram endpoint (bank 0, noc 0). Steps:
 *   1 aim   2 store   3 re-aim at dram   4 multicast   5 cost
 */

const CODE = `
tlb = ioctl(fd, ALLOCATE_TLB, 2 MiB)
win = mmap(fd, tlb.mmap_offset)

ioctl(fd, CONFIGURE_TLB, tlb, (1, 2), 0x0)
win[0x100] = 42

ioctl(fd, CONFIGURE_TLB, tlb, (17, 14), 0x0)
win[0x100] = 42

ioctl(fd, CONFIGURE_TLB, tlb, (1, 2)…(14, 11))
win[BOOT] = jal(firmware)`;

const STEPS: { hl: number[]; reg?: string; lit?: Core[] | 'all'; dram?: number[]; packet?: Target; text: string }[] = [
  { hl: [0, 1], reg: 'window 3 → not aimed yet',
    text: 'ask tt-kmd for a window: one of the 2 MiB slots in bar0. mmap puts it in your page table. it doesn\'t point anywhere yet' },
  { hl: [3], reg: 'window 3 → core (1, 2), addr 0x0', lit: [[1, 2]],
    text: 'aim it: the driver writes the target (x, y, address) into a register on the card. that register is the mapping: a one-entry page table, kept by the card' },
  { hl: [4], reg: 'window 3 → core (1, 2), addr 0x0', lit: [[1, 2]], packet: { core: [1, 2] },
    text: 'now a plain store, no syscall: cpu → pcie → the card looks up window 3 → a noc packet to core (1, 2), address 0x0 + 0x100' },
  { hl: [6, 7], reg: 'window 3 → dram (17, 14), addr 0x0', dram: [0], packet: { dram: 0 },
    text: 're-aim the same window and the same store lands in dram bank 0. that\'s how you reach all 32 GB: through windows (bar4 has 8 big ones, 4 GiB each)' },
  { hl: [9, 10], reg: 'window 3 → (1, 2)…(14, 11), multicast', lit: 'all',
    text: 'aim it at a rectangle and one store reaches every core. blackhole-py boots the card this way: firmware into all 120 cores, then a risc-v jal at their boot address' },
  { hl: [], reg: 'window 3 → (1, 2)…(14, 11), multicast', lit: 'all',
    text: 'stores are fire-and-forget. a load waits for a full trip over pcie and back. fine for poking registers, too slow for bulk data: next' },
];

export default function TlbWindow() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const cur = STEPS[step];
  return (
    <div class="tlb" ref={root}>
      <div class="tlb-cols">
        <Code lang="py" code={CODE} hl={cur.hl} />
        <svg viewBox="0 0 820 640" class="tlb-chip">
          <BlackholeChip reg={cur.reg} lit={cur.lit} dram={cur.dram} packet={cur.packet} />
        </svg>
      </div>
      <div class="caption">{cur.text}</div>
      <style>{`
        .tlb { container-type: inline-size; }
        .tlb-cols { display: flex; gap: 2cqi; align-items: center; }
        .tlb pre { margin: 0; flex: none; font-size: min(1.5cqi, 2.4cqh); }
        .tlb-chip { flex: 1; min-width: 0; max-height: 62cqh; font-family: var(--sans); }
        .tlb .caption { color: var(--fg); font-size: .75em; min-height: 3em; }
      `}</style>
    </div>
  );
}
