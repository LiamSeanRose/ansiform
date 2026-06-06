import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues, ListField } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

const full: FormValues = {
  ranges: [
    { range: 'GigabitEthernet1/0/1 - 12', description: 'Access ports', mode: 'access', access_vlan: 10, enabled: true },
    { range: 'GigabitEthernet1/0/24', mode: 'trunk', enabled: false },
  ],
};

describe('interface-ranges task', () => {
  it('registers under the expected slug and host scope', () => {
    expect(task.definition.slug).toBe('interface-ranges');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'switch1' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'host_vars/switch1.yml',
    );
  });

  it('every schema i18n key has English and French copy', () => {
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        keys.push(field.label);
        if (field.help) keys.push(field.help);
        if (field.type === 'select') for (const o of field.options) keys.push(o.label);
        if (field.type === 'list') {
          const lf = field as ListField;
          if (lf.addLabel) keys.push(lf.addLabel);
          if (lf.itemLabel) keys.push(lf.itemLabel);
          for (const sub of lf.fields) {
            keys.push(sub.label);
            if (sub.help) keys.push(sub.help);
            if (sub.type === 'select') for (const o of sub.options) keys.push(o.label);
          }
        }
      }
    }
    for (const key of keys) {
      expect(task.messages.en[key], `missing EN copy for ${key}`).toBeTruthy();
      expect(task.messages.fr?.[key], `missing FR copy for ${key}`).toBeTruthy();
    }
  });

  describe('YAML output (always correct)', () => {
    it('emits a sequence of range mappings with per-row omit-on-blank', () => {
      expect(yaml(full)).toBe(
        [
          'ranges:',
          "  - range: GigabitEthernet1/0/1 - 12",
          '    description: Access ports',
          '    mode: access',
          '    access_vlan: 10',
          '    enabled: true',
          '  - range: GigabitEthernet1/0/24',
          '    mode: trunk',
          '    enabled: false',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders one interface-range block per row at exact fidelity', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'interface range GigabitEthernet1/0/1 - 12',
          ' description Access ports',
          ' switchport mode access',
          ' switchport access vlan 10',
          ' no shutdown',
          'interface range GigabitEthernet1/0/24',
          ' switchport mode trunk',
          ' shutdown',
          '',
        ].join('\n'),
      );
    });
  });

  describe('defaults & validation', () => {
    it('seeds one row with mode and enabled defaults', () => {
      const rows = initialValues(schema).ranges as Array<Record<string, unknown>>;
      expect(rows).toHaveLength(1);
      expect(rows[0].mode).toBe('access');
      expect(rows[0].enabled).toBe(true);
    });

    it('flags a row missing the required range as incomplete', () => {
      expect(validateForm(schema, { ranges: [{ mode: 'access', enabled: true }] }).ranges?.code).toBe(
        'incomplete',
      );
    });
  });
});
