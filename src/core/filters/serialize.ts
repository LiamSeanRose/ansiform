/**
 * Serialization filters: `to_json` and `to_nice_yaml` (issue #3, council §3).
 *
 * Both are `approximate`. Ansible serializes with Python libraries whose output
 * differs from anything we can produce in the browser without shipping a YAML
 * engine, and the differences are cosmetic but real:
 *
 *   - `to_json` → Python `json.dumps`, which uses `", "` / `": "` separators and
 *     `ensure_ascii=True` (non-ASCII escaped). `JSON.stringify` uses tight
 *     separators and emits raw UTF-8. Same data, different bytes.
 *   - `to_nice_yaml` → PyYAML block style. Our emitter covers the common scalar
 *     / map / list shapes a preview needs; quoting and edge cases (anchors,
 *     folded scalars, key ordering) can diverge.
 *
 * Marking them `approximate` makes the preview advertise "may differ — output
 * is still valid" (§11) rather than implying byte-equality we can't guarantee.
 */
import type { FilterDefinition } from './registry';

/** `value | to_json` — best-effort JSON, structurally correct. */
export function toJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}

const PLAIN_SCALAR = /^[^\s:#&*!|>'"%@`,[\]{}-][^\n:#]*$/;
const YAML_RESERVED = new Set([
  'true', 'false', 'null', 'yes', 'no', 'on', 'off', '~', '',
]);

/** Render one scalar value as a YAML node. */
function scalar(value: unknown): string {
  if (value === null || value === undefined) return 'null';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '.nan';

  const str = String(value);
  // Quote anything that could be misread as another YAML type or that contains
  // structural characters; JSON.stringify gives us correct double-quote escaping.
  if (
    !PLAIN_SCALAR.test(str) ||
    YAML_RESERVED.has(str.toLowerCase()) ||
    /^[+-]?(\d|\.\d)/.test(str)
  ) {
    return JSON.stringify(str);
  }
  return str;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function emit(value: unknown, indent: number): string {
  const pad = ' '.repeat(indent);

  if (Array.isArray(value)) {
    if (value.length === 0) return `${pad}[]`;
    return value
      .map((item) => {
        if (isPlainObject(item) || Array.isArray(item)) {
          const nested = emit(item, indent + 2).slice(indent + 2);
          return `${pad}- ${nested}`;
        }
        return `${pad}- ${scalar(item)}`;
      })
      .join('\n');
  }

  if (isPlainObject(value)) {
    const keys = Object.keys(value);
    if (keys.length === 0) return `${pad}{}`;
    return keys
      .map((key) => {
        const child = value[key];
        if (isPlainObject(child) || Array.isArray(child)) {
          const empty =
            (Array.isArray(child) && child.length === 0) ||
            (isPlainObject(child) && Object.keys(child).length === 0);
          if (empty) return `${pad}${key}: ${emit(child, 0)}`;
          return `${pad}${key}:\n${emit(child, indent + 2)}`;
        }
        return `${pad}${key}: ${scalar(child)}`;
      })
      .join('\n');
  }

  return `${pad}${scalar(value)}`;
}

/** `value | to_nice_yaml` — block-style YAML, trailing newline like PyYAML. */
export function toNiceYaml(value: unknown): string {
  return `${emit(value, 0)}\n`;
}

export const toJsonFilter: FilterDefinition = {
  name: 'to_json',
  fidelity: 'approximate',
  apply: toJson,
};

export const toNiceYamlFilter: FilterDefinition = {
  name: 'to_nice_yaml',
  fidelity: 'approximate',
  apply: toNiceYaml,
};
