/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';

/**
 * The map of the talk: the whole rx 9070 xt on the left (32 workgroup processors, the two big caches, gpu memory off
 * the chip), one workgroup processor blown up on the right (2 compute units of 2 simds, each simd 32 lanes and its
 * register file, a cache per compute unit, lds shared by all four).
 *
 * Counts and sizes: amd's rocm gpu specs table (64 cus, 32 KB vector cache per cu, 8 MiB l2, 64 MiB infinity cache,
 * 16 GiB); rdna4 isa guide (1536 v registers × 32 lanes × 4 bytes = 192 KB per simd; 128 KB lds per wgp); amd's rdna
 * deck (2 simds per cu, 2 cus per wgp). Latencies: the ones on the "memory is far away" slide (chips and cheese, one
 * generation back); the two caches without a published number get none.
 *
 * As a slide: <Map /> steps through STEPS. In a corner: <Map mini at="wave" />, the same picture with one part lit.
 */
export type Part = 'chip' | 'wgp' | 'cu' | 'simd' | 'lane' | 'regs' | 'lds' | 'l0' | 'l2' | 'ic' | 'vram';
export type At = 'lane' | 'wave' | 'simd' | 'wgp' | 'chip' | 'mem';

const LIT: Record<At, Part[]> = {
  lane: ['lane'],
  wave: ['lane', 'simd'],
  simd: ['simd', 'regs'],
  wgp: ['wgp', 'cu', 'simd', 'lds'],
  chip: ['chip', 'wgp'],
  mem: ['regs', 'lds', 'l0', 'l2', 'ic', 'vram'],
};

const STEPS: { lit: Part[]; mem: boolean; text: ComponentChildren }[] = [
  { lit: ['chip', 'l2', 'ic', 'vram'], mem: false,
    text: <>one gpu: <b>32 processors</b> side by side, sharing big caches and 16 GB of memory</> },
  { lit: ['wgp', 'cu', 'simd', 'lane', 'regs', 'lds'], mem: false,
    text: <>one processor (nvidia: an <b>sm</b>): 4 <b>simds</b> of 32 lanes each, registers, and a small scratchpad. 4096 lanes on the chip</> },
  { lit: ['regs', 'lds', 'l0', 'l2', 'ic', 'vram'], mem: true,
    text: <>near is small and fast, far is big and slow: gpu memory is ~100× further than a register</> },
];

const VW = 1500, VH = 640;
const TILE = { x: 40, y: 78, w: 68, h: 68, gap: 8 };
const CUS = [760, 1124];
const SIMD = { dy: 112, w: 153, h: 300, gap: 14 }; // 10 + 2 × 153 + 14 + 10 = the compute unit's 340
const HOT = 7; // the tile that's blown up: top right, next to the callout

/** a memory's label: its size, and (in the memory step) how far away it is */
function Mem({ x, y, name, size, ns, show, anchor = 'start' }: {
  x: number; y: number; name: string; size: string; ns?: string; show: boolean; anchor?: 'start' | 'end' | 'middle';
}) {
  return (
    <text x={x} y={y} text-anchor={anchor} font-size="22">
      <tspan font-weight="700">{name}</tspan>
      <tspan class="dim"> · {size}</tspan>
      {ns && <tspan class={`ns ${show ? 'on' : ''}`}> · {ns}</tspan>}
    </text>
  );
}

export default function Map({ mini = false, at }: { mini?: boolean; at?: At }) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const st = mini ? { lit: LIT[at ?? 'lane'], mem: at === 'mem', text: null } : STEPS[Math.min(STEPS.length - 1, step)];
  const on = (p: Part) => (st.lit.includes(p) ? 'on' : '');
  const show = st.mem;
  const t0x = TILE.x + HOT * (TILE.w + TILE.gap), t0y = TILE.y;
  return (
    <div class={`map ${mini ? 'mini' : ''}`} ref={root}>
      <svg viewBox={`0 0 ${VW} ${VH}`}>
        {/* ---- the chip ---- */}
        <g class={`pt ${on('chip')}`}>
          <rect x={20} y={20} width={640} height={510} rx={20} class="outer" />
          <text x={44} y={58} font-size="26" font-weight="700">the chip · rx 9070 xt</text>
          <text x={636} y={58} font-size="20" class="dim" text-anchor="end">32 workgroup processors</text>
        </g>
        {Array.from({ length: 32 }, (_, k) => {
          const c = k % 8, r = Math.floor(k / 8);
          const x = TILE.x + c * (TILE.w + TILE.gap), y = TILE.y + r * (TILE.h + TILE.gap);
          return (
            <g class={`pt ${k === HOT ? on('wgp') || on('chip') : on('chip')} ${k === HOT ? 'first' : ''}`}>
              <rect x={x} y={y} width={TILE.w} height={TILE.h} rx={8} class="tile" />
              {[0, 1, 2, 3].map((s) => <rect x={x + 8 + (s % 2) * 27} y={y + 8 + Math.floor(s / 2) * 27} width={25} height={24} rx={3} class="simd-fill" />)}
            </g>
          );
        })}
        <g class={`pt ${on('l2')}`}>
          <rect x={40} y={390} width={600} height={56} rx={10} class="mem" />
          <Mem x={60} y={426} name="cache" size="8 MB"  show={show} />
        </g>
        <g class={`pt ${on('ic')}`}>
          <rect x={40} y={456} width={600} height={56} rx={10} class="mem" />
          <Mem x={60} y={492} name="infinity cache" size="64 MB" ns="~150 ns" show={show} />
        </g>
        <g class={`pt ${on('vram')}`}>
          <rect x={20} y={556} width={640} height={66} rx={14} class="vram" />
          <Mem x={44} y={598} name="gpu memory" size="16 GB, off the chip" ns="~235 ns" show={show} />
        </g>

        {/* ---- the callout: tile 0 is the wgp on the right ---- */}
        <g class={`pt call ${on('wgp')}`}>
          <line x1={t0x + TILE.w} y1={t0y} x2={740} y2={20} />
          <line x1={t0x + TILE.w} y1={t0y + TILE.h} x2={740} y2={630} />
        </g>

        {/* ---- one workgroup processor ---- */}
        <g class={`pt ${on('wgp')}`}>
          <rect x={740} y={20} width={740} height={610} rx={20} class="outer" />
          <text x={764} y={58} font-size="26" font-weight="700">one workgroup processor</text>
          <text x={1456} y={58} font-size="20" class="dim" text-anchor="end">wgp</text>
        </g>
        {CUS.map((cx, c) => (
          <g>
            <g class={`pt ${on('cu')}`}>
              <rect x={cx} y={74} width={340} height={420} rx={14} class="inner" />
              <text x={cx + 18} y={104} font-size="22" font-weight="700">compute unit</text>
            </g>
            <g class={`pt ${on('l0')}`}>
              <rect x={cx + 10} y={426} width={320} height={56} rx={10} class="mem" />
              <Mem x={cx + 26} y={462} name="cache" size="32 KB" show={show} />
            </g>
            {[0, 1].map((s) => {
              const x = cx + 10 + s * (SIMD.w + SIMD.gap), y = SIMD.dy;
              const first = c === 0 && s === 0;
              const lit = on('simd') && (first || st.lit.includes('cu')) ? 'on' : '';
              return (
                <g>
                  <g class={`pt ${lit} ${first ? 'first' : ''}`}>
                    <rect x={x} y={y} width={SIMD.w} height={SIMD.h} rx={10} class="leaf" />
                    <text x={x + 12} y={y + 30} font-size="22" font-weight="700">simd</text>
                    {Array.from({ length: 32 }, (_, l) => (
                      <rect x={x + 12 + l * 4.07} y={y + 46} width={3} height={90} rx={1}
                        class={`lane ${l === 0 && first && st.lit.includes('lane') && !st.lit.includes('simd') ? 'one' : ''}`} />
                    ))}
                    <text x={x + 12} y={y + 162} font-size="17" class="dim">32 lanes</text>
                  </g>
                  <g class={`pt ${on('regs') && (first || st.lit.includes('cu') || show) ? 'on' : ''}`}>
                    <rect x={x + 10} y={y + 182} width={SIMD.w - 20} height={104} rx={6} class="regs" />
                    <text x={x + 20} y={y + 214} font-size="19" font-weight="700">registers</text>
                    <text x={x + 20} y={y + 242} font-size="18" class="dim">192 KB</text>
                    <text x={x + 20} y={y + 270} font-size="18" class={`ns ${show ? 'on' : ''}`}>~2 ns</text>
                  </g>
                </g>
              );
            })}
          </g>
        ))}
        <g class={`pt ${on('lds')}`}>
          <rect x={760} y={510} width={704} height={100} rx={12} class="lds" />
          <text x={784} y={550} font-size="22" font-weight="700">lds <tspan class="dim" font-weight="400">· 128 KB scratchpad, shared by all 4 simds</tspan></text>
          <text x={784} y={590} font-size="20" class={`ns ${show ? 'on' : ''}`}>~20 ns</text>
        </g>
      </svg>
      {!mini && <div class="caption map-text">{st.text}</div>}
      <style>{`
        .map svg { display: block; width: 100%; max-height: 64cqh; }
        .map text { fill: var(--fg); } .map .dim { fill: var(--muted); }
        .map .ns { fill: var(--hot); opacity: 0; transition: opacity .4s; } .map .ns.on { opacity: 1; }
        .map .pt { opacity: .16; transition: opacity .45s; } .map .pt.on { opacity: 1; }
        .map .outer { fill: var(--sunken); stroke: var(--line); stroke-width: 2; }
        .map .inner { fill: var(--panel); stroke: var(--line); stroke-width: 2; }
        .map .leaf { fill: var(--surface); stroke: var(--line-2); stroke-width: 2; transition: stroke .3s; }
        .map .first .leaf, .map .first .tile { stroke: var(--accent); stroke-width: 3; }
        .map .tile { fill: var(--panel); stroke: var(--line-2); stroke-width: 1.5; }
        .map .simd-fill { fill: var(--accent); opacity: .75; }
        .map .lane { fill: var(--accent); transition: fill .3s; } .map .lane.one { fill: var(--hot); }
        .map .regs { fill: var(--tint-violet); stroke: var(--purple); stroke-width: 1.5; }
        .map .lds { fill: var(--tint-green); stroke: var(--good); stroke-width: 1.5; }
        .map .mem { fill: var(--fill-slate); }
        .map .vram { fill: none; stroke: var(--line-2); stroke-width: 2; stroke-dasharray: 8 6; }
        .map .call line { stroke: var(--accent); stroke-width: 2; stroke-dasharray: 5 5; }
        .map .map-text { font-size: .76em; min-height: 3.2em; margin-top: .5em; }
        .map.mini { position: absolute; top: 16px; right: 36px; width: 300px; pointer-events: none; }
        .map.mini svg { max-height: none; }
        .map.mini .pt { opacity: .3; } .map.mini .pt.on { opacity: 1; }
        .map.mini text, .map.mini .ns { display: none; }
      `}</style>
    </div>
  );
}
