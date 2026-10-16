/**
 * Production server (`npm start`). Serves the pre-rendered pages and assets from dist/client itself, with
 * Brotli/gzip compression and long cache lifetimes, and hands everything else (the /api/contact/ route, 404s) to
 * Astro's Node handler. Same Astro build as before, only the static part is faster:
 *   - text files (HTML with all CSS inlined, JS, SVG, JSON, XML) are compressed once at start-up and kept in memory
 *   - /_astro/* files have a content hash in their name → cached for a year (immutable)
 *   - fonts and media → cached for 30 days; HTML → revalidated every time (so a deploy shows up at once)
 *
 * Environment: PORT (Hostinger sets it), HOST (default 0.0.0.0).
 */
import http from 'node:http';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import zlib from 'node:zlib';

process.env.ASTRO_NODE_AUTOSTART = 'disabled';
const { handler } = await import('./dist/server/entry.mjs');

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), 'dist', 'client');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
};
const COMPRESS = new Set(['.html', '.js', '.mjs', '.css', '.json', '.xml', '.txt', '.svg']);

/** url path → { body, br, gz, type, cache } for every file in dist/client, loaded once */
const files = new Map();
async function load(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      await load(full);
      continue;
    }
    const rel = '/' + path.relative(root, full).split(path.sep).join('/');
    const ext = path.extname(e.name).toLowerCase();
    const body = await readFile(full);
    const entry = {
      body,
      type: TYPES[ext] || 'application/octet-stream',
      cache: rel.startsWith('/_astro/')
        ? 'public, max-age=31536000, immutable'
        : ext === '.html'
          ? 'public, max-age=0, must-revalidate'
          : 'public, max-age=2592000',
      mtime: (await stat(full)).mtime.toUTCString(),
    };
    if (COMPRESS.has(ext) && body.length > 1024) {
      entry.br = zlib.brotliCompressSync(body, {
        params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: body.length },
      });
      entry.gz = zlib.gzipSync(body, { level: 9 });
    }
    files.set(rel, entry);
  }
}
await load(root);

function lookup(urlPath) {
  let p;
  try {
    p = decodeURIComponent(urlPath);
  } catch {
    return null;
  }
  if (p.includes('\0')) return null;
  if (files.has(p)) return { entry: files.get(p) };
  if (p.endsWith('/') && files.has(p + 'index.html')) return { entry: files.get(p + 'index.html') };
  if (!p.endsWith('/') && files.has(p + '/index.html')) return { redirect: p + '/' }; // trailingSlash: 'always'
  return null;
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' || req.method === 'HEAD') {
    const url = new URL(req.url || '/', 'http://x');
    const hit = lookup(url.pathname);
    if (hit?.redirect) {
      res.writeHead(301, { Location: hit.redirect + url.search });
      res.end();
      return;
    }
    if (hit?.entry) {
      const f = hit.entry;
      const accept = String(req.headers['accept-encoding'] || '');
      const enc = f.br && /\bbr\b/.test(accept) ? 'br' : f.gz && /\bgzip\b/.test(accept) ? 'gzip' : null;
      const body = enc === 'br' ? f.br : enc === 'gzip' ? f.gz : f.body;
      const headers = {
        'Content-Type': f.type,
        'Content-Length': body.length,
        'Cache-Control': f.cache,
        'Last-Modified': f.mtime,
        'X-Content-Type-Options': 'nosniff',
      };
      if (f.br) headers['Vary'] = 'Accept-Encoding';
      if (enc) headers['Content-Encoding'] = enc;
      res.writeHead(200, headers);
      res.end(req.method === 'HEAD' ? undefined : body);
      return;
    }
  }
  handler(req, res); // /api/contact/, 404 page
});

const port = Number(process.env.PORT || 4321);
const host = process.env.HOST || '0.0.0.0';
server.listen(port, host, () => console.log(`[server] http://${host}:${port} (${files.size} static files)`));
