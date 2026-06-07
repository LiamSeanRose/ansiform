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
 * Multi-vendor (#27): when a task declares per-vendor preview templates, a
 * vendor selector swaps which template renders. The schema and the YAML vars are
 * vendor-independent — only the previewed CLI changes — so switching vendor never
 * touches the always-correct output. A vendor template the author flagged
 * `approximate` clamps the preview fidelity down so an un-reviewed render shows
 * the degrade notice and is never mistaken for ground truth.
 *
 * Secrets (§5): secret-typed values are masked before they reach the preview, so
 * the most visible pane never displays one. Nothing here persists, logs, or
 * transmits the value model.
 */
import { useId, useMemo, useState } from 'react';
import type { FormValues } from '../../core';
import {
  Form,
  initialValues,
  secretFieldNames,
  type FormMessages,
  type NetworkWarningMessages,
  type Translate,
} from '../form';
import { networkWarningMessages } from '../form/warning-messages';
import { PreviewPane, renderPreview, withFidelityFloor, type PreviewMessages } from '../../core/preview';
import { YamlOutputPanel, SurveyDownloadButton, VarsDiff, type OutputMessages, type VarsDiffMessages } from '../output';
import { buildVars, groupVarsYamlSink } from '../../core/output/yaml';
import { buildSurveySpec } from '../../core/output/survey-spec';
import { createSeedRegistry } from '../../core/filters/seed';
import {
  taskVendors,
  templateForVendor,
  vendorOf,
  vendorTemplateApproximate,
  type Vendor,
} from '../../core/tasks/vendor';
import type { TaskModule } from '../../tasks/registry';

/** Externalized workbench chrome; the page builds this from the i18n catalogue. */
export interface WorkbenchMessages {
  formHeading: string;
  output: OutputMessages;
  form: FormMessages;
  preview: PreviewMessages;
  /** Label for the AWX/AAP survey-spec download action (#33). */
  surveyLabel: string;
  /** Merge-into-existing-file diff copy (#82). */
  varsDiff: VarsDiffMessages;
  /** Preview-target selector copy (multi-vendor, #27). */
  vendor: {
    /** Accessible label for the vendor `<select>`. */
    selectLabel: string;
    /** Display name per vendor, used in the selector and the preview heading. */
    labels: Record<Vendor, string>;
  };
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
  const { schema, defaultScope } = task.definition;
  const selectId = useId();

  // The vendors this task can preview, base vendor first. A single-vendor task
  // yields one entry and shows no selector.
  const vendors = useMemo(() => taskVendors(task.definition), [task.definition]);
  const [vendor, setVendor] = useState<Vendor>(() => vendorOf(task.definition));

  const template = templateForVendor(task.definition, vendor);
  const approximate = vendorTemplateApproximate(task.definition, vendor);

  const initial = useMemo(() => initialValues(schema), [schema]);
  // Advisory network-validation copy (#86) — enables `format` warnings on fields.
  const warnings = useMemo<NetworkWarningMessages>(() => networkWarningMessages(t), [t]);
  const [values, setValues] = useState<FormValues>(initial);
  const secrets = useMemo(() => secretFieldNames(schema), [schema]);
  const secretNames = useMemo(() => [...secrets], [secrets]);

  // Vault hand-off (#80): when the task has secret fields, hand the output panel
  // the secret key names + its copy so it can teach the `encrypt_string` command
  // for each. Copy is resolved here via the task translator (it falls back to the
  // global catalogue), so the panel stays a dumb presentational component.
  const outputMessages = useMemo<OutputMessages>(() => {
    if (secrets.size === 0) return messages.output;
    return {
      ...messages.output,
      vault: {
        heading: t('output.vault.heading'),
        intro: t('output.vault.intro'),
        copyLabel: t('output.vault.copyLabel'),
        copyAllLabel: t('output.vault.copyAllLabel'),
        copiedStatus: t('output.vault.copied'),
        copyFailedStatus: t('output.vault.copyFailed'),
      },
    };
  }, [messages.output, secrets, t]);

  // Always-correct YAML, derived from the raw value model. Vendor-independent.
  const artifact = useMemo(
    () => groupVarsYamlSink.render({ schema, values, scope: defaultScope }),
    [schema, values, defaultScope],
  );

  // The same always-correct top-level vars, as an object, for the merge-into-an-
  // existing-file diff (#82). Built from the identical path as the YAML above.
  const generatedVars = useMemo(() => buildVars(schema, values), [schema, values]);

  // AWX/AAP survey spec (#33): schema-only, so it never reflects entered values
  // and never re-renders on keystroke.
  const surveySpec = useMemo(() => buildSurveySpec(schema), [schema]);

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
    const result = renderPreview(template, scope, registry);
    // Honesty clamp: an un-reviewed vendor override (#27) or a task-level fidelity
    // floor (#40, e.g. a non-line-CLI platform) can never let the preview claim
    // exact. Both collapse to the same at-worst-`approximate` floor.
    const floor =
      approximate || task.definition.fidelityFloor === 'approximate' ? 'approximate' : undefined;
    return withFidelityFloor(result, floor);
  }, [template, values, secrets, approximate, task.definition.fidelityFloor]);

  // Per-vendor preview heading: the `{vendor}` slot resolves to the active label.
  const previewMessages = useMemo<PreviewMessages>(() => {
    if (!messages.preview.heading) return messages.preview;
    return {
      ...messages.preview,
      heading: messages.preview.heading.replace('{vendor}', messages.vendor.labels[vendor]),
    };
  }, [messages.preview, messages.vendor.labels, vendor]);

  return (
    <div className="workbench">
      <section className="workbench__pane workbench__form" aria-label={messages.formHeading}>
        <h2 className="workbench__heading">{messages.formHeading}</h2>
        <Form
          schema={schema}
          t={t}
          messages={messages.form}
          warningMessages={warnings}
          initialValues={initial}
          onChange={setValues}
        />
      </section>

      <div className="workbench__pane workbench__output">
        {vendors.length > 1 && (
          <div className="workbench__vendor">
            <label htmlFor={selectId}>{messages.vendor.selectLabel}</label>
            <select
              id={selectId}
              value={vendor}
              onChange={(e) => setVendor(e.target.value as Vendor)}
            >
              {vendors.map((v) => (
                <option key={v} value={v}>
                  {messages.vendor.labels[v]}
                </option>
              ))}
            </select>
          </div>
        )}
        <PreviewPane result={preview} messages={previewMessages} />
        <YamlOutputPanel artifact={artifact} messages={outputMessages} secretNames={secretNames} />
        <VarsDiff generated={generatedVars} messages={messages.varsDiff} />
        {surveySpec.spec.length > 0 && (
          <div className="workbench__survey">
            <SurveyDownloadButton spec={surveySpec} label={messages.surveyLabel} />
          </div>
        )}
      </div>
    </div>
  );
}
