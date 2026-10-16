/**
 * Demo build for GitHub Pages: the site lives under a sub-path (e.g. /amaze_genius/), but the components use
 * root-relative URLs (/media/…, /fonts/…, /#kontakt). After `astro build` with SITE_BASE set, this rewrites those
 * URLs in dist/client so every link and asset points into the sub-path. Production builds (base "/") skip it.
 *
 * Usage: SITE_URL=https://jmalture.github.io SITE_BASE=/amaze_genius/ node scripts/rebase.mjs
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const base = process.env.SITE_BASE || '/';
const origin = (process.env.SITE_URL || '').replace(/\/$/, '');
if (base === '/') process.exit(0);
const b = base.replace(/\/$/, ''); // "/amaze_genius"
const root = path.resolve('dist/client');

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
let files = 0;
const attr = new RegExp(`(\\s(?:src|href|srcset|action|poster|content)=")/(?!${esc(b.slice(1))}/|/)`, 'g');
const cssUrl = new RegExp(`url\\((['"]?)/(?!${esc(b.slice(1))}/|/)`, 'g');
for await (const file of walk(root)) {
  if (!/\.(html|css|xml)$/.test(file)) continue; // JS is left alone (Astro already prefixes its own assets)
  const src = await readFile(file, 'utf8');
  let out = src.replace(attr, `$1${b}/`).replace(cssUrl, `url($1${b}/`);
  if (origin) out = out.replace(new RegExp(`${esc(origin)}/(?!${esc(b.slice(1))}/)`, 'g'), `${origin}${b}/`);
  if (out !== src) {
    await writeFile(file, out);
    files++;
  }
}
console.log(`[rebase] rewrote root-relative URLs to ${b}/ in ${files} files`);
