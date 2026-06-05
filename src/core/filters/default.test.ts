import { describe, expect, it } from 'vitest';
import { defaultFilter, defaultFilterDef, isOmit, OMIT } from './default';

describe('default', () => {
  it('substitutes only for undefined by default', () => {
    expect(defaultFilter(undefined, 'fallback')).toBe('fallback');
    expect(defaultFilter('value', 'fallback')).toBe('value');
    expect(defaultFilter('', 'fallback')).toBe('');
    expect(defaultFilter(0, 'fallback')).toBe(0);
    expect(defaultFilter(null, 'fallback')).toBe(null);
    expect(defaultFilter(false, 'fallback')).toBe(false);
  });

  it('with boolean=true, substitutes for any falsy value', () => {
    expect(defaultFilter('', 'fallback', true)).toBe('fallback');
    expect(defaultFilter(0, 'fallback', true)).toBe('fallback');
    expect(defaultFilter(null, 'fallback', true)).toBe('fallback');
    expect(defaultFilter(false, 'fallback', true)).toBe('fallback');
    expect(defaultFilter('value', 'fallback', true)).toBe('value');
  });

  it('default(omit) yields the OMIT sentinel for the YAML path to drop', () => {
    const result = defaultFilter(undefined, OMIT);
    expect(result).toBe(OMIT);
    expect(isOmit(result)).toBe(true);
    expect(isOmit('omit')).toBe(false);
  });

  it('is registered as exact', () => {
    expect(defaultFilterDef.name).toBe('default');
    expect(defaultFilterDef.fidelity).toBe('exact');
  });
});
