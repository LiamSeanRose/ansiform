import { describe, expect, it } from 'vitest';
import { createFilterRegistry, type FilterDefinition } from './registry';

const passthrough = (input: unknown) => input;

const def = (
  name: string,
  fidelity: FilterDefinition['fidelity'],
): FilterDefinition => ({ name, fidelity, apply: passthrough });

describe('createFilterRegistry', () => {
  it('registers and looks up filters', () => {
    const registry = createFilterRegistry();
    registry.register(def('ipaddr', 'exact'));

    expect(registry.get('ipaddr')?.fidelity).toBe('exact');
    expect(registry.get('missing')).toBeUndefined();
  });

  it('has() is false for unknown and for unsupported filters', () => {
    const registry = createFilterRegistry();
    registry.register(def('ipaddr', 'exact'));
    registry.register(def('vault', 'unsupported'));

    expect(registry.has('ipaddr')).toBe(true);
    expect(registry.has('vault')).toBe(false);
    expect(registry.has('missing')).toBe(false);
  });

  it('resolveFidelity returns the worst-case tier', () => {
    const registry = createFilterRegistry();
    registry.register(def('ipaddr', 'exact'));
    registry.register(def('to_json', 'approximate'));

    // No filters used → exact.
    expect(registry.resolveFidelity([])).toBe('exact');
    expect(registry.resolveFidelity(['ipaddr'])).toBe('exact');
    // exact + approximate → approximate.
    expect(registry.resolveFidelity(['ipaddr', 'to_json'])).toBe('approximate');
    // An unknown filter drags the whole preview to unsupported (§11).
    expect(registry.resolveFidelity(['ipaddr', 'mystery'])).toBe('unsupported');
  });
});
