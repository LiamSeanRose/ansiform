import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { getTask } from '../tasks/registry';
import { composeTranslate } from '../tasks/i18n';
import { TaskWorkbench } from '../components/TaskWorkbench';
import { useDocumentMeta } from './useDocumentMeta';
import { NotFoundPage } from './NotFoundPage';

/**
 * One route per task (`/tasks/:task`) — the SEO atom (council §8): its own H1,
 * document title, and meta description. The slug is resolved against the curated
 * registry (auto-registered from `src/tasks/<slug>/`), so this single route
 * serves every task without per-task wiring. Unknown slugs fall through to the
 * not-found page.
 */
export function TaskPage() {
  const { t: appT, locale } = useTranslation();
  const { task: slug = '' } = useParams<{ task: string }>();
  const mod = getTask(slug);

  useDocumentMeta(
    mod ? `${mod.task.title} · ${appT('app.name')}` : null,
    mod ? mod.task.description : null,
  );

  if (!mod) return <NotFoundPage />;

  const local = mod.messages[locale] ?? mod.messages.en ?? {};
  const t = composeTranslate(appT, local);

  return (
    <section className="page task-page" aria-labelledby="task-title">
      <p>
        <Link to="/">{appT('task.backToHome')}</Link>
      </p>
      <h1 id="task-title">{mod.task.title}</h1>
      <p className="lede">{mod.task.description}</p>

      <TaskWorkbench task={mod.task} t={t} />
    </section>
  );
}
