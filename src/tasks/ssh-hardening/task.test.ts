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

// Every field set, including the optional inbound access-class.
const full: FormValues = {
  ssh_version: '2',
  ssh_timeout: 120,
  ssh_auth_retries: 3,
  vty_last: 4,
  exec_timeout_min: 5,
  exec_timeout_sec: 0,
  transport_input: 'ssh',
  login_local: true,
  access_class: 'MGMT-IN',
};

describe('ssh-hardening task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('ssh-hardening');
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
        if (field.type === 'select') for (const opt of field.options) keys.push(opt.label);
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
    // The static module holds schema + copy, never values. Rendering a sentinel
    // through both sinks must not mutate or leak into the serialized module.
    const sentinel = 'zzz-value-sentinel';
    yaml({ ...full, access_class: sentinel });
    cli({ ...full, access_class: sentinel });
    expect(JSON.stringify(task)).not.toContain(sentinel);
  });

  describe('YAML output (always correct)', () => {
    it('emits every field in schema order when fully filled', () => {
      expect(yaml(full)).toBe(
        [
          "ssh_version: '2'",
          'ssh_timeout: 120',
          'ssh_auth_retries: 3',
          'vty_last: 4',
          'exec_timeout_min: 5',
          'exec_timeout_sec: 0',
          'transport_input: ssh',
          'login_local: true',
          'access_class: MGMT-IN',
          '',
        ].join('\n'),
      );
    });

    it('omits the optional access-class but keeps the typed scalars from defaults', () => {
      expect(yaml(initialValues(schema))).toBe(
        [
          "ssh_version: '2'",
          'ssh_timeout: 120',
          'ssh_auth_retries: 3',
          'vty_last: 4',
          'exec_timeout_min: 5',
          'exec_timeout_sec: 0',
          'transport_input: ssh',
          'login_local: true',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders every line at exact fidelity', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'ip ssh version 2',
          'ip ssh time-out 120',
          'ip ssh authentication-retries 3',
          'line vty 0 4',
          ' exec-timeout 5 0',
          ' transport input ssh',
          ' login local',
          ' access-class MGMT-IN in',
          '',
        ].join('\n'),
      );
    });

    it('drops the login line when local login is off and no access-class is set', () => {
      const out = cli({ ...initialValues(schema), login_local: false });
      expect(out.text).toBe(
        [
          'ip ssh version 2',
          'ip ssh time-out 120',
          'ip ssh authentication-retries 3',
          'line vty 0 4',
          ' exec-timeout 5 0',
          ' transport input ssh',
          '',
        ].join('\n'),
      );
    });

    it('renders the inbound access-class only when provided', () => {
      const out = cli({ ...initialValues(schema), access_class: 'MGMT-IN' });
      expect(out.text).toContain(' access-class MGMT-IN in');
      expect(cli(initialValues(schema)).text).not.toContain('access-class');
    });
  });

  describe('validation', () => {
    it('the default form is valid', () => {
      expect(validateForm(schema, initialValues(schema))).toEqual({});
    });

    it('flags an out-of-range exec-timeout seconds value', () => {
      expect(validateForm(schema, { ...initialValues(schema), exec_timeout_sec: 60 }).exec_timeout_sec?.code).toBe(
        'max',
      );
    });

    it('flags a VTY line number above 15', () => {
      expect(validateForm(schema, { ...initialValues(schema), vty_last: 16 }).vty_last?.code).toBe(
        'max',
      );
    });
  });
});
