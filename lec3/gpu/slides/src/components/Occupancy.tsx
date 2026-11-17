/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useIsland } from 'slides/viz';

/**
 * How many waves a simd can park, by how many v registers the kernel uses. The bars are llvm's own numbers for
 * gfx1201 (public/data/occupancy.json, from export_occupancy.sh): 1536 registers per simd, handed out in blocks of
 * 24, at most 16 waves. Our kernels' register counts are what clang reports for them (NumVgprs, gfx1201).
 */
type D = { cpu: string; rows: { vgprs: number; waves: number }[] };
const OURS = [{ name: 'brighten', vgprs: 2 }, { name: 'the lds histogram (part 3)', vgprs: 4 }];
const TEXT: ComponentChildren[] = [
  <>how many waves can a simd park? its register file (1536 registers, 32 lanes wide) is shared out among them, and every wave of a program gets the same number: as many as the program needs</>,
  <>up to 96 registers each, 16 waves fit (the most a simd will track). our programs need 2 and 4. small programs are easy</>,
  <>a program that needs 200 registers gets 7 waves: less to switch to while waiting, so more idle cycles. the compiler tells you this number for every program you write</>,
];

export default function Occupancy() {
  const { root, step, d } = useIsland<D>('occupancy');
  if (!d) return <div ref={root} />;
  const k = Math.min(TEXT.length - 1, step);
  return (
    <div class="occ" ref={root}>
      <div class="oc-chart">
        <div class="oc-y muted">waves parked on one simd</div>
        <div class="oc-bars">
          {d.rows.map((r) => (
            <div class={`oc-col ${k === 2 && r.vgprs === 208 ? 'hl' : ''} ${k === 1 && r.vgprs <= 96 ? 'ok' : ''}`}>
              <span class="oc-v">{r.waves}</span>
              <div class="oc-bar" style={{ height: `${(r.waves / 16) * 100}%` }} />
              <span class="oc-x">{r.vgprs}</span>
            </div>
          ))}
        </div>
        <div class="oc-xl muted">registers each thread needs</div>
      </div>
      <div class={`oc-ours fade ${k >= 1 ? 'on' : ''}`}>
        {OURS.map((o) => <span><b>{o.name}</b>: {o.vgprs} registers → 16 waves</span>)}
      </div>
      <div class="caption oc-text">{TEXT[k]}</div>
      <style>{`
        .occ .oc-chart { font-size: .5em; }
        .occ .oc-bars { display: flex; gap: 6px; align-items: flex-end; height: 300px; border-bottom: 1px solid var(--line); }
        .occ .oc-col { flex: 1; height: 100%; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; position: relative; }
        .occ .oc-bar { width: 100%; background: var(--series-1); border-radius: 4px 4px 0 0; transition: background .3s, opacity .3s; }
        .occ .oc-col.ok .oc-bar { background: var(--good); } .occ .oc-col.hl .oc-bar { background: var(--hot); }
        .occ .oc-v { font-family: var(--mono); margin-bottom: 2px; }
        .occ .oc-x { position: absolute; top: 100%; margin-top: 4px; font-family: var(--mono); color: var(--muted); }
        .occ .oc-y { margin-bottom: 1.6em; } .occ .oc-xl { margin-top: 2em; text-align: center; }
        .occ .oc-ours { display: flex; gap: 3em; font-size: .6em; margin-top: .8em; }
        .occ .oc-text { font-size: .78em; min-height: 3.2em; margin-top: .6em; }
      `}</style>
    </div>
  );
}
