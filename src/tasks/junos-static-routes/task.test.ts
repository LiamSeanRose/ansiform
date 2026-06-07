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
  routes: [
    { destination: '10.0.0.0/24', action: 'next-hop', next_hop: '192.168.1.1' },
    { destination: '0.0.0.0/0', action: 'next-hop', next_hop: '192.168.1.254', metric: 5 },
    { destination: '10.99.0.0/16', action: 'discard' },
  ],
};

describe('junos-static-routes task (first native Junos task)', () => {
  it('registers as a juniper-junos group task with an approximate floor', () => {
    expect(task.definition.slug).toBe('junos-static-routes');
    expect(vendorOf(task.definition)).toBe('juniper-junos');
    expect(task.definition.fidelityFloor).toBe('approximate');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
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
    it('emits the routes sequence with per-row omit-on-blank', () => {
      expect(yaml(full)).toBe(
        [
          'routes:',
          '  - destination: 10.0.0.0/24',
          '    action: next-hop',
          '    next_hop: 192.168.1.1',
          '  - destination: 0.0.0.0/0',
          '    action: next-hop',
          '    next_hop: 192.168.1.254',
          '    metric: 5',
          '  - destination: 10.99.0.0/16',
          '    action: discard',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-config preview (set form)', () => {
    it('renders one set line per route; next-hop/discard and optional metric', () => {
      const out = cli(full);
      expect(out.text).toBe(
        [
          'set routing-options static route 10.0.0.0/24 next-hop 192.168.1.1',
          'set routing-options static route 0.0.0.0/0 next-hop 192.168.1.254 metric 5',
          'set routing-options static route 10.99.0.0/16 discard',
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

  it('requires at least one route', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.routes?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });

  it('is juniper-junos only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
