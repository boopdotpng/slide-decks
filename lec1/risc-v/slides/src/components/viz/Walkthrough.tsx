/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code, { type Lang } from '../Code';
import { useSlideStep, useTicker } from '../../deck/hooks';

/**
 * Step through code with a live state table and a caption (the pattern behind
 * the risc-v deck's hello-world, ecall and cpu-loop slides). Each step
 * highlights some lines, changes some state (changed rows flash), and explains.
 *
 * Driven by the slide's steps: wrap it in data-steps={steps.length - 1}.
 * Or pass auto={ms} to loop through the steps by itself.
 *
 *   <div data-steps="2"><Walkthrough client:load lang="asm" code={src}
 *     vars={[{ name: 'pc' }, { name: 'a0', note: 'fd', reg: true }]}
 *     steps={[
 *       { hl: [0], set: { pc: '0x00' }, text: 'start' },
 *       { hl: [1], set: { pc: '0x04', a0: 1 }, text: 'a0 = 1: stdout' },
 *       ...
 *     ]} /></div>
 */
export type WalkStep = {
  /** code lines to highlight (0-based) */
  hl?: number[];
  /** state changes at this step; they stay until changed again */
  set?: Record<string, ComponentChildren>;
  text?: ComponentChildren;
};

export type StateVar = { name: string; note?: string; reg?: boolean };

/**
 * name / value / note rows; rows named in `changed` flash. Walkthrough uses it,
 * or use it on its own beside your own code panes.
 */
export function StateTable({ vars, state, changed = [] }: {
  /** rows, in order; reg colors the name like a register */
  vars: StateVar[];
  state: Record<string, ComponentChildren>;
  changed?: string[];
}) {
  return (
    <table class="state-table">
      {vars.map((v) => (
        <tr class={changed.includes(v.name) ? 'changed' : ''}>
          <td class={v.reg ? 'tok-reg' : ''}>{v.name}</td>
          <td>{state[v.name] ?? '—'}</td>
          <td class="muted">{v.note}</td>
        </tr>
      ))}
    </table>
  );
}

export function Walkthrough({ code, lang, steps, vars = [], initial = {}, auto, aside }: {
  /** or a function of the step, e.g. to add comments to lines once they've run */
  code: string | ((step: number) => string);
  lang: Lang;
  steps: WalkStep[];
  /** state rows, in order; reg colors the name like a register */
  vars?: StateVar[];
  initial?: Record<string, ComponentChildren>;
  /** ms per step: run on a loop instead of on key presses */
  auto?: number;
  /** anything else to render under the state table, given the current step */
  aside?: (step: number) => ComponentChildren;
}) {
  const root = useRef<HTMLDivElement>(null);
  const slideStep = useSlideStep(root);
  const tick = useTicker(root, auto ?? 1e9);
  const step = Math.min(steps.length - 1, auto ? tick % steps.length : slideStep);
  const cur = steps[step];
  const state = Object.assign({}, initial, ...steps.slice(0, step + 1).map((s) => s.set ?? {}));

  return (
    <div class="walk" ref={root} data-hold={auto ? auto * steps.length : undefined}>
      <div class="walk-cols">
        <Code lang={lang} code={typeof code === 'function' ? code(step) : code} hl={cur.hl} />
        {(vars.length > 0 || aside) && (
          <div class="walk-state">
            {vars.length > 0 && <StateTable vars={vars} state={state} changed={Object.keys(cur.set ?? {})} />}
            {aside?.(step)}
          </div>
        )}
      </div>
      {steps.some((s) => s.text) && <div class="walk-text">{cur.text}</div>}
    </div>
  );
}
