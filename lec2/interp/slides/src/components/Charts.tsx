/** @jsxImportSource preact */
import { useRef, useState } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { fmt, tip } from './viz';

/**
 * Small svg charts drawn from the section csvs (public/data/section<N>.json).
 * Bars: one per token / position, letters and digits colored apart, optional dashed reference lines.
 * Line: one series over steps, with a hover crosshair and reference lines that appear with the slide step.
 */
export const LETTER = 'var(--muted)', DIGIT = 'var(--accent)';
const AXIS = 'var(--raised-2)', GRID = 'var(--border)';
type Ref = { y: number; label: string; step?: number };

function ticks(lo: number, hi: number, n = 4) {
  const raw = (hi - lo) / n, mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * mag).find((s) => s >= raw)!;
  const out = [];
  for (let v = Math.ceil(lo / step) * step; v <= hi + 1e-9; v += step) out.push(+v.toFixed(10));
  return out;
}

export function BarChart({ values, labels, kinds, refs = [], min, max, height = 260, width = 1200, fmtV = (v: number) => fmt(v, 3), title, yLabel }: {
  values: number[]; labels: string[]; kinds?: string[]; refs?: Ref[]; min?: number; max?: number;
  height?: number; width?: number; fmtV?: (v: number) => string; title?: string; yLabel?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  // reference labels sit in a right margin, beside the end of their line, so they never cover a bar
  const L = yLabel ? 100 : 70, R = refs.length ? 20 + 13 * Math.max(...refs.map((r) => r.label.length)) : 10, T = 14, B = 34;
  // min / max only ever widen the axis: a value outside them still fits, so bars can't spill over the slide
  const lo = Math.min(min ?? 0, 0, ...values), hi = Math.max(max ?? 0, 0, ...values, ...refs.map((r) => r.y));
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (height - T - B);
  const band = (width - L - R) / values.length;
  const firstDigit = kinds ? kinds.indexOf('digit') : -1;
  return (
    <div class="chart" ref={root}>
      {(title || kinds) && <div class="ct">{title}{kinds && <span class="lg"><i style={{ background: LETTER }} />letters <i style={{ background: DIGIT }} />digits</span>}</div>}
      <svg viewBox={`0 0 ${width} ${height}`}>
        {ticks(lo, hi).map((t) => (
          <g>
            <line x1={L} x2={width - R} y1={y(t)} y2={y(t)} stroke={t === 0 ? AXIS : GRID} />
            <text class="tk" x={L - 10} y={y(t) + 6} text-anchor="end">{fmt(t, 2)}</text>
          </g>
        ))}
        {yLabel && <text class="tk" x={14} y={height / 2} transform={`rotate(-90 14 ${height / 2})`} text-anchor="middle">{yLabel}</text>}
        {firstDigit > 0 && <line x1={L + firstDigit * band} x2={L + firstDigit * band} y1={T} y2={height - B} stroke={AXIS} stroke-dasharray="3 4" />}
        {/* reference lines first, so bars that reach them draw over the dashes */}
        {refs.map((r) => (
          <g class={`ref ${(r.step ?? 0) <= step ? 'on' : ''}`}>
            <line x1={L} x2={width - R} y1={y(r.y)} y2={y(r.y)} />
            <text x={width - R + 10} y={y(r.y) + 6}>{r.label}</text>
          </g>
        ))}
        {values.map((v, i) => {
          const top = Math.min(y(v), y(0)), h = Math.max(Math.abs(y(v) - y(0)), v === 0 ? 0 : 1);
          return (
            <g onMouseMove={(e) => tip(e, `${labels[i]}: <b>${fmtV(v)}</b>`)} onMouseLeave={() => tip(null)}>
              <rect x={L + i * band} y={T} width={band} height={height - T - B} fill="transparent" />
              <rect x={L + i * band + band * 0.15} y={top} width={band * 0.7} height={h} rx="2"
                fill={kinds?.[i] === 'letter' ? LETTER : DIGIT} />
              <text class="xl" x={L + i * band + band / 2} y={height - B + 24} text-anchor="middle">{labels[i]}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function LineChart({ ys, refs = [], height = 420, width = 1200, xLabel = 'step', yLabel, fmtV = (v: number) => v.toFixed(3) }: {
  ys: number[]; refs?: Ref[]; height?: number; width?: number; xLabel?: string; yLabel?: string; fmtV?: (v: number) => string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const [hover, setHover] = useState<number | null>(null);
  const L = 80, R = 10, T = 20, B = 50;
  const lo = Math.min(...ys, ...refs.map((r) => r.y)) - 0.1, hi = Math.max(...ys, ...refs.map((r) => r.y)) + 0.1;
  const x = (i: number) => L + (i / (ys.length - 1)) * (width - L - R);
  const y = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (height - T - B);
  const pts = ys.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const onMove = (e: MouseEvent) => {
    const svg = e.currentTarget as SVGSVGElement, r = svg.getBoundingClientRect();
    const sx = ((e.clientX - r.left) / r.width) * width;
    const i = Math.round(((sx - L) / (width - L - R)) * (ys.length - 1));
    if (i < 0 || i >= ys.length) return setHover(null), tip(null);
    setHover(i);
    tip(e, `${xLabel} ${i + 1}: <b>${fmtV(ys[i])}</b>`);
  };
  return (
    <div class="chart" ref={root}>
      <svg viewBox={`0 0 ${width} ${height}`} onMouseMove={onMove} onMouseLeave={() => (setHover(null), tip(null))}>
        {ticks(lo, hi).map((t) => (
          <g>
            <line x1={L} x2={width - R} y1={y(t)} y2={y(t)} stroke={GRID} />
            <text class="tk" x={L - 10} y={y(t) + 6} text-anchor="end">{fmt(t, 1)}</text>
          </g>
        ))}
        {ticks(0, ys.length, 4).map((t) => (
          <text class="tk" x={x(Math.max(0, t - 1))} y={height - B + 26} text-anchor="middle">{t}</text>
        ))}
        <text class="tk" x={(L + width) / 2} y={height - 4} text-anchor="middle">{xLabel}</text>
        {yLabel && <text class="tk" x={16} y={height / 2} transform={`rotate(-90 16 ${height / 2})`} text-anchor="middle">{yLabel}</text>}
        {refs.map((r) => (
          <g class={`ref ${(r.step ?? 0) <= step ? 'on' : ''}`}>
            <line x1={L} x2={width - R} y1={y(r.y)} y2={y(r.y)} />
            <text x={width - R} y={y(r.y) - 10} text-anchor="end">{r.label}</text>
          </g>
        ))}
        <polyline points={pts} fill="none" stroke={DIGIT} stroke-width="2" stroke-linejoin="round" />
        {hover !== null && <>
          <line x1={x(hover)} x2={x(hover)} y1={T} y2={height - B} stroke="var(--faint)" />
          <circle cx={x(hover)} cy={y(ys[hover])} r="5" fill={DIGIT} stroke="var(--bg)" stroke-width="2" />
        </>}
      </svg>
    </div>
  );
}

export const CHART_CSS = `
  .chart { width: 100%; }
  .chart svg { width: 100%; display: block; overflow: visible; }
  .chart .ct { font-size: .7em; color: var(--muted); margin-bottom: .2em; }
  .chart .lg { margin-left: 1.2em; font-size: .9em; }
  .chart .lg i { display: inline-block; width: .7em; height: .7em; border-radius: 2px; margin: 0 .35em 0 .8em; vertical-align: -.05em; }
  .chart .tk { font-family: var(--mono); font-size: 18px; fill: var(--muted); }
  .chart .xl { font-family: var(--mono); font-size: 20px; fill: var(--muted); }
  .chart .ref { opacity: 0; transition: opacity .4s; }
  .chart .ref.on { opacity: 1; }
  .chart .ref line { stroke: color-mix(in srgb, var(--fg) 15%, var(--muted)); stroke-width: 1.5; stroke-dasharray: 6 6; }
  .chart .ref text { font-family: var(--mono); font-size: 20px; fill: color-mix(in srgb, var(--fg) 50%, var(--muted)); }
`;
