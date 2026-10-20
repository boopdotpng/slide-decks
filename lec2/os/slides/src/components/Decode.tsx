/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code, { highlight } from './Code';
import { BitFields, Bytes, COLORS, hex } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * One instruction, from bytes in memory to "x5 = x6 + x7". Steps 0–6:
 * bytes → word → bits → fields → field values + extraction code → switch → result.
 * The word is add x5, x6, x7 (same example as riscv_formats.svg).
 */

const WORD = 0x007302b3;
const BYTES = [0, 1, 2, 3].map((k) => (WORD >>> (8 * k)) & 0xff); // little-endian: low byte first

const FIELDS = [
  { name: 'funct7', hi: 31, lo: 25, color: COLORS.amber, value: '0' },
  { name: 'rs2', hi: 24, lo: 20, color: COLORS.blue, value: 'x7' },
  { name: 'rs1', hi: 19, lo: 15, color: COLORS.blue, value: 'x6' },
  { name: 'funct3', hi: 14, lo: 12, color: COLORS.amber, value: '0' },
  { name: 'rd', hi: 11, lo: 7, color: COLORS.green, value: 'x5' },
  { name: 'opcode', hi: 6, lo: 0, color: COLORS.slate, value: '0x33' },
];

const C_SRC = `
u32 inst   = load32(pc);
u32 opcode = inst & 0x7f;
u32 rd     = (inst >> 7)  & 0x1f;
u32 funct3 = (inst >> 12) & 0x7;
u32 rs1    = (inst >> 15) & 0x1f;
u32 rs2    = (inst >> 20) & 0x1f;
u32 funct7 = inst >> 25;

switch (opcode) {
case 0x33:                          // register-register
    if (funct3 == 0 && funct7 == 0)
        x[rd] = x[rs1] + x[rs2];    // add
    ...
case 0x13: /* addi, slli, ... */    ...
case 0x03: /* ld, lw, lb, ... */    ...
case 0x73: /* ecall */              ...
}
pc += 4;`;

const CODE_HL: Record<number, number[]> = { 4: [0, 1, 2, 3, 4, 5, 6], 5: [8, 9, 10, 11], 6: [9, 10, 11, 17] };

const CAPTIONS = [
  '4 bytes in memory, at the address in pc',
  'read them as one 32-bit number (little-endian: lowest byte first)',
  "it's just bits",
  'the format puts each field at a fixed position',
  'shift and mask to pull each field out',
  'switch on the opcode, then funct3 / funct7',
  'add x5, x6, x7',
];

export default function Decode() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);

  return (
    <div ref={root} style={{ fontSize: '.74em' }}>
      <div style={{ display: 'flex', gap: '1.2em', alignItems: 'center' }}>
        <Bytes data={BYTES} label="mem[pc]" />
        <div class={`fade ${step >= 1 ? 'on' : ''}`} style={{ paddingBottom: '1.6em' }}>
          <span class="muted">→</span> <code>0x{hex(WORD, 8)}</code>
        </div>
        <div class={`fade ${step >= 6 ? 'on' : ''}`} style={{ paddingBottom: '1.6em' }}>
          <span class="muted">=</span> <code>{highlight('add x5, x6, x7', 'asm')}</code>
          <span class="muted"> → x5 = x6 + x7</span>
        </div>
      </div>
      <div class={`fade ${step >= 2 ? 'on' : ''}`}>
        <BitFields word={WORD} fields={FIELDS} split={step >= 3} values={step >= 4} />
      </div>
      <div style={{ display: 'flex', gap: '2em', alignItems: 'flex-start', marginTop: '.6em' }}>
        <div class={`fade ${step >= 4 ? 'on' : ''}`} style={{ fontSize: '.78em' }}>
          <Code lang="c" code={C_SRC} hl={CODE_HL[step]} />
        </div>
        <div class="caption" style={{ flex: 1, fontSize: '1em', paddingTop: '.6em' }}>{CAPTIONS[step]}</div>
      </div>
    </div>
  );
}
