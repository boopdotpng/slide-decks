/**
 * Every structural change to src/slides goes through here, so the one rule holds: a file's number is its slide
 * number (the #N in the URL, the counter, the grid). "Slide 22" is src/slides/22-*.
 *
 *   bun run slides                          # list: number, file, title, steps, notes?
 *   bun run slides 22                       # path of slide 22 (also takes a file name or the part after the number)
 *   bun run slides new loss --after 7       # 08-loss.astro, everything after moves up one; --at 3, --mdx, default: last
 *   bun run slides mv 12 --after 3          # 12-x becomes 04-x; --at 3 too
 *   bun run slides rename 12 cross-entropy  # 12-loss -> 12-cross-entropy
 *   bun run slides rm 12                    # delete it, close the gap
 *   bun run slides renumber [--dry]         # after adding / renaming files by hand
 *   bun run slides check                    # fails if a file's number isn't its slide number (bun run check runs it)
 *
 * Slides are given as a number, a file name (with or without extension) or its name part (`loss` for 08-loss).
 * Renames use `git mv` inside a git repo, and the `#` headings in notes.md follow their slides (number headings get
 * rewritten as names); rm drops the slide's section.
 */
import { readdirSync, readFileSync, writeFileSync, renameSync, existsSync, unlinkSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { parseArgs } from 'node:util';

const dir = resolve(import.meta.dirname, '../src/slides');
const NOTES = join(dir, 'notes.md');
const stem = (f) => f.replace(/\.\w+$/, '');
const ext = (f) => f.match(/\.\w+$/)[0];
const bare = (f) => f.replace(/^\d+[a-z]*-/, ''); // 05c-embed.astro -> embed.astro

/** slide files in deck order (the same as pages/index.astro) */
const slideFiles = () =>
  readdirSync(dir).filter((f) => /^[^.].*\.(astro|mdx)$/.test(f)).sort((a, b) => a.localeCompare(b));

function find(ref, files = slideFiles()) {
  const r = String(ref).replace(/\.(astro|mdx)$/, '');
  const i = /^\d+$/.test(r) ? Number(r) - 1
    : [stem, (f) => stem(bare(f))].map((key) => files.findIndex((f) => key(f) === r)).find((j) => j >= 0) ?? -1;
  if (!(i >= 0 && i < files.length)) die(`no slide ${ref} (there are ${files.length}: bun run slides)`);
  return i;
}

function die(msg) { console.error(msg); process.exit(1); }

// ── notes.md: one "# name" section per slide ───────────────────────────────
/** rewrite each heading: map(key) -> new key, null drops the section, undefined keeps it */
function rewriteNotes(map) {
  if (!existsSync(NOTES)) return;
  let fence = false, drop = false;
  const out = [];
  for (const line of readFileSync(NOTES, 'utf8').split('\n')) {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const h = !fence && line.match(/^# (.+?)\s*$/);
    if (h) {
      const to = map(h[1]);
      drop = to === null;
      if (!drop) out.push(to ? `# ${to}` : line);
    } else if (!drop) out.push(line);
  }
  writeFileSync(NOTES, out.join('\n').replace(/\n{3,}/g, '\n\n'));
}

function noteKeys() {
  if (!existsSync(NOTES)) return [];
  let fence = false;
  return readFileSync(NOTES, 'utf8').split('\n').flatMap((line) => {
    if (/^\s*(```|~~~)/.test(line)) fence = !fence;
    const h = !fence && line.match(/^# (.+?)\s*$/);
    return h ? [h[1]] : [];
  });
}

// ── the one operation everything else is ──────────────────────────────────
/**
 * Make src/slides be `order`: [current file name (or a new dot file), name part with extension][], in deck order,
 * numbered 01-, 02-, …. `drop`: files to delete. Moves files (git mv when tracked) and fixes notes.md.
 */
function apply(order, { drop = [], dry = false, quiet = false } = {}) {
  const old = slideFiles(); // what notes.md's number headings mean
  const width = Math.max(2, String(order.length).length);
  const renames = order.map(([from, name], i) => [from, `${String(i + 1).padStart(width, '0')}-${name}`]);
  const dup = renames.map(([, b]) => b).find((b, i, all) => all.indexOf(b) !== i);
  if (dup) die(`two slides would be named ${dup}`);
  const todo = renames.filter(([a, b]) => a !== b && !a.startsWith('.new-'));
  if (!quiet) for (const [a, b] of todo) console.log(`${a.padEnd(32)} -> ${b}`);
  if (dry) return renames;

  const run = (args) => execFileSync('git', ['-C', dir, ...args], { stdio: 'ignore' });
  const ok = (args) => { try { run(args); return true; } catch { return false; } };
  const git = ok(['rev-parse']);
  const tracked = (f) => git && ok(['ls-files', '--error-unmatch', f]);
  const mv = (a, b) => (tracked(a) ? run(['mv', a, b]) : renameSync(join(dir, a), join(dir, b)));
  for (const f of drop) tracked(f) ? run(['rm', '-q', '-f', f]) : unlinkSync(join(dir, f));
  // two passes, so 02-x -> 03-x can't land on a 03-y that hasn't moved yet
  const moving = renames.filter(([a, b]) => a !== b);
  moving.forEach(([a], i) => mv(a, `.mv-${i}-${a}`));
  moving.forEach(([a, b], i) => mv(`.mv-${i}-${a}`, b));

  const names = new Map(renames.map(([a, b]) => [stem(a), stem(b)]));
  const gone = new Set(drop.map(stem));
  rewriteNotes((key) => {
    const k = /^\d+$/.test(key) ? (old[Number(key) - 1] && stem(old[Number(key) - 1])) : key;
    return gone.has(k) ? null : names.get(k);
  });
  return renames;
}

const current = () => slideFiles().map((f) => [f, bare(f)]);
const clean = (s) => s.toLowerCase().replace(/\.(astro|mdx)$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** where --after / --at put something, as an index into `files` (default: the end) */
function position(opt, files) {
  if (opt.at) return Math.max(0, Math.min(files.length, Number(opt.at) - 1));
  if (opt.after) return find(opt.after, files) + 1;
  return files.length;
}

// ── commands ──────────────────────────────────────────────────────────────
const { values: opt, positionals: [cmd, ...args] } = parseArgs({
  allowPositionals: true,
  options: { after: { type: 'string' }, at: { type: 'string' }, mdx: { type: 'boolean' }, dry: { type: 'boolean' } },
});

const titleOf = (src) =>
  src.match(/data-title="([^"]+)"/)?.[1] ??
  src.match(/<h[12][^>]*>([\s\S]*?)<\/h[12]>/)?.[1].replace(/<[^>]+>|\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim() ??
  src.match(/^#{1,2} (.+)$/m)?.[1] ?? '';
// a guess from the source (components can add steps the file doesn't show): .step elements + data-steps
const stepsOf = (src) =>
  (src.match(/class(Name)?="[^"]*\bstep\b[^"]*"/g) ?? []).length +
  [...src.matchAll(/data-steps=["{]?(\d+)/g)].reduce((n, m) => n + Number(m[1]), 0);

const commands = {
  ls() {
    const files = slideFiles(), notes = new Set(noteKeys());
    const w = Math.max(...files.map((f) => f.length));
    for (const [i, f] of files.entries()) {
      const src = readFileSync(join(dir, f), 'utf8');
      const hasNotes = notes.has(stem(f)) || notes.has(String(i + 1)) || /class="notes"/.test(src);
      console.log(`${String(i + 1).padStart(3)}  ${f.padEnd(w)}  ${String(stepsOf(src)).padStart(2)} steps${hasNotes ? '  notes' : '       '}  ${titleOf(src)}`);
    }
  },
  new() {
    const name = clean(args[0] ?? '') || die('usage: bun run slides new <name> [--after N | --at N] [--mdx]');
    const e = opt.mdx ? '.mdx' : '.astro', tmp = `.new-${name}${e}`;
    const order = current();
    if (order.some(([, b]) => stem(b) === name)) die(`there's already a slide called ${name}`);
    const at = position(opt, order.map(([f]) => f));
    const t = name.replace(/-/g, ' ');
    writeFileSync(join(dir, tmp), opt.mdx
      ? `<header>\n  <h2>${t}</h2>\n</header>\n\n- \n`
      : `---\n---\n<header>\n  <h2>${t}</h2>\n  <p class="sub"></p>\n</header>\n`);
    order.splice(at, 0, [tmp, name + e]);
    const r = apply(order, { quiet: true });
    report(r, `src/slides/${r[at][1]}  (slide ${at + 1})`);
  },
  mv() {
    const order = current(), i = find(args[0] ?? die('usage: bun run slides mv <slide> --after N | --at N'));
    if (!opt.after && !opt.at) die('where to? --after N or --at N');
    // --after counts in the numbers you see now, before the slide is taken out
    const a = opt.at ? -1 : find(opt.after);
    if (a === i) die(`${args[0]} can't go after itself`);
    const [it] = order.splice(i, 1);
    const at = opt.at ? position(opt, order) : a < i ? a + 1 : a;
    order.splice(at, 0, it);
    const r = apply(order, { quiet: true });
    report(r, `${it[0]} -> src/slides/${r[at][1]}  (slide ${at + 1})`);
  },
  rename() {
    const order = current(), i = find(args[0] ?? die('usage: bun run slides rename <slide> <new name>'));
    const name = clean(args[1] ?? '') || die('usage: bun run slides rename <slide> <new name>');
    order[i][1] = name + ext(order[i][0]);
    const r = apply(order, { quiet: true });
    report(r, `${order[i][0]} -> src/slides/${r[i][1]}`);
  },
  rm() {
    const order = current(), i = find(args[0] ?? die('usage: bun run slides rm <slide>'));
    const [[f]] = order.splice(i, 1);
    const r = apply(order, { drop: [f], quiet: true });
    report(r, `deleted ${f}`);
  },
  renumber() {
    const r = apply(current(), { dry: opt.dry });
    if (r.every(([a, b]) => a === b)) console.log('already numbered');
  },
  check() {
    const files = slideFiles(), off = files.filter((f, i) => f !== `${String(i + 1).padStart(Math.max(2, String(files.length).length), '0')}-${bare(f)}`);
    const known = new Set(files.map(stem));
    const stale = noteKeys().filter((k) => !(known.has(k) || (/^\d+$/.test(k) && Number(k) >= 1 && Number(k) <= files.length)));
    if (stale.length) console.warn(`notes.md: no slide for ${stale.map((k) => `# ${k}`).join(', ')}`);
    if (off.length) die(`slide files not numbered by position (${off.slice(0, 3).join(', ')}${off.length > 3 ? ', …' : ''}): bun run slides renumber`);
  },
};

function report(renames, what) {
  const n = renames.filter(([a, b]) => a !== b && !a.startsWith('.new-')).length;
  console.log(what + (n > 1 ? `  (${n} files renumbered)` : ''));
}

if (!cmd || cmd === 'ls') commands.ls();
else if (commands[cmd]) commands[cmd]();
else console.log(join('src/slides', slideFiles()[find(cmd)]));
