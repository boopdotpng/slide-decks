/** @jsxImportSource preact */
import { Strip } from './viz';

/**
 * A 768-vector drawn either as one long strip (heads=false) or as 12 stacked
 * 64-wide rows (heads=true). The 12 chunks are the same elements in both modes
 * and slide/scale between them, so the reshape is visible.
 */
interface Props {
  values: number[]; // flat, n_heads * head_dim
  heads: boolean;
  width?: number;
  rowH?: number;
  focus?: number; // head to highlight in heads mode
  scale?: number;
  label?: string;
}

const N = 12;

export default function SplitHeads({ values, heads, width = 320, rowH = 12, focus, scale, label }: Props) {
  const hd = values.length / N;
  const gap = 3;
  return (
    <div class="sh-wrap" style={{ width: `${width}px`, height: `${heads ? N * (rowH + gap) : rowH * 1.6}px` }}>
      {Array.from({ length: N }, (_, h) => (
        <div class={`sh-chunk ${heads && focus !== undefined && h !== focus ? 'dim' : ''}`} style={{
          width: `${width}px`,
          transform: heads ? `translate(0, ${h * (rowH + gap)}px)` : `translate(${(h * width) / N}px, 0) scaleX(${1 / N})`,
          transitionDelay: `${(heads ? h : N - h) * 25}ms`,
        }}>
          <Strip values={values.slice(h * hd, (h + 1) * hd)} height={heads ? rowH : rowH * 1.6} scale={scale}
            label={`${label ?? ''} head ${h}`} />
          {heads && <span class="hn">{h}</span>}
        </div>
      ))}
      <style>{`
        .sh-wrap { position: relative; transition: height .5s; }
        .sh-chunk { position: absolute; left: 0; top: 0; transform-origin: 0 0; transition: transform .6s cubic-bezier(.4,0,.2,1), opacity .3s; }
        .sh-chunk.dim { opacity: .3; }
        .sh-chunk .strip { border-radius: 0; transition: height .5s; }
        .sh-chunk .hn { position: absolute; right: calc(100% + 6px); top: 50%; transform: translateY(-50%); font-size: 13px; color: var(--muted); }
      `}</style>
    </div>
  );
}
