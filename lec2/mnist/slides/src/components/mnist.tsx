/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import { useIsland, resolve } from 'slides/viz';
import { useTheme, useSlideStep } from 'slides/hooks';
import Code from 'slides/Code';

/**
 * The deck's islands. Every number comes from public/data/mnist.json (../export.py: the lab's own loop, seed 0).
 * Digits are drawn ink-on-background, so they follow the theme: white on black in dark (how mnist is usually shown),
 * black on white in light.
 */

type B = { b64: string };
const bytes = new WeakMap<object, Uint8Array>();
const raw = (m: B) => {
  let b = bytes.get(m);
  if (!b) bytes.set(m, (b = Uint8Array.from(atob(m.b64), (c) => c.charCodeAt(0))));
  return b;
};
const channels = (css: string) => {
  const c = resolve(css);
  if (c.startsWith('#')) {
    const h = c.length === 4 ? [...c.slice(1)].map((x) => x + x).join('') : c.slice(1);
    return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  }
  return (c.match(/\d+/g) ?? ['0', '0', '0']).slice(0, 3).map(Number);
};

/** one 28×28 digit: image `i` of a b64 block of 784-byte images */
export function Digit({ m, i = 0, size = 56, class: cls = '' }: { m: B; i?: number; size?: number; class?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const theme = useTheme();
  useEffect(() => {
    const c = ref.current!, ctx = c.getContext('2d')!, img = ctx.createImageData(28, 28), px = raw(m);
    const bg = channels('var(--bg)'), fg = channels('var(--fg)');
    for (let k = 0; k < 784; k++) {
      const t = px[i * 784 + k] / 255;
      img.data.set([0, 1, 2].map((j) => Math.round(bg[j] + (fg[j] - bg[j]) * t)).concat(255), k * 4);
    }
    ctx.putImageData(img, 0, 0);
  }, [m, i, theme]);
  return <canvas ref={ref} width={28} height={28} class={`digit ${cls}`} style={{ width: `${size}px`, height: `${size}px` }} />;
}

const DIGIT_CSS = `.digit { image-rendering: pixelated; border-radius: 3px; outline: 1px solid var(--border); display: block; }`;

// ── dataset: a grid of real training images, one column per label ────────────
export function DigitGrid() {
  const { root, step, d } = useIsland('mnist');
  if (!d) return <div ref={root} />;
  const n = d.grid.labels.length;
  return (
    <div class="dgrid" ref={root}>
      <div class="cols">{Array.from({ length: 10 }, (_, k) => <span class={step >= 1 ? 'on' : ''}>{k}</span>)}</div>
      <div class="cells">{Array.from({ length: n }, (_, i) => <Digit m={d.grid} i={i} size={58} />)}</div>
      <style>{`${DIGIT_CSS}
        .dgrid .cells { display: grid; grid-template-columns: repeat(10, 58px); gap: 8px; }
        .dgrid .cols { display: grid; grid-template-columns: repeat(10, 58px); gap: 8px; text-align: center;
          font: 600 22px var(--mono); color: var(--accent); margin-bottom: 6px; }
        .dgrid .cols span { opacity: 0; transition: opacity .3s; } .dgrid .cols span.on { opacity: 1; }
      `}</style>
    </div>
  );
}

// ── pixels: one image is 784 numbers ────────────────────────────────────────
// 0 the picture   1 its pixel values   2 flattened into one row of 784
export function Pixels() {
  const { root, step, d } = useIsland('mnist');
  if (!d) return <div ref={root} />;
  const px: number[] = d.one.pixels;
  const C = 22; // canvas px per pixel
  return (
    <div class="pix" ref={root}>
      <div class="big" style={{ width: `${28 * C}px`, height: `${28 * C}px` }}>
        <div class="cells">
          {px.map((v) => (
            <div class="c" style={{ background: `color-mix(in srgb, var(--bg), var(--fg) ${(v / 255) * 100}%)` }}>
              <span class={step >= 1 && v ? 'on' : ''} style={{ color: v > 128 ? 'var(--bg)' : 'var(--fg)' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
      <div class="side">
        <p><b class="accent">label: {d.one.label}</b></p>
        <p class={`fade ${step >= 1 ? 'on' : ''}`}>each pixel is one byte: <b>0</b> is background, <b>255</b> is full ink</p>
        <p class={`fade ${step >= 1 ? 'on' : ''}`}>28 × 28 = <b>784</b> numbers</p>
        <div class={`fade ${step >= 2 ? 'on' : ''}`}>
          <p>the model doesn't see a picture. it sees one row of 784:</p>
          <div class="row">{px.map((v) => <i style={{ background: `color-mix(in srgb, var(--bg), var(--fg) ${(v / 255) * 100}%)` }} />)}</div>
          <p class="muted small">x.flatten(1): (1, 28, 28) → (784,)</p>
        </div>
      </div>
      <style>{`
        .pix { display: flex; gap: 48px; align-items: center; }
        .pix .big { flex: none; }
        .pix .cells { display: grid; grid-template-columns: repeat(28, ${C}px); grid-auto-rows: ${C}px; outline: 1px solid var(--border); }
        .pix .c { position: relative; display: flex; align-items: center; justify-content: center; }
        .pix .c span { font: 8px var(--mono); opacity: 0; transition: opacity .3s; letter-spacing: -.04em; }
        .pix .c span.on { opacity: .9; }
        .pix .side { font-size: .72em; display: flex; flex-direction: column; gap: .5em; max-width: 620px; }
        .pix .side p { margin: 0; }
        .pix .row { display: grid; grid-template-columns: repeat(784, 1fr); height: 40px; margin: .4em 0; outline: 1px solid var(--border); }
        .pix .row i { display: block; }
      `}</style>
    </div>
  );
}

// ── loss: ten scores → probabilities → one number to minimize ────────────
// 0 before training   1 after training
function ProbBars({ p, label, w = 420 }: { p: number[]; label: number; w?: number }) {
  return (
    <div class="pbars">
      {p.map((v, k) => (
        <div class={`pr ${k === label ? 'hl' : ''}`}>
          <span class="k">{k}</span>
          <div class="tr" style={{ width: `${w}px` }}><div class="f" style={{ width: `${v * 100}%` }} /></div>
          <span class="v">{(v * 100).toFixed(1)}%</span>
        </div>
      ))}
    </div>
  );
}
export function Probs() {
  const { root, step, d } = useIsland('mnist');
  if (!d) return <div ref={root} />;
  const ex = d.example, label = ex.labels[0], p: number[] = step >= 1 ? ex.after[0] : ex.before[0];
  const loss = -Math.log(Math.max(p[label], 1e-9));
  return (
    <div class="probs" ref={root}>
      <div class="img">
        <Digit m={ex} i={0} size={196} />
        <p class="muted small">a test image, label <b class="accent">{label}</b></p>
      </div>
      <div class="mid">
        <p class="kick">{step >= 1 ? 'after 5,000 training steps' : 'fresh random weights'}</p>
        <ProbBars p={p} label={label} />
      </div>
      <div class="loss">
        <p class="small muted">probability of the right answer</p>
        <p class="big">{(p[label] * 100).toFixed(step >= 1 ? 2 : 1)}%</p>
        <p class="small muted">loss = −log p</p>
        <p class={`big ${step >= 1 ? 'good' : 'bad'}`}>{loss < .01 ? loss.toFixed(4) : loss.toFixed(2)}</p>
      </div>
      <style>{`${DIGIT_CSS}
        .probs { display: flex; gap: 56px; align-items: center; }
        .probs .img { display: flex; flex-direction: column; align-items: center; gap: .3em; }
        .probs .img p { margin: 0; }
        .probs .kick { font-size: 20px; color: var(--muted); margin: 0 0 .4em; }
        .pbars { display: flex; flex-direction: column; gap: 5px; font: 22px var(--mono); }
        .pbars .pr { display: flex; align-items: center; gap: 12px; color: var(--muted); }
        .pbars .pr.hl { color: var(--fg); font-weight: 700; }
        .pbars .tr { height: 22px; background: var(--surface); border-radius: 4px; overflow: hidden; }
        .pbars .f { height: 100%; background: var(--line-2); transition: width .6s cubic-bezier(.2,.8,.2,1); }
        .pbars .hl .f { background: var(--accent); }
        .pbars .v { width: 4.2em; text-align: right; }
        .probs .loss { min-width: 230px; } .probs .loss p { margin: 0; }
        .probs .loss .big { font: 700 56px var(--mono); margin-bottom: .3em; }
        .probs .good { color: var(--good); } .probs .bad { color: var(--bad); }
      `}</style>
    </div>
  );
}

// ── (unused since the results slide was cut) the loss going down, and held-out accuracy ──────────────────────
// 0 the loss   1 + test accuracy
export function Curve() {
  const { root, step, d } = useIsland('mnist');
  if (!d) return <div ref={root} />;
  const W = 1300, H = 470, L = 70, B = 40, T = 14, R = 70;
  const loss: number[] = d.loss, n = loss.length, ymax = 3;
  // a 25-step running mean, so the line reads (the raw per-batch loss is noisy)
  const sm = loss.map((_, i) => { const a = loss.slice(Math.max(0, i - 24), i + 1); return a.reduce((s, v) => s + v, 0) / a.length; });
  const x = (i: number) => L + (i / n) * (W - L - R), y = (v: number) => T + (1 - v / ymax) * (H - T - B);
  const ya = (a: number) => T + (1 - (a - .0) / 1) * (H - T - B);
  const path = (vs: number[]) => vs.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(Math.min(v, ymax)).toFixed(1)}`).join('');
  const acc: { step: number; acc: number }[] = d.acc;
  return (
    <div class="curve" ref={root}>
      <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H}>
        {[0, .5, 1, 1.5, 2, 2.5, 3].map((v) => (<g>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke="var(--border)" />
          <text x={L - 12} y={y(v) + 7} text-anchor="end" class="ax">{v}</text>
        </g>))}
        {[0, 1000, 2000, 3000, 4000, 5000].map((s) => <text x={x(s)} y={H - 8} text-anchor="middle" class="ax">{s}</text>)}
        <line x1={L} x2={W - R} y1={y(d.uniform_loss)} y2={y(d.uniform_loss)} stroke="var(--muted)" stroke-dasharray="6 6" />
        <text x={x(300)} y={y(d.uniform_loss) + 28} class="ax">guessing at random: −log(1/10) = 2.30</text>
        <path d={path(loss)} fill="none" stroke="var(--accent)" stroke-opacity=".18" stroke-width="1" />
        <path d={path(sm)} fill="none" stroke="var(--accent)" stroke-width="3" />
        <g class={`fade ${step >= 1 ? 'on' : ''}`}>
          {[0, .25, .5, .75, 1].map((a) => <text x={W - R + 12} y={ya(a) + 7} class="ax acc">{a * 100}%</text>)}
          <path d={acc.map((p, i) => `${i ? 'L' : 'M'}${x(p.step).toFixed(1)},${ya(p.acc).toFixed(1)}`).join('')} fill="none" stroke="var(--good)" stroke-width="3" />
          {acc.map((p) => <circle cx={x(p.step)} cy={ya(p.acc)} r="5" fill="var(--good)" />)}
          <text x={x(acc[acc.length - 1].step)} y={ya(acc[acc.length - 1].acc) + 38} text-anchor="end" class="lab acc">
            {(d.final_acc * 100).toFixed(2)}% of 10,000 test images</text>
        </g>
      </svg>
      <div class="legend small">
        <span><i style={{ background: 'var(--accent)' }} />training loss (each step: one batch of {d.bs})</span>
        <span class={`fade ${step >= 1 ? 'on' : ''}`}><i style={{ background: 'var(--good)' }} />accuracy on test images it never trained on</span>
        <span class="muted">steps →</span>
      </div>
      <style>{`
        .curve svg { display: block; width: ${W}px; height: auto; }
        .curve .ax { font: 18px var(--mono); fill: var(--muted); }
        .curve .acc { fill: var(--good); }
        .curve .lab { font: 700 24px var(--sans); }
        .curve .legend { display: flex; gap: 2em; color: var(--muted); }
        .curve .legend i { display: inline-block; width: 22px; height: 5px; border-radius: 3px; margin-right: .5em; vertical-align: middle; }
      `}</style>
    </div>
  );
}

// ── why a library 1: everything is an array ──────────────────────────────────
// 0 a number (0-d)   1 a row (1-d)   2 a grid (2-d)   3 a stack of grids (3-d)   4 every tensor in mnist.py
const ink = (v: number) => `color-mix(in srgb, var(--bg), var(--fg) ${(v / 255) * 100}%)`;
// the 1 in (n, 1, 28, 28) is the color channel (grayscale): colored, so nobody reads it as a batch dimension
const chan = (t: string) => { const m = t.match(/^(.*?)\b1\b(, 28.*)$/); return m ? <>{m[1]}<span class="ch">1</span>{m[2]}</> : t; };
const TENSORS: [string, string, string][] = [
  ['xtrain', '(60000, 1, 28, 28)', 'all the images'],
  ['ytrain', '(60000,)', 'their labels'],
  ['l1', '(128, 784)', 'first layer weights'],
  ['l2', '(10, 128)', 'second layer weights'],
  ['scores', '(256, 10)', 'a batch of predictions'],
  ['loss', '()', 'one number'],
];
export function Arrays() {
  const { root, step, d } = useIsland('mnist');
  if (!d) return <div ref={root} />;
  const px: number[] = d.one.pixels;
  const cols = [
    { dims: '0-d', name: 'a number', shape: '()', ex: 'one pixel', el: <div class="scalar">{px[14 * 28 + 14]}</div> },
    { dims: '1-d', name: 'a row', shape: '(784,)', ex: 'an image, flattened', el: <div class="vec">{px.map((v) => <i style={{ background: ink(v) }} />)}</div> },
    { dims: '2-d', name: 'a grid', shape: '(28, 28)', ex: 'one image', el: <Digit m={d.grid} i={5} size={150} /> },
    { dims: '3-d', name: 'a stack of grids', shape: '(256, 28, 28)', ex: 'a batch of images', el: (
      <div class="stack">{Array.from({ length: 7 }, (_, k) => <div style={{ left: `${k * 14}px`, top: `${k * 10}px` }}><Digit m={d.grid} i={(k * 13) % 80} size={110} /></div>)}</div>) },
  ];
  return (
    <div class="arrs" ref={root}>
      <div class="row">
        {cols.map((c, i) => (
          <div class={`col fade ${step >= i ? 'on' : ''}`}>
            <div class="pic">{c.el}</div>
            <p class="dims"><b>{c.dims}</b> {c.name}</p>
            <p class="shape">{c.shape}</p>
            <p class="ex">{c.ex}</p>
          </div>
        ))}
      </div>
      <div class={`all fade ${step >= 4 ? 'on' : ''}`}>
        <p class="kick">every value in mnist.py is one of these: a <b>tensor</b>, an n-dimensional array of numbers with a shape</p>
        <div class="tens">{TENSORS.map(([n, s, w]) => <div><code>{n}</code><span class="s">{chan(s)}</span><span class="w">{w}</span></div>)}</div>
        <p class="key"><span class="ch">1</span> is the color channel: one, because mnist is grayscale</p>
      </div>
      <style>{`${DIGIT_CSS}
        .arrs { display: flex; flex-direction: column; gap: 34px; width: 100%; }
        .arrs .row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 32px; align-items: end; }
        .arrs .col { display: flex; flex-direction: column; align-items: center; text-align: center; }
        .arrs .pic { height: 220px; display: flex; align-items: center; justify-content: center; }
        .arrs .col p { margin: 0; }
        .arrs .dims { font-size: .62em; margin-top: .4em !important; } .arrs .dims b { color: var(--accent); }
        .arrs .shape { font: 600 .56em var(--mono); color: var(--fg); }
        .arrs .ex { font-size: .48em; color: var(--muted); }
        .arrs .scalar { font: 700 64px var(--mono); width: 120px; height: 120px; display: flex; align-items: center; justify-content: center;
          border-radius: 8px; outline: 1px solid var(--border); background: ${ink(px[14 * 28 + 14])}; color: var(--bg); }
        .arrs .vec { display: grid; grid-template-columns: repeat(784, 1fr); width: 300px; height: 34px; outline: 1px solid var(--border); }
        .arrs .vec i { display: block; }
        .arrs .stack { position: relative; width: 200px; height: 180px; }
        .arrs .stack > div { position: absolute; }
        .arrs .all .kick { font-size: .5em; color: var(--muted); margin: 0 0 .5em; } .arrs .all b { color: var(--fg); }
        .arrs .tens { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px 40px; font-size: .48em; }
        .arrs .tens div { display: flex; gap: .6em; align-items: baseline; border-bottom: 1px solid var(--border); padding-bottom: 4px; }
        .arrs .tens .s { font-family: var(--mono); white-space: nowrap; }
        .arrs .ch { color: var(--hot); font-weight: 700; }
        .arrs .key { font-size: .44em; color: var(--muted); margin: .5em 0 0; } .arrs .tens .w { color: var(--muted); margin-left: auto; }
      `}</style>
    </div>
  );
}

// ── why a library 2: array math becomes gpu code ─────────────────────────────
// 0 the python   1 the computation as a graph   2 compiled into gpu code   3 for whichever hardware   4 and backwards
const TARGETS: [string, string][] = [['nvidia gpu', 'CUDA'], ['amd gpu', 'HIP'], ['apple gpu', 'Metal'], ['any cpu', 'C, built by clang']];
function Graph({ back }: { back: boolean }) {
  // left to right: x → @ w → − y → square → mean, w and y feeding in from above (a linear fit, not the lab's model)
  const N = [
    { x: 10, w: 120, t: 'x', s: '(256, 512)', k: 'data' }, { x: 190, w: 120, t: '@ w', s: '(256, 64)', k: 'op' },
    { x: 370, w: 120, t: '− y', s: '(256, 64)', k: 'op' }, { x: 550, w: 120, t: 'square', s: '(256, 64)', k: 'op' },
    { x: 730, w: 120, t: 'mean', s: '()', k: 'op' },
  ];
  const IN = [{ x: 190, t: 'w' }, { x: 370, t: 'y' }];
  const Y = 120, H = 60, c = back ? 'var(--hot)' : 'var(--line-2)';
  return (
    <svg viewBox="0 0 860 220" class="graph">
      <defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z" fill={c} /></marker></defs>
      {N.slice(1).map((n, i) => <line x1={N[i].x + N[i].w} y1={Y + H / 2} x2={n.x - 4} y2={Y + H / 2} stroke={c} stroke-width="3"
        marker-end={back ? undefined : 'url(#ah)'} marker-start={back ? 'url(#ah)' : undefined} />)}
      {IN.map((n) => <>
        <rect x={n.x + 30} y={10} width={60} height={44} rx={8} fill="color-mix(in srgb, var(--accent) 18%, transparent)" stroke="var(--accent)" />
        <text x={n.x + 60} y={40} text-anchor="middle" class="t">{n.t}</text>
        <line x1={n.x + 60} y1={54} x2={n.x + 60} y2={Y - 4} stroke={c} stroke-width="3" marker-end={back ? undefined : 'url(#ah)'} marker-start={back ? 'url(#ah)' : undefined} />
      </>)}
      {N.map((n) => <>
        <rect x={n.x} y={Y} width={n.w} height={H} rx={n.k === 'op' ? 30 : 8} fill={n.k === 'op' ? 'var(--raised)' : 'var(--surface)'} stroke="var(--line)" />
        <text x={n.x + n.w / 2} y={Y + 39} text-anchor="middle" class="t">{n.t}</text>
        <text x={n.x + n.w / 2} y={Y + H + 28} text-anchor="middle" class="s">{n.s}</text>
      </>)}
    </svg>
  );
}
// the kernel's first line, then its main loop: the part that does the multiply-adds
const excerpt = (ls: string[]) => { const f = Math.max(1, ls.findIndex((l) => /^\s*for \(/.test(l))); return [ls[0], '  …', ...ls.slice(f, f + 36)]; };
export function Lowering({ py, kernel }: { py: string; kernel: { device: string; line: string; lines: string[] } }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  return (
    <div class="lower" ref={root}>
      <div class="left">
        <Code lang="py" code={py} class="py" />
        <div class={`fade ${step >= 1 ? 'on' : ''}`}>
          <p class="kick">the library records it as a graph of the whole computation</p>
          <Graph back={step >= 4} />
        </div>
        <div class={`fade ${step >= 3 ? 'on' : ''}`}>
          <p class="kick">and a compiler turns the graph into code for your hardware</p>
          <div class="tg">{TARGETS.map(([h, l]) => <div><span>{h}</span><b>{l}</b></div>)}</div>
        </div>
        <p class={`back fade ${step >= 4 ? 'on' : ''}`}>the same graph, walked backwards, gives every gradient: that's what <code>backward()</code> does</p>
      </div>
      <div class={`right fade ${step >= 2 ? 'on' : ''}`}>
        <p class="kick">real {kernel.device === 'METAL' ? 'Metal' : kernel.device} code generated for this line: one kernel, {kernel.lines.length} lines. you never write this</p>
        <Code lang="cpp" code={excerpt(kernel.lines).join('\n')} class="kern" />
      </div>
      <style>{`
        .lower { display: grid; grid-template-columns: 1fr 560px; gap: 40px; width: 100%; align-items: start; }
        .lower .left { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
        .lower .py pre, .lower pre.py { font-size: 20px; margin: 0; }
        .lower .kick { font-size: 19px; color: var(--muted); margin: 0 0 6px; }
        .lower .graph { width: 100%; display: block; }
        .lower .graph .t { font: 600 24px var(--mono); fill: var(--fg); }
        .lower .graph .s { font: 17px var(--mono); fill: var(--muted); }
        .lower .tg { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .lower .tg div { display: flex; flex-direction: column; background: var(--surface); border-radius: 8px; padding: 8px 12px; font-size: 18px; }
        .lower .tg span { color: var(--muted); } .lower .tg b { color: var(--accent); font-size: 21px; }
        .lower .back { font-size: 20px; color: var(--hot); margin: 0; }
        .lower pre.kern { font-size: 13px; line-height: 1.35; margin: 0; max-height: 640px; overflow: hidden; }
        .lower pre.kern .ln { white-space: pre-wrap; overflow-wrap: anywhere; padding-left: 3em; text-indent: -2.5em; }
      `}</style>
    </div>
  );
}
