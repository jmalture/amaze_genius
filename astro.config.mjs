// @ts-check
import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// Domain not decided yet: change the default `site` once it is (canonical, hreflang, sitemap, OG URLs).
// The GitHub Pages demo build sets SITE_URL / SITE_BASE (see .github/workflows/pages.yml and scripts/rebase.mjs).
export default defineConfig({
  site: process.env.SITE_URL || 'https://www.amaze-genius.de',
  base: process.env.SITE_BASE || '/',
  trailingSlash: 'always',
  // Pages are pre-rendered to static HTML; only /api/* runs on the Node server (contact form).
  output: 'static',
  adapter: node({ mode: 'standalone' }),
  build: {
    // Inline all CSS into the HTML: no render-blocking stylesheet requests.
    inlineStylesheets: 'always',
    format: 'directory',
  },
  compressHTML: true,
  security: { checkOrigin: false },
  prefetch: { prefetchAll: false, defaultStrategy: 'hover' },
  integrations: [
    sitemap({
      i18n: { defaultLocale: 'de', locales: { de: 'de-DE', en: 'en-US' } },
      filter: (page) => !page.includes('/api/'),
    }),
  ],
});
