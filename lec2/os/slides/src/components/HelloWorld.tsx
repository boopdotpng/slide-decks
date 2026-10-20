/** @jsxImportSource preact */
import { Bytes, Walkthrough } from './viz';

/**
 * examples/01_hello.s, one real instruction per step. Addresses and machine
 * words are what `rv` actually loads (msg at 0x10120, _start at 0x11130).
 * `la` is two instructions (auipc + addi), so it takes two steps. Stops at the
 * ecall: the risc-v version of the syscall slide's first step.
 */

const SRC = [
  '    .section .rodata',
  'msg:',
  '    .ascii "hello, world\\n"',
  '',
  '    .text',
  '_start:',
  '    li   a0, 1',
  '    la   a1, msg',
  '    li   a2, 13',
  '    li   a7, 64',
  '    ecall',
  '',
  '    li   a0, 0',
  '    li   a7, 93',
  '    ecall',
];
const COMMENTS: Record<number, string> = {
  6: '# fd 1 = stdout',
  7: '# address of the bytes',
  8: '# how many bytes',
  9: '# syscall 64 = write',
  10: '# ask the kernel',
};

type Regs = Partial<Record<'a0' | 'a1' | 'a2' | 'a7', number>>;
const STEPS: { lines: number[]; pc?: number; set: Regs; machine?: string; text: string }[] = [
  { lines: [0, 1, 2, 4, 5], set: {},
    text: 'two sections: .rodata holds the 13 bytes, .text holds the code. the kernel loads both into memory and starts the pc at _start' },
  { lines: [6], pc: 0x11130, set: { a0: 1 }, machine: '00100513   addi a0, zero, 1',
    text: 'li = "load immediate". not a real instruction: the assembler turns it into addi a0, zero, 1. fd 1 is stdout' },
  { lines: [7], pc: 0x11134, set: { a1: 0x10134 }, machine: 'fffff597   auipc a1, 0xfffff',
    text: 'la = "load address", two real instructions. first auipc: a1 = pc + (imm << 12) = 0x11134 − 0x1000' },
  { lines: [7], pc: 0x11138, set: { a1: 0x10120 }, machine: 'fec58593   addi a1, a1, -20',
    text: 'then add −20: a1 = 0x10120, exactly where msg is. relative to pc, so it works wherever the program is loaded' },
  { lines: [8], pc: 0x1113c, set: { a2: 13 }, machine: '00d00613   addi a2, zero, 13',
    text: 'a2 = 13 bytes to write (\\n is one byte)' },
  { lines: [9], pc: 0x11140, set: { a7: 64 }, machine: '04000893   addi a7, zero, 64',
    text: 'a7 says which syscall: 64 = write(fd, buf, len). the arguments are already in a0, a1, a2' },
  { lines: [10], pc: 0x11144, set: {}, machine: '00000073   ecall',
    text: 'ecall → write(1, msg, 13). from here it\'s the syscall slide again: a7 plays rax\'s part' },
];

const MSG = 'hello, world\n';
const MSG_ADDR = 0x10120;
const hex = (n: number) => '0x' + n.toString(16);
const regsAt = (step: number): Regs => Object.assign({}, ...STEPS.slice(0, step + 1).map((s) => s.set));

// comments appear once their line has run
const code = (step: number) => {
  const reached = new Set(STEPS.slice(1, step + 1).flatMap((s) => s.lines));
  return SRC.map((l, j) => (reached.has(j) && COMMENTS[j] ? l.padEnd(20) + COMMENTS[j] : l)).join('\n');
};

export default function HelloWorld() {
  return (
    <Walkthrough lang="asm" code={code}
      vars={[{ name: 'pc' }, { name: 'a0', note: 'fd', reg: true }, { name: 'a1', note: 'buf', reg: true },
             { name: 'a2', note: 'len', reg: true }, { name: 'a7', note: 'syscall #', reg: true }]}
      steps={STEPS.map((s) => ({
        hl: s.lines,
        set: {
          ...(s.pc !== undefined && { pc: hex(s.pc) }),
          ...Object.fromEntries(Object.entries(s.set).map(([r, v]) => [r, r === 'a1' ? hex(v) : v])),
        },
        text: <>
          <div class="muted" style={{ height: '1.5em', fontSize: '.8em' }}>
            {s.machine && <code style={{ background: 'none', padding: 0 }}>{hex(s.pc!)}:  {s.machine}</code>}
          </div>
          {s.text}
        </>,
      }))}
      aside={(step) => {
        const regs = regsAt(step);
        return <>
          <Bytes data={MSG} addr={MSG_ADDR} label="msg" hl={regs.a2 ? [0, MSG.length] : undefined}
            ptr={regs.a1 === MSG_ADDR ? { at: 0, label: 'a1' } : undefined} />
          {regs.a1 === 0x10134 && <div class="muted">a1 = 0x10134: past msg, not there yet</div>}
        </>;
      }} />
  );
}
