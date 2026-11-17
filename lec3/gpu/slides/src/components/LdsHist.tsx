/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import { HIST, N, BLOCK, WAVE } from './image';
import { HistChart, PER_BLOCK, countRange, fmt, kernelBody } from './hist-parts';
import src from '../../../kernels/hist_lds.hip?raw';

/**
 * Slide 18: kernels/hist_lds.hip, one block at a time. The block shown is block 1: pixels 4096 … 8191 of the photo
 * (rows 32 … 63, hills and sky), counted for real from image.ts. 256 threads = 8 waves; 256 bins, bin t is thread t's
 * to clear and to merge. The far-add counts are arithmetic: one per pixel for hist_atomic, 256 per block here.
 * What lds holds before it's cleared is drawn as noise: it's whatever the last block left, not a real dump.
 */
const CODE = kernelBody(src);
const L = CODE.split('\n');
const line = (s: string, from = 0) => L.findIndex((l, i) => i >= from && l.includes(s));
const SHARED = line('__shared__'), CLEAR = line('local[t] = 0'), SYNC1 = line('__syncthreads');
const LOOP = line('for ('), COUNT = line('atomicAdd(&local'), SYNC2 = line('__syncthreads', SYNC1 + 1), MERGE = line('atomicAdd(&bins');

const B = 1;
const MINE = countRange(B * PER_BLOCK, (B + 1) * PER_BLOCK);
const YMAX = Math.max(...MINE);
const junk = (v: number) => { let h = Math.imul(v ^ 0x5bd1e995, 0x27d4eb2d); h ^= h >>> 15; return (Math.imul(h, 0x165667b1) >>> 0) / 4294967296; };
const NOISE = Array.from({ length: 256 }, (_, v) => Math.round(YMAX * (0.1 + 0.6 * junk(v))));
const ZERO = new Array<number>(256).fill(0);
const WAVES = BLOCK / WAVE;

const BLOCKS_HERE = Math.ceil(N / PER_BLOCK);
const BIG = 12_000_000, BLOCKS_BIG = Math.ceil(BIG / PER_BLOCK);
const BUSY = Math.max(...HIST), BUSY_BIN = HIST.indexOf(BUSY);

type Lds = 'junk' | 'zero' | 'counted';
type St = { hl: number[]; lds: Lds; waves: string; merged: boolean; table: boolean; text: ComponentChildren };
const STEPS: St[] = [
  { hl: [SHARED], lds: 'junk', waves: 'starting', merged: false, table: false,
    text: <>each block gets its own 256 counters in <b>lds</b>: inside the workgroup processor (~20 ns), and only this block's 256 threads can touch them. 256 threads, 256 bins: <b>bin t is thread t's</b></> },
  { hl: [CLEAR], lds: 'zero', waves: 'clearing', merged: false, table: false,
    text: <>lds starts with whatever the last block left there. each thread clears its own bin: 256 threads, all 256 bins, one instruction</> },
  { hl: [SYNC1], lds: 'zero', waves: 'waiting', merged: false, table: false,
    text: <><b>__syncthreads()</b>: a barrier. no thread goes on until all 256 have got here. the block's 8 waves don't run in step: without it, wave 0 could count into bin 70 before wave 2 has cleared it, and the count is wiped</> },
  { hl: [LOOP, COUNT], lds: 'counted', waves: 'counting', merged: false, table: false,
    text: <>count: 16 rows of 256 pixels each, {fmt(PER_BLOCK)} pixels (this is block {B}: rows 32 … 63 of the photo). still atomic adds, but in lds: near, and only 256 threads competing instead of the whole gpu</> },
  { hl: [SYNC2], lds: 'counted', waves: 'waiting', merged: false, table: false,
    text: <>barrier again: wait until every pixel is counted. otherwise thread 20 could send bin 20 out before the slowest wave has added its last pixel</> },
  { hl: [MERGE], lds: 'counted', waves: 'merging', merged: true, table: false,
    text: <>each thread adds its one bin to the real counters, with an atomic add, as before. <b>256 far adds</b> for {fmt(PER_BLOCK)} pixels. the other blocks do the same, in any order: atomics keep that right</> },
  { hl: [], lds: 'counted', waves: 'done', merged: true, table: true,
    text: <>the same answer, with far fewer trips across the chip, and no pile-up on one counter. this is the usual shape: <b>work together nearby</b> in a block, then combine the blocks' results once</> },
];

export default function LdsHist() {
  const root = useRef<HTMLDivElement>(null);
  const st = STEPS[Math.min(STEPS.length - 1, useSlideStep(root))];
  const lds = st.lds === 'junk' ? NOISE : st.lds === 'zero' ? ZERO : MINE;
  return (
    <div class="lds-hist" ref={root}>
      <div class="lh-cols">
        <div class="lh-code"><Code lang="cpp" code={CODE} hl={st.hl} /></div>
        <div class="lh-right">
          {!st.table && (
            <>
              <div class="lh-t muted">block {B}: 256 threads = {WAVES} waves</div>
              <div class="lh-waves">
                {Array.from({ length: WAVES }, (_, w) => <span class={`lh-w ${st.waves === 'waiting' ? 'wait' : ''}`}>wave {w}<i>{st.waves}</i></span>)}
              </div>
              <div class="lh-t muted">lds: local[0 … 255]{st.lds === 'junk' ? ', whatever was left there' : ''}</div>
              <div class={`lh-lds ${st.lds}`}><HistChart bins={lds} ymax={YMAX} height={170} cls={st.lds === 'junk' ? 'purple' : 'good'} /></div>
              <div class={`fade ${st.merged ? 'on' : ''}`}>
                <div class="lh-t muted">↓ 256 adds, one per thread, into the real counters (dashed: what all blocks add up to)</div>
                <div class="lh-far"><HistChart bins={MINE} ghost={HIST} ymax={Math.max(...HIST)} height={90} axis={false} /></div>
              </div>
            </>
          )}
          {st.table && (
            <table class="lh-tab">
              <tr><th /><th>atomicAdd per pixel</th><th>count in lds first</th></tr>
              <tr><td class="muted">adds across the chip, this photo</td><td>{fmt(N)}</td><td class="good">{BLOCKS_HERE} blocks × 256 = <b>{fmt(BLOCKS_HERE * 256)}</b></td></tr>
              <tr><td class="muted">… a 12 MP photo</td><td>{fmt(BIG)}</td><td class="good">{fmt(BLOCKS_BIG)} blocks × 256 = <b>{fmt(BLOCKS_BIG * 256)}</b></td></tr>
              <tr><td class="muted">most adds to one counter, this photo</td><td>{BUSY} <span class="muted">(bins[{BUSY_BIN}])</span></td><td class="good">at most one per block: <b>{BLOCKS_HERE}</b></td></tr>
              <tr><td class="muted">… a 12 MP photo</td><td>{fmt(Math.round(BUSY / N * BIG))}</td><td class="good"><b>{fmt(BLOCKS_BIG)}</b></td></tr>
            </table>
          )}
        </div>
      </div>
      <div class="caption lh-text">{st.text}</div>
      <style>{`
        .lds-hist .lh-cols { display: flex; gap: 1.4em; align-items: flex-start; }
        .lds-hist .lh-code { flex: none; font-size: .48em; } .lds-hist .lh-code pre { margin: 0; }
        .lds-hist .lh-right { flex: 1; min-width: 0; font-size: .58em; min-height: 470px; }
        .lds-hist .lh-t { font-size: .85em; margin: .3em 0; }
        .lds-hist .lh-waves { display: grid; grid-template-columns: repeat(${WAVES}, 1fr); gap: 4px; margin-bottom: .6em; }
        .lds-hist .lh-w { background: var(--surface); border-radius: 6px; padding: .25em .2em; font-size: .78em; min-width: 0; text-align: center; transition: background .3s; }
        .lds-hist .lh-w i { display: block; font-style: normal; color: var(--muted); font-size: .85em; white-space: nowrap; }
        .lds-hist .lh-w.wait { background: var(--fill-amber); } .lds-hist .lh-w.wait i { color: var(--fg); }
        .lds-hist .lh-lds { background: var(--tint-green); border: 1.5px solid var(--good); border-radius: 10px; padding: .5em .7em .2em; }
        .lds-hist .lh-lds.junk { background: var(--tint-violet); border-color: var(--purple); }
        .lds-hist .lh-far { padding: 0 .7em; }
        .lds-hist .lh-tab { font-size: .95em; margin-top: 1em; }
        .lds-hist .lh-tab td, .lds-hist .lh-tab th { padding: .45em 1.2em .45em 0; text-align: left; vertical-align: baseline; }
        .lds-hist .lh-tab th { color: var(--muted); font-weight: 600; }
        .lds-hist .lh-tab tr + tr td { border-top: 1px solid var(--border); }
        .lds-hist .lh-tab td:nth-child(2) { font-family: var(--mono); color: var(--hot); }
        .lds-hist .lh-tab .good { color: var(--good); }
        .lds-hist .lh-text { font-size: .74em; min-height: 3.3em; margin-top: .5em; }
      `}</style>
    </div>
  );
}
