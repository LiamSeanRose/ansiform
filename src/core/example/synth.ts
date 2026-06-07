/**
 * Deterministic worked-example values for a task schema (#87).
 *
 * A static "here are sample inputs → the exact YAML → the device CLI" block on
 * each task page is both the trust signal and the SEO body copy the prerender
 * (#87) ships to crawlers. To get one for every task without hand-authoring ~50,
 * we synthesize a conservative sample from the schema itself.
 *
 * Conservative on purpose: we use a field's declared `default`, a select's first
 * option, a sample boolean, or a text field's `placeholder` — and otherwise omit
 * the field rather than fabricate a misleading value. The YAML/CLI then render
 * from whatever the schema actually implies.
 *
 * Spine (§5): a `secret` field is NEVER given a sample value — we never seed a
 * secret, not even an example one. Pure: no DOM, no network.
 */
import type {
  FormSchema,
  FormValues,
  RowValues,
  ScalarField,
  ScalarValue,
} from '../types';

/** A sample value for one scalar field, or `undefined` to omit it. */
function sampleScalar(field: ScalarField): ScalarValue {
  switch (field.type) {
    case 'secret':
      return undefined; // never seed a secret, example or otherwise
    case 'boolean':
      return field.default ?? true;
    case 'select':
      return field.default ?? field.options[0]?.value;
    case 'number':
      return field.default ?? field.min;
    case 'text':
      return field.default ?? field.placeholder;
  }
}

/** Build a sample row for a list field; omit sub-fields that have no sample. */
function sampleRow(fields: readonly ScalarField[]): RowValues {
  const row: RowValues = {};
  for (const field of fields) {
    const value = sampleScalar(field);
    if (value !== undefined) row[field.name] = value;
  }
  return row;
}

/**
 * Synthesize example form values for a schema. Only fields with a sensible sample
 * are populated; everything else is omitted so the example never invents data.
 * A `list` field gets a single sample row when its sub-fields yield anything.
 */
export function synthesizeExample(schema: FormSchema): FormValues {
  const values: FormValues = {};
  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (field.type === 'list') {
        const row = sampleRow(field.fields);
        if (Object.keys(row).length > 0) values[field.name] = [row];
      } else {
        const value = sampleScalar(field);
        if (value !== undefined) values[field.name] = value;
      }
    }
  }
  return values;
}
