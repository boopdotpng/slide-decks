/** @jsxImportSource preact */
import { useEffect, useState } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { DotRow, Mat, diverging, sequential, useIsland } from './viz';

/**
 * Task 1's head on one input, read the interp way, from public/data/head1.json (export_head1.py). Q, K and V are 32
 * numbers in a basis the model picked, so none of them is read on its own: each is read through what multiplies it.
 * Q through the keys, K through the queries, V through whoever reads it (here the unembedding). Rows are positions.
 *   HeadReads   the stream -> query, key, value; the queries all point the same way
 *   HeadScores  query · key, ÷ √32, the causal mask, softmax
 *   HeadAsk     the last query against the key of every token in the vocabulary, sorted
 *   HeadValue   V through the unembedding, weighted by the attention
 */
type M = number[][];
type Run = {
  x: M; q: M; k: M; v: M; raw: M; scores: (number | null)[][]; attn: (number | null)[][];
  logits_head: number[]; probs: number[]; v_logits: M;
};
type H = { text: string; tokens: string[]; answer: string; trained: Run; W: { E: M; Wq: M; Wk: M; Wv: M; U: M }; copy: M };

const argmax = (xs: number[]) => xs.indexOf(Math.max(...xs));
const pct = (p: number) => `${Math.round(p * 100)}%`;
const isD = (c: string) => /\d/.test(c);
const scaleOf = (m: M) => 2 * Math.sqrt(m.flat().reduce((a, b) => a + b * b, 0) / m.flat().length);
const div = (s: number) => (v: number) => diverging(v, s);
const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * b[i], 0);
const cos = (a: number[], b: number[]) => dot(a, b) / Math.sqrt(dot(a, a) * dot(b, b));
const SQ = Math.sqrt(32);
const HI = (v: number) => v > 0.55;   // attention cells bright enough to need dark text

/** lines of text in the svg, from (x, y) down */
function Lines({ x, y, lines, gap = 34, cls = 'note', on = true }: { x: number; y: number; lines: ComponentChildren[]; gap?: number; cls?: string; on?: boolean }) {
  return <g class={`fd ${on ? 'on' : ''}`}>{lines.map((l, i) => <text class={cls} x={x} y={y + i * gap}>{l}</text>)}</g>;
}

const CSS = `
  .h1 { display: flex; flex-direction: column; gap: .3em; width: 100%; }
  .h1 svg { width: 100%; display: block; overflow: visible; }
  .h1 .mx .rl.dg { fill: var(--accent); }
  .h1 .big { font-family: var(--mono); font-size: 28px; fill: var(--fg); }
  .h1 .note { font-size: 21px; fill: var(--muted); }
  .h1 .note tspan.b { fill: var(--fg); font-weight: 600; }
  .h1 .note tspan.dg { fill: var(--accent); font-weight: 600; }
  .h1 .mono { font-family: var(--mono); fill: var(--fg); }
  .h1 .fd { opacity: 0; transition: opacity .35s; } .h1 .fd.on { opacity: 1; }
  .h1 .arr { stroke: var(--line-2); stroke-width: 2; fill: none; }
  .h1 .cap { font-size: .72em; min-height: 3em; max-width: 52em; }
  .h1 .cap b { font-family: var(--mono); color: var(--fg); }
  .h1 .cap b.dg { color: var(--accent); }
  .h1 .mx.mask .ct { font-size: 16px; }
  .h1 .mx.att .ct { font-size: 17px; }
  .h1 .mx.mask .ct.ninf { fill: var(--bad); font-weight: 700; font-size: 24px; }
  .h1 .mx.mask .ct.zero { fill: var(--faint); }
  .h1 .later { font-size: .55em; color: var(--muted); border-left: 3px solid var(--accent); padding-left: .7em; max-width: 60em; }
  .h1 .later b { color: var(--fg); }
`;

// ── the stream -> Q, K, V ────────────────────────────────────────────────────
/**
 *   0 the stream: one row per position   1 three learned reads of every row: query, key, value
 *   2 the columns mean nothing alone: read each through what multiplies it   3 the queries all point the same way
 */
export function HeadReads({ data }: { data: string }) {
  const { root, step, d } = useIsland<H>(data);
  if (!d) return <div ref={root} />;
  const r = d.trained, chars = [...d.text], L = chars.length - 1;
  const lab = (i: number) => (isD(chars[i]) ? 'dg' : '');
  const qc = r.q.map((q) => cos(q, r.q[L]));
  const MX = 620, ys = [20, 215, 410], CH = 16, CW = 9;
  const mats: [string, M, ComponentChildren, ComponentChildren | ComponentChildren[]][] = [
    ['query', r.q, <>what this position is <tspan class="b">looking for</tspan></>, <>read through the <tspan class="b">keys</tspan></>],
    ['key', r.k, <>what this position <tspan class="b">offers</tspan> to be found by</>, <>read through the <tspan class="b">queries</tspan></>],
    ['value', r.v, <>what it <tspan class="b">passes on</tspan> if it's looked at</>, <>read through <tspan class="b">whoever reads it</tspan>: here the <tspan class="b">unembedding</tspan></>],
  ];
  return (
    <div class="h1" ref={root}>
      <svg viewBox="0 0 1500 600">
        <Mat data={r.x} x={90} y={170} cw={10} ch={28} color={div(scaleOf(r.x))} rowLabels={chars} labelCls={lab} name="the stream" />
        {mats.map(([name, m, role, read], i) => {
          const cy = ys[i] + (9 * CH) / 2;
          return (
            <g>
              <g class={`fd ${step >= 1 ? 'on' : ''}`}>
                <path class="arr" d={`M 420 ${170 + 126} C 500 ${170 + 126}, 520 ${cy}, ${MX - 34} ${cy}`} />
                <Mat data={m} x={MX} y={ys[i]} cw={CW} ch={CH} color={div(scaleOf(m))} rowLabels={chars} labelCls={lab} name={name} />
              </g>
              <Lines x={MX + 32 * CW + 30} y={cy + 7} on={step === 1 || (step >= 2 && !(i === 0 && step >= 3))} lines={step >= 2 ? (Array.isArray(read) ? read : [read]) : [role]} />
            </g>
          );
        })}
        <g class={`fd ${step >= 3 ? 'on' : ''}`}>
          <text class="note" x={MX + 32 * CW + 30} y={ys[0] - 2}>similarity to <tspan class="b">a</tspan>'s query</text>
          {qc.map((c, i) => (
            <text class="mono" style={{ fontSize: '14px' }} x={MX + 32 * CW + 30} y={ys[0] + i * CH + 13}>{c.toFixed(2)}</text>
          ))}
          <text class="note" x={MX + 32 * CW + 110} y={ys[0] + (9 * CH) / 2 + 6}>← every token is asking the same question</text>
        </g>
      </svg>
      <style>{CSS}</style>
    </div>
  );
}

// ── query · key, ÷ √32, mask, softmax ────────────────────────────────────────
/**
 *   0 queries as rows, keys as columns   1 one score: a row · a column   2 all 81, filled cell by cell   3 ÷ √32
 *   4 the causal mask, and why   5 masked   6 softmax per row: the attention   7 the digit's column   8 the last row
 */
// a pause while the last step's dimming fades, the first row slowly enough to read each dot product, then the rest quickly
const START_MS = 700, SLOW_MS = 420, FAST_MS = 45, fillDelay = (i: number) => (i === 0 ? START_MS : i <= 9 ? SLOW_MS : FAST_MS);
export function HeadScores({ data }: { data: string }) {
  const { root, step, d } = useIsland<H>(data);
  const [n, setN] = useState(0);   // step 2: how many cells are filled, in reading order (82: done, outlines off)
  useEffect(() => {
    if (step !== 2) return;
    setN(0);
    let i = 0, id = 0;
    const tick = () => { i += 1; setN(i); if (i < 82) id = window.setTimeout(tick, fillDelay(i)); };
    id = window.setTimeout(tick, fillDelay(0));
    return () => clearTimeout(id);
  }, [step]);
  if (!d) return <div ref={root} />;
  const r = d.trained, chars = [...d.text], L = chars.length - 1, T = chars.length;
  const best = argmax(r.attn[L] as number[]);
  const sq = scaleOf(r.q), sk = scaleOf(r.k);
  const lab = (i: number) => (isD(chars[i]) ? 'dg' : '');
  const scaled = r.raw.map((row) => row.map((v) => v / SQ));
  const S = step >= 6 ? r.attn : step >= 5 ? r.scores : step >= 3 ? scaled : r.raw;
  const sColor = step >= 6 ? (v: number) => sequential(v) : div(step >= 3 ? 4 : 4 * SQ);
  const sText = (v: number | null) => (v === null ? (step >= 6 ? '' : '−∞') : step >= 6 ? pct(v) : v.toFixed(Math.abs(v) >= 10 ? 0 : 1));
  // the outlined cell is the one just filled, so its value and the panel's sum appear together
  const sweep = step === 2 && n >= 1 && n <= T * T, cur = n - 1, cr = Math.floor(cur / T), cc = cur % T;
  const sVis = (rr: number, c: number) => step >= 3 || (rr === L && c === best && step >= 1) || (step === 2 && rr * T + c < n);
  const mask = Array.from({ length: T }, (_, i) => Array.from({ length: T }, (_, c) => (c > i ? 1 : 0)));   // 1: hidden (−∞)
  const one = step === 1;
  const Kp = { x: 420, y: 40, cw: 6, ch: 36 }, Qp = { x: 140, y: 280, cw: 7, ch: 36 }, Sp = { x: 420, y: 280, cw: 36, ch: 36 };
  // from the softmax on, the attention is the point: Q and K fade out and the grid grows (its cells' transforms animate)
  const big = step >= 6, Ap = big ? { x: 150, y: 110, cw: 54, ch: 54 } : Sp;
  return (
    <div class="h1" ref={root} data-hold={String(START_MS + 9 * SLOW_MS + 72 * FAST_MS + 500)}>
      <svg viewBox="0 0 1500 640">
        <text class="big" style={{ fontSize: '23px' }} x={30} y={70}>
          {step >= 6 ? 'softmax(' : ''}q · k{step >= 3 ? ' / √32' : ''}{step >= 5 ? ' + mask' : ''}{step >= 6 ? ')' : ''}
        </text>
        <Lines x={30} y={130} on={!big} lines={[<>row: who's asking (<tspan class="b">query</tspan>)</>, <>column: who it looks at (<tspan class="b">key</tspan>)</>]} />
        <g class={`fd ${big ? '' : 'on'}`}>
        <Mat data={r.q} {...Qp} color={div(sq)} rowLabels={chars} labelCls={lab} name="queries" hlRows={one ? [L] : sweep ? [cr] : []} dim={one} />
        <Mat data={r.k} {...Kp} t color={div(sk)} rowLabels={chars} labelCls={lab} name="keys" hlRows={one ? [best] : sweep ? [cc] : []} dim={one} />
        </g>
        <g class={`fd ${step >= 1 ? 'on' : ''}`}>
           <Mat data={S} {...Ap} class={big ? 'att' : 'sm'} rowLabels={big ? chars : undefined} colLabels={big ? chars : undefined} labelCls={lab} color={sColor} text={sText} visible={sVis} inv={step >= 6 ? HI : undefined} name={step >= 6 ? 'attention' : 'scores'}
            hlCells={one ? [[L, best]] : sweep ? [[cr, cc]] : []} hlCols={step === 7 ? [best] : []} hlRows={step === 8 ? [L] : []} dim={step === 8} />
        </g>
        {(one || sweep) && (() => {
          const [qi, ki] = one ? [L, best] : [cr, cc];
          return (
            <DotRow a={r.q[qi]} b={r.k[ki]} x={920} y={60} cw={17} color={diverging} scale={[sq, sk, sq * sk / 2]}
              la={`${chars[qi]}'s query`} lb={`${chars[ki]}'s key`} sum={<>Σ = {r.raw[qi][ki].toFixed(1)}  → row {chars[qi]}, column {chars[ki]}</>} />
          );
        })()}
        <Lines x={840} y={90} on={step === 3} lines={[
          <><tspan class="b">a</tspan> · <tspan class="dg">7</tspan>:  {r.raw[L][best].toFixed(1)} ÷ √32 = <tspan class="b">{scaled[L][best].toFixed(1)}</tspan></>,
          '',
          'keeps the scores from blowing up',
        ]} />
        <g class={`fd ${step === 4 || step === 5 ? 'on' : ''}`}>
          <Mat data={mask} x={1050} y={80} cw={42} ch={42} class="mask" gap={2}
            color={(v) => (v ? 'color-mix(in srgb, var(--bad) 28%, var(--surface))' : 'var(--surface)')}
            text={(v) => (v ? '−∞' : '0')} textCls={(v) => (v ? 'ninf' : 'zero')}
            rowLabels={chars} colLabels={chars} labelCls={lab} name="mask" />
          <Lines x={820} y={110} lines={['+ 0: allowed', '+ −∞: hidden']} />
          <Lines x={820} y={545} lines={[<>gpt: <tspan class="b">cat</tspan> must not see <tspan class="b">sat</tspan></>]} />
        </g>
        <Lines x={840} y={110} on={step === 6} lines={[
          <>each row: <tspan class="mono">e^s / Σ e^s</tspan></>,
          '',
          <><tspan class="b">a</tspan>'s row:</>,
          <tspan class="mono" style={{ fontSize: '17px' }}>{(r.scores[L] as number[]).map((v) => v.toFixed(1)).join('  ')}</tspan>,
          <tspan class="mono" style={{ fontSize: '17px' }}>→ {(r.attn[L] as number[]).map(pct).join('  ')}</tspan>,
        ]} />
        <Lines x={840} y={290} on={step === 7} lines={[
          <>every row from the <tspan class="b">7</tspan> down: ~100% on the <tspan class="b">7</tspan></>,
          <>every position that can see the digit finds it</>,
          '',
          <>the rows above can't see it (masked),</>,
          <>so they spread over the letters</>,
        ]} />
        <Lines x={Ap.x + 9 * Ap.cw + 18} y={Ap.y + 8 * Ap.ch + 34} on={step === 8} lines={[<>← the only graded row</>]} />
      </svg>
      <style>{CSS}</style>
    </div>
  );
}

// ── what the query asks for ──────────────────────────────────────────────────
/**
 * a's query against the key of every token in the vocabulary, sorted. Slide 22 can't tell "find a 7" from "find a
 * digit": its input has one digit. With no position embedding a token's key is the same wherever it sits, so we can
 * make the key of every token, even ones not in this input.
 *   0 only the 9 tokens of this input: the a row from slide 22   1 all 36: every digit above every letter
 */
export function HeadAsk({ data }: { data: string }) {
  const { root, step, d } = useIsland<H>(data);
  if (!d) return <div ref={root} />;
  const r = d.trained, toks = d.tokens, W = d.W, chars = [...d.text], L = chars.length - 1;
  const mv = (m: M, v: number[]) => m.map((row) => dot(row, v));
  const keys = W.E.map((e) => mv(W.Wk, e));                       // the key every token would have
  const ask = (q: number[]) => keys.map((k) => dot(q, k) / SQ);
  const s = ask(r.q[L]);
  const order = s.map((_, i) => i).sort((a, b) => s[b] - s[a]);
  const nLetters = toks.filter((t) => !isD(t)).length;
  const agree = W.E.slice(0, nLetters).filter((e) => { const v = ask(mv(W.Wq, e)); return Math.min(...v.slice(nLetters)) > Math.max(...v.slice(0, nLetters)); }).length;
  const inInput = (t: string) => chars.includes(t);
  const X0 = 110, BAND = 37, Y0 = 300, PX = 12;
  return (
    <div class="h1" ref={root}>
      <svg viewBox="0 0 1500 480">
        <Lines x={X0} y={30} lines={[<>if any of the 36 tokens were in the input, how much would <tspan class="b">a</tspan>'s query want to look at it?</>,
          <><tspan class="b">a</tspan>'s query · each token's key, ÷ √32, sorted</>]} />
        <g class={`fd ${step >= 1 ? 'on' : ''}`}>
          <text class="big" x={X0 + 12 * BAND} y={Y0 - 150}>"is this a digit?"</text>
          <Lines x={X0 + 12 * BAND} y={Y0 - 105} lines={[<>every digit &gt; every letter · <tspan class="b">{agree} / {nLetters}</tspan> letters' queries agree</>]} />
        </g>
        <line class="zero" x1={X0} x2={X0 + 36 * BAND} y1={Y0} y2={Y0} />
        {order.map((i, j) => {
          const t = toks[i], v = s[i], on = step >= 1 || inInput(t);
          return (
            <g class="askb" style={{ opacity: on ? 1 : 0.1 }}>
              <rect x={X0 + j * BAND + 6} width={BAND - 12} y={Math.min(Y0, Y0 - v * PX)} height={Math.max(1, Math.abs(v) * PX)} rx="2"
                style={{ fill: isD(t) ? 'var(--accent)' : 'var(--faint)' }} />
              <text class={`al ${isD(t) ? 'dg' : ''} ${inInput(t) ? 'in' : ''}`} x={X0 + j * BAND + BAND / 2} y={Y0 + 8 * PX + 34}>{t}</text>
              {inInput(t) && <circle class="dot" cx={X0 + j * BAND + BAND / 2} cy={Y0 + 8 * PX + 48} r="4" />}
              {(t === d.answer || (step === 0 && inInput(t))) && (
                <text class="av" x={X0 + j * BAND + BAND / 2} y={v >= 0 ? Y0 - v * PX - 8 : Y0 - v * PX + 20}>{v.toFixed(1)}</text>
              )}
            </g>
          );
        })}
        <text class="note" x={X0} y={Y0 + 8 * PX + 80}><tspan style={{ fill: 'var(--accent)' }}>●</tspan> in this input</text>
      </svg>
      <style>{CSS + `
        .h1 .zero { stroke: var(--raised-2); }
        .h1 .askb { transition: opacity .5s; }
        .h1 .al { font-family: var(--mono); font-size: 20px; fill: var(--muted); text-anchor: middle; }
        .h1 .al.dg { fill: var(--accent); } .h1 .al.in { fill: var(--fg); font-weight: 700; } .h1 .al.dg.in { fill: var(--accent); }
        .h1 .dot { fill: var(--accent); }
        .h1 .av { font-family: var(--mono); font-size: 14px; fill: var(--fg); text-anchor: middle; }
      `}</style>
    </div>
  );
}

// ── V, through its reader ────────────────────────────────────────────────────
/**
 * One row per position: a's attention to it, and its value read the way the unembedding will read it (36 scores, as
 * bars). Then the attention scales each row, and only the 7's survives: that's the head's write.
 *   0 the 7's value, read through the unembedding: it says 7   1 the letters' values: junk
 *   2 scaled by a's attention: only the 7's arrives; the write, plus a's embedding, is the output
 *   3 every digit's value: each says itself
 */
export function HeadValue({ data }: { data: string }) {
  const { root, step, d } = useIsland<H>(data);
  if (!d) return <div ref={root} />;
  const r = d.trained, chars = [...d.text], toks = d.tokens, W = d.W, L = chars.length - 1;
  const A = r.attn[L] as number[], best = argmax(A), out = argmax(r.probs);
  const mv = (m: M, v: number[]) => m.map((row) => dot(row, v));
  const digits = toks.map((t, i) => [t, i] as const).filter(([t]) => isD(t));
  const digitRows = digits.map(([, i]) => mv(W.U, mv(W.Wv, W.E[i])));   // a digit's value, read through the unembedding
  const rows = step >= 3
    ? digits.map(([t], j) => ({ t, bars: digitRows[j], att: 1, on: true }))
    : chars.map((t, i) => ({ t, bars: r.v_logits[i], att: step >= 2 ? A[i] : 1, on: step >= 1 || i === best }));
  const top = Math.max(...[...r.v_logits, ...digitRows].flat());
  const TX = 40, AX = 120, BX = 230, BAND = 29, SX = BX + 36 * BAND + 40, Y0 = 100, RH = step >= 3 ? 48 : 54, PX = 40 / top;   // 10 digit rows in the 9 rows' height
  const bars = (vals: number[], y: number, scale = 1, peak = false) => {
    const b = argmax(vals);
    return (
      <g>
        <line class="zero" x1={BX} x2={BX + 36 * BAND} y1={y} y2={y} />
        {vals.map((v, i) => (
          <rect class="vb" x={BX + i * BAND + 4} width={BAND - 8} y={v >= 0 ? y - v * PX : y} height={Math.max(1, Math.abs(v) * PX)} rx="2"
            style={{ fill: isD(toks[i]) ? 'var(--accent)' : 'var(--faint)', transform: `scaleY(${scale})`, transformOrigin: v >= 0 ? 'bottom' : 'top' }} />
        ))}
        {peak && <text class="pv" x={BX + b * BAND + BAND / 2} y={y - vals[b] * PX * scale - 6}>{vals[b].toFixed(1)}</text>}
      </g>
    );
  };
  const WY = Y0 + 8 * RH + 62;
  return (
    <div class="h1" ref={root}>
      <svg viewBox={`0 0 1500 ${step >= 3 ? 560 : 640}`}>
        <text class="hd" x={TX} y={30}>{step >= 3 ? 'digit' : 'token'}</text>
        <g class={`fd ${step === 2 ? 'on' : ''}`}><text class="hd" x={AX + 30} y={30} text-anchor="middle">a's attention</text></g>
        <text class="hd" x={BX} y={30}>{step >= 3 ? 'if this digit were in the input and got copied, what would it say? its value, read by the unembedding' : 'its value, read by the unembedding: one score per token'}</text>
        <text class="hd" x={SX} y={30}>says</text>
        {toks.map((t, i) => <text class={`tl ${isD(t) ? 'dg' : ''}`} x={BX + i * BAND + BAND / 2} y={62}>{t}</text>)}
        {rows.map((row, i) => {
          const y = Y0 + i * RH, says = toks[argmax(row.bars)];
          const main = step < 3 && i === best;
          return (
            <g class="vrow" style={{ opacity: row.on ? (step === 2 && row.att < 0.5 ? 0.45 : 1) : 0 }}>
              <text class={`rt ${isD(row.t) ? 'dg' : ''}`} x={TX + 10} y={y + 2}>{row.t}</text>
              <g class={`fd ${step === 2 ? 'on' : ''}`}>
                <rect x={AX} y={y - 24} width={60} height={30} rx="5" style={{ fill: sequential(A[i] ?? 0) }} />
                <text class={`ap ${HI(A[i] ?? 0) ? 'inv' : ''}`} x={AX + 30} y={y - 3}>{pct(A[i] ?? 0)}</text>
              </g>
              {bars(row.bars, y, row.att, main)}
              <text class={`sy ${isD(says) && (main || step >= 3) ? 'dg' : ''}`} x={SX + 20} y={y + 2}>{says}</text>
            </g>
          );
        })}
        <g class={`fd ${step === 2 ? 'on' : ''}`}>
          <line class="sep" x1={TX} x2={SX + 60} y1={WY - 50} y2={WY - 50} />
          <text class="note" x={TX} y={WY}>the head's write</text>
          {bars(r.logits_head, WY, 1)}
          <text class="note" x={BX} y={WY + 36}>+ a's embedding → output <tspan class="dg"> {toks[out]}</tspan>, <tspan class="b">{pct(r.probs[out])}</tspan></text>
        </g>
      </svg>
      {/* the rows need the room, so the note only comes with the last step */}
      {step >= 3 && <div class="later"><b>for later:</b> read V through <b>whoever reads it</b>. here that's the unembedding; with more layers, the next layer's queries and keys</div>}
      <style>{CSS + `
        .h1 .hd { font-size: 17px; fill: var(--muted); }
        .h1 .tl { font-family: var(--mono); font-size: 15px; fill: var(--muted); text-anchor: middle; } .h1 .tl.dg { fill: var(--accent); }
        .h1 .rt { font-family: var(--mono); font-size: 24px; fill: var(--fg); } .h1 .rt.dg { fill: var(--accent); }
        .h1 .sy { font-family: var(--mono); font-size: 24px; fill: var(--muted); font-weight: 700; } .h1 .sy.dg { fill: var(--accent); }
        .h1 .ap { font-family: var(--mono); font-size: 14px; fill: var(--fg); text-anchor: middle; } .h1 .ap.inv { fill: var(--bg); }
        .h1 .pv { font-family: var(--mono); font-size: 13px; fill: var(--fg); text-anchor: middle; transition: opacity .4s; }
        .h1 .zero { stroke: var(--raised-2); } .h1 .sep { stroke: var(--border); }
        .h1 .vrow { transition: opacity .5s; }
        .h1 .vb { transform-box: fill-box; transition: transform .8s cubic-bezier(.5, 0, .2, 1); }
      `}</style>
    </div>
  );
}
