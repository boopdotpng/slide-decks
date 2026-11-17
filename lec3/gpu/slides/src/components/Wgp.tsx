/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';

/**
 * Where a wave lives: one simd, for its whole life, its registers in that simd's register file. Then the wgp around
 * it. Layout and sizes for rdna4 (rx 9070 xt):
 *   2 simd32 per compute unit, 2 compute units per wgp                                   amd's rdna architecture deck
 *   1536 registers (32 lanes wide) per simd, at most 16 waves per simd                   rdna4 isa guide; llvm (MaxWavesPerEU16)
 *   128 KB lds per wgp                                                                   amd's rocm gpu specs table
 * 32 wgps × 4 simds × 16 waves = 2048 waves = 65,536 threads parked; × 32 lanes = 4096 lanes busy in a cycle.
 */
type Part = 'simd' | 'regs' | 'wgp';
const STEPS: { on: Part[]; slots: number; text: ComponentChildren }[] = [
  { on: ['simd'], slots: 1,
    text: <>a wave is handed to <b>one simd</b> and stays there, start to finish. its 32 threads are that simd's 32 lanes</> },
  { on: ['simd', 'regs'], slots: 16,
    text: <>its registers sit in that simd's <b>register file</b>, right next to the lanes. up to <b>16 waves</b> can be parked there at once; each cycle the simd runs one that's awake</> },
  { on: ['simd', 'regs', 'wgp'], slots: 16,
    text: <>a <b>workgroup processor</b>: 4 simds, so up to <b>64 waves</b> parked and 4 running each cycle. plus <b>lds</b>, which every wave on this wgp can reach, and no other</> },
  { on: ['simd', 'regs', 'wgp'], slots: 16,
    text: <>the chip has 32 of them: <b>4096 lanes</b> busy every cycle, up to <b>2048 waves</b> (65,536 threads) parked. a desktop cpu has 6 to 16 cores</> },
];

const W = 1500, H = 520;
const CU = [{ x: 30 }, { x: 765 }];
const simdW = 330;

export default function Wgp() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  const on = (p: Part) => st.on.includes(p);
  const first = (c: number, s: number) => c === 0 && s === 0;
  return (
    <div class="wgp" ref={root}>
      <svg viewBox={`0 0 ${W} ${H}`} class="diagram">
        <g class={`wg-b ${on('wgp') ? 'on' : ''}`}>
          <rect x={4} y={4} width={W - 8} height={H - 8} rx={22} class="outer" />
          <text x={34} y={48} font-size="28" font-weight="700">workgroup processor</text>
          <rect x={30} y={410} width={W - 60} height={84} rx={12} class="lds" />
          <text x={56} y={448} font-size="26" font-weight="700">lds</text>
          <text x={56} y={478} font-size="21" class="dim">128 KB scratchpad: every wave on this wgp can reach it, no wave anywhere else can</text>
        </g>
        {CU.map((cu, c) => [0, 1].map((s) => {
          const x = cu.x + s * (simdW + 45);
          const lit = first(c, s) || on('wgp');
          return (
            <g class={`wg-b ${lit ? 'on' : ''} ${first(c, s) && k <= 1 ? 'hot' : ''}`}>
              <rect x={x} y={70} width={simdW} height={320} rx={12} class="leaf" />
              <text x={x + 18} y={106} font-size="26" font-weight="700">simd</text>
              {Array.from({ length: 32 }, (_, l) => <rect x={x + 18 + l * 9.2} y={124} width={7} height={40} rx={2} class="lane" />)}
              <text x={x + 18} y={190} font-size="18" class="dim">32 lanes: the wave running this cycle</text>
              <g class={`wg-r ${first(c, s) || on('wgp') ? 'on' : ''}`}>
                <rect x={x + 14} y={210} width={simdW - 28} height={162} rx={8} class="regs" />
                <text x={x + 28} y={240} font-size="19" class={on('regs') ? '' : 'dim'}>register file · parked waves</text>
                {Array.from({ length: 16 }, (_, w) => {
                  const shown = (first(c, s) ? (on('regs') ? 16 : st.slots) : on('wgp') ? 16 : 0) > w;
                  return (
                    <rect x={x + 28 + (w % 8) * 36.5} y={258 + Math.floor(w / 8) * 54} width={30} height={44} rx={4}
                      class={`slot ${shown ? 'on' : ''} ${w === 0 && first(c, s) ? 'one' : ''}`} />
                  );
                })}
              </g>
            </g>
          );
        }))}
      </svg>
      <div class="caption wg-text">{st.text}</div>
      <style>{`
        .wgp svg.diagram { max-height: 56cqh; }
        .wgp text { fill: var(--fg); } .wgp text.dim { fill: var(--muted); }
        .wgp .wg-b { opacity: .15; transition: opacity .4s; } .wgp .wg-b.on { opacity: 1; }
        .wgp .outer { fill: var(--sunken); stroke: var(--line); stroke-width: 2; }
        .wgp .leaf { fill: var(--surface); stroke: var(--line-2); stroke-width: 2; transition: stroke .3s; }
        .wgp .hot .leaf { stroke: var(--accent); stroke-width: 3; }
        .wgp .lane { fill: var(--accent); }
        .wgp .regs { fill: var(--tint-violet); stroke: var(--purple); stroke-width: 1.5; }
        .wgp .lds { fill: var(--tint-green); stroke: var(--good); stroke-width: 1.5; }
        .wgp .slot { fill: var(--raised); transition: fill .4s; } .wgp .slot.on { fill: var(--purple); }
        .wgp .slot.one { fill: var(--hot); }
        .wgp .wg-text { font-size: .78em; min-height: 3.2em; margin-top: .4em; }
      `}</style>
    </div>
  );
}
