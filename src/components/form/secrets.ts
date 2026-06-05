/**
 * Secret-safety helpers (council §5).
 *
 * Secrets are held in memory as ordinary string values while the form is open,
 * but they must NEVER be persisted, logged, or encoded. Any code path that
 * would write the value model somewhere durable (or to a console) must route it
 * through `redactSecrets` first. `redactSecrets` strips the keys entirely rather
 * than masking them, so a redacted snapshot cannot leak length or content.
 */
import type { Field, FormSchema, FormValues, SecretField } from '../../core';

export function isSecretField(field: Field): field is SecretField {
  return field.type === 'secret';
}

/** Set of field names declared as `secret` in the schema. */
export function secretFieldNames(schema: FormSchema): Set<string> {
  const names = new Set<string>();
  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (isSecretField(field)) names.add(field.name);
    }
  }
  return names;
}

/**
 * Return a copy of `values` with every secret-typed field removed. Use this for
 * anything that leaves memory: persistence, logging, telemetry, error reports.
 */
export function redactSecrets(schema: FormSchema, values: FormValues): FormValues {
  const secrets = secretFieldNames(schema);
  const safe: FormValues = {};
  for (const [name, value] of Object.entries(values)) {
    if (!secrets.has(name)) safe[name] = value;
  }
  return safe;
}
