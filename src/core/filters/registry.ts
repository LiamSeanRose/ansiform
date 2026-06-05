/**
 * Jinja2-compatible filter registry contract + a minimal container (council §3).
 *
 * Filters are registered with a **fidelity tier**. The preview renderer (#5)
 * consults the registry; if any filter used by a template is unknown or
 * `unsupported`, the preview must degrade *visibly* — a silently-wrong preview
 * is the unanimous deal-breaker (§11). The actual filter implementations
 * (ipaddr, to_nice_yaml, combine, default(omit), regex_replace, …) are #3 and
 * register themselves into a registry created here.
 */

/** How faithfully a filter matches Ansible's real runtime output (§3). */
export type FidelityTier = 'exact' | 'approximate' | 'unsupported';

/** A single Jinja2-compatible filter. */
export interface FilterDefinition {
  /** Filter name as used in templates, e.g. `ipaddr`. */
  readonly name: string;
  /** Fidelity of this implementation vs. real Ansible. */
  readonly fidelity: FidelityTier;
  /** Apply the filter. `args` are positional filter arguments. */
  apply(input: unknown, ...args: unknown[]): unknown;
}

/** Registry of available filters, consulted by the preview renderer (#5). */
export interface FilterRegistry {
  /** Register (or replace) a filter. */
  register(filter: FilterDefinition): void;
  /** Look up a filter by name, or `undefined` if not registered. */
  get(name: string): FilterDefinition | undefined;
  /** True if the filter is registered and not `unsupported`. */
  has(name: string): boolean;
  /**
   * The worst-case fidelity across the given filter names — the tier the
   * preview should advertise. Unknown names count as `unsupported`. An empty
   * list (template uses no filters) is `exact`.
   */
  resolveFidelity(names: readonly string[]): FidelityTier;
}

/** Severity ordering for worst-case resolution (lower = worse). */
const TIER_RANK: Record<FidelityTier, number> = {
  unsupported: 0,
  approximate: 1,
  exact: 2,
};

/**
 * Create an empty filter registry.
 *
 * Intentionally container-only: it stores and resolves filters but ships with
 * none. The seed filters and their real `apply` logic are issue #3.
 */
export function createFilterRegistry(): FilterRegistry {
  const filters = new Map<string, FilterDefinition>();

  return {
    register(filter) {
      filters.set(filter.name, filter);
    },
    get(name) {
      return filters.get(name);
    },
    has(name) {
      const filter = filters.get(name);
      return filter !== undefined && filter.fidelity !== 'unsupported';
    },
    resolveFidelity(names) {
      let worst: FidelityTier = 'exact';
      for (const name of names) {
        const filter = filters.get(name);
        const tier: FidelityTier = filter ? filter.fidelity : 'unsupported';
        if (TIER_RANK[tier] < TIER_RANK[worst]) {
          worst = tier;
        }
      }
      return worst;
    },
  };
}
