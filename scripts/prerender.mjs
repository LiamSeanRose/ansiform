/**
 * Build-time prerender + sitemap (#87).
 *
 * Runs AFTER `vite build` (client) and the `--ssr` build of `src/entry-server`.
 * For every app route it renders the real markup and splices it — with the
 * route's true <title>/<meta description> — into the built dist/index.html shell,
 * writing dist/<route>/index.html. So crawlers and no-JS visitors get real H1 +
 * body copy instead of a blank SPA shell; the client bundle still boots normally.
 *
 * Zero-egress / no-deploy: this only WRITES files into dist/. It never serves,
 * uploads, or fetches anything. The sitemap.xml + canonical links require an
 * absolute origin, so they are emitted ONLY when the SITE_ORIGIN env var is set —
 * no domain is ever assumed.
 *
 * Usage:  node scripts/prerender.mjs
 *         SITE_ORIGIN=https://example.com node scripts/prerender.mjs
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(root, 'dist');

const { render, listRoutes, renderDocument, buildSitemap } = await import(
  join(root, 'dist-ssr', 'entry-server.js')
);

const origin = (process.env.SITE_ORIGIN ?? '').trim().replace(/\/+$/, '');
const template = await readFile(join(dist, 'index.html'), 'utf8');
const routes = listRoutes();

for (const route of routes) {
  const appHtml = await render(route.path);
  const canonical = origin ? `${origin}${route.path === '/' ? '/' : route.path}` : undefined;
  const html = renderDocument(template, {
    appHtml,
    title: route.title,
    description: route.description,
    canonical,
  });
  const outDir = route.path === '/' ? dist : join(dist, route.path);
  await mkdir(outDir, { recursive: true });
  await writeFile(join(outDir, 'index.html'), html, 'utf8');
}

if (origin) {
  await writeFile(
    join(dist, 'sitemap.xml'),
    buildSitemap(origin, routes.map((r) => r.path)),
    'utf8',
  );
  // Point robots.txt at the sitemap, idempotently (a rerun must not stack lines).
  const robotsPath = join(dist, 'robots.txt');
  const robots = await readFile(robotsPath, 'utf8').catch(() => 'User-agent: *\nAllow: /\n');
  if (!/^Sitemap:/m.test(robots)) {
    await writeFile(robotsPath, `${robots.replace(/\s*$/, '')}\nSitemap: ${origin}/sitemap.xml\n`, 'utf8');
  }
  console.log(`prerendered ${routes.length} routes + sitemap.xml (origin ${origin})`);
} else {
  console.log(
    `prerendered ${routes.length} routes (no SITE_ORIGIN set — skipped sitemap.xml + canonical links)`,
  );
}
