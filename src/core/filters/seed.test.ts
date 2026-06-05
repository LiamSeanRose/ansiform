import { describe, expect, it } from 'vitest';
import { createSeedRegistry, registerSeedFilters, SEED_FILTERS } from './seed';
import { createFilterRegistry } from './registry';

describe('seed filters', () => {
  it('registers every seed filter', () => {
    const registry = createSeedRegistry();
    for (const filter of SEED_FILTERS) {
      expect(registry.get(filter.name)).toBe(filter);
    }
  });

  it('covers the council-mandated seed set', () => {
    const names = SEED_FILTERS.map((f) => f.name).sort();
    expect(names).toEqual(
      ['combine', 'default', 'ipaddr', 'regex_replace', 'to_json', 'to_nice_yaml'].sort(),
    );
  });

  it('registerSeedFilters populates an existing registry', () => {
    const registry = createFilterRegistry();
    registerSeedFilters(registry);
    expect(registry.has('ipaddr')).toBe(true);
  });

  it('resolves a template using only known filters to its worst tier', () => {
    const registry = createSeedRegistry();
    // ipaddr (exact) + default (exact) → exact.
    expect(registry.resolveFidelity(['ipaddr', 'default'])).toBe('exact');
    // any approximate filter drags the preview to approximate.
    expect(registry.resolveFidelity(['ipaddr', 'to_json'])).toBe('approximate');
  });

  it('drives visible degradation: an unknown filter resolves to unsupported', () => {
    const registry = createSeedRegistry();
    expect(registry.has('mystery')).toBe(false);
    expect(registry.resolveFidelity(['ipaddr', 'mystery'])).toBe('unsupported');
  });
});
