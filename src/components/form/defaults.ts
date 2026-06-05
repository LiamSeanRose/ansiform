/**
 * Initial value model derived from a schema's declared defaults.
 *
 * Pure and DOM-free so it is trivially testable and reusable by the integration
 * layer (#6). Secrets are never seeded (§5): a `secret` field carries no
 * `default` and starts `undefined`. Booleans resolve to a concrete `false` when
 * undeclared so the checkbox control stays controlled from first render.
 */
import type { FormSchema, FormValues } from '../../core';

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
      }
    }
  }
  return values;
}
