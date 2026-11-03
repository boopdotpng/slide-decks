/**
 * Colors for islands. COLORS are css vars from styles/deck.css, so they work anywhere css does (style, svg fill /
 * stroke, <style> blocks) and follow the light / dark theme by themselves; tints are
 * color-mix(in srgb, ${COLORS.good} 30%, transparent). Canvas and WebGL can't read css vars: pass colors through
 * resolve() first (Strip, HeatCanvas and ByteHeat already do) and redraw when the theme changes (useTheme()).
 *
 * Data scales, as color-mix() of the palette's --neg / --pos / --mid and --seq-0..5, so they switch with the theme too:
 * diverging: blue (negative) <-> red (positive), neutral midpoint so zeros recede.
 * sequential: one blue ramp, from near the background (low) to strong (high), for probabilities / similarity.
 */
const v = (name: string) => `var(--${name})`;
export const COLORS = {
  neg: v('neg'), pos: v('pos'), mid: v('mid'),
  accent: v('accent'), hot: v('hot'), good: v('good'), bad: v('bad'), purple: v('purple'),
  teal: v('teal'), pink: v('pink'), yellow: v('yellow'),
  // muted fills for regions / fields
  slate: v('fill-slate'), green: v('fill-green'), blue: v('fill-blue'), amber: v('fill-amber'), red: v('fill-red'), violet: v('fill-violet'),
  // categorical: lines / series that only need to differ from each other
  series: [v('series-1'), v('series-2'), v('series-3'), v('series-4')],
};
const SEQ = [0, 1, 2, 3, 4, 5].map((i) => v(`seq-${i}`));

/** a + (b - a) * t, as css: color-mix(in srgb, a, b t%). resolve() turns it into rgb() for canvas */
export const mix = (a: string, b: string, t: number) =>
  `color-mix(in srgb, ${a}, ${b} ${+(Math.max(0, Math.min(1, t)) * 100).toFixed(2)}%)`;

/** v / scale, squashed with tanh so outliers don't wash everything else out */
export function diverging(x: number, scale = 1) {
  const t = Math.tanh(x / scale);
  return t < 0 ? mix(COLORS.mid, COLORS.neg, -t) : mix(COLORS.mid, COLORS.pos, t);
}
/** t in [0, 1] */
export function sequential(t: number) {
  t = Math.max(0, Math.min(1, t)) * (SEQ.length - 1);
  const i = Math.min(SEQ.length - 2, Math.floor(t));
  return mix(SEQ[i], SEQ[i + 1], t - i);
}

// ── resolve: css color -> a value canvas / WebGL understand ──────────────────
const resolved = new Map<string, string>();
if (typeof window !== 'undefined') addEventListener('deck:theme', () => resolved.clear());

const hex2rgb = (h: string) => {
  if (h.length === 4) h = '#' + [...h.slice(1)].map((c) => c + c).join('');
  return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
};
/** two hex colors -> rgb() (what mix() means, for code that needs a value now) */
export const lerp = (a: string, b: string, t: number) => {
  const x = hex2rgb(a), y = hex2rgb(b);
  return `rgb(${x.map((c, i) => Math.round(c + (y[i] - c) * t)).join(',')})`;
};
/** a var's current value, cached until the theme changes */
const cssVar = (name: string) => {
  let c = resolved.get(name);
  if (c === undefined) resolved.set(name, (c = getComputedStyle(document.documentElement).getPropertyValue(name).trim()));
  return c;
};
const MIX = /^color-mix\(in srgb, var\((--[\w-]+)\), var\((--[\w-]+)\) ([\d.]+)%\)$/;

/** 'var(--x)' -> its current value; mix() / diverging() / sequential() -> rgb(); anything else is returned as is */
export function resolve(color: string) {
  if (typeof document === 'undefined') return color;
  const m = /^var\((--[\w-]+)\)$/.exec(color);
  if (m) return cssVar(m[1]) || color;
  const x = MIX.exec(color);
  return x ? lerp(cssVar(x[1]), cssVar(x[2]), Number(x[3]) / 100) : color;
}
