import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues, ListField } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

const full: FormValues = {
  authenticate: true,
  keys: [{ id: 1, secret: 'kEy-One' }],
  servers: [
    { host: '192.0.2.10', key_id: 1 },
    { host: '192.0.2.11' },
  ],
};

describe('ntp-auth task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('ntp-auth');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
  });

  it('every schema i18n key has English and French copy', () => {
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        keys.push(field.label);
        if (field.help) keys.push(field.help);
        if (field.type === 'list') {
          const lf = field as ListField;
          if (lf.addLabel) keys.push(lf.addLabel);
          if (lf.itemLabel) keys.push(lf.itemLabel);
          for (const sub of lf.fields) {
            keys.push(sub.label);
            if (sub.help) keys.push(sub.help);
          }
        }
      }
    }
    for (const key of keys) {
      expect(task.messages.en[key], `missing EN copy for ${key}`).toBeTruthy();
      expect(task.messages.fr?.[key], `missing FR copy for ${key}`).toBeTruthy();
    }
  });

  describe('secrets (§5)', () => {
    it('declares the per-key secret and never seeds or leaks it', () => {
      const keysField = schema.groups[0].fields.find((f) => f.name === 'keys') as ListField;
      const secretSub = keysField.fields.find((f) => f.type === 'secret')!;
      expect(secretSub.name).toBe('secret');
      expect('default' in secretSub).toBe(false);
      // initialValues seeds a key row but never the secret cell.
      const seededKeys = initialValues(schema).keys as Array<Record<string, unknown>>;
      expect('secret' in seededKeys[0]).toBe(false);
      // Rendering a secret never lands in the serialized module.
      yaml(full);
      cli(full);
      expect(JSON.stringify(task)).not.toContain('kEy-One');
    });

    it('carries the key in the YAML by design (the user vaults the file)', () => {
      expect(yaml(full)).toContain('secret: kEy-One');
    });
  });

  describe('YAML output (always correct)', () => {
    it('emits both sequences with per-row omit-on-blank', () => {
      expect(yaml(full)).toBe(
        [
          'authenticate: true',
          'keys:',
          '  - id: 1',
          '    secret: kEy-One',
          'servers:',
          '  - host: 192.0.2.10',
          '    key_id: 1',
          '  - host: 192.0.2.11',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders keys then servers, appending the optional per-server key id', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'ntp authenticate',
          'ntp authentication-key 1 md5 kEy-One',
          'ntp server 192.0.2.10 key 1',
          'ntp server 192.0.2.11',
          '',
        ].join('\n'),
      );
    });

    it('drops ntp authenticate when authentication is off', () => {
      const out = cli({ ...full, authenticate: false });
      expect(out.text.startsWith('ntp authentication-key')).toBe(true);
      expect(out.text).not.toContain('ntp authenticate\n');
    });
  });

  describe('validation', () => {
    it('flags a key row missing its required id as incomplete', () => {
      expect(
        validateForm(schema, { ...initialValues(schema), keys: [{ secret: 'x' }] }).keys?.code,
      ).toBe('incomplete');
    });
  });
});
