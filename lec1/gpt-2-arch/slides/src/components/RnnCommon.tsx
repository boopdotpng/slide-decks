/** @jsxImportSource preact */

/** one character, with space and newline made visible */
export function Ch({ c, class: cls = '' }: { c: string; class?: string }) {
  const shown = c === ' ' ? '·' : c === '\n' ? '↵' : c;
  return <span class={`rch ${c === ' ' || c === '\n' ? 'rch-ws' : ''} ${cls}`}>{shown}</span>;
}

export const CH_CSS = `
  .rch { font-family: var(--mono); white-space: pre; }
  .rch.rch-ws { color: var(--muted); }
`;
