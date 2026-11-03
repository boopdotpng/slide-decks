import { defineConfig } from 'astro/config';
import slides from 'slides';

export default defineConfig({ integrations: [slides()] });
