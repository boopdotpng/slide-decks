/** @jsxImportSource preact */
import { COLORS } from './viz';

/**
 * The blackhole chip as the host reaches it, simplified: the 120 worker cores
 * at their real noc 0 coordinates (x 1–7 and 10–14, y 2–11, as in
 * blackhole-py's pcie.py), 8 dram banks (p150: 8 × 4 GiB), and the pcie tile
 * where host traffic enters, with the tlb register that says where a window
 * points. Draws an 820 × 640 group at (x, y); used by the tlb and pin slides.
 */

export type Core = [number, number];
export type Target = { core: Core } | { dram: number } | { pcie: true };

const CORE_X = [1, 2, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14];
const PITCH = 46, TILE = 40, GX = 160, GY = 130;
const DX = 730, DH = (10 * PITCH) / 8;
const PCIE = { x: 24, y: 300, w: 110, h: 90 };

const corePos = ([x, y]: Core): Core => [GX + CORE_X.indexOf(x) * PITCH, GY + (y - 2) * PITCH];
const center = (t: Target): Core => {
  if ('core' in t) { const [x, y] = corePos(t.core); return [x + TILE / 2, y + TILE / 2]; }
  if ('dram' in t) return [DX + 35, GY + t.dram * DH + DH / 2 - 3];
  return [PCIE.x + PCIE.w / 2, PCIE.y + PCIE.h / 2];
};

export function BlackholeChip({ x = 0, y = 0, lit = [], dram = [], reg, regLabel = 'tlb register', packet, pcieNote }: {
  x?: number; y?: number;
  /** cores to highlight, or every core */
  lit?: Core[] | 'all';
  /** dram banks to highlight */
  dram?: number[];
  /** what the register strip says; omit to hide it */
  reg?: string;
  regLabel?: string;
  /** a dot that glides from the pcie tile to here */
  packet?: Target;
  /** small text under the pcie tile */
  pcieNote?: string;
}) {
  const isLit = (c: Core) => lit === 'all' || lit.some(([a, b]) => a === c[0] && b === c[1]);
  const [px, py] = center(packet ?? { pcie: true });
  return (
    <g transform={`translate(${x} ${y})`} class="bh">
      <rect width={820} height={640} rx={20} fill="var(--sunken)" stroke="var(--border)" stroke-width={2} />
      <text x={24} y={40} font-size="26" font-weight="700" fill="var(--fg)">the card <tspan font-weight="400" fill="var(--muted)">· blackhole</tspan></text>

      <g class={`fade ${reg ? 'on' : ''}`}>
        <rect x={24} y={60} width={772} height={50} rx={10} fill="var(--hl)" />
        <text x={44} y={93} font-size="22" fill="var(--muted)">{regLabel}</text>
        <text x={230} y={93} font-size="22" font-family="var(--mono)" fill="var(--fg)">{reg}</text>
      </g>

      <rect x={PCIE.x} y={PCIE.y} width={PCIE.w} height={PCIE.h} rx={10} fill={COLORS.green} />
      <text x={PCIE.x + PCIE.w / 2} y={PCIE.y + 54} font-size="24" font-weight="700" fill="var(--fg)" text-anchor="middle">pcie</text>
      {pcieNote && <text x={PCIE.x + PCIE.w / 2} y={PCIE.y + PCIE.h + 30} font-size="18" font-family="var(--mono)" fill="var(--fg)" text-anchor="middle">{pcieNote}</text>}

      {CORE_X.flatMap((cx) => [2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((cy) => {
        const [tx, ty] = corePos([cx, cy]);
        const on = isLit([cx, cy]);
        return <rect x={tx} y={ty} width={TILE} height={TILE} rx={5} fill={on ? COLORS.accent : 'var(--surface)'}
          style={{ transition: 'fill .3s' }} />;
      }))}
      <text x={GX} y={GY + 10 * PITCH + 26} font-size="18" fill="var(--muted)">120 risc-v cores (tensix), each at a noc (x, y)</text>

      <text x={DX + 35} y={GY - 10} font-size="18" fill="var(--muted)" text-anchor="middle">dram</text>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((b) => (
        <g>
          <rect x={DX} y={GY + b * DH} width={70} height={DH - 6} rx={6} fill={dram.includes(b) ? COLORS.hot : 'var(--surface)'}
            style={{ transition: 'fill .3s' }} />
          <text x={DX + 35} y={GY + b * DH + DH / 2 + 4} font-size="18" fill={dram.includes(b) ? 'var(--on-color)' : 'var(--muted)'} text-anchor="middle">{b}</text>
        </g>
      ))}

      <circle r={13} cx={0} cy={0} fill="var(--fg)" class={`bh-packet ${packet ? 'on' : ''}`}
        style={{ transform: `translate(${px}px, ${py}px)` }} />
      <style>{`
        .bh .bh-packet { opacity: 0; transition: transform .7s cubic-bezier(.5, 0, .3, 1), opacity .2s; }
        .bh .bh-packet.on { opacity: 1; }
      `}</style>
    </g>
  );
}
