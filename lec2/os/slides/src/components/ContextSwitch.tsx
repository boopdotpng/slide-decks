/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code from './Code';
import { COLORS, StateTable } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * A timer interrupt switches one core from hello's thread to the shell's: it
 * enters the kernel the way a syscall does, plus a cr3 (page table) swap because
 * it's another process. Shown as on x86 but kept arch-neutral: the registers
 * are generic (mode, pc, saved pc), only cr3 is named. Kernel code is
 * simplified pseudo-C. The last step zooms out to many slices (kernel slices
 * drawn wider than they really are). The last two steps animate what gets
 * saved: every register when interrupted, vs only the callee-saved ones (what
 * linux's __switch_to_asm pushes, + the return address the call already pushed)
 * when the thread stops itself. Addresses are illustrative.
 */

const KERNEL = `
// timer interrupt: enters the kernel like a syscall does
timer_interrupt:
    save_registers(cur);          // A's pc + all registers
    next = pick_next();           // the scheduler
    if (next->proc != cur->proc)
        cr3 = next->proc->page_table;
    cur = next;
    set_timer(now + 4ms);
    restore_registers(cur);       // B's registers and pc
    iretq;                        // back to ring 3`;

const HANDLER = '0xffffffff81c00080';

type State = { mode: string; pc: string; cr3: string; saved: string };
const S0: State = { mode: 'ring 3', pc: '0x11148', cr3: 'hello\'s table', saved: '—' };

const STEPS: { kernel?: number[]; st: Partial<State>; text: string }[] = [
  { st: {}, text: 'thread A (hello) is running in ring 3. it has no idea it\'s about to be paused' },
  { kernel: [0, 1], st: { mode: 'ring 0', pc: HANDLER, saved: '0x11148' },
    text: 'the timer fires and the cpu enters the kernel, just like a syscall: save the pc, switch to ring 0, jump to the handler the kernel set up at boot' },
  { kernel: [2], st: {}, text: 'save all of A\'s registers into A\'s thread struct. paused, A is just data in memory' },
  { kernel: [3], st: {}, text: 'the scheduler picks who runs next: thread B, in another process (the shell)' },
  { kernel: [4, 5], st: { cr3: 'shell\'s table' },
    text: 'another process → switch page tables. now 0x10120 means the shell\'s memory. (same process? skip this: threads share a table)' },
  { kernel: [6, 7], st: {}, text: 'set the timer again, so the kernel gets the cpu back in ~4 ms' },
  { kernel: [8], st: { saved: '0x2a4f8' }, text: 'load B\'s registers and pc, saved the last time B was paused' },
  { kernel: [9], st: { mode: 'ring 3', pc: '0x2a4f8' }, text: 'back to ring 3 at B\'s pc: B continues exactly where it stopped, as if nothing happened' },
  { st: {}, text: 'every few ms, on every core. a switch costs a few µs, so you never notice: everything looks like it runs at once' },
  { st: {}, text: 'interrupted: it stopped mid-calculation, so any register might matter. save every one, restore every one' },
  { st: {}, text: 'stops itself (sleep, a lock, a read that blocks): it called into the kernel, and a call only promises the callee-saved registers. the rest are already garbage to the caller' },
];

// steps 9–10: x86-64's registers, and which ones a switch must save
const REGS = ['rax', 'rbx', 'rcx', 'rdx', 'rsi', 'rdi', 'rbp', 'rsp', 'r8', 'r9',
  'r10', 'r11', 'r12', 'r13', 'r14', 'r15', 'rip', 'rflags'];
// callee-saved + the stack pointer; rip is the return address the call pushed
const KEPT = new Set(['rbx', 'rbp', 'rsp', 'r12', 'r13', 'r14', 'r15', 'rip']);

const VARS = [
  { name: 'mode' }, { name: 'pc' }, { name: 'cr3', note: 'page table' }, { name: 'saved', note: 'pc to return to' },
];

// time strip: [who, width]; k = kernel
const COLOR: Record<string, string> = { A: COLORS.accent, B: COLORS.purple, C: COLORS.hot, k: '#3a3a3a' };
const ZOOMED: [string, number][] = [['A', 8], ['k', 1], ['B', 8]];
const ZOOMED_OUT: [string, number][] = ['A', 'B', 'C', 'A', 'B', 'A', 'C', 'B', 'A', 'C']
  .flatMap((t, i) => (i ? [['k', .25], [t, 2]] : [[t, 2]]) as [string, number][]);

export default function ContextSwitch() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const cur = STEPS[step];
  const st: State = Object.assign({}, S0, ...STEPS.slice(0, step + 1).map((s) => s.st));
  const strip = step >= 8 ? ZOOMED_OUT : ZOOMED.slice(0, step >= 7 ? 3 : step >= 1 ? 2 : 1);

  return (
    <div class="cs" ref={root}>
      <div class="cs-strip">
        <span class="muted cs-core">core 0</span>
        <div class="cs-bar">
          {strip.map(([who, w]) => (
            <div class="cs-seg" style={{ flex: `0 0 ${w * 4}%`, background: COLOR[who] }}>{who === 'k' ? '' : who}</div>
          ))}
        </div>
      </div>
      <div class="cs-legend muted">A = hello · B = shell · C = another thread · grey = kernel</div>
      {step >= 9 ? (
        // keyed by step so the save sweep replays on each step
        <div class="cs-regs" key={step}>
          <div class="cs-regs-title">{step === 9 ? 'interrupted' : 'stops itself'}
            <span class="muted"> · saves {step === 9 ? REGS.length : KEPT.size} of {REGS.length}</span></div>
          <div class="cs-regs-grid">
            {REGS.map((r, i) => {
              const saved = step === 9 || KEPT.has(r);
              return <div class={`cs-reg ${saved ? 'saved' : 'skip'}`} style={{ animationDelay: `${i * 70}ms` }}>{r}</div>;
            })}
          </div>
          <div class={`muted cs-regs-note fade ${step === 10 ? 'on' : ''}`}>faded: trashed by the call anyway, nothing to save</div>
        </div>
      ) : (
      <div class="cs-cols">
        <div class="cs-cpu">
          <div class={`cs-lane ${st.mode === 'ring 3' ? 'on' : ''}`}>{st.mode === 'ring 3' ? (step >= 7 ? 'thread B' : 'thread A') : 'kernel'} · {st.mode}</div>
          <StateTable vars={VARS} state={st} changed={Object.keys(cur.st)} />
        </div>
        <div class="cs-kernel"><Code lang="c" code={KERNEL} hl={cur.kernel ?? []} /></div>
      </div>
      )}
      <div class="caption">{cur.text}</div>
      <style>{`
        .cs-strip { display: flex; align-items: center; gap: .6em; font-size: .6em; }
        .cs-bar { flex: 1; display: flex; gap: 2px; height: 1.8em; }
        .cs-seg { border-radius: 4px; color: #0a0a0a; font-weight: 700; display: flex; align-items: center; justify-content: center;
          animation: cs-in .3s both; }
        @keyframes cs-in { from { opacity: 0; } }
        .cs-legend { font-size: .55em; margin: .3em 0 .8em 4.2em; }
        .cs-cols { display: flex; gap: 1.6em; align-items: flex-start; font-size: .5em; }
        .cs-cpu { flex: 1; }
        .cs-kernel { flex: 1.7; }
        .cs pre { margin: 0; font-size: 1em; }
        .cs-lane { color: var(--muted); margin-bottom: .4em; padding: .2em .5em; border-radius: 6px; background: var(--panel); }
        .cs-lane.on { color: var(--fg); background: var(--hl); }
        .cs .caption { min-height: 3em; }
        .cs-regs { font-size: .6em; }
        .cs-regs-title { margin-bottom: .6em; }
        .cs-regs-grid { display: grid; grid-template-columns: repeat(9, 1fr); gap: .4em; font-family: var(--mono); }
        .cs-reg { padding: .45em 0; text-align: center; border-radius: 6px; background: #1c1c1c; color: var(--muted); }
        .cs-reg.saved { animation: cs-save .35s both; }
        .cs-reg.skip { animation: cs-skip .35s both; }
        @keyframes cs-save { to { background: ${COLORS.accent}; color: #0a0a0a; } }
        @keyframes cs-skip { to { opacity: .25; } }
        .cs-regs-note { margin-top: .6em; font-size: .9em; }
      `}</style>
    </div>
  );
}
