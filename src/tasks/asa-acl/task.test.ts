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
  name: 'OUTSIDE-IN',
  entries: [
    {
      action: 'permit',
      protocol: 'tcp',
      source: 'any',
      destination: 'host 203.0.113.10',
      port: 443,
      remark: 'Allow HTTPS to web server',
    },
    { action: 'deny', protocol: 'ip', source: 'any', destination: 'any' },
  ],
};

describe('asa-acl task (multi-entry)', () => {
  it('registers as a cisco-asa group task under the expected slug', () => {
    expect(task.definition.slug).toBe('asa-acl');
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
    it('emits the ACL name and an entries sequence with per-row omit-on-blank', () => {
      expect(yaml(full)).toBe(
        [
          'name: OUTSIDE-IN',
          'entries:',
          '  - action: permit',
          '    protocol: tcp',
          '    source: any',
          '    destination: host 203.0.113.10',
          '    port: 443',
          '    remark: Allow HTTPS to web server',
          '  - action: deny',
          '    protocol: ip',
          '    source: any',
          '    destination: any',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders flat access-list lines; remark + tcp port appear, ip entry has no eq', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'access-list OUTSIDE-IN remark Allow HTTPS to web server',
          'access-list OUTSIDE-IN extended permit tcp any host 203.0.113.10 eq 443',
          'access-list OUTSIDE-IN extended deny ip any any',
          '',
        ].join('\n'),
      );
    });
  });

  it('requires a name and at least one valid entry', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.name?.code).toBe('required');
    expect(errors.entries?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });

  it('is cisco-asa only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
