/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';

/**
 * The map of the talk: the whole rtx 4090 on the left (128 sms, the l2 cache, gpu memory off the chip), one sm blown
 * up on the right (4 warp schedulers, nvidia's sm sub-partitions / smsps: each 32 lanes with its own register file, and one block of sram that is both the l1
 * cache and shared memory).
 *
 * Counts and sizes: 128 sms × 128 fp32 lanes, 72 MB l2, 128 KB combined l1 / shared memory per sm, 24 GB gddr6x
 * (arXiv 2501.12084, table 2; chips and cheese, "microbenchmarking nvidia's rtx 4090"); 64k 32-bit registers per sm =
 * 64 KB per warp scheduler (nvidia's ada tuning guide). Latencies, rounded on purpose (the point is the ratio): p-chase
 * cycles from arXiv 2501.12084 table 3 (shared ~30, l2 ~273, global ~571) at the 2.52 GHz boost clock; registers ~
 * the 4-cycle dependent fp32 latency (chips and cheese).
 *
 * As a slide: <Map /> steps through STEPS. In a corner: <Map mini at="warp" />, the same picture with one part lit.
 */
export type Part = 'chip' | 'sm' | 'part' | 'lane' | 'regs' | 'smem' | 'l2' | 'vram';
export type At = 'lane' | 'warp' | 'part' | 'sm' | 'chip' | 'mem';

const LIT: Record<At, Part[]> = {
  lane: ['lane'],
  warp: ['lane', 'part'],
  part: ['part', 'regs'],
  sm: ['sm', 'part', 'smem'],
  chip: ['chip', 'sm'],
  mem: ['regs', 'smem', 'l2', 'vram'],
};

const STEPS: { lit: Part[]; mem: boolean; text: ComponentChildren }[] = [
  { lit: ['chip', 'l2', 'vram'], mem: false,
    text: <>one gpu: <b>128 processors</b> (<b>sms</b>) side by side, sharing a big cache and 24 GB of memory</> },
  { lit: ['sm', 'part', 'lane', 'regs', 'smem'], mem: false,
    text: <>one sm: 4 <b>warp schedulers</b>, each with 32 lanes and its own registers, plus <b>shared memory</b>. 16384 lanes in all</> },
  { lit: ['regs', 'smem', 'l2', 'vram'], mem: true,
    text: <>near is small and fast, far is big and slow: gpu memory is ~100× further than a register</> },
];

const VW = 1500, VH = 640;
const COLS = 16, ROWS = 8; // 128 sms
const TILE = { x: 40, y: 78, w: 33, h: 33, gap: 4.4 };
const PART = { x: 760, dy: 84, w: 165, h: 360, gap: 14 }; // 4 × 165 + 3 × 14 = 702 of the sm's 704 inside
const HOT = COLS - 1; // the tile that's blown up: top right, next to the callout

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
          <text x={44} y={58} font-size="26" font-weight="700">the chip · rtx 4090</text>
          <text x={636} y={58} font-size="20" class="dim" text-anchor="end">128 sms</text>
        </g>
        {Array.from({ length: COLS * ROWS }, (_, k) => {
          const c = k % COLS, r = Math.floor(k / COLS);
          const x = TILE.x + c * (TILE.w + TILE.gap), y = TILE.y + r * (TILE.h + TILE.gap);
          return (
            <g class={`pt ${k === HOT ? on('sm') || on('chip') : on('chip')} ${k === HOT ? 'first' : ''}`}>
              <rect x={x} y={y} width={TILE.w} height={TILE.h} rx={5} class="tile" />
              {[0, 1, 2, 3].map((s) => <rect x={x + 4 + s * 6.5} y={y + 5} width={5} height={TILE.h - 10} rx={1.5} class="simd-fill" />)}
            </g>
          );
        })}
        <g class={`pt ${on('l2')}`}>
          <rect x={40} y={400} width={600} height={96} rx={10} class="mem" />
          <Mem x={60} y={455} name="l2 cache" size="72 MB" ns="~110 ns" show={show} />
        </g>
        <g class={`pt ${on('vram')}`}>
          <rect x={20} y={556} width={640} height={66} rx={14} class="vram" />
          <Mem x={44} y={598} name="gpu memory" size="24 GB, off the chip" ns="~230 ns" show={show} />
        </g>

        {/* ---- the callout: the top-right tile is the sm on the right ---- */}
        <g class={`pt call ${on('sm')}`}>
          <line x1={t0x + TILE.w} y1={t0y} x2={740} y2={20} />
          <line x1={t0x + TILE.w} y1={t0y + TILE.h} x2={740} y2={630} />
        </g>

        {/* ---- one sm ---- */}
        <g class={`pt ${on('sm')}`}>
          <rect x={740} y={20} width={740} height={610} rx={20} class="outer" />
          <text x={764} y={58} font-size="26" font-weight="700">one streaming multiprocessor</text>
          <text x={1456} y={58} font-size="20" class="dim" text-anchor="end">sm</text>
        </g>
        {[0, 1, 2, 3].map((s) => {
          const x = PART.x + s * (PART.w + PART.gap), y = PART.dy;
          const first = s === 0;
          const lit = on('part') && (first || st.lit.includes('sm')) ? 'on' : '';
          return (
            <g>
              <g class={`pt ${lit} ${first ? 'first' : ''}`}>
                <rect x={x} y={y} width={PART.w} height={PART.h} rx={10} class="leaf" />
                <text x={x + 12} y={y + 30} font-size="19" font-weight="700">warp scheduler</text>
                {Array.from({ length: 32 }, (_, l) => (
                  <rect x={x + 13 + l * 4.4} y={y + 48} width={3.2} height={124} rx={1}
                    class={`lane ${l === 0 && first && st.lit.includes('lane') && !st.lit.includes('part') ? 'one' : ''}`} />
                ))}
                <text x={x + 12} y={y + 198} font-size="17" class="dim">32 lanes</text>
              </g>
              <g class={`pt ${on('regs') && (first || st.lit.includes('sm') || show) ? 'on' : ''}`}>
                <rect x={x + 10} y={y + 218} width={PART.w - 20} height={124} rx={6} class="regs" />
                <text x={x + 22} y={y + 254} font-size="19" font-weight="700">registers</text>
                <text x={x + 22} y={y + 284} font-size="18" class="dim">64 KB</text>
                <text x={x + 22} y={y + 314} font-size="18" class={`ns ${show ? 'on' : ''}`}>~2 ns</text>
              </g>
            </g>
          );
        })}
        <g class={`pt ${on('smem')}`}>
          <rect x={760} y={466} width={704} height={144} rx={12} class="lds" />
          <text x={784} y={512} font-size="22" font-weight="700">shared memory <tspan class="dim" font-weight="400">+ l1 cache · 128 KB, shared by the whole sm</tspan></text>
          <text x={784} y={552} font-size="18" class="dim">the block's scratchpad: its threads share it</text>
          <text x={784} y={588} font-size="20" class={`ns ${show ? 'on' : ''}`}>~12 ns</text>
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
