import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import { getTask } from '../tasks/registry';
import { composeTranslate } from '../tasks/i18n';
import { TaskWorkbench } from '../components/TaskWorkbench';
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

  useEffect(() => {
    if (!mod) return;
    const previousTitle = document.title;
    const meta = ensureMetaDescription();
    const previousDescription = meta.getAttribute('content');

    document.title = `${mod.task.title} · ${appT('app.name')}`;
    meta.setAttribute('content', mod.task.description);

    return () => {
      document.title = previousTitle;
      if (previousDescription !== null) meta.setAttribute('content', previousDescription);
    };
  }, [mod, appT]);

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

/** Find the document's `<meta name="description">`, creating it if absent. */
function ensureMetaDescription(): HTMLMetaElement {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  return meta;
}
