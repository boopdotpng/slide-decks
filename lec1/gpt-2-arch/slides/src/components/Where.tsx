/** @jsxImportSource preact */
import { Crumbs } from './viz';

/** where we are in the model, top-right of a slide */
const STAGES = ['tokens', 'embed', 'ln', 'attn', 'mlp', 'unembed'];
export function Where({ at }: { at: string }) {
  return <Crumbs items={STAGES} at={at} />;
}
