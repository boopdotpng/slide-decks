/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';
import { H, IMG, N, W, brighten, paint } from './image';

/**
 * brighten (the intro deck's photo, × 2 capped at 255) laid out the way a Blackhole program would be. Hypothetical:
 * blackhole-py has no brighten kernel; this follows the shape every tile program has in boop-docs (intro.md,
 * hardware/architecture.md): data movers read from dram into L1, unpack feeds the engines, the math controller
 * drives them, pack writes back to L1, a data mover writes out. Brighten is elementwise, so the work is the SFPU's
 * (32-lane vector unit), not the matrix engine's. The photo is cut into 32 × 32 blocks (a common unit on this chip);
 * the pipeline chart is a schematic of the overlap, not a measured schedule.
 */
const B = 32;
const BC = W / B, BR = Math.ceil(H / B); // 4 × 3 blocks (the bottom row is 16 pixels tall)
const BLOCKS = BC * BR;
const PHONE = Math.ceil(12_000_000 / (B * B)), WORKERS = 117;

const K = 4; // blocks one tile streams through, in the chart
const STAGES = [
  { who: 'ncrisc', what: 'read block k into L1' },
  { who: 'trisc0', what: 'unpack' },
  { who: 'trisc1', what: '× 2, cap (vector unit)' },
  { who: 'trisc2', what: 'pack' },
  { who: 'brisc', what: 'write block k out' },
];
const SLOTS = K + STAGES.length - 1;

type View = 'threads' | 'blocks' | 'pipe' | 'done';
const STEPS: { view: View; text: ComponentChildren }[] = [
  { view: 'threads', text: <>on the gpu: one <b>thread</b> per pixel, {N.toLocaleString()} of them, and the hardware did the rest</> },
  { view: 'blocks', text: <>here: cut the photo into 32 × 32 blocks, and <b>you</b> hand them to tiles. a phone photo is ~{PHONE.toLocaleString()} blocks: ~{Math.round(PHONE / WORKERS)} for each of {WORKERS} tiles</> },
  { view: 'pipe', text: <>inside a tile, five programs pass each block down an assembly line through L1. reading block k+1 while brightening block k is how <i>you</i> hide memory: no warps to switch to</> },
  { view: 'done', text: <>no tile needs another tile's pixels, so the network between tiles stays quiet. that's the easy case, same as on a gpu</> },
];

export default function TtBrighten() {
  const root = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLCanvasElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const { view, text } = STEPS[k];
  useEffect(() => paint(photo.current, view === 'done' ? brighten(IMG, 2) : IMG), [view === 'done']);
  const pct = (a: number, b: number) => `${(a / b) * 100}%`;
  return (
    <div class="ttbr" ref={root}>
      <div class="br-cols">
        <div class="br-left">
          <div class="br-img">
            <canvas ref={photo} />
            {view !== 'threads' && Array.from({ length: BLOCKS }, (_, b) => {
              const c = b % BC, r = Math.floor(b / BC);
              return (
                <i class={`br-blk ${view === 'pipe' && b === 5 ? 'me' : ''}`}
                  style={{ left: pct(c * B, W), top: pct(r * B, H), width: pct(B, W), height: pct(Math.min(B, H - r * B), H) }}>
                  <span>tile {b}</span>
                </i>
              );
            })}
          </div>
          <div class="muted br-cap">
            {view === 'threads' ? `${W} × ${H} pixels = ${N.toLocaleString()} threads` : `${BC} × ${BR} blocks → ${BLOCKS} tiles (the bottom row is half height)`}
          </div>
        </div>
        <div class={`br-pipe fade ${view === 'pipe' ? 'on' : ''}`}>
          <div class="muted br-pt">tile 5, streaming its blocks</div>
          {STAGES.map((s, i) => (
            <div class="br-row">
              <span class="br-who"><b>{s.who}</b> <span class="muted">{s.what}</span></span>
              {Array.from({ length: SLOTS }, (_, t) => {
                const b = t - i;
                return <i class={b >= 0 && b < K ? (i === 2 ? 'math' : 'k') : ''}>{b >= 0 && b < K ? b : ''}</i>;
              })}
            </div>
          ))}
          <div class="muted br-note">a sketch of the overlap, not a measured schedule</div>
        </div>
      </div>
      <div class="caption br-text">{text}</div>
      <style>{`
        .ttbr .br-cols { display: flex; gap: 2.4em; align-items: center; min-height: 340px; }
        .ttbr .br-left { flex: none; width: 480px; }
        .ttbr .br-img { position: relative; }
        .ttbr canvas { display: block; width: 100%; aspect-ratio: ${W} / ${H}; image-rendering: pixelated; border-radius: 4px; }
        .ttbr .br-blk { position: absolute; box-shadow: inset 0 0 0 1.5px var(--accent); }
        .ttbr .br-blk span { position: absolute; top: 4px; left: 6px; font: normal .42em var(--mono); color: var(--accent); }
        .ttbr .br-blk.me { box-shadow: inset 0 0 0 3px var(--hot); background: color-mix(in srgb, var(--hot) 15%, transparent); }
        .ttbr .br-blk.me span { color: var(--hot); }
        .ttbr .br-cap { font-size: .46em; margin-top: .5em; }
        .ttbr .br-pipe { flex: 1; font-size: .5em; }
        .ttbr .br-pt { margin-bottom: .5em; }
        .ttbr .br-row { display: grid; grid-template-columns: 15em repeat(${SLOTS}, 1fr); gap: 4px; margin-bottom: 4px; align-items: center; }
        .ttbr .br-who { white-space: nowrap; }
        .ttbr .br-row i { height: 1.9em; border-radius: 4px; background: var(--sunken); font: normal .9em/1.9em var(--mono); text-align: center; }
        .ttbr .br-row i.k { background: var(--accent); color: var(--on-color); }
        .ttbr .br-row i.math { background: var(--hot); color: var(--on-color); }
        .ttbr .br-note { margin-top: .5em; font-size: .85em; }
        .ttbr .br-text { font-size: .8em; min-height: 2.6em; margin-top: .8em; }
      `}</style>
    </div>
  );
}
