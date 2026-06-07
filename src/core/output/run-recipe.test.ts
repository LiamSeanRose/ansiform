import { describe, expect, it } from 'vitest';
import { buildRunRecipe, DEFAULT_PLAYBOOK } from './run-recipe';
import type { TaskScope } from '../tasks/types';

const group = (name: string): TaskScope => ({ kind: 'group', name });
const host = (name: string): TaskScope => ({ kind: 'host', name });

describe('buildRunRecipe (#83)', () => {
  it('returns null when there are no files to wire', () => {
    expect(buildRunRecipe({ files: [], scopes: [] })).toBeNull();
    expect(buildRunRecipe({ files: ['   '], scopes: [] })).toBeNull();
  });

  it('builds a single-file tree + command (no inventory, scope all → no --limit)', () => {
    const recipe = buildRunRecipe({ files: ['group_vars/all.yml'], scopes: [group('all')] })!;
    expect(recipe.tree).toBe(
      ['.', '├── group_vars/', '│   └── all.yml', '└── playbook.yml'].join('\n'),
    );
    expect(recipe.command).toBe('ansible-playbook -i inventory playbook.yml');
  });

  it('nests the inventory, group_vars, and host_vars under one tree (composed set)', () => {
    const recipe = buildRunRecipe({
      files: ['group_vars/all.yml', 'host_vars/r1.yml'],
      scopes: [group('all'), host('r1')],
      inventory: 'hosts.ini',
    })!;
    expect(recipe.tree).toBe(
      [
        '.',
        '├── hosts.ini',
        '├── group_vars/',
        '│   └── all.yml',
        '├── host_vars/',
        '│   └── r1.yml',
        '└── playbook.yml',
      ].join('\n'),
    );
    // Inventory present → -i uses it; host r1 limited, all omitted.
    expect(recipe.command).toBe("ansible-playbook -i hosts.ini playbook.yml --limit 'r1'");
  });

  it('joins multiple named scopes with a colon and drops the implicit all', () => {
    const recipe = buildRunRecipe({
      files: ['group_vars/core.yml', 'group_vars/edge.yml', 'group_vars/all.yml'],
      scopes: [group('core'), group('edge'), group('all')],
      inventory: 'hosts.ini',
    })!;
    expect(recipe.command).toBe("ansible-playbook -i hosts.ini playbook.yml --limit 'core:edge'");
  });

  it('de-duplicates repeated scope names in the limit', () => {
    const recipe = buildRunRecipe({
      files: ['group_vars/core.yml'],
      scopes: [group('core'), group('core')],
    })!;
    expect(recipe.command).toBe("ansible-playbook -i inventory playbook.yml --limit 'core'");
  });

  it('groups several files in the same directory under one branch', () => {
    const recipe = buildRunRecipe({
      files: ['host_vars/r1.yml', 'host_vars/r2.yml'],
      scopes: [host('r1'), host('r2')],
      inventory: 'hosts.ini',
    })!;
    expect(recipe.tree).toBe(
      [
        '.',
        '├── hosts.ini',
        '├── host_vars/',
        '│   ├── r1.yml',
        '│   └── r2.yml',
        '└── playbook.yml',
      ].join('\n'),
    );
  });

  it('references the user-supplied playbook name and never emits playbook content', () => {
    const recipe = buildRunRecipe({
      files: ['group_vars/all.yml'],
      scopes: [group('all')],
      playbook: 'site.yml',
    })!;
    expect(recipe.command).toBe('ansible-playbook -i inventory site.yml');
    expect(recipe.tree.endsWith('└── site.yml')).toBe(true);
    // The default is the user's own playbook.yml — guidance only, never generated.
    expect(DEFAULT_PLAYBOOK).toBe('playbook.yml');
  });
});
