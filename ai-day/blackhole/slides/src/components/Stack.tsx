/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from 'slides/hooks';

/**
 * A software stack, top (your code) to bottom (the chip), as a column of layers.
 * Each layer can change at a step: `reveal` swaps its text in, `lit` highlights it.
 * Steps are counted from 0 (the slide as it opens); renders purely from the step.
 */

export type Tone = 'code' | 'layer' | 'hidden' | 'ours' | 'hw' | 'dim';
export type Layer = {
  t: string;
  sub?: string;
  tone?: Tone;
  /** from this step on, show `reveal` (and `revealSub`) instead of t */
  revealAt?: number; reveal?: string; revealSub?: string;
  /** from this step on, highlight the layer */
  litAt?: number;
};

export default function Stack({ title, layers, width = 520, compact = false }: {
  title?: string; layers: Layer[]; width?: number; compact?: boolean;
}) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  return (
    <div class={`stk ${compact ? 'compact' : ''}`} ref={root} style={{ width: `${width}px` }}>
      {title && <div class="stk-title">{title}</div>}
      {layers.map((l, i) => {
        const shown = l.revealAt !== undefined && step >= l.revealAt;
        const lit = l.litAt !== undefined && step >= l.litAt;
        const tone = shown && l.tone === 'hidden' ? 'layer' : (l.tone ?? 'layer');
        return (
          <>
            {i > 0 && <div class="stk-join" />}
            <div class={`stk-l ${tone} ${lit ? 'lit' : ''}`}>
              <div class="stk-t">{shown ? l.reveal : l.t}</div>
              {(shown ? l.revealSub : l.sub) && <div class="stk-sub">{shown ? l.revealSub : l.sub}</div>}
            </div>
          </>
        );
      })}
      <style>{`
        .stk { display: flex; flex-direction: column; align-items: stretch; font-size: 28px; }
        .stk-title { font-size: 22px; color: var(--muted); margin-bottom: 10px; text-align: center; }
        .stk-l { border-radius: 12px; padding: 12px 20px; border: 2px solid var(--line); background: var(--panel);
          text-align: center; transition: background .35s, border-color .35s, color .35s, opacity .35s; }
        .stk.compact .stk-l { padding: 8px 16px; }
        .stk-t { font-weight: 650; line-height: 1.2; }
        .stk-sub { font-size: 20px; color: var(--muted); margin-top: 3px; line-height: 1.25; }
        .stk-join { width: 3px; height: 14px; background: var(--line-2); align-self: center; }
        .stk.compact .stk-join { height: 10px; }
        .stk-l.code { background: var(--tint-blue); border-color: var(--accent); }
        .stk-l.hidden { background: var(--sunken); border-style: dashed; color: var(--faint); }
        .stk-l.ours { background: var(--tint-green); border-color: var(--good); }
        .stk-l.hw { background: var(--fill-amber); border-color: var(--hot); }
        .stk-l.dim { opacity: .5; }
        .stk-l.lit { border-color: var(--hot); background: color-mix(in srgb, var(--hot) 22%, var(--panel)); }
        .stk-l.lit .stk-sub { color: var(--fg); }
      `}</style>
    </div>
  );
}
