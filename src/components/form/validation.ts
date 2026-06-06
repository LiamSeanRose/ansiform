/**
 * Pure form validation (issue #4).
 *
 * Returns structured `FieldError` codes rather than copy, so messages stay
 * externalized (§6) and the same logic is reusable headless (e.g. by #6 before
 * an export). Validation is intentionally light: the YAML output is always
 * correct (§ correctness model), so this guards UX, not playbook safety.
 */
import type { Field, FieldValue, FormSchema, FormValues } from '../../core';
import type { FieldError, FieldErrors } from './types';

/** A value that should count as "the user provided nothing". */
function isBlank(value: FieldValue): boolean {
  return value === undefined || value === '' || value === null;
}

/** Validate a single field's value. Returns the first error, or `undefined`. */
export function validateField(field: Field, value: FieldValue): FieldError | undefined {
  // List: required means ≥1 row; otherwise any invalid row marks it incomplete.
  if (field.type === 'list') {
    const rows = Array.isArray(value) ? value : [];
    if (field.required && rows.length === 0) return { code: 'required' };
    for (const row of rows) {
      for (const sub of field.fields) {
        if (validateField(sub, (row ?? {})[sub.name])) return { code: 'incomplete' };
      }
    }
    return undefined;
  }

  // Booleans are always satisfied (a checkbox is never "blank").
  if (field.type === 'boolean') return undefined;

  if (isBlank(value)) {
    return field.required ? { code: 'required' } : undefined;
  }

  switch (field.type) {
    case 'text': {
      if (field.pattern !== undefined) {
        let re: RegExp;
        try {
          re = new RegExp(field.pattern);
        } catch {
          // A malformed pattern in a schema should not block the user.
          return undefined;
        }
        if (!re.test(String(value))) return { code: 'pattern' };
      }
      return undefined;
    }
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      if (Number.isNaN(num)) return { code: 'notANumber' };
      if (field.min !== undefined && num < field.min) {
        return { code: 'min', params: { min: field.min } };
      }
      if (field.max !== undefined && num > field.max) {
        return { code: 'max', params: { max: field.max } };
      }
      return undefined;
    }
    case 'select':
    case 'secret':
      return undefined;
  }
}

/** Validate every field. Returns a map of `name → error` for failing fields. */
export function validateForm(schema: FormSchema, values: FormValues): FieldErrors {
  const errors: FieldErrors = {};
  for (const group of schema.groups) {
    for (const field of group.fields) {
      const error = validateField(field, values[field.name]);
      if (error) errors[field.name] = error;
    }
  }
  return errors;
}

/** Field names in schema order — used to order the error summary & focus. */
export function fieldOrder(schema: FormSchema): string[] {
  const order: string[] = [];
  for (const group of schema.groups) {
    for (const field of group.fields) order.push(field.name);
  }
  return order;
}
