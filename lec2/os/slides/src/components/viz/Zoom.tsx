/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';

/**
 * A zoomable picture (from the risc-v deck's "all of it at once" slide): one
 * drawing where any rect can hold a whole nested view, and a camera that flies
 * between rects as the step changes. Every view, outer or nested, is drawn in
 * the same ZOOM_W × ZOOM_H coordinates; <ZoomView at={rect}> shrinks a view into
 * a rect of its parent, so nesting goes as deep as you like. nest() turns a
 * rect several views down into outer coordinates, for the camera.
 *
 *   const CPU: Rect = [80, 120, 700, 333];          // in the outer view
 *   const CORE: Rect = [60, 140, 500, 238];         // inside CPU's view
 *   const CAMERA = [ZOOM_FULL, CPU, nest(CPU, CORE)];
 *
 *   <div class="fill">                               // the stage needs a height
 *     <ZoomStage camera={CAMERA[step]}>
 *       <text …>machine</text>
 *       <ZoomView at={CPU}>
 *         <text …>cpu</text>
 *         <ZoomView at={CORE}>…</ZoomView>
 *       </ZoomView>
 *     </ZoomStage>
 *   </div>
 *
 * The stage fills its container and the view's height follows the container's
 * shape, so nothing gets letterboxed. Nested views keep the ZOOM_W × ZOOM_H shape:
 * if the window is taller, the parent would peek out above and below a zoomed-in
 * view, so bands in the background color cover it once the camera settles.
 */

export type Rect = [x: number, y: number, w: number, h: number];
export const ZOOM_W = 1600, ZOOM_H = 760;
export const ZOOM_FULL: Rect = [0, 0, ZOOM_W, ZOOM_H];

/** first rect in outer coordinates, each next one inside the previous one's view → outer coordinates */
export function nest(...rects: Rect[]): Rect {
  return rects.reduce(([px, py, pw], [x, y, w, h]) => {
    const s = pw / ZOOM_W;
    return [px + x * s, py + y * s, w * s, h * s];
  });
}

/** a full ZOOM_W × ZOOM_H view, shrunk into `at` (keep at's shape ZOOM_W:ZOOM_H) */
export function ZoomView({ at: [x, y, w], children }: { at: Rect; children: ComponentChildren }) {
  return <g transform={`translate(${x} ${y}) scale(${w / ZOOM_W})`}>{children}</g>;
}

export function ZoomStage({ camera, margin = 1.04, ms = 1100, bands = true, children }: {
  /** the rect to frame, in outer coordinates (use nest() for nested ones) */
  camera: Rect;
  /** room around the framed rect: 1 = edge to edge */
  margin?: number;
  /** camera flight time */
  ms?: number;
  /** cover the parent peeking above / below a zoomed-in view */
  bands?: boolean;
  children: ComponentChildren;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const [vh, setVh] = useState(ZOOM_H);
  useEffect(() => {
    const el = stage.current!;
    const ro = new ResizeObserver(() => el.clientWidth && setVh(ZOOM_W * el.clientHeight / el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const [x, y, w, h] = camera;
  const s = Math.min(ZOOM_W / (w * margin), vh / (h * margin));
  const top = (vh - h * s) / 2;
  const tx = (ZOOM_W - w * s) / 2 - x * s, ty = top - y * s;

  return (
    <div class="zoom-stage" ref={stage} style={{ '--zoom-ms': `${ms}ms` }}>
      <svg viewBox={`0 0 ${ZOOM_W} ${vh}`}>
        <g class="zoom-cam" style={{ transform: `translate(${tx}px, ${ty}px) scale(${s})` }}>{children}</g>
        {bands && [[-vh, top - 8], [top + h * s + 8, 2 * vh]].map(([y0, y1]) => y1 > y0 && (
          <rect key={camera.join()} class="zoom-band" x={0} y={y0} width={ZOOM_W} height={y1 - y0} />
        ))}
      </svg>
    </div>
  );
}
