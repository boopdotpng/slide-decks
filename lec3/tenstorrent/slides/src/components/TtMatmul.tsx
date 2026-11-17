/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';

/**
 * The matmul they just wrote in cuda, the Blackhole way (boop-docs matmul/README.md, "how a Blackhole matmul stays
 * busy"): C is cut into output blocks, one per tile; each tile loops over K reading an A block and a B block into
 * L1, unpacking, multiply-accumulating into Dst, then packs C and writes it out; controllers overlap the steps
 * through buffers in L1; a row of tiles shares A and a column shares B by multicast instead of each reading it.
 * The pipeline chart is a schematic of the overlap (one step per slot, 4 K steps), not a measured schedule.
 */
const N = 8, BLK = 2; // C as 8 × 8 cells, 2 × 2 cells per tile → a 4 × 4 grid of tiles
const K = 4;
const STAGES: { who: string; what: string; at: (t: number) => number | null }[] = [
  { who: 'ncrisc', what: 'read A, B block k', at: (t) => (t < K ? t : null) },
  { who: 'trisc0', what: 'unpack', at: (t) => (t >= 1 && t <= K ? t - 1 : null) },
  { who: 'trisc1', what: 'multiply-add into dst', at: (t) => (t >= 2 && t <= K + 1 ? t - 2 : null) },
  { who: 'trisc2', what: 'pack C', at: (t) => (t === K + 2 ? -1 : null) },
  { who: 'brisc', what: 'write C to dram', at: (t) => (t === K + 3 ? -1 : null) },
];
const SLOTS = K + 4;

type View = 'threads' | 'blocks' | 'pipe' | 'mcast';
const STEPS: { view: View; text: ComponentChildren }[] = [
  { view: 'threads', text: <>what you wrote: one <b>thread</b> per <code>C[row][col]</code>, and the hardware did the rest</> },
  { view: 'blocks', text: <>here: cut C into blocks, <b>one per tile</b>. you choose which tile gets which block</> },
  { view: 'pipe', text: <>inside a tile, five programs form an assembly line through L1. reading block k+1 while multiplying block k is how <i>you</i> hide memory: no warps to switch to</> },
  { view: 'mcast', text: <>every tile in a row needs the same A. read it <b>once</b> and broadcast it across the row; B down the columns</> },
];

export default function TtMatmul() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const { view, text } = STEPS[k];
  const T = N / BLK;
  const hue = (r: number, c: number) => ((Math.floor(r / BLK) + Math.floor(c / BLK)) % 2 ? 'b' : 'a');
  return (
    <div class="ttmm" ref={root}>
      <div class="mm-cols">
        <div class="mm-c">
          {view === 'mcast' && (
            <div class="mm-a">{Array.from({ length: T }, (_, r) => <i class={r === 1 ? 'on' : ''}>A{r}</i>)}</div>
          )}
          <div>
            {view === 'mcast' && (
              <div class="mm-b">{Array.from({ length: T }, (_, c) => <i class={c === 2 ? 'on' : ''}>B{c}</i>)}</div>
            )}
            <div class={`mm-grid ${view}`}>
              {Array.from({ length: N * N }, (_, j) => {
                const r = Math.floor(j / N), c = j % N, tr = Math.floor(r / BLK), tc = Math.floor(c / BLK);
                const lit = view === 'mcast' && (tr === 1 || tc === 2);
                return <i class={`${view === 'threads' ? 'th' : hue(r, c)} ${lit ? 'lit' : ''} ${view === 'pipe' && tr === 1 && tc === 2 ? 'me' : ''}`} />;
              })}
            </div>
            <div class="muted mm-cap">
              {view === 'threads' ? `C: ${N * N} threads, one per number` : `C: ${T} × ${T} blocks → ${T * T} tiles`}
            </div>
          </div>
        </div>
        {view === 'mcast' ? (
          <div class="mm-share">
            <div><b>each tile reads its own</b> A row and B column: {T * T} tiles × 2 = <span class="bad">{2 * T * T} reads</span> from dram</div>
            <div><b>read once, broadcast</b>: {T} A panels + {T} B panels = <span class="good">{2 * T} reads</span>, the network copies the rest</div>
            <div class="muted">and a broadcast only goes out when every receiver has room for it: one more thing you coordinate</div>
          </div>
        ) : (
        <div class={`mm-pipe fade ${view === 'pipe' ? 'on' : ''}`}>
          <div class="muted mm-pt">one tile (the orange block), over time</div>
          {STAGES.map((s) => (
            <div class="mm-row">
              <span class="mm-who"><b>{s.who}</b> <span class="muted">{s.what}</span></span>
              {Array.from({ length: SLOTS }, (_, t) => {
                const v = s.at(t);
                return <i class={v == null ? '' : v < 0 ? 'out' : 'k'}>{v == null ? '' : v < 0 ? 'C' : v}</i>;
              })}
            </div>
          ))}
          <div class="muted mm-note">a sketch of the overlap, not a measured schedule</div>
        </div>
        )}
      </div>
      <div class="caption mm-text">{text}</div>
      <style>{`
        .ttmm .mm-cols { display: flex; gap: 2.4em; align-items: center; min-height: 360px; }
        .ttmm .mm-c { display: flex; gap: 10px; align-items: flex-end; flex: none; }
        .ttmm .mm-grid { display: grid; grid-template-columns: repeat(${N}, 34px); gap: 3px; }
        .ttmm .mm-grid i { height: 34px; border-radius: 4px; transition: background .4s, opacity .4s; }
        .ttmm .mm-grid i.th { background: var(--accent); }
        .ttmm .mm-grid i.a { background: var(--steel); } .ttmm .mm-grid i.b { background: var(--steel-2); }
        .ttmm .mm-grid i.me { background: var(--hot); }
        .ttmm .mm-grid.mcast i { opacity: .35; } .ttmm .mm-grid.mcast i.lit { opacity: 1; background: var(--accent); }
        .ttmm .mm-a { display: grid; grid-template-rows: repeat(${4}, ${2 * 34 + 3}px); gap: 3px; margin-bottom: 1.6em; }
        .ttmm .mm-b { display: grid; grid-template-columns: repeat(${4}, ${2 * 34 + 3}px); gap: 3px; margin-bottom: 8px; }
        .ttmm .mm-a i, .ttmm .mm-b i { font: normal .42em var(--mono); display: flex; align-items: center; justify-content: center;
          background: var(--surface); border-radius: 4px; color: var(--muted); min-width: 40px; min-height: 32px; }
        .ttmm .mm-a i.on, .ttmm .mm-b i.on { background: var(--good); color: var(--on-color); }
        .ttmm .mm-cap { font-size: .46em; margin-top: .5em; }
        .ttmm .mm-pipe { flex: 1; font-size: .5em; }
        .ttmm .mm-pt { margin-bottom: .5em; }
        .ttmm .mm-row { display: grid; grid-template-columns: 15em repeat(${SLOTS}, 1fr); gap: 4px; margin-bottom: 4px; align-items: center; }
        .ttmm .mm-who { white-space: nowrap; }
        .ttmm .mm-row i { height: 1.9em; border-radius: 4px; background: var(--sunken); font: normal .9em/1.9em var(--mono); text-align: center; }
        .ttmm .mm-row i.k { background: var(--accent); color: var(--on-color); }
        .ttmm .mm-row i.out { background: var(--hot); color: var(--on-color); }
        .ttmm .mm-note { margin-top: .5em; font-size: .85em; }
        .ttmm .mm-share { flex: 1; font-size: .62em; display: flex; flex-direction: column; gap: .9em; }
        .ttmm .mm-share .bad { color: var(--bad); font-weight: 700; } .ttmm .mm-share .good { color: var(--good); font-weight: 700; }
        .ttmm .mm-text { font-size: .8em; min-height: 2.6em; margin-top: .8em; }
      `}</style>
    </div>
  );
}
