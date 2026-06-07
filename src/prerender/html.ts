/**
 * Static HTML document assembly for prerendering (#87).
 *
 * Pure string transform: take the built `dist/index.html` shell (which already
 * carries the CSP meta and the hashed bundle script) and splice in one route's
 * prerendered app markup plus its real `<title>` and `<meta description>`. A
 * canonical `<link>` is added only when an `origin` is supplied (env-gated), so
 * no domain is ever assumed. No DOM, no network.
 */

function escapeAttr(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const escapeText = escapeAttr;

export interface DocumentMeta {
  /** The prerendered markup that belongs inside `<div id="root">`. */
  appHtml: string;
  /** Page `<title>` before the " · Ansiform" suffix. */
  title: string;
  /** `<meta name="description">` content. */
  description: string;
  /** Absolute canonical URL for this route; omit to emit no canonical link. */
  canonical?: string;
}

/**
 * Produce the final static HTML for one route from the shell `template`. Head
 * edits run first (distinct regions), then the app markup is spliced into the
 * empty root container.
 */
export function renderDocument(template: string, meta: DocumentMeta): string {
  const fullTitle = meta.title === 'Ansiform' ? 'Ansiform' : `${meta.title} · Ansiform`;
  let html = template;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeText(fullTitle)}</title>`);

  const descTag = `<meta name="description" content="${escapeAttr(meta.description)}" />`;
  if (/<meta\s+name="description"[^>]*>/i.test(html)) {
    html = html.replace(/<meta\s+name="description"[^>]*>/i, descTag);
  } else {
    html = html.replace('</head>', `    ${descTag}\n  </head>`);
  }

  if (meta.canonical) {
    html = html.replace(
      '</head>',
      `    <link rel="canonical" href="${escapeAttr(meta.canonical)}" />\n  </head>`,
    );
  }

  html = html.replace('<div id="root"></div>', `<div id="root">${meta.appHtml}</div>`);
  return html;
}
