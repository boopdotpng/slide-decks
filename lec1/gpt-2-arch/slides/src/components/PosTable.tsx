/** @jsxImportSource preact */
import { ByteHeat, at, useIsland } from './viz';

/**
 * The position table: 1024 rows (one per position), 768 numbers each, learned. Drawn every 2nd row.
 *  0 the table (each column scaled to its own spread; columns sorted by how fast they wave)   1 four of its columns, plotted down the positions: slow waves   2 there is no row 1024   3 our 4 tokens use rows 0–3
 */
const LINE = ['#3987e5', '#d95926', '#199e70', '#9085e9'];
const TW = 560, TH = 440, PW = 380;

export default function PosTable() {
  const { root, step, d } = useIsland('embed');
  if (!d) return <div ref={root} />;
  const dims = Object.keys(d.wpe_dims);
  const all = dims.flatMap((k) => d.wpe_dims[k] as number[]).slice(1);
  const lo = Math.min(...all), hi = Math.max(...all);
  // a curve per column, drawn down the page like the table: position goes down
  const path = (ys: number[]) => ys.slice(1).map((y, i) => `${((y - lo) / (hi - lo)) * PW},${((i + 1) / 1023) * TH}`).join(' ');

  return (
    <div class="pt" ref={root}>
      <div class="tbl">
        <div class="lbl" style={{ marginLeft: '5em' }}>768 numbers per row →</div>
        <div class="tw">
        <div class="ticks muted"><span>position 0</span><span>↓</span><span>1023</span></div>
        <ByteHeat m={d.wpe_img} w={TW} h={TH}>
          {dims.map((k, j) => (
            <div class={`col ${at(step, 1)}`} style={{ left: `${(d.wpe_order.indexOf(Number(k)) / 768) * 100}%`, background: LINE[j] }} />
          ))}
          <div class={`ours ${at(step, 3)}`} />
        </ByteHeat>
        </div>
        <div class={`missing ${at(step, 2)}`}>no row 1024. that's the context length</div>
      </div>
      <div class="side">
        <div class={at(step, 1)}>
          <svg width={PW} height={TH} viewBox={`0 0 ${PW} ${TH}`}>
            {dims.map((k, j) => <polyline points={path(d.wpe_dims[k])} fill="none" stroke={LINE[j]} stroke-width="2" />)}
          </svg>
          <div class="lbl">four of the columns: slow waves down the positions</div>
        </div>
        <div class={`ourcap ${at(step, 3)}`}>our 4 tokens: rows 0, 1, 2, 3</div>
      </div>
      <style>{`
        .pt { display: flex; gap: 1.5em; align-items: flex-start; font-size: .8em; }
        .pt .tbl { display: flex; flex-direction: column; gap: .3em; }
        .pt .col { position: absolute; top: 0; bottom: 0; width: 3px; margin-left: -1px; }
        .pt .ours { position: absolute; left: -6px; right: -6px; top: -3px; height: 8px; border: 2px solid var(--accent); border-radius: 3px; }
        .pt .missing { margin-top: .2em; padding: .3em .6em; border: 2px dashed #f47067; border-radius: 6px; color: #f47067; font-size: .65em; }
        .pt .side { position: relative; display: flex; flex-direction: column; padding-top: 1.1em; }
        .pt .tw { display: flex; gap: .5em; }
        .pt .ticks { height: ${TH}px; display: flex; flex-direction: column; justify-content: space-between; align-items: flex-end;
          font-size: .5em; white-space: nowrap; }
        .pt .side svg { display: block; }
        .pt .ourcap { color: var(--accent); font-size: .6em; position: absolute; top: .4em; left: 0; }
        .pt .side .lbl { margin-top: .4em; }
      `}</style>
    </div>
  );
}
