/** @jsxImportSource preact */
import { at, diverging, sequential, useIsland } from './viz';

/**
 * Position as a clock (the sinusoidal idea; gpt-2's learned table is its messier cousin).
 * Four hands at four speeds. A position is where all four hands point; each hand is two numbers (sin, cos).
 *  0–5 the counter at P[step]: fast hands spin, slow hands barely move
 *  6 gpt-2's learned table, its top two directions plotted: one slow hand, found by training
 */
const P = [0, 1, 2, 3, 10, 100];
const PERIOD = [4, 16, 64, 1024]; // positions per full turn
const R = 64;

function Clock({ p, period }: { p: number; period: number }) {
  const deg = (360 * p) / period;
  const a = (2 * Math.PI * p) / period;
  return (
    <div class="clk">
      <svg width={2 * R + 8} height={2 * R + 8} viewBox={`${-R - 4} ${-R - 4} ${2 * R + 8} ${2 * R + 8}`}>
        <circle r={R} fill="#141414" stroke="var(--border)" stroke-width="2" />
        {Array.from({ length: 12 }, (_, i) => <line x1="0" y1={-R + 4} x2="0" y2={-R + 12} stroke="#444" transform={`rotate(${i * 30})`} />)}
        <g class="hand" style={{ transform: `rotate(${deg}deg)` }}>
          <line x1="0" y1="0" x2="0" y2={-R + 10} stroke="var(--accent)" stroke-width="5" stroke-linecap="round" />
        </g>
        <circle r="5" fill="var(--accent)" />
      </svg>
      <div class="cells">
        <div class="cell" style={{ background: diverging(Math.sin(a), 0.6) }} />
        <div class="cell" style={{ background: diverging(Math.cos(a), 0.6) }} />
      </div>
      <div class="per muted">a turn every {period}</div>
    </div>
  );
}

/** gpt-2's table on its top two principal directions: one point per position, dark → light = 1 → 1023 */
function Plane({ xy, size }: { xy: number[][]; size: number }) {
  const c = size / 2, rmax = Math.max(...xy.map(([x, y]) => Math.hypot(x, y)));
  const pt = (k: number) => [c + (xy[k][0] / rmax) * (c - 4), c - (xy[k][1] / rmax) * (c - 4)];
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {xy.slice(1).map((_, k) => {
        const [x0, y0] = pt(k), [x1, y1] = pt(k + 1);
        return <line x1={x0} y1={y0} x2={x1} y2={y1} stroke={sequential(0.15 + 0.85 * (k / xy.length))} stroke-width="2" />;
      })}
    </svg>
  );
}

export default function PosClock() {
  const { root, step, d } = useIsland('embed');
  const p = P[Math.min(step, P.length - 1)];
  return (
    <div class="pclk" ref={root}>
      <div class="left">
        <div class="ctr">position <b>{p}</b></div>
        <div class="clocks">{PERIOD.map((per) => <Clock p={p} period={per} />)}</div>
        <div class="cap muted">each hand gives two numbers. together they spell out the position</div>
      </div>
      <div class={`gpt ${at(step, 6)}`}>
        {d && <Plane xy={d.wpe_pca.coords.map((c: number[]) => [c[0], c[1]])} size={260} />}
        <div class="cap muted">gpt-2's own table, squashed onto a flat page: it learned a slow hand by itself</div>
      </div>
      <style>{`
        .pclk { display: flex; gap: 3em; align-items: center; font-size: .8em; }
        .pclk .left { display: flex; flex-direction: column; gap: .8em; }
        .pclk .ctr { font-size: 1.1em; }
        .pclk .ctr b { color: var(--accent); font-family: var(--mono); display: inline-block; min-width: 2.5em; }
        .pclk .clocks { display: flex; gap: 1.6em; }
        .pclk .clk { display: flex; flex-direction: column; align-items: center; gap: .4em; }
        .pclk .hand { transition: transform .8s cubic-bezier(.4, 0, .2, 1); }
        .pclk .cells { display: flex; gap: 3px; }
        .pclk .cell { width: 34px; height: 34px; border-radius: 4px; transition: background .8s; }
        .pclk .per { font-size: .5em; }
        .pclk .cap { font-size: .6em; max-width: 26em; }
        .pclk .gpt { display: flex; flex-direction: column; align-items: center; gap: .5em; max-width: 280px; text-align: center; }
      `}</style>
    </div>
  );
}
