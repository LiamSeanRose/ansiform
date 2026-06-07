import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { templateForVendor, vendorTemplateApproximate } from '../../core/tasks/vendor';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm } from '../../components/form';
import type { FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

const full: FormValues = {
  motd: 'Authorized access only',
  login: 'Restricted to authorized users',
  exec: 'Privileged mode',
};

describe('banners task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('banners');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'group_vars/all.yml',
    );
  });

  it('every schema i18n key has English and French copy', () => {
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        keys.push(field.label);
        if (field.help) keys.push(field.help);
      }
    }
    for (const key of keys) {
      expect(task.messages.en[key], `missing EN copy for ${key}`).toBeTruthy();
      expect(task.messages.fr?.[key], `missing FR copy for ${key}`).toBeTruthy();
    }
  });

  it('declares no secret fields and never absorbs a rendered value', () => {
    const secrets = schema.groups.flatMap((g) => g.fields).filter((f) => f.type === 'secret');
    expect(secrets).toEqual([]);
    const sentinel = 'zzz-value-sentinel';
    yaml({ motd: sentinel });
    cli({ motd: sentinel });
    expect(JSON.stringify(task)).not.toContain(sentinel);
  });

  describe('YAML output (always correct)', () => {
    it('emits every banner in schema order when fully filled', () => {
      expect(yaml(full)).toBe(
        [
          'motd: Authorized access only',
          'login: Restricted to authorized users',
          'exec: Privileged mode',
          '',
        ].join('\n'),
      );
    });

    it('omits every blank banner (all are optional)', () => {
      expect(yaml({ login: 'Restricted to authorized users' })).toBe(
        ['login: Restricted to authorized users', ''].join('\n'),
      );
      expect(yaml({})).toBe('{}\n');
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders each banner as a ^C-delimited block at exact fidelity', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'banner motd ^C',
          'Authorized access only',
          '^C',
          'banner login ^C',
          'Restricted to authorized users',
          '^C',
          'banner exec ^C',
          'Privileged mode',
          '^C',
          '',
        ].join('\n'),
      );
    });

    it('renders only the banners that are filled', () => {
      expect(cli({ login: 'Restricted to authorized users' }).text).toBe(
        ['banner login ^C', 'Restricted to authorized users', '^C', ''].join('\n'),
      );
    });

    it('renders nothing for an empty form', () => {
      expect(cli(initialValues(schema)).text).toBe('');
    });
  });

  describe('validation', () => {
    it('all banners optional — empty form is valid', () => {
      expect(validateForm(schema, initialValues(schema))).toEqual({});
    });
  });

  // #34: EOS promoted to verified-exact (EOF-terminated banners) and locked.
  describe('per-vendor preview (#34)', () => {
    const def = task.definition;

    it('EOS is exact, uses EOF terminators, and omits the exec banner', () => {
      expect(vendorTemplateApproximate(def, 'arista-eos')).toBe(false);
      const out = renderPreview(templateForVendor(def, 'arista-eos'), full, registry);
      expect(out.fidelity).toBe('exact');
      expect(out.text).toBe(
        [
          'banner motd',
          'Authorized access only',
          'EOF',
          'banner login',
          'Restricted to authorized users',
          'EOF',
          '',
        ].join('\n'),
      );
    });
  });
});
