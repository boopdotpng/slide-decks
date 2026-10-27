/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { Bars, Mat, Tex, sequential, useIsland } from './viz';
import './roles';

/**
 * Task 4, two-lookup difference (a2f5c9d3 fc → (5 − 9) mod 10 = 6), told as an argument: swap the two values and the
 * difference changes, but an evenly split head's write (half of each value) doesn't, so the mlp can't tell the inputs apart.
 * One head can still do it by splitting unevenly, but training only sometimes finds that. A second head gives each value
 * its own write, every time. Numbers from public/data/task4.json (export_task4.py, the csvs in
 * ~/code/ml/interp/data). The first value (f's) in --key-a, the second (c's) in --key-b (roles.css), in both inputs.
 */
type Run = { attn: number[][]; answer: string };
type Split = { head: string; first: number; second: number };
type T4 = {
  accuracy: [string, number][]; sum: number; ablation: [string, number][]; probe_first: Record<'one_head' | 'two_heads', number>;
  split: Record<'sum' | 'one_head' | 'lucky' | 'two_heads', Split[]>;
  example: { text: string; one_head: Run; two_heads: Run; l1: number[][][] };
};
const pct = (v: number) => `${Math.round(v * 100)}%`;
const ONE = '2 layers, 1 head each, plus MLP', TWO = '2 layers, 2 heads each, plus MLP', LUCKY = '2 layers, 1 head each, plus MLP (seed 1)';

/** the two inputs: the same pairs, with the two looked-up values swapped */
const INPUTS = [{ text: 'a2f5c9d3fc', a: '5', b: '9' }, { text: 'a2f9c5d3fc', a: '9', b: '5' }];
const mod = (n: number) => ((n % 10) + 10) % 10;
/** an input as token boxes: f's value and the query f in --key-a, c's value and the query c in --key-b */
function Seq({ text }: { text: string }) {
  const cls = (i: number) => (i === 3 || i === 8 ? 'a' : i === 5 || i === 9 ? 'b' : '');
  return (
    <div class="seq">
      {[...text].map((c, i) => <span class={`tk ${/\d/.test(c) ? 'dg' : ''} ${i >= 8 ? 'q' : ''} ${i === 8 ? 'gap' : ''} ${cls(i)}`}>{c}</span>)}
    </div>
  );
}
const A = ({ children }: { children: ComponentChildren }) => <span class="a">{children}</span>;
const B = ({ children }: { children: ComponentChildren }) => <span class="b">{children}</span>;
/** one head's write: both values in one blend, half of each unless the split is uneven (wa, wb) */
const Blend = ({ a, b, wa = '\\tfrac12', wb = '\\tfrac12' }: { a: string; b: string; wa?: string; wb?: string }) =>
  <span class="w"><Tex tex={wa} /> <A>{a}</A> + <Tex tex={wb} /> <B>{b}</B></span>;
/** two heads' writes: each value in its own slot */
const Slots = ({ a, b }: { a: string; b: string }) => <>
  <span class="w"><i>f's head</i> <A>{a}</A></span><span class="w"><i>c's head</i> <B>{b}</B></span>
</>;

const CSS = `
  .t4 { display: flex; flex-direction: column; gap: 1em; width: 100%; color: var(--muted); }
  .t4 .a { color: var(--key-a); } .t4 .b { color: var(--key-b); }
  .t4 .seq { display: flex; gap: 5px; }
  .t4 .tk { display: inline-flex; align-items: center; justify-content: center; width: 1.45em; height: 1.65em; font-family: var(--mono);
            color: var(--fg); background: var(--raised); border: 2px solid var(--border); border-radius: 7px; }
  .t4 .tk.dg { color: var(--digit); } .t4 .tk.gap { margin-left: .7em; }
  .t4 .tk.a { border-color: var(--key-a); } .t4 .tk.b { border-color: var(--key-b); }
  .t4 .tk.q.a { color: var(--key-a); } .t4 .tk.q.b { color: var(--key-b); }
  .t4 .w .math { font-size: .8em; }
  .t4 .w { display: inline-flex; align-items: baseline; gap: .35em; padding: .15em .55em; font-family: var(--mono); color: var(--fg);
           background: var(--panel); border: 2px solid var(--border); border-radius: 8px; white-space: nowrap; }
  .t4 .w i { font-family: var(--sans); font-style: normal; font-size: .6em; color: var(--muted); }
  .t4 .fade { opacity: 0; transition: opacity .35s; } .t4 .fade.on { opacity: 1; }
  .t4 .cap { font-size: .7em; max-width: 52em; min-height: 3.4em; } .t4 .cap b { color: var(--fg); }
  .t4 .bars { font-size: .85em; }
`;

/**
 * A grid of the two inputs: the input, then per-row cells that fade in by step.
 *   0 both inputs (the values swapped): the sum is 4 for both, the difference 6 vs 4
 *   1 an even split (task 3's head: 47 / 47) writes half of each into the last stream: the same for both, so the mlp must
 *     answer both the same
 *   2 the one-head model retrained on the difference: 42%. this seed doesn't blend at all: it only looks at the second value
 */
export function Order() {
  const { root, step, d } = useIsland<T4>('task4');
  if (!d) return <div ref={root} />;
  const one = d.accuracy.find(([m]) => m === ONE)![1], s = d.split.sum[0], z = d.split.one_head[0];
  const caps: ComponentChildren[] = [
    <><b>first minus second</b>. swap the two values: the sum doesn't change, the difference does</>,
    <>split the attention <b>evenly</b>, like task 3's head ({pct(s.first)} / {pct(s.second)}), and the write is half of each: the <b>same stream</b> for both inputs, so the same answer</>,
    <>retrained on the difference: <b>{one.toFixed(0)}%</b>. an even split can't work, and this run didn't even try: {pct(z.second)} on the second value, so the first never arrives. next: a run that found a way around</>,
  ];
  return (
    <div class="t4" ref={root}>
      <div class="grid">
        <div class="h" /><div class={`h fade ${step >= 1 ? 'on' : ''}`}>an even split adds to the last stream</div>
        <div class="h">sum</div><div class="h">difference</div>
        {INPUTS.map(({ text, a, b }) => <>
          <Seq text={text} />
          <div class={`fade ${step >= 1 ? 'on' : ''}`}><Blend a={a} b={b} /></div>
          <div class="n">{mod(+a + +b)}</div>
          <div class={`n ${step >= 1 ? 'bad' : ''}`}>{mod(+a - +b)}</div>
        </>)}
        <div /><div class={`same fade ${step >= 1 ? 'on' : ''}`}>the same blend</div>
        <div class="same">same</div><div class="same bad">different</div>
      </div>
      <div class={`fade ${step >= 2 ? 'on' : ''} acc`}>
        <Bars width={220} max={100} values={[d.sum, one]} labels={['task 3 model, on the sum', 'retrained on the difference']}
          color={(_, i) => (i === 0 ? 'var(--answer)' : 'var(--bad)')} fmtV={(v) => `${v.toFixed(0)}%`} />
      </div>
      <div class="cap">{caps[Math.min(step, 2)]}</div>
      <style>{CSS + `
        .t4 .grid { display: grid; grid-template-columns: auto auto auto auto; gap: .45em 2.2em; align-items: center; justify-content: start; font-size: 1.05em; }
        .t4 .grid .h { font-size: .5em; color: var(--muted); }
        .t4 .grid .n { font-family: var(--mono); color: var(--fg); text-align: center; } .t4 .grid .n.bad { color: var(--bad); }
        .t4 .grid .same { font-size: .5em; text-align: center; color: var(--muted); } .t4 .grid .same.bad { color: var(--bad); }
      `}</style>
    </div>
  );
}

/** seeds tried in ~/code/ml/interp (readme.md, task 4): one head per layer found the lean on 4 of 9 (89–97%), two heads hit 100% on 6 of 6 */
const SEEDS = { lean: 4, one: 9, range: '89–97%', two: 6 };
/**
 * One head can, if it leans: an uneven split keeps the order. seed 0's head (split.one_head) vs seed 1's (split.lucky).
 *   0 a lopsided blend: swap the values and the stream changes
 *   1 the two trained one-head models: where layer 2 looks, and test accuracy
 *   2 possible but fragile: how many seeds find it, vs two heads
 */
export function Lean() {
  const { root, step, d } = useIsland<T4>('task4');
  if (!d) return <div ref={root} />;
  const acc = (m: string) => d.accuracy.find(([k]) => k === m)![1];
  const z = d.split.one_head[0], l = d.split.lucky[0], w = (v: number) => v.toFixed(2);
  const runs = [
    { name: 'seed 0', s: z, what: 'only the second value', acc: acc(ONE) },
    { name: 'seed 1', s: l, what: 'leans on the second', acc: acc(LUCKY) },
  ];
  const caps: ComponentChildren[] = [
    <>the split doesn't have to be even. lean on one value, <b>{w(l.first)}</b> / <b>{w(l.second)}</b>, and swapping the values <b>changes the stream</b>: the mlp can tell the inputs apart</>,
    <>same shape, two training runs. seed 0 never blends and stalls at <b>{acc(ONE).toFixed(0)}%</b>. seed 1 finds the lean, and the mlp untangles it: <b>{acc(LUCKY).toFixed(0)}%</b></>,
    <>possible, but fragile: the mlp has to pull two digits out of one lopsided sum. one head found it on <b>{SEEDS.lean} of {SEEDS.one}</b> seeds <span class="nw">({SEEDS.range})</span>. two heads: 100% on <b>{SEEDS.two} of {SEEDS.two}</b></>,
  ];
  return (
    <div class="t4 ln" ref={root}>
      <div class="grid">
        <div class="h" /><div class="h">a lopsided split adds</div><div class="h">difference</div>
        {INPUTS.map(({ text, a, b }) => <>
          <Seq text={text} /><Blend a={a} b={b} wa={w(l.first)} wb={w(l.second)} /><div class="n">{mod(+a - +b)}</div>
        </>)}
        <div /><div class="same good">different</div><div class="same">different</div>
      </div>
      <div class={`fade ${step >= 1 ? 'on' : ''} runs`}>
        <div class="h">2 layers, 1 head each, plus mlp</div><div class="h">layer 2 looks at: first value</div><div class="h">second value</div><div class="h" /><div class="h">test accuracy</div>
        {runs.map((r) => <>
          <div class="nm">{r.name}</div><div class="v a">{pct(r.s.first)}</div><div class="v b">{pct(r.s.second)}</div><div class="what">{r.what}</div>
          <div class={`v ${r.acc > 80 ? 'good' : 'bad'}`}>{r.acc.toFixed(0)}%</div>
        </>)}
      </div>
      <div class="cap">{caps[Math.min(step, 2)]}</div>
      <style>{CSS + `
        .t4.ln .grid { display: grid; grid-template-columns: auto auto auto; gap: .45em 2.2em; align-items: center; justify-content: start; font-size: 1.05em; }
        .t4.ln .grid .h { font-size: .5em; color: var(--muted); }
        .t4.ln .grid .n { font-family: var(--mono); color: var(--fg); text-align: center; }
        .t4.ln .grid .same { font-size: .5em; text-align: center; color: var(--muted); } .t4.ln .grid .same.good { color: var(--answer); }
        .t4.ln .runs { display: grid; grid-template-columns: auto auto auto auto auto; gap: .4em 2em; align-items: baseline; justify-content: start; font-size: .8em; margin-top: .4em; }
        .t4.ln .runs .h { font-size: .6em; color: var(--muted); border-bottom: 1px solid var(--border); padding-bottom: .3em; }
        .t4.ln .runs .nm { font-family: var(--mono); color: var(--fg); }
        .t4.ln .runs .v { font-family: var(--mono); font-weight: 700; text-align: right; }
        .t4.ln .runs .v.good { color: var(--answer); } .t4.ln .runs .v.bad { color: var(--bad); }
        .t4.ln .runs .what { font-size: .8em; }
        .t4.ln .cap .nw { white-space: nowrap; }
      `}</style>
    </div>
  );
}

/** a lookup from the last position up and over to token i (the attention diagram on the two-head slide) */
const QX = 40, LX = 210;
const cx = (i: number) => LX + i * 70 + (i >= 8 ? QX : 0) + 28;
const CY = 170, CW = 56, CH = 64;
function Arc({ to, cls, label, lift }: { to: number; cls: string; label: ComponentChildren; lift: number }) {
  const x0 = cx(9), x1 = cx(to), top = CY - CH / 2 - 4, h = top - lift;
  return (
    <g class={`arc ${cls}`}>
      <path d={`M ${x0} ${top} C ${x0} ${h}, ${x1} ${h}, ${x1} ${top}`} />
      <path class="tip" d={`M ${x1 - 7} ${top - 11} L ${x1} ${top} L ${x1 + 7} ${top - 11}`} />
      <text x={(x0 + x1) / 2} y={top - 0.75 * lift - 9}>{label}</text>
    </g>
  );
}
type Row = { label: string; attn: number[]; cls: 'a' | 'b' };
function Attn({ rows }: { rows: Row[] }) {
  const RY = CY + CH / 2 + 24, RH = 42, toks = [...INPUTS[0].text];
  return (
    <svg viewBox={`0 0 1100 ${245 + rows.length * RH}`} class="in">
      <text class="rh" x={cx(0) - CW / 2} y={RY - 4}>layer 2's attention from the last position, on each token</text>
      {rows.map((r, k) => {
        const y = RY + 10 + k * RH;
        return <g class={`row ${r.cls}`}>
          <text class="rl" x={LX - 16} y={y + 24}>{r.label}</text>
          {r.attn.map((v, i) => <g>
            <rect x={cx(i) - CW / 2} y={y} width={CW} height={RH - 8} rx="5" style={{ opacity: 0.12 + 0.88 * v }} />
            {v >= 0.01 && <text x={cx(i)} y={y + 23}>{pct(v)}</text>}
          </g>)}
        </g>;
      })}
      <Arc to={3} cls="a" label="one head: f's value" lift={145} />
      <Arc to={5} cls="b" label="the other: c's value" lift={70} />
      {toks.map((c, i) => (
        <g class={`tk ${/\d/.test(c) ? 'dg' : ''} ${i >= 8 ? 'q' : ''} ${i === 3 || i === 8 ? 'a' : i === 5 || i === 9 ? 'b' : ''}`}>
          <rect x={cx(i) - CW / 2} y={CY - CH / 2} width={CW} height={CH} rx="8" />
          <text x={cx(i)} y={CY + 12}>{c}</text>
        </g>
      ))}
      <text class="ar" x={cx(9) + 62} y={CY + 10}>→ 6</text>
    </svg>
  );
}

/**
 *   0 two heads in layer 2, each its own lookup: one finds f's value, the other c's
 *   1 what lands in the last stream, for both inputs: one blend vs two separate writes
 *   2 one head: 42% or 97%, depending on the seed. two heads: 100% on every seed
 */
export function TwoHeads() {
  const { root, step, d } = useIsland<T4>('task4');
  if (!d) return <div ref={root} />;
  const acc = (m: string) => d.accuracy.find(([k]) => k === m)![1];
  const one = acc(ONE), lucky = acc(LUCKY), two = acc(TWO), at = d.example.two_heads.attn;
  const caps: ComponentChildren[] = [
    <>a <b>second head</b>, its own lookup: one finds f's value, the other c's</>,
    <>each head writes its <b>own entry</b>: swap the values and the stream changes</>,
    <>one head: <b>{one.toFixed(0)}%</b> or <b>{lucky.toFixed(0)}%</b>, depending on the seed. two heads: <b>{two.toFixed(0)}%</b> on every seed. that's multi-head attention: lookups that don't have to share one blend</>,
  ];
  return (
    <div class="t4" ref={root}>
      <Attn rows={[{ label: "f's head", attn: at[1], cls: 'a' }, { label: "c's head", attn: at[0], cls: 'b' }]} />
      <div class="r2">
      <div class={`fade ${step >= 1 ? 'on' : ''} writes`}>
        <div class="h" /><div class="h">an even split adds</div><div class="h">two heads add</div>
        {INPUTS.map(({ text, a, b }) => <>
          <code class="src">{text}</code><div><Blend a={a} b={b} /></div><div class="slots"><Slots a={a} b={b} /></div>
        </>)}
        <div /><div class="same">the same</div><div class="same good">different</div>
      </div>
      <div class={`fade ${step >= 2 ? 'on' : ''} acc`}>
        <Bars width={220} max={100} values={[one, lucky, two]} labels={['1 head, seed 0', '1 head, seed 1', '2 heads, every seed']}
          color={(v) => (v >= 99.5 ? 'var(--answer)' : v >= 80 ? 'var(--muted)' : 'var(--bad)')} fmtV={(v) => `${v.toFixed(0)}%`} />
      </div>
      </div>
      <div class="cap">{caps[Math.min(step, 2)]}</div>
      <style>{CSS + `
        .t4 .in { width: 1000px; overflow: visible; margin-bottom: -.6em; }
        .t4 .in .row rect { fill: var(--faint); } .t4 .in .row.a rect { fill: var(--key-a); } .t4 .in .row.b rect { fill: var(--key-b); }
        .t4 .in .row text { font-family: var(--mono); font-size: 18px; fill: var(--bg); text-anchor: middle; }
        .t4 .in .row .rl, .t4 .in .rh { font-family: var(--sans); font-size: 21px; fill: var(--muted); text-anchor: end; }
        .t4 .in .rh { font-size: 18px; text-anchor: start; }
        .t4 .in .tk rect { fill: var(--raised); stroke: var(--border); stroke-width: 2; }
        .t4 .in .tk text { font-family: var(--mono); font-size: 38px; fill: var(--fg); text-anchor: middle; }
        .t4 .in .tk.dg text { fill: var(--digit); }
        .t4 .in .tk.a rect { stroke: var(--key-a); stroke-width: 3; } .t4 .in .tk.q.a text { fill: var(--key-a); }
        .t4 .in .tk.b rect { stroke: var(--key-b); stroke-width: 3; } .t4 .in .tk.q.b text { fill: var(--key-b); }
        .t4 .in .ar { font-family: var(--mono); font-size: 34px; fill: var(--answer); }
        .t4 .in .arc path { fill: none; stroke-width: 3; } .t4 .in .arc text { font-size: 22px; text-anchor: middle; }
        .t4 .in .arc.a path { stroke: var(--key-a); } .t4 .in .arc.a text { fill: var(--key-a); }
        .t4 .in .arc.b path { stroke: var(--key-b); } .t4 .in .arc.b text { fill: var(--key-b); }
        .t4 .in .arc .tip { stroke-linecap: round; }
        .t4 .writes { display: grid; grid-template-columns: auto auto auto; gap: .35em 2.2em; align-items: center; justify-content: start; font-size: .8em; }
        .t4 .writes .h { font-size: .6em; } .t4 .writes .src { font-size: .8em; color: var(--muted); } .t4 .writes .slots { display: flex; gap: .4em; }
        .t4 .writes .same { font-size: .6em; } .t4 .writes .same.good { color: var(--answer); }
        .t4 .r2 { display: flex; gap: 2.4em; align-items: center; }
        .t4 .r2 .acc { font-size: .8em; }
      `}</style>
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
          color={(v) => (v >= 90 ? 'var(--answer)' : 'var(--bad)')} fmtV={(v) => `${v.toFixed(0)}%`} />
      </div>
      </div>
      <style>{CSS + `
        .t4.sp { flex-direction: row; align-items: flex-start; gap: 2em; } .t4.sp .side { display: flex; flex-direction: column; gap: 1.4em; padding-top: 2em; }
        .t4.sp .pats { width: 900px; flex: none; overflow: visible; }
        .t4.sp .mx .ct { font-size: 12px; }
      `}</style>
    </div>
  );
}
