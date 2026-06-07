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
  local_as: 65001,
  group_name: 'EXTERNAL-PEERS',
  type: 'external',
  peer_as: 65002,
  neighbors: [{ peer: '203.0.113.1' }, { peer: '203.0.113.5' }],
  local_address: '203.0.113.2',
  export_policy: 'ADVERTISE-DEFAULT',
};

describe('junos-bgp task (native Junos BGP group)', () => {
  it('registers as a juniper-junos group task with an approximate floor', () => {
    expect(task.definition.slug).toBe('junos-bgp');
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
    it('emits the group settings and a neighbours sequence', () => {
      expect(yaml(full)).toBe(
        [
          'local_as: 65001',
          'group_name: EXTERNAL-PEERS',
          'type: external',
          'peer_as: 65002',
          'neighbors:',
          '  - peer: 203.0.113.1',
          '  - peer: 203.0.113.5',
          'local_address: 203.0.113.2',
          'export_policy: ADVERTISE-DEFAULT',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-config preview (set form)', () => {
    it('renders the AS, group, and one neighbour line per peer', () => {
      const out = cli(full);
      expect(out.text).toBe(
        [
          'set routing-options autonomous-system 65001',
          'set protocols bgp group EXTERNAL-PEERS type external',
          'set protocols bgp group EXTERNAL-PEERS peer-as 65002',
          'set protocols bgp group EXTERNAL-PEERS local-address 203.0.113.2',
          'set protocols bgp group EXTERNAL-PEERS export ADVERTISE-DEFAULT',
          'set protocols bgp group EXTERNAL-PEERS neighbor 203.0.113.1',
          'set protocols bgp group EXTERNAL-PEERS neighbor 203.0.113.5',
          '',
        ].join('\n'),
      );
    });

    it('omits local-address and export when blank', () => {
      const out = cli({
        local_as: 65001,
        group_name: 'IBGP',
        type: 'internal',
        peer_as: 65001,
        neighbors: [{ peer: '10.0.0.1' }],
      });
      expect(out.text).toBe(
        [
          'set routing-options autonomous-system 65001',
          'set protocols bgp group IBGP type internal',
          'set protocols bgp group IBGP peer-as 65001',
          'set protocols bgp group IBGP neighbor 10.0.0.1',
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

  it('requires the AS numbers, group name, and at least one neighbour', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.local_as?.code).toBe('required');
    expect(errors.group_name?.code).toBe('required');
    expect(errors.peer_as?.code).toBe('required');
    expect(errors.neighbors?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });

  it('is juniper-junos only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
