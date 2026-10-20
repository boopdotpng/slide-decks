/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { COLORS, Shape, Tok, useData } from './viz';

/** text -> token chips (step 1) -> token ids (step 2) -> tokens aren't words or letters: rarer words split (step 3). */
export default function Tokenize() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('embed');
  if (!d) return <div ref={root} />;

  return (
    <div class="tkz" ref={root}>
      <div class={`text ${step >= 1 ? 'gone' : ''}`}>"{d.prompt}"</div>
      <div class={`chips ${step >= 1 ? 'on' : ''}`}>
        {d.toks.map((t: string, i: number) => (
          <div class="col" style={{ transitionDelay: `${i * 40}ms` }}>
            <span class="chip"><Tok t={t} /></span>
            <span class={`id fade ${step >= 2 ? 'on' : ''}`} style={{ transitionDelay: `${i * 40}ms` }}>{d.ids[i]}</span>
          </div>
        ))}
      </div>
      <div class={`fade ${step >= 2 ? 'on' : ''} foot`}>
        tokens <Shape dims={[d.ids.length]} names={['S']} />
        <span class="muted small"> · vocab = 50,257</span>
      </div>
      <div class={`fade ${step >= 3 ? 'on' : ''} splits`}>
        <div class="lbl muted">not words, not letters: somewhere in between. common words are one token, rarer ones split into pieces</div>
        {d.splits.map((w: { word: string; toks: string[]; ids: number[] }) => (
          <div class="split">
            <span class="w">"{w.word.trim()}"</span><span class="muted">→</span>
            {w.toks.map((t, i) => <div class="col on"><span class="chip"><Tok t={t} /></span><span class="id">{w.ids[i]}</span></div>)}
          </div>
        ))}
      </div>
      <style>{`
        .tkz .text { font-size: 1em; transition: opacity .4s, transform .4s; margin-bottom: .6em; }
        .tkz .text.gone { opacity: .25; transform: translateY(-4px); }
        .tkz .chips { display: flex; flex-wrap: wrap; gap: .4em; font-size: .8em; }
        .tkz .col { display: flex; flex-direction: column; align-items: center; gap: .2em;
          opacity: 0; transform: translateY(10px); transition: opacity .35s, transform .35s; }
        .tkz .chips.on .col { opacity: 1; transform: none; }
        .tkz .id { font-family: var(--mono); font-size: .7em; color: ${COLORS.hot}; }
        .tkz .foot { margin-top: 1.2em; }
        .tkz .splits { margin-top: 1.4em; display: flex; flex-direction: column; gap: .5em; font-size: .8em; }
        .tkz .splits .lbl { font-size: .75em; }
        .tkz .split { display: flex; align-items: flex-start; gap: .5em; }
        .tkz .split .w { width: 7em; text-align: right; padding-top: .15em; }
        .tkz .split .col { opacity: 1; transform: none; }
      `}</style>
    </div>
  );
}
