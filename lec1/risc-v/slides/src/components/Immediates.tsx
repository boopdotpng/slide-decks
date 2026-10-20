/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { highlight } from './Code';
import { BitFields, COLORS, type Field } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Immediates and lui, one instruction at a time: the instruction, its real
 * 32-bit encoding (immediate field colored), and what lands in t0.
 * Builds t0 = 1000000 = 0x000f4240 as lui 244 (0xf4) + addi 576 (0x240).
 */

const rd = { name: 'rd = t0', hi: 11, lo: 7, color: COLORS.green, value: 'x5' };
const op = (v: string) => ({ name: 'opcode', hi: 6, lo: 0, color: COLORS.slate, value: v });
const I = (imm: string, rs1: string, immColor = COLORS.amber): Field[] => [
  { name: 'immediate (12 bits)', hi: 31, lo: 20, color: immColor, value: imm },
  { name: 'rs1', hi: 19, lo: 15, color: COLORS.blue, value: rs1 },
  { name: 'f3', hi: 14, lo: 12, color: COLORS.slate, value: '0' },
  rd, op('0x13 addi'),
];
const U: Field[] = [
  { name: 'immediate (20 bits)', hi: 31, lo: 12, color: COLORS.violet, value: '0xf4 = 244' },
  rd, op('0x37 lui'),
];

const ADDI5 = { asm: 'addi t0, zero, 5', word: 0x00500293, fields: I('5', 'zero') };
const LUI = { asm: 'lui  t0, 244', word: 0x000f42b7, fields: U };
const ADDI576 = { asm: 'addi t0, t0, 576', word: 0x24028293, fields: I('0x240 = 576', 't0') };

// the value in t0 (low 32 bits), split where lui and addi meet
const T0 = (v: number, upper: string, lower: string): { word: number; fields: Field[] } => ({
  word: v,
  fields: [
    { name: 'upper 20 bits', hi: 31, lo: 12, color: COLORS.violet, value: upper },
    { name: 'lower 12 bits', hi: 11, lo: 0, color: COLORS.amber, value: lower },
  ],
});

const STEPS: { inst?: typeof ADDI5; t0?: ReturnType<typeof T0>; t0Text?: string; text: ComponentChildren }[] = [
  { inst: ADDI5, t0: T0(5, '0', '5'), t0Text: 't0 = 5',
    text: <>a constant written in the instruction is an <b>immediate</b>: it's stored right in the instruction's bits</> },
  { inst: ADDI5, t0: T0(5, '0', '5'), t0Text: 't0 = 5',
    text: <>but an instruction is only 32 bits, and the registers and opcode need room too. that leaves 12 bits: <b>−2048 to 2047</b></> },
  { t0: T0(1_000_000, '0xf4 = 244', '0x240 = 576'), t0Text: 'want: t0 = 1000000 = 0x000f4240',
    text: <>so how do you get 1000000 into a register? split it: the top 20 bits and the bottom 12</> },
  { inst: LUI, t0: T0(0x000f4000, '0xf4 = 244', '0'), t0Text: 't0 = 244 << 12 = 999424',
    text: <><b>lui</b>, load upper immediate: a 20-bit immediate goes into the <b>top</b> of the register, the bottom 12 bits are zero</> },
  { inst: ADDI576, t0: T0(1_000_000, '0xf4 = 244', '0x240 = 576'), t0Text: 't0 = 999424 + 576 = 1000000',
    text: <>then <b>addi</b> fills in the bottom 12. two instructions, any 32-bit constant</> },
  { inst: ADDI576, t0: T0(1_000_000, '0xf4 = 244', '0x240 = 576'), t0Text: 't0 = 1000000',
    text: <>you write <code>li t0, 1000000</code> and the assembler picks: one addi if it fits, lui + addi if not.
      addresses work the same way: <code>lui a1, %hi(count)</code> … <code>%lo(count)</code></> },
];

export default function Immediates() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[k];
  return (
    <div class="immediates" ref={root}>
      <div class="im-row">
        <div class="im-label muted">instruction</div>
        <div class={`fade ${cur.inst ? 'on' : ''}`}>
          <code class="im-asm">{highlight((cur.inst ?? ADDI5).asm, 'asm')}</code>
          <span class="muted im-hex">0x{(cur.inst ?? ADDI5).word.toString(16).padStart(8, '0')}</span>
          <BitFields word={(cur.inst ?? ADDI5).word} fields={(cur.inst ?? ADDI5).fields} values />
        </div>
      </div>
      <div class="im-row">
        <div class="im-label muted">t0 <span class="small">(low 32 bits)</span></div>
        <div>
          <code class="im-asm">{cur.t0Text}</code>
          <BitFields word={cur.t0!.word} fields={cur.t0!.fields} values />
        </div>
      </div>
      <div class="caption im-text">{cur.text}</div>
      <style>{`
        .immediates { font-size: .62em; }
        .immediates .im-row { display: grid; grid-template-columns: 7em 1fr; gap: 1em; align-items: start; margin-bottom: 1.4em; }
        .immediates .im-label { padding-top: .3em; }
        .immediates .im-asm { background: none; padding: 0; font-size: 1.3em; display: inline-block; margin-bottom: .5em; }
        .immediates .im-hex { font-family: var(--mono); margin-left: 1.5em; }
        .immediates .im-text { font-size: 1.25em; min-height: 3em; }
        .immediates .im-text code { font-size: .9em; }
      `}</style>
    </div>
  );
}
