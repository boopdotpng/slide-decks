/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import shadows from '../asm/shadows.gfx1201.s?raw';
import hist from '../asm/hist_lds.gfx1201.s?raw';

/**
 * The branch (shadows.hip) and the cooperation (hist_lds.hip) as clang compiled them for gfx1201. hist_lds's loop of
 * 16 came out unrolled: 16 copies of the same 8 lines. The excerpt keeps the start, the first copy, and the end
 * (from the last copy's join onward); the dropped middle is one comment line. Lines are found by text.
 */
const SH = shadows.split('\n').slice(1).filter((l) => l.trim());
const HL = hist.split('\n').slice(1).filter((l) => l.trim());
const firstJoin = HL.findIndex((l) => l.includes('s_or_b32 exec_lo'));
const lastLabel = HL.map((l) => /^\.LBB/.test(l)).lastIndexOf(true);
const copies = HL.filter((l) => l.includes('ds_add_u32')).length;
const H = [...HL.slice(0, firstJoin + 1), `    ; … ${copies - 1} more copies of these lines: the compiler unrolled the loop`, ...HL.slice(lastLabel)];

const find = (lines: string[], ...needles: string[]) =>
  lines.flatMap((l, i) => (needles.some((n) => l.includes(n)) ? [i] : []));
const lastOf = (lines: string[], needle: string) => [lines.map((l) => l.includes(needle)).lastIndexOf(true)];

type St = { sh?: number[]; h?: number[]; focus: 'sh' | 'h' | 'both'; text: ComponentChildren };
const STEPS: St[] = [
  { focus: 'sh', sh: [...find(SH, 'v_cmp_gt_u16', 's_and_b32 exec_lo'), ...lastOf(SH, 's_cbranch_execz')],
    text: <>shadows' <code>if</code>: compare the pixel in all 32 lanes, <b>and</b> the answers into exec (lanes with light pixels switch off), and skip the body only if <b>every</b> lane is off. the exec mask from the wave slides is these three lines</> },
  { focus: 'sh', sh: find(SH, 'v_lshlrev_b16', 'global_store_b8'),
    text: <>the body runs once for the whole wave. switched-off lanes sit through it, writing nothing: that's the cost of a wave that disagrees</> },
  { focus: 'h', h: [...find(H, 'ds_store_b32'), ...find(H, 's_barrier').slice(0, 2)],
    text: <>the lds histogram: every thread clears its bin with <b>ds_store</b>. <code>__syncthreads()</code> is two instructions: <b>s_barrier_signal</b> ("i'm done") and <b>s_barrier_wait</b> (sleep until every wave of the block has said so)</> },
  { focus: 'h', h: find(H, 'global_load_u8', 'ds_add_u32'),
    text: <>the count. <b>ds_add_u32</b> is the lds doing the add itself, one step that nobody can interrupt: <code>atomicAdd</code> on <code>__shared__</code> memory. the loop of 16 became {copies} copies, no loop left</> },
  { focus: 'h', h: [...lastOf(H, 's_or_b32 exec_lo'), ...find(H, 's_barrier').slice(2), ...find(H, 'ds_load_b32', 'global_atomic_add')],
    text: <>the end: switch every lane back on, the second barrier, read my bin from lds, and <b>global_atomic_add</b>: the same one-step add, done far away in the shared cache. once per bin per block</> },
];

export default function AsmSync() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  return (
    <div class="asm-sync" ref={root}>
      <div class="as-cols">
        <div class={`as-p ${st.focus === 'h' ? 'dim' : ''}`}>
          <div class="muted as-t">shadows: a branch</div>
          <Code lang="asm" code={SH.join('\n')} hl={st.sh} />
        </div>
        <div class={`as-p ${st.focus === 'sh' ? 'dim' : ''}`}>
          <div class="muted as-t">the lds histogram: barriers and atomics</div>
          <Code lang="asm" code={H.join('\n')} hl={st.h} />
        </div>
      </div>
      <div class="caption as-text">{st.text}</div>
      <style>{`
        .asm-sync .as-cols { display: flex; gap: 1.6em; align-items: flex-start; }
        .asm-sync .as-p { flex: none; font-size: .42em; transition: opacity .4s; }
        .asm-sync .as-p.dim { opacity: .35; }
        .asm-sync pre { margin: 0; font-size: 1em; }
        .asm-sync .as-t { font-size: 1em; margin-bottom: .3em; }
        .asm-sync .as-text { font-size: .74em; min-height: 3.3em; margin-top: .7em; }
      `}</style>
    </div>
  );
}
