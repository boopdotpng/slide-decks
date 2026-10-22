/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import CodePair from './CodePair';
import { useSlideStep } from '../deck/hooks';

/**
 * A local array on the stack: frame.c next to clang's frame.s, plus the
 * 48-byte frame as a row of 8-byte slots (sp + 0 on the left) that lights up
 * with each step.
 */

const C_SRC = `void fill(long *buf, long n);

long first_plus_last(void) {
    long buf[4];
    fill(buf, 4);
    return buf[0] + buf[3];
}`;

const STEPS = [
  { c: [2, 3], asm: [1, 2], on: [0, 1, 2, 3, 4, 5],
    text: <><b>prologue</b>: take 48 bytes of stack in one instruction, save ra at the top. 32 for buf + 8 for ra = 40, rounded up: sp must stay a multiple of 16</> },
  { c: [4], asm: [3, 4, 5], on: [1, 2, 3, 4], ptr: 1,
    text: <>buf is just the address sp + 8. passing buf to fill passes that address: <code>addi a0, sp, 8</code></> },
  { c: [5], asm: [6, 7, 8], on: [1, 4],
    text: <>buf[0] is at sp + 8, buf[3] at sp + 8 + 3 × 8 = sp + 32. the names are gone: only offsets from sp</> },
  { c: [6], asm: [9, 10, 11], on: [5], gone: true,
    text: <><b>epilogue</b>: load ra back, give the 48 bytes back, ret. buf stops existing: that's why you can't return a pointer to it</> },
];

const SLOTS = ['(padding)', 'buf[0]', 'buf[1]', 'buf[2]', 'buf[3]', 'saved ra'];

export default function FrameLayout({ asm }: { asm: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];
  return (
    <div class="frame-layout" ref={root}>
      <CodePair c={C_SRC} asm={asm} steps={STEPS.map(({ c, asm, text }) => ({ c, asm, text }))} />
      <div class={`fl-frame ${cur.gone ? 'gone' : ''}`}>
        {SLOTS.map((name, k) => (
          <div class={`fl-slot ${cur.on.includes(k) ? 'on' : ''} ${k === 5 ? 'ra' : k ? 'buf' : ''}`}>
            <span class="fl-name">{name}</span>
            <span class="fl-off muted">sp+{k * 8}</span>
            {cur.ptr === k && <span class="fl-ptr">↑ a0</span>}
          </div>
        ))}
        <div class="fl-dir muted">higher addresses →</div>
      </div>
      <style>{`
        .frame-layout .fl-frame { position: relative; display: flex; gap: 3px; font-family: var(--mono); font-size: .55em;
          margin-top: .4em; padding-bottom: 1.6em; transition: opacity .35s; }
        .frame-layout .fl-frame.gone .fl-slot:not(.ra) { opacity: .35; }
        .frame-layout .fl-slot { position: relative; flex: 1; padding: .3em .5em; border-radius: 4px; background: var(--panel);
          display: flex; flex-direction: column; transition: background .35s, box-shadow .35s, opacity .35s;
          box-shadow: inset 0 0 0 2px transparent; }
        .frame-layout .fl-slot.buf { background: var(--tint-green); }
        .frame-layout .fl-slot.ra { background: var(--tint-violet); }
        .frame-layout .fl-slot.on { box-shadow: inset 0 0 0 2px var(--accent); }
        .frame-layout .fl-off { font-size: .8em; }
        .frame-layout .fl-ptr { position: absolute; left: .5em; bottom: -1.5em; color: var(--accent); }
        .frame-layout .fl-dir { position: absolute; right: 0; bottom: 0; font-size: .8em; }
      `}</style>
    </div>
  );
}
