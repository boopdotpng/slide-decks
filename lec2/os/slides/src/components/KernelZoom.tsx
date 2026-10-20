/** @jsxImportSource preact */
import type { ComponentChildren } from 'preact';
import { useEffect, useRef, useState } from 'preact/hooks';
import { Arrow, COLORS, nest, ZOOM_H as H, ZOOM_W as W, ZoomStage, ZoomView, type Rect } from './viz';
import { useSlideStep } from '../deck/hooks';

/**
 * The whole machine as one zoomable picture: kernel → processes → threads, and
 * a process's page table → the x86-64 4-level walk, on the viz kit's
 * ZoomStage / ZoomView. Steps:
 *   0 kernel (4 processes, 2×2)   1 cores take turns (js-animated)   2 process   3 thread
 *   4 page table   5 address split   6 the walk   7 zoom out
 * msg's address (0x10120) is real; pids and physical pages are illustrative.
 */

const PROCS = [
  { name: 'hello', pid: 412, threads: 3 },
  { name: 'shell', pid: 388, threads: 1 },
  { name: 'browser', pid: 1021, threads: 3 },
  { name: 'editor', pid: 977, threads: 2 },
];
// 2×2, so the kernel view can use a tall window's height too
const PW = 750, PH = PW * H / W;
const procRect = (i: number): Rect => [40 + (i % 2) * (PW + 20), 115 + Math.floor(i / 2) * (PH + 20), PW, PH];
// inside a process view
const PT: Rect = [60, 120, 700, 333];
const threadRect = (j: number): Rect => [860, 100 + j * 220, 442, 210];

// the kernel view is shorter than a full view, so frame just it
const KH = 115 + 2 * PH + 20 + 25;
const CAMERA: Rect[] = [
  [0, 0, W, KH], [0, 0, W, KH],
  procRect(0),
  nest(procRect(0), threadRect(0)),
  nest(procRect(0), PT), nest(procRect(0), PT), nest(procRect(0), PT),
  [0, 0, W, KH],
];

const CAPTIONS = [
  'the whole machine: the kernel holds every process, every process holds threads',
  '4 cores, 9 threads: the timer shuffles who runs where, hundreds of times a second',
  'one process: a page table, its memory, open files, and its threads',
  'one thread: what it needs in ring 3, plus a kernel side: its own kernel stack and the registers saved when it was paused',
  'the page table. on x86-64 it\'s not a flat list but a 4-level tree',
  'a 48-bit address splits into four 9-bit indexes and a 12-bit offset. 9 bits = 512 entries × 8 bytes = one 4 KiB table',
  'the mmu walks it: cr3 → pml4[0] → pdpt[0] → pd[0] → pt[0x10] → physical page 0x1a203, plus offset 0x120. the tlb remembers the answer',
  'all of it, on every core, all the time',
];

const T = (p: { x: number; y: number; size: number; fill?: string; bold?: boolean; mono?: boolean; anchor?: string; children: ComponentChildren }) => (
  <text x={p.x} y={p.y} font-size={p.size} fill={p.fill ?? 'var(--fg)'} font-weight={p.bold ? 700 : 400}
    font-family={p.mono ? 'var(--mono)' : undefined} text-anchor={p.anchor}>{p.children}</text>
);

// ── thread ───────────────────────────────────────────────────────────────────
function ThreadView({ n, pc }: { n: number; pc: string }) {
  const row = (x: number, y: number, k: string, v: string) => (
    <g><T x={x} y={y} size={34} mono>{k}</T><T x={x + 275} y={y} size={30} fill="var(--muted)">{v}</T></g>
  );
  return (
    <g>
      <rect width={W} height={H} rx={40} fill="#161616" stroke={COLORS.accent} stroke-width={6} />
      <T x={60} y={110} size={80} bold>thread {n}</T>
      <rect x={60} y={170} width={700} height={540} rx={24} fill="#1c1c1c" />
      <T x={100} y={240} size={40} bold fill={COLORS.accent}>ring 3 side</T>
      {row(100, 330, 'pc', pc)}
      {row(100, 410, 'registers', 'rax, rdi, rsp, …')}
      {row(100, 490, 'user stack', 'locals, return addresses')}
      <rect x={840} y={170} width={700} height={540} rx={24} fill="#1c1c1c" />
      <T x={880} y={240} size={40} bold fill={COLORS.hot}>kernel side</T>
      {row(880, 330, 'kernel stack', '16 KiB on linux')}
      {row(880, 410, 'saved regs', 'from the last pause')}
      {row(880, 490, 'state', 'running · ready · waiting')}
      {row(880, 570, 'also', 'priority, cpu time')}
    </g>
  );
}

// ── page table walk ──────────────────────────────────────────────────────────
function WalkView({ split, walk }: { split: boolean; walk: boolean }) {
  const bits = [9, 9, 9, 9, 12];
  const names = ['pml4', 'pdpt', 'pd', 'pt', 'offset'];
  const vals = ['0', '0', '0', '0x10', '0x120'];
  const colors = [COLORS.blue, COLORS.blue, COLORS.blue, COLORS.blue, COLORS.violet];
  const fieldColor = (i: number) => (i === bits.length - 1 ? COLORS.violet : colors[i]);
  let bx = 50;
  const fields = bits.map((b, i) => { const x = bx; bx += b * (1500 / 48); return { x, w: b * (1500 / 48), i }; });

  const tables = [
    { name: 'pml4', rows: ['0', '1', '2', '…', '511'], hi: 0 },
    { name: 'pdpt', rows: ['0', '1', '2', '…', '511'], hi: 0 },
    { name: 'pd', rows: ['0', '1', '2', '…', '511'], hi: 0 },
    { name: 'pt', rows: ['0', '…', '0x10', '…', '511'], hi: 2 },
  ];
  const tx = (k: number) => 240 + k * 280;
  const rowY = (r: number) => 300 + r * 56;
  const mid = (k: number) => rowY(tables[k].hi) + 28;
  const page = { title: '4 KiB page', base: '0x1a203000', off: '+ 0x120' };

  return (
    <g>
      <rect width={W} height={H} rx={40} fill="#161616" stroke={COLORS.accent} stroke-width={6} />
      <T x={50} y={60} size={34} fill="var(--muted)">virtual <tspan font-family="var(--mono)" fill="var(--fg)">0x10120</tspan> · 48 bits</T>
      {fields.map(({ x, w, i }) => (
        <g>
          <rect x={x + 3} y={90} width={w - 6} height={80} rx={10} fill={split ? fieldColor(i) : '#262626'} style={{ transition: 'fill .4s' }} />
          <T x={x + w / 2} y={144} size={36} mono anchor="middle">{split ? vals[i] : ''}</T>
          <T x={x + w / 2} y={205} size={26} anchor="middle" fill="var(--muted)">{split ? `${names[i]} · ${bits[i]}` : ''}</T>
        </g>
      ))}

      <rect x={40} y={300} width={140} height={60} rx={10} fill="#262626" />
      <T x={110} y={340} size={30} mono anchor="middle">cr3</T>
      {tables.map((t, k) => (
        <g>
          <T x={tx(k) + 110} y={275} size={30} bold anchor="middle">{t.name}</T>
          <rect x={tx(k)} y={290} width={220} height={300} rx={12} fill="#1c1c1c" stroke="#333" />
          {t.rows.map((r, j) => (
            <g>
              {walk && j === t.hi && <rect x={tx(k) + 6} y={rowY(j)} width={208} height={50} rx={6} fill="var(--hl)" />}
              <T x={tx(k) + 110} y={rowY(j) + 36} size={28} mono anchor="middle" fill={walk && j === t.hi ? 'var(--fg)' : 'var(--muted)'}>{r}</T>
            </g>
          ))}
        </g>
      ))}
      <rect x={1380} y={380} width={190} height={160} rx={12} fill={walk ? COLORS.blue : '#1c1c1c'} style={{ transition: 'fill .4s' }} />
      <T x={1475} y={430} size={28} bold anchor="middle">{page.title}</T>
      <T x={1475} y={475} size={24} mono anchor="middle">{page.base}</T>
      <T x={1475} y={515} size={24} mono anchor="middle" fill="var(--muted)">{page.off}</T>

      <g class="kz-walk">
        <Arrow from={[180, 330]} to={[tx(0), mid(0)]} on={walk} />
        <Arrow from={[tx(0) + 220, mid(0)]} to={[tx(1), mid(1)]} on={walk} />
        <Arrow from={[tx(1) + 220, mid(1)]} to={[tx(2), mid(2)]} on={walk} />
        <Arrow from={[tx(2) + 220, mid(2)]} to={[tx(3), mid(3)]} on={walk} />
        <Arrow from={[tx(3) + 220, mid(3)]} to={[1380, 460]} on={walk} />
      </g>
      <T x={50} y={680} size={30} fill="var(--muted)">each table is one 4 KiB page of 512 entries · cr3 holds the first one's physical address</T>
    </g>
  );
}

// ── process ──────────────────────────────────────────────────────────────────
function ProcessView({ name, pid, threads, walk }: { name: string; pid: number; threads: number; walk: ComponentChildren }) {
  return (
    <g>
      <rect width={W} height={H} rx={40} fill="#141414" stroke="#333" stroke-width={4} />
      <T x={60} y={80} size={56} bold>{name}</T>
      <T x={60 + name.length * 34 + 30} y={80} size={32} fill="var(--muted)">process · pid {pid}</T>
      <ZoomView at={PT}>{walk}</ZoomView>
      <T x={60} y={510} size={30} fill="var(--muted)">↑ page table: cr3 points here while its threads run</T>
      <T x={60} y={600} size={32}>memory: .text · .rodata · heap · a stack per thread</T>
      <T x={60} y={660} size={32}>open files: 0 stdin · 1 stdout · 2 stderr</T>
      {Array.from({ length: threads }, (_, j) => (
        <ZoomView at={threadRect(j)}><ThreadView n={j + 1} pc={`0x${(0x11148 + j * 0x2a0).toString(16)}`} /></ZoomView>
      ))}
    </g>
  );
}

// every thread in the machine, in world coordinates (for the core badges)
const THREADS = PROCS.flatMap((p, i) => Array.from({ length: p.threads }, (_, j) => nest(procRect(i), threadRect(j))));

export default function KernelZoom() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    setTick(0);
    if (step !== 1) return;
    const id = setInterval(() => setTick((t) => t + 1), 700);
    return () => clearInterval(id);
  }, [step]);

  const walk = <WalkView split={step >= 5 && step <= 6} walk={step === 6} />;

  return (
    <div class="kz" ref={root} data-hold="5000">
      <ZoomStage camera={CAMERA[step]}>
        <rect width={W} height={KH} rx={24} fill="#0f0f0f" stroke="#262626" stroke-width={2} />
        <T x={40} y={70} size={44} bold>kernel</T>
        <T x={210} y={68} size={24} fill="var(--muted)">scheduler · memory manager · drivers · every process:</T>
        {[0, 1, 2, 3].map((c) => (
          <g>
            <rect x={900 + c * 170} y={30} width={150} height={56} rx={10} fill={COLORS.green} />
            <T x={975 + c * 170} y={67} size={26} bold anchor="middle">core {c}</T>
          </g>
        ))}
        {PROCS.map((p, i) => (
          <ZoomView at={procRect(i)}><ProcessView {...p} walk={walk} /></ZoomView>
        ))}
        {step <= 1 && [0, 1, 2, 3].map((c) => {
          const [tx, ty, tw] = THREADS[(tick * 5 + c * 2) % THREADS.length];
          return (
            <g style={{ transform: `translate(${tx + tw - 100}px, ${ty - 8}px)`, transition: 'transform .35s' }}>
              <rect width={104} height={34} rx={8} fill={COLORS.good} />
              <T x={52} y={25} size={22} bold anchor="middle" fill="#0a0a0a">core {c}</T>
            </g>
          );
        })}
      </ZoomStage>
      <div class="caption">{CAPTIONS[step]}</div>
      <style>{`
        .kz .caption { margin-top: .3em; min-height: 2.9em; }
        .kz .kz-walk > :nth-child(2) path { transition-delay: .35s; }
        .kz .kz-walk > :nth-child(2) .head { transition-delay: .65s; }
        .kz .kz-walk > :nth-child(3) path { transition-delay: .7s; }
        .kz .kz-walk > :nth-child(3) .head { transition-delay: 1s; }
        .kz .kz-walk > :nth-child(4) path { transition-delay: 1.05s; }
        .kz .kz-walk > :nth-child(4) .head { transition-delay: 1.35s; }
        .kz .kz-walk > :nth-child(5) path { transition-delay: 1.4s; }
        .kz .kz-walk > :nth-child(5) .head { transition-delay: 1.7s; }
      `}</style>
    </div>
  );
}
