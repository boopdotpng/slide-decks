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
 * Keys: → / space next, ← back, g slide grid (arrows / click, or type a number, then enter),
 * f fullscreen, p presenter window, t theme (auto → light → dark), home / end.
 *
 * Touch (phones, tablets, touch screens): tap anywhere on the slide for next, swipe left / right for
 * next / back. The nav stays on screen (dimmed between touches), the counter opens the slide grid,
 * which has a "go to" number box, and the notes button is hidden. Taps on links, buttons, inputs or
 * anything inside [data-no-advance] are left alone, so an island can take its own taps.
 *
 * The URL picks a mode:
 *   (none)      the deck
 *   ?presenter  notes, next-step preview (deck/presenter.ts). Kept in sync
 *               with the deck window over a BroadcastChannel, both ways.
 *   ?embed      no ui, no keys; follows its #hash. Used for the presenter previews.
 *   ?print      every slide fully revealed, one per page: cmd+p → save as pdf.
 *   ?overview   every slide fully revealed, as a grid of thumbnails. The g picker
 *               is this page in an iframe, driven through window.deckOverview.
 */
import { initPresenter } from './presenter';

export type Mode = 'main' | 'presenter' | 'embed' | 'print' | 'overview';

export function initDeck() {
  const q = new URLSearchParams(location.search);
  const mode: Mode = q.has('print') ? 'print' : q.has('overview') ? 'overview' : q.has('presenter') ? 'presenter' : q.has('embed') ? 'embed' : 'main';
  document.body.classList.add(`mode-${mode}`);

  const slides = [...document.querySelectorAll<HTMLElement>('.slide')];
  const counter = document.getElementById('counter')!;
  let i = 0;

  const stepEls = (s: HTMLElement) => [...s.querySelectorAll<HTMLElement>('.step')];
  const total = (s: HTMLElement) =>
    stepEls(s).length +
    [...s.querySelectorAll<HTMLElement>('[data-steps]')].reduce((n, e) => n + Number(e.dataset.steps), 0);
  const stepOf = (s: HTMLElement) => Number(s.dataset.step ?? 0);

  // a slide's name in the picker
  const title = (s: HTMLElement) =>
    s.querySelector<HTMLElement>('[data-title]')?.dataset.title ||
    s.querySelector(':is(h1, h2):not(.notes *)')?.textContent?.trim() ||
    s.querySelector<HTMLImageElement>('img:not(.notes *)')?.alt ||
    (s.dataset.file ?? '').replace(/^\d+-|\.\w+$/g, '');

  if (mode === 'print') return printAll();
  if (mode === 'overview') return overview();

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
    counter.title = `${slides[i].dataset.file} · go to slide (g)`;
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

  // theme switch: the state lives in index.astro's inline script (window.deckTheme), which applies it before paint
  const THEMES = ['auto', 'light', 'dark'] as const;
  const theme = (window as unknown as { deckTheme: { get(): string; set(t: string): void } }).deckTheme;
  const themeBtn = document.getElementById('theme')!;
  const showTheme = () => { themeBtn.textContent = theme.get(); };
  function cycleTheme() {
    theme.set(THEMES[(THEMES.indexOf(theme.get() as (typeof THEMES)[number]) + 1) % THEMES.length]);
    showTheme();
  }
  showTheme();
  addEventListener('deck:theme', showTheme);
  addEventListener('storage', showTheme); // a pref change that keeps the same look (dark -> auto) fires no deck:theme

  // safari on ipad only has the webkit-prefixed api; iphones have none (the button is hidden there, see below)
  type FsDoc = Document & { webkitFullscreenEnabled?: boolean; webkitFullscreenElement?: Element; webkitExitFullscreen?: () => void };
  type FsEl = HTMLElement & { webkitRequestFullscreen?: () => void };
  const fsDoc = document as FsDoc, fsRoot = document.documentElement as FsEl;
  const canFullscreen = !!(fsDoc.fullscreenEnabled || fsDoc.webkitFullscreenEnabled);
  function fullscreen() {
    if (!canFullscreen) return;
    if (fsDoc.fullscreenElement || fsDoc.webkitFullscreenElement) (fsDoc.exitFullscreen ?? fsDoc.webkitExitFullscreen)?.call(fsDoc);
    else (fsRoot.requestFullscreen ?? fsRoot.webkitRequestFullscreen)?.call(fsRoot);
  }

  if (channel) channel.onmessage = (e) => {
    remote = true;
    go(e.data.slide, e.data.step);
    remote = false;
  };

  // #7 = slide 7, #7.3 = slide 7 at step 3 (so a reload keeps your place); #22-recap.3 = by file name
  const fileOf = (s: HTMLElement) => (s.dataset.file ?? '').replace(/\.\w+$/, '');
  const fromHash = () => {
    const [at, k] = decodeURIComponent(location.hash.slice(1)).split(/\.(?=\d+$)/);
    const n = /^\d*$/.test(at) ? Number(at) || 1 : slides.findIndex((s) => fileOf(s) === at) + 1 || 1;
    return [n - 1, Number(k) || 0] as const;
  };

  // ── slide picker: a grid of every slide, fully revealed ────────────────────
  // The thumbnails are the deck itself at ?overview in an iframe (live islands, final step), made on the
  // first g and kept. Keys stay here; the iframe just draws the grid (see overview() below).
  const picker = document.createElement('div');
  picker.id = 'picker';
  picker.innerHTML = `<div class="box">
    <div class="bar"><div class="typed"></div>
      <form class="goto"><input type="number" inputmode="numeric" enterkeyhint="go" min="1" placeholder="go to #" aria-label="go to slide"></form>
      <button type="button" class="close" aria-label="close">✕</button></div>
    <div class="grid"><span class="loading">loading…</span></div></div>`;
  document.body.append(picker);
  const typed = picker.querySelector<HTMLElement>('.typed')!;
  const gotoForm = picker.querySelector<HTMLFormElement>('.goto')!;
  const gotoInput = gotoForm.querySelector('input')!;
  let frame: HTMLIFrameElement | undefined;
  let grid: Overview | undefined; // set once the iframe has loaded
  let sel = 0;
  let digits = '';

  const pickerOpen = () => picker.classList.contains('open');
  function renderPicker() {
    grid?.select(sel, i);
    typed.innerHTML = digits ? `go to <b>${digits}</b>` :
      `<b>${sel + 1}</b> / ${slides.length}<span class="hint-keys">arrows or a number, then enter · esc to close</span>` +
      `<span class="hint-touch">tap a slide</span>`;
  }
  function openPicker() {
    sel = i;
    digits = '';
    picker.classList.add('open');
    if (!frame) {
      frame = document.createElement('iframe');
      frame.src = `${location.pathname}?overview`;
      frame.onload = () => {
        const w = frame!.contentWindow as Window & { deckOverview?: Overview };
        grid = w.deckOverview;
        if (!grid) return;
        grid.onPick = (j) => { closePicker(); show(j); };
        // keys typed after clicking into the grid
        w.addEventListener('keydown', (e) => { if (pickerOpen()) { pickerKey(e); e.preventDefault(); } });
        if (pickerOpen()) grid.open();
        renderPicker();
      };
      picker.querySelector('.grid')!.append(frame);
    }
    grid?.open();
    renderPicker();
  }
  function closePicker() {
    picker.classList.remove('open');
    gotoInput.value = '';
    gotoInput.blur();
    grid?.close();
    frame?.blur();
    window.focus();
  }
  picker.addEventListener('click', (e) => { if (e.target === picker) closePicker(); });
  picker.querySelector<HTMLElement>('.close')!.onclick = closePicker;
  // the go-to box (shown on touch screens, where there's no number row to type on): same clamping as typed digits
  gotoForm.onsubmit = (e) => {
    e.preventDefault();
    const n = Number(gotoInput.value);
    if (!gotoInput.value || Number.isNaN(n)) return;
    closePicker();
    show(Math.max(0, Math.min(slides.length - 1, n - 1)));
  };
  gotoInput.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePicker(); });

  function pickerKey(e: KeyboardEvent) {
    const move = (d: number) => { sel = Math.max(0, Math.min(slides.length - 1, sel + d)); digits = ''; };
    const cols = grid?.cols() ?? 1;
    // typed numbers clamp into range: 0 is the first slide, too big is the last
    const typedSel = () => { if (digits) sel = Math.max(0, Math.min(slides.length - 1, Number(digits) - 1)); };
    if (/^\d$/.test(e.key)) { digits += e.key; typedSel(); }
    else if (e.key === 'Backspace') { digits = digits.slice(0, -1); typedSel(); }
    else if (e.key === 'ArrowRight' || e.key === 'l') move(1);
    else if (e.key === 'ArrowLeft' || e.key === 'h') move(-1);
    else if (e.key === 'ArrowDown' || e.key === 'j') move(cols);
    else if (e.key === 'ArrowUp' || e.key === 'k') move(-cols);
    else if (e.key === 'Home') move(-sel);
    else if (e.key === 'End') move(slides.length);
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
        case 't': cycleTheme(); break;
        case 'g': openPicker(); break;
        case 'p': if (mode === 'main') openPresenter(); break;
        default: return;
      }
      e.preventDefault();
    });

    document.getElementById('prev')!.onclick = prev;
    document.getElementById('next')!.onclick = next;
    const fsBtn = document.getElementById('fs')!;
    fsBtn.onclick = fullscreen;
    fsBtn.hidden = !canFullscreen;
    themeBtn.onclick = cycleTheme;
    document.getElementById('notes-btn')!.onclick = openPresenter;
    counter.onclick = openPicker;

    // the nav shows on mouse move / touch and fades after 2s idle (to hidden with a mouse, dimmed on touch).
    // pointer events, not mousemove: ios fires a fake mousemove on every tap
    let t: number | undefined;
    const wake = () => {
      document.body.classList.add('ui');
      clearTimeout(t);
      t = window.setTimeout(() => document.body.classList.remove('ui'), 2000);
    };
    // body.touch: the last pointer was a finger (or a pen), so the ui is sized and shown for touch. Starts from what
    // the device is; a touch laptop switches back and forth as you use the mouse or the screen
    const setTouch = (on: boolean) => document.body.classList.toggle('touch', on);
    setTouch(matchMedia('(hover: none) and (pointer: coarse)').matches);
    document.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      if (e.movementX || e.movementY) { setTouch(false); wake(); }
    });

    // ── touch: tap anywhere for next, swipe left / right for next / back ───
    const SWIPE = 40, TAP = 12, TAP_MS = 600;
    let start: { x: number; y: number; t: number } | null = null;
    let fingers = 0;
    // taps meant for something on the slide (or the nav, or the grid) aren't page turns
    const ownTap = (el: EventTarget | null) => !(el instanceof Element) ||
      !!el.closest('a, button, input, select, textarea, label, summary, [contenteditable], [data-no-advance], #nav, #picker');
    document.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'mouse' || mode !== 'main') return;
      setTouch(true);
      wake();
      if (e.isPrimary) fingers = 0; // the first finger down: forget any lift we missed
      fingers++;
      // a second finger (pinch-zoom) cancels the gesture
      start = fingers === 1 && !pickerOpen() && !ownTap(e.target) ? { x: e.clientX, y: e.clientY, t: e.timeStamp } : null;
    });
    const lift = () => { fingers = Math.max(0, fingers - 1); };
    document.addEventListener('pointercancel', (e) => { if (e.pointerType !== 'mouse') { lift(); start = null; } });
    document.addEventListener('pointerup', (e) => {
      if (e.pointerType === 'mouse' || mode !== 'main') return;
      lift();
      const s = start;
      start = null;
      if (!s || fingers) return;
      const dx = e.clientX - s.x, dy = e.clientY - s.y;
      const zoomed = (visualViewport?.scale ?? 1) > 1.05; // pinch-zoomed in: a drag is looking around, not a swipe
      if (!zoomed && Math.abs(dx) > SWIPE && Math.abs(dx) > 1.5 * Math.abs(dy)) dx < 0 ? next() : prev();
      else if (Math.hypot(dx, dy) < TAP && e.timeStamp - s.t < TAP_MS) next();
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
  function revealAll() {
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
  function printAll() { revealAll(); }

  // ── overview (?overview): the g picker's grid ─────────────────────────────
  // Every slide fully revealed and scaled down into a grid, each with a clickable frame and its title under it.
  // Slides stay where astro put them (moving them would re-hydrate islands); they're positioned absolutely.
  function overview() {
    const stage = document.getElementById('stage')!;
    const cells = slides.map((s, j) => {
      const cell = document.createElement('div');
      cell.className = 'ov-cell';
      cell.innerHTML = `<div class="ov-label"><span class="n">${j + 1}</span> </div>`;
      cell.firstElementChild!.append(title(s));
      cell.title = s.dataset.file ?? '';
      cell.onclick = () => api.onPick(j);
      stage.append(cell);
      return cell;
    });

    // thumbnails about 300px wide, slides scaled by t; --k = t so islands measure in canvas px (deckScale)
    const GAP = 20, PAD = 20, LABEL = 28;
    let cols = 1;
    function layout() {
      const w = document.documentElement.clientWidth;
      if (w < 100) return; // hidden
      cols = Math.max(2, Math.floor((w - 2 * PAD + GAP) / (300 + GAP)));
      const cw = (w - 2 * PAD - (cols - 1) * GAP) / cols, ch = cw * 9 / 16, t = cw / 1600;
      document.documentElement.style.setProperty('--k', String(t));
      slides.forEach((s, j) => {
        const x = PAD + (j % cols) * (cw + GAP), y = PAD + Math.floor(j / cols) * (ch + LABEL + GAP);
        s.style.transform = `translate(${x}px, ${y}px) scale(${t})`;
        Object.assign(cells[j].style, { left: `${x}px`, top: `${y}px`, width: `${cw}px`, height: `${ch}px` });
      });
      stage.style.height = `${2 * PAD + Math.ceil(slides.length / cols) * (ch + LABEL + GAP)}px`;
    }
    layout();
    addEventListener('resize', layout);

    revealAll();
    // islands run (timers, frames) only while the grid is open
    const setActive = (on: boolean) => slides.forEach((s) => {
      if (s.classList.contains('active') === on) return;
      s.classList.toggle('active', on);
      s.dispatchEvent(new CustomEvent(on ? 'slide:enter' : 'slide:leave'));
    });
    setActive(false);

    const api: Overview = {
      onPick: () => {},
      cols: () => cols,
      open() { layout(); setActive(true); },
      close() { setActive(false); },
      select(j, current) {
        cells.forEach((c, n) => { c.classList.toggle('sel', n === j); c.classList.toggle('cur', n === current); });
        // scroll it into view (scrollIntoView could scroll the deck behind the iframe too)
        const c = cells[j], el = document.scrollingElement!;
        if (!c) return;
        const top = c.offsetTop - PAD, bottom = c.offsetTop + c.offsetHeight + LABEL + PAD;
        if (top < el.scrollTop) el.scrollTop = top;
        else if (bottom > el.scrollTop + innerHeight) el.scrollTop = bottom - innerHeight;
      },
    };
    (window as Window & { deckOverview?: Overview }).deckOverview = api;
  }
}

type Overview = {
  onPick: (slide: number) => void;
  cols: () => number;
  open: () => void;
  close: () => void;
  select: (slide: number, current: number) => void;
};
