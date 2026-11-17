/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';
import { H, IMG, N, W, WAVE, paint } from './image';

/**
 * A thread, then a wave: one row of the photo (image.ts) is 128 threads = 4 waves. Row 22 goes through the sun, so
 * its last wave (columns 96 … 127) has pixels that × 2 pushes past 255 and the cap matters. One wave's 32 lanes go
 * through the four steps of brighten, one instruction per step, all 32 values at once.
 */
export const ROW = 22, WV = 3;
const A = 2;
const base = ROW * W + WV * WAVE;
const P = Array.from(IMG.slice(base, base + WAVE));
const ME = 5; // the thread we follow on step 0: lane 5 of the wave

/** a pixel's own gray, as a css color (data, not a theme color) */
export const gray = (p: number) => `rgb(${p},${p},${p})`; // colors-ok: a pixel's gray value is data
export const ink = (p: number) => (p > 100 ? 'rgb(0,0,0)' : 'rgb(235,235,235)'); // colors-ok: text readable on that gray

const OPS = ['load my pixel', `× ${A}`, 'cap at 255', 'store'];
type St = { wave: boolean; op: number; vals: (number | null)[]; stored: boolean; text: ComponentChildren };
const x2 = P.map((p) => p * A), cap = x2.map((p) => Math.min(p, 255));
const capped = x2.filter((p) => p > 255).length;
const STEPS: St[] = [
  { wave: false, op: -1, vals: [], stored: false,
    text: <>a <b>thread</b>: its number <code>i</code>, its pixel, four steps</> },
  { wave: false, op: -1, vals: [], stored: false,
    text: <>32 neighbouring threads share one stream of instructions: a <b>warp</b> (nvidia) or <b>wave</b> (amd)</> },
  { wave: true, op: 0, vals: P, stored: false,
    text: <><b>load</b>: one instruction, 32 different pixels</> },
  { wave: true, op: 2, vals: cap, stored: false,
    text: <><b>× {A}</b>, <b>cap</b>: one instruction each, 32 lanes at once</> },
  { wave: true, op: 3, vals: cap, stored: true,
    text: <><b>store</b>: 32 pixels done. the whole photo is {N / WAVE} warps doing exactly this</> },
];

export default function Wave() {
  const root = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLCanvasElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  const done = st.stored;
  useEffect(() => {
    const img = Uint8Array.from(IMG);
    if (done) for (let l = 0; l < WAVE; l++) img[base + l] = cap[l];
    paint(photo.current, img);
  }, [done]);
  const row = Array.from(IMG.slice(ROW * W, ROW * W + W), (p, c) => (done && Math.floor(c / WAVE) === WV ? cap[c - WV * WAVE] : p));
  return (
    <div class="wave" ref={root}>
      <div class="wv-top">
        <div class="wv-photo">
          <canvas ref={photo} />
          <i class="wv-band" style={{ top: `${(ROW / H) * 100}%`, height: `${100 / H}%` }} />
          <i class={`wv-seg fade ${k >= 1 ? 'on' : ''}`} style={{ top: `${(ROW / H) * 100}%`, height: `${100 / H}%`, left: `${(WV * WAVE / W) * 100}%`, width: `${(WAVE / W) * 100}%` }} />
        </div>
        <div class="wv-row">
          <div class="muted wv-t">row {ROW}: {W} pixels, one thread each</div>
          <div class="wv-strip">
            {row.map((p, c) => <i style={{ background: gray(p) }} class={k >= 1 && Math.floor(c / WAVE) === WV ? 'in' : ''} />)}
          </div>
          <div class={`wv-waves fade ${k >= 1 ? 'on' : ''}`}>
            {[0, 1, 2, 3].map((w) => <span class={w === WV ? 'cur' : ''}>warp {w}</span>)}
          </div>
        </div>
      </div>

      {!st.wave ? (
        <div class="wv-thread">
          <div class="wv-card">
            <div class="wv-ct">thread <b>{base + ME}</b></div>
            <div class="wv-regs">
              <span><span class="muted">i</span> {base + ME}</span>
              <span><span class="muted">p</span> <i class="wv-sw" style={{ background: gray(P[ME]) }} /> {P[ME]} → {Math.min(P[ME] * A, 255)}</span>
            </div>
          </div>
          <ol class="wv-ops">{OPS.map((o) => <li>{o}</li>)}</ol>
        </div>
      ) : (
        <div class="wv-lanes">
          <ol class="wv-ops">{OPS.map((o, i) => <li class={i === st.op ? 'cur' : i < st.op ? 'past' : ''}>{o}</li>)}</ol>
          <div class="wv-grid">
            <span class="wv-n muted">lane</span>
            {P.map((_, l) => <span class="wv-h">{l}</span>)}
            <span class="wv-n">p</span>
            {st.vals.map((v, l) => (
              <span class={`wv-c ${!st.stored ? 'new' : ''} ${v != null && v > 255 ? 'over' : ''}`} key={`${k}-${l}`}
                style={v != null ? { background: gray(Math.min(v, 255)), color: ink(Math.min(v, 255)) } : {}}>{v}</span>
            ))}
            <span />
            <span class="wv-foot muted">lane k is thread {base} + k: one register, 32 values, one per lane</span>
          </div>
        </div>
      )}
      <div class="caption wv-text">{st.text}</div>
      <style>{`
        .wave .wv-top { display: flex; gap: 1.6em; align-items: center; }
        .wave .wv-photo { position: relative; flex: none; }
        .wave canvas { display: block; width: 256px; height: 160px; image-rendering: pixelated; border-radius: 4px; }
        .wave .wv-band { position: absolute; left: -6px; right: -6px; box-shadow: 0 0 0 1.5px var(--accent); }
        .wave .wv-seg { position: absolute; box-shadow: 0 0 0 2.5px var(--hot); }
        .wave .wv-row { flex: 1; min-width: 0; }
        .wave .wv-t { font-size: .48em; margin-bottom: .3em; }
        .wave .wv-strip { outline: 1px solid var(--line); display: grid; grid-template-columns: repeat(${W}, 1fr); height: 44px; border-radius: 4px; overflow: hidden; }
        .wave .wv-strip i { transition: background .4s; }
        .wave .wv-strip i.in { box-shadow: inset 0 -4px 0 var(--hot); }
        .wave .wv-waves { display: grid; grid-template-columns: repeat(4, 1fr); font-size: .46em; margin-top: .25em; }
        .wave .wv-waves span { border-left: 2px solid var(--line-2); padding-left: .4em; color: var(--muted); }
        .wave .wv-waves span.cur { color: var(--hot); border-color: var(--hot); }
        .wave .wv-thread { display: flex; gap: 2.4em; align-items: center; margin-top: 1.2em; min-height: 7.2em; }
        .wave .wv-card { background: var(--panel); border: 1px solid var(--accent); border-radius: 12px; padding: .6em 1em; font-size: .62em; }
        .wave .wv-ct { margin-bottom: .4em; }
        .wave .wv-regs { display: flex; flex-direction: column; gap: .3em; font-family: var(--mono); }
        .wave .wv-sw { display: inline-block; width: .9em; height: .9em; border-radius: 2px; vertical-align: -.1em; box-shadow: 0 0 0 1px var(--line-2); }
        .wave .wv-ops { font-size: .56em; margin: 0; padding-left: 1.3em; }
        .wave .wv-ops li { margin: .15em 0; color: var(--fg); transition: color .3s; }
        .wave .wv-lanes .wv-ops li { color: var(--muted); }
        .wave .wv-lanes .wv-ops li.past { color: var(--fg); }
        .wave .wv-lanes .wv-ops li.cur { color: var(--hot); font-weight: 700; }
        .wave .wv-lanes { display: flex; gap: 1.4em; align-items: center; margin-top: 1.2em; min-height: 7.2em; }
        .wave .wv-lanes .wv-ops { flex: none; width: 8.4em; white-space: nowrap; }
        .wave .wv-grid { flex: 1; display: grid; grid-template-columns: 2.4em repeat(${WAVE}, 1fr); gap: 3px; font-family: var(--mono); align-items: center; }
        .wave .wv-n { font-size: .5em; }
        .wave .wv-h { font-size: .36em; color: var(--muted); text-align: center; }
        .wave .wv-foot { grid-column: 2 / -1; font: .4em var(--sans); margin-top: .3em; }
        .wave .wv-c { font-size: .4em; text-align: center; border-radius: 4px; padding: .5em 0; background: var(--surface); outline: 1px solid var(--line); outline-offset: -1px; }
        .wave .wv-c.over { outline: 2px solid var(--bad); }
        .wave .wv-c.new { animation: wv-pop .5s ease-out; }
        @keyframes wv-pop { from { box-shadow: 0 0 0 2px var(--hot); } to { box-shadow: 0 0 0 2px transparent; } }
        .wave .wv-text { font-size: .78em; min-height: 3.2em; margin-top: 1em; }
      `}</style>
    </div>
  );
}
