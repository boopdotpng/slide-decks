/**
 * LaTeX in an island: <Tex tex="W_Q x" />, or <Tex block tex="..." /> for display math. KaTeX renders to html (on the
 * server, then again on hydration; cached per string), so steps can swap formulas freely. Same look as Math.astro;
 * size it with font-size on a parent (it's 1.21em of the surrounding text, KaTeX's default).
 * Palette colors can't go through \color (KaTeX wants a literal): wrap the part in \htmlClass{name}{...} and color
 * .name from the island's css, e.g. \htmlClass{dg}{7} with `.x .dg { color: var(--hot) }`.
 */
import type { ComponentChildren } from 'preact';
import katex from 'katex';
import 'katex/dist/katex.min.css';

const cache = new Map<string, string>();
const trust = (ctx: { command: string }) => ctx.command === '\\htmlClass';
export const texHtml = (tex: string, block = false) => {
  const key = (block ? 'B' : 'I') + tex;
  let html = cache.get(key);
  if (html === undefined) {
    html = katex.renderToString(tex, { displayMode: block, throwOnError: false, trust, strict: false });
    cache.set(key, html);
  }
  return html;
};

export function Tex({ tex, block = false, class: cls, style }: { tex: string; block?: boolean; class?: string; style?: any }) {
  const Tag = block ? 'div' : 'span';
  return <Tag class={`math ${cls ?? ''}`} style={style} dangerouslySetInnerHTML={{ __html: texHtml(tex, block) }} />;
}

/**
 * Html inside an svg (words and <Tex> together, say), as a foreignObject anchored like <text>: (x, y) with y the vertical
 * middle, align the horizontal anchor. size: font size in svg units. w × h is only the room it may use
 */
export function SvgHtml({ x, y, size = 20, align = 'start', w = 900, h, color, class: cls, children }: {
  x: number; y: number; size?: number; align?: 'start' | 'middle' | 'end'; w?: number; h?: number; color?: string; class?: string;
  children: ComponentChildren;
}) {
  const H = h ?? size * 3;
  const left = align === 'start' ? x : align === 'end' ? x - w : x - w / 2;
  const justify = align === 'start' ? 'flex-start' : align === 'end' ? 'flex-end' : 'center';
  return (
    <foreignObject class={`svghtml ${cls ?? ''}`} x={left} y={y - H / 2} width={w} height={H} style={{ overflow: 'visible', pointerEvents: 'none' }}>
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: justify, gap: '.3em',
        fontSize: `${size}px`, lineHeight: 1.2, color, whiteSpace: 'nowrap' }}>{children}</div>
    </foreignObject>
  );
}

/** a formula inside an svg: SvgHtml with just the formula */
export function SvgTex({ tex, ...p }: { tex: string; x: number; y: number; size?: number; align?: 'start' | 'middle' | 'end';
  w?: number; h?: number; color?: string; class?: string }) {
  return <SvgHtml {...p}><Tex tex={tex} /></SvgHtml>;
}
