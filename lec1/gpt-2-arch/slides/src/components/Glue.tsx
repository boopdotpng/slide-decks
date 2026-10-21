/** @jsxImportSource preact */
import { ByteHeat, at, useIsland } from './viz';
import { LENS, headColor } from './common';

/**
 * Twelve heads, one multiply. Each output cell only ever uses its own column, so the 12 heads' grids can sit side by
 * side as one wide grid and nothing mixes: "splitting into heads" is just lines on the output every 64 cells.
 *  0 our head's looking-for grid   1 the other 11 slide in beside it   2 one wide output, cut every 64
 *  3 one level more: looking-for, advertise, hand-over glued too. the real weight in the file (shrunk 4×)
 */
const NH = 12, BW = 52, GH = 300;
export default function Glue() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const H: number = d.focus[1];
  const real = step >= 3;
  return (
    <div class="gl3" ref={root}>
      <div class={`one ${real ? 'gone' : ''}`}>
        <div class="grids">
          {Array.from({ length: NH }, (_, h) => (
            <div class={`g ${h === H || step >= 1 ? 'on' : ''}`} style={{ background: headColor(h, H), transitionDelay: `${Math.abs(h - H) * 50}ms` }}>
              <span>{h === H ? 'ours' : ''}</span>
            </div>
          ))}
        </div>
        <div class={`outs ${at(step, 2)}`}>
          {Array.from({ length: NH }, (_, h) => <div class="o" style={{ background: headColor(h, H) }} />)}
        </div>
        <div class="lbl">{step === 0 ? `head ${H}'s grid: 768 tall, 64 wide` : step === 1 ? 'twelve heads side by side: one grid, 768 × 768' : 'the output, cut every 64: piece 3 is exactly what our head made alone'}</div>
      </div>
      <div class={`real ${at(step, 3)}`}>
        <ByteHeat m={d.c_attn_img} w={900} h={300}>
          {(['q', 'k', 'v'] as const).map((k, j) => (
            <div class="third" style={{ left: `${(j / 3) * 100}%`, borderColor: LENS[k].color }}><span style={{ color: LENS[k].color }}>{LENS[k].name}</span></div>
          ))}
        </ByteHeat>
        <div class="lbl">what's actually stored: all three, glued again. 768 × 2304, one multiply for all 36 grids</div>
      </div>
      <style>{`
        .gl3 { position: relative; font-size: .8em; min-height: ${GH + 140}px; }
        .gl3 .one { display: flex; flex-direction: column; gap: .6em; align-items: center; transition: opacity .4s; }
        .gl3 .one.gone { opacity: 0; }
        .gl3 .grids { display: flex; gap: 3px; height: ${GH}px; }
        .gl3 .g { width: ${BW}px; border-radius: 3px; opacity: 0; transform: translateY(-30px); transition: opacity .4s, transform .5s;
          display: flex; align-items: flex-end; justify-content: center; }
        .gl3 .g.on { opacity: .85; transform: none; }
        .gl3 .g span { font-size: .5em; color: #000; padding-bottom: .4em; }
        .gl3 .outs { display: flex; gap: 3px; }
        .gl3 .o { width: ${BW}px; height: 26px; border-radius: 3px; }
        .gl3 .real { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; gap: .6em; }
        .gl3 .third { position: absolute; top: -4px; bottom: -4px; width: 33.33%; border: 3px solid; border-radius: 4px; }
        .gl3 .third span { position: absolute; top: -1.6em; left: 0; font: .55em var(--mono); }
      `}</style>
    </div>
  );
}
