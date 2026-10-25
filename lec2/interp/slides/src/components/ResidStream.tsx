/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Tex, range } from './viz';
import './roles';

/**
 * One stream per position, running top to bottom (embedding first, the 36 scores last). Schematic, one layer. Every write is a chip on the stream,
 * so a column ends up showing its stream as the sum of what was added to it.
 *   0 each position starts as its token's embedding: that vector is its residual stream
 *   1 attention for one position (the last): pulls from a few earlier streams, adds a vector into its own
 *   2 every position does the same, all at once, each from its own few
 * which streams each position reads (READS) is made up, on purpose: not the lookup the tasks will need. the last f
 * stays away from the first f and its 5, so this slide doesn't give task 2 away
 *   3 the mlp: each position reads its own stream and adds back into it
 *   4 the unembedding reads only the last stream
 *   5 nothing overwrites: x = x + f(x)
 */
const TEXT = 'a2f5c9d3f';
const N = TEXT.length, LAST = N - 1;
const W = 1400, H = 600;
const x = (i: number) => 290 + i * 125;
const Y = { tok: 64, emb: 100, read: 128, attn: 263, mlp: 393, top: 477, out: 565 };
const CW = 56, CH = 30;
/** per position: the earlier streams it reads, each with a weight (line width) */
const READS: [number, number][][] = [
  [[0, 1]],
  [[0, .7], [1, .4]],
  [[1, .8], [2, .3]],
  [[0, .5], [2, .9]],
  [[1, .6], [3, .4]],
  [[2, .3], [4, .9]],
  [[0, .4], [3, .7], [6, .3]],
  [[5, .8], [6, .5]],
  [[1, .5], [5, .9], [6, .4]],
];

const CAPS = [
  <>one vector per position: its <b>residual stream</b>. stacked, one row each: <Tex tex="X" />, <Tex tex="9 \times 32" /></>,
  <>attention at f: pulls from a few earlier streams (which ones is learned), <b>adds</b> a vector into its own</>,
  <>every position does the same, at once: one matmul on all of <Tex tex="X" />, each reads only earlier streams</>,
  <>mlp: each position reads its own stream, <b>adds</b> back into it</>,
  <>unembed reads only the last stream → 36 scores</>,
  <>nothing overwrites: <Tex tex="x \leftarrow x + f(x)" /></>,
];

const CAPS_NONE = [
  CAPS[0],
  <>no layers: unembed reads the last stream → 36 scores</>,
];

/** a write into the stream: a chip on it at height cy */
function Chip({ cx, cy, kind, on, delay = 0 }: { cx: number; cy: number; kind: string; on: boolean; delay?: number }) {
  return (
    <g class={`chip ${kind} fade ${on ? 'on' : ''}`} style={{ transitionDelay: on ? `${delay}ms` : '0ms' }}>
      <rect x={cx - CW / 2} y={cy - CH / 2} width={CW} height={CH} rx="6" />
      {kind !== 'emb' && <path d={`M ${cx - 7} ${cy} H ${cx + 7} M ${cx} ${cy - 7} V ${cy + 7}`} />}
    </g>
  );
}

/** attention read: from stream j (just below its embedding) down into position i's attention chip */
function arc(j: number, i: number) {
  const ey = Y.attn - CH / 2;
  if (j === i) return `M ${x(i)} ${Y.read} V ${ey}`;
  return `M ${x(j)} ${Y.read} C ${x(j)} ${Y.read + 80}, ${x(i)} ${ey - 70}, ${x(i)} ${ey}`;
}

/** mlp read: out of the stream above the chip and back into the chip's side */
const loop = (i: number) => {
  const sy = Y.attn + CH / 2 + 22;
  return `M ${x(i)} ${sy} C ${x(i) + 55} ${sy + 10}, ${x(i) + 55} ${Y.mlp - 4}, ${x(i) + CW / 2} ${Y.mlp}`;
};

/** layers={false}: just the streams and the unembedding (a model with no layers), 2 steps instead of 6 */
export default function ResidStream({ layers = true }: { layers?: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const raw = useSlideStep(root);
  // without layers, step 1 jumps straight to the unembedding and stops there
  const step = layers ? raw : raw >= 1 ? 4 : 0;
  // which positions have done attention so far: just the last at step 1, all from step 2
  const attended = (i: number) => (step === 1 ? i === LAST : step >= 2);
  // stagger step 2's reads left to right
  const delay = (i: number) => (step === 2 && i !== LAST ? i * 90 : 0);

  return (
    <div class="resid" ref={root}>
      <svg viewBox={`0 0 ${W} ${H}`}>
        {/* row labels */}
        <text class="lbl" x="20" y={Y.emb + 8}>embedding</text>
        {layers && <>
          <text class={`lbl fade ${step >= 1 ? 'on' : ''}`} x="20" y={(Y.read + Y.attn) / 2 + 8}>attention</text>
          <text class={`lbl fade ${step >= 3 ? 'on' : ''}`} x="20" y={Y.mlp + 8}>mlp</text>
        </>}
        <text class={`lbl fade ${step >= 4 ? 'on' : ''}`} x="20" y={Y.out + 8}>unembed</text>

        {/* the streams */}
        {range(N).map((i) => (
          <g class={`col ${step === 4 && i !== LAST ? 'dim' : ''}`}>
            <line class="stream" x1={x(i)} x2={x(i)} y1={Y.emb} y2={Y.top} />
            <text class={`tok ${/\d/.test(TEXT[i]) ? 'dg' : ''} ${step === 1 && i === LAST ? 'cur' : ''}`} x={x(i)} y={Y.tok}>{TEXT[i]}</text>
          </g>
        ))}

        {/* attention reads: position i reads a few of streams 0..i */}
        {layers && range(N).map((i) => (
          <g class={`arcs ${attended(i) ? 'on' : ''} ${step === 1 ? 'one' : ''} ${step >= 3 ? 'past' : ''}`}
            style={{ transitionDelay: `${delay(i)}ms` }}>
            {READS[i].map(([j, w]) => <path d={arc(j, i)} style={{ strokeWidth: 1.5 + 3 * w }} />)}
          </g>
        ))}

        {/* the writes, top to bottom: embedding, attention, mlp */}
        {range(N).map((i) => (
          <g class={`col ${step === 4 && i !== LAST ? 'dim' : ''}`}>
            <Chip cx={x(i)} cy={Y.emb} kind="emb" on />
            {layers && <>
              <Chip cx={x(i)} cy={Y.attn} kind="attn" on={attended(i)} delay={delay(i) + 150} />
              <path class={`loop fade ${step >= 3 ? 'on' : ''}`} d={loop(i)} />
              <Chip cx={x(i)} cy={Y.mlp} kind="mlp" on={step >= 3} />
            </>}
          </g>
        ))}

        {/* unembedding reads the last stream */}
        <g class={`fade ${step >= 4 ? 'on' : ''}`}>
          <line class="stream last" x1={x(LAST)} x2={x(LAST)} y1={Y.top} y2={Y.out - 22} />
          <rect class="unemb" x={x(LAST) - 95} y={Y.out - 22} width="190" height="44" rx="10" />
          <text class="ulbl" x={x(LAST)} y={Y.out + 7}>36 scores</text>
        </g>
      </svg>
      <div class="cap">
        <div class="caption">{layers ? CAPS[Math.min(step, CAPS.length - 1)] : step >= 4 ? CAPS_NONE[1] : CAPS_NONE[0]}</div>
        <div class="eq">
          <Tex tex="x = \htmlClass{emb}{\text{emb}}" />
          {layers && <>
            <span class={`fade ${step >= 1 ? 'on' : ''}`}> <Tex tex="+\, \htmlClass{attn}{\text{attn}}" /></span>
            <span class={`fade ${step >= 3 ? 'on' : ''}`}> <Tex tex="+\, \htmlClass{mlp}{\text{mlp}}" /></span>
          </>}
        </div>
      </div>
      <style>{`
        .resid svg { width: 100%; display: block; overflow: visible; max-height: 66cqh; }
        .resid .lbl { font-family: var(--mono); font-size: 26px; fill: var(--muted); }
        .resid .col { transition: opacity .3s; }
        .resid .col.dim { opacity: .35; }
        .resid .stream { stroke: var(--raised-2); stroke-width: 6; stroke-linecap: round; }
        .resid .stream.last { stroke: var(--answer); stroke-width: 4; }
        .resid .tok { font-family: var(--mono); font-size: 40px; fill: var(--fg); text-anchor: middle; transition: fill .3s; }
        .resid .tok.dg { fill: var(--digit); }
        .resid .tok.cur { fill: var(--attn); }
        .resid .chip rect { stroke-width: 2; }
        .resid .chip path { stroke-width: 3; stroke-linecap: round; }
        .resid .chip.emb rect { fill: var(--raised); stroke: var(--muted); }
        .resid .chip.attn rect { fill: color-mix(in srgb, var(--attn) 22%, var(--bg)); stroke: var(--attn); }
        .resid .chip.attn path { stroke: var(--attn); }
        .resid .chip.mlp rect { fill: color-mix(in srgb, var(--mlp) 22%, var(--bg)); stroke: var(--mlp); }
        .resid .chip.mlp path { stroke: var(--mlp); }
        .resid .arcs path { fill: none; stroke: var(--attn); stroke-width: 2; opacity: 0; transition: opacity .4s; transition-delay: inherit; }
        .resid .arcs.on path { opacity: .5; }
        .resid .arcs.on.one path { opacity: .85; }
        .resid .arcs.on.past path { opacity: .12; }
        .resid .loop { fill: none; stroke: var(--mlp); stroke-width: 2.5; }
        .resid .unemb { fill: color-mix(in srgb, var(--answer) 10%, transparent); stroke: var(--answer); stroke-width: 2; }
        .resid .ulbl { font-family: var(--mono); font-size: 26px; fill: var(--answer); text-anchor: middle; }
        .resid .fade { transition: opacity .35s; }
        .resid .cap { display: flex; justify-content: space-between; align-items: baseline; gap: 1em; font-size: .8em; min-height: 2.6em; }
        .resid .eq { font-family: var(--mono); color: var(--muted); white-space: nowrap; }

        .resid .eq .emb { color: var(--fg); } .resid .eq .attn { color: var(--attn); } .resid .eq .mlp { color: var(--mlp); }
        .resid .math { white-space: nowrap; color: var(--fg); }
      `}</style>
    </div>
  );
}
