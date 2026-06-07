import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from '../i18n/useTranslation';
import type { MessageKey } from '../i18n';
import { getTaskModule, taskMessages } from '../tasks/registry';
import { categoryOf, relatedSlugs } from '../tasks/categories';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { TaskWorkbench, WorkedExample, type WorkbenchMessages } from '../components/workbench';
import type { FormMessages, Translate as FieldTranslate } from '../components/form';
import { RunRecipe, type RunRecipeMessages } from '../components/output';
import { buildRunRecipe } from '../core/output/run-recipe';
import { buildVars, suggestFilename, toYaml } from '../core/output/yaml';
import { renderPreview, withFidelityFloor } from '../core/preview';
import { createSeedRegistry } from '../core/filters/seed';
import { synthesizeExample } from '../core/example/synth';
import { listReferences } from './reference';
import { NotFoundPage } from './NotFoundPage';

// Filter registry for the static worked-example preview (#87). Module-level: the
// seed set is fixed, so one instance is reused across renders.
const exampleRegistry = createSeedRegistry();

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
    varsDiff: {
      summaryLabel: t('output.varsDiff.summary'),
      description: t('output.varsDiff.description'),
      pasteLabel: t('output.varsDiff.pasteLabel'),
      pasteHelp: t('output.varsDiff.pasteHelp'),
      placeholder: t('output.varsDiff.placeholder'),
      addedLabel: t('output.varsDiff.added'),
      changedLabel: t('output.varsDiff.changed'),
      unchangedLabel: t('output.varsDiff.unchanged'),
      currentLabel: t('output.varsDiff.current'),
      noChanges: t('output.varsDiff.noChanges'),
      blockHeading: t('output.varsDiff.blockHeading'),
      blockNote: t('output.varsDiff.blockNote'),
      copyLabel: t('output.varsDiff.copyLabel'),
      copiedStatus: t('output.varsDiff.copied'),
      copyFailedStatus: t('output.varsDiff.copyFailed'),
      errorTooLarge: t('output.varsDiff.errorTooLarge'),
      errorParse: t('output.varsDiff.errorParse'),
      errorShape: t('output.varsDiff.errorShape'),
    },
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
        vyos: t('vendor.vyos'),
        'huawei-vrp': t('vendor.huawei-vrp'),
      },
    },
  };

  // Run recipe (#83): static "now what?" guidance. The single-task var-file path
  // is fixed by the task's default scope, so it needs no entered values.
  const recipeScope = mod.definition.defaultScope ?? { kind: 'group', name: 'all' };
  const runRecipe = buildRunRecipe({
    files: [suggestFilename(recipeScope)],
    scopes: [recipeScope],
  });
  const runRecipeMessages: RunRecipeMessages = {
    heading: t('output.runRecipe.heading'),
    intro: t('output.runRecipe.intro'),
    layoutLabel: t('output.runRecipe.layoutLabel'),
    commandLabel: t('output.runRecipe.commandLabel'),
    copyLabel: t('output.runRecipe.copyLabel'),
    copiedStatus: t('output.runRecipe.copied'),
    copyFailedStatus: t('output.runRecipe.copyFailed'),
  };

  // Static worked example (#87): synthesized sample values → exact YAML + device
  // CLI. Pure + deterministic, so it prerenders identically. Shown only when the
  // sample yields real vars (a task with no defaults/placeholders shows none).
  const exampleValues = synthesizeExample(mod.definition.schema);
  const exampleVars = buildVars(mod.definition.schema, exampleValues);
  const exampleYaml = Object.keys(exampleVars).length > 0 ? toYaml(exampleVars) : '';
  const examplePreview = withFidelityFloor(
    renderPreview(mod.definition.template, exampleValues, exampleRegistry),
    mod.definition.fidelityFloor,
  );

  return (
    <section className="page page--task" aria-labelledby="task-title">
      <Breadcrumbs
        label={t('breadcrumb.label')}
        items={[
          { label: t('breadcrumb.home'), to: '/' },
          {
            label: t(`tasksIndex.category.${categoryOf(slug)}` as MessageKey),
            to: `/tasks?category=${categoryOf(slug)}`,
          },
          { label: mod.definition.title },
        ]}
      />
      <h1 id="task-title">{mod.definition.title}</h1>
      <p className="lede">{mod.definition.description}</p>

      {exampleYaml && (
        <WorkedExample
          yaml={exampleYaml}
          preview={examplePreview}
          messages={{
            heading: t('task.example.heading'),
            intro: t('task.example.intro'),
            yamlLabel: t('task.example.yamlLabel'),
            cliLabel: t('task.example.cliLabel'),
          }}
        />
      )}

      <TaskWorkbench task={mod} t={tt} messages={messages} />

      {runRecipe && <RunRecipe recipe={runRecipe} messages={runRecipeMessages} />}

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
