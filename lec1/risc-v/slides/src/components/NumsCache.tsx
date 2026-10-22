/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { COLORS } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Our 8 loads (and the store) against 64-byte cache lines, at nums' real
 * address 0x12198. That isn't a multiple of 64, so nums straddles two lines:
 * 0x12180–0x121bf holds nums[0..4], 0x121c0–0x121ff holds nums[5..7] + total.
 * Times are rough (ram ~70 ns, L1 ~1 ns), same as the latency slide.
 */

const LINES = [0x12180, 0x121c0];
const NUMS = 0x12198;
const VALUES = [3, 1, 4, 1, 5, 9, 2, 6];
const RAM_NS = 70, L1_NS = 1;

// what lives at each 8-byte slot
const slot = (addr: number): string | null => {
  const i = (addr - NUMS) / 8;
  if (i >= 0 && i < 8) return `nums[${i}]`;
  if (i === 8) return 'total';
  return null;
};

type Access = { i: number; kind: 'miss' | 'hit' };
// loads of nums[0..7] in order, then the sd to total (index 8)
const ACCESSES: Access[] = [
  { i: 0, kind: 'miss' }, { i: 1, kind: 'hit' }, { i: 2, kind: 'hit' }, { i: 3, kind: 'hit' }, { i: 4, kind: 'hit' },
  { i: 5, kind: 'miss' }, { i: 6, kind: 'hit' }, { i: 7, kind: 'hit' }, { i: 8, kind: 'hit' },
];

const STEPS: { done: number; text: ComponentChildren }[] = [
  { done: 0, text: <>memory comes into the cache in <b>64-byte lines</b>, never less: 8 of our numbers' worth. nums starts at 0x12198, which isn't a multiple of 64, so it's split across two lines</> },
  { done: 1, text: <>lap 1: <code>ld</code> nums[0]. not in the cache: a <b>miss</b>. wait ~70 ns for ram, and the whole line comes in</> },
  { done: 5, text: <>laps 2–5: already there. each is a <b>hit</b>, ~1 ns</> },
  { done: 6, text: <>lap 6: nums[5] is in the next line. another miss</> },
  { done: 9, text: <>laps 7–8 hit, and so does the <code>sd</code> to total: it's in the same line</> },
  { done: 9, text: <>9 memory accesses, 2 misses. the misses are almost all the time. so: keep data you use together, together, and walk it in order</> },
];

export default function NumsCache() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const done = ACCESSES.slice(0, STEPS[k].done);
  const status = new Map(done.map((a) => [a.i, a.kind]));
  const last = done[done.length - 1];
  const cached = new Set(done.map((a) => Math.floor((NUMS + 8 * a.i - LINES[0]) / 64)));
  const misses = done.filter((a) => a.kind === 'miss').length, hits = done.length - misses;

  return (
    <div class="nums-cache" ref={root}>
      <div class="nc-lines">
        {LINES.map((base, li) => (
          <div class={`nc-line ${cached.has(li) ? 'in' : ''}`}>
            <div class="nc-label">line {hex(base)} – {hex(base + 63)} · 64 bytes</div>
            <div class="nc-cells">
              {Array.from({ length: 8 }, (_, s) => {
                const addr = base + 8 * s;
                const name = slot(addr);
                const i = (addr - NUMS) / 8;
                const st = status.get(i);
                return (
                  <div class={`nc-c ${name ? '' : 'other'} ${st ?? ''} ${last?.i === i && k < STEPS.length - 1 ? 'now' : ''}`}>
                    <span class="nc-name">{name ?? 'not ours'}</span>
                    <span class="nc-v">{name ? (i < 8 ? VALUES[i] : k >= 4 ? 31 : 0) : ''}</span>
                    <span class="nc-addr">{hex(addr)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <table class={`nc-stats fade ${k >= 1 ? 'on' : ''}`}><tbody>
        <tr><td class="nc-miss">misses</td><td>{misses} × ~{RAM_NS} ns</td><td>= {misses * RAM_NS} ns</td></tr>
        <tr><td class="nc-hit">hits</td><td>{hits} × ~{L1_NS} ns</td><td>= {hits * L1_NS} ns</td></tr>
      </tbody></table>
      <div class="caption nc-text">{STEPS[k].text}</div>
      <style>{`
        .nums-cache .nc-lines { display: flex; flex-direction: column; gap: 1em; }
        .nums-cache .nc-line { border-radius: 10px; padding: .4em .5em .5em; background: var(--sunken);
          box-shadow: inset 0 0 0 2px transparent; transition: background .3s, box-shadow .3s; }
        .nums-cache .nc-line.in { background: color-mix(in srgb, ${COLORS.green} 27%, transparent); box-shadow: inset 0 0 0 2px ${COLORS.green}; }
        .nums-cache .nc-label { font-family: var(--mono); font-size: .5em; color: var(--muted); margin-bottom: .3em; }
        .nums-cache .nc-cells { display: grid; grid-template-columns: repeat(8, 1fr); gap: 4px; }
        .nums-cache .nc-c { display: flex; flex-direction: column; align-items: center; padding: .3em 0; border-radius: 5px;
          background: var(--surface); font-family: var(--mono); transition: background .25s; }
        .nums-cache .nc-c.other { background: none; border: 1px dashed var(--line); }
        .nums-cache .nc-c.miss { background: ${COLORS.bad}; color: var(--on-color); }
        .nums-cache .nc-c.hit { background: ${COLORS.good}; color: var(--on-color); }
        .nums-cache .nc-c.now { outline: 3px solid var(--fg); }
        .nums-cache .nc-name { font-size: .45em; }
        .nums-cache .nc-v { font-size: .75em; min-height: 1.2em; }
        .nums-cache .nc-addr { font-size: .38em; opacity: .7; }
        .nums-cache .nc-c.other .nc-name { color: var(--faint); }
        .nums-cache .nc-stats { font-family: var(--mono); font-size: .6em; margin-top: 1em; }
        .nums-cache .nc-stats td { padding: .1em 1.2em .1em 0; }
        .nums-cache .nc-miss { color: ${COLORS.bad}; }
        .nums-cache .nc-hit { color: ${COLORS.good}; }
        .nums-cache .nc-text { font-size: .75em; min-height: 2.6em; margin-top: .6em; }
      `}</style>
    </div>
  );
}

const hex = (n: number) => '0x' + n.toString(16);
