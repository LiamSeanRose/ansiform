import { Fragment, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import { getReference, referenceContent } from './registry';
import type { Block } from './types';
import { NotFoundPage } from '../NotFoundPage';

/**
 * Keep `<title>`, `<meta name="description">`, and `<link rel="canonical">` in
 * sync with the active reference page (§8 SEO). Canonical resolves at runtime to
 * the current origin so it is correct on both the public site and a self-host.
 */
function useDocumentMeta(title: string | undefined, description: string | undefined) {
  useEffect(() => {
    if (!title) return;
    const head = document.head;

    const prevTitle = document.title;
    document.title = `${title} · Ansiform`;

    let meta = head.querySelector<HTMLMetaElement>('meta[name="description"]');
    const metaCreated = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      head.appendChild(meta);
    }
    const prevDesc = meta.getAttribute('content');
    if (description) meta.setAttribute('content', description);

    let link = head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    const linkCreated = !link;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      head.appendChild(link);
    }
    const prevHref = link.getAttribute('href');
    link.setAttribute('href', window.location.origin + window.location.pathname);

    return () => {
      document.title = prevTitle;
      if (metaCreated) meta?.remove();
      else if (prevDesc !== null) meta?.setAttribute('content', prevDesc);
      if (linkCreated) link?.remove();
      else if (prevHref !== null) link?.setAttribute('href', prevHref);
    };
  }, [title, description]);
}

/** Render text with inline `` `code` `` spans as `<code>` — text nodes only. */
function InlineText({ text }: { text: string }) {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <code key={i}>{part}</code> : <Fragment key={i}>{part}</Fragment>,
      )}
    </>
  );
}

function renderBlock(block: Block, key: string) {
  switch (block.kind) {
    case 'p':
      return (
        <p key={key}>
          <InlineText text={block.text} />
        </p>
      );
    case 'code':
      return (
        <pre key={key} className="reference__code">
          <code>{block.text}</code>
        </pre>
      );
    case 'list':
      return (
        <ul key={key} className="reference__list">
          {block.items.map((item, i) => (
            <li key={i}>
              <InlineText text={item} />
            </li>
          ))}
        </ul>
      );
    case 'table':
      return (
        <div key={key} className="reference__table-wrap">
          <table className="reference__table">
            <thead>
              <tr>
                {block.columns.map((col, i) => (
                  <th key={i} scope="col">
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, r) => (
                <tr key={r}>
                  {row.map((cell, c) => (
                    <td key={c}>
                      <InlineText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

/**
 * `/reference/:page` — one route, H1, and meta per reference page (§8). Loads the
 * page from the auto-registered content set; unknown slugs fall through to 404.
 */
export function ReferencePage() {
  const { t, locale } = useTranslation();
  const { page: slug = '' } = useParams<{ page: string }>();
  const mod = getReference(slug);
  const content = mod ? referenceContent(mod, locale) : undefined;

  useDocumentMeta(content?.title, content?.description);

  if (!content) return <NotFoundPage />;

  return (
    <article className="page page--reference" aria-labelledby="reference-title">
      <p>
        <Link to="/">{t('reference.backToHome')}</Link>
      </p>
      <h1 id="reference-title">{content.title}</h1>
      <p className="lede">
        <InlineText text={content.lede} />
      </p>

      {content.sections.length > 1 && (
        <nav className="reference__toc" aria-label={t('reference.tocLabel')}>
          <ul>
            {content.sections.map((section) => (
              <li key={section.id}>
                <a href={`#${section.id}`}>{section.heading}</a>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {content.sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          className="reference__section"
          aria-labelledby={`${section.id}__h`}
        >
          <h2 id={`${section.id}__h`}>{section.heading}</h2>
          {section.blocks.map((block, i) => renderBlock(block, `${section.id}-${i}`))}
        </section>
      ))}
    </article>
  );
}
