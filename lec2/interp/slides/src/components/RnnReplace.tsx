/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Heatmap, diverging, range, useData } from './viz';
import { Ch, CH_CSS } from './RnnCommon';

/**
 * The rnn's memory h, read one character at a time over "To be". Real h from rnn_unroll.
 * h has 512 numbers; we draw every 32nd, so 16. Outlined cells moved by more than 0.5 this step.
 *   0..4 read one character each: the one memory is rewritten, the old version goes to the trail
 *   5 there is one slot, rewritten in place
 */
const N = 5;
const DIMS = range(16).map((i) => i * 32);
const MOVED = 0.5;

export default function RnnReplace() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData<{ chars: string[]; h: number[][] }>('rnn_unroll');
  if (!d) return <div ref={root} />;
  const t = Math.min(step, N - 1);
  const prev = (k: number) => (k === 0 ? d.h[0].map(() => 0) : d.h[k - 1]);
  const pick = (h: number[]) => DIMS.map((i) => h[i]);
  const moved = (k: number) => d.h[k].filter((v, i) => Math.abs(v - prev(k)[i]) > MOVED).length;
  const cur = pick(d.h[t]);
  const hot = DIMS.map((i, c) => [i, c]).filter(([i]) => Math.abs(d.h[t][i] - prev(t)[i]) > MOVED).map(([, c]) => [0, c] as [number, number]);
  const color = (v: number) => diverging(v, 0.6);

  return (
    <div class="rrep" ref={root}>
      <div class="seq">
        {d.chars.slice(0, N).map((c, i) => <span class={`c ${i === t && step < N ? 'now' : ''} ${i > t ? 'later' : ''}`}><Ch c={c} /></span>)}
        <span class="c later">…</span>
      </div>

      <div class="mem">
        <div class="lbl">memory h, the rnn's <b class="st">stream</b> <span class="muted">· 16 of its 512 numbers</span></div>
        <Heatmap data={[cur]} color={color} cell={46} gap={4} hlCells={step < N ? hot : []} />
        <div class="lbl muted">
          after reading “{d.chars.slice(0, t + 1).map((c) => <Ch c={c} />)}”
          <span class={`fade ${step < N ? 'on' : ''}`}> · <b>{moved(t)}</b> of 512 numbers moved by more than {MOVED}</span>
        </div>
      </div>

      <div class="trail">
        {range(t).reverse().map((k) => (
          <div class="old">
            <span class="k muted">after “{d.chars.slice(0, k + 1).map((c) => <Ch c={c} />)}”</span>
            <Heatmap data={[pick(d.h[k])]} color={color} cell={18} gap={2} />
            <span class="gone">overwritten</span>
          </div>
        ))}
      </div>

      <div class="caption cap">
        {step < N
          ? <>reads <b><Ch c={d.chars[t]} /></b>. {t === 0 ? 'the stream starts at zero and gets filled in' : 'most of the stream gets rewritten'}</>
          : <>one stream for the whole text, rewritten in place every character. the old versions aren't kept anywhere: nothing is added on, it's <b>replaced</b></>}
      </div>
      <style>{`
        ${CH_CSS}
        .rrep { display: flex; flex-direction: column; gap: 1.1em; font-size: .8em; }
        .rrep .seq { display: flex; gap: .3em; font-family: var(--mono); font-size: 1.5em; }
        .rrep .seq .c { min-width: 1.4em; height: 1.6em; display: grid; place-items: center; border-radius: 8px;
          border: 1px solid var(--border); background: var(--panel); transition: all .3s; }
        .rrep .seq .c.now { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 15%, transparent); }
        .rrep .seq .c.later { opacity: .3; }
        .rrep .mem { display: flex; flex-direction: column; gap: .4em; }
        .rrep .lbl { font-size: .75em; }
        .rrep .lbl b { color: var(--hot); }
        .rrep .lbl b.st { color: var(--fg); }
        .rrep .mem .hc.on { outline-color: var(--hot); outline-width: 3px; outline-offset: 1px; }
        .rrep .trail { display: flex; flex-direction: column; gap: 6px; min-height: 7em; }
        .rrep .old { display: flex; gap: 1em; align-items: center; opacity: .4; }
        .rrep .old .heat { width: max-content; align-self: center; }
        .rrep .old .k { font-size: .65em; width: 7em; }
        .rrep .gone { font-size: .6em; color: var(--hot); }
        .rrep .cap { font-size: .9em; }
        .rrep .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
