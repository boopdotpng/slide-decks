/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { useSlideStep } from '../deck/hooks';

/**
 * Function inlining: dist2 calling a real square (noinline.c / noinline.s)
 * versus square pasted in (inline.c / inline.s), then square(3) folded to 9.
 * The asm is real clang -O1 output from c/build.sh. The counter is
 * instructions executed per call of dist2.
 */

const C_CALL = `__attribute__((noinline))
long square(long x) {
    return x * x;
}

long dist2(long x, long y) {
    return square(x) + square(y);
}`;

const C_INLINE = `static long square(long x) {
    return x * x;
}

long dist2(long x, long y) {
    return square(x) + square(y);
}

long nine(void) {
    return square(3);
}`;

const STEPS: { inline: boolean; c: number[]; asm: number[]; count: ComponentChildren; text: ComponentChildren }[] = [
  { inline: false, c: [5, 6, 7], asm: [4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19], count: <>19 instructions <span class="muted">(15 + 2 per square)</span></>,
    text: <>square forced to stay a real function. dist2 has to call it twice</> },
  { inline: false, c: [6], asm: [5, 6, 7, 8, 15, 16, 17, 18], count: <>19 instructions</>,
    text: <>the calls cost more than the work: a frame, save ra (it calls), save s0 and s1 (y and square(x) have to survive the second call), then restore them all</> },
  { inline: true, c: [4, 5, 6], asm: [0, 1, 2, 3, 4], count: <>4 instructions</>,
    text: <><b>inlined</b>: the compiler pastes square's body into dist2. no call, no ra, no stack, no s registers</> },
  { inline: true, c: [8, 9, 10], asm: [6, 7, 8], count: <>2 instructions</>,
    text: <>and once it's pasted in, square(3) is just 3 × 3, which the compiler works out itself. the multiply never runs</> },
  { inline: true, c: [], asm: [], count: <>&nbsp;</>,
    text: <>inlining is usually the biggest win: it removes the call, then unlocks everything else</> },
];

export default function Inline({ callAsm, inlineAsm }: { callAsm: string; inlineAsm: string }) {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];
  return (
    <div class="inline-fn" ref={root}>
      <div class="in-cols">
        <div class="in-pane">
          <div class="in-title muted">{cur.inline ? 'inline.c' : 'noinline.c'}</div>
          <Code lang="c" code={cur.inline ? C_INLINE : C_CALL} hl={cur.c} />
        </div>
        <div class="in-arrow muted">→</div>
        <div class="in-pane">
          <div class="in-title muted">risc-v · clang -O1 <span class="in-count">{cur.count}</span></div>
          <Code lang="asm" code={cur.inline ? inlineAsm : callAsm} hl={cur.asm} />
        </div>
        <div class={`in-when fade ${step >= 4 ? 'on' : ''}`}>
          <div class="in-title muted">when it won't inline</div>
          <ul>
            <li>big functions: pasting copies the code everywhere</li>
            <li>recursion</li>
            <li>the body is in another .c file <span class="muted">(unless lto)</span></li>
            <li>calls through a function pointer</li>
          </ul>
          <div class="muted in-hint"><code>static</code> and <code>inline</code> make it more likely, not guaranteed</div>
        </div>
      </div>
      <div class="caption in-text">{cur.text}</div>
      <style>{`
        .inline-fn .in-cols { display: flex; gap: 1.2em; align-items: flex-start; }
        .inline-fn .in-pane { flex: none; }
        .inline-fn .in-arrow { font-size: 1.3em; align-self: center; }
        .inline-fn .in-title { font-size: .5em; margin-bottom: .3em; white-space: nowrap; }
        .inline-fn .in-count { color: #f69d50; margin-left: 1em; }
        .inline-fn pre { font-size: .55em; margin: 0; }
        .inline-fn .in-when { font-size: .66em; flex: 1; min-width: 0; padding-left: .4em; }
        .inline-fn .in-when .in-title { font-size: .76em; }
        .inline-fn .in-when ul { margin: 0; padding-left: 1.1em; }
        .inline-fn .in-hint { font-size: .85em; margin-top: .6em; }
        .inline-fn .in-hint code { background: none; padding: 0; color: var(--fg); }
        .inline-fn .in-text { font-size: .78em; min-height: 3em; margin-top: .8em; }
      `}</style>
    </div>
  );
}
