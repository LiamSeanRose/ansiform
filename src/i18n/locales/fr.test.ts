import { describe, it, expect } from 'vitest';
import { en } from './en';
import { fr } from './fr';
import { listTaskSummaries, getTaskModule } from '../../tasks/registry';

describe('fr locale catalogue', () => {
  it('covers exactly the same keys as en (no missing, no stray)', () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });

  it('has a non-empty value for every key', () => {
    for (const [key, value] of Object.entries(fr)) {
      expect(value, key).toBeTruthy();
    }
  });

  it('is actually translated, not an English copy', () => {
    expect(fr['nav.home']).not.toBe(en['nav.home']);
    expect(fr['form.submitLabel']).not.toBe(en['form.submitLabel']);
    expect(fr['workbench.formHeading']).not.toBe(en['workbench.formHeading']);
  });

  it('preserves placeholder tokens used by t()', () => {
    expect(fr['form.error.min']).toContain('{label}');
    expect(fr['form.error.min']).toContain('{min}');
    expect(fr['task.placeholderHeading']).toContain('{task}');
  });
});

describe('task locale coverage', () => {
  it('every registered task provides fr copy covering all of its en keys', () => {
    const tasks = listTaskSummaries();
    expect(tasks.length).toBeGreaterThan(0);
    for (const { slug } of tasks) {
      const mod = getTaskModule(slug)!;
      const enKeys = Object.keys(mod.messages.en).sort();
      const frKeys = Object.keys(mod.messages.fr ?? {}).sort();
      expect(frKeys, `${slug} fr keys`).toEqual(enKeys);
      for (const [key, value] of Object.entries(mod.messages.fr ?? {})) {
        expect(value, `${slug}:${key}`).toBeTruthy();
      }
    }
  });
});
