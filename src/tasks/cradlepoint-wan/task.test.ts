import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview, withFidelityFloor } from '../../core/preview';
import { vendorOf } from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm, secretFieldNames } from '../../components/form';
import type { Field, FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

function collectKeys(fields: readonly Field[]): string[] {
  const keys: string[] = [];
  for (const field of fields) {
    keys.push(field.label);
    if (field.help) keys.push(field.help);
    if (field.type === 'select') for (const opt of field.options) keys.push(opt.label);
  }
  return keys;
}

const full: FormValues = {
  name: 'Cellular-Primary',
  apn: 'broadband',
  sim_pin: '1234',
  auth_type: 'chap',
  username: 'user@carrier',
  password: 'r4dioPSK',
  roaming: true,
};

describe('cradlepoint-wan task', () => {
  it('registers as a cradlepoint-ncos host task with an approximate floor', () => {
    expect(task.definition.slug).toBe('cradlepoint-wan');
    expect(vendorOf(task.definition)).toBe('cradlepoint-ncos');
    expect(task.definition.fidelityFloor).toBe('approximate');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'router1' });
  });

  it('every schema i18n key has EN and FR copy (incl. option keys)', () => {
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

  describe('secrets (§5)', () => {
    it('declares SIM PIN and APN password as secrets, never seeded or embedded', () => {
      const names = secretFieldNames(schema);
      expect(names.has('sim_pin')).toBe(true);
      expect(names.has('password')).toBe(true);
      for (const f of schema.groups[0].fields) {
        if (f.type === 'secret') expect('default' in f).toBe(false);
      }
      const seeded = initialValues(schema);
      expect('sim_pin' in seeded).toBe(false);
      expect('password' in seeded).toBe(false);
      // The definition itself never embeds a secret value.
      yaml(full);
      cli(full);
      expect(JSON.stringify(task)).not.toContain('r4dioPSK');
      expect(JSON.stringify(task)).not.toContain('1234');
    });
  });

  describe('YAML output', () => {
    it('emits every field, quoting the numeric SIM PIN as a string', () => {
      expect(yaml(full)).toBe(
        [
          'name: Cellular-Primary',
          'apn: broadband',
          "sim_pin: '1234'",
          'auth_type: chap',
          'username: user@carrier',
          'password: r4dioPSK',
          'roaming: true',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-config preview (NCOS set form)', () => {
    it('renders the full profile incl. SIM PIN and APN auth', () => {
      expect(cli(full).text).toBe(
        [
          'set wan/cellular/0/profile_name Cellular-Primary',
          'set wan/cellular/0/apn broadband',
          'set wan/cellular/0/sim_pin 1234',
          'set wan/cellular/0/auth/type chap',
          'set wan/cellular/0/auth/username user@carrier',
          'set wan/cellular/0/auth/password r4dioPSK',
          'set wan/cellular/0/roaming true',
          '',
        ].join('\n'),
      );
    });

    it('drops the SIM PIN and auth lines when none/blank', () => {
      expect(cli({ name: 'Cell', apn: 'internet', auth_type: 'none', roaming: false }).text).toBe(
        [
          'set wan/cellular/0/profile_name Cell',
          'set wan/cellular/0/apn internet',
          'set wan/cellular/0/roaming false',
          '',
        ].join('\n'),
      );
    });

    it('is exact when rendered, but the declared floor clamps it to approximate (#40)', () => {
      expect(cli(full).fidelity).toBe('exact');
      expect(withFidelityFloor(cli(full), task.definition.fidelityFloor).fidelity).toBe(
        'approximate',
      );
    });
  });

  it('requires a profile name and an APN', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.name?.code).toBe('required');
    expect(errors.apn?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });
});
