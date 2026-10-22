/** @jsxImportSource preact */
import { Strip, Tok, at, pct, rms, useIsland } from './viz';
import { LENS } from './common';

/**
 * What attention is, before any grid: a room with the four tokens in it. " of" has a question; everyone wears a tag
 * and holds a note. All three are short strips made from each token's own strip (block 3, head 3, real numbers).
 *  0 " of" makes a question: what i'm looking for
 *  1 every token makes a tag: what i advertise
 *  2 question against each tag: the share of " of"'s reading each token gets
 *  3 every token has a note: what i hand over. " of" takes every note, scaled by its share
 *  4 the point: three strips per token, from its own strip, before anyone looks at anyone. only the match crosses
 *  5 signpost: gpt-2 does this 144 times over (12 blocks × 12 heads). we follow one: block 3, head 3
 */
const SW = 192, SH = 22;
export default function Ask() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length, me = S - 1, [L, H] = d.focus as [number, number];
  const q: number[][] = d.lenses.q.out, k: number[][] = d.lenses.k.out, v: number[][] = d.lenses.v.out;
  const share: number[] = d.probs[me];
  const got: number[] = d.head_out[me];
  const best = share.indexOf(Math.max(...share));
  const vs = rms(v.flat()) * 2; // one color scale for every note and the result, so "mostly States's" is visible
  return (
    <div class="ask" ref={root}>
      <div class="room">
        {d.toks.map((t: string, i: number) => (
          <div class={`p ${i === me ? 'me' : ''} ${step >= 4 ? 'own' : ''}`}>
            <div class="t"><Tok t={t} /></div>
            <div class={`item ${i === me ? at(step, 0) : at(step, 4)} ${i !== me ? 'other' : ''}`} style={{ '--c': LENS.q.color }}>
              <div class="lbl">{LENS.q.plain}</div>
              <Strip values={q[i]} width={SW} height={SH} label="looking for" />
            </div>
            <div class={`item ${at(step, 1)}`} style={{ '--c': LENS.k.color }}>
              <div class="lbl">{LENS.k.plain}</div>
              <Strip values={k[i]} width={SW} height={SH} label="advertise" />
            </div>
            <div class={`share ${at(step, 2)}`}>
              <div class="lbl">share of <Tok t={d.toks[me]} />'s reading</div>
              <div class="bar"><div class="track"><div style={{ width: `${share[i] * 100}%` }} /></div><span class="pv">{pct(share[i])}</span></div>
            </div>
            <div class={`item ${at(step, 3)}`} style={{ '--c': LENS.v.color }}>
              <div class="lbl">{LENS.v.plain}</div>
              <Strip values={v[i]} width={SW} height={SH} scale={vs} label="hand over" />
            </div>
          </div>
        ))}
        <div class={`got ${at(step, 3)}`}>
          <div class="lbl">what <Tok t={d.toks[me]} /> gets back</div>
          <Strip values={got} width={SW} height={SH} scale={vs} label="result" />
          <div class="sub">every note, turned down to its share, added up. mostly <Tok t={d.toks[best]} />'s</div>
        </div>
      </div>
      <div class="cap">
        {[<><Tok t={d.toks[me]} /> needs something from the others. first it makes a short strip out of its <b>own</b> strip: <b style={{ color: LENS.q.color }}>what it's looking for</b>. a question, written as 64 numbers. the model learned what to ask</>,
          <>every token makes a second short strip from its own: <b style={{ color: LENS.k.color }}>what it advertises</b>. a name tag, saying how it wants to be found. <Tok t={d.toks[me]} /> wears one too</>,
          <>hold the question up against each tag. the better the match, the bigger that token's share of <Tok t={d.toks[me]} />'s reading. here: mostly <Tok t={d.toks[best]} /></>,
          <>a third short strip from each token's own: <b style={{ color: LENS.v.color }}>what it hands over</b> if picked. the tag is for being found; the note is what you actually get. <Tok t={d.toks[me]} /> takes every note, turned down to its share</>,
          <>three short strips per token, each made from that token's <b>own</b> strip, before anyone looks at anyone. the only step that crosses tokens is the match. and every token asks at once, not just <Tok t={d.toks[me]} /></>,
          <>gpt-2 does this <b>144 times over</b>: 12 blocks, 12 of these in each. the next slides follow one of them, <b>block {L}, head {H}</b>, number by number</>][Math.min(step, 5)]}
      </div>
      <style>{`
        .ask { display: flex; flex-direction: column; gap: 1.2em; font-size: .8em; }
        .ask .room { display: flex; gap: 1.2em; align-items: flex-start; }
        .ask .p { display: flex; flex-direction: column; gap: .7em; padding: .6em .7em .8em; border-radius: 10px; width: ${SW + 24}px;
          border: 2px dashed transparent; transition: border-color .4s; }
        .ask .p.me { background: var(--panel); }
        .ask .p.own { border-color: var(--muted); }
        .ask .t { font-size: 1em; text-align: center; min-height: 1.4em; }
        .ask .item, .ask .share, .ask .got { display: flex; flex-direction: column; gap: .25em; }
        .ask .lbl { font-size: .5em; color: var(--muted); white-space: nowrap; }
        .ask .item .lbl { color: var(--c); }
        .ask .item .strip { outline: 2px solid var(--c); outline-offset: 1px; border-radius: 2px; }
        .ask .item.other.on { opacity: .45; }
        .ask .share .bar { display: flex; align-items: center; gap: .5em; }
        .ask .share .track { flex: 1; height: 12px; background: var(--surface); border-radius: 3px; overflow: hidden; }
        .ask .share .track div { height: 100%; background: var(--accent); transition: width .5s; }
        .ask .share .pv { font: .55em var(--mono); color: var(--fg); width: 2.4em; text-align: right; }
        .ask .got { margin-left: 1em; align-self: flex-end; padding-bottom: .8em; }
        .ask .got .strip { outline: 2px solid var(--accent); outline-offset: 1px; border-radius: 2px; }
        .ask .got .sub { font-size: .5em; color: var(--muted); max-width: ${SW + 20}px; line-height: 1.3; }
        .ask .cap { font-size: .7em; color: var(--muted); min-height: 2.6em; max-width: 60em; }
        .ask .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
