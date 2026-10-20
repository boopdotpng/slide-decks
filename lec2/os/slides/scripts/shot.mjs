/**
 * Screenshot slides at given steps, to check them without a person at the browser.
 *
 *   bun dev --port 4400 &                       # or any running deck
 *   bun run shot 3.0 3.2 14.5             # -> /tmp/shots/3.0.png ...
 *   bun run shot 14-stack.3               # by file name (numbers shift as slides are added)
 *   bun run shot --url http://localhost:4400/ --out /tmp/x --wait 2000 3.1
 *
 * Each shot loads the page fresh at #N.K, waits --wait ms for animations, then saves --width × --height (default 1600×900).
 */
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';
import { parseArgs } from 'node:util';

const { values: opt, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    url: { type: 'string', default: 'http://localhost:4400/' },
    out: { type: 'string', default: '/tmp/shots' },
    wait: { type: 'string', default: '1500' },
    width: { type: 'string', default: '1600' },
    height: { type: 'string', default: '900' },
  },
});
await mkdir(opt.out, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome' });
const ctx = await browser.newContext({ viewport: { width: Number(opt.width), height: Number(opt.height) } });
// file names -> slide numbers, from the page itself
const files = await (async () => {
  const page = await ctx.newPage();
  await page.goto(opt.url, { waitUntil: 'networkidle' });
  const names = await page.evaluate(() => [...document.querySelectorAll('.slide')].map((s) => s.dataset.file.replace(/\.\w+$/, '')));
  await page.close();
  return names;
})();
for (const arg of positionals) {
  const [name, k = '0'] = arg.split(/\.(?=\d+$)/);
  const n = /^\d+$/.test(name) ? Number(name) : files.indexOf(name) + 1;
  if (!n) { console.log(`${arg}: no slide named ${name}`); continue; }
  const at = `${n}.${k}`;
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && !/Expected a DOM node of type|Improper nesting of table/.test(m.text()) && errors.push(m.text()));
  await page.goto(`${opt.url}#${at}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(Number(opt.wait));
  const file = `${opt.out}/${arg}.png`;
  await page.screenshot({ path: file });
  console.log(file, errors.length ? `ERRORS: ${errors.join(' | ')}` : '');
  await page.close();
}
await browser.close();
