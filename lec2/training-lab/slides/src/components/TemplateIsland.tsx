/** @jsxImportSource preact */
import { useRef } from 'preact/hooks';
import { useSlideStep } from '../deck/hooks';

/**
 * Start here for a new island: copy this file, rename, edit.
 *
 * Use it on a slide, wrapped in data-steps so the deck gives it key presses:
 *   ---
 *   import MyThing from '../components/MyThing.tsx';
 *   ---
 *   <h2>title</h2>
 *   <div data-steps="3"><MyThing client:load /></div>
 *
 * Then `step` goes 0 → 3 as you press →, and back down with ←. Render purely
 * from `step` (don't accumulate state on each change), so going back, jumping
 * with the picker, reloading at #5.2 and print mode all just work.
 *
 * Other hooks in deck/hooks.ts: useSlideActive, useFrame (per-frame animation
 * while on screen), useTicker (a counter that runs by itself).
 * Ready-made pieces in components/viz.
 */

// all the per-step content in one table, so the story reads top to bottom
const STEPS = [
  { text: 'step 0: what you see when the slide opens', n: 1 },
  { text: 'step 1: press → and things change', n: 2 },
  { text: 'step 2: css transitions do the animating', n: 4 },
  { text: 'step 3: render from step, nothing else', n: 8 },
];

export default function TemplateIsland() {
  const root = useRef<HTMLDivElement>(null);
  const step = useSlideStep(root);
  const cur = STEPS[step];

  return (
    <div class="template-island" ref={root}>
      <div class="boxes">
        {Array.from({ length: 8 }, (_, i) => <div class={`b ${i < cur.n ? 'on' : ''}`} />)}
      </div>
      <div class="caption">{cur.text}</div>
      {/* styles scoped by the root class; put shared ones in styles/ instead */}
      <style>{`
        .template-island .boxes { display: flex; gap: .4em; }
        .template-island .b { width: 2em; height: 2em; border-radius: 6px; background: var(--surface);
          transition: background .3s, transform .3s; }
        .template-island .b.on { background: var(--accent); transform: translateY(-.3em); }
      `}</style>
    </div>
  );
}
