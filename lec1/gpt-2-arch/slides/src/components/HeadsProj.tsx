/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Mat, Op } from './mat';

/**
 * q_proj is just the 12 heads' W_Q placed side by side. Shapes only, all 14 positions.
 * Steps:
 *  0. one head, as in the formula: x (14, 768) @ head 7's W_Q (768, 64) = head 7's q (14, 64)
 *  1. all 12 bands at once: x @ W_Q (768, 768) = q (14, 768). band h of the output only uses band h of W
 *  2. the reshape: cut q's 12 bands apart and stack them, (1, 14, 768) -> (1, 12, 14, 64). no math
 */
const HEAD = 7;
const D = 240, Dh = 20, S = 56; // 768, 64, 14
const Y0 = 24, YR = Y0 + (D - S) / 2, MID = YR + S / 2;
const XX = 30, XW = XX + D + 70, XQ = XW + D + 70, XS = XQ + D + 90;

const CAP = [
  <>one head, exactly the formula: each row of x (a token) times head 7's W<sub>Q</sub> gives that token's 64-number q</>,
  <>q_proj stores all 12 heads' W<sub>Q</sub> side by side: <b>(768, 768) = 12 × (768, 64)</b>. one matmul computes every head's q at once.
    band h of the output only ever touches band h of W: the heads never mix. same for k_proj, v_proj</>,
  <>the reshape does no math: it cuts q into its 12 bands and stacks them. now "head" is just another dimension</>,
];

export default function HeadsProj() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const one = step === 0;

  return (
    <div class="hp" ref={root}>
      <svg width={XS + 130} height={Y0 + D + 40} viewBox={`0 0 ${XS + 130} ${Y0 + D + 40}`}>
        <Mat x={XX} y={YR} w={D} h={S} label="x (14, 768)" />
        <Op x={XW - 35} y={MID} t="@" />
        <Mat x={XW} y={Y0} w={D} h={D} bands={12} hl={HEAD} only={one ? HEAD : undefined}
          label={one ? 'W_Q, head 7 (768, 64)' : 'q_proj = W_Q (768, 768)'} />
        <Op x={XQ - 35} y={MID} t="=" />
        <g opacity={step >= 2 ? 0.25 : 1}>
          <Mat x={XQ} y={YR} w={D} h={S} bands={12} hl={HEAD} only={one ? HEAD : undefined}
            label={one ? 'q, head 7 (14, 64)' : 'q (14, 768)'} />
        </g>
        <g class={`fade ${step >= 2 ? 'on' : ''}`}>
          <Op x={XS - 45} y={MID} t="→" />
          <Mat x={XS} y={YR} w={Dh} h={S} stack={12} fill="#60a5fa" label="(12, 14, 64)" />
        </g>
      </svg>
      <div class="cap">{CAP[step]}</div>
      <style>{`
        .hp { font-size: .8em; display: flex; flex-direction: column; gap: .4em; }
        .hp .ml { fill: var(--muted); font-family: var(--mono); font-size: 13px; }
        .hp .mop { fill: var(--fg); font-size: 26px; }
        .hp .cap { font-size: .62em; color: var(--muted); max-width: 52em; min-height: 3em; }
        .hp .cap b { color: var(--fg); font-weight: normal; font-family: var(--mono); }
      `}</style>
    </div>
  );
}
