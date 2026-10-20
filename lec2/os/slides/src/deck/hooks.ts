import { useEffect, useRef, useState } from 'preact/hooks';
import type { RefObject } from 'preact';

/**
 * Hooks for islands. Each takes a ref to any element inside the slide and talks
 * to the deck through events on the slide's <section> (see deck.ts).
 */

/**
 * Current step of the slide containing `ref`. The slide needs a data-steps="N"
 * wrapper so the deck knows how many steps to give it:
 *   <div data-steps="4"><MyIsland client:load /></div>
 */
export function useSlideStep(ref: RefObject<Element>) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const slide = ref.current?.closest<HTMLElement>('.slide');
    if (!slide) return;
    // the deck may have set the step before this island hydrated
    setStep(Number(slide.dataset.step ?? 0));
    const onStep = (e: Event) => setStep((e as CustomEvent).detail.step);
    slide.addEventListener('slide:step', onStep);
    return () => slide.removeEventListener('slide:step', onStep);
  }, []);
  return step;
}

/** Whether the slide containing `ref` is the one on screen. */
export function useSlideActive(ref: RefObject<Element>) {
  const [on, setOn] = useState(false);
  useEffect(() => {
    const slide = ref.current?.closest<HTMLElement>('.slide');
    if (!slide) return;
    setOn(slide.classList.contains('active'));
    const enter = () => setOn(true), leave = () => setOn(false);
    slide.addEventListener('slide:enter', enter);
    slide.addEventListener('slide:leave', leave);
    return () => {
      slide.removeEventListener('slide:enter', enter);
      slide.removeEventListener('slide:leave', leave);
    };
  }, []);
  return on;
}

/**
 * Calls `frame(ms)` every animation frame while the slide is on screen, with
 * ms since the slide was entered (so the animation restarts each visit).
 * Write to the DOM through refs in `frame`; don't set state 60 times a second.
 */
export function useFrame(ref: RefObject<Element>, frame: (ms: number) => void) {
  const cb = useRef(frame);
  cb.current = frame;
  useEffect(() => {
    const slide = ref.current?.closest<HTMLElement>('.slide');
    let start = performance.now();
    let raf = 0;
    const restart = () => (start = performance.now());
    slide?.addEventListener('slide:enter', restart);
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      if (slide && !slide.classList.contains('active')) return;
      cb.current(now - start);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      slide?.removeEventListener('slide:enter', restart);
    };
  }, []);
}

/**
 * A counter that goes up by one every `ms` while the slide is on screen, and
 * resets to 0 when the slide is entered. For things that run by themselves
 * (a program counter stepping, a loop animating) instead of on key presses.
 */
export function useTicker(ref: RefObject<Element>, ms: number) {
  const [n, setN] = useState(0);
  const active = useSlideActive(ref);
  useEffect(() => {
    if (!active) return;
    setN(0);
    const id = setInterval(() => setN((x) => x + 1), ms);
    return () => clearInterval(id);
  }, [active, ms]);
  return n;
}
