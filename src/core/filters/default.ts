/**
 * `default` filter + the `omit` sentinel (issue #3, council §3).
 *
 * `value | default(fallback)` returns `fallback` when `value` is *undefined*
 * (Jinja's "undefined", which we model as JS `undefined`). With the second
 * argument truthy — `default(fallback, true)` — it also substitutes for any
 * false-y value (`null`, `''`, `0`, `false`), matching Jinja's `boolean=True`.
 *
 * `default(omit)` is the idiom for "leave this key out entirely". Ansible's
 * `omit` is a magic variable, not a filter, so we expose it as the `OMIT`
 * sentinel: the form engine resolves the identifier `omit` to `OMIT`, and the
 * always-correct YAML path (#2) drops any key whose value is `OMIT`. Fidelity is
 * `exact`.
 */
import type { FilterDefinition } from './registry';

/** Sentinel for Ansible's `omit`: a key carrying this value is dropped (#2). */
export const OMIT: unique symbol = Symbol('ansible.omit');

/** True if a resolved value is the `omit` sentinel. */
export function isOmit(value: unknown): boolean {
  return value === OMIT;
}

function isFalsy(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    value === 0 ||
    value === ''
  );
}

/** `value | default(fallback, boolean=false)`. */
export function defaultFilter(
  value: unknown,
  fallback: unknown,
  boolean: unknown = false,
): unknown {
  if (boolean === true) {
    return isFalsy(value) ? fallback : value;
  }
  return value === undefined ? fallback : value;
}

export const defaultFilterDef: FilterDefinition = {
  name: 'default',
  fidelity: 'exact',
  apply: defaultFilter,
};
