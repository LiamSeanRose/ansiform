/**
 * Reference-page content model (issue #17).
 *
 * The SEO/reference pages are long-form, so — exactly like a curated task (#6) —
 * each page's copy lives in its own content module keyed by locale, rather than
 * bloating the global `en.ts`. That keeps copy externalized/translatable (FR is
 * #16) without turning the shared catalogue into an article store.
 *
 * Content is a small typed block model (not raw HTML) so pages render as plain
 * text nodes only — no `dangerouslySetInnerHTML`, nothing for the strict CSP to
 * worry about.
 */
import type { Locale } from '../../i18n';

/** A renderable content block. Inline `` `code` `` spans are honored in text. */
export type Block =
  | { kind: 'p'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'list'; items: string[] }
  | { kind: 'table'; columns: string[]; rows: string[][] };

export interface ReferenceSection {
  /** Stable anchor id (kebab-case, unique within the page). */
  id: string;
  heading: string;
  blocks: Block[];
}

export interface ReferenceContent {
  /** Route segment under `/reference/` (and the registry key). */
  slug: string;
  /** H1 and document `<title>`. */
  title: string;
  /** `<meta name="description">` — the SEO hook (aim ≤160 chars). */
  description: string;
  /** Intro paragraph under the H1. */
  lede: string;
  sections: ReferenceSection[];
}

/** What each `content/<slug>.ts` exports as `reference`. */
export interface ReferenceModule {
  /** Copy by locale; `en` required, others optional (FR is #16). */
  content: Partial<Record<Locale, ReferenceContent>> & { en: ReferenceContent };
}
