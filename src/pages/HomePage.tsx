import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { listTaskSummaries } from '../tasks/registry';
import { listReferences } from './reference';

export function HomePage() {
  const { t, locale } = useTranslation();
  const tasks = listTaskSummaries();
  const references = listReferences(locale);
  // Trust chips reuse the footer tagline so no new (locale-gated) copy is added.
  const chips = t('footer.tagline')
    .split('·')
    .map((chip) => chip.trim())
    .filter(Boolean);

  return (
    <section className="page page--home" aria-labelledby="home-title">
      <div className="hero">
        <p className="hero__eyebrow">{t('app.tagline')}</p>
        <h1 id="home-title" className="hero__title">
          {t('home.title')}
        </h1>
        <p className="lede hero__lede">{t('home.lede')}</p>
        <div className="hero__actions">
          <Link className="btn btn--primary" to="/build">
            {t('nav.build')}
          </Link>
          <Link className="btn btn--ghost" to="/reader">
            {t('nav.reader')}
          </Link>
        </div>
        {chips.length > 0 && (
          <ul className="hero__chips" aria-hidden="true">
            {chips.map((chip) => (
              <li key={chip} className="hero__chip">
                {chip}
              </li>
            ))}
          </ul>
        )}
      </div>

      <h2>{t('home.tasksHeading')}</h2>
      {tasks.length === 0 ? (
        <p className="muted">{t('home.tasksEmpty')}</p>
      ) : (
        <ul className="task-list">
          {tasks.map((task) => (
            <li key={task.slug} className="task-list__item">
              <Link className="task-list__link" to={`/tasks/${task.slug}`}>
                {task.title}
              </Link>
              <p className="task-list__desc muted">{task.description}</p>
            </li>
          ))}
        </ul>
      )}

      {references.length > 0 && (
        <>
          <h2>{t('home.referenceHeading')}</h2>
          <ul className="reference-list">
            {references.map((ref) => (
              <li key={ref.slug} className="reference-list__item">
                <Link className="reference-list__link" to={`/reference/${ref.slug}`}>
                  {ref.title}
                </Link>
                <p className="reference-list__desc muted">{ref.description}</p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
