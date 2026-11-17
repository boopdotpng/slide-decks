/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import { HIST, N } from './image';
import { HistChart, fmt, kernelBody } from './hist-parts';
import src from '../../../kernels/hist_atomic.hip?raw';

/**
 * Slide 17: atomicAdd makes the count right, and then every pixel is one add to one of 256 counters far away. On rdna
 * a global atomic is done by the l2 (the shared 8 MB cache), not by dram: amd's rdna4 isa guide.
 * The queue lengths are this photo's histogram (HIST): adds to the same counter can't overlap, so they take turns.
 * "12 MP" scales this photo's shape up to a phone photo (12,000,000 pixels): a what-if, said as one. No timings:
 * nobody publishes the l2's atomic latency for this card.
 */
const CODE = kernelBody(src);
const LINE = CODE.split('\n').findIndex((l) => l.includes('atomicAdd'));
const BIG = 12_000_000;
const BUSY = HIST.map((c, v) => ({ v, c })).sort((a, b) => b.c - a.c).slice(0, 6);
const EVEN = N / 256;
const scale = (c: number) => Math.round((c / N) * BIG);

type View = 'turns' | 'right' | 'far' | 'queue';
const STEPS: { view: View; text: ComponentChildren }[] = [
  { view: 'turns', text: <><b>atomicAdd</b>: send "+1" out to the chip's shared cache (the 8 MB one), and it does read, add, write as <b>one step</b>. nobody can cut in between. two adds to the same counter take turns</> },
  { view: 'right', text: <>every pixel counted: {fmt(N)} of {fmt(N)}, every run. correct. the gpu has atomics for add, min, max, swap, and a few more</> },
  { view: 'far', text: <>but each one is a trip out of the workgroup processor, across the chip to that cache, and back. {fmt(N)} trips here; a 12-megapixel phone photo: {fmt(BIG)}, aimed at just 256 counters</> },
  { view: 'queue', text: <>and the counters aren't hit evenly. this photo is dark, so a few brightnesses get most of the pixels, and those adds take turns, one after another. spread evenly it would be {EVEN} each</> },
  { view: 'queue', text: <>right, but slow exactly where it's crowded. the fix: let each block count its own pixels somewhere near, and send the far counters only the totals</> },
];

export default function Atomic() {
  const root = useRef<HTMLDivElement>(null);
  const st = STEPS[Math.min(STEPS.length - 1, useSlideStep(root))];
  const v = st.view;
  const m = BUSY[0].c;
  return (
    <div class="atomic" ref={root}>
      <div class="at-cols">
        <div class="at-code"><Code lang="cpp" code={CODE} hl={v === 'turns' ? [LINE] : []} /></div>
        <div class="at-right">
          {v === 'turns' && (
            <div class="at-turns">
              <div class="at-row"><span class="muted">thread a</span><span class="at-op">+1 →</span></div>
              <div class="at-row"><span class="muted">thread b</span><span class="at-op">+1 →</span></div>
              <div class="at-mem">
                <div class="muted at-t">bins[20], in the shared cache: one add at a time</div>
                <div class="at-seq"><span>41</span><i>a's +1</i><span>42</span><i>b's +1</i><span class="ok">43</span></div>
              </div>
            </div>
          )}
          {v === 'right' && (
            <div>
              <HistChart bins={HIST} ghost={HIST} cls="good" height={260} />
              <div class="at-tot">counted: <b class="ok">{fmt(N)}</b> <span class="muted">should be: {fmt(N)}</span></div>
            </div>
          )}
          {v === 'far' && (
            <div class="at-far">
              <div class="at-box">{fmt(N)} threads <span class="muted">· one add each</span></div>
              <div class="at-arrow">→ across the chip →</div>
              <div class="at-box">256 counters <span class="muted">· in the shared cache</span></div>
            </div>
          )}
          {v === 'queue' && (
            <div class="at-q">
              <div class="muted at-t">the busiest counters: adds waiting their turn</div>
              {BUSY.map((b) => (
                <div class="at-qr">
                  <span class="at-qn">bins[{b.v}]</span>
                  <span class="at-qt"><span class="at-qb" style={{ width: `${(100 * b.c) / m}%` }} />
                    <span class="at-even" style={{ left: `${(100 * EVEN) / m}%` }} /></span>
                  <span class="at-qv">{b.c}</span>
                  <span class="muted at-qbig">{fmt(scale(b.c))} at 12 MP</span>
                </div>
              ))}
              <div class="muted at-leg"><i class="at-even-k" /> {EVEN} each, if they were spread evenly · "12 MP": a photo shaped like this one, at phone size</div>
            </div>
          )}
        </div>
      </div>
      <div class="caption at-text">{st.text}</div>
      <style>{`
        .atomic .at-cols { display: flex; flex-direction: column; gap: .9em; }
        .atomic .at-code { flex: none; font-size: .56em; align-self: flex-start; } .atomic .at-code pre { margin: 0; }
        .atomic .at-right { flex: 1; min-width: 0; font-size: .58em; min-height: 330px; }
        .atomic .at-row { display: flex; gap: 1em; align-items: center; margin-bottom: .4em; }
        .atomic .at-row .muted { width: 5.5em; }
        .atomic .at-op { font-family: var(--mono); background: var(--tint-blue); box-shadow: inset 0 0 0 1.5px var(--accent); border-radius: 6px; padding: .3em .8em; }
        .atomic .at-mem { margin-top: 1em; }
        .atomic .at-t { margin-bottom: .4em; }
        .atomic .at-seq { display: flex; gap: .8em; align-items: center; font-family: var(--mono); }
        .atomic .at-seq span { background: var(--surface); border-radius: 6px; padding: .35em .9em; font-size: 1.2em; }
        .atomic .at-seq i { font-style: normal; color: var(--muted); font-size: .85em; }
        .atomic .ok { color: var(--good); }
        .atomic .at-seq span.ok { box-shadow: inset 0 0 0 2px var(--good); }
        .atomic .at-tot { margin-top: .4em; font-size: 1.1em; display: flex; gap: 1em; }
        .atomic .at-far { display: flex; align-items: center; gap: 1.2em; margin-top: 1.5em; }
        .atomic .at-box { background: var(--panel); border: 1px solid var(--line); border-radius: 10px; padding: .8em 1em; font-size: 1.1em; }
        .atomic .at-arrow { color: var(--hot); font-family: var(--mono); white-space: nowrap; }
        .atomic .at-qr { display: grid; grid-template-columns: 5.5em 1fr 3em 10em; gap: .8em; align-items: center; margin-bottom: .45em; }
        .atomic .at-qn { font-family: var(--mono); }
        .atomic .at-qt { position: relative; height: 1.3em; background: var(--sunken); border-radius: 4px; }
        .atomic .at-qb { position: absolute; left: 0; top: 0; bottom: 0; background: var(--hot); border-radius: 4px; }
        .atomic .at-even { position: absolute; top: -3px; bottom: -3px; border-left: 2px dashed var(--fg); }
        .atomic .at-qv { font-family: var(--mono); text-align: right; }
        .atomic .at-qbig { font-size: .85em; white-space: nowrap; }
        .atomic .at-leg { margin-top: .6em; font-size: .85em; }
        .atomic .at-even-k { display: inline-block; height: 1em; border-left: 2px dashed var(--fg); vertical-align: -.15em; }
        .atomic .at-right > div { max-width: 1100px; }
        .atomic .at-text { font-size: .76em; min-height: 3.3em; margin-top: .4em; }
      `}</style>
    </div>
  );
}
