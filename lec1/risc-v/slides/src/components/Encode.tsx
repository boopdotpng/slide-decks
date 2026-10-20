/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { highlight } from './Code';
import { BitFields, Bytes, COLORS, hex } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Assembling one instruction from our loop by hand: add t2, t2, t3 → fields →
 * 32 bits → 4 bytes. 0x01c383b3 is what llvm-mc produces (llvm-objdump of sum).
 * Field colors match the formats and decode slides.
 */

const WORD = 0x01c383b3;
const BYTES = [0, 1, 2, 3].map((k) => (WORD >>> (8 * k)) & 0xff);

const FIELDS = [
  { name: 'funct7', hi: 31, lo: 25, color: COLORS.amber, value: '0' },
  { name: 'rs2', hi: 24, lo: 20, color: COLORS.blue, value: '28 = t3' },
  { name: 'rs1', hi: 19, lo: 15, color: COLORS.blue, value: '7 = t2' },
  { name: 'funct3', hi: 14, lo: 12, color: COLORS.amber, value: '0' },
  { name: 'rd', hi: 11, lo: 7, color: COLORS.green, value: '7 = t2' },
  { name: 'opcode', hi: 6, lo: 0, color: COLORS.slate, value: '0x33' },
];

const STEPS: ComponentChildren[] = [
  <>the cpu can't read text. every instruction has to become exactly <b>32 bits</b></>,
  <>register names are just numbers: t2 is x7, t3 is x28 (the register grid). 5 bits each, because 2⁵ = 32 registers</>,
  <>the <b>opcode</b> (0x33) says "two registers in, one out". funct3 = 0 and funct7 = 0 pick add out of that family (sub has funct7 = 32)</>,
  <>write each number into its field, in binary. that's the instruction: <code>0x01c383b3</code></>,
  <>stored as 4 bytes, lowest byte first ("little-endian"). this is all the assembler does, for every line</>,
];

export default function Encode() {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  return (
    <div class="encode" ref={root}>
      <div class="en-top">
        <code class="en-asm">{highlight('add  t2, t2, t3', 'asm')}</code>
        <span class={`fade ${step >= 1 ? 'on' : ''} en-regs`}>→ add x7, x7, x28</span>
      </div>
      <div class={`fade ${step >= 1 ? 'on' : ''} ${step < 3 ? 'en-nobits' : ''}`}>
        <BitFields word={WORD} fields={FIELDS.map((f) => ({ ...f, value: step >= 2 || f.name.startsWith('r') ? f.value : '?' }))} values />
      </div>
      <div class="en-out">
        <div class={`fade ${step >= 3 ? 'on' : ''} en-word`}><span class="muted">=</span> <code>0x{hex(WORD, 8)}</code></div>
        <div class={`fade ${step >= 4 ? 'on' : ''}`}><Bytes data={BYTES} label="in memory" /></div>
      </div>
      <div class="caption en-text">{STEPS[step]}</div>
      <style>{`
        .encode { font-size: .8em; }
        .encode .en-top { display: flex; gap: 1.5em; align-items: baseline; margin-bottom: 1em; }
        .encode .en-asm { background: none; padding: 0; font-size: 1.5em; }
        .encode .en-regs { font-family: var(--mono); color: var(--muted); }
        .encode .en-out { display: flex; gap: 3em; align-items: center; margin-top: 1em; min-height: 3em; }
        .encode .en-word { font-size: 1.3em; padding-top: 1em; }
        .encode .en-text { font-size: 1em; min-height: 3em; margin-top: 1em; }
        .encode .bf-cells span { transition: color .3s; }
        .encode .en-nobits .bf-cells span { color: transparent; }
      `}</style>
    </div>
  );
}
