/**
 * Template reader / explainer — read-only (issue #30).
 *
 * Paste an existing Jinja2 template; see the variables to fill, the filters it
 * uses (with fidelity badges), and a live device-CLI preview against editable
 * *sample* values. Strictly descriptive: no inferred types, no validation, no
 * generated YAML, no round-trip — it surfaces what's in the template and is
 * honest about what it can't know (council deal-breaker: never silently wrong).
 *
 * Security (council §5): the pasted template lives only in component state — it
 * is never persisted, URL-encoded, logged, or sent anywhere. All pasted content
 * is rendered as DOM text nodes (React string children — never innerHTML).
 * Credential-named variables are masked; Vault blocks are flagged, never decoded.
 */
import { Fragment, useEffect, useId, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../i18n/useTranslation';
import type { MessageKey } from '../../i18n';
import { createSeedRegistry } from '../../core/filters/seed';
import {
  extractTemplate,
  MAX_TEMPLATE_LENGTH,
  renderPreview,
  withFidelityFloor,
  type Scope,
} from '../../core/preview';
import type { Vendor } from '../../core/tasks/vendor';
import { hasVaultBlock, looksLikeSecretName, looksLikeSetForm, segmentTemplate } from './segment';
import { EditMode } from './EditMode';

// Pure + stable: build the seed filter registry once for the whole page.
const registry = createSeedRegistry();
const MAX_KB = Math.floor(MAX_TEMPLATE_LENGTH / 1024);

const TIER_KEY = {
  exact: 'reader.tier.exact',
  approximate: 'reader.tier.approximate',
  unsupported: 'reader.tier.unsupported',
} as const;
const FIDELITY_KEY = {
  exact: 'reader.fidelity.exact',
  approximate: 'reader.fidelity.approximate',
  unsupported: 'reader.fidelity.unsupported',
} as const;

// Preview-target platforms the reader can label its render for (#70). Mirrors the
// Vendor union. The reader renders a pasted template literally, so the selector's
// job is to label the preview honestly (it was hard-coded "Cisco IOS") — and the
// non-line-CLI platforms, whose curated tasks carry an approximate fidelityFloor
// (#40), clamp the preview down so a non-IOS render never claims exact.
const PREVIEW_VENDORS: readonly Vendor[] = [
  'cisco-ios',
  'cisco-iosxe',
  'cisco-nxos',
  'arista-eos',
  'cisco-asa',
  'cisco-iosxr',
  'juniper-junos',
  'cradlepoint-ncos',
];
const FLOORED_VENDORS: ReadonlySet<Vendor> = new Set<Vendor>(['juniper-junos', 'cradlepoint-ncos']);

export function TemplateReaderPage() {
  const { t } = useTranslation();
  const [template, setTemplate] = useState('');
  const [sample, setSample] = useState<Record<string, string>>({});
  // Edit mode (#31) is gated behind an explicit acknowledgment that types and
  // validation are NOT inferred. Unchecking the gate drops back to read-only.
  const [acked, setAcked] = useState(false);
  const [mode, setMode] = useState<'read' | 'edit'>('read');
  // Preview target (#70): labels the render and applies the non-line-CLI floor.
  const [previewVendor, setPreviewVendor] = useState<Vendor>('cisco-ios');
  const ids = useId();
  const editMode = acked && mode === 'edit';

  useEffect(() => {
    const prev = document.title;
    document.title = `${t('reader.title')} · Ansiform`;
    return () => {
      document.title = prev;
    };
  }, [t]);

  const extraction = useMemo(() => extractTemplate(template, registry), [template]);
  const segments = useMemo(() => segmentTemplate(template), [template]);
  // Auto-detect a flat `set …` paste (Junos / VyOS / Cradlepoint), #71.
  const setForm = useMemo(() => looksLikeSetForm(template), [template]);
  const preview = useMemo(() => {
    const scope: Scope = { ...sample };
    const result = renderPreview(template, scope, registry);
    // Honest non-IOS fidelity: a non-line-CLI target (#70) or a detected set-form
    // paste (#71) can't claim exact, so clamp it the way the curated tasks do.
    const floor = setForm || FLOORED_VENDORS.has(previewVendor);
    return floor ? withFidelityFloor(result, 'approximate') : result;
  }, [template, sample, previewVendor, setForm]);

  const hasContent = template.trim().length > 0;
  const pasteHelpId = `${ids}-help`;
  const previewHeading = t('reader.previewHeading', {
    vendor: t(`vendor.${previewVendor}` as MessageKey),
  });

  return (
    <section className="page page--task" aria-labelledby="reader-title">
      <h1 id="reader-title">{t('reader.title')}</h1>
      <p className="reader__scope-note">{t('reader.scopeNote')}</p>
      <p className="lede">{t('reader.lede')}</p>
      <p className="muted">
        {t('reader.toImportText')} <Link to="/import">{t('reader.toImportLink')}</Link>
      </p>

      <div className="form-field">
        <label className="form-field__label" htmlFor={`${ids}-paste`}>
          {t('reader.pasteLabel')}
        </label>
        <p className="form-field__help" id={pasteHelpId}>
          {t('reader.pasteHelp')}
        </p>
        <textarea
          id={`${ids}-paste`}
          className="form-field__control reader__input"
          aria-describedby={pasteHelpId}
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          rows={8}
          value={template}
          placeholder={t('reader.pastePlaceholder')}
          onChange={(e) => setTemplate(e.target.value)}
        />
      </div>

      {extraction.tooLarge && (
        <p className="preview__notice" role="alert">
          {t('reader.tooLarge', { max: MAX_KB })}
        </p>
      )}

      {!hasContent && !extraction.tooLarge && <p className="muted">{t('reader.empty')}</p>}

      {hasContent && !extraction.tooLarge && (
        <>
          <p
            className={
              extraction.fidelity === 'exact'
                ? 'reader__fidelity reader__fidelity--exact'
                : 'preview__notice'
            }
          >
            {t(FIDELITY_KEY[extraction.fidelity])}
          </p>
          <p className="reader__count">{t('reader.foundCount', { count: extraction.variables.length })}</p>
          {extraction.loopVars.length > 0 && (
            <p className="muted">{t('reader.loopVars', { names: extraction.loopVars.join(', ') })}</p>
          )}
          {hasVaultBlock(template) && (
            <p className="preview__notice">{t('reader.vaultNote')}</p>
          )}

          <div className="reader__modebar">
            <label className="reader__ack">
              <input
                type="checkbox"
                checked={acked}
                onChange={(e) => setAcked(e.target.checked)}
              />{' '}
              {t('reader.edit.ack')}
            </label>
            <button
              type="button"
              className="reader__mode-toggle"
              disabled={!acked}
              aria-pressed={editMode}
              onClick={() => setMode((m) => (m === 'edit' ? 'read' : 'edit'))}
            >
              {editMode ? t('reader.edit.exit') : t('reader.edit.enter')}
            </button>
          </div>

          {editMode ? (
            <EditMode template={template} variables={extraction.variables} t={t} />
          ) : (
          <div className="workbench">
            <div className="workbench__pane">
              <fieldset className="form__group">
                <legend className="form__legend">{t('reader.variablesHeading')}</legend>
                {extraction.variables.length === 0 ? (
                  <p className="muted">{t('reader.variablesNone')}</p>
                ) : (
                  extraction.variables.map((name) => {
                    const secret = looksLikeSecretName(name);
                    const fieldId = `${ids}-v-${name}`;
                    const helpId = `${fieldId}-help`;
                    return (
                      <div className="form-field" key={name}>
                        <label className="form-field__label" htmlFor={fieldId}>
                          <code>{name}</code>
                          {secret && (
                            <span className="form-field__required"> {t('reader.secretBadge')}</span>
                          )}
                        </label>
                        <input
                          id={fieldId}
                          className="form-field__control"
                          type={secret ? 'password' : 'text'}
                          autoComplete={secret ? 'new-password' : 'off'}
                          aria-describedby={helpId}
                          value={sample[name] ?? ''}
                          onChange={(e) =>
                            setSample((prev) => ({ ...prev, [name]: e.target.value }))
                          }
                        />
                        <p className="form-field__help" id={helpId}>
                          {t('reader.varSampleHelp')}
                        </p>
                      </div>
                    );
                  })
                )}
              </fieldset>

              <section aria-label={t('reader.filtersHeading')}>
                <h2 className="workbench__heading">{t('reader.filtersHeading')}</h2>
                {extraction.filters.length === 0 ? (
                  <p className="muted">{t('reader.filtersNone')}</p>
                ) : (
                  <ul className="reader__filters">
                    {extraction.filters.map((f) => (
                      <li key={f.name}>
                        <code>{f.name}</code>{' '}
                        <span className={`reader__badge reader__badge--${f.tier}`}>
                          {t(TIER_KEY[f.tier])}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            </div>

            <div className="workbench__pane">
              <section aria-label={t('reader.templateHeading')}>
                <h2 className="workbench__heading">{t('reader.templateHeading')}</h2>
                {/* Text-node-only: React renders string children as text nodes. */}
                <pre className="reader__template">
                  {segments.map((seg, i) =>
                    seg.kind === 'text' ? (
                      <Fragment key={i}>{seg.text}</Fragment>
                    ) : (
                      <span key={i} className={`reader__chip reader__chip--${seg.kind}`}>
                        {seg.text}
                      </span>
                    ),
                  )}
                </pre>
              </section>

              <section aria-label={previewHeading}>
                <div className="workbench__vendor">
                  <label htmlFor={`${ids}-vendor`}>{t('workbench.vendorSelectLabel')}</label>
                  <select
                    id={`${ids}-vendor`}
                    value={previewVendor}
                    onChange={(e) => setPreviewVendor(e.target.value as Vendor)}
                  >
                    {PREVIEW_VENDORS.map((v) => (
                      <option key={v} value={v}>
                        {t(`vendor.${v}` as MessageKey)}
                      </option>
                    ))}
                  </select>
                </div>
                <h2 className="workbench__heading">{previewHeading}</h2>
                {setForm ? (
                  <p className="preview__notice">{t('reader.setFormNote')}</p>
                ) : (
                  preview.fidelity !== 'exact' && (
                    <p className="preview__notice">{t('reader.fidelity.approximate')}</p>
                  )
                )}
                <pre className="preview__cli" tabIndex={0} aria-live="polite">
                  {preview.text}
                </pre>
              </section>
            </div>
          </div>
          )}
        </>
      )}
    </section>
  );
}
