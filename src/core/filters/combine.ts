/**
 * `combine` filter — dict merge (issue #3, council §3).
 *
 * `dict1 | combine(dict2, dict3, ...)` merges dictionaries left-to-right, later
 * keys winning. Shallow by default; pass a trailing options object
 * `{ recursive: true }` for a deep merge of nested dicts (mirroring Ansible's
 * `recursive=True` kwarg). `list_merge` modes are deferred.
 *
 * Fidelity is `exact`: for plain JSON-shaped data the result is identical to
 * Ansible's. Non-dict arguments are ignored, matching Ansible raising only on
 * truly invalid input — here we simply skip them so the preview stays robust.
 */
import type { FilterDefinition } from './registry';

interface CombineOptions {
  recursive?: boolean;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** True for the trailing `{ recursive: ... }` options bag, not a dict to merge. */
function isOptions(value: unknown): value is CombineOptions {
  return isPlainObject(value) && 'recursive' in value && Object.keys(value).length === 1;
}

function mergeInto(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
  recursive: boolean,
): Record<string, unknown> {
  for (const key of Object.keys(source)) {
    const next = source[key];
    const prev = target[key];
    if (recursive && isPlainObject(prev) && isPlainObject(next)) {
      target[key] = mergeInto({ ...prev }, next, true);
    } else {
      target[key] = next;
    }
  }
  return target;
}

/** `value | combine(...dicts, [options])`. */
export function combine(value: unknown, ...rest: unknown[]): Record<string, unknown> {
  let recursive = false;
  const sources = [value, ...rest];

  const last = sources[sources.length - 1];
  if (sources.length > 1 && isOptions(last)) {
    recursive = last.recursive === true;
    sources.pop();
  }

  let result: Record<string, unknown> = {};
  for (const source of sources) {
    if (isPlainObject(source)) {
      result = mergeInto(result, source, recursive);
    }
  }
  return result;
}

export const combineFilter: FilterDefinition = {
  name: 'combine',
  fidelity: 'exact',
  apply: combine,
};
