/**
 * Synthesize an all-text `FormSchema` from a reader extraction (issue #31).
 *
 * The edit mode answers the operator's second job — *make* the change in-tool,
 * not in a raw editor — without re-entering the "confidently-wrong inferred
 * form" trap (#30's deal-breaker). So this builder is deliberately dumb:
 *
 *  - Every extracted variable becomes a plain **`text`** field. No type, format,
 *    requiredness, default, or validation is ever inferred from how the variable
 *    is used in the template (e.g. a `| int` filter does NOT make it a number).
 *  - Each field is tagged `dataSource: 'extracted'`, surfaced to the DOM as
 *    `data-source="extracted"`, and rendered through the SAME `Form` curated
 *    tasks use — one form model, never a fork.
 *  - `omitWhenBlank` keeps the exported vars honest: only variables the operator
 *    actually fills appear in the YAML, never `key: null` scaffolding.
 *
 * Secret-safety (§5): credential-named variables become `secret` fields, so the
 * value is password-masked on screen and (like every secret) never seeded. This
 * is the one name-based decision we make, and it is a safety measure, not a
 * correctness inference — §5 (secrets first-class) outranks the all-text default.
 * No literal value is ever carried from the template into the form, so there is
 * nothing to strip: the extractor reads variable *names* only, never values, so
 * Vault blocks and inline secrets can't reach a field in the first place.
 */
import type { FormSchema, ScalarField } from '../../core';
import { looksLikeSecretName } from './segment';

/**
 * Build the edit-mode schema for `variables` (the reader's first-seen var order).
 * `legend` is a resolved string (the reader passes already-translated copy).
 */
export function buildExtractedSchema(variables: string[], legend: string): FormSchema {
  const fields: ScalarField[] = variables.map((name) => {
    const base = {
      name,
      // The variable name IS the label — the reader hands the Form a translator
      // that passes unknown keys through verbatim, so the raw name is shown.
      label: name,
      dataSource: 'extracted' as const,
      omitWhenBlank: true,
    };
    return looksLikeSecretName(name)
      ? { ...base, type: 'secret' }
      : { ...base, type: 'text' };
  });
  return { groups: [{ legend, fields }] };
}
