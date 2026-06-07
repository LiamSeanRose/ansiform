import { describe, expect, it } from 'vitest';
import type { TaskScope } from '../tasks/types';
import { INVENTORY_FILENAME, buildInventory } from './inventory';

const group = (name: string): TaskScope => ({ kind: 'group', name });
const host = (name: string): TaskScope => ({ kind: 'host', name });

describe('buildInventory', () => {
  it('returns empty for no scopes, so the caller can hide the action', () => {
    expect(buildInventory([])).toBe('');
  });

  it('returns empty when the only group is the implicit "all" and there are no hosts', () => {
    expect(buildInventory([group('all'), group('all')])).toBe('');
  });

  it('lists host_vars hosts ungrouped', () => {
    const out = buildInventory([host('router1'), host('router2')]);
    expect(out).toContain('\nrouter1\nrouter2\n');
    expect(out).not.toContain('[');
    expect(out.endsWith('\n')).toBe(true);
  });

  it('emits a section per group with a fill-in-membership comment, excluding "all"', () => {
    const out = buildInventory([group('all'), group('core_switches'), group('edge')]);
    expect(out).toContain('[core_switches]');
    expect(out).toContain('# add the hosts that belong to this group (group_vars/core_switches.yml)');
    expect(out).toContain('[edge]');
    expect(out).not.toContain('[all]');
  });

  it('lists hosts before group sections in a mixed set', () => {
    const out = buildInventory([group('edge'), host('fw1')]);
    expect(out.indexOf('fw1')).toBeLessThan(out.indexOf('[edge]'));
  });

  it('dedupes repeated names and preserves first-seen order', () => {
    const out = buildInventory([group('edge'), group('core'), group('edge')]);
    const first = out.indexOf('[edge]');
    expect(first).toBeGreaterThan(-1);
    expect(out.indexOf('[edge]', first + 1)).toBe(-1); // only once
    expect(out.indexOf('[edge]')).toBeLessThan(out.indexOf('[core]'));
  });

  it('ignores blank / whitespace-only names', () => {
    expect(buildInventory([group('   '), host('')])).toBe('');
    const out = buildInventory([host('  r1  '), group(' g1 ')]);
    expect(out).toContain('\nr1\n');
    expect(out).toContain('[g1]');
  });

  it('ends with exactly one trailing newline', () => {
    const out = buildInventory([host('r1'), group('g1')]);
    expect(out.endsWith('\n')).toBe(true);
    expect(out.endsWith('\n\n')).toBe(false);
  });

  it('places the file adjacent to the var dirs', () => {
    expect(INVENTORY_FILENAME).toBe('hosts.ini');
  });
});
