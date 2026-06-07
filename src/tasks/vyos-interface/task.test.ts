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
    if (field.type === 'list') {
      for (const k of [field.addLabel, field.removeLabel, field.itemLabel]) if (k) keys.push(k);
      keys.push(...collectKeys(field.fields));
    }
  }
  return keys;
}

const full: FormValues = {
  interface: 'eth0',
  ip_address: '192.168.1.1/24',
  description: 'Uplink to core',
  mtu: 1500,
  enabled: true,
};

describe('vyos-interface task (first VyOS task)', () => {
  it('registers as a vyos host task with an approximate floor', () => {
    expect(task.definition.slug).toBe('vyos-interface');
    expect(vendorOf(task.definition)).toBe('vyos');
    expect(task.definition.fidelityFloor).toBe('approximate');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'router1' });
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
    it('emits every field with omit-on-blank', () => {
      expect(yaml(full)).toBe(
        [
          'interface: eth0',
          'ip_address: 192.168.1.1/24',
          'description: Uplink to core',
          'mtu: 1500',
          'enabled: true',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-config preview (set form)', () => {
    it('renders the set lines; CIDR verbatim, disable omitted when enabled', () => {
      const out = cli(full);
      expect(out.text).toBe(
        [
          'set interfaces ethernet eth0 address 192.168.1.1/24',
          'set interfaces ethernet eth0 description "Uplink to core"',
          'set interfaces ethernet eth0 mtu 1500',
          '',
        ].join('\n'),
      );
    });

    it('renders a disable line when administratively off', () => {
      const out = cli({ interface: 'eth1', ip_address: '10.0.0.1/30', enabled: false });
      expect(out.text).toBe(
        [
          'set interfaces ethernet eth1 address 10.0.0.1/30',
          'set interfaces ethernet eth1 disable',
          '',
        ].join('\n'),
      );
    });

    it('is exact when rendered, but the declared floor clamps it to approximate (#39)', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(withFidelityFloor(out, task.definition.fidelityFloor).fidelity).toBe('approximate');
    });
  });

  it('requires the interface and address', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.interface?.code).toBe('required');
    expect(errors.ip_address?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
