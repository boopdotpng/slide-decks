/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Mat, Tex, diverging, sequential, useData, range } from './viz';
import { LineChart, CHART_CSS } from './Charts';
import './roles';

/**
 * Slide 4: one training update as a computational graph. The graph stays on screen; the stage the step is on is lit,
 * and the panel under it shows that stage, small, in the earlier lecture's pictures (streams as columns of cells,
 * attention as a grid, scores as bars). The panel has no state of its own: it is drawn from the same `step`, so it
 * can't drift from the graph.
 * Worked example, every number from one run (public/data/step.json, export_step.py, tinygrad 0.14.0): a model with
 * task 3's shape at fresh weights (seed 0) on a2f5c9d3fc → 4. Insets from other runs say so: task 3's trained attention
 * (task3w.json) and task 1's loss curve (task1.json), both recorded in "one head at a time".
 *   0 the whole graph: forward along the top, parameters above
 *   1 embedding  2 attention  3 residual add  4 mlp  5 scores  6 loss  7 backward  8 optimizer step
 */
type Step = {
  text: string; target: string; ids: number[]; vocab: string; E: number[][]; P: number[][]; x0: number[][];
  attn1: (number | null)[][]; attn2: (number | null)[][];
  last: Record<'x0' | 'a1' | 'x1' | 'a2' | 'x2' | 'm' | 'x3', number[]>;
  mlp: { pre: number[]; h: number[]; write: number[]; active: number };
  logits: number[]; probs: number[]; loss: number; ln36: number; dlogits: number[];
  grad_norm: Record<string, number>; emb_rows_grad: boolean[]; dx0_norm: number[];
  update: { lr: number; changed: Record<string, number>; size: Record<string, number>; max_change: Record<string, number>;
    U_target_before: number[]; U_target_after: number[]; loss_after: number };
};

// ── the graph ────────────────────────────────────────────────────────────────
type NodeId = 'tok' | 'emb' | 'att' | 'add1' | 'mlp' | 'add2' | 'un' | 'sc' | 'loss' | 'tgt';
const OPY = 158, PY = 52;
const NODES: Record<NodeId, { x: number; y: number; w: number; t: string; s?: string; round?: boolean }> = {
  tok: { x: 70, y: OPY, w: 116, t: 'token ids', s: '(10,)' },
  emb: { x: 232, y: OPY, w: 136, t: 'embedding', s: 'E[id] + P[pos]' },
  att: { x: 428, y: OPY, w: 170, t: 'attention', s: '2 layers' },
  add1: { x: 576, y: OPY, w: 44, t: '+', round: true },
  mlp: { x: 712, y: OPY, w: 150, t: 'mlp', s: 'up · relu · down' },
  add2: { x: 846, y: OPY, w: 44, t: '+', round: true },
  un: { x: 986, y: OPY, w: 150, t: 'unembed', s: 'last position' },
  sc: { x: 1150, y: OPY, w: 120, t: 'scores', s: '(36,)' },
  loss: { x: 1330, y: OPY, w: 170, t: 'cross-entropy', s: 'loss: a scalar' },
  tgt: { x: 1330, y: PY, w: 130, t: 'target 4' },
};
const PARAMS: { at: NodeId; t: string; keys: string[] }[] = [
  { at: 'emb', t: 'E, P', keys: ['E', 'P'] },
  { at: 'att', t: 'W_Q W_K W_V ×2', keys: ['l1.Wq', 'l1.Wk', 'l1.Wv', 'l2.Wq', 'l2.Wk', 'l2.Wv'] },
  { at: 'mlp', t: 'W_up b W_down b', keys: ['mlp.W_up', 'mlp.b_up', 'mlp.W_down', 'mlp.b_down'] },
  { at: 'un', t: 'U', keys: ['U'] },
];
const FWD: [NodeId, NodeId][] = [['tok', 'emb'], ['emb', 'att'], ['att', 'add1'], ['add1', 'mlp'], ['mlp', 'add2'], ['add2', 'un'], ['un', 'sc'], ['sc', 'loss']];
// the residual stream skips around each block into its +
const SKIPS: [NodeId, NodeId][] = [['emb', 'add1'], ['add1', 'add2']];
/** which nodes each stage lights */
const LIT: NodeId[][] = [[], ['tok', 'emb'], ['att'], ['add1', 'add2'], ['mlp'], ['un', 'sc'], ['loss', 'tgt'], [], []];
const STAGES = ['the forward pass', 'embedding', 'attention', 'residual addition', 'mlp', 'scores', 'loss', 'backward pass', 'optimizer step'];

const half = (n: NodeId) => NODES[n].w / 2;
function hEdge(a: NodeId, b: NodeId, dy = 0) {
  const A = NODES[a], B = NODES[b];
  return `M ${A.x + half(a)} ${A.y + dy} L ${B.x - half(b)} ${B.y + dy}`;
}
function skip(a: NodeId, b: NodeId) {
  const A = NODES[a], B = NODES[b], y = OPY + 50;
  return `M ${A.x} ${A.y + 26} C ${A.x} ${y}, ${A.x + 30} ${y}, ${(A.x + B.x) / 2} ${y} S ${B.x} ${y}, ${B.x} ${B.y + 22}`;
}
// the gradient goes back along the forward edges, right to left: when (ms) each edge starts, at step 7
const BWD: [NodeId, NodeId, number][] = [['loss', 'sc', 0], ['sc', 'un', 260], ['un', 'add2', 520], ['add2', 'mlp', 780], ['mlp', 'add1', 1040],
  ['add1', 'att', 1300], ['att', 'emb', 1560]];

function Graph({ step }: { step: number }) {
  const lit = LIT[step] ?? [];
  const back = step === 7, upd = step === 8;
  return (
    <svg class="graph" viewBox="0 0 1440 236">
      <text class="gk" x={4} y={OPY - 52}>forward →</text>
      {FWD.map(([a, b]) => <path class="fe" d={hEdge(a, b)} marker-end="url(#bw-arr)" />)}
      {SKIPS.map(([a, b]) => <path class="se" d={skip(a, b)} />)}
      <text class="gk sk" x={(NODES.emb.x + NODES.add1.x) / 2} y={OPY + 66}>residual stream</text>
      <path class="fe" d={`M ${NODES.tgt.x} ${PY + 20} V ${OPY - 24}`} marker-end="url(#bw-arr)" />
      {/* parameters, above their operation */}
      {PARAMS.map((p) => {
        const n = NODES[p.at];
        return (
          <g class={`prm ${back ? 'grad' : ''} ${upd ? 'upd' : ''}`}>
            <path class="pe" d={`M ${n.x} ${PY + 18} V ${OPY - 24}`} />
            <rect x={n.x - 86} y={PY - 18} width="172" height="36" rx="8" />
            <text x={n.x} y={PY + 6}>{p.t}</text>
          </g>
        );
      })}
      {/* gradient edges, drawn back from the loss */}
      {BWD.map(([a, b, ms]) => (
        <path class={`ge ${back ? 'on' : ''}`} d={hEdge(b, a, 15)} pathLength={1} style={{ transitionDelay: back ? `${ms}ms` : '0ms' }} />
      ))}
      {PARAMS.map((p, i) => (
        <path class={`ge up ${back ? 'on' : ''}`} d={`M ${NODES[p.at].x + 14} ${OPY - 24} V ${PY + 18}`} pathLength={1}
          style={{ transitionDelay: back ? `${[1820, 1560, 1040, 520][i]}ms` : '0ms' }} />
      ))}
      {(Object.keys(NODES) as NodeId[]).map((k) => {
        const n = NODES[k], on = lit.includes(k);
        if (n.round) return (
          <g class={`nd add ${on ? 'on' : ''}`}><circle cx={n.x} cy={n.y} r="22" /><text x={n.x} y={n.y + 9}>+</text></g>
        );
        return (
          <g class={`nd ${k} ${on ? 'on' : ''}`}>
            <rect x={n.x - n.w / 2} y={n.y - 24} width={n.w} height="48" rx="10" />
            <text x={n.x} y={n.y + (n.s ? -2 : 7)}>{n.t}</text>
            {n.s && <text class="s" x={n.x} y={n.y + 17}>{n.s}</text>}
          </g>
        );
      })}
      <text class={`gk gb ${back ? 'on' : ''}`} x={NODES.loss.x + 20} y={OPY + 70} text-anchor="end">← gradients: chain rule, edge by edge</text>
      <text class={`gk gu ${upd ? 'on' : ''}`} x={(NODES.un.x + NODES.tgt.x) / 2} y={(PY + OPY) / 2 + 8} text-anchor="middle">every parameter: θ ← θ − update</text>
      <defs>
        <marker id="bw-arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" class="ah" />
        </marker>
      </defs>
    </svg>
  );
}

// ── small pieces for the panel ───────────────────────────────────────────────
/** a vector as a column of cells (the earlier lecture's stream picture) */
function Col({ v, x, y, cw = 22, ch = 6, s = 1, label, hl, cls = '' }: { v: number[]; x: number; y: number; cw?: number; ch?: number; s?: number; label?: ComponentChildren; hl?: boolean; cls?: string }) {
  return (
    <g class={`vc ${cls} ${hl ? 'hl' : ''}`}>
      {v.map((n, k) => <rect x={x} y={y + k * ch} width={cw} height={ch - .5} style={{ fill: diverging(n, s) }} />)}
      <rect class="frame" x={x - 1.5} y={y - 1.5} width={cw + 3} height={v.length * ch + 2.5} rx="3" />
      {label && <text class="vl" x={x + cw / 2} y={y + v.length * ch + 22}>{label}</text>}
    </g>
  );
}
/** 36 bars, one per vocabulary token, digits in the digit color, the target outlined */
function Bars36({ v, vocab, x, y, w, h, target, pred, signed = false, fmt }: { v: number[]; vocab: string; x: number; y: number; w: number; h: number;
  target: number; pred?: number; signed?: boolean; fmt?: (n: number) => string }) {
  const max = Math.max(...v.map(Math.abs)), bw = w / v.length;
  const base = signed ? y + h / 2 : y + h;
  const scale = (signed ? h / 2 : h) / max;
  return (
    <g class="b36">
      <line class="axis" x1={x} x2={x + w} y1={base} y2={base} />
      {v.map((n, i) => {
        const hh = Math.abs(n) * scale, top = n >= 0 ? base - hh : base;
        return (
          <g>
            <rect class={`${/\d/.test(vocab[i]) ? 'dg' : 'lt'} ${i === target ? 'tg' : ''} ${i === pred ? 'pr' : ''}`} x={x + i * bw + 1} y={top} width={bw - 2} height={Math.max(1, hh)} />
            {(i === target || i === pred || /\d/.test(vocab[i])) && <text class={`bl ${i === target ? 'tg' : ''}`} x={x + i * bw + bw / 2} y={y + h + 20}>{vocab[i]}</text>}
          </g>
        );
      })}
      {/* the target's value goes above the chart, over its bar: beside the bar it would sit on the neighbours */}
      {fmt && <text class="bv tg" x={x + (target + .5) * bw} y={y - 10} text-anchor="middle">{fmt(v[target])}</text>}
    </g>
  );
}

const att = (m: (number | null)[][]) => m.map((r) => r.map((v) => v));
const lab = (s: string) => [...s];

function Panel({ step, d, t3, t1 }: { step: number; d: Step; t3: any; t1: any }) {
  const chars = lab(d.text), V = d.vocab, tgt = V.indexOf(d.target), pred = d.probs.indexOf(Math.max(...d.probs));
  const dg = (i: number) => (/\d/.test(chars[i]) ? 'dg' : '');
  const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
  const used = new Set(d.ids);
  const active = d.mlp.active;
  const loss1 = t1?.loss as { step: number; loss: number }[] | undefined;

  // each stage: [caption (html), picture (svg children)]
  const S: [ComponentChildren, ComponentChildren][] = [
    [<>one update, start to finish. <b>forward</b>: run the model and score it. <b>backward</b>: derivatives of the loss. <b>optimizer</b>: change the parameters.
      <div class="eg">worked example on every stage: <code>a2f5c9d3fc</code> → <b class="g">4</b>, a model shaped like <span class="nw">task 3</span>, <b>fresh weights</b> (seed 0)</div></>,
      <>{range(10).map((i) => (
        <g><rect class="tb" x={120 + i * 62} y={70} width="50" height="50" rx="8" /><text class={`tk ${dg(i)}`} x={145 + i * 62} y={105}>{chars[i]}</text></g>
      ))}<text class="arw" x={770} y={105}>→</text><rect class="tgtb" x={810} y={70} width="54" height="50" rx="8" /><text class="tk g" x={837} y={105}>4</text>
        <text class="nt" x={810} y={146}>target</text>
        <text class="nt" x={120} y={190}>only the final position is graded</text></>],
    [<>each token id <b>selects a row</b> of the 36 × 32 table <Tex tex="E" />; its position selects a row of <Tex tex="P" />. their sum is that position's stream.
      <div class="eg"><Tex tex="x_i = E[\text{id}_i] + P[i]" />, all ten: <Tex tex="(10, 32)" /></div></>,
      <>
        <Mat data={d.E} x={60} y={30} cw={4.2} ch={7.4} color={(v) => diverging(v, .5)} hlRows={[...used]} dim gap={.3} />
        <text class="nt" x={60} y={316}>E (36, 32): 8 rows used</text>
        {d.ids.map((id, i) => <path class="lk" d={`M ${60 + 32 * 4.2 + 4} ${30 + id * 7.4 + 3.7} C 280 ${30 + id * 7.4}, 300 ${60 + i * 3}, ${330 + i * 40} 52`} />)}
        {range(10).map((i) => <>
          <text class={`tk sm ${dg(i)}`} x={341 + i * 40} y={42}>{chars[i]}</text>
          <Col v={d.x0[i]} x={330 + i * 40} y={56} cw={22} ch={7.2} s={.6} />
        </>)}
        <text class="nt" x={330} y={316}>x₀ = E[id] + P[pos]: one column per position (10, 32)</text>
      </>],
    [<>each position reads the streams at or before it, weighted by <Tex tex="\operatorname{softmax}(qk^\top/\sqrt{32} + M)" />. rows: who reads; columns: who is read.
      <div class="eg">fresh weights: spread almost evenly. training is what makes it look somewhere</div></>,
      <>
        <Mat data={att(d.attn2)} x={90} y={40} cw={24} ch={24} color={(v) => sequential(v)} rowLabels={chars} colLabels={chars} labelCls={dg} hlRows={[9]} />
        <text class="nt" x={70} y={316}>layer 2 now, fresh weights</text>
        <text class="nt" x={70} y={340}>last row: {Math.round(Math.min(...d.attn2[9].map((v) => v ?? 0)) * 100)}–{Math.round(Math.max(...d.attn2[9].map((v) => v ?? 0)) * 100)}% on each of the 10</text>
        {t3 && <>
          <Mat data={t3.example.attn2} x={520} y={40} cw={24} ch={24} color={(v) => sequential(v)} rowLabels={chars} colLabels={chars} labelCls={dg} hlRows={[9]} />
          <text class="nt" x={520} y={316}>reference: task 3 after training</text>
          <text class="nt" x={520} y={340}>last row: {pct(t3.example.attn2[9][3])} on the 5, {pct(t3.example.attn2[9][5])} on the 9</text>
          <foreignObject x={790} y={20} width={200} height={40}><div class="tag-rec">recorded, other run</div></foreignObject>
        </>}
      </>],
    [<>a block never replaces the stream: it <b>adds</b> its write. the last position, at layer 2:
      <div class="eg"><Tex tex="x_2 = x_1 + \text{attn}_2(x_1)" />; <span class="nw">later <Tex tex="x_3 = x_2 + \text{mlp}(x_2)" /></span></div></>,
      <>
        <Col v={d.last.x1} x={160} y={30} cw={34} ch={8} s={.8} label="x₁ (stream)" />
        <text class="op" x={232} y={166}>+</text>
        <Col v={d.last.a2} x={270} y={30} cw={34} ch={8} s={.8} label="attention's write" cls="w" />
        <text class="op" x={342} y={166}>=</text>
        <Col v={d.last.x2} x={380} y={30} cw={34} ch={8} s={.8} label="x₂" />
        <text class="nt" x={480} y={120}>each of the 32 numbers: old + write</text>
        <text class="nt mono" x={480} y={156}>{d.last.x1[0].toFixed(3)} + {d.last.a2[0].toFixed(3)} = {d.last.x2[0].toFixed(3)}</text>
        <text class="nt" x={480} y={192}>(first entry, from the run)</text>
      </>],
    [<>the mlp works on each position alone: <b>up</b> to 64, <b>relu</b> (negatives → 0), <b>down</b> to 32, then <b>add</b> to the stream.
      <div class="eg"><Tex tex="x_3 = x_2 + W_{\text{down}}\,\operatorname{relu}(W_{\text{up}} x_2 + b) + b'" /></div></>,
      <>
        <Col v={d.last.x2} x={40} y={40} cw={30} ch={8} s={.8} label="x₂ (32)" />
        <text class="op" x={100} y={170}>→</text>
        <Col v={d.mlp.pre} x={130} y={40} cw={30} ch={4} s={.8} label="up (64)" />
        <text class="op" x={190} y={170}>→</text>
        <Col v={d.mlp.h} x={220} y={40} cw={30} ch={4} s={.8} label="relu (64)" cls="m" />
        <text class="op" x={280} y={170}>→</text>
        <Col v={d.mlp.write} x={310} y={40} cw={30} ch={8} s={.8} label="down (32)" cls="m" />
        <text class="op" x={372} y={170}>+</text>
        <Col v={d.last.x2} x={400} y={40} cw={30} ch={8} s={.8} label="x₂" />
        <text class="op" x={462} y={170}>=</text>
        <Col v={d.last.x3} x={490} y={40} cw={30} ch={8} s={.8} label="x₃" />
        <text class="nt" x={580} y={120}>{active} of 64 units above 0 at this position</text>
        <text class="nt" x={580} y={154}>the rest are exactly 0 after relu</text>
      </>],
    [<>the unembedding reads <b>only the last stream</b>: one score per vocabulary token, <Tex tex="s = U x_3" />, 36 numbers. no softmax yet.
      <div class="eg">highest score now: <b>{V[pred]}</b> (the model's current guess). target: <b class="g">4</b></div></>,
      <Bars36 v={d.logits} vocab={V} x={40} y={30} w={900} h={250} target={tgt} pred={pred} signed fmt={(n) => n.toFixed(2)} />],
    [<>cross-entropy turns the scores into probabilities and charges <Tex tex="-\log p(\text{target})" />.
      <div class="eg">this prediction: <Tex tex={`-\\log ${d.probs[tgt].toFixed(4)} = ${d.loss.toFixed(2)}`} />. an even guess over 36 would be <Tex tex={`\\ln 36 = ${d.ln36.toFixed(2)}`} /></div></>,
      <>
        <Bars36 v={d.probs} vocab={V} x={20} y={40} w={520} h={220} target={tgt} pred={pred} fmt={(n) => pct(n)} />
        <text class="nt" x={20} y={316}>this example's probabilities: one loss value</text>
        <foreignObject x={590} y={6} width={420} height={330}>
          <div class="lc">
            <div class="lch"><span class="tag-rec">recorded, other run</span> task 1: batch loss at each of 1,000 updates</div>
            {loss1 && <LineChart ys={loss1.map((r) => r.loss)} width={560} height={300} xLabel="update" refs={[{ y: Math.log(36), label: 'ln 36' }]} />}
          </div>
        </foreignObject>
      </>],
    [<>automatic differentiation applies the <b>chain rule</b> backwards through the graph, with the numbers saved from the forward pass. at the scores: <Tex tex="\partial L/\partial s = p - \text{onehot}(4)" />.
      <div class="eg"><Tex tex="\frac{\partial L}{\partial U} = \frac{\partial L}{\partial s}\,\frac{\partial s}{\partial U}" />, and so on to every parameter. only <b>8 of 36</b> rows of <Tex tex="E" /> get a nonzero gradient: the tokens in the input</div></>,
      <>
        <Bars36 v={d.dlogits} vocab={V} x={20} y={24} w={430} h={220} target={tgt} signed fmt={(n) => n.toFixed(3)} />
        <text class="nt" x={20} y={316}>∂L/∂s: the target pushed up, the rest down</text>
        {Object.entries(d.grad_norm).map(([k, v], i) => {
          const mx = Math.max(...Object.values(d.grad_norm));
          return <g>
            <text class="gn" x={640} y={34 + i * 21}>{k}</text>
            <rect class="gbar" x={650} y={20 + i * 21} width={Math.max(1, (v / mx) * 160)} height={15} />
          </g>;
        })}
        <text class="nt" x={510} y={316}>gradient size per tensor</text>
        {range(36).map((i) => (
          <g><rect class={`er ${d.emb_rows_grad[i] ? 'on' : ''}`} x={860} y={20 + i * 7.4} width={70} height={6.6} />
            </g>
        ))}
        <text class="nt" x={860} y={316}>rows of E with a gradient:</text>
        <text class="nt mono g" x={860} y={340}>{[...V].filter((_, i) => d.emb_rows_grad[i]).join(' ')}</text>
      </>],
    [<>the <b>optimizer</b> is a separate step: it reads the gradients and changes the parameters. Adam, learning rate <Tex tex="0.001" /> (the lab's configs).
      <div class="eg">same example, after this one step: loss <span class="nw"><b>{d.loss.toFixed(2)}</b> → <b>{d.update.loss_after.toFixed(2)}</b></span></div></>,
      <>
        <text class="nt" x={20} y={34}>U's row for "4", first 8 of 32 numbers</text>
        {d.update.U_target_before.map((b, i) => {
          const a = d.update.U_target_after[i];
          return <g>
            <text class="nt mono" x={20} y={74 + i * 30}>{b.toFixed(4)}</text>
            <text class="nt" x={110} y={74 + i * 30}>→</text>
            <text class="nt mono up" x={140} y={74 + i * 30}>{a.toFixed(4)}</text>
            <text class="nt mono" x={240} y={74 + i * 30}>{a - b >= 0 ? '+' : '−'}{Math.abs(a - b).toFixed(4)}</text>
          </g>;
        })}
        {Object.keys(d.update.changed).map((k, i) => {
          const c = d.update.changed[k], n = d.update.size[k];
          return <g>
            <text class="gn" x={520} y={34 + i * 21}>{k}</text>
            <rect class="cbar bg" x={530} y={20 + i * 21} width={200} height={15} />
            <rect class="cbar" x={530} y={20 + i * 21} width={200 * c / n} height={15} />
            <text class="gn l" x={740} y={34 + i * 21}>{c} / {n}</text>
          </g>;
        })}
        <text class="nt" x={400} y={316}>entries that moved: E only in the 8 used rows</text>
      </>],
  ];
  const [cap, pic] = S[step] ?? S[0];
  return (
    <div class="panel card">
      <div class="pt">
        <div class="kick">{step === 0 ? 'worked example' : `${step} · ${STAGES[step]}`}</div>
        <div class="cap">{cap}</div>
      </div>
      <svg class="pic" viewBox="0 0 1000 340">{pic}</svg>
    </div>
  );
}

export default function Backward() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<Step>('step'), t3 = useData('task3w'), t1 = useData('task1');
  return (
    <div class="bw" ref={root}>
      <div class="bin">
        <Graph step={step} />
        {d && <Panel step={step} d={d} t3={t3} t1={t1} />}
        <div class="split">
          <div class={`sp ad ${step === 7 ? 'on' : ''}`}><b>automatic differentiation</b>: how the loss changes with each parameter, through the whole graph</div>
          <div class={`sp op ${step === 8 ? 'on' : ''}`}><b>optimizer</b>: uses those gradients to change the parameters (Adam, SGD, …)</div>
        </div>
      </div>
      <style>{CHART_CSS + `
        .bw { flex: 1; min-height: 0; }
        .bw .bin { display: flex; flex-direction: column; gap: .35em; height: 100%; font-size: .6em; }
        .bw .graph { width: 100%; flex: none; height: 228px; overflow: visible; }
        .bw .fe { stroke: var(--line-2); stroke-width: 2.5; fill: none; }
        .bw .ah { fill: var(--line-2); }
        .bw .se { stroke: var(--line); stroke-width: 6; fill: none; stroke-linecap: round; }
        .bw .gk { font-size: 17px; fill: var(--muted); }
        .bw .gk.sk { text-anchor: middle; }
        .bw .gk.gb, .bw .gk.gu { opacity: 0; transition: opacity .3s; font-weight: 600; font-size: 19px; }
        .bw .gk.gb.on { opacity: 1; fill: var(--grad); transition-delay: 1.4s; }
        .bw .gk.gu.on { opacity: 1; fill: var(--update); }
        .bw .nd rect, .bw .nd circle { fill: var(--sunken); stroke: var(--line-2); stroke-width: 2; transition: all .3s; }
        .bw .nd text { font-size: 20px; font-weight: 600; fill: var(--fg); text-anchor: middle; }
        .bw .nd text.s { font-size: 14px; font-weight: 400; fill: var(--muted); font-family: var(--mono); }
        .bw .nd.add text { font-size: 28px; }
        .bw .nd.on rect, .bw .nd.on circle { stroke: var(--accent); stroke-width: 3.5; fill: color-mix(in srgb, var(--accent) 12%, var(--sunken)); }
        .bw .nd.loss rect { stroke: var(--loss); fill: color-mix(in srgb, var(--loss) 8%, var(--sunken)); }
        .bw .nd.loss text:not(.s) { fill: var(--loss); }
        .bw .nd.tgt rect { stroke: var(--target); fill: color-mix(in srgb, var(--target) 8%, var(--sunken)); }
        .bw .nd.tgt text { fill: var(--target); }
        .bw .prm rect { fill: color-mix(in srgb, var(--param) 8%, var(--sunken)); stroke: var(--param); stroke-width: 1.5; transition: all .3s; }
        .bw .prm text { font-family: var(--mono); font-size: 15px; fill: var(--param); text-anchor: middle; }
        .bw .prm .pe { stroke: color-mix(in srgb, var(--param) 50%, transparent); stroke-width: 2; stroke-dasharray: 4 4; }
        .bw .prm.grad rect { stroke: var(--grad); stroke-width: 3; transition-delay: 1.8s; }
        .bw .prm.upd rect { stroke: var(--update); stroke-width: 3.5; fill: color-mix(in srgb, var(--update) 16%, var(--sunken)); }
        .bw .prm.upd text { fill: var(--update); }
        .bw .ge { stroke: var(--grad); stroke-width: 3.5; fill: none; stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset .3s linear; }
        .bw .ge.on { stroke-dashoffset: 0; }
        .bw .panel { flex: 1; min-height: 0; display: grid; grid-template-columns: 430px 1fr; gap: 1em; padding: .5em .8em; }
        .bw .pt { display: flex; flex-direction: column; gap: .4em; min-width: 0; }
        .bw .cap { font-size: .95em; line-height: 1.38; }
        .bw .cap b { color: var(--fg); }
        .bw .cap .eg { margin-top: .5em; font-size: .9em; color: var(--muted); }
        .bw .cap .g, .bw .g { color: var(--target); fill: var(--target); }
        .bw .pic { width: 100%; height: 100%; min-height: 0; overflow: visible; }
        .bw .tb { fill: var(--panel); stroke: var(--border); stroke-width: 1.5; }
        .bw .tgtb { fill: color-mix(in srgb, var(--target) 10%, transparent); stroke: var(--target); stroke-width: 2.5; }
        .bw .tk { font-family: var(--mono); font-size: 30px; fill: var(--fg); text-anchor: middle; }
        .bw .tk.sm { font-size: 20px; }
        .bw .tk.dg, .bw .mx .rl.dg { fill: var(--digit); }
        .bw .arw { font-size: 30px; fill: var(--muted); }
        .bw .nt { font-size: 18px; fill: var(--muted); }
        .bw .nt.mono { font-family: var(--mono); fill: var(--fg); }
        .bw .nt.up { fill: var(--update); font-weight: 700; }
        .bw .lk { fill: none; stroke: var(--accent); stroke-width: 1.2; opacity: .45; }
        .bw .vc .frame { fill: none; stroke: var(--line); stroke-width: 1; }
        .bw .vc.w .frame { stroke: var(--attn); stroke-width: 2.5; }
        .bw .vc.m .frame { stroke: var(--mlp); stroke-width: 2.5; }
        .bw .vl { font-size: 16px; fill: var(--muted); text-anchor: middle; }
        .bw .op { font-size: 34px; fill: var(--muted); text-anchor: middle; }
        .bw .b36 .axis { stroke: var(--line-2); }
        .bw .b36 rect.lt { fill: var(--faint); } .bw .b36 rect.dg { fill: var(--digit); }
        .bw .b36 rect.tg { fill: var(--target); }
        .bw .b36 rect.pr { stroke: var(--fg); stroke-width: 2; }
        .bw .b36 .bl { font-family: var(--mono); font-size: 14px; fill: var(--muted); text-anchor: middle; }
        .bw .b36 .bl.tg { fill: var(--target); font-weight: 700; }
        .bw .b36 .bv { font-family: var(--mono); font-size: 16px; font-weight: 700; paint-order: stroke; stroke: var(--sunken); stroke-width: 4px; }
        .bw .b36 .bv.tg { fill: var(--target); }
        .bw .gn { font-family: var(--mono); font-size: 14px; fill: var(--muted); text-anchor: end; }
        .bw .gn.l { text-anchor: start; }
        .bw .gbar { fill: var(--grad); }
        .bw .cbar { fill: var(--update); } .bw .cbar.bg { fill: var(--surface); }
        .bw .er { fill: var(--surface); } .bw .er.on { fill: var(--grad); }
        .bw .erl { font-family: var(--mono); font-size: 11px; fill: var(--grad); }
        .bw .lc { font-size: 15px; padding-right: 24px; } .bw .lch { color: var(--muted); margin-bottom: 4px; display: flex; gap: .6em; align-items: center; }
        .bw .chart .tk { font-size: 16px; }
        .bw .split { display: grid; grid-template-columns: 1fr 1fr; gap: .8em; flex: none; }
        .bw .sp { font-size: .82em; padding: .3em .7em; border-radius: 8px; color: var(--muted); transition: all .3s; }
        .bw .sp b { color: var(--fg); }
        .bw .sp.ad b { color: var(--grad); } .bw .sp.op b { color: var(--update); }
        .bw .sp.ad.on { background: color-mix(in srgb, var(--grad) 14%, transparent); color: var(--fg); }
        .bw .sp.op.on { background: color-mix(in srgb, var(--update) 14%, transparent); color: var(--fg); }
      `}</style>
    </div>
  );
}
