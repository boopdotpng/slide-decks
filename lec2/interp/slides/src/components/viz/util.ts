/** class for something that fades in once the step reaches s: <div class={at(step, 2)}> (styles: .fade / .fade.on in deck.css) */
export const at = (step: number, s: number) => `fade ${step >= s ? 'on' : ''}`;
/** 0.866 -> "87%" */
export const pct = (v: number) => `${Math.round(v * 100)}%`;
export const fmt = (v: number, d = 2) => (Math.abs(v) >= 100 ? v.toFixed(0) : v.toFixed(d));
export const rms = (v: number[]) => Math.sqrt(v.reduce((s, x) => s + x * x, 0) / v.length);
export const range = (n: number) => Array.from({ length: n }, (_, i) => i);
export const hex = (n: number, width = 0) => n.toString(16).padStart(width, '0');

// ── hover tooltip (one per page) ─────────────────────────────────────────────
let tipEl: HTMLDivElement | null = null;
/** tip(e, html) shows a tooltip at the mouse; tip(null) hides it */
export function tip(e: MouseEvent | null, html?: string) {
  if (!tipEl) {
    tipEl = document.createElement('div');
    tipEl.className = 'viz-tip';
    document.body.append(tipEl);
  }
  if (!e || !html) { tipEl.style.opacity = '0'; return; }
  tipEl.innerHTML = html;
  tipEl.style.opacity = '1';
  tipEl.style.left = `${e.clientX + 14}px`;
  tipEl.style.top = `${e.clientY + 14}px`;
}
