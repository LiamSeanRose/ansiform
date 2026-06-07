import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import {
  taskVendors,
  templateForVendor,
  vendorTemplateApproximate,
  vendorOf,
} from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm, secretFieldNames } from '../../components/form';
import type { Field, FormValues } from '../../core';

const def = task.definition;
const { schema, template, defaultScope } = def;
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
  inside_interface: 'GigabitEthernet0/1',
  outside_interface: 'GigabitEthernet0/0',
  pat_acl: '1',
  static_mappings: [
    { local_ip: '10.0.0.10', global_ip: '203.0.113.10' },
    { local_ip: '10.0.0.11', global_ip: '203.0.113.11' },
  ],
};

const iosExpected = [
  'interface GigabitEthernet0/1',
  ' ip nat inside',
  'interface GigabitEthernet0/0',
  ' ip nat outside',
  'ip nat inside source static 10.0.0.10 203.0.113.10',
  'ip nat inside source static 10.0.0.11 203.0.113.11',
  'ip nat inside source list 1 interface GigabitEthernet0/0 overload',
  '',
].join('\n');

describe('ios-nat task', () => {
  it('registers under the expected slug and host scope, default vendor cisco-ios', () => {
    expect(def.slug).toBe('ios-nat');
    expect(vendorOf(def)).toBe('cisco-ios');
    expect(def.defaultScope).toEqual({ kind: 'host', name: 'router1' });
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
    it('emits roles, PAT ACL, and a static mappings sequence', () => {
      expect(yaml(full)).toBe(
        [
          'inside_interface: GigabitEthernet0/1',
          'outside_interface: GigabitEthernet0/0',
          "pat_acl: '1'",
          'static_mappings:',
          '  - local_ip: 10.0.0.10',
          '    global_ip: 203.0.113.10',
          '  - local_ip: 10.0.0.11',
          '    global_ip: 203.0.113.11',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders interface roles, each static mapping, then the overload line', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(iosExpected);
    });

    it('drops the static block when there are no mappings (PAT only)', () => {
      expect(cli({ inside_interface: 'Gi0/1', outside_interface: 'Gi0/0', pat_acl: '1' }).text).toBe(
        [
          'interface Gi0/1',
          ' ip nat inside',
          'interface Gi0/0',
          ' ip nat outside',
          'ip nat inside source list 1 interface Gi0/0 overload',
          '',
        ].join('\n'),
      );
    });

    it('drops the overload line when no PAT ACL is given (static only)', () => {
      const out = cli({
        inside_interface: 'Gi0/1',
        outside_interface: 'Gi0/0',
        static_mappings: [{ local_ip: '10.0.0.10', global_ip: '203.0.113.10' }],
      });
      expect(out.text).toBe(
        [
          'interface Gi0/1',
          ' ip nat inside',
          'interface Gi0/0',
          ' ip nat outside',
          'ip nat inside source static 10.0.0.10 203.0.113.10',
          '',
        ].join('\n'),
      );
    });
  });

  describe('per-vendor overlays (#61)', () => {
    it('offers IOS / IOS-XE / NX-OS only — EOS NAT does not map', () => {
      expect(taskVendors(def)).toEqual(['cisco-ios', 'cisco-iosxe', 'cisco-nxos']);
    });

    it('IOS-XE is exact and identical to the IOS template', () => {
      expect(vendorTemplateApproximate(def, 'cisco-iosxe')).toBe(false);
      expect(renderPreview(templateForVendor(def, 'cisco-iosxe'), full, registry).text).toBe(
        iosExpected,
      );
    });

    it('NX-OS is approximate and prepends feature nat', () => {
      expect(vendorTemplateApproximate(def, 'cisco-nxos')).toBe(true);
      const text = renderPreview(templateForVendor(def, 'cisco-nxos'), full, registry).text;
      expect(text.startsWith('feature nat\n')).toBe(true);
      expect(text).toContain('ip nat inside source static 10.0.0.10 203.0.113.10');
    });
  });

  it('requires both interface roles; static mappings are optional', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.inside_interface?.code).toBe('required');
    expect(errors.outside_interface?.code).toBe('required');
    expect(errors.static_mappings).toBeUndefined();
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('flags a half-filled static mapping as incomplete', () => {
    const errors = validateForm(schema, {
      inside_interface: 'Gi0/1',
      outside_interface: 'Gi0/0',
      static_mappings: [{ local_ip: '10.0.0.10' }],
    });
    expect(errors.static_mappings?.code).toBe('incomplete');
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
