/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { Arrow, COLORS } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * A core, roughly: front end on top, back end below. Steps send our loop's
 * `add t2, t2, t3` through (fetch → decode → read regs → alu → write back),
 * then `ld t3, 0(t0)` (→ load/store → L1d). Last step: every block busy with a
 * different instruction, the setup for the pipeline slide. (Rename and the
 * reorder buffer were cut with the out-of-order slide.)
 */

type Key = 'pc' | 'l1i' | 'fetch' | 'decode' | 'regs' | 'alu1' | 'alu2' | 'mul' | 'lsu' | 'l1d';
const BLOCKS: Record<Key, { x: number; y: number; w: number; h: number; title: string; sub?: string; later?: boolean }> = {
  pc: { x: 20, y: 20, w: 250, h: 150, title: 'pc', sub: '+ branch predictor' },
  l1i: { x: 320, y: 20, w: 250, h: 150, title: 'L1i', sub: 'instruction cache' },
  fetch: { x: 620, y: 20, w: 250, h: 150, title: 'fetch' },
  decode: { x: 920, y: 20, w: 250, h: 150, title: 'decode' },
  regs: { x: 20, y: 250, w: 300, h: 340, title: 'registers', sub: 'register file' },
  alu1: { x: 420, y: 250, w: 300, h: 74, title: 'alu' },
  alu2: { x: 420, y: 339, w: 300, h: 74, title: 'alu' },
  mul: { x: 420, y: 428, w: 300, h: 74, title: 'mul / div' },
  lsu: { x: 420, y: 517, w: 300, h: 74, title: 'load / store' },
  l1d: { x: 820, y: 480, w: 280, h: 111, title: 'L1d', sub: 'data cache' },
};

// where a token sits on a block
// tall blocks: centered under the title and subtitle; short ones: right-aligned beside the title
const spot = (k: Key, w: number): [number, number] => {
  const b = BLOCKS[k];
  return b.h > 120 ? [b.x + b.w / 2, b.y + b.h - 30] : [b.x + b.w - 16 - w / 2, b.y + b.h / 2];
};

type Tok = { id: string; text: string; at: Key; color?: string };
const ADD = (at: Key): Tok => ({ id: 'add', text: 'add t2, t2, t3', at });
const LD = (at: Key): Tok => ({ id: 'ld', text: 'ld t3, 0(t0)', at, color: COLORS.hot });

const STEPS: { toks: Tok[]; on: Key[]; arrows: string[]; text: ComponentChildren }[] = [
  { toks: [], on: [], arrows: [],
    text: 'a core, roughly. the front end (top) gets instructions ready; the back end (bottom) does them' },
  { toks: [ADD('fetch')], on: ['pc', 'l1i', 'fetch'], arrows: ['pc-l1i', 'l1i-fetch'],
    text: <>pc says where. fetch reads 4 bytes from the <b>L1i</b>, a small fast copy of the code</> },
  { toks: [ADD('decode')], on: ['decode'], arrows: ['fetch-decode'],
    text: 'decode pulls the fields out: add, rd = t2, rs1 = t2, rs2 = t3 (the last slide, in hardware)' },
  { toks: [ADD('regs')], on: ['regs'], arrows: ['decode-regs'],
    text: 'read t2 and t3 from the register file' },
  { toks: [ADD('alu1')], on: ['alu1'], arrows: ['regs-alu'],
    text: <>an <b>alu</b> (arithmetic logic unit) adds them: one cycle</> },
  { toks: [ADD('regs')], on: ['regs'], arrows: ['alu-regs'],
    text: 'write the sum back into t2. done' },
  { toks: [LD('lsu')], on: ['pc', 'l1i', 'fetch', 'decode', 'regs', 'lsu'], arrows: ['regs-lsu'],
    text: <><code>ld t3, 0(t0)</code>: same front end, then the load/store unit computes the address t0 + 0</> },
  { toks: [LD('l1d')], on: ['lsu', 'l1d'], arrows: ['lsu-l1d'],
    text: <>and asks the <b>L1d</b>, a small fast copy of memory. a hit takes ~4 cycles. a miss goes further out (the end of the talk)</> },
  { toks: [
      // our loop, overlapped: the front end already has the next lap while the back end finishes this one
      { id: 'b1', text: 'pc = loop', at: 'pc' }, { id: 'b2', text: 'ld', at: 'l1i' },
      { id: 'b3', text: 'bne', at: 'fetch' }, { id: 'b4', text: 'addi t1', at: 'decode' },
      { id: 'ld', text: 'ld', at: 'lsu', color: COLORS.hot }, { id: 'b5', text: 'addi t0', at: 'alu1' },
      { id: 'b6', text: 'add', at: 'alu2' },
    ],
    on: ['pc', 'l1i', 'fetch', 'decode', 'alu1', 'alu2', 'lsu'], arrows: [],
    text: 'one instruction at a time leaves almost every block idle. so a real core keeps them all busy, each on a different instruction' },
];

const ARROWS: Record<string, { from: [number, number]; to: [number, number]; via?: [number, number][] }> = {
  'pc-l1i': { from: [270, 95], to: [320, 95] },
  'l1i-fetch': { from: [570, 95], to: [620, 95] },
  'fetch-decode': { from: [870, 95], to: [920, 95] },
  'decode-regs': { from: [1045, 170], via: [[1045, 210], [170, 210]], to: [170, 250] },
  'regs-alu': { from: [320, 275], to: [420, 275] },
  'alu-regs': { from: [420, 305], to: [320, 305] },
  'regs-lsu': { from: [320, 554], to: [420, 554] },
  'lsu-l1d': { from: [720, 554], to: [820, 554] },
};

const CHAR = 13.2; // px per character of the token font

export default function CpuBlocks() {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];
  // a token that was on screen last step keeps its id, so it slides to its new block
  const ids = ['add', 'ld', 'b1', 'b2', 'b3', 'b4', 'b5', 'b6'];

  return (
    <div class="cpu-blocks" ref={root}>
      <svg viewBox="0 0 1190 610" class="diagram">
        {Object.entries(ARROWS).map(([k, a]) => (
          <Arrow from={a.from} to={a.to} via={a.via} on={cur.arrows.includes(k)} width={3} />
        ))}
        {(Object.entries(BLOCKS) as [Key, (typeof BLOCKS)[Key]][]).map(([k, b]) => {
          const on = cur.on.includes(k);
          return (
            <g class={`cb-block ${on ? 'on' : ''} ${b.later ? 'later' : ''}`}>
              <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={12} />
              <text x={b.x + 22} y={b.y + (b.h > 100 ? 46 : 46)} font-size="30" font-weight="700">{b.title}</text>
              {b.sub && <text class="sub" x={b.x + 22} y={b.y + 80} font-size="21">{b.sub}</text>}
              {b.later && <text class="tag" x={b.x + b.w - 20} y={b.y + b.h - 20} font-size="20" text-anchor="end">later</text>}
            </g>
          );
        })}
        {ids.map((id) => {
          const t = cur.toks.find((x) => x.id === id);
          const w = (t?.text.length ?? 4) * CHAR + 26;
          const [x, y] = t ? spot(t.at, w) : [750, 300];
          return (
            <g class={`cb-tok ${t ? 'on' : ''}`} style={{ transform: `translate(${x}px, ${y}px)` }}>
              <rect x={-w / 2} y={-19} width={w} height={38} rx={19} fill={t?.color ?? COLORS.accent} />
              <text y={7} text-anchor="middle" font-size="22" font-family="var(--mono)" fill="#0a0a0a">{t?.text}</text>
            </g>
          );
        })}
      </svg>
      <div class="caption cb-text">{cur.text}</div>
      <style>{`
        .cpu-blocks svg.diagram { max-height: 66vh; }
        .cpu-blocks .cb-block rect { fill: #141414; stroke: #262626; stroke-width: 2; transition: fill .35s, stroke .35s; }
        .cpu-blocks .cb-block text { fill: var(--fg); transition: opacity .35s; }
        .cpu-blocks .cb-block .sub { fill: var(--muted); }
        .cpu-blocks .cb-block .tag { fill: var(--muted); font-style: italic; }
        .cpu-blocks .cb-block.on rect { fill: #17263d; stroke: var(--accent); }
        .cpu-blocks .cb-block.later rect { stroke-dasharray: 8 6; }
        .cpu-blocks .cb-block.later text { opacity: .45; }
        .cpu-blocks .cb-tok { transition: transform .55s cubic-bezier(.5, 0, .3, 1), opacity .3s; opacity: 0; }
        .cpu-blocks .cb-tok.on { opacity: 1; }
        .cpu-blocks .cb-text { font-size: .8em; min-height: 2.6em; margin-top: .3em; }
      `}</style>
    </div>
  );
}
