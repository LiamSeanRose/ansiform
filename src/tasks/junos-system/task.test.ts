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
  hostname: 'mx1',
  ntp_servers: [{ server: '10.0.0.1' }, { server: '10.0.0.2' }],
  syslog_hosts: [{ host: '10.0.0.5' }],
};

describe('junos-system task', () => {
  it('registers as a juniper-junos host task with an approximate floor', () => {
    expect(task.definition.slug).toBe('junos-system');
    expect(vendorOf(task.definition)).toBe('juniper-junos');
    expect(task.definition.fidelityFloor).toBe('approximate');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'mx1' });
  });

  it('every schema i18n key has EN and FR copy (incl. list keys)', () => {
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
    it('emits the host-name and the NTP / syslog sequences', () => {
      expect(yaml(full)).toBe(
        [
          'hostname: mx1',
          'ntp_servers:',
          '  - server: 10.0.0.1',
          '  - server: 10.0.0.2',
          'syslog_hosts:',
          '  - host: 10.0.0.5',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-config preview (Junos set form)', () => {
    it('renders one set line per NTP server and syslog host', () => {
      expect(cli(full).text).toBe(
        [
          'set system host-name mx1',
          'set system ntp server 10.0.0.1',
          'set system ntp server 10.0.0.2',
          'set system syslog host 10.0.0.5 any any',
          '',
        ].join('\n'),
      );
    });

    it('renders just the host-name when no NTP/syslog rows are added', () => {
      expect(cli({ hostname: 'mx1' }).text).toBe(['set system host-name mx1', ''].join('\n'));
    });

    it('is exact when rendered, but the declared floor clamps it to approximate (#40)', () => {
      expect(cli(full).fidelity).toBe('exact');
      expect(withFidelityFloor(cli(full), task.definition.fidelityFloor).fidelity).toBe(
        'approximate',
      );
    });
  });

  it('requires a host-name; NTP and syslog lists are optional', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.hostname?.code).toBe('required');
    expect(errors.ntp_servers).toBeUndefined();
    expect(errors.syslog_hosts).toBeUndefined();
    // host-name alone is a valid form; full clears too.
    expect(Object.keys(validateForm(schema, { hostname: 'mx1' }))).toEqual([]);
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
