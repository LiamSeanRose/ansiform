/**
 * Server entry for build-time prerendering (#87).
 *
 * Crawlers (and users with JS disabled) were served a near-blank SPA shell: the
 * H1 and meta description are injected client-side, so the ~50 per-task routes —
 * the intended SEO engine — were effectively invisible. This module renders each
 * route to static HTML at build time so the real H1, description, and body copy
 * ship in the initial payload.
 *
 * It is imported ONLY by the prerender script (`scripts/prerender.mjs`) after a
 * Vite SSR build, never by the browser bundle — so it adds nothing to what ships
 * and the zero-egress spine is untouched (no fetch here or anywhere in `src/`).
 *
 * `react-dom/static`'s `prerender` is used (not `renderToString`) because the app
 * code-splits every page with `React.lazy`; `prerender` waits for those Suspense
 * boundaries to settle, so each route emits its real content rather than the
 * "Loading…" fallback.
 */
import { StrictMode } from 'react';
import { prerender } from 'react-dom/static';
import { StaticRouter } from 'react-router';
import { I18nProvider } from './i18n/I18nProvider';
import { App } from './App';
import { en } from './i18n/locales/en';
import { listTaskSummaries } from './tasks/registry';
import { listReferences } from './pages/reference';

// Pure helpers re-exported so the prerender script (which imports the built SSR
// bundle) gets them without a second build. The canonical origin is NOT baked in
// here — the script supplies it from the SITE_ORIGIN env var, or omits sitemap /
// canonical entirely when it is unset.
export { buildSitemap } from './prerender/sitemap';
export { renderDocument, type DocumentMeta } from './prerender/html';

/** A route to prerender, with the head metadata its static HTML should carry. */
export interface PrerenderRoute {
  /** Route path, e.g. `/tasks/interface-ip`. */
  path: string;
  /** `<title>` (the " · Ansiform" suffix is added by the writer). */
  title: string;
  /** `<meta name="description">` content. */
  description: string;
}

/**
 * Every route the prerenderer should emit, derived from the same registries the
 * app routes from — so the static set never drifts from the live routes. Static
 * pages use the i18n catalogue; task/reference pages use their own metadata.
 */
export function listRoutes(): PrerenderRoute[] {
  const routes: PrerenderRoute[] = [
    { path: '/', title: en['home.title'], description: en['home.lede'] },
    { path: '/tasks', title: en['tasksIndex.title'], description: en['tasksIndex.lede'] },
    { path: '/build', title: en['build.title'], description: en['build.lede'] },
    { path: '/import', title: en['import.title'], description: en['import.lede'] },
    { path: '/reader', title: en['reader.title'], description: en['reader.lede'] },
  ];

  for (const task of listTaskSummaries()) {
    routes.push({ path: `/tasks/${task.slug}`, title: task.title, description: task.description });
  }
  for (const ref of listReferences('en')) {
    routes.push({ path: `/reference/${ref.slug}`, title: ref.title, description: ref.description });
  }
  return routes;
}

async function streamToString(stream: ReadableStream<Uint8Array>): Promise<string> {
  return await new Response(stream).text();
}

/**
 * Render one route to the static markup that belongs inside `<div id="root">`.
 * Pure: no DOM, no network — `prerender` settles all Suspense (lazy routes)
 * before resolving.
 */
export async function render(url: string): Promise<string> {
  const { prelude } = await prerender(
    <StrictMode>
      <I18nProvider>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </I18nProvider>
    </StrictMode>,
  );
  return await streamToString(prelude);
}
