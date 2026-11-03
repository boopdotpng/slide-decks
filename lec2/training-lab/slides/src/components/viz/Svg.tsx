/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

/**
 * SVG pieces for box-and-arrow diagrams (from the risc-v deck's kernel layers
 * slide). Arrows draw themselves on when `on` turns true, so tie `on` to the
 * slide step:
 *
 *   <svg viewBox="0 0 1100 520" class="diagram">
 *     <Box x={10} y={10} w={1080} h={120} title="your program" sub="user mode" />
 *     <Arrow from={[780, 130]} to={[780, 195]} on={step >= 1} color={COLORS.good} label="ecall" />
 *   </svg>
 */

export function Box({ x, y, w, h, title, sub, tag, fill = 'var(--panel)', stroke = 'var(--border)', rx = 14, children }: {
  x: number; y: number; w: number; h: number;
  title?: string; sub?: string;
  /** small accent text, top-right */
  tag?: string;
  fill?: string; stroke?: string; rx?: number;
  children?: ComponentChildren;
}) {
  return (
    <g class="box">
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={fill} stroke={stroke} />
      {title && <text x={x + 30} y={y + 50} font-size="32" font-weight="700" fill="var(--fg)">{title}</text>}
      {sub && <text x={x + 30} y={y + 90} font-size="22" fill="var(--muted)">{sub}</text>}
      {tag && <text x={x + w - 30} y={y + 50} font-size="22" fill="var(--accent)" text-anchor="end">{tag}</text>}
      {children}
    </g>
  );
}

/**
 * Arrow that draws itself from `from` to `to`, optionally bending through `via` points
 * (corners rounded by `r`); the label sits beside the middle of the first segment.
 * The head scales with `width`. `dashed` arrows fade in instead of drawing.
 */
export function Arrow({ from, to, via = [], r = 8, on = true, color = 'var(--accent)', label, width = 4, dashed = false, labelOffset = [16, 8] }: {
  from: [number, number]; to: [number, number];
  via?: [number, number][]; r?: number;
  on?: boolean; color?: string; label?: string; width?: number; dashed?: boolean;
  labelOffset?: [number, number];
}) {
  const pts = [from, ...via, to];
  const unit = ([ax, ay]: [number, number], [bx, by]: [number, number]) => {
    const l = Math.hypot(bx - ax, by - ay) || 1;
    return [(bx - ax) / l, (by - ay) / l];
  };
  const head = width * 3.5, half = width * 2.25;
  let d = `M ${from[0]} ${from[1]}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const [p, [ix, iy], [ox, oy]] = [pts[i], unit(pts[i - 1], pts[i]), unit(pts[i], pts[i + 1])];
    d += ` L ${p[0] - ix * r} ${p[1] - iy * r} Q ${p[0]} ${p[1]} ${p[0] + ox * r} ${p[1] + oy * r}`;
  }
  const [x2, y2] = to;
  const [ux, uy] = unit(pts[pts.length - 2], to); // direction of the last segment
  const [px, py] = [-uy, ux]; // perpendicular
  const [bx, by] = [x2 - ux * head, y2 - uy * head]; // base of the head
  d += ` L ${x2 - ux * (head - width)} ${y2 - uy * (head - width)}`;
  const [lx, ly] = [(from[0] + pts[1][0]) / 2, (from[1] + pts[1][1]) / 2];
  return (
    <g class={`arrow ${on ? 'on' : ''} ${dashed ? 'dashed' : ''}`} style={{ color }}>
      <path class="line" d={d} pathLength={dashed ? undefined : 1} fill="none"
        style={dashed ? { strokeDasharray: `${width * 3} ${width * 2.5}` } : undefined} stroke="currentColor" stroke-width={width} />
      <path class="head" d={`M ${bx + px * half} ${by + py * half} L ${x2} ${y2} L ${bx - px * half} ${by - py * half} z`} fill="currentColor" />
      {label && (
        <text x={lx + labelOffset[0]} y={ly + labelOffset[1]} fill="currentColor" font-size="22"
          font-family="var(--mono)">{label}</text>
      )}
    </g>
  );
}

/** Text / mark that fades in when `on` (e.g. a ✗ where an arrow is blocked). */
export function Reveal({ on, children }: { on: boolean; children: ComponentChildren }) {
  return <g class={`reveal ${on ? 'on' : ''}`}>{children}</g>;
}
