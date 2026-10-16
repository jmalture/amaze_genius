# amaze_genius

Marketing website for **Amaze Genius**, the white-label Web2Print editor by Jenomics GmbH (photo books, calendars,
mugs, puzzles, prints). Static pages built with [Astro](https://astro.build) + TypeScript, plus one small Node
endpoint for the demo-request form. Same architecture as `jmalture/sdx-website` and `jmalture/jenomics-website`.

## How it works

- **One template per page, all languages.** `src/templates/Home.astro` renders the homepage; `src/pages/index.astro`
  only passes the language. Texts live in `src/i18n/<page>.json` as `{ "de": {...} }`; German only for now
  (EN is prepared in `src/i18n/index.ts`, add `"en"` blocks and `src/pages/en/index.astro` when needed).
- **Sections** are components in `src/components/home/NN-<name>.astro`, each with its own CSS
  (`<style is:global>`, class prefix `ag-`) and, where needed, a small vanilla script. Order: `src/components/home/index.astro`.
- **Design system** (tokens, buttons, chips, cards, reveal, spectrum line): `src/styles/site.css`. Brand rules: `docs/BRAND.md`.
- **Ribbons** (the animated rainbow string-art lines in the hero and behind the contact form): `src/scripts/ribbons.ts`
  (engine) and `src/scripts/ribbon-poses.ts` (the shapes, traced from the 2023 motifs), plain WebGL (no Three.js, ~4 KB). Without a GPU (software rendering, e.g. PageSpeed's headless Chrome) or with
  `prefers-reduced-motion` it draws one still frame; a watchdog freezes it on devices that can't keep up.
- **Shared behaviour** (reveal on scroll, header, drawer, nav ink + scroll spy, spotlight cards, tilt): `src/scripts/site.ts`.
- `src/pages/api/contact.ts` is the only server route (demo request form, stores to JSONL, then mails).

## Commands

```
npm install
npm run dev       # http://localhost:4321
npm run build     # static pages in dist/client, server in dist/server
npm start         # serves dist (needs a build first)
npm run format    # Prettier
```

## Demo for colleagues (GitHub Pages)

Every push to `main` runs `.github/workflows/pages.yml`: it builds the site under `/amaze_genius/`, rewrites
root-relative URLs (`scripts/rebase.mjs`) and pushes the result to the `gh-pages` branch.
Demo: https://jmalture.github.io/amaze_genius/ (noindex; the contact form needs the Node server, so it doesn't
send there). One-time setup: repo Settings → Pages → Source "Deploy from a branch", branch `gh-pages`, folder `/`.

## Deployment (Hostinger Node.js app, linked via GitHub)

- Build command `npm run build`, start command `npm start`, Node 20.3 or newer.
- `npm start` runs `server.mjs`: it serves dist/client itself (Brotli/gzip, compressed once at start-up; `/_astro/*`
  cached for a year, fonts/media 30 days, HTML revalidated) and passes `/api/*` and 404s to Astro's Node handler.
  Reads `PORT` (set by Hostinger) and `HOST` (default 0.0.0.0).
- Environment variables: see `.env.example` (SMTP, recipients, `SUBMISSIONS_DIR`).
- Set the final domain in `astro.config.mjs` (`site`).

## Performance rules

- No third-party requests; Outfit + Wix Madefor Display self-hosted, latin subsets preloaded.
- All CSS inlined; scripts are small deferred modules. LCP is the hero headline (text).
- Animations are transform/opacity only, WebGL pauses off screen / in background tabs.
- Hero: a still poster of the ribbon (`public/media/hero-ribbon*.webp`, ~50/30 KB) paints immediately; WebGL starts
  after the load event when the browser is idle, compiles its shaders in the background
  (KHR_parallel_shader_compile) and cross-fades in. No GPU (software renderer) or reduced motion: poster only.
  Re-render the posters after changing the first pose: open `/?pose=0` and capture the hero (see docs/STATUS.md).
- Target: 100 in PageSpeed. Measured locally with server.mjs: desktop 100, mobile 99 (slow-4G simulation).

Status, open questions and where the real graphics go: `docs/STATUS.md`.
