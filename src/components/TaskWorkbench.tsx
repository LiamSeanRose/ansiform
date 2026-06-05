/**
 * Two-pane task workbench (issue #6).
 *
 * The working composition of the whole engine: the accessible form (#4) on the
 * left, and on the right the live device-CLI preview (#5) over the always-correct
 * group_vars/host_vars YAML (#2). The form owns its value model and emits it on
 * every change; this component mirrors it to drive both the preview render and
 * the YAML sink, so the two panes stay live as the user types.
 *
 * Correctness model (council §4): the YAML is derived straight from the field
 * values and is always byte-correct; the preview may degrade *visibly* when a
 * template uses a non-`exact` filter, but it is never silently wrong. The
 * reference task here uses only `exact` filters, so no notice appears.
 *
 * The richer output UX — copy, download, scope picker, survey-spec export — is
 * deliberately out of scope here (#12/#13); this shows the YAML read-only so the
 * end-to-end result is verifiable.
 */
import { useId, useMemo, useState } from 'react';
import type { FormValues, TaskDefinition } from '../core';
import { Form, initialValues } from './form';
import type { FormMessages } from './form';
import { PreviewPane, renderPreview } from '../core/preview';
import type { PreviewMessages } from '../core/preview';
import { createSeedRegistry } from '../core/filters/seed';
import { groupVarsYamlSink } from '../core/output/yaml';
import type { TaskTranslate } from '../tasks/i18n';

export interface TaskWorkbenchProps {
  task: TaskDefinition;
  /** Composed translator: task-local copy over the shared app catalogue. */
  t: TaskTranslate;
}

export function TaskWorkbench({ task, t }: TaskWorkbenchProps) {
  const registry = useMemo(() => createSeedRegistry(), []);
  const [values, setValues] = useState<FormValues>(() => initialValues(task.schema));
  const outputId = useId();

  const formMessages = useMemo<FormMessages>(
    () => ({
      requiredLabel: t('form.required'),
      errorSummaryHeading: t('form.errorSummaryHeading'),
      submitLabel: t('form.submit'),
      // Values are i18n keys the form resolves with `t` (+ {label}/{min}/{max}).
      errors: {
        required: 'form.error.required',
        pattern: 'form.error.pattern',
        min: 'form.error.min',
        max: 'form.error.max',
        notANumber: 'form.error.notANumber',
      },
    }),
    [t],
  );

  const previewMessages = useMemo<PreviewMessages>(
    () => ({
      regionLabel: t('preview.regionLabel'),
      heading: t('preview.heading'),
      degradedNotice: t('preview.degradedNotice'),
      empty: t('preview.empty'),
    }),
    [t],
  );

  const preview = useMemo(
    () => renderPreview(task.template, values, registry),
    [task.template, values, registry],
  );

  const artifact = useMemo(
    () => groupVarsYamlSink.render({ schema: task.schema, values, scope: task.defaultScope }),
    [task.schema, task.defaultScope, values],
  );

  return (
    <div className="workbench">
      <div className="workbench__pane workbench__pane--form" role="group" aria-label={t('workbench.formRegionLabel')}>
        <Form schema={task.schema} t={t} messages={formMessages} onChange={setValues} />
      </div>

      <div className="workbench__pane workbench__pane--output">
        <PreviewPane result={preview} messages={previewMessages} />

        <section className="vars-output" aria-labelledby={`${outputId}-heading`}>
          <h2 className="vars-output__heading" id={`${outputId}-heading`}>
            {t('output.heading')}
          </h2>
          <p className="vars-output__path">
            {t('output.pathLabel')}: <code>{artifact.filename}</code>
          </p>
          <pre className="vars-output__yaml" tabIndex={0} aria-label={t('output.regionLabel')}>
            {artifact.content}
          </pre>
        </section>
      </div>
    </div>
  );
}
