import { describe, expect, it } from 'vitest';
import { validateNetworkFormat } from './network';
import type { NetworkFormat } from '../types';

const ok = (f: NetworkFormat, v: string) =>
  expect(validateNetworkFormat(f, v), `${f} "${v}" should be OK`).toBeUndefined();
const warn = (f: NetworkFormat, v: string, code: string) =>
  expect(validateNetworkFormat(f, v), `${f} "${v}" should warn ${code}`).toEqual({ code });

describe('validateNetworkFormat (#86)', () => {
  describe('never flags legitimate non-literals (across all formats)', () => {
    const formats: NetworkFormat[] = ['ipv4', 'cidr', 'ipv6', 'mac', 'vlan', 'asn', 'ifname'];
    for (const f of formats) {
      it(`${f}: blank, Jinja2 ref, and Vault ciphertext are OK`, () => {
        ok(f, '');
        ok(f, '   ');
        ok(f, '{{ some_var }}');
        ok(f, 'prefix-{{ idx }}');
        ok(f, '$ANSIBLE_VAULT;1.1;AES256\n6633...');
      });
    }
  });

  describe('ipv4', () => {
    it('accepts valid addresses', () => {
      ok('ipv4', '10.0.0.1');
      ok('ipv4', '255.255.255.255');
      ok('ipv4', '0.0.0.0');
    });
    it('flags malformed addresses', () => {
      warn('ipv4', '10.0.0.256', 'ipv4');
      warn('ipv4', '10.0.0', 'ipv4');
      warn('ipv4', '10.0.0.1.1', 'ipv4');
      warn('ipv4', '10.0.0.1/24', 'ipv4'); // a CIDR is not a bare address
      warn('ipv4', 'banana', 'ipv4');
    });
  });

  describe('cidr', () => {
    it('accepts /0–32, including /31 and /32 and host bits set', () => {
      ok('cidr', '10.0.0.0/24');
      ok('cidr', '10.0.0.1/31'); // point-to-point — must be valid
      ok('cidr', '10.0.0.1/32');
      ok('cidr', '0.0.0.0/0');
      ok('cidr', '192.168.1.5/24'); // host bits set (interface address) — legitimate
    });
    it('flags a bad prefix or address', () => {
      warn('cidr', '10.0.0.0/33', 'cidr');
      warn('cidr', '10.0.0.0', 'cidr'); // missing prefix
      warn('cidr', '10.0.0.256/24', 'cidr');
      warn('cidr', '10.0.0.0/', 'cidr');
    });
  });

  describe('ipv6', () => {
    it('accepts valid addresses (compressed, full, embedded v4, with prefix)', () => {
      ok('ipv6', '::1');
      ok('ipv6', '::');
      ok('ipv6', 'fe80::1');
      ok('ipv6', '2001:db8::1');
      ok('ipv6', '2001:0db8:0000:0000:0000:0000:0000:0001');
      ok('ipv6', '2001:db8::ffff:1.2.3.4');
      ok('ipv6', '2001:db8::/32');
      ok('ipv6', 'fe80::1/128');
    });
    it('flags malformed addresses and bad prefixes', () => {
      warn('ipv6', '2001:db8::1::2', 'ipv6'); // two '::'
      warn('ipv6', 'gggg::1', 'ipv6');
      warn('ipv6', '12345::1', 'ipv6'); // hextet too long
      warn('ipv6', '2001:db8:0:0:0:0:0:0:1', 'ipv6'); // 9 groups
      warn('ipv6', '2001:db8::/129', 'ipv6');
    });
  });

  describe('mac', () => {
    it('accepts colon, hyphen, Cisco-dotted, and bare forms', () => {
      ok('mac', '00:11:22:33:44:55');
      ok('mac', '00-11-22-33-44-55');
      ok('mac', '0011.2233.4455');
      ok('mac', 'aabbccddeeff');
      ok('mac', 'AA:BB:CC:DD:EE:FF');
    });
    it('flags malformed MACs', () => {
      warn('mac', '00:11:22:33:44', 'mac'); // too short
      warn('mac', '00:11:22:33:44:zz', 'mac');
      warn('mac', '0011.2233', 'mac');
    });
  });

  describe('vlan', () => {
    it('accepts 1–4094', () => {
      ok('vlan', '1');
      ok('vlan', '100');
      ok('vlan', '4094');
    });
    it('flags out-of-range and non-integer', () => {
      warn('vlan', '0', 'vlan');
      warn('vlan', '4095', 'vlan');
      warn('vlan', '9000', 'vlan');
      warn('vlan', '10.5', 'vlan');
      warn('vlan', 'ten', 'vlan');
    });
    it('notes IOS reserved 1002–1005 separately (still advisory)', () => {
      warn('vlan', '1002', 'vlanReserved');
      warn('vlan', '1005', 'vlanReserved');
      ok('vlan', '1001');
      ok('vlan', '1006');
    });
  });

  describe('asn', () => {
    it('accepts asplain across the 32-bit range', () => {
      ok('asn', '1');
      ok('asn', '65000');
      ok('asn', '65535');
      ok('asn', '4200000000'); // 4-byte
      ok('asn', '4294967295');
    });
    it('accepts asdot notation', () => {
      ok('asn', '1.0'); // = 65536
      ok('asn', '64512.0');
      ok('asn', '65535.65535');
    });
    it('flags out-of-range or malformed', () => {
      warn('asn', '0', 'asn');
      warn('asn', '4294967296', 'asn'); // > 2^32-1
      warn('asn', '1.65536', 'asn'); // low part overflow
      warn('asn', '65536.0', 'asn'); // high part overflow
      warn('asn', 'AS65000', 'asn');
      warn('asn', '0.0', 'asn'); // combined 0
    });
  });

  describe('ifname', () => {
    it('accepts the vendor-varied real names (permissive)', () => {
      ok('ifname', 'GigabitEthernet0/1');
      ok('ifname', 'Gi0/1');
      ok('ifname', 'Te1/1/1');
      ok('ifname', 'ge-0/0/0.0');
      ok('ifname', 'Port-channel1');
      ok('ifname', 'Vlan10');
      ok('ifname', 'Loopback0');
    });
    it('flags only the clearly-wrong (spaces, leading digit, exotic chars)', () => {
      warn('ifname', '0/1', 'ifname'); // must start with a letter
      warn('ifname', 'Gig 0/1', 'ifname'); // space
      warn('ifname', 'eth0!', 'ifname');
    });
  });
});
