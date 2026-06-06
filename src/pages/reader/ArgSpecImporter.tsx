/**
 * `argument_specs` importer surface (issue #32).
 *
 * The exact paste path: a declarative role spec maps onto an exact `FormSchema`
 * (`parseArgumentSpecs`) which drives the SAME `Form` + group_vars YAML sink the
 * curated tasks use. Because the types are *declared*, not guessed, this form is
 * correct-by-construction — the one place the reader can claim exactness.
 *
 * There is deliberately **no device-CLI preview** here: a spec declares
 * variables, not rendered configuration, so there is nothing to render and no
 * correctness claim is made beyond the form itself (the council's fidelity tiers
 * only govern the *preview*, which this surface doesn't have).
 *
 * Spine (§5): the pasted spec is ephemeral — never stored/encoded/sent; export
 * is a Blob of vars only; secrets (`no_log`/credential-named) are masked inputs.
 */
import { useMemo, useState } from 'react';
import type { FormSchema, FormValues } from '../../core';
import type { MessageKey, Translate as AppTranslate } from '../../i18n';
import {
  Form,
  initialValues,
  type FormMessages,
  type Translate as FieldTranslate,
} from '../../components/form';
import { YamlOutputPanel, type OutputMessages } from '../../components/output';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { parseArgumentSpecs, MAX_ARGSPEC_LENGTH } from './argument-specs';

const MAX_KB = Math.floor(MAX_ARGSPEC_LENGTH / 1024);

const ERROR_KEY = {
  parse: 'reader.argspec.parseError',
  shape: 'reader.argspec.shapeError',
  tooLarge: 'reader.argspec.tooLarge',
  empty: 'reader.argspec.empty',
} as const;

export interface ArgSpecImporterProps {
  t: AppTranslate;
}

/**
 * Form + YAML export for one parsed spec. Owns its own value model; remounted
 * (via a `key` on the schema) whenever the parsed spec changes, so the declared
 * defaults re-seed cleanly instead of stale values lingering across an edit.
 */
function SpecForm({ schema, t }: { schema: FormSchema; t: AppTranslate }) {
  // Field labels are the raw option names; the app `t` returns unknown keys
  // verbatim, so the option name is shown.
  const formT: FieldTranslate = (key, vars) => t(key as MessageKey, vars);
  const [values, setValues] = useState<FormValues>(() => initialValues(schema));

  const artifact = useMemo(() => groupVarsYamlSink.render({ schema, values }), [schema, values]);

  const formMessages: FormMessages = {
    requiredLabel: t('form.requiredLabel'),
    errorSummaryHeading: t('form.errorSummaryHeading'),
    submitLabel: t('reader.argspec.submitLabel'),
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
    heading: t('reader.argspec.outputHeading'),
    pathLabel: t('workbench.outputPathLabel'),
    copyLabel: t('output.copyLabel'),
    copiedStatus: t('output.copied'),
    copyFailedStatus: t('output.copyFailed'),
    downloadLabel: t('output.downloadLabel'),
  };

  return (
    <div className="workbench">
      <section className="workbench__pane workbench__form" aria-label={t('reader.argspec.formHeading')}>
        <h2 className="workbench__heading">{t('reader.argspec.formHeading')}</h2>
        <Form schema={schema} t={formT} messages={formMessages} onChange={setValues} />
      </section>
      <div className="workbench__pane workbench__output">
        <YamlOutputPanel artifact={artifact} messages={output} />
      </div>
    </div>
  );
}

export function ArgSpecImporter({ t }: ArgSpecImporterProps) {
  const [spec, setSpec] = useState('');
  const result = useMemo(() => parseArgumentSpecs(spec), [spec]);

  const hasContent = spec.trim().length > 0;
  // Remount key: the set of fields the parse produced (names + types + defaults).
  const schemaKey =
    result.ok && result.schema
      ? JSON.stringify(
          result.schema.groups[0].fields.map((f) => [f.name, f.type, 'default' in f ? f.default : undefined]),
        )
      : '';

  return (
    <div className="reader__argspec" data-source="extracted">
      <p className="reader__fidelity reader__fidelity--exact">{t('reader.argspec.intro')}</p>

      <div className="form-field">
        <label className="form-field__label" htmlFor="reader-argspec-paste">
          {t('reader.argspec.pasteLabel')}
        </label>
        <p className="form-field__help" id="reader-argspec-help">
          {t('reader.argspec.pasteHelp')}
        </p>
        <textarea
          id="reader-argspec-paste"
          className="form-field__control reader__input"
          aria-describedby="reader-argspec-help"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          rows={8}
          value={spec}
          placeholder={t('reader.argspec.placeholder')}
          onChange={(e) => setSpec(e.target.value)}
        />
      </div>

      {!hasContent && <p className="muted">{t('reader.argspec.empty')}</p>}

      {hasContent && !result.ok && result.error && (
        <p className="preview__notice" role="alert">
          {t(ERROR_KEY[result.error], { max: MAX_KB })}
        </p>
      )}

      {result.ok && result.schema && (
        <>
          <p className="reader__count">
            {t('reader.argspec.entrypoint', { name: result.entrypoint ?? 'main' })}
          </p>
          {result.approximated.length > 0 && (
            <p className="preview__notice">
              {t('reader.argspec.approximated', {
                count: result.approximated.length,
                names: result.approximated.join(', '),
              })}
            </p>
          )}
          <p className="muted">{t('reader.argspec.noPreview')}</p>
          <SpecForm key={schemaKey} schema={result.schema} t={t} />
        </>
      )}
    </div>
  );
}
