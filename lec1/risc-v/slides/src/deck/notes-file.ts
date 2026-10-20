import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Speaker notes live in src/slides/notes.md, one section per slide:
 *
 *   # 03-bytes          ← slide file name without the extension (or a slide number)
 *   markdown…
 *
 * The presenter window edits it for you under `bun dev` (deck/notes-server.ts
 * writes it back); you can also edit it by hand. Runs in node, at build / dev
 * time only.
 */

export const NOTES_FILE = 'src/slides/notes.md';

type Parsed = { preamble: string; notes: Map<string, string>; unknown: [string, string][] };

/** names: slide file names without extension, in slide order (number keys index into it) */
function parse(text: string, names: string[]): Parsed {
  const notes = new Map<string, string>();
  const unknown: [string, string][] = [];
  let preamble = '', key: string | null = null, body: string[] = [], fence = false;
  const flush = () => {
    const md = body.join('\n').trim();
    if (key === null) preamble = md;
    else {
      const name = /^\d+$/.test(key) ? names[Number(key) - 1] : names.includes(key) ? key : undefined;
      if (name) notes.set(name, [notes.get(name), md].filter(Boolean).join('\n\n'));
      else unknown.push([key, md]);
    }
    body = [];
  };
  for (const line of text.split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const h = !fence && line.match(/^# (.+?)\s*$/);
    if (h) { flush(); key = h[1]; } else body.push(line);
  }
  flush();
  return { preamble, notes, unknown };
}

function serialize({ preamble, notes, unknown }: Parsed, names: string[]) {
  const sections = [
    ...(preamble ? [preamble] : []),
    ...names.filter((n) => notes.get(n)).map((n) => `# ${n}\n\n${notes.get(n)}`),
    ...unknown.map(([k, md]) => `# ${k}\n\n${md}`),
  ];
  return sections.join('\n\n') + '\n';
}

const load = (root: string) => {
  const f = join(root, NOTES_FILE);
  return existsSync(f) ? readFileSync(f, 'utf8') : '';
};

/** slide name → markdown; warns about sections that match no slide */
export function readNotes(root: string, names: string[]) {
  const { notes, unknown } = parse(load(root), names);
  for (const [k] of unknown) console.warn(`${NOTES_FILE}: no slide "${k}"`);
  return notes;
}

/** replace one slide's notes (empty removes the section); number keys get rewritten as names */
export function saveNote(root: string, names: string[], name: string, md: string) {
  if (!names.includes(name)) throw new Error(`no slide "${name}"`);
  const parsed = parse(load(root), names);
  if (md.trim()) parsed.notes.set(name, md.trim());
  else parsed.notes.delete(name);
  writeFileSync(join(root, NOTES_FILE), serialize(parsed, names));
}
