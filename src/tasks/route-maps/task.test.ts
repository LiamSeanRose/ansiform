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
  name: 'SET-LOCALPREF',
  sequences: [
    { seq: 10, action: 'permit', match_prefix_list: 'MGMT-NETS', set_local_pref: 200 },
    { seq: 20, action: 'permit', set_metric: 100 },
    { seq: 30, action: 'deny' },
  ],
};

describe('route-maps task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('route-maps');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
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
    it('emits the shared name and a sequence of mappings (per-row omit-on-blank)', () => {
      expect(yaml(full)).toBe(
        [
          'name: SET-LOCALPREF',
          'sequences:',
          '  - seq: 10',
          '    action: permit',
          '    match_prefix_list: MGMT-NETS',
          '    set_local_pref: 200',
          '  - seq: 20',
          '    action: permit',
          '    set_metric: 100',
          '  - seq: 30',
          '    action: deny',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders a route-map header per sequence with only the set clauses present', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'route-map SET-LOCALPREF permit 10',
          ' match ip address prefix-list MGMT-NETS',
          ' set local-preference 200',
          'route-map SET-LOCALPREF permit 20',
          ' set metric 100',
          'route-map SET-LOCALPREF deny 30',
          '',
        ].join('\n'),
      );
    });
  });

  describe('defaults & validation', () => {
    it('seeds one sequence row with the permit default', () => {
      const rows = initialValues(schema).sequences as Array<Record<string, unknown>>;
      expect(rows).toHaveLength(1);
      expect(rows[0].action).toBe('permit');
    });

    it('flags a sequence missing the required seq number as incomplete', () => {
      expect(validateForm(schema, { name: 'X', sequences: [{ action: 'permit' }] }).sequences?.code).toBe(
        'incomplete',
      );
    });
  });
});
