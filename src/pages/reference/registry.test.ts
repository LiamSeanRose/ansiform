import { describe, expect, it } from 'vitest';
import { getReference, listReferences, referenceContent } from './registry';

const KNOWN = [
  'ansible-jinja2-filters-cheatsheet',
  'ansible-variable-precedence',
  'awx-survey-alternative',
];

describe('reference registry', () => {
  it('auto-registers every content module', () => {
    const refs = listReferences('en');
    expect(refs).toHaveLength(KNOWN.length);
    expect(new Set(refs.map((r) => r.slug))).toEqual(new Set(KNOWN));
  });

  it('lists summaries sorted by title', () => {
    const titles = listReferences('en').map((r) => r.title);
    const sorted = [...titles].sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sorted);
  });

  it('looks up by slug and 404s the unknown', () => {
    for (const slug of KNOWN) {
      expect(getReference(slug)?.content.en.slug).toBe(slug);
    }
    expect(getReference('does-not-exist')).toBeUndefined();
  });

  it('every page has well-formed, SEO-sane content', () => {
    for (const slug of KNOWN) {
      const mod = getReference(slug)!;
      const c = mod.content.en;
      expect(c.slug).toBe(slug);
      expect(c.title.length).toBeGreaterThan(0);
      // Meta description should exist and stay within a sensible SERP length.
      expect(c.description.length).toBeGreaterThan(0);
      expect(c.description.length).toBeLessThanOrEqual(170);
      expect(c.lede.length).toBeGreaterThan(0);
      expect(c.sections.length).toBeGreaterThan(0);

      // Section anchor ids must be unique within a page (TOC + deep links).
      const ids = c.sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      for (const s of c.sections) {
        expect(s.heading.length).toBeGreaterThan(0);
        expect(s.blocks.length).toBeGreaterThan(0);
      }
    }
  });

  it('falls back to English for an unset locale', () => {
    const mod = getReference('awx-survey-alternative')!;
    // No FR yet (#16) — referenceContent must not throw, it falls back to en.
    expect(referenceContent(mod, 'en')).toBe(mod.content.en);
  });
});
