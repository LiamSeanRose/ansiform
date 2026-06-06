import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { getGuide } from '../content/guides';
import { useDocumentMeta } from './useDocumentMeta';
import { NotFoundPage } from './NotFoundPage';

/**
 * Reference/SEO guide route (`/guides/:guide`) — its own H1, title, and meta
 * (council §8). Content comes from the data-driven guide registry; unknown slugs
 * fall through to the not-found page.
 */
export function GuidePage() {
  const { t } = useTranslation();
  const { guide: slug = '' } = useParams<{ guide: string }>();
  const guide = getGuide(slug);

  useDocumentMeta(
    guide ? `${guide.title} · ${t('app.name')}` : null,
    guide ? guide.description : null,
  );

  if (!guide) return <NotFoundPage />;

  return (
    <article className="page guide" aria-labelledby="guide-title">
      <p>
        <Link to="/">{t('guide.backToHome')}</Link>
      </p>
      <h1 id="guide-title">{guide.title}</h1>
      <p className="lede">{guide.intro}</p>

      {guide.sections.map((section) => (
        <section key={section.heading} className="guide__section">
          <h2>{section.heading}</h2>
          {section.body.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
          {section.rows && (
            <dl className="guide__rows">
              {section.rows.map((row) => (
                <div className="guide__row" key={row.term}>
                  <dt>
                    <code>{row.term}</code>
                  </dt>
                  <dd>{row.desc}</dd>
                </div>
              ))}
            </dl>
          )}
        </section>
      ))}

      {guide.related && guide.related.length > 0 && (
        <nav className="guide__related" aria-label={t('guide.relatedLabel')}>
          <h2>{t('guide.relatedLabel')}</h2>
          <ul>
            {guide.related.map((link) => (
              <li key={link.to}>
                <Link to={link.to}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </article>
  );
}
