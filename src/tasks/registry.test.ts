import { describe, expect, it } from 'vitest';
import { getTask, listTasks } from './registry';

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
      const keys = Object.keys(mod.messages.en ?? {});
      for (const group of mod.task.schema.groups) {
        if (group.legend) expect(keys, `${summary.slug}: ${group.legend}`).toContain(group.legend);
        for (const field of group.fields) {
          expect(keys, `${summary.slug}: ${field.label}`).toContain(field.label);
          if (field.help) expect(keys, `${summary.slug}: ${field.help}`).toContain(field.help);
          if (field.type === 'select') {
            for (const option of field.options) {
              expect(keys, `${summary.slug}: ${option.label}`).toContain(option.label);
            }
          }
        }
      }
    }
  });
});
