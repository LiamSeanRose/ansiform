/**
 * sitemap.xml generation (#87).
 *
 * Pure string builder: given a canonical origin and the route paths, emit a valid
 * `urlset`. The origin is supplied by the build (the `SITE_ORIGIN` env var); when
 * it is unset the prerender script skips calling this entirely, so no domain is
 * ever assumed. No DOM, no network.
 */

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** Join an origin and a route path into one absolute URL (single slash seam). */
export function absoluteUrl(origin: string, path: string): string {
  const base = origin.replace(/\/+$/, '');
  const rel = path === '/' ? '/' : `/${path.replace(/^\/+/, '')}`;
  return `${base}${rel}`;
}

/**
 * Build a sitemap document for the given route paths under `origin`. Paths are
 * deduped and emitted in first-seen order; each becomes one `<loc>`.
 */
export function buildSitemap(origin: string, paths: readonly string[]): string {
  const seen = new Set<string>();
  const locs: string[] = [];
  for (const path of paths) {
    const url = absoluteUrl(origin, path);
    if (seen.has(url)) continue;
    seen.add(url);
    locs.push(`  <url><loc>${escapeXml(url)}</loc></url>`);
  }
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...locs,
    '</urlset>',
    '',
  ].join('\n');
}
