import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import preact from '@astrojs/preact';
import deckNotes from './src/deck/notes-server';

export default defineConfig({
  // preact powers animated islands; mdx lets slides be written as markdown;
  // deckNotes saves notes typed in the presenter window (bun dev only).
  integrations: [preact(), mdx(), deckNotes()],
  // no astro dev toolbar floating over the slides under bun dev
  devToolbar: { enabled: false },
  // set when hosting under a subpath, e.g. base: '/my-deck' for user.github.io/my-deck
  // base: '/my-deck',
});
