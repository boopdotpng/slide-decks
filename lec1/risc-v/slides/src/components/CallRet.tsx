/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { highlight } from './Code';
import { StateTable } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * call and ret are just jumps that use ra. Code laid out in memory with
 * addresses, a pc marker that jumps, and ra. The last step swaps in a square
 * that calls something itself, so ra gets overwritten: the lead into the stack.
 */

type Row = { addr?: number; text: string; label?: boolean };
const MAIN: Row[] = [
  { text: 'main:', label: true },
  { addr: 0x1000, text: 'li   a0, 5' },
  { addr: 0x1004, text: 'call square' },
  { addr: 0x1008, text: 'addi a0, a0, 1' },
  { addr: 0x100c, text: '...' },
];
const SQUARE: Row[] = [
  { text: 'square:', label: true },
  { addr: 0x1100, text: 'mul  a0, a0, a0' },
  { addr: 0x1104, text: 'ret' },
];
// last step: square calls a helper, which overwrites ra
const SQUARE2: Row[] = [
  { text: 'square:', label: true },
  { addr: 0x1100, text: 'mul  a0, a0, a0' },
  { addr: 0x1104, text: 'call helper' },
  { addr: 0x1108, text: 'ret' },
];

const hex = (n: number) => '0x' + n.toString(16);

const STEPS: { pc: number; set: Record<string, ComponentChildren>; jump?: [number, number];
  real?: string; text: ComponentChildren; nested?: boolean }[] = [
  { pc: 0x1004, set: { pc: '0x1004', a0: 5, ra: '—' },
    text: <>main is at the call. a0 = 5 is the argument</> },
  { pc: 0x1100, set: { pc: '0x1100', ra: '0x1008' }, jump: [0x1004, 0x1100], real: 'jal  ra, square',
    text: <><code>call square</code> is <code>jal ra, square</code>: ra = pc + 4 = 0x1008 (the next line), then pc = 0x1100</> },
  { pc: 0x1104, set: { pc: '0x1104', a0: 25 },
    text: <>square runs. it has no idea who called it</> },
  { pc: 0x1008, set: { pc: '0x1008' }, jump: [0x1104, 0x1008], real: 'jalr zero, 0(ra)',
    text: <><code>ret</code> is <code>jalr zero, 0(ra)</code>: pc = ra. back right after the call</> },
  { pc: 0x100c, set: { pc: '0x100c', a0: 26 },
    text: <>main carries on, with the result in a0. a call is just two jumps and one register</> },
  { pc: 0x1104, nested: true, set: { pc: '0x1104', ra: <><s class="muted">0x1008</s> 0x1108</>, a0: 25 },
    text: <>but if square calls something too, that call sets ra again. main's 0x1008 is gone, and square's ret can't get back.
      so square has to save ra first. where? <b>the stack</b></> },
];

function Listing({ rows, pc, from, to }: { rows: Row[]; pc: number; from?: number; to?: number }) {
  return (
    <div class="cr-list">
      {rows.map((r) => (
        <div class={`cr-row ${r.label ? 'lbl' : ''} ${r.addr === pc ? 'pc' : ''}`}>
          <span class="cr-pc">{r.addr === pc ? 'pc →' : ''}</span>
          <span class="cr-addr muted">{r.addr !== undefined ? hex(r.addr) : ''}</span>
          <span class="cr-code">{r.label ? <span class="tok-label">{r.text}</span> : highlight(r.text, 'asm')}</span>
          <span class="cr-tag">
            {from !== undefined && r.addr === from && <span class="out">jump → {hex(to!)}</span>}
            {r.addr === to && from !== undefined && <span class="in">← lands here</span>}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function CallRet() {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];
  const state = Object.assign({}, ...STEPS.slice(0, step + 1).map((s) => s.set));
  const [from, to] = cur.jump ?? [];

  return (
    <div class="call-ret" ref={root}>
      <div class="cr-cols">
        <div class="cr-mem">
          <Listing rows={MAIN} pc={cur.pc} from={from} to={to} />
          <div class="cr-gap muted">⋮</div>
          <Listing rows={cur.nested ? SQUARE2 : SQUARE} pc={cur.pc} from={from} to={to} />
        </div>
        <div class="cr-side">
          <StateTable vars={[{ name: 'pc' }, { name: 'ra', reg: true }, { name: 'a0', reg: true }]}
            state={state} changed={Object.keys(cur.set).filter((k) => step === 0 || STEPS[step - 1].set[k] !== cur.set[k])} />
          <div class={`cr-real fade ${cur.real ? 'on' : ''}`}>
            <span class="muted">really: </span><code>{cur.real && highlight(cur.real, 'asm')}</code>
          </div>
        </div>
      </div>
      <div class="caption cr-text">{cur.text}</div>
      <div class="muted cr-foot">call is shorthand: jal when the target is close, auipc + jalr when it's far</div>
      <style>{`
        .call-ret .cr-cols { display: flex; gap: 3em; align-items: flex-start; }
        .call-ret .cr-mem { font-family: var(--mono); font-size: .72em; background: var(--code); border-radius: 8px; padding: .6em .8em; }
        .call-ret .cr-row { display: grid; grid-template-columns: 2.6em 4.2em 11em 9em; align-items: center;
          padding: .05em .3em; border-radius: 4px; transition: background .25s; }
        .call-ret .cr-row.pc { background: var(--hl); }
        .call-ret .cr-row.lbl .cr-code { margin-left: -1.2em; }
        .call-ret .cr-pc { color: var(--accent); font-size: .8em; }
        .call-ret .cr-addr { font-size: .8em; }
        .call-ret .cr-code { padding-left: 1.2em; white-space: pre; }
        .call-ret .cr-tag { font-size: .75em; }
        .call-ret .cr-tag .out { color: var(--hot); }
        .call-ret .cr-tag .in { color: var(--accent); }
        .call-ret .cr-gap { padding: .2em 0 .2em 7.6em; }
        .call-ret .cr-side { font-size: .8em; padding-top: .4em; }
        .call-ret .cr-real { margin-top: 1em; font-size: .9em; }
        .call-ret .cr-real code { background: none; padding: 0; }
        .call-ret .cr-text { font-size: .8em; min-height: 3em; margin-top: 1em; }
        .call-ret .cr-foot { font-size: .5em; margin-top: .6em; }
      `}</style>
    </div>
  );
}
