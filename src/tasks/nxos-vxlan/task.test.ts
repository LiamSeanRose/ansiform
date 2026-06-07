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

const full: FormValues = { vlan_id: 10, vni: 10010, source_loopback: 'loopback0' };

describe('nxos-vxlan task (VXLAN/EVPN L2 VNI)', () => {
  it('registers as a cisco-nxos group task with an approximate floor', () => {
    expect(task.definition.slug).toBe('nxos-vxlan');
    expect(vendorOf(task.definition)).toBe('cisco-nxos');
    expect(task.definition.fidelityFloor).toBe('approximate');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'leaf-switches' });
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
    it('emits the VLAN, VNI, and source loopback', () => {
      expect(yaml(full)).toBe(
        ['vlan_id: 10', 'vni: 10010', 'source_loopback: loopback0', ''].join('\n'),
      );
    });
  });

  describe('device-CLI preview', () => {
    it('renders the VLAN→VNI mapping, NVE member, and EVPN instance', () => {
      const out = cli(full);
      expect(out.text).toBe(
        [
          'feature nv overlay',
          'feature vn-segment-vlan-based',
          'nv overlay evpn',
          'vlan 10',
          '  vn-segment 10010',
          'interface nve1',
          '  no shutdown',
          '  source-interface loopback0',
          '  member vni 10010',
          '    ingress-replication protocol bgp',
          'evpn',
          '  vni 10010 l2',
          '    rd auto',
          '    route-target import auto',
          '    route-target export auto',
        ].join('\n'),
      );
    });

    it('is exact when rendered, but the declared floor clamps it to approximate', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(withFidelityFloor(out, task.definition.fidelityFloor).fidelity).toBe('approximate');
    });
  });

  it('requires the VLAN, VNI, and source loopback', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.vlan_id?.code).toBe('required');
    expect(errors.vni?.code).toBe('required');
    expect(errors.source_loopback?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
