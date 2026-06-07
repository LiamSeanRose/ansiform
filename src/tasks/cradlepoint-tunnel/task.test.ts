import { describe, expect, it } from 'vitest';
import { task } from './index';
import { groupVarsYamlSink } from '../../core/output/yaml';
import { renderPreview, withFidelityFloor } from '../../core/preview';
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
  name: 'to-hq',
  type: 'ipsec',
  remote_gateway: '198.51.100.1',
  local_network: '192.168.0.0/24',
  remote_network: '10.0.0.0/24',
  psk: 'Sup3rSecretPSK',
};

describe('cradlepoint-tunnel task (IPsec / GRE)', () => {
  it('registers as a cradlepoint-ncos host task with an approximate floor', () => {
    expect(task.definition.slug).toBe('cradlepoint-tunnel');
    expect(vendorOf(task.definition)).toBe('cradlepoint-ncos');
    expect(task.definition.fidelityFloor).toBe('approximate');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'router1' });
  });

  it('every schema i18n key has EN and FR copy (incl. option keys)', () => {
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
    it('emits every field including the secret it vaults', () => {
      expect(yaml(full)).toBe(
        [
          'name: to-hq',
          'type: ipsec',
          'remote_gateway: 198.51.100.1',
          'local_network: 192.168.0.0/24',
          'remote_network: 10.0.0.0/24',
          'psk: Sup3rSecretPSK',
          '',
        ].join('\n'),
      );
    });
  });

  describe('device-config preview (set form)', () => {
    it('renders the IPsec tunnel with its pre-shared key', () => {
      const out = cli(full);
      expect(out.text).toBe(
        [
          'set vpn/tunnels/0/name to-hq',
          'set vpn/tunnels/0/type ipsec',
          'set vpn/tunnels/0/enabled true',
          'set vpn/tunnels/0/remote_gateway 198.51.100.1',
          'set vpn/tunnels/0/local_networks/0 192.168.0.0/24',
          'set vpn/tunnels/0/remote_networks/0 10.0.0.0/24',
          'set vpn/tunnels/0/auth/psk Sup3rSecretPSK',
          '',
        ].join('\n'),
      );
    });

    it('omits the pre-shared key for a GRE tunnel', () => {
      const out = cli({ ...full, type: 'gre' });
      expect(out.text).toBe(
        [
          'set vpn/tunnels/0/name to-hq',
          'set vpn/tunnels/0/type gre',
          'set vpn/tunnels/0/enabled true',
          'set vpn/tunnels/0/remote_gateway 198.51.100.1',
          'set vpn/tunnels/0/local_networks/0 192.168.0.0/24',
          'set vpn/tunnels/0/remote_networks/0 10.0.0.0/24',
          '',
        ].join('\n'),
      );
    });

    it('is exact when rendered, but the declared floor clamps it to approximate (#40)', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(withFidelityFloor(out, task.definition.fidelityFloor).fidelity).toBe('approximate');
    });
  });

  it('requires the name, gateway, and both networks', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.name?.code).toBe('required');
    expect(errors.remote_gateway?.code).toBe('required');
    expect(errors.local_network?.code).toBe('required');
    expect(errors.remote_network?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('treats the pre-shared key as a first-class secret', () => {
    const secrets = secretFieldNames(schema);
    expect(secrets.size).toBe(1);
    expect(secrets.has('psk')).toBe(true);
  });

  it('is cradlepoint-ncos only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
