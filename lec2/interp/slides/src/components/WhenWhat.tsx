/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';

/**
 * When does each component write to the residual stream, and what does it write.
 * One row per write, in the order they happen. "reads" is everything already in the stream
 * at that moment: every row above it. Schematic, two layers.
 *   0 tok + pos     1 layer 0 attention     2 layer 0 mlp     3 layer 1 attention (reads layer 0's writes)
 *   4 layer 1 mlp   5 unembed reads, writes nothing           6 heads in one layer write at the same moment
 */
type Row = { who: string; chip: string; cls: string; what: string; at: number };
const ROWS: Row[] = [
  { who: 'token embedding', chip: 'tok', cls: 'emb', what: 'which token is here', at: 0 },
  { who: 'position embedding', chip: 'pos', cls: 'emb', what: 'which position this is', at: 0 },
  { who: 'layer 0 · attention', chip: 'attn₀', cls: 'attn', what: 'copies of what earlier positions hold', at: 1 },
  { who: 'layer 0 · mlp', chip: 'mlp₀', cls: 'mlp', what: "something computed from this position's stream", at: 2 },
  { who: 'layer 1 · attention', chip: 'attn₁', cls: 'attn', what: 'copies of what earlier positions hold', at: 3 },
  { who: 'layer 1 · mlp', chip: 'mlp₁', cls: 'mlp', what: "something computed from this position's stream", at: 4 },
  { who: 'unembed', chip: '', cls: 'out', what: 'nothing: reads the last position, scores every token', at: 5 },
];
const CAPS = [
  <>before any layer runs, the stream is two lookups added together</>,
  <>layer 0's attention can only read <b>tok + pos</b>. all it can do is move those between positions</>,
  <>the mlp runs after attention in the same layer, so it can read what attention just wrote</>,
  <>layer 1 reads everything layer 0 wrote. <b>a second layer is how one computation builds on another's result</b></>,
  <>every write lands in the stream before the next component reads it</>,
  <>the unembedding writes nothing. it reads the sum of every write above</>,
  <>all heads in one layer read the same stream and write at the same moment: <b>none of them can use another's result</b>. that takes the next layer</>,
];

export default function WhenWhat() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const cur = Math.min(step, 5);

  return (
    <div class="ww" ref={root}>
      <div class="grid">
        <div class="h">when</div><div class="h">component</div><div class="h">reads (already in the stream)</div><div class="h">writes</div>
        {ROWS.map((r, i) => {
          const on = r.at <= step;
          const now = r.at === cur && step < 6;
          const heads = step >= 6 && r.cls === 'attn';
          const before = ROWS.filter((p) => p.at < r.at && p.chip);
          return (
            <div class={`row fade ${on ? 'on' : ''} ${now || heads ? 'now' : ''} ${step >= 6 && !heads ? 'dim' : ''}`}>
              <div class="t">{r.at === 0 ? (i === 0 ? '1' : '') : r.at + 1}</div>
              <div class="who">
                {r.who}
                {r.cls === 'attn' && <div class={`heads fade ${heads ? 'on' : ''}`}>every head at once</div>}
              </div>
              <div class="reads">
                {r.at === 0 ? <span class="muted">{i === 0 ? 'the token id' : 'the position index'}</span>
                  : before.map((p) => <span class={`chip ${p.cls} ${step === 3 && r.at === 3 && p.at > 0 ? 'hot' : ''}`}>{p.chip}</span>)}
              </div>
              <div class="what">
                {r.chip && <span class={`chip ${r.cls}`}>+ {r.chip}</span>}
                <span>{r.what}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div class="caption cap">{CAPS[Math.min(step, CAPS.length - 1)]}</div>
      <style>{`
        .ww { display: flex; flex-direction: column; gap: .6em; font-size: .68em; width: 100%; }
        .ww .grid { display: grid; grid-template-columns: 2.5em auto auto 1fr; }
        .ww .row { display: contents; }
        .ww .row > div { padding: .3em .8em; display: flex; flex-direction: column; justify-content: center; border-top: 1px solid var(--border); transition: opacity .3s, background .3s; }
        .ww .row:not(.on) > div { opacity: 0; }
        .ww .row.dim > div { opacity: .3; }
        .ww .row.now > div { background: var(--hl); }
        .ww .row.now > .t { border-radius: 8px 0 0 8px; } .ww .row.now > .what { border-radius: 0 8px 8px 0; }
        .ww .h { font-size: .7em; color: var(--muted); padding: 0 .8em .3em; }
        .ww .t { font-family: var(--mono); color: var(--muted); text-align: center; }
        .ww .who { white-space: nowrap; }
        .ww .heads { font-size: .65em; color: var(--accent); }
        .ww .row > .reads { flex-direction: row; justify-content: flex-start; gap: .3em; align-items: center; }
        .ww .row > .what { flex-direction: row; justify-content: flex-start; gap: .6em; align-items: center; }
        .ww .chip { font-family: var(--mono); font-size: .75em; padding: .1em .45em; border-radius: 6px; border: 1px solid; white-space: nowrap; transition: box-shadow .3s; }
        .ww .chip.emb { color: color-mix(in srgb, var(--fg) 80%, var(--steel-line)); border-color: var(--steel-line); background: color-mix(in srgb, var(--fill-slate) 30%, transparent); }
        .ww .chip.attn { color: var(--accent); border-color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, transparent); }
        .ww .chip.mlp { color: var(--purple); border-color: var(--purple); background: color-mix(in srgb, var(--purple) 10%, transparent); }
        .ww .chip.hot { box-shadow: 0 0 0 3px color-mix(in srgb, var(--hot) 70%, transparent); }
        .ww .cap { font-size: 1.05em; min-height: 2.6em; }
      `}</style>
    </div>
  );
}
