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
  }
  return keys;
}

const full: FormValues = {
  peer_ip: '203.0.113.2',
  psk: 'Sup3rSecretPSK',
  local_network: '10.0.0.0 255.255.255.0',
  remote_network: '172.16.0.0 255.255.255.0',
  encryption: 'aes-256',
  dh_group: '14',
  outside_interface: 'outside',
  crypto_map: 'OUTSIDE_MAP',
  map_seq: 10,
  acl_name: 'VPN-ACL',
};

describe('asa-vpn task (IKEv2 site-to-site)', () => {
  it('registers as a cisco-asa host task under the expected slug', () => {
    expect(task.definition.slug).toBe('asa-vpn');
    expect(vendorOf(task.definition)).toBe('cisco-asa');
    expect(task.definition.defaultScope).toEqual({ kind: 'host', name: 'firewall1' });
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

  describe('secrets (§5)', () => {
    it('declares the PSK as a secret, never seeded or embedded', () => {
      expect(secretFieldNames(schema).has('psk')).toBe(true);
      const psk = schema.groups[0].fields.find((f) => f.name === 'psk')!;
      expect(psk.type).toBe('secret');
      expect('default' in psk).toBe(false);
      expect('psk' in initialValues(schema)).toBe(false);
      yaml(full);
      cli(full);
      expect(JSON.stringify(task)).not.toContain('Sup3rSecretPSK');
    });
  });

  describe('device-CLI preview (exact, no filters)', () => {
    it('renders a complete IKEv2 LAN-to-LAN tunnel', () => {
      const out = cli(full);
      expect(out.fidelity).toBe('exact');
      expect(out.filters).toEqual([]);
      expect(out.text).toBe(
        [
          'crypto ikev2 policy 1',
          ' encryption aes-256',
          ' integrity sha256',
          ' group 14',
          ' prf sha256',
          ' lifetime seconds 86400',
          'crypto ikev2 enable outside',
          'crypto ipsec ikev2 ipsec-proposal IKEV2-PROPOSAL',
          ' protocol esp encryption aes-256',
          ' protocol esp integrity sha-256',
          'access-list VPN-ACL extended permit ip 10.0.0.0 255.255.255.0 172.16.0.0 255.255.255.0',
          'tunnel-group 203.0.113.2 type ipsec-l2l',
          'tunnel-group 203.0.113.2 ipsec-attributes',
          ' ikev2 remote-authentication pre-shared-key Sup3rSecretPSK',
          ' ikev2 local-authentication pre-shared-key Sup3rSecretPSK',
          'crypto map OUTSIDE_MAP 10 match address VPN-ACL',
          'crypto map OUTSIDE_MAP 10 set peer 203.0.113.2',
          'crypto map OUTSIDE_MAP 10 set ikev2 ipsec-proposal IKEV2-PROPOSAL',
          'crypto map OUTSIDE_MAP interface outside',
        ].join('\n'),
      );
    });
  });

  it('requires peer, PSK, and both protected networks', () => {
    const errors = validateForm(schema, initialValues(schema));
    expect(errors.peer_ip?.code).toBe('required');
    expect(errors.psk?.code).toBe('required');
    expect(errors.local_network?.code).toBe('required');
    expect(errors.remote_network?.code).toBe('required');
    expect(Object.keys(validateForm(schema, full))).toEqual([]);
  });

  it('is cisco-asa only — no per-vendor overlay', () => {
    expect(task.definition.templates).toBeUndefined();
  });
});
