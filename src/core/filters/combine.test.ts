import { describe, expect, it } from 'vitest';
import { combine, combineFilter } from './combine';

describe('combine', () => {
  it('shallow-merges left-to-right, later keys winning', () => {
    expect(combine({ a: 1, b: 2 }, { b: 3, c: 4 })).toEqual({ a: 1, b: 3, c: 4 });
  });

  it('merges several dicts', () => {
    expect(combine({ a: 1 }, { b: 2 }, { c: 3 })).toEqual({ a: 1, b: 2, c: 3 });
  });

  it('is shallow by default — nested dicts are replaced, not merged', () => {
    expect(combine({ a: { x: 1 } }, { a: { y: 2 } })).toEqual({ a: { y: 2 } });
  });

  it('deep-merges with the { recursive: true } option', () => {
    expect(combine({ a: { x: 1 } }, { a: { y: 2 } }, { recursive: true })).toEqual({
      a: { x: 1, y: 2 },
    });
  });

  it('does not mutate its inputs', () => {
    const base = { a: { x: 1 } };
    combine(base, { a: { y: 2 } }, { recursive: true });
    expect(base).toEqual({ a: { x: 1 } });
  });

  it('ignores non-dict arguments', () => {
    expect(combine({ a: 1 }, null, 'nope', { b: 2 })).toEqual({ a: 1, b: 2 });
  });

  it('is registered as exact', () => {
    expect(combineFilter.name).toBe('combine');
    expect(combineFilter.fidelity).toBe('exact');
  });
});
