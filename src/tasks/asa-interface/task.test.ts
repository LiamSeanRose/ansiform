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
  interface: 'GigabitEthernet0/0',
  description: 'Outside uplink',
  nameif: 'outside',
  security_level: 0,
  ip_address: '203.0.113.1/24',
  enabled: true,
};

describe('asa-interface task', () => {
  it('registers as a cisco-asa host task under the expected slug', () => {
    expect(task.definition.slug).toBe('asa-interface');
    expect(vendorOf(task.definition)).toBe('cisco-asa');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'asa1' });
  });

  it('every schema i18n key has EN and FR copy', () => {
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
    it('emits every field, omitting a blank description', () => {
      expect(yaml(full)).toBe(
        [
          'interface: GigabitEthernet0/0',
          'description: Outside uplink',
          'nameif: outside',
          'security_level: 0',
          'ip_address: 203.0.113.1/24',
          'enabled: true',
          '',
        ].join('\n'),
      );
      expect(
        yaml({
          interface: 'GigabitEthernet0/0',
          description: '',
          nameif: 'outside',
          security_level: 0,
          ip_address: '203.0.113.1/24',
          enabled: true,
        }),
      ).toBe(
        [
          'interface: GigabitEthernet0/0',
          'nameif: outside',
          'security_level: 0',
          'ip_address: 203.0.113.1/24',
          'enabled: true',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact via ipaddr)', () => {
    it('renders a full ASA interface block at exact fidelity', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.text).toBe(
        [
          'interface GigabitEthernet0/0',
          ' description Outside uplink',
          ' nameif outside',
          ' security-level 0',
          ' ip address 203.0.113.1 255.255.255.0',
          ' no shutdown',
          '',
        ].join('\n'),
      );
    });

    it('drops the description and shuts the port when disabled', () => {
      const out = cli({
        interface: 'GigabitEthernet0/1',
        nameif: 'inside',
        security_level: 100,
        ip_address: '10.0.0.1/24',
        enabled: false,
      });
      expect(out.fidelity).toBe('exact');
      expect(out.text).toBe(
        [
          'interface GigabitEthernet0/1',
          ' nameif inside',
          ' security-level 100',
          ' ip address 10.0.0.1 255.255.255.0',
          ' shutdown',
          '',
        ].join('\n'),
      );
    });
  });

  it('requires interface, nameif, security-level, and address', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.interface?.code).toBe('required');
    expect(errors.nameif?.code).toBe('required');
    expect(errors.security_level?.code).toBe('required');
    expect(errors.ip_address?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });

  it('is cisco-asa only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
