/**
 * Record the deck to a video, as if someone pressed → through every step and
 * waited for each step's animations to finish before the next press.
 *
 *   bun run build && bun run record                 → deck.mp4
 *   bun run record --discord                        → deck.mp4 + deck.discord.mp4 (under 10 MB)
 *   bun run record --out talk.mp4 --hold 2500 --from 5 --to 8 --jobs 40
 *   bun run record --shrink deck.mp4 --max-mb 25    → just compress an existing video
 *
 * Every slide is recorded on its own, --jobs at a time (default: one per cpu
 * core), each in its own browser tab entered from the slide before it so its
 * entry animations are caught. The clips are joined with --gap seconds of black
 * (default 0.5) between slides.
 *
 * After each step it waits for the slide's CSS animations and transitions to
 * end (infinite ones like a blinking cursor don't count), then holds for
 * --hold ms (default 1500). Things animated from JS (Terminal typing,
 * LatencyRace, `auto` Walkthroughs) aren't seen, so give their slide longer:
 * put data-hold="6000" on any element in it.
 *
 * Frames come from Chrome's screencast with their real timestamps, so timing is
 * what you'd see; too many --jobs for the machine shows up as choppy
 * animations (lower --jobs if so). 1920×1080 at --scale 1 is crisp: the
 * 1600×900 canvas is drawn at 1.2×, not upscaled.
 *
 * --max-mb N (or --discord, = 10) also writes <out>.discord.mp4 that fits in N
 * MB: a two-pass encode at the bitrate that fills it, at 720p when the bitrate
 * is too low for 1080p to look good.
 *
 * Needs Google Chrome and ffmpeg (brew install ffmpeg).
 */
import { chromium } from 'playwright-core';
import { createServer } from 'node:http';
import { readFile, writeFile, mkdtemp, mkdir, rm, stat, copyFile } from 'node:fs/promises';
import { tmpdir, availableParallelism } from 'node:os';
import { join, normalize, extname } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
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
    // x264 speed: slow / slower squeeze the file a little more, take much longer
    preset: { type: 'string', default: 'medium' },
    // render at this many device pixels per css pixel, then downscale (2 = supersampled, slower)
    scale: { type: 'string', default: '1' },
    from: { type: 'string', default: '1' },
    to: { type: 'string' },
    jobs: { type: 'string', default: String(availableParallelism()) },
    gap: { type: 'string', default: '0.5' }, // seconds of black between slides
    'max-mb': { type: 'string' },
    discord: { type: 'boolean', default: false },
    shrink: { type: 'string' }, // compress this file to --max-mb and exit
  },
});
const W = Number(opt.width), H = Number(opt.height), FPS = Number(opt.fps), HOLD = Number(opt.hold), SCALE = Number(opt.scale);
const GAP = Number(opt.gap), JOBS = Math.max(1, Number(opt.jobs));
const MAX_MB = opt['max-mb'] ? Number(opt['max-mb']) : opt.discord || opt.shrink ? 10 : 0;
const dist = join(import.meta.dirname, '..', 'dist');

if (spawnSync('ffmpeg', ['-version']).error) throw new Error('ffmpeg not found: brew install ffmpeg');
const ffmpeg = (args) => new Promise((ok, fail) => {
  const p = spawn('ffmpeg', ['-y', '-loglevel', 'error', ...args], { stdio: 'inherit' });
  p.on('close', (c) => (c === 0 ? ok() : fail(new Error(`ffmpeg exited ${c}`))));
});

if (opt.shrink) {
  await shrink(opt.shrink, opt.shrink.replace(/(\.\w+)?$/, '.discord.mp4'));
  process.exit(0);
}

// ── serve dist/ ──────────────────────────────────────────────────────────────
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml',
  '.json': 'application/json', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp' };
try { await readFile(join(dist, 'index.html')); } catch { throw new Error('no dist/index.html: run `bun run build` first'); }
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

const browser = await chromium.launch({ channel: 'chrome' });
const dir = await mkdtemp(join(tmpdir(), 'deck-record-'));
let failed = false;
try {
  // a context per tab: tabs in one context would follow each other (deck.ts syncs windows over a BroadcastChannel)
  const newPage = async () => (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: SCALE })).newPage();
  const count = await (async () => {
    const page = await newPage();
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    const n = await page.evaluate(() => document.querySelectorAll('.slide').length);
    await page.context().close();
    return n;
  })();
  const from = Math.max(1, Number(opt.from)), to = Math.min(count, opt.to ? Number(opt.to) : count);
  const todo = Array.from({ length: to - from + 1 }, (_, j) => from + j);

  // ── record: a pool of tabs, each takes the next slide ──
  const clips = [];
  let next = 0, done = 0;
  const t0 = Date.now();
  const status = () => process.stdout.write(`\rrecorded ${done} / ${todo.length} slides   `);
  status();
  await Promise.all(Array.from({ length: Math.min(JOBS, todo.length) }, async () => {
    const page = await newPage();
    page.on('pageerror', (e) => console.error('\npage error:', e.message));
    while (next < todo.length) {
      const j = next++;
      clips[j] = await recordSlide(page, todo[j], join(dir, `clip${j}`));
      done++;
      status();
    }
    await page.context().close();
  }));
  console.log(`in ${((Date.now() - t0) / 1000).toFixed(1)}s`);

  // ── encode: every clip's frames, with a black frame lasting GAP between clips ──
  const black = join(dir, 'black.jpg');
  await ffmpeg(['-f', 'lavfi', '-i', `color=black:s=${W * SCALE}x${H * SCALE}`, '-frames:v', '1', black]);
  const list = [];
  clips.forEach((c, j) => {
    if (j && GAP > 0) list.push(`file '${black}'\nduration ${GAP.toFixed(4)}`);
    c.forEach((f) => list.push(`file '${f.file}'\nduration ${Math.max(f.d, 1 / FPS).toFixed(4)}`));
  });
  list.push(list.at(-1).split('\n')[0]); // concat demuxer ignores the last duration otherwise
  await writeFile(join(dir, 'list.txt'), list.join('\n'));
  const secs = clips.flat().reduce((s, f) => s + Math.max(f.d, 1 / FPS), 0) + GAP * (clips.length - 1);
  console.log(`encoding ${clips.flat().length} frames (${secs.toFixed(0)}s of video) → ${opt.out}`);
  await ffmpeg(['-f', 'concat', '-safe', '0', '-i', join(dir, 'list.txt'),
    '-vf', `fps=${FPS},scale=${W}:${H}:flags=lanczos,format=yuv420p`, '-c:v', 'libx264', '-crf', opt.crf, '-preset', opt.preset,
    '-movflags', '+faststart', opt.out]);
  if (MAX_MB) await shrink(opt.out, opt.out.replace(/(\.\w+)?$/, '.discord.mp4'));
  console.log('done');
} catch (e) {
  console.error('\n' + (e?.stack ?? e));
  failed = true;
} finally {
  await browser.close();
  server.close();
  await rm(dir, { recursive: true, force: true });
}
process.exit(failed ? 1 : 0);

/**
 * Record slide a in `page`, entered from the end of the slide before it. Returns the frames
 * ({ file, d } with d = seconds on screen), from the press into slide a to the end of its last step's hold.
 */
async function recordSlide(page, a, out) {
  await mkdir(out, { recursive: true });
  // slide a-1 fully revealed (the step clamps), so one press shows slide a as it's entered in the talk
  await page.goto(a > 1 ? `${url}#${a - 1}.9999` : `${url}#1`, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500); // islands hydrate
  await settle(page, 0);

  const frames = []; // { file, t } with t in seconds (browser wall clock)
  const writes = [];
  const cdp = await page.context().newCDPSession(page);
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    const file = join(out, `${String(frames.length).padStart(6, '0')}.jpg`);
    frames.push({ file, t: metadata.timestamp });
    writes.push(writeFile(file, Buffer.from(data, 'base64')));
    cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: W * SCALE, maxHeight: H * SCALE, everyNthFrame: 1 });
  await page.waitForTimeout(100);

  const now = () => page.evaluate(() => Date.now() / 1000);
  const start = await now();
  if (a > 1) await page.keyboard.press('ArrowRight');
  let end;
  for (;;) {
    await settle(page, HOLD);
    end = await now();
    if (!(await page.evaluate(() => {
      // more steps left on this slide? (same count as deck.ts total())
      const s = document.querySelector('.slide.active');
      const total = s.querySelectorAll('.step').length +
        [...s.querySelectorAll('[data-steps]')].reduce((n, e) => n + Number(e.dataset.steps), 0);
      return Number(s.dataset.step ?? 0) < total;
    }))) break;
    await page.keyboard.press('ArrowRight');
  }
  await cdp.send('Page.stopScreencast');
  await cdp.detach();
  await Promise.all(writes);

  // frames shown during [start, end]: the last one before start is what was on screen at the press
  const first = Math.max(0, frames.findLastIndex((f) => f.t <= start));
  const kept = frames.slice(first).filter((f, j) => j === 0 || f.t < end);
  if (!kept.length) throw new Error(`slide ${a}: no frames captured`);
  // the screen at the press is still slide a-1: show the first frame of slide a from the start instead
  if (a > 1 && kept.length > 1 && kept[0].t <= start) kept.shift();
  return kept.map((f, j) => ({ file: f.file, d: (j + 1 < kept.length ? kept[j + 1].t : end) - (j ? f.t : start) }));
}

/** Wait for the active slide's animations to end, then `hold` ms (or its data-hold). */
async function settle(page, hold) {
  await page.waitForTimeout(120); // let the step's render and animations start
  await page.waitForFunction(() => document.getAnimations().every((a) =>
    a.playState !== 'running' || a.effect?.getComputedTiming().endTime === Infinity), null, { timeout: 30_000 })
    .catch(() => console.warn('\n  animations still running after 30s, moving on'));
  if (!hold) return;
  const extra = await page.evaluate(() => Math.max(0, ...[...document.querySelectorAll('.slide.active [data-hold]')]
    .map((e) => Number(e.getAttribute('data-hold')) || 0)));
  await page.waitForTimeout(Math.max(hold, extra));
}

/** Two-pass encode of `src` to `dst` sized to fit in MAX_MB (1 MB = 10^6 bytes, a little under Discord's limit). */
async function shrink(src, dst) {
  const limit = MAX_MB * 1e6;
  const size = (await stat(src)).size;
  if (size <= limit) {
    await copyFile(src, dst);
    return console.log(`${src} is already ${(size / 1e6).toFixed(1)} MB → ${dst}`);
  }
  const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'format=duration:stream=width,height',
    '-of', 'json', src], { encoding: 'utf8' });
  const info = JSON.parse(probe.stdout);
  const dur = Number(info.format.duration), { width: w, height: h } = info.streams[0];
  const tmp = await mkdtemp(join(tmpdir(), 'deck-shrink-'));
  try {
    // leave ~4% for the container and x264 overshooting the target; try again smaller if it still doesn't fit
    for (const fill of [0.96, 0.88, 0.78]) {
      const kbps = Math.floor((limit * 8 * fill) / dur / 1000);
      // slides are mostly still, so few bits per pixel go a long way; below ~250 kb/s 1080p text gets blocky
      const outH = kbps < 250 && h > 720 ? 720 : h;
      const vf = outH === h ? 'format=yuv420p' : `scale=-2:${outH}:flags=lanczos,format=yuv420p`;
      console.log(`shrinking ${src}: ${(size / 1e6).toFixed(1)} MB, ${dur.toFixed(0)}s → ${kbps} kb/s at ${outH === h ? `${w}×${h}` : `${outH}p`}`);
      const common = ['-i', src, '-vf', vf, '-c:v', 'libx264', '-preset', 'slow', '-b:v', `${kbps}k`,
        '-maxrate', `${kbps * 4}k`, '-bufsize', `${kbps * 8}k`, '-passlogfile', join(tmp, 'pass'), '-an'];
      await ffmpeg([...common, '-pass', '1', '-f', 'mp4', '/dev/null']);
      await ffmpeg([...common, '-pass', '2', '-movflags', '+faststart', dst]);
      const got = (await stat(dst)).size;
      console.log(`→ ${dst}: ${(got / 1e6).toFixed(2)} MB`);
      if (got <= limit) return;
    }
    throw new Error(`couldn't get ${src} under ${MAX_MB} MB`);
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}
