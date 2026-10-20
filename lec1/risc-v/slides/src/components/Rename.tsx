/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { highlight } from './Code';
import { COLORS } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * Register renaming on two iterations of the sum loop. Both write a3 and a0, so
 * with only the 32 names iteration 2 would have to wait for iteration 1. Each
 * write gets a fresh physical register from the free list; a rename table maps
 * name → physical register; reads use the current mapping. Physical register
 * numbers are made up (free-list order); the 224 is Zen 4's integer register
 * file (AnandTech / WikiChip).
 */

const LINES = [
  { op: 'ld   a3, 0(a0)', renamed: 'ld   p17, 0(p5)' },
  { op: 'addi a0, a0, 8', renamed: 'addi p20, p5, 8' },
  { op: 'add  a2, a3, a2', renamed: 'add  p23, p17, p9' },
  { op: 'ld   a3, 0(a0)', renamed: 'ld   p42, 0(p20)' },
  { op: 'addi a0, a0, 8', renamed: 'addi p43, p20, 8' },
  { op: 'add  a2, a3, a2', renamed: 'add  p44, p42, p23' },
];

type Map = Record<'a0' | 'a2' | 'a3', number>;
const STEPS: { renamed: number; map?: Map; changed?: string[]; freed?: number[]; wait?: boolean; text: ComponentChildren }[] = [
  { renamed: 0, text: 'two iterations of the loop. both write a3 and a0' },
  { renamed: 0, wait: true,
    text: <>with only 32 registers, iteration 2's <code>ld</code> can't overwrite a3 until iteration 1's <code>add</code> has read it. they share no data, just a name</> },
  { renamed: 0, map: { a0: 5, a2: 9, a3: 12 },
    text: 'inside, the cpu has far more registers than names. a rename table says which one each name means right now' },
  { renamed: 1, map: { a0: 5, a2: 9, a3: 17 }, changed: ['a3'],
    text: 'every write gets a fresh register from the free list. reads use the current mapping' },
  { renamed: 3, map: { a0: 20, a2: 23, a3: 17 }, changed: ['a0', 'a2'],
    text: <>the add reads a3 = <b>p17</b>, the value the ld just loaded</> },
  { renamed: 6, map: { a0: 43, a2: 44, a3: 42 }, changed: ['a0', 'a2', 'a3'],
    text: <>iteration 2's a3 is <b>p42</b>, not p17: different storage, so both iterations run at the same time</> },
  { renamed: 6, map: { a0: 43, a2: 44, a3: 42 }, freed: [5, 9, 12],
    text: <>an old register goes back on the free list once a newer value of its name commits. the isa promises 32 <em>names</em>, not 32 storage slots</> },
];

const PHYS = 64; // drawn; a real core has more

export default function Rename() {
  const root = useRef<HTMLDivElement>(null);
  const step = Math.min(STEPS.length - 1, useSlideStep(root));
  const cur = STEPS[step];
  const live = new Set(cur.map ? [...Object.values(cur.map), ...LINES.slice(0, cur.renamed).flatMap((l) => [...l.renamed.matchAll(/p(\d+)/g)].map((m) => Number(m[1])))] : []);
  cur.freed?.forEach((p) => live.delete(p));
  const fresh = new Set(cur.changed?.map((n) => cur.map![n as keyof Map]) ?? []);

  return (
    <div class="rename" ref={root}>
      <div class="rn-cols">
        <table class="rn-code"><tbody>
          {LINES.map((l, i) => (
            <tr class={i === 3 ? 'iter2' : ''}>
              <td class="rn-it muted">{i === 0 ? 'iteration 1' : i === 3 ? 'iteration 2' : ''}</td>
              <td><code>{highlight(l.op, 'asm')}</code></td>
              <td class={`rn-arrow fade ${i < cur.renamed ? 'on' : ''}`}>→</td>
              <td class={`fade ${i < cur.renamed ? 'on' : ''}`}><code class="rn-phys">{l.renamed}</code></td>
              <td class={`rn-wait fade ${cur.wait && i === 3 ? 'on' : ''}`}>← waits for the add above</td>
            </tr>
          ))}
        </tbody></table>
        <div class={`rn-side fade ${cur.map ? 'on' : ''}`}>
          <div class="rn-h muted">rename table</div>
          <table class="rn-map"><tbody>
            {(['a0', 'a2', 'a3'] as const).map((n) => (
              <tr class={cur.changed?.includes(n) ? 'changed' : ''}>
                <td class="tok-reg">{n}</td><td class="muted">→</td><td>p{cur.map?.[n] ?? ''}</td>
              </tr>
            ))}
            <tr><td colSpan={3} class="muted rn-more">+ 29 more names</td></tr>
          </tbody></table>
        </div>
        <div class={`rn-side fade ${cur.map ? 'on' : ''}`}>
          <div class="rn-h muted">physical registers</div>
          <div class="rn-file">
            {Array.from({ length: PHYS }, (_, p) => (
              <span class={`${live.has(p) ? 'live' : ''} ${fresh.has(p) ? 'fresh' : ''} ${cur.freed?.includes(p) ? 'freed' : ''}`}>
                {live.has(p) || cur.freed?.includes(p) ? `p${p}` : ''}
              </span>
            ))}
          </div>
          <div class="muted rn-real">drawn: {PHYS}. an amd zen 4 core has 224</div>
        </div>
      </div>
      <div class="caption rn-text">{cur.text}</div>
      <style>{`
        .rename .rn-cols { display: flex; gap: 1.6em; align-items: flex-start; }
        .rename .rn-code { font-size: .62em; }
        .rename .rn-code td { padding: .22em .6em .22em 0; white-space: nowrap; }
        .rename .rn-code tr.iter2 td { padding-top: .9em; }
        .rename .rn-code code { background: none; padding: 0; white-space: pre; }
        .rename .rn-it { font-size: .75em; }
        .rename .rn-phys { color: ${COLORS.good}; }
        .rename .rn-wait { color: ${COLORS.bad}; font-size: .8em; }
        .rename .rn-side { flex: none; }
        .rename .rn-h { font-size: .5em; margin-bottom: .4em; }
        .rename .rn-map { font: .62em var(--mono); }
        .rename .rn-map td { padding: .2em .5em .2em .3em; transition: background .3s; }
        .rename .rn-map tr.changed td { background: var(--hl); }
        .rename .rn-more { font: .75em var(--sans); padding-top: .5em; }
        .rename .rn-file { display: grid; grid-template-columns: repeat(8, 2.1em); gap: 3px; font: .42em var(--mono); }
        .rename .rn-file span { height: 1.9em; border-radius: 3px; background: #161616; display: flex; align-items: center;
          justify-content: center; transition: background .35s, color .35s; color: transparent; }
        .rename .rn-file span.live { background: ${COLORS.green}; color: var(--fg); }
        .rename .rn-file span.fresh { background: ${COLORS.blue}; box-shadow: inset 0 0 0 2px var(--accent); }
        .rename .rn-file span.freed { background: #161616; color: var(--muted); text-decoration: line-through; }
        .rename .rn-real { font-size: .45em; margin-top: .5em; }
        .rename .rn-text { font-size: .78em; min-height: 3em; margin-top: 1em; }
      `}</style>
    </div>
  );
}
