/**
 * Color scales for data.
 * diverging: blue (negative) <-> red (positive), neutral gray midpoint so zeros recede.
 * sequential: one blue ramp, dark (near the background) -> light, for probabilities / similarity.
 */
const NEG = '#3987e5', POS = '#e66767', MID = '#2a2a28';
const SEQ = ['#161615', '#0d366b', '#1c5cab', '#3987e5', '#86b6ef', '#cde2fb'];

export const COLORS = {
  neg: NEG, pos: POS, mid: MID,
  accent: '#60a5fa', hot: '#f69d50', good: '#8ddb8c', bad: '#f47067', purple: '#dcbdfb',
  // muted fills for regions / fields
  slate: '#334155', green: '#14532d', blue: '#1e3a8a', amber: '#713f12', red: '#7f1d1d', violet: '#4c1d95',
};

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
