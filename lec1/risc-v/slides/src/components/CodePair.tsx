/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { useSlideStep } from '../deck/hooks';

/**
 * C on the left, the risc-v clang made from it on the right. Each step
 * highlights some C lines, the asm lines they became, and says why.
 *
 * Asm comes from c/build.sh (real clang -O1 output), imported raw:
 *   ---
 *   import asm from '../asm/arith.s?raw';
 *   ---
 *   <div data-steps="2"><CodePair client:load c={src} asm={asm} steps={[
 *     { c: [0], asm: [], text: 'the arguments arrive in a0, a1, a2' },
 *     { c: [1], asm: [1, 2], text: '...' }, ...]} /></div>     // data-steps = steps.length - 1
 *
 * Markup between the tags shows under the panes (from step `belowFrom` on, default 0).
 */
export type PairStep = { c?: number[]; asm?: number[]; text?: ComponentChildren };

export default function CodePair({ c, asm, steps, cTitle = 'c', asmTitle = 'risc-v · clang -O1', belowFrom = 0, children }: {
  c: string;
  asm: string;
  steps: PairStep[];
  cTitle?: string;
  asmTitle?: string;
  belowFrom?: number;
  /** astro markup passed as the island's children */
  children?: ComponentChildren;
}) {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(steps.length - 1, useSlideStep(root));
  const cur = steps[step];

  return (
    <div class="code-pair" ref={root}>
      <div class="cp-cols">
        <div>
          <div class="cp-title muted">{cTitle}</div>
          <Code lang="c" code={c} hl={cur.c} />
        </div>
        <div class="cp-arrow muted">→</div>
        <div>
          <div class="cp-title muted">{asmTitle}</div>
          <Code lang="asm" code={asm} hl={cur.asm} />
        </div>
      </div>
      <div class="caption cp-text">{cur.text}</div>
      {children && <div class={`cp-below fade ${step >= belowFrom ? 'on' : ''}`}>{children}</div>}
      <style>{`
        .code-pair .cp-cols { display: flex; gap: 1.6em; align-items: flex-start; }
        .code-pair .cp-cols > div:not(.cp-arrow) { flex: 1; min-width: 0; }
        .code-pair .cp-arrow { font-size: 1.4em; align-self: center; }
        .code-pair .cp-title { font-size: .55em; margin-bottom: .3em; }
        .code-pair pre { font-size: .66em; margin: 0; }
        .code-pair .cp-text { font-size: .8em; min-height: 3em; margin-top: .8em; }
      `}</style>
    </div>
  );
}
