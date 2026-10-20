/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { StateTable } from './viz';
import { BASE, MEM0, MemRow, hex } from './MemoryWalk';
import { useSlideStep } from '../deck/hooks';

/**
 * sum.s running, with the real addresses ld.lld gives it (.text at 0x11158,
 * nums at 0x12198) and the register values `rv.sh run sum.s` prints at the
 * ebreak (t0 = 0x121d8, t1 = 0, t2 = 31, t3 = 6, t4 = 0x121d8). Setup and the
 * first lap are one instruction per step; laps 2–8 are one step each.
 * pc is the address of the *next* instruction, like the earlier slides.
 */

const CODE = `
0x11158  _start: la   t0, nums
0x11160          li   t1, 8
0x11164          li   t2, 0
0x11168  loop:   ld   t3, 0(t0)
0x1116c          add  t2, t2, t3
0x11170          addi t0, t0, 8
0x11174          addi t1, t1, -1
0x11178          bne  t1, zero, loop
0x1117c          la   t4, total
0x11184          sd   t2, 0(t4)
0x11188          ebreak
0x1118c          mv   a0, t2
0x11190          li   a7, 93
0x11194          ecall`;

type St = { hl: number[]; pc: number | string; set?: Record<string, number>; touch?: number; write?: boolean; text: ComponentChildren };
const LOOP = [3, 4, 5, 6, 7];

// laps 2–8: the same five instructions, one step per lap
const laps: St[] = [];
let sum = 3;
for (let lap = 2; lap <= 8; lap++) {
  sum += MEM0[lap - 1];
  laps.push({
    hl: LOOP, pc: lap < 8 ? '0x11168 (jumped)' : 0x1117c, touch: lap - 1,
    set: { t0: BASE + 8 * lap, t1: 8 - lap, t2: sum, t3: MEM0[lap - 1] },
    text: lap === 2 ? <>lap 2: the same five instructions. t2 = 3 + 1 = 4</>
      : lap < 8 ? <>lap {lap}: + {MEM0[lap - 1]} → {sum}</>
      : <>lap 8: + 6 → <b>31</b>. t1 is 0 now, so bne falls through</>,
  });
}

const STEPS: St[] = [
  { hl: [], pc: 0x11158, text: <>the os copies the program into memory and sets pc = <code>_start</code>. every register starts at 0</> },
  { hl: [0], pc: 0x11160, set: { t0: BASE }, text: <>t0 = the address of nums. (la is really two instructions, so it's 8 bytes long. why: in a few slides)</> },
  { hl: [1], pc: 0x11164, set: { t1: 8 }, text: '8 numbers left' },
  { hl: [2], pc: 0x11168, set: { t2: 0 }, text: 'the sum starts at 0' },
  { hl: [3], pc: 0x1116c, touch: 0, set: { t3: 3 }, text: 'load the number t0 points at: nums[0] = 3' },
  { hl: [4], pc: 0x11170, set: { t2: 3 }, text: 'sum += 3' },
  { hl: [5], pc: 0x11174, set: { t0: BASE + 8 }, text: 't0 moves 8 bytes: now it points at nums[1]' },
  { hl: [6], pc: 0x11178, set: { t1: 7 }, text: '7 left' },
  { hl: [7], pc: '0x11168 (jumped)', text: 't1 ≠ 0: jump back to loop' },
  ...laps,
  { hl: [8], pc: 0x11184, set: { t4: BASE + 64 }, text: <>t0 walked off the end of nums: it points at total now, same as t4</> },
  { hl: [9], pc: 0x11188, touch: 8, write: true, text: 'store the sum into total' },
  { hl: [10], pc: 0x1118c, text: <>ebreak: the emulator prints the registers. t2 = 31, t3 = 6, t0 = t4 = 0x121d8. same as here</> },
  { hl: [11, 12, 13], pc: '—', set: { a0: 31 }, text: <>a0 = 31, a7 = 93 (exit), ecall: the os ends the program. <code>echo $?</code> prints 31.
    8 laps × 5 instructions</> },
];

const REGS = ['t0', 't1', 't2', 't3', 't4', 'a0'];
const NOTES: Record<string, string> = { t0: 'where we are', t1: 'how many left', t2: 'sum', t3: 'the number', a0: 'exit code' };
const stateAt = (k: number): Record<string, number> => Object.assign({}, ...STEPS.slice(0, k + 1).map((s) => s.set ?? {}));

export const STEP_COUNT = STEPS.length - 1;

export default function SumRun() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[k];
  const st = stateAt(k);
  const mem = [...MEM0];
  if (k >= STEPS.length - 3) mem[8] = 31;
  const ptrs: Record<number, string[]> = {};
  for (const r of ['t0', 't4']) if (st[r] !== undefined) (ptrs[(st[r] - BASE) / 8] ??= []).push(r);
  const show = (r: string, v: number | undefined) => v === undefined ? '0' : r === 't0' || r === 't4' ? hex(v) : String(v);

  return (
    <div class="sum-run" ref={root}>
      <MemRow mem={mem} ptrs={ptrs} touch={cur.touch} write={cur.write} />
      <div class="sr-cols">
        <Code lang="asm" code={CODE} hl={cur.hl} />
        <StateTable
          vars={[{ name: 'pc' }, ...REGS.map((name) => ({ name, reg: true, note: NOTES[name] }))]}
          state={{ pc: typeof cur.pc === 'number' ? hex(cur.pc) : cur.pc, ...Object.fromEntries(REGS.map((r) => [r, show(r, st[r])])) }}
          changed={['pc', ...Object.keys(cur.set ?? {})]} />
      </div>
      <div class="caption sr-text">{cur.text}</div>
      <style>{`
        .sum-run .mem-row { font-size: .55em; margin-bottom: .6em; }
        .sum-run .sr-cols { display: flex; gap: 2em; align-items: flex-start; font-size: .55em; }
        .sum-run .sr-cols pre { margin: 0; flex: none; width: 62%; font-size: 1em; }
        .sum-run .sr-text { font-size: .75em; min-height: 2.6em; margin-top: .6em; }
      `}</style>
    </div>
  );
}
