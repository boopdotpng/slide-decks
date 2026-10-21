/** @jsxImportSource preact */
import { Bars, useIsland } from './viz';
import { Ch, CH_CSS } from './RnnCommon';

/**
 * The job: given the text so far, a probability for every one of the 65 characters.
 * One context per step, real outputs of the trained rnn (rnn/export.py).
 */
export default function RnnTask() {
  const { root, step, d } = useIsland<{ ctx: string; top: [string, number][] }[]>('rnn_task');
  if (!d) return <div ref={root} />;
  const at = Math.min(step, d.length - 1);
  const cur = d[at];
  return (
    <div class="rt" ref={root}>
      <div class="ctxs">
        {d.map((e, i) => (
          <div class={`ctx ${i === at ? 'on' : ''} ${i > step ? 'hide' : ''}`}>
            {[...e.ctx].map((c) => <Ch c={c} />)}<span class="q">?</span>
          </div>
        ))}
      </div>
      <div class="out">
        <div class="lbl muted">the rnn's guess for <span class="q">?</span></div>
        <Bars values={cur.top.map((t) => t[1])} labels={cur.top.map((t) => <Ch c={t[0]} />)} max={1}
          fmtV={(v) => `${Math.round(v * 100)}%`} width={340} />
        <div class="muted foot">top 5 of 65 characters. the other 60 share what's left</div>
      </div>
      <style>{`
        ${CH_CSS}
        .rt { display: grid; grid-template-columns: 1.2fr 1fr; gap: 3em; align-items: center; }
        .rt .ctxs { display: flex; flex-direction: column; gap: .5em; font-size: .9em; }
        .rt .ctx { font-family: var(--mono); padding: .25em .5em; border-radius: 6px; opacity: .35; transition: opacity .3s, background .3s; }
        .rt .ctx.on { opacity: 1; background: var(--panel); }
        .rt .ctx.hide { opacity: 0; }
        .rt .q { color: var(--accent); font-family: var(--mono); font-weight: 700; }
        .rt .out { font-size: .8em; }
        .rt .out .bars { font-size: 1.15em; }
        .rt .lbl { margin-bottom: .5em; }
        .rt .foot { font-size: .7em; margin-top: .7em; }
      `}</style>
    </div>
  );
}
