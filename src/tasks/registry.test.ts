import { describe, expect, it } from 'vitest';
import type { Field } from '../core';
import { getTask, listTasks } from './registry';

/** Every i18n key a field (and any nested list items / select options) references. */
function fieldKeys(field: Field): string[] {
  const keys = [field.label];
  if (field.help) keys.push(field.help);
  if (field.type === 'select') keys.push(...field.options.map((option) => option.label));
  if (field.type === 'list') {
    if (field.addLabel) keys.push(field.addLabel);
    keys.push(...field.item.flatMap(fieldKeys));
  }
  return keys;
}

describe('task registry (auto-registration)', () => {
  it('discovers the interface-ip reference task via import.meta.glob', () => {
    const slugs = listTasks().map((task) => task.slug);
    expect(slugs).toContain('interface-ip');
  });

  it('getTask returns the module whose slug matches', () => {
    const mod = getTask('interface-ip');
    expect(mod).toBeDefined();
    expect(mod!.task.slug).toBe('interface-ip');
    expect(mod!.task.title).toBeTruthy();
    expect(mod!.task.description).toBeTruthy();
    expect(mod!.task.template).toContain('interface');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getTask('does-not-exist')).toBeUndefined();
  });

  it('lists tasks sorted by title', () => {
    const titles = listTasks().map((task) => task.title);
    const sorted = [...titles].sort((a, b) => a.localeCompare(b));
    expect(titles).toEqual(sorted);
  });

  it('every registered task ships en copy for each i18n key its schema uses', () => {
    for (const summary of listTasks()) {
      const mod = getTask(summary.slug)!;
      const provided = Object.keys(mod.messages.en ?? {});
      for (const group of mod.task.schema.groups) {
        if (group.legend) expect(provided, `${summary.slug}: ${group.legend}`).toContain(group.legend);
        for (const key of group.fields.flatMap(fieldKeys)) {
          expect(provided, `${summary.slug}: ${key}`).toContain(key);
        }
      }
    }
  });
});
