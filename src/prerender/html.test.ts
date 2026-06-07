import { describe, expect, it } from 'vitest';
import { renderDocument } from './html';

const TEMPLATE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="description" content="default desc" />
    <title>Ansiform</title>
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/assets/index-abc.js"></script>
  </body>
</html>`;

describe('renderDocument', () => {
  it('splices the app markup into the root container', () => {
    const out = renderDocument(TEMPLATE, { appHtml: '<h1>Hi</h1>', title: 'T', description: 'D' });
    expect(out).toContain('<div id="root"><h1>Hi</h1></div>');
    expect(out).not.toContain('<div id="root"></div>');
  });

  it('sets a route title with the brand suffix, and the description', () => {
    const out = renderDocument(TEMPLATE, {
      appHtml: '',
      title: 'BGP neighbor',
      description: 'Configure a BGP neighbor.',
    });
    expect(out).toContain('<title>BGP neighbor · Ansiform</title>');
    expect(out).toContain('<meta name="description" content="Configure a BGP neighbor." />');
    expect(out).not.toContain('default desc');
  });

  it('leaves the home title unsuffixed', () => {
    const out = renderDocument(TEMPLATE, { appHtml: '', title: 'Ansiform', description: 'D' });
    expect(out).toContain('<title>Ansiform</title>');
  });

  it('keeps the CSP meta and bundle script untouched', () => {
    const out = renderDocument(TEMPLATE, { appHtml: '<main/>', title: 'T', description: 'D' });
    expect(out).toContain("Content-Security-Policy");
    expect(out).toContain('/assets/index-abc.js');
  });

  it('adds a canonical link only when an origin URL is supplied', () => {
    const without = renderDocument(TEMPLATE, { appHtml: '', title: 'T', description: 'D' });
    expect(without).not.toContain('rel="canonical"');
    const withC = renderDocument(TEMPLATE, {
      appHtml: '',
      title: 'T',
      description: 'D',
      canonical: 'https://x.dev/tasks/foo',
    });
    expect(withC).toContain('<link rel="canonical" href="https://x.dev/tasks/foo" />');
  });

  it('escapes the description so it cannot break out of the attribute', () => {
    const out = renderDocument(TEMPLATE, {
      appHtml: '',
      title: 'T',
      description: 'a "quote" & <tag>',
    });
    expect(out).toContain('content="a &quot;quote&quot; &amp; &lt;tag&gt;"');
  });
});
