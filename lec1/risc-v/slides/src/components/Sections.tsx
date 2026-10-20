/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { AddressSpace, type RegionKey } from './AddressSpace';
import { useSlideStep } from '../deck/hooks';

/**
 * c/sections.c and clang's asm for it, one section per step, lit on the memory
 * map. Line numbers are 0-based into the .c and src/asm/sections.s.
 */
const NONE = [-1]; // dims every line
const STEPS: { lit: RegionKey[]; c: number[]; asm: number[]; note?: Partial<Record<RegionKey, ComponentChildren>>; text: ComponentChildren }[] = [
  { lit: [], c: NONE, asm: NONE,
    text: 'clang sorts everything into sections. the loader copies each one into its own part of memory' },
  { lit: ['text'], c: [4, 5, 6, 7], asm: [0, 1, 2, 3, 4, 5], note: { text: 'next()' },
    text: <>functions → <b>.text</b>. the cpu fetches instructions from here. read + execute, not writable</> },
  { lit: ['rodata'], c: [0], asm: [7, 8, 9], note: { rodata: '"hello\\0"' },
    text: <>the string literal → <b>.rodata</b>: 6 bytes, with a 0 at the end. read-only: writing to a string literal crashes</> },
  { lit: ['data'], c: [0, 1], asm: [11, 12, 13, 14, 15, 16], note: { data: 'msg, count' },
    text: <>globals with a starting value → <b>.data</b>. msg is a pointer: 8 bytes holding .L.str's address. count holds 5</> },
  { lit: ['bss'], c: [2], asm: [18, 19, 20], note: { bss: 'zeros' },
    text: <>globals that start at 0 → <b>.bss</b>. <code>.zero 800</code>: the file only says "800 zero bytes here"; it stores none of them</> },
  { lit: ['text', 'data'], c: [5], asm: [1, 2, 3, 4],
    text: <>code reaches a global by its address: lui puts its upper 20 bits in a1, ld and sd add the low 12. count = count + 1 is a load, an add, a store</> },
  { lit: ['stack'], c: NONE, asm: NONE, note: { stack: 'long buf[4]; inside a function' },
    text: <>locals → <b>the stack</b>. made when the function is called, gone when it returns</> },
  { lit: ['heap'], c: NONE, asm: NONE, note: { heap: 'malloc(800)' },
    text: <><code>malloc</code> → <b>the heap</b>. yours until <code>free</code>. not in the file at all: it's made while the program runs</> },
];

export default function Sections({ c, asm }: { c: string; asm: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];
  const notes = Object.fromEntries(STEPS.slice(1, step + 1).flatMap((s) => Object.entries(s.note ?? {})));
  return (
    <div class="sections" ref={root}>
      <div class="sec-cols">
        <div class="sec-code">
          <div class="muted sec-t">c</div>
          <Code lang="c" code={c} hl={cur.c} />
          <div class="muted sec-t" style={{ marginTop: '.8em' }}>risc-v · clang -O1</div>
          <Code lang="asm" code={asm} hl={cur.asm} />
        </div>
        <div class="sec-map"><AddressSpace lit={cur.lit} notes={notes} /></div>
      </div>
      <div class="caption sec-text">{cur.text}</div>
      <style>{`
        .sections .sec-cols { flex: 1; min-height: 0; display: flex; gap: 2.5em; }
        .sections .sec-code { display: grid; grid-template-columns: auto auto; grid-template-rows: auto 1fr;
          grid-auto-flow: column; column-gap: 1.5em; align-content: start; }
        .sections .sec-code pre { font-size: .5em; margin: 0; align-self: start; }
        .sections .sec-t { font-size: .5em; margin: 0 0 .3em !important; }
        .sections .sec-map { flex: 1; min-width: 0; display: flex; flex-direction: column; }
        .sections .sec-text { font-size: .75em; min-height: 2.6em; margin-top: .5em; }
      `}</style>
    </div>
  );
}
