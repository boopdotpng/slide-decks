/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

/**
 * Matrices as svg cells, for drawing matmuls: every cell is a unit rect moved and scaled by a css transform, so
 * `t` (transpose) slides each cell (r, c) to (c, r) and the matrix visibly flips, labels and all. Cell sizes are per
 * axis (cw, ch, in the untransposed layout), so a matmul's matrices can line up along the dims they share.
 * Styles: .mx in styles/viz.css.
 */
export type MatProps = {
  data: (number | null)[][];
  x: number; y: number; cw: number; ch: number;
  t?: boolean;                                      // transposed: data row r is drawn as column r
  color: (v: number, r: number, c: number) => string;
  rowLabels?: string[]; colLabels?: string[]; labelCls?: (i: number) => string;
  name?: ComponentChildren; shape?: boolean;        // name and "(rows, cols)" under the matrix
  hlRows?: number[]; hlCols?: number[]; hlCells?: [number, number][];   // in data coordinates
  dim?: boolean;                                    // fade every cell outside the highlights
  visible?: (r: number, c: number) => boolean;      // cells not yet computed are drawn empty
  text?: (v: number | null, r: number, c: number) => string | null;
  inv?: (v: number) => boolean;                     // cells whose text goes dark-on-light (bright fills)
  textCls?: (v: number | null) => string;           // extra class on a cell's text
  gap?: number; class?: string;
};

/** where data cell (r, c) is drawn: [x, y, w, h] */
export function cellAt(p: Pick<MatProps, 'x' | 'y' | 'cw' | 'ch' | 't'>, r: number, c: number) {
  return p.t ? [p.x + r * p.ch, p.y + c * p.cw, p.ch, p.cw] : [p.x + c * p.cw, p.y + r * p.ch, p.cw, p.ch];
}
/** drawn size: [w, h] */
export function matSize(p: Pick<MatProps, 'data' | 'cw' | 'ch' | 't'>) {
  const R = p.data.length, C = p.data[0]?.length ?? 0;
  return p.t ? [R * p.ch, C * p.cw] : [C * p.cw, R * p.ch];
}

const fs = (cell: number) => Math.min(18, Math.max(10, cell * 0.95));
const tf = (x: number, y: number, w = 1, h = 1) => ({ transform: `translate(${x}px, ${y}px) scale(${w}, ${h})` });

export function Mat(p: MatProps) {
  const { data, color, gap = 0.8, t = false } = p;
  const R = data.length, C = data[0]?.length ?? 0;
  const [W, H] = matSize(p);
  const inHl = (r: number, c: number) =>
    !!(p.hlRows?.includes(r) || p.hlCols?.includes(c) || p.hlCells?.some(([a, b]) => a === r && b === c));
  const anyHl = !!(p.hlRows?.length || p.hlCols?.length || p.hlCells?.length);
  // highlight outlines, one rect per row / column / cell, in drawn coordinates
  const boxes: [number, number, number, number][] = [
    ...(p.hlRows ?? []).map((r) => { const [x, y] = cellAt(p, r, 0); return t ? [x, y, p.ch, H] : [x, y, W, p.ch]; }),
    ...(p.hlCols ?? []).map((c) => { const [x, y] = cellAt(p, 0, c); return t ? [x, y, W, p.cw] : [x, y, p.cw, H]; }),
    ...(p.hlCells ?? []).map(([r, c]) => cellAt(p, r, c)),
  ] as [number, number, number, number][];
  return (
    <g class={`mx ${p.class ?? ''}`}>
      {data.map((row, r) => row.map((v, c) => {
        const [x, y, w, h] = cellAt(p, r, c);
        const shown = p.visible ? p.visible(r, c) : true;
        const fade = p.dim && anyHl && !inHl(r, c);
        return (
          <rect class={`c ${v === null ? 'masked' : ''} ${shown ? '' : 'empty'} ${fade ? 'dim' : ''}`} width="1" height="1"
            style={{ ...tf(x, y, Math.max(0.5, w - gap), Math.max(0.5, h - gap)), fill: v === null || !shown ? undefined : color(v, r, c) }} />
        );
      }))}
      {p.text && data.map((row, r) => row.map((v, c) => {
        const s = (p.visible ? p.visible(r, c) : true) ? p.text!(v, r, c) : null;
        const [x, y, w, h] = cellAt(p, r, c);
        return s === null ? null : <text class={`ct ${p.dim && anyHl && !inHl(r, c) ? 'dim' : ''} ${v !== null && p.inv?.(v) ? 'inv' : ''} ${p.textCls?.(v) ?? ''}`} style={tf(x + w / 2, y + h / 2 + 5)}>{s}</text>;
      }))}
      {p.rowLabels?.map((l, r) => {
        const [x, y, w, h] = cellAt(p, r, 0);
        return <text class={`rl ${p.labelCls?.(r) ?? ''}`} style={{ ...(t ? tf(x + w / 2, y - 10) : tf(x - 14, y + h / 2 + fs(h) / 3)), fontSize: `${fs(t ? w : h)}px` }}>{l}</text>;
      })}
      {p.colLabels?.map((l, c) => {
        const [x, y, w, h] = cellAt(p, 0, c);
        return <text class={`rl ${p.labelCls?.(c) ?? ''}`} style={{ ...(t ? tf(x - 14, y + h / 2 + fs(h) / 3) : tf(x + w / 2, y - 10)), fontSize: `${fs(t ? h : w)}px` }}>{l}</text>;
      })}
      {boxes.map(([x, y, w, h]) => <rect class="hlbox" x={x - 1.5} y={y - 1.5} width={w + 3 - gap} height={h + 3 - gap} rx="3" />)}
      {(p.name || p.shape) && (
        <text class="nm" style={tf(p.x, p.y + H + 26)}>
          {p.name}{p.shape && <tspan class="sh"> ({t ? C : R}, {t ? R : C})</tspan>}
        </text>
      )}
    </g>
  );
}

/**
 * One dot product, spelled out: a row and a column laid side by side as two rows of cells, their products under them,
 * and the sum. Cells are drawn from `x`, `cw` wide; `nums` writes the values in the cells (for short vectors).
 */
export function DotRow({ a, b, x, y, cw, ch = 22, color, la, lb, sum, nums = false, scale, inv }: {
  a: number[]; b: number[]; x: number; y: number; cw: number; ch?: number; color: (v: number, scale: number) => string;
  la: ComponentChildren; lb: ComponentChildren; sum: ComponentChildren; nums?: boolean; scale: [number, number, number];
  inv?: (v: number, row: number) => boolean;
}) {
  const prod = a.map((v, i) => v * b[i]);
  const row = (v: number[], yy: number, s: number, label: ComponentChildren, k: number) => (
    <g>
      <text class="dl" x={x - 14} y={yy + ch / 2 + 6}>{label}</text>
      {v.map((n, i) => <rect class="c" x={x + i * cw} y={yy} width={cw - 1} height={ch} style={{ fill: color(n, s) }} />)}
      {nums && v.map((n, i) => <text class={`ct ${inv?.(n, k) ? 'inv' : ''}`} x={x + i * cw + cw / 2} y={yy + ch / 2 + 5}>{n.toFixed(2)}</text>)}
    </g>
  );
  const G = ch + 8, end = x + a.length * cw;
  return (
    <g class="mx dot">
      {row(a, y, scale[0], la, 0)}
      {row(b, y + G, scale[1], lb, 1)}
      <line class="rule" x1={x} x2={end} y1={y + 2 * G - 4} y2={y + 2 * G - 4} />
      {row(prod, y + 2 * G, scale[2], 'products', 2)}
      <text class="sum" x={x} y={y + 3 * G + 26}>{sum}</text>
    </g>
  );
}
