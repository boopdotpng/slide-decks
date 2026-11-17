/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';
import { IMG, N, P99, AUTO, BLOCK, brighten } from './image';
import { Photo, PER_BLOCK } from './hist-parts';

/**
 * Slide 19: the whole auto-exposure program, end to end: hist_lds on the gpu, 256 counts copied back, the cpu picks
 * the factor, brighten on the gpu. Launch sizes are this photo's: ceil(N / 4096) and ceil(N / 256) blocks of 256.
 */
const HB = Math.ceil(N / PER_BLOCK), BB = Math.ceil(N / BLOCK);
const STAGES: { who: 'gpu' | 'cpu' | 'copy'; code: string; what: ComponentChildren }[] = [
  { who: 'gpu', code: `hist_lds<<<${HB}, 256>>>(bins, img, n)`, what: <>count, in lds, then once per bin</> },
  { who: 'copy', code: 'hipMemcpy(counts, bins, 1024, …)', what: <>256 counts back to ram: 1 KB</> },
  { who: 'cpu', code: `a = 255 / ${P99} = ${AUTO}`, what: <>walk the counts until 99%: brightness {P99}</> },
  { who: 'gpu', code: `brighten<<<${BB}, 256>>>(img, n, ${AUTO})`, what: <>the first program, unchanged</> },
];
const TEXT: ComponentChildren[] = [
  <>the whole auto-exposure program. the photo is already in gpu memory: it never comes back until the end</>,
  <>launch the histogram kernel: {HB} blocks, each counting {PER_BLOCK.toLocaleString('en-US')} pixels</>,
  <>copy just the 256 counts back. 1 KB, not the photo</>,
  <>the cpu does the tiny part: one loop over 256 numbers</>,
  <>and launch the program from part 2 with the number it picked. done</>,
  <>two kinds of job. <b>every thread alone</b>: brighten, nothing to coordinate. <b>threads sharing results</b>: atomics make it correct, a block's lds and barriers make it fast</>,
];
const BY2 = brighten(IMG, 2), BYAUTO = brighten(IMG, AUTO);

export default function Auto() {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(TEXT.length - 1, useSlideStep(root));
  return (
    <div class="auto" ref={root}>
      <div class="au-chain">
        {STAGES.map((s, i) => (
          <div class={`au-st ${s.who} ${k >= i + 1 ? 'on' : ''} ${k === i + 1 ? 'cur' : ''}`}>
            <div class="au-who">{s.who === 'copy' ? 'gpu → cpu' : `on the ${s.who}`}</div>
            <code>{s.code}</code>
            <div class="au-what muted">{s.what}</div>
          </div>
        ))}
      </div>
      <div class="au-photos">
        <Photo img={IMG} label="as shot" />
        <Photo img={BY2} label="× 2: picked by hand (part 2)" />
        <div class={`fade ${k >= 4 ? 'on' : ''}`}><Photo img={BYAUTO} label={`× ${AUTO}: picked by the histogram`} /></div>
      </div>
      <div class="caption au-text">{TEXT[k]}</div>
      <style>{`
        .auto .au-chain { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .auto .au-st { background: var(--panel); border: 1px solid var(--border); border-radius: 12px; padding: .55em .7em; opacity: .25;
          transition: opacity .4s, border-color .4s, background .4s; font-size: .5em; }
        .auto .au-st.on { opacity: 1; } .auto .au-st.cur { border-color: var(--accent); background: var(--tint-blue); }
        .auto .au-who { font-size: .9em; text-transform: uppercase; letter-spacing: .08em; color: var(--accent); margin-bottom: .3em; }
        .auto .au-st.cpu .au-who { color: var(--hot); } .auto .au-st.copy .au-who { color: var(--muted); }
        .auto .au-st code { display: block; background: none; padding: 0; font-size: .92em; white-space: nowrap; }
        .auto .au-what { margin-top: .3em; }
        .auto .au-photos { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.2em; margin-top: 1em; }
        .auto .au-photos figcaption { font-size: .5em; }
        .auto .au-text { font-size: .76em; min-height: 3.3em; margin-top: .6em; }
      `}</style>
    </div>
  );
}
