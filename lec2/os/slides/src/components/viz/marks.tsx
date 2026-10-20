/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { COLORS, diverging } from './color';
import { fmt, rms, tip } from './util';

/**
 * Data marks: vectors as color strips, matrices as heatmaps, labeled bars,
 * tensor shapes, tokens. Styles are in styles/viz.css. Small heatmaps and bars
 * animate when their values change, so step through states and they morph.
 */

/** tokens with a leading space are drawn with a faint dot, so " to" and "to" look different */
export function Tok({ t, class: cls = '' }: { t: string; class?: string }) {
  const lead = t.startsWith(' ');
  return (
    <span class={`tok ${cls}`}>
      {lead && <span class="sp">·</span>}
      {(lead ? t.slice(1) : t).replace(/\n/g, '\\n')}
    </span>
  );
}

/** "(1, 14, 768)" with optional dim names underneath; hl dims are colored */
export function Shape({ dims, names, hl = [] }: { dims: (number | string)[]; names?: string[]; hl?: number[] }) {
  return (
    <span class="shape">
      (
      {dims.map((d, i) => (
        <span class={`dim ${hl.includes(i) ? 'hl' : ''}`}>
          <span class="v">{d}{i < dims.length - 1 ? ',' : ''}</span>
          {names && <span class="n">{names[i]}</span>}
        </span>
      ))}
      )
    </span>
  );
}

// ── a vector as a row of colored cells ───────────────────────────────────────
/**
 * Canvas, one pixel column per value, stretched by css. Cheap enough for
 * thousands of values. `scale` sets the diverging color scale (defaults to the
 * vector's rms * 2). `vertical` draws it as a column. Hover shows the value.
 */
export function Strip({ values, scale, height = 22, width, vertical = false, label, class: cls = '', color }: {
  values: number[]; scale?: number; height?: number; width?: number; vertical?: boolean; label?: string; class?: string;
  color?: (v: number) => string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const s = scale ?? (rms(values) * 2 || 1);
  useEffect(() => {
    const c = ref.current!;
    c.width = vertical ? 1 : values.length;
    c.height = vertical ? values.length : 1;
    const ctx = c.getContext('2d')!;
    values.forEach((v, i) => {
      ctx.fillStyle = color ? color(v) : diverging(v, s);
      if (vertical) ctx.fillRect(0, i, 1, 1);
      else ctx.fillRect(i, 0, 1, 1);
    });
  }, [values, s]);
  const onMove = (e: MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const f = vertical ? (e.clientY - r.top) / r.height : (e.clientX - r.left) / r.width;
    const i = Math.floor(f * values.length);
    if (i >= 0 && i < values.length) tip(e, `${label ? label + ' ' : ''}[${i}] = <b>${fmt(values[i], 3)}</b>`);
  };
  return (
    <canvas ref={ref} class={`strip ${cls}`} style={{ height: `${height}px`, width: width ? `${width}px` : undefined }}
      onMouseMove={onMove} onMouseLeave={() => tip(null)} />
  );
}

// ── matrix as a grid of cells (small matrices: colors animate) ───────────────
/** null cells are drawn hatched (masked). hlRow / hlCol brighten a label; hlRow / hlCol / hlCells mark cells .on */
export function Heatmap({ data, color, rowLabels, colLabels, cell = 26, hlRow, hlCol, hlCells = [], tipFn, class: cls = '', gap = 2 }: {
  data: (number | null)[][]; color: (v: number, r: number, c: number) => string;
  rowLabels?: ComponentChildren[]; colLabels?: ComponentChildren[]; cell?: number;
  hlRow?: number; hlCol?: number; hlCells?: [number, number][];
  tipFn?: (r: number, c: number, v: number | null) => string; class?: string; gap?: number;
}) {
  const cols = data[0]?.length ?? 0;
  return (
    <div class={`heat ${cls}`} style={{
      gridTemplateColumns: `${rowLabels ? 'auto ' : ''}repeat(${cols}, ${cell}px)`,
      gridAutoRows: `${cell}px`, gap: `${gap}px`,
    }}>
      {colLabels && <>
        {rowLabels && <div />}
        {colLabels.map((l, c) => <div class={`cl ${c === hlCol ? 'hl' : ''}`}><span>{l}</span></div>)}
      </>}
      {data.map((row, r) => <>
        {rowLabels && <div class={`rl ${r === hlRow ? 'hl' : ''}`}>{rowLabels[r]}</div>}
        {row.map((v, c) => (
          <div class={`hc ${v === null ? 'masked' : ''} ${r === hlRow || c === hlCol || hlCells.some(([a, b]) => a === r && b === c) ? 'on' : ''}`}
            style={{ background: v === null ? undefined : color(v, r, c) }}
            onMouseMove={tipFn ? (e) => tip(e, tipFn(r, c, v)) : undefined}
            onMouseLeave={tipFn ? () => tip(null) : undefined} />
        ))}
      </>)}
    </div>
  );
}

/** big matrix on a canvas (no per-cell animation); size for square, or w / h */
export function HeatCanvas({ data, color, size, w, h, tipFn }: {
  data: number[][]; color: (v: number) => string; size?: number; w?: number; h?: number;
  tipFn?: (r: number, c: number, v: number) => string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    c.width = data[0].length;
    c.height = data.length;
    const ctx = c.getContext('2d')!;
    data.forEach((row, r) => row.forEach((v, k) => { ctx.fillStyle = color(v); ctx.fillRect(k, r, 1, 1); }));
  }, [data, color]);
  const onMove = (e: MouseEvent) => {
    if (!tipFn) return;
    const b = ref.current!.getBoundingClientRect();
    const r = Math.floor(((e.clientY - b.top) / b.height) * data.length);
    const k = Math.floor(((e.clientX - b.left) / b.width) * data[0].length);
    if (data[r]?.[k] !== undefined) tip(e, tipFn(r, k, data[r][k]));
  };
  return <canvas ref={ref} class="heatcanvas" style={{ width: `${w ?? size}px`, height: `${h ?? size}px` }}
    onMouseMove={onMove} onMouseLeave={() => tip(null)} />;
}

// ── horizontal bars with labels ──────────────────────────────────────────────
/** signed: bars grow left / right from a center line */
export function Bars({ values, labels, max, color = COLORS.accent, fmtV = (v: number) => fmt(v), hl, signed = false, width = 260 }: {
  values: number[]; labels: ComponentChildren[]; max?: number; color?: string | ((v: number, i: number) => string);
  fmtV?: (v: number) => string; hl?: number; signed?: boolean; width?: number;
}) {
  const m = max ?? Math.max(...values.map(Math.abs), 1e-9);
  return (
    <div class={`bars ${signed ? 'signed' : ''}`} style={{ '--bw': `${width}px` }}>
      {values.map((v, i) => {
        const w = Math.min(1, Math.abs(v) / m);
        const c = typeof color === 'function' ? color(v, i) : color;
        return (
          <div class={`bar-row ${i === hl ? 'hl' : ''}`}>
            <div class="bl">{labels[i]}</div>
            <div class="track">
              <div class="fill" style={{
                width: `${(signed ? 50 : 100) * w}%`, background: c,
                left: signed ? (v < 0 ? `${50 - 50 * w}%` : '50%') : 0,
              }} />
            </div>
            <div class="bv">{fmtV(v)}</div>
          </div>
        );
      })}
    </div>
  );
}

/** "where are we" breadcrumb, top-right of a slide: <Crumbs items={['a', 'b', 'c']} at="b" /> */
export function Crumbs({ items, at }: { items: string[]; at: string }) {
  return (
    <div class="crumbs">
      {items.map((s) => <span class={s === at ? 'on' : ''}>{s}</span>)}
    </div>
  );
}
