/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { Bytes, StateTable } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * "hi\n" in .rodata, greeting() handing out its address, then length() from
 * src/asm/strings.s walking it with lbu. Register values are exact for that asm
 * if .L.str lands at 0x10200 (lui a0, 0x10 → 0x10000; addi 0x200 → 0x10200).
 * The first loop pass goes one instruction per step, the rest one pass per step.
 */
const BASE = 0x10200;
const STR = 'hi\n\0';
const hx = (n: number) => '0x' + n.toString(16);
const ch = (k: number) => `${hx(STR.charCodeAt(k))}  '${['h', 'i', '\\n', '\\0'][k]}'`;

type Regs = { a0?: string | number; a1?: string | number; a2?: string };
const STEPS: { c: number[]; asm: number[]; set: Regs; ptr?: number; text: ComponentChildren }[] = [
  { c: [8], asm: [15, 16, 17], set: {},
    text: <>a string is just bytes in .rodata, ending in a 0 byte. <code>"hi\n"</code> is 4 bytes</> },
  { c: [7, 8], asm: [11], set: { a0: hx(0x10000) },
    text: <><code>greeting()</code> returns the string's <b>address</b>, not its bytes. <code>lui</code>: the upper 20 bits</> },
  { c: [7, 8], asm: [12], set: { a0: hx(BASE) }, ptr: -1,
    text: <><code>addi</code>: plus the low 12. a0 now points at the 'h'. a <code>char *</code> is just this number</> },
  { c: [0, 1], asm: [1], set: { a1: 0 }, ptr: -1,
    text: <>now <code>length(s)</code>: s arrives in a0. n lives in a1</> },
  { c: [2], asm: [3], set: { a2: hx(BASE) }, ptr: 0,
    text: <>a2 = s + n: the address of s[n]</> },
  { c: [2], asm: [4], set: { a2: ch(0) }, ptr: 0,
    text: <><code>lbu</code>: load one byte, unsigned. a2 = 'h'</> },
  { c: [3], asm: [5], set: { a1: 1 }, ptr: 0,
    text: <>n++ already, before the check</> },
  { c: [2], asm: [6], set: {}, ptr: 0,
    text: <>'h' isn't 0, so jump back</> },
  { c: [2, 3], asm: [3, 4, 5, 6], set: { a1: 2, a2: ch(1) }, ptr: 1, text: <>'i': n = 2, go again</> },
  { c: [2, 3], asm: [3, 4, 5, 6], set: { a1: 3, a2: ch(2) }, ptr: 2, text: <>'\n': n = 3, go again</> },
  { c: [2, 3], asm: [3, 4, 5, 6], set: { a1: 4, a2: ch(3) }, ptr: 3,
    text: <>the 0 byte: <code>bnez</code> falls through. but n was already bumped to 4…</> },
  { c: [4], asm: [7, 8], set: { a0: 3 }, ptr: 3,
    text: <>…so clang returns n − 1 = 3. it moved the check to the bottom of the loop (one branch per pass, not two) and fixed up n at the end</> },
];

export default function Strings({ c, asm }: { c: string; asm: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];
  const state = Object.assign({}, ...STEPS.slice(0, step + 1).map((s) => s.set));
  const ptr = cur.ptr === undefined ? undefined : cur.ptr < 0 ? { at: 0, label: 'a0' } : { at: cur.ptr, label: 'a2' };
  return (
    <div class="strings" ref={root}>
      <div class="str-cols">
        <Code lang="c" code={c} hl={cur.c} />
        <Code lang="asm" code={asm} hl={cur.asm} />
        <div class="str-right">
          <Bytes data={STR} addr={BASE} label=".rodata  .L.str" ptr={ptr} hl={step === 0 ? [0, 4] : undefined} />
          <StateTable vars={[{ name: 'a0', note: 's / result', reg: true }, { name: 'a1', note: 'n', reg: true },
          { name: 'a2', note: '&s[n], then s[n]', reg: true }]} state={state} changed={Object.keys(cur.set)} />
        </div>
      </div>
      <div class="caption str-text">{cur.text}</div>
      <style>{`
        .strings .str-right { display: flex; flex-direction: column; gap: .4em; }
        .strings .bytes-view { font-size: 1em; }
        .strings .str-cols { display: flex; gap: 1.5em; align-items: flex-start; }
        .strings .str-cols pre { font-size: .5em; margin: 0; }
        .strings .state-table { font-size: .6em; }
        .strings .str-text { font-size: .75em; min-height: 2.8em; margin-top: .6em; }
      `}</style>
    </div>
  );
}
