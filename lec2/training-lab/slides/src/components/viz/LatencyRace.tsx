/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useFrame } from '../../deck/hooks';

/**
 * One dot per row bouncing out and back; each round trip is one operation, and
 * a counter shows how many each row has done (from the risc-v deck's memory
 * hierarchy slide). Starts over each time the slide is entered.
 *
 * Real time is slowed so the slowest row takes `slowMs` per trip on screen. The
 * counters use that true scale. The dots can't (at true scale fast rows are a
 * sub-frame blur), so dot speed is log-scaled between slowMs and fastMs:
 * ordered correctly, not proportional. The counters are the honest part.
 *
 *   <LatencyRace rows={[{ name: 'ssd', ns: 75_000, label: '~75 µs' }, { name: 'ram', ns: 90 }, ...]} />
 */
export type RaceRow = { name: string; ns: number; label?: string };

const fmtTime = (ns: number) =>
  ns >= 1e9 ? `${(ns / 1e9).toFixed(2)} s` : ns >= 1e6 ? `${(ns / 1e6).toFixed(2)} ms` : ns >= 1e3 ? `${(ns / 1e3).toFixed(1)} µs` : `${ns.toFixed(0)} ns`;

export function LatencyRace({ rows, slowMs = 4000, fastMs = 120, track = 'cpu ⇄ memory', count = 'reads' }: {
  rows: RaceRow[];
  slowMs?: number;
  fastMs?: number;
  /** column headers */
  track?: string;
  count?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLDivElement | null)[]>([]);
  const counts = useRef<(HTMLTableCellElement | null)[]>([]);
  const clock = useRef<HTMLDivElement>(null);

  const maxNs = Math.max(...rows.map((r) => r.ns));
  const minNs = Math.min(...rows.map((r) => r.ns));
  const nsPerMs = maxNs / slowMs; // real ns per on-screen ms
  const period = (ns: number) => {
    const f = maxNs === minNs ? 0 : Math.log(maxNs / ns) / Math.log(maxNs / minNs); // 0 = slowest, 1 = fastest
    return slowMs * Math.pow(fastMs / slowMs, f);
  };

  useFrame(root, (ms) => {
    const realNs = ms * nsPerMs;
    rows.forEach((r, i) => {
      const p = (ms % period(r.ns)) / period(r.ns);
      const x = p < 0.5 ? p * 2 : 2 - p * 2; // out and back
      dots.current[i]!.style.left = `calc(${x} * (100% - 1.4em))`;
      counts.current[i]!.textContent = Math.floor(realNs / r.ns).toLocaleString();
    });
    clock.current!.textContent = `real time: ${fmtTime(realNs)}`;
  });

  return (
    <div class="race" ref={root} data-hold={slowMs * 1.5}>
      <table><tbody>
        <tr><th></th><th class="race-h">{track}</th><th>latency</th><th class="num">{count}</th></tr>
        {rows.map((r, i) => (
          <tr>
            <td>{r.name}</td>
            <td class="race-track"><div class="line" /><div class="dot" ref={(el) => { dots.current[i] = el; }} /></td>
            <td class="muted">{r.label ?? fmtTime(r.ns)}</td>
            <td class="num" ref={(el) => { counts.current[i] = el; }}>0</td>
          </tr>
        ))}
      </tbody></table>
      <div class="muted race-clock" ref={clock} />
    </div>
  );
}
