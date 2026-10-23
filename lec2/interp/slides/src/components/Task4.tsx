/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { Bars, Mat, sequential, useIsland } from './viz';

/**
 * Task 4, two-key difference (a2f5c9d3 fc → (5 − 9) mod 10 = 6), in two short slides told as an argument, not as interp
 * data: the one-head model fails, a head makes one lookup, so add a second head beside it. Accuracies from
 * public/data/task4.json (export_task4.py, the csvs in ~/code/ml/interp/data). First value (f → 5) in the accent color,
 * second (c → 9) in purple.
 */
type Run = { attn: number[][]; answer: string };
type T4 = { accuracy: [string, number][]; sum: number; ablation: [string, number][]; probe_first: Record<'one_head' | 'two_heads', number>; example: { text: string; one_head: Run; two_heads: Run; l1: number[][][] } };
const TOKS = [...'a2f5c9d3fc'];
const QX = 40;                                   // the gap before the query
const LX = 210;                                  // room for the row labels
const cx = (i: number) => LX + i * 70 + (i >= 8 ? QX : 0) + 28;
const CY = 170, CW = 56, CH = 64;
/** a lookup from the last position up and over to token i */
function Arc({ to, cls, label, lift }: { to: number; cls: string; label: ComponentChildren; lift: number }) {
  const x0 = cx(9), x1 = cx(to), top = CY - CH / 2 - 4, h = top - lift;
  return (
    <g class={`arc ${cls}`}>
      <path d={`M ${x0} ${top} C ${x0} ${h}, ${x1} ${h}, ${x1} ${top}`} />
      <path class="tip" d={`M ${x1 - 7} ${top - 11} L ${x1} ${top} L ${x1 + 7} ${top - 11}`} />
      <text x={(x0 + x1) / 2} y={h + lift * 0.25 - 8}>{label}</text>
    </g>
  );
}
/** one head's attention from the last position, a cell under each token */
type Row = { label: string; attn: number[]; cls: 'a' | 'b' | 'mix' };
function Input({ children, hl = [], rows = [], on = true }: { children?: ComponentChildren; hl?: [number, string][]; rows?: Row[]; on?: boolean }) {
  const cls = (i: number) => hl.find(([j]) => j === i)?.[1] ?? '';
  const RY = CY + CH / 2 + 24, RH = 42;
  return (
    <svg viewBox={`0 0 1100 ${215 + (rows.length ? 30 + rows.length * RH : 0)}`} class="in">
      <g class={on ? '' : 'off'}>
        {rows.length > 0 && <text class="rh" x={cx(0) - CW / 2} y={RY - 4}>layer 2's attention from the last position, on each token</text>}
        {rows.map((r, k) => {
          const y = RY + 10 + k * RH;
          return <g class={`row ${r.cls}`}>
            <text class="rl" x={LX - 16} y={y + 24}>{r.label}</text>
            {r.attn.map((v, i) => <g>
              <rect x={cx(i) - CW / 2} y={y} width={CW} height={RH - 8} rx="5" style={{ opacity: 0.12 + 0.88 * v }} />
              {v >= 0.01 && <text x={cx(i)} y={y + 23}>{Math.round(v * 100)}%</text>}
            </g>)}
          </g>;
        })}
      </g>
      {children}
      {TOKS.map((c, i) => (
        <g class={`tk ${/\d/.test(c) ? 'dg' : ''} ${i >= 8 ? 'q' : ''} ${cls(i)}`}>
          <rect x={cx(i) - CW / 2} y={CY - CH / 2} width={CW} height={CH} rx="8" />
          <text x={cx(i)} y={CY + 12}>{c}</text>
        </g>
      ))}
      <text class="ar" x={cx(9) + 62} y={CY + 10}>→ 6</text>
    </svg>
  );
}
const CSS = `
  .t4 { display: flex; flex-direction: column; gap: 1em; width: 100%; color: var(--muted); }
  .t4 .in { width: 1100px; overflow: visible; }
  .t4 .row rect { fill: var(--faint); } .t4 .row.a rect { fill: var(--accent); } .t4 .row.b rect { fill: var(--purple); }
  .t4 .row text { font-family: var(--mono); font-size: 16px; fill: var(--bg); text-anchor: middle; }
  .t4 .row .rl, .t4 .rh { font-family: inherit; font-size: 19px; fill: var(--muted); text-anchor: end; }
  .t4 .rh { font-size: 16px; text-anchor: start; }
  .t4 .tk rect { fill: var(--raised); stroke: var(--border); stroke-width: 2; }
  .t4 .tk text { font-family: var(--mono); font-size: 38px; fill: var(--fg); text-anchor: middle; }
  .t4 .tk.dg text { fill: var(--hot); }
  .t4 .tk.a rect { stroke: var(--accent); stroke-width: 3; } .t4 .tk.q.a text { fill: var(--accent); }
  .t4 .tk.b rect { stroke: var(--purple); stroke-width: 3; } .t4 .tk.q.b text { fill: var(--purple); }
  .t4 .ar { font-family: var(--mono); font-size: 34px; fill: var(--fg); }
  .t4 .arc path { fill: none; stroke-width: 3; } .t4 .arc text { font-size: 20px; text-anchor: middle; }
  .t4 .arc.a path { stroke: var(--accent); } .t4 .arc.a text { fill: var(--accent); }
  .t4 .arc.b path { stroke: var(--purple); } .t4 .arc.b text { fill: var(--purple); }
  .t4 .arc.miss path { stroke: var(--faint); stroke-dasharray: 6 6; } .t4 .arc.miss text { fill: var(--muted); }
  .t4 .arc { transition: opacity .35s; } .t4 .off { opacity: 0; }
  .t4 .fade { opacity: 0; transition: opacity .35s; } .t4 .fade.on { opacity: 1; }
  .t4 .eq { font-family: var(--mono); color: var(--fg); font-size: .8em; } .t4 .eq .a { color: var(--accent); } .t4 .eq .b { color: var(--purple); }
  .t4 .cap { font-size: .7em; max-width: 50em; min-height: 3.2em; } .t4 .cap b { color: var(--fg); }
  .t4 .bars { font-size: .85em; }
`;

/**
 *   0 the task: first f's value, then c's, subtracted   1 the old model, retrained on it: 98% on the sum, 42% here
 *   2 why: its layer 2 head makes one lookup. a 50/50 blend was fine for a sum; a difference needs to know which came first
 */
export function Order() {
  const { root, step, d } = useIsland<T4>('task4');
  if (!d) return <div ref={root} />;
  const one = d.accuracy.find(([m]) => m === '2 layers, 1 head each, plus MLP')![1];
  const caps: ComponentChildren[] = [
    <>same input as task 3, but <b>first minus second</b>. swapped, (9 − 5) mod 10 = 4: a sum didn't care about order, a difference does</>,
    <>the task 3 model (2 layers, 1 head each, plus the mlp), retrained on the difference: <b>{one.toFixed(0)}%</b></>,
    <>its last head makes <b>one lookup</b>: one question, one weighted average. task 3 only worked because order didn't matter: half of the 5 and half of
      the 9 in the stream was all a sum needs. a difference needs to know which came first, and a blend can't say. so this head fetches the 9 and guesses the rest</>,
  ];
  return (
    <div class="t4" ref={root}>
      <Input hl={[[3, 'a'], [8, 'a'], [5, 'b'], [9, 'b']]} on={step >= 2}
        rows={[{ label: `its one head → ${d.example.one_head.answer} ✗`, attn: d.example.one_head.attn[0], cls: 'b' }]}>
        <g class={step >= 2 ? '' : 'off'}>
          <Arc to={5} cls="b" label="its one head: c's value" lift={70} />
          <Arc to={3} cls="miss" label="f's value? no head left" lift={130} />
        </g>
      </Input>
      <div class="eq">first <span class="a">f → 5</span>, then <span class="b">c → 9</span>: (<span class="a">5</span> − <span class="b">9</span>) mod 10 = 6</div>
      <div class={`fade ${step >= 1 ? 'on' : ''}`}>
        <Bars width={560} max={100} values={[d.sum, one]} labels={['task 3 model, on the sum', 'the same, on the difference']}
          color={(_, i) => (i === 0 ? 'var(--good)' : 'var(--bad)')} fmtV={(v) => `${v.toFixed(0)}%`} />
      </div>
      <div class="cap">{caps[Math.min(step, 2)]}</div>
      <style>{CSS}</style>
    </div>
  );
}

/**
 *   0 the reasoning: a head is one lookup; we need two that stay apart   1 two heads side by side, one question each
 *   2 what lands in the stream: each head writes with its own W_V, so swapping the digits changes the stream
 *   3 the proof: 42% → 100%, nothing else changed
 */
export function TwoHeads() {
  const { root, step, d } = useIsland<T4>('task4');
  if (!d) return <div ref={root} />;
  const acc = (m: string) => d.accuracy.find(([k]) => k === m)![1];
  const one = acc('2 layers, 1 head each, plus MLP'), two = acc('2 layers, 2 heads each, plus MLP');
  const caps: ComponentChildren[] = [
    <>a head is one softmax: <b>one lookup</b>. we need two that stay apart, "what's f's value?" and "what's c's value?". a second layer could do them one after
      the other; or a second head does them <b>side by side</b>, in the same layer</>,
    <>two heads in layer 2, each with its own query. one fetches the <span class="a">5</span>, the other the <span class="b">9</span>; both arrive separately,
      in order, and the mlp subtracts them: <b>{d.example.two_heads.answer}</b> ✓</>,
    <>each head has its own W_V, and the heads' writes add up in the stream. so the 5 and the 9 land in <b>different directions</b>: swap them and the stream changes.
      read "which digit came first?" from the stream after layer 2: one head (task 3) <b>{d.probe_first.one_head.toFixed(0)}%</b>, two heads <b>{d.probe_first.two_heads.toFixed(0)}%</b></>,
    <>same task, same layers and mlp, only a second head: <b>{one.toFixed(0)}% → {two.toFixed(0)}%</b>. that's multi-head attention, the last piece of the transformer</>,
  ];
  return (
    <div class="t4" ref={root}>
      <Input hl={[[3, 'a'], [8, 'a'], [5, 'b'], [9, 'b']]} on={step >= 1}
        rows={[{ label: "head 1: c's value", attn: d.example.two_heads.attn[0], cls: 'b' }, { label: "head 2: f's value", attn: d.example.two_heads.attn[1], cls: 'a' }]}>
        <g class={step >= 1 ? '' : 'off'}>
          <Arc to={5} cls="b" label="one head: c's value" lift={70} />
          <Arc to={3} cls="a" label="the other head: f's value" lift={130} />
        </g>
      </Input>
      <div class={`fade ${step >= 2 ? 'on' : ''} adds`}>
        <div class="eq">one head: &nbsp;x += ½ W_V·<span class="a">v(5)</span> + ½ W_V·<span class="b">v(9)</span> <span class="m">swap 5 and 9: the same</span></div>
        <div class="eq">two heads: x += W_V2·<span class="a">v(5)</span> + W_V1·<span class="b">v(9)</span> &nbsp;&nbsp;<span class="m">swap: a different stream</span></div>
      </div>
      <div class={`fade ${step >= 3 ? 'on' : ''}`}>
        <Bars width={560} max={100} values={[one, two]} labels={['1 head per layer', '2 heads per layer']}
          color={(_, i) => (i === 0 ? 'var(--bad)' : 'var(--good)')} fmtV={(v) => `${v.toFixed(0)}%`} />
      </div>
      <div class="cap">{caps[Math.min(step, 3)]}</div>
      <style>{CSS + `.t4 .adds { display: flex; flex-direction: column; gap: .3em; } .t4 .eq .m { font-family: var(--sans); color: var(--muted); font-size: .8em; margin-left: 1.2em; }
        .t4 .cap .a { color: var(--accent); } .t4 .cap .b { color: var(--purple); }`}</style>
    </div>
  );
}

/**
 * Layer 1's two heads in the two-head model: head 1 tags each value with its letter (one back), head 2 is smeared and
 * nearly spare (95% without it).   0 both patterns   1 knock each one out
 */
export function Spare() {
  const { root, step, d } = useIsland<T4>('task4');
  if (!d) return <div ref={root} />;
  const chars = [...d.example.text];
  const masked = (m: number[][]) => m.map((r, i) => r.map((v, j) => (j > i ? null : v)));
  const ab = (m: string) => d.ablation.find(([k]) => k === m)![1];
  const C = 34, lab = (i: number) => (/\d/.test(chars[i]) ? 'dg' : '');
  const pat = (h: number, x: number, name: string) => (
    <Mat data={masked(d.example.l1[h])} x={x} y={40} cw={C} ch={C} gap={2} color={(v) => sequential(v)} rowLabels={chars} colLabels={chars}
      labelCls={lab} text={(v) => (v !== null && v >= 0.25 ? `${Math.round(v * 100)}` : null)} inv={(v) => v > 0.55} name={name} />
  );
  return (
    <div class="t4 sp" ref={root}>
      <svg viewBox="0 0 900 430" class="pats">
        {pat(0, 30, 'layer 1, head 1')}
        {pat(1, 500, 'layer 1, head 2')}
      </svg>
      <div class="side">
      <div class="cap">{step < 1
        ? <>head 1 has a job: each digit looks one back at its letter (the tagging from task 2), and the last c looks at the f. head 2 is smeared over everything: no pattern</>
        : <>knock each one out: without head 2 the model still gets <b>{ab('only L1H2 removed').toFixed(0)}%</b>. without head 1, <b>{ab('only L1H1 removed').toFixed(0)}%</b>.
          training gave layer 1 a second head; it only needed one</>}</div>
      <div class={`fade ${step >= 1 ? 'on' : ''}`}>
        <Bars width={220} max={100} values={[ab('full model'), ab('only L1H2 removed'), ab('only L1H1 removed')]}
          labels={['both heads', 'without head 2', 'without head 1']}
          color={(v) => (v >= 90 ? 'var(--good)' : 'var(--bad)')} fmtV={(v) => `${v.toFixed(0)}%`} />
      </div>
      </div>
      <style>{CSS + `
        .t4.sp { flex-direction: row; align-items: flex-start; gap: 2em; } .t4.sp .side { display: flex; flex-direction: column; gap: 1.4em; padding-top: 2em; }
        .t4.sp .pats { width: 900px; flex: none; overflow: visible; }
        .t4.sp .mx .rl.dg { fill: var(--hot); } .t4.sp .mx .ct { font-size: 12px; }
      `}</style>
    </div>
  );
}
