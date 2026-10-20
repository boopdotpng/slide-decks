/**
 * Presenter view (?presenter, opened with p from the deck).
 *
 * The page still holds the whole deck (hidden), so navigation and step counting
 * are the same code as the deck window. On top it shows:
 *   - the current slide and what the next press will show, as ?embed iframes
 *   - the slide's notes: every <aside class="notes"> in it, then its section of
 *     src/slides/notes.md as markdown. Under `bun dev`, click the notes (or press e)
 *     to edit that section; it saves as you type (deck/notes-server.ts). esc to finish.
 *   - elapsed time (click to reset) and the clock
 */
import { marked } from 'marked';

// slides are laid out at this size in the previews, then scaled to fit
const W = 1600, H = 900;

type Pos = { slide: number; step: number; total: number };

export function initPresenter({ slides, position, onChange }: {
  slides: HTMLElement[];
  position: () => Pos;
  onChange: (f: () => void) => void;
}) {
  const root = document.createElement('div');
  root.id = 'presenter';
  root.innerHTML = `
    <div class="pv-main"><div class="pv-frame"><iframe tabindex="-1"></iframe></div></div>
    <div class="pv-side">
      <div class="pv-label">next</div>
      <div class="pv-frame pv-next"><iframe tabindex="-1"></iframe><div class="pv-end">end</div></div>
      <div class="pv-meta">
        <span class="pv-pos"></span>
        <span class="pv-timer" title="click to reset">0:00</span>
        <span class="pv-clock"></span>
      </div>
      <div class="pv-label">notes <span class="pv-save"></span></div>
      <div class="pv-notes"></div>
      <textarea class="pv-edit" spellcheck="true" hidden></textarea>
    </div>`;
  document.body.append(root);

  const [cur, nxt] = [...root.querySelectorAll('iframe')];
  const end = root.querySelector<HTMLElement>('.pv-end')!;
  const pos = root.querySelector<HTMLElement>('.pv-pos')!;
  const notes = root.querySelector<HTMLElement>('.pv-notes')!;
  const edit = root.querySelector<HTMLTextAreaElement>('.pv-edit')!;
  const saveState = root.querySelector<HTMLElement>('.pv-save')!;
  const timer = root.querySelector<HTMLElement>('.pv-timer')!;
  const clock = root.querySelector<HTMLElement>('.pv-clock')!;

  // only the fragment changes after the first load, so the iframes don't reload
  const embed = (hash: string) => `${location.pathname}?embed#${hash}`;

  function update() {
    const { slide, step, total } = position();
    cur.src = embed(`${slide + 1}.${step}`);
    const atEnd = step >= total && slide >= slides.length - 1;
    end.style.display = atEnd ? 'flex' : 'none';
    if (!atEnd) nxt.src = embed(step < total ? `${slide + 1}.${step + 1}` : `${slide + 2}`);
    pos.textContent = `${slide + 1} / ${slides.length}` + (total ? `  ·  step ${step} / ${total}` : '');
    if (editing && editing !== nameOf(slide)) { flush(); startEdit(); } // follow the deck while typing
    renderNotes();
  }

  // ── notes ─────────────────────────────────────────────────────────────────
  const md: Record<string, string> = JSON.parse(document.getElementById('deck-notes')?.textContent || '{}');
  const nameOf = (i: number) => (slides[i].dataset.file ?? '').replace(/\.\w+$/, '');
  const canEdit = import.meta.env.DEV;
  let editing: string | null = null; // slide name whose notes are in the textarea
  let timer_: number | undefined;

  function renderNotes() {
    const { slide } = position();
    const inline = [...slides[slide].querySelectorAll('.notes')].map((e) => e.innerHTML).join('');
    const own = md[nameOf(slide)] ? (marked.parse(md[nameOf(slide)], { async: false }) as string) : '';
    notes.innerHTML = inline + own ||
      `<span class="pv-none">no notes${canEdit ? ' · click or press e to write some' : ''}</span>`;
  }

  function startEdit() {
    if (!canEdit) return;
    editing = nameOf(position().slide);
    edit.value = md[editing] ?? '';
    notes.hidden = true;
    edit.hidden = false;
    edit.focus();
  }

  function stopEdit() {
    flush();
    editing = null;
    edit.hidden = true;
    notes.hidden = false;
    renderNotes();
  }

  async function save(slide: string, text: string) {
    saveState.textContent = 'saving…';
    try {
      const r = await fetch('/__deck/notes', { method: 'POST', body: JSON.stringify({ slide, md: text }) });
      if (!r.ok) throw new Error(await r.text());
      saveState.textContent = 'saved';
    } catch (e) {
      saveState.textContent = `not saved: ${e}`;
    }
  }

  function flush() {
    if (timer_ === undefined || !editing) return;
    clearTimeout(timer_);
    timer_ = undefined;
    save(editing, md[editing] ?? '');
  }

  edit.oninput = () => {
    md[editing!] = edit.value;
    saveState.textContent = '…';
    clearTimeout(timer_);
    timer_ = window.setTimeout(() => { timer_ = undefined; save(editing!, edit.value); }, 400);
  };
  edit.onkeydown = (e) => { if (e.key === 'Escape') { e.preventDefault(); stopEdit(); } };
  edit.onblur = stopEdit;
  notes.onclick = (e) => { if (!(e.target as HTMLElement).closest('a')) startEdit(); };
  document.addEventListener('keydown', (e) => {
    if (e.key === 'e' && !editing && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); startEdit(); }
  });
  addEventListener('beforeunload', flush);

  // scale each W×H iframe to its box
  for (const frame of root.querySelectorAll<HTMLElement>('.pv-frame')) {
    const iframe = frame.querySelector('iframe')!;
    Object.assign(iframe.style, { width: `${W}px`, height: `${H}px` });
    new ResizeObserver(() => {
      const s = Math.min(frame.clientWidth / W, frame.clientHeight / H);
      iframe.style.transform = `scale(${s})`;
    }).observe(frame);
  }

  // timer starts at the first move, not when the window opens
  let started: number | undefined;
  const pad = (n: number) => String(n).padStart(2, '0');
  timer.onclick = () => (started = Date.now());
  setInterval(() => {
    const s = started ? Math.floor((Date.now() - started) / 1000) : 0;
    timer.textContent = `${Math.floor(s / 60)}:${pad(s % 60)}`;
    const d = new Date();
    clock.textContent = `${d.getHours()}:${pad(d.getMinutes())}`;
  }, 500);

  onChange(() => {
    started ??= Date.now();
    update();
  });
  update();
}
