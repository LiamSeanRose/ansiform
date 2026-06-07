/**
 * "Merge into an existing file" diff view (issue #82).
 *
 * Wraps the pure `diffVars` core in a paste box + reviewable diff: the operator
 * pastes their current `group_vars`/`host_vars` file and sees, per top-level key,
 * what the generated set would **add**, **change**, or leave **unchanged**, plus a
 * paste-able block of only the added + changed keys.
 *
 * Spine (council §5): the pasted text lives in component state only — never
 * persisted, URL-encoded, or transmitted; the size/alias-bomb guards live in the
 * core. A credential-named key's echoed current value arrives already masked from
 * the core, so this view cannot leak one. The paste block (real values, like the
 * main YAML output) downloads/copies as text, never a link. Results are announced
 * through `aria-live`; the YAML is placed as a DOM text node, never `innerHTML`.
 *
 * The whole panel is a collapsed `<details>` so it stays out of the way until an
 * operator with an existing file reaches for it.
 */
import { useId, useMemo, useState } from 'react';
import { diffVars, type VarsDiffError } from '../../core/output/vars-diff';
import { copyText } from './clipboard';

/** Externalized diff copy; the page builds this from the i18n catalogue. */
export interface VarsDiffMessages {
  summaryLabel: string;
  description: string;
  pasteLabel: string;
  pasteHelp: string;
  placeholder: string;
  addedLabel: string;
  changedLabel: string;
  unchangedLabel: string;
  currentLabel: string;
  noChanges: string;
  blockHeading: string;
  blockNote: string;
  copyLabel: string;
  copiedStatus: string;
  copyFailedStatus: string;
  errorTooLarge: string;
  errorParse: string;
  errorShape: string;
}

export interface VarsDiffProps {
  /** The generated top-level vars to diff against the pasted file. */
  generated: Record<string, unknown>;
  messages: VarsDiffMessages;
}

function errorMessage(error: VarsDiffError, m: VarsDiffMessages): string {
  switch (error) {
    case 'tooLarge':
      return m.errorTooLarge;
    case 'parse':
      return m.errorParse;
    case 'shape':
      return m.errorShape;
  }
}

export function VarsDiff({ generated, messages: m }: VarsDiffProps) {
  const ids = useId();
  const [pasted, setPasted] = useState('');
  const [status, setStatus] = useState('');

  const trimmed = pasted.trim().length > 0;
  const result = useMemo(() => diffVars(pasted, generated), [pasted, generated]);

  const handleCopy = async () => {
    const ok = await copyText(result.block);
    setStatus(ok ? m.copiedStatus : m.copyFailedStatus);
  };

  const added = result.entries.filter((e) => e.status === 'added');
  const changed = result.entries.filter((e) => e.status === 'changed');
  const unchanged = result.entries.filter((e) => e.status === 'unchanged');

  return (
    <details className="vars-diff">
      <summary className="vars-diff__summary">{m.summaryLabel}</summary>

      <p className="vars-diff__description">{m.description}</p>

      <label className="vars-diff__label" htmlFor={`${ids}-paste`}>
        {m.pasteLabel}
      </label>
      <p className="vars-diff__help" id={`${ids}-help`}>
        {m.pasteHelp}
      </p>
      <textarea
        id={`${ids}-paste`}
        className="vars-diff__paste"
        aria-describedby={`${ids}-help`}
        value={pasted}
        placeholder={m.placeholder}
        spellCheck={false}
        rows={6}
        onChange={(e) => setPasted(e.target.value)}
      />

      <div className="vars-diff__result" aria-live="polite">
        {trimmed && !result.ok && (
          <p className="vars-diff__error" role="alert">
            {errorMessage(result.error!, m)}
          </p>
        )}

        {trimmed && result.ok && (
          <>
            {added.length > 0 && (
              <section className="vars-diff__group vars-diff__group--added">
                <h4 className="vars-diff__group-heading">
                  {m.addedLabel} ({added.length})
                </h4>
                <ul className="vars-diff__keys">
                  {added.map((e) => (
                    <li key={e.key} className="vars-diff__key">
                      <code>{e.key}</code>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {changed.length > 0 && (
              <section className="vars-diff__group vars-diff__group--changed">
                <h4 className="vars-diff__group-heading">
                  {m.changedLabel} ({changed.length})
                </h4>
                <ul className="vars-diff__keys">
                  {changed.map((e) => (
                    <li key={e.key} className="vars-diff__key">
                      <code>{e.key}</code>{' '}
                      <span className="vars-diff__current">
                        {m.currentLabel} <code>{e.existing}</code>
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {unchanged.length > 0 && (
              <section className="vars-diff__group vars-diff__group--unchanged">
                <h4 className="vars-diff__group-heading">
                  {m.unchangedLabel} ({unchanged.length})
                </h4>
                <ul className="vars-diff__keys">
                  {unchanged.map((e) => (
                    <li key={e.key} className="vars-diff__key">
                      <code>{e.key}</code>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.block === '' ? (
              <p className="vars-diff__no-changes">{m.noChanges}</p>
            ) : (
              <section className="vars-diff__block-section">
                <div className="vars-diff__block-header">
                  <h4 className="vars-diff__group-heading">{m.blockHeading}</h4>
                  <button type="button" className="vars-diff__copy" onClick={handleCopy}>
                    {m.copyLabel}
                  </button>
                </div>
                <p className="vars-diff__block-note">{m.blockNote}</p>
                {/* Text node only — the YAML is data, never markup. */}
                <pre className="vars-diff__block" tabIndex={0} aria-label={m.blockHeading}>
                  {result.block}
                </pre>
              </section>
            )}
          </>
        )}
      </div>

      <p className="vars-diff__status" role="status" aria-live="polite">
        {status}
      </p>
    </details>
  );
}
