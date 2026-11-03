import type { AstroIntegration } from 'astro';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { saveNote } from './notes-file';

/**
 * Dev-server endpoint the presenter window saves notes to:
 *   POST /__deck/notes  { slide: '03-bytes', md: '…' }  → src/slides/notes.md
 * Only exists under `bun dev`; a built deck shows notes read-only.
 */
export default function deckNotes(): AstroIntegration {
  return {
    name: 'deck-notes',
    hooks: {
      'astro:server:setup': ({ server }) => {
        const root = server.config.root;
        server.middlewares.use('/__deck/notes', (req, res) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
          let body = '';
          req.on('data', (c) => (body += c));
          req.on('end', () => {
            try {
              const { slide, md } = JSON.parse(body);
              // same order as pages/index.astro
              const names = readdirSync(join(root, 'src/slides'))
                .filter((f) => /\.(astro|mdx)$/.test(f))
                .sort((a, b) => a.localeCompare(b))
                .map((f) => f.replace(/\.\w+$/, ''));
              saveNote(root, names, String(slide), String(md));
              res.end('ok');
            } catch (e) {
              res.statusCode = 400;
              res.end(String(e));
            }
          });
        });
      },
    },
  };
}
