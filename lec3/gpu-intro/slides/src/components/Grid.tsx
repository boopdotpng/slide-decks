/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep, useTicker } from 'slides/hooks';
import { Tex } from 'slides/viz';
import { BLOCK, H, IMG, N, W, WAVE, brighten, paint } from './image';

/**
 * The photo as a grid of blocks: 256 threads = 2 rows each, 40 of them, each block 8 waves. Then the blocks dealt out
 * to the 32 wgps and finishing (each finished block drawn brightened, × 2).
 *
 * The dealing is a cartoon: blocks start in order, a few per tick, on a made-up wgp each, and run for made-up times.
 * amd documents that the hardware starts a block's waves on a wgp with room for them, not the order, the placement or
 * the speed. On the real chip all 40 of our blocks fit at once (a wgp parks 64 waves = 8 of these blocks).
 */
const BLOCKS = N / BLOCK; // 40
const ROWS = BLOCK / W; // 2 rows per block
const WGPS = 32;
const ME = { block: 5, thread: 37 };
const MINE = ME.block * BLOCK + ME.thread;

const hash = (n: number) => {
  let h = Math.imul(n ^ 0x5bd1e995, 0x27d4eb2d);
  h ^= h >>> 15;
  return ((Math.imul(h, 0x165667b1) ^ (h >>> 13)) >>> 0) / 4294967296;
};
/** made-up: which wgp, when it starts, how long it runs */
const WGP_OF = Array.from({ length: BLOCKS }, (_, b) => Math.floor(hash(b + 11) * WGPS));
const START = Array.from({ length: BLOCKS }, (_, b) => Math.floor(b * 0.5));
const LEN = Array.from({ length: BLOCKS }, (_, b) => 10 + Math.floor(hash(b + 97) * 26));
const END = Math.max(...START.map((s, b) => s + LEN[b]));
const PERIOD = END + 14; // hold the finished photo, then start over

const TEXT: ComponentChildren[] = [
  <>threads come in <b>blocks</b>: here 256 threads, 2 rows of pixels, 8 warps. {BLOCKS} blocks make the <b>grid</b></>,
  <>which pixel is mine? <Tex tex={`\\text{blockIdx} \\times \\text{blockDim} + \\text{threadIdx}`} />. block {ME.block}, thread {ME.thread}: pixel {MINE}</>,
  <>a block runs on one processor; its threads can share a scratchpad and wait for each other. blocks go wherever there's room</>,
  <>in any order, so blocks never depend on each other</>,
];

type State = 'wait' | 'run' | 'done';

export default function Grid() {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const k = Math.min(TEXT.length - 1, useSlideStep(root));
  const tick = useTicker(root, 120);
  const t = k >= 2 ? tick % PERIOD : -1;
  const state = (b: number): State => (t < START[b] ? 'wait' : t < START[b] + LEN[b] ? 'run' : 'done');
  const states = Array.from({ length: BLOCKS }, (_, b) => (k < 2 ? 'wait' : state(b)));
  const doneKey = states.map((s) => (s === 'done' ? 1 : 0)).join('');

  useEffect(() => {
    const bright = brighten(IMG, 2);
    const img = Uint8Array.from(IMG, (p, i) => (states[Math.floor(i / BLOCK)] === 'done' ? bright[i] : p));
    paint(canvas.current, img);
  }, [doneKey]);

  const pct = (n: number, of: number) => `${(100 * n) / of}%`;
  return (
    <div class="grid-view" ref={root}>
      <div class="gv-cols">
        <div class="gv-photo">
          <canvas ref={canvas} />
          {Array.from({ length: BLOCKS }, (_, b) => (
            <div class={`gv-blk ${states[b]} ${k < 2 && b === ME.block ? 'me' : ''}`}
              style={{ top: pct(b * ROWS, H), height: pct(ROWS, H) }}>
              {k < 2 && b === ME.block && Array.from({ length: BLOCK / WAVE }, (_, w) => (
                <i class="gv-wave" style={{ left: pct((w % 4) * WAVE, W), top: w < 4 ? '0' : '50%', width: pct(WAVE, W) }} />
              ))}
            </div>
          ))}
          {k === 1 && (
            <div class="gv-mine" style={{ left: pct(MINE % W, W), top: pct(Math.floor(MINE / W), H), width: pct(1, W), height: pct(1, H) }} />
          )}
        </div>
        {k < 2 && (
          <div class="gv-zoom">
            <div class="muted gv-t">block {ME.block}, enlarged: 2 rows of 128 pixels, 8 warps of 32</div>
            {[0, 1].map((r) => (
              <div class="gv-zrow">
                {Array.from({ length: 4 }, (_, q) => {
                  const w = r * 4 + q;
                  return (
                    <div class="gv-zw">
                      <div class="gv-px">
                        {Array.from({ length: WAVE }, (_, l) => {
                          const i = ME.block * BLOCK + w * WAVE + l;
                          return <i class={k === 1 && i === MINE ? 'mine' : ''} style={{ background: `color-mix(in srgb, white ${(100 * IMG[i]) / 255}%, black)` }} />;
                        })}
                      </div>
                      <span class="muted">warp {w} · threads {w * WAVE}–{w * WAVE + WAVE - 1}</span>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}
        <div class={`gv-wgps fade ${k >= 2 ? 'on' : ''}`} style={{ display: k < 2 ? 'none' : undefined }}>
          <div class="muted gv-t">the 32 processors, and the blocks running on them</div>
          <div class="gv-tiles">
            {Array.from({ length: WGPS }, (_, w) => (
              <div class="gv-wgp">
                {states.map((s, b) => (s === 'run' && WGP_OF[b] === w ? <b>{b}</b> : null))}
              </div>
            ))}
          </div>
          <div class="gv-leg muted">
            <span><i class="run" /> running</span><span><i class="done" /> finished (drawn brightened)</span>
          </div>
        </div>
      </div>
      <div class="caption gv-text">{TEXT[k]}</div>
      <style>{`
        .grid-view .gv-cols { display: flex; gap: 1.6em; align-items: flex-start; }
        .grid-view .gv-photo { position: relative; flex: none; width: 720px; aspect-ratio: ${W} / ${H}; }
        .grid-view canvas { width: 100%; height: 100%; display: block; image-rendering: pixelated; border-radius: 4px; }
        .grid-view .gv-blk { position: absolute; left: 0; right: 0; box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--fg) 22%, transparent);
          transition: background .25s, box-shadow .25s; }
        .grid-view .gv-blk.run { background: color-mix(in srgb, var(--accent) 30%, transparent); }
        .grid-view .gv-blk.me { box-shadow: inset 0 0 0 3px var(--hot); z-index: 1; }
        .grid-view .gv-wave { position: absolute; height: 50%; box-shadow: inset 0 0 0 1px var(--hot);
          background: color-mix(in srgb, var(--hot) 18%, transparent); }
        .grid-view .gv-mine { position: absolute; background: var(--hot); outline: 3px solid var(--hot); outline-offset: 3px; z-index: 2; }
        .grid-view .gv-wgps, .grid-view .gv-zoom { flex: 1; min-width: 0; }
        .grid-view .gv-zrow { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 10px; }
        .grid-view .gv-px { display: grid; grid-template-columns: repeat(${WAVE}, 1fr); height: 64px; border-radius: 4px; overflow: visible;
          box-shadow: 0 0 0 2px var(--hot); }
        .grid-view .gv-px i { position: relative; }
        .grid-view .gv-px i.mine { outline: 3px solid var(--accent); outline-offset: 1px; z-index: 1; }
        .grid-view .gv-zw span { display: block; font-size: .36em; margin-top: .35em; white-space: nowrap; }
        .grid-view .gv-t { font-size: .5em; margin-bottom: .4em; }
        .grid-view .gv-tiles { display: grid; grid-template-columns: repeat(8, 1fr); gap: 5px; }
        .grid-view .gv-wgp { min-height: 74px; border-radius: 7px; background: var(--panel); border: 1px solid var(--line);
          display: flex; flex-wrap: wrap; gap: 3px; padding: 4px; align-content: flex-start; }
        .grid-view .gv-wgp b { font: 600 .38em/1.6 var(--mono); padding: 0 .3em; border-radius: 4px; background: var(--accent); color: var(--on-color); }
        .grid-view .gv-leg { display: flex; gap: 1.4em; font-size: .46em; margin-top: .6em; }
        .grid-view .gv-leg i { display: inline-block; width: 1em; height: 1em; border-radius: 3px; vertical-align: -.12em; }
        .grid-view .gv-leg i.run { background: var(--accent); }
        .grid-view .gv-leg i.done { background: var(--muted); }
        .grid-view .gv-text { font-size: .76em; min-height: 3.3em; margin-top: .7em; }
      `}</style>
    </div>
  );
}
