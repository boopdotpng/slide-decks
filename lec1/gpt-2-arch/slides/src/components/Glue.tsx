/** @jsxImportSource preact */
import { ByteHeat, Strip, Tok, at, useIsland } from './viz';
import { LENS, headColor } from './common';

/**
 * Twelve heads, one multiply. Each output cell only ever uses its own column, so the 12 heads' grids can sit side by
 * side as one wide grid and nothing mixes: "splitting into heads" is just lines on the output every 64 cells.
 *  0 the strip through our head's grid (768 × 64), as on the one-move slide
 *  1 the other 11 heads' grids slide in beside it: one grid, 768 × 768. every head reads the whole strip
 *  2 one wide output, cut every 64: piece 3 is exactly what our head made alone
 *  3 one level more: looking-for, advertise, hand-over glued too. the real weight in the file (shrunk 4×), with the
 *    36 head boundaries drawn on and our head marked in each third
 */
const NH = 12, BW = 52, GH = 300;
export default function Glue() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const H: number = d.focus[1], S = d.toks.length;
  const real = step >= 3;
  const x: number[] = d.ln1[S - 1];
  const out: number[] = d.q_all[S - 1]; // (768,): all 12 heads' looking-for strips, side by side
  const img = d.c_attn_img; // (192, 576): every 4th row and column of the 768 × 2304 weight
  return (
    <div class="gl3" ref={root}>
      <div class={`one ${real ? 'gone' : ''}`}>
        <div class="x">
          <div class="lbl"><Tok t={d.toks[S - 1]} /></div>
          <Strip values={x} vertical height={GH} width={22} label="strip" />
          <div class="lbl">768</div>
        </div>
        <span class="op op1">·</span>
        <div class="grids">
          {Array.from({ length: NH }, (_, h) => (
            <div class={`g ${h === H || step >= 1 ? 'on' : ''}`} style={{ background: headColor(h, H), transitionDelay: `${Math.abs(h - H) * 50}ms` }}>
              <span>{h === H ? 'ours' : ''}</span>
            </div>
          ))}
        </div>
        <span class={`op op2 ${at(step, 2)}`}>=</span>
        <div class={`outs ${at(step, 2)}`}>
          <Strip values={out} height={26} label="looking for, all heads" />
          <div class="cuts">{Array.from({ length: NH }, (_, h) => <div class={`o ${h === H ? 'ours' : ''}`} style={{ borderColor: headColor(h, H) }} />)}</div>
        </div>
        <div class="lbl wide">{[
          `head ${H}'s grid: 768 tall, 64 wide`,
          'twelve heads side by side: one grid, 768 × 768. every head reads all 768 rows; each writes its own 64 columns',
          `the output, 768 wide, cut every 64: piece ${H} is exactly what our head made alone. 12 × 64 = 768`][Math.min(step, 2)]}</div>
      </div>
      <div class={`real ${at(step, 3)}`}>
        <ByteHeat m={img} w={900} h={300}>
          {(['q', 'k', 'v'] as const).map((k, j) => (
            <div class="third" style={{ left: `${(j / 3) * 100}%`, borderColor: LENS[k].color }}><span style={{ color: LENS[k].color }}>{LENS[k].name}</span></div>
          ))}
          {Array.from({ length: 3 * NH }, (_, i) => i % NH > 0 && <div class="cut" style={{ left: `${(i / (3 * NH)) * 100}%` }} />)}
          {Array.from({ length: 3 }, (_, j) => (
            <div class="ours" style={{ left: `${((j * NH + H) / (3 * NH)) * 100}%`, width: `${100 / (3 * NH)}%` }}><span>head {H}</span></div>
          ))}
        </ByteHeat>
        <div class="lbl wide">what's actually stored: all three, glued again. 768 × 2304, one multiply for all 36 grids. head h is columns 64h … 64h+63 of each third</div>
      </div>
      <style>{`
        .gl3 { position: relative; font-size: .8em; min-height: ${GH + 140}px; }
        .gl3 .one { display: grid; grid-template-columns: auto auto auto; grid-template-rows: auto auto auto; gap: .6em 1em; align-items: center; justify-content: center; transition: opacity .4s; }
        .gl3 .one.gone { opacity: 0; }
        .gl3 .x { display: flex; flex-direction: column; align-items: center; gap: .3em; grid-column: 1; grid-row: 1; }
        .gl3 .op { font-size: 1.4em; color: var(--muted); }
        .gl3 .op1 { grid-column: 2; grid-row: 1; }
        .gl3 .op2 { grid-column: 2; grid-row: 2; }
        .gl3 .grids { display: flex; gap: 3px; height: ${GH}px; grid-column: 3; grid-row: 1; }
        .gl3 .g { width: ${BW}px; border-radius: 3px; opacity: 0; transform: translateY(-30px); transition: opacity .4s, transform .5s;
          display: flex; align-items: flex-end; justify-content: center; }
        .gl3 .g.on { opacity: .85; transform: none; }
        .gl3 .g span { font-size: .5em; color: var(--on-color); padding-bottom: .4em; }
        .gl3 .outs { grid-column: 3; grid-row: 2; width: ${NH * BW + (NH - 1) * 3}px; }
        .gl3 .cuts { display: flex; gap: 3px; margin-top: 3px; }
        .gl3 .o { width: ${BW}px; height: 8px; border-bottom: 4px solid; }
        .gl3 .o.ours { height: 12px; }
        .gl3 .lbl { font-size: .5em; white-space: nowrap; }
        .gl3 .lbl.wide { grid-column: 1 / -1; grid-row: 3; text-align: center; font-size: .6em; color: var(--muted); }
        .gl3 .real { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; gap: 1.6em; }
        .gl3 .third { position: absolute; top: -4px; bottom: -4px; width: 33.33%; border: 3px solid; border-radius: 4px; }
        .gl3 .third span { position: absolute; top: -1.6em; left: 0; font: .55em var(--mono); }
        .gl3 .cut { position: absolute; top: 0; bottom: 0; width: 1px; background: color-mix(in srgb, var(--fg) 35%, transparent); }
        .gl3 .real .ours { position: absolute; top: -4px; bottom: -4px; outline: 2px solid var(--accent); border-radius: 2px; }
        .gl3 .real .ours span { position: absolute; bottom: -1.7em; left: 50%; transform: translateX(-50%); font: .5em var(--mono); color: var(--accent); white-space: nowrap; }
      `}</style>
    </div>
  );
}
