/** @jsxImportSource preact */
import { Arrow, useIsland } from './viz';

/**
 * One block, as a schematic, top to bottom. The four strips (the residual stream) run straight down; attention and
 * the mlp each branch off to the right, read a rescaled copy, and add what they find back on further down.
 *  0 the stream   1 attention: the tokens read from each other   2 mlp: each token on its own   3 twelve blocks
 *  4 vs the rnn: one strip, rewritten; here one strip per token, only added to
 */
const TOKS = ['The', ' United', ' States', ' of'];
const LX = 120, LW = 34, LG = 30, TOP = 70, BOT = 590; // lanes
const laneX = (i: number) => LX + i * (LW + LG);
const R = laneX(3) + LW; // right edge of the stream
const CAP = [
  <>the four strips run straight down through the model</>,
  <>attention: a rescaled copy goes out, the tokens read from each other, and the result is <b>added</b> back on</>,
  <>the mlp: same again, but each token is worked on alone</>,
  <>that's one block. gpt-2 is twelve of them in a row, all adding to the same strips</>,
  <>the rnn had one strip and rewrote it every step. here every token keeps its own, and nothing is ever erased</>,
];

/** a branch: reads the stream at y0 (its boxes sit on that row), adds back at y1 */
function Branch({ y0, y1, name, sub, on, cur }: { y0: number; y1: number; name: string; sub: string; on: boolean; cur: boolean }) {
  const bx = R + 90, mx = bx + 220, mw = 300;
  return (
    <g class={`br ${on ? 'on' : ''} ${cur ? 'cur' : ''}`}>
      <Arrow from={[R + 4, y0]} to={[bx - 6, y0]} on={on} width={3} color="var(--muted)" />
      <rect x={bx} y={y0 - 30} width={160} height={60} rx={10} class="bx" />
      <text x={bx + 80} y={y0 + 8} class="bt sm">rescale</text>
      <Arrow from={[bx + 160, y0]} to={[mx - 6, y0]} on={on} width={3} color="var(--muted)" />
      <rect x={mx} y={y0 - 50} width={mw} height={100} rx={12} class="bx main" />
      <text x={mx + mw / 2} y={y0 - 4} class="bt">{name}</text>
      <text x={mx + mw / 2} y={y0 + 28} class="bt sub">{sub}</text>
      <Arrow from={[mx + mw / 2, y0 + 50]} via={[[mx + mw / 2, y1]]} to={[R + 34, y1]} on={on} width={3} color="var(--accent)" />
      <rect x={LX - 8} y={y1 - 3} width={R - LX + 12} height={6} rx={3} class="addline" />
      <circle cx={R + 4} cy={y1} r={26} class="plus" />
      <text x={R + 4} y={y1 + 12} class="bt pl">+</text>
    </g>
  );
}

export default function Stream() {
  const { root, step } = useIsland('embed');
  return (
    <div class="stm" ref={root}>
      <svg viewBox="0 0 1260 620">
        <defs>
          <linearGradient id="lane" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#3987e5" stop-opacity=".55" /><stop offset=".5" stop-color="#e66767" stop-opacity=".55" />
            <stop offset="1" stop-color="#3987e5" stop-opacity=".55" />
          </linearGradient>
        </defs>
        {TOKS.map((t, i) => (
          <text x={laneX(i) + LW / 2} y={TOP - 14} class="tk" transform={`rotate(-45 ${laneX(i) + LW / 2} ${TOP - 14})`}>
            {t.startsWith(' ') ? <><tspan class="sp">·</tspan>{t.slice(1)}</> : t}
          </text>
        ))}
        {TOKS.map((_, i) => <rect x={laneX(i)} y={TOP} width={LW} height={BOT - TOP} rx={5} fill="url(#lane)" />)}
        <Branch y0={150} y1={290} name="attention" sub="tokens read each other" on={step >= 1} cur={step === 1} />
        <Branch y0={380} y1={520} name="mlp" sub="each token alone" on={step >= 2} cur={step === 2} />
        <g class={`x12 ${step >= 3 ? 'on' : ''}`}>
          <path d="M 1080 92 q 24 0 24 24 v 170 q 0 24 24 24 q -24 0 -24 24 v 170 q 0 24 -24 24" />
          <text x={1150} y={318} class="bt l">× 12 blocks</text>
        </g>
      </svg>
      <div class="cap">{CAP[Math.min(step, CAP.length - 1)]}</div>
      <style>{`
        .stm { font-size: .8em; }
        .stm svg { height: 58vh; max-width: 100%; display: block; overflow: visible; }
        .stm .tk { font: 22px var(--mono); fill: var(--fg); }
        .stm .tk .sp { fill: var(--muted); }
        .stm .bx { fill: var(--panel); stroke: var(--border); stroke-width: 2; transition: stroke .3s; }
        .stm .br.cur .bx.main { stroke: var(--accent); }
        .stm .bt { fill: var(--fg); font-size: 30px; text-anchor: middle; font-family: var(--sans); }
        .stm .bt.sm { font-size: 22px; fill: var(--muted); }
        .stm .bt.l { text-anchor: start; font-size: 26px; fill: var(--muted); }
        .stm .bt.sub { font-size: 20px; fill: var(--muted); }
        .stm .bt.pl { font-size: 36px; fill: var(--accent); font-weight: 700; }
        .stm .addline { fill: var(--accent); opacity: .7; }
        .stm .plus { fill: var(--bg); stroke: var(--accent); stroke-width: 3; }
        .stm .br, .stm .x12 { opacity: 0; transition: opacity .4s; }
        .stm .br.on, .stm .x12.on { opacity: 1; }
        .stm .x12 path { fill: none; stroke: var(--muted); stroke-width: 3; }
        .stm .cap { font-size: .7em; color: var(--muted); min-height: 2.6em; margin-top: .6em; }
        .stm .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
