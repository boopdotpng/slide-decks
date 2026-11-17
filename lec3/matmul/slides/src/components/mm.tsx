/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

/**
 * A matmul laid out the usual way: B above C, A to the left of C, so a row of A and a column of B meet at their cell
 * of C. Every cell is a plain <i>; the caller picks its class (in, out, hot, dim, ...) per cell, and the island styles
 * them (.mm-* classes below are shared, the colors per class are the island's).
 */
export type Cls = (r: number, c: number) => string;

export function MM({ m, n, k, a, b, c, cell = 22, names = ['A', 'B', 'C'], tag }: {
  m: number; n: number; k: number; a: Cls; b: Cls; c: Cls; cell?: number;
  names?: [ComponentChildren, ComponentChildren, ComponentChildren] | string[]; tag?: ComponentChildren;
}) {
  const grid = (rows: number, cols: number, cls: Cls) => (
    <div class="mm-g" style={{ gridTemplateColumns: `repeat(${cols}, ${cell}px)`, gridAutoRows: `${cell}px` }}>
      {Array.from({ length: rows * cols }, (_, i) => <i class={cls(Math.floor(i / cols), i % cols)} />)}
    </div>
  );
  return (
    <div class="mm">
      <div class="mm-tag">{tag}</div>
      <div class="mm-wrap">{grid(n, k, b)}<div class="mm-n">{names[1]}</div></div>
      <div class="mm-wrap">{grid(m, n, a)}<div class="mm-n">{names[0]}</div></div>
      <div class="mm-wrap">{grid(m, k, c)}<div class="mm-n">{names[2]}</div></div>
    </div>
  );
}

export const MM_CSS = `
  .mm { display: grid; grid-template-columns: auto auto; gap: 10px 14px; align-items: end; justify-content: center; }
  .mm-tag { align-self: center; justify-self: end; font-size: .44em; max-width: 9em; }
  .mm-wrap { display: flex; flex-direction: column; align-items: center; }
  .mm-g { display: grid; gap: 2px; }
  .mm-g i { border-radius: 2px; background: var(--surface); transition: background .3s, opacity .3s, box-shadow .3s; }
  .mm-n { font: .44em var(--mono); color: var(--muted); margin-top: .35em; white-space: nowrap; }
`;
