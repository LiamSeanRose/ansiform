import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import type { MessageKey } from '../i18n';
import { getTaskModule, taskMessages } from '../tasks/registry';
import { relatedSlugs } from '../tasks/categories';
import { TaskWorkbench, type WorkbenchMessages } from '../components/workbench';
import type { FormMessages, Translate as FieldTranslate } from '../components/form';
import { listReferences } from './reference';
import { NotFoundPage } from './NotFoundPage';

/** Keep the document title + meta description in sync with the active task (§8). */
function useDocumentMeta(title: string | undefined, description: string | undefined) {
  useEffect(() => {
    if (!title) return;
    const prevTitle = document.title;
    document.title = `${title} · Ansiform`;

    let meta = document.head.querySelector<HTMLMetaElement>('meta[name="description"]');
    const created = !meta;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'description';
      document.head.appendChild(meta);
    }
    const prevDesc = meta.getAttribute('content');
    if (description) meta.setAttribute('content', description);

    return () => {
      document.title = prevTitle;
      if (created) meta?.remove();
      else if (prevDesc !== null) meta?.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}

/** Interpolate `{placeholder}` tokens the same way the i18n `t()` does. */
function interpolate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in vars ? String(vars[name]) : m,
  );
}

/**
 * `/tasks/:task` — one route, H1, and meta per task (council §8). Loads the task
 * from the auto-registered library and renders the two-pane workbench. Unknown
 * slugs fall through to the 404 page.
 */
export function TaskPage() {
  const { t, locale } = useTranslation();
  const { task: slug = '' } = useParams<{ task: string }>();
  const mod = getTaskModule(slug);

  useDocumentMeta(mod?.definition.title, mod?.definition.description);

  if (!mod) return <NotFoundPage />;

  // Crosslinks (#62): other tasks in the same function category, and the
  // reference guides — turning each task page from an island into a navigable
  // hub for search engines and people alike.
  const related = relatedSlugs(slug)
    .map((s) => getTaskModule(s))
    .filter((m): m is NonNullable<typeof m> => m !== undefined);
  const references = listReferences(locale);

  // Task-scoped translator: resolve the schema's own keys first, then fall back
  // to the global catalogue (which carries the form/preview/workbench chrome).
  const taskCopy = taskMessages(mod, locale);
  const tt: FieldTranslate = (key, vars) =>
    key in taskCopy ? interpolate(taskCopy[key], vars) : t(key as MessageKey, vars);

  const form: FormMessages = {
    requiredLabel: t('form.requiredLabel'),
    errorSummaryHeading: t('form.errorSummaryHeading'),
    submitLabel: t('form.submitLabel'),
    errors: {
      required: 'form.error.required',
      pattern: 'form.error.pattern',
      min: 'form.error.min',
      max: 'form.error.max',
      notANumber: 'form.error.notANumber',
      incomplete: 'form.error.incomplete',
    },
  };

  const messages: WorkbenchMessages = {
    formHeading: t('workbench.formHeading'),
    output: {
      heading: t('workbench.outputHeading'),
      pathLabel: t('workbench.outputPathLabel'),
      copyLabel: t('output.copyLabel'),
      copiedStatus: t('output.copied'),
      copyFailedStatus: t('output.copyFailed'),
      downloadLabel: t('output.downloadLabel'),
    },
    form,
    surveyLabel: t('output.awxSurveySpec.label'),
    preview: {
      regionLabel: t('preview.regionLabel'),
      heading: t('preview.heading'),
      degradedNotice: t('preview.degradedNotice'),
      empty: t('preview.empty'),
    },
    vendor: {
      selectLabel: t('workbench.vendorSelectLabel'),
      labels: {
        'cisco-ios': t('vendor.cisco-ios'),
        'cisco-iosxe': t('vendor.cisco-iosxe'),
        'cisco-nxos': t('vendor.cisco-nxos'),
        'arista-eos': t('vendor.arista-eos'),
        'cisco-asa': t('vendor.cisco-asa'),
        'cisco-iosxr': t('vendor.cisco-iosxr'),
        'cradlepoint-ncos': t('vendor.cradlepoint-ncos'),
        'juniper-junos': t('vendor.juniper-junos'),
      },
    },
  };

  return (
    <section className="page page--task" aria-labelledby="task-title">
      <p>
        <Link to="/tasks">{t('task.backToHome')}</Link>
      </p>
      <h1 id="task-title">{mod.definition.title}</h1>
      <p className="lede">{mod.definition.description}</p>

      <TaskWorkbench task={mod} t={tt} messages={messages} />

      {related.length > 0 && (
        <nav className="task-links" aria-labelledby="related-heading">
          <h2 id="related-heading">{t('task.relatedHeading')}</h2>
          <ul className="task-list">
            {related.map((m) => (
              <li key={m.definition.slug} className="task-list__item">
                <Link className="task-list__link" to={`/tasks/${m.definition.slug}`}>
                  {m.definition.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {references.length > 0 && (
        <nav className="task-links" aria-labelledby="task-ref-heading">
          <h2 id="task-ref-heading">{t('home.referenceHeading')}</h2>
          <ul className="reference-list">
            {references.map((ref) => (
              <li key={ref.slug} className="reference-list__item">
                <Link className="reference-list__link" to={`/reference/${ref.slug}`}>
                  {ref.title}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </section>
  );
}
