/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep, useTicker } from 'slides/hooks';
import { H, IMG, N, W, brighten, paint } from './image';

/**
 * The job: brighten the deck's photo (image.ts), every pixel × 2, capped at 255.
 *   0 a cpu does it with a loop: one pixel after another (a marker walks the photo, the result fills in behind it)
 *   1 no pixel needs another pixel's answer
 *   2 so drop the loop: one thread per pixel, all at once (the result appears whole)
 *   3 that's the programming model
 * The 12 million is a 4000 × 3000 phone photo.
 */
const A = 2;
const OUT = brighten(IMG, A);
const PER_TICK = 24; // pixels the cpu marker moves each tick (a real core is far faster; this is so you can watch)

const LOOP = `
for (int i = 0; i < n; i++)
  out[i] = min(img[i] * 2, 255);`;
const BODY = `
// i = my number. no loop
out[i] = min(img[i] * 2, 255);`;

const TEXT: ComponentChildren[] = [
  <>a cpu: one loop, one pixel after another</>,
  <>no pixel needs another pixel's answer</>,
  <>so drop the loop: one <b>thread</b> per pixel, each told only its number <code>i</code>. {N.toLocaleString()} threads here, 12 million for a phone photo</>,
  <>the whole model: write what <b>one</b> pixel does, ask for a thread per pixel</>,
];

export default function Job() {
  const root = useRef<HTMLDivElement>(null);
  const before = useRef<HTMLCanvasElement>(null);
  const after = useRef<HTMLCanvasElement>(null);
  const step = Math.min(TEXT.length - 1, useSlideStep(root));
  const tick = useTicker(root, 30);
  const gpu = step >= 2;
  const at = gpu ? N : Math.min(N, (tick * PER_TICK) % (N + 40 * PER_TICK)); // pixels done, with a pause at the end

  useEffect(() => paint(before.current, IMG), []);
  useEffect(() => {
    // done pixels from OUT, the rest still the original
    const img = gpu ? OUT : Uint8Array.from(IMG, (p, i) => (i < at ? OUT[i] : p));
    paint(after.current, img);
  }, [at, gpu]);

  const cur = Math.min(at, N - 1);
  const mx = ((cur % W) / W) * 100, my = (Math.floor(cur / W) / H) * 100;
  return (
    <div class="job" ref={root}>
      <div class="job-top">
        <figure>
          <canvas ref={before} />
          <figcaption class="muted">the photo · {W} × {H} = {N.toLocaleString()} pixels</figcaption>
        </figure>
        <div class="job-mid">
          <div class="muted job-t">{gpu ? 'gpu: what one pixel does, once per thread' : 'cpu: a loop'}</div>
          <Code lang="c" code={gpu ? BODY : LOOP} />
          <div class="job-who">{gpu ? <><b>{N.toLocaleString()}</b> threads, at once</> : <>one core · i = <b>{cur.toLocaleString()}</b></>}</div>
        </div>
        <figure>
          <div class="job-frame">
            <canvas ref={after} />
            {!gpu && at < N && <i class="job-mark" style={{ left: `${mx}%`, top: `${my}%` }} />}
          </div>
          <figcaption class="muted">× {A}, capped at 255 (white)</figcaption>
        </figure>
      </div>
      <div class="caption job-text">{TEXT[step]}</div>
      <style>{`
        .job .job-top { display: flex; gap: 1.4em; align-items: center; justify-content: center; }
        .job figure { margin: 0; flex: none; }
        .job canvas { display: block; width: 448px; height: 280px; image-rendering: pixelated; border-radius: 6px; }
        .job figcaption { font-size: .48em; margin-top: .4em; }
        .job .job-frame { position: relative; }
        .job .job-mark { position: absolute; width: ${(100 / W) * 3}%; height: ${(100 / H) * 3}%; transform: translate(-33%, -33%);
          box-shadow: 0 0 0 2px var(--hot); border-radius: 2px; }
        .job .job-mid { flex: none; width: 15em; font-size: .9em; }
        .job .job-mid pre { margin: 0; font-size: .58em; }
        .job .job-t { font-size: .5em; margin-bottom: .3em; }
        .job .job-who { font: .52em var(--mono); margin-top: .6em; color: var(--muted); }
        .job .job-who b { color: var(--hot); }
        .job .job-text { font-size: .8em; min-height: 3.2em; margin-top: 1.1em; }
      `}</style>
    </div>
  );
}
