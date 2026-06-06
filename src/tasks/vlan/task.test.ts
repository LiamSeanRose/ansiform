import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

describe('vlan task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('vlan');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'switches' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'group_vars/switches.yml',
    );
  });

  it('every schema i18n key (incl. select options) has English copy', () => {
    const en = task.messages.en;
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        keys.push(field.label);
        if (field.help) keys.push(field.help);
        if (field.type === 'select') for (const opt of field.options) keys.push(opt.label);
      }
    }
    for (const key of keys) expect(en[key], `missing copy for ${key}`).toBeTruthy();
  });

  describe('YAML output (always correct)', () => {
    it('emits every field with correct types when fully filled', () => {
      const values: FormValues = { vlan_id: 10, name: 'SALES', state: 'active' };
      expect(yaml(values)).toBe(['vlan_id: 10', 'name: SALES', 'state: active', ''].join('\n'));
    });

    it('omits the blank optional name — default(omit)', () => {
      const values: FormValues = { vlan_id: 20, name: '', state: 'suspend' };
      expect(yaml(values)).toBe(['vlan_id: 20', 'state: suspend', ''].join('\n'));
    });
  });

  describe('device-CLI preview (exact)', () => {
    it('renders an active VLAN without a state line, at exact fidelity', () => {
      const out = cli({ vlan_id: 10, name: 'SALES', state: 'active' });
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(['vlan 10', ' name SALES', ''].join('\n'));
    });

    it('emits a state line only when suspended', () => {
      const out = cli({ vlan_id: 10, name: 'SALES', state: 'suspend' });
      expect(out.text).toBe(['vlan 10', ' name SALES', ' state suspend', ''].join('\n'));
    });

    it('drops the name line when no name is given', () => {
      const out = cli({ vlan_id: 20, state: 'active' });
      expect(out.text).toBe(['vlan 20', ''].join('\n'));
    });
  });

  describe('validation', () => {
    it('initial values leave only vlan_id required (state defaults to active)', () => {
      const init = initialValues(schema);
      expect(init.state).toBe('active');
      expect(Object.keys(validateForm(schema, init))).toEqual(['vlan_id']);
    });

    it('rejects a VLAN name containing whitespace', () => {
      const errors = validateForm(schema, { vlan_id: 10, name: 'has space' });
      expect(errors.name?.code).toBe('pattern');
    });
  });
});
