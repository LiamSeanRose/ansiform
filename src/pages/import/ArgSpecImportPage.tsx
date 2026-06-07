/**
 * `argument_specs` import — first-class BYO path (issue #85).
 *
 * Graduates the `parseArgumentSpecs` engine (#32, now `src/core/import/`) from a
 * beta paste-source on `/reader` into its own SEO'd route with its own H1/meta.
 * Paste a role's `meta/argument_specs.yml`, get the EXACT form it declares, fill
 * it, and export the `group_vars`/`host_vars` the role expects — the variable
 * names come from *their* spec, so the output drops straight into *their* repo.
 *
 * Preview-less by design: a spec declares variables, not rendered configuration,
 * so there is no device-CLI preview and **no fidelity claim** — said plainly on
 * the page (this honesty is a feature, not a gap). The mapping is exact (#32):
 * declared type/required/default/choices carried through, nothing inferred; the
 * shapes our field model can't represent exactly degrade to text and are reported
 * by name in `approximated`.
 *
 * Reuse, don't fork: the imported `FormSchema` feeds the SAME `Form` + group_vars
 * YAML sink + download as every other path, plus the #80 vault hand-off for the
 * `no_log`/credential secrets the spec declares and the #82 merge helper for the
 * exported vars.
 *
 * Spine (council §5): the pasted spec is ephemeral — never stored, URL-encoded,
 * or sent; export is vars only, never the spec; secrets are masked. Hardening
 * from #32 (js-yaml safe `load`, 64 KB ceiling, alias-bomb guard) lives in core.
 */
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import type { MessageKey } from '../../i18n';
import type { FormSchema, FormValues } from '../../core';
import {
  Form,
  initialValues,
  secretFieldNames,
  type FormMessages,
  type Translate as FieldTranslate,
} from '../../components/form';
import {
  YamlOutputPanel,
  VarsDiff,
  type OutputMessages,
  type VarsDiffMessages,
} from '../../components/output';
import { buildVars, groupVarsYamlSink } from '../../core/output/yaml';
import { parseArgumentSpecs, MAX_ARGSPEC_LENGTH } from '../../core/import/argument-specs';

const MAX_KB = Math.floor(MAX_ARGSPEC_LENGTH / 1024);

const ERROR_KEY = {
  parse: 'import.parseError',
  shape: 'import.shapeError',
  tooLarge: 'import.tooLarge',
  empty: 'import.empty',
} as const;

/** Keep the document title + meta description in sync with the page (council §8). */
function useDocumentMeta(title: string, description: string) {
  useEffect(() => {
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
    meta.setAttribute('content', description);

    return () => {
      document.title = prevTitle;
      if (created) meta?.remove();
      else if (prevDesc !== null) meta?.setAttribute('content', prevDesc);
    };
  }, [title, description]);
}

/**
 * Form + YAML export for one parsed spec. Owns its own value model; remounted
 * (via a `key` on the schema) whenever the parsed spec changes, so the declared
 * defaults re-seed cleanly instead of stale values lingering across an edit.
 */
function SpecForm({ schema, t }: { schema: FormSchema; t: ReturnType<typeof useTranslation>['t'] }) {
  // Field labels are the raw option names; the app `t` returns unknown keys
  // verbatim, so the option name is shown.
  const formT: FieldTranslate = (key, vars) => t(key as MessageKey, vars);
  const [values, setValues] = useState<FormValues>(() => initialValues(schema));

  const artifact = useMemo(() => groupVarsYamlSink.render({ schema, values }), [schema, values]);
  const generatedVars = useMemo(() => buildVars(schema, values), [schema, values]);
  const secretNames = useMemo(() => [...secretFieldNames(schema)], [schema]);

  const formMessages: FormMessages = {
    requiredLabel: t('form.requiredLabel'),
    errorSummaryHeading: t('form.errorSummaryHeading'),
    submitLabel: t('import.submitLabel'),
    errors: {
      required: 'form.error.required',
      pattern: 'form.error.pattern',
      min: 'form.error.min',
      max: 'form.error.max',
      notANumber: 'form.error.notANumber',
      incomplete: 'form.error.incomplete',
    },
  };

  // The vault hand-off (#80) applies directly to the `no_log`/credential secrets
  // the spec declares; supply it only when the schema actually has secret fields.
  const output: OutputMessages = {
    heading: t('import.outputHeading'),
    pathLabel: t('workbench.outputPathLabel'),
    copyLabel: t('output.copyLabel'),
    copiedStatus: t('output.copied'),
    copyFailedStatus: t('output.copyFailed'),
    downloadLabel: t('output.downloadLabel'),
    ...(secretNames.length > 0
      ? {
          vault: {
            heading: t('output.vault.heading'),
            intro: t('output.vault.intro'),
            copyLabel: t('output.vault.copyLabel'),
            copyAllLabel: t('output.vault.copyAllLabel'),
            copiedStatus: t('output.vault.copied'),
            copyFailedStatus: t('output.vault.copyFailed'),
          },
        }
      : {}),
  };

  // The #82 merge helper applies to the exported vars like any other path.
  const varsDiff: VarsDiffMessages = {
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
    includeKey: t('output.varsDiff.includeKey'),
    noneSelected: t('output.varsDiff.noneSelected'),
  };

  return (
    <div className="workbench">
      <section className="workbench__pane workbench__form" aria-label={t('import.formHeading')}>
        <h2 className="workbench__heading">{t('import.formHeading')}</h2>
        <Form schema={schema} t={formT} messages={formMessages} onChange={setValues} />
      </section>
      <div className="workbench__pane workbench__output">
        <YamlOutputPanel artifact={artifact} messages={output} secretNames={secretNames} />
        <VarsDiff generated={generatedVars} messages={varsDiff} />
      </div>
    </div>
  );
}

export function ArgSpecImportPage() {
  const { t } = useTranslation();
  useDocumentMeta(t('import.title'), t('import.metaDescription'));

  const [spec, setSpec] = useState('');
  const result = useMemo(() => parseArgumentSpecs(spec), [spec]);

  const hasContent = spec.trim().length > 0;
  // Remount key: the set of fields the parse produced (names + types + defaults).
  const schemaKey =
    result.ok && result.schema
      ? JSON.stringify(
          result.schema.groups[0].fields.map((f) => [
            f.name,
            f.type,
            'default' in f ? f.default : undefined,
          ]),
        )
      : '';

  return (
    <section className="page page--task" aria-labelledby="import-title">
      <h1 id="import-title">{t('import.title')}</h1>
      <p className="lede">{t('import.lede')}</p>
      <p className="reader__fidelity reader__fidelity--exact">{t('import.exactNote')}</p>
      <p className="muted">{t('import.noPreviewNote')}</p>
      <p className="muted">
        {t('import.readerLinkText')} <Link to="/reader">{t('import.readerLink')}</Link>
      </p>

      <div className="form-field">
        <label className="form-field__label" htmlFor="import-paste">
          {t('import.pasteLabel')}
        </label>
        <p className="form-field__help" id="import-paste-help">
          {t('import.pasteHelp')}
        </p>
        <textarea
          id="import-paste"
          className="form-field__control reader__input"
          aria-describedby="import-paste-help"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          rows={8}
          value={spec}
          placeholder={t('import.placeholder')}
          onChange={(e) => setSpec(e.target.value)}
        />
      </div>

      {!hasContent && <p className="muted">{t('import.empty')}</p>}

      {hasContent && !result.ok && result.error && (
        <p className="preview__notice" role="alert">
          {t(ERROR_KEY[result.error], { max: MAX_KB })}
        </p>
      )}

      {result.ok && result.schema && (
        <>
          <p className="reader__count">
            {t('import.entrypoint', { name: result.entrypoint ?? 'main' })}
          </p>
          {result.approximated.length > 0 && (
            <p className="preview__notice">
              {t('import.approximated', {
                count: result.approximated.length,
                names: result.approximated.join(', '),
              })}
            </p>
          )}
          <SpecForm key={schemaKey} schema={result.schema} t={t} />
        </>
      )}
    </section>
  );
}
