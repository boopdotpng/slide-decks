/**
 * Slide navigation.
 *
 * One .slide is .active at a time. "next" first walks through the slide's
 * steps, then moves on. A slide's steps are:
 *   - every element with class "step" (revealed one per press, in DOM order)
 *   - plus N for every element with data-steps="N" (for islands)
 * The current step is stored in section.dataset.step and announced with a
 * "slide:step" event (detail.step) on the <section>; islands read it via
 * useSlideStep (deck/hooks.ts). "slide:enter" / "slide:leave" fire when a
 * slide is shown / hidden.
 *
 * Don't mix both kinds on one slide: .step elements are revealed first.
 *
 * Keys: → / space next, ← back, g picker (type a number + enter, or ↑↓ + enter),
 * f fullscreen, p presenter window, home / end.
 *
 * The URL picks a mode:
 *   (none)      the deck
 *   ?presenter  notes, next-step preview, timer (deck/presenter.ts). Kept in sync
 *               with the deck window over a BroadcastChannel, both ways.
 *   ?embed      no ui, no keys; follows its #hash. Used for the presenter previews.
 *   ?print      every slide fully revealed, one per page: cmd+p → save as pdf.
 */
import { initPresenter } from './presenter';

export type Mode = 'main' | 'presenter' | 'embed' | 'print';

export function initDeck() {
  const q = new URLSearchParams(location.search);
  const mode: Mode = q.has('print') ? 'print' : q.has('presenter') ? 'presenter' : q.has('embed') ? 'embed' : 'main';
  document.body.classList.add(`mode-${mode}`);

  const slides = [...document.querySelectorAll<HTMLElement>('.slide')];
  const counter = document.getElementById('counter')!;
  let i = 0;

  const stepEls = (s: HTMLElement) => [...s.querySelectorAll<HTMLElement>('.step')];
  const total = (s: HTMLElement) =>
    stepEls(s).length +
    [...s.querySelectorAll<HTMLElement>('[data-steps]')].reduce((n, e) => n + Number(e.dataset.steps), 0);
  const stepOf = (s: HTMLElement) => Number(s.dataset.step ?? 0);

  if (mode === 'print') return printAll();

  // ── sync between the deck and presenter windows ───────────────────────────
  const channel = mode === 'embed' ? null : new BroadcastChannel(`deck:${location.pathname}`);
  let remote = false; // true while applying a position that came from the other window
  const listeners: (() => void)[] = [];

  function changed() {
    const k = stepOf(slides[i]);
    history.replaceState(null, '', `${location.search}#${i + 1}${k ? '.' + k : ''}`);
    if (!remote) channel?.postMessage({ slide: i, step: k });
    listeners.forEach((f) => f());
  }

  function setStep(k: number) {
    const s = slides[i];
    k = Math.max(0, Math.min(total(s), k));
    s.dataset.step = String(k);
    stepEls(s).forEach((e, j) => e.classList.toggle('shown', j < k));
    s.dispatchEvent(new CustomEvent('slide:step', { detail: { step: k } }));
    changed();
  }

  function show(n: number, atEnd = false) {
    const prevI = i;
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, j) => s.classList.toggle('active', j === i));
    counter.textContent = `${i + 1} / ${slides.length}`;
    if (prevI !== i) slides[prevI].dispatchEvent(new CustomEvent('slide:leave'));
    setStep(atEnd ? total(slides[i]) : 0);
    slides[i].dispatchEvent(new CustomEvent('slide:enter'));
  }

  function go(n: number, k: number) {
    if (n !== i) show(n);
    if (k !== stepOf(slides[i])) setStep(k);
  }

  function next() {
    const s = slides[i];
    if (stepOf(s) < total(s)) setStep(stepOf(s) + 1);
    else if (i < slides.length - 1) show(i + 1); // the end stays the end
  }

  function prev() {
    // going back lands on the previous slide fully revealed
    if (stepOf(slides[i]) > 0) setStep(stepOf(slides[i]) - 1);
    else if (i > 0) show(i - 1, true);
  }

  function fullscreen() {
    if (document.fullscreenElement) document.exitFullscreen();
    else document.documentElement.requestFullscreen();
  }

  if (channel) channel.onmessage = (e) => {
    remote = true;
    go(e.data.slide, e.data.step);
    remote = false;
  };

  // #7 = slide 7, #7.3 = slide 7 at step 3 (so a reload keeps your place)
  const fromHash = () => {
    const [n, k] = location.hash.slice(1).split('.').map(Number);
    return [(n || 1) - 1, k || 0] as const;
  };

  // ── slide picker ──────────────────────────────────────────────────────────
  const title = (s: HTMLElement) =>
    s.querySelector<HTMLElement>('[data-title]')?.dataset.title ||
    s.querySelector(':is(h1, h2):not(.notes *)')?.textContent?.trim() ||
    s.querySelector<HTMLImageElement>('img:not(.notes *)')?.alt ||
    (s.dataset.file ?? '').replace(/^\d+-|\.\w+$/g, '');

  const picker = document.createElement('div');
  picker.id = 'picker';
  picker.innerHTML = `<div class="box"><div class="typed"></div><ol></ol></div>`;
  document.body.append(picker);
  const list = picker.querySelector('ol')!;
  const typed = picker.querySelector<HTMLElement>('.typed')!;
  slides.forEach((s, j) => {
    const li = document.createElement('li');
    li.innerHTML = `<span class="n">${j + 1}</span> `;
    li.append(title(s));
    li.onclick = () => { closePicker(); show(j); };
    list.append(li);
  });
  let sel = 0;
  let digits = '';

  const pickerOpen = () => picker.classList.contains('open');
  function renderPicker() {
    [...list.children].forEach((li, j) => li.classList.toggle('sel', j === sel));
    list.children[sel]?.scrollIntoView({ block: 'nearest' });
    typed.textContent = digits ? `go to ${digits}` : 'type a number, or ↑↓ + enter';
  }
  function openPicker() {
    sel = i;
    digits = '';
    picker.classList.add('open');
    renderPicker();
  }
  function closePicker() { picker.classList.remove('open'); }
  picker.addEventListener('click', (e) => { if (e.target === picker) closePicker(); });

  function pickerKey(e: KeyboardEvent) {
    if (/^\d$/.test(e.key)) {
      digits += e.key;
      const n = Number(digits) - 1;
      if (n >= 0 && n < slides.length) sel = n;
    } else if (e.key === 'Backspace') digits = digits.slice(0, -1);
    else if (e.key === 'ArrowDown' || e.key === 'j') { sel = Math.min(slides.length - 1, sel + 1); digits = ''; }
    else if (e.key === 'ArrowUp' || e.key === 'k') { sel = Math.max(0, sel - 1); digits = ''; }
    else if (e.key === 'Enter') { closePicker(); show(sel); return; }
    else if (e.key === 'Escape' || e.key === 'g') { closePicker(); return; }
    else return;
    renderPicker();
  }

  // ── keys & buttons ────────────────────────────────────────────────────────
  if (mode !== 'embed') {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if ((e.target as HTMLElement).closest?.('input, textarea, [contenteditable]')) return;
      if (pickerOpen()) { pickerKey(e); e.preventDefault(); return; }
      switch (e.key) {
        case 'ArrowRight': case 'ArrowDown': case ' ': case 'PageDown': case 'l': case 'j':
          next(); break;
        case 'ArrowLeft': case 'ArrowUp': case 'PageUp': case 'Backspace': case 'h': case 'k':
          prev(); break;
        case 'Home': show(0); break;
        case 'End': show(slides.length - 1); break;
        case 'f': fullscreen(); break;
        case 'g': openPicker(); break;
        case 'p': if (mode === 'main') openPresenter(); break;
        default: return;
      }
      e.preventDefault();
    });

    document.getElementById('prev')!.onclick = prev;
    document.getElementById('next')!.onclick = next;
    document.getElementById('fs')!.onclick = fullscreen;
    document.getElementById('notes-btn')!.onclick = openPresenter;
    counter.onclick = openPicker;

    // show nav on mouse move, hide after 2s idle
    let t: number | undefined;
    document.addEventListener('mousemove', () => {
      document.body.classList.add('mouse');
      clearTimeout(t);
      t = window.setTimeout(() => document.body.classList.remove('mouse'), 2000);
    });
  }

  // follow the hash when it's edited by hand (and in ?embed, where the presenter sets it)
  addEventListener('hashchange', () => go(...fromHash()));

  function openPresenter() {
    open(`${location.pathname}?presenter${location.hash}`, 'deck-presenter', 'popup,width=1280,height=800');
  }

  // read the hash once: show() rewrites it
  const [n0, k0] = fromHash();
  show(n0);
  setStep(k0);

  if (mode === 'presenter') {
    initPresenter({
      slides,
      position: () => ({ slide: i, step: stepOf(slides[i]), total: total(slides[i]) }),
      onChange: (f) => listeners.push(f),
    });
  }

  // ── print: everything at once ─────────────────────────────────────────────
  function printAll() {
    for (const s of slides) {
      const k = total(s);
      s.classList.add('active');
      s.dataset.step = String(k);
      stepEls(s).forEach((e) => e.classList.add('shown'));
      // islands that hydrate later read data-step; ones already up get the event
      s.dispatchEvent(new CustomEvent('slide:step', { detail: { step: k } }));
      s.dispatchEvent(new CustomEvent('slide:enter'));
    }
  }
}
