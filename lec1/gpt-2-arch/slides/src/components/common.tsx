/** @jsxImportSource preact */

/** gpt-2 deck only. generic helpers (useIsland, at, Chip, pct) are in ./viz */

/**
 * The three lenses of one head. Plain words first; the slide after the walkthrough swaps in the real names.
 * Same colors everywhere: a lens, its output strip, and its label.
 */
export const LENS = {
  q: { plain: 'what i\'m looking for', name: 'query', color: 'var(--hot)' },
  k: { plain: 'what i advertise', name: 'key', color: 'var(--good)' },
  v: { plain: 'what i hand over', name: 'value', color: 'var(--purple)' },
} as const;
export type LensId = keyof typeof LENS;

/** one hue per head, 30° apart; the head we follow lands on the deck's accent blue */
export const headColor = (h: number, focus = 3) => `hsl(${((h - focus) * 30 + 213 + 360) % 360}, 72%, 64%)`;
