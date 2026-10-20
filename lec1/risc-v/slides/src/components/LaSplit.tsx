/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { highlight } from './Code';
import { BitFields, COLORS, type Field } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Why `la t0, nums` is two instructions: an I-type immediate is only 12 bits,
 * and nums is at 0x12198. The assembler emits auipc + addi (pc-relative);
 * encodings and addresses are from llvm-objdump of sum (_start = 0x11158).
 */

const rd = (v: string) => ({ name: 'rd', hi: 11, lo: 7, color: COLORS.green, value: v });
const op = (v: string) => ({ name: 'opcode', hi: 6, lo: 0, color: COLORS.slate, value: v });
const I = (imm: string, rs1: string, d: string, o: string): Field[] => [
  { name: 'immediate: 12 bits', hi: 31, lo: 20, color: COLORS.violet, value: imm },
  { name: 'rs1', hi: 19, lo: 15, color: COLORS.blue, value: rs1 },
  { name: 'f3', hi: 14, lo: 12, color: COLORS.amber, value: '0' },
  rd(d), op(o),
];

type Inst = { asm: string; word: number; fields: Field[]; t?: string };
const LI = { asm: 'li    t1, 8', t: 'addi t1, zero, 8', word: 0x00800313, fields: I('8', 'zero', 't1', 'addi') };
const AUIPC = { asm: 'auipc t0, 1', word: 0x00001297,
  fields: [{ name: 'immediate: 20 bits', hi: 31, lo: 12, color: COLORS.violet, value: '1 → 1 << 12 = 0x1000' }, rd('t0'), op('auipc')] };
const ADDI = { asm: 'addi  t0, t0, 0x40', word: 0x04028293, fields: I('0x40', 't0', 't0', 'addi') };

const STEPS: { inst?: Inst; t0?: string; text: ComponentChildren }[] = [
  { inst: LI, text: <>a number written inside the instruction is an <b>immediate</b>. <code>li t1, 8</code> is addi with 8 in its top 12 bits</> },
  { inst: LI, text: <>12 bits only holds −2048 to 2047. the registers and opcode need the rest of the 32</> },
  { text: <>but <code>la t0, nums</code> needs t0 = <b>0x12198</b> (74136). way too big for 12 bits</> },
  { inst: AUIPC, t0: 'pc + 0x1000 = 0x11158 + 0x1000 = 0x12158',
    text: <><b>auipc</b>: add a 20-bit immediate, shifted up 12, to the pc (the address of this instruction). this gets close</> },
  { inst: ADDI, t0: '0x12158 + 0x40 = 0x12198 = nums ✓',
    text: <>then an ordinary addi adds the rest. two instructions = 8 bytes, that's why pc jumped by 8 on the la</> },
  { inst: ADDI, t0: '0x12198 = nums ✓',
    text: <>you write <code>la</code>, the assembler writes these two, and the linker fills in the numbers once it knows where everything goes</> },
];

export default function LaSplit() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[k];
  const inst = cur.inst ?? LI;
  return (
    <div class="la-split" ref={root}>
      <div class={`fade ${cur.inst ? 'on' : ''}`}>
        <code class="ls-asm">{highlight(inst.asm, 'asm')}</code>
        {inst.t && <span class="muted ls-real">= {inst.t}</span>}
        <span class="muted ls-hex">0x{inst.word.toString(16).padStart(8, '0')}</span>
        <BitFields word={inst.word} fields={inst.fields} values />
      </div>
      <div class={`ls-t0 fade ${cur.t0 ? 'on' : ''}`}><span class="tok-reg">t0</span> = {cur.t0 ?? ' '}</div>
      <div class="caption ls-text">{cur.text}</div>
      <style>{`
        .la-split { font-size: .66em; }
        .la-split .ls-asm { background: none; padding: 0; font-size: 1.4em; display: inline-block; margin-bottom: .6em; white-space: pre; }
        .la-split .ls-real { font-family: var(--mono); margin-left: 1.2em; }
        .la-split .ls-hex { font-family: var(--mono); margin-left: 1.5em; }
        .la-split .ls-t0 { font-family: var(--mono); font-size: 1.3em; margin: 1.4em 0 .6em; min-height: 1.4em; }
        .la-split .ls-text { font-size: 1.2em; min-height: 3em; }
      `}</style>
    </div>
  );
}
