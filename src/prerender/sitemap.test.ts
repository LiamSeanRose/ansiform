import { describe, expect, it } from 'vitest';
import { absoluteUrl, buildSitemap } from './sitemap';

describe('absoluteUrl', () => {
  it('joins origin and path with a single slash', () => {
    expect(absoluteUrl('https://x.dev', '/tasks/foo')).toBe('https://x.dev/tasks/foo');
    expect(absoluteUrl('https://x.dev/', '/tasks/foo')).toBe('https://x.dev/tasks/foo');
    expect(absoluteUrl('https://x.dev', 'tasks/foo')).toBe('https://x.dev/tasks/foo');
  });

  it('keeps the root as a bare slash', () => {
    expect(absoluteUrl('https://x.dev/', '/')).toBe('https://x.dev/');
  });
});

describe('buildSitemap', () => {
  it('emits a valid urlset with one loc per path', () => {
    const xml = buildSitemap('https://x.dev', ['/', '/tasks', '/tasks/interface-ip']);
    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml).toContain('<loc>https://x.dev/</loc>');
    expect(xml).toContain('<loc>https://x.dev/tasks/interface-ip</loc>');
    expect(xml.trim().endsWith('</urlset>')).toBe(true);
  });

  it('dedupes repeated paths', () => {
    const xml = buildSitemap('https://x.dev', ['/tasks', '/tasks']);
    expect(xml.match(/<loc>/g)).toHaveLength(1);
  });

  it('escapes XML-significant characters in the URL', () => {
    const xml = buildSitemap('https://x.dev', ['/reference/a&b']);
    expect(xml).toContain('a&amp;b');
    expect(xml).not.toContain('a&b<');
  });
});
