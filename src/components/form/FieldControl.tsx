/**
 * Renders one schema field as an accessible control (issue #4, council §6).
 *
 * Every field gets: a programmatically-associated `<label>`, optional help wired
 * via `aria-describedby`, and—when invalid—`aria-invalid` plus an error message
 * also joined into `aria-describedby`. The `secret` type is a password input
 * with `autocomplete="new-password"` and never carries a default (§5).
 */
import type { ChangeEvent, Ref } from 'react';
import type { Field, FieldValue, FormValues, ListField } from '../../core';
import { newEntry } from './defaults';
import type { FieldError, FormMessages } from './types';

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
  /** Namespacing prefix so ids are unique when multiple forms share a page. */
  idPrefix: string;
  /** Attached to the control so the error summary can move focus to it. */
  inputRef?: Ref<HTMLElement>;
}

function describedBy(helpId: string | undefined, errorId: string | undefined): string | undefined {
  const ids = [helpId, errorId].filter(Boolean);
  return ids.length ? ids.join(' ') : undefined;
}

export function FieldControl({
  field,
  value,
  error,
  onValueChange,
  t,
  messages,
  idPrefix,
  inputRef,
}: FieldControlProps) {
  // A list field is a repeating fieldset, not a single labelled control.
  if (field.type === 'list') {
    return (
      <ListFieldControl
        field={field}
        value={value}
        onValueChange={onValueChange}
        t={t}
        messages={messages}
        idPrefix={idPrefix}
      />
    );
  }

  const fieldId = `${idPrefix}-${field.name}`;
  const helpId = field.help ? `${fieldId}-help` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const aria = describedBy(helpId, errorId);
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
      {errorNode}
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

    case 'list':
      // Lists are rendered by ListFieldControl; never reached here.
      return null;
  }
}

interface ListFieldControlProps {
  field: ListField;
  value: FieldValue;
  onValueChange: (name: string, value: FieldValue) => void;
  t: Translate;
  messages: FormMessages;
  idPrefix: string;
}

/**
 * A repeating group of sub-records. Each entry renders the list's `item`
 * sub-fields (reusing `FieldControl`) inside its own fieldset, with add/remove
 * controls. The whole array is emitted through `onValueChange` on every edit, so
 * the value model stays a plain `FormValues[]` the engine already understands.
 */
function ListFieldControl({
  field,
  value,
  onValueChange,
  t,
  messages,
  idPrefix,
}: ListFieldControlProps) {
  const entries: FormValues[] = Array.isArray(value) ? value : [];
  const groupId = `${idPrefix}-${field.name}`;
  const helpId = field.help ? `${groupId}-help` : undefined;
  const addLabel = field.addLabel ? t(field.addLabel) : messages.addEntryLabel;

  const updateEntry = (index: number, subName: string, subValue: FieldValue) => {
    onValueChange(
      field.name,
      entries.map((entry, i) => (i === index ? { ...entry, [subName]: subValue } : entry)),
    );
  };

  const addEntry = () => {
    onValueChange(field.name, [...entries, newEntry(field.item)]);
  };

  const removeEntry = (index: number) => {
    onValueChange(
      field.name,
      entries.filter((_, i) => i !== index),
    );
  };

  return (
    <fieldset className="form-list" aria-describedby={helpId}>
      <legend className="form-list__legend">
        {t(field.label)}
        {field.required && <span className="form-field__required"> {messages.requiredLabel}</span>}
      </legend>
      {field.help && (
        <p className="form-field__help" id={helpId}>
          {t(field.help)}
        </p>
      )}

      {entries.length === 0 ? (
        <p className="form-list__empty muted">{messages.emptyListLabel}</p>
      ) : (
        <ol className="form-list__entries">
          {entries.map((entry, index) => (
            <li className="form-list__entry" key={index}>
              <div className="form-list__entry-fields">
                {field.item.map((sub) => (
                  <FieldControl
                    key={sub.name}
                    field={sub}
                    value={entry[sub.name]}
                    onValueChange={(subName, subValue) => updateEntry(index, subName, subValue)}
                    t={t}
                    messages={messages}
                    idPrefix={`${groupId}-${index}`}
                  />
                ))}
              </div>
              <button
                type="button"
                className="form-list__remove"
                onClick={() => removeEntry(index)}
              >
                {messages.removeEntryLabel}
              </button>
            </li>
          ))}
        </ol>
      )}

      <button type="button" className="form-list__add" onClick={addEntry}>
        {addLabel}
      </button>
    </fieldset>
  );
}
