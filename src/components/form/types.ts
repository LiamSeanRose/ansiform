/**
 * Form-renderer-local contracts (issue #4).
 *
 * The field/value shapes themselves live in `../../core` (frozen by #1). This
 * module only adds the renderer's own surface: validation error descriptors and
 * the externalized chrome copy the form needs. Per council §6 the component
 * holds NO literal user-facing text — labels/help come from the schema as i18n
 * keys (resolved with `t()`), and form chrome arrives via `FormMessages`.
 */
import type { FieldValue } from '../../core';
import type { NetworkWarningCode } from '../../core/validation/network';

/** Why a field failed validation. The component maps this to copy + focus.
 *  `incomplete` = a list field whose rows need attention (v2). */
export type ErrorCode = 'required' | 'pattern' | 'min' | 'max' | 'notANumber' | 'incomplete';

/**
 * Advisory network-validation copy (#86). Optional and separate from the blocking
 * `errors` map on purpose: a `format` mismatch is a *warning* — it is shown but
 * never blocks submit/export, and carries a per-field "treat as text" dismissal.
 * Passed to the form only by the curated-task surfaces (where `format` is set);
 * when absent, no warnings render (graceful for the reader's all-text fields).
 */
export interface NetworkWarningMessages {
  /** Advisory copy keyed by warning code. */
  warnings: Record<NetworkWarningCode, string>;
  /** Label for the per-field "treat as text" (dismiss) button. */
  treatAsTextLabel: string;
}

/** A single validation failure. `params` feed `{placeholder}` interpolation. */
export interface FieldError {
  code: ErrorCode;
  params?: Record<string, string | number>;
}

/** field `name` → its first (most relevant) error. Empty object = valid. */
export type FieldErrors = Record<string, FieldError>;

/**
 * Externalized form chrome. The integration layer (#6) builds this from the
 * i18n catalogue and passes it down; validation strings may use `{label}` plus
 * the per-code params (`{min}`, `{max}`) which the form interpolates.
 */
export interface FormMessages {
  /** Marker appended to required field labels, e.g. "(required)". */
  requiredLabel: string;
  /** Heading for the error-summary region shown on a failed submit. */
  errorSummaryHeading: string;
  /** Submit button label. */
  submitLabel: string;
  /** Validation copy keyed by `ErrorCode`. */
  errors: Record<ErrorCode, string>;
}

/** Callback signature for value changes. Always emits the full value model. */
export type ValuesChange = (values: Record<string, FieldValue>) => void;
