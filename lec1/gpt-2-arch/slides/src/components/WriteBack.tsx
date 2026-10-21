/** @jsxImportSource preact */
import { ByteHeat, Strip, at, rms, useIsland } from './viz';
import { headColor } from './common';

/**
 * Writing back. The head's 64 numbers go through one more grid (64 × 768) to become a 768-number note, and the
 * note is added onto " of"'s strip.
 *  0 the head's result   1 the output grid: 64 → 768   2 added onto the stream
 *  3 the other 11 heads ran too: 12 notes, all added on
 */
export default function WriteBack() {
  const { root, step, d } = useIsland('forward');
  if (!d) return <div ref={root} />;
  const S = d.toks.length, me = S - 1, H: number = d.focus[1];
  const msgs: number[][] = d.head_msgs;
  const before: number[] = d.resid_in[me];
  const msc = 2 * rms(d.attn_out), ssc = 2 * rms(before);
  const after1 = before.map((v, i) => v + msgs[H][i]);
  const all = step >= 3;
  return (
    <div class="wb" ref={root}>
      <div class="r"><span class="k">this head's result</span>
        <div style={{ width: `${(64 / 768) * 100}%` }}><Strip values={d.head_out[me]} height={30} /></div></div>
      <div class={`r ${at(step, 1)}`}><span class="k">{all ? <>the <b>whole</b> output grid · 768 × 768</> : <>the output grid · 64 × 768</>}</span>
        {all
          ? <ByteHeat m={d.W_o_full_img} w="100%" h={200}>
              {Array.from({ length: 12 }, (_, h) => (
                <div class={`slab ${h === H ? 'ours' : ''}`} style={{ top: `${(h / 12) * 100}%`, height: `${100 / 12}%`, borderColor: headColor(h) }} />
              ))}
            </ByteHeat>
          : <ByteHeat m={d.W_o_img} w="100%" h={110} />}
      </div>
      <div class={`r ${at(step, 1)}`}><span class="k">{all ? '12 notes' : 'its note, 768 wide'}</span>
        <div class="notes">
          {(all ? msgs : [msgs[H]]).map((m, h) => (
            <div class="note" style={{ borderColor: all ? headColor(h) : 'transparent' }}>
              <Strip values={m} scale={msc} height={all ? 9 : 30} />
            </div>
          ))}
        </div></div>
      <div class={`stream ${at(step, 2)}`}>
        <div class="r"><span class="k">the stream for " of"</span><Strip values={before} scale={ssc} height={30} /></div>
        <div class="r"><span class="k">+ {all ? 'all 12 notes' : 'the note'}</span><Strip values={all ? d.attn_out : msgs[H]} scale={ssc} height={30} /></div>
        <div class="r"><span class="k">= after attention</span><Strip values={all ? d.resid_mid : after1} scale={ssc} height={30} /></div>
      </div>
      <div class="cap">
        {[<>what one head found: 64 numbers, in the head's own shorthand</>,
          <>one more grid, the same move turned on its side: 64 numbers in along the rows, 768 out along the columns. a note the size of the stream</>,
          <>the note is <b>added</b> onto the strip. nothing is overwritten</>,
          <>the other 11 heads did the same at the same time. the real output grid is 768 × 768, cut every 64 <b>rows</b>: each head's slab makes its note, and all 12 notes get added on. 12 × 64 = 768</>][Math.min(step, 3)]}
      </div>
      <style>{`
        .wb { display: flex; flex-direction: column; gap: .5em; font-size: .8em; }
        .wb .r { display: grid; grid-template-columns: 11em 1fr; gap: 1em; align-items: center; }
        .wb .k { text-align: right; font-size: .58em; color: var(--muted); white-space: nowrap; }
        .wb .k b { color: var(--fg); }
        .wb .slab { position: absolute; left: 0; right: 0; border-top: 1px solid; opacity: .5; box-sizing: border-box; }
        .wb .slab.ours { opacity: 1; border: 2px solid var(--accent); }
        .wb .notes { display: flex; flex-direction: column; gap: 2px; }
        .wb .note { border-left: 6px solid; padding-left: 4px; }
        .wb .stream { display: flex; flex-direction: column; gap: .4em; margin-top: .6em; padding-top: .6em; border-top: 1px solid var(--border); }
        .wb .cap { margin-top: .6em; font-size: .7em; color: var(--muted); min-height: 1.6em; }
        .wb .cap b { color: var(--fg); }
      `}</style>
    </div>
  );
}
