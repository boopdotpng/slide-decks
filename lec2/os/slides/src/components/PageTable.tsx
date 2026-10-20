/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { COLORS } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * hello's page table as on x86-64, drawn flat (really a 4-level tree; the
 * page walk slide shows it). msg / code pages are where `rv` loads them, the
 * kernel is at x86 linux's usual 0xffffffff81000000, the accelerator's
 * registers are its pcie bar (0xc0000000, see the devices slide); physical pages are illustrative. Steps:
 *   1 look up msg's page
 *   2 permission bits
 *   3 kernel pages: no u
 *   4 the accelerator's address isn't mapped at all
 *   5 cr3, one table per process, tlb
 */

const ROWS = [
  { v: '0x10', p: '0x1a203', f: '- - u', what: '.rodata (msg)' },
  { v: '0x11', p: '0x1a204', f: '- x u', what: '.text (your code)' },
  { v: '0x7ffffffde', p: '0x1b61f', f: 'w - u', what: 'stack' },
  { v: '0xffffffff81000', p: '0x1000', f: '- x -', what: 'kernel code' },
  { v: '0xc0000', p: '—', f: '', what: 'accelerator registers: not mapped', missing: true },
];
// which row each step points at
const ROW_AT = [-1, 0, 0, 3, 4, -1];

const CAPTIONS = [
  'memory is split into 4 KiB pages. 4 KiB = 2¹² bytes, so the low 12 bits (0x120) say where inside the page; the rest (0x10) picks the page',
  'the mmu looks page 0x10 up in the table: it\'s really physical page 0x1a203. keep the offset: 0x1a203120',
  'each entry has permissions: w(rite), (e)x(ecute), u = ring 3 may use it. store into msg? no w → page fault',
  'kernel pages are in your table too, but without u. jump or load there from ring 3 → page fault',
  'the accelerator\'s address isn\'t in your table at all. that\'s the fault from the kernel slide',
  'the cr3 register points at the table. one table per process: the kernel changes cr3 to switch whose memory is visible',
];

export default function PageTable() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const row = ROW_AT[step];

  return (
    <div class="pt" ref={root}>
      <div class="pt-addr">
        <span class="muted">virtual</span>
        <span class="pt-chip page">0x10</span><span class="pt-chip off">120</span>
        <span class={`fade ${step >= 1 ? 'on' : ''}`}>
          <span class="muted">→ physical</span>
          <span class="pt-chip page">0x1a203</span><span class="pt-chip off">120</span>
        </span>
      </div>
      <div class="pt-labels muted"><span>page</span><span>offset</span></div>

      <table class={`pt-table ${step === 2 ? 'flags' : ''}`}>
        <tr><th>virtual page</th><th>physical page</th><th>w x u</th><th></th></tr>
        {ROWS.map((r, i) => (
          <tr class={`${i === row ? 'on' : ''} ${r.missing ? `missing fade ${step >= 4 ? 'on' : ''}` : ''}`}>
            <td>{r.v}</td><td>{r.p}</td><td class="pt-f">{r.f}</td><td class="muted">{r.what}</td>
          </tr>
        ))}
      </table>

      <div class={`pt-cr3 fade ${step >= 5 ? 'on' : ''}`}>
        <code>cr3</code> → this table <span class="muted">· the cpu caches recent lookups (the tlb) · really a 4-level tree, more on that later</span>
      </div>
      <div class="caption">{CAPTIONS[step]}</div>
      <style>{`
        .pt { font-size: .8em; }
        .pt-addr { display: flex; align-items: center; gap: .3em; font-family: var(--mono); }
        .pt-addr .muted { font-family: var(--sans); margin: 0 .3em; }
        .pt-chip { padding: .1em .4em; border-radius: 6px; }
        .pt-chip.page { background: ${COLORS.blue}; }
        .pt-chip.off { background: ${COLORS.violet}; }
        .pt-labels { font-size: .6em; display: flex; gap: 1.6em; margin: .2em 0 .8em 5.4em; }
        .pt-table { font-family: var(--mono); font-size: .8em; }
        .pt-table td { padding: .2em 1.6em .2em .4em; transition: background .3s, color .3s; white-space: nowrap; }
        .pt-table th { font-family: var(--sans); font-size: .8em; padding-left: .4em; }
        .pt-table tr.on td { background: var(--hl); }
        .pt-table tr.missing td { color: ${COLORS.bad}; }
        .pt-table tr.missing.on td { background: rgba(244, 112, 103, .14); }
        .pt-table.flags .pt-f { color: ${COLORS.hot}; }
        .pt-cr3 { margin-top: .8em; font-size: .75em; }
      `}</style>
    </div>
  );
}
