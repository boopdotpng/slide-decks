/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Arrow, Shape, Strip, Tok, box, useData, useMeasure } from './viz';

/**
 * wte is a lookup table: token id -> row. Steps:
 *  1. the table, with this prompt's rows marked (common words have small ids)
 *  2. the rows come out, one per token: (S, 768), an arrow from each mark to its row
 *  3. zoom on one row: a token is just 768 numbers
 */
const SUB = 6000; // every id in the prompt is < 6000 (' Mary' = 5335), so only draw these rows of the 50257

// where the marks and rows sit, measured from the layout, for the arrows
type Geo = { x0: number; top: number; h: number; rows: [number, number][] };

export default function EmbedLookup() {
  const root = useRef<HTMLDivElement>(null);
  const mat = useRef<HTMLDivElement>(null);
  const rowsEl = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('embed');
  const geo = useMeasure(root, (el): Geo | null => {
    if (!mat.current || !rowsEl.current) return null;
    const m = box(el, mat.current);
    return {
      x0: m.r + 6, top: m.y, h: m.h,
      // arrow ends just left of each row's token label
      rows: [...rowsEl.current.querySelectorAll('.r')].map((r): [number, number] => [box(el, r.querySelector('.t > *') ?? r).x - 8, box(el, r).cy]),
    };
  }, [d]);

  if (!d) return <div ref={root} />;
  const S = d.ids.length;
  const scale = 0.25;
  const markY = (id: number) => (id / SUB) * 100;

  return (
    <div class="el" ref={root}>
      <div class="table">
        <div class="lbl">wte · rows 0 … {SUB - 1}</div>
        <div class="mat" ref={mat}>
          {d.ids.map((id: number, i: number) => (
            <div class={`mark ${step >= 1 ? 'on' : ''}`} style={{ top: `${markY(id)}%`, transitionDelay: `${i * 50}ms` }} />
          ))}
        </div>
        <Shape dims={[50257, 768]} names={['V', 'D']} />
        <div class="lbl">a subset: {SUB.toLocaleString()} of 50,257 rows</div>
      </div>

      <div class={`rows fade ${step >= 2 ? 'on' : ''}`} ref={rowsEl}>
        {d.tok_emb.map((v: number[], i: number) => (
          <div class={`r ${step >= 3 && i !== 1 ? 'dim' : ''}`} style={{ transitionDelay: `${i * 50}ms` }}>
            <span class="t"><Tok t={d.toks[i]} /></span>
            <Strip values={v} scale={scale} height={step >= 3 && i === 1 ? 40 : 16} label={d.toks[i]} />
          </div>
        ))}
        <div class="foot">
          tok_emb <Shape dims={[S, 768]} names={['S', 'D']} />
        </div>
      </div>

      <div class={`zoom fade ${step >= 3 ? 'on' : ''}`}>
        <Tok t={d.toks[1]} /> = [{d.tok_emb[1].slice(0, 6).map((x: number) => x.toFixed(3)).join(', ')}, … ] <span class="muted">768 numbers</span>
      </div>

      {geo && geo.h > 0 && (
        <svg class="arrows">
          {d.ids.map((id: number, i: number) => (
            <g class={step >= 3 && i !== 1 ? 'dim' : ''}>
              <Arrow from={[geo.x0, geo.top + (markY(id) / 100) * geo.h + 1.5]} to={geo.rows[i]}
                on={step >= 2} width={1.5} color="var(--accent)" />
            </g>
          ))}
        </svg>
      )}

      <style>{`
        .el { position: relative; display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; gap: .6em 6em; font-size: .8em; }
        .el .table { grid-row: 1 / 3; display: flex; flex-direction: column; align-items: center; gap: .3em; }
        .el .mat { position: relative; width: 120px; height: 52vh; border-radius: 6px 6px 0 0;
          background: linear-gradient(90deg, #1b1b1b, #242424, #1b1b1b); border: 1px solid var(--border); border-bottom: 0;
          mask-image: linear-gradient(to bottom, #000 92%, transparent); }
        .el .mark { position: absolute; left: -4px; right: -4px; height: 3px; background: var(--accent);
          opacity: 0; transform: scaleX(.3); transition: opacity .3s, transform .4s; }
        .el .mark.on { opacity: 1; transform: none; }
        .el .rows { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .el .r { display: grid; grid-template-columns: 6em 1fr; align-items: center; gap: .6em; transition: opacity .4s; }
        .el .r.dim { opacity: .2; }
        .el .r .strip { transition: height .4s; }
        .el .r .t { font-size: .75em; text-align: right; }
        .el .foot { margin-top: .5em; font-size: .8em; }
        .el .zoom { font-family: var(--mono); font-size: .8em; }
        .el .arrows { position: absolute; inset: 0; width: 100%; height: 100%; overflow: visible; pointer-events: none; }
        .el .arrows g { transition: opacity .4s; }
        .el .arrows g.dim { opacity: .15; }
      `}</style>
    </div>
  );
}
