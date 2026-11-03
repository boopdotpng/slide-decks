/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { Tex, useIsland, range } from './viz';
import './roles';

/**
 * Slide 8: one training update in tinygrad 0.14.0, a line at a time, with the four workflow tabs following the code.
 * The small picture beside each step is the same run as slide 4 (step.json, export_step.py: a task-3-shaped model,
 * fresh weights, a2f5c9d3fc → 4), so the numbers agree across the two slides. export_step.py makes these same calls.
 *   0 the whole update   1 preparation: training context, clear gradients   2 predict   3 measure error
 *   4 calculate gradients   5 update
 */
type S = { vocab: string; target: string; logits: number[]; probs: number[]; loss: number; dlogits: number[]; emb_rows_grad: boolean[];
  update: { U_target_before: number[]; U_target_after: number[]; loss_after: number } };
const SRC = `with Context(TRAINING=1):
    optimizer.zero_grad()
    logits = model(tokens)
    loss = logits.sparse_categorical_crossentropy(
        targets
    )
    loss.backward()
    optimizer.step()`;
const HL: number[][] = [[], [0, 1], [2], [3, 4, 5], [6], [7]];
const TABS = ['predict', 'measure error', 'calculate gradients', 'update'];

function Bars({ v, vocab, target, w = 560, h = 150, signed = false }: { v: number[]; vocab: string; target: number; w?: number; h?: number; signed?: boolean }) {
  const max = Math.max(...v.map(Math.abs)), bw = w / v.length, base = signed ? h / 2 : h, k = (signed ? h / 2 : h) / max;
  return (
    <svg class="bars" viewBox={`0 0 ${w} ${h + 24}`}>
      <line x1="0" x2={w} y1={base} y2={base} class="ax" />
      {v.map((n, i) => {
        const hh = Math.abs(n) * k;
        return <g>
          <rect class={`${i === target ? 'tg' : /\d/.test(vocab[i]) ? 'dg' : 'lt'}`} x={i * bw + 1} y={n >= 0 ? base - hh : base} width={bw - 2} height={Math.max(1, hh)} />
          {/\d/.test(vocab[i]) && <text class={i === target ? 'tg' : ''} x={i * bw + bw / 2} y={h + 20}>{vocab[i]}</text>}
        </g>;
      })}
    </svg>
  );
}

export default function TrainStep() {
  const { root, step, d } = useIsland<S>('step');
  const tab = step >= 2 ? step - 2 : -1;
  const tgt = d ? d.vocab.indexOf(d.target) : 0;
  const pic: ComponentChildren[] = d ? [
    <><div class="vh">one update, every line once</div><p>an illustrative update: the lab doesn't ship a training harness, you build the loop around this. the calls are checked against tinygrad 0.14.0: this deck's worked example (slide 4) makes these same calls</p></>,
    <><div class="vh">preparation</div>
      <p><code>Context(TRAINING=1)</code>: training mode. tinygrad's optimizer refuses to <code>step()</code> outside it</p>
      <p><code>zero_grad()</code>: forget the last update's gradients (each parameter's <code>.grad</code> is cleared), so this update's don't add onto them</p></>,
    <><div class="vh">predict: <code>logits</code>, shape (16, 36)</div><Bars v={d.logits} vocab={d.vocab} target={tgt} signed />
      <p class="mut">one row: a2f5c9d3fc, fresh weights. the model returns only the <b>final position's</b> scores</p></>,
    <><div class="vh">measure error: one number</div>
      <div class="big"><Tex tex={`L = -\\log p(\\text{4}) = -\\log ${d.probs[tgt].toFixed(4)} = ${d.loss.toFixed(2)}`} /></div>
      <p class="mut">over a batch: the mean of these, shape <code>()</code>. it takes the raw scores: the log-softmax happens inside, so no <code>softmax</code> goes before it</p></>,
    <><div class="vh">calculate gradients: <Tex tex="\partial L / \partial s = p - \text{onehot}(4)" /></div><Bars v={d.dlogits} vocab={d.vocab} target={tgt} signed h={130} />
      <p class="mut">then on back through the graph into every parameter's <code>.grad</code>. nothing has changed yet. embedding rows the input never used: gradient 0 ({d.emb_rows_grad.filter((g) => !g).length} of 36)</p></>,
    <><div class="vh">update: the parameters change</div>
      <div class="upd">{range(4).map((i) => (
        <div><code>{d.update.U_target_before[i].toFixed(4)}</code> → <code class="u">{d.update.U_target_after[i].toFixed(4)}</code></div>
      ))}</div>
      <p class="mut">U's row for "4", first four numbers. same example after this step: loss {d.loss.toFixed(2)} → <b>{d.update.loss_after.toFixed(2)}</b></p></>,
  ] : [];
  return (
    <div class="tr8" ref={root}><div class="tin">
      <div class="lc">
        <div class="card bar-a code">
          <div class="kick">python · tinygrad 0.14.0</div>
          <Code lang="py" code={SRC} hl={HL[step]} />
        </div>
        <div class="card wf">
          <span class="kick">workflow summary</span>
          <div class="tabs">{TABS.map((t, i) => (
            <div class={`tab ${tab === i ? 'on' : ''} ${tab > i ? 'done' : ''} t${i}`}><div class="n">step {i + 1}</div><div class="t">{t}</div></div>
          ))}</div>
        </div>
      </div>
      <div class="rc">
        <div class={`card pic s${step}`}>{pic[step]}</div>
        <div class="card bar-a km">
          <h3>key methods</h3>
          <div class={step === 4 ? 'on' : ''}><code>backward()</code> calculates gradients</div>
          <div class={step === 5 ? 'on' : ''}><code>step()</code> changes parameters</div>
        </div>
        <div class="card bar-l km">
          <h3>grading and loss</h3>
          <div class={step === 2 ? 'on' : ''}>only the final position is graded</div>
          <div class={step === 3 ? 'on' : ''}>cross-entropy takes scores directly</div>
        </div>
      </div>
    </div>
      <style>{`
        .tr8 { flex: 1; min-height: 0; }
        .tr8 .tin { display: grid; grid-template-columns: 1fr 640px; gap: .8em; height: 100%; font-size: .62em; }
        .tr8 .lc, .tr8 .rc { display: flex; flex-direction: column; gap: .6em; min-height: 0; min-width: 0; }
        .tr8 .code { flex: 1; display: flex; flex-direction: column; gap: .3em; }
        .tr8 .code pre { font-size: 1.05em; margin: 0; background: none; }
                .tr8 .tabs { display: grid; grid-template-columns: repeat(4, 1fr); gap: .5em; margin-top: .4em; }
        .tr8 .tab { border-radius: 8px; padding: .35em .6em; transition: all .3s; opacity: .6; }
        .tr8 .tab .n { font-size: .7em; color: var(--muted); }
        .tr8 .tab .t { font-weight: 700; color: var(--accent); font-size: .9em; }
        .tr8 .tab.done { opacity: .85; }
        .tr8 .tab.on { opacity: 1; background: color-mix(in srgb, var(--accent) 14%, transparent); }
        .tr8 .tab.t1.on { background: color-mix(in srgb, var(--loss) 14%, transparent); } .tr8 .tab.t1 .t { color: var(--loss); }
        .tr8 .tab.t2.on { background: color-mix(in srgb, var(--grad) 14%, transparent); } .tr8 .tab.t2 .t { color: var(--grad); }
        .tr8 .tab.t3.on { background: color-mix(in srgb, var(--update) 14%, transparent); } .tr8 .tab.t3 .t { color: var(--update); }
        .tr8 .pic { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: .3em; }
        .tr8 .pic p { font-size: .9em; margin: .2em 0; }
        .tr8 .pic .mut { color: var(--muted); }
        .tr8 .pic .mut b { color: var(--fg); }
        .tr8 .vh { font-weight: 700; color: var(--fg); }
        .tr8 .pic.s3 .vh { color: var(--loss); } .tr8 .pic.s4 .vh { color: var(--grad); } .tr8 .pic.s5 .vh { color: var(--update); }
        .tr8 .big { font-size: 1.15em; padding: .3em 0; }
        .tr8 .bars { width: 100%; }
        .tr8 .bars .ax { stroke: var(--line-2); }
        .tr8 .bars rect.lt { fill: var(--faint); } .tr8 .bars rect.dg { fill: var(--digit); } .tr8 .bars rect.tg { fill: var(--target); }
        .tr8 .bars text { font-family: var(--mono); font-size: 13px; fill: var(--muted); text-anchor: middle; } .tr8 .bars text.tg { fill: var(--target); font-weight: 700; }
        .tr8 .upd { display: grid; grid-template-columns: 1fr 1fr; gap: .2em 1em; font-size: .95em; }
        .tr8 .upd .u { color: var(--update); font-weight: 700; }
        .tr8 .km { font-size: .9em; }
        .tr8 .km > div { color: var(--muted); transition: color .3s; }
        .tr8 .km > div.on { color: var(--fg); font-weight: 600; }
        .tr8 .km h3 { color: var(--accent); } .tr8 .bar-l h3 { color: var(--loss); }
      `}</style>
    </div>
  );
}
