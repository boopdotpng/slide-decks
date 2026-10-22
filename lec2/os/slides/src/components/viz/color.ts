/**
 * Colors for islands. COLORS are css vars from styles/deck.css, so they work anywhere css does (style, svg fill /
 * stroke, <style> blocks); tints are color-mix(in srgb, ${COLORS.good} 30%, transparent). Canvas and WebGL can't read
 * css vars: pass colors through resolve() first (Strip and HeatCanvas already do).
 *
 * Data scales, computed here because they interpolate:
 * diverging: blue (negative) <-> red (positive), neutral gray midpoint so zeros recede.
 * sequential: one blue ramp, dark (near the background) -> light, for probabilities / similarity.
 */
// same values as --neg / --pos / --mid in deck.css
const NEG = '#3987e5', POS = '#e66767', MID = '#2a2a28';
const SEQ = ['#161615', '#0d366b', '#1c5cab', '#3987e5', '#86b6ef', '#cde2fb'];

const v = (name: string) => `var(--${name})`;
export const COLORS = {
  neg: v('neg'), pos: v('pos'), mid: v('mid'),
  accent: v('accent'), hot: v('hot'), good: v('good'), bad: v('bad'), purple: v('purple'),
  // muted fills for regions / fields
  slate: v('fill-slate'), green: v('fill-green'), blue: v('fill-blue'), amber: v('fill-amber'), red: v('fill-red'), violet: v('fill-violet'),
  // categorical: lines / series that only need to differ from each other
  series: [v('series-1'), v('series-2'), v('series-3'), v('series-4')],
};

const resolved = new Map<string, string>();
/** 'var(--x)' -> its current value (for canvas / WebGL); anything else is returned as is */
export function resolve(color: string) {
  const m = /^var\((--[\w-]+)\)$/.exec(color);
  if (!m || typeof document === 'undefined') return color;
  let c = resolved.get(m[1]);
  if (!c) resolved.set(m[1], (c = getComputedStyle(document.documentElement).getPropertyValue(m[1]).trim() || color));
  return c;
}

const hex2rgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
export const lerp = (a: string, b: string, t: number) => {
  const x = hex2rgb(a), y = hex2rgb(b);
  return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(',')})`;
};
/** v / scale, squashed with tanh so outliers don't wash everything else out */
export function diverging(v: number, scale = 1) {
  const t = Math.tanh(v / scale);
  return t < 0 ? lerp(MID, NEG, -t) : lerp(MID, POS, t);
}
/** t in [0, 1] */
export function sequential(t: number) {
  t = Math.max(0, Math.min(1, t)) * (SEQ.length - 1);
  const i = Math.min(SEQ.length - 2, Math.floor(t));
  return lerp(SEQ[i], SEQ[i + 1], t - i);
}
