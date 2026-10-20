/** @jsxImportSource preact */
import { useRef, useState } from 'preact/hooks';
import { useFrame, useSlideStep } from '../deck/hooks';
import { Heatmap, Shape, Strip, Tok, diverging, useData } from './viz';

/**
 * Prefill: all S queries at once, so q·k becomes a matmul Q @ Kᵀ (layer 10, head 7).
 * Step 1 sweeps through it one cell at a time (row of Q · column of Kᵀ),
 * step 2 shows the whole matrix.
 */
const CELL = 22, GAP = 2, QW = 250;
const SWEEP_MS = 4500;

export default function PrefillQK() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('prefill');
  const [n, setN] = useState(0);
  const S = d?.toks.length ?? 14;

  const t0 = useRef<number | null>(null); // frame time step 1 began
  useFrame(root, (ms) => {
    if (step !== 1) { t0.current = null; setN(step >= 2 ? S * S : 0); return; }
    t0.current ??= ms;
    setN(Math.min(S * S, Math.max(0, Math.floor(((ms - t0.current) / SWEEP_MS) * S * S))));
  });

  if (!d) return <div ref={root} />;
  const [L, H] = d.focus;
  const scores: number[][] = d.scores[L][H];
  const Q: number[][] = d.Q, K: number[][] = d.K;
  const sweeping = step === 1 && n < S * S;
  const ci = sweeping ? Math.floor(n / S) : -1, cj = sweeping ? n % S : -1;
  const shown = scores.map((row, r) => row.map((v, c) => (r * S + c < n ? v : 0)));

  return (
    <div class="pqk" ref={root}>
      <div class="corner">
        <div><span class="muted">x</span> <Shape dims={[1, S, 768]} names={['B', 'S', 'D']} hl={[1]} /></div>
        <div><span class="muted">q, k, v</span> <Shape dims={[1, 12, S, 64]} names={['B', 'H', 'S', 'd']} hl={[2]} /></div>
      </div>
      <div class="kt">
        {K.map((k, j) => <div class={`kc ${j === cj ? 'on' : ''}`}><Strip values={k} vertical width={CELL} height={QW * 0.62} scale={2.5} label={`k[${j}]`} /></div>)}
        <div class="kl lbl">Kᵀ <Shape dims={[64, S]} /></div>
      </div>
      <div class="ql">
        {Q.map((q, i) => (
          <div class={`qr ${i === ci ? 'on' : ''}`}>
            <span class="t"><Tok t={d.toks[i]} /></span>
            <Strip values={q} height={CELL} scale={2.5} label={`q[${i}]`} />
          </div>
        ))}
        <div class="lbl ql-l">Q <Shape dims={[S, 64]} /></div>
      </div>
      <div class={`sm ${step >= 1 ? '' : 'pre'}`}>
        <Heatmap data={shown} cell={CELL} gap={GAP}
          color={(v, r, c) => (r * S + c < n ? diverging(v, 4) : 'var(--panel)')}
          hlRow={ci >= 0 ? ci : undefined} hlCol={cj >= 0 ? cj : undefined}
          tipFn={(r, c) => `q[${d.toks[r].trim()}] · k[${d.toks[c].trim()}] / 8 = <b>${scores[r][c].toFixed(2)}</b>`} />
        <div class="lbl">scores = Q @ Kᵀ / √64 <Shape dims={[1, 12, S, S]} names={['B', 'H', 'S', 'T']} hl={[2, 3]} /></div>
      </div>
      <style>{`
        .pqk { font-size: .8em; display: grid; grid-template-columns: auto auto; grid-template-rows: auto auto; gap: .6em 1em; justify-content: start; }
        .pqk .corner { display: flex; flex-direction: column; justify-content: flex-end; gap: .4em; font-size: .7em; }
        .pqk .kt { display: flex; gap: ${GAP}px; align-items: flex-end; position: relative; justify-self: start; }
        .pqk .kl { position: absolute; left: calc(100% + 1em); bottom: 0; white-space: nowrap; }
        .pqk .kc, .pqk .qr { transition: opacity .15s; }
        .pqk .ql { display: flex; flex-direction: column; gap: ${GAP}px; }
        .pqk .qr { display: grid; grid-template-columns: 5.5em ${QW}px; gap: .5em; align-items: center; }
        .pqk .qr .t { font-size: .65em; text-align: right; }
        .pqk .ql-l { margin-left: 8em; margin-top: .3em; }
        .pqk .kc.on .strip, .pqk .qr.on .strip { outline: 2px solid var(--accent); }
        .pqk .sm .heat .hc.on { outline-color: transparent; }
        .pqk .lbl .shape { font-size: 1em; }
        .pqk .sm .lbl { margin-top: .3em; }
      `}</style>
    </div>
  );
}
