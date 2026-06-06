/**
 * Core form-schema and value contracts.
 *
 * These types are the frozen boundary every engine module builds against
 * (issues #2 output, #4 form renderer, #5 preview). Keep them additive — adding
 * a field type or optional property is fine; changing existing shapes mid-build
 * breaks parallel work.
 *
 * Council refs: §2/§3 (field model, secret as a first-class primitive).
 */

/**
 * Supported form field kinds. `secret` is a first-class primitive (§5); `list`
 * is a repeating group of sub-fields (one record per entry), the model behind
 * tasks like ACL entries or NTP/TACACS server lists.
 */
export type FieldType = 'text' | 'number' | 'boolean' | 'select' | 'secret' | 'list';

/** Properties shared by every field. */
export interface BaseField {
  /** Key emitted into the output vars (e.g. the `group_vars` key). */
  name: string;
  /**
   * Human-readable label. Task definitions typically pass an i18n key here,
   * resolved with `t()` at render time so copy stays externalized (§6).
   */
  label: string;
  /** Optional help text, surfaced to AT via `aria-describedby` (§6). */
  help?: string;
  /** Whether the user must provide a value. */
  required?: boolean;
  /**
   * When true and the field is left blank, the key is omitted entirely from
   * output — Ansible `default(omit)` semantics — rather than emitted as an
   * empty/null value. The always-correct YAML path (#2) enforces this.
   */
  omitWhenBlank?: boolean;
}

export interface TextField extends BaseField {
  type: 'text';
  default?: string;
  placeholder?: string;
  /** Optional validation regex (source form, no delimiters). */
  pattern?: string;
}

export interface NumberField extends BaseField {
  type: 'number';
  default?: number;
  min?: number;
  max?: number;
}

export interface BooleanField extends BaseField {
  type: 'boolean';
  default?: boolean;
}

export interface SelectOption {
  value: string;
  /** Display label (or i18n key). */
  label: string;
}

export interface SelectField extends BaseField {
  type: 'select';
  options: SelectOption[];
  default?: string;
}

/**
 * Secret field — first-class (§5). Rendered as a password input with
 * `autocomplete="new-password"`. Its value is NEVER stored, logged, encoded, or
 * persisted, and it carries no `default` (we never seed a secret).
 */
export interface SecretField extends BaseField {
  type: 'secret';
}

/**
 * List field — a repeating group (§3). Each entry is a sub-record built from
 * `item`'s scalar sub-fields, so the value is `FormValues[]`. Used for tasks
 * with a variable number of entries (ACL rules, NTP/TACACS servers). Nested
 * lists are not a v1 concern; `item` is expected to be scalar fields.
 */
export interface ListField extends BaseField {
  type: 'list';
  /** Sub-fields composing one entry (scalars: text/number/boolean/select/secret). */
  item: Field[];
  /** Optional seed entries; each is a sub-record keyed by item field name. */
  default?: FormValues[];
  /** Label (or i18n key) for the "add entry" control; falls back to chrome copy. */
  addLabel?: string;
}

/** Discriminated union of all field kinds (discriminant: `type`). */
export type Field =
  | TextField
  | NumberField
  | BooleanField
  | SelectField
  | SecretField
  | ListField;

/** A named group of fields, rendered as a `<fieldset>` section. */
export interface FieldGroup {
  /** Optional section heading (or i18n key), rendered as the `<legend>`. */
  legend?: string;
  fields: Field[];
}

/** The schema that drives a task's form. */
export interface FormSchema {
  groups: FieldGroup[];
}

/** Scalar runtime value. Secrets are strings held only in memory. */
export type ScalarValue = string | number | boolean | undefined;

/**
 * Runtime value of a single field: a scalar, or — for a `list` field — an array
 * of sub-records (one per entry).
 */
export type FieldValue = ScalarValue | FormValues[];

/** A filled form: field `name` → value. */
export type FormValues = Record<string, FieldValue>;
