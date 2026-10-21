/** @jsxImportSource preact */
import { useEffect, useRef } from 'preact/hooks';
import * as THREE from 'three';
import { deckScale, useSlideActive, useSlideStep } from '../deck/hooks';
import { Tok, diverging, sequential, useData } from './viz';
import { headColor } from './common';

/**
 * 12 heads through one attention layer, in 3d. Real block 3 attention maps (forward.json) on the score plates.
 * Every position, rotation and opacity is a function of the step (TARGET below); a step change tweens from wherever
 * things are to the new target, and entering the slide snaps straight to it, so #N.K always shows the same picture.
 * Steps:
 *  0. the 4 strips
 *  1. the glued grids: query, key, value for every token
 *  2. color the 12 heads: 64 columns each
 *  3. the cuts open up
 *  4. each head's piece slides back into a stack
 *  5. match: every head scores every pair of tokens, all at once
 *  6. block the future, turn scores into budgets
 *  7. the 12 patterns side by side
 *  8. copy: each head's result
 *  9. the 12 results side by side again
 * 10. the output grid: the only place the heads mix
 */
export const LAST = 10;
const S = 4, NH = 12;
// world units per channel / per token. not to scale with each other: 768 channels would be 190× wider than 4 tokens
const CW = 0.006, TH = 0.49;
const WD = 768 * CW, BW = 64 * CW, SH = S * TH, DEPTH = 0.04;
const DZ = 0.22; // gap between heads in a stack
const MIDZ = -5.5 * DZ; // the middle of a stack, where the operators between stacks float
const GAP = 0.14; // gap between bands once they're cut
const Y = { x: 3.6, q: 1.2, k: -1.2, v: -3.6 };
const X = { q: -6, k: -3.4, s: 0.2, v: 3.4, o: 5.6 }; // stack centers
const CONCAT_Y = 1.4, PROJ_Y = -1.4;
const NEUTRAL = '#5b6b80';
const grid = (h: number) => [((h % 4) - 1.5) * 2.5 + X.s, (1 - Math.floor(h / 4)) * 2.75, 0] as V3;

type V3 = [number, number, number];
type St = { p: V3; r: number; o: number; c: number }; // position, z-rotation, opacity, 0 = neutral … 1 = head color
const st = (p: V3, o = 1, r = 0, c = 1): St => ({ p, r, o, c });
const HIDE = (p: V3): St => st(p, 0, 0, 0);

// band h of q/k/v: in the (4, 768) slab, cut apart, or stacked by head
const bandX = (h: number, gap: number) => (h - 5.5) * (BW + gap);
function band(m: 'q' | 'k' | 'v', h: number, s: number): St {
  const stacked: V3 = [X[m], 0, -h * DZ];
  if (s === 0) return HIDE([bandX(h, 0), Y[m], 0]);
  if (s <= 3) return st([bandX(h, s >= 3 ? GAP : 0), Y[m], 0], 1, 0, s >= 2 ? 1 : 0);
  const fade = s === 7 || s >= 9 || (s === 8 && m !== 'v') ? 0 : 1;
  return st(stacked, fade, m === 'k' && s >= 5 ? -Math.PI / 2 : 0);
}
const scorePlate = (h: number, s: number, probs: boolean): St => {
  const p: V3 = s === 7 ? grid(h) : [X.s, 0, -h * DZ];
  const on = probs ? s >= 6 && s <= 8 : s === 5;
  return st(p, on ? 1 : 0);
};
const outBand = (h: number, s: number): St =>
  s >= 9 ? st([bandX(h, 0), CONCAT_Y, 0]) : st([X.o, 0, -h * DZ], s === 8 ? 1 : 0);

type Cam = { c: V3; az: number; el: number; w: number; h: number }; // look at c, from azimuth/elevation (deg); fit w × h
const FRONT = (c: V3, w: number, h: number): Cam => ({ c, az: 0, el: 0, w, h });
const ANGLE = (c: V3, w: number, h: number): Cam => ({ c, az: 28, el: 16, w, h });
const CAMS: Cam[] = [
  FRONT([0, Y.x, 0], 6.4, 2.9),
  FRONT([0, 0, 0], 7, 10.2),
  FRONT([0, 0, 0], 7, 10.2),
  FRONT([0, -1.2, 0], 8.4, 7.6),
  ANGLE([0, 0.4, -1.2], 14.6, 5),
  ANGLE([-3, 0.3, -1.2], 9.4, 4.4),
  ANGLE([-3, 0.3, -1.2], 9.4, 4.4),
  FRONT([X.s, 0.15, 0], 10.4, 8.6),
  ANGLE([2.6, 0.3, -1.2], 9.6, 4.4),
  FRONT([0, CONCAT_Y, 0], 6.6, 3.4),
  FRONT([0, 0, 0], 6.6, 6.4),
];

type Label = { at: (s: number) => St; html: preact.ComponentChildren; cls?: string; color?: string };
const L = (show: (s: number) => boolean, p: (s: number) => V3, html: preact.ComponentChildren, cls = '', color?: string): Label =>
  ({ at: (s) => st(p(s), show(s) ? 1 : 0), html, cls, color });
const between = (a: number, b: number) => (s: number) => s >= a && s <= b;
const under = (x: number): V3 => [x, -SH / 2 - 0.12, 0];

const NAME = { q: 'query', k: 'key', v: 'value' };
const FH = 3; // the head we followed (forward.json focus)
function labels(toks: string[]): Label[] {
  const out: Label[] = [
    L(between(0, 2), () => [0, Y.x + SH / 2 + 0.05, 0], <>the 4 strips</>, 'up'),
    ...toks.map((t, r) => L((s) => s === 0, () => [-WD / 2 - 0.06, Y.x + SH / 2 - (r + 0.5) * TH, 0], <Tok t={t} />, 'left tokl')),
    ...(['q', 'k', 'v'] as const).flatMap((m) => [
      L(between(1, 2), () => [-WD / 2 - 0.1, Y[m], 0], <>{NAME[m]}</>, 'left'),
      L((s) => s === 3, () => [bandX(0, GAP) - BW / 2 - 0.1, Y[m], 0], <>{NAME[m]}</>, 'left'),
    ]),
    ...Array.from({ length: NH }, (_, h) =>
      L(between(2, 3), (s) => [bandX(h, s >= 3 ? GAP : 0), Y.q + SH / 2 + 0.05, 0], <>{h}</>, 'up hd', headColor(h))),
    L(between(4, 6), () => under(X.q), <>query</>, 'down'),
    L((s) => s === 4, () => under(X.k), <>key</>, 'down'),
    L(between(5, 6), () => [X.k, -BW / 2 - 0.12, 0], <>key, turned</>, 'down'),
    L((s) => s >= 4 && s <= 8 && s !== 7, () => under(X.v), <>value</>, 'down'),
    L(between(5, 6), () => [(X.q + BW / 2 + X.k - SH / 2) / 2, 0, MIDZ], '·', 'op'),
    L(between(5, 6), () => [(X.k + SH / 2 + X.s - SH / 2) / 2, 0, MIDZ], '=', 'op'),
    L((s) => s === 5, () => under(X.s), <>scores</>, 'down'),
    L((s) => s === 6 || s === 8, () => under(X.s), <>budgets</>, 'down'),
    L((s) => s === 8, () => [(X.s + SH / 2 + X.v - BW / 2) / 2, 0, MIDZ], '·', 'op'),
    L((s) => s === 8, () => [(X.v + X.o) / 2, 0, MIDZ], '=', 'op'),
    L((s) => s === 8, () => under(X.o), <>results</>, 'down'),
    ...Array.from({ length: NH }, (_, h) => L((s) => s === 7, () => {
      const [x, y] = grid(h);
      return [x, y + SH / 2 + 0.06, 0];
    }, h === FH ? <>head {h} · ours</> : <>head {h}</>, 'up hd', headColor(h))),
    L(between(9, 10), () => [-WD / 2 - 0.1, CONCAT_Y, 0], <>12 results</>, 'left'),
    L((s) => s === 10, () => [0, (CONCAT_Y + PROJ_Y) / 2, 0], <>output grid</>, 'mid'),
    L((s) => s === 10, () => [-WD / 2 - 0.1, PROJ_Y, 0], <>back to the stream</>, 'left'),
  ];
  return out;
}

const CAP = [
  <>the 4 strips, going into one attention block</>,
  <>one multiply through the glued grid: <b>query</b>, <b>key</b> and <b>value</b> strips for every token</>,
  <>each of them is really <b>12 heads × 64</b> numbers, side by side</>,
  <>cut along the lines. no numbers change, they're just grouped by head</>,
  <>stack each head's pieces: 12 small heads, each the one we just walked through</>,
  <>match: every head scores every token against every other, all at once</>,
  <>block the future, turn scores into budgets: <b>12 attention patterns</b> (real, block 3)</>,
  <>side by side: every head learned to look for something different</>,
  <>copy: each head's result, still 12 separate heads. none of them saw another</>,
  <>the 12 results lined up side by side again</>,
  <>through the <b>output grid</b>: every number reads all 12 heads. the only place they mix</>,
];

// ── scene ─────────────────────────────────────────────────────────────────
type Item = { obj: THREE.Object3D; mats: (THREE.Material & { opacity: number })[]; color?: [THREE.Color, THREE.Color]; target: (s: number) => St };
const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const lerpSt = (a: St, b: St, t: number): St => ({ p: a.p.map((v, i) => lerp(v, b.p[i], t)) as V3, r: lerp(a.r, b.r, t), o: lerp(a.o, b.o, t), c: lerp(a.c, b.c, t) });
const lerpCam = (a: Cam, b: Cam, t: number): Cam => ({ c: a.c.map((v, i) => lerp(v, b.c[i], t)) as V3, az: lerp(a.az, b.az, t), el: lerp(a.el, b.el, t), w: lerp(a.w, b.w, t), h: lerp(a.h, b.h, t) });

function rowsTexture() { // white with a faint line between token rows, multiplied by each plate's color
  const c = document.createElement('canvas');
  c.width = 64; c.height = S * 8;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.fillStyle = '#a9a9a9';
  for (let r = 1; r < S; r++) g.fillRect(0, r * 8 - 1, c.width, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function mixedTexture() { // c_proj's output: every column is a blend of all 12 heads
  const c = document.createElement('canvas');
  c.width = 768; c.height = S * 8;
  const g = c.getContext('2d')!;
  const cols = Array.from({ length: NH }, (_, h) => new THREE.Color(headColor(h)));
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let x = 0; x < 768; x += 4) {
    const w = cols.map(() => rnd() ** 3);
    const sum = w.reduce((a, b) => a + b);
    const m = new THREE.Color(0, 0, 0);
    cols.forEach((col, h) => m.add(col.clone().multiplyScalar(w[h] / sum)));
    g.fillStyle = `#${m.getHexString()}`; g.fillRect(x, 0, 4, c.height);
  }
  g.fillStyle = 'rgba(0,0,0,.35)';
  for (let r = 1; r < S; r++) g.fillRect(0, r * 8 - 1, c.width, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function mapTexture(m: number[][], color: (v: number, r: number, c: number) => string) {
  const data = new Uint8Array(S * S * 4);
  const col = new THREE.Color();
  for (let r = 0; r < S; r++) for (let c = 0; c < S; c++) {
    const hex = col.setStyle(color(m[r][c], r, c)).getHex(); // srgb bytes, same as the css color
    data.set([hex >> 16, (hex >> 8) & 255, hex & 255, 255], ((S - 1 - r) * S + c) * 4); // texture row 0 is the bottom
  }
  const t = new THREE.DataTexture(data, S, S);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.NearestFilter;
  t.needsUpdate = true;
  return t;
}

function build(el: HTMLElement, labelEls: HTMLElement[], labelDefs: Label[], d: any, print: boolean) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: print });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  el.prepend(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  const disposables: { dispose(): void }[] = [renderer];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const rows = keep(rowsTexture());
  const plateGeo = (w: number, h: number) => keep(new THREE.BoxGeometry(w, h, DEPTH));
  const items: Item[] = [];
  function plate(geo: THREE.BoxGeometry, map: THREE.Texture, color: [string, string] | string, edge: string, target: (s: number) => St) {
    const [c0, c1] = typeof color === 'string' ? [color, color] : color;
    const mat = keep(new THREE.MeshBasicMaterial({ map, color: c0, transparent: true }));
    const mesh = new THREE.Mesh(geo, mat);
    const lmat = keep(new THREE.LineBasicMaterial({ color: edge, transparent: true }));
    mesh.add(new THREE.LineSegments(keep(new THREE.EdgesGeometry(geo)), lmat));
    scene.add(mesh);
    items.push({ obj: mesh, mats: [mat, lmat], color: [new THREE.Color(c0), new THREE.Color(c1)], target });
  }

  plate(plateGeo(WD, SH), rows, NEUTRAL, '#8796aa', (s) => st([0, Y.x, 0], s <= 2 ? 1 : 0, 0, 0));
  const bandGeo = plateGeo(BW, SH);
  for (const m of ['q', 'k', 'v'] as const)
    for (let h = 0; h < NH; h++) plate(bandGeo, rows, [NEUTRAL, headColor(h)], '#0a0a0a', (s) => band(m, h, s));
    const mapGeo = plateGeo(SH, SH);
  for (let h = 0; h < NH; h++) {
    const sc = keep(mapTexture(d.scores_focus_block[h], (v) => diverging(v, 3)));
    const pr = keep(mapTexture(d.probs_focus_block[h], (v, r, c) => (c > r ? '#111111' : sequential(Math.sqrt(v)))));
    plate(mapGeo, sc, '#ffffff', headColor(h), (s) => scorePlate(h, s, false));
    plate(mapGeo, pr, '#ffffff', headColor(h), (s) => scorePlate(h, s, true));
  }
  for (let h = 0; h < NH; h++) plate(bandGeo, rows, headColor(h), '#0a0a0a', (s) => outBand(h, s));
  plate(plateGeo(WD, SH), keep(mixedTexture()), '#ffffff', '#8796aa', (s) => st([0, PROJ_Y, 0], s >= 10 ? 1 : 0));

  // per-item and per-label current state, and where the tween started from
  let step = 0, t0 = 0, dirty = true;
  let cur = items.map((it) => it.target(0)), from = cur;
  let lcur = labelDefs.map((l) => l.at(0)), lfrom = lcur;
  let cam = CAMS[0], camFrom = cam;
  const DUR = 900;

  function apply(t: number) {
    const e = ease(t);
    cur = items.map((it, i) => lerpSt(from[i], it.target(step), e));
    lcur = labelDefs.map((l, i) => lerpSt(lfrom[i], l.at(step), e));
    cam = lerpCam(camFrom, CAMS[step], e);
    items.forEach((it, i) => {
      const s = cur[i];
      it.obj.position.set(...s.p);
      it.obj.rotation.z = s.r;
      it.obj.visible = s.o > 0.01;
      it.mats.forEach((m) => (m.opacity = s.o));
      if (it.color) (it.mats[0] as THREE.MeshBasicMaterial).color.lerpColors(it.color[0], it.color[1], s.c);
    });
  }
  function frameCamera() {
    const { clientWidth: w, clientHeight: h } = el;
    const aspect = w / Math.max(1, h);
    const vh = Math.max(cam.h, cam.w / aspect);
    camera.left = -vh * aspect / 2; camera.right = vh * aspect / 2; camera.top = vh / 2; camera.bottom = -vh / 2;
    const az = cam.az * Math.PI / 180, el_ = cam.el * Math.PI / 180;
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el_), Math.sin(el_), Math.cos(az) * Math.cos(el_));
    camera.position.set(...cam.c).addScaledVector(dir, 30);
    camera.lookAt(...cam.c);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    const v = new THREE.Vector3();
    labelEls.forEach((le, i) => {
      if (!le) return;
      const s = lcur[i];
      v.set(...s.p).project(camera);
      le.style.transform = `translate(${(v.x + 1) / 2 * w}px, ${(1 - v.y) / 2 * h}px)`;
      le.style.opacity = String(s.o);
      le.style.visibility = s.o > 0.01 ? 'visible' : 'hidden';
    });
  }
  function render() {
    const { clientWidth: w, clientHeight: h } = el;
    // the slide is scaled to the window, so draw at the on-screen size to stay sharp
    renderer.setPixelRatio(Math.min(3, window.devicePixelRatio * deckScale()));
    renderer.setSize(w, h, true);
    frameCamera();
    renderer.render(scene, camera);
  }

  let raf = 0;
  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const t = Math.min(1, (now - t0) / DUR);
    if (t < 1 || dirty) { apply(t); render(); dirty = t < 1; }
  };
  const ro = new ResizeObserver(() => (dirty = true));
  ro.observe(el);
  const onResize = () => (dirty = true); // window resizes change deckScale, not el's size
  addEventListener('resize', onResize);

  return {
    go(s: number, snap: boolean) {
      from = cur; lfrom = lcur; camFrom = cam;
      step = s;
      t0 = snap ? -Infinity : performance.now();
      dirty = true;
    },
    start() { apply(1); render(); raf = requestAnimationFrame(tick); },
    snapshot() { apply(1); render(); return renderer.domElement.toDataURL('image/png'); },
    dispose() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      removeEventListener('resize', onResize);
      disposables.forEach((x) => x.dispose());
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

export default function Heads3D() {
  const root = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const labelEls = useRef<HTMLElement[]>([]);
  const view = useRef<ReturnType<typeof build> | null>(null);
  const img = useRef<HTMLImageElement>(null);
  const step = useSlideStep(root);
  const active = useSlideActive(root);
  const d = useData('forward');
  const defs = useRef<Label[] | null>(null);
  if (d && !defs.current) defs.current = labels(d.toks);
  const print = typeof location !== 'undefined' && new URLSearchParams(location.search).has('print');
  const s = Math.min(step, LAST);

  // the gl context only exists while the slide is on screen
  useEffect(() => {
    if (!d || !stage.current || !(active || print)) return;
    const v = build(stage.current, labelEls.current, defs.current!, d, print);
    v.go(s, true);
    if (print) { // one still image per print page, then give the context back
      requestAnimationFrame(() => {
        if (img.current) { img.current.src = v.snapshot(); img.current.style.display = 'block'; }
        v.dispose();
      });
      return;
    }
    v.start();
    view.current = v;
    return () => { v.dispose(); view.current = null; };
  }, [d, active, print]);
  useEffect(() => { view.current?.go(s, false); }, [s]);

  return (
    <div class="h3" ref={root}>
      <div class="stage" ref={stage}>
        <img ref={img} class="still" alt="" />
        {defs.current?.map((l, i) => (
          <div class={`lb ${l.cls}`} style={l.color ? { color: l.color } : undefined} ref={(e) => { if (e) labelEls.current[i] = e; }}>
            <span>{l.html}</span>
          </div>
        ))}
      </div>
      <div class="cap">{CAP[s]}</div>
      <style>{`
        .h3 { flex: 1; display: flex; flex-direction: column; gap: .3em; min-height: 0; }
        .h3 .stage { position: relative; flex: 1; min-height: 0; overflow: hidden; }
        .h3 .stage canvas, .h3 .still { position: absolute; inset: 0; width: 100%; height: 100%; }
        .h3 .still { display: none; object-fit: contain; }
        .h3 .lb { position: absolute; left: 0; top: 0; pointer-events: none; white-space: nowrap; visibility: hidden;
          font-family: var(--mono); font-size: .5em; color: var(--fg); }
        .h3 .lb > span { position: absolute; transform: translate(-50%, -50%); }
        .h3 .lb.up > span { transform: translate(-50%, -100%); }
        .h3 .lb.down > span { transform: translate(-50%, 0); }
        .h3 .lb.left > span { transform: translate(-100%, -50%); }
        .h3 .lb.tokl { font-size: .42em; color: var(--muted); }
        .h3 .lb.op { font-size: .9em; font-family: var(--sans); }
        .h3 .lb.hd { font-size: .45em; }
        .h3 .lb .shp { color: var(--muted); }
        .h3 .cap { font-size: .62em; color: var(--muted); min-height: 2.2em; max-width: 56em; }
        .h3 .cap b { color: var(--fg); font-family: var(--mono); font-weight: normal; }
      `}</style>
    </div>
  );
}
