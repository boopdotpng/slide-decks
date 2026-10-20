/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { COLORS, diverging, sequential, useData } from './viz';

/**
 * one_head(q, k, v) for every token at once: the last two slides were the last row of this.
 * Real block 10 head 7 numbers (q, k from prefill.json, v from decode.json; out = probs @ v).
 * Steps:
 *  0. q (14, 64) @ kᵀ (64, 14) / 8 = scores (14, 14). the last row is the one we did by hand
 *  1. mask: above the diagonal → −∞
 *  2. softmax each row
 *  3. @ v (14, 64) = out (14, 64)
 */
const S = 14, D = 64;
const CH = 18, CW = 4; // px per token row/col, px per channel
const TOP = 48, LBL = 100, GAP = 64;
const MW = D * CW, MH = S * CH; // 256 × 252: (14, 64) matrices
const XQ = LBL, XK = XQ + MW + GAP, XS = XK + S * CH + GAP, XV = XS + S * CH + GAP, XO = XV + MW + GAP;
const W = XO + MW + 10, Hgt = TOP + D * CW + 70;

const CAP = [
  <>every token's q against every token's k, all at once. <b>q @ kᵀ / 8</b>: row i, column j = how well token i's question
    matches token j's key. the highlighted row is the one we just did by hand</>,
  <>no peeking at the future: token i may only look at tokens 0 … i. everything above the diagonal becomes <b>−∞</b></>,
  <><b>softmax</b> each row: −∞ turns into exactly 0, and every row sums to 1. each row is one token's attention</>,
  <><b>@ v</b>: each token's output is its row of weights times the v rows. the last row is the " Mary" copy from the last slide.
    that's all of <b>one_head</b></>,
];

function Grid({ x, y, rows, cols, cw, ch, val, color, hlRow }: {
  x: number; y: number; rows: number; cols: number; cw: number; ch: number;
  val: (r: number, c: number) => number | null; color: (v: number) => string; hlRow?: number;
}) {
  const cells = [];
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const v = val(r, c);
    cells.push(<rect x={x + c * cw} y={y + r * ch} width={cw + 0.3} height={ch + 0.3} fill={v === null ? '#111' : color(v)} />);
  }
  return <g>
    {cells}
    <rect x={x} y={y} width={cols * cw} height={rows * ch} fill="none" stroke="#3a4a5c" />
    {hlRow !== undefined && <rect x={x - 1.5} y={y + hlRow * ch - 1.5} width={cols * cw + 3} height={ch + 3} fill="none" stroke={COLORS.accent} stroke-width="2.5" />}
  </g>;
}

const Lbl = ({ x, y, t, sub }: { x: number; y: number; t: string; sub: string }) => <>
  <text x={x} y={y} text-anchor="middle" class="oh-l">{t}</text>
  <text x={x} y={y + 22} text-anchor="middle" class="oh-s">{sub}</text>
</>;
const Op = ({ x, t }: { x: number; t: string }) =>
  <text x={x} y={TOP + MH / 2} text-anchor="middle" dominant-baseline="middle" class="oh-op">{t}</text>;

export default function OneHead() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const p = useData('prefill');
  const d = useData('decode');
  if (!p || !d) return <div ref={root} />;
  const [L, H] = p.focus;
  const toks: string[] = p.toks;
  const Q: number[][] = p.Q, K: number[][] = p.K, V: number[][] = d.V;
  const sc: number[][] = p.scores[L][H], pr: number[][] = p.probs[L][H];
  const out = pr.map((row) => V[0].map((_, c) => row.reduce((a, w, j) => a + w * V[j][c], 0)));
  const masked = (r: number, c: number) => step >= 1 && c > r;
  const last = S - 1;
  const lY = TOP + MH + 30;

  return (
    <div class="oh" ref={root}>
      <svg viewBox={`0 0 ${W} ${Hgt}`} width="100%">
        {toks.map((t, r) => <text x={LBL - 8} y={TOP + r * CH + CH / 2} text-anchor="end" dominant-baseline="middle"
          class={`oh-t ${r === last ? 'hl' : ''}`}>{t.startsWith(' ') ? '·' + t.slice(1) : t}</text>)}
        <Grid x={XQ} y={TOP} rows={S} cols={D} cw={CW} ch={CH} val={(r, c) => Q[r][c]} color={(v) => diverging(v, 2)} hlRow={last} />
        <Lbl x={XQ + MW / 2} y={lY} t="q" sub="(14, 64)" />
        <Op x={XK - GAP / 2} t="@" />
        <Grid x={XK} y={TOP} rows={D} cols={S} cw={CH} ch={CW} val={(r, c) => K[c][r]} color={(v) => diverging(v, 2)} />
        <Lbl x={XK + S * CH / 2} y={TOP + D * CW + 30} t="kᵀ" sub="(64, 14)" />
        <Op x={XS - GAP / 2} t="=" />
        <Grid x={XS} y={TOP} rows={S} cols={S} cw={CH} ch={CH}
          val={(r, c) => (masked(r, c) ? null : step >= 2 ? pr[r][c] : sc[r][c])}
          color={(v) => (step >= 2 ? sequential(Math.sqrt(v)) : diverging(v, 3))} hlRow={last} />
        <Lbl x={XS + S * CH / 2} y={lY} t={step >= 2 ? 'softmax' : step >= 1 ? 'scores + mask' : 'scores'} sub="(14, 14)" />
        {toks.map((t, c) => <text transform={`translate(${XS + c * CH + CH / 2}, ${TOP - 6}) rotate(-60)`} class="oh-t col">
          {t.startsWith(' ') ? '·' + t.slice(1) : t}</text>)}
        <g class={`fade ${step >= 3 ? 'on' : ''}`}>
          <Op x={XV - GAP / 2} t="@" />
          <Grid x={XV} y={TOP} rows={S} cols={D} cw={CW} ch={CH} val={(r, c) => V[r][c]} color={(v) => diverging(v, 2)} />
          <Lbl x={XV + MW / 2} y={lY} t="v" sub="(14, 64)" />
          <Op x={XO - GAP / 2} t="=" />
          <Grid x={XO} y={TOP} rows={S} cols={D} cw={CW} ch={CH} val={(r, c) => out[r][c]} color={(v) => diverging(v, 1.2)} hlRow={last} />
          <Lbl x={XO + MW / 2} y={lY} t="out" sub="(14, 64)" />
        </g>
      </svg>
      <div class="cap">{CAP[step]}</div>
      <div class="foot muted">block {L}, head {H}. real numbers</div>
      <style>{`
        .oh { display: flex; flex-direction: column; gap: .5em; }
        .oh svg { overflow: visible; }
        .oh .oh-t { fill: var(--muted); font-family: var(--mono); font-size: 15px; }
        .oh .oh-t.col { font-size: 14px; }
        .oh .oh-t.hl { fill: var(--accent); }
        .oh .oh-l { fill: var(--fg); font-family: var(--mono); font-size: 22px; }
        .oh .oh-s { fill: var(--muted); font-family: var(--mono); font-size: 16px; }
        .oh .oh-op { fill: var(--fg); font-size: 30px; }
        .oh .cap { font-size: .62em; color: var(--muted); max-width: 54em; min-height: 3em; }
        .oh .cap b { color: var(--fg); font-family: var(--mono); font-weight: normal; }
        .oh .foot { font-size: .5em; }
      `}</style>
    </div>
  );
}
