import { describe, expect, it } from 'vitest';
import { ipaddr, ipaddrFilter } from './ipaddr';

describe('ipaddr (IPv4 subset)', () => {
  it('normalizes, preserving an explicit prefix', () => {
    expect(ipaddr('192.0.2.1/24')).toBe('192.0.2.1/24');
    expect(ipaddr('192.0.2.1')).toBe('192.0.2.1');
  });

  it('matches Ansible for the interface-config queries', () => {
    expect(ipaddr('192.0.2.1/24', 'address')).toBe('192.0.2.1');
    expect(ipaddr('192.0.2.1/24', 'netmask')).toBe('255.255.255.0');
    expect(ipaddr('192.0.2.1/24', 'network')).toBe('192.0.2.0');
    expect(ipaddr('192.0.2.1/24', 'prefix')).toBe(24);
    expect(ipaddr('192.0.2.1/24', 'broadcast')).toBe('192.0.2.255');
    expect(ipaddr('192.0.2.1/24', 'subnet')).toBe('192.0.2.0/24');
    expect(ipaddr('192.0.2.1/24', 'host')).toBe('192.0.2.1/24');
  });

  it('handles a /30 point-to-point link', () => {
    expect(ipaddr('10.0.0.5/30', 'netmask')).toBe('255.255.255.252');
    expect(ipaddr('10.0.0.5/30', 'network')).toBe('10.0.0.4');
    expect(ipaddr('10.0.0.5/30', 'broadcast')).toBe('10.0.0.7');
  });

  it('treats a bare address as /32', () => {
    expect(ipaddr('192.0.2.1', 'netmask')).toBe('255.255.255.255');
    expect(ipaddr('192.0.2.1', 'prefix')).toBe(32);
    expect(ipaddr('192.0.2.1', 'network')).toBe('192.0.2.1');
  });

  it('handles a /0 default route mask', () => {
    expect(ipaddr('0.0.0.0/0', 'netmask')).toBe('0.0.0.0');
    expect(ipaddr('203.0.113.9/0', 'network')).toBe('0.0.0.0');
  });

  it('returns false for invalid input, like Ansible', () => {
    expect(ipaddr('not-an-ip')).toBe(false);
    expect(ipaddr('256.0.0.1')).toBe(false);
    expect(ipaddr('192.0.2.1/33')).toBe(false);
    expect(ipaddr(42)).toBe(false);
  });

  it('maps over a list and drops non-matching entries', () => {
    expect(ipaddr(['192.0.2.1/24', 'garbage', '10.0.0.1/8'], 'address')).toEqual([
      '192.0.2.1',
      '10.0.0.1',
    ]);
  });

  it('throws on an unsupported query rather than guessing', () => {
    expect(() => ipaddr('192.0.2.1/24', '6to4')).toThrow();
  });

  it('is registered as exact', () => {
    expect(ipaddrFilter.name).toBe('ipaddr');
    expect(ipaddrFilter.fidelity).toBe('exact');
  });
});
