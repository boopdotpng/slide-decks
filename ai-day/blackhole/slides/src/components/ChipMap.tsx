/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from 'slides/hooks';
import { COLORS } from 'slides/viz';
import f from '../facts.json';

/**
 * The p100a from above, simplified: 120 ai cores in their real 12 × 10 grid (columns 1–7 and 10–14 of the chip,
 * rows 2–11; columns 8–9 hold memory ports and are left out), 7 memory banks (28 gb), and the link to the computer.
 * Adapted from the os deck's BlackholeChip (which draws a p150 with 8 banks).
 *   step 0  the chip       step 1  one core lights up and opens: what's inside it
 */

const COLS = 12, ROWS = 10, PITCH = 40, TILE = 33, GX = 60, GY = 70;
const MX = GX + COLS * PITCH + 34, BANKS = 7, BH = (ROWS * PITCH - 6) / BANKS;
const PICK: [number, number] = [9, 6]; // the core that opens at step 1 (column, row in the drawing)

export default function ChipMap() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const open = step >= 1;
  const [px, py] = [GX + PICK[0] * PITCH, GY + PICK[1] * PITCH];
  const inside = [
    { t: `${f.card.core_sram_mb} mb of its own memory`, c: 'var(--fill-slate)' },
    { t: 'a matrix engine', s: 'grids of numbers', c: 'var(--fill-blue)' },
    { t: 'a vector engine', s: 'exp, sqrt, activations', c: 'var(--fill-violet)' },
    { t: `${f.card.riscv_per_core} tiny cpus`, s: 'move data, drive the engines', c: 'var(--fill-green)' },
  ];
  return (
    <div class="chipmap" ref={root}>
      <svg viewBox="0 0 700 560" width="100%">
        <rect x={10} y={10} width={680} height={540} rx={20} fill="var(--sunken)" stroke="var(--border)" stroke-width={2} />
        <text x={36} y={50} font-size="24" font-weight="700" fill="var(--fg)">
          the p100a <tspan font-weight="400" fill="var(--muted)">· from above</tspan>
        </text>
        {Array.from({ length: COLS * ROWS }, (_, i) => {
          const cx = i % COLS, cy = Math.floor(i / COLS);
          const lit = open && cx === PICK[0] && cy === PICK[1];
          return <rect x={GX + cx * PITCH} y={GY + cy * PITCH} width={TILE} height={TILE} rx={5}
            fill={lit ? COLORS.hot : 'var(--steel)'} stroke={lit ? COLORS.hot : 'var(--steel-line)'} stroke-width={1}
            style={{ transition: 'fill .3s' }} />;
        })}
        <text x={GX} y={GY + ROWS * PITCH + 26} font-size="20" fill="var(--muted)">{f.card.cores} ai cores</text>
        {Array.from({ length: BANKS }, (_, b) => (
          <rect x={MX} y={GY + b * BH} width={70} height={BH - 6} rx={6} fill="var(--fill-amber)" stroke={COLORS.hot}
            stroke-opacity={0.5} />
        ))}
        <text x={MX + 35} y={GY + ROWS * PITCH + 26} font-size="20" fill="var(--muted)" text-anchor="middle">
          {f.card.memory_gb} gb memory
        </text>

        <g class={`fade ${open ? 'on' : ''}`}>
          <path d={`M ${px + TILE} ${py + TILE / 2} L 300 240`} stroke={COLORS.hot} stroke-width={3} fill="none" />
          <rect x={110} y={190} width={560} height={286} rx={16} fill="var(--panel)" stroke={COLORS.hot} stroke-width={3} />
          <text x={134} y={228} font-size="24" font-weight="700" fill="var(--fg)">one core</text>
          {inside.map((it, i) => (
            <g>
              <rect x={134} y={246 + i * 56} width={512} height={48} rx={8} fill={it.c} />
              <text x={152} y={277 + i * 56} font-size="21" font-weight="600" fill="var(--fg)">
                {it.t}{it.s && <tspan font-weight="400" fill="var(--muted)"> · {it.s}</tspan>}
              </text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}
