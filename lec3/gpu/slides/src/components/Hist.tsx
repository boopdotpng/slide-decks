/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import type { ComponentChildren } from 'preact';
import { useSlideStep } from 'slides/hooks';
import { IMG, HIST, MAX, P99, AUTO, N, brighten } from './image';
import { HistChart, Photo, fmt, type Mark } from './hist-parts';

/**
 * Slide 15: why the next program is a histogram. Scaling by the brightest pixel does nothing (the sun is MAX), so
 * count the pixels at each brightness and scale by the one 99% of them are at or under (P99). All from image.ts.
 */
const SUN = HIST.slice(200).reduce((a, b) => a + b, 0);
const BY_MAX = Math.floor(255 / MAX);
const UNDER = HIST.slice(0, P99 + 1).reduce((a, b) => a + b, 0);
const BY2 = brighten(IMG, 2), BYMAX = brighten(IMG, BY_MAX), BYAUTO = brighten(IMG, AUTO);

type St = { img: Uint8Array; label: ComponentChildren; bars: boolean; marks: Mark[]; text: ComponentChildren };
const STEPS: St[] = [
  { img: BY2, label: <>× 2: the factor we picked by hand</>, bars: false, marks: [],
    text: <>last program, we picked "× 2" by looking at the photo. still too dark. can the computer pick the number itself?</> },
  { img: BYMAX, label: <>× {BY_MAX}: 255 / {MAX}. nothing changed</>, bars: false, marks: [],
    text: <>first idea: scale so the brightest pixel becomes white (255). but the brightest pixel is the sun, at <b>{MAX}</b>. 255 / {MAX} = <b>{BY_MAX}</b> (whole numbers): nothing happens</> },
  { img: IMG, label: <>the photo as it is</>, bars: true, marks: [],
    text: <>so count: for each brightness 0 … 255, how many pixels have it. that's a <b>histogram</b>: 256 counters, {fmt(N)} pixels</> },
  { img: IMG, label: <>the photo as it is</>, bars: true,
    marks: [{ v: MAX, label: <>the sun: {SUN} pixels</>, cls: 'bad' }],
    text: <>two humps: the dark hills and lake on the left, the sky in the middle. far right, a sliver: the sun. {SUN} pixels decide the brightest one</> },
  { img: BYAUTO, label: <>× {AUTO}: picked from the histogram</>, bars: true,
    marks: [{ v: P99, label: <>99% are at or under {P99}</>, cls: 'good' }, { v: MAX, label: <>the sun</>, cls: 'bad' }],
    text: <>walk the counters from the left until 99% of the pixels are behind you ({fmt(UNDER)} of {fmt(N)}): brightness <b>{P99}</b>. 255 / {P99} = <b>{AUTO}</b>. the sun stays white, everything else gets brighter</> },
  { img: BYAUTO, label: <>× {AUTO}: picked from the histogram</>, bars: true,
    marks: [{ v: P99, label: <>99% are at or under {P99}</>, cls: 'good' }, { v: MAX, label: <>the sun</>, cls: 'bad' }],
    text: <>so we need the histogram, on the gpu. one thread per pixel again, but now every thread adds 1 to <b>one of the same 256 counters</b>. that's new: so far, no two threads ever wrote the same place</> },
];

export default function Hist() {
  const root = useRef<HTMLDivElement>(null);
  const st = STEPS[Math.min(STEPS.length - 1, useSlideStep(root))];
  return (
    <div class="hist-need" ref={root}>
      <div class="hn-cols">
        <Photo img={st.img} label={st.label} class="hn-photo" />
        <div class={`hn-chart fade ${st.bars ? 'on' : ''}`}>
          <div class="muted hn-t">pixels at each brightness</div>
          <HistChart bins={HIST} marks={st.marks} height={300} />
          <div class="muted hn-x">brightness: 0 = black … 255 = white</div>
        </div>
      </div>
      <div class="caption hn-text">{st.text}</div>
      <style>{`
        .hist-need .hn-cols { display: flex; gap: 2em; align-items: flex-start; }
        .hist-need .hn-photo { flex: 0 0 34%; }
        .hist-need .hn-photo figcaption { font-size: .55em; }
        .hist-need .hn-chart { flex: 1; min-width: 0; }
        .hist-need .hn-t, .hist-need .hn-x { font-size: .5em; }
        .hist-need .hn-x { text-align: center; margin-top: .2em; }
        .hist-need .hn-text { font-size: .76em; min-height: 3.3em; margin-top: 1em; }
      `}</style>
    </div>
  );
}
