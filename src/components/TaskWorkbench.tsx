/**
 * Two-pane task workbench (issues #6, #12, #13).
 *
 * The working composition of the whole engine: the accessible form (#4) on the
 * left, and on the right the live device-CLI preview (#5) over the output panel.
 * The form owns its value model and emits it on every change; this component
 * mirrors it to drive the preview render and the selected output sink, so both
 * panes stay live as the user types.
 *
 * Output (#12/#13): pick the format — group_vars/host_vars YAML or an AWX/AAP
 * survey-spec JSON — plus, for YAML, a scope picker that sets the suggested path.
 * Copy and download are byte-identical to the shown artifact. Everything is
 * local: the download is an in-memory Blob and copy uses the clipboard API; the
 * zero-egress CSP (`connect-src 'none'`) still holds.
 *
 * Correctness model (council §4): the YAML is derived straight from the field
 * values and is always byte-correct; the preview may degrade *visibly* when a
 * template uses a non-`exact` filter, but it is never silently wrong.
 */
import { useCallback, useId, useMemo, useState } from 'react';
import type { FormValues, TaskDefinition, TaskScope } from '../core';
import { Form, initialValues } from './form';
import type { FormMessages } from './form';
import { PreviewPane, renderPreview } from '../core/preview';
import type { PreviewMessages } from '../core/preview';
import { createSeedRegistry } from '../core/filters/seed';
import { groupVarsYamlSink } from '../core/output/yaml';
import { createAwxSurveySink } from '../core/output/survey';
import type { TaskTranslate } from '../tasks/i18n';

export interface TaskWorkbenchProps {
  task: TaskDefinition;
  /** Composed translator: task-local copy over the shared app catalogue. */
  t: TaskTranslate;
}

type OutputFormat = 'yaml' | 'survey';

export function TaskWorkbench({ task, t }: TaskWorkbenchProps) {
  const registry = useMemo(() => createSeedRegistry(), []);
  const [values, setValues] = useState<FormValues>(() => initialValues(task.schema));
  const [format, setFormat] = useState<OutputFormat>('yaml');
  const [scope, setScope] = useState<TaskScope>(
    () => task.defaultScope ?? { kind: 'group', name: 'all' },
  );
  const [copied, setCopied] = useState(false);
  const outputId = useId();

  const surveySink = useMemo(() => createAwxSurveySink(t), [t]);

  const formMessages = useMemo<FormMessages>(
    () => ({
      requiredLabel: t('form.required'),
      errorSummaryHeading: t('form.errorSummaryHeading'),
      submitLabel: t('form.submit'),
      addEntryLabel: t('form.addEntry'),
      removeEntryLabel: t('form.removeEntry'),
      emptyListLabel: t('form.emptyList'),
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
    () =>
      format === 'survey'
        ? surveySink.render({ schema: task.schema, values })
        : groupVarsYamlSink.render({ schema: task.schema, values, scope }),
    [format, surveySink, task.schema, values, scope],
  );

  const handleValuesChange = useCallback((next: FormValues) => {
    setValues(next);
    setCopied(false);
  }, []);

  const handleCopy = useCallback(() => {
    void navigator.clipboard?.writeText(artifact.content).then(
      () => setCopied(true),
      () => setCopied(false),
    );
  }, [artifact.content]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([artifact.content], { type: artifact.contentType });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    // Suggested path is a directory + file; the filename is the leaf.
    anchor.download = artifact.filename.split('/').pop() ?? 'output.txt';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  }, [artifact]);

  return (
    <div className="workbench">
      <div
        className="workbench__pane workbench__pane--form"
        role="group"
        aria-label={t('workbench.formRegionLabel')}
      >
        <Form schema={task.schema} t={t} messages={formMessages} onChange={handleValuesChange} />
      </div>

      <div className="workbench__pane workbench__pane--output">
        <PreviewPane result={preview} messages={previewMessages} />

        <section className="vars-output" aria-labelledby={`${outputId}-heading`}>
          <h2 className="vars-output__heading" id={`${outputId}-heading`}>
            {t('output.heading')}
          </h2>

          <div className="vars-output__controls">
            <p className="vars-output__field">
              <label htmlFor={`${outputId}-format`}>{t('output.format.label')}</label>
              <select
                id={`${outputId}-format`}
                value={format}
                onChange={(e) => {
                  setFormat(e.target.value as OutputFormat);
                  setCopied(false);
                }}
              >
                <option value="yaml">{t('output.format.yaml')}</option>
                <option value="survey">{t('output.format.survey')}</option>
              </select>
            </p>

            {format === 'yaml' && (
              <>
                <p className="vars-output__field">
                  <label htmlFor={`${outputId}-scope-kind`}>{t('output.scope.kindLabel')}</label>
                  <select
                    id={`${outputId}-scope-kind`}
                    value={scope.kind}
                    onChange={(e) =>
                      setScope((s) => ({ ...s, kind: e.target.value as TaskScope['kind'] }))
                    }
                  >
                    <option value="group">{t('output.scope.group')}</option>
                    <option value="host">{t('output.scope.host')}</option>
                  </select>
                </p>
                <p className="vars-output__field">
                  <label htmlFor={`${outputId}-scope-name`}>{t('output.scope.nameLabel')}</label>
                  <input
                    id={`${outputId}-scope-name`}
                    type="text"
                    value={scope.name}
                    onChange={(e) => setScope((s) => ({ ...s, name: e.target.value }))}
                  />
                </p>
              </>
            )}
          </div>

          <p className="vars-output__path">
            {t('output.pathLabel')}: <code>{artifact.filename}</code>
          </p>

          <div className="vars-output__actions">
            <button type="button" className="vars-output__btn" onClick={handleCopy}>
              {copied ? t('output.copied') : t('output.copy')}
            </button>
            <button type="button" className="vars-output__btn" onClick={handleDownload}>
              {t('output.download')}
            </button>
          </div>

          <pre className="vars-output__yaml" tabIndex={0} aria-label={t('output.regionLabel')}>
            {artifact.content}
          </pre>
        </section>
      </div>
    </div>
  );
}
