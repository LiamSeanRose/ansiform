/**
 * Reference-page registry + auto-registration loader (issue #17).
 *
 * Mirrors the curated-task registry (#6): pages are discovered with Vite's
 * `import.meta.glob`, so adding a reference page is only adding a file under
 * `content/`. No edit here, no shared index.
 */
import type { Locale } from '../../i18n';
import type { ReferenceContent, ReferenceModule } from './types';

const loaded = import.meta.glob<{ reference?: ReferenceModule }>('./content/*.ts', {
  eager: true,
});

const bySlug = new Map<string, ReferenceModule>();
for (const path of Object.keys(loaded).sort()) {
  const mod = loaded[path]?.reference;
  if (mod) bySlug.set(mod.content.en.slug, mod);
}

/** Look up a reference module by slug, or `undefined` if unknown. */
export function getReference(slug: string): ReferenceModule | undefined {
  return bySlug.get(slug);
}

/** Resolve a page's content for a locale, falling back to English. */
export function referenceContent(mod: ReferenceModule, locale: Locale): ReferenceContent {
  return mod.content[locale] ?? mod.content.en;
}

/** Lightweight listing entry for the home page index. */
export interface ReferenceSummary {
  slug: string;
  title: string;
  description: string;
}

/** All reference pages as summaries, sorted by title (for the home listing). */
export function listReferences(locale: Locale): ReferenceSummary[] {
  return [...bySlug.values()]
    .map((mod) => referenceContent(mod, locale))
    .map(({ slug, title, description }) => ({ slug, title, description }))
    .sort((a, b) => a.title.localeCompare(b.title));
}
