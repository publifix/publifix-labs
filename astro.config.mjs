import { defineConfig } from 'astro/config';

export default defineConfig({
  // GitHub Pages project-site URL. If a custom domain (e.g. publifix.net) is
  // ever attached via Settings -> Pages, update `site` to that domain and
  // drop `base` (custom domains serve from the root, not a subpath).
  site: 'https://publifix.github.io',
  base: '/publifix-labs/',
  compressHTML: true,
});
