import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';

/**
 * Routing placeholder for `/tasks/:task`. Each task gets its own route, H1, and
 * meta (council §8 — the SEO atoms). The form engine and curated tasks are not
 * built yet; this only proves the per-task routing seam.
 */
export function TaskPage() {
  const { t } = useTranslation();
  const { task = '' } = useParams<{ task: string }>();

  return (
    <section className="page" aria-labelledby="task-title">
      <p>
        <Link to="/">{t('task.backToHome')}</Link>
      </p>
      <h1 id="task-title">{t('task.placeholderHeading', { task })}</h1>
      <p className="muted">{t('task.placeholderBody')}</p>
    </section>
  );
}
