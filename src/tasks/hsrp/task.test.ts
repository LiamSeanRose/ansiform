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
  interface: 'Vlan10',
  groups: [
    { group_id: 10, vip: '10.0.10.1', priority: 110, preempt: true },
    { group_id: 20, vip: '10.0.20.1', preempt: false },
  ],
};

describe('hsrp task', () => {
  it('registers under the expected slug and host scope', () => {
    expect(task.definition.slug).toBe('hsrp');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'dist1' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'host_vars/dist1.yml',
    );
  });

  it('every schema i18n key has English and French copy', () => {
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        keys.push(field.label);
        if (field.help) keys.push(field.help);
        if (field.type === 'list') {
          const lf = field as ListField;
          if (lf.addLabel) keys.push(lf.addLabel);
          if (lf.itemLabel) keys.push(lf.itemLabel);
          for (const sub of lf.fields) {
            keys.push(sub.label);
            if (sub.help) keys.push(sub.help);
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
    it('emits the interface and a sequence of standby groups (per-row omit-on-blank)', () => {
      expect(yaml(full)).toBe(
        [
          'interface: Vlan10',
          'groups:',
          '  - group_id: 10',
          '    vip: 10.0.10.1',
          '    priority: 110',
          '    preempt: true',
          '  - group_id: 20',
          '    vip: 10.0.20.1',
          '    preempt: false',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders standby lines under the interface at exact fidelity', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'interface Vlan10',
          ' standby 10 ip 10.0.10.1',
          ' standby 10 priority 110',
          ' standby 10 preempt',
          ' standby 20 ip 10.0.20.1',
          '',
        ].join('\n'),
      );
    });
  });

  describe('defaults & validation', () => {
    it('seeds one group row with preempt defaulting off', () => {
      const rows = initialValues(schema).groups as Array<Record<string, unknown>>;
      expect(rows).toHaveLength(1);
      expect(rows[0].preempt).toBe(false);
    });

    it('flags a group row missing the required virtual IP as incomplete', () => {
      expect(validateForm(schema, { interface: 'Vlan10', groups: [{ group_id: 10, preempt: false }] }).groups?.code).toBe(
        'incomplete',
      );
    });
  });
});
