import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

const full: FormValues = {
  snmp_community: 'public',
  snmp_location: 'HQ-IDF1',
  ntp_server: '192.0.2.10',
  tacacs_server: '192.0.2.20',
  tacacs_key: 'tac-s3cret',
};

describe('device-basics task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('device-basics');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'group_vars/all.yml',
    );
  });

  it('every schema i18n key has English copy', () => {
    const en = task.messages.en;
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        keys.push(field.label);
        if (field.help) keys.push(field.help);
      }
    }
    for (const key of keys) expect(en[key], `missing copy for ${key}`).toBeTruthy();
  });

  describe('secrets (§5)', () => {
    const secretFields = schema.groups
      .flatMap((g) => g.fields)
      .filter((f) => f.type === 'secret');

    it('declares the SNMP community and TACACS+ key as secrets', () => {
      expect(secretFields.map((f) => f.name).sort()).toEqual(['snmp_community', 'tacacs_key']);
    });

    it('never seeds a secret (no default, absent from initial values)', () => {
      const init = initialValues(schema);
      for (const field of secretFields) {
        expect('default' in field).toBe(false);
        expect(init[field.name]).toBeUndefined();
      }
    });

    it('keeps secret values out of any logged task snapshot', () => {
      // The static task module is the only thing safe to serialize/log: it holds
      // schema + copy, never values. A real secret must never appear in it.
      const snapshot = JSON.stringify(task);
      expect(snapshot).not.toContain('tac-s3cret');
      expect(snapshot).not.toContain('public');
    });

    it('carries secrets in the YAML by design (the user vaults the file)', () => {
      expect(yaml(full)).toContain('snmp_community: public');
      expect(yaml(full)).toContain('tacacs_key: tac-s3cret');
    });
  });

  describe('YAML output (always correct)', () => {
    it('emits every field in schema order when fully filled', () => {
      expect(yaml(full)).toBe(
        [
          'snmp_community: public',
          'snmp_location: HQ-IDF1',
          'ntp_server: 192.0.2.10',
          'tacacs_server: 192.0.2.20',
          'tacacs_key: tac-s3cret',
          '',
        ].join('\n'),
      );
    });

    it('omits every blank field (all are optional)', () => {
      expect(yaml({ ntp_server: '192.0.2.10' })).toBe(['ntp_server: 192.0.2.10', ''].join('\n'));
      expect(yaml({})).toBe('{}\n');
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders every block at exact fidelity', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'snmp-server community public RO',
          'snmp-server location HQ-IDF1',
          'ntp server 192.0.2.10',
          'tacacs server TAC1',
          ' address ipv4 192.0.2.20',
          ' key tac-s3cret',
          '',
        ].join('\n'),
      );
    });

    it('renders only the blocks that are filled', () => {
      expect(cli({ ntp_server: '192.0.2.10' }).text).toBe(['ntp server 192.0.2.10', ''].join('\n'));
    });

    it('drops the TACACS+ key line when no key is given', () => {
      const out = cli({ tacacs_server: '192.0.2.20' });
      expect(out.text).toBe(['tacacs server TAC1', ' address ipv4 192.0.2.20', ''].join('\n'));
    });
  });

  describe('validation', () => {
    it('all fields optional — empty form is valid', () => {
      expect(validateForm(schema, initialValues(schema))).toEqual({});
    });

    it('flags a malformed NTP server via the field pattern', () => {
      expect(validateForm(schema, { ntp_server: 'nope' }).ntp_server?.code).toBe('pattern');
    });
  });
});
