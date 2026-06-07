import { describe, expect, it } from 'vitest';
import { CATEGORIES, GROUP_ORDER, categoryOf, relatedSlugs } from './categories';
import { getTaskModule } from './registry';

describe('task categories (#35, #62)', () => {
  it('every categorized slug is a registered task (no typos / stale entries)', () => {
    for (const cat of CATEGORIES)
      for (const slug of cat.slugs)
        expect(getTaskModule(slug), `${cat.id}: ${slug}`).toBeDefined();
  });

  it('categoryOf maps known tasks and falls back to other', () => {
    expect(categoryOf('asa-objects')).toBe('firewall');
    expect(categoryOf('asa-management')).toBe('firewall');
    expect(categoryOf('spanning-tree')).toBe('switching');
    expect(categoryOf('junos-bgp')).toBe('routing');
    expect(categoryOf('cradlepoint-tunnel')).toBe('edge');
    expect(categoryOf('nope-not-a-task')).toBe('other');
  });

  it('relatedSlugs returns same-category siblings, excluding the task itself', () => {
    const related = relatedSlugs('ospf');
    expect(related).toContain('bgp-neighbor');
    expect(related).toContain('junos-ospf');
    expect(related).not.toContain('ospf');
    expect(relatedSlugs('nope-not-a-task')).toEqual([]);
  });

  it('GROUP_ORDER ends with other', () => {
    expect(GROUP_ORDER[GROUP_ORDER.length - 1]).toBe('other');
  });
});
