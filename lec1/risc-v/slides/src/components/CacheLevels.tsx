/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from './Code';
import { Arrow, Box, COLORS, Reveal } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * The levels between the core and ram, and what happens to one line (0x1040).
 * Sizes and latencies match the hierarchy slide (ryzen 9 7950x). Only a few
 * slots per level are drawn; the caption says how many there really are.
 *   0 the levels          1 a load falls through to l3     2 the line is copied up
 *   3 the next load hits  4 l1d is full: who goes?         5 lru eviction
 *   6 a store: dirty line 7 dirty line evicted: write-back
 */

type Slot = { tag: string | null; mark?: 'new' | 'hit' | 'evict' | 'found'; dirty?: boolean; age?: number };
type State = { l1d: Slot[]; l2: Slot[]; l3: Slot[]; ram: string; code: string; text: ComponentChildren;
  down?: ('l1d' | 'l2' | 'l3')[]; found?: 'l3' | 'l1d'; up?: boolean; wb?: boolean };

const s = (...tags: (string | null)[]): Slot[] => tags.map((tag) => ({ tag }));
const L2 = s('0x2000', '0x0400', '0x7fc0', '0x3300', null);
const L3 = s('0x2000', '0x0400', '0x7fc0', '0x3300', '0x1040');

const STEPS: State[] = [
  { l1d: s('0x2000', '0x0400', '0x7fc0', null), l2: L2, l3: L3, ram: 'all of it', code: '',
    text: <>two l1s next to the core: <b>l1i</b> feeds instruction fetch, <b>l1d</b> serves loads and stores. then l2, l3, ram: each bigger and slower</> },
  { l1d: s('0x2000', '0x0400', '0x7fc0', null), l2: L2, l3: L3.map((x) => (x.tag === '0x1040' ? { ...x, mark: 'found' } : x)),
    ram: 'all of it', code: 'ld a0, 0(a1)      # a1 = 0x1040', down: ['l1d', 'l2', 'l3'], found: 'l3',
    text: <>not in l1d, not in l2, found in l3. <b>~50 cycles ≈ 9 ns</b></> },
  { l1d: s('0x2000', '0x0400', '0x7fc0', '0x1040').map((x) => (x.tag === '0x1040' ? { ...x, mark: 'new' } : x)),
    l2: s('0x2000', '0x0400', '0x7fc0', '0x3300', '0x1040').map((x) => (x.tag === '0x1040' ? { ...x, mark: 'new' } : x)),
    l3: L3, ram: 'all of it', code: 'ld a0, 0(a1)      # a1 = 0x1040', up: true,
    text: <>the whole 64-byte line is copied into l2 and l1d on the way up. then 8 bytes of it go into a0</> },
  { l1d: s('0x2000', '0x0400', '0x7fc0', '0x1040').map((x) => (x.tag === '0x1040' ? { ...x, mark: 'hit' } : x)),
    l2: s('0x2000', '0x0400', '0x7fc0', '0x3300', '0x1040'), l3: L3, ram: 'all of it',
    code: 'ld a2, 8(a1)      # 0x1048: same line', found: 'l1d',
    text: <>the next load is 8 bytes further: same line, already in l1d. <b>~4 cycles ≈ 0.7 ns</b></> },
  { l1d: [{ tag: '0x2000', age: 3 }, { tag: '0x0400', age: 9 }, { tag: '0x7fc0', age: 5 }, { tag: '0x1040', age: 0 }],
    l2: s('0x2000', '0x0400', '0x7fc0', '0x3300', '0x1040'), l3: L3, ram: 'all of it',
    code: 'ld a3, 0(a4)      # a4 = 0x5000', down: ['l1d', 'l2', 'l3'],
    text: <>a load from 0x5000 misses everywhere. but l1d is full (really 512 lines, 4 drawn). which line has to go? numbers = loads since it was last used</> },
  { l1d: [{ tag: '0x2000', age: 4 }, { tag: '0x5000', mark: 'new', age: 0 }, { tag: '0x7fc0', age: 6 }, { tag: '0x1040', age: 1 }],
    l2: s('0x2000', '0x0400', '0x7fc0', '0x3300', '0x1040'), l3: L3, ram: 'all of it',
    code: 'ld a3, 0(a4)      # a4 = 0x5000', up: true,
    text: <>the one used longest ago: <b>least recently used</b>. 0x0400 is dropped. it's still in l2 if you need it again</> },
  { l1d: [{ tag: '0x2000' }, { tag: '0x5000' }, { tag: '0x7fc0' }, { tag: '0x1040', mark: 'hit', dirty: true }],
    l2: s('0x2000', '0x0400', '0x7fc0', '0x3300', '0x1040'), l3: L3, ram: '0x1040: old value',
    code: 'sd a5, 0(a1)      # store to 0x1040', found: 'l1d',
    text: <>a store only writes the copy in l1d and marks the line <b>dirty</b>. l2, l3 and ram still have the old value</> },
  { l1d: [{ tag: '0x2000' }, { tag: '0x5000' }, { tag: '0x7fc0' }, { tag: '0x8800', mark: 'new' }],
    l2: s('0x2000', '0x0400', '0x7fc0', '0x3300', '0x1040').map((x) => (x.tag === '0x1040' ? { ...x, mark: 'new', dirty: true } : x)),
    l3: L3, ram: '0x1040: old value', code: '# …later, 0x1040 gets evicted', wb: true,
    text: <>only when a dirty line is evicted is it written down a level (<b>write-back</b>). ram gets it last, maybe much later. clean lines are just dropped</> },
];

// layout (svg units)
const W = 1500;
const CORE = { x: 20, y: 0, w: W - 40, h: 110 };
const L1I = { x: 20, y: 170, w: 620, h: 130 };
const L1D = { x: 680, y: 170, w: 800, h: 130 };
const LV2 = { x: 20, y: 350, w: W - 40, h: 120 };
const LV3 = { x: 20, y: 520, w: W - 40, h: 120 };
const RAM = { x: 20, y: 690, w: W - 40, h: 110 };
const SLOT_W = 128, SLOT_H = 54, SLOT_GAP = 12;
const FETCH_X = 330, LS_X = 1080;

function Slots({ box, slots }: { box: { x: number; y: number; w: number; h: number }; slots: Slot[] }) {
  const x0 = box.x + box.w - 30 - slots.length * (SLOT_W + SLOT_GAP) + SLOT_GAP;
  const y = box.y + (box.h - SLOT_H) / 2 + (slots.some((x) => x.age !== undefined) ? -14 : 0);
  return (
    <g>
      {slots.map((sl, k) => {
        const x = x0 + k * (SLOT_W + SLOT_GAP);
        const stroke = sl.mark === 'new' ? COLORS.accent : sl.mark === 'hit' || sl.mark === 'found' ? COLORS.good
          : sl.mark === 'evict' ? COLORS.bad : 'var(--line)';
        return (
          <g class="cl-slot">
            <rect x={x} y={y} width={SLOT_W} height={SLOT_H} rx={8} fill={sl.tag ? 'var(--surface)' : 'none'}
              stroke={stroke} stroke-width={sl.mark ? 4 : 2} stroke-dasharray={sl.tag ? undefined : '6 6'} />
            <text x={x + SLOT_W / 2} y={y + SLOT_H / 2 + 8} text-anchor="middle" font-size="23" font-family="var(--mono)"
              fill={sl.tag ? 'var(--fg)' : 'var(--muted)'}>{sl.tag ?? 'empty'}</text>
            {sl.dirty && <g>
              <rect x={x + SLOT_W - 50} y={y - 18} width={68} height={32} rx={6} fill={COLORS.bad} />
              <text x={x + SLOT_W - 16} y={y + 6} text-anchor="middle" font-size="22" font-weight="700" fill="var(--on-color)">dirty</text>
            </g>}
            {sl.age !== undefined && (
              <text x={x + SLOT_W / 2} y={y + SLOT_H + 30} text-anchor="middle" font-size="28" font-family="var(--mono)"
                fill={sl.age === Math.max(...slots.map((o) => o.age ?? 0)) ? COLORS.bad : 'var(--muted)'}>{sl.age}</text>
            )}
          </g>
        );
      })}
    </g>
  );
}

export default function CacheLevels() {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[step];
  const down = st.down ?? [];
  const missed = (lv: 'l1d' | 'l2' | 'l3') => down.includes(lv) && st.found !== lv;

  // request arrows go down the right-hand side; copies come back up next to them
  const RX = LS_X, UX = LS_X - 60;
  const miss = (y: number, on: boolean) => (
    <Reveal on={on}><text x={RX + 30} y={y} font-size="30" font-weight="700" fill={COLORS.bad}>✗ miss</text></Reveal>
  );

  return (
    <div class="cache-levels" ref={root}>
      <div class="cl-code">{st.code ? <Code lang="asm" code={st.code} /> : <pre class="code"> </pre>}</div>
      <svg viewBox={`0 -10 ${W} 820`} class="diagram">
        <Box {...CORE} title="core" />
        <rect x={FETCH_X - 150} y={28} width={300} height={56} rx={10} fill="var(--surface)" stroke="var(--line)" />
        <text x={FETCH_X} y={65} text-anchor="middle" font-size="24" fill="var(--fg)">instruction fetch</text>
        <rect x={LS_X - 150} y={28} width={300} height={56} rx={10} fill="var(--surface)" stroke="var(--line)" />
        <text x={LS_X} y={65} text-anchor="middle" font-size="24" fill="var(--fg)">loads / stores</text>

        <Box {...L1I} title="l1i" sub="32 KB · instructions" tag="~4 cycles" />
        <Box {...L1D} title="l1d" sub="32 KB · data" tag="" />
        <text x={L1D.x + 30} y={L1D.y + 118} font-size="22" fill="var(--accent)">~4 cycles</text>
        <Box {...LV2} title="l2" sub="1 MB · ~14 cycles" />
        <Box {...LV3} title="l3" sub="32 MB · ~50 cycles" />
        <Box {...RAM} title="ram" sub="GBs · ~70 ns" />
        <text x={RAM.x + RAM.w - 30} y={RAM.y + 65} text-anchor="end" font-size="24" font-family="var(--mono)"
          fill={st.ram.includes('old') ? COLORS.bad : 'var(--muted)'}>{st.ram}</text>

        <Slots box={L1D} slots={st.l1d} />
        <Slots box={LV2} slots={st.l2} />
        <Slots box={LV3} slots={st.l3} />

        {/* the core always talks to the l1s */}
        <Arrow from={[FETCH_X, 84]} to={[FETCH_X, L1I.y]} on width={3} color="var(--muted)" />
        <Arrow from={[RX, 84]} to={[RX, L1D.y]} on={down.length > 0 || st.found === 'l1d'} width={4} color={COLORS.hot} />

        {/* a miss goes down a level */}
        <Arrow from={[RX, L1D.y + L1D.h]} to={[RX, LV2.y]} on={missed('l1d') || false} width={4} color={COLORS.hot} />
        <Arrow from={[RX, LV2.y + LV2.h]} to={[RX, LV3.y]} on={missed('l2')} width={4} color={COLORS.hot} />
        <Arrow from={[RX, LV3.y + LV3.h]} to={[RX, RAM.y]} on={missed('l3')} width={4} color={COLORS.hot} />
        {miss(L1D.y + L1D.h + 40, missed('l1d'))}
        {miss(LV2.y + LV2.h + 40, missed('l2'))}
        {miss(LV3.y + LV3.h + 40, missed('l3'))}

        {/* the line comes back up */}
        <Arrow from={[UX, LV3.y]} to={[UX, LV2.y + LV2.h]} on={!!st.up} width={4} color={COLORS.accent} />
        <Arrow from={[UX, LV2.y]} to={[UX, L1D.y + L1D.h]} on={!!st.up} width={4} color={COLORS.accent} label="" />
        <Reveal on={!!st.up}><text x={UX - 20} y={LV2.y - 14} text-anchor="end" font-size="24" fill={COLORS.accent}>copy the line up</text></Reveal>

        {/* write-back */}
        <Arrow from={[UX - 300, L1D.y + L1D.h]} to={[UX - 300, LV2.y]} on={!!st.wb} width={4} color={COLORS.bad} />
        <Reveal on={!!st.wb}><text x={UX - 320} y={LV2.y - 14} text-anchor="end" font-size="24" fill={COLORS.bad}>write back 0x1040</text></Reveal>
      </svg>
      <div class="caption cl-text">{st.text}</div>
      <style>{`
        .cache-levels { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        .cache-levels .cl-code { min-height: 2.2em; }
        .cache-levels .cl-code pre { font-size: .6em; margin: 0; display: inline-block; min-width: 22em; }
        .cache-levels svg.diagram { flex: 1; min-height: 0; max-height: none; height: 100%; }
        .cache-levels .cl-slot rect, .cache-levels .cl-slot text { transition: stroke .3s, fill .3s; }
        .cache-levels .cl-text { font-size: .72em; min-height: 2.6em; margin-top: .3em; }
      `}</style>
    </div>
  );
}
