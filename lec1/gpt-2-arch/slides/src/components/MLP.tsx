/** @jsxImportSource preact */
import { Bars, Strip, Tok, at, useIsland } from './viz';

/**
 * The mlp, on " of" in the block whose mlp pushes hardest toward " America" (block 9). Each token alone.
 *  0 the strip, rescaled   1 widened: one grid, 768 → 3072 numbers ("neurons")   2 the gate: below zero shuts off
 *  3 narrowed back to 768 and added on   4 the neurons that fired and push hardest toward " America"
 */
export default function MLP() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const m = d.mlp, S = d.toks.length;
  const hid: number[] = m.hidden[S - 1];
  const on = m.active[S - 1];
  const top = m.top.slice(0, 6) as { n: number; act: number; push: number }[];
  const rows = [
    { k: <>the strip for <Tok t={d.toks[S - 1]} /></>, v: m.in, w: 25, s: 0, sc: 2 },
    { k: 'widened: 3072 neurons', v: m.up, w: 100, s: 1, sc: 2 },
    { k: 'the gate: below zero → off', v: hid, w: 100, s: 2, sc: 2 },
    { k: 'narrowed back, added on', v: m.out, w: 25, s: 3, sc: 8 },
  ];
  return (
    <div class="mp" ref={root}>
      {rows.map((r) => (
        <div class={`r ${at(step, r.s)}`}>
          <span class="k">{r.k}</span>
          <div style={{ width: `${r.w}%` }}><Strip values={r.v} scale={r.sc} height={36} /></div>
        </div>
      ))}
      <div class="bottom">
        <div class={`cnt ${at(step, 2)}`}><b>{on}</b> of 3072 neurons fire for <Tok t={d.toks[S - 1]} /></div>
        <div class={`top ${at(step, 4)}`}>
          <div class="lbl">the neurons that push hardest toward <Tok t=" America" /></div>
          <Bars values={top.map((t) => t.push)} labels={top.map((t) => `#${t.n}`)} width={260} fmtV={(v) => `+${v.toFixed(1)}`} />
        </div>
      </div>
      <div class="cap">
        {step < 4
          ? <>attention moved information between tokens. the mlp works on each token alone</>
          : <>block {m.layer}'s mlp: a few neurons fire on "United States of" and push toward <Tok t=" America" /></>}
      </div>
      <style>{`
        .mp { display: flex; flex-direction: column; gap: .7em; font-size: .8em; }
        .mp .r { display: grid; grid-template-columns: 11em 1fr; gap: 1em; align-items: center; }
        .mp .k { text-align: right; font-size: .58em; color: var(--muted); }
        .mp .bottom { display: flex; gap: 4em; margin-left: 12em; margin-top: .5em; align-items: flex-start; }
        .mp .cnt { font-size: .65em; color: var(--muted); }
        .mp .cnt b { color: var(--accent); font-size: 1.6em; font-family: var(--mono); }
        .mp .top .lbl { margin-bottom: .4em; }
        .mp .cap { margin-top: .6em; font-size: .7em; color: var(--muted); }
      `}</style>
    </div>
  );
}
