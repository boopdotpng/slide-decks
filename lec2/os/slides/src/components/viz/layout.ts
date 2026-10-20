import { useLayoutEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

/**
 * Measure the rendered layout inside an island, e.g. to point an Arrow at HTML
 * elements or box a group of heatmap cells. `measure(root)` runs after layout and
 * again whenever the root or one of its children resizes; its result is returned
 * (null until the first run). Re-measures when `deps` change.
 *
 *   const geo = useMeasure(root, (el) => [...el.querySelectorAll('.card')].map((c) => box(el, c)), [d]);
 */
export function useMeasure<T>(ref: RefObject<HTMLElement>, measure: (root: HTMLElement) => T, deps: unknown[] = []) {
  const [v, setV] = useState<T | null>(null);
  const fn = useRef(measure);
  fn.current = measure;
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const run = () => setV(fn.current(el));
    run();
    const ro = new ResizeObserver(run);
    ro.observe(el);
    for (const c of el.children) ro.observe(c);
    return () => ro.disconnect();
  }, deps);
  return v;
}

export type ElBox = { x: number; y: number; w: number; h: number; r: number; b: number; cx: number; cy: number };
/** `el`'s box in px relative to `root` (left x, top y, right r, bottom b, center cx / cy) */
export function box(root: Element, el: Element): ElBox {
  const o = root.getBoundingClientRect(), q = el.getBoundingClientRect();
  const x = q.left - o.left, y = q.top - o.top;
  return { x, y, w: q.width, h: q.height, r: x + q.width, b: y + q.height, cx: x + q.width / 2, cy: y + q.height / 2 };
}
