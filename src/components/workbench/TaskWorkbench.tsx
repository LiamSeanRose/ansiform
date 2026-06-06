/**
 * Two-pane task workbench (issue #6) — the composition seam where the engine
 * modules meet:
 *
 *   form (#4, left)  →  live device-CLI preview (#5, right, top)
 *                    →  group_vars/host_vars YAML (#2, right, bottom)
 *
 * The form owns the in-memory value model and streams it here via `onChange`.
 * From those values we derive two outputs every keystroke:
 *  - the **YAML** (always correct, council §4) straight from the values, and
 *  - the **device CLI preview** by rendering the task template through the seed
 *    filter registry (#3); fidelity degrades visibly when a filter isn't exact.
 *
 * Secrets (§5): secret-typed values are masked before they reach the preview, so
 * the most visible pane never displays one. Nothing here persists, logs, or
 * transmits the value model.
 */
import { useId, useMemo, useState } from 'react';
import type { FormValues } from '../../core';
import { Form, initialValues, secretFieldNames, type FormMessages, type Translate } from '../form';
import { PreviewPane, renderPreview, type PreviewMessages } from '../../core/preview';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { createSeedRegistry } from '../../core/filters/seed';
import type { TaskModule } from '../../tasks/registry';

/** Externalized workbench chrome; the page builds this from the i18n catalogue. */
export interface WorkbenchMessages {
  formHeading: string;
  outputHeading: string;
  outputPathLabel: string;
  form: FormMessages;
  preview: PreviewMessages;
}

export interface TaskWorkbenchProps {
  task: TaskModule;
  /** Task-scoped translator (resolves the schema's label/help keys). */
  t: Translate;
  messages: WorkbenchMessages;
}

// One shared registry for the whole app — filters are stateless.
const registry = createSeedRegistry();
const SECRET_MASK = '********';

export function TaskWorkbench({ task, t, messages }: TaskWorkbenchProps) {
  const { schema, template, defaultScope } = task.definition;
  const outputId = useId();

  const initial = useMemo(() => initialValues(schema), [schema]);
  const [values, setValues] = useState<FormValues>(initial);
  const secrets = useMemo(() => secretFieldNames(schema), [schema]);

  // Always-correct YAML, derived from the raw value model.
  const artifact = useMemo(
    () => groupVarsYamlSink.render({ schema, values, scope: defaultScope }),
    [schema, values, defaultScope],
  );

  // Device-CLI preview, with secrets masked out of the rendered scope.
  const preview = useMemo(() => {
    let scope: FormValues = values;
    if (secrets.size > 0) {
      scope = { ...values };
      for (const name of secrets) {
        const v = scope[name];
        if (v !== undefined && v !== '') scope[name] = SECRET_MASK;
      }
    }
    return renderPreview(template, scope, registry);
  }, [template, values, secrets]);

  return (
    <div className="workbench">
      <section className="workbench__pane workbench__form" aria-label={messages.formHeading}>
        <h2 className="workbench__heading">{messages.formHeading}</h2>
        <Form
          schema={schema}
          t={t}
          messages={messages.form}
          initialValues={initial}
          onChange={setValues}
        />
      </section>

      <div className="workbench__pane workbench__output">
        <PreviewPane result={preview} messages={messages.preview} />

        <section className="output" aria-labelledby={outputId}>
          <h2 className="output__heading" id={outputId}>
            {messages.outputHeading}
          </h2>
          <p className="output__path">
            <span className="output__path-label">{messages.outputPathLabel}</span>{' '}
            <code className="output__filename">{artifact.filename}</code>
          </p>
          {/* Text node only — the YAML is data, never markup. */}
          <pre className="output__yaml" tabIndex={0} aria-label={messages.outputHeading}>
            {artifact.content}
          </pre>
        </section>
      </div>
    </div>
  );
}
