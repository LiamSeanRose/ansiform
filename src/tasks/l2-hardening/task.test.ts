import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { templateForVendor, vendorOf, vendorTemplateApproximate } from '../../core/tasks/vendor';
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
  interface: 'GigabitEthernet0/1',
  port_security: true,
  max_mac: 2,
  violation: 'restrict',
  sticky: true,
  dhcp_snoop_trust: false,
  dhcp_snoop_rate: 15,
  storm_level: 5,
};

describe('l2-hardening task', () => {
  it('registers as a default cisco-ios host task', () => {
    expect(task.definition.slug).toBe('l2-hardening');
    expect(vendorOf(task.definition)).toBe('cisco-ios');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'switch1' });
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

  describe('YAML output', () => {
    it('emits every field, omitting blank numerics', () => {
      expect(yaml(full)).toBe(
        [
          'interface: GigabitEthernet0/1',
          'port_security: true',
          'max_mac: 2',
          'violation: restrict',
          'sticky: true',
          'dhcp_snoop_trust: false',
          'dhcp_snoop_rate: 15',
          'storm_level: 5',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders a fully-hardened access port (untrusted, rate-limited)', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'interface GigabitEthernet0/1',
          ' switchport port-security',
          ' switchport port-security maximum 2',
          ' switchport port-security violation restrict',
          ' switchport port-security mac-address sticky',
          ' ip dhcp snooping limit rate 15',
          ' storm-control broadcast level 5',
          '',
        ].join('\n'),
      );
    });

    it('a trusted uplink with port-security off renders only the trust line', () => {
      expect(
        cli({ interface: 'GigabitEthernet0/24', port_security: false, dhcp_snoop_trust: true }).text,
      ).toBe(['interface GigabitEthernet0/24', ' ip dhcp snooping trust', ''].join('\n'));
    });
  });

  describe('per-vendor overlay (#27)', () => {
    it('IOS-XE reuses the base verbatim as an exact claim', () => {
      expect(templateForVendor(task.definition, 'cisco-iosxe')).toBe(template);
      expect(vendorTemplateApproximate(task.definition, 'cisco-iosxe')).toBe(false);
    });
  });

  it('requires only the interface', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.interface?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
