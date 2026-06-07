import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
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

const full: FormValues = {
  access: [
    { protocol: 'ssh', network: '10.0.0.0', mask: '255.255.255.0', interface: 'inside' },
    { protocol: 'http', network: '10.0.0.0', mask: '255.255.255.0', interface: 'inside' },
  ],
  http_server: true,
  ssh_timeout: 10,
  aaa_group: 'LOCAL',
  username: 'admin',
  password: 'Sup3rSecret',
  privilege: 15,
};

describe('asa-management task (management access + AAA)', () => {
  it('registers as a cisco-asa group task under the expected slug', () => {
    expect(task.definition.slug).toBe('asa-management');
    expect(vendorOf(task.definition)).toBe('cisco-asa');
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
    it('emits the access sequence and management settings (incl. the secret it vaults)', () => {
      expect(yaml(full)).toBe(
        [
          'access:',
          '  - protocol: ssh',
          '    network: 10.0.0.0',
          '    mask: 255.255.255.0',
          '    interface: inside',
          '  - protocol: http',
          '    network: 10.0.0.0',
          '    mask: 255.255.255.0',
          '    interface: inside',
          'http_server: true',
          'ssh_timeout: 10',
          'aaa_group: LOCAL',
          'username: admin',
          'password: Sup3rSecret',
          'privilege: 15',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders access rules, ASDM/SSH settings, AAA, and the local user', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'ssh 10.0.0.0 255.255.255.0 inside',
          'http 10.0.0.0 255.255.255.0 inside',
          'http server enable',
          'ssh version 2',
          'ssh timeout 10',
          'aaa authentication ssh console LOCAL',
          'aaa authentication enable console LOCAL',
          'username admin password Sup3rSecret privilege 15',
          '',
        ].join('\n'),
      );
    });

    it('omits the ASDM/AAA/user lines when those fields are blank', () => {
      const out = cli({
        access: [{ protocol: 'ssh', network: '10.0.0.0', mask: '255.255.255.0', interface: 'inside' }],
        http_server: false,
        aaa_group: '',
      });
      expect(out.text).toBe(['ssh 10.0.0.0 255.255.255.0 inside', 'ssh version 2', ''].join('\n'));
    });
  });

  it('requires at least one management source', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.access?.code).toBe('incomplete');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('treats the local password as a first-class secret', () => {
    const secrets = secretFieldNames(schema);
    expect(secrets.size).toBe(1);
    expect(secrets.has('password')).toBe(true);
  });

  it('is cisco-asa only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
