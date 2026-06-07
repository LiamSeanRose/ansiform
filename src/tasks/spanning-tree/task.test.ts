import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import {
  vendorOf,
  taskVendors,
  templateForVendor,
  vendorTemplateApproximate,
} from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm, secretFieldNames } from '../../components/form';
import type { Field, FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const def = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues, tpl = template) => renderPreview(tpl, values, registry);

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
  mode: 'rapid-pvst',
  priorities: [
    { vlan_id: 10, priority: 4096 },
    { vlan_id: 20, priority: 8192 },
  ],
  portfast_default: true,
  bpduguard_default: true,
};

describe('spanning-tree task (multi-vendor)', () => {
  it('registers as a cisco-ios group task under the expected slug', () => {
    expect(def.slug).toBe('spanning-tree');
    expect(vendorOf(def)).toBe('cisco-ios');
    expect(def.defaultScope).toEqual({ kind: 'group', name: 'switches' });
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
    it('emits the mode, the priorities sequence, and the edge toggles', () => {
      expect(yaml(full)).toBe(
        [
          'mode: rapid-pvst',
          'priorities:',
          '  - vlan_id: 10',
          '    priority: 4096',
          '  - vlan_id: 20',
          '    priority: 8192',
          'portfast_default: true',
          'bpduguard_default: true',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview', () => {
    it('renders IOS mode, per-VLAN priorities, and edge defaults (exact)', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'spanning-tree mode rapid-pvst',
          'spanning-tree vlan 10 priority 4096',
          'spanning-tree vlan 20 priority 8192',
          'spanning-tree portfast default',
          'spanning-tree portfast bpduguard default',
          '',
        ].join('\n'),
      );
    });

    it('omits the edge-default lines when both toggles are off', () => {
      const out = cli({ mode: 'mst', priorities: [{ vlan_id: 1, priority: 0 }] });
      expect(out.text).toBe(
        ['spanning-tree mode mst', 'spanning-tree vlan 1 priority 0', ''].join('\n'),
      );
    });
  });

  describe('multi-vendor overlays (#27)', () => {
    it('offers IOS-XE (exact reuse) and NX-OS (approximate)', () => {
      expect(taskVendors(def)).toEqual(['cisco-ios', 'cisco-iosxe', 'cisco-nxos']);
      expect(templateForVendor(def, 'cisco-iosxe')).toBe(template);
      expect(vendorTemplateApproximate(def, 'cisco-iosxe')).toBe(false);
      expect(vendorTemplateApproximate(def, 'cisco-nxos')).toBe(true);
    });

    it('renders the NX-OS edge ports as `port type edge`', () => {
      const out = cli(full, templateForVendor(def, 'cisco-nxos'));
      expect(out.text).toContain('spanning-tree port type edge default');
      expect(out.text).toContain('spanning-tree port type edge bpduguard default');
      expect(out.text).not.toContain('portfast');
    });
  });

  it('requires at least one VLAN priority', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.priorities?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
