/**
 * Seed filter set + registry factory (issue #3, council §3).
 *
 * Bundles the v1 Jinja2-compatible filters into a ready-to-use registry. The
 * preview renderer (#5) and integration wiring (#6) build on `createSeedRegistry`
 * rather than registering filters by hand. Anything not in this set resolves to
 * `unsupported` via the registry, driving visible degradation (§11) — never a
 * silently-wrong preview.
 */
import { createFilterRegistry, type FilterDefinition, type FilterRegistry } from './registry';
import { ipaddrFilter } from './ipaddr';
import { toJsonFilter, toNiceYamlFilter } from './serialize';
import { combineFilter } from './combine';
import { defaultFilterDef } from './default';
import { regexReplaceFilter } from './regex';

/** Every filter shipped in v1, in a stable order. */
export const SEED_FILTERS: readonly FilterDefinition[] = [
  ipaddrFilter,
  toJsonFilter,
  toNiceYamlFilter,
  combineFilter,
  defaultFilterDef,
  regexReplaceFilter,
];

/** Register the seed filters into an existing registry. */
export function registerSeedFilters(registry: FilterRegistry): void {
  for (const filter of SEED_FILTERS) {
    registry.register(filter);
  }
}

/** A fresh registry pre-loaded with the seed filters. */
export function createSeedRegistry(): FilterRegistry {
  const registry = createFilterRegistry();
  registerSeedFilters(registry);
  return registry;
}
