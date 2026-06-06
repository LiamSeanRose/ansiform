/**
 * Repeating-group (list) field control (issue #20, council §6).
 *
 * Renders a `list` field as a `<fieldset>` of rows; each row is a `role="group"`
 * of the list's scalar sub-fields, reusing the accessible `FieldControl` for each
 * one. Rows are added/removed with native `<button>`s (fully keyboard-operable);
 * after a change, focus moves to a sensible target and an `aria-live` region
 * announces what happened (WCAG AA). The component is controlled — rows live in
 * the form value model, never in local state — so nothing here persists.
 */
import { useEffect, useRef, useState } from 'react';
import type { Ref } from 'react';
import type { FieldValue, ListField, RowValues, ScalarValue } from '../../core';
import { FieldControl, type Translate } from './FieldControl';
import type { FieldError, FormMessages } from './types';
import { validateField } from './validation';
import { rowDefaults } from './defaults';

export interface ListFieldControlProps {
  field: ListField;
  value: FieldValue;
  error?: FieldError;
  onValueChange: (name: string, value: FieldValue) => void;
  t: Translate;
  messages: FormMessages;
  idPrefix: string;
  /** Attached to the add button so the error summary can move focus here. */
  inputRef?: Ref<HTMLElement>;
}

type Pending = { kind: 'add' } | { kind: 'remove'; index: number } | null;

export function ListFieldControl({
  field,
  value,
  error,
  onValueChange,
  t,
  messages,
  idPrefix,
  inputRef,
}: ListFieldControlProps) {
  const rows: RowValues[] = Array.isArray(value) ? value : [];
  const containerRef = useRef<HTMLFieldSetElement>(null);
  const pending = useRef<Pending>(null);
  const [announcement, setAnnouncement] = useState('');

  const atMax = field.maxRows !== undefined && rows.length >= field.maxRows;
  // Show per-row errors only once the list itself has been flagged incomplete.
  const showErrors = error?.code === 'incomplete';

  const label = t(field.label);
  const tx = (key: string, vars?: Record<string, string | number>) => t(key, vars);
  const rowLabel = (i: number) =>
    field.itemLabel ? tx(field.itemLabel, { index: i + 1 }) : tx('form.list.row', { index: i + 1 });
  const removeLabel = (i: number) =>
    field.removeLabel
      ? tx(field.removeLabel, { index: i + 1 })
      : tx('form.list.remove', { index: i + 1 });

  // After rows change, move focus and clear the pending intent.
  useEffect(() => {
    const intent = pending.current;
    pending.current = null;
    const root = containerRef.current;
    if (!intent || !root) return;
    const rowEls = root.querySelectorAll<HTMLElement>('.list-field__row');
    if (intent.kind === 'add') {
      const last = rowEls[rowEls.length - 1];
      last?.querySelector<HTMLElement>('input, select, textarea')?.focus();
    } else if (rowEls.length === 0) {
      root.querySelector<HTMLButtonElement>('.list-field__add')?.focus();
    } else {
      const idx = Math.min(intent.index, rowEls.length - 1);
      rowEls[idx]?.querySelector<HTMLButtonElement>('.list-field__remove')?.focus();
    }
  }, [value]);

  const addRow = () => {
    if (atMax) return;
    pending.current = { kind: 'add' };
    onValueChange(field.name, [...rows, rowDefaults(field.fields)]);
    setAnnouncement(tx('form.list.added'));
  };

  const removeRow = (index: number) => {
    pending.current = { kind: 'remove', index };
    onValueChange(
      field.name,
      rows.filter((_, i) => i !== index),
    );
    setAnnouncement(tx('form.list.removed', { index: index + 1 }));
  };

  const updateCell = (index: number, subName: string, next: FieldValue) => {
    onValueChange(
      field.name,
      rows.map((row, i) => (i === index ? { ...row, [subName]: next as ScalarValue } : row)),
    );
  };

  return (
    <fieldset className="form-field form-field--list list-field" ref={containerRef}>
      <legend className="form-field__label">
        {label}
        {field.required && (
          <span className="form-field__required"> {messages.requiredLabel}</span>
        )}
      </legend>
      {field.help && <p className="form-field__help">{t(field.help)}</p>}
      {error && (
        <p className="form-field__error">{t(messages.errors[error.code], { label })}</p>
      )}

      {rows.length === 0 ? (
        <p className="list-field__empty muted">{tx('form.list.empty')}</p>
      ) : (
        rows.map((row, index) => (
          <div className="list-field__row" role="group" aria-label={rowLabel(index)} key={index}>
            <span className="list-field__row-label" aria-hidden="true">
              {rowLabel(index)}
            </span>
            {field.fields.map((sub) => (
              <FieldControl
                key={sub.name}
                field={sub}
                value={row[sub.name]}
                error={showErrors ? validateField(sub, row[sub.name]) : undefined}
                onValueChange={(subName, v) => updateCell(index, subName, v)}
                t={t}
                messages={messages}
                idPrefix={`${idPrefix}-${field.name}-${index}`}
              />
            ))}
            <button
              type="button"
              className="list-field__remove"
              onClick={() => removeRow(index)}
            >
              {removeLabel(index)}
            </button>
          </div>
        ))
      )}

      <button
        type="button"
        className="list-field__add"
        ref={inputRef as Ref<HTMLButtonElement>}
        onClick={addRow}
        disabled={atMax}
      >
        {t(field.addLabel ?? 'form.list.add')}
      </button>

      <span className="list-field__status" role="status" aria-live="polite">
        {announcement}
      </span>
    </fieldset>
  );
}
