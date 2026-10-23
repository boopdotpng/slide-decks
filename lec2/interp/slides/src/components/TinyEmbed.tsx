/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Heatmap, Shape, diverging, range } from './viz';
import { EMB, VOCAB } from './tinyEmbed';
import './roles';

/**
 * The token embedding of our lookup model: a 36 x 32 table, one row per token. Real weights (tinyEmbed.ts).
 *   0 the table
 *   1 the input a2f5c9d3f: its tokens' rows stay lit, the rest of the table dims
 *   2 one row per position comes out: (9, 32)
 *   3 zoom on f: 32 numbers. both f's got the same row
 */
const TEXT = 'a2f5c9d3f';
const IDS = [...TEXT].map((c) => VOCAB.indexOf(c));
const ZOOM = 2; // the first f
const color = (v: number) => diverging(v, 0.5);

export default function TinyEmbed() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const used = new Set(IDS);
  const zoom = step >= 3;
  const isF = (i: number) => TEXT[i] === TEXT[ZOOM];

  return (
    <div class="te" ref={root}>
      <div class="table">
        <div class="lbl">token embedding <Shape dims={[36, 32]} names={['vocab', 'dim']} /></div>
        <Heatmap data={EMB} color={(v, r) => (step >= 1 && !used.has(r) ? `color-mix(in srgb, ${color(v)} 15%, transparent)` : color(v))} cell={13} gap={1}
          rowLabels={[...VOCAB].map((c, r) => <span class={`rl-t ${step >= 1 && used.has(r) ? 'in' : ''} ${zoom && c === TEXT[ZOOM] ? 'z' : ''}`}>{c}</span>)}
          tipFn={(r, c, v) => `emb[${VOCAB[r]}][${c}] = <b>${v?.toFixed(3)}</b>`} />
        <div class={`lbl hint fade ${step >= 1 ? 'on' : ''}`}><code>{TEXT}</code> uses these {used.size} rows</div>
      </div>

      <div class={`out fade ${step >= 2 ? 'on' : ''}`}>
        <div class="lbl">our input, one row per position <Shape dims={[9, 32]} names={['pos', 'dim']} /></div>
        <div class="rows">
          {range(TEXT.length).map((i) => (
            <div class={`r ${zoom && !isF(i) ? 'dim' : ''}`}>
              <span class="p">{i}</span>
              <span class={`t ${/\d/.test(TEXT[i]) ? 'dg' : ''}`}>{TEXT[i]}</span>
              <Heatmap data={[EMB[IDS[i]]]} color={color} cell={zoom && isF(i) ? 24 : 19} gap={1}
                tipFn={(_, c, v) => `tok_emb[${TEXT[i]}][${c}] = <b>${v?.toFixed(3)}</b>`} />
            </div>
          ))}
        </div>
        <div class={`zoom ${zoom ? '' : 'gone'}`}>
          <div><span class="k">f</span> = [{EMB[IDS[ZOOM]].map((v) => v.toFixed(2)).join(', ')}]</div>
          <div class="muted">32 numbers · same token → same row</div>
        </div>
      </div>
      <style>{`
        .te { display: flex; gap: 2.4em; align-items: flex-start; font-size: .8em; }
        .te .zoom.gone { display: none; }
        .te .lbl { font-size: .7em; color: var(--muted); margin-bottom: .5em; display: flex; gap: .8em; align-items: baseline; }
        .te .table .rl { font-size: .55em; padding-right: .4em; }
        .te .rl-t { font-family: var(--mono); transition: color .3s; }
        .te .table .hc { transition: background .4s; }
        .te .hint { margin-top: .6em; }
        .te .rl-t.in { color: var(--fg); font-weight: 700; }
        .te .rl-t.z { color: var(--focus); }
        .te .out { display: flex; flex-direction: column; gap: .4em; }
        .te .rows { display: flex; flex-direction: column; gap: 5px; }
        .te .r { display: flex; align-items: center; gap: .6em; transition: opacity .4s; }
        .te .r.dim { opacity: .2; }
        .te .r .p { font-family: var(--mono); font-size: .55em; color: var(--muted); width: 1em; text-align: right; }
        .te .r .t { font-family: var(--mono); width: 1em; text-align: center; }
        .te .r .t.dg { color: var(--digit); }
        .te .r .hc { transition: width .4s, height .4s; }
        .te .zoom { margin-top: .8em; font-size: .65em; display: flex; flex-direction: column; gap: .5em; max-width: 52em; }
        .te .zoom > div:first-child { font-family: var(--mono); font-size: .9em; line-height: 1.5; }
        .te .zoom .k { color: var(--focus); }
        .te .zoom b { color: var(--fg); font-family: var(--mono); }
      `}</style>
    </div>
  );
}
