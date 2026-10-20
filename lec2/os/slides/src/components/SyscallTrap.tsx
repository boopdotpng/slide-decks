/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code from './Code';
import { StateTable, Terminal } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * What happens at hello world's write syscall, on x86-64 + linux: rax holds
 * the syscall number and the result, rdi/rsi/rdx the arguments; the entry
 * address is in the LSTAR register; sysret goes back. The program side is
 * shown as C (no assembly until the risc-v part). Kernel code is simplified
 * pseudo-C; addresses are illustrative (syscall is 2 bytes, so saved = pc + 2).
 */

const USER = `
write(1, msg, 13);
exit(0);`;

const KERNEL = `
// entry points here (set at boot)
syscall_entry:
    save_registers(f);
    switch (f->rax) {
    case 1:  // write
        f->rax = sys_write(f->rdi, f->rsi, f->rdx);
    case 60: // exit
        sys_exit(f->rdi);
    }
    restore_registers(f);
    sysret;                     // back to ring 3

sys_write(fd, buf, len):
    if (!user_memory(buf, len)) return -EFAULT;
    terminal_write(buf, len);   // device driver
    return len;`;

const ENTRY = '0xffffffff81c00000';

type State = { mode: string; pc: string; saved: string; rax: string; rdi: string; entry: string };
const S0: State = { mode: 'ring 3', pc: '0x11144', saved: '—', rax: '1', rdi: '1', entry: ENTRY };

const STEPS: { user?: number[]; kernel?: number[]; st: Partial<State>; out?: boolean; text: string }[] = [
  { user: [0], st: {},
    text: 'your program reaches the syscall instruction with rax = 1 (write), rdi = 1 (fd), rsi = msg, rdx = 13' },
  { kernel: [0, 1], st: { mode: 'ring 0', pc: ENTRY, saved: '0x11146' },
    text: 'the cpu does this by itself, in one step: save the next pc, switch to ring 0, jump to entry. the kernel set entry at boot (the LSTAR register): you don\'t pick where you land' },
  { kernel: [2], st: {},
    text: 'save every register into a trap frame: the kernel needs them, and must hand them back untouched' },
  { kernel: [3, 4, 5], st: {},
    text: 'dispatch on rax: 1 → sys_write(fd = 1, buf = 0x10120, len = 13)' },
  { kernel: [13], st: {},
    text: 'never trust a pointer from user code: is 0x10120 … +13 really your memory? if not, return -EFAULT instead of crashing' },
  { kernel: [5, 14, 15], st: {}, out: true,
    text: 'hand the bytes to the terminal driver. the return value (13 bytes written) goes into the saved rax' },
  { kernel: [9], st: { rax: '13' },
    text: 'put your registers back (rax is now 13)' },
  { user: [1], kernel: [10], st: { mode: 'ring 3', pc: '0x11146' },
    text: 'back to ring 3 at the saved pc (sysret). to your program, syscall looked like one very slow instruction' },
  { st: {}, text: '' }, // why you can't cheat
  { user: [1], kernel: [6, 7], st: { rax: '60', rdi: '0' },
    text: 'then exit(0): rax = 60, rdi = 0, syscall. the same trip, but sys_exit never returns. the kernel frees your memory and runs something else' },
];

const VARS = [
  { name: 'mode' }, { name: 'pc' }, { name: 'saved', note: 'pc to return to' },
  { name: 'rax', note: 'syscall # / result', reg: true }, { name: 'rdi', note: '1st arg', reg: true }, { name: 'entry', note: 'set at boot' },
];

const CHEAT = [
  ['change entry', 'only ring 0 may. from ring 3 → fault'],
  ['jump / load into kernel memory', '→ page fault. kernel pages don\'t have the u bit'],
  ['syscall', 'is the only door, and it always lands at entry, where the kernel checks everything'],
];

export default function SyscallTrap() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const cur = STEPS[step];
  const st: State = Object.assign({}, S0, ...STEPS.slice(0, step + 1).map((s) => s.st));
  const out = STEPS.slice(0, step + 1).some((s) => s.out);

  return (
    <div class="sys" ref={root}>
      <div class="cols">
        <div class="col left">
          <div class={`lane ${st.mode === 'ring 3' ? 'on' : ''}`}>user · ring 3</div>
          <Code lang="c" code={USER} hl={cur.user ?? []} />
          <div class="lane on">cpu</div>
          <StateTable vars={VARS} state={st} changed={Object.keys(cur.st)} />
          <Terminal lines={out ? ['$ ./hello', 'hello, world'] : ['$ ./hello']} />
        </div>
        <div class="col kernel">
          <div class={`lane ${st.mode === 'ring 0' ? 'on' : ''}`}>kernel · ring 0</div>
          <Code lang="c" code={KERNEL} hl={cur.kernel ?? []} />
        </div>
      </div>
      {step === 8 ? (
        <div class="cheat">
          <strong>why can't you just cheat?</strong>
          {CHEAT.map(([c, why]) => <div><code>{c}</code> <span class="muted">{why}</span></div>)}
        </div>
      ) : (
        <div class="caption">{cur.text}</div>
      )}
      <style>{`
        /* code size follows the slide's width, so the kernel code always fits its box */
        .sys { container-type: inline-size; }
        .sys .cols { display: flex; gap: 2.4cqi; align-items: flex-start; font-size: min(1.55cqi, 2.3vh); }
        .sys .col.left { flex: none; display: flex; flex-direction: column; }
        .sys .col.kernel { flex: 1; min-width: 0; }
        .sys pre { margin: 0; font-size: 1em; }
        .sys .col.kernel pre { padding: .7em .6em; }
        .sys .left pre.code { margin-bottom: 1.2em; }
        .sys .state-table td { padding: .12em .9em .12em .4em; }
        .sys .term { margin-top: 1em; }
        .sys .lane { font-family: var(--sans); color: var(--muted); margin-bottom: .4em; padding: .2em .5em; border-radius: 6px; transition: background .3s, color .3s; }
        .sys .lane.on { color: var(--fg); background: var(--hl); }
        .sys .caption { margin-top: .8em; color: var(--fg); font-size: .75em; min-height: 3em; }
        .sys .cheat { margin-top: .6em; font-size: .7em; display: flex; flex-direction: column; gap: .3em; }
      `}</style>
    </div>
  );
}
