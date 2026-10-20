/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { sequential, useData } from './viz';

/**
 * embed_positions drawn the way rope usually is: each pair of dimensions is a plane, and a position is an
 * angle in it. Gpt-2's top principal components come in sin/cos pairs, so its learned table can be drawn
 * the same way as real rope pairs (head_dim 64, base 10000): one point per position, at its real coordinates.
 * Gpt-2's first ~15 and last ~100 positions sit near the center (tiny radius, so their angle is noise);
 * laps are counted only where the radius is well defined.
 * Steps: 0. gpt-2's top plane   1. rope pairs, same drawing   2. what's different
 */
const SZ = 190;
const ROPE = [4, 15, 17].map((i) => ({ i, theta: 10000 ** (-2 * i / 64) }));

function Plane({ xy }: { xy: number[][] }) {
  const n = xy.length, c = SZ / 2;
  const rmax = Math.max(...xy.map(([x, y]) => Math.hypot(x, y)));
  const pt = (k: number) => [c + (xy[k][0] / rmax) * (c - 4), c - (xy[k][1] / rmax) * (c - 4)];
  const segs = [];
  for (let k = 1; k < n; k++) {
    const [x0, y0] = pt(k - 1), [x1, y1] = pt(k);
    segs.push(<line x1={x0} y1={y0} x2={x1} y2={y1} stroke={sequential(0.15 + 0.85 * (k / n))} stroke-width="1.6" />);
  }
  return <svg width={SZ} height={SZ} viewBox={`0 0 ${SZ} ${SZ}`}>{segs}</svg>;
}

// total turning, counted only between points far enough from the center for the angle to mean something
const laps = (xy: number[][]) => {
  const rs = xy.map(([x, y]) => Math.hypot(x, y)), cut = Math.max(...rs) / 3;
  const ang = xy.map(([x, y]) => Math.atan2(y, x));
  let tot = 0;
  for (let k = 1; k < xy.length; k++) {
    if (rs[k] < cut || rs[k - 1] < cut) continue;
    let d = ang[k] - ang[k - 1];
    d = ((d + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; // wrap to (-π, π]
    tot += d;
  }
  return Math.abs(tot) / (2 * Math.PI);
};

export default function PosCircles() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('embed');
  if (!d) return <div ref={root} />;
  const C: number[][] = d.wpe_pca.coords, v: number[] = d.wpe_pca.var, per: number[] = d.wpe_pca.period;
  const g = { a: 0, b: 1, xy: C.map((p) => [p[0], p[1]]) };
  const pos = Array.from({ length: 1023 }, (_, k) => k + 1);
  const rope = ROPE.map((r) => ({ ...r, xy: pos.map((p) => [Math.cos(p * r.theta), Math.sin(p * r.theta)]), period: (2 * Math.PI) / r.theta }));
  const pct = (x: number) => `${Math.round(x * 100)}%`;

  return (
    <div class="pc" ref={root}>
      <div class="row">
        <div class="rl"><b>gpt-2</b><br /><span class="muted">learned, added to x</span></div>
        <div class="cell">
          <Plane xy={g.xy} />
          <div class="cap">pc {g.a} × pc {g.b} <span class="muted">· {pct(v[g.a] + v[g.b])} of the table's variance</span></div>
          <div class="cap muted">period ≈ {per[g.a]} · {laps(g.xy).toFixed(1)} laps</div>
        </div>
        <div class="note muted">
          a sin/cos pair, found by training.<br />starts at the center, circles about twice,
          and the last ~100 positions shrink back in
        </div>
      </div>
      <div class={`row fade ${step >= 1 ? 'on' : ''}`}>
        <div class="rl"><b>rope</b><br /><span class="muted">designed, rotates q, k</span></div>
        {rope.map((r) => (
          <div class="cell">
            <Plane xy={r.xy} />
            <div class="cap">pair {r.i} <span class="muted">· θ = 10000<sup>−{2 * r.i}/64</sup></span></div>
            <div class="cap muted">period ≈ {Math.round(r.period)} · {laps(r.xy).toFixed(1)} laps</div>
          </div>
        ))}
      </div>
      <div class={`foot muted fade ${step >= 2 ? 'on' : ''}`}>
        same picture: each pair is an angle that turns with position. gpt-2 found only slow turns and adds them to x once;
        rope has 32 fixed speeds, fast to slow, and rotates q and k in every block, so q·k sees only the distance
      </div>
      <div class="key muted">one point per position, dark → light = position 1 → 1023</div>
      <style>{`
        .pc { display: flex; flex-direction: column; gap: .5em; font-size: .8em; }
        .pc .row { display: flex; align-items: center; gap: 1.6em; }
        .pc .rl { width: 7.5em; font-size: .62em; text-align: right; line-height: 1.35; }
        .pc .cell { display: flex; flex-direction: column; align-items: center; gap: .1em; }
        .pc .cap { font-size: .5em; white-space: nowrap; }
        .pc .note { font-size: .55em; max-width: 16em; line-height: 1.4; }
        .pc .foot { font-size: .55em; max-width: 60em; margin-top: .3em; }
        .pc .key { font-size: .45em; }
      `}</style>
    </div>
  );
}
