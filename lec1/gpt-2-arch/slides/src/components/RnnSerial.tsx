/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Ch, CH_CSS } from './RnnCommon';

/**
 * Why it's slow to train: step t needs h from step t-1, so the rnn's steps run one after another.
 * Attention computes every position at the same time. Schematic (timing is illustrative).
 *   0 rnn row lights up one by one · 1 attention row lights up all at once
 */
const TEXT = 'To be, or not to be';
const MS = 220;
export default function RnnSerial() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const chars = [...TEXT];
  return (
    <div class="rse" ref={root}>
      <div class="row">
        <div class="name">rnn</div>
        <div class="cells">
          {chars.map((c, i) => <>
            <div class="cell seq" style={{ animationDelay: `${i * MS}ms` }}><Ch c={c} /></div>
            {i < chars.length - 1 && <span class="to seq" style={{ animationDelay: `${i * MS}ms` }}>→</span>}
          </>)}
        </div>
        <div class="what muted">{chars.length} steps in a row. each one waits for the h before it</div>
      </div>
      <div class={`row fade ${step >= 1 ? 'on' : ''}`}>
        <div class="name">attention</div>
        <div class="cells">
          {chars.map((c, i) => <>
            {step >= 1 && <div class="cell par"><Ch c={c} /></div>}
            {step < 1 && <div class="cell"><Ch c={c} /></div>}
            {i < chars.length - 1 && <span class="to blank">→</span>}
          </>)}
        </div>
        <div class="what muted">1 step. every position at once: what a gpu is built for</div>
      </div>
      <style>{`
        ${CH_CSS}
        .rse { display: flex; flex-direction: column; gap: 2.2em; font-size: .85em; }
        .rse .row { display: grid; grid-template-columns: 5.5em 1fr; row-gap: .5em; align-items: center; }
        .rse .name { font-weight: 700; }
        .rse .cells { display: flex; align-items: center; gap: .15em; }
        .rse .what { grid-column: 2; font-size: .65em; }
        .rse .cell { width: 1.5em; height: 1.6em; display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--border); border-radius: 6px; background: var(--panel); }
        .rse .to { color: var(--accent); font-size: .6em; opacity: .15; }
        .rse .to.blank { visibility: hidden; }
        .rse .cell.seq, .rse .cell.par { animation: rse-cell .3s forwards; }
        .rse .to.seq { animation: rse-arrow .3s forwards; }
        @keyframes rse-cell { to { border-color: var(--accent); background: var(--hl); } }
        @keyframes rse-arrow { to { opacity: 1; } }
      `}</style>
    </div>
  );
}
