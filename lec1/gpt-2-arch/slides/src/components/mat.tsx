/** @jsxImportSource preact */
import { COLORS } from './viz';

/**
 * Matrices drawn as plain rectangles for the "heads are just a batch dim" slides. Not to scale
 * between different dims, but consistent within one: 64 is always exactly 1/12 of 768, so 12 head
 * bands tile a 768-wide matrix.
 */
export const BAND = ['#1e3a5f', '#2a4a73'];
const STROKE = '#3a4a5c';

type MatProps = {
  x: number; y: number; w: number; h: number;
  bands?: number; // split into this many vertical column bands (heads)
  hl?: number; // band to highlight
  only?: number; // draw just this band (the rest as a faint outline)
  stack?: number; // draw as a stack of this many matrices, offset up-right
  fill?: string;
  label?: preact.ComponentChildren; // under the box
  sub?: string; // second label line (the shape)
  labelY?: number; // baseline for the label, so a row of matrices can share one
};

export function Mat({ x, y, w, h, bands = 0, hl, only, stack = 1, fill, label, sub, labelY }: MatProps) {
  const off = 5;
  const layers = [];
  for (let s = stack - 1; s >= 0; s--) {
    const lx = x + s * off, ly = y - s * off, front = s === 0;
    if (bands) {
      const bw = w / bands;
      layers.push(<g opacity={front ? 1 : 0.55}>
        {only !== undefined && <rect x={lx} y={ly} width={w} height={h} fill="none" stroke={STROKE} stroke-dasharray="3 3" />}
        {Array.from({ length: bands }, (_, b) => (only !== undefined && b !== only) ? null : (
          <rect x={lx + b * bw} y={ly} width={bw} height={h}
            fill={b === hl ? COLORS.accent : BAND[b % 2]} stroke={STROKE} stroke-width="0.5" />
        ))}
      </g>);
    } else {
      layers.push(<rect x={lx} y={ly} width={w} height={h} rx="2"
        fill={front ? (fill ?? BAND[1]) : BAND[0]} stroke={front && fill ? COLORS.accent : STROKE} stroke-width={front ? 1.2 : 0.8} />);
    }
  }
  return (
    <g>
      {layers}
      {label && <text x={x + w / 2} y={labelY ?? y + h + 20} text-anchor="middle" class="ml">{label}</text>}
      {sub && <text x={x + w / 2} y={(labelY ?? y + h + 20) + 16} text-anchor="middle" class="ml">{sub}</text>}
    </g>
  );
}

/** an operator (@, =, →) centered vertically on a row */
export const Op = ({ x, y, t }: { x: number; y: number; t: string }) =>
  <text x={x} y={y} text-anchor="middle" dominant-baseline="middle" class="mop">{t}</text>;
