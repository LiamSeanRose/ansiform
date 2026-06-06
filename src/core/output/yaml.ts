/**
 * group_vars / host_vars YAML output sink (issue #2).
 *
 * This is the "always-correct" half of the product (council §4): the YAML vars
 * file is derived directly from the field values and is byte-correct, no matter
 * how approximate the device-CLI preview (#5) may be. Jinja2 filters run at
 * playbook runtime, never here — we only serialize raw values with the right
 * YAML types.
 *
 * Two behaviours are load-bearing:
 *  - **Types are preserved.** Booleans emit unquoted `true`/`false`, numbers as
 *    bare numbers, and strings are quoted only when js-yaml must quote them to
 *    round-trip (e.g. the string `"true"` or `"123"`). This is what makes the
 *    output trustworthy as Ansible vars.
 *  - **`default(omit)` semantics.** A field flagged `omitWhenBlank` whose value
 *    is blank is dropped from the output entirely — never emitted as `key: ""`
 *    or `key: null` — so the role's own default applies at runtime.
 *
 * Pure function in, string out: no persistence, logging, or network. Secret
 * values (§5) flow through as ordinary strings only when the user has typed one;
 * nothing is stored or encoded here.
 */
import { dump } from 'js-yaml';
import type { Field, FieldValue, FormSchema, FormValues, ListField } from '../types';
import type { OutputArtifact, OutputContext, OutputSink } from '../adapters';
import type { TaskScope } from '../tasks/types';

/** Stable id for this sink (referenced by the output picker in #12). */
export const GROUP_VARS_YAML_ID = 'group-vars-yaml';

/**
 * Whether a field's value counts as "blank" for `default(omit)`.
 *
 * Only `undefined` and the empty string are blank. Numeric `0` and boolean
 * `false` are real, intentional values and must never be omitted.
 */
function isBlank(field: Field, value: FieldValue): boolean {
  if (value === undefined) return true;
  if (field.type === 'boolean' || field.type === 'number') return false;
  return value === '';
}

/**
 * Build the plain key→value object that gets serialized, walking the schema in
 * declared order so the YAML key order matches the form. Only schema-declared
 * fields are emitted; stray keys in `values` are ignored (defensive against
 * leaking anything the form did not present).
 */
function buildVars(schema: FormSchema, values: FormValues): Record<string, unknown> {
  const vars: Record<string, unknown> = {};
  for (const group of schema.groups) {
    for (const field of group.fields) {
      if (field.type === 'list') {
        const entries = buildList(field, values[field.name]);
        if (field.omitWhenBlank && entries.length === 0) continue;
        vars[field.name] = entries;
        continue;
      }
      const value = values[field.name];
      if (field.omitWhenBlank && isBlank(field, value)) continue;
      // A non-omitted but undefined value becomes an explicit `null`; otherwise
      // js-yaml's `skipInvalid` would silently drop the key.
      vars[field.name] = value === undefined ? null : value;
    }
  }
  return vars;
}

/** Serialize a list field's entries, each a sub-record built from its item fields. */
function buildList(field: ListField, value: FieldValue): Record<string, unknown>[] {
  const entries = Array.isArray(value) ? value : [];
  return entries.map((entry) => buildRecord(field.item, entry));
}

/** Build one entry's object, honouring each sub-field's omit-on-blank. */
function buildRecord(fields: Field[], entry: FormValues): Record<string, unknown> {
  const record: Record<string, unknown> = {};
  for (const field of fields) {
    if (field.type === 'list') {
      record[field.name] = buildList(field, entry[field.name]);
      continue;
    }
    const value = entry[field.name];
    if (field.omitWhenBlank && isBlank(field, value)) continue;
    record[field.name] = value === undefined ? null : value;
  }
  return record;
}

/** Suggested var-file path from the scope hint (council §8; full paths in #12). */
function suggestFilename(scope?: TaskScope): string {
  if (!scope) return 'group_vars/all.yml';
  const dir = scope.kind === 'host' ? 'host_vars' : 'group_vars';
  return `${dir}/${scope.name}.yml`;
}

/**
 * Serialize an object to a YAML document with our fixed, byte-stable options.
 * Exported so callers/tests can serialize a pre-built object directly.
 *
 *  - `indent: 2` — conventional Ansible vars indentation.
 *  - `lineWidth: -1` — never fold long scalars (an IP list or URL must stay on
 *    one line to be diff- and copy-stable).
 *  - `noRefs: true` — never emit YAML anchors/aliases; vars files are plain.
 *  - `sortKeys: false` — preserve schema (form) order.
 *  - `quotingType: "'"` / `forceQuotes: false` — single-quote only when needed.
 */
export function toYaml(vars: Record<string, unknown>): string {
  return dump(vars, {
    indent: 2,
    lineWidth: -1,
    noRefs: true,
    sortKeys: false,
    quotingType: "'",
    forceQuotes: false,
  });
}

/**
 * The group_vars/host_vars YAML output sink.
 *
 * `label` is an i18n key resolved at render time (§6); it intentionally does not
 * resolve until the output picker copy lands in `locales/en.ts` (#12).
 */
export const groupVarsYamlSink: OutputSink = {
  id: GROUP_VARS_YAML_ID,
  label: 'output.groupVarsYaml.label',
  render(context: OutputContext): OutputArtifact {
    const vars = buildVars(context.schema, context.values);
    return {
      filename: suggestFilename(context.scope),
      contentType: 'text/yaml',
      content: toYaml(vars),
    };
  },
};
