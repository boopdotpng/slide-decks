/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

/**
 * Tiny syntax highlighter: asm, c / c++, python. Works the same in static
 * .astro slides and in islands. Line-at-a-time, so no multi-line strings or
 * block comments spanning lines.
 *
 *   <Code lang="asm" code={`li a0, 1   # stdout`} />
 *   <Code lang="c" code={src} hl={[3, 4]} />     // highlight lines 3-4 (0-based), dim the rest
 *
 * Adding a language: write a fooLine(line) that returns tokens, add it to LANGS.
 */

export type Lang = 'asm' | 'c' | 'cpp' | 'py';

const tok = (cls: string, s: string) => <span class={`tok-${cls}`}>{s}</span>;

// ── asm (risc-v, plus common x86 / arm register names) ───────────────────────
const REG = new RegExp('^(' + [
  'x([12]?\\d|3[01])', 'zero', 'ra', 'sp', 'gp', 'tp', 'fp', 't[0-6]', 's([0-9]|1[01])', 'a[0-7]', // risc-v
  'f([12]?\\d|3[01])', 'f[ast]\\d+', 'pc',
  '[re]?[abcd]x', '[abcd][lh]', '[re]?[sd]il?', '[re]?[sb]pl?', 'r(8|9|1[0-5])[dwb]?', '[re]ip', // x86
  'xmm\\d+', 'ymm\\d+', 'zmm\\d+',
  '[wx]([12]?\\d|30)', 'xzr', 'wzr', 'lr', '[vqdsh]([12]?\\d|3[01])', // arm64
].join('|') + ')$');

function asmLine(line: string): ComponentChildren[] {
  // comment: # (not an arm immediate like #4), ; or //, outside a string
  let inStr = false, ci = -1;
  for (let j = 0; j < line.length; j++) {
    const c = line[j];
    if (c === '"' && line[j - 1] !== '\\') inStr = !inStr;
    else if (inStr) continue;
    else if ((c === '#' && !/[-\d]/.test(line[j + 1] ?? '')) || c === ';' || (c === '/' && line[j + 1] === '/')) { ci = j; break; }
  }
  const code = ci < 0 ? line : line.slice(0, ci);
  const out: ComponentChildren[] = [];
  let first = true; // the first word is the mnemonic or directive
  for (const m of code.matchAll(/(\s+)|("(?:\\.|[^"])*")|(\.[a-z]\w*)|([A-Za-z_.$][\w.$]*:)|([#$]?-?0x[0-9a-fA-F_]+|[#$]?-?\d+)|(%?[A-Za-z_][\w.]*)|(.)/g)) {
    const [s, ws, str, dir, label, num, ident] = m;
    if (ws) out.push(s);
    else if (str) out.push(tok('str', s));
    else if (dir && first) { out.push(tok('dir', s)); first = false; }
    else if (label) out.push(tok('label', s));
    else if (num) out.push(tok('num', s));
    else if (ident) {
      if (first) { out.push(tok('kw', s)); first = false; }
      else out.push(tok(REG.test(s.replace(/^%/, '')) ? 'reg' : 'sym', s));
    } else out.push(s);
  }
  if (ci >= 0) out.push(tok('com', line.slice(ci)));
  return out;
}

// ── c / c++ ──────────────────────────────────────────────────────────────────
const C_KW = new Set([
  'while', 'for', 'do', 'if', 'else', 'switch', 'case', 'break', 'continue', 'return', 'default', 'goto',
  'sizeof', 'typedef', 'struct', 'union', 'enum', 'static', 'const', 'volatile', 'extern', 'inline', 'register',
  'restrict', 'true', 'false', 'NULL',
  // c++
  'class', 'public', 'private', 'protected', 'template', 'typename', 'namespace', 'using', 'new', 'delete',
  'virtual', 'override', 'final', 'constexpr', 'consteval', 'noexcept', 'nullptr', 'this', 'operator', 'friend',
  'try', 'catch', 'throw', 'static_cast', 'reinterpret_cast', 'const_cast', 'dynamic_cast', 'co_await', 'co_return',
]);
const C_TYPE = /^(void|bool|char|short|int|long|float|double|signed|unsigned|auto|size_t|ssize_t|uintptr_t|[iu](8|16|32|64)|u?int(8|16|32|64)_t|f(16|32|64)|std)$/;

function cLine(line: string): ComponentChildren[] {
  const out: ComponentChildren[] = [];
  for (const m of line.matchAll(/(\/\/.*|\/\*.*?\*\/)|(^\s*#\s*\w+)|("(?:\\.|[^"])*"|'(?:\\.|[^'])*')|(0x[0-9a-fA-F']+[uUlL]*|\d[\d']*\.?\d*(?:e-?\d+)?[uUlLf]*)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+|.)/g)) {
    const [s, com, pre, str, num, fn, ident] = m;
    if (com) out.push(tok('com', s));
    else if (pre) out.push(tok('dir', s));
    else if (str) out.push(tok('str', s));
    else if (num) out.push(tok('num', s));
    else if (fn) out.push(C_KW.has(s) ? tok('kw', s) : tok('fn', s));
    else if (ident) out.push(C_KW.has(s) ? tok('kw', s) : C_TYPE.test(s) ? tok('type', s) : s);
    else out.push(s);
  }
  return out;
}

// ── python ───────────────────────────────────────────────────────────────────
const PY_KW = new Set([
  'def', 'class', 'return', 'yield', 'for', 'while', 'in', 'if', 'elif', 'else', 'not', 'and', 'or', 'is',
  'None', 'True', 'False', 'import', 'from', 'as', 'lambda', 'with', 'try', 'except', 'finally', 'raise',
  'pass', 'break', 'continue', 'global', 'nonlocal', 'assert', 'del', 'async', 'await', 'self',
]);

function pyLine(line: string): ComponentChildren[] {
  const out: ComponentChildren[] = [];
  for (const m of line.matchAll(/(#.*)|(@[\w.]+)|([rbf]?"(?:\\.|[^"])*"|[rbf]?'(?:\\.|[^'])*')|(\d[\d_]*\.?\d*(?:e-?\d+)?)|([A-Za-z_]\w*)(?=\s*\()|([A-Za-z_]\w*)|(\s+|.)/g)) {
    const [s, com, deco, str, num, fn, ident] = m;
    if (com) out.push(tok('com', s));
    else if (deco) out.push(tok('dir', s));
    else if (str) out.push(tok('str', s));
    else if (num) out.push(tok('num', s));
    else if (fn) out.push(PY_KW.has(s) ? tok('kw', s) : tok('fn', s));
    else if (ident) out.push(PY_KW.has(s) ? tok('kw', s) : s);
    else out.push(s);
  }
  return out;
}

const LANGS: Record<Lang, (line: string) => ComponentChildren[]> = { asm: asmLine, c: cLine, cpp: cLine, py: pyLine };

/** One line, as tokens. Use it inline: <code>{highlight('add t0, t1, t2', 'asm')}</code> */
export function highlight(line: string, lang: Lang) {
  return LANGS[lang](line);
}

type Props = {
  code: string;
  lang: Lang;
  /** 0-based line numbers to highlight; the other lines are dimmed */
  hl?: number[];
  class?: string;
};

export default function Code({ code, lang, hl, class: cls = '' }: Props) {
  // template literals usually start with a newline right after the backtick
  const lines = code.replace(/^\n|\n\s*$/g, '').split('\n');
  const on = new Set(hl ?? []);
  return (
    <pre class={`code ${on.size ? 'has-hl' : ''} ${cls}`}>
      {lines.map((l, j) => (
        <div class={`ln ${on.has(j) ? 'hl' : ''}`}>{l ? highlight(l, lang) : ' '}</div>
      ))}
    </pre>
  );
}
