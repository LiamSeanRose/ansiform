import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { templateForVendor, vendorTemplateApproximate } from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm, secretFieldNames } from '../../components/form';
import type { Field, FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

/** Collect every i18n key referenced by a field set, recursing into list rows. */
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
  name: 'MGMT-IN',
  entries: [
    {
      action: 'permit',
      protocol: 'tcp',
      source: '10.0.0.0 0.0.0.255',
      destination: 'any',
      port: 22,
      remark: 'Allow SSH',
    },
    { action: 'deny', protocol: 'ip', source: 'any', destination: 'host 10.0.0.5' },
  ],
};

describe('acl task (multi-entry)', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('acl');
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
    it('emits the ACL name and an entries sequence with per-row omit-on-blank', () => {
      expect(yaml(full)).toBe(
        [
          'name: MGMT-IN',
          'entries:',
          '  - action: permit',
          '    protocol: tcp',
          '    source: 10.0.0.0 0.0.0.255',
          '    destination: any',
          '    port: 22',
          '    remark: Allow SSH',
          '  - action: deny',
          '    protocol: ip',
          '    source: any',
          '    destination: host 10.0.0.5',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders each entry; remark + tcp port appear, ip entry has no eq', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'ip access-list extended MGMT-IN',
          ' remark Allow SSH',
          ' permit tcp 10.0.0.0 0.0.0.255 any eq 22',
          ' deny ip any host 10.0.0.5',
          '',
        ].join('\n'),
      );
    });
  });

  it('requires a name and at least one valid entry', () => {
    const init = initialValues(schema);
    const errors = validateForm(schema, init);
    expect(errors.name?.code).toBe('required');
    // one seeded row missing required source/destination → incomplete
    expect(errors.entries?.code).toBe('incomplete');
    // a fully-valid form clears
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });

  // #34: NX-OS and EOS named-ACL CLI verified exact and locked.
  describe('per-vendor preview (#34)', () => {
    const def = task.definition;
    const expected = [
      'ip access-list MGMT-IN',
      ' remark Allow SSH',
      ' permit tcp 10.0.0.0 0.0.0.255 any eq 22',
      ' deny ip any host 10.0.0.5',
      '',
    ].join('\n');

    for (const vendor of ['cisco-nxos', 'arista-eos'] as const) {
      it(`${vendor} is exact and drops the IOS "extended" keyword`, () => {
        expect(vendorTemplateApproximate(def, vendor)).toBe(false);
        const out = renderPreview(templateForVendor(def, vendor), full, registry);
        expect(out.fidelity).toBe('exact');
        expect(out.text).toBe(expected);
      });
    }
  });
});
