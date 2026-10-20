/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Shape, Tok, useData } from './viz';

/**
 * One forward pass over the whole prompt. Every position gets computed, but only the last
 * position's output is the next token, so the next slides follow ' to' through the model.
 * Steps: 1. all tokens go in together   2. follow the last one   3. shapes
 */
export default function OnePass() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('decode');
  if (!d) return <div ref={root} />;
  const toks: string[] = d.toks;
  const S = toks.length;

  return (
    <div class="op" ref={root}>
      <div class={`line fade ${step >= 1 ? 'on' : ''}`}>
        {toks.map((t, i) => <span class={`chip ${i === S - 1 && step >= 2 ? 'last' : ''} ${i < S - 1 && step >= 2 ? 'dim' : ''}`}><Tok t={t} /></span>)}
      </div>
      <div class={`lbl muted fade ${step >= 2 ? 'on' : ''}`}>
        we follow the last token: its output is the next token. on the way it gets to look at every token before it (that's attention, next)
      </div>

      <table class={`fade ${step >= 3 ? 'on' : ''}`}>
        <tr><td>tokens</td><td><Shape dims={[1, S]} names={['B', 'S']} /></td></tr>
        <tr><td>x</td><td><Shape dims={[1, S, 768]} names={['B', 'S', 'D']} /> <span class="muted">· shown: row {S - 1}</span></td></tr>
        <tr><td>logits</td><td><Shape dims={[1, S, 50257]} names={['B', 'S', 'V']} /> <span class="muted">· next token from row {S - 1}</span></td></tr>
      </table>
      <style>{`
        .op { font-size: .8em; display: flex; flex-direction: column; gap: 1em; }
        .op .line { display: flex; flex-wrap: wrap; gap: .3em; font-size: .75em; }
        .op .chip { transition: opacity .4s, color .4s; }
        .op .chip.dim { opacity: .5; }
        .op .chip.last { color: var(--accent); font-weight: 700; }
        .op .lbl { font-size: .65em; }
        .op table { font-size: .8em; margin-top: .6em; align-self: flex-start; }
        .op td:first-child { color: var(--muted); padding-right: 2em; }
      `}</style>
    </div>
  );
}
