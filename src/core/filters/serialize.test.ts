import { describe, expect, it } from 'vitest';
import { toJson, toJsonFilter, toNiceYaml, toNiceYamlFilter } from './serialize';

describe('to_json', () => {
  it('produces structurally correct JSON', () => {
    const value = { name: 'core', vlans: [10, 20], enabled: true };
    expect(JSON.parse(toJson(value))).toEqual(value);
  });

  it('serializes nullish input as null', () => {
    expect(toJson(undefined)).toBe('null');
    expect(toJson(null)).toBe('null');
  });

  it('is registered as approximate (Python json.dumps spacing differs)', () => {
    expect(toJsonFilter.name).toBe('to_json');
    expect(toJsonFilter.fidelity).toBe('approximate');
  });
});

describe('to_nice_yaml', () => {
  it('renders block-style scalars and sequences with a trailing newline', () => {
    expect(toNiceYaml({ name: 'core', vlans: [10, 20] })).toBe(
      'name: core\nvlans:\n  - 10\n  - 20\n',
    );
  });

  it('renders nested maps', () => {
    expect(toNiceYaml({ snmp: { community: 'public', enabled: true } })).toBe(
      'snmp:\n  community: public\n  enabled: true\n',
    );
  });

  it('quotes values that would otherwise change type', () => {
    expect(toNiceYaml({ vlan: '10', flag: 'yes', addr: '192.0.2.1' })).toBe(
      'vlan: "10"\nflag: "yes"\naddr: "192.0.2.1"\n',
    );
  });

  it('renders empty collections inline', () => {
    expect(toNiceYaml({ acls: [], opts: {} })).toBe('acls: []\nopts: {}\n');
  });

  it('is registered as approximate', () => {
    expect(toNiceYamlFilter.name).toBe('to_nice_yaml');
    expect(toNiceYamlFilter.fidelity).toBe('approximate');
  });
});
