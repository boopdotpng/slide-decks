/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';
import { Shape, Tok, useData } from './viz';

/**
 * The whole forward pass on one screen, top to bottom, with the batch-1 tensor
 * shape after each stage. Steps 1–6 light up one stage at a time.
 */
export default function ModelMap() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const d = useData('embed');
  const S = d?.ids.length ?? 14;

  const rows = [
    { name: 'tokenize', code: 'tokenizer.encode(prompt).ids', dims: [1, S], names: ['B', 'S'], params: '' },
    { name: 'embed', code: 'self.embed_tokens(tokens) + self.embed_positions.weight[:S]', dims: [1, S, 768], names: ['B', 'S', 'D'], params: '38.6M + 0.8M' },
    { name: '× 12 blocks', code: 'for layer in self.layers: x = layer(x)', dims: [1, S, 768], names: ['B', 'S', 'D'], params: '12 × 7.1M' },
    { name: 'final norm', code: 'self.norm(x)', dims: [1, S, 768], names: ['B', 'S', 'D'], params: '' },
    { name: 'unembed', code: 'x @ self.embed_tokens.weight.T', dims: [1, S, 50257], names: ['B', 'S', 'V'], params: '(tied to embed_tokens)' },
    { name: 'sample', code: 'logits[:, -1, :].argmax()', dims: [1], names: [''], params: '' },
  ];

  return (
    <div class="mm" ref={root}>
      <div class="text">
        {d ? d.toks.map((t: string) => <Tok t={t} />) : '…'}
      </div>
      {rows.map((r, i) => (
        <div class={`row ${step > i ? 'on' : ''} ${step === i + 1 ? 'cur' : ''}`}>
          <div class="arrow">↓</div>
          <div class="name">{r.name}</div>
          <code class="c">{r.code}</code>
          <div class="sh">
            {i === rows.length - 1
              ? <span class="next"><Tok t=" Mary" /></span>
              : <Shape dims={r.dims} names={r.names} />}
          </div>
          <div class="p muted">{r.params}</div>
        </div>
      ))}
      <style>{`
        .mm { font-size: .72em; display: grid; grid-template-columns: 1.5em auto auto auto auto; justify-content: start; gap: .15em 1em; align-items: center; }
        .mm .text { grid-column: 1 / -1; font-size: .9em; margin-bottom: .2em; }
        .mm .row { display: contents; }
        .mm .row > * { opacity: .18; transition: opacity .35s, color .35s; }
        .mm .row.on > * { opacity: 1; }
        .mm .row.on.cur .name { color: var(--accent); }
        .mm .arrow { color: var(--muted); text-align: center; }
        .mm .name { white-space: nowrap; }
        .mm .c { font-size: .7em; background: none; color: var(--muted); }
        .mm .p { font-size: .75em; text-align: right; white-space: nowrap; }
        .mm .next { font-size: 1.1em; color: var(--accent); }
      `}</style>
    </div>
  );
}
