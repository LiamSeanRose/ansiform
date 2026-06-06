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
 * Supported form field kinds. `secret` is a first-class primitive (§5); `list` is
 * a repeating group of scalar sub-fields (added in v2 for multi-entry tasks).
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
  /**
   * Provenance marker, surfaced to the DOM as `data-source` (#31). Curated task
   * fields leave this unset; the template reader's edit mode tags every field it
   * synthesizes from a pasted template as `'extracted'` — an honesty signal that
   * the field's type was NOT inferred and carries no validation.
   */
  dataSource?: 'extracted';
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

/** The scalar (single-value) field kinds — what a list row may contain. */
export type ScalarField = TextField | NumberField | BooleanField | SelectField | SecretField;

/**
 * List field — a repeating group of scalar sub-fields (v2). Its value is an array
 * of rows; each row is a `RowValues` map over `fields`. Nesting is intentionally
 * flat: a list's sub-fields are scalar only (no list-in-list).
 *
 * The always-correct YAML path emits a list field as a YAML sequence of mappings,
 * applying per-row `default(omit)`; the preview iterates it with `{% for %}`.
 */
export interface ListField extends BaseField {
  type: 'list';
  /** The scalar sub-fields repeated per row. */
  fields: ScalarField[];
  /** Rows present initially (and the minimum required). Default 0. */
  minRows?: number;
  /** Optional cap on the number of rows. */
  maxRows?: number;
  /** Label (or i18n key) for the "add row" button. */
  addLabel?: string;
  /** Label (or i18n key) for the per-row "remove" button; may use `{index}`. */
  removeLabel?: string;
  /** Singular noun (or i18n key) for one row, e.g. "entry"; may use `{index}`. */
  itemLabel?: string;
}

/** Discriminated union of all field kinds (discriminant: `type`). */
export type Field = ScalarField | ListField;

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

/** Runtime value of a scalar field. Secrets are strings held only in memory. */
export type ScalarValue = string | number | boolean | undefined;

/** One row of a list field: sub-field `name` → scalar value. */
export type RowValues = Record<string, ScalarValue>;

/**
 * Runtime value of a single field: a scalar, or — for a `list` field — an array
 * of rows. (`FieldValue` keeps its original scalar meaning; the `RowValues[]`
 * arm is the additive v2 extension.)
 */
export type FieldValue = ScalarValue | RowValues[];

/** A filled form: field `name` → value. */
export type FormValues = Record<string, FieldValue>;
