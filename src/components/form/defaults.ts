/**
 * Initial value model derived from a schema's declared defaults.
 *
 * Pure and DOM-free so it is trivially testable and reusable by the integration
 * layer (#6). Secrets are never seeded (§5): a `secret` field carries no
 * `default` and starts `undefined`. Booleans resolve to a concrete `false` when
 * undeclared so the checkbox control stays controlled from first render. A
 * `list` field starts at its declared default entries, or an empty array.
 */
import type { Field, FormSchema, FormValues } from '../../core';

/** Default value model for a flat list of fields (one form group, or one list entry). */
function fieldDefaults(fields: Field[]): FormValues {
  const values: FormValues = {};
  for (const field of fields) {
    switch (field.type) {
      case 'boolean':
        values[field.name] = field.default ?? false;
        break;
      case 'text':
      case 'number':
      case 'select':
        if (field.default !== undefined) values[field.name] = field.default;
        break;
      case 'secret':
        // Never seed a secret.
        break;
      case 'list':
        values[field.name] = field.default ? field.default.map((entry) => ({ ...entry })) : [];
        break;
    }
  }
  return values;
}

export function initialValues(schema: FormSchema): FormValues {
  const values: FormValues = {};
  for (const group of schema.groups) {
    Object.assign(values, fieldDefaults(group.fields));
  }
  return values;
}

/** A fresh entry for a `list` field, seeded from its item sub-fields' defaults. */
export function newEntry(item: Field[]): FormValues {
  return fieldDefaults(item);
}
