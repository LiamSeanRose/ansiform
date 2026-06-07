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
  reference_bandwidth: '10g',
  interfaces: [
    { interface: 'ge-0/0/0.0', area: '0.0.0.0', passive: false },
    { interface: 'ge-0/0/1.0', area: '0.0.0.0', passive: true },
  ],
};

describe('junos-ospf task', () => {
  it('registers as a juniper-junos host task with an approximate floor', () => {
    expect(task.definition.slug).toBe('junos-ospf');
    expect(vendorOf(task.definition)).toBe('juniper-junos');
    expect(task.definition.fidelityFloor).toBe('approximate');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'router1' });
  });

  it('every schema i18n key has EN and FR copy (incl. list + option keys)', () => {
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
    it('emits the reference bandwidth and an interfaces sequence', () => {
      expect(yaml(full)).toBe(
        [
          'reference_bandwidth: 10g',
          'interfaces:',
          '  - interface: ge-0/0/0.0',
          '    area: 0.0.0.0',
          '    passive: false',
          '  - interface: ge-0/0/1.0',
          '    area: 0.0.0.0',
          '    passive: true',
          '',
        ].join('\n'),
      );
    });

    it('omits the reference bandwidth when blank', () => {
      const out = yaml({ interfaces: [{ interface: 'ge-0/0/0.0', area: '0', passive: false }] });
      expect(out.startsWith('interfaces:')).toBe(true);
      expect(out).not.toContain('reference_bandwidth');
    });
  });

  describe('device-config preview (Junos set form)', () => {
    it('renders one area/interface line per row, plus passive only when set', () => {
      const out = cli(full);
      expect(out.text).toBe(
        [
          'set protocols ospf reference-bandwidth 10g',
          'set protocols ospf area 0.0.0.0 interface ge-0/0/0.0',
          'set protocols ospf area 0.0.0.0 interface ge-0/0/1.0',
          'set protocols ospf area 0.0.0.0 interface ge-0/0/1.0 passive',
          '',
        ].join('\n'),
      );
    });

    it('drops the reference-bandwidth line when blank', () => {
      const out = cli({ interfaces: [{ interface: 'ge-0/0/0.0', area: '0', passive: false }] });
      expect(out.text).toBe('set protocols ospf area 0 interface ge-0/0/0.0\n');
    });

    it('is exact when rendered, but the declared floor clamps it to approximate (#40)', () => {
      expect(cli(full).fidelity).toBe('exact');
      expect(withFidelityFloor(cli(full), task.definition.fidelityFloor).fidelity).toBe(
        'approximate',
      );
    });
  });

  it('requires at least one complete interface', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.interfaces?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
