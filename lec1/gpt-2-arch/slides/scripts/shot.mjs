/**
 * Screenshot slides at given steps, to check them without a person at the browser.
 *
 *   bun dev --port 4400 &                       # or any running deck
 *   bun run shot 3.0 3.2 14.5             # -> /tmp/shots/3.0.png ...
 *   bun run shot 14-stack.3               # by file name (numbers shift as slides are added)
 *   bun run shot --url http://localhost:4400/ --out /tmp/x --wait 2000 --jobs 4 3.1
 *
 * Saves --width × --height (default 1600×900), and says OVERFLOW if the slide's content doesn't fit on the canvas
 * (it'd be cut off at any window size).
 *
 * Fast because nothing waits in real time: --jobs pages (default 8) each load the deck once and go from shot to shot
 * by setting the hash (islands render from the step, so that's the same as a reload at #N.K). JS timers run on a fake
 * clock that jumps --wait ms (or the slide's data-hold, if longer) per shot, and the screenshot finishes CSS
 * animations and transitions (infinite ones go back to their start).
 *
 * Uses Google Chrome if it's installed, else $CHROME, else the distro's chromium (Fedora / Debian names).
 */
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { parseArgs } from 'node:util';

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: 'string', default: 'http://localhost:4400/' },
    out: { type: 'string', default: '/tmp/shots' },
    wait: { type: 'string', default: '1500' },
    width: { type: 'string', default: '1600' },
    height: { type: 'string', default: '900' },
    jobs: { type: 'string', default: '8' },
  },
});
await mkdir(opt.out, { recursive: true });
const exe = [process.env.CHROME, '/usr/bin/chromium-browser', '/usr/bin/chromium'].find((p) => p && existsSync(p));
const browser = await chromium.launch({ channel: 'chrome' }).catch((e) => {
  if (!exe) throw e;
  return chromium.launch({ executablePath: exe });
});

const ignored = /Expected a DOM node of type|Improper nesting of table/;
// one page per job, loaded once; errors go to whichever shot the page is on.
// each in its own context: pages sharing one would follow each other over the deck's BroadcastChannel
async function open() {
  const ctx = await browser.newContext({ viewport: { width: Number(opt.width), height: Number(opt.height) } });
  await ctx.clock.install();
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !ignored.test(m.text()) && page.errors.push(m.text()));
  await page.goto(opt.url, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  page.errors.splice(0).forEach((e) => loadErrors.add(e));
  return page;
}

const shots = positionals.slice();
const loadErrors = new Set();
const pages = await Promise.all(Array.from({ length: Math.max(1, Math.min(Number(opt.jobs), shots.length)) }, open));
if (loadErrors.size) console.log(`loading the deck: ERRORS: ${[...loadErrors].join(' | ')}`);
// file names -> slide numbers, from the page itself
const files = await pages[0].evaluate(() => [...document.querySelectorAll('.slide')].map((s) => s.dataset.file.replace(/\.\w+$/, '')));

async function shoot(page, arg) {
  const [name, k = '0'] = arg.split(/\.(?=\d+$)/);
  const n = /^\d+$/.test(name) ? Number(name) : files.indexOf(name) + 1;
  if (!n) return console.log(`${arg}: no slide named ${name}`);
  await page.evaluate((at) => { location.hash = at; }, `${n}.${k}`);
  await page.waitForTimeout(30); // the step renders, its effects get scheduled
  const hold = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll('.slide.active [data-hold]')]
    .map((e) => Number(e.getAttribute('data-hold')) || 0)));
  await page.clock.runFor(Math.max(Number(opt.wait), hold));
  await page.waitForTimeout(30); // the dom catches up with the timers
  const file = `${opt.out}/${arg}.png`;
  await page.screenshot({ path: file, animations: 'disabled' });
  // content past the canvas edge is cut off at every window size
  const over = await page.evaluate(() => {
    const s = document.querySelector('.slide.active');
    const dx = s.scrollWidth - s.clientWidth, dy = s.scrollHeight - s.clientHeight;
    return dx > 1 || dy > 1 ? `OVERFLOW: ${Math.max(0, dx)}px wide, ${Math.max(0, dy)}px tall` : '';
  });
  const errors = page.errors.splice(0);
  console.log(file, [over, errors.length ? `ERRORS: ${errors.join(' | ')}` : ''].filter(Boolean).join(' '));
}

await Promise.all(pages.map(async (page) => {
  for (let arg; (arg = shots.shift()) !== undefined;) await shoot(page, arg);
}));
await browser.close();
