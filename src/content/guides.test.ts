import { describe, expect, it } from 'vitest';
import { getGuide, listGuides } from './guides';

describe('SEO guides (#17)', () => {
  it('ships the three planned reference pages', () => {
    const slugs = listGuides().map((guide) => guide.slug);
    expect(slugs).toEqual([
      'ansible-jinja2-filters-cheatsheet',
      'ansible-variable-precedence-explained',
      'awx-survey-alternative',
    ]);
  });

  it('gives every guide an H1 title and a meta description (SEO atom)', () => {
    for (const guide of listGuides()) {
      expect(guide.title.length).toBeGreaterThan(0);
      expect(guide.description.length).toBeGreaterThan(0);
      expect(guide.sections.length).toBeGreaterThan(0);
    }
  });

  it('looks a guide up by slug, and returns undefined otherwise', () => {
    expect(getGuide('awx-survey-alternative')?.title).toContain('AWX');
    expect(getGuide('nope')).toBeUndefined();
  });

  it('only links to internal routes', () => {
    for (const guide of listGuides()) {
      for (const link of guide.related ?? []) {
        expect(link.to.startsWith('/')).toBe(true);
      }
    }
  });
});
