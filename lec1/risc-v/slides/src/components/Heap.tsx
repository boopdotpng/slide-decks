/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { StateTable } from './viz';
import { AddressSpace, type Marker, type RegionKey } from './AddressSpace';
import { useSlideStep } from '../deck/hooks';

/**
 * squares(4) from c/heap.c, against clang's asm (src/asm/heap.s) and the memory
 * map. malloc's address (0x21000) is made up; the register flow is the real asm's:
 * n goes to s0 to survive the call, p stays in a0 (the return value), a2 walks it.
 */
const P = 0x21000;
const hx = (n: number) => '0x' + n.toString(16);

type S = {
  c: number[]; asm: number[]; set: Record<string, string | number>; text: ComponentChildren;
  lit: RegionKey[]; heap?: number; filled?: number; brk?: boolean; ptr?: number; bad?: boolean;
};
const STEPS: S[] = [
  { c: [2], asm: [1, 2, 3, 4], lit: ['stack'], set: { a0: 4, s0: 4 },
    text: <><code>squares(4)</code>: n arrives in a0. it's needed after the call, so it moves to s0 (saving the caller's s0 on the stack first)</> },
  { c: [3], asm: [5, 6], lit: ['heap'], set: { a0: hx(P) }, filled: 0,
    text: <>a0 = 4 × 8 = 32 bytes. <code>malloc</code> is just a function: it finds 32 free bytes in the heap and returns their address</> },
  { c: [3], asm: [6], lit: ['heap', 'free'], heap: 2, brk: true, filled: 0, set: {},
    text: <>when the heap is full, malloc asks the kernel for more (a syscall, <code>brk</code>): the break moves up into the free space</> },
  { c: [4, 5], asm: [8, 9, 11, 12, 13, 14, 15], lit: ['heap'], heap: 2, filled: 1, ptr: 1,
    set: { a1: 1, a2: hx(P + 8), a3: 0 },
    text: <>the loop: a3 = i × i, store it at a2, bump a2 by 8. clang walks a pointer instead of computing p + i × 8</> },
  { c: [4, 5], asm: [11, 12, 13, 14, 15], lit: ['heap'], heap: 2, filled: 4, ptr: 4,
    set: { a1: 4, a2: hx(P + 32), a3: 9 },
    text: <>4 passes later i == n and <code>bne</code> falls through. p[] = 0, 1, 4, 9</> },
  { c: [6], asm: [17, 18, 19, 20], lit: ['heap', 'stack'], heap: 2, filled: 4,
    set: { s0: "caller's" },
    text: <>return p: it's still in a0. the stack frame is popped, but the 32 heap bytes stay until someone calls <code>free(p)</code></> },
  { c: [-1], asm: [-1], lit: ['stack'], heap: 2, filled: 4, bad: true, set: {},
    text: <>the stack is different: a local dies when its function returns. return a pointer to one and the next call reuses that space</> },
];

const BAD = `long *bad(void) {
    long x[4] = {0, 1, 4, 9};
    return x;   // x is on the stack
}`;

export default function Heap({ c, asm }: { c: string; asm: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];
  const state = Object.assign({}, ...STEPS.slice(0, step + 1).map((s) => s.set));
  const markers: Marker[] = [];
  if (step >= 1) markers.push({ region: 'heap', at: 0.85, label: 'p' });
  if (cur.brk || (cur.heap ?? 0) > 1) markers.push({ region: 'heap', at: 0, label: 'break', color: 'var(--muted)' });
  if (cur.bad) markers.push({ region: 'stack', at: 0.7, label: 'x', color: 'var(--bad)' });
  const cells = (
    <div class="hp-cells">
      {[0, 1, 2, 3].map((i) => (
        <span class={`hp-cell ${i < (cur.filled ?? 0) ? 'on' : ''} ${cur.ptr === i ? 'at' : ''}`}>{i < (cur.filled ?? 0) ? i * i : ''}</span>
      ))}
      {cur.ptr !== undefined && <span class="hp-a2">{cur.ptr < 4 ? `a2 at p[${cur.ptr}]` : "a2 just past the end"}</span>}
    </div>
  );
  return (
    <div class="heap-isl" ref={root}>
      <div class="hp-cols">
        <div class="hp-code">
          <Code lang="c" code={c} hl={cur.c} />
          <div class={`fade ${cur.bad ? 'on' : ''}`}><Code lang="c" code={BAD} /></div>
        </div>
        <Code lang="asm" code={asm} hl={cur.asm} />
        <div class="hp-right">
          <div class="hp-map">
            <AddressSpace lit={cur.lit} sizes={{ heap: cur.heap ?? 1.1, free: 4 - (cur.heap ?? 1.1) }}
              notes={{ heap: cur.filled !== undefined ? cells : undefined, stack: cur.bad ? 'x[] gets overwritten' : undefined }}
              markers={markers} />
          </div>
          <StateTable vars={[{ name: 'a0', note: 'n, then p', reg: true }, { name: 'a1', note: 'i', reg: true },
            { name: 'a2', note: '&p[i]', reg: true }, { name: 'a3', note: 'i × i', reg: true }, { name: 's0', note: 'n', reg: true }]}
            state={state} changed={Object.keys(cur.set)} />
        </div>
      </div>
      <div class="caption hp-text">{cur.text}</div>
      <style>{`
        .heap-isl { flex: 1; min-height: 0; display: flex; flex-direction: column; }
        .heap-isl .hp-cols { flex: 1; min-height: 0; display: flex; gap: 1.4em; align-items: flex-start; }
        .heap-isl .hp-code { display: flex; flex-direction: column; gap: .6em; }
        .heap-isl pre { font-size: .48em; margin: 0; }
        .heap-isl .hp-right { flex: 1; min-width: 0; height: 100%; display: flex; flex-direction: column; gap: .6em; }
        .heap-isl .hp-map { flex: 1; min-height: 0; }
        .heap-isl .state-table { font-size: .5em; align-self: flex-start; }
        .heap-isl .hp-cells { display: flex; gap: 3px; align-items: center; font-family: var(--mono); }
        .heap-isl .hp-cell { width: 2.2em; height: 1.6em; display: inline-flex; align-items: center; justify-content: center;
          background: var(--surface); border-radius: 3px; color: var(--fg); transition: background .3s; }
        .heap-isl .hp-cell.on { background: var(--fill-green); }
        .heap-isl .hp-cell.at { box-shadow: inset 0 0 0 2px var(--accent); }
        .heap-isl .hp-a2 { margin-left: .6em; color: var(--accent); white-space: nowrap; }
        .heap-isl .hp-text { font-size: .75em; min-height: 2.8em; margin-top: .4em; }
      `}</style>
    </div>
  );
}
