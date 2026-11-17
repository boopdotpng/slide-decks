/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';

/**
 * Spot the bug: three real leetgpu submissions for this problem that pass the checker but have something wrong with
 * them (trimmed to the lines that matter, names as submitted). The memory strips in the last one are drawn with
 * 8 threads and a stride of 8; a real warp is 32 threads and the stride is N.
 */
const PLUS = `if ((k < K) && (m < M)) {
  float sum = 0;
  for (int n = 0; n < N; n++)
    sum += A[m*N + n] * B[n*K + k];
  C[idx] += sum;
}`;

const SWAP = `__global__ void matmul(const float* A, const float* B, float* C,
                       int N, int M, int K) {
  ...
  if (i < N && j < K) {
    for (int k = 0; k < M; ++k)
      csum += A[i * M + k] * B[k * K + j];

matmul<<<grid, block>>>(A, B, C, M, N, K);`;

const ROWX = `int row = blockIdx.x * blockDim.x + threadIdx.x;   // row on x
int col = blockIdx.y * blockDim.y + threadIdx.y;   // col on y
...
sum += A[row * N + i] * B[i * K + col];`;

const STEPS: { code: string; hl: number[]; text: ComponentChildren }[] = [
  { code: PLUS, hl: [4], text: <><code>+=</code> adds to whatever C already held. leetgpu's C starts at zero, so it passes; reuse C or run it twice and it's wrong. write with <code>=</code></> },
  { code: SWAP, hl: [1, 7], text: <>the call passes (M, N, K) but the kernel names them (N, M, K): inside, "N" holds M. every use is swapped as well, so the two mistakes cancel. for now</> },
  { code: ROWX, hl: [0, 1], text: <>right answer, slow kernel. a warp is 32 neighbouring x's: with x as the column they read side by side, with x as the row their reads are N floats apart</> },
];

const C0 = [19, 22, 43, 50];

export default function Bugs() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(STEPS.length - 1, useSlideStep(root));
  const st = STEPS[k];
  return (
    <div class="bugs" ref={root}>
      <div class="bg-cols">
        <div class="bg-code"><Code lang="cpp" code={st.code} hl={st.hl} /></div>
        <div class="bg-pic">
          <div class={`bg-plus fade ${k === 0 ? 'on' : ''}`}>
            {[0, 1].map((start) => (
              <div class="bg-case">
                <div class="muted bg-cap">C starts at {start}</div>
                <div class="bg-c">{C0.map((v) => <i class={start ? 'bad' : 'good'}>{v + start}</i>)}</div>
                <div class={`bg-mark ${start ? 'bad' : 'good'}`}>{start ? '✗' : '✓'}</div>
              </div>
            ))}
          </div>
          <div class={`bg-swap fade ${k === 1 ? 'on' : ''}`}>
            <div class="bg-row"><span class="muted">call</span>{['M', 'N', 'K'].map((n) => <b>{n}</b>)}</div>
            <div class="bg-row bg-arrows"><span />{['↓', '↓', '↓'].map((a) => <i>{a}</i>)}</div>
            <div class="bg-row"><span class="muted">kernel</span>{['N', 'M', 'K'].map((n, i) => <b class={i < 2 ? 'bad' : ''}>{n}</b>)}</div>
            <div class="muted bg-cap bg-note">two wrong names, used consistently wrong</div>
          </div>
          <div class={`bg-mem fade ${k === 2 ? 'on' : ''}`}>
            {[{ name: 'x = column: B[i * K + col]', step: 1, good: true }, { name: 'x = row: A[row * N + i]', step: 8, good: false }].map((s) => (
              <div class="bg-strip">
                <div class="muted bg-cap">{s.name}</div>
                <div class="bg-cells">{Array.from({ length: 64 }, (_, i) => <i class={i % s.step === 0 && i / s.step < 8 ? (s.good ? 'good' : 'bad') : ''} />)}</div>
                <div class={`bg-cap ${s.good ? 'c-good' : 'c-bad'}`}>{s.good ? 'one trip to memory' : 'one trip per thread'}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div class="caption bg-text">{st.text}</div>
      <style>{`
        .bugs .bg-cols { display: flex; gap: 1.6em; align-items: center; }
        .bugs .bg-code { flex: 1; min-width: 0; }
        .bugs .bg-code pre { margin: 0; font-size: .54em; overflow: hidden; }
        .bugs .bg-pic { flex: none; width: 560px; display: grid; align-items: center; }
        .bugs .bg-plus, .bugs .bg-swap, .bugs .bg-mem { grid-area: 1 / 1; }
        .bugs .bg-plus { display: flex; gap: 2em; justify-content: center; }
        .bugs .bg-case { display: flex; flex-direction: column; align-items: center; }
        .bugs .bg-cap { font-size: .42em; margin-bottom: .4em; }
        .bugs .bg-c { display: grid; grid-template-columns: repeat(2, 2.2em); grid-auto-rows: 2.2em; gap: 4px; }
        .bugs .bg-c i { display: grid; place-items: center; font: 700 .6em var(--mono); font-style: normal; border-radius: 5px; color: var(--fg); }
        .bugs .bg-c i.good { background: color-mix(in srgb, var(--good) 35%, var(--surface)); }
        .bugs .bg-c i.bad { background: color-mix(in srgb, var(--bad) 35%, var(--surface)); }
        .bugs .bg-mark { font-size: .9em; margin-top: .2em; }
        .bugs .good.bg-mark, .bugs .c-good { color: var(--good); }
        .bugs .bad.bg-mark, .bugs .c-bad { color: var(--bad); }
        .bugs .bg-swap { justify-self: center; }
        .bugs .bg-row { display: grid; grid-template-columns: 4em repeat(3, 1.6em); align-items: center; font: 1em var(--mono); text-align: center; }
        .bugs .bg-row span { font-size: .6em; text-align: right; padding-right: 1em; }
        .bugs .bg-row b.bad { color: var(--bad); }
        .bugs .bg-arrows i { font-style: normal; color: var(--muted); }
        .bugs .bg-note { margin-top: 1em; text-align: center; }
        .bugs .bg-mem { display: grid; gap: 1.4em; }
        .bugs .bg-cells { display: grid; grid-template-columns: repeat(64, 1fr); gap: 1px; height: 22px; }
        .bugs .bg-cells i { background: var(--surface); }
        .bugs .bg-cells i.good { background: var(--good); } .bugs .bg-cells i.bad { background: var(--bad); }
        .bugs .bg-strip .bg-cap:last-child { margin: .4em 0 0; }
        .bugs .bg-text { font-size: .8em; min-height: 2.4em; margin-top: 1em; }
      `}</style>
    </div>
  );
}
