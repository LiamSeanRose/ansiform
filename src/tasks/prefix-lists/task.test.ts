import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { templateForVendor, vendorTemplateApproximate } from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues, ListField } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

const full: FormValues = {
  name: 'MGMT-NETS',
  entries: [
    { seq: 5, action: 'permit', prefix: '10.0.0.0/8', ge: 24, le: 24 },
    { seq: 10, action: 'deny', prefix: '0.0.0.0/0' },
  ],
};

describe('prefix-lists task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('prefix-lists');
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
    it('emits the shared name and a sequence of entry mappings (per-row omit-on-blank)', () => {
      expect(yaml(full)).toBe(
        [
          'name: MGMT-NETS',
          'entries:',
          '  - seq: 5',
          '    action: permit',
          '    prefix: 10.0.0.0/8',
          '    ge: 24',
          '    le: 24',
          '  - seq: 10',
          '    action: deny',
          '    prefix: 0.0.0.0/0',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders one prefix-list line per entry, appending optional ge/le', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'ip prefix-list MGMT-NETS seq 5 permit 10.0.0.0/8 ge 24 le 24',
          'ip prefix-list MGMT-NETS seq 10 deny 0.0.0.0/0',
          '',
        ].join('\n'),
      );
    });
  });

  describe('defaults & validation', () => {
    it('seeds one entry row with the permit default', () => {
      const rows = initialValues(schema).entries as Array<Record<string, unknown>>;
      expect(rows).toHaveLength(1);
      expect(rows[0].action).toBe('permit');
    });

    it('flags an entry missing the required prefix as incomplete', () => {
      expect(validateForm(schema, { name: 'X', entries: [{ seq: 5, action: 'permit' }] }).entries?.code).toBe(
        'incomplete',
      );
    });
  });

  // #34: NX-OS and EOS prefix-list CLI verified exact and locked.
  describe('per-vendor preview (#34)', () => {
    const def = task.definition;
    const expected = [
      'ip prefix-list MGMT-NETS seq 5 permit 10.0.0.0/8 ge 24 le 24',
      'ip prefix-list MGMT-NETS seq 10 deny 0.0.0.0/0',
      '',
    ].join('\n');

    for (const vendor of ['cisco-nxos', 'arista-eos'] as const) {
      it(`${vendor} is exact and renders one prefix-list line per entry`, () => {
        expect(vendorTemplateApproximate(def, vendor)).toBe(false);
        const out = renderPreview(templateForVendor(def, vendor), full, registry);
        expect(out.fidelity).toBe('exact');
        expect(out.text).toBe(expected);
      });
    }

    // #73: Huawei VRP uses `ip ip-prefix … index … greater-equal/less-equal`,
    // splitting the CIDR into address + mask length; approximate.
    it('Huawei VRP is approximate and uses ip ip-prefix with split address/length', () => {
      expect(vendorTemplateApproximate(def, 'huawei-vrp')).toBe(true);
      const out = renderPreview(templateForVendor(def, 'huawei-vrp'), full, registry);
      expect(out.text).toBe(
        [
          'ip ip-prefix MGMT-NETS index 5 permit 10.0.0.0 8 greater-equal 24 less-equal 24',
          'ip ip-prefix MGMT-NETS index 10 deny 0.0.0.0 0',
          '',
        ].join('\n'),
      );
    });
  });
});
