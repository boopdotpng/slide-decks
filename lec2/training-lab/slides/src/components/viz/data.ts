import { useEffect, useRef, useState } from 'preact/hooks';
import { useSlideStep } from '../../deck/hooks';

/**
 * Load public/data/<name>.json once per page, shared by every island that asks.
 * Good for real numbers exported by a script (e.g. a model's activations), so
 * nothing on the slides is made up.
 */
const cache = new Map<string, Promise<any>>();
export function useData<T = any>(name: string): T | null {
  const [d, setD] = useState<T | null>(null);
  useEffect(() => {
    if (!cache.has(name)) cache.set(name, fetch(`${import.meta.env.BASE_URL.replace(/\/$/, '')}/data/${name}.json`).then((r) => r.json()));
    cache.get(name)!.then(setD);
  }, [name]);
  return d;
}

/**
 * What most data-driven islands start with: a root ref (put it on the island's outer element), the slide's step,
 * and one data file (null until it loads):
 *
 *   const { root, step, d } = useIsland('forward');
 *   if (!d) return <div ref={root} />;
 */
export function useIsland<T = any>(name: string) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<T>(name);
  return { root, step, d };
}
