/** @jsxImportSource preact */
import { Tok, at, useIsland } from './viz';
import { headColor } from './common';

/**
 * What heads buy and what blocks buy, now that one head has been watched. The 144 heads of gpt-2 as a 12 × 12 grid:
 * a row is one block's 12 heads, run at the same time; rows run top to bottom, one after another.
 *  0 heads are breadth: one row, 12 questions at once, sharing the 768 numbers (12 × 64)
 *  1 blocks are depth: rows run in order, and a later row's questions can use what earlier rows added to the strips
 *  2 the knobs: gpt-2's four sizes. heads follow the width (always 64 wide); blocks are the real decision
 */
const NB = 12, NH = 12, CELL = 24, GAP = 4;
const SIZES = [
  { name: 'small', width: 768, heads: 12, blocks: 12 },
  { name: 'medium', width: 1024, heads: 16, blocks: 24 },
  { name: 'large', width: 1280, heads: 20, blocks: 36 },
  { name: 'xl', width: 1600, heads: 25, blocks: 48 },
];
export default function BreadthDepth() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const [L, H] = d.focus as [number, number];
  const [PL, PH] = d.prev_head as [number, number, number];
  const rowOn = (b: number) => (step === 0 ? b === L : true);
  return (
    <div class="bd" ref={root}>
      <div class="grid144">
        <div class="axis top">12 heads, side by side: <b>at the same time</b></div>
        <div class={`axis left ${at(step, 1)}`}>12 blocks, top to bottom: <b>one after another</b></div>
        <div class="cells">
          {Array.from({ length: NB }, (_, b) => (
            <div class={`r ${rowOn(b) ? 'on' : ''}`}>
              <span class="bn">block {b}</span>
              {Array.from({ length: NH }, (_, h) => (
                <div class={`c ${b === L && h === H ? 'ours' : ''} ${b === PL && h === PH ? 'prev' : ''}`}
                  style={{ background: headColor(h, H), width: CELL, height: CELL }} />
              ))}
            </div>
          ))}
        </div>
        <div class="legend">
          <span><i class="sw ours" /> block {L}, head {H}: the one we followed</span>
          <span class={at(step, 1)}><i class="sw prev" /> block {PL}, head {PH}: reads the word just before</span>
        </div>
      </div>
      <div class="side">
        <div class={`pt ${at(step, 0)}`}>
          <div class="h">heads: <b>breadth</b></div>
          <p>one block asks 12 questions of the sentence at once. each head has its own three grids, so its own question. they share the token's 768 numbers: 12 heads × 64. twice the heads at the same width means 32 numbers each, not more room</p>
          <p class="loop">the inner loop. more heads run side by side: no extra time</p>
        </div>
        <div class={`pt ${at(step, 1)}`}>
          <div class="h">blocks: <b>depth</b></div>
          <p>rounds, in order. after block 0, <Tok t={d.toks[3]} />'s strip already holds what it pulled from <Tok t={d.toks[2]} />. block 1's questions can ask about <b>that</b>. "Harry Potter … Harry →" needs two rounds: one head marks every token with the word before it, a later head finds the earlier Harry by that mark and copies what followed. no single round can do it, however many heads</p>
          <p class="loop">the outer loop. every block is one more step, after the last</p>
        </div>
        <div class={`pt ${at(step, 2)}`}>
          <table>
            <thead><tr><th>gpt-2</th><th>strip width</th><th>heads</th><th>blocks</th></tr></thead>
            <tbody>{SIZES.map((s) => (
              <tr class={s.name === 'small' ? 'us' : ''}><td>{s.name}</td><td>{s.width}</td><td>{s.heads} × 64</td><td>{s.blocks}</td></tr>
            ))}</tbody>
          </table>
          <p>every head stays 64 wide; the head count just follows the width. the real decision is how many rounds</p>
        </div>
      </div>
      <div class="cap">
        {[<>a head is one question. heads decide how many questions a token asks <b>at once</b></>,
          <>blocks decide how many <b>rounds</b> of questions there are. later rounds can build on earlier answers</>,
          <>heads: how many questions at once. blocks: how many rounds, each able to use the last. the loop picture again: heads inside, blocks outside</>][Math.min(step, 2)]}
      </div>
      <style>{`
        .bd { display: grid; grid-template-columns: auto 1fr; grid-template-rows: auto auto; gap: 1em 3em; font-size: .8em; align-items: start; }
        .bd .grid144 { display: flex; flex-direction: column; gap: .5em; }
        .bd .axis { font-size: .5em; color: var(--muted); }
        .bd .axis b { color: var(--fg); }
        .bd .axis.top { margin-left: 5.2em; }
        .bd .cells { display: flex; flex-direction: column; gap: ${GAP}px; }
        .bd .r { display: flex; gap: ${GAP}px; align-items: center; opacity: .18; transition: opacity .4s; }
        .bd .r.on { opacity: 1; }
        .bd .r .bn { font-size: .45em; color: var(--muted); width: 5em; text-align: right; margin-right: .4em; }
        .bd .c { border-radius: 4px; opacity: .8; }
        .bd .c.ours { outline: 3px solid var(--fg); outline-offset: 1px; opacity: 1; }
        .bd .c.prev { outline: 3px dashed var(--fg); outline-offset: 1px; opacity: 1; }
        .bd .legend { display: flex; flex-direction: column; gap: .3em; font-size: .5em; color: var(--muted); margin-left: 5.2em; }
        .bd .legend .sw { display: inline-block; width: .9em; height: .9em; border-radius: 3px; background: var(--accent); vertical-align: -.1em; margin-right: .4em; }
        .bd .legend .sw.ours { outline: 2px solid var(--fg); }
        .bd .legend .sw.prev { outline: 2px dashed var(--fg); }
        .bd .side { display: flex; flex-direction: column; gap: 1em; max-width: 44em; }
        .bd .pt { display: flex; flex-direction: column; gap: .25em; }
        .bd .pt .h { font-size: .8em; margin-bottom: .2em; }
        .bd .pt .h b { color: var(--accent); }
        .bd .pt p { margin: 0; font-size: .58em; color: var(--muted); line-height: 1.4; }
        .bd .pt p b { color: var(--fg); }
        .bd .pt p.loop { margin-top: .3em; color: var(--fg); font-family: var(--mono); font-size: .52em; }
        .bd table { border-collapse: collapse; font-size: .55em; margin-bottom: .4em; }
        .bd th, .bd td { padding: .15em 1em .15em 0; text-align: left; font-weight: normal; }
        .bd th { color: var(--muted); border-bottom: 1px solid var(--border); }
        .bd td { font-family: var(--mono); color: var(--fg); }
        .bd tr.us td { color: var(--accent); }
        .bd .cap { grid-column: 1 / -1; font-size: .7em; color: var(--muted); min-height: 1.6em; }
        .bd .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
