/** @jsxImportSource preact */
import { Mat, DotRow, SvgHtml, Tex, diverging, useIsland, range } from './viz';
import './roles';

/**
 * Slide 3: the work hidden under the attention equation. The matrices are the trained task 1 head on qwdk7mzpa
 * (head1.json, "one head at a time"): its queries, keys and their scaled dot products. The hardware side (threads,
 * blocks, shared memory, barriers) follows NVIDIA's CUDA programming guide; FlashAttention is Dao et al. 2022. No
 * timings here: the only numbers are counts and sizes, worked out from the shapes.
 *   0 the equation; Q as rows (one query per position), Kᵀ as columns (one key per position), S empty
 *   1 one score: a's query · 7's key, 32 products summed, ÷ √32
 *   2 every score at once: independent dot products → 01 parallel work (tiles = thread blocks)
 *   3 01 → 02 memory: a tile loads its q and k rows once and reuses them
 *   4 03 coordination: softmax needs the whole row; A·V waits for A
 *   5 04 numerics: the causal mask (−∞) and subtracting the row max
 *   6 FlashAttention: the same exact attention, reorganized so the T × T scores never reach main memory
 */
type H = { text: string; trained: { q: number[][]; k: number[][]; raw: number[][] } };
const SQ = Math.sqrt(32);
const CONCERNS = [
  { n: '01', t: 'parallel work', q: 'which threads compute each part?',
    more: <>every score is its own dot product. a <b>grid of thread blocks</b>: each block takes a tile of scores, each thread one or more of them. more examples and heads: more independent tiles</> },
  { n: '02', t: 'memory', q: 'which numbers can we reuse?',
    more: <>a block copies its q and k rows into fast <b>on-chip shared memory</b> once, then every score in the tile reuses them, instead of each thread re-reading main memory</> },
  { n: '03', t: 'coordination', q: 'when can the next operation read?',
    more: <>softmax needs a <b>whole row</b> (its max, then its sum) before any weight is final; <Tex tex="AV" /> needs <Tex tex="A" />. threads in a block <b>wait at a barrier</b>; separate kernels run one after another</> },
  { n: '04', t: 'numerics', q: 'how do masking and softmax stay correct?',
    more: <>future positions get <Tex tex="-\infty" />, so their weight is exactly 0. subtract each row's max before <Tex tex="e^{x}" /> so nothing overflows</> },
];
// the concern each step is about (-1: none yet, 4: all of them, FlashAttention)
const FOCUS = [-1, -1, 0, 1, 2, 3, 4];
const TILE = 3;

export default function GpuAttention() {
  const { root, step, d } = useIsland<H>('head1');
  if (!d) return <div ref={root} class="gpu" />;
  const r = d.trained, chars = [...d.text], T = chars.length, L = T - 1, J = chars.indexOf('7');
  const S = r.raw.map((row) => row.map((v) => v / SQ));
  const masked = step >= 5;
  const Sshow = S.map((row, i) => row.map((v, j) => (masked && j > i ? null : v)));
  const scale = (m: number[][]) => Math.max(...m.flat().map(Math.abs)) / 2;
  const lab = (i: number) => (/\d/.test(chars[i]) ? 'dg' : '');
  const Q = { x: 54, y: 196, cw: 5, ch: 30 }, K = { x: 236, y: 30, cw: 4, ch: 30 }, Sp = { x: 236, y: 196, cw: 30, ch: 30 };
  const one = step === 1;
  const tileOn = step === 2 || step === 3;
  // step 3: the tile holding (a, 7): rows 6-8, columns 3-5
  const tr = Math.floor(L / TILE) * TILE, tc = Math.floor(J / TILE) * TILE;
  const tileRows = step === 3 ? range(TILE).map((k) => tr + k) : [];
  const tileCols = step === 3 ? range(TILE).map((k) => tc + k) : [];
  const f = FOCUS[step] ?? 4;
  const eq = (k: number) => (step === 1 || step === 2 || step === 3 ? k === 0 : step === 4 ? k === 1 || k === 2 : step === 5 ? k === 1 : false);

  const right = (
    <>
      {/* 1: one dot product, spelled out */}
      <g class={`fd ${one ? 'on' : ''}`}>
        <DotRow a={r.q[L]} b={r.k[J]} x={600} y={46} cw={10} ch={20} color={diverging} scale={[scale(r.q), scale(r.k), scale(r.q) * scale(r.k) / 2]}
          la="q (a)" lb="k (7)" sum={<>Σ = {r.raw[L][J].toFixed(2)}</>} />
        <SvgHtml x={540} y={196} size={21} w={420}><Tex tex={`s_{a,7} = \\frac{1}{\\sqrt{32}}\\sum_{d=1}^{32} q_{a,d}\\,k_{7,d} = \\frac{${r.raw[L][J].toFixed(2)}}{5.66} = ${S[L][J].toFixed(2)}`} /></SvgHtml>
        <SvgHtml x={540} y={262} size={19} w={420} h={60}><span>query row <b>a</b> × source column <b>7</b></span></SvgHtml>
        <SvgHtml x={540} y={296} size={19} w={420} h={60}><span>32 multiplies, 31 adds: one cell of <Tex tex="S" /></span></SvgHtml>
      </g>
      {/* 2: all of them */}
      <g class={`fd ${step === 2 ? 'on' : ''}`}>
        <SvgHtml x={540} y={60} size={21} w={420} h={60}><span>all <b>81</b> cells: <Tex tex="\underset{9\times32}{Q}\,\underset{32\times9}{K^\top}" /></span></SvgHtml>
        <SvgHtml x={540} y={108} size={19} w={420}><span>no cell needs another cell: <b>all at once</b></span></SvgHtml>
        <SvgHtml x={540} y={150} size={19} w={420}><span>dashed squares: one <b>thread block</b> per tile</span></SvgHtml>
        <SvgHtml x={540} y={250} size={19} w={430} h={90}><span>this lab, one head, one batch:<br /><Tex tex="16 \times 9 \times 9 = 1{,}296" /> dot products of length 32</span></SvgHtml>
        <SvgHtml x={540} y={322} size={19} w={430} h={60}><span><Tex tex="= 41{,}472" /> multiply-adds, then softmax, then <Tex tex="AV" /></span></SvgHtml>
      </g>
      {/* 3: the memory hierarchy */}
      <g class={`fd ${step === 3 ? 'on' : ''}`}>
        <rect class="mem m0" x={560} y={22} width={380} height={64} rx="10" />
        <text class="mt" x={578} y={50}>main memory (device dram)</text>
        <text class="ms" x={578} y={74}>all of q, k, v, the scores: large, far</text>
        <path class="mar" d="M 750 90 V 118" />
        <text class="ms ma" x={762} y={110}>load the tile's rows once</text>
        <rect class="mem m1" x={600} y={122} width={300} height={64} rx="10" />
        <text class="mt" x={618} y={150}>shared memory (on chip)</text>
        <text class="ms" x={618} y={174}>3 q rows + 3 k rows</text>
        <path class="mar" d="M 750 190 V 218" />
        <rect class="mem m2" x={620} y={222} width={260} height={64} rx="10" />
        <text class="mt" x={638} y={250}>threads</text>
        <text class="ms" x={638} y={274}>9 scores; each row used 3×</text>
        <SvgHtml x={540} y={334} size={18} w={430} h={70}><span>long inputs: <Tex tex="T = 4{,}096" /> gives <Tex tex="4{,}096^2" /> scores<br />= 64 MiB in float32, per head, per example</span></SvgHtml>
      </g>
      {/* 4: coordination: who waits for whom */}
      <g class={`fd ${step === 4 ? 'on' : ''}`}>
        {[
          ['S', 'scores', 30], ['m', 'row max', 92], ['e', 'exp(s − m), row sum ℓ', 154], ['A', 'divide by ℓ → A', 216], ['O', 'A · V → O', 278],
        ].map(([k, t, y], i) => (
          <g>
            <rect class={`ch ${k === 'm' || k === 'O' ? 'wait' : ''}`} x={600} y={y as number} width={320} height={44} rx="9" />
            <text class="mt" x={618} y={(y as number) + 29}>{t}</text>
            {i > 0 && <path class="mar" d={`M 760 ${(y as number) - 18} V ${(y as number) - 2}`} />}
          </g>
        ))}
        <text class="bar" x={772} y={88}>wait: the whole row of S</text>
        <text class="bar" x={772} y={274}>wait: all of A</text>
      </g>
      {/* 5: numerics */}
      <g class={`fd ${step === 5 ? 'on' : ''}`}>
        <SvgHtml x={540} y={40} size={19} w={430}><span>mask <Tex tex="M" />: <Tex tex="0" /> allowed, <Tex tex="-\infty" /> for future columns</span></SvgHtml>
        <SvgHtml x={540} y={78} size={19} w={430}><span><Tex tex="e^{-\infty} = 0" />: the future gets exactly no weight</span></SvgHtml>
        <SvgHtml x={540} y={140} size={19} w={430}><span>a row with large scores: <Tex tex="(90,\ 88,\ -\infty)" /></span></SvgHtml>
        <SvgHtml x={540} y={186} size={19} w={430} h={60}><span class="badt">naive: <Tex tex="e^{90} = \infty" /> in float32 → <Tex tex="\infty/\infty" /> = NaN</span></SvgHtml>
        <SvgHtml x={540} y={236} size={19} w={430} h={60}><span>subtract the max: <Tex tex="e^{0},\ e^{-2},\ e^{-\infty}" /></span></SvgHtml>
        <SvgHtml x={540} y={278} size={18} w={410} h={60}><span class="goodt"><Tex tex="\to (0.881,\ 0.119,\ 0)" />: same answer, no overflow</span></SvgHtml>
        <SvgHtml x={540} y={330} size={17} w={430} h={60}><span class="mut">float32 tops out near <Tex tex="3.4\times10^{38}" />; <Tex tex="e^{89}" /> is already larger</span></SvgHtml>
      </g>
      {/* 6: FlashAttention */}
      <g class={`fd ${step === 6 ? 'on' : ''}`}>
        <rect class="mem m1" x={550} y={92} width={410} height={150} rx="12" />
        <text class="mt" x={578} y={120}>on chip, per block of query rows</text>
        {range(4).map((k) => (
          <g class="kv" style={{ transitionDelay: `${k * 120}ms` }}>
            <rect x={590 + k * 84} y={146} width={70} height={36} rx="6" />
            <text x={625 + k * 84} y={170}>K,V {k + 1}</text>
          </g>
        ))}
        <text class="ms" x={568} y={222}>a running max, sum and output per row</text>
        <SvgHtml x={540} y={40} size={19} w={430}><span>FlashAttention: <b>exact</b> attention, reorganized</span></SvgHtml>
        <SvgHtml x={540} y={282} size={18} w={430} h={60}><span>K, V stream through in tiles; the softmax is</span></SvgHtml>
        <SvgHtml x={540} y={308} size={18} w={430} h={60}><span>updated tile by tile, so the <Tex tex="T\times T" /> scores</span></SvgHtml>
        <SvgHtml x={540} y={334} size={18} w={430} h={60}><span>never go to main memory: less memory traffic</span></SvgHtml>
      </g>
    </>
  );

  return (
    <div class="gpu" ref={root}><div class="gin">
      <div class="left card">
        <div class="eqs">
          <span class={eq(0) ? 'on' : ''}><Tex tex="S = \frac{QK^\top}{\sqrt{d_k}}" /></span>
          <span class={eq(1) ? 'on' : ''}><Tex tex="A = \operatorname{softmax}(S + M)" /></span>
          <span class={eq(2) ? 'on' : ''}><Tex tex="O = AV" /></span>
        </div>
        <svg viewBox="0 0 960 470">
          <Mat data={r.k} {...K} t color={(v) => diverging(v, scale(r.k))} rowLabels={chars} labelCls={lab}
            hlRows={one ? [J] : tileCols} dim={one || step === 3} />
          <text class="nm" x={K.x - 16} y={K.y + 70} text-anchor="end">Kᵀ</text>
          <text class="sh" x={K.x - 16} y={K.y + 96} text-anchor="end">(32, 9)</text>
          <Mat data={r.q} {...Q} color={(v) => diverging(v, scale(r.q))} rowLabels={chars} labelCls={lab}
            hlRows={one ? [L] : tileRows} dim={one || step === 3} />
          <text class="nm" x={Q.x} y={Q.y + 9 * Q.ch + 26}>Q</text>
          <text class="sh" x={Q.x + 22} y={Q.y + 9 * Q.ch + 26}>(9, 32)</text>
          <Mat data={Sshow} {...Sp} color={(v) => diverging(v, 4)} visible={(i, j) => step >= 2 || (one && i === L && j === J)}
            hlCells={one || step === 3 ? [[L, J]] : []} hlRows={step === 4 ? [L] : []}
            text={(v, i, j) => (v === null ? '−∞' : step === 1 && i === L && j === J ? v.toFixed(1) : null)} textCls={(v) => (v === null ? 'ninf' : '')} />
          <text class="nm" x={Sp.x} y={Sp.y + 9 * Sp.ch + 26}>S</text>
          <text class="sh" x={Sp.x + 22} y={Sp.y + 9 * Sp.ch + 26}>(9, 9)</text>
          {/* the masked half, tinted */}
          {masked && range(T).flatMap((i) => range(T).filter((j) => j > i).map((j) => (
            <rect class="mk" x={Sp.x + j * Sp.cw} y={Sp.y + i * Sp.ch} width={Sp.cw - .8} height={Sp.ch - .8} />
          )))}
          {/* thread-block tiles over the score grid */}
          <g class={`fd ${tileOn ? 'on' : ''}`}>
            {range(3).flatMap((a) => range(3).map((b) => (
              <rect class={`tile ${step === 3 && a * TILE === tr && b * TILE === tc ? 'cur' : ''}`} x={Sp.x + b * TILE * Sp.cw + 2} y={Sp.y + a * TILE * Sp.ch + 2}
                width={TILE * Sp.cw - 4.8} height={TILE * Sp.ch - 4.8} rx="4" />
            )))}
          </g>
          <text class="ax" x={Sp.x + 4.5 * Sp.cw} y={Sp.y + 9 * Sp.ch + 52}>columns: source positions j</text>
          <text class="ax" x={Q.x - 20} y={Q.y - 14} text-anchor="start">rows: query positions i</text>
          {right}
        </svg>
        <div class="tag-rec rec">q, k: task 1's trained head on qwdk7mzpa</div>
      </div>
      <div class="cards">
        {CONCERNS.map((c, i) => (
          <div class={`cc ${f === i ? 'cur' : ''} ${f === 4 || f > i ? 'seen' : ''} ${f < i && f !== 4 ? 'later' : ''}`}>
            <div class="n">{c.n}</div>
            <div class="b">
              <div class="t">{c.t}</div>
              <div class="q">{c.q}</div>
              <div class={`more ${f === i ? 'on' : ''}`}>{c.more}</div>
            </div>
          </div>
        ))}
      </div>
      </div>
      <style>{`
        .gpu { flex: 1; min-height: 0; }
        .gpu .gin { display: grid; grid-template-columns: 1fr 500px; gap: .8em; font-size: .6em; flex: 1; min-height: 0; height: 100%; }
        .gpu .left { display: flex; flex-direction: column; padding: .4em .6em; min-height: 0; }
        .gpu .left svg { width: 100%; flex: 1; min-height: 0; overflow: visible; }
        .gpu .eqs { display: flex; gap: 1.6em; align-items: center; font-size: 1.25em; padding: .1em .3em .3em; border-bottom: 1px solid var(--border); }
        .gpu .eqs span { color: var(--muted); transition: color .3s; }
        .gpu .eqs span.on { color: var(--accent); }
        .gpu .rec { align-self: flex-start; }
        .gpu .nm { font-family: var(--mono); font-size: 22px; fill: var(--fg); }
        .gpu .sh { font-family: var(--mono); font-size: 18px; fill: var(--muted); }
        .gpu .ax { font-size: 17px; fill: var(--muted); text-anchor: middle; }
        .gpu .ax[text-anchor=start] { text-anchor: start; }
        .gpu .mx .ct.ninf { fill: var(--bad); font-size: 11px; }
        .gpu .mk { fill: color-mix(in srgb, var(--bad) 22%, var(--surface)); }
        .gpu .tile { fill: none; stroke: var(--accent); stroke-width: 2; stroke-dasharray: 5 4; }
        .gpu .tile.cur { stroke: var(--mem); stroke-width: 3.5; stroke-dasharray: none; }
        .gpu .fd { opacity: 0; transition: opacity .35s; }
        .gpu .fd.on { opacity: 1; }
        .gpu .mem { stroke-width: 2; }
        .gpu .mem.m0 { fill: var(--surface); stroke: var(--line-2); }
        .gpu .mem.m1 { fill: color-mix(in srgb, var(--mem) 12%, var(--bg)); stroke: var(--mem); }
        .gpu .mem.m2 { fill: color-mix(in srgb, var(--accent) 10%, var(--bg)); stroke: var(--accent); }
        .gpu .mt { font-size: 20px; font-weight: 600; fill: var(--fg); }
        .gpu .ms { font-size: 17px; fill: var(--muted); }
        .gpu .ma { fill: var(--mem); }
        .gpu .mar { stroke: var(--faint); stroke-width: 2.5; fill: none; marker-end: none; }
        .gpu .ch { fill: var(--sunken); stroke: var(--line-2); stroke-width: 2; }
        .gpu .ch.wait { stroke: var(--hot); }
        .gpu .bar { font-size: 16px; fill: var(--hot); font-weight: 600; }
        .gpu .kv rect { fill: color-mix(in srgb, var(--accent) 14%, var(--bg)); stroke: var(--accent); stroke-width: 1.5; }
        .gpu .kv text { font-family: var(--mono); font-size: 15px; fill: var(--fg); text-anchor: middle; }
        .gpu .badt { color: var(--bad); } .gpu .goodt { color: var(--good); } .gpu .mut { color: var(--muted); }
        .gpu .cards { display: flex; flex-direction: column; gap: .5em; }
        .gpu .cc { display: flex; gap: .7em; align-items: flex-start; padding: .45em .7em; border-radius: 8px;
          transition: opacity .3s, background .3s; flex: none; }
        .gpu .cc.later { opacity: .45; }
        .gpu .cc.cur { background: color-mix(in srgb, var(--accent) 14%, transparent); }
        .gpu .cc .n { font-family: var(--mono); font-weight: 700; font-size: .85em; color: var(--accent); padding-top: .15em; }
        .gpu .cc .t { font-weight: 700; font-size: 1.05em; color: var(--fg); }
        .gpu .cc .q { color: var(--muted); font-size: .9em; }
        .gpu .cc .more { font-size: .88em; line-height: 1.35; max-height: 0; overflow: hidden; opacity: 0; transition: opacity .35s; }
        .gpu .cc .more.on { max-height: 12em; opacity: 1; margin-top: .3em; }
        .gpu .cc .more b { color: var(--fg); }
      `}</style>
    </div>
  );
}
