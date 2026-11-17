/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import { body } from './kernel';
import src from '../../../kernels/brighten.hip?raw';
import asm from '../asm/brighten.gfx1201.s?raw';

/**
 * brighten.hip next to clang's output for gfx1201 (rx 9070 xt), one group of instructions per step, each group paired
 * with the source lines it came from. Lines are found by their text, so a rebuild that reorders them still lights the
 * right ones. ttmp9 holding the block number and v0 the thread number: amd's rdna4 isa guide / llvm's amdgpu docs.
 */
const LINES = asm.split('\n').slice(1).filter((l) => l.trim());
const CODE = LINES.join('\n');
const COUNT = LINES.filter((l) => /^\s+[a-z]/.test(l)).length;
const at = (...needles: string[]) => LINES.flatMap((l, i) => (needles.some((n) => l.includes(n)) ? [i] : []));

type St = { asm: number[]; src: number[]; text: ComponentChildren };
const STEPS: St[] = [
  { asm: [], src: [], text: <>the kernel, compiled by clang for the rx 9070 xt: <b>{COUNT} instructions</b>. every wave runs these, top to bottom, once. read the names with the key below</> },
  { asm: at('v_lshl_add'), src: [1],
    text: <>my pixel. the hardware left the block number in <b>ttmp9</b> and each lane's thread number in <b>v0</b>. shift left by 8 is × 256, then add: <b>one</b> instruction, 32 answers</> },
  { asm: at('s_load', 's_wait_kmcnt'), src: [0],
    text: <>the arguments: <code>img</code>, <code>n</code> and <code>a</code> are the same for every thread, so they go in <b>s</b> registers, loaded once for the wave. <code>s_wait_kmcnt</code>: sleep until they arrive</> },
  { asm: at('v_cmp', 's_and_saveexec', 's_cbranch_execz'), src: [2, 5],
    text: <>the <code>if</code>: compare in all 32 lanes, put the 32 answers in <b>exec</b> (the on/off switch per lane). if every lane is off, jump to the end</> },
  { asm: at('global_load', 's_wait_loadcnt'), src: [3],
    text: <>one load, 32 addresses: every lane asks for its own pixel. then <code>s_wait_loadcnt</code>: the wave sleeps ~100 adds' worth, and the simd runs other waves meanwhile</> },
  { asm: at('v_mul', 'v_min'), src: [3, 4],
    text: <>× a, then cap at 255 (<code>0xff</code>). <code>a</code> comes from an s register, the pixel from each lane's own v1</> },
  { asm: at('global_store', 's_endpgm'), src: [4],
    text: <>store 32 bytes, and the wave is done. 32 pixels brightened by {COUNT} instructions</> },
];

const KEY: [string, ComponentChildren][] = [
  ['v_…', <>per lane: a <b>v</b> register holds 32 values, one for each thread</>],
  ['s_…', <>once for the whole wave: an <b>s</b> register holds one value everyone shares</>],
  ['global_…', <>gpu memory: the photo</>],
  ['s_wait_…', <>sleep until what was asked for has arrived</>],
];

export default function Asm() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  return (
    <div class="asm-view" ref={root}>
      <div class="av-cols">
        <div class="av-src">
          <div class="muted av-t">what you wrote</div>
          <Code lang="cpp" code={body(src)} hl={st.src.length ? st.src : undefined} />
          <div class="av-key">
            {KEY.map(([p, d]) => <div class="av-k"><code>{p}</code><span>{d}</span></div>)}
            <div class="av-k av-ex"><code>v_mul_lo_u32</code><span>on v registers · multiply · 32-bit unsigned</span></div>
          </div>
        </div>
        <div class="av-asm">
          <div class="muted av-t">what the gpu runs (gfx1201)</div>
          <Code lang="asm" code={CODE} hl={st.asm.length ? st.asm : undefined} />
        </div>
      </div>
      <div class="caption av-text">{st.text}</div>
      <style>{`
        .asm-view .av-cols { display: flex; gap: 1.6em; align-items: flex-start; }
        .asm-view .av-src { flex: 1; min-width: 0; font-size: .5em; }
        .asm-view .av-asm { flex: none; font-size: .5em; }
        .asm-view pre { margin: 0; font-size: 1em; }
        .asm-view .av-t { font-size: .9em; margin-bottom: .3em; }
        .asm-view .av-key { margin-top: 1.2em; display: grid; gap: .35em; }
        .asm-view .av-k { display: grid; grid-template-columns: 9em 1fr; gap: .8em; align-items: baseline; }
        .asm-view .av-k code { background: none; padding: 0; color: var(--accent); }
        .asm-view .av-ex { margin-top: .4em; padding-top: .5em; border-top: 1px solid var(--border); }
        .asm-view .av-ex span { color: var(--muted); }
        .asm-view .av-text { font-size: .76em; min-height: 3.3em; margin-top: .8em; }
      `}</style>
    </div>
  );
}
