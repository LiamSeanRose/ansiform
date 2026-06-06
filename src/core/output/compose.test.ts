import { describe, it, expect } from 'vitest';
import { composeTree, type CompositionInstance } from './compose';
import type { FormSchema } from '../types';

const textSchema = (name: string): FormSchema => ({
  groups: [{ fields: [{ type: 'text', name, label: name }] }],
});

const group = (name: string) => ({ kind: 'group', name }) as const;
const host = (name: string) => ({ kind: 'host', name }) as const;

describe('composeTree', () => {
  it('emits one file per instance scope', () => {
    const instances: CompositionInstance[] = [
      { schema: textSchema('hostname'), values: { hostname: 'r1' }, scope: host('r1') },
      { schema: textSchema('vlan_id'), values: { vlan_id: '10' }, scope: group('switches') },
    ];
    const tree = composeTree(instances);
    expect(tree.files.map((f) => f.path)).toEqual([
      'host_vars/r1.yml',
      'group_vars/switches.yml',
    ]);
    expect(tree.hasCollisions).toBe(false);
    expect(tree.files[0].content).toBe('hostname: r1\n');
  });

  it('merges instances that target the same file (disjoint keys, no collision)', () => {
    const instances: CompositionInstance[] = [
      { schema: textSchema('hostname'), values: { hostname: 'r1' }, scope: group('all') },
      { schema: textSchema('domain'), values: { domain: 'example.com' }, scope: group('all') },
    ];
    const tree = composeTree(instances);
    expect(tree.files).toHaveLength(1);
    expect(tree.files[0].path).toBe('group_vars/all.yml');
    expect(tree.files[0].content).toBe('hostname: r1\ndomain: example.com\n');
    expect(tree.files[0].collisions).toEqual([]);
    expect(tree.hasCollisions).toBe(false);
  });

  it('reports a key collision (by name only) when two instances define the same key', () => {
    const instances: CompositionInstance[] = [
      { schema: textSchema('hostname'), values: { hostname: 'r1' }, scope: group('all') },
      { schema: textSchema('hostname'), values: { hostname: 'r2' }, scope: group('all') },
    ];
    const tree = composeTree(instances);
    expect(tree.hasCollisions).toBe(true);
    expect(tree.files[0].collisions).toEqual(['hostname']);
    // The collision report names the key, never the conflicting values.
    expect(tree.files[0].collisions.join()).not.toContain('r1');
    expect(tree.files[0].collisions.join()).not.toContain('r2');
    // Output is never empty — a value is kept — but the UI must flag the collision.
    expect(tree.files[0].content).toContain('hostname:');
  });

  it('returns an empty tree for no instances', () => {
    expect(composeTree([])).toEqual({ files: [], hasCollisions: false });
  });
});
