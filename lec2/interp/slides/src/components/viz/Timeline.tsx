/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';

/**
 * Rows of bars on a time axis that grow in real time, left to right (from the
 * risc-v deck's out-of-order execution slide). Pass different rows per step and
 * change `run` to replay the animation:
 *
 *   <Timeline units={10} run={step} title={`${total} cycles`}
 *     rows={[{ label: 'ld t0, 0(a0)', note: 'slow', start: 0, end: 6 }, ...]} />
 */
export type TimelineRow = {
  label: ComponentChildren; note?: ComponentChildren; start: number; end: number; color?: string;
  /** done at `end` but held until this unit (e.g. waiting to commit): a hatched bar after the solid one */
  wait?: number;
};

export function Timeline({ rows, units, msPerUnit = 280, title, run = 0, after, afterTitle }: {
  rows: TimelineRow[];
  /** length of the axis (e.g. cycles); one grid cell per unit */
  units: number;
  msPerUnit?: number;
  title?: ComponentChildren;
  /** change this to regrow the bars */
  run?: string | number;
  /** extra cell per row, right of the axis (e.g. a ✓ when it finishes) */
  after?: (row: TimelineRow, i: number) => ComponentChildren;
  afterTitle?: ComponentChildren;
}) {
  return (
    <table class="timeline" style={{ '--cell': `${100 / units}%` }}><tbody>
      <tr><th></th><th class="tl-h">{title}</th>{after && <th>{afterTitle}</th>}</tr>
      {rows.map((r, i) => (
        <tr>
          <td class="tl-label">{r.label}{r.note && <span class="muted tl-note">{r.note}</span>}</td>
          <td class="tl">
            <div key={`${run}`} class="tl-bar" style={{
              left: `${(r.start / units) * 100}%`,
              width: `${((r.end - r.start) / units) * 100}%`,
              background: r.color,
              animationDelay: `${r.start * msPerUnit}ms`,
              animationDuration: `${(r.end - r.start) * msPerUnit}ms`,
            }} />
            {r.wait != null && r.wait > r.end && (
              <div key={`w${run}`} class="tl-wait" style={{
                left: `${(r.end / units) * 100}%`,
                width: `${((r.wait - r.end) / units) * 100}%`,
                animationDelay: `${r.end * msPerUnit}ms`,
                animationDuration: `${(r.wait - r.end) * msPerUnit}ms`,
              }} />
            )}
          </td>
          {after && <td class="tl-after">{after(r, i)}</td>}
        </tr>
      ))}
    </tbody></table>
  );
}
