/**
 * The deck's one photo, and every number the slides read off it. A made-up, underexposed dusk landscape, 128 × 80
 * grayscale (one byte per pixel, 0 = black, 255 = white): a sky, a small sun, dark hills, a lake. Generated here
 * (deterministic: a hash, not Math.random) so every island sees the same pixels.
 *
 *   the sky              ~45 … 82     brighten: × 3 → still under 255
 *   the hills, the lake  ~10 … 36     shadows: darker than 40 → doubled
 *   the sun              ~60 pixels at 250 … 255: why "scale so the brightest pixel is white" does nothing
 *
 * Pixel i is at row i / W, column i % W, like the kernels' img[i]. Blocks are 256 threads = 2 rows, waves are 32 = a
 * quarter of a row.
 */
export const W = 128, H = 80, N = W * H;
export const BLOCK = 256, WAVE = 32;
export const DARK = 40; // shadows.hip: if (p < 40)

const hash = (x: number, y: number) => {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};
const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));

/** the hills' top edge at column x, in rows from the top */
const ridge = (x: number) => 46 - 7 * Math.sin(x / 13 + 1) - 4 * Math.sin(x / 5.3) - 2 * Math.sin(x / 2.1 + 3);
const SUN = { x: 96, y: 22, r: 4.4 };
const LAKE = 64;

function pixel(x: number, y: number): number {
  const n = (hash(x, y) - 0.5) * 6;
  const dSun = Math.hypot(x - SUN.x, y - SUN.y);
  if (y >= LAKE) {
    // the lake: a dim, rippled copy of the sky above the hills
    const ry = 2 * LAKE - y - 18;
    return clamp(16 + 0.22 * (45 + ry * 0.7) + 5 * Math.sin(x / 3 + y) + n);
  }
  if (y > ridge(x)) return clamp(14 + (y - ridge(x)) * 0.35 + 6 * hash(x >> 2, y >> 2) + n); // hills
  if (dSun < SUN.r) return clamp(252 + n / 2);
  const glow = Math.max(0, 14 - dSun) * 1.4;
  return clamp(46 + y * 0.6 + glow + n); // sky: lighter toward the horizon
}

export const IMG = Uint8Array.from({ length: N }, (_, i) => pixel(i % W, Math.floor(i / W)));

/** counts per brightness, 0 … 255: what every histogram kernel should produce */
export const HIST = (() => {
  const h = new Array<number>(256).fill(0);
  for (const p of IMG) h[p]++;
  return h;
})();

/** the brightness that `frac` of the pixels are at or below */
export function percentile(frac: number) {
  let seen = 0;
  for (let v = 0; v < 256; v++) if ((seen += HIST[v]) >= frac * N) return v;
  return 255;
}
export const MAX = percentile(1);
export const P99 = percentile(0.99);
/** auto exposure: the factor the cpu picks from the histogram (the brightest 1% may clip) */
export const AUTO = Math.floor(255 / P99);

export const brighten = (img: ArrayLike<number>, a: number) => Uint8Array.from(img, (p) => Math.min(p * a, 255));
export const shadows = (img: ArrayLike<number>) => Uint8Array.from(img, (p) => (p < DARK ? p * 2 : p));

/**
 * bins[p]++ with no atomics, as a simulation. `together` waves run at once: each reads the counters, adds its 32
 * lanes' ones, and writes back, so a wave's lanes that share a bin count once (same old value, same new value), and
 * so do waves in flight together. How many waves really overlap depends on timing; the loss is always some.
 */
export function racyHist(together: number) {
  const bins = new Array<number>(256).fill(0);
  const waves = N / WAVE;
  for (let g = 0; g < waves; g += together) {
    const seen = new Set<number>();
    for (let w = g; w < Math.min(g + together, waves); w++)
      for (let l = 0; l < WAVE; l++) seen.add(IMG[w * WAVE + l]);
    for (const v of seen) bins[v]++; // everyone read the same old count, everyone wrote old + 1
  }
  return bins;
}

/** draw `img` (W × H bytes) into a canvas, one canvas pixel per image pixel; scale it up with css */
export function paint(canvas: HTMLCanvasElement | null, img: ArrayLike<number>) {
  if (!canvas) return;
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const data = ctx.createImageData(W, H);
  for (let i = 0; i < N; i++) {
    data.data[4 * i] = data.data[4 * i + 1] = data.data[4 * i + 2] = img[i];
    data.data[4 * i + 3] = 255;
  }
  ctx.putImageData(data, 0, 0);
}
