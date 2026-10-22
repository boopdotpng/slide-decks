/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { StateTable } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * fact(3), recursively, with the stack drawn as memory. The asm is
 * os/examples/05_functions.s's fact; addresses and values are what the rv
 * emulator shows: _start's call returns to 0x1112c, fact's own call returns to
 * 0x1115c (fact+0x24, the mul), sp starts at 0x7fffffe0 and each frame is 16 bytes.
 */

const C_SRC = `
long fact(long n) {
    if (n <= 1)
        return 1;
    return n * fact(n - 1);
}`;

const ASM = `
fact:
    addi sp, sp, -16      # prologue
    sd   ra, 8(sp)
    sd   s0, 0(sp)
    mv   s0, a0           # n lives in s0
    li   t0, 1
    ble  a0, t0, 1f
    addi a0, a0, -1
    call fact             # ra = 0x1115c
    mul  a0, a0, s0       # 0x1115c
    j    2f
1:  li   a0, 1
2:  ld   ra, 8(sp)        # epilogue
    ld   s0, 0(sp)
    addi sp, sp, 16
    ret`;

// the stack, high addresses at the top. row 0 is whatever _start had there.
const ROWS = [0x7fffffe0, 0x7fffffd8, 0x7fffffd0, 0x7fffffc8, 0x7fffffc0, 0x7fffffb8, 0x7fffffb0, 0x7fffffa8];
const spRow = (sp: number) => ROWS.indexOf(sp);
// frame k (0 = fact(3)) holds saved ra in row 1 + 2k, saved s0 in row 2 + 2k
const FRAMES = [
  { name: 'fact(3)', ra: '0x1112c', raNote: '→ _start', s0: '0', s0Note: "_start's s0" },
  { name: 'fact(2)', ra: '0x1115c', raNote: '→ the mul', s0: '3', s0Note: "fact(3)'s n" },
  { name: 'fact(1)', ra: '0x1115c', raNote: '→ the mul', s0: '2', s0Note: "fact(2)'s n" },
];

type St = { a0?: ComponentChildren; s0?: ComponentChildren; ra?: ComponentChildren; sp?: number };
const STEPS: { asm: number[]; c?: number[]; set: St; pushed: number; popped: number; text: ComponentChildren }[] = [
  { asm: [], set: { a0: 3, s0: 0, ra: '0x1112c', sp: 0x7fffffe0 }, pushed: 0, popped: 0,
    text: <>_start calls fact(3): a0 = 3, ra = 0x1112c (the way back into _start), sp = 0x7fffffe0</> },
  { asm: [1, 2, 3], c: [0], set: { sp: 0x7fffffd0 }, pushed: 1, popped: 0,
    text: <>prologue: move sp down 16 bytes, and save ra and s0 there. this is fact(3)'s <b>frame</b></> },
  { asm: [4, 5, 6, 7, 8], c: [4], set: { s0: 3, a0: 2, ra: '0x1115c' }, pushed: 1, popped: 0,
    text: <>keep n in s0, then call fact(2). the call overwrites ra, but the old one is safe in the frame</> },
  { asm: [1, 2, 3, 4], c: [0], set: { sp: 0x7fffffc0, s0: 2 }, pushed: 2, popped: 0,
    text: <>same code, new frame, 16 bytes lower. it saves s0 = 3 because that's fact(3)'s n: s registers must survive calls</> },
  { asm: [5, 6, 7, 8], c: [4], set: { a0: 1 }, pushed: 2, popped: 0,
    text: <>call fact(1). ra is 0x1115c again: every call from inside fact returns to the same mul</> },
  { asm: [1, 2, 3, 4], c: [0], set: { sp: 0x7fffffb0, s0: 1 }, pushed: 3, popped: 0,
    text: <>a third frame. three copies of fact are running at once, each with its own n and its own way back</> },
  { asm: [5, 6, 11], c: [1, 2], set: { a0: 1 }, pushed: 3, popped: 0,
    text: <>n ≤ 1: the base case. a0 = 1. this is as deep as the stack gets</> },
  { asm: [12, 13, 14, 15], c: [5], set: { ra: '0x1115c', s0: 2, sp: 0x7fffffc0 }, pushed: 3, popped: 1,
    text: <>epilogue: load ra and s0 back, sp up 16, ret. the frame is free again (the bytes are still there, nobody owns them)</> },
  { asm: [9, 10], c: [4], set: { a0: 2 }, pushed: 3, popped: 1,
    text: <>back in fact(2), at the mul. s0 = 2 is its n again: a0 = 1 × 2 = 2</> },
  { asm: [12, 13, 14, 15], c: [5], set: { ra: '0x1115c', s0: 3, sp: 0x7fffffd0 }, pushed: 3, popped: 2,
    text: <>pop fact(2)'s frame: s0 = 3, ret to the mul once more</> },
  { asm: [9, 10], c: [4], set: { a0: 6 }, pushed: 3, popped: 2,
    text: <>fact(3): a0 = 2 × 3 = 6</> },
  { asm: [12, 13, 14, 15], c: [5], set: { ra: '0x1112c', s0: 0, sp: 0x7fffffe0 }, pushed: 3, popped: 3,
    text: <>last epilogue: ra = 0x1112c and s0 = 0, exactly what _start had. sp is back where it started. a0 = 6</> },
  { asm: [], set: {}, pushed: 3, popped: 3,
    text: <>the stack is just memory and a pointer: each call moves sp down to make a frame, each return moves it back up.
      recurse too deep and sp runs off the end: <b>stack overflow</b></> },
];

export default function StackFrames() {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];
  const state: St = Object.assign({}, ...STEPS.slice(0, step + 1).map((s) => s.set));
  const prev: St = step ? Object.assign({}, ...STEPS.slice(0, step).map((s) => s.set)) : {};
  const changed = (['a0', 's0', 'ra', 'sp'] as const).filter((k) => step === 0 || state[k] !== prev[k]);
  const sp = spRow(state.sp!);
  const live = cur.pushed - cur.popped;

  return (
    <div class="stack-frames" ref={root}>
      <div class="sf-cols">
        <div class="sf-code">
          <Code lang="c" code={C_SRC} hl={cur.c ?? []} />
          <Code lang="asm" code={ASM} hl={cur.asm} />
        </div>
        <div class="sf-stack">
          <div class="sf-head muted"><span>address</span><span>value</span><span></span></div>
          <div class="sf-rows">
            {ROWS.map((addr, r) => {
              const k = Math.floor((r - 1) / 2), f = FRAMES[k];
              const isRa = r % 2 === 1;
              const written = r > 0 && k < cur.pushed;
              const freed = written && k >= live;
              const top = written && isRa;
              return (
                <div class={`sf-row ${r === 0 ? 'caller' : ''} ${written ? 'w' : ''} ${freed ? 'freed' : ''} ${top ? 'ftop' : ''}`}
                  style={{ '--fc': k % 2 ? 'var(--tint-blue)' : 'var(--tint-green)' }}>
                  <span class="sf-addr muted">0x{addr.toString(16)}</span>
                  <span class="sf-val">{r === 0 ? '…' : written ? (isRa ? f.ra : f.s0) : ''}</span>
                  <span class="sf-note muted">{r === 0 ? "_start's" : written ? (isRa ? <><b class="sf-fname">{f.name}</b>saved ra {f.raNote}</> : <>saved s0 · {f.s0Note}</>) : ''}</span>
                </div>
              );
            })}
            <div class="sf-sp" style={{ top: `calc(${sp} * var(--row))` }}>sp →</div>
          </div>
          <div class="muted sf-dir">↓ grows down</div>
        </div>
        <div class="sf-state">
          <StateTable vars={[{ name: 'a0', reg: true }, { name: 's0', reg: true }, { name: 'ra', reg: true }, { name: 'sp', reg: true }]}
            state={{ ...state, sp: '0x' + state.sp!.toString(16) }} changed={changed} />
          <div class="sf-depth muted">frames: {live}</div>
        </div>
      </div>
      <div class="caption sf-text">{cur.text}</div>
      <style>{`
        .stack-frames { --row: 1.9em; }
        .stack-frames .sf-cols { display: flex; gap: 1.1em; align-items: flex-start; }
        .stack-frames .sf-code { display: flex; flex-direction: column; gap: .4em; }
        .stack-frames .sf-code pre { font-size: .5em; margin: 0; padding: .4em .3em; }
        .stack-frames .sf-stack { font-family: var(--mono); font-size: .56em; flex: none; }
        .stack-frames .sf-head { display: grid; grid-template-columns: 7.2em 5em 14.5em; padding-left: 4.1em; font-size: .8em; margin-bottom: .2em; }
        .stack-frames .sf-rows { position: relative; padding-left: 3.6em; }
        .stack-frames .sf-row { position: relative; display: grid; grid-template-columns: 7.2em 5em 14.5em; align-items: center;
          height: var(--row); padding: 0 .5em; border: 1px dashed var(--border); border-top: none;
          transition: background .35s, opacity .35s; }
        .stack-frames .sf-row:first-child { border-top: 1px dashed var(--border); }
        .stack-frames .sf-row.caller { background: var(--panel); }
        .stack-frames .sf-row.w { background: var(--fc); border-style: solid; }
        .stack-frames .sf-row.ftop { border-top: 2px solid var(--faint); }
        .stack-frames .sf-row.freed { opacity: .35; }
        .stack-frames .sf-val { color: var(--hot); }
        .stack-frames .sf-note { font-size: .85em; white-space: nowrap; }
        .stack-frames .sf-fname { color: var(--fg); font-weight: normal; margin-right: .6em; }
        .stack-frames .sf-sp { position: absolute; left: 0; height: var(--row); display: flex; align-items: center;
          color: var(--accent); font-weight: 700; transition: top .5s cubic-bezier(.5, 0, .3, 1); }
        .stack-frames .sf-dir { font-size: .8em; padding-left: 3.6em; margin-top: .3em; }
        .stack-frames .sf-state { font-size: .62em; }
        .stack-frames .sf-depth { margin-top: .6em; font-family: var(--mono); }
        .stack-frames .sf-text { font-size: .74em; min-height: 3em; margin-top: .4em; }
      `}</style>
    </div>
  );
}
