/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import Code from 'slides/Code';
import { useSlideStep } from 'slides/hooks';

/**
 * The cuda syntax a solution uses, one row per step: the syntax, what it does in plain words, and where it shows up
 * in the two solutions. The newest row is highlighted; rows not reached yet are hidden but keep their space.
 */
export type Row = { code: string; what: ComponentChildren; where: ComponentChildren };

export default function Syntax({ rows, whereHead }: { rows: Row[]; whereHead: string }) {
  const root = useRef<HTMLDivElement>(null);
  const k = Math.min(rows.length - 1, useSlideStep(root));
  return (
    <div class="syntax" ref={root}>
      <div class="sx-row sx-head muted"><span>syntax</span><span>what it does</span><span>{whereHead}</span></div>
      {rows.map((r, i) => (
        <div class={`sx-row ${i > k ? 'off' : ''} ${i === k ? 'now' : ''}`}>
          <div class="sx-code"><Code lang="cpp" code={r.code} /></div>
          <div class="sx-what">{r.what}</div>
          <div class="sx-where">{r.where}</div>
        </div>
      ))}
      <style>{`
        .syntax { display: grid; gap: 6px; }
        .syntax .sx-row { display: grid; grid-template-columns: 1.15fr 1.25fr 1fr; gap: 1.2em; align-items: center;
          padding: .3em .6em; border-radius: 8px; transition: opacity .3s, background .3s; }
        .syntax .sx-row.off { opacity: 0; }
        .syntax .sx-row.now { background: var(--hl); }
        .syntax .sx-head { font-size: .42em; text-transform: uppercase; letter-spacing: .1em; padding-bottom: 0; }
        .syntax .sx-code pre { margin: 0; font-size: .5em; background: transparent; padding: 0; }
        .syntax .sx-what { font-size: .58em; }
        .syntax .sx-where { font-size: .48em; color: var(--muted); }
      `}</style>
    </div>
  );
}
