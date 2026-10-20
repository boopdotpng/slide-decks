/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { COLORS } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * The 32 risc-v integer registers as a grid: x number, abi name, optional value.
 * `RegGrid` is the plain picture (props per register); the default export is the
 * island, with two step sequences:
 *   view="roles"       one role group colored per step (registers slide)
 *   view="convention"  one call, dist2(3, 4), from the caller's side (calling convention slide)
 */

export const ABI = [
  'zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1',
  'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7',
  's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10', 's11', 't3', 't4', 't5', 't6',
];

export type Role = 'zero' | 'link' | 'arg' | 'temp' | 'saved' | 'other';
export const roleOf = (abi: string): Role =>
  abi === 'zero' ? 'zero' : abi === 'ra' || abi === 'sp' ? 'link' : abi[0] === 'a' ? 'arg'
    : abi[0] === 't' && abi !== 'tp' ? 'temp' : abi[0] === 's' && abi !== 'sp' ? 'saved' : 'other';
export const ROLE_COLOR: Record<Role, string> = {
  zero: COLORS.slate, link: COLORS.violet, arg: COLORS.blue, temp: COLORS.amber, saved: COLORS.green, other: COLORS.red,
};

export type RegLook = { fill?: string; value?: ComponentChildren; mark?: 'ok' | 'bad' | 'hl'; dim?: boolean };

/** looks[i] styles register xi */
export function RegGrid({ looks = {} }: { looks?: Record<number, RegLook> }) {
  return (
    <div class="reg-grid">
      {ABI.map((abi, i) => {
        const l = looks[i] ?? {};
        return (
          <div class={`rg-cell ${l.mark ?? ''} ${l.dim ? 'dim' : ''}`} style={{ background: l.fill ?? '#161616' }}>
            <span class="rg-x">x{i}</span>
            <span class="rg-abi">{abi}</span>
            <span class="rg-v">{l.value ?? ''}</span>
          </div>
        );
      })}
      <style>{`
        .reg-grid { display: grid; grid-template-columns: repeat(8, 1fr); gap: .3em; font-family: var(--mono); }
        .reg-grid .rg-cell { position: relative; border-radius: 6px; padding: .25em .4em .2em; min-height: 2.9em;
          display: flex; flex-direction: column; transition: background .35s, opacity .35s, box-shadow .35s;
          box-shadow: inset 0 0 0 2px transparent; }
        .reg-grid .rg-cell.dim { opacity: .35; }
        .reg-grid .rg-x { font-size: .5em; color: var(--muted); }
        .reg-grid .rg-abi { font-size: .78em; color: var(--fg); }
        .reg-grid .rg-v { font-size: .6em; color: #f69d50; min-height: 1.2em; }
        .reg-grid .rg-cell.ok { box-shadow: inset 0 0 0 2px ${COLORS.good}; }
        .reg-grid .rg-cell.bad { box-shadow: inset 0 0 0 2px ${COLORS.bad}; }
        .reg-grid .rg-cell.hl { box-shadow: inset 0 0 0 2px var(--accent); }
      `}</style>
    </div>
  );
}

const byRole = (role: Role) => ABI.flatMap((abi, i) => (roleOf(abi) === role ? [i] : []));

// ── view="roles" ─────────────────────────────────────────────────────────────
const ROLE_STEPS: { show: Role[]; text: ComponentChildren }[] = [
  { show: [], text: <>32 registers, x0 to x31, 64 bits each. the cpu's own tiny storage: every calculation happens between registers</> },
  { show: ['zero'], text: <><b>x0</b>, called <b>zero</b>, is wired to 0. reading it gives 0, writing it does nothing</> },
  { show: ['zero', 'temp'], text: <><b>t0–t6</b>: temporaries, free scratch space. our program lives in these</> },
  { show: ['zero', 'temp', 'arg'], text: <><b>a0–a7</b>: arguments and results. we use two: a0 for our answer, a7 to ask the os for something</> },
  { show: ['zero', 'temp', 'arg', 'link', 'saved', 'other'], text: <><b>ra, sp, s0–s11, gp, tp</b> are for functions and the stack. not today</> },
  { show: ['zero', 'temp', 'arg', 'link', 'saved', 'other'],
    text: <>the names are only an agreement between programmers. to the hardware they're all x0–x31, and only x0 is special</> },
];

function rolesLooks(step: number) {
  const s = ROLE_STEPS[step];
  return Object.fromEntries(ABI.map((abi, i) => {
    const role = roleOf(abi);
    const on = s.show.includes(role);
    const newest = on && step > 0 && !ROLE_STEPS[step - 1].show.includes(role); // only what this step added
    return [i, { fill: on ? ROLE_COLOR[role] : undefined, mark: newest ? 'hl' : undefined } as RegLook];
  }));
}

// ── view="convention" ────────────────────────────────────────────────────────
// main has 42 in s0 and 7 in t0, then calls dist2(3, 4) = 25
const A = byRole('arg'), T = byRole('temp'), S = byRole('saved');
const CONV_STEPS: { looks: (base: Record<number, RegLook>) => void; text: ComponentChildren }[] = [
  { looks: (l) => { l[8].value = 42; l[5].value = 7; l[2].value = '0x7ff0'; },
    text: <>main is about to call <code>dist2(3, 4)</code>. it has 42 in s0 and 7 in t0</> },
  { looks: (l) => { l[10] = { ...l[10], value: 3, mark: 'hl' }; l[11] = { ...l[11], value: 4, mark: 'hl' }; },
    text: <>arguments go in a0, a1, … in order</> },
  { looks: (l) => { l[1] = { ...l[1], value: 'main+12', mark: 'hl' }; },
    text: <><code>call dist2</code>: ra = the address after the call, then jump</> },
  { looks: (l) => { [...A, ...T].forEach((i) => (l[i] = { ...l[i], value: '?', mark: 'bad' })); },
    text: <>inside dist2: it may overwrite <b>any a or t register</b>. main's 7 in t0 is gone</> },
  { looks: (l) => { [...S, 2].forEach((i) => (l[i] = { ...l[i], mark: 'ok' })); },
    text: <>but <b>s0–s11 and sp</b> must come back unchanged. if dist2 wants s0, it saves it on the stack first and restores it before returning</> },
  { looks: (l) => { [...A, ...T].forEach((i) => (l[i] = { ...l[i], value: '?', mark: undefined, dim: true }));
                    l[10] = { ...l[10], value: 25, mark: 'hl', dim: false }; },
    text: <><code>ret</code> jumps to ra. result in a0 = 25. so: a value you need after a call goes in an s register (or on the stack)</> },
];

function convLooks(step: number) {
  // gp / tp don't take part in a call: dimmed
  const l: Record<number, RegLook> = Object.fromEntries(ABI.map((abi, i) => [i, { fill: ROLE_COLOR[roleOf(abi)], dim: roleOf(abi) === 'other' }]));
  CONV_STEPS.slice(0, step + 1).forEach((s, k) => {
    // marks only last for their own step
    if (k > 0) Object.values(l).forEach((r) => r.mark === 'hl' && (r.mark = undefined));
    s.looks(l);
  });
  return l;
}

export const ROLE_STEP_COUNT = ROLE_STEPS.length - 1;
export const CONV_STEP_COUNT = CONV_STEPS.length - 1;

export default function RegisterFile({ view = 'roles' }: { view?: 'roles' | 'convention' }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const steps = view === 'roles' ? ROLE_STEPS : CONV_STEPS;
  const k = Math.min(steps.length - 1, step);
  return (
    <div ref={root} class="register-file">
      <RegGrid looks={view === 'roles' ? rolesLooks(k) : convLooks(k)} />
      <div class="caption" style={{ fontSize: '.8em', minHeight: '3em', marginTop: '1em' }}>{steps[k].text}</div>
    </div>
  );
}

