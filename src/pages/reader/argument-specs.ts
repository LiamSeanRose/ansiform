/**
 * `meta/argument_specs.yml` importer (issue #32) — the one exact paste path.
 *
 * Unlike the Jinja template reader (#30) and its edit mode (#31), which can only
 * *guess* a variable's shape (and so refuse to), an Ansible role `argument_specs`
 * is a **declarative** contract: each option states its `type`, `required`,
 * `default`, and `choices`. So this importer is correct-by-construction — it maps
 * declarations straight onto the matching `FormSchema` field type, inferring
 * nothing. It is a bonus, never the headline: real-world `argument_specs`
 * adoption is low, so most operators will still use the template reader.
 *
 * Honesty: the few `argument_specs` shapes our field model can't represent
 * exactly (a list of scalars, a bare dict, an opaque `raw`/`jsonarg`) are
 * surfaced as plain text and reported by name in `approximated` — never silently
 * mistyped. No `default`/`choice` is invented; the form claims nothing beyond
 * what the spec declared.
 *
 * Security (council §5): the pasted spec is ephemeral — parsed in memory, never
 * stored/encoded/sent. `load` is js-yaml's safe loader (no code execution). A
 * 64 KB ceiling and an anchor-count guard bound the cost of hostile input
 * (a YAML alias bomb) before it can be expanded.
 */
import { load } from 'js-yaml';
import type {
  BooleanField,
  Field,
  FormSchema,
  NumberField,
  ScalarField,
  SecretField,
  SelectField,
  SelectOption,
  TextField,
} from '../../core';
import { looksLikeSecretName } from './segment';

/** Largest spec the importer will parse — a hard ceiling against hostile input. */
export const MAX_ARGSPEC_LENGTH = 64 * 1024;

/** Why a parse produced no form (each maps to a visible, distinct message). */
export type ArgSpecError = 'empty' | 'tooLarge' | 'parse' | 'shape';

export interface ArgSpecResult {
  ok: boolean;
  /** Set when `!ok` — drives a visible, specific error message. */
  error?: ArgSpecError;
  /** The entry point whose options were imported (e.g. `main`). */
  entrypoint?: string;
  /** The exact synthesized schema (set when `ok`). */
  schema?: FormSchema;
  /**
   * Option names that could not be represented exactly and were degraded to a
   * plain text field — surfaced to the user, never silently mistyped.
   */
  approximated: string[];
}

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

/** Ansible joins a list `description` with spaces when shown; mirror that. */
function asHelp(description: unknown): string | undefined {
  if (typeof description === 'string') return description;
  if (Array.isArray(description)) return description.filter((d) => typeof d === 'string').join(' ');
  return undefined;
}

/** Lower-cased declared type; missing type is `str` in Ansible. */
function declaredType(spec: Record<string, unknown>): string {
  const t = spec.type;
  return typeof t === 'string' ? t.toLowerCase() : 'str';
}

/**
 * Map one option spec to a scalar field, or `null` when its declared structure
 * (list/dict) is not a scalar — the caller handles those shapes separately.
 * `forceText` represents an exactly-unrepresentable type as plain text.
 */
function scalarField(
  name: string,
  spec: Record<string, unknown>,
  forceText: boolean,
): ScalarField | null {
  const base = {
    name,
    label: name,
    dataSource: 'extracted' as const,
    required: spec.required === true,
    help: asHelp(spec.description),
    omitWhenBlank: spec.required !== true,
  };

  // Secret-safety (§5): `no_log` options, or credential-named ones, are masked
  // and never carry a default — this outranks the declared scalar type.
  if (spec.no_log === true || looksLikeSecretName(name)) {
    const field: SecretField = { ...base, type: 'secret' };
    return field;
  }

  if (Array.isArray(spec.choices) && spec.choices.length > 0) {
    const options: SelectOption[] = spec.choices.map((c) => ({
      value: String(c),
      label: String(c),
    }));
    const field: SelectField = {
      ...base,
      type: 'select',
      options,
      default: spec.default !== undefined ? String(spec.default) : undefined,
    };
    return field;
  }

  const type = forceText ? 'str' : declaredType(spec);
  switch (type) {
    case 'int':
    case 'float': {
      const def = spec.default;
      const field: NumberField = {
        ...base,
        type: 'number',
        default: typeof def === 'number' && !Number.isNaN(def) ? def : undefined,
      };
      return field;
    }
    case 'bool': {
      const field: BooleanField = {
        ...base,
        type: 'boolean',
        default: spec.default === undefined ? undefined : spec.default === true,
      };
      return field;
    }
    case 'str':
    case 'path':
    case 'raw': {
      const field: TextField = {
        ...base,
        type: 'text',
        default: spec.default !== undefined ? String(spec.default) : undefined,
      };
      return field;
    }
    default:
      // dict / list / jsonarg / bytes / … — not a scalar we can place exactly.
      return null;
  }
}

/**
 * Map one entry-point option to a field, recording whether we had to approximate
 * its declared structure as plain text.
 */
function optionToField(
  name: string,
  rawSpec: unknown,
): { field: Field; approximated: boolean } {
  if (!isRecord(rawSpec)) {
    // A bare `name:` with no spec body — treat as an unconstrained text option.
    const field: TextField = { name, label: name, type: 'text', dataSource: 'extracted', omitWhenBlank: true };
    return { field, approximated: false };
  }

  const type = declaredType(rawSpec);

  // A list of dicts maps exactly onto our repeating-group `list` field; its
  // sub-options become scalar rows. Nested lists/dicts inside a row are the one
  // thing we can't place, so those sub-fields degrade to text (still usable).
  if (type === 'list' && rawSpec.elements === 'dict' && isRecord(rawSpec.options)) {
    let approximated = false;
    const fields: ScalarField[] = [];
    for (const [subName, subSpec] of Object.entries(rawSpec.options)) {
      const sub = isRecord(subSpec) ? scalarField(subName, subSpec, false) : null;
      if (sub) fields.push(sub);
      else {
        // Force the un-placeable sub-option to text so the row stays editable.
        const forced = scalarField(subName, isRecord(subSpec) ? subSpec : {}, true);
        if (forced) fields.push(forced);
        approximated = true;
      }
    }
    const field: Field = {
      name,
      label: name,
      type: 'list',
      dataSource: 'extracted',
      required: rawSpec.required === true,
      help: asHelp(rawSpec.description),
      omitWhenBlank: rawSpec.required !== true,
      fields,
    };
    return { field, approximated };
  }

  const scalar = scalarField(name, rawSpec, false);
  if (scalar) return { field: scalar, approximated: false };

  // Un-representable declared type (list-of-scalars, dict, jsonarg…) → plain text.
  const forced = scalarField(name, rawSpec, true)!;
  return { field: forced, approximated: true };
}

/** Cheap pre-load guard: a YAML alias bomb needs many anchors. Reject early. */
function hasTooManyAnchors(src: string): boolean {
  const anchors = src.match(/(?:^|[\s,[{])&[A-Za-z0-9_]/g);
  return !!anchors && anchors.length > 64;
}

/**
 * Pick the entry point whose options we import: prefer `main` (the convention),
 * else the first entry point that declares `options`.
 */
function chooseEntrypoint(
  entrypoints: Record<string, unknown>,
): { name: string; options: Record<string, unknown> } | null {
  const names = Object.keys(entrypoints);
  const ordered = names.includes('main') ? ['main', ...names.filter((n) => n !== 'main')] : names;
  for (const name of ordered) {
    const ep = entrypoints[name];
    if (isRecord(ep) && isRecord(ep.options)) return { name, options: ep.options };
  }
  return null;
}

/**
 * Parse pasted `argument_specs` YAML into an exact `FormSchema`. Pure, never
 * throws: every failure is reported through `error`, never as an exception.
 *
 * Accepts the conventional `argument_specs:` wrapper, a single entry point
 * pasted bare (a top-level `options:`), or a map of entry points — picking
 * `main` when present.
 */
export function parseArgumentSpecs(src: string): ArgSpecResult {
  if (src.trim().length === 0) return { ok: false, error: 'empty', approximated: [] };
  if (src.length > MAX_ARGSPEC_LENGTH || hasTooManyAnchors(src)) {
    return { ok: false, error: 'tooLarge', approximated: [] };
  }

  let doc: unknown;
  try {
    doc = load(src);
  } catch {
    return { ok: false, error: 'parse', approximated: [] };
  }
  if (!isRecord(doc)) return { ok: false, error: 'shape', approximated: [] };

  // Locate the entry-point map: an explicit `argument_specs:` wrapper, a bare
  // single entry point (`options:` at the root), or a map of entry points.
  let entrypoints: Record<string, unknown>;
  if (isRecord(doc.argument_specs)) entrypoints = doc.argument_specs;
  else if (isRecord(doc.options)) entrypoints = { main: doc };
  else entrypoints = doc;

  const chosen = chooseEntrypoint(entrypoints);
  if (!chosen) return { ok: false, error: 'shape', approximated: [] };

  const fields: Field[] = [];
  const approximated: string[] = [];
  for (const [name, spec] of Object.entries(chosen.options)) {
    const { field, approximated: approx } = optionToField(name, spec);
    fields.push(field);
    if (approx) approximated.push(name);
  }

  if (fields.length === 0) return { ok: false, error: 'shape', approximated: [] };

  return {
    ok: true,
    entrypoint: chosen.name,
    schema: { groups: [{ fields }] },
    approximated,
  };
}
