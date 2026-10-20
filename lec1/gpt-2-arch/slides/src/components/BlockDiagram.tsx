/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code from './Code';
import { useSlideStep } from '../deck/hooks';
import { Bars, Shape, useData } from './viz';

/**
 * One transformer block. The residual stream x runs straight through; attn and
 * mlp each read a normalized copy and *add* their output back. Steps:
 *  1. input_layernorm   2. self_attn, added back   3. post_attention_layernorm   4. mlp, added back   5. stack 12 of them: how big x gets (real norms)
 */
const SRC = `
def __call__(self, x, start_pos):
  x = x + self.self_attn(self.input_layernorm(x), start_pos)
  x = x + self.mlp(self.post_attention_layernorm(x))
  return x`;
const HL: Record<number, number[]> = { 1: [1], 2: [1], 3: [2], 4: [2] };

export default function BlockDiagram() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  const sh = <Shape dims={[1, 'S', 768]} />;

  return (
    <div class="bd" ref={root}>
      <div class="left">
        <div class="dia">
          <div class="stream" />
          <div class="node io">x {sh}</div>
          <div class={`branch ${step === 1 || step === 2 ? 'on' : ''}`}>
            <span class={`box ${step === 1 ? 'cur' : ''}`}>input_layernorm</span><span class="ar">→</span>
            <span class={`box big ${step === 2 ? 'cur' : ''}`}>self_attn</span><span class="ar">→</span><span class={`plus ${step === 2 ? 'cur' : ''}`}>+</span>
          </div>
          <div class={`branch ${step === 3 || step === 4 ? 'on' : ''}`}>
            <span class={`box ${step === 3 ? 'cur' : ''}`}>post_attention_layernorm</span><span class="ar">→</span>
            <span class={`box big ${step === 4 ? 'cur' : ''}`}>mlp</span><span class="ar">→</span><span class={`plus ${step === 4 ? 'cur' : ''}`}>+</span>
          </div>
          <div class="node io">x {sh}</div>
        </div>
        <Code lang="py" code={SRC} hl={HL[step]} />
      </div>
      <div class={`norms fade ${step >= 5 ? 'on' : ''}`}>
        {d && <>
          <div class="lbl">‖x‖ after each block, last token</div>
          <Bars values={d.resid_norm} labels={d.resid_norm.map((_: number, i: number) => `block ${i}`)} width={300}
            fmtV={(v) => v.toFixed(0)} />
        </>}
      </div>
      <style>{`
        .bd { display: flex; gap: 4em; align-items: center; font-size: .8em; }
        .bd .left { display: flex; flex-direction: column; gap: 1em; }
        .bd .dia { position: relative; display: flex; flex-direction: column; gap: .9em; padding-left: 1.4em; }
        .bd .stream { position: absolute; left: .35em; top: .6em; bottom: .6em; width: 4px; border-radius: 2px; background: var(--accent); opacity: .6; }
        .bd .node { font-size: .8em; }
        .bd .branch { display: flex; align-items: center; gap: .4em; opacity: .55; transition: opacity .3s; font-size: .8em; }
        .bd .branch.on { opacity: 1; }
        .bd .box { border: 1px solid var(--border); border-radius: 6px; padding: .15em .6em; background: var(--panel); transition: border-color .3s; }
        .bd .box.cur { border-color: var(--accent); color: var(--fg); }
        .bd .ar { color: var(--muted); }
        .bd .plus { color: var(--accent); font-weight: 700; transition: transform .3s; }
        .bd .plus.cur { transform: scale(1.5); }
        .bd pre { font-size: .75em; }
      `}</style>
    </div>
  );
}
