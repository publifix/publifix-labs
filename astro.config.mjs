import { defineConfig } from 'astro/config';

import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // Served from the custom domain root (labs.publifix.net), not a
  // publifix.github.io/publifix-labs/ subpath — no `base` needed.
  site: 'https://labs.publifix.net',

  compressHTML: true,
  integrations: [sitemap()],
});
