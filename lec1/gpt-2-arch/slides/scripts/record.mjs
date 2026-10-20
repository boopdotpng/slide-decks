/**
 * Record the deck to a video, as if someone pressed → through every step and
 * waited for each step's animations to finish before the next press.
 *
 *   bun run build && bun run record                 → deck.mp4
 *   bun run record --out talk.mp4 --hold 2500 --from 5 --to 8
 *   bun run record --crf 18 --scale 1               → smaller file, faster
 *
 * After each step it waits for the slide's CSS animations and transitions to
 * end (infinite ones like a blinking cursor don't count), then holds for
 * --hold ms (default 1500). Things animated from JS (Terminal typing,
 * LatencyRace, `auto` Walkthroughs) aren't seen, so give their slide longer:
 * put data-hold="6000" on any element in it.
 *
 * Needs Google Chrome and ffmpeg (brew install ffmpeg). Frames come from
 * Chrome's screencast with their real timestamps, so timing is what you'd see.
 */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, normalize, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { parseArgs } from 'node:util';

const { values: opt } = parseArgs({
  options: {
    out: { type: 'string', default: 'deck.mp4' },
    hold: { type: 'string', default: '1500' },
    width: { type: 'string', default: '1920' },
    height: { type: 'string', default: '1080' },
    fps: { type: 'string', default: '30' },
    // x264 quality: lower is better and bigger (18 is visually near-lossless, 14 sharper text)
    crf: { type: 'string', default: '14' },
    // render at this many device pixels per css pixel, then downscale: crisper text
    scale: { type: 'string', default: '2' },
    from: { type: 'string', default: '1' },
    to: { type: 'string' },
  },
});
const W = Number(opt.width), H = Number(opt.height), FPS = Number(opt.fps), HOLD = Number(opt.hold), SCALE = Number(opt.scale);
const dist = join(import.meta.dirname, '..', 'dist');

if (spawnSync('ffmpeg', ['-version']).error) throw new Error('ffmpeg not found: brew install ffmpeg');

// ── serve dist/ ──────────────────────────────────────────────────────────────
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
const server = createServer(async (req, res) => {
  let p = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
  if (p.endsWith('/')) p += 'index.html';
  try {
    const body = await readFile(join(dist, p));
    res.writeHead(200, { 'content-type': TYPES[extname(p)] ?? 'application/octet-stream' }).end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const url = `http://127.0.0.1:${server.address().port}/`;
try { await readFile(join(dist, 'index.html')); } catch { throw new Error('no dist/index.html: run `bun run build` first'); }

// ── drive the deck ───────────────────────────────────────────────────────────
const browser = await chromium.launch({ channel: 'chrome' });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(`${url}#${opt.from}`, { waitUntil: 'networkidle' });
await page.evaluate(() => document.fonts.ready);
await page.waitForTimeout(500); // islands hydrate

const dir = await mkdtemp(join(tmpdir(), 'deck-record-'));
const frames = []; // { file, t } with t in seconds
const writes = [];
const cdp = await page.context().newCDPSession(page);
cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
  const file = join(dir, `${String(frames.length).padStart(6, '0')}.jpg`);
  frames.push({ file, t: metadata.timestamp ?? Date.now() / 1000 });
  writes.push(writeFile(file, Buffer.from(data, 'base64')));
  cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 100, maxWidth: W * SCALE, maxHeight: H * SCALE, everyNthFrame: 1 });

const hash = () => page.evaluate(() => location.hash.slice(1));
const settle = async () => {
  await page.waitForTimeout(120); // let the step's render and animations start
  await page.waitForFunction(() => document.getAnimations().every((a) =>
    a.playState !== 'running' || a.effect?.getComputedTiming().endTime === Infinity), null, { timeout: 30_000 })
    .catch(() => console.warn('  animations still running after 30s, moving on'));
  const extra = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll('.slide.active [data-hold]')]
    .map((e) => Number(e.getAttribute('data-hold')) || 0)));
  await page.waitForTimeout(Math.max(HOLD, extra));
};

const to = opt.to ? Number(opt.to) : Infinity;
for (;;) {
  const at = await hash();
  process.stdout.write(`\r#${at}   `);
  await settle();
  await page.keyboard.press('ArrowRight');
  await page.waitForTimeout(50);
  const next = await hash();
  if (next === at || Number(next.split('.')[0]) > to) break;
}
const end = Date.now() / 1000;
await cdp.send('Page.stopScreencast');
await Promise.all(writes);
await browser.close();
server.close();

// ── encode ───────────────────────────────────────────────────────────────────
// each frame lasts until the next one; the last until recording stopped
if (!frames.length) throw new Error('no frames captured');
const list = frames.map((f, i) => {
  const d = (frames[i + 1]?.t ?? Math.min(end, f.t + 10)) - f.t;
  return `file '${f.file}'\nduration ${Math.max(d, 1 / FPS).toFixed(4)}`;
});
list.push(`file '${frames.at(-1).file}'`); // concat demuxer ignores the last duration otherwise
await writeFile(join(dir, 'list.txt'), list.join('\n'));
console.log(`\nencoding ${frames.length} frames → ${opt.out}`);
const ff = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'),
  '-vf', `fps=${FPS},scale=${W}:${H}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', opt.crf, '-preset', 'slow',
  '-movflags', '+faststart', opt.out], { stdio: 'inherit' });
await rm(dir, { recursive: true, force: true });
if (ff.status !== 0) process.exit(ff.status ?? 1);
console.log('done');
