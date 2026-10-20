/** @jsxImportSource preact */
import { Walkthrough } from './viz';
import asm from '../asm/loop.s?raw';

/**
 * clang's sum loop (asm/loop.s) running on a = {3, 1, 4, 1} at 0x2000, n = 4.
 * One instruction per step for the setup and the first lap; the later laps are
 * one step each (all four loop lines lit), since they're the same four instructions.
 * Addresses are made up (sum at 0x1000); the values are what the code computes.
 */

const A = [3, 1, 4, 1];
const BASE = 0x2000;
const hex = (n: number) => '0x' + n.toString(16);

// loop.s lines: 1 li, 2 blez, 3 slli, 4 add, 6 ld, 7 addi, 8 add, 9 bne, 11 mv, 12 ret
type St = { hl: number[]; pc?: number; a0?: number; a1?: number; a2?: number; a3?: number; text: string };
const STEPS: St[] = [
  { hl: [0], a0: BASE, a1: 4, text: 'sum(a, 4). a0 = address of a[0], a1 = n' },
  { hl: [1], pc: 0x1000, a2: 0, text: 'total = 0, kept in a2' },
  { hl: [2], pc: 0x1004, text: 'n > 0, so blez doesn\'t jump: fall through into the setup' },
  { hl: [3], pc: 0x1008, a1: 32, text: 'n × 8 = 32 bytes: the size of the array' },
  { hl: [4], pc: 0x100c, a1: BASE + 32, text: 'a1 = a + 32: one past the end. this is where the loop stops' },
  { hl: [6], pc: 0x1010, a3: 3, text: 'load the long at a0 (a[0] = 3)' },
  { hl: [7], pc: 0x1014, a0: BASE + 8, text: 'a0 moves 8 bytes: now it points at a[1]' },
  { hl: [8], pc: 0x1018, a2: 3, text: 'total += 3' },
  { hl: [9], pc: 0x101c, text: 'a0 ≠ a1, so jump back to .LBB0_2 (pc = 0x1010)' },
  { hl: [6, 7, 8, 9], pc: 0x101c, a3: 1, a0: BASE + 16, a2: 4, text: 'lap 2: the same four instructions. total = 4' },
  { hl: [6, 7, 8, 9], pc: 0x101c, a3: 4, a0: BASE + 24, a2: 8, text: 'lap 3: total = 8' },
  { hl: [6, 7, 8, 9], pc: 0x101c, a3: 1, a0: BASE + 32, a2: 9, text: 'lap 4: total = 9. now a0 == a1, so bne falls through' },
  { hl: [11], pc: 0x1020, a0: 9, text: 'the result has to be in a0' },
  { hl: [12], pc: 0x1024, text: 'ret: back to the caller with 9. 4 laps × 4 instructions, no i anywhere' },
];

const REGS = ['a0', 'a1', 'a2', 'a3'] as const;
const NOTES = { a0: 'pointer', a1: 'n, then end', a2: 'total', a3: 'a[i]' };
const fmt = (r: string, v: number) => (r === 'a0' && v !== 9) || (r === 'a1' && v > 100) ? hex(v) : String(v);
const stateAt = (k: number) => Object.assign({}, ...STEPS.slice(0, k + 1).map((s) =>
  Object.fromEntries(Object.entries(s).filter(([n, v]) => n !== 'hl' && n !== 'text' && v !== undefined))));

export default function LoopRun() {
  return (
    <Walkthrough lang="asm" code={asm}
      vars={[{ name: 'pc' }, ...REGS.map((r) => ({ name: r, reg: true, note: NOTES[r] }))]}
      steps={STEPS.map((s) => ({
        hl: s.hl,
        set: Object.fromEntries(Object.entries(s)
          .filter(([n, v]) => n !== 'hl' && n !== 'text' && v !== undefined)
          .map(([n, v]) => [n, n === 'pc' ? hex(v as number) : fmt(n, v as number)])),
        text: s.text,
      }))}
      aside={(k) => {
        const st = stateAt(k);
        const ptr = k >= 12 ? -1 : (st.a0 - BASE) / 8;
        const end = st.a1 > 100 ? (st.a1 - BASE) / 8 : -1;
        return (
          <div class="loop-mem">
            {[...A, null].map((v, i) => (
              <div class={`lm-cell ${v === null ? 'past' : ''} ${i === ptr ? 'on' : ''}`}>
                <span class="lm-addr">{hex(BASE + 8 * i)}</span>
                <span class="lm-v">{v ?? '…'}</span>
                <span class="lm-ptr">{[i === ptr && 'a0', i === end && 'a1'].filter(Boolean).join(' ')}</span>
              </div>
            ))}
            <style>{`
              .loop-mem { display: flex; gap: .3em; font-family: var(--mono); }
              .loop-mem .lm-cell { display: flex; flex-direction: column; align-items: center; min-width: 4.4em; }
              .loop-mem .lm-addr { font-size: .7em; color: var(--muted); }
              .loop-mem .lm-v { width: 100%; text-align: center; background: #1c1c1c; border-radius: 4px; padding: .2em 0;
                box-shadow: inset 0 0 0 2px transparent; transition: box-shadow .25s; }
              .loop-mem .past .lm-v { background: none; color: var(--muted); }
              .loop-mem .on .lm-v { box-shadow: inset 0 0 0 2px var(--accent); }
              .loop-mem .lm-ptr { color: var(--accent); min-height: 1.4em; }
            `}</style>
          </div>
        );
      }} />
  );
}
