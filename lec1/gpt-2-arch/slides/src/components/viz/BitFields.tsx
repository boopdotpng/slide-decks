/** @jsxImportSource preact */
import { COLORS } from './color';

/**
 * A binary word as bits, split into colored fields (from the risc-v deck's
 * instruction decode slide). Typical step sequence: bits → split → values.
 *
 *   <BitFields word={0x007302b3} split={step >= 1} values={step >= 2} fields={[
 *     { name: 'funct7', hi: 31, lo: 25, color: COLORS.amber, value: '0' }, ...]} />
 */
export type Field = { name: string; hi: number; lo: number; color?: string; value?: string };

export function BitFields({ word, fields, split = true, values = false }: {
  word: number | bigint;
  /** high bit first, covering the whole word */
  fields: Field[];
  /** gaps, names and colors on; off = one plain row of bits */
  split?: boolean;
  /** show each field's value underneath */
  values?: boolean;
}) {
  const w = BigInt(word);
  const bit = (i: number) => Number((w >> BigInt(i)) & 1n);
  return (
    <div class={`bitfields ${split ? 'split' : ''}`}>
      {fields.map((f) => (
        <div class="bf" style={{ flex: f.hi - f.lo + 1, '--fc': f.color ?? COLORS.slate }}>
          <div class="bf-name">{f.name}</div>
          <div class="bf-cells">
            {Array.from({ length: f.hi - f.lo + 1 }, (_, j) => <span>{bit(f.hi - j)}</span>)}
          </div>
          <div class={`bf-val fade ${values ? 'on' : ''}`}>{f.value}</div>
        </div>
      ))}
    </div>
  );
}

/**
 * Bytes in memory as cells (a string, or numbers shown as hex), with an
 * address, an optional highlighted range (e.g. the len of a buffer) and a
 * pointer label under one byte.
 *
 *   <Bytes data="hello, world\n" addr={0x10120} hl={[0, 13]} ptr={{ at: 0, label: 'a1' }} />
 */
export function Bytes({ data, addr, label, hl, ptr }: {
  data: string | number[];
  addr?: number;
  label?: string;
  /** [start, end) byte range to outline */
  hl?: [number, number];
  ptr?: { at: number; label: string };
}) {
  const cells = typeof data === 'string'
    ? [...data].map((c) => (c === '\n' ? '\\n' : c === ' ' ? '␣' : c === '\0' ? '\\0' : c))
    : data.map((b) => b.toString(16).padStart(2, '0'));
  return (
    <div class="bytes-view">
      {(addr !== undefined || label) && (
        <div class="muted bv-addr">{[addr !== undefined && `0x${addr.toString(16)}`, label].filter(Boolean).join('  ')}</div>
      )}
      <div class="bv-row">
        {cells.map((c, i) => (
          <span class={`bv-b ${hl && i >= hl[0] && i < hl[1] ? 'in' : ''} ${hl && i === hl[0] ? 'first' : ''} ${hl && i === hl[1] - 1 ? 'last' : ''}`}>
            {c}
            {ptr?.at === i && <span class="bv-ptr">↑ {ptr.label}</span>}
          </span>
        ))}
      </div>
    </div>
  );
}
