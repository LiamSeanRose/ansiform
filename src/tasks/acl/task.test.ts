import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, validateForm, redactSecrets, secretFieldNames } from '../../components/form';
import type { FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

const full: FormValues = {
  name: 'MGMT-IN',
  action: 'permit',
  protocol: 'tcp',
  source: '10.0.0.0 0.0.0.255',
  destination: 'any',
  port: 22,
  remark: 'Allow SSH from management',
};

describe('acl task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('acl');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'group_vars/all.yml',
    );
  });

  it('has a unique, non-placeholder page title', () => {
    expect(task.definition.title).toBe('Cisco IOS access list (ACL)');
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
      expect(yaml(full)).toBe(
        [
          'name: MGMT-IN',
          'action: permit',
          'protocol: tcp',
          'source: 10.0.0.0 0.0.0.255',
          'destination: any',
          'port: 22',
          'remark: Allow SSH from management',
          '',
        ].join('\n'),
      );
    });

    it('omits blank optional fields (port, remark) — default(omit)', () => {
      const values: FormValues = {
        name: 'BLOCK',
        action: 'deny',
        protocol: 'ip',
        source: 'any',
        destination: 'host 10.0.0.5',
        remark: '',
      };
      expect(yaml(values)).toBe(
        [
          'name: BLOCK',
          'action: deny',
          'protocol: ip',
          'source: any',
          'destination: host 10.0.0.5',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders a full TCP entry with remark and port at exact fidelity', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'ip access-list extended MGMT-IN',
          ' remark Allow SSH from management',
          ' permit tcp 10.0.0.0 0.0.0.255 any eq 22',
        ].join('\n'),
      );
    });

    it('drops the remark and never emits a port for an IP rule', () => {
      const out = cli({
        name: 'BLOCK',
        action: 'deny',
        protocol: 'ip',
        source: 'any',
        destination: 'host 10.0.0.5',
        port: 22, // present but must NOT render for protocol ip
      });
      expect(out.text).toBe(
        ['ip access-list extended BLOCK', ' deny ip any host 10.0.0.5'].join('\n'),
      );
    });
  });

  it('requires name, source, and destination; action/protocol default valid', () => {
    const init = initialValues(schema);
    expect(init.action).toBe('permit');
    expect(init.protocol).toBe('ip');
    const errors = validateForm(schema, init);
    expect(Object.keys(errors).sort()).toEqual(['destination', 'name', 'source']);
  });

  it('declares no secret fields, so no value can leak in a logged snapshot', () => {
    expect(secretFieldNames(schema).size).toBe(0);
    // A redacted snapshot is therefore identical to the full value model.
    expect(redactSecrets(schema, full)).toEqual(full);
  });
});
