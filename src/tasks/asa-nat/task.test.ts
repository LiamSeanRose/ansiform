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

const hostStatic: FormValues = {
  object_name: 'WEB-SERVER',
  real_type: 'host',
  real_address: '10.1.1.10',
  real_if: 'inside',
  mapped_if: 'outside',
  nat_type: 'static',
  mapped: '203.0.113.10',
};

const subnetDynamic: FormValues = {
  object_name: 'INSIDE-NET',
  real_type: 'subnet',
  real_address: '10.1.1.0',
  real_mask: '255.255.255.0',
  real_if: 'inside',
  mapped_if: 'outside',
  nat_type: 'dynamic',
  mapped: 'interface',
};

describe('asa-nat task', () => {
  it('registers as a cisco-asa host task under the expected slug', () => {
    expect(task.definition.slug).toBe('asa-nat');
    expect(vendorOf(task.definition)).toBe('cisco-asa');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'asa1' });
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
    it('emits a host static rule, omitting the unused mask', () => {
      expect(yaml(hostStatic)).toBe(
        [
          'object_name: WEB-SERVER',
          'real_type: host',
          'real_address: 10.1.1.10',
          'real_if: inside',
          'mapped_if: outside',
          'nat_type: static',
          'mapped: 203.0.113.10',
          '',
        ].join('\n'),
      );
    });

    it('emits a subnet dynamic rule with its mask', () => {
      expect(yaml(subnetDynamic)).toBe(
        [
          'object_name: INSIDE-NET',
          'real_type: subnet',
          'real_address: 10.1.1.0',
          'real_mask: 255.255.255.0',
          'real_if: inside',
          'mapped_if: outside',
          'nat_type: dynamic',
          'mapped: interface',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders a host object with a static one-to-one map', () => {
      const out = cli(hostStatic);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'object network WEB-SERVER',
          ' host 10.1.1.10',
          ' nat (inside,outside) static 203.0.113.10',
        ].join('\n'),
      );
    });

    it('renders a subnet object with dynamic PAT to the interface', () => {
      expect(cli(subnetDynamic).text).toBe(
        [
          'object network INSIDE-NET',
          ' subnet 10.1.1.0 255.255.255.0',
          ' nat (inside,outside) dynamic interface',
        ].join('\n'),
      );
    });
  });

  it('requires the object, real address, both interfaces, and the mapped address', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.object_name?.code).toBe('required');
    expect(errors.real_address?.code).toBe('required');
    expect(errors.real_if?.code).toBe('required');
    expect(errors.mapped_if?.code).toBe('required');
    expect(errors.mapped?.code).toBe('required');
    expect(Object.keys(validateForm(schema, hostStatic))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
