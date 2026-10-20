/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { StateTable } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Loads and stores on sum.s's .data: nums (8 longs) and total, at the addresses
 * the linker really gives them (0x12198, 0x121d8). One instruction per step;
 * the cell being read or written is outlined, registers that point into memory
 * are labelled under their cell.
 */

export const BASE = 0x12198;
export const MEM0 = [3, 1, 4, 1, 5, 9, 2, 6, 0]; // nums[0..7], then total
const NAMES = ['nums', '', '', '', '', '', '', '', 'total'];
export const hex = (n: number) => '0x' + n.toString(16);

const CODE = `
la   t0, nums       # t0 = the address of nums
ld   t3, 0(t0)      # t3 = the 8 bytes at t0 + 0
ld   t3, 8(t0)      # t3 = the 8 bytes at t0 + 8
la   t4, total      # t4 = the address of total
sd   t3, 0(t4)      # the 8 bytes at t4 + 0 = t3`;

type St = { hl: number[]; set?: Record<string, number>; touch?: number; write?: boolean; text: ComponentChildren };
const STEPS: St[] = [
  { hl: [], text: <>memory is one huge array of bytes, and every byte has a number: its <b>address</b>. here are our 8 numbers, 8 bytes each</> },
  { hl: [0], set: { t0: BASE }, text: <><b>la</b> (load address) puts an address in a register. t0 now <i>points at</i> nums[0]</> },
  { hl: [1], set: { t3: 3 }, touch: 0, text: <><b>ld</b> (load doubleword): read 8 bytes from address t0 + 0 into t3</> },
  { hl: [2], set: { t3: 1 }, touch: 1, text: <>the number in front of the bracket is added to the address: t0 + 8 is the next number</> },
  { hl: [3], set: { t4: BASE + 64 }, text: <>total sits right after the 8 numbers: 64 bytes on</> },
  { hl: [4], touch: 8, write: true, text: <><b>sd</b> (store doubleword): write t3 into memory. loads and stores are the <b>only</b> instructions that touch memory</> },
  { hl: [4], touch: 8, write: true,
    text: <>other sizes: <code>lw</code>/<code>sw</code> 4 bytes, <code>lh</code>/<code>sh</code> 2, <code>lb</code>/<code>sb</code> 1. everything else is register to register</> },
];


/** nums and total as a row of 8-byte cells, with register labels under the cells they point at */
export function MemRow({ mem, ptrs = {}, touch, write }: {
  mem: number[]; ptrs?: Record<number, string[]>; touch?: number; write?: boolean;
}) {
  return (
    <div class="mem-row">
      {mem.map((v, i) => (
        <div class={`mw-cell ${touch === i ? (write ? 'write' : 'read') : ''}`}>
          <span class="mw-name">{NAMES[i]}</span>
          <span class="mw-addr">{hex(BASE + 8 * i)}</span>
          <span class="mw-v">{v}</span>
          <span class="mw-ptr">{(ptrs[i] ?? []).join(' ')}</span>
        </div>
      ))}
      <style>{`
        .mem-row { display: flex; gap: .3em; font-family: var(--mono); font-size: .62em; margin-bottom: 1em; }
        .mem-row .mw-cell { display: flex; flex-direction: column; align-items: center; flex: 1; }
        .mem-row .mw-name { font-size: .8em; color: var(--fg); height: 1.5em; line-height: 1.5em; }
        .mem-row .mw-addr { font-size: .7em; color: var(--muted); }
        .mem-row .mw-v { width: 100%; text-align: center; background: #1c1c1c; border-radius: 4px; padding: .3em 0;
          box-shadow: inset 0 0 0 2px transparent; transition: box-shadow .25s, background .25s; }
        .mem-row .mw-cell:last-child .mw-v { background: #1c2433; }
        .mem-row .read .mw-v { box-shadow: inset 0 0 0 2px var(--accent); }
        .mem-row .write .mw-v { box-shadow: inset 0 0 0 2px #f69d50; }
        .mem-row .mw-ptr { color: var(--accent); min-height: 1.4em; }
      `}</style>
    </div>
  );
}

const stateAt = (k: number): Record<string, number> => Object.assign({}, ...STEPS.slice(0, k + 1).map((s) => s.set ?? {}));

export default function MemoryWalk() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[k];
  const st = stateAt(k);
  const mem = [...MEM0];
  if (k >= 5) mem[8] = 1;
  const ptrs: Record<number, string[]> = {};
  for (const r of ['t0', 't4']) if (st[r] !== undefined) (ptrs[(st[r] - BASE) / 8] ??= []).push(r);

  return (
    <div class="mem-walk" ref={root}>
      <MemRow mem={mem} ptrs={ptrs} touch={cur.touch} write={cur.write} />
      <div class="mw-cols">
        <Code lang="asm" code={CODE} hl={cur.hl} />
        <StateTable vars={['t0', 't3', 't4'].map((name) => ({ name, reg: true }))}
          state={Object.fromEntries(Object.entries(st).map(([r, v]) => [r, r === 't3' ? String(v) : hex(v)]))}
          changed={Object.keys(cur.set ?? {})} />
      </div>
      <div class="caption mw-text">{cur.text}</div>
      <style>{`
        .mem-walk .mw-cols { display: flex; gap: 2.5em; align-items: flex-start; font-size: .62em; }
        .mem-walk .mw-cols pre { margin: 0; flex: 1.6; font-size: 1em; }
        .mem-walk .mw-text { font-size: .78em; min-height: 3em; margin-top: .8em; }
      `}</style>
    </div>
  );
}
