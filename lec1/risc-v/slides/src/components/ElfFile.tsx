/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { COLORS } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * The linked `sum` executable (llvm-mc + ld.lld, the way rv.sh builds it):
 * 1304 bytes. Left, the file's parts in order; right, where the loader puts
 * the two parts that run. Offsets, sizes, addresses and bytes are from
 * llvm-readelf / xxd of the real file.
 */

type Part = 'hdr' | 'phdr' | 'text' | 'data' | 'names' | 'shdr';
const FILE: { key: Part; name: string; size: string; sub: ComponentChildren; color: string; grow: number }[] = [
  { key: 'hdr', name: 'elf header', size: '64 B', sub: <><code>7f 45 4c 46</code> = "\x7fELF" · risc-v · 64-bit · start at 0x11158</>, color: '#333', grow: 1 },
  { key: 'phdr', name: 'program headers', size: '280 B', sub: 'what to load, where, with what permissions', color: '#333', grow: 1.6 },
  { key: 'text', name: '.text', size: '64 B', sub: <><code>97 12 00 00 93 82 02 04 …</code> our 16 instructions</>, color: COLORS.slate, grow: 1 },
  { key: 'data', name: '.data', size: '72 B', sub: <><code>03 00 00 00 00 00 00 00 01 …</code> nums, total</>, color: COLORS.blue, grow: 1 },
  { key: 'names', name: '.symtab .strtab', size: '…', sub: <>names: <code>_start</code> <code>loop</code> <code>nums</code> <code>total</code></>, color: '#2a2a2a', grow: 1.6 },
  { key: 'shdr', name: 'section headers', size: '448 B', sub: 'a table of contents for tools', color: '#2a2a2a', grow: 1 },
];

const MEM: { key: Part | 'free' | 'later'; name: string; addr?: string; sub: string; color: string }[] = [
  { key: 'later', name: 'stack, heap', sub: 'made while it runs (next lecture)', color: '#1a1a1a' },
  { key: 'free', name: '', sub: '', color: 'transparent' },
  { key: 'data', name: '.data', addr: '0x12198', sub: 'read + write', color: COLORS.blue },
  { key: 'text', name: '.text', addr: '0x11158', sub: 'read + execute, not writable', color: COLORS.slate },
];

const STEPS: { lit: Part[]; mem: boolean; text: ComponentChildren }[] = [
  { lit: [], mem: false, text: <>the assembler and linker turn sum.s into one file, <code>sum</code>: 1304 bytes in a format called <b>elf</b></> },
  { lit: ['hdr'], mem: false, text: <>it starts with the bytes <code>7f E L F</code>, then: which cpu, 64-bit, and the first instruction to run (_start)</> },
  { lit: ['text'], mem: true, text: <>the bytes from the encoding slides, all 64 of them, back to back. the loader copies them to 0x11158</> },
  { lit: ['data'], mem: true, text: <>our 9 numbers × 8 bytes, copied to 0x12198. writable, so sd can change total</> },
  { lit: ['phdr'], mem: true, text: <>the program headers are the loader's instructions: copy these bytes there, with these permissions. then set pc = 0x11158 and go</> },
  { lit: ['names', 'shdr'], mem: true, text: <>the rest is for people and tools. the cpu never sees the name "loop", only "jump back 16 bytes"</> },
];

export default function ElfFile() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[k];
  const on = (p: string) => cur.lit.includes(p as Part) || (p === 'text' && cur.lit.includes('phdr')) || (p === 'data' && cur.lit.includes('phdr'));
  const dim = (p: string) => cur.lit.length > 0 && !on(p);
  return (
    <div class="elf-file" ref={root}>
      <div class="ef-cols">
        <div class="ef-col">
          <div class="muted ef-t">the file <code>sum</code></div>
          {FILE.map((f) => (
            <div class={`ef-box ${on(f.key) ? 'on' : ''} ${dim(f.key) ? 'dim' : ''}`} style={{ background: f.color, flexGrow: f.grow }}>
              <span class="ef-name">{f.name}</span><span class="ef-size">{f.size}</span>
              <div class="ef-sub">{f.sub}</div>
            </div>
          ))}
        </div>
        <div class={`ef-arrow fade ${cur.mem ? 'on' : ''}`}>→<div class="muted">loader</div></div>
        <div class={`ef-col fade ${cur.mem ? 'on' : ''}`}>
          <div class="muted ef-t">memory, while it runs</div>
          {MEM.map((m) => (
            <div class={`ef-box mem ef-${m.key} ${on(m.key) ? 'on' : ''} ${dim(m.key) && m.key !== 'free' ? 'dim' : ''}`} style={{ background: m.color }}>
              <span class="ef-name">{m.name}</span>{m.addr && <span class="ef-size">{m.addr}</span>}
              <div class="ef-sub">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>
      <div class="caption ef-cap">{cur.text}</div>
      <style>{`
        .elf-file .ef-cols { display: flex; gap: 1.5em; align-items: stretch; height: 52vh; }
        .elf-file .ef-col { flex: 1; display: flex; flex-direction: column; gap: .25em; font-size: .6em; min-width: 0; }
        .elf-file .ef-t { margin-bottom: .2em; }
        .elf-file .ef-box { border-radius: 6px; padding: .35em .7em; display: flex; flex-wrap: wrap; align-items: baseline;
          column-gap: 1em; flex-basis: 0; box-shadow: inset 0 0 0 2px transparent; transition: opacity .35s, box-shadow .35s; }
        .elf-file .ef-box.on { box-shadow: inset 0 0 0 3px var(--accent); }
        .elf-file .ef-box.dim { opacity: .3; }
        .elf-file .ef-name { font-family: var(--mono); color: var(--fg); }
        .elf-file .ef-size { font-family: var(--mono); color: rgba(255,255,255,.6); margin-left: auto; }
        .elf-file .ef-sub { width: 100%; font-size: .8em; color: rgba(255,255,255,.7); }
        .elf-file .ef-sub code { background: none; padding: 0; }
        .elf-file .ef-box.mem { flex-grow: 1; }
        .elf-file .ef-free { flex-grow: 2 !important; border: 1px dashed var(--border);
          background: repeating-linear-gradient(135deg, #1a1a1a 0 2px, transparent 2px 9px) !important; }
        .elf-file .ef-later { border: 1px dashed var(--border); }
        .elf-file .ef-arrow { align-self: center; font-size: 1.4em; text-align: center; }
        .elf-file .ef-arrow .muted { font-size: .35em; }
        .elf-file .ef-cap { font-size: .75em; min-height: 2.6em; margin-top: .6em; }
      `}</style>
    </div>
  );
}
