/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';
import asm from '../asm/tile.gfx1201.s?raw';

/**
 * "Tensor cores" the amd way: one wave instruction, v_wmma_f32_16x16x16_f16, does a whole 16x16 matmul tile
 * (kernels/tile.hip, clang's output for gfx1201). The picture is only the shapes: A x B + C -> D as 16x16 grids, and
 * the count of multiply-adds, which follows from the shapes. Which lane holds which element is not drawn.
 * The register counts are the instruction's operands: v[8:11], v[12:15], v[0:7]. Cycles and flops per clock: amd's
 * gpuopen "using matrix core on rdna4" article and its matrix instruction calculator.
 */
const LINE = asm.split('\n').findIndex((l) => l.includes('v_wmma'));
const CODE = asm.split('\n').slice(1).join('\n');

const STEPS: { on: string[]; text: ComponentChildren }[] = [
  { on: [], text: <>every v_ instruction so far kept the lanes apart: lane 3 never saw lane 4's pixel. machine learning is mostly one operation, though, and it isn't like that: <b>matrix multiply</b></> },
  { on: ['a', 'b', 'c'], text: <>a wave has room for whole matrices. 32 lanes × 8 registers = 256 numbers = one <b>16 × 16</b> tile. here the wave holds three: A, B and C</> },
  { on: ['a', 'b', 'c', 'd', 'ins'], text: <><b>v_wmma_f32_16x16x16_f16</b>: D = A × B + C, all of it, as <b>one instruction</b>. the lanes are no longer 32 threads. together they're one matrix</> },
  { on: ['a', 'b', 'c', 'd', 'ins', 'count'], text: <>each of D's 256 numbers is 16 multiply-adds: <b>4096</b> in one instruction, taking 16 cycles. brighten's <code>v_mul_lo_u32</code> does 32</> },
  { on: ['a', 'b', 'c', 'd', 'ins', 'count', 'names'],
    text: <>this is what nvidia calls a <b>tensor core</b>: hardware that does D = A × B + C on small tiles, driven by a whole warp. a big matmul is thousands of these tiles. libraries (and compilers) emit it for you</> },
];

function Grid({ name, sub, on, hot }: { name: string; sub: string; on: boolean; hot?: boolean }) {
  return (
    <div class={`mx-m ${on ? 'on' : ''} ${hot ? 'hot' : ''}`}>
      <div class="mx-g">{Array.from({ length: 256 }, () => <i />)}</div>
      <div class="mx-n"><b>{name}</b> <span class="muted">{sub}</span></div>
    </div>
  );
}

export default function Matrix() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const on = (x: string) => STEPS[k].on.includes(x);
  return (
    <div class="matrix" ref={root}>
      <div class="mx-cols">
        <Code lang="asm" code={CODE} hl={on('ins') ? [LINE - 1] : []} />
        <div class="mx-right">
          <div class="mx-eq">
            <Grid name="A" sub="16-bit floats · v8–v11" on={on('a')} />
            <span class="mx-op">×</span>
            <Grid name="B" sub="16-bit floats · v12–v15" on={on('b')} />
            <span class="mx-op">+</span>
            <Grid name="C" sub="32-bit floats · v0–v7" on={on('c')} />
            <span class="mx-op">→</span>
            <Grid name="D" sub="back into v0–v7" on={on('d')} hot />
          </div>
          <div class={`mx-count fade ${on('count') ? 'on' : ''}`}>16 × 16 × 16 = <b>4096</b> multiply-adds · one instruction · 16 cycles</div>
          <table class={`mx-names fade ${on('names') ? 'on' : ''}`}><tbody>
            <tr><td class="muted">nvidia</td><td>tensor cores</td><td class="muted">reached through "warp matrix" operations (wmma)</td></tr>
            <tr><td class="muted">amd radeon</td><td>wmma: wave matrix multiply accumulate</td><td class="muted">rx 7000 and up. amd also says "matrix cores", "ai accelerators"</td></tr>
          </tbody></table>
        </div>
      </div>
      <div class="caption mx-text">{STEPS[k].text}</div>
      <style>{`
        .matrix .mx-cols { display: flex; gap: 1.6em; align-items: flex-start; }
        .matrix .mx-cols pre { margin: 0; flex: none; font-size: .42em; }
        .matrix .mx-right { flex: 1; min-width: 0; }
        .matrix .mx-eq { display: flex; align-items: center; gap: .5em; }
        .matrix .mx-m { flex: 1; opacity: .25; transition: opacity .4s; }
        .matrix .mx-m.on { opacity: 1; }
        .matrix .mx-g { display: grid; grid-template-columns: repeat(16, 1fr); gap: 1px; aspect-ratio: 1; }
        .matrix .mx-g i { background: var(--steel-2); border-radius: 1px; }
        .matrix .mx-m.hot.on .mx-g i { background: var(--hot); }
        .matrix .mx-n { font-size: .46em; margin-top: .4em; white-space: nowrap; }
        .matrix .mx-op { font-size: 1.1em; color: var(--muted); padding-bottom: 1em; }
        .matrix .mx-count { font-size: .62em; margin-top: 1em; }
        .matrix .mx-names { font-size: .52em; margin-top: .8em; }
        .matrix .mx-names td { padding: .2em 1.4em .2em 0; }
        .matrix .mx-text { font-size: .76em; min-height: 3.2em; margin-top: .8em; }
      `}</style>
    </div>
  );
}
