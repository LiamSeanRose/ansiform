/**
 * Template reader — edit mode (issue #31).
 *
 * The read-only explainer (#30) tells the operator what a pasted template needs.
 * This extends it with the operator's *second* job: safely make the change
 * in-tool rather than hand-editing a raw vars file — but WITHOUT the
 * confidently-wrong inferred form #30 was built to avoid.
 *
 * How the guardrails are kept:
 *  - The fields are a synthesized all-text `FormSchema` (`buildExtractedSchema`)
 *    fed to the SAME `Form` curated tasks use, and the SAME `renderPreview` /
 *    group_vars YAML sink — no forked form model, no second renderer.
 *  - No type/validation/default is inferred; every field is `data-source=extracted`.
 *  - Values are never pre-filled from the template (the extractor reads names,
 *    not values), and secrets are never seeded; secret-named fields are masked.
 *  - Export is **vars only** — `buildVars` emits the filled keys, never the
 *    pasted template. Download is a Blob (no URL-encoding), nothing persists.
 *  - A non-dismissible callout states types/validation are not inferred.
 */
import { useEffect, useMemo, useState } from 'react';
import type { FormValues } from '../../core';
import type { MessageKey, Translate as AppTranslate } from '../../i18n';
import {
  Form,
  initialValues,
  secretFieldNames,
  type FormMessages,
  type Translate as FieldTranslate,
} from '../../components/form';
import { YamlOutputPanel, type OutputMessages } from '../../components/output';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { buildExtractedSchema } from './edit-schema';

const registry = createSeedRegistry();
const SECRET_MASK = '********';

export interface EditModeProps {
  /** The pasted template — rendered for the preview, never exported. */
  template: string;
  /** Extracted free variables (reader's first-seen order). */
  variables: string[];
  /** App translator; unknown keys (the raw variable names) pass through verbatim. */
  t: AppTranslate;
}

export function EditMode({ template, variables, t }: EditModeProps) {
  // Field labels are the raw variable names, not catalogue keys; the app `t`
  // returns its argument unchanged for unknown keys, so this surfaces the name.
  const formT: FieldTranslate = (key, vars) => t(key as MessageKey, vars);

  const schema = useMemo(
    () => buildExtractedSchema(variables, t('reader.edit.fieldsLegend')),
    [variables, t],
  );
  const secrets = useMemo(() => secretFieldNames(schema), [schema]);

  const [values, setValues] = useState<FormValues>(() => initialValues(schema));

  // Reconcile when the pasted template changes the variable set: keep what the
  // operator already typed for variables that survive, drop the rest, new ones
  // start blank. Never carries a value across a rename.
  const variablesKey = variables.join('\n');
  useEffect(() => {
    setValues((prev) => {
      const next: FormValues = {};
      for (const name of variables) {
        if (Object.prototype.hasOwnProperty.call(prev, name)) next[name] = prev[name];
      }
      return next;
    });
    // variablesKey captures the membership; `variables` is its source.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variablesKey]);

  // Always-correct YAML — vars only, derived straight from the value model.
  const artifact = useMemo(
    () => groupVarsYamlSink.render({ schema, values }),
    [schema, values],
  );

  // Device-CLI preview, with secret-named values masked out of the rendered scope.
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

  const formMessages: FormMessages = {
    requiredLabel: t('form.requiredLabel'),
    errorSummaryHeading: t('form.errorSummaryHeading'),
    submitLabel: t('reader.edit.submitLabel'),
    errors: {
      required: 'form.error.required',
      pattern: 'form.error.pattern',
      min: 'form.error.min',
      max: 'form.error.max',
      notANumber: 'form.error.notANumber',
      incomplete: 'form.error.incomplete',
    },
  };

  const output: OutputMessages = {
    heading: t('reader.edit.outputHeading'),
    pathLabel: t('workbench.outputPathLabel'),
    copyLabel: t('output.copyLabel'),
    copiedStatus: t('output.copied'),
    copyFailedStatus: t('output.copyFailed'),
    downloadLabel: t('output.downloadLabel'),
  };

  return (
    <div className="reader__edit" data-source="extracted">
      {/* Non-dismissible honesty callout — always rendered, never closeable. */}
      <p className="preview__notice" role="note">
        {t('reader.edit.uninferred')}
      </p>

      {variables.length === 0 ? (
        <p className="muted">{t('reader.variablesNone')}</p>
      ) : (
        <div className="workbench">
          <section className="workbench__pane workbench__form" aria-label={t('reader.edit.formHeading')}>
            <h2 className="workbench__heading">{t('reader.edit.formHeading')}</h2>
            <Form schema={schema} t={formT} messages={formMessages} onChange={setValues} />
          </section>

          <div className="workbench__pane workbench__output">
            <section aria-label={t('reader.previewHeading')}>
              <h2 className="workbench__heading">{t('reader.previewHeading')}</h2>
              {preview.fidelity !== 'exact' && (
                <p className="preview__notice">{t('reader.fidelity.approximate')}</p>
              )}
              <pre className="preview__cli" tabIndex={0} aria-live="polite">
                {preview.text}
              </pre>
            </section>
            <YamlOutputPanel artifact={artifact} messages={output} />
          </div>
        </div>
      )}
    </div>
  );
}
