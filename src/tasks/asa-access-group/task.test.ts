import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { vendorOf } from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm, secretFieldNames } from '../../components/form';
import type { Field, FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

/** Collect every i18n key referenced by a field set, recursing into list rows. */
function collectKeys(fields: readonly Field[]): string[] {
  const keys: string[] = [];
  for (const field of fields) {
    keys.push(field.label);
    if (field.help) keys.push(field.help);
    if (field.type === 'select') for (const opt of field.options) keys.push(opt.label);
    if (field.type === 'list') {
      for (const k of [field.addLabel, field.removeLabel, field.itemLabel]) if (k) keys.push(k);
      keys.push(...collectKeys(field.fields));
    }
  }
  return keys;
}

const full: FormValues = {
  bindings: [
    { acl_name: 'OUTSIDE-IN', direction: 'in', interface: 'outside' },
    { acl_name: 'INSIDE-OUT', direction: 'out', interface: 'inside' },
  ],
};

describe('asa-access-group task (multi-entry)', () => {
  it('registers as a cisco-asa group task under the expected slug', () => {
    expect(task.definition.slug).toBe('asa-access-group');
    expect(vendorOf(task.definition)).toBe('cisco-asa');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
  });

  it('every schema i18n key has EN and FR copy (incl. list + option keys)', () => {
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      keys.push(...collectKeys(group.fields));
    }
    for (const key of keys) {
      expect(task.messages.en[key], `en ${key}`).toBeTruthy();
      expect(task.messages.fr?.[key], `fr ${key}`).toBeTruthy();
    }
  });

  describe('YAML output', () => {
    it('emits a bindings sequence in schema field order', () => {
      expect(yaml(full)).toBe(
        [
          'bindings:',
          '  - acl_name: OUTSIDE-IN',
          '    direction: in',
          '    interface: outside',
          '  - acl_name: INSIDE-OUT',
          '    direction: out',
          '    interface: inside',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders one access-group line per binding', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'access-group OUTSIDE-IN in interface outside',
          'access-group INSIDE-OUT out interface inside',
          '',
        ].join('\n'),
      );
    });
  });

  it('requires at least one complete binding', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.bindings?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });

  it('is cisco-asa only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
