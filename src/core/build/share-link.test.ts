import { describe, expect, it } from 'vitest';
import { TASKS_PARAM, buildShareQuery, parseSharedTasks } from './share-link';

const ALLOWED = ['interface-ip', 'banners', 'device-hardening', 'ospf'];

describe('parseSharedTasks', () => {
  it('reads allowlisted slugs from the tasks param, in order', () => {
    expect(parseSharedTasks('?tasks=banners,interface-ip', ALLOWED)).toEqual(['banners', 'interface-ip']);
  });

  it('works with or without a leading "?" and trims whitespace', () => {
    expect(parseSharedTasks('tasks=interface-ip', ALLOWED)).toEqual(['interface-ip']);
    expect(parseSharedTasks('?tasks= interface-ip , banners ', ALLOWED)).toEqual(['interface-ip', 'banners']);
  });

  it('dedupes repeated slugs, keeping first-seen order', () => {
    expect(parseSharedTasks('?tasks=ospf,ospf,banners', ALLOWED)).toEqual(['ospf', 'banners']);
  });

  it('drops unknown slugs rather than reflecting them', () => {
    expect(parseSharedTasks('?tasks=interface-ip,not-a-task,DROP', ALLOWED)).toEqual(['interface-ip']);
  });

  it('returns [] for an absent or empty tasks param', () => {
    expect(parseSharedTasks('', ALLOWED)).toEqual([]);
    expect(parseSharedTasks('?foo=bar', ALLOWED)).toEqual([]);
    expect(parseSharedTasks('?tasks=', ALLOWED)).toEqual([]);
  });

  it('NEVER reads any param other than tasks (no value can ride along)', () => {
    // A hostile link tries to smuggle field values via extra params.
    const hostile = '?tasks=interface-ip&hostname=evil&snmp_community=public&interface-ip.ip=10.0.0.1';
    expect(parseSharedTasks(hostile, ALLOWED)).toEqual(['interface-ip']);
  });
});

describe('buildShareQuery', () => {
  it('emits ?tasks= with allowlisted slugs, deduped and in order', () => {
    expect(buildShareQuery(['banners', 'ospf', 'banners'], ALLOWED)).toBe('?tasks=banners,ospf');
  });

  it('returns "" when nothing is shareable', () => {
    expect(buildShareQuery([], ALLOWED)).toBe('');
    expect(buildShareQuery(['not-a-task'], ALLOWED)).toBe('');
  });

  it('GUARDRAIL: drops anything not on the allowlist — no value or junk can be encoded', () => {
    // Even if a caller hands it value-shaped strings, only known slugs survive.
    const out = buildShareQuery(
      ['interface-ip', 'hostname=evil', 'supersecretpassword', 'ip=10.0.0.1', 'banners'],
      ALLOWED,
    );
    expect(out).toBe('?tasks=interface-ip,banners');
  });

  it('GUARDRAIL: output contains only the tasks param and slug-grammar characters', () => {
    const out = buildShareQuery(ALLOWED, ALLOWED);
    // Exactly one param, named tasks; value is only [a-z0-9-] and commas.
    expect(out).toMatch(/^\?tasks=[a-z0-9-]+(,[a-z0-9-]+)*$/);
    expect(new URLSearchParams(out).get(TASKS_PARAM)).toBe(ALLOWED.join(','));
    // No '=' inside the value, no other params — nothing that could be a value.
    expect(out.slice(1).split('&')).toHaveLength(1);
  });

  it('round-trips with parseSharedTasks', () => {
    const slugs = ['ospf', 'interface-ip', 'banners'];
    expect(parseSharedTasks(buildShareQuery(slugs, ALLOWED), ALLOWED)).toEqual(slugs);
  });
});
