/**
 * Initial value model derived from a schema's declared defaults.
 *
 * Pure and DOM-free so it is trivially testable and reusable by the integration
 * layer (#6). Secrets are never seeded (§5): a `secret` field carries no
 * `default` and starts `undefined`. Booleans resolve to a concrete `false` when
 * undeclared so the checkbox control stays controlled from first render.
 */
import type { FormSchema, FormValues, RowValues, ScalarField } from '../../core';

/**
 * Default values for one list row, from its scalar sub-fields. Secrets are never
 * seeded (§5); booleans resolve to a concrete `false` so the checkbox stays
 * controlled from first render.
 */
export function rowDefaults(fields: ScalarField[]): RowValues {
  const row: RowValues = {};
  for (const field of fields) {
    if (field.type === 'boolean') row[field.name] = field.default ?? false;
    else if (field.type !== 'secret' && field.default !== undefined) {
      row[field.name] = field.default;
    }
  }
  return row;
}

export function initialValues(schema: FormSchema): FormValues {
  const values: FormValues = {};
  for (const group of schema.groups) {
    for (const field of group.fields) {
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
          // Seed the minimum number of rows (default none) with row defaults.
          values[field.name] = Array.from({ length: field.minRows ?? 0 }, () =>
            rowDefaults(field.fields),
          );
          break;
      }
    }
  }
  return values;
}
