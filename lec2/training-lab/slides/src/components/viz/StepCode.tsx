/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import Code, { type Lang } from '../Code';
import { useSlideStep } from '../../deck/hooks';

/**
 * Code whose highlighted lines follow the slide step, so a slide can show the
 * real code next to an island without the island knowing about it. It adds no
 * steps of its own; the island's data-steps wrapper sets the count.
 *
 *   <StepCode client:load code={src} hl={{ 1: [0], 2: [1, 2] }} />   // step -> 0-based lines
 */
export function StepCode({ code, lang = 'py', hl = {}, class: cls = '' }: {
  code: string; lang?: Lang; hl?: Record<number, number[]>; class?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  return <div class={`step-code ${cls}`} ref={root}><Code code={code} lang={lang} hl={hl[step]} /></div>;
}
