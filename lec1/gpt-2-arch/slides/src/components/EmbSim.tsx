/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { COLORS, Heatmap, Tok, box, sequential, useData, useMeasure } from './viz';

/**
 * cosine similarity between rows of embed_tokens for a hand-picked set of single-token words.
 * Step 1 boxes the groups, step 2 shows nearest neighbors over the full 50k vocab.
 */
const GROUPS = [[0, 6], [6, 12], [12, 15], [15, 18], [18, 21], [21, 24]]; // [start, end) into WORDS in export.py
const CELL = 19, GAP = 2;
const LO = 0.15, HI = 0.7; // gpt-2 embeddings all point roughly the same way: even unrelated words sit ~0.2

export default function EmbSim() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const hm = useRef<HTMLDivElement>(null);
  const d = useData('embed');
  // group boxes are measured from the cells: label height can make rows taller than CELL
  const boxes = useMeasure(hm, (el) => {
    const n = d.words.length, cells = el.querySelectorAll('.hc');
    return GROUPS.map(([a, b]) => {
      const tl = box(el, cells[a * n + a]), br = box(el, cells[(b - 1) * n + (b - 1)]);
      return { top: tl.y, left: tl.x, width: br.r - tl.x, height: br.b - tl.y };
    });
  }, [d]) ?? [];
  if (!d) return <div ref={root} />;
  const words: string[] = d.words;
  const cos: number[][] = d.cos;
  const queries = Object.keys(d.neighbors);

  return (
    <div class="es" ref={root}>
      <div class="hm" ref={hm}>
        <Heatmap data={cos} cell={CELL} gap={GAP}
          color={(v, r, c) => (r === c ? '#333' : sequential((v - LO) / (HI - LO)))}
          rowLabels={words.map((w) => <Tok t={w} />)} colLabels={words.map((w) => <Tok t={w} />)}
          tipFn={(r, c, v) => `cos(${words[r].trim()}, ${words[c].trim()}) = <b>${v!.toFixed(3)}</b>`} />
        <div class={`boxes fade ${step >= 1 ? 'on' : ''}`}>
          {boxes.map((r) => <div class="box" style={{ top: `${r.top}px`, left: `${r.left}px`, width: `${r.width}px`, height: `${r.height}px` }} />)}
        </div>
      </div>
      <div class={`nn fade ${step >= 2 ? 'on' : ''}`}>
        <div class="lbl">nearest of all 50,257 rows</div>
        {queries.map((q) => (
          <div class="q">
            <span class="k"><Tok t={q} /></span>
            <span class="vs">{d.neighbors[q].slice(0, 5).map((n: any) => <span class="chip"><Tok t={n.tok} /></span>)}</span>
          </div>
        ))}
      </div>
      <style>{`
        .es { display: flex; gap: 3em; align-items: flex-end; font-size: .8em; }
        .es .hm { position: relative; }
        .es .boxes { position: absolute; inset: 0; pointer-events: none; }
        .es .box { position: absolute; border: 2px solid ${COLORS.hot}; border-radius: 5px; margin: -3px; box-sizing: content-box; padding: 1px; }
        .es .nn { display: flex; flex-direction: column; gap: .35em; font-size: .7em; }
        .es .q { display: flex; gap: .6em; align-items: center; }
        .es .q .k { width: 5.5em; text-align: right; color: var(--accent); }
        .es .vs { display: flex; gap: .3em; flex-wrap: wrap; font-size: .85em; }
      `}</style>
    </div>
  );
}
