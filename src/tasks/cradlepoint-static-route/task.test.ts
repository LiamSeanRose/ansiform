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
  name: 'to-hq',
  dest: '10.0.0.0/24',
  gateway: '192.168.0.254',
  metric: 10,
};

describe('cradlepoint-static-route task', () => {
  it('registers as a cradlepoint-ncos host task with an approximate floor', () => {
    expect(task.definition.slug).toBe('cradlepoint-static-route');
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
    it('emits every field, omitting a blank metric', () => {
      expect(yaml(full)).toBe(
        [
          'name: to-hq',
          'dest: 10.0.0.0/24',
          'gateway: 192.168.0.254',
          'metric: 10',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-config preview (NCOS set form)', () => {
    it('renders set lines, splitting the destination into network + netmask', () => {
      expect(cli(full).text).toBe(
        [
          'set routing/static/0/name to-hq',
          'set routing/static/0/ip_network 10.0.0.0',
          'set routing/static/0/netmask 255.255.255.0',
          'set routing/static/0/gateway 192.168.0.254',
          'set routing/static/0/metric 10',
          '',
        ].join('\n'),
      );
    });

    it('drops the metric line when blank', () => {
      const out = cli({ name: 'to-hq', dest: '10.0.0.0/24', gateway: '192.168.0.254' });
      expect(out.text).toBe(
        [
          'set routing/static/0/name to-hq',
          'set routing/static/0/ip_network 10.0.0.0',
          'set routing/static/0/netmask 255.255.255.0',
          'set routing/static/0/gateway 192.168.0.254',
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

  it('requires a name, destination, and gateway', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.name?.code).toBe('required');
    expect(errors.dest?.code).toBe('required');
    expect(errors.gateway?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
