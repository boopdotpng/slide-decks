/** @jsxImportSource preact */
import { useIsland } from './viz';
import { LENS } from './common';

/**
 * The names, put on what they already watched. Schematic.
 *  0 the walkthrough in plain words   1 the real names appear under each piece   2 the whole thing is one attention head
 */
const BOXES: { plain: string; name: string; color?: string; sub?: { plain: string; name: string; color: string }[] }[] = [
  { plain: 'the strip', name: 'residual stream' },
  { plain: 'three grids', name: 'projections', sub: (['q', 'k', 'v'] as const).map((k) => ({ ...LENS[k] })) },
  { plain: 'match + budget', name: 'attention pattern' },
  { plain: 'copy', name: 'weighted sum of values' },
  { plain: 'the output grid', name: 'output projection' },
  { plain: 'add it on', name: 'residual add' },
];

export default function Names() {
  const { root, step } = useIsland('forward');
  return (
    <div class="nm" ref={root}>
      <div class={`head ${step >= 2 ? 'on' : ''}`}>
        <div class="flow">
          {BOXES.map((b, i) => <>
            {i > 0 && <span class="ar">→</span>}
            <div class="bx">
              <div class="pl">{b.plain}</div>
              {b.sub && <div class="subs">{b.sub.map((s) => (
                <div class="sb" style={{ borderColor: s.color }}>
                  <span class="pl" style={{ color: s.color }}>{s.plain}</span>
                  <span class={`nm2 fade ${step >= 1 ? 'on' : ''}`} style={{ color: s.color }}>{s.name}</span>
                </div>))}</div>}
              <div class={`nm2 fade ${step >= 1 ? 'on' : ''}`}>{b.name}</div>
            </div>
          </>)}
        </div>
        <div class={`hl fade ${step >= 2 ? 'on' : ''}`}>all of it, for one token: <b>one attention head</b></div>
      </div>
      <style>{`
        .nm { font-size: .8em; }
        .nm .head { border: 2px dashed transparent; border-radius: 16px; padding: 1em; transition: border-color .4s; }
        .nm .head.on { border-color: var(--accent); }
        .nm .flow { display: flex; align-items: center; gap: .5em; }
        .nm .ar { color: var(--muted); }
        .nm .bx { background: var(--panel); border: 1px solid var(--border); border-radius: 10px; padding: .5em .7em;
          display: flex; flex-direction: column; gap: .3em; align-items: center; text-align: center; }
        .nm .pl { font-size: .6em; }
        .nm .nm2 { font-size: .58em; color: var(--accent); font-family: var(--mono); }
        .nm .subs { display: flex; flex-direction: column; gap: .3em; }
        .nm .sb { border-left: 4px solid; padding-left: .5em; display: flex; flex-direction: column; align-items: flex-start; }
        .nm .sb .pl { font-size: .55em; white-space: nowrap; }
        .nm .sb .nm2 { font-size: .55em; }
        .nm .hl { margin-top: 1em; font-size: .7em; text-align: center; color: var(--muted); }
        .nm .hl b { color: var(--accent); }
      `}</style>
    </div>
  );
}
