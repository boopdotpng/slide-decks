/** @jsxImportSource preact */
import { Arrow, useIsland } from './viz';

/**
 * One block, as a schematic. The four strips (the residual stream) run straight through; attention and the mlp each
 * read a rescaled copy and add what they find back on.
 *  0 the stream   1 attention: the tokens read from each other   2 mlp: each token on its own   3 twelve blocks
 *  4 vs the rnn: one strip, rewritten; here one strip per token, only added to
 */
const W = 1400, LY = 340, LH = 20, LG = 10;
const laneY = (i: number) => LY + i * (LH + LG);
const MID = laneY(1.5) + LH / 2;
const CAP = [
  <>the four strips run straight through the model</>,
  <>attention: a rescaled copy goes up, the tokens read from each other, and the result is <b>added</b> back on</>,
  <>the mlp: same again, but each token is worked on alone</>,
  <>that's one block. gpt-2 is twelve of them in a row, all adding to the same strips</>,
  <>the rnn had one strip and rewrote it every step. here every token keeps its own, and nothing is ever erased</>,
];

function Branch({ x0, name, sub, on, cur }: { x0: number; name: string; sub: string; on: boolean; cur: boolean }) {
  const top = laneY(0) - 14;
  return (
    <g class={`br ${on ? 'on' : ''} ${cur ? 'cur' : ''}`}>
      <rect x={x0} y={90} width={150} height={70} rx={10} class="bx" />
      <text x={x0 + 75} y={133} class="bt sm">rescale</text>
      <rect x={x0 + 200} y={70} width={260} height={110} rx={12} class="bx main" />
      <text x={x0 + 330} y={122} class="bt">{name}</text>
      <text x={x0 + 330} y={156} class="bt sub">{sub}</text>
      <Arrow from={[x0 + 40, top]} to={[x0 + 40, 166]} on={on} width={3} color="var(--muted)" />
      <Arrow from={[x0 + 150, 125]} to={[x0 + 196, 125]} on={on} width={3} color="var(--muted)" />
      <Arrow from={[x0 + 460, 125]} via={[[x0 + 540, 125]]} to={[x0 + 540, top - 30]} on={on} width={3} color="var(--accent)" />
      <circle cx={x0 + 540} cy={MID} r={30} class="plus" />
      <text x={x0 + 540} y={MID + 13} class="bt pl">+</text>
    </g>
  );
}

export default function Stream() {
  const { root, step } = useIsland('embed');
  const toks = ['The', ' United', ' States', ' of'];
  return (
    <div class="stm" ref={root}>
      <svg viewBox={`0 0 ${W} 480`}>
        <defs>
          <linearGradient id="lane" x1="0" x2="1">
            <stop offset="0" stop-color="#3987e5" stop-opacity=".55" /><stop offset=".5" stop-color="#e66767" stop-opacity=".55" />
            <stop offset="1" stop-color="#3987e5" stop-opacity=".55" />
          </linearGradient>
        </defs>
        {toks.map((t, i) => <text x={136} y={laneY(i) + LH / 2 + 8} class="tk">{t.startsWith(' ') ? <><tspan class="sp">·</tspan>{t.slice(1)}</> : t}</text>)}
        {toks.map((_, i) => <rect x={150} y={laneY(i)} width={W - 190} height={LH} rx={4} fill="url(#lane)" />)}
        <Branch x0={240} name="attention" sub="tokens read each other" on={step >= 1} cur={step === 1} />
        <Branch x0={820} name="mlp" sub="each token alone" on={step >= 2} cur={step === 2} />
        <g class={`x12 ${step >= 3 ? 'on' : ''}`}>
          {Array.from({ length: 12 }, (_, b) => <rect x={150 + b * 101} y={18} width={88} height={26} rx={6} class={b === 0 ? 'b0' : ''} />)}
          <text x={150} y={12} class="bt sm l">12 blocks</text>
        </g>
      </svg>
      <div class="cap">{CAP[Math.min(step, CAP.length - 1)]}</div>
      <style>{`
        .stm { position: relative; font-size: .8em; }
        .stm svg { width: 100%; display: block; overflow: visible; }
        .stm .tk { font: 22px var(--mono); fill: var(--fg); text-anchor: end; }
        .stm .tk .sp { fill: var(--muted); }
        .stm .bx { fill: var(--panel); stroke: var(--border); stroke-width: 2; transition: stroke .3s; }
        .stm .br.cur .bx.main { stroke: var(--accent); }
        .stm .bt { fill: var(--fg); font-size: 30px; text-anchor: middle; font-family: var(--sans); }
        .stm .bt.sm { font-size: 22px; fill: var(--muted); }
        .stm .bt.l { text-anchor: start; }
        .stm .bt.sub { font-size: 20px; fill: var(--muted); }
        .stm .bt.pl { font-size: 40px; fill: var(--accent); font-weight: 700; }
        .stm .plus { fill: var(--bg); stroke: var(--accent); stroke-width: 3; }
        .stm .br { opacity: 0; transition: opacity .4s; }
        .stm .br.on { opacity: 1; }
        .stm .x12 { opacity: 0; transition: opacity .4s; }
        .stm .x12.on { opacity: 1; }
        .stm .x12 rect { fill: #1c2a3d; stroke: #3a4a5c; }
        .stm .x12 rect.b0 { fill: var(--hl); stroke: var(--accent); }
        .stm .cap { font-size: .7em; color: var(--muted); min-height: 2.6em; margin-top: .6em; }
        .stm .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
