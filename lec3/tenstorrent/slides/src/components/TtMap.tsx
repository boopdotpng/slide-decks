/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';

/**
 * A Blackhole card as blackhole-py uses it, drawn like the gpu deck's map: the chip on the left, one Tensix tile
 * on the right. Sources: boop-docs (intro.md, hardware/architecture.md, hardware/topology.md) and blackhole-py's
 * device.py.
 *   worker-capable columns 1–7 and 10–14, rows 2–11: 12 × 10 = 120 Tensix tiles; 3 run service loops
 *     (command queue, dma, and one more), 117 do work                                       topology.md, intro.md
 *   8 GDDR banks on a p150 (7 on a p100a); 512 GB/s                                         device.py, README.md
 *   two NoCs, opposite routing directions                                                   architecture.md
 *   per tile: 1.5 MiB L1, 5 RISC-V controllers (BRISC, NCRISC: usually data movement;
 *   TRISC0/1/2: usually unpack / math / pack), matrix engine SrcA/SrcB → Dst, SFPU with 32-lane vector registers
 * Where the DRAM banks sit on the die is simplified (drawn as a strip on each side), and the gpu row is the rx 9070 xt
 * from the gpu deck.
 */
type Part = 'chip' | 'tile' | 'none';
const STEPS: { on: Part[]; diff: boolean; text: ComponentChildren }[] = [
  { on: ['chip'], diff: false,
    text: <>a grid of <b>120 tiles</b> (117 do work) wired together by two on-chip networks, with 8 memory banks at the edges</> },
  { on: ['chip', 'tile'], diff: false,
    text: <>one tile: <b>1.5 MB of its own memory</b>, five tiny risc-v cpus, and a matrix engine that eats 32 × 32 blocks</> },
  { on: ['chip', 'tile'], diff: true,
    text: <>what's missing: no caches, no warps, no hardware deciding what runs. <b>nothing moves unless a program moves it</b></> },
];

const COLS = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14], ROWS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
const SERVICE = new Set(['14,2', '14,3']); // device.py: cq_core and dma_core, top of the rightmost column
const HOT = '7,5';

export default function TtMap() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  const on = (p: Part) => (st.on.includes(p) ? 'on' : '');
  const cx = (c: number) => 70 + COLS.indexOf(c) * 46 + (c >= 10 ? 26 : 0);
  const cy = (r: number) => 60 + (r - 2) * 46;
  const hx = cx(7), hy = cy(5);
  return (
    <div class="ttmap" ref={root}>
      <svg viewBox="0 0 1500 560">
        <g class={`pt ${on('chip')}`}>
          <rect x={20} y={14} width={660} height={530} rx={18} class="outer" />
          <text x={44} y={44} font-size="24" font-weight="700">the chip · blackhole</text>
          <rect x={30} y={60} width={24} height={452} rx={6} class="dram" />
          <rect x={646} y={60} width={24} height={452} rx={6} class="dram" />
          <text x={42} y={530} font-size="16" class="dim" text-anchor="middle">gddr</text>
          <text x={658} y={530} font-size="16" class="dim" text-anchor="middle">gddr</text>
          {COLS.flatMap((c) => ROWS.map((r) => {
            const id = `${c},${r}`;
            return <rect x={cx(c)} y={cy(r)} width={40} height={40} rx={5}
              class={`tile ${SERVICE.has(id) ? 'svc' : ''} ${id === HOT && on('tile') ? 'hot' : ''}`} />;
          }))}
          <text x={350} y={530} font-size="16" class="dim" text-anchor="middle">120 tensix tiles · two networks between them</text>
        </g>
        <g class={`pt call ${on('tile')}`}>
          <line x1={hx + 40} y1={hy} x2={740} y2={14} />
          <line x1={hx + 40} y1={hy + 40} x2={740} y2={544} />
        </g>
        <g class={`pt ${on('tile')}`}>
          <rect x={740} y={14} width={740} height={530} rx={18} class="outer" />
          <text x={764} y={44} font-size="24" font-weight="700">one tensix tile</text>
          {/* five controllers */}
          {[['brisc', 'move data'], ['ncrisc', 'move data'], ['trisc0', 'unpack'], ['trisc1', 'math'], ['trisc2', 'pack']].map(([n, r], i) => (
            <g>
              <rect x={764 + i * 140} y={64} width={128} height={70} rx={8} class={`cpu ${i < 2 ? 'mv' : 'cp'}`} />
              <text x={828 + i * 140} y={94} font-size="19" font-weight="700" text-anchor="middle">{n}</text>
              <text x={828 + i * 140} y={120} font-size="16" class="dim" text-anchor="middle">{r}</text>
            </g>
          ))}
          <text x={764} y={160} font-size="16" class="dim">5 tiny risc-v cpus, each running its own program</text>
          {/* the compute path */}
          {[['unpack', 764], ['srcA / srcB', 904], ['matrix engine', 1044], ['dst', 1214], ['pack', 1344]].map(([t, x], i) => (
            <g>
              <rect x={x as number} y={186} width={i === 2 ? 150 : 112} height={64} rx={8} class={i === 2 ? 'mx' : 'leaf'} />
              <text x={(x as number) + (i === 2 ? 75 : 56)} y={224} font-size="17" text-anchor="middle">{t}</text>
            </g>
          ))}
          <rect x={1196} y={268} width={150} height={52} rx={8} class="leaf" />
          <text x={1271} y={300} font-size="16" text-anchor="middle">sfpu · 32 lanes</text>
          <rect x={764} y={342} width={700} height={96} rx={10} class="l1" />
          <text x={786} y={380} font-size="22" font-weight="700">L1 · 1.5 MB</text>
          <text x={786} y={412} font-size="17" class="dim">code, inputs, outputs, buffers: you decide what lives where</text>
          <rect x={764} y={456} width={344} height={66} rx={10} class="noc" />
          <rect x={1120} y={456} width={344} height={66} rx={10} class="noc" />
          <text x={786} y={496} font-size="18">noc 0 port</text>
          <text x={1142} y={496} font-size="18">noc 1 port</text>
        </g>
        <g class={`fade ${st.diff ? 'on' : ''}`}>
          <rect x={764} y={266} width={400} height={56} rx={10} class="tag" />
          <text x={964} y={301} font-size="19" text-anchor="middle" class="bad">no cache · no warps · no scheduler</text>
        </g>
      </svg>
      <div class="caption tm-text">{st.text}</div>
      <style>{`
        .ttmap svg { display: block; width: 100%; max-height: 62cqh; }
        .ttmap text { fill: var(--fg); } .ttmap .dim { fill: var(--muted); } .ttmap .bad { fill: var(--bad); font-weight: 700; }
        .ttmap .pt { opacity: .14; transition: opacity .45s; } .ttmap .pt.on { opacity: 1; }
        .ttmap .outer { fill: var(--sunken); stroke: var(--line); stroke-width: 2; }
        .ttmap .tile { fill: var(--accent); opacity: .8; transition: fill .3s; }
        .ttmap .tile.svc { fill: var(--faint); }
        .ttmap .tile.hot { fill: var(--hot); opacity: 1; }
        .ttmap .dram { fill: var(--fill-slate); }
        .ttmap .call line { stroke: var(--hot); stroke-width: 2; stroke-dasharray: 5 5; }
        .ttmap .cpu { stroke-width: 2; } .ttmap .cpu.mv { fill: var(--tint-blue); stroke: var(--accent); }
        .ttmap .cpu.cp { fill: var(--tint-violet); stroke: var(--purple); }
        .ttmap .leaf { fill: var(--surface); stroke: var(--line-2); stroke-width: 1.5; }
        .ttmap .mx { fill: color-mix(in srgb, var(--hot) 22%, transparent); stroke: var(--hot); stroke-width: 2; }
        .ttmap .l1 { fill: var(--tint-green); stroke: var(--good); stroke-width: 1.5; }
        .ttmap .noc { fill: var(--fill-slate); }
        .ttmap .tag { fill: var(--panel); stroke: var(--bad); stroke-width: 2; }
        .ttmap .tm-text { font-size: .8em; min-height: 2.6em; margin-top: .6em; }
      `}</style>
    </div>
  );
}
