/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';

/**
 * threadIdx / blockIdx / blockDim / gridDim. The framing: a launch is only a count (blocks × threads per block), and
 * each thread is handed two numbers, which block and its spot in it. 2d / 3d don't change what runs; they relabel
 * those numbers so the kernel skips the % and / it would otherwise do itself. On toy sizes small enough to label:
 *   0  the four names, on 4 blocks of 4
 *   1  1d: block 2, thread 1 → i = 9
 *   2  a 10 × 7 image with a 1d launch (5 blocks of 16): i = 69, then x = i % w, y = i / w by hand
 *   3  the same image with a 2d launch (blocks of 4 × 4): cuda hands you x and y; still just 6 blocks of 16
 *   4  3d: z as the image in a batch of 4 (4 × 4 each), blocks of 2 × 2 × 2
 * Colors, the same in the picture and the formulas: blockIdx blue, threadIdx teal, the sizes purple, the answer orange.
 * After https://anuraagw.me/blog/cuda-intro (the four-name table, a small labelled grid, then flatten).
 */

// ── the toy sizes ────────────────────────────────────────────────────────────
const D1 = { B: 4, G: 4, me: { b: 2, t: 1 } };
const D2 = { B: 4, GX: 3, GY: 2, w: 10, h: 7, me: { bx: 2, by: 1, tx: 1, ty: 2 } };
const DF = { B: 16, me: { b: 4, t: 5 } }; // the 1d launch over D2's image
const D3 = { B: 2, G: 2, n: 4, me: { bx: 1, by: 0, bz: 1, tx: 0, ty: 1, tz: 1 } };

const i1 = D1.me.b * D1.B + D1.me.t;
const x2 = D2.me.bx * D2.B + D2.me.tx, y2 = D2.me.by * D2.B + D2.me.ty;
const iF = DF.me.b * DF.B + DF.me.t, NF = Math.ceil((D2.w * D2.h) / DF.B); // 69, 5 blocks
const x3 = D3.me.bx * D3.B + D3.me.tx, y3 = D3.me.by * D3.B + D3.me.ty, z3 = D3.me.bz * D3.B + D3.me.tz;
const i3 = (z3 * D3.n + y3) * D3.n + x3;

// formula pieces, colored like the picture
const B = (s: ComponentChildren) => <span class="c-b">{s}</span>;
const T = (s: ComponentChildren) => <span class="c-t">{s}</span>;
const S = (s: ComponentChildren) => <span class="c-s">{s}</span>;
const R = (s: ComponentChildren) => <span class="c-r">{s}</span>;

type Step = { pic: '1d' | 'flat' | '2d' | '3d'; side: ComponentChildren; code?: string; text: ComponentChildren };

const NAMES = (
  <table class="dm-names">
    <tr><th rowSpan={2} class="muted">where am i</th><td>{T('threadIdx')}</td><td class="muted">my spot in my block</td></tr>
    <tr><td>{B('blockIdx')}</td><td class="muted">my block's spot in the grid</td></tr>
    <tr class="gap"><th rowSpan={2} class="muted">how big</th><td>{S('blockDim')}</td><td class="muted">threads per block</td></tr>
    <tr><td>{S('gridDim')}</td><td class="muted">blocks in the grid</td></tr>
  </table>
);

const STEPS: Step[] = [
  {
    pic: '1d',
    side: <>{NAMES}<p class="dm-note muted">no <code>gridIdx</code>: there's only one grid. each also has <code>.x .y .z</code>, but those only relabel the same numbers (in a minute)</p></>,
    code: `kernel<<<4, 4>>>(...);   // 16 threads`,
    text: <>a launch is just a <b>count</b>: 4 blocks of 4 threads. each thread is handed two numbers: which block, and its spot in it</>,
  },
  {
    pic: '1d',
    side: (
      <div class="dm-f">
        <div>i = {B('blockIdx.x')} * {S('blockDim.x')} + {T('threadIdx.x')}</div>
        <div class="dm-num">  = {B(D1.me.b)} * {S(D1.B)} + {T(D1.me.t)} = {R(i1)}</div>
      </div>
    ),
    text: <>my number overall: skip {D1.me.b} whole blocks of {D1.B}, then {D1.me.t} more. block {D1.me.b}, thread {D1.me.t} is thread {i1} overall</>,
  },
  {
    pic: 'flat',
    side: (
      <div class="dm-f">
        <div>i = {B('blockIdx.x')} * {S('blockDim.x')} + {T('threadIdx.x')}</div>
        <div class="dm-num">  = {B(DF.me.b)} * {S(DF.B)} + {T(DF.me.t)} = {R(iF)}</div>
        <div class="dm-sp">x = i % w = {iF} % {D2.w} = {R(iF % D2.w)}</div>
        <div>y = i / w = {iF} / {D2.w} = {R(Math.floor(iF / D2.w))}</div>
      </div>
    ),
    code: `kernel<<<(w * h + 15) / 16, 16>>>(img, w, h);
if (i >= w * h) return;`,
    text: <>an image, with the same 1d launch: one thread per pixel, in order. want (x, y)? divide by the width yourself</>,
  },
  {
    pic: '2d',
    side: (
      <div class="dm-f">
        <div>x = {B('blockIdx.x')} * {S('blockDim.x')} + {T('threadIdx.x')}</div>
        <div class="dm-num">  = {B(D2.me.bx)} * {S(D2.B)} + {T(D2.me.tx)} = {R(x2)}</div>
        <div>y = {B('blockIdx.y')} * {S('blockDim.y')} + {T('threadIdx.y')}</div>
        <div class="dm-num">  = {B(D2.me.by)} * {S(D2.B)} + {T(D2.me.ty)} = {R(y2)}</div>
        <p class="dm-note muted">the gpu still just runs {D2.GX * D2.GY} blocks of {D2.B * D2.B} threads. the shape only picks which pixels share a block (tiles, not strips) and saves you the % and /</p>
      </div>
    ),
    code: `dim3 block(4, 4), grid((w + 3) / 4, (h + 3) / 4);
kernel<<<grid, block>>>(img, w, h);
if (x >= w || y >= h) return;
img[y * w + x] = ...;   // memory is still 1d`,
    text: <>or ask for a 2d launch: cuda hands you x and y. same work on the gpu, less address math in the kernel</>,
  },
  {
    pic: '3d',
    side: (
      <div class="dm-f">
        <div>x = {B(D3.me.bx)} * {S(D3.B)} + {T(D3.me.tx)} = {R(x3)}</div>
        <div>y = {B(D3.me.by)} * {S(D3.B)} + {T(D3.me.ty)} = {R(y3)}</div>
        <div>z = {B(D3.me.bz)} * {S(D3.B)} + {T(D3.me.tz)} = {R(z3)}</div>
        <div class="dm-sp">i = (z * h + y) * w + x</div>
        <div class="dm-num">  = ({R(z3)} * {D3.n} + {R(y3)}) * {D3.n} + {R(x3)} = {R(i3)}</div>
      </div>
    ),
    code: `dim3 block(2, 2, 2), grid(2, 2, 2);`,
    text: <>3d: one more label, z, say which image in a batch. still just {D3.G ** 3} blocks of {D3.B ** 3} threads underneath</>,
  },
];

// ── pictures ─────────────────────────────────────────────────────────────────
const VW = 860;

function OneD({ k }: { k: number }) {
  const c = 40, g = 4, bg = 26;
  const bw = D1.B * c + (D1.B - 1) * g;
  const x0 = VW - (D1.G * bw + (D1.G - 1) * bg) - 6, y0 = 70;
  return (
    <svg viewBox={`0 0 ${VW} 300`} class="dm-svg">
      {Array.from({ length: D1.G }, (_, b) => {
        const bx = x0 + b * (bw + bg);
        return (
          <g>
            <text x={bx + bw / 2} y={y0 - 22} class={`lbl c-b ${b === D1.me.b ? 'on' : ''}`}>blockIdx.x = {b}</text>
            <rect x={bx - 6} y={y0 - 6} width={bw + 12} height={c + 12} rx={8} class={`blk ${b === D1.me.b ? 'on' : ''}`} />
            {Array.from({ length: D1.B }, (_, t) => {
              const me = k >= 1 && b === D1.me.b && t === D1.me.t;
              const x = bx + t * (c + g);
              return (
                <g>
                  <rect x={x} y={y0} width={c} height={c} rx={5} class={`cell ${me ? 'me' : ''}`} />
                  <text x={x + c / 2} y={y0 + c / 2 + 1} class={`num c-t ${me ? 'me' : ''}`}>{t}</text>
                  {k >= 1 && <text x={x + c / 2} y={y0 + c + 30} class={`gid ${me ? 'c-r' : 'muted'}`}>{b * D1.B + t}</text>}
                </g>
              );
            })}
          </g>
        );
      })}
      {k >= 1 && <text x={x0 - 14} y={y0 + c + 30} class="side muted" text-anchor="end">i</text>}
      <text x={x0 - 14} y={y0 + c / 2 + 1} class="side c-t" text-anchor="end">threadIdx.x</text>
      {/* the sizes */}
      <path d={`M${x0} ${y0 + c + 58} v8 h${bw} v-8`} class="brace" />
      <text x={x0 + bw / 2} y={y0 + c + 88} class="lbl c-s">blockDim.x = {D1.B}</text>
      <path d={`M${x0} ${y0 + c + 108} v8 h${D1.G * bw + (D1.G - 1) * bg} v-8`} class="brace" />
      <text x={x0 + (D1.G * bw + (D1.G - 1) * bg) / 2} y={y0 + c + 138} class="lbl c-s">gridDim.x = {D1.G} blocks</text>
    </svg>
  );
}

function TwoD() {
  const c = 42, g = 3, bg = 14;
  const bw = D2.B * c + (D2.B - 1) * g;
  const px = (i: number) => Math.floor(i / D2.B) * (bw + bg) + (i % D2.B) * (c + g);
  const W = D2.GX * bw + (D2.GX - 1) * bg, Hh = D2.GY * bw + (D2.GY - 1) * bg;
  const x0 = 160, y0 = 46;
  return (
    <svg viewBox={`0 0 ${VW} ${y0 + Hh + 30}`} class="dm-svg">
      {Array.from({ length: D2.GX }, (_, b) => (
        <text x={x0 + b * (bw + bg) + bw / 2} y={y0 - 16} class={`lbl c-b ${b === D2.me.bx ? 'on' : ''}`}>blockIdx.x = {b}</text>
      ))}
      {Array.from({ length: D2.GY }, (_, b) => (
        <text x={x0 - 16} y={y0 + b * (bw + bg) + bw / 2} class={`lbl c-b ${b === D2.me.by ? 'on' : ''}`} style={{ textAnchor: 'end' }}>blockIdx.y = {b}</text>
      ))}
      {Array.from({ length: D2.GY }, (_, by) => Array.from({ length: D2.GX }, (_, bx) => (
        <rect x={x0 + bx * (bw + bg) - 5} y={y0 + by * (bw + bg) - 5} width={bw + 10} height={bw + 10} rx={8}
          class={`blk ${bx === D2.me.bx && by === D2.me.by ? 'on' : ''}`} />
      )))}
      {Array.from({ length: D2.GY * D2.B }, (_, y) => Array.from({ length: D2.GX * D2.B }, (_, x) => {
        const out = x >= D2.w || y >= D2.h, me = x === x2 && y === y2;
        const cx = x0 + px(x), cy = y0 + px(y);
        return (
          <g>
            <rect x={cx} y={cy} width={c} height={c} rx={4} class={`cell ${me ? 'me' : out ? 'out' : ''}`} />
            {!out && (
              <text x={cx + c / 2} y={cy + c / 2 + 1} class={`tiny ${me ? 'me' : 'c-t'}`}>
                {`${x % D2.B},${y % D2.B}`}
              </text>
            )}
          </g>
        );
      }))}
      <text x={x0 + W + 18} y={y0 + 12} class="side c-t">threadIdx</text>
      <text x={x0 + W + 18} y={y0 + 36} class="side c-t">(x, y)</text>
      <path d={`M${x0 + W + 18} ${y0 + 66} h22`} class="edge" />
      <text x={x0 + W + 48} y={y0 + 66} class="side muted">the image</text>
      <text x={x0 + W + 48} y={y0 + 90} class="side muted">{D2.w} × {D2.h}</text>
      <rect x={x0 + W + 20} y={y0 + 112} width={18} height={18} rx={3} class="cell out" />
      <text x={x0 + W + 48} y={y0 + 121} class="side muted">past the</text>
      <text x={x0 + W + 48} y={y0 + 145} class="side muted">edge</text>
      {/* the image's edge */}
      <rect x={x0 - 2} y={y0 - 2} width={px(D2.w - 1) + c + 4} height={px(D2.h - 1) + c + 4} rx={5} class="edge" />
    </svg>
  );
}

function Flat() {
  const c = 42, g = 3, w = D2.w, h = D2.h, N = NF * DF.B;
  const x0 = 120, y0 = 40;
  const my = y0 + h * (c + g) + 50, mc = (VW - 40) / N;
  const cls = (i: number) => (i === iF ? 'me' : Math.floor(i / DF.B) === DF.me.b ? 'mine' : Math.floor(i / DF.B) % 2 ? 'alt' : '');
  return (
    <svg viewBox={`0 0 ${VW} ${my + 70}`} class="dm-svg">
      {Array.from({ length: w }, (_, x) => <text x={x0 + x * (c + g) + c / 2} y={y0 - 16} class={`tiny ${x === iF % w ? 'c-r' : 'muted'}`}>{x}</text>)}
      {Array.from({ length: h }, (_, y) => <text x={x0 - 16} y={y0 + y * (c + g) + c / 2} class={`tiny ${y === Math.floor(iF / w) ? 'c-r' : 'muted'}`}>{y}</text>)}
      <text x={x0 - 40} y={y0 - 16} class="side muted">x →</text>
      <text x={x0 - 54} y={y0 + c / 2} class="side muted">y ↓</text>
      {Array.from({ length: w * h }, (_, i) => {
        const x = x0 + (i % w) * (c + g), y = y0 + Math.floor(i / w) * (c + g);
        return (
          <g>
            <rect x={x} y={y} width={c} height={c} rx={4} class={`cell ${cls(i)}`} />
            <text x={x + c / 2} y={y + c / 2 + 1} class={`tiny ${i === iF ? 'me' : 'muted'}`}>{i}</text>
          </g>
        );
      })}
      <text x={x0 + w * (c + g) + 14} y={y0 + 12} class="side muted">one tint per</text>
      <text x={x0 + w * (c + g) + 14} y={y0 + 36} class="side muted">block of {DF.B}</text>
      <text x={x0 + w * (c + g) + 14} y={y0 + 74} class="side c-b">block {DF.me.b}</text>
      <text x={20} y={my - 14} class="side muted">the same {N} threads in launch order ({NF} blocks of {DF.B}); the last {N - w * h} return</text>
      {Array.from({ length: N }, (_, i) => (
        <rect x={20 + i * mc} y={my} width={mc - 1} height={28} class={`mcell ${i >= w * h ? 'out' : cls(i)}`} />
      ))}
      {Array.from({ length: NF }, (_, b) => (
        <text x={20 + b * DF.B * mc + 1} y={my + 48} class={`tick ${b === DF.me.b ? 'c-b' : 'muted'}`} style={{ textAnchor: 'start' }}>block {b}</text>
      ))}
    </svg>
  );
}

function ThreeD() {
  const n = D3.n, c = 36, g = 3, bg = 12, sg = 30, zg = 70;
  const sw = n * c + (n - 1) * g + bg - g; // one slice, with the block gap in the middle
  const p = (i: number) => i * (c + g) + (i >= D3.B ? bg - g : 0);
  const sx = (z: number) => z * (sw + sg) + (z >= D3.B ? zg - sg : 0);
  const x0 = (VW - (sx(n - 1) + sw)) / 2, y0 = 74;
  return (
    <svg viewBox={`0 0 ${VW} 330`} class="dm-svg">
      {[0, 1].map((bz) => {
        const a = x0 + sx(bz * D3.B), b = x0 + sx(bz * D3.B + 1) + sw;
        return (
          <g>
            <rect x={a - 10} y={y0 - 34} width={b - a + 20} height={sw + 46} rx={10} class={`blk ${bz === D3.me.bz ? 'on' : ''}`} />
            <text x={(a + b) / 2} y={y0 + sw + 44} class={`lbl c-b ${bz === D3.me.bz ? 'on' : ''}`}>blockIdx.z = {bz}</text>
          </g>
        );
      })}
      {Array.from({ length: n }, (_, z) => (
        <g>
          <text x={x0 + sx(z) + sw / 2} y={y0 - 12} class={`lbl ${z === z3 ? 'c-r' : 'muted'}`}>z = {z}</text>
          {Array.from({ length: n }, (_, y) => Array.from({ length: n }, (_, x) => {
            const me = x === x3 && y === y3 && z === z3;
            const blk = (Math.floor(x / D3.B) + Math.floor(y / D3.B)) % 2;
            const mine = Math.floor(x / D3.B) === D3.me.bx && Math.floor(y / D3.B) === D3.me.by && Math.floor(z / D3.B) === D3.me.bz;
            return <rect x={x0 + sx(z) + p(x)} y={y0 + p(y)} width={c} height={c} rx={4} class={`cell ${me ? 'me' : mine ? 'mine' : blk ? 'alt' : ''}`} />;
          }))}
        </g>
      ))}
      <text x={VW / 2} y={y0 + sw + 86} class="side muted" style={{ textAnchor: 'middle' }}>4 images of 4 × 4. tinted: block (1, 0, 1), 2 × 2 × 2 = 8 threads across two images</text>
    </svg>
  );
}

export default function Dims() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  return (
    <div class="dims" ref={root}>
      <div class="dm-cols">
        <div class="dm-pic">
          {st.pic === '1d' && <OneD k={k} />}
          {st.pic === 'flat' && <Flat />}
          {st.pic === '2d' && <TwoD />}
          {st.pic === '3d' && <ThreeD />}
        </div>
        <div class="dm-side">
          {st.side}
          {st.code && <div class="dm-code"><Code lang="cpp" code={st.code} /></div>}
        </div>
      </div>
      <div class="caption dm-text">{st.text}</div>
      <style>{`
        .dims .dm-cols { display: flex; gap: 1.4em; align-items: center; }
        .dims .dm-pic { flex: none; width: 860px; }
        .dims .dm-side { flex: 1; min-width: 0; }
        .dims .dm-svg { width: 100%; display: block; overflow: visible; font-family: var(--mono); }
        .dims .c-b { color: var(--accent); fill: var(--accent); }
        .dims .c-t { color: var(--teal); fill: var(--teal); }
        .dims .c-s { color: var(--purple); fill: var(--purple); }
        .dims .c-r { color: var(--hot); fill: var(--hot); font-weight: 700; }
        .dims svg .muted { fill: var(--muted); }
        .dims .lbl { font-size: 17px; text-anchor: middle; dominant-baseline: middle; opacity: .7; }
        .dims .lbl.on { opacity: 1; font-weight: 700; }
        .dims .side { font-size: 17px; dominant-baseline: middle; }
        .dims .num { font-size: 20px; text-anchor: middle; dominant-baseline: middle; }
        .dims .tiny { font-size: 13px; text-anchor: middle; dominant-baseline: middle; }
        .dims .gid { font-size: 20px; text-anchor: middle; dominant-baseline: middle; }
        .dims .tick { font-size: 14px; dominant-baseline: middle; }
        .dims text.me { fill: var(--on-color); font-weight: 700; }
        .dims .cell { fill: var(--surface); stroke: var(--line); stroke-width: 1; }
        .dims .cell.alt { fill: var(--raised); }
        .dims .cell.out { fill: transparent; stroke-dasharray: 3 3; stroke: var(--faint); }
        .dims .cell.mine { fill: color-mix(in srgb, var(--accent) 35%, var(--surface)); stroke: var(--accent); }
        .dims .cell.me { fill: var(--hot); stroke: var(--hot); }
        .dims .blk { fill: none; stroke: color-mix(in srgb, var(--accent) 45%, transparent); stroke-width: 1.5; }
        .dims .blk.on { stroke: var(--accent); stroke-width: 3; fill: color-mix(in srgb, var(--accent) 10%, transparent); }
        .dims .edge { fill: none; stroke: var(--fg); stroke-width: 2; stroke-dasharray: 8 5; }
        .dims .brace { fill: none; stroke: var(--purple); stroke-width: 2; }
        .dims .brace.hot { stroke: var(--hot); }
        .dims .mcell { fill: var(--surface); }
        .dims .mcell.odd { fill: var(--raised); }
        .dims .mcell.me { fill: var(--hot); }
        .dims .mcell.alt { fill: var(--raised); }
        .dims .mcell.mine { fill: color-mix(in srgb, var(--accent) 45%, var(--surface)); }
        .dims .mcell.out { fill: transparent; stroke: var(--faint); stroke-dasharray: 2 2; }
        .dims .dm-names { border-collapse: collapse; font-size: .62em; }
        .dims .dm-names th { white-space: nowrap; text-align: left; font-weight: 400; font-size: .8em; padding-right: 1em; vertical-align: top; padding-top: .35em; }
        .dims .dm-names td { padding: .3em .8em .3em 0; }
        .dims .dm-names td:first-of-type { font-family: var(--mono); }
        .dims .dm-names tr.gap > * { padding-top: 1em; }
        .dims .dm-note { font-size: .5em; line-height: 1.45; margin-top: 1em; }
        .dims .dm-f { font: .54em/1.7 var(--mono); white-space: pre; }
        .dims .dm-f .dm-note { white-space: normal; font-family: var(--sans); font-size: .9em; }
        .dims .dm-num { color: var(--muted); margin-bottom: .3em; }
        .dims .dm-sp { margin-top: .6em; }
        .dims .dm-code { margin-top: 1em; }
        .dims .dm-code pre { margin: 0; font-size: .44em; }
        .dims .dm-text { font-size: .76em; min-height: 2.4em; margin-top: .9em; }
      `}</style>
    </div>
  );
}
