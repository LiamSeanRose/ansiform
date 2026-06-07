import { describe, expect, it } from 'vitest';
import { listRoutes } from './entry-server';

describe('listRoutes (prerender route set)', () => {
  const routes = listRoutes();
  const paths = routes.map((r) => r.path);

  it('includes the static pages', () => {
    expect(paths).toContain('/');
    expect(paths).toContain('/tasks');
    expect(paths).toContain('/build');
    expect(paths).toContain('/import');
    expect(paths).toContain('/reader');
  });

  it('includes per-task and per-reference routes derived from the registries', () => {
    expect(paths.some((p) => p.startsWith('/tasks/'))).toBe(true);
    expect(paths.some((p) => p.startsWith('/reference/'))).toBe(true);
    // The task routes are the SEO engine — there should be many.
    expect(paths.filter((p) => p.startsWith('/tasks/')).length).toBeGreaterThan(10);
  });

  it('gives every route a non-empty title and description for its head tags', () => {
    for (const r of routes) {
      expect(r.title.length).toBeGreaterThan(0);
      expect(r.description.length).toBeGreaterThan(0);
    }
  });
});
