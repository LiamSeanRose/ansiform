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
  name: 'Primary-LAN',
  ip_address: '192.168.0.1/24',
  dhcp_enabled: true,
  dhcp_range_start: '192.168.0.100',
  dhcp_range_end: '192.168.0.200',
};

describe('cradlepoint-lan task', () => {
  it('registers as a cradlepoint-ncos host task with an approximate floor', () => {
    expect(task.definition.slug).toBe('cradlepoint-lan');
    expect(vendorOf(task.definition)).toBe('cradlepoint-ncos');
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
    it('emits every field, omitting blank DHCP range bounds', () => {
      expect(yaml(full)).toBe(
        [
          'name: Primary-LAN',
          'ip_address: 192.168.0.1/24',
          'dhcp_enabled: true',
          'dhcp_range_start: 192.168.0.100',
          'dhcp_range_end: 192.168.0.200',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-config preview (NCOS set form)', () => {
    it('renders set lines for the LAN and DHCP pool', () => {
      const out = cli(full);
      expect(out.text).toBe(
        [
          'set lan/0/name Primary-LAN',
          'set lan/0/ip_address 192.168.0.1',
          'set lan/0/netmask 255.255.255.0',
          'set lan/0/dhcpd/enabled true',
          'set lan/0/dhcpd/range_start 192.168.0.100',
          'set lan/0/dhcpd/range_end 192.168.0.200',
          '',
        ].join('\n'),
      );
    });

    it('disables DHCP and drops the range lines when off', () => {
      const out = cli({
        name: 'Primary-LAN',
        ip_address: '192.168.0.1/24',
        dhcp_enabled: false,
      });
      expect(out.text).toBe(
        [
          'set lan/0/name Primary-LAN',
          'set lan/0/ip_address 192.168.0.1',
          'set lan/0/netmask 255.255.255.0',
          'set lan/0/dhcpd/enabled false',
          '',
        ].join('\n'),
      );
    });

    it('is exact when rendered, but the declared floor clamps it to approximate (#40)', () => {
      // The template uses only exact-tier filters, so the raw render is exact …
      expect(cli(full).fidelity).toBe('exact');
      // … and the fidelity floor degrades it so the preview never claims exact.
      expect(withFidelityFloor(cli(full), task.definition.fidelityFloor).fidelity).toBe(
        'approximate',
      );
    });
  });

  it('requires a name and a gateway address', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.name?.code).toBe('required');
    expect(errors.ip_address?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
