/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';

/**
 * How every model in the deck is trained, on the hidden digit task's real first rows (hidden_digit_dataset, seed 0).
 *   0 the examples: generated, with a held-out test set
 *   1 pick a random batch · 2 run the model · 3 the loss · 4 nudge the weights, repeat · 5 test on held-out examples
 */
const TRAIN: [string, string][] = [['w7nhibbae', '7'], ['vqxnpz0qo', '0'], ['oyhvra3wo', '3'], ['atsw1cwao', '1'], ['c8mkkaada', '8'], ['rnq9qtjlz', '9']];
const TEST = ['vsri2bpgd', 't6oiwgtwm', 'ay4rotspx'];
const PICKED = [1, 2, 4];
const STEPS = [
  <>sample <b>512</b> examples</>,
  <>forward → <b>36 scores</b> → probabilities</>,
  <><b>loss</b> = −log p(answer)
    <span class="eg">1-in-10 guess: <b>2.30</b> · 99% sure and right: <b>0.01</b></span></>,
  <><b>optimizer</b> step · <b>repeat</b> ×1,000–2,000</>,
  <><b>test</b> on held-out examples</>,
];

export default function TrainLoop() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const row = ([x, y]: [string, string], i: number) => (
    <div class={`ex ${step >= 1 && step <= 4 && PICKED.includes(i) ? 'pick' : ''}`}><code>{x}</code><span class="arr">→</span><code class="y">{y}</code></div>
  );
  return (
    <div class="tl" ref={root}>
      <div class="data">
        <div class="lbl">training examples <span class="muted">· 10,000</span></div>
        {TRAIN.map(row)}
        <div class="ex more">…</div>
        <div class={`test ${step >= 5 ? 'on' : ''}`}>
          <div class="lbl">test examples <span class="muted">· 1,000, never trained on</span></div>
          {TEST.map((x) => <div class="ex"><code>{x}</code><span class="arr">→</span><code class="y">?</code></div>)}
        </div>
      </div>
      <ol class="loop">
        {STEPS.map((s, i) => <li class={`fade ${step > i ? 'on' : ''} ${step === i + 1 ? 'now' : ''}`}>{s}</li>)}
      </ol>
      <style>{`
        .tl { display: grid; grid-template-columns: auto 1fr; gap: 4em; align-items: start; font-size: .8em; }
        .tl .lbl { font-size: .7em; margin-bottom: .4em; }
        .tl .ex { display: flex; gap: .6em; align-items: center; padding: .1em .5em; border-radius: 6px; transition: background .3s; }
        .tl .ex code { font-size: 1em; background: none; padding: 0; letter-spacing: .05em; }
        .tl .ex .y { color: var(--good); }
        .tl .ex .arr { color: var(--muted); }
        .tl .ex.pick { background: var(--hl); }
        .tl .ex.more { color: var(--muted); }
        .tl .test { margin-top: 1em; padding-top: .6em; border-top: 1px dashed var(--border); opacity: .45; transition: opacity .3s; }
        .tl .test.on { opacity: 1; }
        .tl .test .y { color: var(--muted); }
        .tl .loop { margin: 0; padding-left: 1.3em; display: flex; flex-direction: column; gap: .7em; }
        .tl .loop li { padding: .2em .4em; border-radius: 6px; transition: background .3s, opacity .35s; }
        .tl .loop li.now { background: var(--hl); }
        .tl .loop b { color: var(--fg); }
        .tl .eg { display: block; font-size: .8em; color: var(--muted); margin-top: .2em; }
        .tl .eg b { font-family: var(--mono); }
      `}</style>
    </div>
  );
}
