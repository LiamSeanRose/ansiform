/**
 * Renders one schema field as an accessible control (issue #4, council §6).
 *
 * Every field gets: a programmatically-associated `<label>`, optional help wired
 * via `aria-describedby`, and—when invalid—`aria-invalid` plus an error message
 * also joined into `aria-describedby`. The `secret` type is a password input
 * with `autocomplete="new-password"` and never carries a default (§5).
 */
import { useState, type ChangeEvent, type Ref } from 'react';
import type { Field, FieldValue } from '../../core';
import { validateNetworkFormat } from '../../core/validation/network';
import type { FieldError, FormMessages, NetworkWarningMessages } from './types';

/** Minimal translate contract — decoupled from the app's `MessageKey` union so
 *  this module stays self-contained. Field labels/help are i18n keys. */
export type Translate = (key: string, vars?: Record<string, string | number>) => string;

export interface FieldControlProps {
  field: Field;
  value: FieldValue;
  error?: FieldError;
  onValueChange: (name: string, value: FieldValue) => void;
  t: Translate;
  messages: FormMessages;
  /**
   * Advisory network-validation copy (#86). Optional: when provided and a text
   * field declares a `format`, a non-matching value shows a dismissible warning.
   * Absent ⇒ no warnings render (the reader's all-text fields opt out for free).
   */
  warningMessages?: NetworkWarningMessages;
  /** Namespacing prefix so ids are unique when multiple forms share a page. */
  idPrefix: string;
  /** Attached to the control so the error summary can move focus to it. */
  inputRef?: Ref<HTMLElement>;
}

function describedBy(...ids: (string | undefined)[]): string | undefined {
  const present = ids.filter(Boolean);
  return present.length ? present.join(' ') : undefined;
}

export function FieldControl({
  field,
  value,
  error,
  onValueChange,
  t,
  messages,
  warningMessages,
  idPrefix,
  inputRef,
}: FieldControlProps) {
  // "Treat as text" dismissal (#86): remembers the exact value the user waved
  // through, so editing to a new value re-checks. Ephemeral — never persisted.
  const [dismissedValue, setDismissedValue] = useState<string | null>(null);

  const fieldId = `${idPrefix}-${field.name}`;
  const rawStr = typeof value === 'string' ? value : '';
  // Advisory only: a format mismatch warns, never sets aria-invalid and never
  // blocks submit/export. Only fires when copy is supplied and the field opted in.
  const warning =
    warningMessages && field.type === 'text' && field.format && dismissedValue !== rawStr
      ? validateNetworkFormat(field.format, rawStr)
      : undefined;

  const helpId = field.help ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const warningId = warning ? `${fieldId}-warning` : undefined;
  // Secret-handling cue (#92): a one-line reminder on secret fields that the
  // value stays local and must be vaulted before committing. The encrypt
  // commands themselves are surfaced by the vault hand-off below the output.
  const secretHintId = field.type === 'secret' ? `${fieldId}-secret` : undefined;
  const aria = describedBy(helpId, errorId, warningId, secretHintId);
  const invalid = error ? true : undefined;
  const label = t(field.label);

  const labelNode = (
    <span className="form-field__label-text">
      {label}
      {field.required && <span className="form-field__required"> {messages.requiredLabel}</span>}
    </span>
  );

  const help = field.help ? (
    <span className="form-field__help" id={helpId}>
      {t(field.help)}
    </span>
  ) : null;

  const errorNode = error ? (
    <span className="form-field__error" id={errorId}>
      {t(messages.errors[error.code], { label, ...error.params })}
    </span>
  ) : null;

  const secretHintNode = secretHintId ? (
    <span className="form-field__secret-hint" id={secretHintId}>
      {t('form.secretHint')}
    </span>
  ) : null;

  // Advisory warning (#86): visible, dismissible, never blocks. Joined into
  // aria-describedby so it is announced, but does NOT set aria-invalid.
  const warningNode =
    warning && warningMessages ? (
      <span className="form-field__warning" id={warningId}>
        {warningMessages.warnings[warning.code]}{' '}
        <button
          type="button"
          className="form-field__warning-dismiss"
          onClick={() => setDismissedValue(rawStr)}
        >
          {warningMessages.treatAsTextLabel}
        </button>
      </span>
    ) : null;

  const control = renderControl({
    field,
    value,
    fieldId,
    aria,
    invalid,
    onValueChange,
    t,
    inputRef,
  });

  // Checkboxes read better with the control before its label.
  const isCheckbox = field.type === 'boolean';

  return (
    <div className={`form-field form-field--${field.type}`}>
      <label className="form-field__label" htmlFor={fieldId}>
        {isCheckbox ? (
          <>
            {control}
            {labelNode}
          </>
        ) : (
          labelNode
        )}
      </label>
      {!isCheckbox && control}
      {help}
      {secretHintNode}
      {errorNode}
      {warningNode}
    </div>
  );
}

interface ControlProps {
  field: Field;
  value: FieldValue;
  fieldId: string;
  aria: string | undefined;
  invalid: true | undefined;
  onValueChange: (name: string, value: FieldValue) => void;
  t: Translate;
  inputRef?: Ref<HTMLElement>;
}

function renderControl({ field, value, fieldId, aria, invalid, onValueChange, t, inputRef }: ControlProps) {
  const common = {
    id: fieldId,
    name: field.name,
    'aria-describedby': aria,
    'aria-invalid': invalid,
    'aria-required': field.required || undefined,
    // Provenance marker (#31): present only on reader-extracted fields, so the
    // DOM advertises that this input's type was not inferred. Undefined → React
    // omits the attribute entirely for curated task fields.
    'data-source': field.dataSource,
  };

  switch (field.type) {
    case 'text':
      return (
        <input
          {...common}
          ref={inputRef as Ref<HTMLInputElement>}
          type="text"
          className="form-field__control"
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onValueChange(field.name, e.target.value)}
        />
      );

    case 'secret':
      return (
        <input
          {...common}
          ref={inputRef as Ref<HTMLInputElement>}
          type="password"
          autoComplete="new-password"
          spellCheck={false}
          className="form-field__control"
          // Secrets are never seeded: render whatever the user has typed this
          // session, nothing more.
          value={typeof value === 'string' ? value : ''}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onValueChange(field.name, e.target.value)}
        />
      );

    case 'number':
      return (
        <input
          {...common}
          ref={inputRef as Ref<HTMLInputElement>}
          type="number"
          className="form-field__control"
          value={typeof value === 'number' ? value : ''}
          min={field.min}
          max={field.max}
          onChange={(e: ChangeEvent<HTMLInputElement>) =>
            onValueChange(field.name, e.target.value === '' ? undefined : Number(e.target.value))
          }
        />
      );

    case 'boolean':
      return (
        <input
          {...common}
          ref={inputRef as Ref<HTMLInputElement>}
          type="checkbox"
          className="form-field__checkbox"
          checked={value === true}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onValueChange(field.name, e.target.checked)}
        />
      );

    case 'select':
      return (
        <select
          {...common}
          ref={inputRef as Ref<HTMLSelectElement>}
          className="form-field__control"
          value={typeof value === 'string' ? value : ''}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onValueChange(field.name, e.target.value)}
        >
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {t(opt.label)}
            </option>
          ))}
        </select>
      );
  }
}
