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
  new_model: true,
  servers: [
    { name: 'TAC1', address: '192.0.2.20', key: 'sEcret-key' },
    { name: 'TAC2', address: '192.0.2.21' },
  ],
};

describe('aaa-servers task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('aaa-servers');
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
          }
        }
      }
    }
    for (const key of keys) {
      expect(task.messages.en[key], `missing EN copy for ${key}`).toBeTruthy();
      expect(task.messages.fr?.[key], `missing FR copy for ${key}`).toBeTruthy();
    }
  });

  describe('secrets (§5)', () => {
    it('declares the per-server key as a secret and never seeds or leaks it', () => {
      const serversField = schema.groups[0].fields.find((f) => f.name === 'servers') as ListField;
      const secretSub = serversField.fields.find((f) => f.type === 'secret')!;
      expect(secretSub.name).toBe('key');
      expect('default' in secretSub).toBe(false);
      const seeded = initialValues(schema).servers as Array<Record<string, unknown>>;
      expect('key' in seeded[0]).toBe(false);
      yaml(full);
      cli(full);
      expect(JSON.stringify(task)).not.toContain('sEcret-key');
    });
  });

  describe('YAML output (always correct)', () => {
    it('emits a sequence of server mappings, omitting a blank key', () => {
      expect(yaml(full)).toBe(
        [
          'new_model: true',
          'servers:',
          '  - name: TAC1',
          '    address: 192.0.2.20',
          '    key: sEcret-key',
          '  - name: TAC2',
          '    address: 192.0.2.21',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders a tacacs server block per row, key line only when set', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'aaa new-model',
          'tacacs server TAC1',
          ' address ipv4 192.0.2.20',
          ' key sEcret-key',
          'tacacs server TAC2',
          ' address ipv4 192.0.2.21',
          '',
        ].join('\n'),
      );
    });

    it('drops aaa new-model when disabled', () => {
      const out = cli({ ...full, new_model: false });
      expect(out.text.startsWith('tacacs server TAC1')).toBe(true);
    });
  });

  describe('validation', () => {
    it('flags a server row missing its required address as incomplete', () => {
      expect(validateForm(schema, { ...initialValues(schema), servers: [{ name: 'TAC1' }] }).servers?.code).toBe(
        'incomplete',
      );
    });
  });

  // #34: verified-exact promotions, each locked so a regression re-degrades in CI.
  describe('per-vendor preview (#34)', () => {
    const def = task.definition;

    it('NX-OS is exact and renders one tacacs-server host line per server', () => {
      expect(vendorTemplateApproximate(def, 'cisco-nxos')).toBe(false);
      const out = renderPreview(templateForVendor(def, 'cisco-nxos'), full, registry);
      expect(out.fidelity).toBe('exact');
      expect(out.text).toBe(
        [
          'feature tacacs+',
          'tacacs-server host 192.0.2.20 key sEcret-key',
          'tacacs-server host 192.0.2.21',
          '',
        ].join('\n'),
      );
    });

    it('EOS is exact and omits aaa new-model (AAA always on)', () => {
      expect(vendorTemplateApproximate(def, 'arista-eos')).toBe(false);
      const out = renderPreview(templateForVendor(def, 'arista-eos'), full, registry);
      expect(out.fidelity).toBe('exact');
      expect(out.text).toBe(
        ['tacacs-server host 192.0.2.20 key sEcret-key', 'tacacs-server host 192.0.2.21', ''].join('\n'),
      );
    });
  });
});
