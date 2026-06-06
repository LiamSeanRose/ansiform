import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview } from '../../core/preview';
import { createSeedRegistry } from '../../core/filters/seed';
import { initialValues, secretFieldNames } from '../../components/form';
import type { FormValues } from '../../core';

const { schema, template, defaultScope } = task.definition;
const registry = createSeedRegistry();

const yaml = (values: FormValues) =>
  groupVarsYamlSink.render({ schema, values, scope: defaultScope }).content;
const cli = (values: FormValues) => renderPreview(template, values, registry);

describe('device-hardening task', () => {
  it('registers under the expected slug and group scope', () => {
    expect(task.definition.slug).toBe('device-hardening');
    expect(task.definition.defaultScope).toEqual({ kind: 'group', name: 'all' });
    expect(groupVarsYamlSink.render({ schema, values: {}, scope: defaultScope }).filename).toBe(
      'group_vars/all.yml',
    );
  });

  it('every schema i18n key has EN and FR copy', () => {
    const keys: string[] = [];
    for (const group of schema.groups) {
      if (group.legend) keys.push(group.legend);
      for (const field of group.fields) {
        keys.push(field.label);
        if (field.help) keys.push(field.help);
      }
    }
    for (const key of keys) {
      expect(task.messages.en[key], `en ${key}`).toBeTruthy();
      expect(task.messages.fr?.[key], `fr ${key}`).toBeTruthy();
    }
  });

  it('makes no compliance / certification claim anywhere (binding guardrail)', () => {
    const corpus = [
      task.definition.title,
      task.definition.description,
      ...Object.values(task.messages.en),
      ...Object.values(task.messages.fr ?? {}),
    ].join(' ');
    expect(corpus).not.toMatch(/complian|certif|accredit|STIG|guarantee/i);
  });

  describe('YAML output (always correct)', () => {
    it('emits the default baseline; blank min-length is omitted', () => {
      expect(yaml(initialValues(schema))).toBe(
        [
          'service_password_encryption: true',
          'disable_http_server: true',
          'disable_source_route: true',
          'disable_cdp: false',
          'tcp_keepalives: true',
          'login_logging: true',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders every enabled toggle as its exact line', () => {
      const allOn: FormValues = {
        service_password_encryption: true,
        password_min_length: 8,
        disable_http_server: true,
        disable_source_route: true,
        disable_cdp: true,
        tcp_keepalives: true,
        login_logging: true,
      };
      const out = cli(allOn);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'service password-encryption',
          'security passwords min-length 8',
          'no ip http server',
          'no ip http secure-server',
          'no ip source-route',
          'no cdp run',
          'service tcp-keepalives-in',
          'service tcp-keepalives-out',
          'login on-failure log',
          'login on-success log',
          '',
        ].join('\n'),
      );
    });

    it('emits only the enabled toggles (disabled ones leave no gap)', () => {
      const out = cli({ service_password_encryption: true });
      expect(out.text).toBe('service password-encryption\n');
    });

    it('renders nothing when all toggles are off', () => {
      expect(cli({}).text).toBe('');
    });
  });

  it('declares no secret fields', () => {
    expect(secretFieldNames(schema).size).toBe(0);
  });
});
