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
  name: 'CUST-A',
  rd: '65000:100',
  rt_import: '65000:100',
  rt_export: '65000:100',
};

describe('vrf task', () => {
  it('registers as a default cisco-ios host task with multi-vendor overlays', () => {
    expect(task.definition.slug).toBe('vrf');
    expect(vendorOf(task.definition)).toBe('cisco-ios');
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
    it('emits every field, omitting blank route-targets', () => {
      expect(yaml(full)).toBe(
        [
          'name: CUST-A',
          "rd: '65000:100'",
          "rt_import: '65000:100'",
          "rt_export: '65000:100'",
          '',
        ].join('\n'),
      );
      expect(yaml({ name: 'CUST-A', rd: '65000:100' })).toBe(
        ['name: CUST-A', "rd: '65000:100'", ''].join('\n'),
      );
    });
  });

  describe('device-CLI preview (base: Cisco IOS, exact)', () => {
    it('renders the vrf definition with an IPv4 address-family and route-targets', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.text).toBe(
        [
          'vrf definition CUST-A',
          ' rd 65000:100',
          ' address-family ipv4',
          '  route-target import 65000:100',
          '  route-target export 65000:100',
          ' exit-address-family',
        ].join('\n'),
      );
    });

    it('drops the route-target lines when blank', () => {
      expect(cli({ name: 'CUST-A', rd: '65000:100' }).text).toBe(
        [
          'vrf definition CUST-A',
          ' rd 65000:100',
          ' address-family ipv4',
          ' exit-address-family',
        ].join('\n'),
      );
    });
  });

  describe('per-vendor overlays (#27)', () => {
    const def = task.definition;

    it('IOS-XE reuses the base verbatim as an exact claim', () => {
      expect(templateForVendor(def, 'cisco-iosxe')).toBe(template);
      expect(vendorTemplateApproximate(def, 'cisco-iosxe')).toBe(false);
    });

    it('NX-OS renders vrf context / ipv4 unicast, flagged approximate', () => {
      expect(vendorTemplateApproximate(def, 'cisco-nxos')).toBe(true);
      expect(renderPreview(templateForVendor(def, 'cisco-nxos'), full, registry).text).toBe(
        [
          'vrf context CUST-A',
          ' rd 65000:100',
          ' address-family ipv4 unicast',
          '  route-target import 65000:100',
          '  route-target export 65000:100',
          '',
        ].join('\n'),
      );
    });

    it('IOS-XR renders nested route-target blocks without an RD, flagged approximate', () => {
      expect(vendorTemplateApproximate(def, 'cisco-iosxr')).toBe(true);
      expect(renderPreview(templateForVendor(def, 'cisco-iosxr'), full, registry).text).toBe(
        [
          'vrf CUST-A',
          ' address-family ipv4 unicast',
          '  import route-target',
          '   65000:100',
          '  export route-target',
          '   65000:100',
          '',
        ].join('\n'),
      );
    });
  });

  it('requires a name and a route distinguisher', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.name?.code).toBe('required');
    expect(errors.rd?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
