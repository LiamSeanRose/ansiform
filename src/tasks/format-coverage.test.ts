import { describe, expect, it } from 'vitest';
import { getTaskModule } from './registry';
import type { Field, FormSchema, NetworkFormat, ScalarField } from '../core';

/** Find a scalar field by name anywhere in a schema (incl. list sub-fields). */
function findScalar(schema: FormSchema, name: string): ScalarField | undefined {
  const walk = (fields: readonly Field[]): ScalarField | undefined => {
    for (const f of fields) {
      if (f.type === 'list') {
        const hit = walk(f.fields);
        if (hit) return hit;
      } else if (f.name === name) {
        return f;
      }
    }
    return undefined;
  };
  for (const g of schema.groups) {
    const hit = walk(g.fields);
    if (hit) return hit;
  }
  return undefined;
}

function formatOf(slug: string, field: string): NetworkFormat | undefined {
  const mod = getTaskModule(slug);
  const f = mod && findScalar(mod.definition.schema, field);
  return f && f.type === 'text' ? f.format : undefined;
}

describe('network-format opt-in coverage (#91, follows #86)', () => {
  // A representative sample across vendors and both single + list-row fields.
  const cases: [slug: string, field: string, format: NetworkFormat][] = [
    ['interface-ip', 'ip_address', 'cidr'],
    ['interface-ip', 'interface', 'ifname'],
    ['static-routes', 'next_hop', 'ipv4'],
    ['ios-nat', 'local_ip', 'ipv4'],
    ['ios-nat', 'inside_interface', 'ifname'],
    ['junos-bgp', 'peer', 'ipv4'],
    ['junos-srx-policy', 'prefix', 'cidr'],
    ['cradlepoint-lan', 'ip_address', 'cidr'],
    ['cradlepoint-tunnel', 'remote_network', 'cidr'],
    ['nxos-vpc', 'peer_keepalive_dest', 'ipv4'],
    ['vyos-interface', 'ip_address', 'cidr'],
    ['vrrp', 'interface', 'ifname'],
    ['prefix-lists', 'prefix', 'cidr'],
    ['asa-interface', 'ip_address', 'cidr'],
  ];

  for (const [slug, field, format] of cases) {
    it(`${slug}.${field} is declared format=${format}`, () => {
      expect(formatOf(slug, field)).toBe(format);
    });
  }

  it('never assigns a format to a field that also has a blocking pattern (no double-messaging)', () => {
    // Patterned IP fields stay pattern-only by design.
    for (const [slug, field] of [
      ['bgp-neighbor', 'peer_ip'],
      ['device-basics', 'ntp_server'],
      ['ospf', 'router_id'],
      ['hsrp', 'vip'],
    ] as const) {
      const mod = getTaskModule(slug)!;
      const f = findScalar(mod.definition.schema, field);
      expect(f?.type).toBe('text');
      if (f && f.type === 'text' && f.format !== undefined) {
        expect(f.pattern, `${slug}.${field} should not have both pattern and format`).toBeUndefined();
      }
    }
  });
});
