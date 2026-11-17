/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import { IMG, HIST, N, WAVE, racyHist } from './image';
import { HistChart, fmt, kernelBody, sum } from './hist-parts';
import src from '../../../kernels/hist_naive.hip?raw';

/**
 * Slide 16: bins[img[i]]++ loses counts. Two threads interleaving (the counter values are made up: any count does
 * it), then one real wave (wave 0: the photo's first 32 pixels), then the whole photo through racyHist (image.ts),
 * which is a simulation: waves in flight together read the same old counts. With 1 that's only what one wave
 * does to itself, which is certain (32 lanes, one load, one store); how many waves really overlap depends on timing.
 */
const CODE = kernelBody(src);
const W0 = Array.from(IMG.slice(0, WAVE));
const W0_DISTINCT = [...new Set(W0)].sort((a, b) => a - b);
const R1 = racyHist(1), R16 = racyHist(16);

type Cell = [string, string, string]; // thread a, thread b, the counter in memory
const ONE_BY_ONE: Cell[] = [
  ['read 41', '', '41'], ['+1 → 42', '', '41'], ['write 42', '', '42'],
  ['', 'read 42', '42'], ['', '+1 → 43', '42'], ['', 'write 43', '43'],
];
const TOGETHER: Cell[] = [
  ['read 41', 'read 41', '41'], ['+1 → 42', '+1 → 42', '41'], ['write 42', 'write 42', '42'],
];

type View = 'parts' | 'seq' | 'mix' | 'wave' | 'r1' | 'r16';
const STEPS: { view: View; text: ComponentChildren }[] = [
  { view: 'parts', text: <>one thread per pixel: add 1 to the counter for my brightness. it looks right. but <code>++</code> on memory is three steps: <b>read</b> the counter, <b>add</b> 1 in a register, <b>write</b> it back</> },
  { view: 'seq', text: <>two threads, both with brightness 20. if one finishes before the other starts: 41 → 42 → 43. correct</> },
  { view: 'mix', text: <>but nothing makes them take turns. both read 41, both write 42: <b>one count is lost</b>. this is a <b>race</b>: the answer depends on who gets there when</> },
  { view: 'wave', text: <>in a wave it's certain, not bad luck: the 32 lanes do every step together. one load, one add, one store for all of them</> },
  { view: 'r1', text: <>the whole photo, if waves ran strictly one after another: still only {fmt(sum(R1))} of {fmt(N)} pixels counted. the dashed outline is the right answer</> },
  { view: 'r16', text: <>and they don't: many waves are in flight at once, and they all trample each other. with 16 at a time: {fmt(sum(R16))}. a different number every run. we need threads to <b>cooperate</b> on the counters</> },
];

function Steps({ rows, bad }: { rows: Cell[]; bad?: boolean }) {
  return (
    <div class="rc-tl" style={{ gridTemplateColumns: `9.5em repeat(${rows.length}, 1fr)` }}>
      {(['thread a', 'thread b', 'bins[20] in memory'] as const).map((name, r) => (
        <>
          <span class="rc-n muted">{name}</span>
          {rows.map((c) => <span class={`rc-c ${r === 2 ? 'mem' : c[r] ? 'op' : ''} ${bad && r === 2 && c[2] === '42' ? 'bad' : ''}`}>{c[r]}</span>)}
        </>
      ))}
      <span />
      <span class="rc-time muted" style={{ gridColumn: `2 / ${rows.length + 2}` }}>time →</span>
    </div>
  );
}

export default function Race() {
  const root = useRef<HTMLDivElement>(null);
  const st = STEPS[Math.min(STEPS.length - 1, useSlideStep(root))];
  const v = st.view;
  return (
    <div class="race" ref={root}>
      <div class="rc-cols">
        <div class="rc-code"><Code lang="cpp" code={CODE} hl={v === 'parts' ? [3] : []} /></div>
        <div class="rc-right">
          {v === 'parts' && (
            <div class="rc-parts">
              <span class="rc-c op">read bins[p]</span><span class="muted">→</span>
              <span class="rc-c op">add 1</span><span class="muted">→</span>
              <span class="rc-c op">write bins[p]</span>
            </div>
          )}
          {v === 'seq' && <Steps rows={ONE_BY_ONE} />}
          {v === 'mix' && <><Steps rows={TOGETHER} bad /><div class="rc-res"><b class="bad-t">42</b> <span class="muted">two pixels counted, the counter went up by one</span></div></>}
          {v === 'wave' && (
            <div class="rc-wave">
              <div class="muted rc-t">wave 0: the photo's first 32 pixels (sky)</div>
              <div class="rc-px">{W0.map((p) => <span>{p}</span>)}</div>
              <div class="rc-res">only <b class="bad-t">{W0_DISTINCT.length}</b> different brightnesses ({W0_DISTINCT.join(', ')}). every lane with the same one reads the same count and writes the same count + 1</div>
              <div class="rc-res">32 pixels, the counters go up by <b class="bad-t">{W0_DISTINCT.length}</b></div>
            </div>
          )}
          {(v === 'r1' || v === 'r16') && (
            <div class="rc-chart">
              <div class="muted rc-t">{v === 'r1' ? 'one wave at a time' : '16 waves at a time (a simulation: the real number depends on timing)'}</div>
              <HistChart bins={v === 'r1' ? R1 : R16} ghost={HIST} cls="bad" height={260} />
              <div class="rc-tot">
                <span>counted: <b class="bad-t">{fmt(sum(v === 'r1' ? R1 : R16))}</b></span>
                <span class="muted">should be: {fmt(N)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
      <div class="caption rc-text">{st.text}</div>
      <style>{`
        .race .rc-cols { display: flex; flex-direction: column; gap: .9em; }
        .race .rc-code { flex: none; font-size: .56em; align-self: flex-start; }
        .race .rc-code pre { margin: 0; }
        .race .rc-right { flex: 1; min-width: 0; font-size: .58em; min-height: 330px; }
        .race .rc-parts { display: flex; gap: .7em; align-items: center; margin-top: 1em; }
        .race .rc-tl { display: grid; gap: 5px; align-items: center; }
        .race .rc-n { white-space: nowrap; font-size: .9em; }
        .race .rc-c { font-family: var(--mono); text-align: center; padding: .35em .3em; border-radius: 6px; min-height: 1.9em; white-space: nowrap; }
        .race .rc-c.op { background: var(--tint-blue); box-shadow: inset 0 0 0 1.5px var(--accent); }
        .race .rc-c.mem { background: var(--surface); }
        .race .rc-c.bad { box-shadow: inset 0 0 0 2px var(--bad); color: var(--bad); }
        .race .rc-time { text-align: center; font-size: .85em; }
        .race .rc-res { margin-top: .8em; }
        .race .bad-t { color: var(--bad); }
        .race .rc-t { margin-bottom: .4em; font-size: .9em; }
        .race .rc-px { display: grid; grid-template-columns: repeat(16, 1fr); gap: 3px; font-family: var(--mono); }
        .race .rc-px span { text-align: center; background: var(--surface); border-radius: 4px; padding: .2em 0; }
        .race .rc-tot { display: flex; gap: 2em; margin-top: .4em; font-size: 1.1em; }
        .race .rc-chart { max-width: 1000px; }
        .race .rc-text { font-size: .76em; min-height: 3.3em; margin-top: .4em; }
      `}</style>
    </div>
  );
}
