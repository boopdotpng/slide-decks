/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Shape, Strip, useData } from './viz';

/**
 * LayerNorm on the real input to layer 10 (last token). All three strips share
 * one color scale, so you see the residual stream's huge outlier channel get tamed.
 * Steps: 1. subtract mean, divide by std   2. scale + shift (learned γ, β)
 */
const SCALE = 3;

function stats(v: number[]) {
  const mean = v.reduce((a, b) => a + b, 0) / v.length;
  const std = Math.sqrt(v.reduce((a, b) => a + (b - mean) ** 2, 0) / v.length);
  let am = 0;
  v.forEach((x, i) => { if (Math.abs(x) > Math.abs(v[am])) am = i; });
  return { mean, std, am, max: v[am] };
}

export default function LayerNormViz() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const x: number[] = d.stages.resid_in;
  const s = stats(x);
  const norm = x.map((v) => (v - s.mean) / Math.sqrt(s.std ** 2 + 1e-5));
  const out: number[] = d.stages.input_layernorm;
  const rows = [
    { k: 'x', v: x, f: 'residual stream into block 10' },
    { k: '(x − μ) / σ', v: norm, f: 'mean 0, std 1' },
    { k: 'γ · … + β', v: out, f: 'input_layernorm(x), learned per channel' },
  ];

  return (
    <div class="lnv" ref={root}>
      {rows.map((r, i) => {
        const st = stats(r.v);
        return (
          <div class={`row fade ${step >= i ? 'on' : ''}`}>
            <span class="k">{r.k}</span>
            <Strip values={r.v} scale={SCALE} height={34} label={r.k} />
            <span class="st">μ {st.mean.toFixed(2)} · σ {st.std.toFixed(2)} · max |x| {Math.abs(st.max).toFixed(1)} <span class="muted">@ {st.am}</span></span>
            <span class="f muted">{r.f}</span>
          </div>
        );
      })}
      <div class="legend muted">
        <span><b>μ</b> mean</span><span><b>σ</b> standard deviation</span>
        <span><b>max |x|</b> largest value, ignoring sign</span><span><b>@ 481</b> the channel it's in (0–767)</span>
      </div>
      <div class="foot muted">per token, over the 768 channels · shape unchanged <Shape dims={[1, 'S', 768]} /></div>
      <style>{`
        .lnv { display: grid; grid-template-columns: auto 1fr auto; gap: .5em 1em; align-items: center; font-size: .8em; }
        .lnv .row { display: contents; }
        .lnv .row > * { transition: opacity .4s; }
        .lnv .row.fade:not(.on) > * { opacity: 0; }
        .lnv .k { font-family: var(--mono); font-size: .7em; text-align: right; white-space: nowrap; }
        .lnv .st { font-family: var(--mono); font-size: .65em; white-space: nowrap; }
        .lnv .f { grid-column: 2 / 4; font-size: .59em; margin-top: -.4em; }
        .lnv .legend { grid-column: 1 / -1; display: flex; gap: 1.6em; font-size: .6em; margin-top: .6em; }
        .lnv .legend b { font-family: var(--mono); font-weight: normal; color: var(--fg); margin-right: .3em; }
        .lnv .foot { grid-column: 1 / -1; font-size: .72em; }
      `}</style>
    </div>
  );
}
