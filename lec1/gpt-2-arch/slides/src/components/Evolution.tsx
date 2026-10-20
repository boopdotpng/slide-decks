/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Arrow, COLORS, box, useMeasure, type ElBox } from './viz';

/**
 * The pivotal LLM releases, 2019–2026, as year rows x three lanes. GPT-2 is up
 * from the start; each press reveals the next release with the arrow(s) into it.
 */
type Kind = 'base' | 'qual' | 'kv' | 'moe' | 'train';
const KIND: Record<Kind, string> = { base: 'var(--muted)', qual: COLORS.accent, kv: COLORS.hot, moe: COLORS.good, train: COLORS.purple };
const LEGEND: [Kind, string][] = [
  ['qual', 'the standard block'], ['kv', 'cheaper attention / kv cache'], ['moe', 'sparse compute (MoE)'],
  ['train', 'scale or training, not architecture'], ['base', 'baseline'],
];

const LANES = ['dense trunk → hybrids', 'deepseek', 'forks'];
const ROWS = 7;
const YEARS: [number, string][] = [[1, '2019'], [2, '2020'], [3, '2024'], [5, '2025'], [7, '2026']]; // row each year starts on
const BANDS: [number, number][] = [[1, 1], [3, 4], [7, 7]]; // shaded rows, alternating years

// in reveal order: card i shows at step i
const CARDS: { row: number; lane: number; kind: Kind; title: string; text: string }[] = [
  { row: 1, lane: 0, kind: 'base', title: 'GPT-2 · 2019 · 1.5B', text: 'the baseline block: pre-norm decoder, learned positions, full multi-head attention' },
  { row: 2, lane: 0, kind: 'train', title: 'GPT-3 · 2020 · 175B', text: 'same block, 100× bigger; prompting replaces fine-tuning' },
  { row: 3, lane: 0, kind: 'qual', title: 'Llama 3 · 2024', text: 'the modern default block: RoPE, RMSNorm, SwiGLU, GQA, no biases' },
  { row: 3, lane: 1, kind: 'kv', title: 'DeepSeek-V2 · may 2024', text: 'MLA shrinks the kv cache; many tiny experts plus a shared one' },
  { row: 4, lane: 1, kind: 'moe', title: 'DeepSeek-V3 · dec 2024', text: '671B MoE on a modest budget: FP8, MTP, aux-loss-free routing' },
  { row: 5, lane: 2, kind: 'train', title: 'DeepSeek-R1 · jan 2025', text: "V3's architecture, unchanged; RL on verifiable rewards teaches it to reason" },
  { row: 6, lane: 0, kind: 'kv', title: 'Qwen3-Next · sep 2025', text: '3 of 4 attention layers become Gated DeltaNet (linear attention)' },
  { row: 7, lane: 1, kind: 'kv', title: 'DeepSeek-V4 · apr 2026', text: 'compressed sparse attention, hyper-connections, 1M context' },
  { row: 7, lane: 2, kind: 'kv', title: 'Kimi K3 · jul 2026 · 2.8T', text: 'largest open model yet; KDA linear-attn hybrid plus attention residuals' },
];

// how an arrow runs between two cards: down a lane, across a row, across then down, or around the right edge
type Route = 'down' | 'across' | 'elbow' | 'around';
const EDGES: { from: number; to: number; route: Route; dashed?: boolean; note?: string }[] = [
  { from: 0, to: 1, route: 'down' },
  { from: 1, to: 2, route: 'down' },
  { from: 2, to: 3, route: 'across' },
  { from: 3, to: 4, route: 'down' },
  { from: 4, to: 5, route: 'elbow', note: 'same model, + RL' },
  { from: 2, to: 6, route: 'down', note: 'swap most attention for linear' },
  { from: 4, to: 7, route: 'down' },
  { from: 6, to: 8, route: 'elbow', note: 'DeltaNet → KDA' },
  { from: 4, to: 8, route: 'around', dashed: true, note: 'MoE recipe via Kimi K2' },
];

type Pt = [number, number];
type Geo = { from: Pt; to: Pt; via?: Pt[]; note: Pt; anchor: 'start' | 'middle' | 'end' };
function path(a: ElBox, b: ElBox, route: Route): Geo {
  switch (route) {
    // note to the right of the line, halfway down
    case 'down': return { from: [a.cx, a.b], to: [a.cx, b.y], note: [a.cx + 12, (a.b + b.y) / 2 + 5], anchor: 'start' };
    case 'across': return { from: [a.r, a.cy], to: [b.x, a.cy], note: [(a.r + b.x) / 2, a.cy - 10], anchor: 'middle' };
    // note above the horizontal run
    case 'elbow': return { from: [a.r, a.cy], via: [[b.cx, a.cy]], to: [b.cx, b.y], note: [(a.r + b.cx) / 2, a.cy - 9], anchor: 'middle' };
    // out of a's lower right, past the right edge, into b's right side; note above the run, at its right end
    case 'around': {
      const y = a.b - 10, x = b.r + 22;
      return { from: [a.r, y], via: [[x, y], [x, b.cy]], to: [b.r, b.cy], note: [x - 14, y - 8], anchor: 'end' };
    }
  }
}

export default function Evolution() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const cards = useMeasure(root, (el) => [...el.querySelectorAll('.card')].map((c) => box(el, c)));

  return (
    <div class="ev" ref={root}>
      <div class="grid">
        {BANDS.map(([a, b]) => <div class="band" style={{ gridRow: `${a + 1} / ${b + 2}` }} />)}
        {LANES.map((l, i) => <div class="lane" style={{ gridRow: 1, gridColumn: i + 2 }}>{l}</div>)}
        {YEARS.map(([r, y]) => <div class="yr" style={{ gridRow: r + 1 }}>{y}</div>)}
        {CARDS.map((c, i) => (
          <div class={`card ${step >= i ? 'on' : ''} ${step === i && i > 0 ? 'cur' : ''}`}
            style={{ gridRow: c.row + 1, gridColumn: c.lane + 2, '--k': KIND[c.kind] }}>
            <div class="ct">{c.title}</div>
            <div class="cb">{c.text}</div>
          </div>
        ))}
      </div>
      <div class="legend">
        <span>border = what the release mainly changed</span>
        {LEGEND.map(([k, label]) => <span><i style={{ background: KIND[k] }} />{label}</span>)}
      </div>

      {cards && cards.length === CARDS.length && (
        <svg class="arrows">
          <text class={`aside ${step >= 2 ? 'on' : ''}`} x={cards[1].r + 18} y={cards[1].b + 4}>2021–23: RoPE and GQA arrive along the way</text>
          {EDGES.map((e) => {
            const p = path(cards[e.from], cards[e.to], e.route);
            return (
              <g class={`eg ${step >= e.to ? 'on' : ''}`}>
                <Arrow from={p.from} via={p.via} to={p.to} on={step >= e.to} dashed={e.dashed} width={2}
                  color={step === e.to ? 'var(--accent)' : 'var(--muted)'} />
                {e.note && <text x={p.note[0]} y={p.note[1]} text-anchor={p.anchor}>{e.note}</text>}
              </g>
            );
          })}
        </svg>
      )}

      <style>{`
        .ev { position: relative; flex: 1; min-height: 0; display: flex; flex-direction: column; }
        .ev .grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 3.4em repeat(3, 1fr);
          grid-template-rows: auto repeat(${ROWS}, 1fr); column-gap: 2.2em; row-gap: .3em; margin-right: 1.4em; }
        .ev .band { grid-column: 1 / -1; background: var(--panel); border-radius: 10px; margin: -.15em -.6em; }
        .ev .lane { font-size: .5em; letter-spacing: .12em; text-transform: uppercase; color: var(--muted); text-align: center; padding-bottom: .3em; }
        .ev .yr { grid-column: 1; align-self: center; position: relative; font-size: .6em; font-weight: 600; color: var(--muted); padding-left: .2em; }
        .ev .card { position: relative; align-self: center; background: var(--code); border: 2px solid var(--k); border-radius: 10px;
          padding: .25em .55em .3em; opacity: 0; transition: opacity .45s, box-shadow .3s; }
        .ev .card.on { opacity: 1; }
        .ev .card.cur { box-shadow: 0 0 0 2px var(--k), 0 0 28px -8px var(--k); }
        .ev .ct { font-size: .58em; font-weight: 700; }
        .ev .cb { font-size: .5em; color: var(--muted); line-height: 1.3; }
        .ev .legend { display: flex; flex-wrap: wrap; gap: .4em 1.4em; font-size: .5em; color: var(--muted); margin-top: .5em; }
        .ev .legend span:first-child { color: var(--fg); }
        .ev .legend i { display: inline-block; width: .8em; height: .8em; border-radius: 3px; margin-right: .4em; vertical-align: -.05em; }
        .ev .arrows { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
        .ev .arrows text { font: italic 15px var(--sans); fill: var(--muted); }
        .ev .eg { opacity: 0; transition: opacity .45s; }
        .ev .eg.on { opacity: 1; }
        .ev .aside { opacity: 0; transition: opacity .45s; } .ev .aside.on { opacity: 1; }
      `}</style>
    </div>
  );
}
