/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';

/**
 * The ISA as a contract: programs above, three very different risc-v chips
 * below. Steps: 0 the picture; 1 the same bytes run on all three; 2 what the
 * contract promises; 3 what it doesn't (the hardware part of the talk).
 */

const CHIPS = [
  { name: 'tiny microcontroller', sub: 'one instruction at a time · ~100 MHz · no cache' },
  { name: 'tenstorrent "baby" core', sub: 'small, in order · 5 per tensix tile · 120 tiles on blackhole' },
  { name: 'big desktop-class core', sub: 'out of order · ~4 GHz · hundreds of instructions in flight' },
];
const PROMISES = ['32 registers, 64 bits each', 'these instructions, and what each one does', 'how each instruction is written as 4 bytes', 'how loads and stores see memory'];
const NOT = ['how fast', 'how many instructions it works on at once', 'caches, or how big'];

export default function IsaLayers() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);

  return (
    <div class="isa-layers" ref={root}>
      <div class="il-left">
        <div class="il-prog">
          <span>your program</span>
          <code class={`fade ${step >= 1 ? 'on' : ''}`}>b3 83 c3 01 …</code>
        </div>
        <div class="il-band">
          <b>the isa</b> <span class="muted">(rv64im)</span>
          <span class="muted il-band-sub">a contract between software and hardware</span>
        </div>
        <div class="il-chips">
          {CHIPS.map((c) => (
            <div class={`il-chip ${step >= 1 ? 'run' : ''}`}>
              <div>{c.name}</div>
              <div class="muted il-sub">{c.sub}</div>
              <div class={`il-ok fade ${step >= 1 ? 'on' : ''}`}>same bytes, same answer ✓</div>
            </div>
          ))}
        </div>
        <p class={`muted il-other fade ${step >= 1 ? 'on' : ''}`}>x86 and arm are other contracts. same idea, different instructions</p>
      </div>
      <div class="il-right">
        <div class={`fade ${step >= 2 ? 'on' : ''}`}>
          <h3>promises</h3>
          <ul>{PROMISES.map((p) => <li>{p}</li>)}</ul>
        </div>
        <div class={`fade ${step >= 3 ? 'on' : ''}`}>
          <h3>doesn't say</h3>
          <ul class="not">{NOT.map((p) => <li>{p}</li>)}</ul>
          <p class="muted il-later">that's up to the chip. we'll open one up at the end</p>
        </div>
      </div>
      <style>{`
        .isa-layers { display: flex; gap: 2.5em; font-size: .72em; align-items: flex-start; }
        .isa-layers .il-left { flex: 1.5; display: flex; flex-direction: column; gap: .7em; }
        .isa-layers .il-right { flex: 1; display: flex; flex-direction: column; gap: 1em; }
        .isa-layers .il-prog { background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
          padding: .7em 1em; display: flex; justify-content: space-between; align-items: center; }
        .isa-layers .il-band { border: 2px solid var(--accent); border-radius: 10px; padding: .6em 1em;
          background: rgba(96, 165, 250, .08); }
        .isa-layers .il-band-sub { display: block; font-size: .8em; }
        .isa-layers .il-chips { display: flex; gap: .7em; }
        .isa-layers .il-chip { flex: 1; background: var(--panel); border: 1px solid var(--border); border-radius: 10px;
          padding: .7em .8em; transition: border-color .4s; }
        .isa-layers .il-chip.run { border-color: #2f5f2f; }
        .isa-layers .il-sub { font-size: .75em; margin-top: .3em; }
        .isa-layers .il-ok { color: #8ddb8c; font-size: .75em; margin-top: .5em; }
        .isa-layers .il-other { font-size: .8em; margin: 0; }
        .isa-layers h3 { font-size: 1em; margin: 0 0 .2em; }
        .isa-layers ul { margin: 0; font-size: .9em; }
        .isa-layers ul.not li::marker { content: '✗  '; color: #f47067; }
        .isa-layers .il-later { font-size: .8em; margin: .4em 0 0; }
      `}</style>
    </div>
  );
}
