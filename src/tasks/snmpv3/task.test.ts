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
  groups: [{ name: 'NETADMIN', level: 'priv' }],
  users: [
    { name: 'netops', group: 'NETADMIN', auth_proto: 'sha', auth_pass: 'authPass1', priv_proto: 'aes 128', priv_pass: 'privPass1' },
    { name: 'monitor', group: 'NETADMIN', auth_proto: 'sha', auth_pass: 'authPass2', priv_proto: 'aes 128' },
  ],
};

describe('snmpv3 task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('snmpv3');
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
            if (sub.type === 'select') for (const o of sub.options) keys.push(o.label);
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
    it('declares auth/priv pass-phrases as secrets, never seeded, never leaked', () => {
      const usersField = schema.groups
        .flatMap((g) => g.fields)
        .find((f) => f.name === 'users') as ListField;
      const secretNames = usersField.fields.filter((f) => f.type === 'secret').map((f) => f.name);
      expect(secretNames.sort()).toEqual(['auth_pass', 'priv_pass']);
      const seeded = initialValues(schema).users as Array<Record<string, unknown>>;
      expect('auth_pass' in seeded[0]).toBe(false);
      expect('priv_pass' in seeded[0]).toBe(false);
      yaml(full);
      cli(full);
      const snapshot = JSON.stringify(task);
      expect(snapshot).not.toContain('authPass1');
      expect(snapshot).not.toContain('privPass1');
    });
  });

  describe('YAML output (always correct)', () => {
    it('emits both sequences with per-row omit-on-blank', () => {
      expect(yaml(full)).toBe(
        [
          'groups:',
          '  - name: NETADMIN',
          '    level: priv',
          'users:',
          '  - name: netops',
          '    group: NETADMIN',
          '    auth_proto: sha',
          '    auth_pass: authPass1',
          '    priv_proto: aes 128',
          '    priv_pass: privPass1',
          '  - name: monitor',
          '    group: NETADMIN',
          '    auth_proto: sha',
          '    auth_pass: authPass2',
          '    priv_proto: aes 128',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders groups then users, authPriv vs authNoPriv per user', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'snmp-server group NETADMIN v3 priv',
          'snmp-server user netops NETADMIN v3 auth sha authPass1 priv aes 128 privPass1',
          'snmp-server user monitor NETADMIN v3 auth sha authPass2',
          '',
        ].join('\n'),
      );
    });

    it('renders a noAuth user (no pass-phrases) as bare v3', () => {
      const out = cli({ groups: [], users: [{ name: 'ro', group: 'NETADMIN', auth_proto: 'sha', priv_proto: 'aes 128' }] });
      expect(out.text).toBe(['snmp-server user ro NETADMIN v3', ''].join('\n'));
    });
  });

  describe('validation', () => {
    it('flags a user row missing the required group as incomplete', () => {
      expect(
        validateForm(schema, { ...initialValues(schema), users: [{ name: 'x', auth_proto: 'sha', priv_proto: 'aes 128' }] }).users?.code,
      ).toBe('incomplete');
    });
  });
});
