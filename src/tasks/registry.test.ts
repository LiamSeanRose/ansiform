import { describe, expect, it } from 'vitest';
import { getTaskModule, listTaskSummaries, taskMessages } from './registry';

describe('task registry (import.meta.glob auto-registration)', () => {
  it('discovers the interface-ip task folder with no manual registration', () => {
    const mod = getTaskModule('interface-ip');
    expect(mod).toBeDefined();
    expect(mod!.definition.title).toBe('Cisco IOS interface & IP address');
  });

  it('returns undefined for an unknown slug', () => {
    expect(getTaskModule('does-not-exist')).toBeUndefined();
  });

  it('lists summaries (slug/title/description) sorted by title', () => {
    const summaries = listTaskSummaries();
    expect(summaries.length).toBeGreaterThan(0);
    expect(summaries.some((s) => s.slug === 'interface-ip')).toBe(true);
    const titles = summaries.map((s) => s.title);
    expect(titles).toEqual([...titles].sort((a, b) => a.localeCompare(b)));
  });

  it('resolves task copy for a locale, falling back to English', () => {
    const mod = getTaskModule('interface-ip')!;
    const en = taskMessages(mod, 'en');
    expect(en['task.interface-ip.field.interface.label']).toBe('Interface');
  });
});
