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
  zone_name: 'Primary-LAN',
  forwardings: [
    { seq: 0, dest_zone: 'Internet', action: 'allow' },
    { seq: 1, dest_zone: 'Guest', action: 'deny' },
  ],
};

describe('cradlepoint-firewall task', () => {
  it('registers as a cradlepoint-ncos host task with an approximate floor', () => {
    expect(task.definition.slug).toBe('cradlepoint-firewall');
    expect(vendorOf(task.definition)).toBe('cradlepoint-ncos');
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
    it('emits the zone name and the forwardings sequence', () => {
      expect(yaml(full)).toBe(
        [
          'zone_name: Primary-LAN',
          'forwardings:',
          '  - seq: 0',
          '    dest_zone: Internet',
          '    action: allow',
          '  - seq: 1',
          '    dest_zone: Guest',
          '    action: deny',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-config preview (NCOS set form)', () => {
    it('creates the zone at index 0 and three set lines per forwarding', () => {
      expect(cli(full).text).toBe(
        [
          'set security/zfw/zones/0/name Primary-LAN',
          'set security/zfw/forwardings/0/src_zone Primary-LAN',
          'set security/zfw/forwardings/0/dst_zone Internet',
          'set security/zfw/forwardings/0/action allow',
          'set security/zfw/forwardings/1/src_zone Primary-LAN',
          'set security/zfw/forwardings/1/dst_zone Guest',
          'set security/zfw/forwardings/1/action deny',
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

  it('requires a zone name and at least one complete forwarding rule', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.zone_name?.code).toBe('required');
    expect(errors.forwardings?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
