/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { paint, IMG, BLOCK } from './image';

/**
 * Pieces the part 3 islands (the histogram slides) share: the photo drawn into a canvas, and a 256-column histogram.
 * Everything they show is computed from image.ts.
 */

/** the photo (or any W × H bytes), one canvas pixel per image pixel, scaled up with css */
export function Photo({ img = IMG, label, class: cls = '' }: { img?: ArrayLike<number>; label?: ComponentChildren; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => paint(ref.current, img), [img]);
  return (
    <figure class={`hp-photo ${cls}`}>
      <canvas ref={ref} />
      {label && <figcaption>{label}</figcaption>}
      <style>{`
        .hp-photo { margin: 0; }
        .hp-photo canvas { display: block; width: 100%; image-rendering: pixelated; border-radius: 6px; aspect-ratio: 128 / 80; }
        .hp-photo figcaption { font-size: .5em; color: var(--muted); margin-top: .3em; }
      `}</style>
    </figure>
  );
}

export type Mark = { v: number; label: ComponentChildren; cls?: 'hot' | 'good' | 'bad' | 'accent' };

/**
 * 256 bars, brightness 0 … 255 left to right. `ghost` draws other counts faintly behind (what the bars should be),
 * `marks` are labelled vertical lines at a brightness, `hl` lights a range of bins. Heights scale to `ymax`.
 */
export function HistChart({ bins, ghost, marks = [], ymax, height = 220, hl, axis = true, cls = 'accent' }: {
  bins: number[]; ghost?: number[]; marks?: Mark[]; ymax?: number; height?: number;
  hl?: [number, number]; axis?: boolean; cls?: string;
}) {
  const W = 1024, H = height, top = 34;
  const m = ymax ?? Math.max(...bins, ...(ghost ?? []), 1);
  const y = (c: number) => H - (H - top) * Math.min(1, c / m);
  return (
    <svg class="hc" viewBox={`0 0 ${W} ${H + (axis ? 34 : 4)}`}>
      {ghost?.map((c, v) => c > 0 && <rect x={v * 4} y={y(c)} width={3.4} height={H - y(c)} class="ghost" />)}
      {bins.map((c, v) => c > 0 && (
        <rect x={v * 4} y={y(c)} width={3.4} height={H - y(c)} class={`bar ${cls} ${hl && v >= hl[0] && v <= hl[1] ? 'lit' : ''}`} />
      ))}
      <line x1={0} y1={H + 1} x2={W} y2={H + 1} class="base" />
      {axis && [0, 64, 128, 192, 255].map((v) => (
        <text x={v * 4 + 1.7} y={H + 26} text-anchor={v === 0 ? 'start' : v === 255 ? 'end' : 'middle'} class="ax">{v}</text>
      ))}
      {marks.map((mk) => (
        <g class={`mk ${mk.cls ?? 'hot'}`}>
          <line x1={mk.v * 4 + 1.7} y1={top - 6} x2={mk.v * 4 + 1.7} y2={H} />
          <text x={mk.v * 4 + (mk.v > 200 ? -6 : 8)} y={top - 12} text-anchor={mk.v > 200 ? 'end' : 'start'}>{mk.label}</text>
        </g>
      ))}
      <style>{`
        .hc { display: block; width: 100%; overflow: visible; }
        .hc .bar { fill: var(--accent); transition: y .5s, height .5s, fill .3s; }
        .hc .bar.bad { fill: var(--bad); } .hc .bar.good { fill: var(--good); } .hc .bar.purple { fill: var(--purple); }
        .hc .bar.lit { fill: var(--hot); }
        .hc .ghost { fill: none; stroke: var(--muted); stroke-width: 1; stroke-dasharray: 2 2; }
        .hc .base { stroke: var(--line-2); stroke-width: 2; }
        .hc .ax { fill: var(--muted); font: 20px var(--mono); }
        .hc .mk line { stroke-width: 2.5; stroke-dasharray: 6 4; }
        .hc .mk text { font: 600 22px var(--sans); }
        .hc .mk.hot line { stroke: var(--hot); } .hc .mk.hot text { fill: var(--hot); }
        .hc .mk.good line { stroke: var(--good); } .hc .mk.good text { fill: var(--good); }
        .hc .mk.bad line { stroke: var(--bad); } .hc .mk.bad text { fill: var(--bad); }
        .hc .mk.accent line { stroke: var(--accent); } .hc .mk.accent text { fill: var(--accent); }
      `}</style>
    </svg>
  );
}

/** counts per brightness of IMG[from … to) */
export function countRange(from: number, to: number) {
  const h = new Array<number>(256).fill(0);
  for (let i = from; i < Math.min(to, IMG.length); i++) h[IMG[i]]++;
  return h;
}

export const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
export const fmt = (n: number) => n.toLocaleString('en-US');

/** hist_lds.hip: each block counts 16 strips of 256 pixels */
export const PER_BLOCK = 16 * BLOCK;

/** the hip kernel's text without the #include and comment lines above it (kernel.ts) */
export { body as kernelBody } from './kernel';
