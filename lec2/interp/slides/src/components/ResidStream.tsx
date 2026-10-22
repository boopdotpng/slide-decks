/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { range } from './viz';

/**
 * One stream per position, running bottom to top. Schematic, one layer.
 *   0 each position starts as its token's embedding: that vector is its residual stream
 *   1 attention reads other positions' streams and adds into this one (arcs into the last position)
 *   2 the mlp reads one stream and adds back into the same one
 *   3 the unembedding reads the last stream
 *   4 nothing overwrites: every piece reads and adds
 */
const TEXT = 'a2f5c9d3f';
const N = TEXT.length, LAST = N - 1;
const W = 1400, H = 560;
const x = (i: number) => 290 + i * 125;
const Y = { tok: 540, emb: 470, attnIn: 410, attn: 370, attnAdd: 320, mlp: 240, mlpAdd: 175, top: 110, out: 60 };

const CAPS = [
  <>each position starts as one vector, its token's embedding. that vector is its <b>residual stream</b></>,
  <>attention reads the streams at earlier positions and <b>adds</b> into this one. the only way anything moves between positions</>,
  <>the mlp reads one position's stream and <b>adds</b> back into the same one. no mixing</>,
  <>the unembedding reads the last stream and scores every token in the vocab</>,
  <>nothing is overwritten, unlike the rnn's stream. every piece reads the stream and adds to it: <code>x = x + f(x)</code></>,
];

const CAPS_NONE = [
  CAPS[0],
  <>with no layers, the unembedding reads the last stream directly and scores every token in the vocab</>,
];

function Plus({ cx, cy, on }: { cx: number; cy: number; on: boolean }) {
  return (
    <g class={`plus ${on ? 'on' : ''}`}>
      <circle cx={cx} cy={cy} r="13" />
      <path d={`M ${cx - 7} ${cy} H ${cx + 7} M ${cx} ${cy - 7} V ${cy + 7}`} />
    </g>
  );
}

/** layers={false}: just the streams and the unembedding (a model with no layers), 2 steps instead of 5 */
export default function ResidStream({ layers = true }: { layers?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const raw = useSlideStep(root);
  // without layers, step 1 jumps straight to the unembedding and stops there
  const step = layers ? raw : raw >= 1 ? 3 : 0;
  const arc = (j: number) => {
    const h = 30 + (LAST - j) * 6;
    return `M ${x(j)} ${Y.attnIn} C ${x(j)} ${Y.attnIn - h}, ${x(LAST)} ${Y.attnAdd + 50 - h}, ${x(LAST) - 14} ${Y.attnAdd + 8}`;
  };

  return (
    <div class="resid" ref={root}>
      <svg viewBox={`0 0 ${W} ${H}`}>
        {/* row labels */}
        <text class={`lbl fade ${step >= 0 ? 'on' : ''}`} x="20" y={Y.emb + 8}>embedding</text>
        {layers && <>
          <text class={`lbl fade ${step >= 1 ? 'on' : ''}`} x="20" y={Y.attn + 8}>attention</text>
          <text class={`lbl fade ${step >= 2 ? 'on' : ''}`} x="20" y={Y.mlp + 8}>mlp</text>
        </>}
        <text class={`lbl fade ${step >= 3 ? 'on' : ''}`} x="20" y={Y.out + 8}>unembed</text>

        {/* the streams */}
        {range(N).map((i) => (
          <g class={`col ${step === 1 && i !== LAST ? 'dim' : ''}`}>
            <line class="stream" x1={x(i)} x2={x(i)} y1={Y.emb} y2={Y.top} />
            <circle class="emb" cx={x(i)} cy={Y.emb} r="9" />
            <text class={`tok ${/\d/.test(TEXT[i]) ? 'dg' : ''}`} x={x(i)} y={Y.tok}>{TEXT[i]}</text>
          </g>
        ))}

        {/* attention: one band; reads every earlier stream, writes into each */}
        {layers && <g class={`fade ${step >= 1 ? 'on' : ''}`}>
          <rect class="band" x={x(0) - 50} y={Y.attn - 22} width={x(LAST) - x(0) + 100} height="44" rx="10" />
          <g class={`arcs ${step === 1 ? 'on' : ''}`}>{range(N).map((j) => <path d={arc(j)} />)}</g>
          {range(N).map((i) => <Plus cx={x(i)} cy={Y.attnAdd} on={step === 1 ? i === LAST : step >= 1} />)}
        </g>}

        {/* mlp: a box on each stream, reads it, adds back into it */}
        {layers && <g class={`fade ${step >= 2 ? 'on' : ''}`}>
          {range(N).map((i) => (
            <g>
              <rect class="mlpbox" x={x(i) - 34} y={Y.mlp - 20} width="68" height="40" rx="8" />
              <Plus cx={x(i)} cy={Y.mlpAdd} on={step >= 2} />
            </g>
          ))}
        </g>}

        {/* unembedding reads the last stream */}
        <g class={`fade ${step >= 3 ? 'on' : ''}`}>
          <line class="stream last" x1={x(LAST)} x2={x(LAST)} y1={Y.top} y2={Y.out + 22} />
          <rect class="unemb" x={x(LAST) - 95} y={Y.out - 22} width="190" height="44" rx="10" />
          <text class="ulbl" x={x(LAST)} y={Y.out + 7}>36 scores</text>
        </g>
      </svg>
      <div class="caption cap">{layers ? CAPS[Math.min(step, CAPS.length - 1)] : step >= 3 ? CAPS_NONE[1] : CAPS_NONE[0]}</div>
      <style>{`
        .resid svg { width: 100%; display: block; overflow: visible; }
        .resid .lbl { font-family: var(--mono); font-size: 26px; fill: var(--muted); }
        .resid .col { transition: opacity .3s; }
        .resid .col.dim { opacity: .35; }
        .resid .stream { stroke: var(--raised-2); stroke-width: 10; stroke-linecap: round; }
        .resid .stream.last { stroke: var(--accent); stroke-width: 4; }
        .resid .emb { fill: var(--accent); }
        .resid .tok { font-family: var(--mono); font-size: 40px; fill: var(--fg); text-anchor: middle; }
        .resid .tok.dg { fill: var(--hot); }
        .resid .band { fill: color-mix(in srgb, var(--accent) 08%, transparent); stroke: var(--accent); stroke-width: 2; }
        .resid .mlpbox { fill: color-mix(in srgb, var(--purple) 10%, transparent); stroke: var(--purple); stroke-width: 2; }
        .resid .unemb { fill: color-mix(in srgb, var(--good) 10%, transparent); stroke: var(--good); stroke-width: 2; }
        .resid .ulbl { font-family: var(--mono); font-size: 24px; fill: var(--good); text-anchor: middle; }
        .resid .arcs path { fill: none; stroke: var(--accent); stroke-width: 2.5; opacity: 0; transition: opacity .4s; }
        .resid .arcs.on path { opacity: .8; }
        .resid .plus circle { fill: var(--bg); stroke: var(--faint); stroke-width: 2; transition: stroke .3s; }
        .resid .plus path { stroke: var(--faint); stroke-width: 2.5; transition: stroke .3s; }
        .resid .plus.on circle, .resid .plus.on path { stroke: var(--fg); }
        .resid .fade { transition: opacity .35s; }
        .resid .cap { font-size: .8em; min-height: 2.6em; }
        .resid code { white-space: nowrap; font-family: var(--mono); color: var(--fg); }
      `}</style>
    </div>
  );
}
