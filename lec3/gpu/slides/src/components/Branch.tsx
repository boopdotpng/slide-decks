/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';
import { DARK, IMG, N, W, H, WAVE, paint, shadows } from './image';
import { gray, ink } from './Wave';

/**
 * A branch, one instruction stream for 32 threads: lift the shadows (p < DARK → p × 2, else leave it), image.ts's
 * shadows(). Wave 166 (row 41, columns 64 … 95) crosses the hills twice, so its lanes disagree. The compare writes
 * one bit per lane into the exec mask; lanes whose bit is 0 sit through "× 2" and "store" doing nothing. The counts
 * of mixed / all-dark / all-light waves are over the whole photo.
 */
const WV = 166;
const ROW = Math.floor((WV * WAVE) / W), COL = (WV * WAVE) % W;
const P = Array.from(IMG.slice(WV * WAVE, WV * WAVE + WAVE));
const ON = P.map((p) => p < DARK);
const COUNT = ON.filter(Boolean).length;
const OUT = shadows(IMG);

const KINDS = (() => {
  let mixed = 0, all = 0, none = 0;
  for (let w = 0; w < N / WAVE; w++) {
    const d = Array.from(IMG.slice(w * WAVE, w * WAVE + WAVE)).filter((p) => p < DARK).length;
    if (d === WAVE) all++; else if (d === 0) none++; else mixed++;
  }
  return { mixed, all, none };
})();

const OPS = ['load my pixel', `is it < ${DARK}?`, '× 2', 'store'];
type St = { op: number; cmp: boolean; exec: boolean; x2: boolean; stored: boolean; kinds: boolean; text: ComponentChildren };
const STEPS: St[] = [
  { op: 0, cmp: false, exec: false, x2: false, stored: false, kinds: false,
    text: <>a new job: lift only the shadows. a pixel darker than {DARK} gets × 2, the rest stay. each thread decides for itself, but a wave's 32 threads share one instruction stream: they can't go separate ways</> },
  { op: 1, cmp: true, exec: false, x2: false, stored: false, kinds: false,
    text: <><b>is it &lt; {DARK}?</b>: one instruction, 32 answers. this wave is on the horizon: hills, sky, hills, sky. {COUNT} lanes say yes</> },
  { op: 1, cmp: true, exec: true, x2: false, stored: false, kinds: false,
    text: <>the answers become the wave's <b>exec mask</b>: one on / off bit per lane. every instruction from here on only does anything in the lanes that are on</> },
  { op: 2, cmp: true, exec: true, x2: true, stored: false, kinds: false,
    text: <><b>× 2</b> runs for the whole wave. the {COUNT} lanes that are on double their pixel. the {WAVE - COUNT} that are off sit through it, doing nothing</> },
  { op: 3, cmp: true, exec: true, x2: true, stored: true, kinds: false,
    text: <><b>store</b>: only the lanes that are on write. the sky is untouched. then the mask goes back to all on, and the wave carries on together</> },
  { op: 3, cmp: true, exec: true, x2: true, stored: true, kinds: true,
    text: <>in the whole photo: a wave that's all sky has a mask of all zeros and jumps over the × 2 entirely. one that's all dark does it at full use. only {KINDS.mixed} of {N / WAVE} waves are mixed and pay for lanes that wait</> },
  { op: 3, cmp: true, exec: true, x2: true, stored: true, kinds: true,
    text: <>so an <code>if</code> only saves time when the <b>whole wave</b> agrees. an if / else runs both sides, one after the other, with opposite masks. keep neighbouring threads doing the same thing</> },
];

export default function Branch() {
  const root = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLCanvasElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  useEffect(() => paint(photo.current, st.stored ? Uint8Array.from(IMG, (p, i) => (Math.floor(i / WAVE) === WV ? OUT[i] : p)) : IMG), [st.stored]);
  const val = (l: number) => (st.x2 && ON[l] ? P[l] * 2 : P[l]);
  const off = (l: number) => st.exec && !ON[l];
  return (
    <div class="branch" ref={root}>
      <div class="br-top">
        <div class="br-photo">
          <canvas ref={photo} />
          <i class="br-seg" style={{ top: `${(ROW / H) * 100}%`, height: `${100 / H}%`, left: `${(COL / W) * 100}%`, width: `${(WAVE / W) * 100}%` }} />
          <div class="muted br-cap">wave {WV}: row {ROW}, columns {COL} … {COL + WAVE - 1}</div>
        </div>
        <ol class="br-ops">{OPS.map((o, i) => <li class={i === st.op ? 'cur' : i < st.op ? 'past' : ''}>{o}</li>)}</ol>
        <div class={`br-kinds fade ${st.kinds ? 'on' : ''}`}>
          <div><span class="br-mask">{'1'.repeat(WAVE)}</span><b>{KINDS.all}</b> waves all dark (hills, lake): full use</div>
          <div><span class="br-mask off">{'0'.repeat(WAVE)}</span><b>{KINDS.none}</b> all light (sky): skipped</div>
          <div><span class="br-mask mix">{ON.map((b) => (b ? 1 : 0)).join('')}</span><b>{KINDS.mixed}</b> mixed, like this one: some lanes wait</div>
        </div>
      </div>
      <div class="br-grid">
        <span class="br-n muted">lane</span>
        {P.map((_, l) => <span class="br-h">{l}</span>)}
        <span class="br-n">p</span>
        {P.map((_, l) => (
          <span class={`br-c ${off(l) ? 'off' : ''} ${st.x2 && ON[l] ? 'chg' : ''}`} style={{ background: gray(val(l)), color: ink(val(l)) }}>{val(l)}</span>
        ))}
        <span class="br-n muted">&lt; {DARK}?</span>
        {P.map((_, l) => <span class={`br-y fade ${st.cmp ? 'on' : ''} ${ON[l] ? 'yes' : 'no'}`}>{ON[l] ? 'yes' : 'no'}</span>)}
        <span class="br-n">exec</span>
        {P.map((_, l) => <span class={`br-b ${st.exec ? (ON[l] ? 'one' : 'zero') : 'blank'}`}>{st.exec ? (ON[l] ? 1 : 0) : 1}</span>)}
      </div>
      <div class="caption br-text">{st.text}</div>
      <style>{`
        .branch .br-top { display: flex; gap: 2.2em; align-items: flex-start; }
        .branch .br-photo { position: relative; flex: none; }
        .branch canvas { display: block; width: 256px; height: 160px; image-rendering: pixelated; border-radius: 4px; }
        .branch .br-seg { position: absolute; box-shadow: 0 0 0 2.5px var(--hot); }
        .branch .br-cap { font-size: .42em; margin-top: .35em; }
        .branch .br-ops { font-size: .56em; margin: 0; padding-left: 1.3em; white-space: nowrap; }
        .branch .br-ops li { margin: .15em 0; color: var(--muted); transition: color .3s; }
        .branch .br-ops li.past { color: var(--fg); } .branch .br-ops li.cur { color: var(--hot); font-weight: 700; }
        .branch .br-kinds { margin-left: auto; font-size: .52em; display: flex; flex-direction: column; gap: .45em; }
        .branch .br-kinds b { color: var(--hot); margin-right: .3em; }
        .branch .br-mask { font-family: var(--mono); font-size: .8em; margin-right: .8em; padding: .1em .4em; border-radius: 4px; background: var(--fill-green); }
        .branch .br-mask.off { background: var(--surface); color: var(--faint); }
        .branch .br-mask.mix { background: var(--fill-amber); }
        .branch .br-grid { display: grid; grid-template-columns: 3.4em repeat(${WAVE}, 1fr); gap: 3px; font-family: var(--mono);
          align-items: center; margin-top: 1.1em; }
        .branch .br-n { font-size: .46em; white-space: nowrap; }
        .branch .br-h { font-size: .36em; color: var(--muted); text-align: center; }
        .branch .br-c { outline: 1px solid var(--line); outline-offset: -1px; font-size: .4em; text-align: center; border-radius: 4px; padding: .5em 0; transition: opacity .3s, background .4s; }
        .branch .br-c.off { opacity: .3; }
        .branch .br-c.chg { box-shadow: 0 0 0 2px var(--hot); }
        .branch .br-y { font-size: .34em; text-align: center; }
        .branch .br-y.yes { color: var(--good); } .branch .br-y.no { color: var(--muted); }
        .branch .br-b { font-size: .4em; text-align: center; border-radius: 4px; padding: .3em 0; background: var(--surface); transition: background .3s, color .3s; }
        .branch .br-b.one { background: var(--fill-green); } .branch .br-b.zero { color: var(--faint); }
        .branch .br-b.blank { color: var(--faint); }
        .branch .br-text { font-size: .76em; min-height: 3.3em; margin-top: .9em; }
      `}</style>
    </div>
  );
}
