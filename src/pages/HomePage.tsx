import { Link } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { listTaskSummaries } from '../tasks/registry';
import { listReferences } from './reference';

export function HomePage() {
  const { t, locale } = useTranslation();
  const tasks = listTaskSummaries();
  const references = listReferences(locale);

  return (
    <section className="page" aria-labelledby="home-title">
      <h1 id="home-title">{t('home.title')}</h1>
      <p className="lede">{t('home.lede')}</p>

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
