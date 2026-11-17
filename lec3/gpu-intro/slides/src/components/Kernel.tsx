/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import { BLOCK, H, IMG, N, W, paint } from './image';

/**
 * The code, in cuda (the live coding after this is cuda on leetgpu): brighten as a 1d kernel and its launch, then
 * the same thing in 2d (a 16 × 16 block per tile of the photo), then a warm-up for the live coding: vector add with
 * the two lines this slide is about left blank. Not compiled here; standard cuda (min() on ints is a cuda device
 * function).
 */
const K1 = `__global__ void brighten(unsigned char *img, int n, int a) {
  int i = blockIdx.x * blockDim.x + threadIdx.x;
  if (i < n) img[i] = min(img[i] * a, 255);
}

brighten<<<(n + 255) / 256, 256>>>(img, n, 2);`;

const K2 = `__global__ void brighten2d(unsigned char *img, int w, int h, int a) {
  int x = blockIdx.x * blockDim.x + threadIdx.x;   // column
  int y = blockIdx.y * blockDim.y + threadIdx.y;   // row
  if (x < w && y < h) img[y * w + x] = min(img[y * w + x] * a, 255);
}

dim3 block(16, 16), grid((w + 15) / 16, (h + 15) / 16);
brighten2d<<<grid, block>>>(img, w, h, 2);`;

const K3 = `__global__ void vector_add(const float *a, const float *b, float *c, int n) {
  int i = ...;       // which element is mine?
  if (...) return;   // am i past the end?
  c[i] = a[i] + b[i];
}`;

const T = 16, BX = 5, BY = 1, TX = 9, TY = 6; // the block and thread we point at
const PX = BX * T + TX, PY = BY * T + TY;
const VN = 12, VI = 5; // the arrays drawn, and the thread we point at
const NB = N / BLOCK, ME = { b: 5, t: 37 }; // the grid slide's block and thread
const ODD = 10000, ODD_B = Math.ceil(ODD / BLOCK); // a size that isn't a multiple of 256

type St = { code: 1 | 2 | 3; hl: number[]; pic: 'strip' | 'tiles' | 'vec'; strip?: 'me' | 'odd' | 'launch'; text: ComponentChildren };
const STEPS: St[] = [
  { code: 1, hl: [], pic: 'strip', text: <>the whole kernel: what <b>one</b> pixel does, in cuda. every thread runs all of it</> },
  { code: 1, hl: [1], pic: 'strip', strip: 'me', text: <>which pixel is mine: skip whole blocks, then my spot in mine</> },
  { code: 1, hl: [2], pic: 'strip', strip: 'odd', text: <>our {N} pixels are exactly {NB} blocks, but most sizes aren't: the last block sticks out, so check <code>i &lt; n</code></> },
  { code: 1, hl: [5], pic: 'strip', strip: 'launch', text: <>the launch: <code>&lt;&lt;&lt;blocks, threads per block&gt;&gt;&gt;</code>, rounding up, then the arguments</> },
  { code: 2, hl: [1, 2, 6], pic: 'tiles',
    text: <>the 2d version on the photo: {W / T} × {H / T} blocks of 16 × 16. block ({BX}, {BY}), thread ({TX}, {TY}) → column {PX}, row {PY}</> },
  { code: 3, hl: [1, 2], pic: 'vec',
    text: <>your turn: the same two questions, for adding two arrays. one thread per element, check the end</> },
];

export default function Kernel() {
  const root = useRef<HTMLDivElement>(null);
  const photo = useRef<HTMLCanvasElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  useEffect(() => paint(photo.current, IMG), []);
  const pct = (a: number, b: number) => `${(a / b) * 100}%`;
  return (
    <div class="kernel" ref={root}>
      <div class="kn-cols">
        <div class="kn-code"><Code lang="cpp" code={st.code === 1 ? K1 : st.code === 2 ? K2 : K3} hl={st.hl} /></div>
        <div class="kn-pic">
          <div class={`kn-strip fade ${st.pic === 'strip' ? 'on' : ''}`}>
            <div class="muted kn-cap">{st.strip === 'odd' ? <>if n = {ODD}: {ODD_B} blocks, {ODD_B * BLOCK - ODD} threads past the end</> : <>img[0 … {N - 1}], one line of bytes: {NB} blocks of {BLOCK}</>}</div>
            <div class="kn-blocks">
              {Array.from({ length: st.strip === 'odd' ? ODD_B : NB }, (_, b) => {
                const part = st.strip === 'odd' && b === ODD_B - 1 ? (ODD - b * BLOCK) / BLOCK : 1;
                return (
                  <i class={`${st.strip === 'me' && b === ME.b ? 'me' : ''} ${part < 1 ? 'past' : ''}`}>
                    {part < 1 && <b style={{ width: `${part * 100}%` }} />}
                  </i>
                );
              })}
            </div>
            <div class="kn-sc">
              {st.strip === 'me' && <>block <span class="c-b">{ME.b}</span>, thread <span class="c-t">{ME.t}</span>: <span class="c-b">{ME.b}</span> * <span class="c-s">{BLOCK}</span> + <span class="c-t">{ME.t}</span> = <span class="c-r">{ME.b * BLOCK + ME.t}</span></>}
              {st.strip === 'odd' && <>dashed: threads with i ≥ n. they do nothing</>}
              {st.strip === 'launch' && <>(<span class="c-s">{N}</span> + 255) / 256 = <span class="c-r">{NB}</span> blocks × 256 threads</>}
            </div>
          </div>
          <div class={`kn-photo fade ${st.pic === 'tiles' ? 'on' : ''}`}>
            <div class="kn-img">
            <canvas ref={photo} />
            {Array.from({ length: W / T - 1 }, (_, c) => <i class="kn-v" style={{ left: pct((c + 1) * T, W) }} />)}
            {Array.from({ length: H / T - 1 }, (_, r) => <i class="kn-h" style={{ top: pct((r + 1) * T, H) }} />)}
            <i class="kn-blk" style={{ left: pct(BX * T, W), top: pct(BY * T, H), width: pct(T, W), height: pct(T, H) }} />
            <i class="kn-cx" style={{ left: pct(PX + .5, W) }} /><i class="kn-cy" style={{ top: pct(PY + .5, H) }} />
            <i class="kn-px" style={{ left: pct(PX, W), top: pct(PY, H), width: pct(1, W), height: pct(1, H) }} />
            </div>
            <div class="muted kn-cap">{W / T} × {H / T} blocks of 16 × 16 threads</div>
          </div>
          <div class={`kn-vec fade ${st.pic === 'vec' ? 'on' : ''}`}>
            {(['a', 'b', 'c'] as const).map((m) => (
              <div class="kn-vr">
                <span class="kn-vn">{m}</span>
                {Array.from({ length: VN }, (_, j) => <i class={j === VI ? (m === 'c' ? 'out' : 'in') : ''} />)}
              </div>
            ))}
            <div class="kn-vr kn-vt">
              <span class="kn-vn" />
              {Array.from({ length: VN }, (_, j) => <span>{j === VI ? '▲' : ''}</span>)}
            </div>
            <div class="muted kn-mcap">thread {VI}: reads a[{VI}] and b[{VI}], writes c[{VI}]</div>
          </div>
        </div>
      </div>
      <div class="caption kn-text">{st.text}</div>
      <style>{`
        .kernel .kn-cols { display: flex; gap: 1.6em; align-items: center; }
        .kernel .kn-code { flex: 1.7; min-width: 0; }
        .kernel .kn-code pre { margin: 0; font-size: .44em; overflow: hidden; }
        .kernel .kn-pic { flex: 1; display: grid; align-items: center; }
        .kernel .kn-photo, .kernel .kn-vec, .kernel .kn-strip { grid-area: 1 / 1; }
        .kernel .kn-img { position: relative; }
        .kernel .kn-photo canvas { display: block; width: 100%; aspect-ratio: ${W} / ${H}; image-rendering: pixelated; border-radius: 4px; }
        .kernel .kn-v, .kernel .kn-h, .kernel .kn-blk, .kernel .kn-px, .kernel .kn-cx, .kernel .kn-cy { position: absolute; pointer-events: none; }
        .kernel .kn-cx { top: 0; bottom: 0; width: 1px; background: color-mix(in srgb, var(--hot) 60%, transparent); }
        .kernel .kn-cy { left: 0; right: 0; height: 1px; background: color-mix(in srgb, var(--hot) 60%, transparent); }
        .kernel .kn-v { top: 0; bottom: 0; width: 1px; background: color-mix(in srgb, var(--accent) 55%, transparent); }
        .kernel .kn-h { left: 0; right: 0; height: 1px; background: color-mix(in srgb, var(--accent) 55%, transparent); }
        .kernel .kn-blk { box-shadow: inset 0 0 0 2px var(--hot); background: color-mix(in srgb, var(--hot) 18%, transparent); }
        .kernel .kn-px { background: var(--hot); outline: 2px solid var(--hot); outline-offset: 2px; }
        .kernel .kn-cap { font-size: .42em; margin-top: .4em; }
        .kernel .kn-vr { display: grid; grid-template-columns: 1.6em repeat(${VN}, 1fr); gap: 3px; margin-bottom: 4px; align-items: center; }
        .kernel .kn-vn { font: .5em var(--mono); color: var(--muted); }
        .kernel .kn-vr i { aspect-ratio: 1; border-radius: 3px; background: var(--surface); }
        .kernel .kn-vr i.in { background: var(--accent); } .kernel .kn-vr i.out { background: var(--hot); }
        .kernel .kn-vt span { font-size: .4em; text-align: center; color: var(--hot); }
        .kernel .kn-mcap { font-size: .42em; margin-top: .4em; }
        .kernel .kn-blocks { display: grid; grid-template-columns: repeat(${NB}, 1fr); gap: 2px; height: 56px; margin-top: .4em; }
        .kernel .kn-blocks i { position: relative; background: var(--surface); border-radius: 2px; }
        .kernel .kn-blocks i.me { background: var(--accent); }
        .kernel .kn-blocks i.past { background: transparent; outline: 1px dashed var(--muted); outline-offset: -1px; }
        .kernel .kn-blocks i.past b { position: absolute; left: 0; top: 0; bottom: 0; background: var(--surface); }
        .kernel .kn-sc { font: .46em/1.6 var(--mono); margin-top: .8em; min-height: 1.6em; white-space: nowrap; }
        .kernel .c-b { color: var(--accent); } .kernel .c-t { color: var(--teal); }
        .kernel .c-s { color: var(--purple); } .kernel .c-r { color: var(--hot); font-weight: 700; }
        .kernel .kn-text { font-size: .8em; min-height: 2.4em; margin-top: 1em; }
      `}</style>
    </div>
  );
}
