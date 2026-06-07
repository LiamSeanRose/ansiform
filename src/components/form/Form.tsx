/**
 * Accessible, schema-driven form renderer (issue #4, council §6).
 *
 * Renders a `FormSchema` (#1) into grouped fieldsets, owns the in-memory value
 * model, validates on submit, and surfaces failures through an error summary
 * that takes focus — the WCAG-AA pattern the council made non-negotiable. The
 * emitted value model (`onChange`) is what #2 (YAML) and #5 (preview) consume.
 *
 * State is held in memory only: nothing here writes to storage, the URL, or a
 * log, and secrets never leave this component except through the same
 * in-memory `onChange` (callers must `redactSecrets` before any persistence).
 */
import { useCallback, useEffect, useId, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import type { FieldValue, FormSchema, FormValues } from '../../core';
import { FieldControl, type Translate } from './FieldControl';
import { ListFieldControl } from './ListFieldControl';
import { initialValues } from './defaults';
import { fieldOrder, validateForm } from './validation';
import type { FieldErrors, FormMessages, NetworkWarningMessages, ValuesChange } from './types';

export interface FormProps {
  schema: FormSchema;
  /** Resolves i18n keys (field labels/help, option labels, chrome copy). */
  t: Translate;
  /** Externalized form chrome (required marker, summary heading, errors…). */
  messages: FormMessages;
  /** Advisory network-validation copy (#86); enables `format` warnings when set. */
  warningMessages?: NetworkWarningMessages;
  /** Called with the full value model whenever any field changes. */
  onChange?: ValuesChange;
  /** Called with the value model on a successful (valid) submit. */
  onSubmit?: (values: FormValues) => void;
  /** Seed values; defaults to the schema's declared defaults. */
  initialValues?: FormValues;
}

export function Form({
  schema,
  t,
  messages,
  warningMessages,
  onChange,
  onSubmit,
  initialValues: seed,
}: FormProps) {
  const idPrefix = useId();
  const [values, setValues] = useState<FormValues>(() => seed ?? initialValues(schema));
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  const summaryRef = useRef<HTMLDivElement>(null);
  const controlRefs = useRef(new Map<string, HTMLElement>());
  const focusToken = useRef(0);
  const [focusTick, setFocusTick] = useState(0);

  const order = fieldOrder(schema);

  // Move focus to the error summary after a failed submit (managed focus, §6).
  useEffect(() => {
    if (focusTick > 0) summaryRef.current?.focus();
  }, [focusTick]);

  const registerControl = useCallback((name: string, el: HTMLElement | null) => {
    if (el) controlRefs.current.set(name, el);
    else controlRefs.current.delete(name);
  }, []);

  const handleValueChange = useCallback(
    (name: string, value: FieldValue) => {
      setValues((prev) => {
        const next = { ...prev, [name]: value };
        onChange?.(next);
        // Once the user has tried to submit, keep validity live so flagged
        // fields clear as they are fixed.
        if (submitted) {
          setErrors(validateForm(schema, next));
        }
        return next;
      });
    },
    [onChange, schema, submitted],
  );

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const found = validateForm(schema, values);
    setErrors(found);
    setSubmitted(true);
    if (Object.keys(found).length > 0) {
      focusToken.current += 1;
      setFocusTick(focusToken.current);
    } else {
      onSubmit?.(values);
    }
  };

  const errorEntries = order.filter((name) => errors[name]);
  const hasErrors = errorEntries.length > 0;

  const focusField = (name: string) => {
    controlRefs.current.get(name)?.focus();
  };

  return (
    <form className="form" noValidate onSubmit={handleSubmit}>
      {hasErrors && (
        <div
          className="form__error-summary"
          ref={summaryRef}
          tabIndex={-1}
          role="alert"
          aria-labelledby={`${idPrefix}-summary-heading`}
        >
          <h2 className="form__error-summary-heading" id={`${idPrefix}-summary-heading`}>
            {messages.errorSummaryHeading}
          </h2>
          <ul className="form__error-summary-list">
            {errorEntries.map((name) => {
              const field = findField(schema, name);
              const error = errors[name];
              if (!field || !error) return null;
              const label = t(field.label);
              return (
                <li key={name}>
                  <button
                    type="button"
                    className="form__error-summary-link"
                    onClick={() => focusField(name)}
                  >
                    {t(messages.errors[error.code], { label, ...error.params })}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {schema.groups.map((group, index) => (
        <fieldset className="form__group" key={group.legend ?? index}>
          {group.legend && <legend className="form__legend">{t(group.legend)}</legend>}
          {group.fields.map((field) => {
            const common = {
              value: values[field.name],
              error: errors[field.name],
              onValueChange: handleValueChange,
              t,
              messages,
              warningMessages,
              idPrefix,
              inputRef: (el: HTMLElement | null) => registerControl(field.name, el),
            };
            return field.type === 'list' ? (
              <ListFieldControl key={field.name} field={field} {...common} />
            ) : (
              <FieldControl key={field.name} field={field} {...common} />
            );
          })}
        </fieldset>
      ))}

      <div className="form__actions">
        <button type="submit" className="form__submit">
          {messages.submitLabel}
        </button>
      </div>
    </form>
  );
}

function findField(schema: FormSchema, name: string) {
  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (field.name === name) return field;
    }
  }
  return undefined;
}
