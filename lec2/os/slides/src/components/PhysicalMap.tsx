/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code from './Code';
import { useSlideStep } from '../deck/hooks';

/**
 * A typical x86 pc's physical address map (qemu q35, BIOS boot), simplified,
 * and the kernel writing to the accelerator (a pcie card) with a plain store.
 * Steps:
 *   1 ram   2 pcie: the card's bar   3 the kernel's mapping + driver code
 *   4 timer   5 teaser: mapping the card for you (the ioctl slide)
 * The register offset is illustrative.
 */

const MAP = [
  { addr: '0x0000_0000', name: 'ram', what: 'the first 640 KiB' },
  { addr: '0x000b_8000', name: 'vga text', what: 'the old text screen' },
  { addr: '0x0010_0000', name: 'ram', what: 'your pages live here' },
  { addr: '0xb000_0000', name: 'pcie config' },
  { addr: '0xc000_0000', name: 'pcie devices', what: 'the accelerator, gpu, ssd' },
  { addr: '0xfee0_0000', name: 'local apic', what: 'timer, interrupts' },
  { addr: '0xffff_fff0', name: 'firmware', what: 'the cpu starts here' },
];
// map rows lit at each step
const LIT = [[], [0, 2], [4], [4], [5], [4]];

const DRIVER = `
u32 *card = (u32 *)0xc0000000;
card[GO] = 1;    // the card starts`;

const CAPTIONS = [
  'physical addresses are what actually goes out of the cpu. this is a typical x86 pc (qemu\'s q35), simplified',
  'ram is just some of the ranges',
  'the rest are devices. the accelerator is a pcie card: its registers show up as a range here (a bar). a store there goes over pcie to the card',
  'the kernel maps the card into its own page table, without u. the same store that faulted for you works here: that\'s a driver (memory-mapped i/o)',
  'the timer is a device too. the kernel sets it to interrupt, and that\'s how it takes the cpu back (in a bit)',
  'the kernel can also map the card into your page table, with u. asking for that takes a special syscall: the last part of the talk',
];

export default function PhysicalMap() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);

  return (
    <div class="pmap" ref={root}>
      <div class="pmap-cols">
        <table class="pmap-table">
          {MAP.map((m, i) => (
            <tr class={LIT[step].includes(i) ? 'on' : ''}>
              <td class="muted">{m.addr}</td><td>{m.name}</td><td class="muted">{m.what}</td>
            </tr>
          ))}
        </table>
        <div class={`pmap-side fade ${step === 3 ? 'on' : ''}`}>
          <div class="muted">kernel's page table</div>
          <table class="pmap-pt"><tr><td>0xc0000</td><td>→ 0xc0000</td><td>w - -</td></tr></table>
          <Code lang="c" code={DRIVER} />
        </div>
      </div>
      <div class="caption">{CAPTIONS[step]}</div>
      <style>{`
        .pmap-cols { display: flex; gap: 1.5em; align-items: flex-start; }
        .pmap-table { font-size: .72em; }
        .pmap-table td { padding: .25em 1.2em .25em .4em; transition: background .3s; white-space: nowrap; }
        .pmap-table td:first-child { font-family: var(--mono); }
        .pmap-table tr.on td { background: var(--hl); }
        .pmap-side { font-size: .6em; flex: none; }
        .pmap-pt { font-family: var(--mono); margin: .3em 0 .6em; }
        .pmap-side pre { font-size: 1em; }
      `}</style>
    </div>
  );
}
