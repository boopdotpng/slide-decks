/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Tex } from './viz';
import './roles';

/**
 * How every model in the deck is trained, on the hidden digit task's real first rows (hidden_digit_dataset, seed 0).
 *   0 the examples: generated, with a held-out test set
 *   1 pick a random batch · 2 run the model · 3 the loss · 4 backward: only what fed the loss gets a gradient
 *   5 nudge the weights, repeat · 6 test on held-out examples
 */
const TRAIN: [string, string][] = [['w7nhibbae', '7'], ['vqxnpz0qo', '0'], ['oyhvra3wo', '3'], ['atsw1cwao', '1'], ['c8mkkaada', '8'], ['rnq9qtjlz', '9']];
const TEST = ['vsri2bpgd', 't6oiwgtwm', 'ay4rotspx'];
const PICKED = [1, 2, 4];
const STEPS = [
  <>sample <b>512</b> examples</>,
  <>forward → <b>36 scores</b> → probabilities</>,
  <><b>loss</b> <Tex tex="= -\log p(\text{answer})" />
    <span class="eg">1-in-10 guess: <b>2.30</b> · 99% sure and right: <b>0.01</b></span></>,
  <><b>backward</b>: a gradient for every weight the forward pass used</>,
  <><b>optimizer</b> step: nudge each weight against its gradient · <b>repeat</b> a few thousand times</>,
  <><b>test</b> on held-out examples</>,
];

/**
 * Backward through task 0's network on qwdk7mzpa: only the last position's row (a) is read, so the gradient reaches
 * emb[a] and the unembedding, and never emb[7]. On step 4 the gradient draws itself back from the loss, edge by edge.
 */
const NODES = {
  e7: { x: 80, y: 56, t: 'emb[7]' }, ea: { x: 80, y: 146, t: 'emb[a]' }, u: { x: 560, y: 56, t: 'unembed' },
  x: { x: 310, y: 146, t: 'last stream' }, s: { x: 560, y: 146, t: '36 scores' }, l: { x: 800, y: 146, t: 'loss' },
} as const;
type N = keyof typeof NODES;
const NW = 150, NH = 40;
const WEIGHT: N[] = ['e7', 'ea', 'u'];
/** forward edges, and the backward ones with when (ms) the gradient starts down each */
const FWD: [N, N][] = [['ea', 'x'], ['x', 's'], ['u', 's'], ['s', 'l']];
const BWD: [N, N, number][] = [['l', 's', 0], ['s', 'x', 450], ['s', 'u', 450], ['x', 'ea', 900]];
const GOT: Partial<Record<N, number>> = { l: 0, s: 400, x: 850, u: 850, ea: 1300 };   // when each node's gradient arrives
/** a side-to-side or bottom-to-top edge between two nodes, from a's edge to b's */
function ends(a: N, b: N, off = 0) {
  const A = NODES[a], B = NODES[b];
  if (A.y === B.y) {
    const d = Math.sign(B.x - A.x);
    return [A.x + d * NW / 2, A.y + off, B.x - d * NW / 2, B.y + off];
  }
  const d = Math.sign(B.y - A.y);
  return [A.x + off, A.y + d * NH / 2, B.x + off, B.y - d * NH / 2];
}
function Edge({ a, b, off = 0, cls, delay }: { a: N; b: N; off?: number; cls: string; delay?: number }) {
  const [x1, y1, x2, y2] = ends(a, b, off);
  const ang = Math.atan2(y2 - y1, x2 - x1), tx = (k: number) => x2 - 9 * Math.cos(ang + k), ty = (k: number) => y2 - 9 * Math.sin(ang + k);
  const st = delay === undefined ? undefined : { transitionDelay: `${delay}ms` };
  return (
    <g class={`edge ${cls}`}>
      <path pathLength={1} d={`M ${x1} ${y1} L ${x2} ${y2}`} style={st} />
      <path class="tip" d={`M ${tx(0.5)} ${ty(0.5)} L ${x2} ${y2} L ${tx(-0.5)} ${ty(-0.5)}`} style={delay === undefined ? undefined : { transitionDelay: `${delay + 350}ms` }} />
    </g>
  );
}
function Backward({ on }: { on: boolean }) {
  return (
    <svg class={`bw ${on ? 'on' : ''}`} viewBox="0 0 900 200">
      <text class="note" x={900} y={14} style={{ textAnchor: 'end' }}>task 0 on qwdk7mzpa</text>
      <path class="stub" d={`M ${NODES.e7.x + NW / 2} ${NODES.e7.y} H ${NODES.e7.x + NW / 2 + 40}`} />
      <text class="note" x={NODES.e7.x + NW / 2 + 50} y={NODES.e7.y + 6}>never read: not the last position</text>
      {FWD.map(([a, b]) => <Edge a={a} b={b} cls="fwd" />)}
      {BWD.map(([a, b, ms]) => <Edge a={a} b={b} off={a === 's' && b === 'u' ? 14 : 9} cls="grad" delay={ms} />)}
      {(Object.keys(NODES) as N[]).map((k) => {
        const n = NODES[k], w = WEIGHT.includes(k), got = GOT[k];
        return (
          <g class={`node ${w ? 'w' : ''} ${got !== undefined ? 'got' : ''} ${k === 'e7' ? 'none' : ''}`} style={got !== undefined ? { transitionDelay: `${got}ms` } : undefined}>
            <rect x={n.x - NW / 2} y={n.y - NH / 2} width={NW} height={NH} rx="7" style={got !== undefined ? { transitionDelay: `${got}ms` } : undefined} />
            <text x={n.x} y={n.y + 6}>{n.t}</text>
          </g>
        );
      })}
      <text class="tag moves" x={NODES.ea.x} y={NODES.ea.y + 48} style={{ transitionDelay: '1300ms' }}>gets a gradient: moves</text>
      <text class="tag moves" x={NODES.u.x + NW / 2 + 14} y={NODES.u.y + 6} style={{ transitionDelay: '850ms', textAnchor: 'start' }}>moves</text>
      <text class="tag zero" x={NODES.e7.x} y={NODES.e7.y - 30} style={{ transitionDelay: '1300ms' }}>gradient 0: stays put</text>
    </svg>
  );
}

export default function TrainLoop() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const row = ([x, y]: [string, string], i: number) => (
    <div class={`ex ${step >= 1 && step <= 5 && PICKED.includes(i) ? 'pick' : ''}`}><code>{x}</code><span class="arr">→</span><code class="y">{y}</code></div>
  );
  return (
    <div class="tl" ref={root}>
      <div class="data">
        <div class="lbl">training examples <span class="muted">· 10,000</span></div>
        {TRAIN.map(row)}
        <div class="ex more">…</div>
        <div class={`test ${step >= 6 ? 'on' : ''}`}>
          <div class="lbl">test examples <span class="muted">· 1,000, never trained on</span></div>
          {TEST.map((x) => <div class="ex"><code>{x}</code><span class="arr">→</span><code class="y">?</code></div>)}
        </div>
      </div>
      <ol class="loop">
        {STEPS.map((s, i) => <li class={`fade ${step > i ? 'on' : ''} ${step === i + 1 ? 'now' : ''}`}>{s}{i === 3 && <Backward on={step >= 4} />}</li>)}
      </ol>
      <style>{`
        .tl { display: grid; grid-template-columns: auto 1fr; gap: 3em; align-items: start; font-size: .8em; }
        .tl .lbl { font-size: .7em; margin-bottom: .4em; }
        .tl .ex { display: flex; gap: .6em; align-items: center; padding: .1em .5em; border-radius: 6px; transition: background .3s; }
        .tl .ex code { font-size: 1em; background: none; padding: 0; letter-spacing: .05em; }
        .tl .ex .y { color: var(--answer); }
        .tl .ex .arr { color: var(--muted); }
        .tl .ex.pick { background: var(--hl); }
        .tl .ex.more { color: var(--muted); }
        .tl .test { margin-top: 1em; padding-top: .6em; border-top: 1px dashed var(--border); opacity: .45; transition: opacity .3s; }
        .tl .test.on { opacity: 1; }
        .tl .test .y { color: var(--muted); }
        .tl .loop { margin: 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: .5em; }
        .tl .loop li { padding: .2em .4em; border-radius: 6px; transition: background .3s, opacity .35s; }
        .tl .loop li.now { background: var(--hl); }
        .tl .loop b { color: var(--fg); }
        .tl .eg { display: block; font-size: .8em; color: var(--muted); margin-top: .2em; }
        .tl .eg b { font-family: var(--mono); }
        .tl .bw { display: block; width: 920px; margin-top: .3em; overflow: visible; }
        .tl .bw .node rect { fill: var(--raised); stroke: var(--border); stroke-width: 2; transition: stroke .3s, fill .3s; }
        .tl .bw .node.w rect { stroke-dasharray: none; }
        .tl .bw .node text { font-family: var(--mono); font-size: 21px; fill: var(--fg); text-anchor: middle; }
        .tl .bw .node.none text { fill: var(--muted); }
        .tl .bw.on .node.got rect { stroke: var(--focus); } .tl .bw .node.none rect { stroke-dasharray: 5 4; }
        .tl .bw.on .node.got.w rect { fill: color-mix(in srgb, var(--focus) 20%, var(--raised)); }
        .tl .bw .edge path { fill: none; stroke-width: 2; }
        .tl .bw .edge.fwd path { stroke: var(--faint); }
        .tl .bw .edge.grad path { stroke: var(--focus); stroke-width: 2.5; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset .4s linear; }
        .tl .bw .edge.grad .tip { stroke-dasharray: none; opacity: 0; transition: opacity .1s; }
        .tl .bw.on .edge.grad path { stroke-dashoffset: 0; } .tl .bw.on .edge.grad .tip { opacity: 1; }
        .tl .bw:not(.on) .edge.grad path, .tl .bw:not(.on) .node rect, .tl .bw:not(.on) .tag { transition-delay: 0ms !important; }
        .tl .bw .stub { stroke: var(--faint); stroke-width: 2; stroke-dasharray: 4 5; fill: none; }
        .tl .bw .note { font-size: 18px; fill: var(--muted); }
        .tl .bw .tag { font-size: 19px; text-anchor: middle; opacity: 0; transition: opacity .3s; }
        .tl .bw.on .tag { opacity: 1; }
        .tl .bw .tag.moves { fill: var(--focus); } .tl .bw .tag.zero { fill: var(--muted); }
      `}</style>
    </div>
  );
}
