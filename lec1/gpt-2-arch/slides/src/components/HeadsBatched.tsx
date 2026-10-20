/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import Code from './Code';
import { useSlideStep } from '../deck/hooks';
import { Mat, Op } from './mat';

/**
 * The rest of the formula as matmuls, then batched over heads. Shapes only, all 14 positions.
 * Steps:
 *  0. one head: q (14, 64) @ kᵀ (64, 14) = scores (14, 14) -> softmax -> @ v (14, 64) = out (14, 64)
 *  1. the same with a leading head dim of 12: @ multiplies the last two dims, the head dim rides along
 *  2. the loop it replaces, next to the one line that runs, and the textbook formula
 */
const Dh = 40, S = 96; // 64, 14
const Y = 70, MID = Y + S / 2, G = 100, LY = Y + S + 26, OFF = 55; // OFF: how far a 12-stack sticks out
const xs: number[] = [];
{ let x = 50; for (const w of [Dh, S, S, S, Dh, Dh]) { xs.push(x); x += w + G; } }
const [XQ, XK, XSC, XP, XV, XO] = xs;
const W = XO + Dh + OFF + 30;

const LOOP = `
for h in range(12):   # what it means: 12 separate attentions
  out[h] = (q[h] @ k[h].T / 8).softmax(-1) @ v[h]`;
const BATCHED = `
# what runs: one call, (B, 12, S, 64) in and out
out = (q @ k.transpose(-2, -1) * head_dim ** -0.5).softmax(-1) @ v`;
const TEX = katex.renderToString('\\operatorname{Attention}(Q, K, V) = \\operatorname{softmax}\\!\\left(\\frac{QK^\\top}{\\sqrt{d}}\\right) V', { displayMode: true });

const CAP = [
  <>one head, all 14 tokens at once: row i of the scores is token i's q·k against every token. the last row is the one we followed (the other rows get masked: that's in prefill)</>,
  <><b>@</b> only multiplies the last two dims. the leading 12 just rides along: 12 independent attentions in one call, none of them sees another</>,
  null,
];

export default function HeadsBatched() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const n = step >= 1 ? 12 : 1;
  const sh = (s: string) => (step >= 1 ? `(12, ${s})` : `(${s})`);
  const ox = (x: number) => x - (G - (n > 1 ? OFF : 0)) / 2; // operator centered in the free gap

  return (
    <div class="hb" ref={root}>
      <svg width={W} height={LY + 26} viewBox={`0 0 ${W} ${LY + 26}`}>
        <Mat x={XQ} y={Y} w={Dh} h={S} stack={n} labelY={LY} label="q" sub={sh('14, 64')} />
        <Op x={ox(XK)} y={MID} t="@" />
        <Mat x={XK} y={Y + (S - Dh) / 2} w={S} h={Dh} stack={n} labelY={LY} label="kᵀ" sub={sh('64, 14')} />
        <Op x={ox(XSC)} y={MID} t="=" />
        <Mat x={XSC} y={Y} w={S} h={S} stack={n} labelY={LY} label="scores" sub={sh('14, 14')} />
        <Op x={ox(XP)} y={MID} t="→" />
        <Mat x={XP} y={Y} w={S} h={S} stack={n} labelY={LY} label="softmax" sub={sh('14, 14')} />
        <Op x={ox(XV)} y={MID} t="@" />
        <Mat x={XV} y={Y} w={Dh} h={S} stack={n} labelY={LY} label="v" sub={sh('14, 64')} />
        <Op x={ox(XO)} y={MID} t="=" />
        <Mat x={XO} y={Y} w={Dh} h={S} stack={n} fill="#60a5fa" labelY={LY} label="out" sub={sh('14, 64')} />
      </svg>
      {CAP[step] && <div class="cap">{CAP[step]}</div>}
      <div class={`codes fade ${step >= 2 ? 'on' : ''}`}>
        <Code lang="py" code={LOOP} />
        <Code lang="py" code={BATCHED} />
        <div class="tex" dangerouslySetInnerHTML={{ __html: TEX }} />
      </div>
      <style>{`
        .hb { font-size: .8em; display: flex; flex-direction: column; gap: .4em; }
        .hb .ml { fill: var(--muted); font-family: var(--mono); font-size: 13px; }
        .hb .mop { fill: var(--fg); font-size: 24px; }
        .hb .cap { font-size: .62em; color: var(--muted); max-width: 52em; min-height: 2em; }
        .hb .cap b { color: var(--fg); font-family: var(--mono); font-weight: normal; }
        .hb .codes { display: flex; flex-direction: column; gap: .3em; }
        .hb .codes pre { font-size: .62em; margin: 0; }
        .hb .tex { font-size: .8em; }
        .hb .tex .katex-display { margin: .3em 0 0; text-align: left; }
        .hb .tex .katex-display > .katex { text-align: left; }
      `}</style>
    </div>
  );
}
