/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { COLORS } from './viz';

/**
 * A program's memory, high addresses at the top: stack (grows down), free
 * space, heap (grows up to the break), .bss, .data, .rodata, .text.
 * Not an island: islands render it from their step. Region sizes animate
 * (flex-grow transitions), so grow the heap by passing a bigger `sizes.heap`.
 *
 *   <AddressSpace lit={['rodata']} notes={{ rodata: '"hello"' }}
 *     sizes={{ heap: 2 }} markers={[{ region: 'heap', at: 0, label: 'break' }]} />
 *
 * Addresses are typical (the os deck's rv emulator), not what every system uses.
 */
export type RegionKey = 'stack' | 'free' | 'heap' | 'bss' | 'data' | 'rodata' | 'text';

export const REGIONS: { key: RegionKey; name: string; sub?: string; color: string; size: number; addr?: string }[] = [
  { key: 'stack', name: 'stack', sub: 'grows ↓', color: COLORS.amber, size: 1.6, addr: '0x7fffffe0' },
  { key: 'free', name: '', color: 'transparent', size: 3 },
  { key: 'heap', name: 'heap', sub: 'grows ↑', color: COLORS.green, size: 1.1 },
  { key: 'bss', name: '.bss', sub: 'zeroed globals', color: 'var(--steel)', size: 1 },
  { key: 'data', name: '.data', sub: 'globals', color: COLORS.blue, size: 1 },
  { key: 'rodata', name: '.rodata', sub: 'read-only', color: COLORS.violet, size: 1 },
  { key: 'text', name: '.text', sub: 'code', color: COLORS.slate, size: 1, addr: '0x10000' },
];

export type Marker = {
  region: RegionKey;
  /** 0 = top edge of the region, 1 = bottom edge */
  at: number;
  label: ComponentChildren;
  color?: string;
};

export function AddressSpace({ lit = [], sizes = {}, notes = {}, markers = [], subs = {}, class: cls = '' }: {
  /** highlighted regions; when any are lit, the rest dim */
  lit?: RegionKey[];
  sizes?: Partial<Record<RegionKey, number>>;
  /** text (or anything) to the right of a region */
  notes?: Partial<Record<RegionKey, ComponentChildren>>;
  /** arrows pointing at a spot in a region, from the left */
  markers?: Marker[];
  /** replace a region's small subtitle */
  subs?: Partial<Record<RegionKey, string>>;
  class?: string;
}) {
  return (
    <div class={`aspace ${cls}`}>
      {REGIONS.map((r) => {
        const on = lit.includes(r.key);
        const dim = lit.length > 0 && !on;
        return (
          <div class={`as-row as-${r.key}`} style={{ flexGrow: sizes[r.key] ?? r.size }}>
            <div class={`as-box ${on ? 'on' : ''} ${dim ? 'dim' : ''}`} style={{ background: r.color }}>
              {r.name && <span class="as-name">{r.name}</span>}
              {(subs[r.key] ?? r.sub) && <span class="as-sub">{subs[r.key] ?? r.sub}</span>}
              {r.key === 'stack' && <span class="as-addr as-top">{r.addr}</span>}
              {r.key === 'text' && <span class="as-addr as-bot">{r.addr}</span>}
              {markers.filter((m) => m.region === r.key).map((m) => (
                <span class="as-mark" style={{ top: `${m.at * 100}%`, color: m.color ?? 'var(--accent)' }}>{m.label} →</span>
              ))}
            </div>
            <div class={`as-note fade ${notes[r.key] ? 'on' : ''}`}>{notes[r.key]}</div>
          </div>
        );
      })}
      <style>{`
        .aspace { display: flex; flex-direction: column; height: 100%; min-height: 0; font-size: .6em; padding-left: 4.5em; }
        .aspace .as-row { display: flex; gap: .8em; flex-basis: 0; min-height: 1.6em; transition: flex-grow .6s ease; }
        .aspace .as-box { position: relative; width: 11em; flex: none; border-radius: 4px; margin: 1px 0;
          display: flex; align-items: center; gap: .6em; padding: 0 .6em; font-family: var(--mono);
          box-shadow: inset 0 0 0 2px transparent; transition: opacity .35s, box-shadow .35s; }
        .aspace .as-free .as-box { background: repeating-linear-gradient(135deg, var(--surface) 0 2px, transparent 2px 9px) !important;
          border: 1px dashed var(--border); }
        .aspace .as-box.on { box-shadow: inset 0 0 0 3px var(--accent); }
        .aspace .as-box.dim { opacity: .3; }
        .aspace .as-name { font-size: .9em; color: var(--fg); white-space: nowrap; }
        .aspace .as-sub { font-size: .65em; color: color-mix(in srgb, var(--fg) 55%, transparent); white-space: nowrap; font-family: var(--sans); }
        .aspace .as-addr { position: absolute; right: calc(100% + .5em); font-size: .7em; color: var(--muted); }
        .aspace .as-top { top: 0; }
        .aspace .as-bot { bottom: 0; }
        .aspace .as-mark { position: absolute; right: calc(100% + .4em); transform: translateY(-50%); white-space: nowrap;
          font-family: var(--mono); font-size: .8em; transition: top .6s ease; }
        .aspace .as-note { align-self: center; font-size: .85em; color: var(--muted); min-width: 0; }
      `}</style>
    </div>
  );
}
